/**
 * Error Recovery Utilities
 * 
 * Comprehensive error recovery system for Bagrut forms with:
 * - Local storage backup and recovery
 * - Session restoration
 * - Data validation and repair
 * - Network error handling
 * - Graceful degradation strategies
 */

import { Bagrut, Presentation, ProgramPiece } from '@/types/bagrut.types'

// Storage keys for error recovery
const RECOVERY_KEYS = {
  FORM_BACKUP: 'bagrut_form_backup_',
  SESSION_DATA: 'bagrut_session_data',
  ERROR_LOG: 'bagrut_error_log',
  RECOVERY_ATTEMPTS: 'bagrut_recovery_attempts',
  NETWORK_QUEUE: 'bagrut_network_queue'
}

// Error types for classification
export type ErrorType = 
  | 'network_error'
  | 'validation_error' 
  | 'data_corruption'
  | 'session_expired'
  | 'permission_denied'
  | 'storage_full'
  | 'unknown_error'

export interface RecoveryError {
  id: string
  type: ErrorType
  message: string
  timestamp: Date
  context: {
    studentId?: string
    formSection?: string
    operation?: string
    userAgent?: string
    url?: string
  }
  recoverable: boolean
  attempted: boolean
  resolved: boolean
  data?: any
}

export interface RecoverySession {
  id: string
  studentId: string
  startTime: Date
  lastActivity: Date
  formData: Partial<Bagrut>
  isDirty: boolean
  version: string
  checkpoints: SessionCheckpoint[]
}

export interface SessionCheckpoint {
  id: string
  timestamp: Date
  formData: Partial<Bagrut>
  operation: string
  isValid: boolean
}

export interface RecoveryResult {
  success: boolean
  recoveredData?: Partial<Bagrut>
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface NetworkOperation {
  id: string
  type: 'save' | 'update' | 'delete'
  data: any
  endpoint: string
  timestamp: Date
  retryCount: number
  maxRetries: number
  priority: number
}

class ErrorRecoveryManager {
  private recoveryAttempts = new Map<string, number>()
  private activeSession: RecoverySession | null = null
  private errorLog: RecoveryError[] = []
  private networkQueue: NetworkOperation[] = []

  constructor() {
    this.initializeRecovery()
    this.setupEventListeners()
  }

