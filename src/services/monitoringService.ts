/**
 * Real-time monitoring service for cascade deletion operations
 * Provides health checks, alerts, and operational metrics
 */

interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  errorMessage?: string
  lastChecked: string
  metadata?: Record<string, any>
}

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  service: 'cascade-deletion' | 'websocket' | 'api' | 'frontend'
  message: string
  timestamp: string
  resolved: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
}

interface SystemMetrics {
  memoryUsage: number
  cpuUsage: number
  activeConnections: number
  deletionQueueLength: number
  errorRate: number
  averageResponseTime: number
  cacheHitRate: number
}

class CascadeDeletionMonitoring {
  private healthCheckInterval?: NodeJS.Timeout
  private metricsInterval?: NodeJS.Timeout
  private alerts: Alert[] = []
  private metrics: SystemMetrics = {
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
    deletionQueueLength: 0,
    errorRate: 0,
    averageResponseTime: 0,
    cacheHitRate: 0
  }
  private isMonitoring = false

  constructor(private config: {
    healthCheckIntervalMs: number
    metricsIntervalMs: number
    alertThresholds: {
      memoryUsage: number
      errorRate: number
      responseTime: number
    }
  }) {}

  async startMonitoring() {
    if (this.isMonitoring) return

    console.log('🔍 Starting cascade deletion monitoring...')
    this.isMonitoring = true

    // Start health check monitoring
    this.healthCheckInterval = setInterval(
      () => this.performHealthChecks(),
      this.config.healthCheckIntervalMs
    )

    // Start metrics collection
    this.metricsInterval = setInterval(
      () => this.collectMetrics(),
      this.config.metricsIntervalMs
    )

    // Initial health check
    await this.performHealthChecks()
  }

  stopMonitoring() {
    if (!this.isMonitoring) return

    console.log('⏹️ Stopping cascade deletion monitoring...')
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }

