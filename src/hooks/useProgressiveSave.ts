/**
 * Progressive Save Hook
 * 
 * Advanced saving mechanism with:
 * - Progressive chunked saves
 * - Conflict resolution
 * - Offline support
 * - Error recovery
 * - Validation before save
 */

import { useState, useCallback, useRef, useEffect } from 'react'

interface ProgressiveSaveOptions {
  chunkSize?: number
  saveInterval?: number
  maxRetries?: number
  enableOffline?: boolean
  enableConflictResolution?: boolean
  enableValidation?: boolean
  onProgress?: (progress: SaveProgress) => void
  onConflict?: (conflict: SaveConflict) => Promise<ConflictResolution>
  onError?: (error: SaveError) => void
}

interface SaveProgress {
  totalChunks: number
  savedChunks: number
  currentChunk: number
  percentage: number
  bytesTotal: number
  bytesSaved: number
  estimatedTimeRemaining?: number
  stage: 'preparing' | 'saving' | 'verifying' | 'completed' | 'error'
}

interface SaveConflict {
  id: string
  localVersion: any
  serverVersion: any
  lastModified: Date
  conflictFields: string[]
}

interface ConflictResolution {
  action: 'use_local' | 'use_server' | 'merge' | 'abort'
  mergedData?: any
}

interface SaveError {
  type: 'network' | 'validation' | 'conflict' | 'storage' | 'unknown'
  message: string
  retryable: boolean
  chunk?: number
  field?: string
}

interface SaveState {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'conflict'
  progress: SaveProgress | null
  error: SaveError | null
  conflict: SaveConflict | null
  lastSaved: Date | null
  pendingChanges: boolean
  isOnline: boolean
}

interface SaveOperation {
  id: string
  data: any
  timestamp: Date
  chunks: any[]
  retryCount: number
  priority: number
}

// Local storage keys
const STORAGE_KEYS = {
  PENDING_SAVES: 'bagrut_pending_saves',
  OFFLINE_QUEUE: 'bagrut_offline_queue',
  LAST_SYNC: 'bagrut_last_sync',
  VERSION_CACHE: 'bagrut_version_cache'
}

