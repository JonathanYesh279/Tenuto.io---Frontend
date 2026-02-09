/**
 * Zustand Store for Cascade Deletion Operations
 * 
 * Manages state for deletion operations, progress tracking, and real-time updates
 * with optimistic updates and proper error handling
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  CascadeDeletionState,
  DeletionOperation,
  DeletionProgress,
  DeletionImpact,
  DataIntegrityStatus,
  RepairOperation,
  AuditLogEntry,
  AuditTrailQuery,
  NotificationMessage,
  CascadeDeletionError,
} from '@/types/cascade-deletion.types'
import { cascadeDeletionService } from '@/services/cascadeDeletionService'

/**
 * Initial state for the cascade deletion store
 */
const initialState: CascadeDeletionState = {
  // Current operations
  activeOperations: new Map(),
  operationProgress: new Map(),
  
  // Preview state
  currentPreview: null,
  previewLoading: false,
  previewError: null,
  
  // Deletion state
  isDeleting: false,
  deletionQueue: [],
  
  // Data integrity
  integrityStatus: null,
  integrityChecking: false,
  repairOperations: new Map(),
  
  // Audit trail
  auditEntries: [],
  auditLoading: false,
  auditFilters: {},
  auditTotalCount: 0,
  
  // WebSocket
  connectionStatus: 'disconnected',
  subscriptions: new Set(),
  
  // UI state
  selectedOperation: null,
  showConfirmationDialog: false,
  confirmationData: null,
  notifications: [],
}

/**
 * Cascade Deletion Store Actions
 */
interface CascadeDeletionActions {
  // ==================== Preview Actions ====================
  previewDeletion: (entityType: string, entityId: string) => Promise<DeletionImpact | null>
  clearPreview: () => void
  
  // ==================== Execution Actions ====================
  executeDeletion: (operationId: string, options?: any) => Promise<string | null>
  cancelOperation: (operationId: string) => Promise<boolean>
  
  // ==================== Progress Actions ====================
  updateOperationProgress: (operationId: string, progress: DeletionProgress) => void
  refreshOperationStatus: (operationId: string) => Promise<void>
  refreshActiveOperations: () => Promise<void>
  
  // ==================== Data Integrity Actions ====================
  checkDataIntegrity: () => Promise<void>
  repairDataIntegrity: (issueIds: string[], options?: any) => Promise<void>
  
  // ==================== Audit Trail Actions ====================
  queryAuditTrail: (query: AuditTrailQuery) => Promise<void>
  setAuditFilters: (filters: Partial<AuditTrailQuery>) => void
  clearAuditFilters: () => void
  rollbackOperation: (entryId: string) => Promise<void>
  
  // ==================== WebSocket Actions ====================
  setConnectionStatus: (status: CascadeDeletionState['connectionStatus']) => void
  subscribeToOperation: (operationId: string) => void
  unsubscribeFromOperation: (operationId: string) => void
  
  // ==================== UI Actions ====================
  setSelectedOperation: (operationId: string | null) => void
  showConfirmation: (data: any) => void
  hideConfirmation: () => void
  addNotification: (notification: Omit<NotificationMessage, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // ==================== Optimistic Updates ====================
  optimisticallyUpdateOperation: (operationId: string, updates: Partial<DeletionOperation>) => void
  revertOptimisticUpdate: (operationId: string) => Promise<void>
  
  // ==================== Cleanup Actions ====================
  cleanup: () => void
  reset: () => void
}

/**
 * Main Zustand store with middleware for better state management
 */
export const useCascadeDeletionStore = create<CascadeDeletionState & CascadeDeletionActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // ==================== Preview Actions ====================
      previewDeletion: async (entityType: string, entityId: string) => {
        set((state) => {
          state.previewLoading = true
          state.previewError = null
          state.currentPreview = null
        })

        try {
          const impact = await cascadeDeletionService.previewDeletion(entityType, entityId)
          
          set((state) => {
            state.currentPreview = impact
            state.previewLoading = false
          })

          return impact
        } catch (error) {
          const errorMessage = error instanceof CascadeDeletionError
            ? error.message
            : 'Failed to preview deletion'

          set((state) => {
            state.previewError = errorMessage
            state.previewLoading = false
          })

          get().addNotification({
            type: 'error',
            title: 'Preview Failed',
            message: errorMessage,
          })

          return null
        }
      },

      clearPreview: () => {
        set((state) => {
          state.currentPreview = null
          state.previewError = null
          state.previewLoading = false
        })
      },

