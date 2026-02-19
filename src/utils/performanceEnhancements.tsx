/**
 * Enhanced Performance Optimization Utilities
 * 
 * Advanced performance optimizations for the conservatory application
 */

import React, { 
  memo, 
  useCallback, 
  useEffect, 
  useRef, 
  useState,
  useMemo,
  lazy,
  Suspense 
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FixedSizeList, VariableSizeList, ListChildComponentProps } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import InfiniteLoader from 'react-window-infinite-loader'

// ============================================================================
// VIRTUALIZATION UTILITIES
// ============================================================================

interface VirtualizedListProps<T> {
  items: T[]
  height?: number | string
  itemHeight?: number | ((index: number) => number)
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode
  onLoadMore?: () => Promise<void>
  hasMore?: boolean
  threshold?: number
  overscan?: number
}

/**
 * Generic virtualized list component for large datasets
 */
export function VirtualizedList<T>({
  items,
  height = '100%',
  itemHeight = 50,
  renderItem,
  onLoadMore,
  hasMore = false,
  threshold = 5,
  overscan = 3
}: VirtualizedListProps<T>) {
  const isItemLoaded = useCallback(
    (index: number) => !hasMore || index < items.length,
    [hasMore, items.length]
  )
  
  const loadMoreItems = useCallback(
    () => onLoadMore?.() || Promise.resolve(),
    [onLoadMore]
  )
  
  const itemCount = hasMore ? items.length + 1 : items.length
  
  const Row = memo(({ index, style }: ListChildComponentProps) => {
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )
    }
    return <>{renderItem(items[index], index, style)}</>
  })
  
  if (typeof itemHeight === 'function') {
    // Variable size list
    return (
      <AutoSizer>
        {({ height: autoHeight, width }) => (
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
            threshold={threshold}
          >
            {({ onItemsRendered, ref }) => (
              <VariableSizeList
                ref={ref}
                height={autoHeight}
                width={width}
                itemCount={itemCount}
                itemSize={itemHeight}
                onItemsRendered={onItemsRendered}
                overscanCount={overscan}
              >
                {Row}
              </VariableSizeList>
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    )
  }
  
  // Fixed size list
  return (
    <AutoSizer>
      {({ height: autoHeight, width }) => (
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
          threshold={threshold}
        >
          {({ onItemsRendered, ref }) => (
            <FixedSizeList
              ref={ref}
              height={autoHeight}
              width={width}
              itemCount={itemCount}
              itemSize={itemHeight}
              onItemsRendered={onItemsRendered}
              overscanCount={overscan}
            >
              {Row}
            </FixedSizeList>
          )}
        </InfiniteLoader>
      )}
    </AutoSizer>
  )
}

// ============================================================================
// MEMOIZATION HELPERS
// ============================================================================

/**
 * Deep comparison function for complex objects
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (!a || !b) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false
  
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  
  if (keysA.length !== keysB.length) return false
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual(a[key], b[key])) return false
  }
  
  return true
}

/**
 * Custom memo wrapper with deep comparison
 */
export function memoWithDeepCompare<P extends object>(
  Component: React.ComponentType<P>
): React.MemoExoticComponent<React.ComponentType<P>> {
  return memo(Component, deepEqual)
}

/**
 * Hook for memoizing expensive computations with dependencies
 */
export function useExpensiveComputation<T>(
  computation: () => T,
  deps: React.DependencyList,
  delay = 0
): T | undefined {
  const [result, setResult] = useState<T>()
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setResult(computation())
      }, delay)
    } else {
      setResult(computation())
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, deps)
  
  return result
}

// ============================================================================
// INTERSECTION OBSERVER FOR LAZY LOADING
// ============================================================================

interface LazyLoadOptions {
  rootMargin?: string
  threshold?: number | number[]
  onIntersect?: () => void
}

/**
 * Hook for lazy loading components when they become visible
 */
export function useLazyLoad(
  options: LazyLoadOptions = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const { 
    rootMargin = '100px', 
    threshold = 0.1,
    onIntersect 
  } = options
  
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
            onIntersect?.()
            observer.unobserve(element)
          }
        })
      },
      { rootMargin, threshold }
    )
    
    observer.observe(element)
    
    return () => {
      observer.disconnect()
    }
  }, [rootMargin, threshold, onIntersect])
  
  return [ref, isVisible]
}

