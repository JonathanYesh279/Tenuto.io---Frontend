/**
 * WebSocket Integration for Cascade Deletion Operations
 * 
 * Extends the existing WebSocket service to handle deletion progress updates,
 * real-time notifications, and operation status changes
 */

import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  DeletionProgressMessage,
  DeletionCompleteMessage,
  DeletionErrorMessage,
  DeletionProgress,
  DeletionOperation,
} from '@/types/cascade-deletion.types'
import { useCascadeDeletionStore } from '@/stores/cascadeDeletionStore'
import { cascadeDeletionQueryKeys } from '@/hooks/useCascadeDeletion'

// Extend the existing WebSocket manager to handle deletion messages
declare global {
  interface WebSocketMessage {
    type: 'student_update' | 'attendance_update' | 'schedule_update' | 'document_update' | 
          'heartbeat' | 'deletion_progress' | 'deletion_complete' | 'deletion_error' |
          'integrity_update' | 'audit_update'
    data: any
    studentId?: string
    operationId?: string
    timestamp: string
  }
}

// Import the existing WebSocket manager
import { wsManager } from '@/services/websocketService'

/**
 * Hook for WebSocket deletion progress updates
 * Integrates with existing WebSocket service to handle deletion-specific messages
 */
export function useWebSocketDeletionUpdates() {
  const queryClient = useQueryClient()
  const store = useCascadeDeletionStore()
  const handlersRegistered = useRef(false)

  // ==================== Message Handlers ====================

  const handleDeletionProgress = useCallback((message: DeletionProgressMessage) => {
    const { operationId, progress } = message
    
    console.log('Received deletion progress update:', { operationId, progress })

    // Update store state
    store.updateOperationProgress(operationId, progress)

    // Update React Query cache
    queryClient.setQueryData(
      cascadeDeletionQueryKeys.operationProgress(operationId),
      progress
    )

    // Update operation status in cache if phase changed
    if (progress.phase === 'completed' || progress.phase === 'failed') {
      queryClient.setQueryData(
        cascadeDeletionQueryKeys.operationStatus(operationId),
        (oldOperation: DeletionOperation | undefined) => {
          if (!oldOperation) return oldOperation
          
          return {
            ...oldOperation,
            status: progress.phase === 'completed' ? 'completed' : 'failed',
            completedAt: progress.phase === 'completed' 
              ? new Date().toISOString() 
              : undefined,
            failedAt: progress.phase === 'failed' 
              ? new Date().toISOString() 
              : undefined,
            error: progress.errors?.[0]?.error,
          }
        }
      )

      // Invalidate active operations to refresh the list
      queryClient.invalidateQueries({
        queryKey: cascadeDeletionQueryKeys.activeOperations()
      })
    }

    // Show progress notifications for important milestones
    if (progress.percentage === 100 && progress.phase === 'completed') {
      store.addNotification({
        type: 'success',
        title: 'Deletion Completed',
        message: `Successfully deleted ${progress.processedEntities.length} entities`,
        duration: 8000,
      })
    } else if (progress.phase === 'failed') {
      store.addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: progress.errors[0]?.error || 'An unexpected error occurred',
        autoHide: false, // Keep error notifications visible
      })
    }
  }, [queryClient, store])

  const handleDeletionComplete = useCallback((message: DeletionCompleteMessage) => {
    const { operationId, result } = message
    
    console.log('Received deletion complete:', { operationId, result })

    // Update operation status
    queryClient.setQueryData(
      cascadeDeletionQueryKeys.operationStatus(operationId),
      (oldOperation: DeletionOperation | undefined) => {
        if (!oldOperation) return oldOperation
        
        return {
          ...oldOperation,
          status: result.success ? 'completed' : 'failed',
          completedAt: result.success ? new Date().toISOString() : undefined,
          failedAt: !result.success ? new Date().toISOString() : undefined,
          error: result.errors?.[0]?.error,
        }
      }
    )

    // Create final progress update
    const finalProgress: DeletionProgress = {
      operationId,
      phase: result.success ? 'completed' : 'failed',
      currentStep: result.success ? 'Completed successfully' : 'Operation failed',
      totalSteps: result.deletedCount || 1,
      completedSteps: result.deletedCount || (result.success ? 1 : 0),
      percentage: result.success ? 100 : 0,
      startedAt: new Date(Date.now() - (result.duration || 0)).toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      processedEntities: result.affectedEntities || [],
      errors: result.errors || [],
      warnings: [],
    }

    store.updateOperationProgress(operationId, finalProgress)

    // Invalidate related queries
    queryClient.invalidateQueries({
      queryKey: cascadeDeletionQueryKeys.activeOperations()
    })

    // Show completion notification
    if (result.success) {
      store.addNotification({
        type: 'success',
        title: 'Deletion Completed Successfully',
        message: `Deleted ${result.deletedCount} entities in ${Math.round((result.duration || 0) / 1000)}s`,
        duration: 10000,
      })
    } else {
      store.addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: `Failed to complete deletion. ${result.errors?.length || 0} errors occurred.`,
        autoHide: false,
      })
    }

    // Invalidate related entity lists to reflect deletions
    if (result.success && result.affectedEntities?.length > 0) {
      const entityTypes = new Set(result.affectedEntities.map(e => e.type))
      
      entityTypes.forEach(entityType => {
        // Invalidate relevant list queries based on entity type
        switch (entityType) {
          case 'student':
            queryClient.invalidateQueries({ queryKey: ['students'] })
            break
          case 'teacher':
            queryClient.invalidateQueries({ queryKey: ['teachers'] })
            break
          case 'orchestra':
            queryClient.invalidateQueries({ queryKey: ['orchestras'] })
            break
          case 'rehearsal':
            queryClient.invalidateQueries({ queryKey: ['rehearsals'] })
            break
          case 'theory_lesson':
            queryClient.invalidateQueries({ queryKey: ['theoryLessons'] })
            break
          case 'bagrut':
            queryClient.invalidateQueries({ queryKey: ['bagruts'] })
            break
        }
      })
    }
  }, [queryClient, store])

  const handleDeletionError = useCallback((message: DeletionErrorMessage) => {
    const { operationId, error } = message
    
    console.error('Received deletion error:', { operationId, error })

    // Update operation status
    queryClient.setQueryData(
      cascadeDeletionQueryKeys.operationStatus(operationId),
      (oldOperation: DeletionOperation | undefined) => {
        if (!oldOperation) return oldOperation
        
        return {
          ...oldOperation,
          status: 'failed',
          failedAt: new Date().toISOString(),
          error: error.message,
        }
      }
    )

    // Update progress to reflect error
    const errorProgress: DeletionProgress = {
      operationId,
      phase: 'failed',
      currentStep: `Failed: ${error.message}`,
      totalSteps: 1,
      completedSteps: 0,
      percentage: 0,
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      processedEntities: [],
      errors: [
        {
          entityType: 'unknown',
          entityId: 'unknown',
          error: error.message,
          timestamp: new Date().toISOString(),
          recoverable: error.recoverable,
        }
      ],
      warnings: [],
    }

    store.updateOperationProgress(operationId, errorProgress)

    // Show error notification
    store.addNotification({
      type: 'error',
      title: 'Deletion Error',
      message: error.message,
      autoHide: false,
      action: error.recoverable ? {
        label: 'Retry',
        onClick: () => {
          // Implement retry logic here
          console.log('Retry deletion for operation:', operationId)
        }
      } : undefined,
    })

    // Invalidate active operations
    queryClient.invalidateQueries({
      queryKey: cascadeDeletionQueryKeys.activeOperations()
    })
  }, [queryClient, store])

  // ==================== WebSocket Integration ====================

  useEffect(() => {
    if (handlersRegistered.current) return

    try {
      // Ensure WebSocket connection
      if (!wsManager.getConnectionStatus().isConnected) {
        wsManager.connect()
      }

      // Register message handlers for deletion events
      const unsubscribeProgress = wsManager.subscribe('deletion_progress', (message) => {
        if (message.type === 'deletion_progress') {
          handleDeletionProgress(message as DeletionProgressMessage)
        }
      })

      const unsubscribeComplete = wsManager.subscribe('deletion_complete', (message) => {
        if (message.type === 'deletion_complete') {
          handleDeletionComplete(message as DeletionCompleteMessage)
        }
      })

      const unsubscribeError = wsManager.subscribe('deletion_error', (message) => {
        if (message.type === 'deletion_error') {
          handleDeletionError(message as DeletionErrorMessage)
        }
      })

      handlersRegistered.current = true

      console.log('WebSocket deletion handlers registered')

      return () => {
        unsubscribeProgress()
        unsubscribeComplete()
        unsubscribeError()
        handlersRegistered.current = false
      }
    } catch (error) {
      console.warn('Failed to setup WebSocket deletion handlers:', error)
    }
  }, [handleDeletionProgress, handleDeletionComplete, handleDeletionError])

  // ==================== Connection Status Monitoring ====================

  useEffect(() => {
    const updateConnectionStatus = () => {
      const status = wsManager.getConnectionStatus()
      const connectionStatus = status.isConnected 
        ? 'connected' 
        : status.reconnectAttempts > 0 
        ? 'connecting' 
        : 'disconnected'
      
      store.setConnectionStatus(connectionStatus)
    }

    // Update immediately
    updateConnectionStatus()

    // Set up periodic status checks
    const statusInterval = setInterval(updateConnectionStatus, 5000)

    return () => clearInterval(statusInterval)
  }, [store])

  return {
    connectionStatus: store.connectionStatus,
    isConnected: store.connectionStatus === 'connected',
  }
}

