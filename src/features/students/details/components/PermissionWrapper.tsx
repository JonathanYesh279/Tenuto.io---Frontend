/**
 * Permission Wrapper Component
 * 
 * Wraps UI elements and shows/hides them based on user permissions.
 * Also logs access attempts for audit purposes.
 */

import { useEffect, ReactNode } from 'react'
import { Permission } from '@/services/permissionsService'
import { AuditResourceType } from '@/services/auditTrailService'
import { usePermissionsAndAudit } from '../hooks/usePermissionsAndAudit'

interface PermissionWrapperProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  action?: string
  studentId?: string
  resourceType?: AuditResourceType
  resourceId?: string
  resourceName?: string
  fallback?: ReactNode
  showFallback?: boolean
  logAccess?: boolean
  className?: string
  requireAll?: boolean // If true, requires ALL permissions, otherwise ANY
}

const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  permission,
  permissions = [],
  action,
  studentId,
  resourceType,
  resourceId,
  resourceName,
  fallback,
  showFallback = true,
  logAccess = false,
  className = '',
  requireAll = false
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    checkAction, 
    canAccessStudent,
    audit,
    isInitialized 
  } = usePermissionsAndAudit(studentId)

  // Determine permissions to check
  const permissionsToCheck = permission ? [permission] : permissions

  // Check permissions
  const hasRequiredPermissions = (() => {
    if (action) {
      const actionCheck = checkAction(action, studentId)
      return actionCheck.allowed
    }
    
    if (permissionsToCheck.length === 0) {
      return true // No permissions required
    }
    
    if (requireAll) {
      return permissionsToCheck.every(p => hasPermission(p, { studentId, action: p }))
    } else {
      return hasAnyPermission(permissionsToCheck)
    }
  })()

  const hasStudentAccess = !studentId || canAccessStudent(studentId)
  const allowed = hasRequiredPermissions && hasStudentAccess

  // Log access attempt if enabled
  useEffect(() => {
    if (isInitialized && logAccess && resourceType && resourceId) {
      if (allowed) {
        audit.logView(resourceType, resourceId, resourceName)
      } else {
        audit.logFailure(
          'view',
          resourceType,
          resourceId,
          'Access denied - insufficient permissions'
        )
      }
    }
  }, [isInitialized, logAccess, allowed, resourceType, resourceId, resourceName, audit])

  // Don't render anything while permissions are loading
  if (!isInitialized) {
    return null
  }

  // If not allowed, show fallback or nothing
  if (!allowed) {
    if (showFallback && fallback) {
      return <div className={className}>{fallback}</div>
    }
    return null
  }

  // Render children with optional wrapper
  return className ? (
    <div className={className}>{children}</div>
  ) : (
    <>{children}</>
  )
}

// Specialized permission wrappers for common use cases

export const ViewWrapper: React.FC<{
  children: ReactNode
  resourceType: AuditResourceType
  studentId?: string
  className?: string
  fallback?: ReactNode
}> = ({ children, resourceType, studentId, className, fallback }) => (
  <PermissionWrapper
    permission={`view_student_${resourceType}` as Permission}
    studentId={studentId}
    resourceType={resourceType}
    resourceId={studentId || ''}
    logAccess={true}
    className={className}
    fallback={fallback}
  >
    {children}
  </PermissionWrapper>
)

export const EditWrapper: React.FC<{
  children: ReactNode
  resourceType: AuditResourceType
  studentId?: string
  className?: string
  fallback?: ReactNode
}> = ({ children, resourceType, studentId, className, fallback }) => (
  <PermissionWrapper
    permission={`edit_student_${resourceType}` as Permission}
    studentId={studentId}
    className={className}
    fallback={fallback || (
      <div className="text-sm text-gray-500 italic">
        אין הרשאה לעריכה
      </div>
    )}
  >
    {children}
  </PermissionWrapper>
)

export const AdminOnlyWrapper: React.FC<{
  children: ReactNode
  className?: string
  fallback?: ReactNode
}> = ({ children, className, fallback }) => (
  <PermissionWrapper
    permissions={['manage_permissions', 'view_audit_trail']}
    className={className}
    fallback={fallback}
  >
    {children}
  </PermissionWrapper>
)

export const BulkOperationsWrapper: React.FC<{
  children: ReactNode
  className?: string
}> = ({ children, className }) => (
  <PermissionWrapper
    permission="bulk_operations"
    className={className}
  >
    {children}
  </PermissionWrapper>
)

export const ReportsWrapper: React.FC<{
  children: ReactNode
  studentId?: string
  className?: string
}> = ({ children, studentId, className }) => (
  <PermissionWrapper
    permissions={['generate_student_reports', 'view_student_reports']}
    studentId={studentId}
    className={className}
  >
    {children}
  </PermissionWrapper>
)

// Hook for conditional rendering based on permissions
export const useConditionalRender = () => {
  const permissions = usePermissionsAndAudit()
  
  const renderIf = (
    condition: boolean | (() => boolean),
    component: ReactNode,
    fallback?: ReactNode
  ) => {
    const shouldRender = typeof condition === 'function' ? condition() : condition
    return shouldRender ? component : (fallback || null)
  }
  
  const renderWithPermission = (
    permission: Permission,
    component: ReactNode,
    studentId?: string,
    fallback?: ReactNode
  ) => {
    const hasAccess = permissions.hasPermission(permission, { studentId, action: permission })
    return renderIf(hasAccess, component, fallback)
  }
  
  const renderWithAction = (
    action: string,
    component: ReactNode,
    studentId?: string,
    fallback?: ReactNode
  ) => {
    const actionCheck = permissions.checkAction(action, studentId)
    return renderIf(actionCheck.allowed, component, fallback)
  }
  
  return {
    renderIf,
    renderWithPermission,
    renderWithAction,
    permissions
  }
}

export default PermissionWrapper