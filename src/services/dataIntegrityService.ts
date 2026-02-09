/**
 * Data Integrity Management Service
 * 
 * Provides comprehensive API integration for data integrity operations
 * including orphaned reference detection, repair operations, and health monitoring
 */

import {
  DataIntegrityStatus,
  IntegrityIssue,
  RepairOperation,
  DataIntegrityRepairRequest,
  DataIntegrityError,
  UseDataIntegrityReturn,
} from '@/types/cascade-deletion.types'

// Configuration
const INTEGRITY_API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 120000, // 2 minutes for integrity operations
  retryAttempts: 2,
  retryDelay: 2000,
}

/**
 * HTTP Client for Data Integrity Operations
 */
class DataIntegrityApiClient {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = INTEGRITY_API_CONFIG.baseUrl
    this.timeout = INTEGRITY_API_CONFIG.timeout
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
      
      throw new DataIntegrityError(
        errorMessage,
        data?.issueId,
        data?.tableName,
        data?.severity
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
        throw new DataIntegrityError('Request timed out', undefined, undefined, 'high')
      }

      // Handle network errors with retry logic
      if (
        retryCount < INTEGRITY_API_CONFIG.retryAttempts &&
        error instanceof Error &&
        (error.message.includes('fetch') || error.message.includes('network'))
      ) {
        const delay = INTEGRITY_API_CONFIG.retryDelay * Math.pow(2, retryCount)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.makeRequest<T>(endpoint, options, retryCount + 1)
      }

