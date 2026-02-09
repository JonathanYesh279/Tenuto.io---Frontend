import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '../services/authContext';
import { usePermissions } from '../services/permissionsService';
import { auditTrailService } from '../services/auditTrailService';

export interface DeletionSecurityState {
  hasActiveDeletion: boolean;
  rateLimitStatus: RateLimitStatus;
  suspiciousActivityDetected: boolean;
  sessionValidUntil: Date | null;
  verificationLevel: 'none' | 'basic' | 'advanced' | 'biometric';
  lastActivity: Date | null;
}

export interface RateLimitStatus {
  singleDeletion: { count: number; resetTime: Date };
  bulkDeletion: { count: number; resetTime: Date };
  cleanupOperations: { count: number; resetTime: Date };
  isLocked: boolean;
  lockExpires?: Date;
}

export interface SecurityToken {
  token: string;
  operation: string;
  expiresAt: Date;
  studentId?: string;
  scope: 'single' | 'bulk' | 'cascade' | 'cleanup';
}

export interface DeletionPermissionScope {
  canDeleteOwn: boolean;
  canDeleteAny: boolean;
  canBulkDelete: boolean;
  canCascadeDelete: boolean;
  canCleanupOrphans: boolean;
  entityRestrictions: string[];
  maxDeletionsPerMinute: number;
}

export interface DeletionSecurityContextType {
  securityState: DeletionSecurityState;
  permissionScope: DeletionPermissionScope | null;
  
  // Permission checks
  validateDeletionPermission: (studentId: string, scope: 'single' | 'bulk' | 'cascade') => Promise<boolean>;
  checkRateLimit: (action: 'single' | 'bulk' | 'cleanup') => boolean;
  
  // Security operations
  generateSecurityToken: (operation: string, studentId?: string, scope?: SecurityToken['scope']) => Promise<SecurityToken>;
  validateSecurityToken: (token: string) => boolean;
  
  // Multi-step verification
  initiateVerification: (level: DeletionSecurityState['verificationLevel']) => Promise<boolean>;
  completeVerification: (verificationData: VerificationData) => Promise<boolean>;
  
  // Activity monitoring
  recordActivity: (action: string, metadata?: any) => void;
  detectSuspiciousPattern: () => boolean;
  
  // Emergency controls
  lockUserAccount: (reason: string) => Promise<void>;
  clearSecurityState: () => void;
  
  // Rate limiting
  updateRateLimit: (action: 'single' | 'bulk' | 'cleanup') => void;
  
  // Session management
  refreshSecuritySession: () => Promise<boolean>;
  isSessionValid: () => boolean;
}

export interface VerificationData {
  password?: string;
  typedConfirmation?: string;
  biometricData?: any;
  impactAcknowledgment?: boolean[];
  timeSpent?: number;
}

const DeletionSecurityContext = createContext<DeletionSecurityContextType | undefined>(undefined);

// Rate limiting constants
const RATE_LIMITS = {
  singleDeletion: { max: 5, windowMinutes: 1 },
  bulkDeletion: { max: 1, windowMinutes: 5 },
  cleanupOperations: { max: 1, windowMinutes: 60 },
  failedAttempts: { max: 3, lockMinutes: 15 }
};

// Suspicious activity patterns
const SUSPICIOUS_PATTERNS = {
  rapidDeletions: { threshold: 10, timeWindowMinutes: 5 },
  multipleFailedAuth: { threshold: 5, timeWindowMinutes: 10 },
  unusualHours: { startHour: 22, endHour: 6 },
  bulkAfterHours: true
};

