/**
 * Security-focused Audit Service
 * 
 * Extends the existing audit trail service with comprehensive security logging,
 * deletion operation tracking, and compliance reporting for the cascade deletion system.
 */

import { auditTrailService, AuditTrailService } from './auditTrailService';
import { AuditLogEntry } from '../types/cascade-deletion.types';

// Security audit event types
export interface SecurityAuditEvent {
  eventType: 'permission_check' | 'verification_attempt' | 'rate_limit_hit' | 'suspicious_activity' | 
            'deletion_attempt' | 'security_violation' | 'session_event' | 'authentication_event';
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  timestamp: Date;
  details: {
    action: string;
    resource?: string;
    studentId?: string;
    operationType?: 'single' | 'bulk' | 'cascade' | 'cleanup';
    permissionLevel?: string;
    rateLimitType?: 'single' | 'bulk' | 'cleanup';
    verificationStep?: string;
    securityToken?: string;
    failureReason?: string;
    additionalData?: Record<string, any>;
  };
  location?: {
    page: string;
    component?: string;
    function?: string;
  };
}

export interface SecurityAuditSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  securityViolations: number;
  failedPermissionChecks: number;
  failedVerifications: number;
  rateLimitHits: number;
  suspiciousActivities: number;
  topUsers: Array<{
    userId: string;
    userName: string;
    eventCount: number;
    violationCount: number;
  }>;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface SecurityMetrics {
  deletionOperations: {
    totalAttempts: number;
    successful: number;
    failed: number;
    byType: Record<'single' | 'bulk' | 'cascade' | 'cleanup', number>;
    byUser: Record<string, number>;
    averageVerificationTime: number;
  };
  permissionChecks: {
    total: number;
    granted: number;
    denied: number;
    denyReasons: Record<string, number>;
  };
  rateLimiting: {
    totalHits: number;
    byType: Record<string, number>;
    userViolations: Record<string, number>;
  };
  securityIncidents: {
    total: number;
    resolved: number;
    pending: number;
    bySeverity: Record<string, number>;
  };
}

// Hebrew security messages
const HEBREW_SECURITY_MESSAGES = {
  events: {
    permission_check: 'בדיקת הרשאות',
    verification_attempt: 'ניסיון אימות',
    rate_limit_hit: 'חרגת מהמגבלה',
    suspicious_activity: 'פעילות חשודה',
    deletion_attempt: 'ניסיון מחיקה',
    security_violation: 'הפרת אבטחה',
    session_event: 'אירוע הפעלה',
    authentication_event: 'אירוע אימות'
  },
  severity: {
    info: 'מידע',
    warning: 'אזהרה',
    error: 'שגיאה',
    critical: 'קריטי'
  },
  violations: {
    unauthorized_access: 'גישה לא מורשית',
    permission_escalation: 'הסלמת הרשאות',
    rate_limit_exceeded: 'חריגה מהמגבלה',
    suspicious_pattern: 'דפוס חשוד',
    failed_verification: 'אימות נכשל',
    session_hijacking: 'חטיפת הפעלה',
    brute_force: 'התקפת כוח גס'
  }
};

/**
 * Enhanced Security Audit Service
 */
export class SecurityAuditService {
  private auditService: AuditTrailService;
  private eventBuffer: SecurityAuditEvent[] = [];
  private bufferSize = 50;
  private flushInterval = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;
  private isOnline = navigator.onLine;

  constructor() {
    this.auditService = auditTrailService;
    this.setupEventBuffer();
    this.setupNetworkListener();
  }

  // ==================== Core Logging Methods ====================

  /**
   * Log a security audit event
   */
  async logSecurityEvent(event: Omit<SecurityAuditEvent, 'timestamp'>): Promise<void> {
    const securityEvent: SecurityAuditEvent = {
      ...event,
      timestamp: new Date(),
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      deviceFingerprint: this.generateDeviceFingerprint(),
      location: {
        page: window.location.pathname,
        component: event.location?.component,
        function: event.location?.function
      }
    };

    // Add to buffer for batch processing
    this.eventBuffer.push(securityEvent);

    // For critical events, flush immediately
    if (event.severity === 'critical') {
      await this.flushEventBuffer();
    }

    // Auto-flush if buffer is full
    if (this.eventBuffer.length >= this.bufferSize) {
      await this.flushEventBuffer();
    }

    console.log(`[Security Audit] ${event.severity.toUpperCase()}: ${event.details.action}`, securityEvent);
  }

