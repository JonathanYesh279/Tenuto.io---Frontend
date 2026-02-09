/**
 * Bundle Optimization Utilities
 * 
 * Provides utilities for lazy loading, code splitting, and bundle optimization
 */

import { lazy } from 'react'

// Lazy loading with retry mechanism for better reliability
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  componentName: string,
  maxRetries: number = 3
) {
  return lazy(() => {
    let retryCount = 0
    
    const loadWithRetry = async (): Promise<{ default: T }> => {
      try {
        const component = await componentImport()
        console.log(`✅ Successfully loaded ${componentName}`)
        return component
      } catch (error) {
        console.error(`❌ Failed to load ${componentName}, attempt ${retryCount + 1}/${maxRetries}:`, error)
        
        if (retryCount < maxRetries - 1) {
          retryCount++
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
          return loadWithRetry()
        } else {
          console.error(`❌ All retry attempts failed for ${componentName}`)
          throw error
        }
      }
    }
    
    return loadWithRetry()
  })
}

// Preload strategy for critical components
export class ComponentPreloader {
  private preloadedComponents = new Set<string>()
  private preloadPromises = new Map<string, Promise<any>>()
  
  preload(
    componentName: string,
    componentImport: () => Promise<{ default: React.ComponentType<any> }>
  ): Promise<any> {
    if (this.preloadedComponents.has(componentName)) {
      return Promise.resolve()
    }
    
    if (this.preloadPromises.has(componentName)) {
      return this.preloadPromises.get(componentName)!
    }
    
    const promise = componentImport()
      .then(component => {
        this.preloadedComponents.add(componentName)
        console.log(`✅ Preloaded ${componentName}`)
        return component
      })
      .catch(error => {
        console.error(`❌ Failed to preload ${componentName}:`, error)
        throw error
      })
      .finally(() => {
        this.preloadPromises.delete(componentName)
      })
    
    this.preloadPromises.set(componentName, promise)
    return promise
  }
  
  preloadOnHover(
    componentName: string,
    componentImport: () => Promise<{ default: React.ComponentType<any> }>
  ): () => void {
    return () => {
      if (!this.preloadedComponents.has(componentName)) {
        this.preload(componentName, componentImport)
      }
    }
  }
  
  getPreloadStats() {
    return {
      preloadedComponents: Array.from(this.preloadedComponents),
      pendingPreloads: Array.from(this.preloadPromises.keys())
    }
  }
}

export const componentPreloader = new ComponentPreloader()

// Define critical paths that should be preloaded
export const CRITICAL_COMPONENTS = {
  STUDENT_DETAILS: 'StudentDetailsPage',
  THEORY_TAB: 'TheoryTab',
  ORCHESTRA_TAB: 'OrchestraTab',
  DASHBOARD: 'Dashboard',
  STUDENTS_LIST: 'Students'
}

// Preload critical components based on user navigation patterns
export function preloadCriticalComponents() {
  // Preload most commonly used components after initial load
  setTimeout(() => {
    componentPreloader.preload(
      CRITICAL_COMPONENTS.DASHBOARD,
      () => import('../pages/Dashboard')
    )
    
    componentPreloader.preload(
      CRITICAL_COMPONENTS.STUDENTS_LIST,
      () => import('../pages/Students')
    )
  }, 1000)
  
  // Preload detail pages after a longer delay
  setTimeout(() => {
    componentPreloader.preload(
      CRITICAL_COMPONENTS.STUDENT_DETAILS,
      () => import('../features/students/details/components/StudentDetailsPageSimple')
    )
  }, 3000)
}

// Bundle analysis utilities for development
export function analyzeBundlePerformance() {
  if (process.env.NODE_ENV !== 'development') return
  
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming
        console.log('📊 Navigation Performance:', {
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
          firstPaint: performance.getEntriesByType('paint').find(e => e.name === 'first-paint')?.startTime,
          firstContentfulPaint: performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint')?.startTime
        })
      }
    })
  })
  
  observer.observe({ entryTypes: ['navigation'] })
  
  // Log bundle sizes if available
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    console.log('📊 Network Info:', {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    })
  }
}

// Resource hints for better loading performance
export function addResourceHints() {
  const head = document.head
  
  // DNS prefetch for external resources
  const dnsPrefetch = document.createElement('link')
  dnsPrefetch.rel = 'dns-prefetch'
  dnsPrefetch.href = '//localhost'
  head.appendChild(dnsPrefetch)
  
  // Preconnect to API server
  const preconnect = document.createElement('link')
  preconnect.rel = 'preconnect'
  preconnect.href = 'http://localhost:3001'
  preconnect.crossOrigin = 'anonymous'
  head.appendChild(preconnect)
  
  // Prefetch critical static assets
  const prefetchStyles = document.createElement('link')
  prefetchStyles.rel = 'prefetch'
  prefetchStyles.as = 'style'
  prefetchStyles.href = '/src/index.css'
  head.appendChild(prefetchStyles)
}

// Initialize bundle optimizations
export function initializeBundleOptimizations() {
  if (typeof window === 'undefined') return
  
  // Add resource hints
  addResourceHints()
  
  // Start performance analysis in development
  analyzeBundlePerformance()
  
  // Preload critical components
  preloadCriticalComponents()
  
  // Log optimization status
  console.log('🚀 Bundle optimizations initialized')
}