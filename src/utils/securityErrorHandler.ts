/**
 * Security-Aware Error Handler
 * 
 * Comprehensive error handling system with Hebrew support,
 * security logging, and user-friendly error messages.
 */

import { securityAuditService } from '../services/securityAuditService';

// Error types and interfaces
export interface SecurityError extends Error {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'validation' | 'rate_limit' | 'suspicious_activity' | 'system';
  userFriendly: boolean;
  hebrewMessage: string;
  technicalDetails?: any;
  userId?: string;
  studentId?: string;
  operationType?: 'single' | 'bulk' | 'cascade' | 'cleanup';
  suggestedActions?: string[];
  logToAudit?: boolean;
}

export interface ErrorContext {
  userId?: string;
  userRole?: string;
  studentId?: string;
  operationType?: 'single' | 'bulk' | 'cascade' | 'cleanup';
  component?: string;
  function?: string;
  timestamp?: Date;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ErrorHandlingOptions {
  logToConsole?: boolean;
  logToAudit?: boolean;
  showToUser?: boolean;
  includeStackTrace?: boolean;
  suggestActions?: boolean;
  escalateToAdmin?: boolean;
}

// Hebrew error messages organized by category
const HEBREW_ERROR_MESSAGES = {
  // Authentication errors
  authentication: {
    invalid_credentials: 'פרטי התחברות שגויים',
    session_expired: 'תוקף ההפעלה פג. יש להתחבר מחדש',
    token_invalid: 'אסימון גישה לא תקין',
    token_expired: 'אסימון גישה פג תוקף',
    account_locked: 'החשבון נעול זמנית. נסה שוב מאוחר יותר',
    too_many_attempts: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד {minutes} דקות',
    mfa_required: 'נדרש אימות דו-שלבי',
    mfa_invalid: 'קוד אימות שגוי'
  },

  // Authorization errors
  authorization: {
    insufficient_permissions: 'אין לך הרשאה לבצע פעולה זו',
    permission_denied: 'הגישה נדחתה',
    admin_only: 'פעולה זו מוגבלת למנהלים בלבד',
    super_admin_only: 'פעולה זו מוגבלת למנהל עליון בלבד',
    role_mismatch: 'התפקיד שלך אינו מתאים לפעולה המבוקשת',
    student_access_denied: 'אין לך הרשאה לגשת לנתוני תלמיד זה',
    cascade_permission_denied: 'אין הרשאה למחיקה מדורגת',
    bulk_permission_denied: 'אין הרשאה למחיקה קבוצתית'
  },

  // Validation errors
  validation: {
    invalid_input: 'הקלט שהוזן אינו תקין',
    required_field: 'שדה {field} הוא חובה',
    invalid_format: 'פורמט {field} אינו תקין',
    invalid_student_id: 'מזהה התלמיד אינו תקין',
    invalid_user_id: 'מזהה המשתמש אינו תקין',
    name_mismatch: 'השם שהוקלד אינו תואם',
    hebrew_required: 'יש להזין טקסט בעברית',
    password_too_weak: 'הסיסמה חלשה מדי',
    confirmation_required: 'נדרש אישור המשתמש',
    invalid_date_range: 'טווח התאריכים אינו תקין'
  },

  // Rate limiting errors
  rate_limit: {
    exceeded_single: 'חרגת מהמגבלה של מחיקת יחידים. נסה שוב בעוד {seconds} שניות',
    exceeded_bulk: 'חרגת מהמגבלה של מחיקה קבוצתית. נסה שוב בעוד {minutes} דקות',
    exceeded_cleanup: 'חרגת מהמגבלה של פעולות ניקוי. נסה שוב בעוד {minutes} דקות',
    too_many_requests: 'יותר מדי בקשות. האט את הקצב',
    cooldown_active: 'יש להמתין {minutes} דקות לפני ניסיון חדש'
  },

  // Suspicious activity errors
  suspicious_activity: {
    pattern_detected: 'זוהה דפוס פעילות חשוד. החשבון הוגבל זמנית',
    rapid_deletions: 'זוהה מחיקה מהירה מדי. החשבון נחסם זמנית',
    unusual_hours: 'פעילות בשעות לא רגילות. נדרש אימות נוסף',
    failed_verifications: 'יותר מדי ניסיונות אימות כושלים',
    permission_escalation: 'זוהה ניסיון הסלמת הרשאות',
    account_suspended: 'החשבון הושעה עקב פעילות חשודה'
  },

  // System errors
  system: {
    internal_error: 'שגיאת מערכת פנימית. נסה שוב מאוחר יותר',
    service_unavailable: 'השירות זמנית לא זמין',
    network_error: 'שגיאת רשת. בדוק את החיבור לאינטרנט',
    timeout: 'הפעולה לקחה יותר מדי זמן. נסה שוב',
    maintenance_mode: 'המערכת נמצאת במצב תחזוקה',
    database_error: 'שגיאה בבסיס הנתונים',
    file_upload_error: 'שגיאה בהעלאת קובץ',
    encryption_error: 'שגיאה בהצפנת נתונים',
    decryption_error: 'שגיאה בפענוח נתונים'
  }
};

// Suggested actions for each error category
const SUGGESTED_ACTIONS = {
  authentication: [
    'נסה להתחבר שוב',
    'בדוק את פרטי ההתחברות',
    'איפוס סיסמה במידת הצורך',
    'פנה למנהל המערכת'
  ],
  authorization: [
    'פנה למנהל להגדלת הרשאות',
    'בדוק את הרשאות החשבון',
    'התחבר עם משתמש מורשה'
  ],
  validation: [
    'בדוק את הנתונים שהוזנו',
    'ודא שהפורמט תקין',
    'השלם את השדות החובה'
  ],
  rate_limit: [
    'המתן מספר דקות',
    'הפחת את קצב הפעולות',
    'פנה למנהל להגדלת המגבלות'
  ],
  suspicious_activity: [
    'המתן להסרת החסימה',
    'פנה למנהל המערכת',
    'שנה סיסמה במידת הצורך'
  ],
  system: [
    'נסה שוב מאוחר יותר',
    'רענן את הדף',
    'פנה לתמיכה טכנית'
  ]
};

/**
 * Create a security-aware error
 */
export function createSecurityError(
  code: string,
  category: SecurityError['category'],
  severity: SecurityError['severity'] = 'medium',
  technicalMessage?: string,
  technicalDetails?: any
): SecurityError {
  // Find Hebrew message
  const categoryMessages = HEBREW_ERROR_MESSAGES[category];
  const hebrewMessage = categoryMessages?.[code] || technicalMessage || 'שגיאה לא ידועה';

  const error = new Error(technicalMessage || hebrewMessage) as SecurityError;
  error.code = code;
  error.severity = severity;
  error.category = category;
  error.hebrewMessage = hebrewMessage;
  error.technicalDetails = technicalDetails;
  error.userFriendly = true;
  error.suggestedActions = SUGGESTED_ACTIONS[category];
  error.logToAudit = severity === 'high' || severity === 'critical';

  return error;
}

/**
 * Handle HTTP response errors and convert to security errors
 */
export function handleHttpError(
  response: Response,
  context?: ErrorContext
): SecurityError {
  const { status, statusText } = response;

  switch (status) {
    case 401:
      return createSecurityError(
        'invalid_credentials',
        'authentication',
        'medium',
        `Unauthorized: ${statusText}`
      );
    
    case 403:
      return createSecurityError(
        'permission_denied',
        'authorization',
        'high',
        `Forbidden: ${statusText}`
      );
    
    case 429:
      return createSecurityError(
        'too_many_requests',
        'rate_limit',
        'medium',
        `Rate limited: ${statusText}`
      );
    
    case 500:
      return createSecurityError(
        'internal_error',
        'system',
        'high',
        `Server error: ${statusText}`
      );
    
    case 503:
      return createSecurityError(
        'service_unavailable',
        'system',
        'medium',
        `Service unavailable: ${statusText}`
      );
    
    default:
      return createSecurityError(
        'network_error',
        'system',
        'medium',
        `HTTP ${status}: ${statusText}`
      );
  }
}

/**
 * Handle JavaScript errors and convert to security errors
 */
export function handleJavaScriptError(
  error: Error,
  context?: ErrorContext
): SecurityError {
  // Check for specific error patterns
  if (error.message.includes('Permission denied')) {
    return createSecurityError(
      'permission_denied',
      'authorization',
      'medium',
      error.message
    );
  }

  if (error.message.includes('Invalid token')) {
    return createSecurityError(
      'token_invalid',
      'authentication',
      'medium',
      error.message
    );
  }

  if (error.message.includes('Rate limit')) {
    return createSecurityError(
      'too_many_requests',
      'rate_limit',
      'medium',
      error.message
    );
  }

  if (error.message.includes('Suspicious activity')) {
    return createSecurityError(
      'pattern_detected',
      'suspicious_activity',
      'high',
      error.message
    );
  }

  // Generic system error
  return createSecurityError(
    'internal_error',
    'system',
    'medium',
    error.message,
    { stack: error.stack }
  );
}

/**
 * Main error handler function
 */
export async function handleSecurityError(
  error: Error | SecurityError,
  context: ErrorContext = {},
  options: ErrorHandlingOptions = {}
): Promise<SecurityError> {
  const defaultOptions: ErrorHandlingOptions = {
    logToConsole: true,
    logToAudit: true,
    showToUser: true,
    includeStackTrace: false,
    suggestActions: true,
    escalateToAdmin: false
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  // Convert to SecurityError if needed
  let securityError: SecurityError;
  if (isSecurityError(error)) {
    securityError = error;
  } else {
    securityError = handleJavaScriptError(error, context);
  }

  // Add context information
  securityError.userId = context.userId;
  securityError.studentId = context.studentId;
  securityError.operationType = context.operationType;

  // Replace placeholders in Hebrew message
  securityError.hebrewMessage = replacePlaceholders(
    securityError.hebrewMessage,
    context
  );

  // Console logging
  if (finalOptions.logToConsole) {
    const logLevel = securityError.severity === 'critical' ? 'error' :
                     securityError.severity === 'high' ? 'error' :
                     securityError.severity === 'medium' ? 'warn' : 'info';
    
    console[logLevel](`[Security Error] ${securityError.code}:`, {
      message: securityError.message,
      hebrewMessage: securityError.hebrewMessage,
      category: securityError.category,
      severity: securityError.severity,
      context,
      stack: finalOptions.includeStackTrace ? securityError.stack : undefined
    });
  }

  // Audit logging
  if (finalOptions.logToAudit && securityError.logToAudit) {
    try {
      await logSecurityErrorToAudit(securityError, context);
    } catch (auditError) {
      console.error('Failed to log security error to audit:', auditError);
    }
  }

  // Admin escalation for critical errors
  if (finalOptions.escalateToAdmin && securityError.severity === 'critical') {
    await escalateToAdmin(securityError, context);
  }

  return securityError;
}

/**
 * Specialized handlers for different error scenarios
 */
export const securityErrorHandlers = {
  // Permission validation errors
  async handlePermissionError(
    userId: string,
    studentId: string,
    requiredPermission: string,
    userPermission: string
  ): Promise<SecurityError> {
    const error = createSecurityError(
      'insufficient_permissions',
      'authorization',
      'medium'
    );

    return handleSecurityError(error, {
      userId,
      studentId,
      component: 'PermissionValidator',
      function: 'validateDeletionPermission'
    });
  },

  // Rate limit errors
  async handleRateLimitError(
    userId: string,
    operationType: 'single' | 'bulk' | 'cleanup',
    resetTime: Date
  ): Promise<SecurityError> {
    const minutes = Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60));
    
    const error = createSecurityError(
      `exceeded_${operationType}`,
      'rate_limit',
      'medium'
    );

    return handleSecurityError(error, {
      userId,
      operationType,
      component: 'RateLimiter',
      function: 'checkRateLimit'
    });
  },

