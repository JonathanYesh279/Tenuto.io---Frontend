/**
 * Performance Monitoring Hook
 * 
 * Comprehensive performance monitoring for cascade deletion operations
 * including render tracking, memory monitoring, and performance metrics
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { getMemoryManager, MemoryStats } from '@/utils/memoryManager'

interface PerformanceMetrics {
  // Rendering performance
  renderCount: number
  lastRenderTime: number
  averageRenderTime: number
  slowRenders: number
  
  // Memory metrics
  currentMemoryUsage: number
  peakMemoryUsage: number
  memoryTrend: 'increasing' | 'decreasing' | 'stable'
  gcCount: number
  
  // Operation metrics
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageOperationTime: number
  
  // UI responsiveness
  framerate: number
  jankCount: number
  longTasks: number
  
  // Network metrics
  apiCalls: number
  cacheHits: number
  cacheMisses: number
  averageResponseTime: number
}

interface PerformanceAlert {
  id: string
  type: 'memory' | 'render' | 'operation' | 'network'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  metrics: Partial<PerformanceMetrics>
}

interface RenderTimingEntry {
  timestamp: number
  duration: number
  componentName?: string
}

interface OperationTimingEntry {
  operationId: string
  type: string
  startTime: number
  endTime: number
  success: boolean
  error?: string
}

interface NetworkTimingEntry {
  url: string
  method: string
  startTime: number
  endTime: number
  cached: boolean
  status: number
}

// Performance monitoring class
class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    slowRenders: 0,
    currentMemoryUsage: 0,
    peakMemoryUsage: 0,
    memoryTrend: 'stable',
    gcCount: 0,
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageOperationTime: 0,
    framerate: 0,
    jankCount: 0,
    longTasks: 0,
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0
  }

  private renderTimings: RenderTimingEntry[] = []
  private operationTimings: OperationTimingEntry[] = []
  private networkTimings: NetworkTimingEntry[] = []
  private alerts: PerformanceAlert[] = []
  private listeners: Array<(metrics: PerformanceMetrics) => void> = []
  private alertListeners: Array<(alert: PerformanceAlert) => void> = []

  private performanceObserver?: PerformanceObserver
  private animationFrameId?: number
  private lastFrameTime = 0
  private frameCount = 0

  constructor() {
    this.initializePerformanceObserver()
    this.startFramerateMonitoring()
  }

  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        // Monitor long tasks
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (entry.entryType === 'longtask') {
              this.metrics.longTasks++
              if (entry.duration > 50) {
                this.metrics.jankCount++
                this.addAlert({
                  type: 'render',
                  severity: 'medium',
                  message: `Long task detected: ${entry.duration.toFixed(2)}ms`,
                  metrics: { longTasks: this.metrics.longTasks }
                })
              }
            }
          })
        })

        this.performanceObserver.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('Performance Observer not supported:', error)
      }
    }
  }

  private startFramerateMonitoring(): void {
    const measureFramerate = () => {
      const now = performance.now()
      const delta = now - this.lastFrameTime
      this.frameCount++

      if (this.frameCount % 60 === 0) { // Calculate every 60 frames
        this.metrics.framerate = 1000 / (delta / 60)
        this.lastFrameTime = now
      }

      this.animationFrameId = requestAnimationFrame(measureFramerate)
    }

    measureFramerate()
  }

  // Track render performance
  trackRender(componentName?: string, duration?: number): void {
    const now = performance.now()
    const renderDuration = duration || (now - this.metrics.lastRenderTime)

    this.metrics.renderCount++
    this.metrics.lastRenderTime = now

    // Update average render time
    this.metrics.averageRenderTime = 
      (this.metrics.averageRenderTime * (this.metrics.renderCount - 1) + renderDuration) / 
      this.metrics.renderCount

    // Track slow renders
    if (renderDuration > 16) { // > 16ms is considered slow (60fps threshold)
      this.metrics.slowRenders++
      
      if (renderDuration > 100) { // Very slow render
        this.addAlert({
          type: 'render',
          severity: renderDuration > 200 ? 'high' : 'medium',
          message: `Slow render detected: ${renderDuration.toFixed(2)}ms${componentName ? ` in ${componentName}` : ''}`,
          metrics: { 
            averageRenderTime: this.metrics.averageRenderTime,
            slowRenders: this.metrics.slowRenders 
          }
        })
      }
    }

    this.renderTimings.push({
      timestamp: now,
      duration: renderDuration,
      componentName
    })

    // Keep only last 100 render timings
    if (this.renderTimings.length > 100) {
      this.renderTimings.shift()
    }

    this.notifyListeners()
  }

  // Track operation performance
  trackOperation(operationId: string, type: string): {
    end: (success: boolean, error?: string) => void
  } {
    const startTime = performance.now()

    return {
      end: (success: boolean, error?: string) => {
        const endTime = performance.now()
        const duration = endTime - startTime

        this.metrics.totalOperations++
        if (success) {
          this.metrics.successfulOperations++
        } else {
          this.metrics.failedOperations++
        }

        // Update average operation time
        this.metrics.averageOperationTime =
          (this.metrics.averageOperationTime * (this.metrics.totalOperations - 1) + duration) /
          this.metrics.totalOperations

        this.operationTimings.push({
          operationId,
          type,
          startTime,
          endTime,
          success,
          error
        })

        // Alert for slow operations
        if (duration > 5000) { // > 5 seconds
          this.addAlert({
            type: 'operation',
            severity: duration > 10000 ? 'high' : 'medium',
            message: `Slow operation: ${type} took ${(duration / 1000).toFixed(2)}s`,
            metrics: { averageOperationTime: this.metrics.averageOperationTime }
          })
        }

        // Keep only last 100 operation timings
        if (this.operationTimings.length > 100) {
          this.operationTimings.shift()
        }

        this.notifyListeners()
      }
    }
  }

  // Track network performance
  trackNetworkCall(url: string, method: string): {
    end: (cached: boolean, status: number) => void
  } {
    const startTime = performance.now()

    return {
      end: (cached: boolean, status: number) => {
        const endTime = performance.now()
        const duration = endTime - startTime

        this.metrics.apiCalls++
        if (cached) {
          this.metrics.cacheHits++
        } else {
          this.metrics.cacheMisses++
        }

        // Update average response time
        this.metrics.averageResponseTime =
          (this.metrics.averageResponseTime * (this.metrics.apiCalls - 1) + duration) /
          this.metrics.apiCalls

        this.networkTimings.push({
          url,
          method,
          startTime,
          endTime,
          cached,
          status
        })

        // Alert for slow network calls
        if (duration > 3000 && !cached) { // > 3 seconds for non-cached calls
          this.addAlert({
            type: 'network',
            severity: 'medium',
            message: `Slow network call: ${method} ${url} took ${(duration / 1000).toFixed(2)}s`,
            metrics: { averageResponseTime: this.metrics.averageResponseTime }
          })
        }

        // Keep only last 100 network timings
        if (this.networkTimings.length > 100) {
          this.networkTimings.shift()
        }

        this.notifyListeners()
      }
    }
  }

  // Update memory metrics
  updateMemoryMetrics(memoryStats: MemoryStats): void {
    this.metrics.currentMemoryUsage = memoryStats.used
    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, memoryStats.used)
    this.metrics.memoryTrend = memoryStats.trend

    // Memory usage alerts
    if (memoryStats.percentage > 0.9) {
      this.addAlert({
        type: 'memory',
        severity: 'critical',
        message: `Critical memory usage: ${memoryStats.used.toFixed(2)}MB (${(memoryStats.percentage * 100).toFixed(1)}%)`,
        metrics: { currentMemoryUsage: memoryStats.used }
      })
    } else if (memoryStats.percentage > 0.8) {
      this.addAlert({
        type: 'memory',
        severity: 'high',
        message: `High memory usage: ${memoryStats.used.toFixed(2)}MB (${(memoryStats.percentage * 100).toFixed(1)}%)`,
        metrics: { currentMemoryUsage: memoryStats.used }
      })
    }

    this.notifyListeners()
  }

  private addAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...alertData
    }

    this.alerts.push(alert)

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift()
    }

    this.alertListeners.forEach(listener => listener(alert))
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.metrics))
  }

  // Public API
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  getRecentRenderTimings(count = 20): RenderTimingEntry[] {
    return this.renderTimings.slice(-count)
  }

  getRecentOperationTimings(count = 20): OperationTimingEntry[] {
    return this.operationTimings.slice(-count)
  }

  getRecentNetworkTimings(count = 20): NetworkTimingEntry[] {
    return this.networkTimings.slice(-count)
  }

  addListener(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  addAlertListener(listener: (alert: PerformanceAlert) => void): () => void {
    this.alertListeners.push(listener)
    return () => {
      const index = this.alertListeners.indexOf(listener)
      if (index > -1) {
        this.alertListeners.splice(index, 1)
      }
    }
  }

  reset(): void {
    this.metrics = {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      slowRenders: 0,
      currentMemoryUsage: 0,
      peakMemoryUsage: 0,
      memoryTrend: 'stable',
      gcCount: 0,
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageOperationTime: 0,
      framerate: 0,
      jankCount: 0,
      longTasks: 0,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0
    }
    this.renderTimings = []
    this.operationTimings = []
    this.networkTimings = []
    this.alerts = []
  }

  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    this.listeners = []
    this.alertListeners = []
  }
}

// Singleton performance monitor
let globalPerformanceMonitor: PerformanceMonitor | null = null

function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor()
  }
  return globalPerformanceMonitor
}

// Hook for performance monitoring
export function usePerformanceMonitoring(options: {
  trackRenders?: boolean
  trackMemory?: boolean
  alertThresholds?: {
    renderTime?: number
    memoryUsage?: number
    operationTime?: number
  }
} = {}) {
  const {
    trackRenders = true,
    trackMemory = true,
    alertThresholds = {}
  } = options

  const [metrics, setMetrics] = useState<PerformanceMetrics>()
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)

  const performanceMonitor = getPerformanceMonitor()
  const memoryManager = getMemoryManager()
  const renderStartTimeRef = useRef<number>(0)

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)

    // Subscribe to metrics updates
    const removeMetricsListener = performanceMonitor.addListener(setMetrics)

    // Subscribe to alerts
    const removeAlertsListener = performanceMonitor.addAlertListener((alert) => {
      setAlerts(prev => [...prev, alert])
    })

    // Subscribe to memory updates if enabled
    let removeMemoryListener: (() => void) | undefined
    if (trackMemory) {
      removeMemoryListener = memoryManager.addMemoryListener((memoryStats) => {
        performanceMonitor.updateMemoryMetrics(memoryStats)
      })
      memoryManager.startMonitoring()
    }

    return () => {
      removeMetricsListener()
      removeAlertsListener()
      if (removeMemoryListener) {
        removeMemoryListener()
        memoryManager.stopMonitoring()
      }
      setIsMonitoring(false)
    }
  }, [performanceMonitor, memoryManager, trackMemory])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
  }, [])

  // Track render performance
  useEffect(() => {
    if (trackRenders && isMonitoring) {
      renderStartTimeRef.current = performance.now()
      
      return () => {
        const renderTime = performance.now() - renderStartTimeRef.current
        performanceMonitor.trackRender('usePerformanceMonitoring', renderTime)
      }
    }
  })

  // Track operation wrapper
  const trackOperation = useCallback((operationId: string, type: string) => {
    return performanceMonitor.trackOperation(operationId, type)
  }, [performanceMonitor])

  // Track network call wrapper
  const trackNetworkCall = useCallback((url: string, method: string) => {
    return performanceMonitor.trackNetworkCall(url, method)
  }, [performanceMonitor])

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  // Reset all metrics
  const resetMetrics = useCallback(() => {
    performanceMonitor.reset()
    setMetrics(undefined)
    setAlerts([])
  }, [performanceMonitor])

  // Get detailed timings
  const getDetailedTimings = useCallback(() => ({
    renders: performanceMonitor.getRecentRenderTimings(),
    operations: performanceMonitor.getRecentOperationTimings(),
    network: performanceMonitor.getRecentNetworkTimings()
  }), [performanceMonitor])

  return useMemo(() => ({
    // Monitoring control
    startMonitoring,
    stopMonitoring,
    isMonitoring,
    
    // Current metrics
    metrics,
    alerts,
    
    // Tracking functions
    trackOperation,
    trackNetworkCall,
    
    // Utilities
    clearAlerts,
    resetMetrics,
    getDetailedTimings,
    
    // Performance assessment
    isPerformant: metrics ? 
      metrics.averageRenderTime < 16 && 
      metrics.currentMemoryUsage < 80 &&
      metrics.framerate > 50 : 
      true,
    
    // Health score (0-100)
    healthScore: metrics ? Math.max(0, 100 - (
      (metrics.slowRenders / Math.max(metrics.renderCount, 1)) * 30 +
      (metrics.currentMemoryUsage / 100) * 20 +
      (metrics.failedOperations / Math.max(metrics.totalOperations, 1)) * 30 +
      (60 - Math.min(metrics.framerate, 60)) / 60 * 20
    )) : 100
  }), [
    startMonitoring,
    stopMonitoring,
    isMonitoring,
    metrics,
    alerts,
    trackOperation,
    trackNetworkCall,
    clearAlerts,
    resetMetrics,
    getDetailedTimings
  ])
}

export default usePerformanceMonitoring

// Utility hook for component render tracking
export function useRenderTracking(componentName: string) {
  const renderStartTime = useRef<number>(0)
  const performanceMonitor = getPerformanceMonitor()

  useEffect(() => {
    renderStartTime.current = performance.now()
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current
      performanceMonitor.trackRender(componentName, renderTime)
    }
  })

  return {
    trackRender: () => {
      const renderTime = performance.now() - renderStartTime.current
      performanceMonitor.trackRender(componentName, renderTime)
      renderStartTime.current = performance.now()
    }
  }
}

export type { PerformanceMetrics, PerformanceAlert }