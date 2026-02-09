/**
 * Permissions Service
 * 
 * Manages user permissions and role-based access control for student data.
 */

export type UserRole = 'student' | 'teacher' | 'admin' | 'parent' | 'staff' | 'super_admin'

export type Permission = 
  | 'view_student_personal'
  | 'edit_student_personal'
  | 'view_student_academic'
  | 'edit_student_academic'
  | 'view_student_attendance'
  | 'edit_student_attendance'
  | 'view_student_schedule'
  | 'edit_student_schedule'
  | 'view_student_orchestra'
  | 'edit_student_orchestra'
  | 'view_student_theory'
  | 'edit_student_theory'
  | 'view_student_documents'
  | 'edit_student_documents'
  | 'upload_student_documents'
  | 'delete_student_documents'
  | 'view_student_reports'
  | 'generate_student_reports'
  | 'email_student_reports'
  | 'view_audit_trail'
  | 'manage_permissions'
  | 'bulk_operations'

export interface UserPermissions {
  userId: string
  role: UserRole
  permissions: Permission[]
  restrictions?: {
    studentIds?: string[] // Specific students this user can access
    departmentIds?: string[] // Specific departments
    classIds?: string[] // Specific classes
  }
}

export interface PermissionContext {
  studentId?: string
  action: Permission
  data?: any
}

class PermissionsService {
  private userPermissions: UserPermissions | null = null

  // Default role permissions
  private rolePermissions: Record<UserRole, Permission[]> = {
    student: [
      'view_student_personal',
      'view_student_academic',
      'view_student_attendance',
      'view_student_schedule',
      'view_student_orchestra',
      'view_student_theory',
      'view_student_documents'
    ],
    parent: [
      'view_student_personal',
      'view_student_academic',
      'view_student_attendance',
      'view_student_schedule',
      'view_student_orchestra',
      'view_student_theory',
      'view_student_documents',
      'view_student_reports'
    ],
    teacher: [
      'view_student_personal',
      'view_student_academic',
      'edit_student_academic',
      'view_student_attendance',
      'edit_student_attendance',
      'view_student_schedule',
      'edit_student_schedule',
      'view_student_orchestra',
      'view_student_theory',
      'edit_student_theory',
      'view_student_documents',
      'upload_student_documents',
      'view_student_reports',
      'generate_student_reports'
    ],
    staff: [
      'view_student_personal',
      'edit_student_personal',
      'view_student_academic',
      'edit_student_academic',
      'view_student_attendance',
      'edit_student_attendance',
      'view_student_schedule',
      'edit_student_schedule',
      'view_student_orchestra',
      'edit_student_orchestra',
      'view_student_theory',
      'edit_student_theory',
      'view_student_documents',
      'edit_student_documents',
      'upload_student_documents',
      'view_student_reports',
      'generate_student_reports',
      'email_student_reports'
    ],
    admin: [
      'view_student_personal',
      'edit_student_personal',
      'view_student_academic',
      'edit_student_academic',
      'view_student_attendance',
      'edit_student_attendance',
      'view_student_schedule',
      'edit_student_schedule',
      'view_student_orchestra',
      'edit_student_orchestra',
      'view_student_theory',
      'edit_student_theory',
      'view_student_documents',
      'edit_student_documents',
      'upload_student_documents',
      'delete_student_documents',
      'view_student_reports',
      'generate_student_reports',
      'email_student_reports',
      'view_audit_trail',
      'bulk_operations'
    ],
    super_admin: [
      'view_student_personal',
      'edit_student_personal',
      'view_student_academic',
      'edit_student_academic',
      'view_student_attendance',
      'edit_student_attendance',
      'view_student_schedule',
      'edit_student_schedule',
      'view_student_orchestra',
      'edit_student_orchestra',
      'view_student_theory',
      'edit_student_theory',
      'view_student_documents',
      'edit_student_documents',
      'upload_student_documents',
      'delete_student_documents',
      'view_student_reports',
      'generate_student_reports',
      'email_student_reports',
      'view_audit_trail',
      'manage_permissions',
      'bulk_operations'
    ]
  }

