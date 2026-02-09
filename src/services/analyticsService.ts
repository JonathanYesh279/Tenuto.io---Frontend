/**
 * Analytics service for tracking cascade deletion operations and user behavior
 * Integrates with Google Analytics, custom metrics, and performance monitoring
 */

interface CascadeDeletionMetrics {
  operationType: 'preview' | 'execute' | 'rollback' | 'cancel'
  entityType: 'student' | 'teacher' | 'orchestra' | 'rehearsal'
  entityCount: number
  affectedEntities: number
  duration: number
  memoryUsage?: number
  errorOccurred: boolean
  errorType?: string
  userRole: string
  batchSize?: number
}

interface UserBehaviorMetrics {
  action: 'deletion_preview_view' | 'deletion_preview_abandon' | 'deletion_execute' | 'deletion_confirm'
  entityType: string
  timeSpent: number
  clickPattern: string[]
  scrollDepth: number
  hesitationTime: number // Time between preview and action
}

interface PerformanceMetrics {
  componentName: string
  renderTime: number
  memoryBefore: number
  memoryAfter: number
  networkRequests: number
  errorBoundaryTriggers: number
}

class CascadeDeletionAnalytics {
  private isEnabled: boolean
  private debugMode: boolean
  private sessionId: string
  private userId?: string
  private userRole?: string

  constructor() {
    this.isEnabled = import.meta.env.VITE_ANALYTICS_ENABLED === 'true'
    this.debugMode = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true'
    this.sessionId = this.generateSessionId()
    
    if (this.debugMode) {
      console.log('📊 Cascade Deletion Analytics initialized', { 
        enabled: this.isEnabled, 
        sessionId: this.sessionId 
      })
    }
  }

  setUser(userId: string, role: string) {
    this.userId = userId
    this.userRole = role
    
    if (this.debugMode) {
      console.log('👤 Analytics user set:', { userId, role })
    }
  }

  trackDeletionOperation(metrics: CascadeDeletionMetrics) {
    if (!this.isEnabled) return

    const event = {
      name: 'cascade_deletion_operation',
      parameters: {
        operation_type: metrics.operationType,
        entity_type: metrics.entityType,
        entity_count: metrics.entityCount,
        affected_entities: metrics.affectedEntities,
        duration_ms: metrics.duration,
        memory_usage_mb: metrics.memoryUsage ? Math.round(metrics.memoryUsage / 1024 / 1024) : null,
        error_occurred: metrics.errorOccurred,
        error_type: metrics.errorType,
        user_role: metrics.userRole,
        batch_size: metrics.batchSize,
        session_id: this.sessionId,
        timestamp: Date.now()
      }
    }

    this.sendEvent(event)

    // Log performance warning if operation took too long
    if (metrics.duration > 10000) { // 10 seconds
      console.warn('⚠️ Slow cascade deletion operation:', {
        type: metrics.operationType,
        duration: metrics.duration,
        entities: metrics.affectedEntities
      })
    }

    if (this.debugMode) {
      console.log('🗑️ Deletion operation tracked:', event)
    }
  }

  trackUserBehavior(metrics: UserBehaviorMetrics) {
    if (!this.isEnabled) return

    const event = {
      name: 'cascade_deletion_behavior',
      parameters: {
        action: metrics.action,
        entity_type: metrics.entityType,
        time_spent_ms: metrics.timeSpent,
        click_pattern: metrics.clickPattern.join('->'),
        scroll_depth_percent: metrics.scrollDepth,
        hesitation_time_ms: metrics.hesitationTime,
        session_id: this.sessionId,
        user_role: this.userRole,
        timestamp: Date.now()
      }
    }

    this.sendEvent(event)

    // Track abandonment patterns
    if (metrics.action === 'deletion_preview_abandon' && metrics.hesitationTime > 30000) {
      console.log('🤔 User hesitated before abandoning deletion:', {
        hesitation: metrics.hesitationTime,
        entityType: metrics.entityType
      })
    }

    if (this.debugMode) {
      console.log('👤 User behavior tracked:', event)
    }
  }

  trackPerformance(metrics: PerformanceMetrics) {
    if (!this.isEnabled) return

    const event = {
      name: 'cascade_deletion_performance',
      parameters: {
        component_name: metrics.componentName,
        render_time_ms: metrics.renderTime,
        memory_delta_mb: Math.round((metrics.memoryAfter - metrics.memoryBefore) / 1024 / 1024),
        network_requests: metrics.networkRequests,
        error_boundary_triggers: metrics.errorBoundaryTriggers,
        session_id: this.sessionId,
        timestamp: Date.now()
      }
    }

    this.sendEvent(event)

    if (this.debugMode) {
      console.log('⚡ Performance tracked:', event)
    }
  }

