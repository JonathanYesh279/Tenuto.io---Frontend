/**
 * Health check service for cascade deletion system
 * Provides comprehensive system health monitoring and status endpoints
 */

interface HealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance'
  timestamp: string
  responseTime?: number
  version?: string
  details?: {
    [key: string]: any
  }
  dependencies?: HealthStatus[]
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance'
  services: HealthStatus[]
  metadata: {
    environment: string
    version: string
    uptime: number
    timestamp: string
    buildInfo?: {
      version: string
      commitHash: string
      buildDate: string
    }
  }
}

interface HealthThresholds {
  responseTimeWarning: number // ms
  responseTimeCritical: number // ms
  memoryWarning: number // percentage
  memoryCritical: number // percentage
  errorRateWarning: number // percentage
  errorRateCritical: number // percentage
}

class CascadeDeletionHealthCheck {
  private startTime = Date.now()
  private healthCache = new Map<string, { status: HealthStatus; expiry: number }>()
  private readonly CACHE_DURATION = 30000 // 30 seconds
  
  private readonly thresholds: HealthThresholds = {
    responseTimeWarning: 2000, // 2 seconds
    responseTimeCritical: 5000, // 5 seconds
    memoryWarning: 70, // 70%
    memoryCritical: 85, // 85%
    errorRateWarning: 5, // 5%
    errorRateCritical: 10 // 10%
  }

  constructor() {
    this.setupPeriodicHealthChecks()
  }

  // Main health check endpoint
  async getSystemHealth(): Promise<SystemHealth> {
    const services = await Promise.all([
      this.checkFrontendHealth(),
      this.checkBackendAPI(),
      this.checkWebSocketConnection(),
      this.checkDatabaseConnection(),
      this.checkCascadeDeletionService(),
      this.checkDataIntegrityService(),
      this.checkPerformanceMetrics(),
      this.checkSecurityServices(),
      this.checkMonitoringServices(),
      this.checkExternalDependencies()
    ])

    const overall = this.determineOverallHealth(services)
    
    return {
      overall,
      services,
      metadata: {
        environment: import.meta.env.MODE,
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        uptime: Date.now() - this.startTime,
        timestamp: new Date().toISOString(),
        buildInfo: this.getBuildInfo()
      }
    }
  }

