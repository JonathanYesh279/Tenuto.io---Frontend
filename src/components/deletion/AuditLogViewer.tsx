/**
 * Audit Log Viewer Component
 * 
 * Comprehensive audit log interface with search, filtering,
 * and rollback capabilities
 */

import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Filter, 
  Download, 
  RotateCcw, 
  Eye, 
  Calendar,
  User,
  Database,
  Clock,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowUpDown,
  FileText
} from 'lucide-react'
import { AuditLogEntry } from './types'
import { Card } from '../ui/Card'
import Modal from '../ui/Modal'

interface AuditLogViewerProps {
  entries: AuditLogEntry[]
  onRollback?: (entryId: string) => Promise<void>
  onExport?: (filters: FilterState) => void
  isLoading?: boolean
  className?: string
}

interface FilterState {
  dateRange: {
    start: Date | null
    end: Date | null
  }
  action: string
  entityType: string
  userId: string
  canRollback: boolean | null
  searchQuery: string
}

interface SortState {
  field: 'timestamp' | 'action' | 'entityType' | 'userName'
  direction: 'asc' | 'desc'
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  entries,
  onRollback,
  onExport,
  isLoading = false,
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: null, end: null },
    action: '',
    entityType: '',
    userId: '',
    canRollback: null,
    searchQuery: ''
  })
  const [sort, setSort] = useState<SortState>({
    field: 'timestamp',
    direction: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [showRollbackModal, setShowRollbackModal] = useState(false)

  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries.filter(entry => {
      // Date range filter
      if (filters.dateRange.start && entry.timestamp < filters.dateRange.start) return false
      if (filters.dateRange.end && entry.timestamp > filters.dateRange.end) return false
      
      // Action filter
      if (filters.action && entry.action !== filters.action) return false
      
      // Entity type filter
      if (filters.entityType && entry.entityType !== filters.entityType) return false
      
      // User filter
      if (filters.userId && entry.userId !== filters.userId) return false
      
      // Rollback filter
      if (filters.canRollback !== null && entry.canRollback !== filters.canRollback) return false
      
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        if (!entry.entityName.toLowerCase().includes(query) &&
            !entry.userName.toLowerCase().includes(query) &&
            !entry.action.toLowerCase().includes(query) &&
            !entry.entityType.toLowerCase().includes(query)) {
          return false
        }
      }
      
      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sort.field) {
        case 'timestamp':
          aValue = a.timestamp.getTime()
          bValue = b.timestamp.getTime()
          break
        case 'action':
          aValue = a.action
          bValue = b.action
          break
        case 'entityType':
          aValue = a.entityType
          bValue = b.entityType
          break
        case 'userName':
          aValue = a.userName
          bValue = b.userName
          break
        default:
          return 0
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [entries, filters, sort])

  const toggleEntryExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId)
    } else {
      newExpanded.add(entryId)
    }
    setExpandedEntries(newExpanded)
  }

  const handleSort = (field: SortState['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleRollback = async () => {
    if (!selectedEntry || !onRollback) return
    
    try {
      await onRollback(selectedEntry.id)
      setShowRollbackModal(false)
      setSelectedEntry(null)
    } catch (error) {
      console.error('Rollback failed:', error)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete':
      case 'cascade_delete':
        return <Trash2 className="w-4 h-4 text-red-500" />
      case 'rollback':
        return <RotateCcw className="w-4 h-4 text-blue-500" />
      case 'orphan_cleanup':
        return <Database className="w-4 h-4 text-orange-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getActionLabel = (action: string) => {
    const labels = {
      delete: 'מחיקה',
      cascade_delete: 'מחיקה מדורגת',
      orphan_cleanup: 'ניקוי הפניות יתומות',
      rollback: 'שחזור'
    }
    return labels[action as keyof typeof labels] || action
  }

  const getEntityTypeLabel = (entityType: string) => {
    const labels = {
      student: 'תלמיד',
      teacher: 'מורה',
      lesson: 'שיעור',
      orchestra: 'תזמורת',
      theory_class: 'שיעור תיאוריה',
      document: 'מסמך'
    }
    return labels[entityType as keyof typeof labels] || entityType
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  const uniqueActions = [...new Set(entries.map(e => e.action))]
  const uniqueEntityTypes = [...new Set(entries.map(e => e.entityType))]
  const uniqueUsers = [...new Set(entries.map(e => ({ id: e.userId, name: e.userName })))]

  return (
    <div className={`space-y-4 ${className}`} dir="rtl">
      {/* Header with Actions */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-gray-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
                  יומן ביקורת
                </h3>
                <p className="text-sm text-gray-600 font-reisinger-yonatan">
                  {filteredAndSortedEntries.length} מתוך {entries.length} רשומות
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {onExport && (
                <button
                  onClick={() => onExport(filters)}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="font-reisinger-yonatan">יצוא</span>
                </button>
              )}

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="font-reisinger-yonatan">סינון</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש בשם ישות, משתמש או פעולה..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-reisinger-yonatan"
            />
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    תאריך התחלה
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { 
                        ...prev.dateRange, 
                        start: e.target.value ? new Date(e.target.value) : null 
                      }
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-reisinger-yonatan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    תאריך סיום
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { 
                        ...prev.dateRange, 
                        end: e.target.value ? new Date(e.target.value) : null 
                      }
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-reisinger-yonatan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    פעולה
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-reisinger-yonatan"
                  >
                    <option value="">כל הפעולות</option>
                    {uniqueActions.map(action => (
                      <option key={action} value={action}>{getActionLabel(action)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    סוג ישות
                  </label>
                  <select
                    value={filters.entityType}
                    onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-reisinger-yonatan"
                  >
                    <option value="">כל הסוגים</option>
                    {uniqueEntityTypes.map(type => (
                      <option key={type} value={type}>{getEntityTypeLabel(type)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    משתמש
                  </label>
                  <select
                    value={filters.userId}
                    onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-reisinger-yonatan"
                  >
                    <option value="">כל המשתמשים</option>
                    {uniqueUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    ניתן לשחזור
                  </label>
                  <select
                    value={filters.canRollback === null ? '' : filters.canRollback.toString()}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      canRollback: e.target.value === '' ? null : e.target.value === 'true' 
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-reisinger-yonatan"
                  >
                    <option value="">הכל</option>
                    <option value="true">כן</option>
                    <option value="false">לא</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setFilters({
                  dateRange: { start: null, end: null },
                  action: '',
                  entityType: '',
                  userId: '',
                  canRollback: null,
                  searchQuery: ''
                })}
                className="text-sm text-blue-600 hover:text-blue-700 font-reisinger-yonatan"
              >
                נקה סינונים
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Sort Headers */}
      <Card className="bg-gray-50">
        <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700">
          <div className="col-span-3">
            <button
              onClick={() => handleSort('timestamp')}
              className="flex items-center gap-1 hover:text-gray-900 font-reisinger-yonatan"
            >
              <Clock className="w-4 h-4" />
              <span>תאריך ושעה</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
          
          <div className="col-span-2">
            <button
              onClick={() => handleSort('action')}
              className="flex items-center gap-1 hover:text-gray-900 font-reisinger-yonatan"
            >
              <span>פעולה</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
          
          <div className="col-span-2">
            <button
              onClick={() => handleSort('entityType')}
              className="flex items-center gap-1 hover:text-gray-900 font-reisinger-yonatan"
            >
              <span>סוג ישות</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
          
          <div className="col-span-3">
            <span className="font-reisinger-yonatan">שם ישות</span>
          </div>
          
          <div className="col-span-2">
            <button
              onClick={() => handleSort('userName')}
              className="flex items-center gap-1 hover:text-gray-900 font-reisinger-yonatan"
            >
              <User className="w-4 h-4" />
              <span>משתמש</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </Card>

      {/* Entries List */}
      <div className="space-y-2">
        {filteredAndSortedEntries.map((entry) => {
          const isExpanded = expandedEntries.has(entry.id)
          
          return (
            <Card key={entry.id} className="transition-all hover:shadow-card-hover">
              <div className="space-y-4">
                {/* Main Row */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 flex items-center gap-2">
                    <button
                      onClick={() => toggleEntryExpansion(entry.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </button>
                    <span className="text-sm text-gray-600 font-reisinger-yonatan">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      {getActionIcon(entry.action)}
                      <span className="text-sm font-medium font-reisinger-yonatan">
                        {getActionLabel(entry.action)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600 font-reisinger-yonatan">
                      {getEntityTypeLabel(entry.entityType)}
                    </span>
                  </div>
                  
                  <div className="col-span-3">
                    <span className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                      {entry.entityName}
                    </span>
                  </div>
                  
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-reisinger-yonatan">
                      {entry.userName}
                    </span>
                    
                    <div className="flex gap-1">
                      {entry.canRollback && (
                        <button
                          onClick={() => {
                            setSelectedEntry(entry)
                            setShowRollbackModal(true)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="שחזור"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => toggleEntryExpansion(entry.id)}
                        className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                        title="צפייה בפרטים"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 mb-2 font-reisinger-yonatan">
                          פרטי הפעולה
                        </h5>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="font-reisinger-yonatan">
                            <span className="font-medium">מזהה ישות:</span> {entry.entityId}
                          </div>
                          <div className="font-reisinger-yonatan">
                            <span className="font-medium">מזהה משתמש:</span> {entry.userId}
                          </div>
                          <div className="flex items-center gap-2 font-reisinger-yonatan">
                            <span className="font-medium">ניתן לשחזור:</span>
                            {entry.canRollback ? 
                              <CheckCircle className="w-4 h-4 text-green-500" /> :
                              <XCircle className="w-4 h-4 text-red-500" />
                            }
                          </div>
                        </div>
                      </div>

                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-2 font-reisinger-yonatan">
                            פרטים נוספים
                          </h5>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                              {JSON.stringify(entry.details, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {filteredAndSortedEntries.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 font-reisinger-yonatan mb-2">
            לא נמצאו רשומות
          </h3>
          <p className="text-gray-500 font-reisinger-yonatan">
            לא נמצאו רשומות יומן המתאימות לקריטריונים שנבחרו
          </p>
        </Card>
      )}

      {/* Rollback Confirmation Modal */}
      <Modal
        isOpen={showRollbackModal}
        onClose={() => setShowRollbackModal(false)}
        title="אישור שחזור"
        maxWidth="md"
      >
        {selectedEntry && (
          <div className="space-y-6 p-6" dir="rtl">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <RotateCcw className="w-5 h-5" />
                <span className="font-semibold font-reisinger-yonatan">שחזור נתונים</span>
              </div>
              <p className="text-sm text-blue-700 font-reisinger-yonatan">
                האם אתה בטוח שברצונך לשחזר את הפעולה הזו?
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700 font-reisinger-yonatan">פעולה:</span>
                <span className="text-gray-600 font-reisinger-yonatan">{getActionLabel(selectedEntry.action)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700 font-reisinger-yonatan">ישות:</span>
                <span className="text-gray-600 font-reisinger-yonatan">{selectedEntry.entityName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700 font-reisinger-yonatan">תאריך:</span>
                <span className="text-gray-600 font-reisinger-yonatan">{formatDate(selectedEntry.timestamp)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700 font-reisinger-yonatan">משתמש:</span>
                <span className="text-gray-600 font-reisinger-yonatan">{selectedEntry.userName}</span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-700 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold text-sm font-reisinger-yonatan">שים לב</span>
              </div>
              <p className="text-xs text-yellow-700 font-reisinger-yonatan">
                פעולת השחזור תבטל את כל השינויים שבוצעו מאז הפעולה המקורית.
                פעולה זו אינה ניתנת לביטול.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowRollbackModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-reisinger-yonatan"
              >
                ביטול
              </button>
              <button
                onClick={handleRollback}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-reisinger-yonatan"
              >
                שחזר נתונים
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AuditLogViewer