    this.isMonitoring = false
  }

  async performHealthChecks(): Promise<HealthCheck[]> {
    const healthChecks: HealthCheck[] = []

    // Check cascade deletion API endpoint
    healthChecks.push(await this.checkCascadeDeletionAPI())
    
    // Check WebSocket connection
    healthChecks.push(await this.checkWebSocketConnection())
    
    // Check frontend memory usage
    healthChecks.push(this.checkFrontendHealth())
    
    // Check data integrity service
    healthChecks.push(await this.checkDataIntegrityService())

    // Process health check results
    this.processHealthChecks(healthChecks)
    
    return healthChecks
  }

  private async checkCascadeDeletionAPI(): Promise<HealthCheck> {
    const startTime = performance.now()
    
    try {
      const response = await fetch('/api/health/cascade-deletion', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        timeout: 5000
      })

      const responseTime = performance.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        return {
          service: 'cascade-deletion-api',
          status: 'healthy',
          responseTime,
          lastChecked: new Date().toISOString(),
          metadata: data
        }
      } else {
        return {
          service: 'cascade-deletion-api',
          status: 'unhealthy',
          responseTime,
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
          lastChecked: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        service: 'cascade-deletion-api',
        status: 'unhealthy',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      }
    }
  }

  private async checkWebSocketConnection(): Promise<HealthCheck> {
    // This would integrate with your WebSocket service
    // For now, return a mock health check
    
    try {
      // Check if WebSocket connection exists and is active
      const wsHealthy = window.cascadeWebSocket?.readyState === WebSocket.OPEN
      
      return {
        service: 'websocket-connection',
        status: wsHealthy ? 'healthy' : 'degraded',
        lastChecked: new Date().toISOString(),
        metadata: {
          readyState: window.cascadeWebSocket?.readyState,
          url: window.cascadeWebSocket?.url
        }
      }
    } catch (error) {
      return {
        service: 'websocket-connection',
        status: 'unhealthy',
        errorMessage: error instanceof Error ? error.message : 'WebSocket check failed',
        lastChecked: new Date().toISOString()
      }
    }
  }

  private checkFrontendHealth(): HealthCheck {
    const memory = (performance as any).memory
    
    if (!memory) {
      return {
        service: 'frontend-health',
        status: 'degraded',
        errorMessage: 'Memory API not available',
        lastChecked: new Date().toISOString()
      }
    }

    const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
    const status = memoryUsage > 0.9 ? 'unhealthy' : memoryUsage > 0.7 ? 'degraded' : 'healthy'

    return {
      service: 'frontend-health',
      status,
      lastChecked: new Date().toISOString(),
      metadata: {
        memoryUsagePercent: Math.round(memoryUsage * 100),
        usedJSHeapSize: memory.usedJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize
      }
    }
  }

  private async checkDataIntegrityService(): Promise<HealthCheck> {
    try {
      // This would call your data integrity check endpoint
      const response = await fetch('/api/health/data-integrity', {
        method: 'GET',
        timeout: 3000
      })

      if (response.ok) {
        const data = await response.json()
        return {
          service: 'data-integrity',
          status: data.integrityViolations === 0 ? 'healthy' : 'degraded',
          lastChecked: new Date().toISOString(),
          metadata: data
        }
      } else {
        return {
          service: 'data-integrity',
          status: 'unhealthy',
          errorMessage: `HTTP ${response.status}`,
          lastChecked: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        service: 'data-integrity',
        status: 'unhealthy',
        errorMessage: error instanceof Error ? error.message : 'Integrity check failed',
        lastChecked: new Date().toISOString()
      }
    }
  }

  private processHealthChecks(healthChecks: HealthCheck[]) {
    for (const check of healthChecks) {
      // Generate alerts for unhealthy services
      if (check.status === 'unhealthy') {
        this.createAlert({
          type: 'error',
          service: 'cascade-deletion',
          message: `Service ${check.service} is unhealthy: ${check.errorMessage}`,
          severity: 'high'
        })
      } else if (check.status === 'degraded') {
        this.createAlert({
          type: 'warning',
          service: 'cascade-deletion',
          message: `Service ${check.service} is degraded`,
          severity: 'medium'
        })
      }
    }
  }

  private async collectMetrics() {
    try {
      // Collect frontend metrics
      const memory = (performance as any).memory
      if (memory) {
        this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
      }

      // Collect cascade deletion specific metrics
      this.metrics.deletionQueueLength = await this.getDeletionQueueLength()
      this.metrics.errorRate = await this.getErrorRate()
      this.metrics.averageResponseTime = await this.getAverageResponseTime()
      
      // Check thresholds and create alerts
      this.checkMetricThresholds()
      
    } catch (error) {
      console.error('Error collecting metrics:', error)
    }
  }

  private async getDeletionQueueLength(): Promise<number> {
    try {
      const response = await fetch('/api/metrics/deletion-queue-length')
      if (response.ok) {
        const data = await response.json()
        return data.queueLength || 0
      }
    } catch (error) {
      console.warn('Could not fetch deletion queue length')
    }
    return 0
  }

  private async getErrorRate(): Promise<number> {
    try {
      const response = await fetch('/api/metrics/error-rate')
      if (response.ok) {
        const data = await response.json()
        return data.errorRate || 0
      }
    } catch (error) {
      console.warn('Could not fetch error rate')
    }
    return 0
  }

  private async getAverageResponseTime(): Promise<number> {
    try {
      const response = await fetch('/api/metrics/response-time')
      if (response.ok) {
        const data = await response.json()
        return data.averageResponseTime || 0
      }
    } catch (error) {
      console.warn('Could not fetch response time')
    }
    return 0
  }

  private checkMetricThresholds() {
    const { alertThresholds } = this.config

    if (this.metrics.memoryUsage > alertThresholds.memoryUsage) {
      this.createAlert({
        type: 'warning',
        service: 'frontend',
        message: `High memory usage: ${Math.round(this.metrics.memoryUsage * 100)}%`,
        severity: 'medium'
      })
    }

    if (this.metrics.errorRate > alertThresholds.errorRate) {
      this.createAlert({
        type: 'error',
        service: 'cascade-deletion',
        message: `High error rate: ${Math.round(this.metrics.errorRate * 100)}%`,
        severity: 'high'
      })
    }

    if (this.metrics.averageResponseTime > alertThresholds.responseTime) {
      this.createAlert({
        type: 'warning',
        service: 'api',
        message: `Slow response time: ${this.metrics.averageResponseTime}ms`,
        severity: 'medium'
      })
    }
  }

  createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>) {
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false
    }

    this.alerts.push(newAlert)

    // Send alert to monitoring systems
    this.sendAlert(newAlert)

    // Log to console in development
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      const emoji = alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'
      console.log(`${emoji} Alert created:`, newAlert)
    }
  }

  private async sendAlert(alert: Alert) {
    try {
      // Send to Sentry if configured
      if (window.Sentry) {
        window.Sentry.captureMessage(alert.message, alert.severity as any)
      }

      // Send to Slack webhook if configured
      const slackWebhook = import.meta.env.VITE_SLACK_WEBHOOK_URL
      if (slackWebhook) {
        await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Cascade Deletion Alert`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*${alert.type.toUpperCase()}*: ${alert.message}\n*Service*: ${alert.service}\n*Severity*: ${alert.severity}\n*Time*: ${alert.timestamp}`
                }
              }
            ]
          })
        })
      }

      // Send to custom monitoring endpoint
      const monitoringEndpoint = import.meta.env.VITE_MONITORING_ENDPOINT
      if (monitoringEndpoint) {
        await fetch(monitoringEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
      }

    } catch (error) {
      console.error('Failed to send alert:', error)
    }
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      console.log('✅ Alert resolved:', alertId)
    }
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  getMetrics(): SystemMetrics {
    return { ...this.metrics }
  }

  // Export monitoring data for external analysis
  exportMonitoringData() {
    return {
      alerts: this.alerts,
      metrics: this.metrics,
      exportedAt: new Date().toISOString()
    }
  }
}

// Create default monitoring service instance
export const cascadeDeletionMonitoring = new CascadeDeletionMonitoring({
  healthCheckIntervalMs: 30000, // 30 seconds
  metricsIntervalMs: 10000, // 10 seconds
  alertThresholds: {
    memoryUsage: 0.85, // 85%
    errorRate: 0.05, // 5%
    responseTime: 5000 // 5 seconds
  }
})

export type { HealthCheck, Alert, SystemMetrics }
export default cascadeDeletionMonitoring