/**
 * Cascade Deletion Error Handler
 * 
 * Comprehensive error handling utility for cascade deletion operations.
 * Provides Hebrew error messages, error categorization, and user-friendly
 * error reporting with actionable suggestions.
 * 
 * Features:
 * - Hebrew error messages for all error types
 * - Error severity classification
 * - Actionable error suggestions
 * - Error recovery strategies
 * - Logging and monitoring integration
 * - User notification management
 */

import { CascadeDeletionError } from '@/services/cascadeDeletionService.js';

// ==================== Error Types ====================

export interface ProcessedError {
  id: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  description?: string;
  suggestions: Array<{
    action: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  technicalDetails?: {
    originalError?: string;
    stackTrace?: string;
    context?: Record<string, any>;
  };
  recoverable: boolean;
  retryable: boolean;
  timestamp: string;
}

export interface ErrorNotification {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'destructive';
  }>;
}

// ==================== Hebrew Error Messages ====================

const ERROR_MESSAGES = {
  // Network and connection errors
  NETWORK_ERROR: {
    title: 'שגיאת חיבור',
    message: 'אין חיבור לשרת. אנא בדוק את החיבור לאינטרנט ונסה שוב.',
    suggestions: [
      { action: 'בדוק חיבור אינטרנט', description: 'ודא שהחיבור לאינטרנט פעיל ויציב', priority: 'high' as const },
      { action: 'נסה שוב', description: 'לחץ על כפתור "נסה שוב" לחידוש הפעולה', priority: 'medium' as const },
      { action: 'פנה למנהל המערכת', description: 'אם הבעיה נמשכת, פנה למנהל המערכת', priority: 'low' as const },
    ],
  },
  
  // Authentication and authorization
  UNAUTHORIZED: {
    title: 'אין הרשאה',
    message: 'אין לך הרשאה לביצוע פעולה זו. אנא התחבר שוב או פנה למנהל המערכת.',
    suggestions: [
      { action: 'התחבר שוב', description: 'צא מהמערכת והתחבר מחדש', priority: 'high' as const },
      { action: 'בקש הרשאות', description: 'פנה למנהל המערכת לקבלת הרשאות מתאימות', priority: 'medium' as const },
    ],
  },

  FORBIDDEN: {
    title: 'גישה אסורה',
    message: 'אין לך הרשאות מתאימות לביצוע פעולה זו.',
    suggestions: [
      { action: 'בקש הרשאות', description: 'פנה למנהל המערכת לקבלת הרשאות נדרשות', priority: 'high' as const },
      { action: 'בדוק תפקיד', description: 'ודא שהתפקיד שלך מאפשר ביצוע פעולה זו', priority: 'medium' as const },
    ],
  },

  // Data validation errors
  VALIDATION_ERROR: {
    title: 'שגיאה בנתונים',
    message: 'הנתונים שהוזנו אינם תקינים. אנא בדוק ונסה שוב.',
    suggestions: [
      { action: 'בדוק נתונים', description: 'ודא שכל השדות מולאו כראוי', priority: 'high' as const },
      { action: 'רענן דף', description: 'רענן את הדף ונסה שוב', priority: 'medium' as const },
    ],
  },

  INVALID_STUDENT_ID: {
    title: 'מזהה תלמיד שגוי',
    message: 'מזהה התלמיד שהוזן אינו תקין או לא קיים במערכת.',
    suggestions: [
      { action: 'בדוק מזהה', description: 'ודא שמזהה התלמיד נכון וקיים במערכת', priority: 'high' as const },
      { action: 'חפש תלמיד', description: 'השתמש בחיפוש כדי למצוא את התלמיד הנכון', priority: 'medium' as const },
    ],
  },

  // Operation state errors
  DELETE_IN_PROGRESS: {
    title: 'מחיקה בתהליך',
    message: 'כבר מתבצעת פעולת מחיקה עבור תלמיד זה. אנא המתן להשלמת הפעולה.',
    suggestions: [
      { action: 'המתן להשלמה', description: 'המתן עד להשלמת הפעולה הקודמת', priority: 'high' as const },
      { action: 'בדוק סטטוס', description: 'בדוק את מצב הפעולה בעמוד המעקב', priority: 'medium' as const },
      { action: 'בטל פעולה', description: 'אם נדרש, ניתן לבטל את הפעולה הקיימת', priority: 'low' as const },
    ],
  },

  OPERATION_TIMEOUT: {
    title: 'הפעולה נקטעה',
    message: 'הפעולה ארכה יותר מהצפוי ונקטעה. ייתכן שהיא הושלמה חלקית.',
    suggestions: [
      { action: 'בדוק מצב', description: 'בדוק את מצב הפעולה ביומן הפעולות', priority: 'high' as const },
      { action: 'נסה שוב', description: 'נסה לבצע את הפעולה שוב במנות קטנות יותר', priority: 'medium' as const },
      { action: 'פנה לתמיכה', description: 'פנה לתמיכה טכנית לבדיקת הבעיה', priority: 'low' as const },
    ],
  },

  // Data integrity errors
  INTEGRITY_VIOLATION: {
    title: 'שגיאה בשלמות הנתונים',
    message: 'נמצאו בעיות בשלמות הנתונים שמונעות ביצוע הפעולה.',
    suggestions: [
      { action: 'הרץ בדיקת שלמות', description: 'בצע בדיקת שלמות נתונים מקיפה', priority: 'high' as const },
      { action: 'תקן בעיות', description: 'תקן את בעיות השלמות שנמצאו', priority: 'medium' as const },
      { action: 'גבה נתונים', description: 'צור גיבוי לפני ביצוע תיקונים', priority: 'medium' as const },
    ],
  },

  DEPENDENCIES_EXIST: {
    title: 'קיימות תלויות',
    message: 'לא ניתן למחוק את התלמיד מכיוון שקיימים רכיבים תלויים במערכת.',
    suggestions: [
      { action: 'הצג תלויות', description: 'הצג את רשימת הרכיבים התלויים', priority: 'high' as const },
      { action: 'הסר תלויות', description: 'הסר או עדכן את הרכיבים התלויים תחילה', priority: 'medium' as const },
      { action: 'מחיקה כפויה', description: 'בצע מחיקה כפויה (בזהירות!)', priority: 'low' as const },
    ],
  },

  // Rollback and recovery errors
  ROLLBACK_NOT_AVAILABLE: {
    title: 'לא ניתן לבטל',
    message: 'לא ניתן לבטל את הפעולה מכיוון שלא נוצר גיבוי או שהגיבוי לא זמין.',
    suggestions: [
      { action: 'בדוק גיבויים', description: 'בדוק אם קיימים גיבויים אחרים', priority: 'high' as const },
      { action: 'שחזר ידני', description: 'בצע שחזור ידני של הנתונים במידת הצורך', priority: 'medium' as const },
      { action: 'פנה למנהל', description: 'פנה למנהל המערכת לבדיקת אפשרויות שחזור', priority: 'low' as const },
    ],
  },

  BACKUP_FAILED: {
    title: 'גיבוי נכשל',
    message: 'יצירת הגיבוי נכשלה. הפעולה לא תתבצע ללא גיבוי.',
    suggestions: [
      { action: 'בדוק שטח דיסק', description: 'ודא שיש מספיק מקום לגיבוי', priority: 'high' as const },
      { action: 'נסה שוב', description: 'נסה ליצור גיבוי שוב', priority: 'medium' as const },
      { action: 'דלג על גיבוי', description: 'המשך ללא גיבוי (לא מומלץ!)', priority: 'low' as const },
    ],
  },

  // Server and system errors
  SERVER_ERROR: {
    title: 'שגיאת שרת',
    message: 'אירעה שגיאה פנימית בשרת. אנא נסה שוב מאוחר יותר.',
    suggestions: [
      { action: 'נסה מאוחר יותר', description: 'המתן מספר דקות ונסה שוב', priority: 'high' as const },
      { action: 'פנה לתמיכה', description: 'אם הבעיה נמשכת, פנה לתמיכה טכנית', priority: 'medium' as const },
      { action: 'בדוק סטטוס מערכת', description: 'בדוק אם יש הודעות על תקלות במערכת', priority: 'low' as const },
    ],
  },

  PARTIAL_SUCCESS: {
    title: 'השלמה חלקית',
    message: 'הפעולה הושלמה חלקית. חלק מהנתונים נמחקו וחלק לא.',
    suggestions: [
      { action: 'בדוק יומן', description: 'עיין ביומן הפעולות לפרטים מלאים', priority: 'high' as const },
      { action: 'השלם ידנית', description: 'השלם את המחיקה הנדרשת באופן ידני', priority: 'medium' as const },
      { action: 'הרץ ניקוי', description: 'הרץ ניקוי רכיבים יתומים', priority: 'low' as const },
    ],
  },

  // Generic fallback
  UNKNOWN_ERROR: {
    title: 'שגיאה לא ידועה',
    message: 'אירעה שגיאה לא צפויה. אנא נסה שוב או פנה לתמיכה טכנית.',
    suggestions: [
      { action: 'נסה שוב', description: 'בצע את הפעולה שוב', priority: 'high' as const },
      { action: 'רענן דף', description: 'רענן את הדף ונסה שוב', priority: 'medium' as const },
      { action: 'פנה לתמיכה', description: 'פנה לתמיכה טכנית עם פרטי השגיאה', priority: 'low' as const },
    ],
  },
} as const;

