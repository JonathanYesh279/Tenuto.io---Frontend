/**
 * Cascade Deletion Web Worker
 * 
 * Handles heavy computation tasks for cascade deletion operations including:
 * - Dependency tree calculations
 * - Impact analysis
 * - Batch processing
 * - Memory-efficient tree traversal
 */

import { DependentEntity, DeletionImpact, DeletionWarning } from '../types/cascade-deletion.types'

// Worker message types
interface WorkerMessage {
  id: string
  type: 'CALCULATE_DEPENDENCIES' | 'ANALYZE_IMPACT' | 'PROCESS_BATCH' | 'CANCEL'
  payload: any
}

interface WorkerResponse {
  id: string
  type: 'SUCCESS' | 'ERROR' | 'PROGRESS'
  payload: any
}

// Calculation options
interface DependencyCalculationOptions {
  entityType: string
  entityId: string
  maxDepth: number
  includeIndirect: boolean
  batchSize: number
}

interface ImpactAnalysisOptions {
  dependencies: DependentEntity[]
  warningThresholds: {
    criticalCount: number
    highCount: number
    mediumCount: number
  }
}

interface BatchProcessingOptions {
  items: any[]
  processor: string // Function name to use
  chunkSize: number
  concurrency: number
}

// Mock data structures for demonstration (replace with actual API data)
const MOCK_ENTITY_RELATIONSHIPS = {
  student: {
    direct: ['attendance', 'grades', 'bagrut_results', 'rehearsal_assignments'],
    indirect: ['orchestra_members', 'theory_class_enrollments']
  },
  teacher: {
    direct: ['theory_lessons', 'private_lessons', 'orchestra_conductors'],
    indirect: ['student_grades', 'rehearsal_schedules']
  },
  orchestra: {
    direct: ['rehearsals', 'performances', 'members'],
    indirect: ['attendance_records', 'repertoire']
  },
  rehearsal: {
    direct: ['attendance', 'repertoire_items'],
    indirect: ['student_progress', 'performance_assignments']
  }
}

// Utility functions for dependency calculations
class DependencyCalculator {
  private cache = new Map<string, DependentEntity[]>()
  private readonly maxCacheSize = 1000

