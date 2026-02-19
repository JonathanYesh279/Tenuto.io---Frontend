/**
 * Performance Optimization Utilities
 * 
 * Provides suspense components, loading states, and performance monitoring
 */

import React, { Suspense, memo, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

// Smart loading states with skeleton components
export interface LoadingStateProps {
  isLoading: boolean
  children: React.ReactNode
  skeleton?: React.ReactNode
  minHeight?: string
}

export function SmartLoadingState({ 
  isLoading, 
  children, 
  skeleton,
  minHeight = '200px' 
}: LoadingStateProps) {
  const [showSkeleton, setShowSkeleton] = useState(false)
  
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (isLoading) {
      timer = setTimeout(() => setShowSkeleton(true), 150)
    } else {
      setShowSkeleton(false)
    }
    
    return () => clearTimeout(timer)
  }, [isLoading])
  
  if (isLoading && showSkeleton) {
    return (
      <div style={{ minHeight }}>
        {skeleton || <DefaultSkeleton />}
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div style={{ minHeight }} className="flex items-center justify-center">
        <div className="animate-pulse text-gray-400">טוען...</div>
      </div>
    )
  }
  
  return <>{children}</>
}

// Default skeleton component
function DefaultSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}

// Enhanced skeleton components with better animations and more realistic layouts
export const SkeletonComponents = {
  StudentHeader: () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-6 animate-pulse">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className="h-7 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  ),
  
  TabContent: () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  ),
  
  TheoryLessons: () => (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between animate-pulse">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-40"></div>
      </div>
      
      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded border border-gray-200 p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  
  OrchestraList: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      ))}
    </div>
  ),
  
  DocumentsList: () => (
    <div className="space-y-4 p-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white border rounded-lg">
          <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  ),
  
  Schedule: () => (
    <div className="p-4 space-y-4 animate-pulse">
      {/* Days header */}
      <div className="grid grid-cols-8 gap-2 mb-4">
        <div className="h-6 bg-gray-200 rounded"></div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 rounded"></div>
        ))}
      </div>
      
      {/* Time slots */}
      {Array.from({ length: 10 }).map((_, row) => (
        <div key={row} className="grid grid-cols-8 gap-2">
          <div className="h-12 bg-gray-200 rounded"></div>
          {Array.from({ length: 7 }).map((_, col) => (
            <div key={col} className="h-12 bg-gray-200 rounded opacity-50"></div>
          ))}
        </div>
      ))}
    </div>
  ),
  
  AttendanceChart: () => (
    <div className="bg-white p-6 rounded-lg border space-y-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
      <div className="flex justify-center gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  ),
  
  PersonalInfo: () => (
    <div className="space-y-6 animate-pulse">
      {/* Basic Info Section */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Contact Info Section */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="h-6 bg-gray-200 rounded w-28 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Placeholder lazy components for tabs that may not exist yet
const PlaceholderTab = ({ name }: { name: string }) => (
  <div className="p-6 text-center text-gray-500">
    {name} - טרם פותח
  </div>
)

export const LazyTabComponents = {
  PersonalInfoTab: () => <PlaceholderTab name="פרטים אישיים" />,
  AcademicInfoTab: () => <PlaceholderTab name="פרטים אקדמיים" />,
  ScheduleTab: () => <PlaceholderTab name="לוח זמנים" />,
  AttendanceTab: () => <PlaceholderTab name="נוכחות" />,
  OrchestraTab: () => <PlaceholderTab name="תזמורות" />,
  TheoryTab: () => <PlaceholderTab name="תיאוריה" />,
  DocumentsTab: () => <PlaceholderTab name="מסמכים" />,
}

// Suspense wrapper for data fetching
export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const SuspenseComponent = (props: P) => (
    <Suspense fallback={fallback || <DefaultSkeleton />}>
      <Component {...props} />
    </Suspense>
  )
  
  SuspenseComponent.displayName = `withSuspense(${Component.displayName || Component.name})`
  return SuspenseComponent
}

// Memoized component wrapper
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, areEqual)
}