/**
 * Component wrapper for lazy loading with intersection observer
 */
export function LazyLoadWrapper({
  children,
  placeholder,
  rootMargin = '100px',
  threshold = 0.1
}: {
  children: React.ReactNode
  placeholder?: React.ReactNode
  rootMargin?: string
  threshold?: number
}) {
  const [ref, isVisible] = useLazyLoad({ rootMargin, threshold })
  
  return (
    <div ref={ref}>
      {isVisible ? children : (placeholder || <div style={{ minHeight: '200px' }} />)}
    </div>
  )
}

// ============================================================================
// DEBOUNCING AND THROTTLING
// ============================================================================

/**
 * Advanced debounce hook with cancel and flush capabilities
 */
export function useAdvancedDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): [T, () => void, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])
  
  const flush = useCallback(() => {
    cancel()
    callbackRef.current()
  }, [cancel])
  
  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      cancel()
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T,
    [delay, cancel]
  )
  
  // Cleanup on unmount
  useEffect(() => {
    return cancel
  }, [cancel])
  
  return [debouncedCallback, cancel, flush]
}

/**
 * Throttle hook for rate-limiting function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(0)
  const timeout = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  
  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastRun = now - lastRun.current
      
      if (timeSinceLastRun >= delay) {
        callbackRef.current(...args)
        lastRun.current = now
      } else {
        if (timeout.current) {
          clearTimeout(timeout.current)
        }
        timeout.current = setTimeout(() => {
          callbackRef.current(...args)
          lastRun.current = Date.now()
        }, delay - timeSinceLastRun)
      }
    }) as T,
    [delay]
  )
  
  return throttledCallback
}

// ============================================================================
// PREFETCHING AND CACHING
// ============================================================================

/**
 * Hook for prefetching data on hover
 */
export function usePrefetchOnHover(
  prefetchFn: () => Promise<void>,
  delay = 100
) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      prefetchFn()
    }, delay)
  }, [prefetchFn, delay])
  
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
}

/**
 * Hook for managing browser storage cache
 */
export function usePersistentCache<T>(
  key: string,
  initialValue: T,
  ttl?: number // Time to live in milliseconds
): [T, (value: T) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      if (!item) return initialValue
      
      const parsed = JSON.parse(item)
      
      // Check if cached value has expired
      if (ttl && parsed.timestamp) {
        const age = Date.now() - parsed.timestamp
        if (age > ttl) {
          localStorage.removeItem(key)
          return initialValue
        }
      }
      
      return parsed.value || initialValue
    } catch {
      return initialValue
    }
  })
  
  const setPersistentValue = useCallback((newValue: T) => {
    setValue(newValue)
    try {
      const item = ttl 
        ? { value: newValue, timestamp: Date.now() }
        : { value: newValue }
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }, [key, ttl])
  
  const clearCache = useCallback(() => {
    setValue(initialValue)
    localStorage.removeItem(key)
  }, [key, initialValue])
  
  return [value, setPersistentValue, clearCache]
}

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  lazy?: boolean
  placeholder?: string
  className?: string
}

/**
 * Optimized image component with lazy loading and progressive enhancement
 */