  // Verification errors
  async handleVerificationError(
    userId: string,
    verificationStep: string,
    failureReason: string
  ): Promise<SecurityError> {
    const error = createSecurityError(
      'confirmation_required',
      'validation',
      'medium',
      `Verification failed at step: ${verificationStep}`
    );

    return handleSecurityError(error, {
      userId,
      component: 'MultiStepVerification',
      function: verificationStep
    });
  },

  // Suspicious activity errors
  async handleSuspiciousActivityError(
    userId: string,
    pattern: string,
    riskScore: number
  ): Promise<SecurityError> {
    const severity = riskScore >= 8 ? 'critical' : 
                     riskScore >= 5 ? 'high' : 'medium';
    
    const error = createSecurityError(
      'pattern_detected',
      'suspicious_activity',
      severity
    );

    return handleSecurityError(error, {
      userId,
      component: 'SuspiciousActivityDetector',
      function: 'detectPattern'
    }, {
      escalateToAdmin: severity === 'critical'
    });
  }
};

// Utility functions
function isSecurityError(error: any): error is SecurityError {
  return error && 
         typeof error.code === 'string' && 
         typeof error.category === 'string' && 
         typeof error.severity === 'string';
}

function replacePlaceholders(message: string, context: ErrorContext): string {
  let result = message;
  
  // Replace common placeholders
  if (context.operationType) {
    result = result.replace('{operationType}', context.operationType);
  }
  
  // Add more placeholder replacements as needed
  result = result.replace('{minutes}', '5'); // Default values
  result = result.replace('{seconds}', '30');
  
  return result;
}