  // Individual service health checks
  private async checkFrontendHealth(): Promise<HealthStatus> {
    const cached = this.getCachedHealth('frontend')
    if (cached) return cached

    const startTime = performance.now()
    
    try {
      const memory = (performance as any).memory
      const memoryUsage = memory ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0
      
      // Check if cascade deletion components are loaded
      const cascadeComponentsLoaded = document.querySelector('[data-component*="cascade"]') !== null
      
      // Check feature flags
      const featureFlagsWorking = window.featureFlagService?.isEnabled('cascade_deletion_preview') !== undefined
      
      // Check local storage health
      let localStorageWorking = false
      try {
        localStorage.setItem('health_check', 'test')
        localStorage.removeItem('health_check')
        localStorageWorking = true
      } catch (e) {
        // localStorage not working
      }

      const responseTime = performance.now() - startTime
      
      let status: HealthStatus['status'] = 'healthy'
      if (memoryUsage > this.thresholds.memoryCritical || !localStorageWorking) {
        status = 'unhealthy'
      } else if (memoryUsage > this.thresholds.memoryWarning || !cascadeComponentsLoaded || !featureFlagsWorking) {
        status = 'degraded'
      }

      const healthStatus: HealthStatus = {
        service: 'frontend',
        status,
        timestamp: new Date().toISOString(),
        responseTime,
        version: import.meta.env.VITE_APP_VERSION,
        details: {
          memoryUsage: Math.round(memoryUsage),
          cascadeComponentsLoaded,
          featureFlagsWorking,
          localStorageWorking,
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`
        }
      }

      this.setCachedHealth('frontend', healthStatus)
      return healthStatus

    } catch (error) {
      return {
        service: 'frontend',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  private async checkBackendAPI(): Promise<HealthStatus> {
    const cached = this.getCachedHealth('backend-api')
    if (cached) return cached

    const startTime = performance.now()
    
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      })

      const responseTime = performance.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        
        let status: HealthStatus['status'] = 'healthy'
        if (responseTime > this.thresholds.responseTimeCritical) {
          status = 'unhealthy'
        } else if (responseTime > this.thresholds.responseTimeWarning) {
          status = 'degraded'
        }

        const healthStatus: HealthStatus = {
          service: 'backend-api',
          status,
          timestamp: new Date().toISOString(),
          responseTime,
          details: {
            ...data,
            httpStatus: response.status
          }
        }

        this.setCachedHealth('backend-api', healthStatus)
        return healthStatus

      } else {
        return {
          service: 'backend-api',
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          responseTime,
          details: {
            httpStatus: response.status,
            statusText: response.statusText
          }
        }
      }
    } catch (error) {
      return {
        service: 'backend-api',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Network error' }
      }
    }
  }

  private async checkWebSocketConnection(): Promise<HealthStatus> {
    const cached = this.getCachedHealth('websocket')
    if (cached) return cached

    try {
      const wsConnection = (window as any).cascadeWebSocket
      
      if (!wsConnection) {
        return {
          service: 'websocket',
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          details: { error: 'WebSocket connection not found' }
        }
      }

      let status: HealthStatus['status']
      let details: any = {
        readyState: wsConnection.readyState,
        url: wsConnection.url
      }

      switch (wsConnection.readyState) {
        case WebSocket.CONNECTING:
          status = 'degraded'
          details.statusText = 'Connecting'
          break
        case WebSocket.OPEN:
          status = 'healthy'
          details.statusText = 'Connected'
          break
        case WebSocket.CLOSING:
          status = 'degraded'
          details.statusText = 'Closing'
          break
        case WebSocket.CLOSED:
          status = 'unhealthy'
          details.statusText = 'Closed'
          break
        default:
          status = 'unhealthy'
          details.statusText = 'Unknown state'
      }

      const healthStatus: HealthStatus = {
        service: 'websocket',
        status,
        timestamp: new Date().toISOString(),
        details
      }

      this.setCachedHealth('websocket', healthStatus)
      return healthStatus

    } catch (error) {
      return {
        service: 'websocket',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'WebSocket check failed' }
      }
    }
  }

  private async checkDatabaseConnection(): Promise<HealthStatus> {
    const cached = this.getCachedHealth('database')
    if (cached) return cached

    const startTime = performance.now()
    
    try {
      const response = await fetch('/api/health/database', {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      })

      const responseTime = performance.now() - startTime

      if (response.ok) {
        const data = await response.json()
        
        let status: HealthStatus['status'] = 'healthy'
        if (responseTime > 5000 || data.connections?.active > data.connections?.max * 0.9) {
          status = 'degraded'
        }

        const healthStatus: HealthStatus = {
          service: 'database',
          status,
          timestamp: new Date().toISOString(),
          responseTime,
          details: data
        }

        this.setCachedHealth('database', healthStatus)
        return healthStatus

      } else {
        return {
          service: 'database',
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          details: { error: `HTTP ${response.status}` }
        }
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Database check failed' }
      }
    }
  }

  private async checkCascadeDeletionService(): Promise<HealthStatus> {
    const cached = this.getCachedHealth('cascade-deletion')
    if (cached) return cached

    const startTime = performance.now()
    
    try {
      const response = await fetch('/api/health/cascade-deletion', {
        method: 'GET',
        signal: AbortSignal.timeout(8000)
      })

      const responseTime = performance.now() - startTime

      if (response.ok) {
        const data = await response.json()
        
        let status: HealthStatus['status'] = 'healthy'
        
        // Check various cascade deletion health indicators
        if (data.pendingOperations > 50 || data.errorRate > this.thresholds.errorRateCritical) {
          status = 'unhealthy'
        } else if (data.pendingOperations > 20 || data.errorRate > this.thresholds.errorRateWarning || responseTime > this.thresholds.responseTimeWarning) {
          status = 'degraded'
        }

        const healthStatus: HealthStatus = {
          service: 'cascade-deletion',
          status,
          timestamp: new Date().toISOString(),
          responseTime,
          details: {
            ...data,
            featureFlags: {
              previewEnabled: window.featureFlagService?.isEnabled('cascade_deletion_preview'),
              executeEnabled: window.featureFlagService?.isEnabled('cascade_deletion_execute'),
              bulkEnabled: window.featureFlagService?.isEnabled('bulk_deletion_enabled')
            }
          }
        }

        this.setCachedHealth('cascade-deletion', healthStatus)
        return healthStatus

      } else {
        return {
          service: 'cascade-deletion',
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          details: { error: `HTTP ${response.status}` }
        }
      }
    } catch (error) {
      return {
        service: 'cascade-deletion',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Cascade deletion service check failed' }
      }
    }
  }

  private async checkDataIntegrityService(): Promise<HealthStatus> {
    try {
      const response = await fetch('/api/health/data-integrity', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const data = await response.json()
        
        let status: HealthStatus['status'] = 'healthy'
        if (data.violations > 0) {
          status = data.violations > 5 ? 'unhealthy' : 'degraded'
        }

        return {
          service: 'data-integrity',
          status,
          timestamp: new Date().toISOString(),
          details: data
        }
      } else {
        return {
          service: 'data-integrity',
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          details: { error: `HTTP ${response.status}` }
        }
      }
    } catch (error) {
      return {
        service: 'data-integrity',
        status: 'degraded',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Data integrity check failed' }
      }
    }
  }

  private checkPerformanceMetrics(): Promise<HealthStatus> {
    try {
      const memory = (performance as any).memory
      const timing = performance.timing
      
      const memoryUsage = memory ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0
      const loadTime = timing ? timing.loadEventEnd - timing.navigationStart : 0
      
      // Check recent error rates
      const errorTracking = (window as any).cascadeDeletionErrorTracking
      const recentErrors = errorTracking?.getRecentErrors(10) || []
      const errorRate = recentErrors.length / 10 * 100
      
      let status: HealthStatus['status'] = 'healthy'
      if (memoryUsage > this.thresholds.memoryCritical || errorRate > this.thresholds.errorRateCritical) {
        status = 'unhealthy'
      } else if (memoryUsage > this.thresholds.memoryWarning || errorRate > this.thresholds.errorRateWarning) {
        status = 'degraded'
      }

      return Promise.resolve({
        service: 'performance-metrics',
        status,
        timestamp: new Date().toISOString(),
        details: {
          memoryUsage: Math.round(memoryUsage),
          loadTime,
          errorRate,
          recentErrorCount: recentErrors.length,
          performanceObserver: 'PerformanceObserver' in window
        }
      })
    } catch (error) {
      return Promise.resolve({
        service: 'performance-metrics',
        status: 'degraded',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Performance check failed' }
      })
    }
  }

  private checkSecurityServices(): Promise<HealthStatus> {
    try {
      const securityService = (window as any).cascadeDeletionSecurity
      
      let status: HealthStatus['status'] = 'healthy'
      let details: any = {}
      
      if (securityService) {
        const violations = securityService.getSecurityViolations()
        const blockedIPs = securityService.getBlockedIPs()
        
        details = {
          securityViolations: violations.length,
          blockedIPs: blockedIPs.length,
          recentViolations: violations.filter((v: any) => Date.now() - v.context.timestamp < 300000).length
        }
        
        if (details.recentViolations > 10 || details.blockedIPs > 5) {
          status = 'degraded'
        }
      } else {
        status = 'degraded'
        details.error = 'Security service not initialized'
      }

      return Promise.resolve({
        service: 'security',
        status,
        timestamp: new Date().toISOString(),
        details
      })
    } catch (error) {
      return Promise.resolve({
        service: 'security',
        status: 'degraded',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Security check failed' }
      })
    }
  }

  private checkMonitoringServices(): Promise<HealthStatus> {
    try {
      const monitoringService = (window as any).cascadeDeletionMonitoring
      const analyticsService = (window as any).cascadeDeletionAnalytics
      
      let status: HealthStatus['status'] = 'healthy'
      const details: any = {
        monitoringInitialized: !!monitoringService,
        analyticsInitialized: !!analyticsService
      }
      
      if (monitoringService) {
        const activeAlerts = monitoringService.getActiveAlerts()
        details.activeAlerts = activeAlerts.length
        details.criticalAlerts = activeAlerts.filter((a: any) => a.severity === 'critical').length
        
        if (details.criticalAlerts > 0) {
          status = 'unhealthy'
        } else if (details.activeAlerts > 5) {
          status = 'degraded'
        }
      }
      
      if (!details.monitoringInitialized || !details.analyticsInitialized) {
        status = status === 'healthy' ? 'degraded' : status
      }

      return Promise.resolve({
        service: 'monitoring',
        status,
        timestamp: new Date().toISOString(),
        details
      })
    } catch (error) {
      return Promise.resolve({
        service: 'monitoring',
        status: 'degraded',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Monitoring check failed' }
      })
    }
  }

  private async checkExternalDependencies(): Promise<HealthStatus> {
    const dependencies: HealthStatus[] = []
    
    // Check Sentry
    if (import.meta.env.VITE_SENTRY_DSN) {
      try {
        // Simple check - Sentry should be available if configured
        const sentryWorking = !!(window as any).Sentry
        dependencies.push({
          service: 'sentry',
          status: sentryWorking ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          details: { initialized: sentryWorking }
        })
      } catch (error) {
        dependencies.push({
          service: 'sentry',
          status: 'degraded',
          timestamp: new Date().toISOString(),
          details: { error: 'Sentry check failed' }
        })
      }
    }
    
    // Check CDN availability (if configured)
    if (import.meta.env.VITE_CDN_URL) {
      try {
        const response = await fetch(`${import.meta.env.VITE_CDN_URL}/health`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        })
        dependencies.push({
          service: 'cdn',
          status: response.ok ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          details: { httpStatus: response.status }
        })
      } catch (error) {
        dependencies.push({
          service: 'cdn',
          status: 'degraded',
          timestamp: new Date().toISOString(),
          details: { error: 'CDN check failed' }
        })
      }
    }

    const overallStatus = dependencies.some(d => d.status === 'unhealthy') ? 'unhealthy' :
                         dependencies.some(d => d.status === 'degraded') ? 'degraded' : 'healthy'

    return {
      service: 'external-dependencies',
      status: overallStatus,
      timestamp: new Date().toISOString(),
      dependencies
    }
  }

  private determineOverallHealth(services: HealthStatus[]): SystemHealth['overall'] {
    const criticalServices = ['backend-api', 'cascade-deletion', 'database']
    const criticalStatuses = services
      .filter(s => criticalServices.includes(s.service))
      .map(s => s.status)

    if (criticalStatuses.includes('unhealthy')) {
      return 'unhealthy'
    }
    
    if (services.some(s => s.status === 'maintenance')) {
      return 'maintenance'
    }
    
    if (criticalStatuses.includes('degraded') || 
        services.filter(s => s.status === 'degraded').length > 2) {
      return 'degraded'
    }
    
    return 'healthy'
  }

  private getBuildInfo() {
    try {
      return {
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        commitHash: import.meta.env.VITE_COMMIT_HASH || 'unknown',
        buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString()
      }
    } catch (error) {
      return {
        version: '1.0.0',
        commitHash: 'unknown',
        buildDate: 'unknown'
      }
    }
  }

  private getCachedHealth(service: string): HealthStatus | null {
    const cached = this.healthCache.get(service)
    if (cached && Date.now() < cached.expiry) {
      return cached.status
    }
    return null
  }

  private setCachedHealth(service: string, status: HealthStatus) {
    this.healthCache.set(service, {
      status,
      expiry: Date.now() + this.CACHE_DURATION
    })
  }

  private setupPeriodicHealthChecks() {
    // Perform background health checks every 5 minutes
    setInterval(async () => {
      try {
        await this.getSystemHealth()
      } catch (error) {
        console.warn('Background health check failed:', error)
      }
    }, 300000)
  }

  // Lightweight ping endpoint for load balancer health checks
  ping(): { status: 'ok'; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  }

  // Ready endpoint for Kubernetes readiness probes
  async ready(): Promise<{ status: 'ready' | 'not_ready'; details: any }> {
    try {
      const systemHealth = await this.getSystemHealth()
      const criticalServices = systemHealth.services.filter(s => 
        ['backend-api', 'cascade-deletion'].includes(s.service)
      )
      
      const isReady = criticalServices.every(s => s.status !== 'unhealthy')
      
      return {
        status: isReady ? 'ready' : 'not_ready',
        details: {
          overall: systemHealth.overall,
          criticalServices: criticalServices.map(s => ({ service: s.service, status: s.status }))
        }
      }
    } catch (error) {
      return {
        status: 'not_ready',
        details: { error: error instanceof Error ? error.message : 'Ready check failed' }
      }
    }
  }

  // Live endpoint for Kubernetes liveness probes
  live(): { status: 'live'; uptime: number; timestamp: string } {
    return {
      status: 'live',
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString()
    }
  }
}

// Create singleton instance
export const cascadeDeletionHealthCheck = new CascadeDeletionHealthCheck()

// Expose health check endpoints on window for easy access
if (typeof window !== 'undefined') {
  (window as any).healthCheck = {
    system: () => cascadeDeletionHealthCheck.getSystemHealth(),
    ping: () => cascadeDeletionHealthCheck.ping(),
    ready: () => cascadeDeletionHealthCheck.ready(),
    live: () => cascadeDeletionHealthCheck.live()
  }
}

export type { HealthStatus, SystemHealth, HealthThresholds }
export default cascadeDeletionHealthCheck