  /**
   * Log deletion operation events
   */
  async logDeletionOperation(
    operation: 'attempt' | 'success' | 'failure' | 'verification_start' | 'verification_complete',
    details: {
      studentId?: string;
      studentName?: string;
      operationType: 'single' | 'bulk' | 'cascade' | 'cleanup';
      userId?: string;
      userRole?: string;
      verificationSteps?: string[];
      failureReason?: string;
      impactScope?: string[];
      duration?: number;
      securityToken?: string;
    }
  ): Promise<void> {
    const eventType = operation === 'attempt' ? 'deletion_attempt' : 
                     operation.includes('verification') ? 'verification_attempt' : 'deletion_attempt';
    
    const severity = operation === 'failure' ? 'error' : 
                    details.operationType === 'cascade' ? 'warning' : 'info';

    await this.logSecurityEvent({
      eventType,
      severity,
      userId: details.userId,
      userRole: details.userRole,
      details: {
        action: `deletion_${operation}`,
        resource: 'student',
        studentId: details.studentId,
        operationType: details.operationType,
        securityToken: details.securityToken?.substring(0, 8), // Only log first 8 chars
        failureReason: details.failureReason,
        additionalData: {
          studentName: details.studentName,
          verificationSteps: details.verificationSteps,
          impactScope: details.impactScope,
          duration: details.duration
        }
      }
    });
  }

