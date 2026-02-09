import React, { ComponentType, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Alert,
  Typography,
  IconButton,
  Tooltip,
  Badge,
  Chip,
  LinearProgress,
  Collapse
} from '@mui/material';
import {
  Security,
  Warning,
  Block,
  Timer,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  Info
} from '@mui/icons-material';
import { useDeletionSecurity } from '../../contexts/DeletionSecurityContext';
import { useDeletePermissions } from '../../hooks/useDeletePermissions';
import { useAuth } from '../../services/authContext';
import { MultiStepVerification } from './MultiStepVerification';

// Types for HOC props
interface WithDeletionSecurityOptions {
  requiresVerification?: boolean;
  operationType?: 'single' | 'bulk' | 'cascade' | 'cleanup';
  showSecurityStatus?: boolean;
  autoRefreshSession?: boolean;
  fallbackComponent?: ComponentType<any>;
}

interface SecureDeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  studentId?: string;
  studentName?: string;
  operationType?: 'single' | 'bulk' | 'cascade' | 'cleanup';
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error' | 'warning';
  children?: ReactNode;
  requiresVerification?: boolean;
  showPermissionStatus?: boolean;
}

interface RateLimitedActionProps {
  action: 'single' | 'bulk' | 'cleanup';
  maxOperations?: number;
  onRateExceeded?: () => void;
  children: ReactNode;
  disabled?: boolean;
}

interface SessionValidatorProps {
  children: ReactNode;
  onSessionExpired?: () => void;
  showWarning?: boolean;
  autoRefresh?: boolean;
}

interface AutoLogoutHandlerProps {
  children: ReactNode;
  suspiciousActivityThreshold?: number;
  onSuspiciousActivity?: () => void;
}

// Hebrew messages
const HEBREW_MESSAGES = {
  securityCheck: 'בדיקת אבטחה',
  verificationRequired: 'נדרש אימות',
  permissionDenied: 'אין הרשאה',
  rateLimited: 'חרגת מהמגבלה',
  sessionExpired: 'תוקף ההפעלה פג',
  suspiciousActivity: 'פעילות חשודה',
  securityActive: 'אבטחה פעילה',
  refreshSession: 'רענן הפעלה',
  tryAgain: 'נסה שוב',
  cancel: 'ביטול',
  proceed: 'המשך',
  loading: 'טוען...'
};

