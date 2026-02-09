/**
 * Advanced Caching Service
 * 
 * Implements multi-layer caching with IndexedDB for persistence,
 * memory cache for speed, and intelligent cache invalidation
 */

import { QueryClient } from '@tanstack/react-query'

// Cache priority levels
export enum CachePriority {
  CRITICAL = 'critical',    // Never evict unless expired
  HIGH = 'high',           // Keep as long as possible
  MEDIUM = 'medium',       // Standard caching
  LOW = 'low'             // First to evict
}

// Cache configuration by data type
export const CACHE_CONFIGS = {
  // Static data - rarely changes
  SCHOOL_INFO: {
    staleTime: 24 * 60 * 60 * 1000,  // 24 hours
    cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    priority: CachePriority.LOW,
    persistent: true
  },
  
  // User session data
  USER_PROFILE: {
    staleTime: 10 * 60 * 1000,  // 10 minutes
    cacheTime: 60 * 60 * 1000,  // 1 hour
    priority: CachePriority.CRITICAL,
    persistent: true
  },
  
  // Lists with moderate updates
  STUDENTS_LIST: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    cacheTime: 30 * 60 * 1000,  // 30 minutes
    priority: CachePriority.HIGH,
    persistent: true
  },
  
  TEACHERS_LIST: {
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    priority: CachePriority.HIGH,
    persistent: true
  },
  
  // Frequently accessed detail data
  STUDENT_DETAILS: {
    staleTime: 2 * 60 * 1000,   // 2 minutes
    cacheTime: 15 * 60 * 1000,  // 15 minutes
    priority: CachePriority.MEDIUM,
    persistent: false
  },
  
  // Real-time data
  ATTENDANCE: {
    staleTime: 30 * 1000,        // 30 seconds
    cacheTime: 2 * 60 * 1000,    // 2 minutes
    priority: CachePriority.LOW,
    persistent: false
  },
  
  SCHEDULE: {
    staleTime: 60 * 1000,        // 1 minute
    cacheTime: 10 * 60 * 1000,   // 10 minutes
    priority: CachePriority.MEDIUM,
    persistent: true
  }
}

// IndexedDB configuration
const DB_NAME = 'ConservatoryCache'
const DB_VERSION = 1
const STORE_NAME = 'apiCache'

class IndexedDBCache {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null
  
  async initialize(): Promise<void> {
    if (this.db) return
    if (this.dbPromise) {
      await this.dbPromise
      return
    }
    
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(request.result)
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('priority', 'priority', { unique: false })
        }
      }
    })
    
    await this.dbPromise
  }
  
  async get(key: string): Promise<any> {
    await this.initialize()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)
      
      request.onsuccess = () => {
        const data = request.result
        if (data && data.expiry > Date.now()) {
          resolve(data.value)
        } else {
          // Remove expired data
          if (data) {
            this.delete(key)
          }
          resolve(null)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }
  
  async set(
    key: string, 
    value: any, 
    ttl: number, 
    priority: CachePriority = CachePriority.MEDIUM
  ): Promise<void> {
    await this.initialize()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const data = {
        key,
        value,
        timestamp: Date.now(),
        expiry: Date.now() + ttl,
        priority
      }
      
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async delete(key: string): Promise<void> {
    await this.initialize()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async clear(): Promise<void> {
    await this.initialize()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async evictLowPriority(spaceNeeded: number = 0): Promise<void> {
    await this.initialize()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('priority')
      
      // Get low priority items first
      const request = index.openCursor(IDBKeyRange.only(CachePriority.LOW))
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }
}

// Memory cache with LRU eviction
class MemoryCache {
  private cache = new Map<string, { value: any; timestamp: number; hits: number }>()
  private maxSize = 100
  
  get(key: string): any {
    const item = this.cache.get(key)
    if (item) {
      item.hits++
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, item)
      return item.value
    }
    return null
  }
  
  set(key: string, value: any): void {
    // Evict least recently used if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0
    })
  }
  
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  getStats(): any {
    const stats = {
      size: this.cache.size,
      maxSize: this.maxSize,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        hits: item.hits,
        age: Date.now() - item.timestamp
      }))
    }
    return stats
  }
}

