/**
 * Memory Management Utilities
 * 
 * Advanced memory management for large-scale cascade deletion operations
 * including object pooling, weak references, and memory leak detection
 */

// Memory pool for reusing objects to reduce GC pressure
class ObjectPool<T> {
  private pool: T[] = []
  private maxSize: number
  private factory: () => T
  private reset?: (obj: T) => void

  constructor(factory: () => T, maxSize = 100, reset?: (obj: T) => void) {
    this.factory = factory
    this.maxSize = maxSize
    this.reset = reset
  }

  acquire(): T {
    if (this.pool.length > 0) {
      const obj = this.pool.pop()!
      return obj
    }
    return this.factory()
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.reset) {
        this.reset(obj)
      }
      this.pool.push(obj)
    }
  }

  clear(): void {
    this.pool = []
  }

  get size(): number {
    return this.pool.length
  }
}

// WeakMap-based cache for preventing memory leaks
class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>()
  private references = new Set<WeakRef<K>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(cleanupIntervalMs = 30000) {
    // Periodic cleanup of weak references
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, cleanupIntervalMs)
  }

  set(key: K, value: V): void {
    this.cache.set(key, value)
    this.references.add(new WeakRef(key))
  }

  get(key: K): V | undefined {
    return this.cache.get(key)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  private cleanup(): void {
    const newReferences = new Set<WeakRef<K>>()
    
    this.references.forEach(ref => {
      const key = ref.deref()
      if (key !== undefined) {
        newReferences.add(ref)
      }
    })
    
    this.references = newReferences
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.references.clear()
  }

  get size(): number {
    return this.references.size
  }
}

// Memory monitoring and alerting
interface MemoryStats {
  used: number
  total: number
  percentage: number
  limit: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

class MemoryMonitor {
  private measurements: Array<{ timestamp: number; usage: number }> = []
  private readonly maxMeasurements = 50
  private readonly warningThreshold = 0.8 // 80% of limit
  private readonly criticalThreshold = 0.9 // 90% of limit
  private listeners: Array<(stats: MemoryStats) => void> = []
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor(private memoryLimitMB = 100) {}

  startMonitoring(intervalMs = 5000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring()
    }

    this.monitoringInterval = setInterval(() => {
      this.measure()
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  measure(): MemoryStats | null {
    let currentUsage = 0

    // Use Performance API if available (Chrome)
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      currentUsage = memInfo.usedJSHeapSize / (1024 * 1024) // Convert to MB
    } else {
      // Fallback estimation (less accurate)
      currentUsage = this.estimateMemoryUsage()
    }

    const timestamp = Date.now()
    this.measurements.push({ timestamp, usage: currentUsage })

    // Keep only recent measurements
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift()
    }

    const stats: MemoryStats = {
      used: currentUsage,
      total: this.memoryLimitMB,
      percentage: currentUsage / this.memoryLimitMB,
      limit: this.memoryLimitMB,
      trend: this.calculateTrend()
    }

    // Alert listeners
    this.listeners.forEach(listener => listener(stats))

    return stats
  }

  private estimateMemoryUsage(): number {
    // Rough estimation based on performance.now() and object count
    // This is very approximate and should not be relied upon for precise monitoring
    return Math.min(50, Math.random() * 100)
  }

  private calculateTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.measurements.length < 5) return 'stable'

    const recent = this.measurements.slice(-5)
    const slope = this.calculateSlope(recent)