  private initializeRecovery() {
    // Load existing error log
    try {
      const storedLog = localStorage.getItem(RECOVERY_KEYS.ERROR_LOG)
      if (storedLog) {
        this.errorLog = JSON.parse(storedLog).map((error: any) => ({
          ...error,
          timestamp: new Date(error.timestamp)
        }))
      }
    } catch (error) {
      console.warn('Failed to load error log:', error)
    }

    // Load network queue
    try {
      const storedQueue = localStorage.getItem(RECOVERY_KEYS.NETWORK_QUEUE)
      if (storedQueue) {
        this.networkQueue = JSON.parse(storedQueue).map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }))
      }
    } catch (error) {
      console.warn('Failed to load network queue:', error)
    }

    // Load recovery attempts
    try {
      const storedAttempts = localStorage.getItem(RECOVERY_KEYS.RECOVERY_ATTEMPTS)
      if (storedAttempts) {
        const attemptsData = JSON.parse(storedAttempts)
        this.recoveryAttempts = new Map(Object.entries(attemptsData))
      }
    } catch (error) {
      console.warn('Failed to load recovery attempts:', error)
    }
  }

  private setupEventListeners() {
    // Handle page unload - create emergency backup
    window.addEventListener('beforeunload', () => {
      if (this.activeSession && this.activeSession.isDirty) {
        this.createEmergencyBackup(this.activeSession)
      }
    })

    // Handle online/offline events
    window.addEventListener('online', () => {
      this.processNetworkQueue()
    })

    window.addEventListener('offline', () => {
      console.log('Offline mode - operations will be queued')
    })

    // Handle errors globally
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'unknown_error',
        message: event.message || 'Unknown JavaScript error',
        context: {
          url: event.filename,
          userAgent: navigator.userAgent
        },
        recoverable: false,
        data: {
          error: event.error?.stack,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unknown_error',
        message: `Unhandled promise rejection: ${event.reason}`,
        context: {
          userAgent: navigator.userAgent
        },
        recoverable: false,
        data: { reason: event.reason }
      })
    })
  }

  // Session Management
  startSession(studentId: string, initialData?: Partial<Bagrut>): RecoverySession {
    const sessionId = `session_${studentId}_${Date.now()}`
    
    this.activeSession = {
      id: sessionId,
      studentId,
      startTime: new Date(),
      lastActivity: new Date(),
      formData: initialData || {},
      isDirty: false,
      version: '1.0.0',
      checkpoints: []
    }

    this.saveSessionData()
    return this.activeSession
  }

  updateSession(formData: Partial<Bagrut>, operation = 'update') {
    if (!this.activeSession) return

    this.activeSession.formData = formData
    this.activeSession.lastActivity = new Date()
    this.activeSession.isDirty = true

    // Create checkpoint for significant operations
    if (['save', 'complete_presentation', 'finalize_grades'].includes(operation)) {
      this.createCheckpoint(operation, formData)
    }

    this.saveSessionData()
    this.createFormBackup(formData)
  }

  endSession() {
    if (this.activeSession) {
      // Clear backups for successful completion
      this.clearFormBackup(this.activeSession.studentId)
      this.activeSession = null
      localStorage.removeItem(RECOVERY_KEYS.SESSION_DATA)
    }
  }

  // Backup and Recovery
  private createFormBackup(formData: Partial<Bagrut>) {
    if (!this.activeSession) return

    try {
      const backupKey = RECOVERY_KEYS.FORM_BACKUP + this.activeSession.studentId
      const backupData = {
        formData,
        timestamp: new Date().toISOString(),
        sessionId: this.activeSession.id,
        version: this.activeSession.version
      }

      localStorage.setItem(backupKey, JSON.stringify(backupData))
    } catch (error) {
      console.error('Failed to create form backup:', error)
      this.logError({
        type: 'storage_full',
        message: 'Failed to create form backup',
        context: { studentId: this.activeSession.studentId },
        recoverable: true,
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }

  private createEmergencyBackup(session: RecoverySession) {
    try {
      const emergencyKey = `emergency_backup_${session.studentId}_${Date.now()}`
      const backupData = {
        session,
        timestamp: new Date().toISOString(),
        type: 'emergency'
      }

      localStorage.setItem(emergencyKey, JSON.stringify(backupData))
    } catch (error) {
      console.error('Failed to create emergency backup:', error)
    }
  }

  checkForRecoverableData(studentId: string): RecoveryResult {
    const result: RecoveryResult = {
      success: false,
      errors: [],
      warnings: [],
      suggestions: []
    }

    try {
      // Check for regular backup
      const backupKey = RECOVERY_KEYS.FORM_BACKUP + studentId
      const backupData = localStorage.getItem(backupKey)
      
      if (backupData) {
        const parsed = JSON.parse(backupData)
        const backupAge = Date.now() - new Date(parsed.timestamp).getTime()
        
        if (backupAge < 24 * 60 * 60 * 1000) { // Less than 24 hours old
          result.success = true
          result.recoveredData = parsed.formData
          result.suggestions.push(`נמצא גיבוי מ-${new Date(parsed.timestamp).toLocaleString('he-IL')}`)
        } else {
          result.warnings.push('הגיבוי ישן מדי (יותר מ-24 שעות)')
        }
      }

      // Check for emergency backups
      const emergencyBackups = this.findEmergencyBackups(studentId)
      if (emergencyBackups.length > 0) {
        const mostRecent = emergencyBackups[0]
        if (!result.recoveredData) {
          result.success = true
          result.recoveredData = mostRecent.session.formData
        }
        result.suggestions.push(`נמצאו ${emergencyBackups.length} גיבויי חירום`)
      }

      // Check session data
      const sessionData = localStorage.getItem(RECOVERY_KEYS.SESSION_DATA)
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        if (parsed.studentId === studentId && parsed.isDirty) {
          if (!result.recoveredData) {
            result.success = true
            result.recoveredData = parsed.formData
          }
          result.suggestions.push('נמצאה סשן פעילה עם שינויים לא שמורים')
        }
      }

      return result
    } catch (error) {
      result.errors.push(`שגיאה בבדיקת נתונים לשחזור: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`)
      return result
    }
  }

  private findEmergencyBackups(studentId: string): any[] {
    const backups: any[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(`emergency_backup_${studentId}_`)) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const parsed = JSON.parse(data)
            backups.push(parsed)
          }
        } catch (error) {
          console.warn('Failed to parse emergency backup:', error)
        }
      }
    }

    // Sort by timestamp, most recent first
    return backups.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  recoverData(studentId: string): Partial<Bagrut> | null {
    const recoveryResult = this.checkForRecoverableData(studentId)
    
    if (recoveryResult.success && recoveryResult.recoveredData) {
      // Validate recovered data
      const validatedData = this.validateAndRepairData(recoveryResult.recoveredData)
      
      // Clear old backups after successful recovery
      this.clearFormBackup(studentId)
      this.clearEmergencyBackups(studentId)
      
      return validatedData
    }

    return null
  }

  private validateAndRepairData(data: Partial<Bagrut>): Partial<Bagrut> {
    const repaired = { ...data }

    try {
      // Repair presentations array
      if (repaired.presentations) {
        repaired.presentations = repaired.presentations.map((presentation, index) => {
          const repairedPresentation: Presentation = {
            completed: presentation.completed || false,
            status: presentation.status || 'pending',
            notes: presentation.notes || '',
            recordingLinks: Array.isArray(presentation.recordingLinks) 
              ? presentation.recordingLinks 
              : [],
            ...presentation
          }

          // Ensure dates are valid
          if (presentation.date && typeof presentation.date === 'string') {
            try {
              repairedPresentation.date = new Date(presentation.date)
            } catch {
              delete repairedPresentation.date
            }
          }

          return repairedPresentation
        })

        // Ensure we have 4 presentations
        while (repaired.presentations.length < 4) {
          repaired.presentations.push({
            completed: false,
            status: 'pending',
            notes: '',
            recordingLinks: []
          })
        }
      }

      // Repair program array
      if (repaired.program) {
        repaired.program = repaired.program.filter((piece): piece is ProgramPiece => 
          piece && typeof piece === 'object' && 
          (piece.pieceTitle || piece.composer || piece.duration)
        )
      } else {
        repaired.program = []
      }

      // Ensure required fields
      if (!repaired.recitalUnits) {
        repaired.recitalUnits = 3
      }

      if (!repaired.recitalField) {
        repaired.recitalField = 'קלאסי'
      }

      // Update timestamps
      repaired.updatedAt = new Date()

      return repaired
    } catch (error) {
      console.error('Data repair failed:', error)
      return data // Return original data if repair fails
    }
  }

  // Checkpoint Management
  private createCheckpoint(operation: string, formData: Partial<Bagrut>) {
    if (!this.activeSession) return

    const checkpoint: SessionCheckpoint = {
      id: `checkpoint_${Date.now()}`,
      timestamp: new Date(),
      formData: JSON.parse(JSON.stringify(formData)), // Deep copy
      operation,
      isValid: this.isValidFormData(formData)
    }

    this.activeSession.checkpoints.push(checkpoint)

    // Keep only last 10 checkpoints
    if (this.activeSession.checkpoints.length > 10) {
      this.activeSession.checkpoints = this.activeSession.checkpoints.slice(-10)
    }

    this.saveSessionData()
  }

  restoreCheckpoint(checkpointId: string): Partial<Bagrut> | null {
    if (!this.activeSession) return null

    const checkpoint = this.activeSession.checkpoints.find(cp => cp.id === checkpointId)
    if (!checkpoint) return null

    return checkpoint.formData
  }

  getCheckpoints(): SessionCheckpoint[] {
    return this.activeSession?.checkpoints || []
  }

  // Error Logging and Management
  logError(errorData: Omit<RecoveryError, 'id' | 'timestamp' | 'attempted' | 'resolved'>) {
    const error: RecoveryError = {
      ...errorData,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      attempted: false,
      resolved: false
    }

    this.errorLog.push(error)

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100)
    }

    // Save to localStorage
    try {
      localStorage.setItem(RECOVERY_KEYS.ERROR_LOG, JSON.stringify(this.errorLog))
    } catch (storageError) {
      console.error('Failed to save error log:', storageError)
    }

    console.error('Logged recovery error:', error)
  }

  getRecentErrors(): RecoveryError[] {
    return this.errorLog
      .filter(error => Date.now() - error.timestamp.getTime() < 24 * 60 * 60 * 1000)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  markErrorAsAttempted(errorId: string) {
    const error = this.errorLog.find(e => e.id === errorId)
    if (error) {
      error.attempted = true
      this.incrementRecoveryAttempt(errorId)
    }
  }

  markErrorAsResolved(errorId: string) {
    const error = this.errorLog.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
    }
  }

  private incrementRecoveryAttempt(errorId: string) {
    const currentAttempts = this.recoveryAttempts.get(errorId) || 0
    this.recoveryAttempts.set(errorId, currentAttempts + 1)
    
    // Save to localStorage
    const attemptsObj = Object.fromEntries(this.recoveryAttempts)
    localStorage.setItem(RECOVERY_KEYS.RECOVERY_ATTEMPTS, JSON.stringify(attemptsObj))
  }

  // Network Queue Management
  queueNetworkOperation(operation: Omit<NetworkOperation, 'id' | 'timestamp' | 'retryCount'>) {
    const queuedOperation: NetworkOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0
    }

    this.networkQueue.push(queuedOperation)
    this.networkQueue.sort((a, b) => b.priority - a.priority) // Sort by priority

    // Save to localStorage
    try {
      localStorage.setItem(RECOVERY_KEYS.NETWORK_QUEUE, JSON.stringify(this.networkQueue))
    } catch (error) {
      console.error('Failed to save network queue:', error)
    }
  }

  private async processNetworkQueue() {
    if (!navigator.onLine || this.networkQueue.length === 0) return

    const operationsToProcess = [...this.networkQueue]
    
    for (const operation of operationsToProcess) {
      try {
        await this.executeNetworkOperation(operation)
        
        // Remove from queue on success
        this.networkQueue = this.networkQueue.filter(op => op.id !== operation.id)
      } catch (error) {
        operation.retryCount++
        
        if (operation.retryCount >= operation.maxRetries) {
          // Remove after max retries
          this.networkQueue = this.networkQueue.filter(op => op.id !== operation.id)
          
          this.logError({
            type: 'network_error',
            message: `Network operation failed after ${operation.maxRetries} retries`,
            context: { operation: operation.type },
            recoverable: false,
            data: { operation }
          })
        }
      }
    }

    // Update localStorage
    try {
      localStorage.setItem(RECOVERY_KEYS.NETWORK_QUEUE, JSON.stringify(this.networkQueue))
    } catch (error) {
      console.error('Failed to update network queue:', error)
    }
  }

  private async executeNetworkOperation(operation: NetworkOperation): Promise<void> {
    // This would contain the actual network call logic
    // For now, simulate the operation
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve(undefined)
        } else {
          reject(new Error('Simulated network error'))
        }
      }, 1000)
    })
  }

  // Utility methods
  private saveSessionData() {
    if (this.activeSession) {
      try {
        localStorage.setItem(RECOVERY_KEYS.SESSION_DATA, JSON.stringify(this.activeSession))
      } catch (error) {
        console.error('Failed to save session data:', error)
      }
    }
  }

  private clearFormBackup(studentId: string) {
    const backupKey = RECOVERY_KEYS.FORM_BACKUP + studentId
    localStorage.removeItem(backupKey)
  }

  private clearEmergencyBackups(studentId: string) {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(`emergency_backup_${studentId}_`)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  private isValidFormData(data: Partial<Bagrut>): boolean {
    try {
      // Basic validation checks
      return !!(data.studentId && data.teacherId)
    } catch {
      return false
    }
  }

  // Public API for cleanup
  clearAllRecoveryData(studentId?: string) {
    if (studentId) {
      this.clearFormBackup(studentId)
      this.clearEmergencyBackups(studentId)
    } else {
      // Clear all recovery data
      Object.values(RECOVERY_KEYS).forEach(key => {
        if (key.endsWith('_')) {
          // For keys with suffixes, clear all variations
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const storageKey = localStorage.key(i)
            if (storageKey?.startsWith(key)) {
              localStorage.removeItem(storageKey)
            }
          }
        } else {
          localStorage.removeItem(key)
        }
      })
    }
  }

  getRecoveryStats() {
    return {
      activeSession: !!this.activeSession,
      errorCount: this.errorLog.length,
      networkQueueSize: this.networkQueue.length,
      totalRecoveryAttempts: Array.from(this.recoveryAttempts.values()).reduce((sum, count) => sum + count, 0),
      hasRecoverableData: (studentId: string) => {
        const result = this.checkForRecoverableData(studentId)
        return result.success
      }
    }
  }
}

// Singleton instance
export const errorRecoveryManager = new ErrorRecoveryManager()

export default errorRecoveryManager