      throw error
    }
  }

  // ==================== Status Operations ====================

  async getIntegrityStatus(): Promise<DataIntegrityStatus> {
    return this.makeRequest<DataIntegrityStatus>('/data-integrity/status')
  }

  async runIntegrityCheck(
    options?: {
      scope?: 'full' | 'quick' | 'targeted'
      tables?: string[]
      includeLongRunning?: boolean
    }
  ): Promise<{ checkId: string; estimatedDuration: number }> {
    return this.makeRequest<{ checkId: string; estimatedDuration: number }>(
      '/data-integrity/check',
      {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }
    )
  }

  async getCheckProgress(checkId: string): Promise<{
    checkId: string
    status: 'running' | 'completed' | 'failed'
    progress: number
    currentTable?: string
    estimatedTimeRemaining?: number
    startedAt: string
    completedAt?: string
    error?: string
  }> {
    return this.makeRequest<{
      checkId: string
      status: 'running' | 'completed' | 'failed'
      progress: number
      currentTable?: string
      estimatedTimeRemaining?: number
      startedAt: string
      completedAt?: string
      error?: string
    }>(`/data-integrity/check/${checkId}/progress`)
  }

  // ==================== Issue Management ====================

  async getIntegrityIssues(
    filters?: {
      type?: string
      severity?: string
      tableName?: string
      canAutoRepair?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<{
    issues: IntegrityIssue[]
    totalCount: number
    summary: {
      bySeverity: Record<string, number>
      byType: Record<string, number>
      byTable: Record<string, number>
      autoRepairableCount: number
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
      issues: IntegrityIssue[]
      totalCount: number
      summary: {
        bySeverity: Record<string, number>
        byType: Record<string, number>
        byTable: Record<string, number>
        autoRepairableCount: number
      }
    }>(`/data-integrity/issues?${params}`)
  }

  async getIssueDetails(issueId: string): Promise<{
    issue: IntegrityIssue
    affectedRecords: any[]
    suggestedActions: Array<{
      action: string
      description: string
      risk: 'low' | 'medium' | 'high'
      reversible: boolean
    }>
    relatedIssues: IntegrityIssue[]
  }> {
    return this.makeRequest<{
      issue: IntegrityIssue
      affectedRecords: any[]
      suggestedActions: Array<{
        action: string
        description: string
        risk: 'low' | 'medium' | 'high'
        reversible: boolean
      }>
      relatedIssues: IntegrityIssue[]
    }>(`/data-integrity/issues/${issueId}`)
  }

  // ==================== Repair Operations ====================

  async repairIssues(request: DataIntegrityRepairRequest): Promise<{
    repairId: string
    operationId: string
    estimatedDuration: number
    affectedRecordsCount: number
  }> {
    return this.makeRequest<{
      repairId: string
      operationId: string
      estimatedDuration: number
      affectedRecordsCount: number
    }>(
      '/data-integrity/repair',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }

  async getRepairProgress(repairId: string): Promise<{
    repairId: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    progress: number
    repairedCount: number
    failedCount: number
    currentIssue?: string
    estimatedTimeRemaining?: number
    startedAt?: string
    completedAt?: string
    errors: string[]
  }> {
    return this.makeRequest<{
      repairId: string
      status: 'pending' | 'in_progress' | 'completed' | 'failed'
      progress: number
      repairedCount: number
      failedCount: number
      currentIssue?: string
      estimatedTimeRemaining?: number
      startedAt?: string
      completedAt?: string
      errors: string[]
    }>(`/data-integrity/repair/${repairId}/progress`)
  }

  async cancelRepair(repairId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(
      `/data-integrity/repair/${repairId}/cancel`,
      {
        method: 'POST',
      }
    )
  }

  // ==================== Batch Operations ====================

  async batchRepair(
    issueGroups: Array<{
      issueIds: string[]
      repairType: 'auto' | 'manual'
      options?: any
    }>
  ): Promise<{
    batchId: string
    repairIds: string[]
    totalAffectedRecords: number
  }> {
    return this.makeRequest<{
      batchId: string
      repairIds: string[]
      totalAffectedRecords: number
    }>(
      '/data-integrity/repair/batch',
      {
        method: 'POST',
        body: JSON.stringify({ issueGroups }),
      }
    )
  }

  // ==================== Monitoring ====================

  async getRepairHistory(
    filters?: {
      startDate?: string
      endDate?: string
      userId?: string
      status?: string
      limit?: number
      offset?: number
    }
  ): Promise<{
    repairs: RepairOperation[]
    totalCount: number
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
      repairs: RepairOperation[]
      totalCount: number
    }>(`/data-integrity/repair/history?${params}`)
  }

  async getIntegrityMetrics(): Promise<{
    dailyIssuesCounts: Array<{ date: string; count: number }>
    issueResolutionRate: number
    averageResolutionTime: number
    topProblematicTables: Array<{
      tableName: string
      issueCount: number
      lastIssue: string
    }>
    integrityTrends: {
      improving: boolean
      changePercent: number
      timeframe: string
    }
  }> {
    return this.makeRequest<{
      dailyIssuesCounts: Array<{ date: string; count: number }>
      issueResolutionRate: number
      averageResolutionTime: number
      topProblematicTables: Array<{
        tableName: string
        issueCount: number
        lastIssue: string
      }>
      integrityTrends: {
        improving: boolean
        changePercent: number
        timeframe: string
      }
    }>('/data-integrity/metrics')
  }
}

/**
 * High-level Data Integrity Service
 */
export class DataIntegrityService {
  private client: DataIntegrityApiClient
  private statusCache: { data: DataIntegrityStatus; timestamp: number } | null = null
  private readonly CACHE_TTL = 2 * 60 * 1000 // 2 minutes

  constructor() {
    this.client = new DataIntegrityApiClient()
  }

  // ==================== Status Operations with Caching ====================

  async getStatus(useCache = true): Promise<DataIntegrityStatus> {
    if (useCache && this.statusCache) {
      const age = Date.now() - this.statusCache.timestamp
      if (age < this.CACHE_TTL) {
        return this.statusCache.data
      }
    }

    try {
      const status = await this.client.getIntegrityStatus()
      
      this.statusCache = {
        data: status,
        timestamp: Date.now(),
      }

      return status
    } catch (error) {
      if (error instanceof DataIntegrityError) {
        throw error
      }
      throw new DataIntegrityError(
        `Failed to get integrity status: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async runCheck(
    scope: 'full' | 'quick' | 'targeted' = 'quick',
    options?: {
      tables?: string[]
      includeLongRunning?: boolean
    }
  ): Promise<string> {
    try {
      const response = await this.client.runIntegrityCheck({
        scope,
        ...options,
      })

      // Clear cache since we're running a new check
      this.statusCache = null

      return response.checkId
    } catch (error) {
      if (error instanceof DataIntegrityError) {
        throw error
      }
      throw new DataIntegrityError(
        `Failed to run integrity check: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // ==================== Issue Management ====================

  async getIssues(filters?: {
    type?: string
    severity?: string
    tableName?: string
    canAutoRepair?: boolean
    limit?: number
    offset?: number
  }) {
    try {
      return await this.client.getIntegrityIssues(filters)
    } catch (error) {
      if (error instanceof DataIntegrityError) {
        throw error
      }
      throw new DataIntegrityError(
        `Failed to get integrity issues: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async getIssueDetails(issueId: string) {
    try {
      return await this.client.getIssueDetails(issueId)
    } catch (error) {
      if (error instanceof DataIntegrityError) {
        throw error
      }
      throw new DataIntegrityError(
        `Failed to get issue details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        issueId
      )
    }
  }

  // ==================== Repair Operations ====================

  async repairIssues(
    issueIds: string[],
    repairType: 'auto' | 'manual' = 'auto',
    options?: {
      batchSize?: number
      continueOnError?: boolean
    }
  ): Promise<string> {
    try {
      const response = await this.client.repairIssues({
        issueIds,
        repairType,
        options,
      })

      return response.repairId
    } catch (error) {
      if (error instanceof DataIntegrityError) {
        throw error
      }
      throw new DataIntegrityError(
        `Failed to repair issues: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async getRepairProgress(repairId: string) {
    try {
      return await this.client.getRepairProgress(repairId)
    } catch (error) {
      if (error instanceof DataIntegrityError) {
        throw error
      }
      throw new DataIntegrityError(
        `Failed to get repair progress: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // ==================== Batch Operations ====================

  async batchRepair(issueGroups: Array<{
    issueIds: string[]
    repairType: 'auto' | 'manual'
    options?: any
  }>) {
    try {
      return await this.client.batchRepair(issueGroups)
    } catch (error) {
      if (error instanceof DataIntegrityError) {
        throw error
      }
      throw new DataIntegrityError(
        `Failed to perform batch repair: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // ==================== Smart Repair Suggestions ====================

  async getSmartRepairSuggestions(
    issues: IntegrityIssue[]
  ): Promise<Array<{
    groupId: string
    issueIds: string[]
    repairType: 'auto' | 'manual'
    description: string
    risk: 'low' | 'medium' | 'high'
    estimatedTime: number
    prerequisites: string[]
  }>> {
    // Analyze issues and group them by type and table for efficient repair
    const groups: { [key: string]: IntegrityIssue[] } = {}
    
    issues.forEach(issue => {
      const key = `${issue.type}_${issue.tableName}`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(issue)
    })

    return Object.entries(groups).map(([key, groupIssues], index) => {
      const [type, tableName] = key.split('_')
      const autoRepairableCount = groupIssues.filter(i => i.canAutoRepair).length
      
      const repairType = autoRepairableCount === groupIssues.length ? 'auto' : 'manual'
      const risk = this.assessRepairRisk(groupIssues)
      
      return {
        groupId: `repair_group_${index}`,
        issueIds: groupIssues.map(i => i.id),
        repairType,
        description: `Repair ${groupIssues.length} ${type} issues in ${tableName}`,
        risk,
        estimatedTime: this.estimateRepairTime(groupIssues),
        prerequisites: this.getRepairPrerequisites(groupIssues),
      }
    })
  }

  private assessRepairRisk(issues: IntegrityIssue[]): 'low' | 'medium' | 'high' {
    const criticalCount = issues.filter(i => i.severity === 'critical').length
    const highCount = issues.filter(i => i.severity === 'high').length
    
    if (criticalCount > 0) return 'high'
    if (highCount > issues.length * 0.5) return 'medium'
    return 'low'
  }

  private estimateRepairTime(issues: IntegrityIssue[]): number {
    // Estimate based on issue count and affected records
    const totalRecords = issues.reduce((sum, issue) => sum + issue.affectedRecords, 0)
    const baseTime = issues.length * 30 // 30 seconds per issue
    const recordTime = Math.ceil(totalRecords / 1000) * 10 // 10 seconds per 1000 records
    
    return baseTime + recordTime
  }

  private getRepairPrerequisites(issues: IntegrityIssue[]): string[] {
    const prerequisites: string[] = []
    
    const hasConstraintIssues = issues.some(i => i.type === 'broken_constraint')
    const hasCriticalIssues = issues.some(i => i.severity === 'critical')
    
    if (hasConstraintIssues) {
      prerequisites.push('Backup affected tables before repair')
    }
    
    if (hasCriticalIssues) {
      prerequisites.push('Review affected records manually')
      prerequisites.push('Notify affected users of potential downtime')
    }
    
    return prerequisites
  }

  // ==================== Monitoring ====================

  async getMetrics() {
    try {
      return await this.client.getIntegrityMetrics()
    } catch (error) {
      throw new DataIntegrityError(
        `Failed to get integrity metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // ==================== Cache Management ====================

  clearCache(): void {
    this.statusCache = null
  }
}

// Singleton instance
export const dataIntegrityService = new DataIntegrityService()

// Export for testing
export { DataIntegrityApiClient }