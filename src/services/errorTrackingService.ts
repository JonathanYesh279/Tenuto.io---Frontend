/**
 * Error tracking and alerting service for cascade deletion operations
 * Integrates with Sentry, custom logging, and real-time alerting systems
 */

interface CascadeError {
  id: string
  type: 'network' | 'validation' | 'permission' | 'integrity' | 'timeout' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  stack?: string
  context: {
    operation: string
    entityType?: string
    entityIds?: string[]
    userId: string
    userRole: string
    timestamp: number
    url: string
    userAgent: string
    componentStack?: string
  }
  metadata?: {
    networkStatus?: string
    responseCode?: number
    deletionPhase?: 'preview' | 'validation' | 'execution' | 'cleanup'
    batchSize?: number
    affectedEntities?: number
    retryCount?: number
  }
  fingerprint?: string // For error deduplication
  tags?: string[]
}

interface AlertRule {
  name: string
  condition: (error: CascadeError) => boolean
  channels: ('slack' | 'email' | 'pager' | 'console')[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  debounceMs: number // Minimum time between alerts
  enabled: boolean
}

interface ErrorPattern {
  name: string
  pattern: RegExp | ((error: CascadeError) => boolean)
  category: string
  priority: number
  suggestedAction?: string
}

class CascadeDeletionErrorTracking {
  private errors: CascadeError[] = []
  private alertRules: AlertRule[] = []
  private errorPatterns: ErrorPattern[] = []
  private lastAlertTimes: Map<string, number> = new Map()
  private errorFrequency: Map<string, { count: number; firstSeen: number }> = new Map()
  private sentryInitialized = false

  constructor() {
    this.initializeSentry()
    this.setupAlertRules()
    this.setupErrorPatterns()
    this.setupGlobalErrorHandlers()
  }

  private initializeSentry() {
    if (import.meta.env.VITE_SENTRY_DSN && !this.sentryInitialized) {
      try {
        // Dynamic import of Sentry to avoid bundle bloat
        import('@sentry/browser').then(Sentry => {
          Sentry.init({
            dsn: import.meta.env.VITE_SENTRY_DSN,
            environment: import.meta.env.MODE,
            integrations: [
              new Sentry.BrowserTracing({
                tracingOrigins: [window.location.hostname, 'api.conservatory-app.com']
              })
            ],
            tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
            beforeSend: (event) => {
              // Filter out non-cascade deletion errors in production
              if (import.meta.env.MODE === 'production') {
                const isCascadeError = event.tags?.cascade_deletion || 
                  event.message?.includes('cascade') ||
                  event.message?.includes('deletion')
                
                if (!isCascadeError) return null
              }
              return event
            }
          })

          // Set context for cascade deletion
          Sentry.setTag('component', 'cascade-deletion')
          Sentry.setTag('version', import.meta.env.VITE_APP_VERSION)
          
          this.sentryInitialized = true
          console.log('🔍 Sentry initialized for cascade deletion error tracking')
        }).catch(error => {
          console.warn('Failed to initialize Sentry:', error)
        })
      } catch (error) {
        console.warn('Sentry not available:', error)
      }
    }
  }

  private setupAlertRules() {
    this.alertRules = [
      {
        name: 'critical_cascade_deletion_failure',
        condition: (error) => error.severity === 'critical' && error.context.operation.includes('cascade'),
        channels: ['slack', 'pager'],
        severity: 'critical',
        debounceMs: 0, // Immediate alert for critical errors
        enabled: true
      },
      {
        name: 'data_integrity_violation',
        condition: (error) => error.type === 'integrity',
        channels: ['slack', 'email'],
        severity: 'high',
        debounceMs: 60000, // 1 minute debounce
        enabled: true
      },
      {
        name: 'bulk_deletion_timeout',
        condition: (error) => error.type === 'timeout' && error.metadata?.batchSize && error.metadata.batchSize > 10,
        channels: ['slack'],
        severity: 'medium',
        debounceMs: 300000, // 5 minute debounce
        enabled: true
      },
      {
        name: 'permission_errors_spike',
        condition: (error) => {
          const fingerprint = `permission_${error.context.userId}_${error.context.operation}`
          const frequency = this.errorFrequency.get(fingerprint)
          return error.type === 'permission' && frequency && frequency.count > 5
        },
        channels: ['slack'],
        severity: 'medium',
        debounceMs: 600000, // 10 minute debounce
        enabled: true
      },
      {
        name: 'network_errors_cascade',
        condition: (error) => error.type === 'network' && error.context.operation.includes('deletion'),
        channels: ['console'],
        severity: 'low',
        debounceMs: 120000, // 2 minute debounce
        enabled: true
      }
    ]
  }

