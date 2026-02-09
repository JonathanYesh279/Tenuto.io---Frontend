/**
 * Optimized Cascade Deletion Demo Component
 * 
 * Demonstrates high-performance cascade deletion UI with:
 * - Virtual scrolling for 10,000+ records
 * - Web Worker background processing
 * - Memory management and cleanup
 * - Real-time performance monitoring
 * - Progressive loading strategies
 */

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  MemoryStick,
  Monitor,
  Play,
  Square,
  Trash2,
  Zap
} from 'lucide-react'

import VirtualizedDeletionImpactList from './VirtualizedDeletionImpactList'
import useOptimizedCascadeDeletion from '@/hooks/useOptimizedCascadeDeletion'
import usePerformanceMonitoring from '@/hooks/usePerformanceMonitoring'
import { useBatchProcessing, useMemoryCleanup } from '@/hooks/useBatchProcessing'
import { DependentEntity, DeletionImpact } from '@/types/cascade-deletion.types'

// Mock data generation for testing
function generateMockDeletionImpact(entityType: string, entityId: string, itemCount: number): DeletionImpact {
  const entityTypes = ['student', 'teacher', 'orchestra', 'rehearsal', 'theory_lesson', 'bagrut']
  const cascadeActions = ['delete', 'nullify', 'restrict', 'set_default'] as const
  
  const generateDependentEntity = (depth = 0, maxDepth = 3): DependentEntity => {
    const type = entityTypes[Math.floor(Math.random() * entityTypes.length)]
    const id = `${type}-${Math.random().toString(36).substr(2, 9)}`
    const hasChildren = depth < maxDepth && Math.random() > 0.6
    
    return {
      id,
      type,
      name: `${type.replace('_', ' ')} ${id.split('-').pop()}`,
      relationshipType: Math.random() > 0.7 ? 'indirect' : 'direct',
      cascadeAction: cascadeActions[Math.floor(Math.random() * cascadeActions.length)],
      affectedCount: Math.floor(Math.random() * 50) + 1,
      children: hasChildren ? Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => 
        generateDependentEntity(depth + 1, maxDepth)
      ) : [],
      metadata: {
        tableName: `${type}s`,
        foreignKey: `${type}_id`,
        constraint: `fk_${type}_cascade`
      }
    }
  }

  const dependents = Array.from({ length: itemCount }, () => generateDependentEntity())
  
  const totalAffected = dependents.reduce((sum, dep) => sum + dep.affectedCount, 0)
  const hasRestrictions = dependents.some(dep => dep.cascadeAction === 'restrict')
  
  return {
    entityType,
    entityId,
    entityName: `${entityType} ${entityId}`,
    dependents,
    totalAffectedCount: totalAffected,
    cascadeDepth: 3,
    warnings: [
      {
        type: 'data_loss',
        severity: 'high',
        message: `This deletion will permanently remove ${totalAffected} related records`,
        details: { affectedCount: totalAffected }
      },
      ...(hasRestrictions ? [{
        type: 'integrity_risk' as const,
        severity: 'critical' as const,
        message: 'Some dependencies cannot be deleted due to constraints',
        details: { hasRestrictions: true }
      }] : [])
    ],
    canDelete: !hasRestrictions,
    requiresConfirmation: totalAffected > 10
  }
}

