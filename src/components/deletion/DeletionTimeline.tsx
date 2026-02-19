/**
 * Deletion Timeline Component
 * 
 * Visual timeline for tracking deletion operations and audit history
 * with interactive timeline and filtering capabilities
 */

import React, { useState, useMemo } from 'react'
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Filter,
  Zap,
  User,
  Database,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { AuditLogEntry, DeletionOperation } from './types'
import { Card } from '../ui/Card'

interface DeletionTimelineProps {
  entries: AuditLogEntry[]
  operations: DeletionOperation[]
  onEntryClick?: (entry: AuditLogEntry) => void
  onOperationClick?: (operation: DeletionOperation) => void
  className?: string
}

interface TimelineEvent {
  id: string
  timestamp: Date
  type: 'audit' | 'operation'
  title: string
  description: string
  icon: React.ReactNode
  color: string
  data: AuditLogEntry | DeletionOperation
  status?: 'completed' | 'failed' | 'running' | 'cancelled' | 'pending'
}

interface TimelineFilters {
  dateRange: { start: Date | null; end: Date | null }
  types: string[]
  users: string[]
  entityTypes: string[]
  searchQuery: string
}

const DeletionTimeline: React.FC<DeletionTimelineProps> = ({
  entries,
  operations,
  onEntryClick,
  onOperationClick,
  className = ''
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<TimelineFilters>({
    dateRange: { start: null, end: null },
    types: [],
    users: [],
    entityTypes: [],
    searchQuery: ''
  })
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)

  // Convert entries and operations to timeline events
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = []

    // Add audit log entries
    entries.forEach(entry => {
      events.push({
        id: `audit-${entry.id}`,
        timestamp: entry.timestamp,
        type: 'audit',
        title: getActionLabel(entry.action),
        description: `${entry.entityName} - ${entry.userName}`,
        icon: getActionIcon(entry.action),
        color: getActionColor(entry.action),
        data: entry
      })
    })

    // Add deletion operations
    operations.forEach(operation => {
      events.push({
        id: `operation-${operation.id}`,
        timestamp: operation.startTime || new Date(),
        type: 'operation',
        title: `מחיקת ${operation.entityName}`,
        description: `${operation.status} - ${operation.progress}%`,
        icon: getOperationIcon(operation.status),
        color: getOperationColor(operation.status),
        data: operation,
        status: operation.status
      })
    })

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [entries, operations])

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return timelineEvents.filter(event => {
      // Date range filter
      if (filters.dateRange.start && event.timestamp < filters.dateRange.start) return false
      if (filters.dateRange.end && event.timestamp > filters.dateRange.end) return false

      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(event.type)) return false

      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        if (!event.title.toLowerCase().includes(query) &&
            !event.description.toLowerCase().includes(query)) {
          return false
        }
      }

      return true
    })
  }, [timelineEvents, filters])

  // Group events by date for display
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: TimelineEvent[] } = {}
    
    filteredEvents.forEach(event => {
      const dateKey = event.timestamp.toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })

    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    )
  }, [filteredEvents])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete':
      case 'cascade_delete':
        return <Trash2 className="w-4 h-4" />
      case 'rollback':
        return <RotateCcw className="w-4 h-4" />
      case 'orphan_cleanup':
        return <Database className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'delete':
      case 'cascade_delete':
        return 'red'
      case 'rollback':
        return 'blue'
      case 'orphan_cleanup':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const getOperationIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      case 'running':
        return <Zap className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getOperationColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green'
      case 'failed': return 'red'
      case 'running': return 'blue'
      case 'cancelled': return 'orange'
      default: return 'gray'
    }
  }

  const getColorClasses = (color: string) => {
    const colors = {
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500' },
      gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'text-gray-500' }
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event)
    
    if (event.type === 'audit' && onEntryClick) {
      onEntryClick(event.data as AuditLogEntry)
    } else if (event.type === 'operation' && onOperationClick) {
      onOperationClick(event.data as DeletionOperation)
    }
  }

  const renderTimelineEvent = (event: TimelineEvent, index: number) => {
    const colorClasses = getColorClasses(event.color)
    
    return (
      <div key={event.id} className="relative">
        {/* Timeline connector */}
        {index > 0 && (
          <div className="absolute top-0 right-6 w-0.5 h-6 bg-gray-200 -translate-y-6"></div>
        )}
        
        <div 
          className={`
            relative flex items-start gap-4 p-4 rounded border cursor-pointer transition-all hover:shadow-card-hover
            ${colorClasses.bg} ${colorClasses.border}
            ${selectedEvent?.id === event.id ? 'ring-2 ring-blue-500' : ''}
          `}
          onClick={() => handleEventClick(event)}
        >
          {/* Event Icon */}
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white
            ${colorClasses.border} ${colorClasses.icon}
          `}>
            {event.icon}
          </div>

          {/* Event Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`text-sm font-semibold font-reisinger-yonatan ${colorClasses.text}`}>
                {event.title}
              </h4>
              <span className="text-xs text-gray-500 font-reisinger-yonatan">
                {formatTime(event.timestamp)}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 font-reisinger-yonatan mb-2">
              {event.description}
            </p>

            {/* Event specific badges */}
            <div className="flex gap-2">
              {event.type === 'audit' && (
                <span className="px-2 py-1 text-xs font-medium bg-white rounded-full border font-reisinger-yonatan">
                  יומן ביקורת
                </span>
              )}
              
              {event.type === 'operation' && event.status && (
                <span className={`
                  px-2 py-1 text-xs font-medium rounded-full border font-reisinger-yonatan
                  ${event.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                    event.status === 'failed' ? 'bg-red-100 text-red-700 border-red-200' :
                    event.status === 'running' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }
                `}>
                  {event.status === 'completed' ? 'הושלם' :
                   event.status === 'failed' ? 'נכשל' :
                   event.status === 'running' ? 'פעיל' :
                   event.status === 'cancelled' ? 'בוטל' : 'ממתין'}
                </span>
              )}

              {event.type === 'audit' && (event.data as AuditLogEntry).canRollback && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-reisinger-yonatan">
                  ניתן לשחזור
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEventClick(event)
              }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded"
              title="צפייה בפרטים"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-gray-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
                  ציר זמן מחיקות
                </h3>
                <p className="text-sm text-gray-600 font-reisinger-yonatan">
                  {filteredEvents.length} אירועים מתוך {timelineEvents.length}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="font-reisinger-yonatan">סינון</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש באירועים..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-reisinger-yonatan"
            />
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full border border-gray-300 rounded px-3 py-2 font-reisinger-yonatan"
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
                    className="w-full border border-gray-300 rounded px-3 py-2 font-reisinger-yonatan"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex gap-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.types.includes('audit')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, types: [...prev.types, 'audit'] }))
                        } else {
                          setFilters(prev => ({ ...prev, types: prev.types.filter(t => t !== 'audit') }))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="mr-2 text-sm text-gray-700 font-reisinger-yonatan">יומן ביקורת</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.types.includes('operation')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, types: [...prev.types, 'operation'] }))
                        } else {
                          setFilters(prev => ({ ...prev, types: prev.types.filter(t => t !== 'operation') }))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="mr-2 text-sm text-gray-700 font-reisinger-yonatan">פעולות מחיקה</span>
                  </label>
                </div>
              </div>

              <button
                onClick={() => setFilters({
                  dateRange: { start: null, end: null },
                  types: [],
                  users: [],
                  entityTypes: [],
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

      {/* Timeline */}
      <div className="space-y-8">
        {groupedEvents.length > 0 ? (
          groupedEvents.map(([dateKey, events]) => (
            <Card key={dateKey} className="relative">
              {/* Date Header */}
              <div className="sticky top-0 bg-white z-10 pb-4 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
                    {formatDate(dateKey)}
                  </h4>
                  <span className="text-sm text-gray-500 font-reisinger-yonatan">
                    {events.length} אירועים
                  </span>
                </div>
              </div>

              {/* Events for this date */}
              <div className="space-y-4">
                {events.map((event, index) => renderTimelineEvent(event, index))}
              </div>
            </Card>
          ))
        ) : (
          <Card className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 font-reisinger-yonatan mb-2">
              לא נמצאו אירועים
            </h3>
            <p className="text-gray-500 font-reisinger-yonatan">
              לא נמצאו אירועים במסנן הנוכחי
            </p>
          </Card>
        )}
      </div>

      {/* Load more / Pagination could go here */}
      {groupedEvents.length > 0 && (
        <div className="text-center py-4">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-reisinger-yonatan">
            טען אירועים נוספים
          </button>
        </div>
      )}
    </div>
  )
}

export default DeletionTimeline