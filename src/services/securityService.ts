/**
 * Security service for cascade deletion operations
 * Implements comprehensive security measures including rate limiting,
 * access control, audit logging, and threat detection
 */

interface SecurityContext {
  userId: string
  userRole: 'admin' | 'teacher' | 'student'
  sessionId: string
  ipAddress: string
  userAgent: string
  timestamp: number
}

interface SecurityViolation {
  type: 'rate_limit' | 'permission_denied' | 'suspicious_activity' | 'data_integrity' | 'authentication'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  context: SecurityContext
  metadata?: any
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests: boolean
  skipFailedRequests: boolean
}

interface PermissionRule {
  resource: string
  action: 'read' | 'write' | 'delete' | 'admin'
  roles: string[]
  conditions?: (context: SecurityContext) => boolean
}

class CascadeDeletionSecurity {
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map()
  private securityViolations: SecurityViolation[] = []
  private permissionRules: PermissionRule[] = []
  private blockedIPs: Set<string> = new Set()
  private suspiciousActivity: Map<string, number> = new Map()

  constructor() {
    this.initializePermissionRules()
    this.startSecurityMonitoring()
  }

  private initializePermissionRules() {
    this.permissionRules = [
      {
        resource: 'cascade_deletion_preview',
        action: 'read',
        roles: ['admin']
      },
      {
        resource: 'cascade_deletion_execute',
        action: 'delete',
        roles: ['admin'],
        conditions: (context) => {
          // Only allow during business hours
          const hour = new Date().getHours()
          return hour >= 9 && hour <= 17
        }
      },
      {
        resource: 'bulk_deletion',
        action: 'delete',
        roles: ['admin'],
        conditions: (context) => {
          // Require recent authentication for bulk operations
          const lastAuth = localStorage.getItem('lastAuthTime')
          if (!lastAuth) return false
          return Date.now() - parseInt(lastAuth) < 300000 // 5 minutes
        }
      },
      {
        resource: 'deletion_audit_log',
        action: 'read',
        roles: ['admin']
      },
      {
        resource: 'data_integrity_check',
        action: 'read',
        roles: ['admin']
      },
      {
        resource: 'cascade_deletion_analytics',
        action: 'read',
        roles: ['admin', 'teacher']
      }
    ]
  }

  // Rate limiting for deletion operations
  checkRateLimit(operation: string, context: SecurityContext, config: RateLimitConfig): boolean {
    const key = `${operation}:${context.userId}:${context.ipAddress}`
    const now = Date.now()
    
    let limiter = this.rateLimiters.get(key)
    
    if (!limiter || now > limiter.resetTime) {
      // Reset or create new rate limiter
      limiter = {
        count: 1,
        resetTime: now + config.windowMs
      }
      this.rateLimiters.set(key, limiter)
      return true
    }
    
    if (limiter.count >= config.maxRequests) {
      this.recordSecurityViolation({
        type: 'rate_limit',
        severity: 'medium',
        description: `Rate limit exceeded for operation: ${operation}`,
        context,
        metadata: { operation, limit: config.maxRequests, window: config.windowMs }
      })
      return false
    }
    
    limiter.count++
    return true
  }

  // Permission checking
  checkPermission(resource: string, action: string, context: SecurityContext): boolean {
    // Check if IP is blocked
    if (this.blockedIPs.has(context.ipAddress)) {
      this.recordSecurityViolation({
        type: 'permission_denied',
        severity: 'high',
        description: `Access denied for blocked IP: ${context.ipAddress}`,
        context
      })
      return false
    }

    // Find matching permission rule
    const rule = this.permissionRules.find(r => 
      r.resource === resource && r.action === action
    )

    if (!rule) {
      this.recordSecurityViolation({
        type: 'permission_denied',
        severity: 'medium',
        description: `No permission rule found for resource: ${resource}, action: ${action}`,
        context
      })
      return false
    }

    // Check role-based access
    if (!rule.roles.includes(context.userRole)) {
      this.recordSecurityViolation({
        type: 'permission_denied',
        severity: 'medium',
        description: `Role '${context.userRole}' not authorized for ${resource}:${action}`,
        context
      })
      return false
    }

    // Check additional conditions
    if (rule.conditions && !rule.conditions(context)) {
      this.recordSecurityViolation({
        type: 'permission_denied',
        severity: 'medium',
        description: `Conditional permission check failed for ${resource}:${action}`,
        context
      })
      return false
    }

    return true
  }