      // ==================== Execution Actions ====================
      executeDeletion: async (operationId: string, options?: any) => {
        set((state) => {
          state.isDeleting = true
          state.deletionQueue.push(operationId)
        })

        try {
          const newOperationId = await cascadeDeletionService.executeDeletion(operationId, options)
          
          set((state) => {
            state.deletionQueue = state.deletionQueue.filter(id => id !== operationId)
            // Add the new operation to active operations
            if (newOperationId && !state.activeOperations.has(newOperationId)) {
              const operation: DeletionOperation = {
                id: newOperationId,
                entityType: state.currentPreview?.entityType || 'unknown',
                entityId: state.currentPreview?.entityId || 'unknown',
                status: 'in_progress',
                createdAt: new Date().toISOString(),
                startedAt: new Date().toISOString(),
                userId: 'current_user', // This should come from auth context
              }
              state.activeOperations.set(newOperationId, operation)
            }
          })

          get().addNotification({
            type: 'success',
            title: 'Deletion Started',
            message: 'The deletion operation has been started successfully',
          })

          return newOperationId
        } catch (error) {
          const errorMessage = error instanceof CascadeDeletionError
            ? error.message
            : 'Failed to execute deletion'

          set((state) => {
            state.isDeleting = false
            state.deletionQueue = state.deletionQueue.filter(id => id !== operationId)
          })

          get().addNotification({
            type: 'error',
            title: 'Deletion Failed',
            message: errorMessage,
          })

          return null
        }
      },

      cancelOperation: async (operationId: string) => {
        try {
          const success = await cascadeDeletionService.cancelOperation(operationId)
          
          if (success) {
            set((state) => {
              const operation = state.activeOperations.get(operationId)
              if (operation) {
                operation.status = 'cancelled'
                state.activeOperations.set(operationId, operation)
              }
              state.operationProgress.delete(operationId)
              state.deletionQueue = state.deletionQueue.filter(id => id !== operationId)
              state.isDeleting = state.deletionQueue.length > 0 || state.activeOperations.size > 0
            })

            get().addNotification({
              type: 'info',
              title: 'Operation Cancelled',
              message: 'The deletion operation has been cancelled',
            })
          }

          return success
        } catch (error) {
          const errorMessage = error instanceof CascadeDeletionError
            ? error.message
            : 'Failed to cancel operation'

          get().addNotification({
            type: 'error',
            title: 'Cancellation Failed',
            message: errorMessage,
          })

          return false
        }
      },

      // ==================== Progress Actions ====================
      updateOperationProgress: (operationId: string, progress: DeletionProgress) => {
        set((state) => {
          state.operationProgress.set(operationId, progress)
          
          // Update operation status if completed or failed
          if (progress.phase === 'completed' || progress.phase === 'failed') {
            const operation = state.activeOperations.get(operationId)
            if (operation) {
              operation.status = progress.phase === 'completed' ? 'completed' : 'failed'
              operation.completedAt = progress.phase === 'completed' ? new Date().toISOString() : undefined
              operation.failedAt = progress.phase === 'failed' ? new Date().toISOString() : undefined
              operation.error = progress.errors?.[0]?.error
              state.activeOperations.set(operationId, operation)
            }
            
            // Update deleting state
            state.isDeleting = Array.from(state.activeOperations.values())
              .some(op => op.status === 'in_progress' || op.status === 'pending')
          }
        })
      },

      refreshOperationStatus: async (operationId: string) => {
        try {
          const operation = await cascadeDeletionService.getOperationStatus(operationId, false)
          if (operation) {
            set((state) => {
              state.activeOperations.set(operationId, operation)
            })
          }
        } catch (error) {
          console.error('Failed to refresh operation status:', error)
        }
      },

      refreshActiveOperations: async () => {
        try {
          const operations = await cascadeDeletionService.getActiveOperations()
          
          set((state) => {
            state.activeOperations.clear()
            operations.forEach(op => {
              state.activeOperations.set(op.id, op)
            })
            state.isDeleting = operations.some(op => op.status === 'in_progress' || op.status === 'pending')
          })
        } catch (error) {
          console.error('Failed to refresh active operations:', error)
        }
      },

      // ==================== Data Integrity Actions ====================
      checkDataIntegrity: async () => {
        set((state) => {
          state.integrityChecking = true
        })

        // This will be implemented with the data integrity service
        try {
          // Placeholder - will be implemented with dataIntegrityService
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          set((state) => {
            state.integrityChecking = false
          })
        } catch (error) {
          set((state) => {
            state.integrityChecking = false
          })
        }
      },

      repairDataIntegrity: async (issueIds: string[], options?: any) => {
        // This will be implemented with the data integrity service
        console.log('Repair data integrity:', issueIds, options)
      },

      // ==================== Audit Trail Actions ====================
      queryAuditTrail: async (query: AuditTrailQuery) => {
        set((state) => {
          state.auditLoading = true
          state.auditFilters = query
        })

        // This will be implemented with the audit trail service
        try {
          // Placeholder - will be implemented with auditTrailService
          await new Promise(resolve => setTimeout(resolve, 500))
          
          set((state) => {
            state.auditLoading = false
            // Update with real data
            state.auditEntries = []
            state.auditTotalCount = 0
          })
        } catch (error) {
          set((state) => {
            state.auditLoading = false
          })
        }
      },

      setAuditFilters: (filters: Partial<AuditTrailQuery>) => {
        set((state) => {
          state.auditFilters = { ...state.auditFilters, ...filters }
        })
      },