// Higher-Order Component for deletion security
export function withDeletionSecurity<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithDeletionSecurityOptions = {}
) {
  const {
    requiresVerification = false,
    operationType = 'single',
    showSecurityStatus = true,
    autoRefreshSession = true,
    fallbackComponent: FallbackComponent
  } = options;

  return function SecuredComponent(props: P) {
    const { 
      securityState, 
      validateDeletionPermission, 
      isSessionValid,
      refreshSecuritySession,
      recordActivity 
    } = useDeletionSecurity();
    const { permissions, securityStatus } = useDeletePermissions();
    
    const [securityChecked, setSecurityChecked] = useState(false);
    const [securityPassed, setSecurityPassed] = useState(false);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Perform security check
    useEffect(() => {
      async function performSecurityCheck() {
        setLoading(true);
        
        try {
          recordActivity('security_wrapper_check', { 
            component: WrappedComponent.name,
            operationType 
          });

          // Check 1: Session validity
          if (!isSessionValid()) {
            if (autoRefreshSession) {
              const refreshed = await refreshSecuritySession();
              if (!refreshed) {
                setError(HEBREW_MESSAGES.sessionExpired);
                setSecurityPassed(false);
                setSecurityChecked(true);
                setLoading(false);
                return;
              }
            } else {
              setError(HEBREW_MESSAGES.sessionExpired);
              setSecurityPassed(false);
              setSecurityChecked(true);
              setLoading(false);
              return;
            }
          }

          // Check 2: Suspicious activity
          if (securityState.suspiciousActivityDetected) {
            setError(HEBREW_MESSAGES.suspiciousActivity);
            setSecurityPassed(false);
            setSecurityChecked(true);
            setLoading(false);
            return;
          }

          // Check 3: Rate limiting
          if (securityState.rateLimitStatus.isLocked) {
            setError(HEBREW_MESSAGES.rateLimited);
            setSecurityPassed(false);
            setSecurityChecked(true);
            setLoading(false);
            return;
          }

          // Check 4: Basic permissions
          if (!permissions.canDelete && operationType !== 'cleanup') {
            setError(HEBREW_MESSAGES.permissionDenied);
            setSecurityPassed(false);
            setSecurityChecked(true);
            setLoading(false);
            return;
          }

          // All checks passed
          setSecurityPassed(true);
          setError('');
          recordActivity('security_wrapper_passed', { 
            component: WrappedComponent.name,
            operationType 
          });

        } catch (error) {
          console.error('Security check failed:', error);
          setError('שגיאת מערכת');
          setSecurityPassed(false);
          recordActivity('security_wrapper_error', { 
            component: WrappedComponent.name,
            error: error.message 
          });
        } finally {
          setSecurityChecked(true);
          setLoading(false);
        }
      }

      performSecurityCheck();
    }, [
      securityState, 
      permissions, 
      isSessionValid, 
      refreshSecuritySession, 
      autoRefreshSession, 
      operationType,
      recordActivity
    ]);

    // Loading state
    if (loading || !securityChecked) {
      return (
        <Box display="flex" alignItems="center" gap={1} p={2}>
          <Security sx={{ animation: 'pulse 1s infinite' }} />
          <Typography>{HEBREW_MESSAGES.loading}</Typography>
        </Box>
      );
    }

    // Security failed
    if (!securityPassed) {
      if (FallbackComponent) {
        return <FallbackComponent {...props} securityError={error} />;
      }

      return (
        <Alert 
          severity="error" 
          sx={{ direction: 'rtl', textAlign: 'right' }}
          action={
            error === HEBREW_MESSAGES.sessionExpired && (
              <Button 
                color="inherit" 
                size="small"
                onClick={() => window.location.reload()}
                startIcon={<Refresh />}
              >
                {HEBREW_MESSAGES.refreshSession}
              </Button>
            )
          }
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {HEBREW_MESSAGES.securityCheck} נכשל
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        </Alert>
      );
    }

    // Security status indicator
    const securityStatusIndicator = showSecurityStatus && (
      <Box 
        sx={{ 
          mb: 1,
          p: 1,
          backgroundColor: 'success.light',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          direction: 'rtl'
        }}
      >
        <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
        <Typography variant="caption" sx={{ color: 'success.dark' }}>
          {HEBREW_MESSAGES.securityActive}
        </Typography>
      </Box>
    );

    return (
      <>
        {securityStatusIndicator}
        <WrappedComponent {...props} />
      </>
    );
  };
}

