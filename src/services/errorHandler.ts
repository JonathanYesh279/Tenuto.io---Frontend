/**
 * Centralized Error Handler for Student Details API
 * 
 * Provides consistent error handling, logging, and user-friendly error messages
 * with automatic retry logic and authentication handling
 */

import { toast } from 'react-hot-toast'
import { ApiError } from './studentDetailsApi'

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error categories
export type ErrorCategory = 
  | 'authentication' 
  | 'authorization' 
  | 'validation' 
  | 'network' 
  | 'server' 
  | 'not_found'
  | 'rate_limit'
  | 'timeout'

// Enhanced error interface
export interface EnhancedError extends ApiError {
  severity: ErrorSeverity
  category: ErrorCategory
  userMessage: string
  technicalMessage: string
  timestamp: Date
  retryable: boolean
  suggestions?: string[]
}

// Error configuration
const ERROR_CONFIG = {
  showToasts: true,
  logToConsole: true,
  logToService: false, // Set to true when error logging service is available
  maxRetries: 3,
  retryDelay: 1000,
}

// Hebrew error messages
const HEBREW_MESSAGES = {
  authentication: {
    401: 'נדרשת התחברות מחדש למערכת',
    403: 'אין הרשאה לצפייה בתוכן זה',
    general: 'בעיית הזדהות - נא להתחבר מחדש'
  },
  validation: {
    422: 'הנתונים שהוזנו אינם תקינים',
    400: 'בקשה לא תקינה - נא לבדוק את הנתונים',
    general: 'שגיאה בנתונים - נא לבדוק ולנסות שוב'
  },
  network: {
    timeout: 'פג זמן ההמתנה - נא לנסות שוב',
    offline: 'אין חיבור לאינטרנט - נא לבדוק את החיבור',
    connection: 'לא ניתן להתחבר לשרת - נא לנסות שוב מאוחר יותר',
    general: 'בעיית תקשורת - נא לנסות שוב'
  },
  server: {
    500: 'שגיאת שרת פנימית - נא לנסות שוב מאוחר יותר',
    502: 'השרת אינו זמין כרגע - נא לנסות שוב',
    503: 'השירות אינו זמין כרגע - נא לנסות שוב',
    general: 'שגיאת שרת - נא לנסות שוב מאוחר יותר'
  },
  not_found: {
    404: 'המידע המבוקש לא נמצא',
    student: 'תלמיד לא נמצא במערכת',
    document: 'מסמך לא נמצא',
    general: 'הפריט המבוקש לא נמצא'
  },
  rate_limit: {
    429: 'יותר מדי בקשות - נא להמתין ולנסות שוב',
    general: 'הגבלת קצב - נא להמתין'
  }
}

// Error suggestions
const ERROR_SUGGESTIONS = {
  authentication: [
    'התחבר מחדש למערכת',
    'בדוק שם משתמש וסיסמה',
    'נקה את ה-cache של הדפדפן'
  ],
  network: [
    'בדוק את החיבור לאינטרנט',
    'נסה לרענן את הדף',
    'נסה שוב בעוד כמה דקות'
  ],
  server: [
    'נסה שוב בעוד כמה דקות',
    'פנה למנהל המערכת אם הבעיה נמשכת',
    'בדוק אם יש הודעות תחזוקה'
  ],
  validation: [
    'בדוק שכל השדות מולאו נכון',
    'וודא שהנתונים בפורמט הנכון',
    'נסה שוב עם נתונים שונים'
  ]
}

class ErrorHandler {
  private errorLog: EnhancedError[] = []
  private maxLogSize = 100

  /**
   * Process and handle any error
   */
  handleError(error: any, context?: string): EnhancedError {
    const enhancedError = this.enhanceError(error, context)
    
    // Log the error
    this.logError(enhancedError)
    
    // Show user notification if appropriate
    if (ERROR_CONFIG.showToasts && this.shouldShowToast(enhancedError)) {
      this.showErrorToast(enhancedError)
    }
    
    // Handle specific error types
    this.handleSpecificError(enhancedError)
    
    return enhancedError
  }

  /**
   * Enhance error with additional metadata
   */
  private enhanceError(error: any, context?: string): EnhancedError {
    const apiError = error as ApiError
    
    // Determine error category and severity
    const category = this.categorizeError(apiError)
    const severity = this.determineSeverity(apiError, category)
    
    // Generate user-friendly messages
    const userMessage = this.getUserMessage(apiError, category)
    const technicalMessage = this.getTechnicalMessage(apiError, context)
    
    // Determine if retryable
    const retryable = this.isRetryable(apiError, category)
    
    // Get suggestions
    const suggestions = this.getSuggestions(category)

    return {
      ...apiError,
      severity,
      category,
      userMessage,
      technicalMessage,
      timestamp: new Date(),
      retryable,
      suggestions
    }
  }