      clearAuditFilters: () => {
        set((state) => {
          state.auditFilters = {}
        })
      },

      rollbackOperation: async (entryId: string) => {
        // This will be implemented with the audit trail service
        console.log('Rollback operation:', entryId)
      },

      // ==================== WebSocket Actions ====================
      setConnectionStatus: (status) => {
        set((state) => {
          state.connectionStatus = status
        })
      },

      subscribeToOperation: (operationId: string) => {
        set((state) => {
          state.subscriptions.add(operationId)
        })
      },

      unsubscribeFromOperation: (operationId: string) => {
        set((state) => {
          state.subscriptions.delete(operationId)
        })
      },

      // ==================== UI Actions ====================
      setSelectedOperation: (operationId: string | null) => {
        set((state) => {
          state.selectedOperation = operationId
        })
      },

      showConfirmation: (data: any) => {
        set((state) => {
          state.showConfirmationDialog = true
          state.confirmationData = data
        })
      },

      hideConfirmation: () => {
        set((state) => {
          state.showConfirmationDialog = false
          state.confirmationData = null
        })
      },

      addNotification: (notification) => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const timestamp = new Date().toISOString()
        
        set((state) => {
          state.notifications.push({
            ...notification,
            id,
            timestamp,
          })
        })

        // Auto-remove notification after duration
        if (notification.autoHide !== false) {
          const duration = notification.duration || 5000
          setTimeout(() => {
            get().removeNotification(id)
          }, duration)
        }
      },

      removeNotification: (id: string) => {
        set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id)
        })
      },

      clearNotifications: () => {
        set((state) => {
          state.notifications = []
        })
      },

      // ==================== Optimistic Updates ====================
      optimisticallyUpdateOperation: (operationId: string, updates: Partial<DeletionOperation>) => {
        set((state) => {
          const operation = state.activeOperations.get(operationId)
          if (operation) {
            const updatedOperation = { ...operation, ...updates }
            state.activeOperations.set(operationId, updatedOperation)
          }
        })
      },

      revertOptimisticUpdate: async (operationId: string) => {
        await get().refreshOperationStatus(operationId)
      },

      // ==================== Cleanup Actions ====================
      cleanup: () => {
        set((state) => {
          // Clear completed operations older than 1 hour
          const oneHourAgo = Date.now() - 60 * 60 * 1000
          
          for (const [id, operation] of state.activeOperations) {
            if (operation.status === 'completed' || operation.status === 'failed') {
              const completedTime = new Date(operation.completedAt || operation.failedAt || 0).getTime()
              if (completedTime < oneHourAgo) {
                state.activeOperations.delete(id)
                state.operationProgress.delete(id)
              }
            }
          }

          // Clear old notifications
          const tenMinutesAgo = Date.now() - 10 * 60 * 1000
          state.notifications = state.notifications.filter(
            n => new Date(n.timestamp).getTime() > tenMinutesAgo
          )
        })
      },

      reset: () => {
        set(() => ({ ...initialState }))
      },
    }))
  )
)

// ==================== Store Selectors ====================

// Selector for active operations as array
export const useActiveOperations = () => 
  useCascadeDeletionStore((state) => Array.from(state.activeOperations.values()))

// Selector for operations in specific status
export const useOperationsByStatus = (status: DeletionOperation['status']) =>
  useCascadeDeletionStore((state) => 
    Array.from(state.activeOperations.values()).filter(op => op.status === status)
  )

// Selector for progress of specific operation
export const useOperationProgress = (operationId: string) =>
  useCascadeDeletionStore((state) => state.operationProgress.get(operationId) || null)

// Selector for checking if any operations are running
export const useHasActiveOperations = () =>
  useCascadeDeletionStore((state) => state.activeOperations.size > 0)

// Selector for notifications by type
export const useNotificationsByType = (type?: NotificationMessage['type']) =>
  useCascadeDeletionStore((state) => 
    type ? state.notifications.filter(n => n.type === type) : state.notifications
  )

// ==================== Store Subscriptions ====================

// Subscribe to operation status changes
export const subscribeToOperationChanges = (
  operationId: string,
  callback: (operation: DeletionOperation | null) => void
) => {
  return useCascadeDeletionStore.subscribe(
    (state) => state.activeOperations.get(operationId) || null,
    callback,
    { equalityFn: (a, b) => a?.status === b?.status && a?.completedAt === b?.completedAt }
  )
}

// Subscribe to progress changes
export const subscribeToProgressChanges = (
  operationId: string,
  callback: (progress: DeletionProgress | null) => void
) => {
  return useCascadeDeletionStore.subscribe(
    (state) => state.operationProgress.get(operationId) || null,
    callback,
    { equalityFn: (a, b) => a?.percentage === b?.percentage && a?.phase === b?.phase }
  )
}

// ==================== Store Utilities ====================

// Get store state outside React components
export const getCascadeDeletionState = () => useCascadeDeletionStore.getState()

// Cleanup old data periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    getCascadeDeletionState().cleanup()
  }, 5 * 60 * 1000) // Every 5 minutes
}