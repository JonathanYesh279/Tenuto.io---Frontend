/**
 * Error Handling and Retry Strategies
 * 
 * Provides comprehensive error handling, retry logic, and recovery mechanisms
 * for the cascade deletion system with proper logging and user feedback
 */

import {
  CascadeDeletionError,
  DataIntegrityError,
  AuditTrailError,
  NotificationMessage,
} from '@/types/cascade-deletion.types'
import { useCascadeDeletionStore } from '@/stores/cascadeDeletionStore'

// ==================== Error Types and Classifications ====================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
}

export interface ErrorContext {
  operationId?: string
  entityType?: string
  entityId?: string
  userId?: string
  timestamp: string
  userAgent?: string
  url?: string
  stackTrace?: string
  additionalData?: Record<string, any>
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryableErrors: string[]
  timeoutMs: number
}

export interface ErrorHandlerConfig {
  enableLogging: boolean
  enableNotifications: boolean
  enableRetry: boolean
  logEndpoint?: string
  retryConfig: RetryConfig
}

// ==================== Default Configurations ====================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVER_ERROR',
    'TEMPORARY_UNAVAILABLE',
    'RATE_LIMIT_EXCEEDED',
  ],
  timeoutMs: 60000,
}

const DEFAULT_ERROR_HANDLER_CONFIG: ErrorHandlerConfig = {
  enableLogging: true,
  enableNotifications: true,
  enableRetry: true,
  retryConfig: DEFAULT_RETRY_CONFIG,
}

// ==================== Error Classification ====================

export class ErrorClassifier {
  static classifyError(error: unknown): {
    category: ErrorCategory
    severity: ErrorSeverity
    isRetryable: boolean
    userMessage: string
    technicalMessage: string
  } {
    // Handle specific error types
    if (error instanceof CascadeDeletionError) {
      return this.classifyCascadeDeletionError(error)
    }
    
    if (error instanceof DataIntegrityError) {
      return this.classifyDataIntegrityError(error)
    }
    
    if (error instanceof AuditTrailError) {
      return this.classifyAuditTrailError(error)
    }

    // Handle generic errors
    if (error instanceof Error) {
      return this.classifyGenericError(error)
    }

    // Handle unknown errors
    return {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      isRetryable: false,
      userMessage: 'An unexpected error occurred',
      technicalMessage: String(error),
    }
  }

  private static classifyCascadeDeletionError(error: CascadeDeletionError): {
    category: ErrorCategory
    severity: ErrorSeverity
    isRetryable: boolean
    userMessage: string
    technicalMessage: string
  } {
    const { code, message, recoverable } = error

    // Classify by error code
    switch (code) {
      case 'TIMEOUT':
        return {
          category: ErrorCategory.TIMEOUT,
          severity: ErrorSeverity.MEDIUM,
          isRetryable: true,
          userMessage: 'The operation timed out. Please try again.',
          technicalMessage: message,
        }

      case 'PREVIEW_FAILED':
        return {
          category: ErrorCategory.BUSINESS_LOGIC,
          severity: ErrorSeverity.LOW,
          isRetryable: true,
          userMessage: 'Could not preview the deletion. Please try again.',
          technicalMessage: message,
        }

      case 'EXECUTION_FAILED':
        return {
          category: ErrorCategory.BUSINESS_LOGIC,
          severity: ErrorSeverity.HIGH,
          isRetryable: recoverable,
          userMessage: 'The deletion operation failed. Please check the details and try again.',
          technicalMessage: message,
        }

      case 'OPERATION_NOT_FOUND':
        return {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          isRetryable: false,
          userMessage: 'The requested operation was not found.',
          technicalMessage: message,
        }

      case 'HTTP_401':
        return {
          category: ErrorCategory.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
          isRetryable: false,
          userMessage: 'Your session has expired. Please log in again.',
          technicalMessage: message,
        }

      case 'HTTP_403':
        return {
          category: ErrorCategory.AUTHORIZATION,
          severity: ErrorSeverity.HIGH,
          isRetryable: false,
          userMessage: 'You do not have permission to perform this operation.',
          technicalMessage: message,
        }

      case 'HTTP_429':
        return {
          category: ErrorCategory.RATE_LIMIT,
          severity: ErrorSeverity.MEDIUM,
          isRetryable: true,
          userMessage: 'Too many requests. Please wait a moment and try again.',
          technicalMessage: message,
        }

      default:
        return {
          category: ErrorCategory.BUSINESS_LOGIC,
          severity: recoverable ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH,
          isRetryable: recoverable,
          userMessage: message || 'A deletion error occurred',
          technicalMessage: message,
        }
    }
  }