/**
 * Hook for subscribing to specific operation progress
 */
export function useOperationWebSocketUpdates(operationId: string | null) {
  const store = useCascadeDeletionStore()
  const subscriptionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!operationId) return

    try {
      // Subscribe to operation-specific updates
      if (wsManager.getConnectionStatus().isConnected) {
        wsManager.send({
          type: 'subscribe',
          channel: `deletion/${operationId}/progress`
        })
        
        store.subscribeToOperation(operationId)
        subscriptionRef.current = operationId
        
        console.log(`Subscribed to deletion progress for operation: ${operationId}`)
      }
    } catch (error) {
      console.warn(`Failed to subscribe to operation ${operationId}:`, error)
    }

    return () => {
      if (subscriptionRef.current) {
        try {
          if (wsManager.getConnectionStatus().isConnected) {
            wsManager.send({
              type: 'unsubscribe',
              channel: `deletion/${subscriptionRef.current}/progress`
            })
          }
          
          store.unsubscribeFromOperation(subscriptionRef.current)
          subscriptionRef.current = null
          
          console.log(`Unsubscribed from deletion progress for operation: ${operationId}`)
        } catch (error) {
          console.warn(`Failed to unsubscribe from operation ${operationId}:`, error)
        }
      }
    }
  }, [operationId, store])

  return {
    isSubscribed: subscriptionRef.current === operationId,
  }
}

