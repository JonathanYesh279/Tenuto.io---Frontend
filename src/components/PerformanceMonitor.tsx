/**
 * Performance Monitoring Component
 * 
 * Real-time performance metrics and optimization insights
 */

import React, { useState, useEffect, useCallback } from 'react'

import { Card } from './ui/Card'
import { ActivityIcon, CheckCircleIcon, ClockIcon, DatabaseIcon, LightningIcon, TrendUpIcon, WarningCircleIcon } from '@phosphor-icons/react'

interface PerformanceMetrics {
  renderTime: number
  apiCallsCount: number
  memoryUsage: number
  bundleLoadTime: number
  cacheHitRate: number
  componentReRenders: number
  largestContentfulPaint: number
  firstContentfulPaint: number
}

interface ComponentMetric {
  name: string
  renderCount: number
  averageRenderTime: number
  lastRenderTime: number
}

const METRIC_THRESHOLDS = {
  renderTime: { good: 16, warning: 33, critical: 100 },
  apiCallsCount: { good: 5, warning: 10, critical: 20 },
  memoryUsage: { good: 50, warning: 100, critical: 200 },
  bundleLoadTime: { good: 1000, warning: 3000, critical: 5000 },
  cacheHitRate: { good: 80, warning: 60, critical: 40 },
  componentReRenders: { good: 10, warning: 50, critical: 100 }
}

class PerformanceTracker {
  private static instance: PerformanceTracker
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    apiCallsCount: 0,
    memoryUsage: 0,
    bundleLoadTime: 0,
    cacheHitRate: 0,
    componentReRenders: 0,
    largestContentfulPaint: 0,
    firstContentfulPaint: 0
  }
  private componentMetrics = new Map<string, ComponentMetric>()
  private observers: ((metrics: PerformanceMetrics) => void)[] = []

  static getInstance() {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker()
    }
    return PerformanceTracker.instance
  }

  private constructor() {
    this.initWebVitals()
    this.initMemoryMonitoring()
  }

  private initWebVitals() {
    // Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.updateMetric('largestContentfulPaint', lastEntry.startTime)
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.updateMetric('firstContentfulPaint', entry.startTime)
          }
        })
      })
      fcpObserver.observe({ type: 'paint', buffered: true })
    }
  }

  private initMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.updateMetric('memoryUsage', memory.usedJSHeapSize / 1024 / 1024) // MB
      }, 5000)
    }
  }

  trackComponentRender(componentName: string, renderTime: number) {
    const existing = this.componentMetrics.get(componentName)
    if (existing) {
      existing.renderCount++
      existing.averageRenderTime = (existing.averageRenderTime + renderTime) / 2
      existing.lastRenderTime = renderTime
    } else {
      this.componentMetrics.set(componentName, {
        name: componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime
      })
    }
    
    this.updateMetric('componentReRenders', this.componentMetrics.size)
  }

  trackApiCall() {
    this.updateMetric('apiCallsCount', this.metrics.apiCallsCount + 1)
  }

  trackBundleLoad(loadTime: number) {
    this.updateMetric('bundleLoadTime', loadTime)
  }

  trackCacheHit(hits: number, total: number) {
    const hitRate = total > 0 ? (hits / total) * 100 : 0
    this.updateMetric('cacheHitRate', hitRate)
  }

  private updateMetric(key: keyof PerformanceMetrics, value: number) {
    this.metrics[key] = value
    this.notifyObservers()
  }

  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.push(callback)
    return () => {
      const index = this.observers.indexOf(callback)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  private notifyObservers() {
    this.observers.forEach(callback => callback({ ...this.metrics }))
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getComponentMetrics(): ComponentMetric[] {
    return Array.from(this.componentMetrics.values())
  }

  reset() {
    this.metrics = {
      renderTime: 0,
      apiCallsCount: 0,
      memoryUsage: 0,
      bundleLoadTime: 0,
      cacheHitRate: 0,
      componentReRenders: 0,
      largestContentfulPaint: 0,
      firstContentfulPaint: 0
    }
    this.componentMetrics.clear()
    this.notifyObservers()
  }
}

// React hook for performance tracking
export function usePerformanceTracker() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => 
    PerformanceTracker.getInstance().getMetrics()
  )

  useEffect(() => {
    const tracker = PerformanceTracker.getInstance()
    const unsubscribe = tracker.subscribe(setMetrics)
    return unsubscribe
  }, [])

  const trackComponent = useCallback((componentName: string, renderTime: number) => {
    PerformanceTracker.getInstance().trackComponentRender(componentName, renderTime)
  }, [])

  const trackApiCall = useCallback(() => {
    PerformanceTracker.getInstance().trackApiCall()
  }, [])

  return {
    metrics,
    trackComponent,
    trackApiCall,
    reset: () => PerformanceTracker.getInstance().reset(),
    getComponentMetrics: () => PerformanceTracker.getInstance().getComponentMetrics()
  }
}

// Performance status component
function MetricStatus({ value, thresholds, unit = '' }: {
  value: number
  thresholds: { good: number, warning: number, critical: number }
  unit?: string
}) {
  const getStatus = () => {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.warning) return 'warning'
    return 'critical'
  }

  const status = getStatus()
  const icons = {
    good: <CheckCircleIcon className="w-4 h-4 text-green-500" />,
    warning: <WarningCircleIcon className="w-4 h-4 text-yellow-500" />,
    critical: <WarningCircleIcon className="w-4 h-4 text-red-500" />
  }

  const colors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  }

  return (
    <div className="flex items-center gap-2">
      {icons[status]}
      <span className={colors[status]}>
        {value.toFixed(1)}{unit}
      </span>
    </div>
  )
}