  // Suspicious activity detection
  detectSuspiciousActivity(operation: string, context: SecurityContext, metadata?: any): boolean {
    const suspiciousPatterns = [
      // Rapid successive deletion attempts
      () => {
        const key = `${operation}:${context.userId}`
        const count = this.suspiciousActivity.get(key) || 0
        this.suspiciousActivity.set(key, count + 1)
        
        // Clear count after 1 minute
        setTimeout(() => {
          this.suspiciousActivity.delete(key)
        }, 60000)
        
        return count > 10 // More than 10 operations per minute
      },
      
      // Deletion of unusually large number of entities
      () => {
        return metadata?.entityCount && metadata.entityCount > 100
      },
      
      // Operations outside business hours
      () => {
        const hour = new Date().getHours()
        return hour < 6 || hour > 22
      },
      
      // Multiple failed deletion attempts
      () => {
        return metadata?.failureCount && metadata.failureCount > 3
      },
      
      // Unusual user agent patterns
      () => {
        const suspiciousUAs = ['curl', 'wget', 'python', 'bot']
        return suspiciousUAs.some(ua => 
          context.userAgent.toLowerCase().includes(ua)
        )
      }
    ]

    const isSuspicious = suspiciousPatterns.some(check => check())
    
    if (isSuspicious) {
      this.recordSecurityViolation({
        type: 'suspicious_activity',
        severity: 'high',
        description: `Suspicious activity detected for operation: ${operation}`,
        context,
        metadata: { operation, ...metadata }
      })
      
      // Temporarily block IP after multiple suspicious activities
      const violationCount = this.securityViolations.filter(v => 
        v.context.ipAddress === context.ipAddress &&
        v.type === 'suspicious_activity' &&
        Date.now() - v.context.timestamp < 300000 // Last 5 minutes
      ).length
      
      if (violationCount >= 3) {
        this.blockedIPs.add(context.ipAddress)
        console.warn(`🚫 IP ${context.ipAddress} temporarily blocked due to suspicious activity`)
        
        // Remove block after 1 hour
        setTimeout(() => {
          this.blockedIPs.delete(context.ipAddress)
        }, 3600000)
      }
    }
    
    return isSuspicious
  }

  // Data integrity validation before deletion
  async validateDataIntegrity(entityType: string, entityIds: string[]): Promise<boolean> {
    try {
      const response = await fetch('/api/security/validate-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ entityType, entityIds })
      })

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.isValid) {
        this.recordSecurityViolation({
          type: 'data_integrity',
          severity: 'high',
          description: `Data integrity violation detected: ${result.violations.join(', ')}`,
          context: this.getCurrentContext(),
          metadata: { entityType, entityIds, violations: result.violations }
        })
      }
      