  async calculateDependencies(
    options: DependencyCalculationOptions,
    onProgress?: (progress: number) => void
  ): Promise<DependentEntity[]> {
    const { entityType, entityId, maxDepth, includeIndirect, batchSize } = options
    const cacheKey = `${entityType}:${entityId}:${maxDepth}:${includeIndirect}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      onProgress?.(100)
      return this.cache.get(cacheKey)!
    }

    try {
      const dependencies = await this.performDependencyCalculation(
        entityType,
        entityId,
        maxDepth,
        includeIndirect,
        batchSize,
        onProgress
      )

      // Cache result with size limit
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value
        this.cache.delete(firstKey)
      }
      this.cache.set(cacheKey, dependencies)

      return dependencies
    } catch (error) {
      throw new Error(`Dependency calculation failed: ${error}`)
    }
  }

  private async performDependencyCalculation(
    entityType: string,
    entityId: string,
    maxDepth: number,
    includeIndirect: boolean,
    batchSize: number,
    onProgress?: (progress: number) => void
  ): Promise<DependentEntity[]> {
    const visited = new Set<string>()
    const dependencies: DependentEntity[] = []
    const queue: Array<{
      type: string
      id: string
      depth: number
      relationshipType: 'direct' | 'indirect'
      parentId?: string
    }> = []

    // Initialize with direct dependencies
    const relationships = MOCK_ENTITY_RELATIONSHIPS[entityType as keyof typeof MOCK_ENTITY_RELATIONSHIPS]
    if (relationships) {
      relationships.direct.forEach((depType, index) => {
        queue.push({
          type: depType,
          id: `${depType}-${entityId}`,
          depth: 1,
          relationshipType: 'direct'
        })
      })

      if (includeIndirect) {
        relationships.indirect.forEach((depType) => {
          queue.push({
            type: depType,
            id: `${depType}-${entityId}`,
            depth: 1,
            relationshipType: 'indirect'
          })
        })
      }
    }

    let processedCount = 0
    const totalEstimated = queue.length

    while (queue.length > 0 && processedCount < 10000) { // Safety limit
      const batch = queue.splice(0, batchSize)
      
      for (const item of batch) {
        if (visited.has(item.id) || item.depth > maxDepth) {
          continue
        }

        visited.add(item.id)
        processedCount++

        // Simulate entity lookup and dependency creation
        const dependentEntity = await this.createDependentEntity(item)
        dependencies.push(dependentEntity)

        // Add children if not at max depth
        if (item.depth < maxDepth) {
          const childDeps = await this.getChildDependencies(item.type, item.id)
          childDeps.forEach(child => {
            queue.push({
              ...child,
              depth: item.depth + 1,
              parentId: item.id
            })
          })
        }

        // Report progress
        if (processedCount % 10 === 0) {
          const progress = Math.min(100, (processedCount / Math.max(totalEstimated, processedCount)) * 100)
          onProgress?.(progress)
        }
      }

      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    onProgress?.(100)
    return dependencies
  }

  private async createDependentEntity(item: {
    type: string
    id: string
    depth: number
    relationshipType: 'direct' | 'indirect'
    parentId?: string
  }): Promise<DependentEntity> {
    // Simulate entity creation with realistic data
    const affectedCount = Math.floor(Math.random() * 50) + 1
    const cascadeAction = this.determineCascadeAction(item.type, item.relationshipType)
    
    return {
      id: item.id,
      type: item.type,
      name: `${item.type.replace('_', ' ')} ${item.id.split('-').pop()}`,
      relationshipType: item.relationshipType,
      cascadeAction,
      affectedCount,
      children: [], // Will be populated by tree structure
      metadata: {
        tableName: `${item.type}s`,
        foreignKey: `${item.type}_id`,
        constraint: `fk_${item.type}_cascade`
      }
    }
  }

  private async getChildDependencies(type: string, id: string): Promise<Array<{
    type: string
    id: string
    relationshipType: 'direct' | 'indirect'
  }>> {
    // Simulate getting child dependencies
    const childTypes = this.getChildTypesForEntity(type)
    return childTypes.map((childType, index) => ({
      type: childType,
      id: `${childType}-${id}-${index}`,
      relationshipType: Math.random() > 0.7 ? 'indirect' : 'direct' as 'direct' | 'indirect'
    }))
  }

  private getChildTypesForEntity(type: string): string[] {
    const childMappings: Record<string, string[]> = {
      attendance: ['attendance_records', 'makeup_sessions'],
      grades: ['grade_entries', 'rubric_scores'],
      bagrut_results: ['exam_scores', 'project_submissions'],
      rehearsal_assignments: ['part_assignments', 'practice_logs'],
      theory_lessons: ['lesson_plans', 'homework_assignments'],
      orchestra_members: ['seating_arrangements', 'part_distributions']
    }
    
    return childMappings[type] || []
  }

  private determineCascadeAction(
    entityType: string, 
    relationshipType: 'direct' | 'indirect'
  ): 'delete' | 'nullify' | 'restrict' | 'set_default' {
    // Business logic for determining cascade actions
    const criticalTypes = ['grades', 'bagrut_results', 'attendance_records']
    const nullifyTypes = ['rehearsal_assignments', 'practice_logs']
    
    if (criticalTypes.includes(entityType)) {
      return relationshipType === 'direct' ? 'restrict' : 'nullify'
    }
    
    if (nullifyTypes.includes(entityType)) {
      return 'nullify'
    }
    
    return relationshipType === 'direct' ? 'delete' : 'nullify'
  }

  clearCache(): void {
    this.cache.clear()
  }
}

class ImpactAnalyzer {
  analyzeImpact(
    dependencies: DependentEntity[],
    options: ImpactAnalysisOptions,
    onProgress?: (progress: number) => void
  ): DeletionImpact {
    const { warningThresholds } = options
    const warnings: DeletionWarning[] = []
    let totalAffectedCount = 0
    let maxDepth = 0
    let canDelete = true
    let requiresConfirmation = false

    // Analyze each dependency
    dependencies.forEach((dep, index) => {
      totalAffectedCount += dep.affectedCount
      
      // Calculate depth through tree traversal
      const depth = this.calculateDepth(dep)
      maxDepth = Math.max(maxDepth, depth)

      // Generate warnings based on business rules
      const depWarnings = this.generateWarningsForEntity(dep, warningThresholds)
      warnings.push(...depWarnings)

      // Check if deletion should be restricted
      if (dep.cascadeAction === 'restrict') {
        canDelete = false
      }

      // Check if confirmation is required
      if (dep.affectedCount >= warningThresholds.mediumCount || dep.cascadeAction === 'delete') {
        requiresConfirmation = true
      }

      // Report progress
      if (onProgress && index % 50 === 0) {
        const progress = (index / dependencies.length) * 100
        onProgress(progress)
      }
    })

    onProgress?.(100)

    return {
      entityType: 'unknown', // Will be set by caller
      entityId: 'unknown', // Will be set by caller
      dependents: this.buildDependencyTree(dependencies),
      totalAffectedCount,
      cascadeDepth: maxDepth,
      warnings,
      canDelete,
      requiresConfirmation
    }
  }

  private calculateDepth(entity: DependentEntity, visited = new Set<string>()): number {
    if (visited.has(entity.id)) {
      return 0 // Circular reference protection
    }
    
    visited.add(entity.id)
    
    if (!entity.children || entity.children.length === 0) {
      return 1
    }

    const childDepths = entity.children.map(child => 
      this.calculateDepth(child, new Set(visited))
    )
    
    return 1 + Math.max(...childDepths)
  }

  private generateWarningsForEntity(
    entity: DependentEntity,
    thresholds: ImpactAnalysisOptions['warningThresholds']
  ): DeletionWarning[] {
    const warnings: DeletionWarning[] = []

    // High impact warning
    if (entity.affectedCount >= thresholds.criticalCount) {
      warnings.push({
        type: 'data_loss',
        severity: 'critical',
        message: `Deleting this ${entity.type} will affect ${entity.affectedCount} records`,
        affectedEntity: {
          type: entity.type,
          id: entity.id,
          name: entity.name
        }
      })
    } else if (entity.affectedCount >= thresholds.highCount) {
      warnings.push({
        type: 'data_loss',
        severity: 'high',
        message: `High impact: ${entity.affectedCount} records will be affected`,
        affectedEntity: {
          type: entity.type,
          id: entity.id,
          name: entity.name
        }
      })
    }

    // Cascade action warnings
    if (entity.cascadeAction === 'restrict') {
      warnings.push({
        type: 'integrity_risk',
        severity: 'critical',
        message: `Cannot delete: ${entity.name} has protected dependencies`,
        affectedEntity: {
          type: entity.type,
          id: entity.id,
          name: entity.name
        }
      })
    }

    // Active dependencies warning
    if (entity.relationshipType === 'direct' && entity.cascadeAction === 'delete') {
      warnings.push({
        type: 'active_dependencies',
        severity: 'medium',
        message: `Direct dependency ${entity.name} will be permanently deleted`,
        affectedEntity: {
          type: entity.type,
          id: entity.id,
          name: entity.name
        }
      })
    }

    return warnings
  }

  private buildDependencyTree(flatDependencies: DependentEntity[]): DependentEntity[] {
    // Build hierarchical tree from flat list
    const entityMap = new Map<string, DependentEntity>()
    const rootEntities: DependentEntity[] = []

    // First pass: create map
    flatDependencies.forEach(entity => {
      entityMap.set(entity.id, { ...entity, children: [] })
    })

    // Second pass: build relationships
    flatDependencies.forEach(entity => {
      const node = entityMap.get(entity.id)!
      
      // For now, treat all as root level (in real implementation, use parent relationships)
      rootEntities.push(node)
    })

    return rootEntities
  }
}

class BatchProcessor {
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchProcessingOptions,
    onProgress?: (progress: number) => void
  ): Promise<R[]> {
    const { chunkSize, concurrency } = options
    const results: R[] = []
    const chunks = this.chunkArray(items, chunkSize)
    
    let processedChunks = 0
    
    // Process chunks with controlled concurrency
    for (let i = 0; i < chunks.length; i += concurrency) {
      const concurrentChunks = chunks.slice(i, i + concurrency)
      
      const chunkPromises = concurrentChunks.map(async (chunk) => {
        const chunkResults: R[] = []
        
        for (const item of chunk) {
          try {
            const result = await processor(item)
            chunkResults.push(result)
          } catch (error) {
            console.error('Batch processing error:', error)
            // Continue processing other items
          }
          
          // Yield control periodically
          if (chunkResults.length % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0))
          }
        }
        
        return chunkResults
      })
      
      const chunkResults = await Promise.all(chunkPromises)
      results.push(...chunkResults.flat())
      
      processedChunks += concurrentChunks.length
      const progress = (processedChunks / chunks.length) * 100
      onProgress?.(progress)
    }
    
    return results
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

// Worker state
const dependencyCalculator = new DependencyCalculator()
const impactAnalyzer = new ImpactAnalyzer()
const batchProcessor = new BatchProcessor()
const activeOperations = new Map<string, boolean>()

// Message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data

  try {
    activeOperations.set(id, true)

    switch (type) {
      case 'CALCULATE_DEPENDENCIES': {
        const options: DependencyCalculationOptions = payload
        const dependencies = await dependencyCalculator.calculateDependencies(
          options,
          (progress) => {
            if (activeOperations.get(id)) {
              self.postMessage({
                id,
                type: 'PROGRESS',
                payload: { progress, stage: 'calculating_dependencies' }
              } as WorkerResponse)
            }
          }
        )
        
        if (activeOperations.get(id)) {
          self.postMessage({
            id,
            type: 'SUCCESS',
            payload: { dependencies }
          } as WorkerResponse)
        }
        break
      }

      case 'ANALYZE_IMPACT': {
        const options: ImpactAnalysisOptions = payload
        const impact = impactAnalyzer.analyzeImpact(
          options.dependencies,
          options,
          (progress) => {
            if (activeOperations.get(id)) {
              self.postMessage({
                id,
                type: 'PROGRESS',
                payload: { progress, stage: 'analyzing_impact' }
              } as WorkerResponse)
            }
          }
        )
        
        if (activeOperations.get(id)) {
          self.postMessage({
            id,
            type: 'SUCCESS',
            payload: { impact }
          } as WorkerResponse)
        }
        break
      }

      case 'PROCESS_BATCH': {
        const options: BatchProcessingOptions = payload
        // For demo purposes, just process items with identity function
        const processor = (item: any) => Promise.resolve(item)
        
        const results = await batchProcessor.processBatch(
          options.items,
          processor,
          options,
          (progress) => {
            if (activeOperations.get(id)) {
              self.postMessage({
                id,
                type: 'PROGRESS',
                payload: { progress, stage: 'processing_batch' }
              } as WorkerResponse)
            }
          }
        )
        
        if (activeOperations.get(id)) {
          self.postMessage({
            id,
            type: 'SUCCESS',
            payload: { results }
          } as WorkerResponse)
        }
        break
      }

      case 'CANCEL': {
        activeOperations.set(id, false)
        self.postMessage({
          id,
          type: 'SUCCESS',
          payload: { cancelled: true }
        } as WorkerResponse)
        break
      }

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'ERROR',
      payload: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    } as WorkerResponse)
  } finally {
    activeOperations.delete(id)
  }
}

// Cleanup on worker termination
self.addEventListener('beforeunload', () => {
  dependencyCalculator.clearCache()
  activeOperations.clear()
})

export {} // Make this a module