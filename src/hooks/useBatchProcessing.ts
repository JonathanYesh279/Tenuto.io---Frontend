/**
 * Batch Processing Hook
 * 
 * Handles large-scale batch operations with chunked processing,
 * progress tracking, and memory management for cascade deletions
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { DependentEntity, DeletionProgress } from '@/types/cascade-deletion.types'

interface BatchProcessingOptions {
  chunkSize?: number
  concurrency?: number
  delayBetweenChunks?: number
  maxRetries?: number
  onProgress?: (progress: BatchProgress) => void
  onChunkComplete?: (chunkIndex: number, results: any[]) => void
  onError?: (error: BatchError) => void
}

interface BatchProgress {
  totalItems: number
  processedItems: number
  completedChunks: number
  totalChunks: number
  percentage: number
  currentChunk: number
  estimatedTimeRemaining?: number
  errorCount: number
  successCount: number
  stage: 'preparing' | 'processing' | 'completed' | 'failed'
}

interface BatchError {
  chunkIndex: number
  itemIndex: number
  item: any
  error: Error
  retryCount: number
}

interface BatchResult<T> {
  success: T[]
  errors: BatchError[]
  summary: {
    totalProcessed: number
    successCount: number
    errorCount: number
    duration: number
  }
}

interface ProcessorFunction<T, R> {
  (item: T, index: number): Promise<R>
}

// Chunking utility functions
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Memory monitoring utilities
class MemoryMonitor {
  private readonly maxMemoryMB = 100 // 100MB limit
  private measurements: number[] = []

  checkMemoryUsage(): number {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      const usedMB = memInfo.usedJSHeapSize / (1024 * 1024)
      this.measurements.push(usedMB)
      
      // Keep only last 10 measurements
      if (this.measurements.length > 10) {
        this.measurements.shift()
      }
      
      return usedMB
    }
    return 0
  }

  isMemoryLimitReached(): boolean {
    const currentUsage = this.checkMemoryUsage()
    return currentUsage > this.maxMemoryMB
  }

  getAverageMemoryUsage(): number {
    if (this.measurements.length === 0) return 0
    return this.measurements.reduce((sum, val) => sum + val, 0) / this.measurements.length
  }

  forceGarbageCollection(): void {
    // Force garbage collection if available (Chrome DevTools)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }
  }
}

// Rate limiting utilities
class RateLimiter {
  private requests: number[] = []
  private maxRequestsPerSecond: number

  constructor(maxRequestsPerSecond = 10) {
    this.maxRequestsPerSecond = maxRequestsPerSecond
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now()
    
    // Remove requests older than 1 second
    this.requests = this.requests.filter(time => now - time < 1000)
    
    // If we're at the limit, wait
    if (this.requests.length >= this.maxRequestsPerSecond) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = 1000 - (now - oldestRequest) + 10 // Add small buffer
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    this.requests.push(Date.now())
  }
}

export function useBatchProcessing<T, R>() {
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<BatchResult<R> | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const memoryMonitorRef = useRef<MemoryMonitor>(new MemoryMonitor())
  const rateLimiterRef = useRef<RateLimiter>(new RateLimiter(5))
  const startTimeRef = useRef<number>(0)

  // Cancel current processing
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsProcessing(false)
  }, [])

  // Process items in batches
  const processBatch = useCallback(async <T, R>(
    items: T[],
    processor: ProcessorFunction<T, R>,
    options: BatchProcessingOptions = {}
  ): Promise<BatchResult<R>> => {
    const {
      chunkSize = 50,
      concurrency = 3,
      delayBetweenChunks = 100,
      maxRetries = 2,
      onProgress,
      onChunkComplete,
      onError
    } = options

    // Reset state
    setIsProcessing(true)
    setResults(null)
    abortControllerRef.current = new AbortController()
    startTimeRef.current = Date.now()

    const chunks = chunkArray(items, chunkSize)
    const successResults: R[] = []
    const errors: BatchError[] = []
    let processedItems = 0

    try {
      const initialProgress: BatchProgress = {
        totalItems: items.length,
        processedItems: 0,
        completedChunks: 0,
        totalChunks: chunks.length,
        percentage: 0,
        currentChunk: 0,
        errorCount: 0,
        successCount: 0,
        stage: 'preparing'
      }
      
      setProgress(initialProgress)
      onProgress?.(initialProgress)

      // Process chunks with controlled concurrency
      for (let i = 0; i < chunks.length; i += concurrency) {
        // Check if operation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Operation cancelled')
        }

        // Check memory usage
        const memoryMonitor = memoryMonitorRef.current
        if (memoryMonitor.isMemoryLimitReached()) {
          memoryMonitor.forceGarbageCollection()
          await new Promise(resolve => setTimeout(resolve, 500)) // Wait for GC
        }

        const concurrentChunks = chunks.slice(i, i + concurrency)
        const chunkPromises = concurrentChunks.map(async (chunk, chunkIndex) => {
          const actualChunkIndex = i + chunkIndex
          const chunkResults: R[] = []
          const chunkErrors: BatchError[] = []

          for (let itemIndex = 0; itemIndex < chunk.length; itemIndex++) {
            if (abortControllerRef.current?.signal.aborted) {
              break
            }

            const item = chunk[itemIndex]
            const globalItemIndex = actualChunkIndex * chunkSize + itemIndex
            let retryCount = 0
            let success = false

            while (retryCount <= maxRetries && !success) {
              try {
                // Rate limiting
                await rateLimiterRef.current.waitForSlot()

                // Process item
                const result = await processor(item, globalItemIndex)
                chunkResults.push(result)
                success = true

                processedItems++
                
                // Update progress every 10 items
                if (processedItems % 10 === 0) {
                  const currentProgress: BatchProgress = {
                    totalItems: items.length,
                    processedItems,
                    completedChunks: Math.floor(i / concurrency),
                    totalChunks: chunks.length,
                    percentage: (processedItems / items.length) * 100,
                    currentChunk: actualChunkIndex,
                    errorCount: errors.length,
                    successCount: successResults.length + chunkResults.length,
                    stage: 'processing',
                    estimatedTimeRemaining: calculateTimeRemaining(
                      startTimeRef.current,
                      processedItems,
                      items.length
                    )
                  }
                  
                  setProgress(currentProgress)
                  onProgress?.(currentProgress)
                }

              } catch (error) {
                retryCount++
                const batchError: BatchError = {
                  chunkIndex: actualChunkIndex,
                  itemIndex,
                  item,
                  error: error instanceof Error ? error : new Error(String(error)),
                  retryCount
                }

                if (retryCount > maxRetries) {
                  chunkErrors.push(batchError)
                  onError?.(batchError)
                  processedItems++
                } else {
                  // Wait before retry
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
                }
              }
            }

            // Small delay to prevent overwhelming the system
            if (itemIndex % 5 === 0) {
              await new Promise(resolve => setTimeout(resolve, 10))
            }
          }

          return { chunkResults, chunkErrors, chunkIndex: actualChunkIndex }
        })

        // Wait for all concurrent chunks to complete
        const chunkResults = await Promise.all(chunkPromises)

        // Collect results
        chunkResults.forEach(({ chunkResults: results, chunkErrors, chunkIndex }) => {
          successResults.push(...results)
          errors.push(...chunkErrors)
          onChunkComplete?.(chunkIndex, results)
        })

        // Delay between chunk batches
        if (i + concurrency < chunks.length && delayBetweenChunks > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenChunks))
        }
      }

      const duration = Date.now() - startTimeRef.current
      const finalResult: BatchResult<R> = {
        success: successResults,
        errors,
        summary: {
          totalProcessed: items.length,
          successCount: successResults.length,
          errorCount: errors.length,
          duration
        }
      }

      const finalProgress: BatchProgress = {
        totalItems: items.length,
        processedItems: items.length,
        completedChunks: chunks.length,
        totalChunks: chunks.length,
        percentage: 100,
        currentChunk: chunks.length - 1,
        errorCount: errors.length,
        successCount: successResults.length,
        stage: 'completed'
      }

      setProgress(finalProgress)
      onProgress?.(finalProgress)
      setResults(finalResult)

      return finalResult

    } catch (error) {
      const duration = Date.now() - startTimeRef.current
      const failedResult: BatchResult<R> = {
        success: successResults,
        errors,
        summary: {
          totalProcessed: processedItems,
          successCount: successResults.length,
          errorCount: errors.length,
          duration
        }
      }

      const errorProgress: BatchProgress = {
        totalItems: items.length,
        processedItems,
        completedChunks: Math.floor(processedItems / chunkSize),
        totalChunks: chunks.length,
        percentage: (processedItems / items.length) * 100,
        currentChunk: Math.floor(processedItems / chunkSize),
        errorCount: errors.length,
        successCount: successResults.length,
        stage: 'failed'
      }

      setProgress(errorProgress)
      onProgress?.(errorProgress)
      setResults(failedResult)

      throw error

    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  return {
    processBatch,
    cancel,
    progress,
    isProcessing,
    results,
    memoryUsage: memoryMonitorRef.current?.getAverageMemoryUsage() || 0
  }
}

// Specialized hook for cascade deletion batch processing
export function useCascadeDeletionBatch() {
  const batchProcessor = useBatchProcessing<DependentEntity, boolean>()

  const deleteBatch = useCallback(async (
    entities: DependentEntity[],
    onProgress?: (progress: BatchProgress) => void
  ) => {
    const deleteProcessor = async (entity: DependentEntity, index: number): Promise<boolean> => {
      // Simulate deletion API call
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
      
      // Simulate some failures
      if (Math.random() < 0.05) {
        throw new Error(`Failed to delete ${entity.name}: Database constraint violation`)
      }
      
      return true
    }

    return batchProcessor.processBatch(entities, deleteProcessor, {
      chunkSize: 25, // Smaller chunks for deletion operations
      concurrency: 2, // Lower concurrency to avoid overwhelming the database
      delayBetweenChunks: 200, // Longer delay between chunks
      maxRetries: 3,
      onProgress
    })
  }, [batchProcessor])

  return {
    ...batchProcessor,
    deleteBatch
  }
}

// Utility function to calculate estimated time remaining
function calculateTimeRemaining(
  startTime: number, 
  completed: number, 
  total: number
): number | undefined {
  if (completed === 0) return undefined
  
  const elapsed = Date.now() - startTime
  const rate = completed / elapsed // items per millisecond
  const remaining = total - completed
  
  return Math.round(remaining / rate)
}

// Memory cleanup utilities for large operations
export function useMemoryCleanup() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const memoryMonitor = useRef(new MemoryMonitor())

  const startMonitoring = useCallback((intervalMs = 5000) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      const monitor = memoryMonitor.current
      const memoryUsage = monitor.checkMemoryUsage()
      
      if (monitor.isMemoryLimitReached()) {
        console.warn(`High memory usage detected: ${memoryUsage.toFixed(2)}MB`)
        monitor.forceGarbageCollection()
      }
    }, intervalMs)
  }, [])

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const forceCleanup = useCallback(() => {
    memoryMonitor.current.forceGarbageCollection()
  }, [])

  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])

  return {
    startMonitoring,
    stopMonitoring,
    forceCleanup,
    getCurrentUsage: () => memoryMonitor.current.checkMemoryUsage(),
    getAverageUsage: () => memoryMonitor.current.getAverageMemoryUsage()
  }
}