// Performance monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private readonly maxMetrics = 100

  startTiming(key: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.recordMetricPrivate(key, duration)
    }
  }

  recordMetric(key: string, value: number) {
    let metrics = this.metrics.get(key) || []
    metrics.push(value)
    
    if (metrics.length > this.maxMetrics) {
      metrics = metrics.slice(-this.maxMetrics)
    }
    
    this.metrics.set(key, metrics)
  }
  
  private recordMetricPrivate(key: string, value: number) {
    this.recordMetric(key, value)
  }

  getStats(key: string) {
    const metrics = this.metrics.get(key) || []
    if (metrics.length === 0) return null
    
    const sum = metrics.reduce((a, b) => a + b, 0)
    const avg = sum / metrics.length
    const min = Math.min(...metrics)
    const max = Math.max(...metrics)
    
    return { avg, min, max, count: metrics.length }
  }

  getAllStats() {
    const stats: Record<string, any> = {}
    for (const [key] of this.metrics) {
      stats[key] = this.getStats(key)
    }
    return stats
  }

  clear() {
    this.metrics.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Memory usage optimization
export function useMemoryOptimization() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const cleanup = () => {
      queryClient.clear()
      if ((window as any).gc) {
        (window as any).gc()
      }
    }
    
    const interval = setInterval(cleanup, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [queryClient])
}

// Performance monitoring hook with real metrics
export function usePerformanceMonitoring(componentName: string) {
  const renderCountRef = useRef(0)
  const mountTimeRef = useRef<number>(0)
  
  useEffect(() => {
    mountTimeRef.current = performance.now()
    return () => {
      const unmountTime = performance.now()
      const lifespan = unmountTime - mountTimeRef.current
      performanceMonitor.startTiming(`${componentName}-lifespan`)();
      (['component-lifespans', componentName].forEach(key => 
        performanceMonitor.recordMetric?.(key, lifespan)
      ))
    }
  }, [])
  
  useEffect(() => {
    renderCountRef.current++
    const endTiming = performanceMonitor.startTiming(`${componentName}-render`)
    
    return () => {
      endTiming()
    }
  })
  
  const logRenderInfo = useCallback(() => {
    console.log(`${componentName} - Renders: ${renderCountRef.current}, Stats:`, 
                performanceMonitor.getStats(`${componentName}-render`))
  }, [componentName])
  
  return {
    renderCount: renderCountRef.current,
    logRenderInfo,
    getStats: () => performanceMonitor.getStats(`${componentName}-render`)
  }
}

// Bundle of all performance hooks for easy consumption
export function usePerformanceOptimizations(options: {
  enableMemoryOptimization?: boolean
  enablePerformanceMonitoring?: boolean
  componentName?: string
} = {}) {
  const { 
    enableMemoryOptimization = true, 
    enablePerformanceMonitoring = true,
    componentName = 'unknown'
  } = options
  
  if (enableMemoryOptimization) {
    useMemoryOptimization()
  }
  
  const monitoring = enablePerformanceMonitoring ? 
    usePerformanceMonitoring(componentName) : null
  
  const prefetchOnHover = useCallback((studentId: string) => {
    const endTiming = performanceMonitor.startTiming('prefetch-on-hover')
    // Actual prefetch logic would go here
    console.log('Prefetching data for student:', studentId)
    setTimeout(endTiming, 10) // Simulate async operation
  }, [])

  const prefetchTabData = useCallback((studentId: string, tabId: string) => {
    const endTiming = performanceMonitor.startTiming('prefetch-tab-data')
    console.log('Prefetching tab data:', { studentId, tabId })
    setTimeout(endTiming, 10) // Simulate async operation
    return Promise.resolve()
  }, [])
  
  const getPerformanceStats = useCallback(() => {
    return performanceMonitor.getAllStats()
  }, [])
  
  const clearPerformanceStats = useCallback(() => {
    performanceMonitor.clear()
  }, [])
  
  return {
    prefetchOnHover,
    prefetchTabData,
    getPerformanceStats,
    clearPerformanceStats,
    monitoring
  }
}