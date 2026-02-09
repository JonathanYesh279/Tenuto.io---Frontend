/**
 * Permissions and Audit Hook
 * 
 * Provides a unified interface for permission checking and audit logging
 * in student details components.
 */

import { useEffect, useState, useCallback } from 'react'
import { 
  permissionsService, 
  Permission, 
  UserRole,
  PermissionContext 
} from '@/services/permissionsService'
import {
  auditTrailService,
  AuditAction,
  AuditResourceType,
  AuditEntry
} from '@/services/auditTrailService'
import { StudentDetails } from '../types'
import { getDisplayName } from '@/utils/nameUtils'

export interface PermissionCheck {
  allowed: boolean
  reason?: string
}

export interface AuditLogger {
  logView: (resourceType: AuditResourceType, resourceId: string, resourceName?: string) => Promise<void>
  logEdit: (resourceType: AuditResourceType, resourceId: string, oldValues?: any, newValues?: any, changedFields?: string[]) => Promise<void>
  logCreate: (resourceType: AuditResourceType, resourceId: string, data?: any) => Promise<void>
  logDelete: (resourceType: AuditResourceType, resourceId: string, reason?: string) => Promise<void>
  logFileOperation: (action: 'upload' | 'download', fileName: string, fileSize?: number) => Promise<void>
  logExport: (format: string, options?: any) => Promise<void>
  logEmail: (recipients: string[], subject: string) => Promise<void>
  logPrint: (reportType: string) => Promise<void>
  logFailure: (action: AuditAction, resourceType: AuditResourceType, resourceId: string, error: string) => Promise<void>
}

export interface PermissionsHook {
  // Permission checking
  hasPermission: (permission: Permission, context?: PermissionContext) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  canAccessStudent: (studentId: string) => boolean
  checkAction: (action: string, studentId?: string) => PermissionCheck
  
  // User info
  userRole: UserRole | null
  userPermissions: Permission[]
  allowedStudentIds: string[] | null
  
  // Audit logging
  audit: AuditLogger
  
  // Recent activity
  recentActivity: AuditEntry[]
  refreshRecentActivity: () => Promise<void>
  
  // Initialization
  isInitialized: boolean
  initializeUser: (userId: string) => Promise<void>
}

// Mock current user - in real app this would come from auth context
const getCurrentUser = () => ({
  id: 'admin_123',
  name: 'מנהל המערכת',
  role: 'admin' as UserRole
})

