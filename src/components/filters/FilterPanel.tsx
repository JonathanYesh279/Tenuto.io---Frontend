import React, { useState, useEffect } from 'react'
import { Filter, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterGroup {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'range' | 'date' | 'boolean'
  options?: FilterOption[]
  min?: number
  max?: number
  defaultValue?: any
}

export interface FilterState {
  [key: string]: any
}

interface FilterPanelProps {
  filters: FilterGroup[]
  values: FilterState
  onChange: (values: FilterState) => void
  onReset?: () => void
  variant?: 'sidebar' | 'horizontal' | 'modal'
  collapsible?: boolean
  className?: string
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values,
  onChange,
  onReset,
  variant = 'sidebar',
  collapsible = false,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Initialize expanded groups
  useEffect(() => {
    setExpandedGroups(new Set(filters.map(filter => filter.key)))
  }, [filters])

  const handleFilterChange = (filterKey: string, value: any) => {
    const newValues = { ...values, [filterKey]: value }
    onChange(newValues)
  }

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
  }

  const getActiveFilterCount = () => {
    return Object.values(values).filter(value => {
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value !== ''
      if (typeof value === 'boolean') return value
      return value !== null && value !== undefined
    }).length
  }

  const handleReset = () => {
    const resetValues: FilterState = {}
    filters.forEach(filter => {
      if (filter.type === 'multiselect') {
        resetValues[filter.key] = []
      } else if (filter.type === 'boolean') {
        resetValues[filter.key] = false
      } else {
        resetValues[filter.key] = filter.defaultValue || ''
      }
    })
    onChange(resetValues)
    onReset?.()
  }

  const renderSelectFilter = (filter: FilterGroup) => (
    <select
      value={values[filter.key] || ''}
      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-right font-reisinger-yonatan"
      dir="rtl"
    >
      <option value="">הכל</option>
      {filter.options?.map(option => (
        <option key={option.value} value={option.value}>
          {option.label} {option.count && `(${option.count})`}
        </option>
      ))}
    </select>
  )

  const renderMultiSelectFilter = (filter: FilterGroup) => {
    const selectedValues = values[filter.key] || []
    
    return (
      <div className="space-y-2">
        {filter.options?.map(option => (
          <label key={option.value} className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={(e) => {
                const newSelected = e.target.checked
                  ? [...selectedValues, option.value]
                  : selectedValues.filter((v: string) => v !== option.value)
                handleFilterChange(filter.key, newSelected)
              }}
              className="ml-2 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="flex-1 text-right font-reisinger-yonatan">
              {option.label}
              {option.count && <span className="text-gray-500 mr-1">({option.count})</span>}
            </span>
          </label>
        ))}
      </div>
    )
  }

  const renderRangeFilter = (filter: FilterGroup) => {
    const value = values[filter.key] || { min: filter.min, max: filter.max }
    
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 space-x-reverse">
          <input
            type="number"
            placeholder="מ"
            value={value.min || ''}
            onChange={(e) => handleFilterChange(filter.key, { ...value, min: Number(e.target.value) })}
            className="w-full px-2 py-1 text-sm border border-gray-200 rounded text-right"
            min={filter.min}
            max={filter.max}
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="עד"
            value={value.max || ''}
            onChange={(e) => handleFilterChange(filter.key, { ...value, max: Number(e.target.value) })}
            className="w-full px-2 py-1 text-sm border border-gray-200 rounded text-right"
            min={filter.min}
            max={filter.max}
          />
        </div>
      </div>
    )
  }

  const renderDateFilter = (filter: FilterGroup) => (
    <input
      type="date"
      value={values[filter.key] || ''}
      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
    />
  )

  const renderBooleanFilter = (filter: FilterGroup) => (
    <label className="flex items-center text-sm">
      <input
        type="checkbox"
        checked={values[filter.key] || false}
        onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
        className="ml-2 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
      />
      <span className="font-reisinger-yonatan">{filter.label}</span>
    </label>
  )

  const renderFilter = (filter: FilterGroup) => {
    const isExpanded = expandedGroups.has(filter.key)
    
    return (
      <div key={filter.key} className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleGroup(filter.key)}
          className="w-full flex items-center justify-between py-3 text-right hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center text-sm font-medium text-gray-900 font-reisinger-yonatan">
            {filter.label}
            {values[filter.key] && (
              <span className="mr-2 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
                {Array.isArray(values[filter.key]) ? values[filter.key].length : '1'}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        {isExpanded && (
          <div className="pb-3 px-1">
            {filter.type === 'select' && renderSelectFilter(filter)}
            {filter.type === 'multiselect' && renderMultiSelectFilter(filter)}
            {filter.type === 'range' && renderRangeFilter(filter)}
            {filter.type === 'date' && renderDateFilter(filter)}
            {filter.type === 'boolean' && renderBooleanFilter(filter)}
          </div>
        )}
      </div>
    )
  }

  const activeFilterCount = getActiveFilterCount()

  if (variant === 'horizontal') {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`} dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">מסננים</h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4 ml-1" />
              איפוס
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filters.map(filter => (
            <div key={filter.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-reisinger-yonatan">
                {filter.label}
              </label>
              {filter.type === 'select' && renderSelectFilter(filter)}
              {filter.type === 'multiselect' && (
                <div className="max-h-32 overflow-y-auto">
                  {renderMultiSelectFilter(filter)}
                </div>
              )}
              {filter.type === 'range' && renderRangeFilter(filter)}
              {filter.type === 'date' && renderDateFilter(filter)}
              {filter.type === 'boolean' && renderBooleanFilter(filter)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">מסננים</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              title="איפוס מסננים"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      
      {/* Filter Content */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="space-y-1">
            {filters.map(renderFilter)}
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterPanel