/**
 * Type definitions for cascade deletion system
 */

export interface DeletionImpact {
  entityType: string
  entityId: string
  entityName: string
  relatedRecords: RelatedRecord[]
  orphanedReferences: OrphanedReference[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  canDelete: boolean
  warnings: string[]
  estimatedTime: number // in seconds
}

export interface RelatedRecord {
  type: 'lesson' | 'attendance' | 'document' | 'orchestra' | 'theory_class' | 'enrollment'
  id: string
  name: string
  count: number
  action: 'delete' | 'orphan' | 'reassign' | 'archive'
  details?: Record<string, any>
}

export interface OrphanedReference {
  table: string
  field: string
  count: number
  canCleanup: boolean
  cleanupMethod: 'delete' | 'nullify' | 'default_value'
  defaultValue?: any
}

export interface DeletionOperation {
  id: string
  entityType: string
  entityId: string
  entityName: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  currentStep: string
  totalSteps: number
  startTime?: Date
  endTime?: Date
  error?: string
  impact: DeletionImpact
  rollbackAvailable: boolean
}

export interface AuditLogEntry {
  id: string
  timestamp: Date
  action: 'delete' | 'cascade_delete' | 'orphan_cleanup' | 'rollback'
  entityType: string
  entityId: string
  entityName: string
  userId: string
  userName: string
  details: Record<string, any>
  rollbackData?: Record<string, any>
  canRollback: boolean
}

export interface DataIntegrityStatus {
  orphanedCount: number
  lastCleanup: Date | null
  pendingOperations: number
  healthScore: number // 0-100
  issues: IntegrityIssue[]
}

export interface IntegrityIssue {
  id: string
  type: 'orphaned_reference' | 'missing_required' | 'constraint_violation'
  table: string
  field?: string
  count: number
  severity: 'low' | 'medium' | 'high'
  canAutoFix: boolean
  description: string
}

export interface DeletionFormData {
  confirmationText: string
  reassignments: Record<string, string>
  cleanupOptions: {
    orphanedReferences: boolean
    relatedDocuments: boolean
    attendanceRecords: boolean
  }
  reason?: string
}

export interface BatchOperation {
  id: string
  type: 'cleanup_orphans' | 'bulk_delete' | 'integrity_check'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  totalItems: number
  processedItems: number
  startTime?: Date
  endTime?: Date
  results?: {
    successful: number
    failed: number
    skipped: number
    errors: Array<{ item: string; error: string }>
  }
}

// Additional types for enhanced functionality
export interface DeletionStep {
  id: string
  label: string
  description?: string
  status: 'pending' | 'current' | 'completed' | 'error'
  startTime?: Date
  endTime?: Date
  details?: Record<string, any>
}

export interface PerformanceMetrics {
  itemsPerSecond: number
  estimatedTimeRemaining: number
  totalElapsedTime: number
  averageStepDuration: number
  memoryUsage?: number
  cpuUsage?: number
}

export interface DeletionWarning {
  id: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  canProceed: boolean
  suggestions?: string[]
}

export interface RollbackOperation {
  id: string
  originalOperationId: string
  timestamp: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  restoredRecords: number
  failedRecords: number
  error?: string
}

export interface DeletionPolicy {
  entityType: string
  requiresConfirmation: boolean
  allowsBulkDeletion: boolean
  retentionPeriod: number // days
  cascadeSettings: {
    [relatedType: string]: 'delete' | 'orphan' | 'archive' | 'reassign'
  }
  backupRequired: boolean
  approvalRequired: boolean
}

export interface SystemIntegrityReport {
  timestamp: Date
  overallScore: number
  categories: {
    [category: string]: {
      score: number
      issues: IntegrityIssue[]
      recommendations: string[]
    }
  }
  trends: {
    date: Date
    score: number
  }[]
  nextCheckDue: Date
}

export interface DeletionSchedule {
  id: string
  entityType: string
  criteria: Record<string, any>
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  nextExecution: Date
  enabled: boolean
  dryRun: boolean
  notifications: string[]
}