const OptimizedCascadeDeletionDemo: React.FC = () => {
  // State management
  const [selectedEntity, setSelectedEntity] = useState({ type: 'student', id: 'student-001' })
  const [itemCount, setItemCount] = useState(1000)
  const [mockImpact, setMockImpact] = useState<DeletionImpact | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterByType, setFilterByType] = useState<string[]>([])
  const [selectedEntityId, setSelectedEntityId] = useState<string>()

  // Performance settings
  const [enableWebWorker, setEnableWebWorker] = useState(true)
  const [enableCaching, setEnableCaching] = useState(true)
  const [memoryLimitMB, setMemoryLimitMB] = useState(100)

  // Hooks
  const {
    previewDeletion,
    executeDeletion,
    executeBatchDeletion,
    activeOperations,
    isExecuting,
    workerStatus,
    getMemoryStats,
    forceMemoryCleanup
  } = useOptimizedCascadeDeletion({
    enableWebWorker,
    enableCaching,
    memoryLimitMB,
    onProgress: (progress) => {
      console.log('Deletion progress:', progress)
    },
    onMemoryWarning: (stats) => {
      console.warn('Memory warning:', stats)
    }
  })

  const {
    startMonitoring,
    stopMonitoring,
    isMonitoring,
    metrics,
    alerts,
    resetMetrics,
    healthScore,
    isPerformant
  } = usePerformanceMonitoring({
    trackRenders: true,
    trackMemory: true
  })

  const {
    startMonitoring: startMemoryMonitoring,
    stopMonitoring: stopMemoryMonitoring,
    getCurrentUsage: getCurrentMemoryUsage
  } = useMemoryCleanup()

  const { processBatch, progress: batchProgress, isProcessing } = useBatchProcessing()

  // Generate mock data
  const generateMockData = useCallback(async () => {
    setIsGenerating(true)
    try {
      // Simulate some processing time for large datasets
      if (itemCount > 5000) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      const impact = generateMockDeletionImpact(
        selectedEntity.type,
        selectedEntity.id,
        itemCount
      )
      
      setMockImpact(impact)
    } catch (error) {
      console.error('Failed to generate mock data:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedEntity, itemCount])

  // Initialize mock data
  useEffect(() => {
    generateMockData()
  }, [generateMockData])

  // Performance monitoring
  useEffect(() => {
    if (isMonitoring) {
      startMemoryMonitoring()
      return () => {
        stopMemoryMonitoring()
      }
    }
  }, [isMonitoring, startMemoryMonitoring, stopMemoryMonitoring])

  // Handle entity selection in virtual list
  const handleEntitySelect = useCallback((entity: DependentEntity) => {
    setSelectedEntityId(entity.id)
  }, [])

  // Handle batch deletion demo
  const handleBatchDeletionDemo = useCallback(async () => {
    if (!mockImpact) return

    const entities = mockImpact.dependents.slice(0, 50).map(dep => ({
      entityType: dep.type,
      entityId: dep.id
    }))

    try {
      await executeBatchDeletion(entities, (progress) => {
        console.log('Batch progress:', progress)
      })
    } catch (error) {
      console.error('Batch deletion failed:', error)
    }
  }, [mockImpact, executeBatchDeletion])

  // Memory stats
  const memoryStats = getMemoryStats()
  const currentMemoryUsage = getCurrentMemoryUsage()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Optimized Cascade Deletion Demo</h1>
          <p className="text-muted-foreground mt-1">
            High-performance deletion UI with virtual scrolling, Web Workers, and memory management
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={workerStatus === 'ready' ? 'default' : 'secondary'}>
            <Zap className="w-3 h-3 mr-1" />
            Worker: {workerStatus}
          </Badge>
          <Badge variant={isPerformant ? 'default' : 'destructive'}>
            <Activity className="w-3 h-3 mr-1" />
            Health: {Math.round(healthScore)}%
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="deletion" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deletion">Deletion Preview</TabsTrigger>
          <TabsTrigger value="performance">Performance Monitor</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        {/* Deletion Preview Tab */}
        <TabsContent value="deletion" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Deletion Configuration</CardTitle>
              <CardDescription>
                Configure the entity and data size for testing cascade deletion performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="entity-type">Entity Type</Label>
                  <Select value={selectedEntity.type} onValueChange={(type) => 
                    setSelectedEntity(prev => ({ ...prev, type }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="orchestra">Orchestra</SelectItem>
                      <SelectItem value="rehearsal">Rehearsal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="entity-id">Entity ID</Label>
                  <Input
                    id="entity-id"
                    value={selectedEntity.id}
                    onChange={(e) => setSelectedEntity(prev => ({ ...prev, id: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="item-count">Impact Items ({itemCount.toLocaleString()})</Label>
                  <Input
                    id="item-count"
                    type="number"
                    min="100"
                    max="50000"
                    step="100"
                    value={itemCount}
                    onChange={(e) => setItemCount(Number(e.target.value))}
                  />
                </div>

                <div className="flex flex-col gap-2 justify-end">
                  <Button onClick={generateMockData} disabled={isGenerating} className="w-full">
                    {isGenerating ? 'Generating...' : 'Generate Data'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBatchDeletionDemo}
                    disabled={!mockImpact || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Demo Batch Delete'}
                  </Button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search">Search Dependencies</Label>
                  <Input
                    id="search"
                    placeholder="Search by name or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="filter">Filter by Type</Label>
                  <Select onValueChange={(type) => 
                    setFilterByType(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select types to filter..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="orchestra">Orchestra</SelectItem>
                      <SelectItem value="rehearsal">Rehearsal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filterByType.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {filterByType.map(type => (
                    <Badge key={type} variant="secondary" className="cursor-pointer" onClick={() =>
                      setFilterByType(prev => prev.filter(t => t !== type))
                    }>
                      {type} ×
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Batch Progress */}
          {batchProgress && (
            <Card>
              <CardHeader>
                <CardTitle>Batch Processing Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={batchProgress.percentage} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{batchProgress.processedItems} / {batchProgress.totalItems} processed</span>
                    <span>{batchProgress.stage}</span>
                    <span>{batchProgress.successCount} success, {batchProgress.errorCount} errors</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Virtual List */}
          {mockImpact ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Deletion Impact Analysis
                  <Badge variant="outline">
                    {mockImpact.totalAffectedCount.toLocaleString()} items
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Virtualized list rendering {mockImpact.dependents.length.toLocaleString()} 
                  dependencies with smooth scrolling
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mockImpact.warnings.length > 0 && (
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{mockImpact.warnings.length} warning(s):</strong>
                      <ul className="mt-1 list-disc list-inside">
                        {mockImpact.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">{warning.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <VirtualizedDeletionImpactList
                  impact={mockImpact}
                  onEntitySelect={handleEntitySelect}
                  selectedEntityId={selectedEntityId}
                  searchQuery={searchQuery}
                  filterByType={filterByType.length > 0 ? filterByType : undefined}
                  maxHeight={600}
                  className="border-t"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Generate mock data to see the deletion impact preview</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Monitor Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Monitoring Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Performance Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  onClick={isMonitoring ? stopMonitoring : startMonitoring}
                  variant={isMonitoring ? "destructive" : "default"}
                  size="sm"
                >
                  {isMonitoring ? (
                    <>
                      <Square className="w-4 h-4 mr-1" />
                      Stop Monitoring
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Start Monitoring
                    </>
                  )}
                </Button>
                <Button onClick={resetMetrics} variant="outline" size="sm">
                  Reset Metrics
                </Button>
                <Button onClick={forceMemoryCleanup} variant="outline" size="sm">
                  <MemoryStick className="w-4 h-4 mr-1" />
                  Force GC
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Render Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Render Time</span>
                      <span className="text-sm font-mono">{metrics.averageRenderTime.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Slow Renders</span>
                      <span className="text-sm font-mono">{metrics.slowRenders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Framerate</span>
                      <span className="text-sm font-mono">{Math.round(metrics.framerate)} FPS</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Current</span>
                      <span className="text-sm font-mono">{metrics.currentMemoryUsage.toFixed(1)}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Peak</span>
                      <span className="text-sm font-mono">{metrics.peakMemoryUsage.toFixed(1)}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Trend</span>
                      <Badge 
                        variant={
                          metrics.memoryTrend === 'increasing' ? 'destructive' :
                          metrics.memoryTrend === 'decreasing' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {metrics.memoryTrend}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total</span>
                      <span className="text-sm font-mono">{metrics.totalOperations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="text-sm font-mono">
                        {metrics.totalOperations > 0 
                          ? Math.round((metrics.successfulOperations / metrics.totalOperations) * 100)
                          : 100}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Time</span>
                      <span className="text-sm font-mono">{metrics.averageOperationTime.toFixed(2)}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Performance Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Performance Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alerts.slice(-10).map((alert) => (
                    <Alert 
                      key={alert.id} 
                      variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                      className="py-2"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        <span className="font-medium">[{alert.type}]</span> {alert.message}
                        <span className="text-muted-foreground ml-2">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Settings</CardTitle>
              <CardDescription>
                Configure performance optimization features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Web Worker Processing</Label>
                      <p className="text-xs text-muted-foreground">
                        Use Web Workers for heavy computations
                      </p>
                    </div>
                    <Switch checked={enableWebWorker} onCheckedChange={setEnableWebWorker} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Enable Caching</Label>
                      <p className="text-xs text-muted-foreground">
                        Cache API responses and computations
                      </p>
                    </div>
                    <Switch checked={enableCaching} onCheckedChange={setEnableCaching} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="memory-limit">Memory Limit (MB)</Label>
                    <Input
                      id="memory-limit"
                      type="number"
                      min="50"
                      max="500"
                      value={memoryLimitMB}
                      onChange={(e) => setMemoryLimitMB(Number(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Memory limit for automatic cleanup
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">System Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Worker Status:</span>
                    <div className="font-mono mt-1">{workerStatus}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Memory Usage:</span>
                    <div className="font-mono mt-1">
                      {memoryStats ? `${memoryStats.used.toFixed(1)}MB` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Active Operations:</span>
                    <div className="font-mono mt-1">{activeOperations.length}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Health Score:</span>
                    <div className="font-mono mt-1">
                      {Math.round(healthScore)}%
                      {isPerformant ? (
                        <CheckCircle2 className="inline w-3 h-3 ml-1 text-green-500" />
                      ) : (
                        <AlertTriangle className="inline w-3 h-3 ml-1 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default OptimizedCascadeDeletionDemo