// ==================== Error Severity Classification ====================

const ERROR_SEVERITY_MAP: Record<string, ProcessedError['severity']> = {
  // Critical errors that require immediate attention
  SERVER_ERROR: 'critical',
  INTEGRITY_VIOLATION: 'critical',
  BACKUP_FAILED: 'critical',
  
  // High priority errors that block user actions
  UNAUTHORIZED: 'high',
  FORBIDDEN: 'high',
  DEPENDENCIES_EXIST: 'high',
  DELETE_IN_PROGRESS: 'high',
  
  // Medium priority errors that can often be resolved by user
  VALIDATION_ERROR: 'medium',
  INVALID_STUDENT_ID: 'medium',
  ROLLBACK_NOT_AVAILABLE: 'medium',
  OPERATION_TIMEOUT: 'medium',
  
  // Low priority errors that are usually temporary
  NETWORK_ERROR: 'low',
  PARTIAL_SUCCESS: 'low',
};

// ==================== Main Error Handler Class ====================

export class CascadeErrorHandler {
  private static instance: CascadeErrorHandler | null = null;
  private errorLog: ProcessedError[] = [];
  private maxLogSize = 100;

  private constructor() {}

  static getInstance(): CascadeErrorHandler {
    if (!CascadeErrorHandler.instance) {
      CascadeErrorHandler.instance = new CascadeErrorHandler();
    }
    return CascadeErrorHandler.instance;
  }

