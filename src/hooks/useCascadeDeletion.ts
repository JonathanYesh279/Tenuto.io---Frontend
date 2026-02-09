/**
 * React Query Integration for Cascade Deletion Operations
 * 
 * Provides comprehensive hooks for deletion operations with caching,
 * background updates, and error handling using React Query
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import {
  DeletionImpact,
  DeletionOperation,
  DeletionProgress,
  UseCascadeDeletionReturn,
  CascadeDeletionError,
} from '@/types/cascade-deletion.types'
import { cascadeDeletionService } from '@/services/cascadeDeletionService'
import { useCascadeDeletionStore } from '@/stores/cascadeDeletionStore'
import { useWebSocketDeletionUpdates } from './useWebSocketDeletion'

// ==================== Query Keys ====================

export const cascadeDeletionQueryKeys = {
  all: ['cascade-deletion'] as const,
  previews: () => [...cascadeDeletionQueryKeys.all, 'previews'] as const,
  preview: (entityType: string, entityId: string, options?: any) => 
    [...cascadeDeletionQueryKeys.previews(), entityType, entityId, options] as const,
  operations: () => [...cascadeDeletionQueryKeys.all, 'operations'] as const,
  activeOperations: () => [...cascadeDeletionQueryKeys.operations(), 'active'] as const,
  operation: (operationId: string) => 
    [...cascadeDeletionQueryKeys.operations(), operationId] as const,
  operationStatus: (operationId: string) => 
    [...cascadeDeletionQueryKeys.operation(operationId), 'status'] as const,
  operationProgress: (operationId: string) => 
    [...cascadeDeletionQueryKeys.operation(operationId), 'progress'] as const,
  operationHistory: () => [...cascadeDeletionQueryKeys.operations(), 'history'] as const,
  batchPreviews: (entities: Array<{ entityType: string; entityId: string }>) =>
    [...cascadeDeletionQueryKeys.previews(), 'batch', entities] as const,
  systemLimits: () => [...cascadeDeletionQueryKeys.all, 'limits'] as const,
}

// ==================== Main Cascade Deletion Hook ====================

export function useCascadeDeletion(
  entityType?: string,
  entityId?: string
): UseCascadeDeletionReturn {
  const queryClient = useQueryClient()
  const store = useCascadeDeletionStore()
  
  // WebSocket integration for real-time updates
  useWebSocketDeletionUpdates()

  // ==================== Preview Operations ====================

  const previewQuery = useQuery({
    queryKey: cascadeDeletionQueryKeys.preview(entityType!, entityId!),
    queryFn: async (): Promise<DeletionImpact> => {
      if (!entityType || !entityId) {
        throw new CascadeDeletionError('Entity type and ID are required for preview')
      }
      return cascadeDeletionService.previewDeletion(entityType, entityId)
    },
    enabled: !!entityType && !!entityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (error instanceof CascadeDeletionError && error.code?.includes('404')) {
        return false
      }
      return failureCount < 2
    },
    onSuccess: (data) => {
      store.clearPreview()
      // Update store with successful preview
    },
    onError: (error) => {
      const errorMessage = error instanceof CascadeDeletionError 
        ? error.message 
        : 'Failed to preview deletion'
      
      store.addNotification({
        type: 'error',
        title: 'Preview Failed',
        message: errorMessage,
      })
    },
  })

  const previewDeletion = useCallback(async (
    previewEntityType: string,
    previewEntityId: string
  ): Promise<DeletionImpact | null> => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: cascadeDeletionQueryKeys.preview(previewEntityType, previewEntityId),
        queryFn: () => cascadeDeletionService.previewDeletion(previewEntityType, previewEntityId),
        staleTime: 2 * 60 * 1000,
      })
      return data
    } catch (error) {
      console.error('Preview deletion failed:', error)
      return null
    }
  }, [queryClient])

  // ==================== Execution Operations ====================

  const executionMutation = useMutation({
    mutationFn: async ({ operationId, options }: { 
      operationId: string
      options?: any 
    }) => {
      return cascadeDeletionService.executeDeletion(operationId, options)
    },
    onMutate: async ({ operationId }) => {
      // Optimistic update - mark as starting
      store.optimisticallyUpdateOperation(operationId, {
        status: 'in_progress',
        startedAt: new Date().toISOString(),
      })

      // Cancel related queries
      await queryClient.cancelQueries({
        queryKey: cascadeDeletionQueryKeys.operationStatus(operationId)
      })
    },
    onSuccess: (newOperationId, { operationId }) => {
      // Invalidate and refetch active operations
      queryClient.invalidateQueries({
        queryKey: cascadeDeletionQueryKeys.activeOperations()
      })

      // If we got a new operation ID, start tracking it
      if (newOperationId && newOperationId !== operationId) {
        queryClient.setQueryData(
          cascadeDeletionQueryKeys.operationStatus(newOperationId),
          {
            id: newOperationId,
            status: 'in_progress',
            startedAt: new Date().toISOString(),
          }
        )
      }

      store.addNotification({
        type: 'success',
        title: 'Deletion Started',
        message: 'The deletion operation has been initiated successfully',
      })
    },
    onError: (error, { operationId }) => {
      // Revert optimistic update
      store.revertOptimisticUpdate(operationId)

      const errorMessage = error instanceof CascadeDeletionError
        ? error.message
        : 'Failed to execute deletion'

      store.addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: errorMessage,
      })
    },
  })

  const executeDeletion = useCallback((
    operationId: string,
    options?: any
  ): Promise<string | null> => {
    return executionMutation.mutateAsync({ operationId, options })
  }, [executionMutation])

  // ==================== Cancellation Operations ====================

  const cancellationMutation = useMutation({
    mutationFn: (operationId: string) => cascadeDeletionService.cancelOperation(operationId),
    onMutate: (operationId) => {
      // Optimistic update
      store.optimisticallyUpdateOperation(operationId, {
        status: 'cancelled',
      })
    },
    onSuccess: (success, operationId) => {
      if (success) {
        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: cascadeDeletionQueryKeys.operation(operationId)
        })
        queryClient.invalidateQueries({
          queryKey: cascadeDeletionQueryKeys.activeOperations()
        })

        store.addNotification({
          type: 'info',
          title: 'Operation Cancelled',
          message: 'The deletion operation has been cancelled',
        })
      }
    },
    onError: (error, operationId) => {
      // Revert optimistic update
      store.revertOptimisticUpdate(operationId)

      const errorMessage = error instanceof CascadeDeletionError
        ? error.message
        : 'Failed to cancel operation'

      store.addNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: errorMessage,
      })
    },
  })

  const cancelOperation = useCallback((operationId: string): Promise<boolean> => {
    return cancellationMutation.mutateAsync(operationId)
  }, [cancellationMutation])

  // ==================== Progress Tracking ====================

  const getOperationProgress = useCallback((operationId: string): DeletionProgress | null => {
    const cachedProgress = queryClient.getQueryData<DeletionProgress>(
      cascadeDeletionQueryKeys.operationProgress(operationId)
    )
    return cachedProgress || store.operationProgress.get(operationId) || null
  }, [queryClient, store.operationProgress])

  const subscribeToProgress = useCallback((operationId: string) => {
    // Subscribe to real-time progress updates
    store.subscribeToOperation(operationId)

    // Set up background refetching for operation status
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: cascadeDeletionQueryKeys.operationProgress(operationId),
        exact: true,
      })
    }, 2000) // Poll every 2 seconds

    // Return cleanup function
    return () => {
      store.unsubscribeFromOperation(operationId)
      clearInterval(interval)
    }
  }, [queryClient, store])

  return {
    // Preview operations
    previewDeletion,
    previewLoading: previewQuery.isLoading,
    previewError: previewQuery.error?.message || null,
    previewData: previewQuery.data || null,

    // Execution operations
    executeDeletion,
    cancelOperation,

    // Progress tracking
    getOperationProgress,
    subscribeToProgress,

    // State
    activeOperations: Array.from(store.activeOperations.values()),
    isDeleting: store.isDeleting || executionMutation.isLoading,
  }
}

// ==================== Active Operations Hook ====================

export function useActiveOperations() {
  const queryClient = useQueryClient()

  const activeOperationsQuery = useQuery({
    queryKey: cascadeDeletionQueryKeys.activeOperations(),
    queryFn: () => cascadeDeletionService.getActiveOperations(),
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 0, // Always fetch fresh data
    onSuccess: (operations) => {
      // Update individual operation caches
      operations.forEach(operation => {
        queryClient.setQueryData(
          cascadeDeletionQueryKeys.operationStatus(operation.id),
          operation
        )
      })
    },
  })

  return {
    operations: activeOperationsQuery.data || [],
    isLoading: activeOperationsQuery.isLoading,
    error: activeOperationsQuery.error,
    refetch: activeOperationsQuery.refetch,
  }
}

// ==================== Operation Status Hook ====================

export function useOperationStatus(operationId: string | null) {
  return useQuery({
    queryKey: cascadeDeletionQueryKeys.operationStatus(operationId!),
    queryFn: () => cascadeDeletionService.getOperationStatus(operationId!),
    enabled: !!operationId,
    refetchInterval: (data) => {
      // Stop refetching if operation is completed or failed
      return data?.status === 'completed' || data?.status === 'failed' 
        ? false 
        : 3000 // 3 seconds
    },
    staleTime: 1000, // 1 second
  })
}

// ==================== Operation Progress Hook ====================

export function useOperationProgress(operationId: string | null) {
  return useQuery({
    queryKey: cascadeDeletionQueryKeys.operationProgress(operationId!),
    queryFn: () => cascadeDeletionService.getProgress(operationId!, false),
    enabled: !!operationId,
    refetchInterval: (data) => {
      // Stop refetching if operation is completed or failed
      return data?.phase === 'completed' || data?.phase === 'failed'
        ? false
        : 2000 // 2 seconds
    },
    staleTime: 500, // 0.5 seconds
  })
}

// ==================== Operation History Hook ====================

export function useOperationHistory(
  filters?: {
    entityType?: string
    status?: string
    userId?: string
    startDate?: string
    endDate?: string
  }
) {
  return useInfiniteQuery({
    queryKey: [...cascadeDeletionQueryKeys.operationHistory(), filters],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await cascadeDeletionService.client.getOperationHistory(
        50, // limit
        pageParam * 50, // offset
        filters
      )
      return {
        operations: response.operations,
        totalCount: response.totalCount,
        nextOffset: response.operations.length === 50 ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// ==================== Batch Operations Hook ====================

export function useBatchDeletion() {
  const queryClient = useQueryClient()

  const batchPreviewMutation = useMutation({
    mutationFn: (entities: Array<{ entityType: string; entityId: string }>) =>
      cascadeDeletionService.previewBatch(entities),
    onSuccess: (data, entities) => {
      // Cache individual previews
      data.previews.forEach((preview, index) => {
        const entity = entities[index]
        queryClient.setQueryData(
          cascadeDeletionQueryKeys.preview(entity.entityType, entity.entityId),
          preview
        )
      })
    },
  })

  return {
    previewBatch: batchPreviewMutation.mutateAsync,
    isPreviewingBatch: batchPreviewMutation.isLoading,
    batchPreviewError: batchPreviewMutation.error,
  }
}

// ==================== System Limits Hook ====================

export function useSystemLimits() {
  return useQuery({
    queryKey: cascadeDeletionQueryKeys.systemLimits(),
    queryFn: () => cascadeDeletionService.getSystemLimits(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ==================== Cache Invalidation Utilities ====================

export function useCascadeDeletionCache() {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: cascadeDeletionQueryKeys.all
    })
  }, [queryClient])

  const invalidateOperation = useCallback((operationId: string) => {
    queryClient.invalidateQueries({
      queryKey: cascadeDeletionQueryKeys.operation(operationId)
    })
  }, [queryClient])

  const invalidateActiveOperations = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: cascadeDeletionQueryKeys.activeOperations()
    })
  }, [queryClient])

  const clearPreviewCache = useCallback(() => {
    queryClient.removeQueries({
      queryKey: cascadeDeletionQueryKeys.previews()
    })
  }, [queryClient])

  return {
    invalidateAll,
    invalidateOperation,
    invalidateActiveOperations,
    clearPreviewCache,
  }
}

// ==================== Optimistic Updates Hook ====================

export function useOptimisticDeletionUpdates() {
  const queryClient = useQueryClient()
  const store = useCascadeDeletionStore()

  const optimisticallyRemoveEntity = useCallback((
    entityType: string,
    entityId: string,
    listQueryKeys: any[]
  ) => {
    // Remove entity from relevant list queries optimistically
    listQueryKeys.forEach(queryKey => {
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData
        
        // Handle different data structures
        if (Array.isArray(oldData)) {
          return oldData.filter(item => item.id !== entityId)
        }
        
        if (oldData.data && Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: oldData.data.filter(item => item.id !== entityId)
          }
        }
        
        return oldData
      })
    })

    // Store rollback function
    return () => {
      listQueryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey })
      })
    }
  }, [queryClient])

  return {
    optimisticallyRemoveEntity,
  }
}