  /**
   * Initialize user permissions
   */
  async initializeUser(userId: string): Promise<void> {
    try {
      // In a real application, this would fetch from API
      // For now, simulate based on userId patterns
      let role: UserRole = 'student'
      let restrictions: UserPermissions['restrictions'] = {}

      if (userId.startsWith('admin_')) {
        role = 'admin'
      } else if (userId.startsWith('teacher_')) {
        role = 'teacher'
        // Teachers can only access their assigned students
        restrictions.studentIds = await this.getTeacherStudents(userId)
      } else if (userId.startsWith('parent_')) {
        role = 'parent'
        // Parents can only access their children
        restrictions.studentIds = await this.getParentChildren(userId)
      } else if (userId.startsWith('staff_')) {
        role = 'staff'
      } else if (userId.startsWith('super_')) {
        role = 'super_admin'
      }

      this.userPermissions = {
        userId,
        role,
        permissions: this.rolePermissions[role],
        restrictions
      }
    } catch (error) {
      console.error('Failed to initialize user permissions:', error)
      // Default to minimal permissions
      this.userPermissions = {
        userId,
        role: 'student',
        permissions: this.rolePermissions.student
      }
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: Permission, context?: PermissionContext): boolean {
    if (!this.userPermissions) {
      return false
    }

    // Check if user has the permission
    if (!this.userPermissions.permissions.includes(permission)) {
      return false
    }

    // Check restrictions
    if (context?.studentId && this.userPermissions.restrictions?.studentIds) {
      return this.userPermissions.restrictions.studentIds.includes(context.studentId)
    }

    return true
  }

  /**
   * Check multiple permissions
   */
  hasAnyPermission(permissions: Permission[], context?: PermissionContext): boolean {
    return permissions.some(permission => this.hasPermission(permission, context))
  }

  /**
   * Check if user can access student data
   */
  canAccessStudent(studentId: string): boolean {
    if (!this.userPermissions) {
      return false
    }

    // Super admin and admin can access all students
    if (['super_admin', 'admin'].includes(this.userPermissions.role)) {
      return true
    }

    // Check student restrictions
    if (this.userPermissions.restrictions?.studentIds) {
      return this.userPermissions.restrictions.studentIds.includes(studentId)
    }

    // Staff can access all students by default
    if (this.userPermissions.role === 'staff') {
      return true
    }

    return false
  }

  /**
   * Get user role
   */
  getUserRole(): UserRole | null {
    return this.userPermissions?.role || null
  }

  /**
   * Get user permissions
   */
  getUserPermissions(): Permission[] {
    return this.userPermissions?.permissions || []
  }

  /**
   * Get allowed student IDs for current user
   */
  getAllowedStudentIds(): string[] | null {
    return this.userPermissions?.restrictions?.studentIds || null
  }

  /**
   * Check if action requires permission and user has it
   */
  checkActionPermission(action: string, studentId?: string): {
    allowed: boolean
    reason?: string
  } {
    const actionPermissionMap: Record<string, Permission> = {
      'view_personal': 'view_student_personal',
      'edit_personal': 'edit_student_personal',
      'view_academic': 'view_student_academic',
      'edit_academic': 'edit_student_academic',
      'view_attendance': 'view_student_attendance',
      'edit_attendance': 'edit_student_attendance',
      'view_schedule': 'view_student_schedule',
      'edit_schedule': 'edit_student_schedule',
      'view_orchestra': 'view_student_orchestra',
      'edit_orchestra': 'edit_student_orchestra',
      'view_theory': 'view_student_theory',
      'edit_theory': 'edit_student_theory',
      'view_documents': 'view_student_documents',
      'edit_documents': 'edit_student_documents',
      'upload_documents': 'upload_student_documents',
      'delete_documents': 'delete_student_documents',
      'print_report': 'generate_student_reports',
      'export_data': 'generate_student_reports',
      'email_report': 'email_student_reports'
    }

    const permission = actionPermissionMap[action]
    if (!permission) {
      return { allowed: false, reason: 'פעולה לא מוכרת' }
    }

    if (!this.hasPermission(permission, { studentId, action: permission })) {
      return { allowed: false, reason: 'אין הרשאה לבצע פעולה זו' }
    }

    if (studentId && !this.canAccessStudent(studentId)) {
      return { allowed: false, reason: 'אין הרשאה לגשת לנתוני תלמיד זה' }
    }

    return { allowed: true }
  }

  /**
   * Mock function to get teacher's assigned students
   */
  private async getTeacherStudents(teacherId: string): Promise<string[]> {
    // In real implementation, fetch from API
    return ['student_1', 'student_2', 'student_3']
  }

  /**
   * Mock function to get parent's children
   */
  private async getParentChildren(parentId: string): Promise<string[]> {
    // In real implementation, fetch from API
    return ['student_1']
  }

  /**
   * Clear user permissions (logout)
   */
  clearPermissions(): void {
    this.userPermissions = null
  }

  /**
   * Get permission display name
   */
  getPermissionDisplayName(permission: Permission): string {
    const displayNames: Record<Permission, string> = {
      'view_student_personal': 'צפייה בפרטים אישיים',
      'edit_student_personal': 'עריכת פרטים אישיים',
      'view_student_academic': 'צפייה בפרטים אקדמיים',
      'edit_student_academic': 'עריכת פרטים אקדמיים',
      'view_student_attendance': 'צפייה בנוכחות',
      'edit_student_attendance': 'עריכת נוכחות',
      'view_student_schedule': 'צפייה בלוח זמנים',
      'edit_student_schedule': 'עריכת לוח זמנים',
      'view_student_orchestra': 'צפייה בתזמורות',
      'edit_student_orchestra': 'עריכת תזמורות',
      'view_student_theory': 'צפייה בתיאוריה',
      'edit_student_theory': 'עריכת תיאוריה',
      'view_student_documents': 'צפייה במסמכים',
      'edit_student_documents': 'עריכת מסמכים',
      'upload_student_documents': 'העלאת מסמכים',
      'delete_student_documents': 'מחיקת מסמכים',
      'view_student_reports': 'צפייה בדוחות',
      'generate_student_reports': 'יצירת דוחות',
      'email_student_reports': 'שליחת דוחות באימייל',
      'view_audit_trail': 'צפייה בלוג פעילות',
      'manage_permissions': 'ניהול הרשאות',
      'bulk_operations': 'פעולות מרובות'
    }

    return displayNames[permission] || permission
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: UserRole): string {
    const displayNames: Record<UserRole, string> = {
      'student': 'תלמיד',
      'parent': 'הורה',
      'teacher': 'מורה',
      'staff': 'צוות',
      'admin': 'מנהל',
      'super_admin': 'מנהל עליון'
    }

    return displayNames[role] || role
  }
}

export const permissionsService = new PermissionsService()