  /**
   * Process any error and convert it to a standardized format
   */
  processError(error: any, context?: Record<string, any>): ProcessedError {
    const errorId = this.generateErrorId();
    let code = 'UNKNOWN_ERROR';
    let originalError = error;

    // Determine error code from different error types
    if (error instanceof CascadeDeletionError) {
      code = error.code || 'UNKNOWN_ERROR';
      originalError = error.message;
    } else if (error?.response?.status) {
      // HTTP errors
      const status = error.response.status;
      if (status === 401) code = 'UNAUTHORIZED';
      else if (status === 403) code = 'FORBIDDEN';
      else if (status === 404) code = 'NOT_FOUND';
      else if (status === 409) code = 'DELETE_IN_PROGRESS';
      else if (status === 422) code = 'VALIDATION_ERROR';
      else if (status >= 500) code = 'SERVER_ERROR';
    } else if (error?.code) {
      // Network and other coded errors
      if (error.code === 'NETWORK_ERROR') code = 'NETWORK_ERROR';
      else if (error.code === 'ECONNABORTED') code = 'OPERATION_TIMEOUT';
      else code = error.code;
    } else if (typeof error === 'string') {
      // String error messages
      code = this.categorizeStringError(error);
    }

    const errorConfig = ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.UNKNOWN_ERROR;
    const severity = ERROR_SEVERITY_MAP[code] || 'medium';

    const processedError: ProcessedError = {
      id: errorId,
      code,
      severity,
      title: errorConfig.title,
      message: errorConfig.message,
      suggestions: errorConfig.suggestions,
      technicalDetails: {
        originalError: typeof originalError === 'string' ? originalError : JSON.stringify(originalError),
        context,
        stackTrace: error?.stack,
      },
      recoverable: this.isRecoverable(code),
      retryable: this.isRetryable(code),
      timestamp: new Date().toISOString(),
    };

    // Add to error log
    this.addToLog(processedError);

    return processedError;
  }

  /**
   * Create a user notification from processed error
   */
  createNotification(processedError: ProcessedError): ErrorNotification {
    const type = this.getNotificationType(processedError.severity);
    const duration = this.getNotificationDuration(processedError.severity);

    const actions: ErrorNotification['actions'] = [];

    // Add retry action for retryable errors
    if (processedError.retryable) {
      actions.push({
        label: 'נסה שוב',
        action: () => {
          // This would trigger a retry - implementation depends on context
          console.log('Retry requested for error:', processedError.id);
        },
        style: 'primary',
      });
    }

    // Add view details action
    actions.push({
      label: 'פרטים נוספים',
      action: () => {
        console.log('Error details:', processedError);
      },
      style: 'secondary',
    });

    return {
      type,
      title: processedError.title,
      message: processedError.message,
      duration,
      actions,
    };
  }