export const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  lazy = true,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="100%25" height="100%25" fill="%23cccccc"/%3E%3C/svg%3E',
  className = ''
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState(lazy ? placeholder : src)
  const [isLoading, setIsLoading] = useState(lazy)
  const [ref, isVisible] = useLazyLoad()
  
  useEffect(() => {
    if (isVisible && lazy && imageSrc === placeholder) {
      const img = new Image()
      img.src = src
      img.onload = () => {
        setImageSrc(src)
        setIsLoading(false)
      }
    }
  }, [isVisible, lazy, src, placeholder, imageSrc])
  
  return (
    <div ref={ref} className={`relative ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
        </div>
      )}
    </div>
  )
})

OptimizedImage.displayName = 'OptimizedImage'

// ============================================================================
// WEB WORKERS FOR HEAVY COMPUTATIONS
// ============================================================================

/**
 * Hook for offloading heavy computations to web workers
 */
export function useWebWorker<T, R>(
  workerFactory: () => Worker,
  dependencies: React.DependencyList = []
): [(data: T) => Promise<R>, boolean] {
  const [isProcessing, setIsProcessing] = useState(false)
  const workerRef = useRef<Worker>()
  
  useEffect(() => {
    workerRef.current = workerFactory()
    
    return () => {
      workerRef.current?.terminate()
    }
  }, dependencies)
  
  const process = useCallback((data: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }
      
      setIsProcessing(true)
      
      const handleMessage = (e: MessageEvent) => {
        setIsProcessing(false)
        if (e.data.error) {
          reject(e.data.error)
        } else {
          resolve(e.data.result)
        }
      }
      
      const handleError = (error: ErrorEvent) => {
        setIsProcessing(false)
        reject(error)
      }
      
      workerRef.current.addEventListener('message', handleMessage, { once: true })
      workerRef.current.addEventListener('error', handleError, { once: true })
      workerRef.current.postMessage(data)
    })
  }, [])
  
  return [process, isProcessing]
}

// ============================================================================
// PERFORMANCE MONITORING HOOKS
// ============================================================================

/**
 * Hook for monitoring component render performance
 */
export function useRenderMetrics(componentName: string) {
  const renderCount = useRef(0)
  const renderTimes = useRef<number[]>([])
  const lastRenderTime = useRef<number>(performance.now())
  
  useEffect(() => {
    renderCount.current++
    const now = performance.now()
    const renderTime = now - lastRenderTime.current
    renderTimes.current.push(renderTime)
    
    // Keep only last 100 render times
    if (renderTimes.current.length > 100) {
      renderTimes.current = renderTimes.current.slice(-100)
    }
    
    lastRenderTime.current = now
    
    // Log slow renders
    if (renderTime > 16.67) { // Slower than 60fps
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
    }
  })
  
  const getMetrics = useCallback(() => {
    const times = renderTimes.current
    if (times.length === 0) return null
    
    const sum = times.reduce((a, b) => a + b, 0)
    const avg = sum / times.length
    const max = Math.max(...times)
    const min = Math.min(...times)
    
    return {
      renderCount: renderCount.current,
      avgRenderTime: avg,
      maxRenderTime: max,
      minRenderTime: min,
      lastRenderTime: times[times.length - 1]
    }
  }, [])
  
  return getMetrics
}

/**
 * Hook for detecting memory leaks
 */
export function useMemoryLeakDetector(componentName: string) {
  const mountTime = useRef<number>()
  const objectRefs = useRef<Set<WeakRef<object>>>(new Set())
  
  useEffect(() => {
    mountTime.current = performance.now()
    
    return () => {
      const lifespan = performance.now() - (mountTime.current || 0)
      const retainedObjects = Array.from(objectRefs.current).filter(
        ref => ref.deref() !== undefined
      ).length
      
      if (retainedObjects > 0) {
        console.warn(
          `Potential memory leak in ${componentName}: ${retainedObjects} objects retained after ${lifespan.toFixed(2)}ms`
        )
      }
    }
  }, [componentName])
  
  const trackObject = useCallback((obj: object) => {
    objectRefs.current.add(new WeakRef(obj))
  }, [])
  
  return trackObject
}

// ============================================================================
// BATCH UPDATES
// ============================================================================

/**
 * Hook for batching multiple state updates
 */
export function useBatchedUpdates<T extends Record<string, any>>(
  initialState: T
): [T, (updates: Partial<T>) => void, () => void] {
  const [state, setState] = useState(initialState)
  const pendingUpdates = useRef<Partial<T>>({})
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const batchUpdate = useCallback((updates: Partial<T>) => {
    pendingUpdates.current = { ...pendingUpdates.current, ...updates }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, ...pendingUpdates.current }))
      pendingUpdates.current = {}
    }, 0)
  }, [])
  
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setState(prev => ({ ...prev, ...pendingUpdates.current }))
    pendingUpdates.current = {}
  }, [])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return [state, batchUpdate, flush]
}

export default {
  VirtualizedList,
  deepEqual,
  memoWithDeepCompare,
  useExpensiveComputation,
  useLazyLoad,
  LazyLoadWrapper,
  useAdvancedDebounce,
  useThrottle,
  usePrefetchOnHover,
  usePersistentCache,
  OptimizedImage,
  useWebWorker,
  useRenderMetrics,
  useMemoryLeakDetector,
  useBatchedUpdates
}