/**
 * Hook for batch operation WebSocket updates
 */
export function useBatchDeletionWebSocketUpdates(batchId: string | null) {
  const queryClient = useQueryClient()
  const store = useCascadeDeletionStore()

  useEffect(() => {
    if (!batchId) return

    try {
      // Subscribe to batch operation updates
      if (wsManager.getConnectionStatus().isConnected) {
        wsManager.send({
          type: 'subscribe',
          channel: `deletion/batch/${batchId}/progress`
        })
        
        console.log(`Subscribed to batch deletion progress: ${batchId}`)
      }
    } catch (error) {
      console.warn(`Failed to subscribe to batch ${batchId}:`, error)
    }

    return () => {
      try {
        if (wsManager.getConnectionStatus().isConnected) {
          wsManager.send({
            type: 'unsubscribe',
            channel: `deletion/batch/${batchId}/progress`
          })
        }
        
        console.log(`Unsubscribed from batch deletion progress: ${batchId}`)
      } catch (error) {
        console.warn(`Failed to unsubscribe from batch ${batchId}:`, error)
      }
    }
  }, [batchId])
}

/**
 * Hook for WebSocket connection management
 */
export function useWebSocketConnectionManager() {
  const store = useCascadeDeletionStore()

  const connect = useCallback(() => {
    try {
      wsManager.connect()
      console.log('WebSocket connection initiated')
    } catch (error) {
      console.error('Failed to initiate WebSocket connection:', error)
      store.addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: 'Failed to establish real-time connection',
      })
    }
  }, [store])

  const disconnect = useCallback(() => {
    try {
      wsManager.disconnect()
      store.setConnectionStatus('disconnected')
      console.log('WebSocket disconnected')
    } catch (error) {
      console.error('Failed to disconnect WebSocket:', error)
    }
  }, [store])

  const reconnect = useCallback(() => {
    try {
      wsManager.disconnect()
      setTimeout(() => {
        wsManager.connect()
      }, 1000)
      console.log('WebSocket reconnection initiated')
    } catch (error) {
      console.error('Failed to reconnect WebSocket:', error)
    }
  }, [])

  return {
    connect,
    disconnect,
    reconnect,
    connectionStatus: store.connectionStatus,
    isConnected: store.connectionStatus === 'connected',
  }
}

/**
 * Utility function to send custom WebSocket messages for deletion operations
 */
export function useDeletionWebSocketSender() {
  const sendMessage = useCallback((message: any) => {
    try {
      if (wsManager.getConnectionStatus().isConnected) {
        wsManager.send({
          ...message,
          timestamp: new Date().toISOString(),
        })
        return true
      } else {
        console.warn('WebSocket not connected, cannot send message')
        return false
      }
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      return false
    }
  }, [])

  const requestOperationStatus = useCallback((operationId: string) => {
    return sendMessage({
      type: 'request_operation_status',
      operationId,
    })
  }, [sendMessage])

  const requestProgressUpdate = useCallback((operationId: string) => {
    return sendMessage({
      type: 'request_progress_update',
      operationId,
    })
  }, [sendMessage])

  return {
    sendMessage,
    requestOperationStatus,
    requestProgressUpdate,
  }
}