  /**
   * Categorize error type
   */
  private categorizeError(error: ApiError): ErrorCategory {
    if (!error.code) return 'network'
    
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'authentication'
      case 'FORBIDDEN':
        return 'authorization'
      case 'NOT_FOUND':
        return 'not_found'
      case 'VALIDATION_ERROR':
        return 'validation'
      case 'SERVER_ERROR':
        return 'server'
      case 'NETWORK_ERROR':
        return 'network'
      default:
        return 'network'
    }
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: ApiError, category: ErrorCategory): ErrorSeverity {
    if (category === 'authentication' || category === 'authorization') {
      return 'high'
    }
    
    if (category === 'server') {
      return error.status === 500 ? 'critical' : 'high'
    }
    
    if (category === 'not_found') {
      return 'medium'
    }
    
    if (category === 'validation') {
      return 'low'
    }
    
    return 'medium'
  }

  /**
   * Generate user-friendly message
   */
  private getUserMessage(error: ApiError, category: ErrorCategory): string {
    const messages = HEBREW_MESSAGES[category]
    
    if (error.status && messages[error.status as keyof typeof messages]) {
      return messages[error.status as keyof typeof messages] as string
    }
    
    return messages.general
  }

  /**
   * Generate technical message for developers
   */
  private getTechnicalMessage(error: ApiError, context?: string): string {
    const parts = []
    
    if (context) parts.push(`Context: ${context}`)
    if (error.code) parts.push(`Code: ${error.code}`)
    if (error.status) parts.push(`Status: ${error.status}`)
    if (error.message) parts.push(`Message: ${error.message}`)
    if (error.details) parts.push(`Details: ${JSON.stringify(error.details)}`)
    
    return parts.join(' | ')
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(error: ApiError, category: ErrorCategory): boolean {
    // Don't retry authentication, authorization, or validation errors
    if (['authentication', 'authorization', 'validation', 'not_found'].includes(category)) {
      return false
    }
    
    // Retry network and server errors
    return ['network', 'server'].includes(category)
  }

  /**
   * Get error suggestions
   */
  private getSuggestions(category: ErrorCategory): string[] {
    return ERROR_SUGGESTIONS[category] || []
  }

  /**
   * Determine if should show toast notification
   */
  private shouldShowToast(error: EnhancedError): boolean {
    // Don't show toast for low severity errors
    if (error.severity === 'low') return false
    
    // Don't show duplicate toasts for the same error
    const recentError = this.errorLog
      .slice(-10)
      .find(e => 
        e.code === error.code && 
        e.category === error.category &&
        Date.now() - e.timestamp.getTime() < 5000 // 5 seconds
      )
    
    return !recentError
  }

  /**
   * Show error toast notification
   */
  private showErrorToast(error: EnhancedError) {
    const toastOptions = {
      duration: this.getToastDuration(error.severity),
      position: 'top-center' as const,
    }

    switch (error.severity) {
      case 'critical':
        toast.error(error.userMessage, { ...toastOptions, duration: 8000 })
        break
      case 'high':
        toast.error(error.userMessage, toastOptions)
        break
      case 'medium':
        toast(error.userMessage, toastOptions)
        break
      case 'low':
        // Don't show toast for low severity
        break
    }
  }

  /**
   * Get toast duration based on severity
   */
  private getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case 'critical': return 8000
      case 'high': return 6000
      case 'medium': return 4000
      case 'low': return 2000
      default: return 4000
    }
  }

  /**
   * Handle specific error types
   */
  private handleSpecificError(error: EnhancedError) {
    switch (error.category) {
      case 'authentication':
        this.handleAuthenticationError(error)
        break
      case 'authorization':
        this.handleAuthorizationError(error)
        break
      case 'rate_limit':
        this.handleRateLimitError(error)
        break
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthenticationError(error: EnhancedError) {
    // Clear stored tokens
    localStorage.removeItem('authToken')
    sessionStorage.removeItem('authToken')
    
    // Redirect to login after a delay
    setTimeout(() => {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }, 2000)
  }

  /**
   * Handle authorization errors
   */
  private handleAuthorizationError(error: EnhancedError) {
    // Log unauthorized access attempt
    console.warn('Unauthorized access attempt:', error.technicalMessage)
  }

  /**
   * Handle rate limit errors
   */
  private handleRateLimitError(error: EnhancedError) {
    // Could implement backoff strategy here
    console.warn('Rate limit exceeded:', error.technicalMessage)
  }

  /**
   * Log error to console and/or external service
   */
  private logError(error: EnhancedError) {
    // Add to internal log
    this.errorLog.push(error)
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize)
    }
    
    // Console logging
    if (ERROR_CONFIG.logToConsole) {
      const logLevel = this.getLogLevel(error.severity)
      console[logLevel](`[${error.category.toUpperCase()}] ${error.technicalMessage}`, error)
    }
    
    // External logging service (implement when available)
    if (ERROR_CONFIG.logToService) {
      this.logToExternalService(error)
    }
  }

  /**
   * Get console log level based on severity
   */
  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error'
      case 'medium':
        return 'warn'
      case 'low':
        return 'info'
      default:
        return 'error'
    }
  }

  /**
   * Log to external service (placeholder)
   */
  private logToExternalService(error: EnhancedError) {
    // Implement external logging service integration
    // Example: Sentry, LogRocket, etc.
    console.log('Would log to external service:', error)
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const last24Hours = this.errorLog.filter(
      error => Date.now() - error.timestamp.getTime() < 24 * 60 * 60 * 1000
    )

    const categoryCounts = last24Hours.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: this.errorLog.length,
      last24Hours: last24Hours.length,
      categoryCounts,
      recentErrors: this.errorLog.slice(-10)
    }
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = []
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler()

// React Hook for error handling
export function useErrorHandler() {
  const handleError = (error: any, context?: string) => {
    return errorHandler.handleError(error, context)
  }

  const getErrorStats = () => {
    return errorHandler.getErrorStats()
  }

  const clearErrors = () => {
    errorHandler.clearErrorLog()
  }

  return {
    handleError,
    getErrorStats,
    clearErrors
  }
}

// Utility function for consistent error handling in components
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      errorHandler.handleError(error, context)
      throw error // Re-throw for component-level handling
    }
  }) as T
}

// Default export
export default errorHandler