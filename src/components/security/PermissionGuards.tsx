import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDeletionSecurity } from '../../contexts/DeletionSecurityContext';
import { useAuth } from '../../services/authContext';
import { Alert, Typography, Box, Button } from '@mui/material';
import { SecurityOutlined, Warning, Block } from '@mui/icons-material';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission: 'delete_single' | 'delete_bulk' | 'delete_cascade' | 'delete_cleanup';
  studentId?: string;
  fallback?: ReactNode;
  showFallback?: boolean;
  onPermissionDenied?: () => void;
}

interface AdminOnlyRouteProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

interface DeletionGuardProps {
  children: ReactNode;
  operation: 'single' | 'bulk' | 'cascade' | 'cleanup';
  studentId?: string;
  entityScope?: 'own' | 'any';
  showSecurityStatus?: boolean;
}

// Hebrew error messages
const HEBREW_MESSAGES = {
  noPermission: 'אין לך הרשאה לבצע פעולה זו',
  adminOnly: 'פעולה זו מוגבלת למנהלים בלבד',
  superAdminOnly: 'פעולה זו מוגבלת למנהל עליון בלבד',
  sessionExpired: 'תוקף ההפעלה פג, יש להתחבר מחדש',
  rateLimitExceeded: 'חרגת מהמגבלה, נסה שוב מאוחר יותר',
  suspiciousActivity: 'זוהתה פעילות חשודה, החשבון נחסם זמנית',
  noStudentAccess: 'אין לך הרשאה למחוק תלמיד זה',
  verificationRequired: 'נדרש אימות נוסף לפני ביצוע הפעולה'
};

// Basic permission guard for any deletion operation
export function DeletionPermissionGuard({ 
  children, 
  requiredPermission, 
  studentId, 
  fallback, 
  showFallback = true,
  onPermissionDenied 
}: PermissionGuardProps) {
  const { validateDeletionPermission, securityState, recordActivity } = useDeletionSecurity();
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function checkPermission() {
      if (!user || !studentId) {
        setHasPermission(false);
        setErrorMessage(HEBREW_MESSAGES.noPermission);
        return;
      }

      try {
        // Map permission types to scope
        const scope = requiredPermission === 'delete_bulk' ? 'bulk' :
                     requiredPermission === 'delete_cascade' ? 'cascade' : 'single';
        
        const hasAccess = await validateDeletionPermission(studentId, scope);
        
        if (!hasAccess) {
          // Determine specific error message
          if (securityState.suspiciousActivityDetected) {
            setErrorMessage(HEBREW_MESSAGES.suspiciousActivity);
          } else if (securityState.rateLimitStatus.isLocked) {
            setErrorMessage(HEBREW_MESSAGES.rateLimitExceeded);
          } else {
            setErrorMessage(HEBREW_MESSAGES.noStudentAccess);
          }
          
          onPermissionDenied?.();
        }
        
        setHasPermission(hasAccess);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
        setErrorMessage(HEBREW_MESSAGES.noPermission);
        recordActivity('permission_guard_error', { error: error.message, requiredPermission, studentId });
      }
    }

    checkPermission();
  }, [user, studentId, requiredPermission, validateDeletionPermission, securityState, onPermissionDenied, recordActivity]);

  // Loading state
  if (hasPermission === null) {
    return (
      <Box display="flex" alignItems="center" gap={1} p={2}>
        <SecurityOutlined />
        <Typography>בודק הרשאות...</Typography>
      </Box>
    );
  }

  // Permission denied
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Alert 
        severity="error" 
        icon={<Block />}
        sx={{ 
          direction: 'rtl',
          textAlign: 'right',
          mt: 2 
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          גישה נדחתה
        </Typography>
        <Typography variant="body2">
          {errorMessage}
        </Typography>
      </Alert>
    );
  }

  return <>{children}</>;
}

// Admin-only route wrapper
export function AdminOnlyRoute({ children, requireSuperAdmin = false }: AdminOnlyRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const { recordActivity } = useDeletionSecurity();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role || user?.userData?.role;
  const isAdmin = userRole === 'admin' || userRole === 'מנהל';
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'מנהל עליון';

  const hasAccess = requireSuperAdmin ? isSuperAdmin : (isAdmin || isSuperAdmin);

  if (!hasAccess) {
    recordActivity('admin_route_access_denied', { 
      userRole, 
      requireSuperAdmin, 
      route: window.location.pathname 
    });

    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="50vh"
        sx={{ direction: 'rtl', textAlign: 'center' }}
      >
        <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          אין הרשאה
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          {requireSuperAdmin ? HEBREW_MESSAGES.superAdminOnly : HEBREW_MESSAGES.adminOnly}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => window.history.back()}
          sx={{ direction: 'ltr' }}
        >
          חזור
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}

