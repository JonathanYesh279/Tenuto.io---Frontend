import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MusicNoteIcon, UsersIcon, SquaresFourIcon, ListIcon, ChartBarIcon, Table as TablePhIcon } from '@phosphor-icons/react'
import { PlusIcon } from '@phosphor-icons/react'
import Table from '../components/ui/Table'
import { SearchInput } from '../components/ui/SearchInput'
import { GlassStatCard } from '../components/ui/GlassStatCard'
import { GlassSelect } from '../components/ui/GlassSelect'
import { Button as HeroButton } from '@heroui/react'
import OrchestraForm from '../components/OrchestraForm'
import OrchestraCard from '../components/OrchestraCard'
import OrchestraManagementDashboard from '../components/OrchestraManagementDashboard'
import Modal from '../components/ui/Modal'
import OrchestraMemberManagement from '../components/OrchestraMemberManagement'
import ConfirmDeleteDialog from '../components/ui/ConfirmDeleteDialog'
import { orchestraService, teacherService } from '../services/apiService'
import { useAuth } from '../services/authContext'
import { useSchoolYear } from '../services/schoolYearContext'
import { TableSkeleton } from '../components/feedback/Skeleton'
import { EmptyState } from '../components/feedback/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState'
import {
  filterOrchestras,
  sortOrchestras,
  getOrchestraTypeInfo,
  getOrchestraStatus,
  calculateOrchestraStats,
  getConductorName,
  formatMemberCount,
  formatRehearsalCount,
  VALID_ORCHESTRA_TYPES,
  VALID_LOCATIONS,
  type Orchestra,
  type OrchestraType,
  type LocationType
} from '../utils/orchestraUtils'
import { getDisplayName } from '../utils/nameUtils'