  // Track admin dashboard usage patterns
  trackAdminDashboardUsage(dashboardSection: string, actionTaken: string, timeSpent: number) {
    if (!this.isEnabled || this.userRole !== 'admin') return

    const event = {
      name: 'admin_deletion_dashboard_usage',
      parameters: {
        dashboard_section: dashboardSection,
        action_taken: actionTaken,
        time_spent_ms: timeSpent,
        session_id: this.sessionId,
        timestamp: Date.now()
      }
    }

    this.sendEvent(event)
  }

  // Track error patterns for debugging
  trackError(error: Error, context: string, additionalData?: any) {
    if (!this.isEnabled) return

    const event = {
      name: 'cascade_deletion_error',
      parameters: {
        error_message: error.message,
        error_stack: error.stack?.substring(0, 500), // Limit stack trace length
        context,
        additional_data: JSON.stringify(additionalData).substring(0, 1000),
        session_id: this.sessionId,
        user_role: this.userRole,
        timestamp: Date.now()
      }
    }

    this.sendEvent(event)

    if (this.debugMode) {
      console.error('❌ Error tracked:', { error, context, additionalData })
    }
  }

  // Track WebSocket connection health for real-time deletion updates
  trackWebSocketHealth(status: 'connected' | 'disconnected' | 'error', latency?: number) {
    if (!this.isEnabled) return

    const event = {
      name: 'cascade_deletion_websocket',
      parameters: {
        connection_status: status,
        latency_ms: latency,
        session_id: this.sessionId,
        timestamp: Date.now()
      }
    }

    this.sendEvent(event)
  }

  // Generate daily/weekly summary reports
  async generateSummaryReport(timeframe: 'daily' | 'weekly'): Promise<any> {
    if (!this.isEnabled) return null

    // This would typically fetch from your analytics backend
    // For now, return a mock structure
    return {
      timeframe,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalDeletions: 0,
        averageDeletionTime: 0,
        errorRate: 0,
        mostDeletedEntityType: 'student',
        peakUsageHours: [],
        userEngagement: {
          previewAbandonmentRate: 0,
          averageHesitationTime: 0
        }
      }
    }
  }

  private sendEvent(event: any) {
    try {
      // Send to Google Analytics if available
      if (typeof gtag !== 'undefined') {
        gtag('event', event.name, event.parameters)
      }

      // Send to custom analytics endpoint
      if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
        fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event)
        }).catch(error => {
          if (this.debugMode) {
            console.error('Failed to send analytics event:', error)
          }
        })
      }

      // Store locally for debugging or offline analysis
      if (this.debugMode) {
        const events = JSON.parse(localStorage.getItem('cascade_analytics_debug') || '[]')
        events.push(event)
        // Keep only last 100 events
        const recentEvents = events.slice(-100)
        localStorage.setItem('cascade_analytics_debug', JSON.stringify(recentEvents))
      }

    } catch (error) {
      if (this.debugMode) {
        console.error('Analytics error:', error)
      }
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Helper method to track component lifecycle
  createComponentTracker(componentName: string) {
    const startTime = performance.now()
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0

    return {
      onMount: () => {
        if (this.debugMode) {
          console.log(`🎭 ${componentName} mounted`)
        }
      },
      onUnmount: () => {
        const endTime = performance.now()
        const endMemory = (performance as any).memory?.usedJSHeapSize || 0
        
        this.trackPerformance({
          componentName,
          renderTime: endTime - startTime,
          memoryBefore: startMemory,
          memoryAfter: endMemory,
          networkRequests: 0, // Would need to be tracked separately
          errorBoundaryTriggers: 0
        })
      },
      trackAction: (action: string, data?: any) => {
        if (this.debugMode) {
          console.log(`🎯 ${componentName} action: ${action}`, data)
        }
      }
    }
  }
}

// Export singleton instance
export const cascadeDeletionAnalytics = new CascadeDeletionAnalytics()

// Export types for use in components
export type {
  CascadeDeletionMetrics,
  UserBehaviorMetrics,
  PerformanceMetrics
}

export default cascadeDeletionAnalytics