/**
 * Cascade Deletion API Service
 * 
 * Provides comprehensive API integration for cascade deletion operations
 * with progress tracking, real-time updates, and error handling
 */

import {
  DeletionImpact,
  DeletionOperation,
  DeletionProgress,
  CascadeDeletionPreviewRequest,
  CascadeDeletionPreviewResponse,
  CascadeDeletionExecuteRequest,
  CascadeDeletionExecuteResponse,
  CascadeDeletionError,
  ProcessedEntity,
  DeletionError,
} from '@/types/cascade-deletion.types'

// Configuration
const CASCADE_API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 60000, // 60 seconds for deletion operations
  retryAttempts: 3,
  retryDelay: 1000, // 1 second base delay
}

/**
 * HTTP Client specifically for cascade deletion operations
 */
class CascadeDeletionApiClient {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = CASCADE_API_CONFIG.baseUrl
    this.timeout = CASCADE_API_CONFIG.timeout
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    
    let data: any
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      const errorCode = data?.code || `HTTP_${response.status}`
      const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`
      
      throw new CascadeDeletionError(
        errorMessage,
        errorCode,
        data?.operationId,
        data?.phase,
        data?.recoverable || false
      )
    }

    return data
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: this.getAuthHeaders(),
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)
      return await this.handleResponse<T>(response)
    } catch (error) {
      clearTimeout(timeoutId)
      
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new CascadeDeletionError('Request timed out', 'TIMEOUT', undefined, undefined, true)
      }

      // Handle network errors with retry logic
      if (
        retryCount < CASCADE_API_CONFIG.retryAttempts &&
        error instanceof Error &&
        (error.message.includes('fetch') || error.message.includes('network'))
      ) {
        const delay = CASCADE_API_CONFIG.retryDelay * Math.pow(2, retryCount)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.makeRequest<T>(endpoint, options, retryCount + 1)
      }

      throw error
    }
  }

  // ==================== Preview Operations ====================

  async previewCascadeDeletion(
    entityType: string,
    entityId: string,
    options?: {
      includeIndirect?: boolean
      maxDepth?: number
      dryRun?: boolean
    }
  ): Promise<CascadeDeletionPreviewResponse> {
    const request: CascadeDeletionPreviewRequest = {
      entityType,
      entityId,
      options,
    }

    return this.makeRequest<CascadeDeletionPreviewResponse>(
      '/cascade-deletion/preview',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }

  // ==================== Execution Operations ====================

  async executeCascadeDeletion(
    operationId: string,
    options?: {
      skipWarnings?: boolean
      batchSize?: number
      continueOnError?: boolean
    }
  ): Promise<CascadeDeletionExecuteResponse> {
    const request: CascadeDeletionExecuteRequest = {
      operationId,
      options,
    }

    return this.makeRequest<CascadeDeletionExecuteResponse>(
      '/cascade-deletion/execute',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }

  async cancelOperation(operationId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(
      `/cascade-deletion/operations/${operationId}/cancel`,
      {
        method: 'POST',
      }
    )
  }

  // ==================== Progress Tracking ====================

  async getOperationStatus(operationId: string): Promise<DeletionOperation> {
    return this.makeRequest<DeletionOperation>(
      `/cascade-deletion/operations/${operationId}/status`
    )
  }

  async getOperationProgress(operationId: string): Promise<DeletionProgress> {
    return this.makeRequest<DeletionProgress>(
      `/cascade-deletion/operations/${operationId}/progress`
    )
  }

  async listActiveOperations(): Promise<DeletionOperation[]> {
    return this.makeRequest<DeletionOperation[]>('/cascade-deletion/operations/active')
  }

  async getOperationHistory(
    limit = 50,
    offset = 0,
    filters?: {
      entityType?: string
      status?: string
      userId?: string
      startDate?: string
      endDate?: string
    }
  ): Promise<{ operations: DeletionOperation[]; totalCount: number }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...filters,
    })

    return this.makeRequest<{ operations: DeletionOperation[]; totalCount: number }>(
      `/cascade-deletion/operations/history?${params}`
    )
  }

  // ==================== Batch Operations ====================

  async batchPreview(
    entities: Array<{ entityType: string; entityId: string }>
  ): Promise<{ previews: CascadeDeletionPreviewResponse[]; batchId: string }> {
    return this.makeRequest<{ previews: CascadeDeletionPreviewResponse[]; batchId: string }>(
      '/cascade-deletion/batch/preview',
      {
        method: 'POST',
        body: JSON.stringify({ entities }),
      }
    )
  }

  async batchExecute(
    batchId: string,
    options?: {
      skipWarnings?: boolean
      batchSize?: number
      continueOnError?: boolean
    }
  ): Promise<{ operationIds: string[]; batchId: string }> {
    return this.makeRequest<{ operationIds: string[]; batchId: string }>(
      '/cascade-deletion/batch/execute',
      {
        method: 'POST',
        body: JSON.stringify({ batchId, options }),
      }
    )
  }

  // ==================== Configuration ====================

  async getSystemLimits(): Promise<{
    maxConcurrentOperations: number
    maxDepth: number
    maxBatchSize: number
    supportedEntityTypes: string[]
  }> {
    return this.makeRequest<{
      maxConcurrentOperations: number
      maxDepth: number
      maxBatchSize: number
      supportedEntityTypes: string[]
    }>('/cascade-deletion/config/limits')
  }
}

/**
 * Cascade Deletion Service
 * High-level service with caching, state management, and error handling
 */
export class CascadeDeletionService {
  private client: CascadeDeletionApiClient
  private operationCache = new Map<string, DeletionOperation>()
  private progressCache = new Map<string, DeletionProgress>()
  private previewCache = new Map<string, { data: DeletionImpact; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.client = new CascadeDeletionApiClient()
  }

  // ==================== Preview Operations with Caching ====================

  async previewDeletion(
    entityType: string,
    entityId: string,
    options?: { includeIndirect?: boolean; maxDepth?: number }
  ): Promise<DeletionImpact> {
    const cacheKey = `${entityType}:${entityId}:${JSON.stringify(options || {})}`
    const cached = this.previewCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      const response = await this.client.previewCascadeDeletion(entityType, entityId, options)
      
      this.previewCache.set(cacheKey, {
        data: response.impact,
        timestamp: Date.now(),
      })

      return response.impact
    } catch (error) {
      if (error instanceof CascadeDeletionError) {
        throw error
      }
      throw new CascadeDeletionError(
        `Failed to preview deletion: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PREVIEW_FAILED'
      )
    }
  }

  async executeDeletion(
    operationId: string,
    options?: {
      skipWarnings?: boolean
      batchSize?: number
      continueOnError?: boolean
    }
  ): Promise<string> {
    try {
      const response = await this.client.executeCascadeDeletion(operationId, options)
      
      // Clear related caches
      this.operationCache.delete(operationId)
      this.progressCache.delete(operationId)
      
      return response.operationId
    } catch (error) {
      if (error instanceof CascadeDeletionError) {
        throw error
      }
      throw new CascadeDeletionError(
        `Failed to execute deletion: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXECUTION_FAILED',
        operationId
      )
    }
  }

  // ==================== Progress Tracking with Caching ====================

  async getProgress(operationId: string, useCache = true): Promise<DeletionProgress | null> {
    if (useCache && this.progressCache.has(operationId)) {
      const cached = this.progressCache.get(operationId)!
      // Use cache if less than 5 seconds old for active operations
      const age = Date.now() - new Date(cached.lastUpdatedAt).getTime()
      if (age < 5000) {
        return cached
      }
    }

    try {
      const progress = await this.client.getOperationProgress(operationId)
      this.progressCache.set(operationId, progress)
      return progress
    } catch (error) {
      if (error instanceof CascadeDeletionError && error.code === 'HTTP_404') {
        return null // Operation not found
      }
      throw error
    }
  }

  async getOperationStatus(operationId: string, useCache = true): Promise<DeletionOperation | null> {
    if (useCache && this.operationCache.has(operationId)) {
      return this.operationCache.get(operationId)!
    }

    try {
      const operation = await this.client.getOperationStatus(operationId)
      this.operationCache.set(operationId, operation)
      return operation
    } catch (error) {
      if (error instanceof CascadeDeletionError && error.code === 'HTTP_404') {
        return null
      }
      throw error
    }
  }

  // ==================== Batch Operations ====================

  async previewBatch(entities: Array<{ entityType: string; entityId: string }>): Promise<{
    previews: DeletionImpact[]
    batchId: string
    totalAffected: number
    hasWarnings: boolean
    hasErrors: boolean
  }> {
    try {
      const response = await this.client.batchPreview(entities)
      
      const previews = response.previews.map(p => p.impact)
      const totalAffected = previews.reduce((sum, p) => sum + p.totalAffectedCount, 0)
      const hasWarnings = previews.some(p => p.warnings.length > 0)
      const hasErrors = previews.some(p => !p.canDelete)

      return {
        previews,
        batchId: response.batchId,
        totalAffected,
        hasWarnings,
        hasErrors,
      }
    } catch (error) {
      if (error instanceof CascadeDeletionError) {
        throw error
      }
      throw new CascadeDeletionError(
        `Failed to preview batch deletion: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BATCH_PREVIEW_FAILED'
      )
    }
  }

  // ==================== Cache Management ====================

  clearCache(): void {
    this.operationCache.clear()
    this.progressCache.clear()
    this.previewCache.clear()
  }

  clearOperationCache(operationId: string): void {
    this.operationCache.delete(operationId)
    this.progressCache.delete(operationId)
  }

  // ==================== Utility Methods ====================

  async cancelOperation(operationId: string): Promise<boolean> {
    try {
      const response = await this.client.cancelOperation(operationId)
      
      if (response.success) {
        this.clearOperationCache(operationId)
      }
      
      return response.success
    } catch (error) {
      if (error instanceof CascadeDeletionError) {
        throw error
      }
      throw new CascadeDeletionError(
        `Failed to cancel operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CANCEL_FAILED',
        operationId
      )
    }
  }

  async getActiveOperations(): Promise<DeletionOperation[]> {
    try {
      const operations = await this.client.listActiveOperations()
      
      // Update cache with fresh data
      operations.forEach(op => {
        this.operationCache.set(op.id, op)
      })
      
      return operations
    } catch (error) {
      throw new CascadeDeletionError(
        `Failed to fetch active operations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FETCH_ACTIVE_FAILED'
      )
    }
  }

  // ==================== Validation Helpers ====================

  validateEntityForDeletion(entityType: string, entityId: string): boolean {
    if (!entityType || !entityId) {
      return false
    }

    const validEntityTypes = [
      'student',
      'teacher',
      'orchestra',
      'rehearsal',
      'theory_lesson',
      'bagrut'
    ]

    return validEntityTypes.includes(entityType.toLowerCase())
  }

  async getSystemLimits() {
    return this.client.getSystemLimits()
  }

  // ==================== Error Recovery ====================

  async retryOperation(operationId: string): Promise<string> {
    const operation = await this.getOperationStatus(operationId, false)
    
    if (!operation) {
      throw new CascadeDeletionError('Operation not found', 'OPERATION_NOT_FOUND', operationId)
    }

    if (operation.status !== 'failed') {
      throw new CascadeDeletionError('Only failed operations can be retried', 'INVALID_RETRY', operationId)
    }

    // Create new preview and execution for retry
    const preview = await this.client.previewCascadeDeletion(
      operation.entityType,
      operation.entityId
    )

    return this.executeDeletion(preview.operationId)
  }
}

// Singleton instance
export const cascadeDeletionService = new CascadeDeletionService()

// Export for testing
export { CascadeDeletionApiClient }