async function logSecurityErrorToAudit(
  error: SecurityError,
  context: ErrorContext
): Promise<void> {
  await securityAuditService.logSecurityViolation(
    error.code,
    {
      userId: context.userId,
      userRole: context.userRole,
      studentId: context.studentId,
      attemptedAction: `${context.component}.${context.function}`,
      severity: error.severity === 'critical' ? 'critical' :
                error.severity === 'high' ? 'high' :
                error.severity === 'medium' ? 'medium' : 'low',
      autoResponse: error.severity === 'critical' ? 'account_lock' : 'log_only'
    }
  );
}

async function escalateToAdmin(
  error: SecurityError,
  context: ErrorContext
): Promise<void> {
  // In a real implementation, this would send notifications to administrators
  console.error('[ADMIN ESCALATION] Critical security error:', {
    error: error.code,
    message: error.hebrewMessage,
    userId: context.userId,
    context
  });
  
  // Could also trigger alerts, emails, or other notification mechanisms
}

/**
 * Error boundary component helper
 */
export function formatErrorForUser(error: SecurityError): {
  title: string;
  message: string;
  actions: string[];
  severity: 'info' | 'warning' | 'error';
} {
  return {
    title: error.category === 'authentication' ? 'שגיאת אימות' :
           error.category === 'authorization' ? 'שגיאת הרשאה' :
           error.category === 'validation' ? 'שגיאת אימות נתונים' :
           error.category === 'rate_limit' ? 'חריגה מהמגבלה' :
           error.category === 'suspicious_activity' ? 'פעילות חשודה' : 'שגיאת מערכת',
    message: error.hebrewMessage,
    actions: error.suggestedActions || [],
    severity: error.severity === 'critical' || error.severity === 'high' ? 'error' :
              error.severity === 'medium' ? 'warning' : 'info'
  };
}

export default {
  createSecurityError,
  handleHttpError,
  handleJavaScriptError,
  handleSecurityError,
  securityErrorHandlers,
  formatErrorForUser,
  HEBREW_ERROR_MESSAGES,
  SUGGESTED_ACTIONS
};