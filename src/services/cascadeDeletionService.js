/**
 * Cascade Deletion Service
 * 
 * Handles complex student deletion operations with cascade effects,
 * integrity checking, and rollback capabilities.
 * 
 * Features:
 * - Preview deletion effects before execution
 * - Cascade deletion with progress tracking
 * - Orphaned reference cleanup
 * - Database integrity validation and repair
 * - Rollback functionality with snapshots
 * - Comprehensive audit logging
 */

import { apiClient } from './apiService.js';

// Configuration
const DELETION_CONFIG = {
  TIMEOUT: 300000, // 5 minutes for complex operations
  RETRY_ATTEMPTS: 3,
  BATCH_SIZE: 50, // For bulk operations
};

/**
 * Hebrew error messages for user-facing errors
 */
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'שגיאת רשת. אנא נסה שוב מאוחר יותר',
  UNAUTHORIZED: 'אין הרשאה לביצוע פעולה זו',
  NOT_FOUND: 'הרשומה לא נמצאה',
  VALIDATION_ERROR: 'שגיאה בנתונים שהוזנו',
  DELETE_IN_PROGRESS: 'מחיקה כבר בתהליך עבור תלמיד זה',
  INTEGRITY_VIOLATION: 'שגיאה בשלמות הנתונים',
  ROLLBACK_NOT_AVAILABLE: 'לא ניתן לבטל את הפעולה',
  TIMEOUT: 'הפעולה נקטעה עקב חריגה מזמן המתנה',
  SERVER_ERROR: 'שגיאה פנימית. אנא פנה למנהל המערכת',
  PARTIAL_SUCCESS: 'הפעולה הושלמה חלקית. יש לבדוק את יומן הפעולות',
  DEPENDENCIES_EXIST: 'לא ניתן למחוק - קיימות תלויות במערכת',
  BACKUP_FAILED: 'כישלון ביצירת גיבוי לפני המחיקה',
};

/**
 * Custom error class for cascade deletion operations
 */
class CascadeDeletionError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'CascadeDeletionError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Retry utility with exponential backoff
 */
class RetryUtils {
  static async withExponentialBackoff(fn, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) throw error;
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

/**
 * Main Cascade Deletion Service Class
 */
class CascadeDeletionService {
  constructor() {
    this.activeOperations = new Map(); // Track ongoing operations
    this.operationTimeouts = new Map(); // Track operation timeouts
  }

