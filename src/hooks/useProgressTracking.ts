/**
 * Progress Tracking and Optimistic Updates System
 * 
 * Provides comprehensive progress tracking with real-time updates,
 * optimistic UI updates, and rollback capabilities for cascade deletion operations
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  DeletionProgress,
  DeletionOperation,
  ProcessedEntity,
  DeletionError,
  NotificationMessage,
} from '@/types/cascade-deletion.types'
import { useCascadeDeletionStore } from '@/stores/cascadeDeletionStore'
import { useOperationWebSocketUpdates } from '@/hooks/useWebSocketDeletion'
import { cascadeDeletionQueryKeys } from '@/hooks/useCascadeDeletion'
import { globalErrorHandler } from '@/utils/errorHandling'

// ==================== Progress Tracking Types ====================

export interface ProgressSnapshot {
  operationId: string
  timestamp: string
  progress: DeletionProgress
  estimatedCompletion?: string
}

export interface OptimisticUpdate {
  id: string
  operationId: string
  entityType: string
  entityId: string
  action: 'delete' | 'update' | 'nullify'
  timestamp: string
  originalData?: any
  optimisticData: any
  applied: boolean
  reverted: boolean
}

export interface ProgressTrackingState {
  snapshots: Map<string, ProgressSnapshot[]>
  optimisticUpdates: Map<string, OptimisticUpdate[]>
  rollbackStack: Map<string, OptimisticUpdate[]>
  activeTracking: Set<string>
  progressCallbacks: Map<string, Set<(progress: DeletionProgress) => void>>
}

// ==================== Progress Tracking Hook ====================

export function useProgressTracking(operationId: string | null) {
  const queryClient = useQueryClient()
  const store = useCascadeDeletionStore()
  const [trackingState, setTrackingState] = useState<ProgressTrackingState>({
    snapshots: new Map(),
    optimisticUpdates: new Map(),
    rollbackStack: new Map(),
    activeTracking: new Set(),
    progressCallbacks: new Map(),
  })

  // WebSocket integration for real-time updates
  useOperationWebSocketUpdates(operationId)

  const snapshotInterval = useRef<NodeJS.Timeout>()
  const progressCalculationCache = useRef<Map<string, {
    percentage: number
    estimatedCompletion: string
    timestamp: number
  }>>()

  // ==================== Progress Snapshot Management ====================

  const captureProgressSnapshot = useCallback((
    opId: string,
    progress: DeletionProgress
  ) => {
    const snapshot: ProgressSnapshot = {
      operationId: opId,
      timestamp: new Date().toISOString(),
      progress,
      estimatedCompletion: calculateEstimatedCompletion(progress),
    }

    setTrackingState(prev => {
      const newState = { ...prev }
      const snapshots = newState.snapshots.get(opId) || []
      
      // Keep only last 50 snapshots to prevent memory leaks
      const updatedSnapshots = [...snapshots, snapshot].slice(-50)
      newState.snapshots.set(opId, updatedSnapshots)
      
      return newState
    })

    // Trigger progress callbacks
    const callbacks = trackingState.progressCallbacks.get(opId)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(progress)
        } catch (error) {
          console.error('Progress callback error:', error)
        }
      })
    }
  }, [trackingState.progressCallbacks])

  const calculateEstimatedCompletion = useCallback((progress: DeletionProgress): string | undefined => {
    if (progress.percentage === 0 || !progress.startedAt) return undefined

    const startTime = new Date(progress.startedAt).getTime()
    const currentTime = Date.now()
    const elapsedMs = currentTime - startTime
    
    if (elapsedMs <= 0 || progress.percentage <= 0) return undefined

    // Calculate rate of progress
    const progressRate = progress.percentage / elapsedMs // percentage per ms
    const remainingPercentage = 100 - progress.percentage
    const estimatedRemainingMs = remainingPercentage / progressRate

    const estimatedCompletion = new Date(currentTime + estimatedRemainingMs)
    return estimatedCompletion.toISOString()
  }, [])

  // ==================== Optimistic Updates ====================

  const applyOptimisticUpdate = useCallback(async (
    opId: string,
    entityType: string,
    entityId: string,
    action: 'delete' | 'update' | 'nullify',
    optimisticData: any,
    queryKeys: string[][] = []
  ) => {
    const updateId = `${opId}_${entityType}_${entityId}_${Date.now()}`
    
    // Capture original data before applying update
    let originalData: any = undefined
    
    try {
      // Apply optimistic updates to relevant query caches
      for (const queryKey of queryKeys) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!originalData) {
            originalData = oldData // Capture original data from first query
          }
          
          return applyOptimisticDataChange(oldData, entityType, entityId, action, optimisticData)
        })
      }

      const optimisticUpdate: OptimisticUpdate = {
        id: updateId,
        operationId: opId,
        entityType,
        entityId,
        action,
        timestamp: new Date().toISOString(),
        originalData,
        optimisticData,
        applied: true,
        reverted: false,
      }

      // Store the optimistic update for potential rollback
      setTrackingState(prev => {
        const newState = { ...prev }
        const updates = newState.optimisticUpdates.get(opId) || []
        newState.optimisticUpdates.set(opId, [...updates, optimisticUpdate])
        return newState
      })

      // Add to rollback stack
      setTrackingState(prev => {
        const newState = { ...prev }
        const rollbackStack = newState.rollbackStack.get(opId) || []
        newState.rollbackStack.set(opId, [...rollbackStack, optimisticUpdate])
        return newState
      })

      return updateId
    } catch (error) {
      await globalErrorHandler.getErrorLogger().logError(error, {
        operationId: opId,
        entityType,
        entityId,
      })
      throw error
    }
  }, [queryClient])

  const applyOptimisticDataChange = (
    data: any,
    entityType: string,
    entityId: string,
    action: 'delete' | 'update' | 'nullify',
    optimisticData: any
  ): any => {
    if (!data) return data

    switch (action) {
      case 'delete':
        return removeEntityFromData(data, entityId)
      
      case 'update':
        return updateEntityInData(data, entityId, optimisticData)
      
      case 'nullify':
        return nullifyEntityReferences(data, entityType, entityId)
      
      default:
        return data
    }
  }

  const removeEntityFromData = (data: any, entityId: string): any => {
    // Handle array data
    if (Array.isArray(data)) {
      return data.filter(item => item.id !== entityId)
    }

    // Handle paginated data
    if (data?.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.filter((item: any) => item.id !== entityId),
        totalCount: Math.max(0, (data.totalCount || data.data.length) - 1),
      }
    }

    // Handle object data with nested arrays
    if (typeof data === 'object') {
      const newData = { ...data }
      
      Object.keys(newData).forEach(key => {
        if (Array.isArray(newData[key])) {
          newData[key] = newData[key].filter((item: any) => item?.id !== entityId)
        }
      })
      
      return newData
    }

    return data
  }

  const updateEntityInData = (data: any, entityId: string, updates: any): any => {
    // Handle array data
    if (Array.isArray(data)) {
      return data.map(item => 
        item.id === entityId ? { ...item, ...updates } : item
      )
    }

    // Handle paginated data
    if (data?.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map((item: any) => 
          item.id === entityId ? { ...item, ...updates } : item
        ),
      }
    }

    return data
  }

  const nullifyEntityReferences = (data: any, entityType: string, entityId: string): any => {
    if (!data || typeof data !== 'object') return data

    const newData = { ...data }
    
    // Nullify foreign key references
    Object.keys(newData).forEach(key => {
      if (key.endsWith('Id') && newData[key] === entityId) {
        newData[key] = null
      }
      
      if (key.endsWith(entityType + 'Id') && newData[key] === entityId) {
        newData[key] = null
      }
      
      // Handle nested objects and arrays recursively
      if (Array.isArray(newData[key])) {
        newData[key] = newData[key].map((item: any) => 
          nullifyEntityReferences(item, entityType, entityId)
        )
      } else if (typeof newData[key] === 'object' && newData[key] !== null) {
        newData[key] = nullifyEntityReferences(newData[key], entityType, entityId)
      }
    })

    return newData
  }

  // ==================== Rollback Operations ====================

  const revertOptimisticUpdates = useCallback(async (opId: string) => {
    const rollbackStack = trackingState.rollbackStack.get(opId)
    
    if (!rollbackStack || rollbackStack.length === 0) {
      return
    }

    try {
      // Group updates by query key for efficient rollback
      const queryKeyGroups = new Map<string, OptimisticUpdate[]>()
      
      rollbackStack.forEach(update => {
        // Determine which query keys might be affected
        const possibleQueryKeys = getPossibleQueryKeysForEntity(update.entityType, update.entityId)
        
        possibleQueryKeys.forEach(queryKey => {
          const key = JSON.stringify(queryKey)
          const updates = queryKeyGroups.get(key) || []
          queryKeyGroups.set(key, [...updates, update])
        })
      })

      // Apply rollbacks to each query key group
      for (const [queryKeyStr, updates] of queryKeyGroups) {
        const queryKey = JSON.parse(queryKeyStr)
        
        queryClient.setQueryData(queryKey, (currentData: any) => {
          let rolledBackData = currentData
          
          // Apply rollbacks in reverse order (LIFO)
          for (let i = updates.length - 1; i >= 0; i--) {
            const update = updates[i]
            rolledBackData = rollbackSingleUpdate(rolledBackData, update)
          }
          
          return rolledBackData
        })
      }

      // Mark updates as reverted
      setTrackingState(prev => {
        const newState = { ...prev }
        const updates = newState.optimisticUpdates.get(opId) || []
        const revertedUpdates = updates.map(update => ({ 
          ...update, 
          reverted: true 
        }))
        newState.optimisticUpdates.set(opId, revertedUpdates)
        newState.rollbackStack.delete(opId)
        return newState
      })

      // Show notification
      store.addNotification({
        type: 'info',
        title: 'Changes Reverted',
        message: `Optimistic updates for operation ${opId} have been reverted`,
        duration: 5000,
      })

    } catch (error) {
      await globalErrorHandler.getErrorLogger().logError(error, {
        operationId: opId,
      })
      
      store.addNotification({
        type: 'error',
        title: 'Rollback Failed',
        message: 'Failed to revert optimistic updates. Please refresh the page.',
        autoHide: false,
      })
    }
  }, [trackingState.rollbackStack, queryClient, store])

  const rollbackSingleUpdate = (data: any, update: OptimisticUpdate): any => {
    if (!data || !update.originalData) return data

    // For delete operations, we need to restore the deleted entity
    if (update.action === 'delete') {
      return restoreEntityToData(data, update.originalData, update.entityId)
    }

    // For updates, restore original values
    if (update.action === 'update') {
      return updateEntityInData(data, update.entityId, update.originalData)
    }

    // For nullify operations, restore original references
    if (update.action === 'nullify') {
      return update.originalData
    }

    return data
  }

  const restoreEntityToData = (data: any, originalData: any, entityId: string): any => {
    // This is complex as we need to restore deleted entities
    // In practice, it's better to invalidate and refetch the queries
    return originalData
  }

  const getPossibleQueryKeysForEntity = (entityType: string, entityId: string): any[][] => {
    // Generate possible query keys that might contain this entity
    const queryKeys: any[][] = []
    
    switch (entityType) {
      case 'student':
        queryKeys.push(['students'])
        queryKeys.push(['students', 'list'])
        queryKeys.push(['students', entityId])
        queryKeys.push(['students', entityId, 'details'])
        break
      case 'teacher':
        queryKeys.push(['teachers'])
        queryKeys.push(['teachers', 'list'])
        queryKeys.push(['teachers', entityId])
        queryKeys.push(['teachers', entityId, 'details'])
        break
      case 'orchestra':
        queryKeys.push(['orchestras'])
        queryKeys.push(['orchestras', 'list'])
        queryKeys.push(['orchestras', entityId])
        queryKeys.push(['orchestras', entityId, 'details'])
        break
      // Add more entity types as needed
    }
    
    return queryKeys
  }

  // ==================== Progress Tracking Control ====================

  const startTracking = useCallback((opId: string) => {
    if (trackingState.activeTracking.has(opId)) return

    setTrackingState(prev => ({
      ...prev,
      activeTracking: new Set([...prev.activeTracking, opId]),
    }))

    // Start periodic snapshots
    snapshotInterval.current = setInterval(() => {
      const currentProgress = store.operationProgress.get(opId)
      if (currentProgress) {
        captureProgressSnapshot(opId, currentProgress)
      }
    }, 2000) // Capture every 2 seconds

  }, [trackingState.activeTracking, store.operationProgress, captureProgressSnapshot])

  const stopTracking = useCallback((opId: string) => {
    setTrackingState(prev => {
      const newActiveTracking = new Set(prev.activeTracking)
      newActiveTracking.delete(opId)
      
      return {
        ...prev,
        activeTracking: newActiveTracking,
      }
    })

    if (snapshotInterval.current) {
      clearInterval(snapshotInterval.current)
    }
  }, [])

  const subscribeToProgress = useCallback((
    opId: string,
    callback: (progress: DeletionProgress) => void
  ): () => void => {
    setTrackingState(prev => {
      const newState = { ...prev }
      const callbacks = newState.progressCallbacks.get(opId) || new Set()
      callbacks.add(callback)
      newState.progressCallbacks.set(opId, callbacks)
      return newState
    })

    // Return unsubscribe function
    return () => {
      setTrackingState(prev => {
        const newState = { ...prev }
        const callbacks = newState.progressCallbacks.get(opId)
        if (callbacks) {
          callbacks.delete(callback)
          if (callbacks.size === 0) {
            newState.progressCallbacks.delete(opId)
          } else {
            newState.progressCallbacks.set(opId, callbacks)
          }
        }
        return newState
      })
    }
  }, [])

  // ==================== Progress Analytics ====================

  const getProgressAnalytics = useCallback((opId: string) => {
    const snapshots = trackingState.snapshots.get(opId) || []
    const optimisticUpdates = trackingState.optimisticUpdates.get(opId) || []
    
    if (snapshots.length === 0) {
      return null
    }

    const firstSnapshot = snapshots[0]
    const lastSnapshot = snapshots[snapshots.length - 1]
    
    const startTime = new Date(firstSnapshot.timestamp).getTime()
    const currentTime = new Date(lastSnapshot.timestamp).getTime()
    const elapsedMs = currentTime - startTime
    
    // Calculate progress rate
    const progressDelta = lastSnapshot.progress.percentage - firstSnapshot.progress.percentage
    const progressRate = elapsedMs > 0 ? progressDelta / elapsedMs : 0 // percentage per ms
    
    // Calculate velocity (entities processed per second)
    const entitiesProcessed = lastSnapshot.progress.processedEntities.length
    const velocity = elapsedMs > 0 ? (entitiesProcessed * 1000) / elapsedMs : 0
    
    // Estimate time remaining
    const remainingPercentage = 100 - lastSnapshot.progress.percentage
    const estimatedRemainingMs = progressRate > 0 ? remainingPercentage / progressRate : undefined
    
    return {
      startTime: firstSnapshot.timestamp,
      elapsedMs,
      currentProgress: lastSnapshot.progress.percentage,
      progressRate: progressRate * 1000, // percentage per second
      velocity, // entities per second
      estimatedRemainingMs,
      estimatedCompletion: estimatedRemainingMs 
        ? new Date(Date.now() + estimatedRemainingMs).toISOString()
        : undefined,
      snapshotCount: snapshots.length,
      optimisticUpdateCount: optimisticUpdates.length,
      errors: lastSnapshot.progress.errors,
      warnings: lastSnapshot.progress.warnings,
    }
  }, [trackingState.snapshots, trackingState.optimisticUpdates])

  // ==================== Cleanup ====================

  useEffect(() => {
    return () => {
      if (snapshotInterval.current) {
        clearInterval(snapshotInterval.current)
      }
    }
  }, [])

  // Auto-start tracking for new operations
  useEffect(() => {
    if (operationId && !trackingState.activeTracking.has(operationId)) {
      startTracking(operationId)
    }
  }, [operationId, trackingState.activeTracking, startTracking])

  // ==================== Return Interface ====================

  return {
    // Progress tracking
    startTracking,
    stopTracking,
    subscribeToProgress,
    getProgressAnalytics,
    snapshots: operationId ? trackingState.snapshots.get(operationId) || [] : [],
    
    // Optimistic updates
    applyOptimisticUpdate,
    revertOptimisticUpdates,
    optimisticUpdates: operationId ? trackingState.optimisticUpdates.get(operationId) || [] : [],
    
    // State
    isTracking: operationId ? trackingState.activeTracking.has(operationId) : false,
    canRevert: operationId ? (trackingState.rollbackStack.get(operationId)?.length || 0) > 0 : false,
    
    // Utilities
    captureProgressSnapshot,
  }
}

// ==================== Batch Progress Tracking Hook ====================

export function useBatchProgressTracking(operationIds: string[]) {
  const individualTrackers = operationIds.reduce((acc, operationId) => {
    acc[operationId] = useProgressTracking(operationId)
    return acc
  }, {} as Record<string, ReturnType<typeof useProgressTracking>>)

  const getBatchAnalytics = useCallback(() => {
    const analytics = operationIds.map(operationId => ({
      operationId,
      analytics: individualTrackers[operationId]?.getProgressAnalytics(operationId),
    })).filter(item => item.analytics !== null)

    const totalProgress = analytics.reduce((sum, item) => 
      sum + (item.analytics?.currentProgress || 0), 0
    ) / analytics.length

    const totalVelocity = analytics.reduce((sum, item) => 
      sum + (item.analytics?.velocity || 0), 0
    )

    const allEstimatedCompletions = analytics
      .map(item => item.analytics?.estimatedRemainingMs)
      .filter(time => time !== undefined) as number[]

    const maxEstimatedCompletion = allEstimatedCompletions.length > 0
      ? Math.max(...allEstimatedCompletions)
      : undefined

    return {
      operationCount: operationIds.length,
      completedCount: analytics.filter(item => item.analytics?.currentProgress === 100).length,
      averageProgress: totalProgress,
      totalVelocity,
      estimatedCompletionMs: maxEstimatedCompletion,
      individualAnalytics: analytics,
    }
  }, [operationIds, individualTrackers])

  const revertAllOptimisticUpdates = useCallback(async () => {
    await Promise.all(
      operationIds.map(operationId => 
        individualTrackers[operationId]?.revertOptimisticUpdates(operationId)
      )
    )
  }, [operationIds, individualTrackers])

  return {
    individualTrackers,
    getBatchAnalytics,
    revertAllOptimisticUpdates,
    totalOperations: operationIds.length,
    activeOperations: operationIds.filter(id => 
      individualTrackers[id]?.isTracking
    ).length,
  }
}