// Secure delete button with built-in validations
export function SecureDeleteButton({
  onClick,
  disabled = false,
  loading = false,
  studentId,
  studentName,
  operationType = 'single',
  variant = 'outlined',
  size = 'medium',
  color = 'error',
  children = 'מחק',
  requiresVerification = true,
  showPermissionStatus = true
}: SecureDeleteButtonProps) {
  const { 
    validateDeletionPermission, 
    checkRateLimit, 
    updateRateLimit,
    recordActivity 
  } = useDeletionSecurity();
  const { checkStudentDeletion } = useDeletePermissions();
  
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [permissionError, setPermissionError] = useState<string>('');

  // Check permissions on mount and when studentId changes
  useEffect(() => {
    if (studentId) {
      checkPermissions();
    } else {
      setPermissionChecked(true);
      setHasPermission(true); // Allow for non-student operations
    }
  }, [studentId]);

  const checkPermissions = useCallback(async () => {
    if (!studentId) return;
    
    setButtonLoading(true);
    
    try {
      const rateLimitAction = operationType === 'bulk' ? 'bulk' : 
                             operationType === 'cascade' ? 'cleanup' : 'single';
      
      // Check rate limit first
      if (!checkRateLimit(rateLimitAction)) {
        setPermissionError(HEBREW_MESSAGES.rateLimited);
        setHasPermission(false);
        setPermissionChecked(true);
        return;
      }

      // Check student-specific permission
      const studentPermission = await checkStudentDeletion(studentId);
      
      if (!studentPermission.canDelete) {
        setPermissionError(studentPermission.errorMessage || HEBREW_MESSAGES.permissionDenied);
        setHasPermission(false);
      } else {
        setHasPermission(true);
        setPermissionError('');
      }
      
      recordActivity('secure_button_permission_check', { 
        studentId, 
        operationType, 
        hasPermission: studentPermission.canDelete 
      });
      
    } catch (error) {
      console.error('Permission check failed:', error);
      setPermissionError('שגיאה בבדיקת הרשאות');
      setHasPermission(false);
      recordActivity('secure_button_error', { error: error.message, studentId });
    } finally {
      setPermissionChecked(true);
      setButtonLoading(false);
    }
  }, [studentId, operationType, checkRateLimit, checkStudentDeletion, recordActivity]);

  const handleClick = useCallback(async () => {
    if (!hasPermission || disabled || loading) return;

    recordActivity('secure_button_clicked', { studentId, operationType });

    if (requiresVerification) {
      setShowVerification(true);
    } else {
      // Update rate limit and proceed
      const rateLimitAction = operationType === 'bulk' ? 'bulk' : 
                             operationType === 'cascade' ? 'cleanup' : 'single';
      updateRateLimit(rateLimitAction);
      onClick();
    }
  }, [hasPermission, disabled, loading, requiresVerification, studentId, operationType, updateRateLimit, onClick, recordActivity]);

  const handleVerificationComplete = useCallback((verified: boolean) => {
    setShowVerification(false);
    
    if (verified) {
      recordActivity('secure_button_verified', { studentId, operationType });
      
      // Update rate limit and proceed
      const rateLimitAction = operationType === 'bulk' ? 'bulk' : 
                             operationType === 'cascade' ? 'cleanup' : 'single';
      updateRateLimit(rateLimitAction);
      onClick();
    } else {
      recordActivity('secure_button_verification_failed', { studentId, operationType });
    }
  }, [studentId, operationType, updateRateLimit, onClick, recordActivity]);

  // Show loading state
  if (!permissionChecked) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        startIcon={<Security sx={{ fontSize: 16, animation: 'pulse 1s infinite' }} />}
      >
        בודק...
      </Button>
    );
  }

  // Show permission error
  if (!hasPermission && showPermissionStatus) {
    return (
      <Tooltip title={permissionError} placement="top">
        <Box>
          <Button
            variant={variant}
            size={size}
            disabled
            startIcon={<Block />}
            sx={{ color: 'text.disabled' }}
          >
            {children}
          </Button>
        </Box>
      </Tooltip>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        color={color}
        disabled={disabled || loading || buttonLoading || !hasPermission}
        onClick={handleClick}
        startIcon={loading || buttonLoading ? 
          <LinearProgress sx={{ width: 16, height: 2 }} /> : 
          <Security />
        }
      >
        {loading || buttonLoading ? HEBREW_MESSAGES.loading : children}
      </Button>

      {showVerification && (
        <MultiStepVerification
          open={showVerification}
          onClose={() => setShowVerification(false)}
          onVerificationComplete={handleVerificationComplete}
          studentData={studentId ? {
            id: studentId,
            name: studentName || '',
            hebrewName: studentName
          } : undefined}
          operationType={operationType}
          requiresBiometric={operationType === 'cascade'}
        />
      )}
    </>
  );
}

