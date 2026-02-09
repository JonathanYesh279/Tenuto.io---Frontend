/**
 * React Query Provider Configuration
 * 
 * Sets up React Query with optimized caching, background refetching,
 * and error handling for better performance
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Create optimized query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      
      // Background refetch settings
      refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
      refetchOnReconnect: true, // Refetch on network reconnect
      refetchOnMount: true, // Refetch when component mounts
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        const errorStatus = (error as any)?.response?.status
        if (errorStatus >= 400 && errorStatus < 500) {
          return false
        }
        // Retry up to 2 times for other errors
        return failureCount < 2
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      
      // Network mode
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      networkMode: 'online',
      
      // Global error handling for mutations
      onError: (error) => {
        console.error('Mutation error:', error)
      },
    },
  },
})

// Global error handler for React Query
queryClient.setQueryDefaults(['students'], {
  staleTime: 2 * 60 * 1000, // Students data is more dynamic
  gcTime: 5 * 60 * 1000,
})

queryClient.setQueryDefaults(['teachers'], {
  staleTime: 10 * 60 * 1000, // Teacher data changes less frequently
  gcTime: 30 * 60 * 1000,
})

queryClient.setQueryDefaults(['theory-lessons'], {
  staleTime: 2 * 60 * 1000, // Theory lessons change often
  gcTime: 5 * 60 * 1000,
})

queryClient.setQueryDefaults(['orchestras'], {
  staleTime: 5 * 60 * 1000, // Orchestra data is moderately dynamic
  gcTime: 15 * 60 * 1000,
})

// Static data caches longer
queryClient.setQueryDefaults(['school-years'], {
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000, // 1 hour
})

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}

// Export query client for use in other parts of the app
export { queryClient }

// Utility functions for cache management
export const cacheUtils = {
  /**
   * Clear all cached data
   */
  clearAll: () => {
    queryClient.clear()
  },
  
  /**
   * Invalidate specific cache keys
   */
  invalidate: (queryKeys: string[]) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] })
    })
  },
  
  /**
   * Get cache statistics
   */
  getStats: () => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.isFetching()).length,
      errorQueries: queries.filter(q => q.state.error).length,
      cachedDataSize: queries.filter(q => q.state.data).length,
    }
  },
  
  /**
   * Force garbage collection
   */
  gc: () => {
    queryClient.getQueryCache().clear()
    queryClient.getMutationCache().clear()
    
    // Force browser garbage collection if available
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc()
    }
  },
  
  /**
   * Prefetch data for performance
   */
  prefetch: {
    student: (studentId: string) => {
      return queryClient.prefetchQuery({
        queryKey: ['student', studentId],
        queryFn: () => import('../services/apiCache').then(m => m.cachedApiService.students.getById(studentId)),
        staleTime: 2 * 60 * 1000,
      })
    },
    
    theoryLessons: () => {
      return queryClient.prefetchQuery({
        queryKey: ['theory-lessons'],
        queryFn: () => import('../services/apiCache').then(m => m.cachedApiService.theoryLessons.getAll()),
        staleTime: 2 * 60 * 1000,
      })
    },
    
    orchestras: () => {
      return queryClient.prefetchQuery({
        queryKey: ['orchestras'],
        queryFn: () => import('../services/apiCache').then(m => m.cachedApiService.orchestras.getAll()),
        staleTime: 5 * 60 * 1000,
      })
    }
  }
}