  /**
   * Log permission check events
   */
  async logPermissionCheck(
    result: 'granted' | 'denied',
    details: {
      userId?: string;
      userRole?: string;
      resource: string;
      requiredPermission: string;
      studentId?: string;
      denyReason?: string;
      permissionScope?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'permission_check',
      severity: result === 'denied' ? 'warning' : 'info',
      userId: details.userId,
      userRole: details.userRole,
      details: {
        action: `permission_${result}`,
        resource: details.resource,
        studentId: details.studentId,
        permissionLevel: details.requiredPermission,
        failureReason: details.denyReason,
        additionalData: {
          permissionScope: details.permissionScope
        }
      }
    });
  }

  /**
   * Log verification attempts
   */
  async logVerificationAttempt(
    step: string,
    result: 'success' | 'failure' | 'timeout',
    details: {
      userId?: string;
      operationType?: 'single' | 'bulk' | 'cascade' | 'cleanup';
      studentId?: string;
      verificationMethod: 'password' | 'type_confirmation' | 'biometric' | 'impact_acknowledgment';
      duration?: number;
      failureReason?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'verification_attempt',
      severity: result === 'failure' ? 'warning' : 'info',
      userId: details.userId,
      details: {
        action: `verification_${result}`,
        resource: 'deletion_verification',
        studentId: details.studentId,
        operationType: details.operationType,
        verificationStep: step,
        failureReason: details.failureReason,
        additionalData: {
          verificationMethod: details.verificationMethod,
          duration: details.duration
        }
      }
    });
  }

  /**
   * Log rate limiting events
   */
  async logRateLimitHit(
    limitType: 'single' | 'bulk' | 'cleanup',
    details: {
      userId?: string;
      userRole?: string;
      currentCount: number;
      maxAllowed: number;
      resetTime: Date;
      studentId?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'rate_limit_hit',
      severity: 'warning',
      userId: details.userId,
      userRole: details.userRole,
      details: {
        action: 'rate_limit_exceeded',
        resource: 'deletion_operation',
        studentId: details.studentId,
        rateLimitType: limitType,
        additionalData: {
          currentCount: details.currentCount,
          maxAllowed: details.maxAllowed,
          resetTime: details.resetTime.toISOString()
        }
      }
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    pattern: string,
    details: {
      userId?: string;
      userRole?: string;
      activities: Array<{
        action: string;
        timestamp: Date;
        metadata?: any;
      }>;
      riskScore: number;
      autoAction?: 'warn' | 'lock' | 'logout';
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'suspicious_activity',
      severity: details.riskScore > 7 ? 'critical' : 'warning',
      userId: details.userId,
      userRole: details.userRole,
      details: {
        action: 'suspicious_pattern_detected',
        resource: 'user_behavior',
        failureReason: pattern,
        additionalData: {
          pattern,
          activities: details.activities,
          riskScore: details.riskScore,
          autoAction: details.autoAction
        }
      }
    });
  }

  /**
   * Log security violations
   */
  async logSecurityViolation(
    violationType: string,
    details: {
      userId?: string;
      userRole?: string;
      studentId?: string;
      attemptedAction: string;
      requiredPermission?: string;
      actualPermission?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      autoResponse?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'security_violation',
      severity: details.severity === 'low' ? 'warning' : 
                details.severity === 'medium' ? 'warning' : 'error',
      userId: details.userId,
      userRole: details.userRole,
      details: {
        action: 'security_violation',
        resource: 'system_security',
        studentId: details.studentId,
        failureReason: violationType,
        additionalData: {
          violationType,
          attemptedAction: details.attemptedAction,
          requiredPermission: details.requiredPermission,
          actualPermission: details.actualPermission,
          autoResponse: details.autoResponse
        }
      }
    });
  }

  // ==================== Analytics and Reporting ====================

  /**
   * Get security audit summary
   */
  async getSecuritySummary(
    startDate: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endDate: Date = new Date()
  ): Promise<SecurityAuditSummary> {
    try {
      // Query audit trail for security events
      const response = await this.auditService.queryAuditTrail({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        category: 'deletion_security',
        limit: 10000
      });

      const events = response.entries;
      
      // Calculate summary statistics
      const eventsByType = events.reduce((acc, entry) => {
        const eventType = entry.details?.eventType || 'unknown';
        acc[eventType] = (acc[eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const eventsBySeverity = events.reduce((acc, entry) => {
        const severity = entry.details?.severity || 'info';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Count specific security metrics
      const securityViolations = events.filter(e => 
        e.details?.eventType === 'security_violation'
      ).length;

      const failedPermissionChecks = events.filter(e => 
        e.details?.eventType === 'permission_check' && 
        e.details?.action?.includes('denied')
      ).length;

      const failedVerifications = events.filter(e => 
        e.details?.eventType === 'verification_attempt' && 
        e.details?.action?.includes('failure')
      ).length;

      const rateLimitHits = events.filter(e => 
        e.details?.eventType === 'rate_limit_hit'
      ).length;

      const suspiciousActivities = events.filter(e => 
        e.details?.eventType === 'suspicious_activity'
      ).length;

      // Calculate top users
      const userEvents = events.reduce((acc, entry) => {
        const userId = entry.userId;
        if (userId) {
          if (!acc[userId]) {
            acc[userId] = { eventCount: 0, violationCount: 0 };
          }
          acc[userId].eventCount++;
          if (entry.details?.eventType === 'security_violation' || 
              entry.details?.action?.includes('denied') ||
              entry.details?.action?.includes('failure')) {
            acc[userId].violationCount++;
          }
        }
        return acc;
      }, {} as Record<string, { eventCount: number; violationCount: number }>);

      const topUsers = Object.entries(userEvents)
        .map(([userId, stats]) => ({
          userId,
          userName: userId, // Would need to fetch actual names
          eventCount: stats.eventCount,
          violationCount: stats.violationCount
        }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10);

      return {
        totalEvents: events.length,
        eventsByType,
        eventsBySeverity,
        securityViolations,
        failedPermissionChecks,
        failedVerifications,
        rateLimitHits,
        suspiciousActivities,
        topUsers,
        timeRange: { startDate, endDate }
      };

    } catch (error) {
      console.error('Failed to get security summary:', error);
      throw new Error(`Security summary generation failed: ${error.message}`);
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(
    startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: Date = new Date()
  ): Promise<SecurityMetrics> {
    try {
      const response = await this.auditService.queryAuditTrail({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        category: 'deletion_security',
        limit: 50000
      });

      const events = response.entries;
      
      // Deletion operation metrics
      const deletionEvents = events.filter(e => 
        e.details?.eventType === 'deletion_attempt'
      );

      const deletionOperations = {
        totalAttempts: deletionEvents.length,
        successful: deletionEvents.filter(e => 
          e.details?.action?.includes('success')
        ).length,
        failed: deletionEvents.filter(e => 
          e.details?.action?.includes('failure')
        ).length,
        byType: deletionEvents.reduce((acc, event) => {
          const type = event.details?.operationType as keyof typeof acc;
          if (type) {
            acc[type] = (acc[type] || 0) + 1;
          }
          return acc;
        }, { single: 0, bulk: 0, cascade: 0, cleanup: 0 }),
        byUser: deletionEvents.reduce((acc, event) => {
          const userId = event.userId;
          if (userId) {
            acc[userId] = (acc[userId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        averageVerificationTime: this.calculateAverageVerificationTime(events)
      };

      // Permission check metrics
      const permissionEvents = events.filter(e => 
        e.details?.eventType === 'permission_check'
      );

      const permissionChecks = {
        total: permissionEvents.length,
        granted: permissionEvents.filter(e => 
          e.details?.action?.includes('granted')
        ).length,
        denied: permissionEvents.filter(e => 
          e.details?.action?.includes('denied')
        ).length,
        denyReasons: permissionEvents
          .filter(e => e.details?.action?.includes('denied'))
          .reduce((acc, event) => {
            const reason = event.details?.failureReason || 'unknown';
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
      };

      // Rate limiting metrics
      const rateLimitEvents = events.filter(e => 
        e.details?.eventType === 'rate_limit_hit'
      );

      const rateLimiting = {
        totalHits: rateLimitEvents.length,
        byType: rateLimitEvents.reduce((acc, event) => {
          const type = event.details?.rateLimitType || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        userViolations: rateLimitEvents.reduce((acc, event) => {
          const userId = event.userId;
          if (userId) {
            acc[userId] = (acc[userId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      };

      // Security incident metrics
      const securityEvents = events.filter(e => 
        e.details?.eventType === 'security_violation' || 
        e.details?.eventType === 'suspicious_activity'
      );

      const securityIncidents = {
        total: securityEvents.length,
        resolved: securityEvents.filter(e => 
          e.details?.additionalData?.status === 'resolved'
        ).length,
        pending: securityEvents.filter(e => 
          !e.details?.additionalData?.status || 
          e.details?.additionalData?.status === 'pending'
        ).length,
        bySeverity: securityEvents.reduce((acc, event) => {
          const severity = event.details?.severity || 'info';
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return {
        deletionOperations,
        permissionChecks,
        rateLimiting,
        securityIncidents
      };

    } catch (error) {
      console.error('Failed to get security metrics:', error);
      throw new Error(`Security metrics generation failed: ${error.message}`);
    }
  }

  // ==================== Compliance and Export ====================

  /**
   * Export security audit data for compliance
   */
  async exportSecurityAudit(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' | 'excel' = 'json',
    options?: {
      includePersonalData?: boolean;
      maskSensitiveData?: boolean;
      filterBySeverity?: string[];
    }
  ): Promise<string> {
    try {
      const exportId = await this.auditService.exportAuditTrail(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          category: 'deletion_security'
        },
        format,
        {
          includeChanges: true,
          maxRecords: 100000
        }
      );

      return exportId;
    } catch (error) {
      console.error('Failed to export security audit:', error);
      throw new Error(`Security audit export failed: ${error.message}`);
    }
  }

  // ==================== Private Utility Methods ====================

  private setupEventBuffer(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flushEventBuffer();
      }
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushEventBuffer();
    });
  }

  private setupNetworkListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.eventBuffer.length > 0) {
        this.flushEventBuffer();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0 || !this.isOnline) {
      return;
    }

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // Convert security events to audit log entries
      const auditEntries = eventsToFlush.map(event => ({
        action: event.details.action,
        entityType: 'security_event',
        entityId: event.details.studentId || 'system',
        userId: event.userId,
        timestamp: event.timestamp.toISOString(),
        details: {
          eventType: event.eventType,
          severity: event.severity,
          ...event.details,
          userAgent: event.userAgent,
          ipAddress: event.ipAddress,
          deviceFingerprint: event.deviceFingerprint,
          location: event.location
        },
        category: 'deletion_security'
      }));

      // Send to audit service (this would be implemented in the actual service)
      console.log('Flushing security audit events:', auditEntries);
      
    } catch (error) {
      console.error('Failed to flush security events:', error);
      // Re-add events to buffer for retry
      this.eventBuffer.unshift(...eventsToFlush);
    }
  }

  private async getClientIP(): Promise<string> {
    // In a real implementation, this would get the client IP from the server
    return 'client-side';
  }

  private generateDeviceFingerprint(): string {
    // Simple device fingerprint based on available browser properties
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 10, 10);
    const canvasFingerprint = canvas.toDataURL();

    const fingerprint = btoa(
      navigator.userAgent +
      navigator.language +
      screen.width + 'x' + screen.height +
      new Date().getTimezoneOffset() +
      canvasFingerprint.substring(0, 100)
    );

    return fingerprint.substring(0, 32);
  }

  private calculateAverageVerificationTime(events: AuditLogEntry[]): number {
    const verificationEvents = events.filter(e => 
      e.details?.eventType === 'verification_attempt' &&
      e.details?.duration
    );

    if (verificationEvents.length === 0) return 0;

    const totalTime = verificationEvents.reduce((sum, event) => 
      sum + (event.details?.duration || 0), 0
    );

    return totalTime / verificationEvents.length;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushEventBuffer();
  }
}

// Singleton instance
export const securityAuditService = new SecurityAuditService();

// Export types
export type { SecurityAuditEvent, SecurityAuditSummary, SecurityMetrics };

export default securityAuditService;