  private static classifyDataIntegrityError(error: DataIntegrityError): {
    category: ErrorCategory
    severity: ErrorSeverity
    isRetryable: boolean
    userMessage: string
    technicalMessage: string
  } {
    const { severity, message } = error

    return {
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: severity === 'critical' ? ErrorSeverity.CRITICAL : 
              severity === 'high' ? ErrorSeverity.HIGH :
              severity === 'medium' ? ErrorSeverity.MEDIUM : ErrorSeverity.LOW,
      isRetryable: severity !== 'critical',
      userMessage: 'Data integrity check failed. Please contact support if this persists.',
      technicalMessage: message,
    }
  }

  private static classifyAuditTrailError(error: AuditTrailError): {
    category: ErrorCategory
    severity: ErrorSeverity
    isRetryable: boolean
    userMessage: string
    technicalMessage: string
  } {
    const { message, rollbackable } = error

    return {
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: rollbackable,
      userMessage: 'Audit trail operation failed. Please try again.',
      technicalMessage: message,
    }
  }

  private static classifyGenericError(error: Error): {
    category: ErrorCategory
    severity: ErrorSeverity
    isRetryable: boolean
    userMessage: string
    technicalMessage: string
  } {
    const message = error.message.toLowerCase()

    // Network-related errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        isRetryable: true,
        userMessage: 'Network error. Please check your connection and try again.',
        technicalMessage: error.message,
      }
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('abort')) {
      return {
        category: ErrorCategory.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        isRetryable: true,
        userMessage: 'The request timed out. Please try again.',
        technicalMessage: error.message,
      }
    }

    // Default classification
    return {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      isRetryable: false,
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalMessage: error.message,
    }
  }
}

// ==================== Retry Logic ====================

export class RetryHandler {
  private config: RetryConfig

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    let lastError: unknown
    let attempt = 0

    while (attempt < this.config.maxAttempts) {
      try {
        const result = await this.executeWithTimeout(operation)
        
        // Log successful retry if it wasn't the first attempt
        if (attempt > 0) {
          this.logRetrySuccess(attempt, context)
        }
        
        return result
      } catch (error) {
        attempt++
        lastError = error
        
        const classification = ErrorClassifier.classifyError(error)
        
        // Check if error is retryable
        if (!classification.isRetryable || !this.isRetryableError(error)) {
          this.logRetryAbandoned(error, attempt, context)
          throw error
        }
        
        // Don't retry on last attempt
        if (attempt >= this.config.maxAttempts) {
          this.logRetryExhausted(error, attempt, context)
          break
        }
        
        // Calculate delay and wait
        const delay = this.calculateDelay(attempt)
        this.logRetryAttempt(error, attempt, delay, context)
        
        await this.delay(delay)
      }
    }

    // If we get here, all retries were exhausted
    throw lastError
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Operation timed out'))
      }, this.config.timeoutMs)

      operation()
        .then(result => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  private isRetryableError(error: unknown): boolean {
    const classification = ErrorClassifier.classifyError(error)
    
    // Check against retryable error codes
    if (error instanceof CascadeDeletionError && error.code) {
      return this.config.retryableErrors.includes(error.code)
    }
    
    // Check category-based retryability
    const retryableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.TIMEOUT,
      ErrorCategory.RATE_LIMIT,
    ]
    
    return retryableCategories.includes(classification.category)
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.backoffFactor, attempt - 1)
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, this.config.maxDelay)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private logRetryAttempt(error: unknown, attempt: number, delay: number, context?: Partial<ErrorContext>) {
    console.warn(`Retry attempt ${attempt}/${this.config.maxAttempts} after ${delay}ms:`, {
      error,
      context,
    })
  }

  private logRetrySuccess(attempt: number, context?: Partial<ErrorContext>) {
    console.info(`Operation succeeded after ${attempt} retries`, { context })
  }

  private logRetryAbandoned(error: unknown, attempt: number, context?: Partial<ErrorContext>) {
    console.error(`Operation abandoned after ${attempt} attempts (non-retryable error):`, {
      error,
      context,
    })
  }

  private logRetryExhausted(error: unknown, maxAttempts: number, context?: Partial<ErrorContext>) {
    console.error(`All ${maxAttempts} retry attempts exhausted:`, {
      error,
      context,
    })
  }
}