    if (slope > 2) return 'increasing'
    if (slope < -2) return 'decreasing'
    return 'stable'
  }

  private calculateSlope(points: Array<{ timestamp: number; usage: number }>): number {
    const n = points.length
    const sumX = points.reduce((sum, p, i) => sum + i, 0)
    const sumY = points.reduce((sum, p) => sum + p.usage, 0)
    const sumXY = points.reduce((sum, p, i) => sum + i * p.usage, 0)
    const sumXX = points.reduce((sum, p, i) => sum + i * i, 0)

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }

  addListener(listener: (stats: MemoryStats) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  getCurrentStats(): MemoryStats | null {
    return this.measure()
  }

  isWarningLevel(): boolean {
    const stats = this.getCurrentStats()
    return stats ? stats.percentage > this.warningThreshold : false
  }

  isCriticalLevel(): boolean {
    const stats = this.getCurrentStats()
    return stats ? stats.percentage > this.criticalThreshold : false
  }

  forceGarbageCollection(): void {
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }

    // Manual cleanup strategies
    this.triggerManualCleanup()
  }

  private triggerManualCleanup(): void {
    // Clear any internal caches that might be holding references
    if (this.measurements.length > 10) {
      this.measurements = this.measurements.slice(-10)
    }

    // Force reflow and repaint to help with DOM memory
    const dummy = document.createElement('div')
    document.body.appendChild(dummy)
    dummy.offsetHeight // Force reflow
    document.body.removeChild(dummy)
  }

  destroy(): void {
    this.stopMonitoring()
    this.listeners = []
    this.measurements = []
  }
}

// Batch memory cleanup for large operations
class BatchMemoryManager {
  private pools = new Map<string, ObjectPool<any>>()
  private caches = new Map<string, WeakCache<any, any>>()
  private monitor: MemoryMonitor
  private cleanupThreshold = 0.8

  constructor(memoryLimitMB = 100) {
    this.monitor = new MemoryMonitor(memoryLimitMB)
    
    // Auto-cleanup when memory is high
    this.monitor.addListener((stats) => {
      if (stats.percentage > this.cleanupThreshold) {
        this.performCleanup()
      }
    })
  }

  createObjectPool<T>(
    name: string,
    factory: () => T,
    maxSize = 100,
    reset?: (obj: T) => void
  ): ObjectPool<T> {
    const pool = new ObjectPool(factory, maxSize, reset)
    this.pools.set(name, pool)
    return pool
  }

  getObjectPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name)
  }

  createWeakCache<K extends object, V>(name: string): WeakCache<K, V> {
    const cache = new WeakCache<K, V>()
    this.caches.set(name, cache)
    return cache
  }

  getWeakCache<K extends object, V>(name: string): WeakCache<K, V> | undefined {
    return this.caches.get(name)
  }

  startMonitoring(intervalMs = 5000): void {
    this.monitor.startMonitoring(intervalMs)
  }

  stopMonitoring(): void {
    this.monitor.stopMonitoring()
  }

  performCleanup(): void {
    console.log('Performing batch memory cleanup...')

    // Clear object pools
    this.pools.forEach(pool => {
      pool.clear()
    })

    // Force garbage collection
    this.monitor.forceGarbageCollection()

    // Small delay to allow GC to complete
    setTimeout(() => {
      const stats = this.monitor.getCurrentStats()
      if (stats) {
        console.log(`Memory cleanup completed. Usage: ${stats.used.toFixed(2)}MB (${(stats.percentage * 100).toFixed(1)}%)`)
      }
    }, 500)
  }

  getMemoryStats(): MemoryStats | null {
    return this.monitor.getCurrentStats()
  }

  addMemoryListener(listener: (stats: MemoryStats) => void): () => void {
    return this.monitor.addListener(listener)
  }

  destroy(): void {
    this.monitor.destroy()
    this.pools.forEach(pool => pool.clear())
    this.caches.forEach(cache => cache.destroy())
    this.pools.clear()
    this.caches.clear()
  }
}

// Memory leak detection utilities
class MemoryLeakDetector {
  private objectCounts = new Map<string, number>()
  private listeners = new Map<string, any[]>()
  private intervals = new Map<string, NodeJS.Timeout>()

  trackObjectType(typeName: string, count: number): void {
    this.objectCounts.set(typeName, count)
  }

