/**
 * Optimized Query Hooks for Performance
 * 
 * Provides caching, prefetching, and smart data management
 */

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'

// Cache configuration by data type
const CACHE_CONFIG = {
  students: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  },
  teachers: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false
  },
  schedules: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true
  },
  dashboard: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: false
  },
  static: {
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  }
}

type CacheType = keyof typeof CACHE_CONFIG

/**
 * Optimized query hook with smart caching
 */
export function useOptimizedQuery<TData = unknown>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData> & { cacheType?: CacheType }
) {
  const cacheType = options?.cacheType || 'students'
  const config = CACHE_CONFIG[cacheType]
  
  return useQuery({
    queryKey,
    queryFn,
    ...config,
    ...options
  })
}

/**
 * Prefetch hook for predictive loading
 */
export function usePrefetch() {
  const queryClient = useQueryClient()
  
  const prefetchData = useCallback(async (
    queryKey: any[],
    queryFn: () => Promise<any>,
    cacheType: CacheType = 'students'
  ) => {
    const config = CACHE_CONFIG[cacheType]
    
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      ...config
    })
  }, [queryClient])
  
  return { prefetchData }
}

/**
 * Hover prefetch hook for instant navigation
 */
export function useHoverPrefetch() {
  const { prefetchData } = usePrefetch()
  const queryClient = useQueryClient()
  
  const prefetchOnHover = useCallback(async (
    queryKey: any[],
    queryFn: () => Promise<any>,
    delay: number = 200
  ) => {
    const timeoutId = setTimeout(() => {
      // Check if data is not already cached
      const cached = queryClient.getQueryData(queryKey)
      if (!cached) {
        prefetchData(queryKey, queryFn)
      }
    }, delay)
    
    return () => clearTimeout(timeoutId)
  }, [prefetchData, queryClient])
  
  return { prefetchOnHover }
}

/**
 * Batch query hook for parallel data fetching
 */
export function useBatchQueries<T extends Record<string, () => Promise<any>>>(
  queries: T,
  options?: { enabled?: boolean }
) {
  const results: Record<string, any> = {}
  const isLoading = Object.values(results).some((r: any) => r?.isLoading)
  const isError = Object.values(results).some((r: any) => r?.isError)
  
  Object.entries(queries).forEach(([key, queryFn]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key] = useOptimizedQuery(
      [key],
      queryFn,
      { enabled: options?.enabled ?? true }
    )
  })
  
  return {
    results,
    isLoading,
    isError
  }
}

/**
 * Infinite scroll hook for large lists
 */
export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<T[]>,
  options?: {
    pageSize?: number
    initialPage?: number
    threshold?: number
  }
) {
  const [data, setData] = React.useState<T[]>([])
  const [page, setPage] = React.useState(options?.initialPage || 0)
  const [hasMore, setHasMore] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    
    setIsLoadingMore(true)
    try {
      const newData = await fetchFn(page)
      
      if (newData.length < (options?.pageSize || 20)) {
        setHasMore(false)
      }
      
      setData(prev => [...prev, ...newData])
      setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error loading more data:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, hasMore, isLoadingMore, fetchFn, options?.pageSize])
  
  // Intersection observer for auto-loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: options?.threshold || 0.1 }
    )
    
    const sentinel = document.getElementById('infinite-scroll-sentinel')
    if (sentinel) {
      observer.observe(sentinel)
    }
    
    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
      }
    }
  }, [loadMore, hasMore, isLoadingMore, options?.threshold])
  
  return {
    data,
    loadMore,
    hasMore,
    isLoadingMore,
    reset: () => {
      setData([])
      setPage(options?.initialPage || 0)
      setHasMore(true)
    }
  }
}

/**
 * Cache invalidation utilities
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient()
  
  const invalidateByPrefix = useCallback((prefix: string) => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0]
        return typeof key === 'string' && key.startsWith(prefix)
      }
    })
  }, [queryClient])
  
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries()
  }, [queryClient])
  
  const clearCache = useCallback(() => {
    queryClient.clear()
  }, [queryClient])
  
  return {
    invalidateByPrefix,
    invalidateAll,
    clearCache
  }
}

/**
 * Memory optimization hook
 */
export function useMemoryOptimization() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // Clear old cache entries periodically
    const interval = setInterval(() => {
      const queries = queryClient.getQueryCache().getAll()
      const now = Date.now()
      
      queries.forEach(query => {
        const state = query.state
        if (state.dataUpdatedAt && now - state.dataUpdatedAt > 60 * 60 * 1000) {
          // Remove queries older than 1 hour
          queryClient.removeQueries({ queryKey: query.queryKey })
        }
      })
    }, 5 * 60 * 1000) // Run every 5 minutes
    
    return () => clearInterval(interval)
  }, [queryClient])
}

// Export React for the infinite scroll hook
import * as React from 'react'