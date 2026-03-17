import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrashIcon,
  DownloadSimpleIcon,
} from '@phosphor-icons/react'
import { Tabs, Tab, Button as HeroButton } from '@heroui/react'
import Modal from '../components/ui/Modal'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import RehearsalCalendar from '../components/RehearsalCalendar'
import RehearsalForm from '../components/RehearsalForm'
import AttendanceManager from '../components/AttendanceManager'
import { RehearsalStatsRow } from '../components/rehearsal/RehearsalStatsRow'
import { RehearsalFilters } from '../components/rehearsal/RehearsalFilters'
import { RehearsalTimeline } from '../components/rehearsal/RehearsalTimeline'
import { ErrorState } from '../components/feedback/ErrorState'
import { TableSkeleton } from '../components/feedback/Skeleton'
import { rehearsalService, orchestraService } from '../services/apiService'
import {
  filterRehearsals,
  sortRehearsals,
  formatRehearsalDateTime,
  calculateAttendanceStats,
  type Rehearsal,
  type RehearsalFormData,
  type BulkRehearsalData,
} from '../utils/rehearsalUtils'

export default function Rehearsals() {
  const navigate = useNavigate()
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([])
  const [orchestras, setOrchestras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI State
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards')
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
  const [filters, setFilters] = useState({
    searchQuery: '',
    orchestraId: '',
    dayOfWeek: '' as number | '',
    location: '',
    status: '' as 'upcoming' | 'completed' | 'in_progress' | '',
    startDate: '',
    endDate: '',
    type: '',
  })

  // Sort State
  const [sortBy] = useState<'date' | 'time' | 'orchestra' | 'location'>('date')
  const [sortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadData()
  }, [])

  // Auto-navigate calendar to where rehearsals exist
  useEffect(() => {
    if (rehearsals.length > 0 && viewMode === 'calendar') {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const hasCurrentMonthRehearsals = rehearsals.some(r => {
        const d = new Date(r.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })

      if (!hasCurrentMonthRehearsals) {
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

  // Process rehearsals by joining with orchestra data, then filter and sort
  const processedRehearsals = useMemo(() => {
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

    let filtered = filterRehearsals(enrichedRehearsals, filters)
    return sortRehearsals(filtered, sortBy, sortOrder)
  }, [rehearsals, orchestras, filters, sortBy, sortOrder])

  const orchestraOptions = useMemo(() => {
    return orchestras.map((o: any) => ({
      value: o._id,
      label: o.name,
    }))
  }, [orchestras])

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

  const handleExportRehearsals = () => {
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

  if (loading) {
    return <TableSkeleton rows={6} cols={5} />
  }

  return (
    <div className="space-y-0">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">חזרות</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ניהול חזרות תזמורות ומעקב נוכחות • {rehearsals.length} חזרות
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HeroButton
            color="default"
            variant="bordered"
            size="sm"
            onPress={() => setShowBulkDeleteModal(true)}
            startContent={<TrashIcon size={14} weight="fill" />}
            className="font-bold text-danger border-danger"
          >
            מחיקה בטווח
          </HeroButton>
          <HeroButton
            color="default"
            variant="bordered"
            size="sm"
            onPress={handleExportRehearsals}
            startContent={<DownloadSimpleIcon size={14} weight="regular" />}
            className="font-bold"
          >
            ייצוא
          </HeroButton>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <ErrorState
          message={error}
          onRetry={loadData}
        />
      )}

      {/* Main content */}
      <>
        <RehearsalStatsRow rehearsals={processedRehearsals} />

        <Tabs
          variant="solid"
          size="sm"
          selectedKey={viewMode}
          onSelectionChange={(key) => setViewMode(key as 'cards' | 'calendar')}
          classNames={{ tabList: 'mb-4' }}
        >
          <Tab key="cards" title="כרטיסים" />
          <Tab key="calendar" title="לוח שנה" />
        </Tabs>

        <RehearsalFilters
          searchQuery={filters.searchQuery}
          onSearchChange={(v) => setFilters(prev => ({ ...prev, searchQuery: v }))}
          onSearchClear={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
          typeFilter={filters.type}
          onTypeChange={(v) => setFilters(prev => ({ ...prev, type: v }))}
          statusFilter={filters.status}
          onStatusChange={(v) => setFilters(prev => ({ ...prev, status: v as any }))}
          orchestraFilter={filters.orchestraId}
          onOrchestraChange={(v) => setFilters(prev => ({ ...prev, orchestraId: v }))}
          orchestraOptions={orchestraOptions}
          onCreateClick={() => setShowCreateForm(true)}
        />

        {viewMode === 'cards' ? (
          <RehearsalTimeline
            rehearsals={processedRehearsals}
            onView={(id) => navigate(`/rehearsals/${id}`)}
            onEdit={(rehearsal) => {
              setEditingRehearsal(rehearsal)
              setShowEditForm(true)
            }}
            onAttendance={(id) => navigate(`/rehearsals/${id}`)}
          />
        ) : (
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
        )}
      </>

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
          orchestraId={selectedRehearsal.groupId}
          onSaved={() => loadData()}
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
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
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
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={cancelBulkDelete}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleBulkDeleteByDateRange}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              disabled={!bulkDeleteData.orchestraId || !bulkDeleteData.startDate || !bulkDeleteData.endDate}
            >
              <TrashIcon size={16} weight="fill" className="ml-2 inline" />
              מחק חזרות
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
