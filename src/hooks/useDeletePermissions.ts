import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDeletionSecurity } from '../contexts/DeletionSecurityContext';
import { useAuth } from '../services/authContext';
import { usePermissions } from '../services/permissionsService';

export interface DeletePermissionResult {
  canDelete: boolean;
  canBulkDelete: boolean;
  canCascadeDelete: boolean;
  canCleanupOrphans: boolean;
  scope: 'none' | 'own' | 'limited' | 'full';
  restrictions: string[];
  maxOperationsPerMinute: number;
  requiresVerification: boolean;
  errorMessage?: string;
}

export interface StudentDeletePermission extends DeletePermissionResult {
  studentId: string;
  studentName?: string;
  isOwn: boolean;
  entityRelations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface BulkDeletePermission {
  maxBatchSize: number;
  allowedEntityTypes: string[];
  requiresAdminApproval: boolean;
  estimatedDuration: number;
  impactScope: string[];
}

export interface PermissionCheckOptions {
  skipCache?: boolean;
  includeRestrictions?: boolean;
  checkRateLimit?: boolean;
  validateSession?: boolean;
}

export interface UseDeletePermissionsReturn {
  // General permissions
  permissions: DeletePermissionResult;
  loading: boolean;
  error: string | null;
  
  // Permission checkers
  checkStudentDeletion: (studentId: string, options?: PermissionCheckOptions) => Promise<StudentDeletePermission>;
  checkBulkDeletion: (studentIds: string[], options?: PermissionCheckOptions) => Promise<BulkDeletePermission>;
  checkCascadeDeletion: (studentId: string, scope?: string[]) => Promise<StudentDeletePermission>;
  
  // Permission validators
  validateOperation: (operation: 'single' | 'bulk' | 'cascade' | 'cleanup', context?: any) => Promise<boolean>;
  validateEntityAccess: (entityId: string, entityType: 'student' | 'teacher' | 'class') => boolean;
  validateTimeWindow: () => boolean;
  
  // Permission utilities
  getPermissionSummary: () => {
    totalPermissions: number;
    activeRestrictions: number;
    securityLevel: 'basic' | 'standard' | 'enhanced' | 'maximum';
    roleHierarchy: string[];
  };
  refreshPermissions: () => Promise<void>;
  