      return result.isValid
      
    } catch (error) {
      console.error('Data integrity validation error:', error)
      return false
    }
  }

  // Secure deletion operation wrapper
  async secureDeleteOperation<T>(
    operation: string,
    deletionFn: () => Promise<T>,
    context: SecurityContext,
    metadata?: any
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      // Rate limiting check
      const rateLimitConfig: RateLimitConfig = {
        windowMs: 60000, // 1 minute
        maxRequests: operation.includes('bulk') ? 2 : 10,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      }
      
      if (!this.checkRateLimit(operation, context, rateLimitConfig)) {
        return { success: false, error: 'Rate limit exceeded' }
      }

      // Permission check
      const resource = operation.replace('_', '_deletion_')
      if (!this.checkPermission(resource, 'delete', context)) {
        return { success: false, error: 'Permission denied' }
      }

      // Suspicious activity detection
      if (this.detectSuspiciousActivity(operation, context, metadata)) {
        return { success: false, error: 'Suspicious activity detected' }
      }

      // Data integrity validation
      if (metadata?.entityIds) {
        const isValid = await this.validateDataIntegrity(metadata.entityType, metadata.entityIds)
        if (!isValid) {
          return { success: false, error: 'Data integrity validation failed' }
        }
      }

      // Execute the operation
      const startTime = performance.now()
      const result = await deletionFn()
      const duration = performance.now() - startTime

      // Log successful operation
      this.auditLog({
        operation,
        context,
        success: true,
        duration,
        metadata
      })

      return { success: true, data: result }

    } catch (error) {
      // Log failed operation
      this.auditLog({
        operation,
        context,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata
      })

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Operation failed' 
      }
    }
  }

  // Audit logging
  private auditLog(entry: {
    operation: string
    context: SecurityContext
    success: boolean
    duration?: number
    error?: string
    metadata?: any
  }) {
    const auditEntry = {
      ...entry,
      timestamp: Date.now(),
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Send to audit log service
    this.sendToAuditLog(auditEntry)

    // Store locally for debugging
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      const logs = JSON.parse(localStorage.getItem('cascade_audit_logs') || '[]')
      logs.push(auditEntry)
      // Keep only last 100 entries
      const recentLogs = logs.slice(-100)
      localStorage.setItem('cascade_audit_logs', JSON.stringify(recentLogs))
    }
  }

  private async sendToAuditLog(entry: any) {
    try {
      await fetch('/api/audit/cascade-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(entry)
      })
    } catch (error) {
      console.error('Failed to send audit log:', error)
    }
  }

  // Record security violations
  private recordSecurityViolation(violation: SecurityViolation) {
    this.securityViolations.push(violation)

    // Send critical violations immediately
    if (violation.severity === 'critical' || violation.severity === 'high') {
      this.sendSecurityAlert(violation)
    }

    // Keep only recent violations
    const oneHourAgo = Date.now() - 3600000
    this.securityViolations = this.securityViolations.filter(v => 
      v.context.timestamp > oneHourAgo
    )

    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.warn('🚨 Security violation recorded:', violation)
    }
  }

  private async sendSecurityAlert(violation: SecurityViolation) {
    try {
      // Send to monitoring service
      if (window.cascadeDeletionMonitoring) {
        window.cascadeDeletionMonitoring.createAlert({
          type: 'error',
          service: 'cascade-deletion',
          message: `Security violation: ${violation.description}`,
          severity: violation.severity === 'critical' ? 'critical' : 'high'
        })
      }

      // Send to external security service
      const securityEndpoint = import.meta.env.VITE_SECURITY_ENDPOINT
      if (securityEndpoint) {
        await fetch(securityEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(violation)
        })
      }
    } catch (error) {
      console.error('Failed to send security alert:', error)
    }
  }

  // Get current security context
  private getCurrentContext(): SecurityContext {
    return {
      userId: localStorage.getItem('userId') || 'anonymous',
      userRole: (localStorage.getItem('userRole') || 'student') as any,
      sessionId: localStorage.getItem('sessionId') || 'unknown',
      ipAddress: 'client', // Would be set by server
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    }
  }

  // Security monitoring
  private startSecurityMonitoring() {
    // Clean up old rate limiters every 5 minutes
    setInterval(() => {
      const now = Date.now()
      for (const [key, limiter] of this.rateLimiters.entries()) {
        if (now > limiter.resetTime) {
          this.rateLimiters.delete(key)
        }
      }
    }, 300000)

    // Generate security summary every hour
    setInterval(() => {
      this.generateSecuritySummary()
    }, 3600000)
  }

  private generateSecuritySummary() {
    const summary = {
      timestamp: Date.now(),
      rateLimitViolations: this.securityViolations.filter(v => v.type === 'rate_limit').length,
      permissionDenials: this.securityViolations.filter(v => v.type === 'permission_denied').length,
      suspiciousActivities: this.securityViolations.filter(v => v.type === 'suspicious_activity').length,
      dataIntegrityIssues: this.securityViolations.filter(v => v.type === 'data_integrity').length,
      blockedIPs: this.blockedIPs.size,
      activeRateLimiters: this.rateLimiters.size
    }

    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log('🛡️ Security Summary:', summary)
    }
  }

  // Public API
  getSecurityViolations(): SecurityViolation[] {
    return [...this.securityViolations]
  }

  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs)
  }

  unblockIP(ipAddress: string) {
    this.blockedIPs.delete(ipAddress)
    console.log(`✅ IP ${ipAddress} unblocked`)
  }
}

// Export singleton instance
export const cascadeDeletionSecurity = new CascadeDeletionSecurity()

export type { SecurityContext, SecurityViolation, RateLimitConfig, PermissionRule }
export default cascadeDeletionSecurity