  /**
   * Preview what will be deleted before actual execution
   * @param {string} studentId - The student ID to preview deletion for
   * @returns {Promise<Object>} Preview data showing affected records
   */
  async previewDeletion(studentId) {
    try {
      if (!studentId) {
        throw new CascadeDeletionError(
          ERROR_MESSAGES.VALIDATION_ERROR,
          'INVALID_STUDENT_ID'
        );
      }

      // Check if deletion is already in progress
      if (this.activeOperations.has(studentId)) {
        throw new CascadeDeletionError(
          ERROR_MESSAGES.DELETE_IN_PROGRESS,
          'DELETION_IN_PROGRESS',
          { studentId }
        );
      }

      const response = await RetryUtils.withExponentialBackoff(async () => {
        return await apiClient.post(`/admin/student/${studentId}/deletion-preview`, {
          includeDetails: true,
          validateIntegrity: true
        });
      });

      // Transform the response for frontend consumption
      return {
        studentId,
        summary: {
          totalRecords: response.data.totalRecords || 0,
          affectedCollections: response.data.affectedCollections || [],
          estimatedDuration: response.data.estimatedDuration || 0,
          riskLevel: response.data.riskLevel || 'low'
        },
        details: {
          lessons: response.data.details?.lessons || [],
          attendance: response.data.details?.attendance || [],
          orchestras: response.data.details?.orchestras || [],
          theoryClasses: response.data.details?.theoryClasses || [],
          documents: response.data.details?.documents || [],
          rehearsals: response.data.details?.rehearsals || [],
          assignments: response.data.details?.assignments || [],
          payments: response.data.details?.payments || []
        },
        warnings: response.data.warnings || [],
        dependencies: response.data.dependencies || [],
        canProceed: response.data.canProceed !== false,
        requiresConfirmation: response.data.requiresConfirmation === true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw this._handleError(error, 'PREVIEW_DELETION_FAILED');
    }
  }

  /**
   * Execute cascade deletion with progress tracking
   * @param {string} studentId - The student ID to delete
   * @param {Object} options - Deletion options
   * @returns {Promise<Object>} Deletion result with summary
   */
  async executeDelete(studentId, options = {}) {
    try {
      if (!studentId) {
        throw new CascadeDeletionError(
          ERROR_MESSAGES.VALIDATION_ERROR,
          'INVALID_STUDENT_ID'
        );
      }

      // Check if deletion is already in progress
      if (this.activeOperations.has(studentId)) {
        throw new CascadeDeletionError(
          ERROR_MESSAGES.DELETE_IN_PROGRESS,
          'DELETION_IN_PROGRESS',
          { studentId }
        );
      }

      // Mark operation as active
      this.activeOperations.set(studentId, {
        startTime: Date.now(),
        status: 'initializing'
      });

      // Set timeout for the operation
      const timeoutId = setTimeout(() => {
        this.activeOperations.delete(studentId);
        throw new CascadeDeletionError(
          ERROR_MESSAGES.TIMEOUT,
          'OPERATION_TIMEOUT',
          { studentId, timeoutMs: DELETION_CONFIG.TIMEOUT }
        );
      }, DELETION_CONFIG.TIMEOUT);

      this.operationTimeouts.set(studentId, timeoutId);

      const requestBody = {
        createSnapshot: options.createSnapshot !== false, // Default true
        skipValidation: options.skipValidation === true,
        batchSize: options.batchSize || DELETION_CONFIG.BATCH_SIZE,
        forceDelete: options.forceDelete === true,
        deleteDocuments: options.deleteDocuments !== false, // Default true
        notifyUsers: options.notifyUsers === true,
        reason: options.reason || 'Manual deletion',
        ...options
      };

      // Update operation status
      this.activeOperations.set(studentId, {
        startTime: Date.now(),
        status: 'executing'
      });

      const response = await RetryUtils.withExponentialBackoff(async () => {
        return await apiClient.delete(`/admin/student/${studentId}/cascade`, {
          data: requestBody
        });
      });

      // Clean up tracking
      clearTimeout(this.operationTimeouts.get(studentId));
      this.operationTimeouts.delete(studentId);
      this.activeOperations.delete(studentId);

      return {
        success: true,
        studentId,
        operation: {
          id: response.data.operationId,
          snapshotId: response.data.snapshotId,
          duration: response.data.duration,
          startTime: response.data.startTime,
          endTime: response.data.endTime
        },
        summary: {
          deletedRecords: response.data.deletedRecords || 0,
          processedCollections: response.data.processedCollections || [],
          warnings: response.data.warnings || [],
          errors: response.data.errors || []
        },
        details: response.data.details || {},
        canRollback: response.data.canRollback === true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      // Clean up on error
      clearTimeout(this.operationTimeouts.get(studentId));
      this.operationTimeouts.delete(studentId);
      this.activeOperations.delete(studentId);
      
      throw this._handleError(error, 'DELETION_FAILED');
    }
  }

  /**
   * Clean up orphaned references in the database
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupOrphaned(options = {}) {
    try {
      const requestBody = {
        collections: options.collections || [], // Empty array means all collections
        dryRun: options.dryRun === true,
        batchSize: options.batchSize || DELETION_CONFIG.BATCH_SIZE,
        skipBackup: options.skipBackup === true,
        ...options
      };

      const response = await RetryUtils.withExponentialBackoff(async () => {
        return await apiClient.post('/admin/cleanup/orphaned-references', requestBody);
      });

      return {
        success: true,
        operation: {
          id: response.data.operationId,
          duration: response.data.duration,
          mode: options.dryRun ? 'preview' : 'cleanup'
        },
        summary: {
          totalOrphaned: response.data.totalOrphaned || 0,
          cleaned: response.data.cleaned || 0,
          skipped: response.data.skipped || 0,
          errors: response.data.errors || 0
        },
        details: {
          byCollection: response.data.byCollection || {},
          issues: response.data.issues || [],
          recommendations: response.data.recommendations || []
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw this._handleError(error, 'CLEANUP_FAILED');
    }
  }

  /**
   * Validate database integrity
   * @returns {Promise<Object>} Validation results
   */
  async validateIntegrity() {
    try {
      const response = await RetryUtils.withExponentialBackoff(async () => {
        return await apiClient.get('/admin/integrity/validate');
      });

      return {
        success: true,
        validation: {
          id: response.data.validationId,
          duration: response.data.duration,
          timestamp: response.data.timestamp
        },
        summary: {
          totalChecks: response.data.totalChecks || 0,
          passed: response.data.passed || 0,
          failed: response.data.failed || 0,
          warnings: response.data.warnings || 0
        },
        issues: response.data.issues || [],
        recommendations: response.data.recommendations || [],
        repairAvailable: response.data.repairAvailable === true,
        overallStatus: response.data.overallStatus || 'unknown'
      };

    } catch (error) {
      throw this._handleError(error, 'VALIDATION_FAILED');
    }
  }

  /**
   * Repair database integrity issues
   * @param {Object} options - Repair options
   * @returns {Promise<Object>} Repair results
   */
  async repairIntegrity(options = {}) {
    try {
      const requestBody = {
        issues: options.issues || [], // Specific issues to repair, empty = all
        createBackup: options.createBackup !== false, // Default true
        dryRun: options.dryRun === true,
        forceRepair: options.forceRepair === true,
        ...options
      };

      const response = await RetryUtils.withExponentialBackoff(async () => {
        return await apiClient.post('/admin/integrity/repair', requestBody);
      });

      return {
        success: true,
        operation: {
          id: response.data.operationId,
          backupId: response.data.backupId,
          duration: response.data.duration,
          mode: options.dryRun ? 'preview' : 'repair'
        },
        summary: {
          totalIssues: response.data.totalIssues || 0,
          repaired: response.data.repaired || 0,
          failed: response.data.failed || 0,
          skipped: response.data.skipped || 0
        },
        details: {
          repairedIssues: response.data.repairedIssues || [],
          failedIssues: response.data.failedIssues || [],
          recommendations: response.data.recommendations || []
        },
        warnings: response.data.warnings || [],
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw this._handleError(error, 'REPAIR_FAILED');
    }
  }

  /**
   * Rollback a deletion operation using snapshot
   * @param {string} snapshotId - The snapshot ID to rollback to
   * @returns {Promise<Object>} Rollback results
   */
  async rollbackDeletion(snapshotId) {
    try {
      if (!snapshotId) {
        throw new CascadeDeletionError(
          ERROR_MESSAGES.VALIDATION_ERROR,
          'INVALID_SNAPSHOT_ID'
        );
      }

      const response = await RetryUtils.withExponentialBackoff(async () => {
        return await apiClient.post(`/admin/deletion/rollback/${snapshotId}`, {
          validateBeforeRollback: true,
          createNewSnapshot: true
        });
      });

      return {
        success: true,
        rollback: {
          id: response.data.rollbackId,
          snapshotId: snapshotId,
          newSnapshotId: response.data.newSnapshotId,
          duration: response.data.duration
        },
        summary: {
          restoredRecords: response.data.restoredRecords || 0,
          restoredCollections: response.data.restoredCollections || [],
          errors: response.data.errors || []
        },
        details: response.data.details || {},
        warnings: response.data.warnings || [],
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw this._handleError(error, 'ROLLBACK_FAILED');
    }
  }

  /**
   * Get audit log for deletion operations
   * @param {Object} filters - Filter options for audit log
   * @returns {Promise<Object>} Audit log entries
   */
  async getAuditLog(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.studentId) queryParams.append('studentId', filters.studentId);
      if (filters.operationType) queryParams.append('operationType', filters.operationType);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit || 50);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      const response = await RetryUtils.withExponentialBackoff(async () => {
        const url = `/admin/deletion/audit-log${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return await apiClient.get(url);
      });

      return {
        success: true,
        entries: response.data.entries || [],
        pagination: {
          page: response.data.page || 1,
          limit: response.data.limit || 50,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
          hasNext: response.data.hasNext === true,
          hasPrev: response.data.hasPrev === true
        },
        summary: {
          totalOperations: response.data.totalOperations || 0,
          successfulOperations: response.data.successfulOperations || 0,
          failedOperations: response.data.failedOperations || 0,
          dateRange: response.data.dateRange || {}
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw this._handleError(error, 'AUDIT_LOG_FAILED');
    }
  }

  /**
   * Get status of active deletion operations
   * @returns {Array} Array of active operations
   */
  getActiveOperations() {
    return Array.from(this.activeOperations.entries()).map(([studentId, operation]) => ({
      studentId,
      startTime: operation.startTime,
      status: operation.status,
      duration: Date.now() - operation.startTime
    }));
  }

  /**
   * Cancel an active deletion operation
   * @param {string} studentId - The student ID to cancel deletion for
   * @returns {boolean} True if operation was cancelled
   */
  cancelOperation(studentId) {
    if (this.activeOperations.has(studentId)) {
      clearTimeout(this.operationTimeouts.get(studentId));
      this.operationTimeouts.delete(studentId);
      this.activeOperations.delete(studentId);
      return true;
    }
    return false;
  }

  /**
   * Private method to handle and transform errors
   * @private
   */
  _handleError(error, defaultCode) {
    // If it's already our custom error, just re-throw
    if (error instanceof CascadeDeletionError) {
      throw error;
    }

    // Handle API errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data || {};
      
      let code = defaultCode;
      let message = ERROR_MESSAGES.SERVER_ERROR;

      if (status === 400) {
        code = 'VALIDATION_ERROR';
        message = data.message || ERROR_MESSAGES.VALIDATION_ERROR;
      } else if (status === 401) {
        code = 'UNAUTHORIZED';
        message = ERROR_MESSAGES.UNAUTHORIZED;
      } else if (status === 403) {
        code = 'FORBIDDEN';
        message = ERROR_MESSAGES.UNAUTHORIZED;
      } else if (status === 404) {
        code = 'NOT_FOUND';
        message = ERROR_MESSAGES.NOT_FOUND;
      } else if (status === 409) {
        code = 'CONFLICT';
        message = data.message || ERROR_MESSAGES.DELETE_IN_PROGRESS;
      } else if (status === 422) {
        code = 'INTEGRITY_VIOLATION';
        message = ERROR_MESSAGES.INTEGRITY_VIOLATION;
      } else if (status >= 500) {
        code = 'SERVER_ERROR';
        message = ERROR_MESSAGES.SERVER_ERROR;
      }

      throw new CascadeDeletionError(message, code, {
        status,
        originalError: data,
        endpoint: error.config?.url
      });
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new CascadeDeletionError(
        ERROR_MESSAGES.NETWORK_ERROR,
        'NETWORK_ERROR',
        { originalError: error.message }
      );
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new CascadeDeletionError(
        ERROR_MESSAGES.TIMEOUT,
        'TIMEOUT',
        { originalError: error.message }
      );
    }

    // Fallback for unknown errors
    throw new CascadeDeletionError(
      ERROR_MESSAGES.SERVER_ERROR,
      defaultCode,
      { originalError: error.message }
    );
  }
}

// Create and export a singleton instance
export const cascadeDeletionService = new CascadeDeletionService();
export { CascadeDeletionError };

// Named exports for individual methods (for easier testing and tree-shaking)
export const {
  previewDeletion,
  executeDelete,
  cleanupOrphaned,
  validateIntegrity,
  repairIntegrity,
  rollbackDeletion,
  getAuditLog,
  getActiveOperations,
  cancelOperation
} = cascadeDeletionService;