// Multi-layer cache manager
export class AdvancedCacheManager {
  private memoryCache = new MemoryCache()
  private persistentCache = new IndexedDBCache()
  private prefetchQueue = new Set<string>()
  private cacheStats = {
    hits: 0,
    misses: 0,
    writes: 0,
    evictions: 0
  }
  
  async get(key: string, config?: any): Promise<any> {
    // Try memory cache first
    let value = this.memoryCache.get(key)
    if (value) {
      this.cacheStats.hits++
      return value
    }
    
    // Try persistent cache if configured
    if (config?.persistent) {
      value = await this.persistentCache.get(key)
      if (value) {
        this.cacheStats.hits++
        // Promote to memory cache
        this.memoryCache.set(key, value)
        return value
      }
    }
    
    this.cacheStats.misses++
    return null
  }
  
  async set(
    key: string, 
    value: any, 
    config: any = {}
  ): Promise<void> {
    this.cacheStats.writes++
    
    // Always set in memory cache
    this.memoryCache.set(key, value)
    
    // Set in persistent cache if configured
    if (config.persistent) {
      await this.persistentCache.set(
        key,
        value,
        config.cacheTime || 60000,
        config.priority || CachePriority.MEDIUM
      )
    }
  }
  
  async invalidate(pattern: string | RegExp): Promise<void> {
    // Clear from memory cache
    if (typeof pattern === 'string') {
      this.memoryCache.delete(pattern)
      await this.persistentCache.delete(pattern)
    } else {
      // Pattern matching for bulk invalidation
      // This would need to iterate through cache keys
      console.log('Pattern invalidation:', pattern)
    }
  }
  
  async prefetch(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      if (this.prefetchQueue.has(key)) return
      
      this.prefetchQueue.add(key)
      try {
        const existing = await this.get(key)
        if (!existing) {
          const value = await fetcher(key)
          await this.set(key, value)
        }
      } finally {
        this.prefetchQueue.delete(key)
      }
    })
    
    await Promise.all(promises)
  }
  
  getStats(): any {
    return {
      ...this.cacheStats,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses),
      memory: this.memoryCache.getStats(),
      prefetchQueueSize: this.prefetchQueue.size
    }
  }
  
  async clear(): Promise<void> {
    this.memoryCache.clear()
    await this.persistentCache.clear()
    this.cacheStats = {
      hits: 0,
      misses: 0,
      writes: 0,
      evictions: 0
    }
  }
}

// Singleton instance
export const cacheManager = new AdvancedCacheManager()

// React Query integration
export function createQueryClientWithCache(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          if (error?.status === 404 || error?.status === 403) {
            return false
          }
          return failureCount < 2
        },
        // Custom cache behavior
        queryFn: async ({ queryKey, queryFn }) => {
          const cacheKey = JSON.stringify(queryKey)
          
          // Try cache first
          const cached = await cacheManager.get(cacheKey)
          if (cached) {
            return cached
          }
          
          // Fetch and cache
          const data = await queryFn!()
          await cacheManager.set(cacheKey, data, {
            persistent: true,
            cacheTime: 5 * 60 * 1000
          })
          
          return data
        }
      }
    }
  })
}

// Prefetching strategies
export const prefetchStrategies = {
  // Prefetch related data when viewing a student
  studentDetails: async (studentId: string) => {
    const keys = [
      `student-${studentId}-schedule`,
      `student-${studentId}-attendance`,
      `student-${studentId}-theory`,
      `student-${studentId}-orchestras`
    ]
    
    await cacheManager.prefetch(keys, async (key) => {
      // Implement actual API calls here
      console.log('Prefetching:', key)
      return { prefetched: true }
    })
  },
  
  // Prefetch next page of list data
  listPagination: async (resource: string, currentPage: number) => {
    const nextPage = currentPage + 1
    const key = `${resource}-page-${nextPage}`
    
    await cacheManager.prefetch([key], async () => {
      // Implement actual API call
      console.log('Prefetching page:', nextPage)
      return { page: nextPage }
    })
  }
}

export default cacheManager