// Comprehensive deletion guard with security status
export function DeletionGuard({
  children,
  operation,
  studentId,
  entityScope = 'own',
  showSecurityStatus = true
}: DeletionGuardProps) {
  const { 
    validateDeletionPermission, 
    securityState, 
    permissionScope,
    isSessionValid,
    recordActivity 
  } = useDeletionSecurity();
  const { user } = useAuth();
  
  const [guardStatus, setGuardStatus] = useState<{
    loading: boolean;
    authorized: boolean;
    errorCode: string | null;
    errorMessage: string;
  }>({
    loading: true,
    authorized: false,
    errorCode: null,
    errorMessage: ''
  });

  useEffect(() => {
    async function performSecurityCheck() {
      setGuardStatus(prev => ({ ...prev, loading: true }));

      try {
        // Check 1: User authentication
        if (!user) {
          setGuardStatus({
            loading: false,
            authorized: false,
            errorCode: 'NO_AUTH',
            errorMessage: HEBREW_MESSAGES.sessionExpired
          });
          return;
        }

        // Check 2: Session validity
        if (!isSessionValid()) {
          setGuardStatus({
            loading: false,
            authorized: false,
            errorCode: 'SESSION_EXPIRED',
            errorMessage: HEBREW_MESSAGES.sessionExpired
          });
          return;
        }

        // Check 3: Suspicious activity
        if (securityState.suspiciousActivityDetected) {
          setGuardStatus({
            loading: false,
            authorized: false,
            errorCode: 'SUSPICIOUS_ACTIVITY',
            errorMessage: HEBREW_MESSAGES.suspiciousActivity
          });
          return;
        }

        // Check 4: Rate limiting
        if (securityState.rateLimitStatus.isLocked) {
          setGuardStatus({
            loading: false,
            authorized: false,
            errorCode: 'RATE_LIMITED',
            errorMessage: HEBREW_MESSAGES.rateLimitExceeded
          });
          return;
        }

        // Check 5: Operation-specific permissions
        if (!permissionScope) {
          setGuardStatus({
            loading: false,
            authorized: false,
            errorCode: 'NO_PERMISSIONS',
            errorMessage: HEBREW_MESSAGES.noPermission
          });
          return;
        }

        // Check operation type permissions
        let hasOperationPermission = false;
        switch (operation) {
          case 'single':
            hasOperationPermission = entityScope === 'own' ? 
              permissionScope.canDeleteOwn : permissionScope.canDeleteAny;
            break;
          case 'bulk':
            hasOperationPermission = permissionScope.canBulkDelete;
            break;
          case 'cascade':
            hasOperationPermission = permissionScope.canCascadeDelete;
            break;
          case 'cleanup':
            hasOperationPermission = permissionScope.canCleanupOrphans;
            break;
        }

        if (!hasOperationPermission) {
          setGuardStatus({
            loading: false,
            authorized: false,
            errorCode: 'INSUFFICIENT_PERMISSIONS',
            errorMessage: HEBREW_MESSAGES.noPermission
          });
          return;
        }

        // Check 6: Student-specific access (if studentId provided)
        if (studentId) {
          const hasStudentAccess = await validateDeletionPermission(studentId, operation === 'bulk' ? 'bulk' : operation === 'cascade' ? 'cascade' : 'single');
          
          if (!hasStudentAccess) {
            setGuardStatus({
              loading: false,
              authorized: false,
              errorCode: 'STUDENT_ACCESS_DENIED',
              errorMessage: HEBREW_MESSAGES.noStudentAccess
            });
            return;
          }
        }

        // All checks passed
        setGuardStatus({
          loading: false,
          authorized: true,
          errorCode: null,
          errorMessage: ''
        });

        recordActivity('deletion_guard_passed', { operation, studentId, entityScope });

      } catch (error) {
        console.error('Deletion guard error:', error);
        setGuardStatus({
          loading: false,
          authorized: false,
          errorCode: 'SYSTEM_ERROR',
          errorMessage: 'שגיאת מערכת, נסה שוב מאוחר יותר'
        });
        recordActivity('deletion_guard_error', { error: error.message, operation, studentId });
      }
    }

    performSecurityCheck();
  }, [
    user, 
    operation, 
    studentId, 
    entityScope, 
    securityState, 
    permissionScope, 
    validateDeletionPermission,
    isSessionValid,
    recordActivity
  ]);

  // Loading state
  if (guardStatus.loading) {
    return (
      <Box display="flex" alignItems="center" gap={1} p={2}>
        <SecurityOutlined sx={{ animation: 'pulse 1s infinite' }} />
        <Typography>מבצע בדיקות אבטחה...</Typography>
      </Box>
    );
  }

  // Security check failed
  if (!guardStatus.authorized) {
    return (
      <Alert 
        severity="error"
        icon={<Block />}
        sx={{ 
          direction: 'rtl',
          textAlign: 'right',
          mt: 2
        }}
        action={
          guardStatus.errorCode === 'SESSION_EXPIRED' && (
            <Button 
              color="inherit" 
              size="small"
              onClick={() => window.location.reload()}
            >
              רענן דף
            </Button>
          )
        }
      >
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          בדיקת אבטחה נכשלה
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {guardStatus.errorMessage}
        </Typography>
        {showSecurityStatus && (
          <Typography variant="caption" sx={{ mt: 1, opacity: 0.8 }}>
            קוד שגיאה: {guardStatus.errorCode}
          </Typography>
        )}
      </Alert>
    );
  }

  // Security status indicator (if enabled)
  const securityStatusIndicator = showSecurityStatus && (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        mb: 2, 
        p: 1,
        backgroundColor: 'success.light',
        borderRadius: 1,
        direction: 'rtl'
      }}
    >
      <SecurityOutlined sx={{ color: 'success.dark', fontSize: 16 }} />
      <Typography variant="caption" sx={{ color: 'success.dark' }}>
        בדיקת אבטחה הושלמה בהצלחה
      </Typography>
    </Box>
  );

  return (
    <>
      {securityStatusIndicator}
      {children}
    </>
  );
}

export default {
  DeletionPermissionGuard,
  AdminOnlyRoute,
  DeletionGuard
};