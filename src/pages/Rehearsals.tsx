import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Clock,
  MapPin,
  Eye,
  CheckCircle,
  Download,
  Grid,
  List
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import Table from '../components/ui/Table'
import { SearchInput } from '../components/ui/SearchInput'
import { TableSkeleton } from '../components/feedback/Skeleton'
import { EmptyState } from '../components/feedback/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import Modal from '../components/ui/Modal'
import RehearsalCalendar from '../components/RehearsalCalendar'
import RehearsalForm from '../components/RehearsalForm'
import AttendanceManager from '../components/AttendanceManager'
import { rehearsalService, orchestraService } from '../services/apiService'
import {
  filterRehearsals,
  sortRehearsals,
  formatRehearsalDateTime,
  getRehearsalStatus,
  calculateAttendanceStats,
  getRehearsalColor,
  getDayName,
  DAYS_OF_WEEK_ARRAY,
  type Rehearsal,
  type RehearsalFormData,
  type BulkRehearsalData,
  type AttendanceUpdate
} from '../utils/rehearsalUtils'

export default function Rehearsals() {
  const navigate = useNavigate()
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([])
  const [orchestras, setOrchestras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI State
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('month')
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Form State
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingRehearsal, setEditingRehearsal] = useState<Rehearsal | null>(null)
  
  // Attendance State
  const [showAttendanceManager, setShowAttendanceManager] = useState(false)
  const [selectedRehearsal, setSelectedRehearsal] = useState<Rehearsal | null>(null)
  
  // Delete Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [rehearsalToDelete, setRehearsalToDelete] = useState<string | null>(null)
  
  // Bulk Delete by Date Range State
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleteData, setBulkDeleteData] = useState({
    orchestraId: '',
    startDate: '',
    endDate: ''
  })
  
  // Filter State
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    searchQuery: '',
    orchestraId: '',
    dayOfWeek: '' as number | '',
    location: '',
    status: 'all' as 'upcoming' | 'completed' | 'in_progress' | 'all',
    startDate: '',
    endDate: ''
  })
  
  // Sort State
  const [sortBy, setSortBy] = useState<'date' | 'time' | 'orchestra' | 'location'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadData()
  }, [])

  // Auto-navigate calendar to where rehearsals exist
  useEffect(() => {
    if (rehearsals.length > 0 && viewMode === 'calendar') {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      // Check if any rehearsals exist in the current month
      const hasCurrentMonthRehearsals = rehearsals.some(r => {
        const d = new Date(r.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })

      if (!hasCurrentMonthRehearsals) {
        // Find the nearest rehearsal date (prefer upcoming, fall back to most recent)
        const sortedDates = rehearsals
          .map(r => new Date(r.date))
          .sort((a, b) => a.getTime() - b.getTime())

        const upcoming = sortedDates.find(d => d >= now)
        const target = upcoming || sortedDates[sortedDates.length - 1]

        if (target) {
          setSelectedDate(target)
        }
      }
    }
  }, [rehearsals, viewMode])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [rehearsalsData, orchestrasData] = await Promise.all([
        rehearsalService.getRehearsals(),
        orchestraService.getOrchestras()
      ])

      setRehearsals(rehearsalsData)
      setOrchestras(orchestrasData)
    } catch (error: any) {
      console.error('Error loading rehearsals:', error)
      setError('שגיאה בטעינת החזרות')
    } finally {
      setLoading(false)
    }
  }

  // Process rehearsals by joining with orchestra data
  const processedRehearsals = useMemo(() => {
    // First, enrich rehearsals with orchestra data
    const enrichedRehearsals = rehearsals.map(rehearsal => {
      const orchestra = orchestras.find(orch => orch._id === rehearsal.groupId)
      return {
        ...rehearsal,
        orchestra: orchestra ? {
          _id: orchestra._id,
          name: orchestra.name,
          type: orchestra.type,
          memberIds: orchestra.memberIds || [],
          conductor: orchestra.conductor,
          members: orchestra.members
        } : undefined
      }
    })
    
    // Then filter and sort
    let filtered = filterRehearsals(enrichedRehearsals, filters)
    return sortRehearsals(filtered, sortBy, sortOrder)
  }, [rehearsals, orchestras, filters, sortBy, sortOrder])

  const handleCreateRehearsal = async (data: RehearsalFormData | BulkRehearsalData, isBulk: boolean) => {
    try {
      if (isBulk) {
        await rehearsalService.createBulkRehearsals(data as BulkRehearsalData)
      } else {
        await rehearsalService.createRehearsal(data as RehearsalFormData)
      }
      
      setShowCreateForm(false)
      await loadData()
    } catch (error: any) {
      throw new Error(error.message || 'שגיאה ביצירת החזרה')
    }
  }

  const handleEditRehearsal = async (data: RehearsalFormData | BulkRehearsalData, isBulk: boolean) => {
    if (!editingRehearsal || isBulk) return

    try {
      await rehearsalService.updateRehearsal(editingRehearsal._id, data as RehearsalFormData)
      setShowEditForm(false)
      setEditingRehearsal(null)
      await loadData()
    } catch (error: any) {
      throw new Error(error.message || 'שגיאה בעדכון החזרה')
    }
  }

  const handleDeleteRehearsal = (rehearsalId: string) => {
    setRehearsalToDelete(rehearsalId)
    setShowDeleteModal(true)
  }

  const confirmDeleteRehearsal = async () => {
    if (!rehearsalToDelete) return

    try {
      await rehearsalService.deleteRehearsal(rehearsalToDelete)
      await loadData()
      setShowDeleteModal(false)
      setRehearsalToDelete(null)
    } catch (error: any) {
      setError('שגיאה במחיקת החזרה')
      setShowDeleteModal(false)
      setRehearsalToDelete(null)
    }
  }

  const cancelDeleteRehearsal = () => {
    setShowDeleteModal(false)
    setRehearsalToDelete(null)
  }

  const handleBulkDeleteByDateRange = async () => {
    if (!bulkDeleteData.orchestraId || !bulkDeleteData.startDate || !bulkDeleteData.endDate) {
      setError('נדרש לבחור תזמורת ותאריכי התחלה וסיום')
      return
    }

    try {
      const result = await rehearsalService.deleteRehearsalsByDateRange(
        bulkDeleteData.orchestraId,
        bulkDeleteData.startDate,
        bulkDeleteData.endDate
      )
      
      await loadData()
      setShowBulkDeleteModal(false)
      setBulkDeleteData({ orchestraId: '', startDate: '', endDate: '' })
      
      // Show success message
      setError(null)
      console.log(`✅ נמחקו ${result.deletedCount} חזרות בהצלחה`)
    } catch (error: any) {
      setError(error.message || 'שגיאה במחיקת החזרות בטווח התאריכים')
      setShowBulkDeleteModal(false)
    }
  }

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false)
    setBulkDeleteData({ orchestraId: '', startDate: '', endDate: '' })
  }

  const handleUpdateAttendance = async (attendanceData: AttendanceUpdate) => {
    if (!selectedRehearsal) return

    try {
      await rehearsalService.updateAttendance(selectedRehearsal._id, attendanceData)
      setShowAttendanceManager(false)
      setSelectedRehearsal(null)
      await loadData()
    } catch (error: any) {
      throw new Error(error.message || 'שגיאה בעדכון הנוכחות')
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      orchestraId: '',
      dayOfWeek: '',
      location: '',
      status: 'all',
      startDate: '',
      endDate: ''
    })
  }

  const handleExportRehearsals = () => {
    // Export filtered rehearsals to CSV
    const csvData = processedRehearsals.map(rehearsal => {
      const dateTime = formatRehearsalDateTime(rehearsal)
      const stats = calculateAttendanceStats(rehearsal)
      
      return {
        תזמורת: rehearsal.orchestra?.name || '',
        תאריך: dateTime.date,
        יום: dateTime.dayName,
        שעה: dateTime.time,
        מיקום: rehearsal.location,
        נוכחים: stats.presentCount,
        נעדרים: stats.absentCount,
        אחוז_נוכחות: `${stats.attendanceRate}%`,
        הערות: rehearsal.notes || ''
      }
    })

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rehearsals_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Get unique locations for filter
  const locations = [...new Set(rehearsals.map(r => r.location).filter(Boolean))]

  // Table columns for list view
  const tableColumns = [
    {
      key: 'orchestra',
      label: 'תזמורת',
      render: (rehearsal: Rehearsal) => (
        <div>
          <div className="font-medium text-gray-900">{rehearsal.orchestra?.name}</div>
          <div className="text-sm text-gray-500">{rehearsal.type}</div>
        </div>
      )
    },
    {
      key: 'datetime',
      label: 'תאריך ושעה',
      render: (rehearsal: Rehearsal) => {
        const dateTime = formatRehearsalDateTime(rehearsal)
        return (
          <div>
            <div className="font-medium text-gray-900">{dateTime.date}</div>
            <div className="text-sm text-gray-500">{dateTime.dayName} • {dateTime.time}</div>
          </div>
        )
      }
    },
    {
      key: 'location',
      label: 'מיקום',
      render: (rehearsal: Rehearsal) => (
        <div className="flex items-center">
          <MapPin className="w-4 h-4 text-gray-400 ml-1" />
          <span className="text-gray-900">{rehearsal.location}</span>
        </div>
      )
    },
    {
      key: 'attendance',
      label: 'נוכחות',
      render: (rehearsal: Rehearsal) => {
        const stats = calculateAttendanceStats(rehearsal)
        return stats.hasAttendanceData ? (
          <div className="flex items-center">
            <Users className="w-4 h-4 text-gray-400 ml-1" />
            <span className="text-gray-900">
              {stats.presentCount}/{stats.totalMembers} ({stats.attendanceRate}%)
            </span>
          </div>
        ) : (
          <span className="text-gray-500 text-sm">לא סומן</span>
        )
      }
    },
    {
      key: 'status',
      label: 'סטטוס',
      render: (rehearsal: Rehearsal) => {
        const status = getRehearsalStatus(rehearsal)
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${status.colorClass}`}>
            {status.text}
          </span>
        )
      }
    }
  ]

  if (loading) {
    return <TableSkeleton rows={6} cols={5} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">חזרות</h1>
          <p className="text-gray-600">
            ניהול חזרות תזמורת ומעקב נוכחות
            {rehearsals.length > 0 && ` • ${rehearsals.length} חזרות במערכת`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="מחיקת חזרות בטווח תאריכים"
            >
              <Trash2 className="w-4 h-4 ml-1" />
              מחיקה בטווח תאריכים
            </button>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 ml-1" />
              חזרה חדשה
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorState
          message={error}
          onRetry={loadData}
        />
      )}

      {/* Filters */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <SearchInput
              value={filters.searchQuery}
              onChange={(value) => handleFilterChange('searchQuery', value)}
              onClear={() => handleFilterChange('searchQuery', '')}
              placeholder="חיפוש חזרות..."
            />

            {/* Toggle Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 ml-1" />
              מסננים
            </button>

            {/* Active filters count */}
            {Object.values(filters).filter(v => v && v !== 'all').length > 1 && (
              <span className="text-sm text-primary-600">
                {Object.values(filters).filter(v => v && v !== 'all').length - 1} מסננים פעילים
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Export */}
            <button
              onClick={handleExportRehearsals}
              className="flex items-center px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 ml-1" />
              ייצא
            </button>

            {/* Calendar View Toggle */}
            {viewMode === 'calendar' && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCalendarView('week')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    calendarView === 'week'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  שבוע
                </button>
                <button
                  onClick={() => setCalendarView('month')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    calendarView === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  חודש
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תזמורת</label>
              <select
                value={filters.orchestraId}
                onChange={(e) => handleFilterChange('orchestraId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">כל התזמורות</option>
                {orchestras.map(orchestra => (
                  <option key={orchestra._id} value={orchestra._id}>
                    {orchestra.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">יום בשבוע</label>
              <select
                value={filters.dayOfWeek}
                onChange={(e) => handleFilterChange('dayOfWeek', e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">כל הימים</option>
                {DAYS_OF_WEEK_ARRAY.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מיקום</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">כל המיקומים</option>
                {locations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">כל החזרות</option>
                <option value="upcoming">עתידות</option>
                <option value="in_progress">מתקיימות</option>
                <option value="completed">הסתיימו</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מתאריך</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">עד תאריך</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="md:col-span-3 lg:col-span-6 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                נקה מסננים
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <RehearsalCalendar
          rehearsals={processedRehearsals}
          viewMode={calendarView}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onRehearsalClick={(rehearsal) => {
            navigate(`/rehearsals/${rehearsal._id}`)
          }}
          onEditRehearsal={(rehearsal) => {
            setEditingRehearsal(rehearsal)
            setShowEditForm(true)
          }}
          onDeleteRehearsal={handleDeleteRehearsal}
          onViewDetails={(rehearsal) => {
            navigate(`/rehearsals/${rehearsal._id}`)
          }}
          onNavigateToRehearsal={(rehearsalId) => {
            navigate(`/rehearsals/${rehearsalId}`)
          }}
        />
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              חזרות ({processedRehearsals.length})
            </h3>
            
            <div className="flex items-center gap-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-')
                  setSortBy(sort as any)
                  setSortOrder(order as any)
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="date-asc">תאריך (עולה)</option>
                <option value="date-desc">תאריך (יורד)</option>
                <option value="orchestra-asc">תזמורת (א-ת)</option>
                <option value="orchestra-desc">תזמורת (ת-א)</option>
                <option value="location-asc">מיקום (א-ת)</option>
                <option value="location-desc">מיקום (ת-א)</option>
                <option value="time-asc">שעה (מוקדם)</option>
                <option value="time-desc">שעה (מאוחר)</option>
              </select>
            </div>
          </div>

          {processedRehearsals.length > 0 ? (
            <Table
              data={processedRehearsals}
              columns={tableColumns}
              onView={(rehearsal) => {
                navigate(`/rehearsals/${rehearsal._id}`)
              }}
              onEdit={(rehearsal) => {
                setEditingRehearsal(rehearsal)
                setShowEditForm(true)
              }}
              onDelete={(rehearsal) => handleDeleteRehearsal(rehearsal._id)}
              actions={true}
              actionLabels={{
                view: 'נוכחות',
                edit: 'ערוך',
                delete: 'מחק'
              }}
            />
          ) : (
            (() => {
              const hasActiveFilters = Object.values(filters).some(f => f && f !== 'all')
              return (
                <EmptyState
                  icon={<Calendar className="w-12 h-12" />}
                  title="אין חזרות"
                  description={
                    hasActiveFilters
                      ? 'לא נמצאו חזרות התואמות למסננים'
                      : 'התחל על ידי יצירת החזרה הראשונה'
                  }
                  action={!hasActiveFilters ? { label: 'צור חזרה חדשה', onClick: () => setShowCreateForm(true) } : undefined}
                />
              )
            })()
          )}
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <RehearsalForm
          orchestras={orchestras}
          existingRehearsals={rehearsals}
          onSubmit={handleCreateRehearsal}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Form */}
      {showEditForm && editingRehearsal && (
        <RehearsalForm
          orchestras={orchestras}
          existingRehearsals={rehearsals}
          onSubmit={handleEditRehearsal}
          onCancel={() => {
            setShowEditForm(false)
            setEditingRehearsal(null)
          }}
          initialData={{
            groupId: editingRehearsal.groupId,
            type: editingRehearsal.type,
            date: editingRehearsal.date.split('T')[0],
            startTime: editingRehearsal.startTime,
            endTime: editingRehearsal.endTime,
            location: editingRehearsal.location,
            notes: editingRehearsal.notes,
            isActive: editingRehearsal.isActive
          }}
        />
      )}

      {/* Attendance Manager */}
      {showAttendanceManager && selectedRehearsal && (
        <AttendanceManager
          rehearsal={selectedRehearsal}
          onUpdateAttendance={handleUpdateAttendance}
          onClose={() => {
            setShowAttendanceManager(false)
            setSelectedRehearsal(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת חזרה"
        message="האם אתה בטוח שברצונך למחוק את החזרה? פעולה זו אינה ניתנת לביטול."
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={confirmDeleteRehearsal}
        onCancel={cancelDeleteRehearsal}
        variant="danger"
      />

      {/* Bulk Delete by Date Range Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={cancelBulkDelete}
        title="מחיקת חזרות בטווח תאריכים"
        maxWidth="lg"
      >
        <div className="p-6">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              ⚠️ פעולה זו תמחק את כל החזרות בטווח התאריכים שנבחר עבור התזמורת הנבחרת. 
              פעולה זו אינה ניתנת לביטול!
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Orchestra Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תזמורת
              </label>
              <select
                value={bulkDeleteData.orchestraId}
                onChange={(e) => setBulkDeleteData({ ...bulkDeleteData, orchestraId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">בחר תזמורת</option>
                {orchestras.map((orchestra) => (
                  <option key={orchestra._id} value={orchestra._id}>
                    {orchestra.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תאריך התחלה
                </label>
                <input
                  type="date"
                  value={bulkDeleteData.startDate}
                  onChange={(e) => setBulkDeleteData({ ...bulkDeleteData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תאריך סיום
                </label>
                <input
                  type="date"
                  value={bulkDeleteData.endDate}
                  onChange={(e) => setBulkDeleteData({ ...bulkDeleteData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={cancelBulkDelete}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleBulkDeleteByDateRange}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={!bulkDeleteData.orchestraId || !bulkDeleteData.startDate || !bulkDeleteData.endDate}
            >
              <Trash2 className="w-4 h-4 ml-2 inline" />
              מחק חזרות
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}