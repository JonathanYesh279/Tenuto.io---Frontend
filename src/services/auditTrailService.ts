/**
 * Audit Trail Integration Service
 * 
 * Provides comprehensive API integration for audit trail operations
 * including query, filtering, rollback, and export functionality
 */

import {
  AuditLogEntry,
  AuditTrailQuery,
  AuditTrailResponse,
  AuditTrailExportRequest,
  AuditTrailExportResponse,
  RollbackOperation,
  AuditChange,
  AuditTrailError,
  UseAuditTrailReturn,
} from '@/types/cascade-deletion.types'

// Configuration
const AUDIT_API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 60000, // 1 minute for audit operations
  retryAttempts: 2,
  retryDelay: 1000,
  exportTimeout: 300000, // 5 minutes for export operations
}

/**
 * HTTP Client for Audit Trail Operations
 */
class AuditTrailApiClient {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = AUDIT_API_CONFIG.baseUrl
    this.timeout = AUDIT_API_CONFIG.timeout
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
      
      throw new AuditTrailError(
        errorMessage,
        data?.entryId,
        data?.rollbackable || false
      )
    }

    return data
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout?: number,
    retryCount = 0
  ): Promise<T> {
    const requestTimeout = timeout || this.timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout)

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
        throw new AuditTrailError('Request timed out')
      }

      // Handle network errors with retry logic
      if (
        retryCount < AUDIT_API_CONFIG.retryAttempts &&
        error instanceof Error &&
        (error.message.includes('fetch') || error.message.includes('network'))
      ) {
        const delay = AUDIT_API_CONFIG.retryDelay * Math.pow(2, retryCount)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.makeRequest<T>(endpoint, options, timeout, retryCount + 1)
      }

      throw error
    }
  }

  // ==================== Query Operations ====================

  async queryAuditTrail(query: AuditTrailQuery): Promise<AuditTrailResponse> {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    return this.makeRequest<AuditTrailResponse>(`/audit-trail?${params}`)
  }

  async getAuditEntry(entryId: string): Promise<{
    entry: AuditLogEntry
    relatedEntries: AuditLogEntry[]
    rollbackPreview?: {
      affectedEntries: string[]
      estimatedImpact: {
        entityType: string
        entityId: string
        changeType: string
      }[]
      warnings: string[]
    }
  }> {
    return this.makeRequest<{
      entry: AuditLogEntry
      relatedEntries: AuditLogEntry[]
      rollbackPreview?: {
        affectedEntries: string[]
        estimatedImpact: {
          entityType: string
          entityId: string
          changeType: string
        }[]
        warnings: string[]
      }
    }>(`/audit-trail/${entryId}`)
  }

  async getAuditTrailSummary(
    filters?: Pick<AuditTrailQuery, 'startDate' | 'endDate' | 'entityType' | 'userId'>
  ): Promise<{
    totalEntries: number
    entriesByAction: Record<string, number>
    entriesByEntityType: Record<string, number>
    entriesByUser: Record<string, number>
    rollbackableEntries: number
    timeRange: {
      startDate: string
      endDate: string
    }
  }> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }

    return this.makeRequest<{
      totalEntries: number
      entriesByAction: Record<string, number>
      entriesByEntityType: Record<string, number>
      entriesByUser: Record<string, number>
      rollbackableEntries: number
      timeRange: {
        startDate: string
        endDate: string
      }
    }>(`/audit-trail/summary?${params}`)
  }

  // ==================== Rollback Operations ====================

  async previewRollback(entryId: string): Promise<{
    operationId: string
    affectedEntries: AuditLogEntry[]
    estimatedImpact: {
      entityType: string
      entityId: string
      changeType: 'revert' | 'cascade_revert' | 'dependency_check'
      description: string
    }[]
    warnings: string[]
    risks: Array<{
      type: 'data_loss' | 'integrity_violation' | 'dependency_conflict'
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
    }>
    canRollback: boolean
    requiresConfirmation: boolean
  }> {
    return this.makeRequest<{
      operationId: string
      affectedEntries: AuditLogEntry[]
      estimatedImpact: {
        entityType: string
        entityId: string
        changeType: 'revert' | 'cascade_revert' | 'dependency_check'
        description: string
      }[]
      warnings: string[]
      risks: Array<{
        type: 'data_loss' | 'integrity_violation' | 'dependency_conflict'
        severity: 'low' | 'medium' | 'high' | 'critical'
        description: string
      }>
      canRollback: boolean
      requiresConfirmation: boolean
    }>(`/audit-trail/${entryId}/rollback/preview`)
  }

  async executeRollback(
    operationId: string,
    options?: {
      skipWarnings?: boolean
      confirmationToken?: string
    }
  ): Promise<{
    rollbackId: string
    status: 'started' | 'queued'
    estimatedDuration?: number
    websocketChannel: string
  }> {
    return this.makeRequest<{
      rollbackId: string
      status: 'started' | 'queued'
      estimatedDuration?: number
      websocketChannel: string
    }>(
      '/audit-trail/rollback',
      {
        method: 'POST',
        body: JSON.stringify({ operationId, options }),
      }
    )
  }

  async getRollbackStatus(rollbackId: string): Promise<RollbackOperation> {
    return this.makeRequest<RollbackOperation>(`/audit-trail/rollback/${rollbackId}/status`)
  }

  async getRollbackProgress(rollbackId: string): Promise<{
    rollbackId: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    progress: number
    currentStep: string
    totalSteps: number
    processedEntries: number
    failedEntries: number
    estimatedTimeRemaining?: number
    startedAt?: string
    completedAt?: string
    errors: string[]
  }> {
    return this.makeRequest<{
      rollbackId: string
      status: 'pending' | 'in_progress' | 'completed' | 'failed'
      progress: number
      currentStep: string
      totalSteps: number
      processedEntries: number
      failedEntries: number
      estimatedTimeRemaining?: number
      startedAt?: string
      completedAt?: string
      errors: string[]
    }>(`/audit-trail/rollback/${rollbackId}/progress`)
  }

  async cancelRollback(rollbackId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(
      `/audit-trail/rollback/${rollbackId}/cancel`,
      {
        method: 'POST',
      }
    )
  }

  // ==================== Batch Operations ====================

  async batchRollback(
    entryIds: string[],
    options?: {
      rollbackType: 'individual' | 'grouped'
      skipWarnings?: boolean
    }
  ): Promise<{
    batchId: string
    rollbackIds: string[]
    estimatedDuration: number
  }> {
    return this.makeRequest<{
      batchId: string
      rollbackIds: string[]
      estimatedDuration: number
    }>(
      '/audit-trail/rollback/batch',
      {
        method: 'POST',
        body: JSON.stringify({ entryIds, options }),
      }
    )
  }

  // ==================== Export Operations ====================

  async exportAuditTrail(request: AuditTrailExportRequest): Promise<AuditTrailExportResponse> {
    return this.makeRequest<AuditTrailExportResponse>(
      '/audit-trail/export',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      AUDIT_API_CONFIG.exportTimeout
    )
  }

  async getExportStatus(exportId: string): Promise<{
    exportId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    downloadUrl?: string
    expiresAt?: string
    recordCount?: number
    fileSize?: number
    error?: string
  }> {
    return this.makeRequest<{
      exportId: string
      status: 'pending' | 'processing' | 'completed' | 'failed'
      progress: number
      downloadUrl?: string
      expiresAt?: string
      recordCount?: number
      fileSize?: number
      error?: string
    }>(`/audit-trail/export/${exportId}/status`)
  }

  async downloadExport(exportId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/audit-trail/export/${exportId}/download`, {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new AuditTrailError(`Export download failed: ${response.statusText}`)
    }

    return response.blob()
  }

  // ==================== Search and Filtering ====================

  async searchAuditTrail(
    searchTerm: string,
    filters?: AuditTrailQuery
  ): Promise<AuditTrailResponse> {
    const params = new URLSearchParams({ search: searchTerm })
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }

    return this.makeRequest<AuditTrailResponse>(`/audit-trail/search?${params}`)
  }

  async getFilterOptions(): Promise<{
    actions: string[]
    entityTypes: string[]
    users: Array<{ id: string; name: string }>
    dateRanges: Array<{
      label: string
      startDate: string
      endDate: string
    }>
  }> {
    return this.makeRequest<{
      actions: string[]
      entityTypes: string[]
      users: Array<{ id: string; name: string }>
      dateRanges: Array<{
        label: string
        startDate: string
        endDate: string
      }>
    }>('/audit-trail/filter-options')
  }

  // ==================== Analytics ====================

  async getAuditAnalytics(
    timeframe: 'day' | 'week' | 'month' | 'year',
    filters?: Pick<AuditTrailQuery, 'startDate' | 'endDate' | 'entityType' | 'userId'>
  ): Promise<{
    timeline: Array<{
      date: string
      count: number
      actionBreakdown: Record<string, number>
    }>
    topUsers: Array<{
      userId: string
      userName: string
      actionCount: number
    }>
    topActions: Array<{
      action: string
      count: number
      percentage: number
    }>
    entityTypeDistribution: Array<{
      entityType: string
      count: number
      percentage: number
    }>
    rollbackStats: {
      total: number
      successful: number
      failed: number
      successRate: number
    }
  }> {
    const params = new URLSearchParams({ timeframe })
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }

    return this.makeRequest<{
      timeline: Array<{
        date: string
        count: number
        actionBreakdown: Record<string, number>
      }>
      topUsers: Array<{
        userId: string
        userName: string
        actionCount: number
      }>
      topActions: Array<{
        action: string
        count: number
        percentage: number
      }>
      entityTypeDistribution: Array<{
        entityType: string
        count: number
        percentage: number
      }>
      rollbackStats: {
        total: number
        successful: number
        failed: number
        successRate: number
      }
    }>(`/audit-trail/analytics?${params}`)
  }
}

/**
 * High-level Audit Trail Service
 */
export class AuditTrailService {
  private client: AuditTrailApiClient
  private queryCache = new Map<string, { data: AuditTrailResponse; timestamp: number }>()
  private readonly CACHE_TTL = 30 * 1000 // 30 seconds

  constructor() {
    this.client = new AuditTrailApiClient()
  }

  // ==================== Query Operations with Caching ====================

  async queryAuditTrail(query: AuditTrailQuery, useCache = true): Promise<AuditTrailResponse> {
    const cacheKey = JSON.stringify(query)
    
    if (useCache && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data
      }
    }

    try {
      const data = await this.client.queryAuditTrail(query)
      
      this.queryCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      })

      return data
    } catch (error) {
      if (error instanceof AuditTrailError) {
        throw error
      }
      throw new AuditTrailError(
        `Failed to query audit trail: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async searchAuditTrail(
    searchTerm: string,
    filters?: AuditTrailQuery
  ): Promise<AuditTrailResponse> {
    try {
      return await this.client.searchAuditTrail(searchTerm, filters)
    } catch (error) {
      if (error instanceof AuditTrailError) {
        throw error
      }
      throw new AuditTrailError(
        `Failed to search audit trail: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // ==================== Entry Operations ====================

  async getEntry(entryId: string) {
    try {
      return await this.client.getAuditEntry(entryId)
    } catch (error) {
      if (error instanceof AuditTrailError) {
        throw error
      }
      throw new AuditTrailError(
        `Failed to get audit entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        entryId
      )
    }
  }

  async canRollback(entry: AuditLogEntry): Promise<boolean> {
    if (!entry.rollbackable) {
      return false
    }

    // Additional business logic for rollback eligibility
    const entryAge = Date.now() - new Date(entry.timestamp).getTime()
    const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days

    if (entryAge > maxAge) {
      return false
    }

    // Check if entry involves cascade deletions or critical system changes
    const criticalActions = ['cascade_delete', 'system_update', 'schema_change']
    if (criticalActions.includes(entry.action)) {
      return false
    }

    return true
  }

  // ==================== Rollback Operations ====================

  async previewRollback(entryId: string) {
    try {
      return await this.client.previewRollback(entryId)
    } catch (error) {
      if (error instanceof AuditTrailError) {
        throw error
      }
      throw new AuditTrailError(
        `Failed to preview rollback: ${error instanceof Error ? error.message : 'Unknown error'}`,
        entryId
      )
    }
  }

  async executeRollback(
    operationId: string,
    options?: {
      skipWarnings?: boolean
      confirmationToken?: string
    }
  ) {
    try {
      return await this.client.executeRollback(operationId, options)
    } catch (error) {
      if (error instanceof AuditTrailError) {
        throw error
      }
      throw new AuditTrailError(
        `Failed to execute rollback: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // ==================== Export Operations ====================

  async exportAuditTrail(
    query: AuditTrailQuery,
    format: 'json' | 'csv' | 'excel',
    options?: {
      includeChanges?: boolean
      maxRecords?: number
    }
  ): Promise<string> {
    try {
      const response = await this.client.exportAuditTrail({
        query,
        format,
        includeChanges: options?.includeChanges,
      })

      return response.exportId
    } catch (error) {
      if (error instanceof AuditTrailError) {
        throw error
      }
      throw new AuditTrailError(
        `Failed to export audit trail: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async downloadExport(exportId: string, filename?: string): Promise<void> {
    try {
      const blob = await this.client.downloadExport(exportId)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `audit-trail-export-${exportId}.zip`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      if (error instanceof AuditTrailError) {
        throw error
      }
      throw new AuditTrailError(
        `Failed to download export: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // ==================== Analytics ====================

  async getAnalytics(
    timeframe: 'day' | 'week' | 'month' | 'year' = 'week',
    filters?: Pick<AuditTrailQuery, 'startDate' | 'endDate' | 'entityType' | 'userId'>
  ) {
    try {
      return await this.client.getAuditAnalytics(timeframe, filters)
    } catch (error) {
      if (error instanceof AuditTrailError) {
        throw error
      }
      throw new AuditTrailError(
        `Failed to get audit analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async getSummary(
    filters?: Pick<AuditTrailQuery, 'startDate' | 'endDate' | 'entityType' | 'userId'>
  ) {
    try {
      return await this.client.getAuditTrailSummary(filters)
    } catch (error) {
      if (error instanceof AuditTrailError) {
        throw error
      }
      throw new AuditTrailError(
        `Failed to get audit summary: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // ==================== Utility Functions ====================

  async getFilterOptions() {
    try {
      return await this.client.getFilterOptions()
    } catch (error) {
      throw new AuditTrailError(
        `Failed to get filter options: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // ==================== Cache Management ====================

  clearCache(): void {
    this.queryCache.clear()
  }

  clearQueryCache(query: AuditTrailQuery): void {
    const cacheKey = JSON.stringify(query)
    this.queryCache.delete(cacheKey)
  }
}

// Singleton instance
export const auditTrailService = new AuditTrailService()

// Export for testing
export { AuditTrailApiClient }