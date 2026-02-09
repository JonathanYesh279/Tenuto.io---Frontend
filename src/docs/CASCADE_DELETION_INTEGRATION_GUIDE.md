# Cascade Deletion System - Complete Integration Guide

This document provides a comprehensive guide for integrating and using the cascade deletion system in your React conservatory application.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start Guide](#quick-start-guide)
3. [API Integration](#api-integration)
4. [State Management](#state-management)
5. [Real-time Updates](#real-time-updates)
6. [Error Handling](#error-handling)
7. [Progress Tracking](#progress-tracking)
8. [Data Integrity](#data-integrity)
9. [Audit Trail](#audit-trail)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

The cascade deletion system consists of several integrated layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                         │
├─────────────────────────────────────────────────────────────┤
│                React Query Hooks                           │
├─────────────────────────────────────────────────────────────┤
│              Zustand State Management                      │
├─────────────────────────────────────────────────────────────┤
│            WebSocket Real-time Updates                     │
├─────────────────────────────────────────────────────────────┤
│                  API Service Layer                         │
├─────────────────────────────────────────────────────────────┤
│                 Backend API Endpoints                      │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

- **TypeScript Interfaces**: Complete type definitions for all operations
- **API Service Layer**: HTTP client with caching and error handling
- **Zustand Store**: Centralized state management with optimistic updates
- **React Query Integration**: Data fetching with background updates
- **WebSocket System**: Real-time progress updates and notifications
- **Error Handling**: Comprehensive retry and recovery mechanisms
- **Progress Tracking**: Advanced analytics and optimistic updates

## 🚀 Quick Start Guide

### 1. Basic Setup

First, ensure all dependencies are installed:

```bash
npm install @tanstack/react-query zustand immer
```

### 2. Initialize the System

```tsx
// In your main App component or a high-level provider
import { useCascadeDeletionStore } from '@/stores/cascadeDeletionStore'
import { useWebSocketDeletionUpdates } from '@/hooks/useWebSocketDeletion'

function App() {
  // Initialize WebSocket connections for real-time updates
  useWebSocketDeletionUpdates()
  
  return (
    // Your app components
  )
}
```

### 3. Basic Usage Example

```tsx
import { useCascadeDeletion } from '@/hooks/useCascadeDeletion'
import { useProgressTracking } from '@/hooks/useProgressTracking'

function StudentDeleteButton({ studentId }: { studentId: string }) {
  const {
    previewDeletion,
    executeDeletion,
    previewLoading,
    previewData,
    isDeleting
  } = useCascadeDeletion('student', studentId)

  const [operationId, setOperationId] = useState<string | null>(null)
  const {
    startTracking,
    getProgressAnalytics,
    applyOptimisticUpdate
  } = useProgressTracking(operationId)

  const handleDelete = async () => {
    try {
      // Step 1: Preview the deletion impact
      const impact = await previewDeletion('student', studentId)
      
      if (!impact?.canDelete) {
        alert('Cannot delete student: ' + impact?.warnings[0]?.message)
        return
      }

      // Step 2: Apply optimistic updates
      const updateId = await applyOptimisticUpdate(
        operationId || 'preview',
        'student',
        studentId,
        'delete',
        null,
        [['students'], ['students', 'list']]
      )

      // Step 3: Execute the deletion
      const newOperationId = await executeDeletion(impact.operationId)
      setOperationId(newOperationId)
      
      // Step 4: Start tracking progress
      if (newOperationId) {
        startTracking(newOperationId)
      }

    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={previewLoading || isDeleting}
      >
        {previewLoading ? 'Analyzing...' : 
         isDeleting ? 'Deleting...' : 
         'Delete Student'}
      </button>
      
      {previewData && (
        <div>
          <p>This will affect {previewData.totalAffectedCount} entities</p>
          {previewData.warnings.length > 0 && (
            <ul>
              {previewData.warnings.map((warning, i) => (
                <li key={i} className={`text-${warning.severity}`}>
                  {warning.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
```

## 🔌 API Integration

### Available Services

#### 1. Cascade Deletion Service

```tsx
import { cascadeDeletionService } from '@/services/cascadeDeletionService'

// Preview deletion impact
const impact = await cascadeDeletionService.previewDeletion('student', 'student-id')

// Execute deletion
const operationId = await cascadeDeletionService.executeDeletion('operation-id')

// Check operation status
const status = await cascadeDeletionService.getOperationStatus('operation-id')

// Get progress
const progress = await cascadeDeletionService.getProgress('operation-id')
```

#### 2. Data Integrity Service

```tsx
import { dataIntegrityService } from '@/services/dataIntegrityService'

// Check system integrity
const status = await dataIntegrityService.getStatus()

// Run integrity check
const checkId = await dataIntegrityService.runCheck('quick')

// Get issues
const issues = await dataIntegrityService.getIssues({
  severity: 'high',
  canAutoRepair: true
})

// Repair issues
const repairId = await dataIntegrityService.repairIssues(['issue-1', 'issue-2'])
```

#### 3. Audit Trail Service

```tsx
import { auditTrailService } from '@/services/auditTrailService'

// Query audit trail
const auditData = await auditTrailService.queryAuditTrail({
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  entityType: 'student',
  limit: 100
})

// Export audit trail
const exportId = await auditTrailService.exportAuditTrail(
  { entityType: 'student' },
  'excel'
)

// Preview rollback
const rollbackPreview = await auditTrailService.previewRollback('entry-id')
```

### Backend API Endpoints

The system expects these backend endpoints to be available:

```
POST /api/cascade-deletion/preview
POST /api/cascade-deletion/execute
GET  /api/cascade-deletion/operations/{id}/status
GET  /api/cascade-deletion/operations/{id}/progress
POST /api/cascade-deletion/operations/{id}/cancel

GET  /api/data-integrity/status
POST /api/data-integrity/check
POST /api/data-integrity/repair
GET  /api/data-integrity/issues

GET  /api/audit-trail
POST /api/audit-trail/rollback
POST /api/audit-trail/export

WebSocket: /ws/deletion-progress
```

## 📊 State Management

### Zustand Store

The main state is managed by the `useCascadeDeletionStore`:

```tsx
import { useCascadeDeletionStore } from '@/stores/cascadeDeletionStore'

function MyComponent() {
  const {
    // Operations
    activeOperations,
    operationProgress,
    
    // Preview
    currentPreview,
    previewLoading,
    
    // Actions
    previewDeletion,
    executeDeletion,
    cancelOperation,
    
    // UI State
    notifications,
    addNotification,
    removeNotification
  } = useCascadeDeletionStore()

  // Use the state and actions...
}
```

### Selectors

Use selectors for optimized state access:

```tsx
import { 
  useActiveOperations,
  useOperationsByStatus,
  useNotificationsByType 
} from '@/stores/cascadeDeletionStore'

// Get all active operations
const activeOps = useActiveOperations()

// Get operations by status
const failedOps = useOperationsByStatus('failed')

// Get error notifications
const errors = useNotificationsByType('error')
```

## 🔄 Real-time Updates

### WebSocket Integration

The system automatically handles WebSocket connections for real-time updates:

```tsx
import { useWebSocketDeletionUpdates } from '@/hooks/useWebSocketDeletion'

function DeletionMonitor() {
  const { connectionStatus, isConnected } = useWebSocketDeletionUpdates()
  
  return (
    <div>
      Status: {connectionStatus}
      {!isConnected && <span>⚠️ Real-time updates unavailable</span>}
    </div>
  )
}
```

### Operation-specific Updates

```tsx
import { useOperationWebSocketUpdates } from '@/hooks/useWebSocketDeletion'

function ProgressTracker({ operationId }: { operationId: string }) {
  const { isSubscribed } = useOperationWebSocketUpdates(operationId)
  
  return (
    <div>
      {isSubscribed ? '🟢' : '🔴'} Real-time updates
    </div>
  )
}
```

## ❌ Error Handling

### Using Error Handler Hook

```tsx
import { useErrorHandler } from '@/utils/errorHandling'

function MyComponent() {
  const { handleError, executeWithRetry, classifyError } = useErrorHandler()

  const performOperation = async () => {
    try {
      await executeWithRetry(async () => {
        // Your operation that might fail
        return someApiCall()
      }, {
        operationId: 'my-operation',
        entityType: 'student'
      })
    } catch (error) {
      await handleError(error, {
        operationId: 'my-operation'
      })
    }
  }

  return <button onClick={performOperation}>Execute</button>
}
```

### Error Classification

The system automatically classifies errors:

```tsx
import { ErrorClassifier } from '@/utils/errorHandling'

try {
  await someOperation()
} catch (error) {
  const classification = ErrorClassifier.classifyError(error)
  
  console.log('Category:', classification.category) // 'network', 'timeout', etc.
  console.log('Severity:', classification.severity) // 'low', 'medium', 'high', 'critical'
  console.log('Retryable:', classification.isRetryable)
  console.log('User message:', classification.userMessage)
}
```

## 📈 Progress Tracking

### Basic Progress Tracking

```tsx
import { useProgressTracking } from '@/hooks/useProgressTracking'

function OperationProgress({ operationId }: { operationId: string }) {
  const {
    getProgressAnalytics,
    applyOptimisticUpdate,
    revertOptimisticUpdates,
    isTracking,
    canRevert
  } = useProgressTracking(operationId)

  const analytics = getProgressAnalytics(operationId)

  return (
    <div>
      {analytics && (
        <div>
          <div>Progress: {analytics.currentProgress.toFixed(1)}%</div>
          <div>Velocity: {analytics.velocity.toFixed(2)} entities/sec</div>
          <div>ETA: {analytics.estimatedCompletion}</div>
        </div>
      )}
      
      {canRevert && (
        <button onClick={() => revertOptimisticUpdates(operationId)}>
          Revert Changes
        </button>
      )}
    </div>
  )
}
```

### Batch Progress Tracking

```tsx
import { useBatchProgressTracking } from '@/hooks/useProgressTracking'

function BatchMonitor({ operationIds }: { operationIds: string[] }) {
  const {
    getBatchAnalytics,
    revertAllOptimisticUpdates,
    totalOperations,
    activeOperations
  } = useBatchProgressTracking(operationIds)

  const batchAnalytics = getBatchAnalytics()

  return (
    <div>
      <h3>Batch Progress</h3>
      <div>Operations: {activeOperations}/{totalOperations}</div>
      <div>Average Progress: {batchAnalytics.averageProgress.toFixed(1)}%</div>
      <div>Total Velocity: {batchAnalytics.totalVelocity.toFixed(2)} entities/sec</div>
      
      <button onClick={revertAllOptimisticUpdates}>
        Revert All Changes
      </button>
    </div>
  )
}
```

## 🔍 Data Integrity

### Monitoring Data Health

```tsx
import { useDataIntegrity } from '@/hooks/useDataIntegrity' // You'll need to create this

function IntegrityDashboard() {
  const {
    checkIntegrity,
    status,
    isChecking,
    repairIssues
  } = useDataIntegrity()

  const handleRepair = async (issueIds: string[]) => {
    await repairIssues(issueIds, 'auto')
  }

  return (
    <div>
      <button 
        onClick={() => checkIntegrity()}
        disabled={isChecking}
      >
        {isChecking ? 'Checking...' : 'Check Integrity'}
      </button>
      
      {status && (
        <div className={`status-${status.overallHealth}`}>
          <h3>System Health: {status.overallHealth}</h3>
          <p>Issues: {status.totalOrphanedReferences}</p>
          <p>Last Check: {new Date(status.lastCheckedAt).toLocaleDateString()}</p>
          
          {status.issues.map(issue => (
            <div key={issue.id} className={`issue-${issue.severity}`}>
              <h4>{issue.type}</h4>
              <p>{issue.description}</p>
              {issue.canAutoRepair && (
                <button onClick={() => handleRepair([issue.id])}>
                  Auto-repair
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## 📋 Audit Trail

### Viewing Audit History

```tsx
import { useAuditTrail } from '@/hooks/useAuditTrail' // You'll need to create this

function AuditTrailViewer() {
  const {
    queryAuditTrail,
    exportAuditTrail,
    rollbackOperation,
    entries,
    totalCount,
    isLoading,
    filters,
    setFilters
  } = useAuditTrail()

  const handleExport = async () => {
    const exportId = await exportAuditTrail(filters, 'excel')
    // Handle export download...
  }

  const handleRollback = async (entryId: string) => {
    if (confirm('Are you sure you want to rollback this operation?')) {
      await rollbackOperation(entryId)
    }
  }

  return (
    <div>
      <div className="filters">
        <input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => setFilters({ startDate: e.target.value })}
          placeholder="Start Date"
        />
        <input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => setFilters({ endDate: e.target.value })}
          placeholder="End Date"
        />
        <select
          value={filters.entityType || ''}
          onChange={(e) => setFilters({ entityType: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="orchestra">Orchestras</option>
        </select>
      </div>

      <div className="actions">
        <button onClick={() => queryAuditTrail(filters)}>
          Search
        </button>
        <button onClick={handleExport}>
          Export
        </button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <p>{totalCount} entries found</p>
          {entries.map(entry => (
            <div key={entry.id} className="audit-entry">
              <div className="header">
                <span className="action">{entry.action}</span>
                <span className="entity">{entry.entityType}</span>
                <span className="user">{entry.userName}</span>
                <span className="timestamp">{entry.timestamp}</span>
              </div>
              
              {entry.changes && (
                <div className="changes">
                  {entry.changes.map((change, i) => (
                    <div key={i}>
                      <strong>{change.field}:</strong>
                      <span className="old">{JSON.stringify(change.oldValue)}</span>
                      →
                      <span className="new">{JSON.stringify(change.newValue)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {entry.rollbackable && (
                <button
                  onClick={() => handleRollback(entry.id)}
                  className="rollback"
                >
                  Rollback
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## ✅ Best Practices

### 1. Error Handling

- Always wrap operations in try-catch blocks
- Use the error classification system for appropriate user feedback
- Log errors with sufficient context for debugging
- Provide meaningful error messages to users

```tsx
// ✅ Good
try {
  await executeWithRetry(() => someOperation(), {
    operationId: 'delete-student',
    entityType: 'student',
    entityId: studentId
  })
} catch (error) {
  await handleError(error, { entityId: studentId })
}

// ❌ Bad
try {
  await someOperation()
} catch (error) {
  console.log('Error:', error)
}
```

### 2. Progress Tracking

- Always start progress tracking for long-running operations
- Use optimistic updates for immediate UI feedback
- Provide rollback capabilities for failed operations

```tsx
// ✅ Good
const { startTracking, applyOptimisticUpdate } = useProgressTracking(operationId)

// Start tracking immediately
startTracking(operationId)

// Apply optimistic updates
await applyOptimisticUpdate(operationId, 'student', studentId, 'delete', null, queryKeys)

// ❌ Bad
// No progress tracking, user has no feedback
await executeDeletion(operationId)
```

### 3. State Management

- Use selectors to avoid unnecessary re-renders
- Keep optimistic updates reversible
- Clean up old operations and progress data

```tsx
// ✅ Good
const failedOperations = useOperationsByStatus('failed')
const errorNotifications = useNotificationsByType('error')

// ❌ Bad
const store = useCascadeDeletionStore()
const failedOperations = Array.from(store.activeOperations.values())
  .filter(op => op.status === 'failed') // Causes unnecessary re-renders
```

### 4. WebSocket Management

- Handle connection failures gracefully
- Implement reconnection logic
- Unsubscribe from updates when components unmount

```tsx
// ✅ Good
useEffect(() => {
  const unsubscribe = subscribeToProgress(operationId, handleProgress)
  return unsubscribe // Cleanup on unmount
}, [operationId])

// ❌ Bad
// No cleanup, potential memory leaks
subscribeToProgress(operationId, handleProgress)
```

## 🐛 Troubleshooting

### Common Issues

#### 1. WebSocket Connection Issues

**Problem**: Real-time updates not working

**Solution**:
```tsx
import { useWebSocketConnectionManager } from '@/hooks/useWebSocketDeletion'

function ConnectionStatus() {
  const { connectionStatus, reconnect } = useWebSocketConnectionManager()
  
  if (connectionStatus !== 'connected') {
    return (
      <div>
        Connection status: {connectionStatus}
        <button onClick={reconnect}>Reconnect</button>
      </div>
    )
  }
  
  return null
}
```

#### 2. Stale Cache Data

**Problem**: UI showing outdated information

**Solution**:
```tsx
import { useCascadeDeletionCache } from '@/hooks/useCascadeDeletion'

function RefreshButton() {
  const { invalidateAll } = useCascadeDeletionCache()
  
  return (
    <button onClick={invalidateAll}>
      Refresh All Data
    </button>
  )
}
```

#### 3. Memory Leaks

**Problem**: Growing memory usage over time

**Solution**:
```tsx
// Regular cleanup in your main app component
useEffect(() => {
  const cleanup = setInterval(() => {
    const store = useCascadeDeletionStore.getState()
    store.cleanup() // Removes old operations and notifications
  }, 5 * 60 * 1000) // Every 5 minutes

  return () => clearInterval(cleanup)
}, [])
```

#### 4. Failed Optimistic Updates

**Problem**: UI shows incorrect state after failed operation

**Solution**:
```tsx
const { revertOptimisticUpdates } = useProgressTracking(operationId)

// In error handler
try {
  await executeDeletion(operationId)
} catch (error) {
  // Revert optimistic changes on failure
  await revertOptimisticUpdates(operationId)
  throw error
}
```

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
VITE_CASCADE_DELETION_DEBUG=true
```

This will provide detailed logging for:
- API requests and responses
- WebSocket messages
- State changes
- Progress updates
- Error details

### Performance Monitoring

Monitor performance with these utilities:

```tsx
// Track operation performance
const analytics = getProgressAnalytics(operationId)
console.log('Operation velocity:', analytics?.velocity, 'entities/sec')

// Monitor cache hit rates
const cacheStats = cascadeDeletionService.getCacheStats() // If implemented
console.log('Cache hit rate:', cacheStats.hitRate)
```

## 📝 Additional Notes

- All timestamps are in ISO 8601 format
- Entity IDs must be strings
- Progress percentages are between 0-100
- WebSocket reconnection has exponential backoff with jitter
- Optimistic updates are automatically reverted on component unmount
- Error notifications auto-hide after timeout (configurable)
- Audit trail entries are retained based on backend configuration

For more detailed API documentation, see the individual service files and type definitions.