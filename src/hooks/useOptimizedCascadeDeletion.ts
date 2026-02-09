/**
 * Optimized Cascade Deletion Hook
 * 
 * High-performance hook with debouncing, caching, Web Workers, and memory management
 * for handling large-scale cascade deletion operations in conservatory applications
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { 
  DeletionImpact, 
  DeletionOperation, 
  DeletionProgress,
  DependentEntity,
  CascadeDeletionError 
} from '@/types/cascade-deletion.types'
import { cascadeDeletionService } from '@/services/cascadeDeletionService'
import { getMemoryManager, MemoryStats } from '@/utils/memoryManager'
import { useBatchProcessing, useMemoryCleanup } from './useBatchProcessing'

interface CascadeDeletionOptions {
  enableWebWorker?: boolean
  enableCaching?: boolean
  debounceMs?: number
  maxConcurrentOperations?: number
  memoryLimitMB?: number
  onProgress?: (progress: DeletionProgress) => void
  onMemoryWarning?: (stats: MemoryStats) => void
}

interface WorkerMessage {
  id: string
  type: string
  payload: any
}

interface WorkerResponse {
  id: string
  type: 'SUCCESS' | 'ERROR' | 'PROGRESS'
  payload: any
}

// Debouncing utility
function useDebounce<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }, [delay])
}

// Request deduplication utility
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  cancel(key: string): void {
    this.pendingRequests.delete(key)
  }

  clear(): void {
    this.pendingRequests.clear()
  }
}

// Web Worker manager
class CascadeDeletionWorkerManager {
  private worker: Worker | null = null
  private pendingMessages = new Map<string, {
    resolve: (value: any) => void
    reject: (error: any) => void
    onProgress?: (data: any) => void
  }>()

  private messageIdCounter = 0

  async initializeWorker(): Promise<void> {
    if (this.worker) return

    try {
      // Create worker from the TypeScript file
      this.worker = new Worker(
        new URL('../workers/cascadeDeletionWorker.ts', import.meta.url),
        { type: 'module' }
      )

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, type, payload } = event.data
        const pending = this.pendingMessages.get(id)

        if (!pending) return

        switch (type) {
          case 'SUCCESS':
            pending.resolve(payload)
            this.pendingMessages.delete(id)
            break
          case 'ERROR':
            pending.reject(new Error(payload.error))
            this.pendingMessages.delete(id)
            break
          case 'PROGRESS':
            pending.onProgress?.(payload)
            break
        }
      }

      this.worker.onerror = (error) => {
        console.error('Worker error:', error)
        // Reject all pending messages
        this.pendingMessages.forEach(({ reject }) => {
          reject(new Error('Worker error'))
        })
        this.pendingMessages.clear()
      }

    } catch (error) {
      console.warn('Failed to initialize web worker, falling back to main thread')
      this.worker = null
    }
  }

  async calculateDependencies(
    entityType: string,
    entityId: string,
    options: { maxDepth: number; includeIndirect: boolean },
    onProgress?: (data: any) => void
  ): Promise<DependentEntity[]> {
    if (!this.worker) {
      throw new Error('Worker not initialized')
    }

    const id = `calc-deps-${++this.messageIdCounter}`
    const message: WorkerMessage = {
      id,
      type: 'CALCULATE_DEPENDENCIES',
      payload: {
        entityType,
        entityId,
        maxDepth: options.maxDepth,
        includeIndirect: options.includeIndirect,
        batchSize: 50
      }
    }

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject, onProgress })
      this.worker!.postMessage(message)
    })
  }

  async analyzeImpact(
    dependencies: DependentEntity[],
    onProgress?: (data: any) => void
  ): Promise<DeletionImpact> {
    if (!this.worker) {
      throw new Error('Worker not initialized')
    }

    const id = `analyze-${++this.messageIdCounter}`
    const message: WorkerMessage = {
      id,
      type: 'ANALYZE_IMPACT',
      payload: {
        dependencies,
        warningThresholds: {
          criticalCount: 100,
          highCount: 50,
          mediumCount: 20
        }
      }
    }

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject, onProgress })
      this.worker!.postMessage(message)
    })
  }

  cancelOperation(operationId: string): void {
    this.pendingMessages.delete(operationId)
    if (this.worker) {
      this.worker.postMessage({
        id: operationId,
        type: 'CANCEL',
        payload: {}
      })
    }
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingMessages.clear()
  }
}

// Main hook
export function useOptimizedCascadeDeletion(options: CascadeDeletionOptions = {}) {
  const {
    enableWebWorker = true,
    enableCaching = true,
    debounceMs = 300,
    maxConcurrentOperations = 3,
    memoryLimitMB = 100,
    onProgress,
    onMemoryWarning
  } = options

  // State management
  const [activeOperations, setActiveOperations] = useState<Map<string, DeletionOperation>>(new Map())
  const [operationProgress, setOperationProgress] = useState<Map<string, DeletionProgress>>(new Map())
  const [workerStatus, setWorkerStatus] = useState<'idle' | 'initializing' | 'ready' | 'error'>('idle')

  // Refs for utilities
  const queryClient = useQueryClient()
  const workerManagerRef = useRef<CascadeDeletionWorkerManager | null>(null)
  const deduplicatorRef = useRef(new RequestDeduplicator())
  const memoryManager = getMemoryManager()
  
  // Memory cleanup utilities
  const { startMonitoring, stopMonitoring, forceCleanup } = useMemoryCleanup()
  const { processBatch } = useBatchProcessing()

  // Initialize worker
  useEffect(() => {
    if (enableWebWorker && !workerManagerRef.current) {
      setWorkerStatus('initializing')
      workerManagerRef.current = new CascadeDeletionWorkerManager()
      
      workerManagerRef.current.initializeWorker()
        .then(() => setWorkerStatus('ready'))
        .catch(() => setWorkerStatus('error'))
    }
  }, [enableWebWorker])

  // Memory monitoring
  useEffect(() => {
    if (onMemoryWarning) {
      const removeListener = memoryManager.addMemoryListener((stats) => {
        if (stats.percentage > 0.8) {
          onMemoryWarning(stats)
        }
      })

      startMonitoring()
      return () => {
        removeListener()
        stopMonitoring()
      }
    }
  }, [onMemoryWarning, startMonitoring, stopMonitoring, memoryManager])

  // Debounced preview function
  const debouncedPreviewDeletion = useDebounce(
    useCallback(async (
      entityType: string,
      entityId: string,
      callback: (result: DeletionImpact | null, error: Error | null) => void
    ) => {
      try {
        const result = await previewDeletionInternal(entityType, entityId)
        callback(result, null)
      } catch (error) {
        callback(null, error instanceof Error ? error : new Error(String(error)))
      }
    }, []),
    debounceMs
  )

  // Internal preview function with worker support
  const previewDeletionInternal = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<DeletionImpact> => {
    const cacheKey = `preview-${entityType}-${entityId}`

    return deduplicatorRef.current.deduplicate(cacheKey, async () => {
      if (enableWebWorker && workerManagerRef.current && workerStatus === 'ready') {
        try {
          // Use Web Worker for heavy computation
          const dependencies = await workerManagerRef.current.calculateDependencies(
            entityType,
            entityId,
            { maxDepth: 5, includeIndirect: true },
            onProgress
          )

          const impact = await workerManagerRef.current.analyzeImpact(
            dependencies,
            onProgress
          )

          // Set the entity info that worker doesn't have
          impact.entityType = entityType
          impact.entityId = entityId

          return impact
        } catch (workerError) {
          console.warn('Worker failed, falling back to main thread:', workerError)
          // Fall through to main thread implementation
        }
      }

      // Fallback to service layer
      return cascadeDeletionService.previewDeletion(entityType, entityId, {
        includeIndirect: true,
        maxDepth: 5
      })
    })
  }, [enableWebWorker, workerStatus, onProgress])

  // Preview deletion with caching
  const previewDeletion = useCallback((
    entityType: string,
    entityId: string
  ) => {
    const queryKey = ['cascade-deletion-preview', entityType, entityId]
    
    return useQuery({
      queryKey,
      queryFn: () => previewDeletionInternal(entityType, entityId),
      enabled: !!entityType && !!entityId,
      staleTime: enableCaching ? 5 * 60 * 1000 : 0, // 5 minutes if caching enabled
      cacheTime: enableCaching ? 10 * 60 * 1000 : 0, // 10 minutes if caching enabled
      retry: (failureCount, error) => {
        // Don't retry for validation errors
        if (error instanceof CascadeDeletionError && 
            ['INVALID_ENTITY', 'NOT_FOUND'].includes(error.code || '')) {
          return false
        }
        return failureCount < 2
      }
    })
  }, [previewDeletionInternal, enableCaching])

  // Execute deletion with progress tracking
  const executeDeletion = useMutation({
    mutationFn: async ({
      operationId,
      options: execOptions
    }: {
      operationId: string
      options?: any
    }) => {
      // Check memory before starting
      const memoryStats = memoryManager.getMemoryStats()
      if (memoryStats && memoryStats.percentage > 0.9) {
        forceCleanup()
        throw new Error('Memory usage too high. Please try again.')
      }

      // Check concurrent operations limit
      if (activeOperations.size >= maxConcurrentOperations) {
        throw new Error(`Maximum concurrent operations (${maxConcurrentOperations}) reached`)
      }

      return cascadeDeletionService.executeDeletion(operationId, execOptions)
    },
    onMutate: async ({ operationId }) => {
      // Add to active operations
      const operation: DeletionOperation = {
        id: operationId,
        entityType: 'unknown',
        entityId: 'unknown',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        userId: 'current-user'
      }

      setActiveOperations(prev => new Map(prev.set(operationId, operation)))
    },
    onSuccess: (executionId, { operationId }) => {
      // Start progress tracking
      trackOperationProgress(executionId)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['cascade-deletion-preview'] 
      })
    },
    onError: (error, { operationId }) => {
      // Remove from active operations
      setActiveOperations(prev => {
        const next = new Map(prev)
        next.delete(operationId)
        return next
      })
      
      console.error('Deletion execution failed:', error)
    }
  })

  // Track operation progress
  const trackOperationProgress = useCallback(async (operationId: string) => {
    const pollProgress = async () => {
      try {
        const progress = await cascadeDeletionService.getProgress(operationId, false)
        if (progress) {
          setOperationProgress(prev => new Map(prev.set(operationId, progress)))
          onProgress?.(progress)

          // Continue polling if not complete
          if (progress.phase !== 'completed' && progress.phase !== 'failed') {
            setTimeout(pollProgress, 2000) // Poll every 2 seconds
          } else {
            // Remove from active operations when complete
            setActiveOperations(prev => {
              const next = new Map(prev)
              next.delete(operationId)
              return next
            })
          }
        }
      } catch (error) {
        console.error('Failed to get operation progress:', error)
        // Remove from tracking on error
        setOperationProgress(prev => {
          const next = new Map(prev)
          next.delete(operationId)
          return next
        })
      }
    }

    pollProgress()
  }, [onProgress])

  // Batch deletion
  const executeBatchDeletion = useCallback(async (
    entities: Array<{ entityType: string; entityId: string }>,
    onBatchProgress?: (progress: any) => void
  ) => {
    const deleteEntity = async (entity: { entityType: string; entityId: string }) => {
      const preview = await previewDeletionInternal(entity.entityType, entity.entityId)
      if (!preview.canDelete) {
        throw new Error(`Cannot delete ${entity.entityType}:${entity.entityId} - restrictions apply`)
      }
      
      // In real implementation, this would call the batch API
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call
      return { entityType: entity.entityType, entityId: entity.entityId, deleted: true }
    }

    return processBatch(entities, deleteEntity, {
      chunkSize: 20,
      concurrency: 2,
      delayBetweenChunks: 200,
      onProgress: onBatchProgress
    })
  }, [previewDeletionInternal, processBatch])

  // Cancel operation
  const cancelOperation = useCallback(async (operationId: string) => {
    try {
      // Cancel in worker if using web worker
      if (workerManagerRef.current) {
        workerManagerRef.current.cancelOperation(operationId)
      }

      // Cancel in service
      await cascadeDeletionService.cancelOperation(operationId)

      // Remove from local state
      setActiveOperations(prev => {
        const next = new Map(prev)
        next.delete(operationId)
        return next
      })

      setOperationProgress(prev => {
        const next = new Map(prev)
        next.delete(operationId)
        return next
      })
    } catch (error) {
      console.error('Failed to cancel operation:', error)
      throw error
    }
  }, [])

  // Get current memory statistics
  const getMemoryStats = useCallback(() => {
    return memoryManager.getMemoryStats()
  }, [memoryManager])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerManagerRef.current) {
        workerManagerRef.current.destroy()
      }
      deduplicatorRef.current.clear()
      stopMonitoring()
    }
  }, [stopMonitoring])

  // Memoized return value to prevent unnecessary re-renders
  return useMemo(() => ({
    // Preview operations
    previewDeletion,
    
    // Execution operations
    executeDeletion: executeDeletion.mutate,
    executeBatchDeletion,
    cancelOperation,
    
    // State
    activeOperations: Array.from(activeOperations.values()),
    operationProgress: Array.from(operationProgress.values()),
    isExecuting: executeDeletion.isPending,
    executionError: executeDeletion.error,
    
    // Performance monitoring
    workerStatus,
    getMemoryStats,
    forceMemoryCleanup: forceCleanup,
    
    // Utilities
    clearCache: () => {
      queryClient.invalidateQueries({ queryKey: ['cascade-deletion-preview'] })
      deduplicatorRef.current.clear()
    }
  }), [
    previewDeletion,
    executeDeletion,
    executeBatchDeletion,
    cancelOperation,
    activeOperations,
    operationProgress,
    workerStatus,
    getMemoryStats,
    forceCleanup,
    queryClient
  ])
}

export default useOptimizedCascadeDeletion