/**
 * Virtualized Deletion Impact List Component
 * 
 * High-performance virtual scrolling component for rendering large deletion impact trees
 * Supports 10,000+ items with smooth scrolling and memory management
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { DependentEntity, DeletionImpact, DeletionWarning } from '@/types/cascade-deletion.types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  AlertCircle, 
  Trash2, 
  Database,
  Users,
  BookOpen,
  Music,
  Clock
} from 'lucide-react'

interface FlattenedItem {
  id: string
  entity: DependentEntity
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  parentId?: string
  index: number
  totalChildren: number
}

interface VirtualizedDeletionImpactListProps {
  impact: DeletionImpact
  onExpandToggle?: (entityId: string) => void
  onEntitySelect?: (entity: DependentEntity) => void
  selectedEntityId?: string
  searchQuery?: string
  filterByType?: string[]
  className?: string
  itemHeight?: number
  maxHeight?: number
}

interface ItemRendererProps {
  index: number
  style: React.CSSProperties
  data: {
    items: FlattenedItem[]
    onExpandToggle: (entityId: string) => void
    onEntitySelect?: (entity: DependentEntity) => void
    selectedEntityId?: string
  }
}

const ENTITY_TYPE_ICONS = {
  student: Users,
  teacher: Users,
  orchestra: Music,
  rehearsal: Clock,
  theory_lesson: BookOpen,
  bagrut: BookOpen,
  default: Database
}

const ENTITY_TYPE_COLORS = {
  student: 'bg-blue-50 border-blue-200 text-blue-800',
  teacher: 'bg-green-50 border-green-200 text-green-800',
  orchestra: 'bg-purple-50 border-purple-200 text-purple-800',
  rehearsal: 'bg-orange-50 border-orange-200 text-orange-800',
  theory_lesson: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  bagrut: 'bg-pink-50 border-pink-200 text-pink-800',
  default: 'bg-gray-50 border-gray-200 text-gray-800'
}

const CASCADE_ACTION_COLORS = {
  delete: 'bg-red-100 text-red-800 border-red-200',
  nullify: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  restrict: 'bg-orange-100 text-orange-800 border-orange-200',
  set_default: 'bg-blue-100 text-blue-800 border-blue-200'
}

// Memoized item renderer for optimal performance
const ItemRenderer = React.memo<ItemRendererProps>(({ index, style, data }) => {
  const { items, onExpandToggle, onEntitySelect, selectedEntityId } = data
  const item = items[index]
  
  if (!item) return null

  const { entity, depth, isExpanded, hasChildren } = item
  const IconComponent = ENTITY_TYPE_ICONS[entity.type as keyof typeof ENTITY_TYPE_ICONS] || ENTITY_TYPE_ICONS.default
  const typeColorClass = ENTITY_TYPE_COLORS[entity.type as keyof typeof ENTITY_TYPE_COLORS] || ENTITY_TYPE_COLORS.default
  const actionColorClass = CASCADE_ACTION_COLORS[entity.cascadeAction]
  
  const isSelected = selectedEntityId === entity.id
  const indentWidth = depth * 20

  const handleClick = useCallback(() => {
    onEntitySelect?.(entity)
  }, [onEntitySelect, entity])

  const handleExpandToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      onExpandToggle(entity.id)
    }
  }, [onExpandToggle, entity.id, hasChildren])

  return (
    <div style={style} className="flex items-center">
      <div 
        className={`
          flex items-center w-full px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors
          ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
        `}
        onClick={handleClick}
      >
        {/* Indentation */}
        <div style={{ width: indentWidth }} />
        
        {/* Expand/Collapse Button */}
        <button
          onClick={handleExpandToggle}
          className="flex-shrink-0 w-4 h-4 mr-2 flex items-center justify-center hover:bg-gray-200 rounded"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <div className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Entity Icon */}
        <IconComponent size={16} className="flex-shrink-0 mr-2 text-gray-500" />

        {/* Entity Info */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-medium truncate">{entity.name}</span>
          
          {/* Entity Type Badge */}
          <Badge className={`text-xs ${typeColorClass}`}>
            {entity.type}
          </Badge>

          {/* Cascade Action Badge */}
          <Badge className={`text-xs ${actionColorClass}`}>
            {entity.cascadeAction}
          </Badge>

          {/* Affected Count */}
          {entity.affectedCount > 1 && (
            <Badge variant="secondary" className="text-xs">
              {entity.affectedCount} items
            </Badge>
          )}

          {/* Relationship Type */}
          <Badge 
            variant={entity.relationshipType === 'direct' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {entity.relationshipType}
          </Badge>
        </div>

        {/* Warning Indicator */}
        {entity.cascadeAction === 'delete' && (
          <AlertTriangle size={16} className="flex-shrink-0 text-red-500" />
        )}
      </div>
    </div>
  )
})

ItemRenderer.displayName = 'ItemRenderer'