export function useProgressiveSave<T>(
  initialData: T,
  saveFunction: (data: T) => Promise<{ success: boolean; version?: string; conflicts?: SaveConflict[] }>,
  options: ProgressiveSaveOptions = {}
) {
  const {
    chunkSize = 10,
    saveInterval = 5000,
    maxRetries = 3,
    enableOffline = true,
    enableConflictResolution = true,
    enableValidation = true,
    onProgress,
    onConflict,
    onError
  } = options

  const [saveState, setSaveState] = useState<SaveState>({
    status: 'idle',
    progress: null,
    error: null,
    conflict: null,
    lastSaved: null,
    pendingChanges: false,
    isOnline: navigator.onLine
  })

  const [data, setData] = useState<T>(initialData)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const saveOperationRef = useRef<SaveOperation | null>(null)
  const lastSavedDataRef = useRef<T>(initialData)
  const versionRef = useRef<string | null>(null)

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setSaveState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setSaveState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Process offline queue when online
  useEffect(() => {
    if (saveState.isOnline) {
      processOfflineQueue()
    }
  }, [saveState.isOnline])

  // Auto-save trigger
  useEffect(() => {
    const hasChanges = JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current)
    
    setSaveState(prev => ({ ...prev, pendingChanges: hasChanges }))

    if (hasChanges && saveState.status !== 'saving') {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        performSave(data)
      }, saveInterval)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [data, saveInterval, saveState.status])

  // Data chunking utility
  const chunkData = useCallback((dataToChunk: T): any[] => {
    // Convert data to array of field chunks for progressive saving
    const entries = Object.entries(dataToChunk as any)
    const chunks: any[] = []
    
    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = Object.fromEntries(entries.slice(i, i + chunkSize))
      chunks.push({
        index: Math.floor(i / chunkSize),
        data: chunk,
        size: JSON.stringify(chunk).length
      })
    }
    
    return chunks
  }, [chunkSize])

  // Validation before save
  const validateData = useCallback(async (dataToValidate: T): Promise<{ valid: boolean; errors: string[] }> => {
    if (!enableValidation) return { valid: true, errors: [] }

    const errors: string[] = []

    try {
      // Basic validation checks
      if (!dataToValidate) {
        errors.push('Data cannot be empty')
      }

      // Add custom validation logic here
      // For Bagrut data, check required fields, format, etc.
      const bagrutData = dataToValidate as any
      
      if (bagrutData.studentId && !bagrutData.studentId.trim()) {
        errors.push('Student ID is required')
      }

      if (bagrutData.presentations) {
        bagrutData.presentations.forEach((presentation: any, index: number) => {
          if (presentation.completed && !presentation.date) {
            errors.push(`Presentation ${index + 1} is marked complete but missing date`)
          }
        })
      }

      return { valid: errors.length === 0, errors }
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { valid: false, errors }
    }
  }, [enableValidation])

  // Main save function
  const performSave = useCallback(async (dataToSave: T, isManual = false) => {
    if (saveState.status === 'saving') return

    try {
      setSaveState(prev => ({ ...prev, status: 'saving', error: null, conflict: null }))

      // Validation
      const validation = await validateData(dataToSave)
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Check if online for immediate save
      if (!saveState.isOnline && enableOffline) {
        await queueOfflineSave(dataToSave)
        return
      }

      // Chunk the data
      const chunks = chunkData(dataToSave)
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
      
      const initialProgress: SaveProgress = {
        totalChunks: chunks.length,
        savedChunks: 0,
        currentChunk: 0,
        percentage: 0,
        bytesTotal: totalSize,
        bytesSaved: 0,
        stage: 'preparing'
      }

      setSaveState(prev => ({ ...prev, progress: initialProgress }))
      onProgress?.(initialProgress)

      // Create save operation
      const operation: SaveOperation = {
        id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: dataToSave,
        timestamp: new Date(),
        chunks,
        retryCount: 0,
        priority: isManual ? 1 : 0
      }

      saveOperationRef.current = operation

      // Progressive save chunks
      let savedChunks = 0
      let bytesSaved = 0
      const startTime = Date.now()

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        
        const chunkProgress: SaveProgress = {
          totalChunks: chunks.length,
          savedChunks,
          currentChunk: i,
          percentage: (i / chunks.length) * 100,
          bytesTotal: totalSize,
          bytesSaved,
          stage: 'saving',
          estimatedTimeRemaining: calculateETA(startTime, i, chunks.length)
        }

        setSaveState(prev => ({ ...prev, progress: chunkProgress }))
        onProgress?.(chunkProgress)

        // Simulate chunk save (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 100))
        
        savedChunks++
        bytesSaved += chunk.size
      }

      // Final save call
      const saveResult = await saveFunction(dataToSave)
      
      if (!saveResult.success) {
        throw new Error('Save operation failed')
      }

      // Handle conflicts
      if (saveResult.conflicts && saveResult.conflicts.length > 0) {
        if (enableConflictResolution && onConflict) {
          const conflict = saveResult.conflicts[0]
          setSaveState(prev => ({ ...prev, status: 'conflict', conflict }))
          
          const resolution = await onConflict(conflict)
          await handleConflictResolution(resolution, conflict)
          return
        } else {
          throw new Error('Data conflicts detected')
        }
      }

      // Update version and complete save
      versionRef.current = saveResult.version || null
      lastSavedDataRef.current = dataToSave

      const finalProgress: SaveProgress = {
        totalChunks: chunks.length,
        savedChunks: chunks.length,
        currentChunk: chunks.length - 1,
        percentage: 100,
        bytesTotal: totalSize,
        bytesSaved: totalSize,
        stage: 'completed'
      }

      setSaveState(prev => ({
        ...prev,
        status: 'saved',
        progress: finalProgress,
        lastSaved: new Date(),
        pendingChanges: false
      }))

      onProgress?.(finalProgress)

    } catch (error) {
      const saveError: SaveError = {
        type: error instanceof Error && error.message.includes('network') ? 'network' : 'unknown',
        message: error instanceof Error ? error.message : 'Unknown save error',
        retryable: true
      }

      setSaveState(prev => ({ ...prev, status: 'error', error: saveError }))
      onError?.(saveError)

      // Queue for offline if network error
      if (saveError.type === 'network' && enableOffline) {
        await queueOfflineSave(dataToSave)
      }
    }
  }, [saveState, validateData, chunkData, saveFunction, enableOffline, enableConflictResolution, onProgress, onConflict, onError])

  // Handle conflict resolution
  const handleConflictResolution = useCallback(async (
    resolution: ConflictResolution,
    conflict: SaveConflict
  ) => {
    try {
      let resolvedData: T

      switch (resolution.action) {
        case 'use_local':
          resolvedData = conflict.localVersion
          break
        case 'use_server':
          resolvedData = conflict.serverVersion
          setData(conflict.serverVersion)
          break
        case 'merge':
          resolvedData = resolution.mergedData || conflict.localVersion
          setData(resolvedData)
          break
        case 'abort':
          setSaveState(prev => ({ ...prev, status: 'idle', conflict: null }))
          return
      }

      // Retry save with resolved data
      await performSave(resolvedData, true)
      
    } catch (error) {
      const saveError: SaveError = {
        type: 'conflict',
        message: `Conflict resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        retryable: false
      }
      
      setSaveState(prev => ({ ...prev, status: 'error', error: saveError }))
      onError?.(saveError)
    }
  }, [performSave, onError])

  // Offline queue management
  const queueOfflineSave = useCallback(async (dataToQueue: T) => {
    try {
      const offlineQueue = getOfflineQueue()
      const queueItem = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: dataToQueue,
        timestamp: new Date(),
        retryCount: 0
      }

      offlineQueue.push(queueItem)
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue))
      
      setSaveState(prev => ({
        ...prev,
        status: 'saved',
        lastSaved: new Date(),
        pendingChanges: false
      }))

    } catch (error) {
      console.error('Failed to queue offline save:', error)
    }
  }, [])

  // Process offline queue
  const processOfflineQueue = useCallback(async () => {
    const offlineQueue = getOfflineQueue()
    if (offlineQueue.length === 0) return

    for (const item of offlineQueue) {
      try {
        await performSave(item.data, true)
        // Remove from queue on successful save
        const updatedQueue = offlineQueue.filter(q => q.id !== item.id)
        localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updatedQueue))
      } catch (error) {
        console.error('Failed to process offline item:', error)
        // Increment retry count
        item.retryCount++
        if (item.retryCount >= maxRetries) {
          // Remove failed items after max retries
          const updatedQueue = offlineQueue.filter(q => q.id !== item.id)
          localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updatedQueue))
        }
      }
    }
  }, [performSave, maxRetries])

  // Manual save
  const saveManually = useCallback(async () => {
    await performSave(data, true)
  }, [data, performSave])

  // Retry failed save
  const retrySave = useCallback(async () => {
    if (saveState.error?.retryable) {
      await performSave(data, true)
    }
  }, [data, performSave, saveState.error])

  // Update data
  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    setData(prev => typeof newData === 'function' ? (newData as Function)(prev) : newData)
  }, [])

  // Reset save state
  const reset = useCallback(() => {
    setSaveState({
      status: 'idle',
      progress: null,
      error: null,
      conflict: null,
      lastSaved: null,
      pendingChanges: false,
      isOnline: navigator.onLine
    })
  }, [])

  // Utility functions
  const getOfflineQueue = (): any[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const calculateETA = (startTime: number, currentIndex: number, totalItems: number): number | undefined => {
    if (currentIndex === 0) return undefined
    
    const elapsed = Date.now() - startTime
    const rate = currentIndex / elapsed // items per ms
    const remaining = totalItems - currentIndex
    
    return Math.round(remaining / rate)
  }

  return {
    // State
    data,
    saveState,
    
    // Actions
    updateData,
    saveManually,
    retrySave,
    reset,
    
    // Status checks
    hasUnsavedChanges: saveState.pendingChanges,
    isSaving: saveState.status === 'saving',
    hasError: saveState.status === 'error',
    hasConflict: saveState.status === 'conflict',
    isOnline: saveState.isOnline,
    
    // Offline queue info
    offlineQueueSize: getOfflineQueue().length
  }
}

export default useProgressiveSave