  // Security status
  securityStatus: {
    hasActiveSession: boolean;
    rateLimitStatus: 'ok' | 'warning' | 'exceeded';
    suspiciousActivity: boolean;
    lastPermissionCheck: Date | null;
  };
}

// Hebrew role mappings for permission display
const HEBREW_ROLE_DISPLAY = {
  'student': 'תלמיד',
  'teacher': 'מורה',
  'admin': 'מנהל',
  'super_admin': 'מנהל עליון',
  'staff': 'צוות',
  'parent': 'הורה',
  'מורה': 'מורה',
  'מנהל': 'מנהל',
  'מנהל עליון': 'מנהל עליון'
};

// Risk assessment based on student data
function assessStudentDeletionRisk(studentData?: any): 'low' | 'medium' | 'high' | 'critical' {
  if (!studentData) return 'medium';
  
  let riskScore = 0;
  
  // Factors that increase risk
  if (studentData.hasActiveEnrollments) riskScore += 2;
  if (studentData.hasFinancialRecords) riskScore += 2;
  if (studentData.hasActivePerformances) riskScore += 1;
  if (studentData.isOrchestryMember) riskScore += 1;
  if (studentData.hasAssignedInstruments) riskScore += 1;
  if (studentData.parentContactsCount > 2) riskScore += 1;
  if (studentData.teacherAssignments > 3) riskScore += 1;
  if (studentData.attendanceRecords > 50) riskScore += 1;
  
  if (riskScore >= 7) return 'critical';
  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
}

export function useDeletePermissions(): UseDeletePermissionsReturn {
  const { user, isAuthenticated } = useAuth();
  const permissions = usePermissions();
  const { 
    permissionScope,
    securityState,
    validateDeletionPermission,
    checkRateLimit,
    isSessionValid,
    recordActivity
  } = useDeletionSecurity();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [permissionCache, setPermissionCache] = useState<Map<string, any>>(new Map());

  // Basic permission result
  const basePermissions = useMemo((): DeletePermissionResult => {
    if (!isAuthenticated || !user || !permissionScope) {
      return {
        canDelete: false,
        canBulkDelete: false,
        canCascadeDelete: false,
        canCleanupOrphans: false,
        scope: 'none',
        restrictions: ['משתמש לא מחובר'],
        maxOperationsPerMinute: 0,
        requiresVerification: true,
        errorMessage: 'נדרש להתחבר למערכת'
      };
    }

    const userRole = user.role || user.userData?.role;
    const isAdmin = userRole === 'admin' || userRole === 'מנהל';
    const isSuperAdmin = userRole === 'super_admin' || userRole === 'מנהל עליון';

    let scope: DeletePermissionResult['scope'] = 'none';
    if (isSuperAdmin) scope = 'full';
    else if (isAdmin) scope = 'limited';
    else if (permissionScope.canDeleteOwn) scope = 'own';

    const restrictions: string[] = [];
    if (!isSessionValid()) restrictions.push('תוקף ההפעלה פג');
    if (securityState.suspiciousActivityDetected) restrictions.push('זוהתה פעילות חשודה');
    if (securityState.rateLimitStatus.isLocked) restrictions.push('חרגת מהמגבלה');
    if (permissionScope.entityRestrictions.length > 0) restrictions.push('הרשאה מוגבלת לישויות ספציפיות');

    return {
      canDelete: permissionScope.canDeleteOwn || permissionScope.canDeleteAny,
      canBulkDelete: permissionScope.canBulkDelete,
      canCascadeDelete: permissionScope.canCascadeDelete,
      canCleanupOrphans: permissionScope.canCleanupOrphans,
      scope,
      restrictions,
      maxOperationsPerMinute: permissionScope.maxDeletionsPerMinute,
      requiresVerification: !isSuperAdmin,
      errorMessage: restrictions.length > 0 ? restrictions[0] : undefined
    };
  }, [isAuthenticated, user, permissionScope, securityState, isSessionValid]);

  // Security status
  const securityStatus = useMemo(() => ({
    hasActiveSession: isSessionValid(),
    rateLimitStatus: securityState.rateLimitStatus.isLocked ? 'exceeded' as const :
                     Object.values(securityState.rateLimitStatus).some(limit => 
                       typeof limit === 'object' && 'count' in limit && limit.count >= 3
                     ) ? 'warning' as const : 'ok' as const,
    suspiciousActivity: securityState.suspiciousActivityDetected,
    lastPermissionCheck: lastCheck
  }), [isSessionValid, securityState, lastCheck]);

  // Check student deletion permission
  const checkStudentDeletion = useCallback(async (
    studentId: string,
    options: PermissionCheckOptions = {}
  ): Promise<StudentDeletePermission> => {
    const cacheKey = `student_${studentId}_${JSON.stringify(options)}`;
    
    if (!options.skipCache && permissionCache.has(cacheKey)) {
      const cached = permissionCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.result;
      }
    }

    setLastCheck(new Date());
    recordActivity('student_deletion_permission_check', { studentId, options });

    try {
      // Base permission check
      const hasPermission = await validateDeletionPermission(studentId, 'single');
      
      if (!hasPermission) {
        const result: StudentDeletePermission = {
          ...basePermissions,
          studentId,
          isOwn: false,
          entityRelations: [],
          riskLevel: 'medium',
          canDelete: false,
          errorMessage: 'אין הרשאה למחוק תלמיד זה'
        };
        
        permissionCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      // Fetch student data for risk assessment (mock for now)
      const studentData = {
        hasActiveEnrollments: Math.random() > 0.5,
        hasFinancialRecords: Math.random() > 0.3,
        hasActivePerformances: Math.random() > 0.7,
        isOrchestryMember: Math.random() > 0.6,
        hasAssignedInstruments: Math.random() > 0.4,
        parentContactsCount: Math.floor(Math.random() * 4) + 1,
        teacherAssignments: Math.floor(Math.random() * 5) + 1,
        attendanceRecords: Math.floor(Math.random() * 100)
      };

      const riskLevel = assessStudentDeletionRisk(studentData);
      const isOwn = permissionScope?.entityRestrictions.includes(studentId) ?? false;
      
      const result: StudentDeletePermission = {
        ...basePermissions,
        studentId,
        isOwn,
        entityRelations: [
          studentData.hasActiveEnrollments ? 'הרשמות פעילות' : '',
          studentData.hasFinancialRecords ? 'רישומים כספיים' : '',
          studentData.isOrchestryMember ? 'חבר בתזמורת' : ''
        ].filter(Boolean),
        riskLevel,
        requiresVerification: riskLevel === 'high' || riskLevel === 'critical'
      };

      permissionCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;

    } catch (error) {
      console.error('Student deletion permission check failed:', error);
      recordActivity('student_deletion_permission_error', { studentId, error: error.message });
      
      const result: StudentDeletePermission = {
        ...basePermissions,
        studentId,
        isOwn: false,
        entityRelations: [],
        riskLevel: 'critical',
        canDelete: false,
        errorMessage: 'שגיאה בבדיקת הרשאות'
      };
      
      return result;
    }
  }, [basePermissions, validateDeletionPermission, permissionScope, permissionCache, recordActivity]);

  // Check bulk deletion permission
  const checkBulkDeletion = useCallback(async (
    studentIds: string[],
    options: PermissionCheckOptions = {}
  ): Promise<BulkDeletePermission> => {
    recordActivity('bulk_deletion_permission_check', { studentCount: studentIds.length, options });

    const maxBatchSize = basePermissions.scope === 'full' ? 50 :
                        basePermissions.scope === 'limited' ? 20 : 5;

    if (studentIds.length > maxBatchSize) {
      return {
        maxBatchSize,
        allowedEntityTypes: [],
        requiresAdminApproval: true,
        estimatedDuration: 0,
        impactScope: [`חרגת מהמגבלה של ${maxBatchSize} תלמידים`]
      };
    }

    // Check each student individually
    const permissionResults = await Promise.all(
      studentIds.slice(0, 10).map(id => checkStudentDeletion(id, options)) // Check first 10 for performance
    );

    const hasAnyHighRisk = permissionResults.some(r => r.riskLevel === 'high' || r.riskLevel === 'critical');
    const hasAnyRestricted = permissionResults.some(r => !r.canDelete);
    
    return {
      maxBatchSize,
      allowedEntityTypes: hasAnyRestricted ? [] : ['student'],
      requiresAdminApproval: hasAnyHighRisk || studentIds.length > 10,
      estimatedDuration: Math.ceil(studentIds.length * 2), // 2 seconds per student
      impactScope: [
        `${studentIds.length} תלמידים`,
        hasAnyHighRisk ? 'כולל תלמידים עם סיכון גבוה' : '',
        permissionResults.length > 0 ? `${permissionResults.reduce((sum, r) => sum + r.entityRelations.length, 0)} קשרים נוספים` : ''
      ].filter(Boolean)
    };
  }, [basePermissions, checkStudentDeletion, recordActivity]);

  // Check cascade deletion permission
  const checkCascadeDeletion = useCallback(async (
    studentId: string,
    scope: string[] = []
  ): Promise<StudentDeletePermission> => {
    recordActivity('cascade_deletion_permission_check', { studentId, scope });

    if (!basePermissions.canCascadeDelete) {
      return {
        ...basePermissions,
        studentId,
        isOwn: false,
        entityRelations: [],
        riskLevel: 'critical',
        canDelete: false,
        errorMessage: 'אין הרשאה למחיקה מדורגת'
      };
    }

    const hasPermission = await validateDeletionPermission(studentId, 'cascade');
    const studentPermission = await checkStudentDeletion(studentId);

    return {
      ...studentPermission,
      canDelete: hasPermission,
      canCascadeDelete: hasPermission,
      riskLevel: 'critical', // Cascade operations are always high risk
      requiresVerification: true,
      entityRelations: [
        ...studentPermission.entityRelations,
        'מחיקה מדורגת של כל הנתונים הקשורים'
      ]
    };
  }, [basePermissions, validateDeletionPermission, checkStudentDeletion, recordActivity]);

  // Validate operation
  const validateOperation = useCallback(async (
    operation: 'single' | 'bulk' | 'cascade' | 'cleanup',
    context?: any
  ): Promise<boolean> => {
    recordActivity('operation_validation', { operation, context });

    // Check rate limits
    if (checkRateLimit && !checkRateLimit(operation === 'bulk' ? 'bulk' : operation === 'cascade' ? 'cleanup' : 'single')) {
      setError('חרגת מהמגבלה, נסה שוב מאוחר יותר');
      return false;
    }

    // Check session validity
    if (!isSessionValid()) {
      setError('תוקף ההפעלה פג, יש להתחבר מחדש');
      return false;
    }

    // Check suspicious activity
    if (securityState.suspiciousActivityDetected) {
      setError('זוהתה פעילות חשודה, החשבון נחסם זמנית');
      return false;
    }

    // Operation-specific validations
    switch (operation) {
      case 'single':
        return basePermissions.canDelete;
      case 'bulk':
        return basePermissions.canBulkDelete;
      case 'cascade':
        return basePermissions.canCascadeDelete;
      case 'cleanup':
        return basePermissions.canCleanupOrphans;
      default:
        return false;
    }
  }, [basePermissions, checkRateLimit, isSessionValid, securityState, recordActivity]);

  // Validate entity access
  const validateEntityAccess = useCallback((
    entityId: string,
    entityType: 'student' | 'teacher' | 'class'
  ): boolean => {
    if (!permissionScope) return false;

    // Super admin has access to everything
    if (permissionScope.canDeleteAny) return true;

    // Check entity restrictions
    if (permissionScope.entityRestrictions.length === 0) return permissionScope.canDeleteOwn;
    
    return permissionScope.entityRestrictions.includes(entityId);
  }, [permissionScope]);

  // Validate time window
  const validateTimeWindow = useCallback((): boolean => {
    const now = new Date();
    const hour = now.getHours();
    
    // Restrict dangerous operations during off-hours (22:00 - 06:00)
    const isOffHours = hour >= 22 || hour <= 6;
    
    if (isOffHours && (basePermissions.canBulkDelete || basePermissions.canCascadeDelete)) {
      // Only super admin can perform bulk/cascade operations during off-hours
      const userRole = user?.role || user?.userData?.role;
      return userRole === 'super_admin' || userRole === 'מנהל עליון';
    }
    
    return true;
  }, [basePermissions, user]);

  // Get permission summary
  const getPermissionSummary = useCallback(() => {
    const userRole = user?.role || user?.userData?.role;
    const roleHierarchy = [
      userRole === 'super_admin' || userRole === 'מנהל עליון' ? 'מנהל עליון' : '',
      userRole === 'admin' || userRole === 'מנהל' ? 'מנהל' : '',
      userRole === 'teacher' || userRole === 'מורה' ? 'מורה' : '',
      userRole === 'staff' ? 'צוות' : ''
    ].filter(Boolean);

    let securityLevel: 'basic' | 'standard' | 'enhanced' | 'maximum' = 'basic';
    if (basePermissions.canCascadeDelete) securityLevel = 'maximum';
    else if (basePermissions.canBulkDelete) securityLevel = 'enhanced';
    else if (basePermissions.canDelete) securityLevel = 'standard';

    return {
      totalPermissions: Object.values(basePermissions).filter(v => v === true).length,
      activeRestrictions: basePermissions.restrictions.length,
      securityLevel,
      roleHierarchy
    };
  }, [basePermissions, user]);

  // Refresh permissions
  const refreshPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPermissionCache(new Map());
    
    try {
      // This would typically refetch user data and permissions
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      recordActivity('permissions_refreshed');
    } catch (error) {
      setError('שגיאה בעדכון הרשאות');
      recordActivity('permissions_refresh_error', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [recordActivity]);

  // Initialize
  useEffect(() => {
    setLoading(false);
    if (isAuthenticated && user) {
      recordActivity('delete_permissions_initialized', { 
        userRole: user.role || user.userData?.role,
        permissions: Object.keys(basePermissions).filter(key => basePermissions[key] === true)
      });
    }
  }, [isAuthenticated, user, basePermissions, recordActivity]);

  return {
    permissions: basePermissions,
    loading,
    error,
    checkStudentDeletion,
    checkBulkDeletion,
    checkCascadeDeletion,
    validateOperation,
    validateEntityAccess,
    validateTimeWindow,
    getPermissionSummary,
    refreshPermissions,
    securityStatus
  };
}

export default useDeletePermissions;