// Custom hook for flattening and managing tree state
function useFlattenedTree(
  dependents: DependentEntity[], 
  searchQuery?: string,
  filterByType?: string[]
) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  const filteredAndFlattened = useMemo(() => {
    const flattenEntity = (
      entities: DependentEntity[], 
      depth = 0, 
      parentId?: string
    ): FlattenedItem[] => {
      return entities.reduce<FlattenedItem[]>((acc, entity, index) => {
        // Apply filters
        const matchesSearch = !searchQuery || 
          entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entity.type.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesTypeFilter = !filterByType || 
          filterByType.length === 0 || 
          filterByType.includes(entity.type)

        if (!matchesSearch || !matchesTypeFilter) {
          return acc
        }

        const isExpanded = expandedItems.has(entity.id)
        const hasChildren = Boolean(entity.children && entity.children.length > 0)
        
        const flattenedItem: FlattenedItem = {
          id: entity.id,
          entity,
          depth,
          isExpanded,
          hasChildren,
          parentId,
          index,
          totalChildren: entity.children?.length || 0
        }

        acc.push(flattenedItem)

        // Recursively add children if expanded
        if (isExpanded && entity.children) {
          const childItems = flattenEntity(entity.children, depth + 1, entity.id)
          acc.push(...childItems)
        }

        return acc
      }, [])
    }

    return flattenEntity(dependents)
  }, [dependents, expandedItems, searchQuery, filterByType])

  const toggleExpanded = useCallback((entityId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(entityId)) {
        next.delete(entityId)
      } else {
        next.add(entityId)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    const getAllIds = (entities: DependentEntity[]): string[] => {
      return entities.reduce<string[]>((acc, entity) => {
        acc.push(entity.id)
        if (entity.children) {
          acc.push(...getAllIds(entity.children))
        }
        return acc
      }, [])
    }
    
    setExpandedItems(new Set(getAllIds(dependents)))
  }, [dependents])

  const collapseAll = useCallback(() => {
    setExpandedItems(new Set())
  }, [])

  return {
    flattenedItems: filteredAndFlattened,
    toggleExpanded,
    expandAll,
    collapseAll,
    expandedCount: expandedItems.size
  }
}

// Performance monitoring hook
function usePerformanceMonitoring(itemCount: number) {
  const renderCountRef = useRef(0)
  const lastRenderTime = useRef(Date.now())

  useEffect(() => {
    renderCountRef.current += 1
    const now = Date.now()
    const timeSinceLastRender = now - lastRenderTime.current
    lastRenderTime.current = now

    if (process.env.NODE_ENV === 'development' && itemCount > 1000) {
      console.log(`VirtualizedDeletionImpactList: Rendered ${itemCount} items in ${timeSinceLastRender}ms`)
    }
  }, [itemCount])

  return {
    renderCount: renderCountRef.current
  }
}

export const VirtualizedDeletionImpactList: React.FC<VirtualizedDeletionImpactListProps> = ({
  impact,
  onExpandToggle,
  onEntitySelect,
  selectedEntityId,
  searchQuery,
  filterByType,
  className = '',
  itemHeight = 48,
  maxHeight = 600
}) => {
  const {
    flattenedItems,
    toggleExpanded,
    expandAll,
    collapseAll,
    expandedCount
  } = useFlattenedTree(impact.dependents, searchQuery, filterByType)

  const { renderCount } = usePerformanceMonitoring(flattenedItems.length)

  // Custom expand toggle handler that combines internal and external handlers
  const handleExpandToggle = useCallback((entityId: string) => {
    toggleExpanded(entityId)
    onExpandToggle?.(entityId)
  }, [toggleExpanded, onExpandToggle])

  // Memoized item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    items: flattenedItems,
    onExpandToggle: handleExpandToggle,
    onEntitySelect,
    selectedEntityId
  }), [flattenedItems, handleExpandToggle, onEntitySelect, selectedEntityId])

  if (impact.dependents.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <Database size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">No dependent entities found</p>
        <p className="text-sm text-gray-400 mt-1">
          This deletion will not affect any other entities
        </p>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header with controls */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium text-gray-900">
            Deletion Impact ({flattenedItems.length} items)
          </h3>
          {impact.totalAffectedCount > flattenedItems.length && (
            <Badge variant="secondary" className="text-xs">
              +{impact.totalAffectedCount - flattenedItems.length} filtered
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={expandAll}
            disabled={expandedCount === impact.totalAffectedCount}
          >
            Expand All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={collapseAll}
            disabled={expandedCount === 0}
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {impact.warnings.length > 0 && (
        <div className="p-3 border-b bg-yellow-50">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{impact.warnings.length} warnings:</strong>
              <ul className="mt-1 text-sm space-y-1">
                {impact.warnings.slice(0, 3).map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    {warning.message}
                  </li>
                ))}
                {impact.warnings.length > 3 && (
                  <li className="text-yellow-600">
                    +{impact.warnings.length - 3} more warnings
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Virtualized List */}
      <div style={{ height: Math.min(maxHeight, flattenedItems.length * itemHeight) }}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={flattenedItems.length}
              itemSize={itemHeight}
              itemData={itemData}
              overscanCount={10} // Render 10 extra items for smooth scrolling
            >
              {ItemRenderer}
            </List>
          )}
        </AutoSizer>
      </div>

      {/* Footer with performance info (development only) */}
      {process.env.NODE_ENV === 'development' && flattenedItems.length > 100 && (
        <div className="bg-gray-50 px-4 py-2 border-t text-xs text-gray-500">
          Performance: {flattenedItems.length} items rendered, {renderCount} renders
        </div>
      )}
    </div>
  )
}

export default VirtualizedDeletionImpactList