// Main performance monitor component
export const PerformanceMonitor: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { metrics, reset, getComponentMetrics } = usePerformanceTracker()
  const [componentMetrics, setComponentMetrics] = useState<ComponentMetric[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'recommendations'>('overview')

  useEffect(() => {
    if (isOpen) {
      setComponentMetrics(getComponentMetrics())
    }
  }, [isOpen, getComponentMetrics])

  const getRecommendations = () => {
    const recommendations: Array<{ type: 'warning' | 'info' | 'error'; message: string }> = []

    if (metrics.renderTime > METRIC_THRESHOLDS.renderTime.warning) {
      recommendations.push({
        type: 'warning',
        message: `זמן רינדור גבוה (${metrics.renderTime.toFixed(1)}ms). שקול להשתמש ב-React.memo או virtualization`
      })
    }

    if (metrics.memoryUsage > METRIC_THRESHOLDS.memoryUsage.warning) {
      recommendations.push({
        type: 'error',
        message: `זיכרון גבוה (${metrics.memoryUsage.toFixed(1)}MB). בדוק memory leaks או הפעל cleanup`
      })
    }

    if (metrics.cacheHitRate < METRIC_THRESHOLDS.cacheHitRate.good) {
      recommendations.push({
        type: 'info',
        message: `Cache hit rate נמוך (${metrics.cacheHitRate.toFixed(1)}%). שפר אסטרטגיית caching`
      })
    }

    if (metrics.largestContentfulPaint > 2500) {
      recommendations.push({
        type: 'warning',
        message: `LCP איטי (${metrics.largestContentfulPaint.toFixed(0)}ms). אופטם עד לטעינת תמונות וקוד`
      })
    }

    if (componentMetrics.length > 50) {
      recommendations.push({
        type: 'info',
        message: `יותר מ-50 קומפוננטות פעילות. שקול code splitting נוסף`
      })
    }

    return recommendations
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ActivityIcon className="w-5 h-5" />
            מוניטור ביצועים
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'סקירה כללית', icon: TrendUpIcon },
            { id: 'components', label: 'קומפוננטות', icon: DatabaseIcon },
            { id: 'recommendations', label: 'המלצות', icon: LightningIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-muted/50'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card padding="md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">זמן רינדור</div>
                      <MetricStatus 
                        value={metrics.renderTime} 
                        thresholds={METRIC_THRESHOLDS.renderTime}
                        unit="ms"
                      />
                    </div>
                    <ClockIcon className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>

                <Card padding="md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">זיכרון</div>
                      <MetricStatus 
                        value={metrics.memoryUsage} 
                        thresholds={METRIC_THRESHOLDS.memoryUsage}
                        unit="MB"
                      />
                    </div>
                    <DatabaseIcon className="w-8 h-8 text-purple-500" />
                  </div>
                </Card>

                <Card padding="md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Cache Hit Rate</div>
                      <MetricStatus 
                        value={metrics.cacheHitRate} 
                        thresholds={METRIC_THRESHOLDS.cacheHitRate}
                        unit="%"
                      />
                    </div>
                    <LightningIcon className="w-8 h-8 text-green-500" />
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card padding="md">
                  <div className="text-sm text-gray-600 mb-2">Web Vitals</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">FCP:</span>
                      <span className={`text-sm ${metrics.firstContentfulPaint < 1800 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.firstContentfulPaint.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">LCP:</span>
                      <span className={`text-sm ${metrics.largestContentfulPaint < 2500 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.largestContentfulPaint.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                </Card>

                <Card padding="md">
                  <div className="text-sm text-gray-600 mb-2">פעילות</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">API Calls:</span>
                      <span className="text-sm">{metrics.apiCallsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Re-renders:</span>
                      <span className="text-sm">{metrics.componentReRenders}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'components' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                מציג את הקומפוננטות הפעילות וביצועיהן
              </div>
              <div className="space-y-2">
                {componentMetrics.map(component => (
                  <div key={component.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{component.name}</div>
                      <div className="text-sm text-gray-600">
                        {component.renderCount} renders
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm ${component.averageRenderTime > 16 ? 'text-red-600' : 'text-green-600'}`}>
                        {component.averageRenderTime.toFixed(1)}ms avg
                      </div>
                      <div className="text-xs text-gray-500">
                        {component.lastRenderTime.toFixed(1)}ms last
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                המלצות לשיפור הביצועים בהתבסס על המטריקות הנוכחיות
              </div>
              <div className="space-y-3">
                {getRecommendations().map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.type === 'error'
                        ? 'bg-red-50 border-red-400 text-red-700'
                        : rec.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                        : 'bg-blue-50 border-blue-400 text-blue-700'
                    }`}
                  >
                    {rec.message}
                  </div>
                ))}
                {getRecommendations().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    🎉 כל המטריקות בטווח התקין!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-between">
          <button
            onClick={reset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            איפוס מטריקות
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  )
}

// Export the performance tracker for global use
export { PerformanceTracker }