// ==================== Error Logger ====================

export class ErrorLogger {
  private config: ErrorHandlerConfig

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_HANDLER_CONFIG, ...config }
  }

  async logError(
    error: unknown,
    context: Partial<ErrorContext> = {},
    options: {
      notify?: boolean
      logToServer?: boolean
      logToConsole?: boolean
    } = {}
  ): Promise<void> {
    const classification = ErrorClassifier.classifyError(error)
    const fullContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error instanceof Error ? error.stack : undefined,
      ...context,
    }

    // Log to console
    if (options.logToConsole !== false && this.config.enableLogging) {
      this.logToConsole(error, classification, fullContext)
    }

    // Log to server
    if (options.logToServer !== false && this.config.logEndpoint) {
      try {
        await this.logToServer(error, classification, fullContext)
      } catch (logError) {
        console.error('Failed to log error to server:', logError)
      }
    }

    // Show user notification
    if (options.notify !== false && this.config.enableNotifications) {
      this.notifyUser(classification, fullContext)
    }
  }

  private logToConsole(
    error: unknown,
    classification: ReturnType<typeof ErrorClassifier.classifyError>,
    context: ErrorContext
  ): void {
    const logData = {
      error,
      classification,
      context,
    }

    switch (classification.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('CRITICAL ERROR:', logData)
        break
      case ErrorSeverity.HIGH:
        console.error('HIGH SEVERITY ERROR:', logData)
        break
      case ErrorSeverity.MEDIUM:
        console.warn('MEDIUM SEVERITY ERROR:', logData)
        break
      case ErrorSeverity.LOW:
        console.info('LOW SEVERITY ERROR:', logData)
        break
    }
  }

  private async logToServer(
    error: unknown,
    classification: ReturnType<typeof ErrorClassifier.classifyError>,
    context: ErrorContext
  ): Promise<void> {
    const payload = {
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown',
      },
      classification,
      context,
    }

    const response = await fetch(this.config.logEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Failed to log error to server: ${response.statusText}`)
    }
  }

  private notifyUser(
    classification: ReturnType<typeof ErrorClassifier.classifyError>,
    context: ErrorContext
  ): void {
    const store = useCascadeDeletionStore.getState()
    
    const notificationType: NotificationMessage['type'] = 
      classification.severity === ErrorSeverity.CRITICAL ? 'error' :
      classification.severity === ErrorSeverity.HIGH ? 'error' :
      classification.severity === ErrorSeverity.MEDIUM ? 'warning' : 'info'

    const notification: Omit<NotificationMessage, 'id' | 'timestamp'> = {
      type: notificationType,
      title: this.getErrorTitle(classification),
      message: classification.userMessage,
      autoHide: classification.severity === ErrorSeverity.LOW,
      duration: this.getNotificationDuration(classification.severity),
      action: classification.isRetryable ? {
        label: 'Retry',
        onClick: () => {
          // Retry logic would be implemented by the calling component
          console.log('Retry requested for error:', context)
        }
      } : undefined,
    }

    store.addNotification(notification)
  }

  private getErrorTitle(classification: ReturnType<typeof ErrorClassifier.classifyError>): string {
    switch (classification.category) {
      case ErrorCategory.NETWORK:
        return 'Connection Error'
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication Required'
      case ErrorCategory.AUTHORIZATION:
        return 'Access Denied'
      case ErrorCategory.VALIDATION:
        return 'Invalid Data'
      case ErrorCategory.BUSINESS_LOGIC:
        return 'Operation Failed'
      case ErrorCategory.TIMEOUT:
        return 'Request Timeout'
      case ErrorCategory.RATE_LIMIT:
        return 'Rate Limit Exceeded'
      default:
        return 'System Error'
    }
  }

  private getNotificationDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 0 // Don't auto-hide
      case ErrorSeverity.HIGH:
        return 10000 // 10 seconds
      case ErrorSeverity.MEDIUM:
        return 7000 // 7 seconds
      case ErrorSeverity.LOW:
        return 5000 // 5 seconds
    }
  }
}

// ==================== Error Boundary Helper ====================

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class ErrorBoundaryHelper {
  static handleError(
    error: Error,
    errorInfo: any,
    context: Partial<ErrorContext> = {}
  ): ErrorBoundaryState {
    const logger = new ErrorLogger()
    
    // Log the error
    logger.logError(error, {
      ...context,
      stackTrace: errorInfo.componentStack,
      additionalData: { errorInfo },
    })

    return {
      hasError: true,
      error,
      errorInfo,
    }
  }

  static getErrorFallback(error: Error, retry: () => void) {
    const classification = ErrorClassifier.classifyError(error)
    
    return {
      title: 'Something went wrong',
      message: classification.userMessage,
      canRetry: classification.isRetryable,
      onRetry: retry,
      severity: classification.severity,
    }
  }
}

// ==================== Global Error Handler ====================

export class GlobalErrorHandler {
  private retryHandler: RetryHandler
  private errorLogger: ErrorLogger

  constructor(
    retryConfig?: Partial<RetryConfig>,
    errorConfig?: Partial<ErrorHandlerConfig>
  ) {
    this.retryHandler = new RetryHandler(retryConfig)
    this.errorLogger = new ErrorLogger(errorConfig)
  }

  async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>,
    options?: {
      skipRetry?: boolean
      skipLogging?: boolean
      skipNotification?: boolean
    }
  ): Promise<T> {
    try {
      if (options?.skipRetry) {
        return await operation()
      } else {
        return await this.retryHandler.executeWithRetry(operation, context)
      }
    } catch (error) {
      // Log the error unless explicitly skipped
      if (!options?.skipLogging) {
        await this.errorLogger.logError(error, context, {
          notify: !options?.skipNotification,
        })
      }
      
      throw error
    }
  }

  getRetryHandler(): RetryHandler {
    return this.retryHandler
  }

  getErrorLogger(): ErrorLogger {
    return this.errorLogger
  }
}

// ==================== Singleton Instance ====================

export const globalErrorHandler = new GlobalErrorHandler()

// ==================== Error Recovery Utilities ====================

export class ErrorRecoveryUtils {
  static async recoverFromAuthError(): Promise<void> {
    // Clear tokens
    localStorage.removeItem('authToken')
    sessionStorage.removeItem('authToken')
    
    // Redirect to login
    window.location.href = '/login'
  }

  static async recoverFromNetworkError(): Promise<boolean> {
    try {
      // Try to ping the server
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      })
      
      return response.ok
    } catch {
      return false
    }
  }

  static clearOperationCache(): void {
    const store = useCascadeDeletionStore.getState()
    // Clear any cached operation data
    store.activeOperations.clear()
    store.operationProgress.clear()
  }

  static async retryFailedOperation(operationId: string): Promise<void> {
    try {
      const store = useCascadeDeletionStore.getState()
      const operation = store.activeOperations.get(operationId)
      
      if (!operation) {
        throw new CascadeDeletionError('Operation not found', 'OPERATION_NOT_FOUND', operationId)
      }

      // Reset operation status and retry
      store.optimisticallyUpdateOperation(operationId, {
        status: 'pending',
        error: undefined,
        failedAt: undefined,
      })

      // The actual retry would be handled by the calling component
      console.log('Retrying operation:', operationId)
    } catch (error) {
      await globalErrorHandler.getErrorLogger().logError(error, { operationId })
      throw error
    }
  }
}

// ==================== Hook for Error Handling ====================

export function useErrorHandler() {
  const handleError = async (
    error: unknown,
    context?: Partial<ErrorContext>,
    options?: {
      skipRetry?: boolean
      skipLogging?: boolean
      skipNotification?: boolean
    }
  ) => {
    await globalErrorHandler.getErrorLogger().logError(error, context, {
      notify: !options?.skipNotification,
      logToServer: !options?.skipLogging,
    })
  }

  const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T> => {
    return globalErrorHandler.handleAsyncOperation(operation, context)
  }

  const classifyError = (error: unknown) => {
    return ErrorClassifier.classifyError(error)
  }

  return {
    handleError,
    executeWithRetry,
    classifyError,
    retryHandler: globalErrorHandler.getRetryHandler(),
    errorLogger: globalErrorHandler.getErrorLogger(),
  }
}