  private setupErrorPatterns() {
    this.errorPatterns = [
      {
        name: 'websocket_disconnection',
        pattern: /websocket.*disconnect|connection.*lost/i,
        category: 'connectivity',
        priority: 1,
        suggestedAction: 'Check WebSocket server status and network connectivity'
      },
      {
        name: 'cascade_timeout',
        pattern: /timeout.*cascade|cascade.*timeout/i,
        category: 'performance',
        priority: 2,
        suggestedAction: 'Consider reducing batch size or optimizing cascade deletion queries'
      },
      {
        name: 'foreign_key_constraint',
        pattern: /foreign.*key.*constraint|referential.*integrity/i,
        category: 'data_integrity',
        priority: 3,
        suggestedAction: 'Run data integrity check and fix orphaned references'
      },
      {
        name: 'memory_exhaustion',
        pattern: /out.*of.*memory|memory.*limit.*exceeded/i,
        category: 'performance',
        priority: 1,
        suggestedAction: 'Reduce batch size and implement streaming for large deletions'
      },
      {
        name: 'permission_denied_pattern',
        pattern: (error) => error.type === 'permission' && error.context.userRole !== 'admin',
        category: 'security',
        priority: 2,
        suggestedAction: 'Verify user permissions and role assignments'
      }
    ]
  }