export const usePermissionsAndAudit = (studentId?: string, student?: StudentDetails): PermissionsHook => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userPermissions, setUserPermissions] = useState<Permission[]>([])
  const [allowedStudentIds, setAllowedStudentIds] = useState<string[] | null>(null)
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([])

  const currentUser = getCurrentUser()

  // Initialize permissions
  const initializeUser = useCallback(async (userId: string) => {
    try {
      await permissionsService.initializeUser(userId)
      setUserRole(permissionsService.getUserRole())
      setUserPermissions(permissionsService.getUserPermissions())
      setAllowedStudentIds(permissionsService.getAllowedStudentIds())
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize permissions:', error)
    }
  }, [])

  // Auto-initialize with current user
  useEffect(() => {
    if (!isInitialized) {
      initializeUser(currentUser.id)
    }
  }, [isInitialized, initializeUser, currentUser.id])

  // Load recent activity for student
  const refreshRecentActivity = useCallback(async () => {
    if (studentId) {
      const activity = await auditTrailService.getRecentActivity('student', studentId, 10)
      setRecentActivity(activity)
    }
  }, [studentId])

  useEffect(() => {
    if (studentId && isInitialized) {
      refreshRecentActivity()
    }
  }, [studentId, isInitialized, refreshRecentActivity])

  // Permission checking functions
  const hasPermission = useCallback((permission: Permission, context?: PermissionContext): boolean => {
    return permissionsService.hasPermission(permission, context)
  }, [])

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissionsService.hasAnyPermission(permissions)
  }, [])

  const canAccessStudent = useCallback((studentId: string): boolean => {
    return permissionsService.canAccessStudent(studentId)
  }, [])

  const checkAction = useCallback((action: string, studentId?: string): PermissionCheck => {
    return permissionsService.checkActionPermission(action, studentId)
  }, [])

  // Audit logging functions
  const audit: AuditLogger = {
    logView: async (resourceType: AuditResourceType, resourceId: string, resourceName?: string) => {
      await auditTrailService.logView(
        currentUser.id,
        currentUser.role,
        currentUser.name,
        resourceType,
        resourceId,
        resourceName
      )
      await refreshRecentActivity()
    },

    logEdit: async (resourceType: AuditResourceType, resourceId: string, oldValues?: any, newValues?: any, changedFields?: string[]) => {
      await auditTrailService.logUpdate(
        currentUser.id,
        currentUser.role,
        currentUser.name,
        resourceType,
        resourceId,
        getDisplayName(student?.personalInfo),
        oldValues,
        newValues,
        changedFields
      )
      await refreshRecentActivity()
    },

    logCreate: async (resourceType: AuditResourceType, resourceId: string, data?: any) => {
      await auditTrailService.logCreate(
        currentUser.id,
        currentUser.role,
        currentUser.name,
        resourceType,
        resourceId,
        getDisplayName(student?.personalInfo),
        data
      )
      await refreshRecentActivity()
    },

    logDelete: async (resourceType: AuditResourceType, resourceId: string, reason?: string) => {
      await auditTrailService.logDelete(
        currentUser.id,
        currentUser.role,
        currentUser.name,
        resourceType,
        resourceId,
        getDisplayName(student?.personalInfo),
        reason
      )
      await refreshRecentActivity()
    },

    logFileOperation: async (action: 'upload' | 'download', fileName: string, fileSize?: number) => {
      await auditTrailService.logFileOperation(
        currentUser.id,
        currentUser.role,
        currentUser.name,
        action,
        studentId || '',
        fileName,
        fileSize
      )
      await refreshRecentActivity()
    },

    logExport: async (format: string, options?: any) => {
      await auditTrailService.logExport(
        currentUser.id,
        currentUser.role,
        currentUser.name,
        'student',
        studentId || '',
        format,
        options
      )
      await refreshRecentActivity()
    },

    logEmail: async (recipients: string[], subject: string) => {
      await auditTrailService.logEmail(
        currentUser.id,
        currentUser.role,
        currentUser.name,
        studentId || '',
        recipients,
        subject
      )
      await refreshRecentActivity()
    },

    logPrint: async (reportType: string) => {
      await auditTrailService.logPrint(
        currentUser.id,
        currentUser.role,
        currentUser.name,
        'student',
        studentId || '',
        reportType
      )
      await refreshRecentActivity()
    },

    logFailure: async (action: AuditAction, resourceType: AuditResourceType, resourceId: string, error: string) => {
      await auditTrailService.logFailure(
        currentUser.id,
        currentUser.role,
        currentUser.name,
        action,
        resourceType,
        resourceId,
        error
      )
      await refreshRecentActivity()
    }
  }

  return {
    // Permission checking
    hasPermission,
    hasAnyPermission,
    canAccessStudent,
    checkAction,
    
    // User info
    userRole,
    userPermissions,
    allowedStudentIds,
    
    // Audit logging
    audit,
    
    // Recent activity
    recentActivity,
    refreshRecentActivity,
    
    // Initialization
    isInitialized,
    initializeUser
  }
}

// Higher-order component for permission checking
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[],
  fallback?: React.ComponentType
) => {
  return (props: P & { studentId?: string }) => {
    const { hasAnyPermission, canAccessStudent, isInitialized } = usePermissionsAndAudit()

    if (!isInitialized) {
      return <div>טוען הרשאות...</div>
    }

    const hasRequiredPermissions = hasAnyPermission(requiredPermissions)
    const hasStudentAccess = !props.studentId || canAccessStudent(props.studentId)

    if (!hasRequiredPermissions || !hasStudentAccess) {
      if (fallback) {
        const FallbackComponent = fallback
        return <FallbackComponent />
      }
      
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין הרשאה</h3>
          <p className="text-gray-600">אין לך הרשאה לצפות בתוכן זה</p>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// Hook for form field permissions
export const useFieldPermissions = (studentId?: string) => {
  const { hasPermission, audit } = usePermissionsAndAudit(studentId)

  const getFieldConfig = (fieldType: string) => {
    const canView = hasPermission(`view_student_${fieldType}` as Permission)
    const canEdit = hasPermission(`edit_student_${fieldType}` as Permission)

    return {
      canView,
      canEdit,
      isReadOnly: canView && !canEdit,
      isHidden: !canView
    }
  }

  const logFieldChange = async (fieldType: string, fieldName: string, oldValue: any, newValue: any) => {
    await audit.logEdit(
      fieldType as AuditResourceType,
      studentId || '',
      { [fieldName]: oldValue },
      { [fieldName]: newValue },
      [fieldName]
    )
  }

  return {
    getFieldConfig,
    logFieldChange
  }
}