  /**
   * Get formatted error details for display
   */
  getErrorDetails(processedError: ProcessedError): {
    basic: string;
    detailed: string;
    technical: string;
    suggestions: string;
  } {
    const basic = `${processedError.title}: ${processedError.message}`;
    
    const detailed = `
שגיאה: ${processedError.title}
קוד שגיאה: ${processedError.code}
רמת חומרה: ${this.getSeverityLabel(processedError.severity)}
זמן: ${new Date(processedError.timestamp).toLocaleString('he-IL')}
הודעה: ${processedError.message}
    `.trim();

    const technical = `
מזהה שגיאה: ${processedError.id}
שגיאה מקורית: ${processedError.technicalDetails?.originalError}
הקשר: ${JSON.stringify(processedError.technicalDetails?.context, null, 2)}
ניתן לשחזור: ${processedError.recoverable ? 'כן' : 'לא'}
ניתן לחזור: ${processedError.retryable ? 'כן' : 'לא'}
    `.trim();

    const suggestions = processedError.suggestions
      .map(s => `• ${s.action}: ${s.description}`)
      .join('\n');

    return { basic, detailed, technical, suggestions };
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byCode: Record<string, number>;
    recentErrors: ProcessedError[];
  } {
    const bySeverity = this.errorLog.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCode = this.errorLog.reduce((acc, error) => {
      acc[error.code] = (acc[error.code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = this.errorLog
      .filter(error => {
        const errorTime = new Date(error.timestamp);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return errorTime > oneHourAgo;
      })
      .slice(0, 10);

    return {
      total: this.errorLog.length,
      bySeverity,
      byCode,
      recentErrors,
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get all logged errors
   */
  getErrorLog(): ProcessedError[] {
    return [...this.errorLog];
  }

  // ==================== Private Helper Methods ====================

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private categorizeStringError(error: string): string {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    if (lowerError.includes('timeout')) {
      return 'OPERATION_TIMEOUT';
    }
    if (lowerError.includes('unauthorized') || lowerError.includes('401')) {
      return 'UNAUTHORIZED';
    }
    if (lowerError.includes('forbidden') || lowerError.includes('403')) {
      return 'FORBIDDEN';
    }
    if (lowerError.includes('validation') || lowerError.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  private isRecoverable(code: string): boolean {
    const nonRecoverableErrors = ['SERVER_ERROR', 'INTEGRITY_VIOLATION', 'BACKUP_FAILED'];
    return !nonRecoverableErrors.includes(code);
  }

  private isRetryable(code: string): boolean {
    const retryableErrors = ['NETWORK_ERROR', 'OPERATION_TIMEOUT', 'SERVER_ERROR'];
    return retryableErrors.includes(code);
  }

  private getNotificationType(severity: ProcessedError['severity']): ErrorNotification['type'] {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  }

  private getNotificationDuration(severity: ProcessedError['severity']): number {
    switch (severity) {
      case 'critical':
        return 0; // Persistent
      case 'high':
        return 10000; // 10 seconds
      case 'medium':
        return 7000; // 7 seconds
      case 'low':
        return 5000; // 5 seconds
      default:
        return 7000;
    }
  }

  private getSeverityLabel(severity: ProcessedError['severity']): string {
    const labels = {
      critical: 'קריטי',
      high: 'גבוה',
      medium: 'בינוני',
      low: 'נמוך',
    };
    return labels[severity];
  }

  private addToLog(error: ProcessedError): void {
    this.errorLog.unshift(error);
    
    // Keep log size within limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }
}

// ==================== Export Convenience Functions ====================

export const errorHandler = CascadeErrorHandler.getInstance();

/**
 * Quick function to process an error and get a user notification
 */
export function handleError(error: any, context?: Record<string, any>): ErrorNotification {
  const processedError = errorHandler.processError(error, context);
  return errorHandler.createNotification(processedError);
}

/**
 * Quick function to process an error and get formatted details
 */
export function getErrorDetails(error: any, context?: Record<string, any>) {
  const processedError = errorHandler.processError(error, context);
  return errorHandler.getErrorDetails(processedError);
}

/**
 * Hook for React components to use error handling
 */
export function useCascadeErrorHandler() {
  const processError = (error: any, context?: Record<string, any>) => {
    return errorHandler.processError(error, context);
  };

  const createNotification = (error: any, context?: Record<string, any>) => {
    const processedError = processError(error, context);
    return errorHandler.createNotification(processedError);
  };

  const getDetails = (error: any, context?: Record<string, any>) => {
    const processedError = processError(error, context);
    return errorHandler.getErrorDetails(processedError);
  };

  return {
    processError,
    createNotification,
    getDetails,
    errorStats: errorHandler.getErrorStats(),
    clearLog: errorHandler.clearErrorLog,
  };
}