  private setupGlobalErrorHandlers() {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isCascadeRelatedError(event.reason)) {
        this.captureError(event.reason, {
          operation: 'unhandled_promise_rejection',
          source: 'global_handler'
        })
      }
    })

    // JavaScript errors
    window.addEventListener('error', (event) => {
      if (this.isCascadeRelatedError(event.error) || 
          event.filename?.includes('cascade') || 
          event.filename?.includes('deletion')) {
        this.captureError(event.error, {
          operation: 'javascript_error',
          source: 'global_handler',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      }
    })
  }

  private isCascadeRelatedError(error: any): boolean {
    if (!error) return false
    
    const errorString = error.toString().toLowerCase()
    return errorString.includes('cascade') || 
           errorString.includes('deletion') || 
           errorString.includes('batch') ||
           error.component?.includes('cascade')
  }

  // Main error capture method
  captureError(error: Error | string, context: Partial<CascadeError['context']> = {}, metadata?: CascadeError['metadata']) {
    const cascadeError: CascadeError = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.classifyError(error, metadata),
      severity: this.determineSeverity(error, metadata),
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        operation: context.operation || 'unknown',
        entityType: context.entityType,
        entityIds: context.entityIds,
        userId: context.userId || localStorage.getItem('userId') || 'anonymous',
        userRole: context.userRole || localStorage.getItem('userRole') || 'unknown',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        componentStack: context.componentStack
      },
      metadata,
      fingerprint: this.generateFingerprint(error, context),
      tags: this.generateTags(error, context, metadata)
    }

    // Store error locally
    this.errors.push(cascadeError)
    this.updateErrorFrequency(cascadeError)

    // Send to external services
    this.sendToSentry(cascadeError)
    this.sendToCustomLogger(cascadeError)

    // Check alert rules
    this.processAlertRules(cascadeError)

    // Pattern matching
    this.matchErrorPatterns(cascadeError)

    // Keep only recent errors (last 1000)
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000)
    }

    // Debug logging
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.error('🚨 Cascade deletion error captured:', cascadeError)
    }

    return cascadeError.id
  }

  private classifyError(error: Error | string, metadata?: CascadeError['metadata']): CascadeError['type'] {
    const errorStr = (error instanceof Error ? error.message : error).toLowerCase()
    
    if (errorStr.includes('network') || errorStr.includes('fetch') || metadata?.responseCode) {
      return 'network'
    }
    if (errorStr.includes('permission') || errorStr.includes('unauthorized') || metadata?.responseCode === 403) {
      return 'permission'
    }
    if (errorStr.includes('validation') || errorStr.includes('invalid')) {
      return 'validation'
    }
    if (errorStr.includes('timeout') || errorStr.includes('abort')) {
      return 'timeout'
    }
    if (errorStr.includes('integrity') || errorStr.includes('constraint') || errorStr.includes('foreign')) {
      return 'integrity'
    }
    
    return 'unknown'
  }

  private determineSeverity(error: Error | string, metadata?: CascadeError['metadata']): CascadeError['severity'] {
    const errorStr = (error instanceof Error ? error.message : error).toLowerCase()
    
    // Critical conditions
    if (errorStr.includes('data loss') || 
        errorStr.includes('corruption') ||
        metadata?.deletionPhase === 'execution' && metadata?.affectedEntities && metadata.affectedEntities > 50) {
      return 'critical'
    }
    
    // High severity conditions
    if (errorStr.includes('integrity') ||
        errorStr.includes('constraint') ||
        metadata?.deletionPhase === 'execution' ||
        metadata?.responseCode && metadata.responseCode >= 500) {
      return 'high'
    }
    
    // Medium severity conditions
    if (errorStr.includes('timeout') ||
        errorStr.includes('permission') ||
        metadata?.responseCode && metadata.responseCode === 403) {
      return 'medium'
    }
    
    return 'low'
  }

  private generateFingerprint(error: Error | string, context: Partial<CascadeError['context']>): string {
    const errorMsg = error instanceof Error ? error.message : error
    const operation = context.operation || 'unknown'
    
    // Create fingerprint for deduplication
    const fingerprintString = `${operation}_${errorMsg.substring(0, 50)}_${context.entityType || 'unknown'}`
    
    // Simple hash function
    let hash = 0
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return `fp_${Math.abs(hash).toString(36)}`
  }

  private generateTags(error: Error | string, context: Partial<CascadeError['context']>, metadata?: CascadeError['metadata']): string[] {
    const tags = ['cascade-deletion']
    
    if (context.operation) tags.push(`operation:${context.operation}`)
    if (context.entityType) tags.push(`entity:${context.entityType}`)
    if (context.userRole) tags.push(`role:${context.userRole}`)
    if (metadata?.deletionPhase) tags.push(`phase:${metadata.deletionPhase}`)
    if (metadata?.batchSize) {
      const batchCategory = metadata.batchSize > 50 ? 'large' : metadata.batchSize > 10 ? 'medium' : 'small'
      tags.push(`batch:${batchCategory}`)
    }
    
    return tags
  }

  private updateErrorFrequency(error: CascadeError) {
    const frequency = this.errorFrequency.get(error.fingerprint!) || { count: 0, firstSeen: Date.now() }
    frequency.count++
    this.errorFrequency.set(error.fingerprint!, frequency)
    
    // Clean up old frequency data (older than 1 hour)
    const oneHourAgo = Date.now() - 3600000
    for (const [key, freq] of this.errorFrequency.entries()) {
      if (freq.firstSeen < oneHourAgo) {
        this.errorFrequency.delete(key)
      }
    }
  }

  private async sendToSentry(error: CascadeError) {
    if (!this.sentryInitialized) return
    
    try {
      const Sentry = await import('@sentry/browser')
      
      Sentry.withScope(scope => {
        scope.setTag('cascade_deletion', true)
        scope.setLevel(error.severity as any)
        scope.setContext('cascade_context', error.context)
        scope.setContext('cascade_metadata', error.metadata || {})
        error.tags?.forEach(tag => {
          const [key, value] = tag.includes(':') ? tag.split(':', 2) : [tag, 'true']
          scope.setTag(key, value)
        })
        scope.setFingerprint([error.fingerprint!])
        
        if (error.stack) {
          Sentry.captureException(new Error(error.message))
        } else {
          Sentry.captureMessage(error.message)
        }
      })
    } catch (err) {
      console.warn('Failed to send error to Sentry:', err)
    }
  }

  private async sendToCustomLogger(error: CascadeError) {
    try {
      const endpoint = import.meta.env.VITE_ERROR_LOGGING_ENDPOINT
      if (!endpoint) return
      
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_ERROR_LOGGING_TOKEN}`
        },
        body: JSON.stringify(error)
      })
    } catch (err) {
      console.warn('Failed to send error to custom logger:', err)
    }
  }

  private processAlertRules(error: CascadeError) {
    for (const rule of this.alertRules) {
      if (!rule.enabled || !rule.condition(error)) continue
      
      const lastAlertTime = this.lastAlertTimes.get(rule.name) || 0
      const now = Date.now()
      
      if (now - lastAlertTime < rule.debounceMs) continue
      
      this.sendAlert(rule, error)
      this.lastAlertTimes.set(rule.name, now)
    }
  }

  private async sendAlert(rule: AlertRule, error: CascadeError) {
    const alertMessage = this.formatAlertMessage(rule, error)
    
    for (const channel of rule.channels) {
      try {
        switch (channel) {
          case 'slack':
            await this.sendSlackAlert(alertMessage, rule.severity)
            break
          case 'email':
            await this.sendEmailAlert(alertMessage, rule.severity)
            break
          case 'pager':
            await this.sendPagerAlert(alertMessage, rule.severity)
            break
          case 'console':
            console.error(`🚨 [${rule.severity.toUpperCase()}] ${alertMessage}`)
            break
        }
      } catch (err) {
        console.error(`Failed to send alert to ${channel}:`, err)
      }
    }
  }

  private formatAlertMessage(rule: AlertRule, error: CascadeError): string {
    return `
🚨 CASCADE DELETION ALERT: ${rule.name}

Severity: ${error.severity.toUpperCase()}
Operation: ${error.context.operation}
Message: ${error.message}
User: ${error.context.userId} (${error.context.userRole})
Time: ${new Date(error.context.timestamp).toISOString()}
${error.context.entityType ? `Entity Type: ${error.context.entityType}` : ''}
${error.metadata?.batchSize ? `Batch Size: ${error.metadata.batchSize}` : ''}
${error.metadata?.affectedEntities ? `Affected Entities: ${error.metadata.affectedEntities}` : ''}

Error ID: ${error.id}
Fingerprint: ${error.fingerprint}
    `.trim()
  }

  private async sendSlackAlert(message: string, severity: string) {
    const webhookUrl = import.meta.env.VITE_SLACK_WEBHOOK_URL
    if (!webhookUrl) return
    
    const color = {
      'low': '#36a64f',
      'medium': '#ff9500',
      'high': '#ff4444',
      'critical': '#ff0000'
    }[severity] || '#cccccc'
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          text: message,
          ts: Math.floor(Date.now() / 1000)
        }]
      })
    })
  }

  private async sendEmailAlert(message: string, severity: string) {
    // Implementation would depend on email service
    console.log('Email alert:', { message, severity })
  }

  private async sendPagerAlert(message: string, severity: string) {
    // Implementation would depend on paging service (PagerDuty, etc.)
    console.log('Pager alert:', { message, severity })
  }

  private matchErrorPatterns(error: CascadeError) {
    for (const pattern of this.errorPatterns) {
      const matches = typeof pattern.pattern === 'function' ? 
        pattern.pattern(error) : 
        pattern.pattern.test(error.message)
      
      if (matches) {
        console.log(`🎯 Error pattern matched: ${pattern.name}`)
        if (pattern.suggestedAction && import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
          console.log(`💡 Suggested action: ${pattern.suggestedAction}`)
        }
        
        // Add pattern tags
        error.tags = error.tags || []
        error.tags.push(`pattern:${pattern.name}`)
        error.tags.push(`category:${pattern.category}`)
        break // Match first pattern only
      }
    }
  }

  // Public API methods
  getRecentErrors(limit = 50): CascadeError[] {
    return this.errors.slice(-limit)
  }

  getErrorsByType(type: CascadeError['type']): CascadeError[] {
    return this.errors.filter(error => error.type === type)
  }

  getErrorFrequency(): Map<string, { count: number; firstSeen: number }> {
    return new Map(this.errorFrequency)
  }

  clearErrors() {
    this.errors = []
    this.errorFrequency.clear()
    this.lastAlertTimes.clear()
  }

  exportErrorData() {
    return {
      errors: this.errors,
      frequency: Array.from(this.errorFrequency.entries()),
      alertRules: this.alertRules,
      exportedAt: Date.now()
    }
  }
}

// Create singleton instance
export const cascadeDeletionErrorTracking = new CascadeDeletionErrorTracking()

// React error boundary integration
export class CascadeDeletionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    cascadeDeletionErrorTracking.captureError(error, {
      operation: 'react_error_boundary',
      componentStack: errorInfo.componentStack
    }, {
      deletionPhase: 'execution' // Assume error during execution
    })
  }

}

export type { CascadeError, AlertRule, ErrorPattern }
export default cascadeDeletionErrorTracking