// Rate-limited action wrapper
export function RateLimitedAction({
  action,
  maxOperations,
  onRateExceeded,
  children,
  disabled = false
}: RateLimitedActionProps) {
  const { checkRateLimit, securityState, recordActivity } = useDeletionSecurity();
  
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0);

  // Check rate limit status
  useEffect(() => {
    const rateLimitKey = action === 'single' ? 'singleDeletion' : 
                         action === 'bulk' ? 'bulkDeletion' : 'cleanupOperations';
    
    const currentLimit = securityState.rateLimitStatus[rateLimitKey];
    const now = new Date();
    
    if (currentLimit.resetTime > now) {
      const timeLeft = Math.ceil((currentLimit.resetTime.getTime() - now.getTime()) / 1000);
      setTimeUntilReset(timeLeft);
      
      // Check if rate limit is exceeded
      const maxOps = maxOperations || (action === 'single' ? 5 : action === 'bulk' ? 1 : 1);
      const exceeded = currentLimit.count >= maxOps;
      setRateLimitExceeded(exceeded);
      
      if (exceeded && onRateExceeded) {
        onRateExceeded();
      }
    } else {
      setRateLimitExceeded(false);
      setTimeUntilReset(0);
    }
  }, [action, maxOperations, onRateExceeded, securityState.rateLimitStatus]);

  // Update timer
  useEffect(() => {
    if (timeUntilReset > 0) {
      const timer = setTimeout(() => {
        setTimeUntilReset(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeUntilReset]);

  if (rateLimitExceeded) {
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return minutes > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${remainingSeconds}s`;
    };

    return (
      <Box sx={{ direction: 'rtl' }}>
        <Alert 
          severity="warning" 
          icon={<Timer />}
          sx={{ mb: 2, textAlign: 'right' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {HEBREW_MESSAGES.rateLimited}
          </Typography>
          <Typography variant="caption">
            נסה שוב בעוד {formatTime(timeUntilReset)}
          </Typography>
        </Alert>
        <Box sx={{ opacity: 0.5, pointerEvents: 'none' }}>
          {children}
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
}

// Session validator wrapper
export function SessionValidator({
  children,
  onSessionExpired,
  showWarning = true,
  autoRefresh = false
}: SessionValidatorProps) {
  const { isSessionValid, refreshSecuritySession, securityState } = useDeletionSecurity();
  
  const [sessionStatus, setSessionStatus] = useState<'valid' | 'warning' | 'expired'>('valid');
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      if (!isSessionValid()) {
        setSessionStatus('expired');
        if (onSessionExpired) {
          onSessionExpired();
        }
      } else if (securityState.sessionValidUntil) {
        const timeLeft = securityState.sessionValidUntil.getTime() - Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeLeft < fiveMinutes && timeLeft > 0) {
          setSessionStatus('warning');
          
          if (autoRefresh && !autoRefreshing) {
            setAutoRefreshing(true);
            refreshSecuritySession().finally(() => {
              setAutoRefreshing(false);
            });
          }
        } else {
          setSessionStatus('valid');
        }
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 30 * 1000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isSessionValid, securityState.sessionValidUntil, onSessionExpired, autoRefresh, autoRefreshing, refreshSecuritySession]);

  if (sessionStatus === 'expired') {
    return (
      <Alert 
        severity="error" 
        sx={{ direction: 'rtl', textAlign: 'right' }}
        action={
          <Button 
            color="inherit" 
            size="small"
            onClick={() => window.location.reload()}
            startIcon={<Refresh />}
          >
            {HEBREW_MESSAGES.refreshSession}
          </Button>
        }
      >
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {HEBREW_MESSAGES.sessionExpired}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          יש להתחבר מחדש למערכת
        </Typography>
      </Alert>
    );
  }

  return (
    <>
      {showWarning && sessionStatus === 'warning' && (
        <Collapse in={sessionStatus === 'warning'}>
          <Alert 
            severity="warning" 
            sx={{ mb: 2, direction: 'rtl', textAlign: 'right' }}
            action={
              <Button 
                color="inherit" 
                size="small"
                disabled={autoRefreshing}
                onClick={async () => {
                  setAutoRefreshing(true);
                  await refreshSecuritySession();
                  setAutoRefreshing(false);
                }}
                startIcon={autoRefreshing ? <LinearProgress sx={{ width: 16, height: 2 }} /> : <Refresh />}
              >
                {autoRefreshing ? 'מרענן...' : HEBREW_MESSAGES.refreshSession}
              </Button>
            }
          >
            <Typography variant="body2">
              תוקף ההפעלה עומד לפוג בקרוב
            </Typography>
          </Alert>
        </Collapse>
      )}
      {children}
    </>
  );
}

// Auto-logout handler for suspicious activity
export function AutoLogoutHandler({
  children,
  suspiciousActivityThreshold = 5,
  onSuspiciousActivity
}: AutoLogoutHandlerProps) {
  const { securityState, lockUserAccount, recordActivity } = useDeletionSecurity();
  const { logout } = useAuth();
  
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (securityState.suspiciousActivityDetected) {
      setShowAlert(true);
      recordActivity('suspicious_activity_alert_shown');
      
      if (onSuspiciousActivity) {
        onSuspiciousActivity();
      } else {
        // Default behavior: lock account and logout after delay
        setTimeout(async () => {
          await lockUserAccount('Suspicious activity detected');
          recordActivity('auto_logout_suspicious_activity');
          logout();
        }, 5000);
      }
    }
  }, [securityState.suspiciousActivityDetected, onSuspiciousActivity, lockUserAccount, logout, recordActivity]);

  return (
    <>
      {showAlert && (
        <Alert 
          severity="error"
          sx={{ 
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 9999,
            direction: 'rtl',
            minWidth: 300
          }}
          onClose={() => setShowAlert(false)}
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {HEBREW_MESSAGES.suspiciousActivity}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            החשבון ינעל תוך 5 שניות
          </Typography>
        </Alert>
      )}
      {children}
    </>
  );
}

export default {
  withDeletionSecurity,
  SecureDeleteButton,
  RateLimitedAction,
  SessionValidator,
  AutoLogoutHandler
};