export default function Orchestras() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentSchoolYear } = useSchoolYear()
  const [orchestras, setOrchestras] = useState<Orchestra[]>([])
  const [teachers, setTeachers] = useState([])
  const [allTeachers, setAllTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingOrchestra, setEditingOrchestra] = useState<Orchestra | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'dashboard'>('dashboard')

  // Modal states (keeping member management modal for now)
  const [showMemberManagement, setShowMemberManagement] = useState(false)
  const [selectedOrchestraId, setSelectedOrchestraId] = useState<string | null>(null)

  // Ensemble summary modal
  const [showEnsembleSummary, setShowEnsembleSummary] = useState(false)

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [orchestraToDelete, setOrchestraToDelete] = useState<Orchestra | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'conductor' | 'memberCount' | 'location' | 'rehearsalCount'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState({
    type: '' as OrchestraType | '',
    conductorId: '',
    location: '' as LocationType | '',
    statusFilter: '' as '' | 'active' | 'inactive',
    hasMembers: undefined as boolean | undefined
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load orchestras and teachers in parallel
      // Use 'role' (singular) as expected by the backend API
      const [orchestrasData, teachersData, allTeachersData] = await Promise.all([
        orchestraService.getOrchestras(),
        teacherService.getTeachers({ role: 'מנצח' }),
        teacherService.getTeachers()
      ])

      setOrchestras(orchestrasData)
      // Include all conductors (including current user) so they can assign themselves
      setTeachers(teachersData)
      setAllTeachers(allTeachersData)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort orchestras using utility functions
  const filteredAndSortedOrchestras = sortOrchestras(
    filterOrchestras(orchestras, {
      searchQuery,
      type: filters.type,
      conductorId: filters.conductorId,
      location: filters.location,
      isActive: filters.statusFilter === 'active' ? true : filters.statusFilter === 'inactive' ? false : undefined,
      hasMembers: filters.hasMembers
    }),
    sortBy,
    sortOrder
  )

  // Calculate statistics
  const stats = {
    totalOrchestras: orchestras.length,
    activeOrchestras: orchestras.filter(o => o.isActive).length,
    totalMembers: orchestras.reduce((sum, o) => sum + (o.memberIds?.length || 0), 0),
    orchestrasWithConductor: orchestras.filter(o => o.conductorId).length,
    orchestrasReady: orchestras.filter(o => {
      const orchStats = calculateOrchestraStats(o)
      return orchStats.isFullyConfigured
    }).length,
    typeDistribution: {
      'תזמורת': orchestras.filter(o => o.type === 'תזמורת').length,
      'הרכב': orchestras.filter(o => o.type === 'הרכב').length
    }
  }

  const handleCreateOrchestra = () => {
    setEditingOrchestra(null)
    setShowForm(true)
  }

  const handleEditOrchestra = (orchestra: Orchestra) => {
    setEditingOrchestra(orchestra)
    setShowForm(true)
  }

  const handleFormSubmit = async (orchestraData: any) => {
    try {
      // Add the current school year ID to the orchestra data
      const dataWithSchoolYear = {
        ...orchestraData,
        schoolYearId: currentSchoolYear?._id || ''
      }

      if (editingOrchestra) {
        await orchestraService.updateOrchestra(editingOrchestra._id, dataWithSchoolYear)
      } else {
        if (!currentSchoolYear?._id) {
          throw new Error('לא הוגדרה שנת לימודים נוכחית. אנא הגדר שנת לימודים לפני יצירת תזמורת.')
        }
        await orchestraService.createOrchestra(dataWithSchoolYear)
      }
      setShowForm(false)
      setEditingOrchestra(null)
      await loadData()
    } catch (error) {
      console.error('Error saving orchestra:', error)
      throw error
    }
  }

  const handleDeleteOrchestra = (orchestraId: string) => {
    const orchestra = orchestras.find(o => o._id === orchestraId)
    if (orchestra) {
      setOrchestraToDelete(orchestra)
      setShowDeleteConfirm(true)
    }
  }

  const confirmDeleteOrchestra = async () => {
    if (!orchestraToDelete) return

    setIsDeleting(true)
    try {
      await orchestraService.deleteOrchestra(orchestraToDelete._id)
      setShowDeleteConfirm(false)
      setOrchestraToDelete(null)
      await loadData()
    } catch (error) {
      console.error('Error deleting orchestra:', error)
      setError('שגיאה במחיקת התזמורת')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDeleteOrchestra = () => {
    setShowDeleteConfirm(false)
    setOrchestraToDelete(null)
  }

  const handleViewDetails = (orchestraId: string) => {
    navigate(`/orchestras/${orchestraId}`)
  }

  const handleManageMembers = (orchestraId: string) => {
    setSelectedOrchestraId(orchestraId)
    setShowMemberManagement(true)
  }

  const handleCloseModals = () => {
    setShowMemberManagement(false)
    setSelectedOrchestraId(null)
  }

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'שם',
      render: (orchestra: Orchestra) => {
        const typeInfo = getOrchestraTypeInfo(orchestra.type)
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orchestras-bg text-orchestras-fg flex items-center justify-center flex-shrink-0">
              <MusicNoteIcon size={16} weight="regular" />
            </div>
            <div>
              <div className="font-medium text-slate-900">{orchestra.name}</div>
              <span className="text-xs text-muted-foreground">{typeInfo.text}</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'conductor',
      label: 'מנצח',
      render: (orchestra: Orchestra) => getConductorName(orchestra)
    },
    {
      key: 'members',
      label: 'חברים',
      render: (orchestra: Orchestra) => formatMemberCount(orchestra.memberIds?.length || 0)
    },
    {
      key: 'rehearsals',
      label: 'חזרות',
      render: (orchestra: Orchestra) => formatRehearsalCount(orchestra.rehearsalIds?.length || 0)
    },
    {
      key: 'location',
      label: 'מיקום',
      render: (orchestra: Orchestra) => orchestra.location
    },
    {
      key: 'status',
      label: 'סטטוס',
      render: (orchestra: Orchestra) => {
        const status = getOrchestraStatus(orchestra)
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700">
            {status.text}
          </span>
        )
      }
    }
  ]

  if (loading) {
    return (
      <div className="animate-fade-in">
        <TableSkeleton rows={6} cols={4} />
      </div>
    )
  }

  if (error && orchestras.length === 0) {
    return <ErrorState message={error} onRetry={loadData} />
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">תזמורות</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">ניהול הרכבים ותזמורות</p>
        </div>
        <div className="flex items-center gap-2">
          <HeroButton
            color="default"
            variant="bordered"
            size="sm"
            onPress={() => setShowEnsembleSummary(true)}
            startContent={<TablePhIcon size={14} weight="regular" />}
          >
            סיכום הרכבים
          </HeroButton>
          <HeroButton
            color="primary"
            variant="solid"
            size="sm"
            onPress={handleCreateOrchestra}
            startContent={<PlusIcon size={14} weight="bold" />}
            className="font-bold"
          >
            תזמורת חדשה
          </HeroButton>
        </div>
      </div>

      {/* Stat Cards -- always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { value: stats.totalOrchestras, label: 'סה״כ הרכבים' },
          { value: stats.activeOrchestras, label: 'הרכבים פעילים' },
          { value: stats.totalMembers, label: 'סה״כ חברים' },
          { value: stats.orchestrasReady, label: 'מוכנות מלאה' },
        ].map((s) => (
          <GlassStatCard key={s.label} value={s.value} label={s.label} size="sm" />
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* View Mode Toggle + Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
              viewMode === 'dashboard'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="לוח בקרה"
          >
            <ChartBarIcon size={14} weight="regular" />
            <span className="hidden sm:inline">לוח בקרה</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="תצוגת כרטיסים"
          >
            <SquaresFourIcon size={14} weight="regular" />
            <span className="hidden sm:inline">כרטיסים</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="תצוגת טבלה"
          >
            <ListIcon size={14} weight="regular" />
            <span className="hidden sm:inline">טבלה</span>
          </button>
        </div>

        {viewMode !== 'dashboard' && (
          <div className="flex items-center gap-3">
            <GlassSelect
              value={sortBy}
              onValueChange={(v) => setSortBy(v as any)}
              placeholder="מיון"
              options={[
                { value: 'name', label: 'מיון לפי שם' },
                { value: 'type', label: 'מיון לפי סוג' },
                { value: 'conductor', label: 'מיון לפי מנצח' },
                { value: 'memberCount', label: 'מיון לפי מספר חברים' },
                { value: 'location', label: 'מיון לפי מיקום' },
                { value: 'rehearsalCount', label: 'מיון לפי חזרות' },
              ]}
            />
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded hover:bg-slate-50 text-slate-600"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        )}
      </div>

      {/* Compact Filter Toolbar -- grid/table modes only */}
      {viewMode !== 'dashboard' && (
        <div className="flex items-center gap-3 flex-wrap px-1">
          <div className="w-64 flex-none">
            <SearchInput
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              onClear={() => setSearchQuery('')}
              placeholder="חיפוש תזמורות..."
            />
          </div>
          <GlassSelect
            value={filters.type || '__all__'}
            onValueChange={(v) => setFilters(prev => ({ ...prev, type: (v === '__all__' ? '' : v) as OrchestraType | '' }))}
            placeholder="כל הסוגים"
            options={[
              { value: '__all__', label: 'כל הסוגים' },
              ...VALID_ORCHESTRA_TYPES.map(type => ({ value: type, label: type }))
            ]}
          />
          <GlassSelect
            value={filters.conductorId || '__all__'}
            onValueChange={(v) => setFilters(prev => ({ ...prev, conductorId: v === '__all__' ? '' : v }))}
            placeholder="כל המנצחים"
            options={[
              { value: '__all__', label: 'כל המנצחים' },
              ...teachers.map((teacher: any) => ({ value: teacher._id, label: getDisplayName(teacher.personalInfo) }))
            ]}
          />
          <GlassSelect
            value={filters.location || '__all__'}
            onValueChange={(v) => setFilters(prev => ({ ...prev, location: (v === '__all__' ? '' : v) as LocationType | '' }))}
            placeholder="כל המיקומים"
            options={[
              { value: '__all__', label: 'כל המיקומים' },
              ...VALID_LOCATIONS.map(location => ({ value: location, label: location }))
            ]}
          />
          <GlassSelect
            value={filters.statusFilter || '__all__'}
            onValueChange={(v) => setFilters(prev => ({ ...prev, statusFilter: (v === '__all__' ? '' : v) as '' | 'active' | 'inactive' }))}
            placeholder="כל הסטטוסים"
            options={[
              { value: '__all__', label: 'כל הסטטוסים' },
              { value: 'active', label: 'פעילים בלבד' },
              { value: 'inactive', label: 'לא פעילים' },
            ]}
          />
          <span className="text-xs font-medium text-slate-400 mr-auto">
            {filteredAndSortedOrchestras.length} תזמורות
          </span>
        </div>
      )}

      {/* Data area -- grid/table views */}
      {viewMode !== 'dashboard' && (
        <>
          {filteredAndSortedOrchestras.length === 0 ? (
            searchQuery || filters.type || filters.conductorId || filters.location ? (
              <div className="text-center py-12 text-muted-foreground">לא נמצאו תזמורות התואמות לחיפוש</div>
            ) : (
              <EmptyState
                title="אין תזמורות עדיין"
                description="צור תזמורת חדשה כדי להתחיל"
                icon={<MusicNoteIcon size={48} weight="regular" />}
                action={{ label: 'תזמורת חדשה', onClick: handleCreateOrchestra }}
              />
            )
          ) : viewMode === 'table' ? (
            <Table
              data={filteredAndSortedOrchestras}
              columns={columns}
              onEdit={handleEditOrchestra}
              onDelete={(orchestra) => handleDeleteOrchestra(orchestra._id)}
              onView={(orchestra) => handleViewDetails(orchestra._id)}
              actions={true}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedOrchestras.map(orchestra => (
                <OrchestraCard
                  key={orchestra._id}
                  orchestra={orchestra}
                  onEdit={handleEditOrchestra}
                  onDelete={handleDeleteOrchestra}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <OrchestraManagementDashboard
          onViewDetails={handleViewDetails}
          onEditOrchestra={handleEditOrchestra}
          onManageMembers={handleManageMembers}
          onDeleteOrchestra={handleDeleteOrchestra}
        />
      )}

      {/* Orchestra Form Modal */}
      {showForm && (
        <OrchestraForm
          orchestra={editingOrchestra}
          teachers={allTeachers.length > 0 ? allTeachers : teachers}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingOrchestra(null)
          }}
        />
      )}


      {/* Member Management Modal */}
      {showMemberManagement && selectedOrchestraId && (
        <OrchestraMemberManagement
          orchestraId={selectedOrchestraId}
          isOpen={showMemberManagement}
          onClose={handleCloseModals}
          onUpdate={loadData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => { if (!open) cancelDeleteOrchestra() }}
        title="מחיקת תזמורת"
        description="האם אתה בטוח שברצונך למחוק את התזמורת?"
        itemName={orchestraToDelete?.name}
        confirmText="מחק תזמורת"
        cancelText="ביטול"
        onConfirm={confirmDeleteOrchestra}
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Ensemble Summary Modal */}
      <Modal
        isOpen={showEnsembleSummary}
        onClose={() => setShowEnsembleSummary(false)}
        title="סיכום הרכבים"
        maxWidth="4xl"
        className="!max-w-7xl"
      >
        {(() => {
          // Build teacher lookup map for conductor names
          const teacherMap = new Map<string, string>()
          allTeachers.forEach((t: any) => {
            teacherMap.set(t._id, getDisplayName(t.personalInfo))
          })
          const resolveConductorName = (orchestra: Orchestra) => {
            if (orchestra.conductorId && teacherMap.has(orchestra.conductorId)) {
              return teacherMap.get(orchestra.conductorId)!
            }
            const name = getConductorName(orchestra)
            return name === 'טוען נתוני מנצח...' ? '—' : name
          }

          // Compute totals for the summary
          const summaryOrchestras = orchestras.filter(o => o.isActive)
          const totalParticipants = summaryOrchestras.reduce((sum, o) => sum + (o.ministryData?.importedParticipantCount || 0), 0)
          const totalReportingHours = summaryOrchestras.reduce((sum, o) => sum + (o.ministryData?.totalReportingHours || 0), 0)
          const totalCoordHours = summaryOrchestras.reduce((sum, o) => sum + (o.ministryData?.coordinationHours || 0), 0)
          const totalActualHours = summaryOrchestras.reduce((sum, o) => {
            if (!o.scheduleSlots) return sum
            return sum + o.scheduleSlots.reduce((s: number, slot: any) => s + (slot.actualHours || 0), 0)
          }, 0)

          // Performance level breakdown
          const perfLevels = {
            'התחלתי': summaryOrchestras.filter(o => o.performanceLevel === 'התחלתי').length,
            'ביניים': summaryOrchestras.filter(o => o.performanceLevel === 'ביניים').length,
            'ייצוגי': summaryOrchestras.filter(o => o.performanceLevel === 'ייצוגי').length,
          }

          // SubType breakdown with participant counts
          const subTypeMap = new Map<string, { count: number; participants: number }>()
          summaryOrchestras.forEach(o => {
            const key = o.subType || 'ללא סיווג'
            const existing = subTypeMap.get(key) || { count: 0, participants: 0 }
            existing.count += 1
            existing.participants += o.ministryData?.importedParticipantCount || 0
            subTypeMap.set(key, existing)
          })
          const subTypeBreakdown = Array.from(subTypeMap.entries()).sort((a, b) => b[1].count - a[1].count)

          // Type breakdown (הרכב vs תזמורת)
          const typeBreakdown = {
            'תזמורת': summaryOrchestras.filter(o => o.type === 'תזמורת').length,
            'הרכב': summaryOrchestras.filter(o => o.type === 'הרכב').length,
          }

          // Chamber ensemble count (for payment calc)
          const chamberCount = summaryOrchestras.filter(o =>
            o.subType?.includes('קאמרי') || o.subType?.includes('קאמריי')
          ).length

          return (
            <div className="space-y-5">
              {/* Top Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{summaryOrchestras.length}</div>
                  <div className="text-xs text-blue-600">הרכבים פעילים</div>
                  <div className="text-[10px] text-blue-400 mt-1">{typeBreakdown['תזמורת']} תזמורות • {typeBreakdown['הרכב']} הרכבים</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">{totalParticipants}</div>
                  <div className="text-xs text-green-600">סה"כ משתתפים</div>
                  <div className="text-[10px] text-green-400 mt-1">ממוצע {summaryOrchestras.length > 0 ? Math.round(totalParticipants / summaryOrchestras.length) : 0} לגוף</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-700">{totalReportingHours}</div>
                  <div className="text-xs text-purple-600">סה"כ ש"ש דיווח</div>
                  <div className="text-[10px] text-purple-400 mt-1">ריכוז: {totalCoordHours} ש'</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-700">{totalActualHours}</div>
                  <div className="text-xs text-amber-600">סה"כ שעות בפועל</div>
                </div>
              </div>

              {/* Performance Level + SubType Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Performance Level Breakdown */}
                <div className="border border-neutral-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">רמת ביצוע להרכבים</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">התחלתי</span>
                      <span className="text-sm font-semibold text-slate-900">{perfLevels['התחלתי']}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-sky-100 text-sky-700">ביניים</span>
                      <span className="text-sm font-semibold text-slate-900">{perfLevels['ביניים']}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">ייצוגי</span>
                      <span className="text-sm font-semibold text-slate-900">{perfLevels['ייצוגי']}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-200 pt-2 mt-2">
                      <span className="text-xs font-medium text-slate-600">סה"כ עם רמת ביצוע</span>
                      <span className="text-sm font-bold text-slate-900">{perfLevels['התחלתי'] + perfLevels['ביניים'] + perfLevels['ייצוגי']}</span>
                    </div>
                  </div>
                </div>

                {/* SubType Breakdown */}
                <div className="border border-neutral-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">סך משתתפים בהרכבי נגינה</h4>
                  <div className="space-y-1.5">
                    {subTypeBreakdown.map(([subType, data]) => (
                      <div key={subType} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{subType}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-500 text-xs w-16 text-left">{data.count} גופים</span>
                          <span className="font-medium text-slate-900 w-16 text-left">{data.participants} משתתפים</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-neutral-200 pt-2 mt-2 font-semibold text-sm">
                      <span className="text-slate-900">סה"כ</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-700 text-xs w-16 text-left">{summaryOrchestras.length} גופים</span>
                        <span className="text-slate-900 w-16 text-left">{totalParticipants} משתתפים</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <span className="font-semibold">תשלום עבור הרכבים קאמריים: </span>
                תשלום 1 ש"ש עד 10 הרכבים קאמריים.
                למעט, קונסרבטוריון מעל 450 תלמידים — על כל 50 תלמידים נוספים 2 הרכבים קאמריים.
                {chamberCount > 0 && (
                  <span className="block mt-1 text-blue-600">
                    (כרגע {chamberCount} הרכבים קאמריים בקונסרבטוריון)
                  </span>
                )}
              </div>

              {/* Full Table */}
              <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                <table className="w-full text-sm" dir="rtl">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-2 py-2 text-right font-medium text-slate-700 w-8">#</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-700">שם</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-700">סוג</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-700">תת-סוג</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-700">רמת ביצוע</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-700">מנצח</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-700">משתתפים</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-700">לוח זמנים</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-700">שעות בפועל</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-700">ש"ש דיווח</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-700">ש' ריכוז</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryOrchestras.map((orchestra, idx) => {
                      const conductorName = resolveConductorName(orchestra)
                      const scheduleText = orchestra.scheduleSlots?.map((slot: any) => {
                        const dayName = slot.day || (['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][slot.dayOfWeek] ?? '')
                        return `${dayName} ${slot.startTime}-${slot.endTime}`
                      }).join(' | ') || '—'
                      const slotActualHours = orchestra.scheduleSlots?.reduce((s: number, slot: any) => s + (slot.actualHours || 0), 0) || 0

                      return (
                        <tr
                          key={orchestra._id}
                          className="border-b border-neutral-100 hover:bg-blue-50/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setShowEnsembleSummary(false)
                            handleViewDetails(orchestra._id)
                          }}
                        >
                          <td className="px-2 py-2 text-slate-400 text-xs">{idx + 1}</td>
                          <td className="px-2 py-2 font-medium text-slate-900 whitespace-nowrap">{orchestra.name}</td>
                          <td className="px-2 py-2">
                            <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-neutral-100 text-neutral-700">
                              {orchestra.type}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-slate-600 text-xs">{orchestra.subType || '—'}</td>
                          <td className="px-2 py-2">
                            {orchestra.performanceLevel ? (
                              <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                                orchestra.performanceLevel === 'ייצוגי'
                                  ? 'bg-amber-100 text-amber-700'
                                  : orchestra.performanceLevel === 'ביניים'
                                    ? 'bg-sky-100 text-sky-700'
                                    : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {orchestra.performanceLevel}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-2 py-2 text-slate-600 text-xs whitespace-nowrap">{conductorName}</td>
                          <td className="px-2 py-2 text-slate-600 text-center">{orchestra.ministryData?.importedParticipantCount ?? '—'}</td>
                          <td className="px-2 py-2 text-slate-600 text-xs whitespace-nowrap">{scheduleText}</td>
                          <td className="px-2 py-2 text-slate-600 text-center">{slotActualHours || '—'}</td>
                          <td className="px-2 py-2 text-slate-600 text-center">{orchestra.ministryData?.totalReportingHours ?? '—'}</td>
                          <td className="px-2 py-2 text-slate-600 text-center">{orchestra.ministryData?.coordinationHours ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-neutral-100 border-t-2 border-neutral-300 font-semibold text-sm">
                      <td className="px-2 py-2" colSpan={2}>סה"כ</td>
                      <td className="px-2 py-2" colSpan={4}></td>
                      <td className="px-2 py-2 text-slate-900 text-center">{totalParticipants}</td>
                      <td className="px-2 py-2"></td>
                      <td className="px-2 py-2 text-slate-900 text-center">{totalActualHours}</td>
                      <td className="px-2 py-2 text-slate-900 text-center">{totalReportingHours}</td>
                      <td className="px-2 py-2 text-slate-900 text-center">{totalCoordHours}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}