export function DeletionSecurityProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const permissions = usePermissions();
  
  const [securityState, setSecurityState] = useState<DeletionSecurityState>({
    hasActiveDeletion: false,
    rateLimitStatus: initializeRateLimit(),
    suspiciousActivityDetected: false,
    sessionValidUntil: null,
    verificationLevel: 'none',
    lastActivity: null
  });

  const [permissionScope, setPermissionScope] = useState<DeletionPermissionScope | null>(null);
  const [activeTokens, setActiveTokens] = useState<SecurityToken[]>([]);
  const [activityLog, setActivityLog] = useState<Array<{
    action: string;
    timestamp: Date;
    metadata?: any;
    ipAddress?: string;
    deviceFingerprint?: string;
  }>>([]);

  // Initialize rate limit structure
  function initializeRateLimit(): RateLimitStatus {
    const now = new Date();
    return {
      singleDeletion: { count: 0, resetTime: new Date(now.getTime() + 60000) },
      bulkDeletion: { count: 0, resetTime: new Date(now.getTime() + 300000) },
      cleanupOperations: { count: 0, resetTime: new Date(now.getTime() + 3600000) },
      isLocked: false
    };
  }

  // Initialize permission scope based on user role
  useEffect(() => {
    if (!isAuthenticated || !user || !permissions) return;

    const userRole = user.role || user.userData?.role;
    const isAdmin = userRole === 'admin' || userRole === 'מנהל';
    const isSuperAdmin = userRole === 'super_admin' || userRole === 'מנהל עליון';
    
    const scope: DeletionPermissionScope = {
      canDeleteOwn: permissions.includes('delete_student') || isAdmin || isSuperAdmin,
      canDeleteAny: isAdmin || isSuperAdmin,
      canBulkDelete: permissions.includes('bulk_operations') && (isAdmin || isSuperAdmin),
      canCascadeDelete: isSuperAdmin,
      canCleanupOrphans: isSuperAdmin,
      entityRestrictions: isAdmin ? [] : [user.id],
      maxDeletionsPerMinute: isSuperAdmin ? 10 : isAdmin ? 5 : 2
    };

    setPermissionScope(scope);
  }, [isAuthenticated, user, permissions]);

  // Validate deletion permission
  const validateDeletionPermission = useCallback(async (
    studentId: string, 
    scope: 'single' | 'bulk' | 'cascade'
  ): Promise<boolean> => {
    if (!permissionScope || !user) {
      recordActivity('permission_check_failed', { reason: 'no_scope', studentId, scope });
      return false;
    }

    // Record permission check attempt
    recordActivity('permission_check', { studentId, scope });

    try {
      // Check basic permissions
      switch (scope) {
        case 'single':
          if (!permissionScope.canDeleteOwn) return false;
          break;
        case 'bulk':
          if (!permissionScope.canBulkDelete) return false;
          break;
        case 'cascade':
          if (!permissionScope.canCascadeDelete) return false;
          break;
      }

      // Check entity restrictions
      if (permissionScope.entityRestrictions.length > 0) {
        // For teachers, check if they can delete this specific student
        if (!permissionScope.canDeleteAny) {
          // This would need to be implemented based on teacher-student relationships
          // For now, assuming entity restrictions contain allowed student IDs
          if (!permissionScope.entityRestrictions.includes(studentId)) {
            recordActivity('permission_denied', { reason: 'entity_restriction', studentId });
            return false;
          }
        }
      }

      // Check rate limits
      const rateLimitAction = scope === 'bulk' ? 'bulk' : scope === 'cascade' ? 'cleanup' : 'single';
      if (!checkRateLimit(rateLimitAction)) {
        recordActivity('rate_limit_exceeded', { action: rateLimitAction, studentId });
        return false;
      }

      // Check for suspicious activity
      if (detectSuspiciousPattern()) {
        setSecurityState(prev => ({ ...prev, suspiciousActivityDetected: true }));
        recordActivity('suspicious_activity_detected', { studentId, scope });
        return false;
      }

      recordActivity('permission_granted', { studentId, scope });
      return true;

    } catch (error) {
      console.error('Permission validation error:', error);
      recordActivity('permission_check_error', { error: error.message, studentId, scope });
      return false;
    }
  }, [permissionScope, user, activityLog]);

  // Check rate limits
  const checkRateLimit = useCallback((action: 'single' | 'bulk' | 'cleanup'): boolean => {
    const now = new Date();
    const rateLimitKey = action === 'single' ? 'singleDeletion' : 
                         action === 'bulk' ? 'bulkDeletion' : 'cleanupOperations';
    
    const currentLimit = securityState.rateLimitStatus[rateLimitKey];
    
    // Check if we're in a locked state
    if (securityState.rateLimitStatus.isLocked) {
      if (securityState.rateLimitStatus.lockExpires && now < securityState.rateLimitStatus.lockExpires) {
        return false;
      } else {
        // Lock has expired, reset
        setSecurityState(prev => ({
          ...prev,
          rateLimitStatus: { ...prev.rateLimitStatus, isLocked: false, lockExpires: undefined }
        }));
      }
    }

    // Reset counter if time window has passed
    if (now >= currentLimit.resetTime) {
      const windowMinutes = action === 'single' ? 1 : action === 'bulk' ? 5 : 60;
      const newResetTime = new Date(now.getTime() + windowMinutes * 60000);
      
      setSecurityState(prev => ({
        ...prev,
        rateLimitStatus: {
          ...prev.rateLimitStatus,
          [rateLimitKey]: { count: 0, resetTime: newResetTime }
        }
      }));
      return true;
    }

    // Check if limit is exceeded
    const maxLimit = action === 'single' ? RATE_LIMITS.singleDeletion.max :
                     action === 'bulk' ? RATE_LIMITS.bulkDeletion.max : 
                     RATE_LIMITS.cleanupOperations.max;

    return currentLimit.count < maxLimit;
  }, [securityState.rateLimitStatus]);

  // Update rate limit after action
  const updateRateLimit = useCallback((action: 'single' | 'bulk' | 'cleanup') => {
    const rateLimitKey = action === 'single' ? 'singleDeletion' : 
                         action === 'bulk' ? 'bulkDeletion' : 'cleanupOperations';
    
    setSecurityState(prev => ({
      ...prev,
      rateLimitStatus: {
        ...prev.rateLimitStatus,
        [rateLimitKey]: {
          ...prev.rateLimitStatus[rateLimitKey],
          count: prev.rateLimitStatus[rateLimitKey].count + 1
        }
      }
    }));
  }, []);

  // Generate security token
  const generateSecurityToken = useCallback(async (
    operation: string, 
    studentId?: string, 
    scope: SecurityToken['scope'] = 'single'
  ): Promise<SecurityToken> => {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    const securityToken: SecurityToken = {
      token,
      operation,
      expiresAt,
      studentId,
      scope
    };

    setActiveTokens(prev => [...prev, securityToken]);
    recordActivity('security_token_generated', { operation, studentId, scope, token: token.substring(0, 8) });

    // Clean up expired tokens
    setTimeout(() => {
      setActiveTokens(prev => prev.filter(t => t.token !== token));
    }, 5 * 60 * 1000);

    return securityToken;
  }, []);

  // Validate security token
  const validateSecurityToken = useCallback((token: string): boolean => {
    const now = new Date();
    const activeToken = activeTokens.find(t => t.token === token && t.expiresAt > now);
    
    if (activeToken) {
      recordActivity('security_token_validated', { token: token.substring(0, 8) });
      return true;
    } else {
      recordActivity('security_token_validation_failed', { token: token.substring(0, 8) });
      return false;
    }
  }, [activeTokens]);

  // Record activity
  const recordActivity = useCallback((action: string, metadata?: any) => {
    const activity = {
      action,
      timestamp: new Date(),
      metadata,
      ipAddress: 'client-side', // Would need to be populated from server
      deviceFingerprint: navigator.userAgent // Simple fingerprint
    };

    setActivityLog(prev => [...prev.slice(-99), activity]); // Keep last 100 activities
    setSecurityState(prev => ({ ...prev, lastActivity: new Date() }));

    // Send to audit trail service
    if (auditTrailService) {
      auditTrailService.logAction({
        action,
        userId: user?.id,
        details: metadata,
        timestamp: activity.timestamp,
        category: 'deletion_security'
      });
    }
  }, [user]);

  // Detect suspicious patterns
  const detectSuspiciousPattern = useCallback((): boolean => {
    const now = new Date();
    const recentActivities = activityLog.filter(
      activity => now.getTime() - activity.timestamp.getTime() < 10 * 60 * 1000 // Last 10 minutes
    );

    // Pattern 1: Rapid deletions
    const deletionAttempts = recentActivities.filter(a => 
      a.action.includes('deletion') || a.action.includes('delete')
    );
    if (deletionAttempts.length >= SUSPICIOUS_PATTERNS.rapidDeletions.threshold) {
      return true;
    }

    // Pattern 2: Multiple failed authentications
    const failedAuth = recentActivities.filter(a => 
      a.action.includes('failed') || a.action.includes('denied')
    );
    if (failedAuth.length >= SUSPICIOUS_PATTERNS.multipleFailedAuth.threshold) {
      return true;
    }

    // Pattern 3: Activity during unusual hours
    const currentHour = now.getHours();
    if (currentHour >= SUSPICIOUS_PATTERNS.unusualHours.startHour || 
        currentHour <= SUSPICIOUS_PATTERNS.unusualHours.endHour) {
      const unusualHourActivities = recentActivities.filter(a => 
        a.action.includes('bulk') || a.action.includes('cascade')
      );
      if (unusualHourActivities.length > 0) {
        return true;
      }
    }

    return false;
  }, [activityLog]);

  // Initiate multi-step verification
  const initiateVerification = useCallback(async (
    level: DeletionSecurityState['verificationLevel']
  ): Promise<boolean> => {
    recordActivity('verification_initiated', { level });
    
    setSecurityState(prev => ({ 
      ...prev, 
      verificationLevel: level,
      sessionValidUntil: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    }));

    return true;
  }, []);

  // Complete verification
  const completeVerification = useCallback(async (verificationData: VerificationData): Promise<boolean> => {
    recordActivity('verification_attempt', { hasPassword: !!verificationData.password });

    // This would integrate with your authentication service
    // For now, we'll simulate verification
    const verificationSuccess = Math.random() > 0.1; // 90% success rate for demo

    if (verificationSuccess) {
      recordActivity('verification_completed', { level: securityState.verificationLevel });
      setSecurityState(prev => ({ 
        ...prev, 
        verificationLevel: 'advanced',
        sessionValidUntil: new Date(Date.now() + 30 * 60 * 1000)
      }));
    } else {
      recordActivity('verification_failed', { level: securityState.verificationLevel });
    }

    return verificationSuccess;
  }, [securityState.verificationLevel]);

  // Lock user account
  const lockUserAccount = useCallback(async (reason: string) => {
    recordActivity('account_locked', { reason });
    
    setSecurityState(prev => ({
      ...prev,
      rateLimitStatus: {
        ...prev.rateLimitStatus,
        isLocked: true,
        lockExpires: new Date(Date.now() + RATE_LIMITS.failedAttempts.lockMinutes * 60 * 1000)
      },
      suspiciousActivityDetected: true
    }));

    // This would integrate with your auth service to actually lock the account
  }, []);

  // Clear security state
  const clearSecurityState = useCallback(() => {
    setSecurityState({
      hasActiveDeletion: false,
      rateLimitStatus: initializeRateLimit(),
      suspiciousActivityDetected: false,
      sessionValidUntil: null,
      verificationLevel: 'none',
      lastActivity: null
    });
    setActiveTokens([]);
    setActivityLog([]);
    recordActivity('security_state_cleared');
  }, []);

  // Refresh security session
  const refreshSecuritySession = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;
    
    recordActivity('session_refresh_attempt');
    
    // This would validate with the server
    const sessionValid = true; // Simulate successful refresh
    
    if (sessionValid) {
      setSecurityState(prev => ({
        ...prev,
        sessionValidUntil: new Date(Date.now() + 30 * 60 * 1000)
      }));
      recordActivity('session_refreshed');
    } else {
      recordActivity('session_refresh_failed');
    }
    
    return sessionValid;
  }, [isAuthenticated]);

  // Check if session is valid
  const isSessionValid = useCallback((): boolean => {
    if (!securityState.sessionValidUntil) return false;
    return new Date() < securityState.sessionValidUntil;
  }, [securityState.sessionValidUntil]);

  // Auto-refresh session
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && securityState.sessionValidUntil) {
        const timeUntilExpiry = securityState.sessionValidUntil.getTime() - Date.now();
        // Refresh if less than 5 minutes remaining
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          refreshSecuritySession();
        }
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, securityState.sessionValidUntil, refreshSecuritySession]);

  const contextValue: DeletionSecurityContextType = {
    securityState,
    permissionScope,
    validateDeletionPermission,
    checkRateLimit,
    generateSecurityToken,
    validateSecurityToken,
    initiateVerification,
    completeVerification,
    recordActivity,
    detectSuspiciousPattern,
    lockUserAccount,
    clearSecurityState,
    updateRateLimit,
    refreshSecuritySession,
    isSessionValid
  };

  return (
    <DeletionSecurityContext.Provider value={contextValue}>
      {children}
    </DeletionSecurityContext.Provider>
  );
}

export function useDeletionSecurity() {
  const context = useContext(DeletionSecurityContext);
  if (context === undefined) {
    throw new Error('useDeletionSecurity must be used within a DeletionSecurityProvider');
  }
  return context;
}

export default DeletionSecurityContext;