  trackEventListeners(elementId: string, listeners: any[]): void {
    this.listeners.set(elementId, listeners)
  }

  trackInterval(id: string, interval: NodeJS.Timeout): void {
    this.intervals.set(id, interval)
  }

  detectLeaks(): {
    objectLeaks: Array<{ type: string; count: number }>
    listenerLeaks: Array<{ element: string; count: number }>
    intervalLeaks: string[]
  } {
    const objectLeaks: Array<{ type: string; count: number }> = []
    const listenerLeaks: Array<{ element: string; count: number }> = []
    const intervalLeaks: string[] = []

    // Check for excessive object growth
    this.objectCounts.forEach((count, type) => {
      if (count > 1000) { // Threshold for concern
        objectLeaks.push({ type, count })
      }
    })

    // Check for unremoved listeners
    this.listeners.forEach((listeners, element) => {
      if (listeners.length > 50) { // Threshold for concern
        listenerLeaks.push({ element, count: listeners.length })
      }
    })

    // Check for uncleaned intervals
    this.intervals.forEach((interval, id) => {
      // If interval still exists, it might be a leak
      intervalLeaks.push(id)
    })

    return { objectLeaks, listenerLeaks, intervalLeaks }
  }

  clearTracking(): void {
    this.objectCounts.clear()
    this.listeners.clear()
    
    // Clean up any tracked intervals
    this.intervals.forEach(interval => {
      clearInterval(interval)
    })
    this.intervals.clear()
  }
}

// Pre-configured pools for common cascade deletion objects
const defaultPools = {
  dependentEntity: new ObjectPool(
    () => ({
      id: '',
      type: '',
      name: '',
      relationshipType: 'direct' as const,
      cascadeAction: 'delete' as const,
      affectedCount: 0,
      children: [],
      metadata: {}
    }),
    200,
    (obj) => {
      obj.id = ''
      obj.type = ''
      obj.name = ''
      obj.relationshipType = 'direct'
      obj.cascadeAction = 'delete'
      obj.affectedCount = 0
      obj.children = []
      obj.metadata = {}
    }
  ),

  deletionWarning: new ObjectPool(
    () => ({
      type: 'data_loss' as const,
      severity: 'medium' as const,
      message: '',
      affectedEntity: undefined,
      details: {}
    }),
    100,
    (obj) => {
      obj.type = 'data_loss'
      obj.severity = 'medium'
      obj.message = ''
      obj.affectedEntity = undefined
      obj.details = {}
    }
  ),

  progressUpdate: new ObjectPool(
    () => ({
      operationId: '',
      phase: 'analyzing' as const,
      currentStep: '',
      totalSteps: 0,
      completedSteps: 0,
      percentage: 0,
      processedEntities: [],
      errors: [],
      warnings: []
    }),
    50,
    (obj) => {
      obj.operationId = ''
      obj.phase = 'analyzing'
      obj.currentStep = ''
      obj.totalSteps = 0
      obj.completedSteps = 0
      obj.percentage = 0
      obj.processedEntities = []
      obj.errors = []
      obj.warnings = []
    }
  )
}

// Singleton memory manager instance
let globalMemoryManager: BatchMemoryManager | null = null

export function getMemoryManager(): BatchMemoryManager {
  if (!globalMemoryManager) {
    globalMemoryManager = new BatchMemoryManager()
    
    // Auto-start monitoring in development
    if (process.env.NODE_ENV === 'development') {
      globalMemoryManager.startMonitoring()
    }
  }
  return globalMemoryManager
}

export function destroyMemoryManager(): void {
  if (globalMemoryManager) {
    globalMemoryManager.destroy()
    globalMemoryManager = null
  }
}

// Export classes and utilities
export {
  ObjectPool,
  WeakCache,
  MemoryMonitor,
  BatchMemoryManager,
  MemoryLeakDetector,
  defaultPools
}

export type { MemoryStats }