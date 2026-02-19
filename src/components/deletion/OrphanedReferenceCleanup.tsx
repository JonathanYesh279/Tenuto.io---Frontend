/**
 * Orphaned Reference Cleanup Interface
 * 
 * Batch operations for cleaning up orphaned references
 * with detailed impact analysis and batch processing
 */

import React, { useState } from 'react'
import { 
  Trash2, 
  Database, 
  CheckSquare, 
  Square, 
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Search,
  ChevronDown,
  Play,
  Pause,
  X
} from 'lucide-react'
import { OrphanedReference, BatchOperation } from './types'
import { ProgressBar } from '../feedback/ProgressIndicators'
import { Card } from '../ui/Card'
import Modal from '../ui/Modal'

interface OrphanedReferenceCleanupProps {
  orphanedReferences: OrphanedReference[]
  onCleanup?: (selected: OrphanedReference[], options: CleanupOptions) => Promise<void>
  onRefresh?: () => void
  isLoading?: boolean
  className?: string
}

interface CleanupOptions {
  dryRun: boolean
  createBackup: boolean
  batchSize: number
  maxConcurrent: number
}

interface FilterState {
  table: string
  canCleanup: boolean | null
  cleanupMethod: string
  minCount: number
}

const OrphanedReferenceCleanup: React.FC<OrphanedReferenceCleanupProps> = ({
  orphanedReferences,
  onCleanup,
  onRefresh,
  isLoading = false,
  className = ''
}) => {
  const [selectedReferences, setSelectedReferences] = useState<Set<string>>(new Set())
  const [showCleanupModal, setShowCleanupModal] = useState(false)
  const [cleanupOptions, setCleanupOptions] = useState<CleanupOptions>({
    dryRun: true,
    createBackup: true,
    batchSize: 100,
    maxConcurrent: 3
  })
  const [currentOperation, setCurrentOperation] = useState<BatchOperation | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    table: '',
    canCleanup: null,
    cleanupMethod: '',
    minCount: 0
  })
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredReferences = orphanedReferences.filter(ref => {
    if (filters.table && !ref.table.toLowerCase().includes(filters.table.toLowerCase())) {
      return false
    }
    if (filters.canCleanup !== null && ref.canCleanup !== filters.canCleanup) {
      return false
    }
    if (filters.cleanupMethod && ref.cleanupMethod !== filters.cleanupMethod) {
      return false
    }
    if (ref.count < filters.minCount) {
      return false
    }
    if (searchQuery && !ref.table.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ref.field.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const selectableReferences = filteredReferences.filter(ref => ref.canCleanup)
  const selectedCount = selectedReferences.size
  const totalOrphanedCount = filteredReferences.reduce((sum, ref) => sum + ref.count, 0)
  const selectedOrphanedCount = filteredReferences
    .filter(ref => selectedReferences.has(`${ref.table}.${ref.field}`))
    .reduce((sum, ref) => sum + ref.count, 0)

  const handleSelectAll = () => {
    if (selectedCount === selectableReferences.length) {
      setSelectedReferences(new Set())
    } else {
      const newSelected = new Set(selectableReferences.map(ref => `${ref.table}.${ref.field}`))
      setSelectedReferences(newSelected)
    }
  }

  const handleSelectReference = (ref: OrphanedReference) => {
    const key = `${ref.table}.${ref.field}`
    const newSelected = new Set(selectedReferences)
    
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    
    setSelectedReferences(newSelected)
  }

  const handleCleanup = async () => {
    if (!onCleanup || selectedReferences.size === 0) return

    const selectedRefs = filteredReferences.filter(ref => 
      selectedReferences.has(`${ref.table}.${ref.field}`)
    )

    try {
      await onCleanup(selectedRefs, cleanupOptions)
      setShowCleanupModal(false)
      setSelectedReferences(new Set())
      onRefresh?.()
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }

  const getCleanupMethodLabel = (method: string) => {
    switch (method) {
      case 'delete': return 'מחיקה'
      case 'nullify': return 'איפוס'
      case 'default_value': return 'ערך ברירת מחדל'
      default: return method
    }
  }

  const getCleanupMethodColor = (method: string) => {
    switch (method) {
      case 'delete': return 'text-red-600 bg-red-50'
      case 'nullify': return 'text-yellow-600 bg-yellow-50'
      case 'default_value': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const uniqueTables = [...new Set(orphanedReferences.map(ref => ref.table))]
  const uniqueMethods = [...new Set(orphanedReferences.map(ref => ref.cleanupMethod))]

  return (
    <div className={`space-y-4 ${className}`} dir="rtl">
      {/* Header with Actions */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-gray-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
                  ניקוי הפניות יתומות
                </h3>
                <p className="text-sm text-gray-600 font-reisinger-yonatan">
                  {totalOrphanedCount.toLocaleString()} הפניות יתומות ב-{filteredReferences.length} טבלאות
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="font-reisinger-yonatan">רענון</span>
                </button>
              )}

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="font-reisinger-yonatan">סינון</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="חיפוש בטבלאות ושדות..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-reisinger-yonatan"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    טבלה
                  </label>
                  <select
                    value={filters.table}
                    onChange={(e) => setFilters(prev => ({ ...prev, table: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 font-reisinger-yonatan"
                  >
                    <option value="">כל הטבלאות</option>
                    {uniqueTables.map(table => (
                      <option key={table} value={table}>{table}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    שיטת ניקוי
                  </label>
                  <select
                    value={filters.cleanupMethod}
                    onChange={(e) => setFilters(prev => ({ ...prev, cleanupMethod: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 font-reisinger-yonatan"
                  >
                    <option value="">כל השיטות</option>
                    {uniqueMethods.map(method => (
                      <option key={method} value={method}>{getCleanupMethodLabel(method)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    ניתן לניקוי
                  </label>
                  <select
                    value={filters.canCleanup === null ? '' : filters.canCleanup.toString()}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      canCleanup: e.target.value === '' ? null : e.target.value === 'true' 
                    }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 font-reisinger-yonatan"
                  >
                    <option value="">הכל</option>
                    <option value="true">כן</option>
                    <option value="false">לא</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    מספר מינימלי
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.minCount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minCount: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 font-reisinger-yonatan"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selection Actions */}
          {selectableReferences.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedCount === selectableReferences.length ? 
                    <CheckSquare className="w-4 h-4" /> : 
                    <Square className="w-4 h-4" />
                  }
                  <span className="font-reisinger-yonatan">
                    {selectedCount === selectableReferences.length ? 'בטל בחירת הכל' : 'בחר הכל'}
                  </span>
                </button>

                {selectedCount > 0 && (
                  <span className="text-sm text-gray-600 font-reisinger-yonatan">
                    נבחרו {selectedCount} פריטים ({selectedOrphanedCount.toLocaleString()} הפניות)
                  </span>
                )}
              </div>

              {selectedCount > 0 && (
                <button
                  onClick={() => setShowCleanupModal(true)}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-reisinger-yonatan">נקה נבחרים</span>
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Current Operation */}
      {currentOperation && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {currentOperation.status === 'running' ? 
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" /> :
                    <Database className="w-4 h-4 text-blue-600" />
                  }
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 font-reisinger-yonatan">
                    ניקוי בתהליך
                  </h4>
                  <p className="text-sm text-blue-700 font-reisinger-yonatan">
                    {currentOperation.processedItems} מתוך {currentOperation.totalItems} פריטים
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setCurrentOperation(null)}
                className="text-blue-600 hover:text-blue-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ProgressBar
              value={currentOperation.progress}
              showPercentage={true}
              color="blue"
              animated={currentOperation.status === 'running'}
            />

            {currentOperation.results && currentOperation.status === 'completed' && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-green-600">
                    {currentOperation.results.successful}
                  </span>
                  <span className="text-gray-600 font-reisinger-yonatan">הצליחו</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-red-600">
                    {currentOperation.results.failed}
                  </span>
                  <span className="text-gray-600 font-reisinger-yonatan">נכשלו</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-yellow-600">
                    {currentOperation.results.skipped}
                  </span>
                  <span className="text-gray-600 font-reisinger-yonatan">דולגו</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* References List */}
      <div className="space-y-2">
        {filteredReferences.map((ref, index) => {
          const key = `${ref.table}.${ref.field}`
          const isSelected = selectedReferences.has(key)
          
          return (
            <Card 
              key={index} 
              className={`transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
              hover={ref.canCleanup}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {ref.canCleanup && (
                    <button
                      onClick={() => handleSelectReference(ref)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {isSelected ? 
                        <CheckSquare className="w-5 h-5" /> : 
                        <Square className="w-5 h-5" />
                      }
                    </button>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 font-reisinger-yonatan">
                        {ref.table}.{ref.field}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full font-reisinger-yonatan">
                        {ref.count.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-reisinger-yonatan">
                      {ref.canCleanup ? 'ניתן לניקוי אוטומטי' : 'דרוש טיפול ידני'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${getCleanupMethodColor(ref.cleanupMethod)}
                  `}>
                    <span className="font-reisinger-yonatan">
                      {getCleanupMethodLabel(ref.cleanupMethod)}
                    </span>
                  </div>

                  {!ref.canCleanup && (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredReferences.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 font-reisinger-yonatan mb-2">
            לא נמצאו הפניות יתומות
          </h3>
          <p className="text-gray-500 font-reisinger-yonatan">
            המסד נקי מהפניות יתומות בהתאם לקריטריונים שנבחרו
          </p>
        </Card>
      )}

      {/* Cleanup Confirmation Modal */}
      <Modal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        title="אישור ניקוי הפניות יתומות"
        maxWidth="lg"
      >
        <div className="space-y-6 p-6" dir="rtl">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold font-reisinger-yonatan">אזהרה</span>
            </div>
            <p className="text-sm text-yellow-700 font-reisinger-yonatan">
              פעולה זו תנקה {selectedOrphanedCount.toLocaleString()} הפניות יתומות מ-{selectedCount} טבלאות.
              הפעולה בלתי הפיכה ללא גיבוי.
            </p>
          </div>

          {/* Cleanup Options */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 font-reisinger-yonatan">אפשרויות ניקוי</h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cleanupOptions.dryRun}
                  onChange={(e) => setCleanupOptions(prev => ({ ...prev, dryRun: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-reisinger-yonatan">הרצה יבשה (בדיקה בלבד)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cleanupOptions.createBackup}
                  onChange={(e) => setCleanupOptions(prev => ({ ...prev, createBackup: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-reisinger-yonatan">יצירת גיבוי לפני הניקוי</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                  גודל אצווה
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={cleanupOptions.batchSize}
                  onChange={(e) => setCleanupOptions(prev => ({ 
                    ...prev, 
                    batchSize: parseInt(e.target.value) || 100 
                  }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 font-reisinger-yonatan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                  מקסימום מקבילים
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={cleanupOptions.maxConcurrent}
                  onChange={(e) => setCleanupOptions(prev => ({ 
                    ...prev, 
                    maxConcurrent: parseInt(e.target.value) || 3 
                  }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 font-reisinger-yonatan"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowCleanupModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-reisinger-yonatan"
            >
              ביטול
            </button>
            <button
              onClick={handleCleanup}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-reisinger-yonatan"
            >
              {cleanupOptions.dryRun ? 'הרץ בדיקה' : 'נקה כעת'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default OrphanedReferenceCleanup