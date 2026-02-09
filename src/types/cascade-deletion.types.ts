/**
 * TypeScript interfaces for cascade deletion system
 * Defines all data structures for deletion operations, progress tracking, and audit trails
 */

// ==================== Core Deletion Types ====================

export interface DeletionOperation {
  id: string
  entityType: 'student' | 'teacher' | 'orchestra' | 'rehearsal' | 'theory_lesson' | 'bagrut'
  entityId: string
  entityName?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  createdAt: string
  startedAt?: string
  completedAt?: string
  failedAt?: string
  error?: string
  userId: string
  userName?: string
  metadata?: Record<string, any>
}

export interface DeletionImpact {
  entityType: string
  entityId: string
  entityName?: string
  dependents: DependentEntity[]
  totalAffectedCount: number
  cascadeDepth: number
  warnings: DeletionWarning[]
  canDelete: boolean
  requiresConfirmation: boolean
}

export interface DependentEntity {
  id: string
  type: string
  name: string
  relationshipType: 'direct' | 'indirect'
  cascadeAction: 'delete' | 'nullify' | 'restrict' | 'set_default'
  affectedCount: number
  children?: DependentEntity[]
  metadata?: {
    tableName?: string
    foreignKey?: string
    constraint?: string
  }
}

export interface DeletionWarning {
  type: 'data_loss' | 'integrity_risk' | 'permission_required' | 'active_dependencies'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  affectedEntity?: {
    type: string
    id: string
    name?: string
  }
  details?: Record<string, any>
}

// ==================== Progress Tracking ====================

export interface DeletionProgress {
  operationId: string
  phase: 'analyzing' | 'validating' | 'deleting' | 'cleaning_up' | 'completed' | 'failed'
  currentStep: string
  totalSteps: number
  completedSteps: number
  percentage: number
  estimatedTimeRemaining?: number
  startedAt: string
  lastUpdatedAt: string
  processedEntities: ProcessedEntity[]
  errors: DeletionError[]
  warnings: DeletionWarning[]
}

export interface ProcessedEntity {
  type: string
  id: string
  name?: string
  action: 'deleted' | 'nullified' | 'skipped' | 'failed'
  timestamp: string
  error?: string
}

export interface DeletionError {
  entityType: string
  entityId: string
  entityName?: string
  error: string
  code?: string
  timestamp: string
  recoverable: boolean
  retryCount?: number
}

// ==================== Data Integrity Types ====================

export interface DataIntegrityStatus {
  lastCheckedAt: string
  overallHealth: 'healthy' | 'warning' | 'critical'
  issues: IntegrityIssue[]
  totalOrphanedReferences: number
  totalBrokenConstraints: number
  checksPerformed: string[]
  nextScheduledCheck?: string
}

export interface IntegrityIssue {
  id: string
  type: 'orphaned_reference' | 'broken_constraint' | 'missing_cascade' | 'data_inconsistency'
  severity: 'low' | 'medium' | 'high' | 'critical'
  tableName: string
  columnName?: string
  constraint?: string
  description: string
  affectedRecords: number
  sampleRecordIds: string[]
  repairSuggestion?: string
  canAutoRepair: boolean
  detectedAt: string
}

export interface RepairOperation {
  id: string
  issueIds: string[]
  type: 'auto' | 'manual' | 'batch'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  startedAt?: string
  completedAt?: string
  repairedCount: number
  failedCount: number
  errors: string[]
  userId: string
}

// ==================== Audit Trail Types ====================

export interface AuditLogEntry {
  id: string
  timestamp: string
  action: string
  entityType: string
  entityId: string
  entityName?: string
  userId: string
  userName?: string
  userRole?: string
  changes?: AuditChange[]
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  rollbackable: boolean
}

export interface AuditChange {
  field: string
  oldValue: any
  newValue: any
  changeType: 'create' | 'update' | 'delete' | 'cascade'
}

export interface AuditTrailQuery {
  startDate?: string
  endDate?: string
  entityType?: string
  entityId?: string
  userId?: string
  action?: string
  rollbackable?: boolean
  limit?: number
  offset?: number
  sortBy?: 'timestamp' | 'entityType' | 'action' | 'userId'
  sortOrder?: 'asc' | 'desc'
}

export interface AuditTrailResponse {
  entries: AuditLogEntry[]
  totalCount: number
  hasMore: boolean
  nextOffset?: number
}

export interface RollbackOperation {
  id: string
  targetEntryId: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  rollbackType: 'single' | 'cascade' | 'batch'
  affectedEntries: string[]
  startedAt?: string
  completedAt?: string
  error?: string
  userId: string
  confirmationRequired: boolean
}

// ==================== WebSocket Message Types ====================

export interface DeletionProgressMessage {
  type: 'deletion_progress'
  operationId: string
  progress: DeletionProgress
  timestamp: string
}

export interface DeletionCompleteMessage {
  type: 'deletion_complete'
  operationId: string
  result: {
    success: boolean
    deletedCount: number
    affectedEntities: ProcessedEntity[]
    errors: DeletionError[]
    duration: number
  }
  timestamp: string
}

export interface DeletionErrorMessage {
  type: 'deletion_error'
  operationId: string
  error: {
    message: string
    code?: string
    phase: string
    recoverable: boolean
  }
  timestamp: string
}

export interface IntegrityUpdateMessage {
  type: 'integrity_update'
  status: DataIntegrityStatus
  timestamp: string
}

// ==================== API Request/Response Types ====================

export interface CascadeDeletionPreviewRequest {
  entityType: string
  entityId: string
  options?: {
    includeIndirect?: boolean
    maxDepth?: number
    dryRun?: boolean
  }
}

export interface CascadeDeletionPreviewResponse {
  impact: DeletionImpact
  operationId: string
  estimatedDuration?: number
  requiredPermissions: string[]
}

export interface CascadeDeletionExecuteRequest {
  operationId: string
  confirmationToken?: string
  options?: {
    skipWarnings?: boolean
    batchSize?: number
    continueOnError?: boolean
  }
}

export interface CascadeDeletionExecuteResponse {
  operationId: string
  status: 'started' | 'queued'
  estimatedDuration?: number
  websocketChannel: string
}

export interface DataIntegrityRepairRequest {
  issueIds: string[]
  repairType: 'auto' | 'manual'
  options?: {
    batchSize?: number
    continueOnError?: boolean
  }
}

export interface AuditTrailExportRequest {
  query: AuditTrailQuery
  format: 'json' | 'csv' | 'excel'
  includeChanges?: boolean
}

export interface AuditTrailExportResponse {
  exportId: string
  downloadUrl: string
  expiresAt: string
  recordCount: number
}

// ==================== Store State Types ====================

export interface CascadeDeletionState {
  // Current operations
  activeOperations: Map<string, DeletionOperation>
  operationProgress: Map<string, DeletionProgress>
  
  // Preview state
  currentPreview: DeletionImpact | null
  previewLoading: boolean
  previewError: string | null
  
  // Deletion state
  isDeleting: boolean
  deletionQueue: string[]
  
  // Data integrity
  integrityStatus: DataIntegrityStatus | null
  integrityChecking: boolean
  repairOperations: Map<string, RepairOperation>
  
  // Audit trail
  auditEntries: AuditLogEntry[]
  auditLoading: boolean
  auditFilters: AuditTrailQuery
  auditTotalCount: number
  
  // WebSocket
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  subscriptions: Set<string>
  
  // UI state
  selectedOperation: string | null
  showConfirmationDialog: boolean
  confirmationData: any
  notifications: NotificationMessage[]
}

export interface NotificationMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  autoHide?: boolean
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// ==================== Hook Return Types ====================

export interface UseCascadeDeletionReturn {
  // Preview operations
  previewDeletion: (entityType: string, entityId: string) => Promise<DeletionImpact>
  previewLoading: boolean
  previewError: string | null
  previewData: DeletionImpact | null
  
  // Execution operations
  executeDeletion: (operationId: string, options?: any) => Promise<void>
  cancelOperation: (operationId: string) => Promise<void>
  
  // Progress tracking
  getOperationProgress: (operationId: string) => DeletionProgress | null
  subscribeToProgress: (operationId: string) => () => void
  
  // State
  activeOperations: DeletionOperation[]
  isDeleting: boolean
}

export interface UseDataIntegrityReturn {
  // Status operations
  checkIntegrity: () => Promise<DataIntegrityStatus>
  status: DataIntegrityStatus | null
  isChecking: boolean
  
  // Repair operations
  repairIssues: (issueIds: string[], options?: any) => Promise<void>
  repairOperations: RepairOperation[]
  
  // Auto-scheduling
  scheduleCheck: (interval: number) => void
  unscheduleCheck: () => void
}

export interface UseAuditTrailReturn {
  // Query operations
  queryAuditTrail: (query: AuditTrailQuery) => Promise<void>
  exportAuditTrail: (query: AuditTrailQuery, format: string) => Promise<string>
  
  // Rollback operations
  rollbackOperation: (entryId: string) => Promise<void>
  canRollback: (entry: AuditLogEntry) => boolean
  
  // State
  entries: AuditLogEntry[]
  totalCount: number
  isLoading: boolean
  filters: AuditTrailQuery
  
  // Filters
  setFilters: (filters: Partial<AuditTrailQuery>) => void
  clearFilters: () => void
}

// ==================== Configuration Types ====================

export interface CascadeDeletionConfig {
  websocketUrl: string
  apiBaseUrl: string
  enableRealTimeUpdates: boolean
  progressUpdateInterval: number
  maxConcurrentOperations: number
  defaultBatchSize: number
  integrityCheckInterval: number
  auditRetentionDays: number
  enableOptimisticUpdates: boolean
  retryAttempts: number
  retryDelay: number
}

// ==================== Error Types ====================

export class CascadeDeletionError extends Error {
  public code?: string
  public operationId?: string
  public phase?: string
  public recoverable: boolean = false
  
  constructor(
    message: string,
    code?: string,
    operationId?: string,
    phase?: string,
    recoverable: boolean = false
  ) {
    super(message)
    this.name = 'CascadeDeletionError'
    this.code = code
    this.operationId = operationId
    this.phase = phase
    this.recoverable = recoverable
  }
}

export class DataIntegrityError extends Error {
  public issueId?: string
  public tableName?: string
  public severity?: string
  
  constructor(message: string, issueId?: string, tableName?: string, severity?: string) {
    super(message)
    this.name = 'DataIntegrityError'
    this.issueId = issueId
    this.tableName = tableName
    this.severity = severity
  }
}

export class AuditTrailError extends Error {
  public entryId?: string
  public rollbackable: boolean = false
  
  constructor(message: string, entryId?: string, rollbackable: boolean = false) {
    super(message)
    this.name = 'AuditTrailError'
    this.entryId = entryId
    this.rollbackable = rollbackable
  }
}