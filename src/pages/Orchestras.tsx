import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Filter, Music, Users, UserCheck, Calendar, Grid, List, MapPin, BarChart3, Settings, CheckCircle } from 'lucide-react'
import { Card } from '../components/ui/Card'
import Table from '../components/ui/Table'
import { ListPageHero } from '../components/ui/ListPageHero'
import { SearchInput } from '../components/ui/SearchInput'
import OrchestraForm from '../components/OrchestraForm'
import OrchestraCard from '../components/OrchestraCard'
import OrchestraManagementDashboard from '../components/OrchestraManagementDashboard'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingOrchestra, setEditingOrchestra] = useState<Orchestra | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'dashboard'>('dashboard')
  
  // Modal states (keeping member management modal for now)
  const [showMemberManagement, setShowMemberManagement] = useState(false)
  const [selectedOrchestraId, setSelectedOrchestraId] = useState<string | null>(null)

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
    isActive: true as boolean | undefined,
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
      const [orchestrasData, teachersData] = await Promise.all([
        orchestraService.getOrchestras(),
        teacherService.getTeachers({ role: 'מנצח' })
      ])
      
      setOrchestras(orchestrasData)
      // Include all conductors (including current user) so they can assign themselves
      setTeachers(teachersData)
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
      isActive: filters.isActive,
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

  // Hero metrics — 4 entity-colored stat cards
  const heroMetrics = [
    { title: 'סה״כ תזמורות', value: stats.totalOrchestras, icon: <Music className="w-5 h-5" /> },
    { title: 'פעילות', value: stats.activeOrchestras, icon: <CheckCircle className="w-5 h-5" /> },
    { title: 'סה״כ חברים', value: stats.totalMembers, icon: <Users className="w-5 h-5" /> },
    { title: 'עם מנצח', value: stats.orchestrasWithConductor, icon: <UserCheck className="w-5 h-5" /> },
  ]

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
              <Music className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{orchestra.name}</div>
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
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
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
      {/* Hero Stats Zone — always visible */}
      <ListPageHero
        title="תזמורות והרכבים"
        entityColor="orchestras"
        metrics={heroMetrics}
        action={{
          label: 'תזמורת חדשה',
          onClick: handleCreateOrchestra
        }}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* View Mode Toggle + Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center border border-gray-200 rounded overflow-hidden">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`p-2 text-sm ${viewMode === 'dashboard' ? 'bg-orchestras-fg text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            title="לוח בקרה"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 text-sm ${viewMode === 'grid' ? 'bg-orchestras-fg text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            title="תצוגת כרטיסים"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 text-sm ${viewMode === 'table' ? 'bg-orchestras-fg text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            title="תצוגת טבלה"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {viewMode !== 'dashboard' && (
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded"
            >
              <option value="name">מיון לפי שם</option>
              <option value="type">מיון לפי סוג</option>
              <option value="conductor">מיון לפי מנצח</option>
              <option value="memberCount">מיון לפי מספר חברים</option>
              <option value="location">מיון לפי מיקום</option>
              <option value="rehearsalCount">מיון לפי חזרות</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        )}
      </div>

      {/* Compact Filter Toolbar — grid/table modes only */}
      {viewMode !== 'dashboard' && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-64 flex-none">
            <SearchInput
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              onClear={() => setSearchQuery('')}
              placeholder="חיפוש תזמורות..."
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as OrchestraType | '' }))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded"
          >
            <option value="">כל הסוגים</option>
            {VALID_ORCHESTRA_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={filters.conductorId}
            onChange={(e) => setFilters(prev => ({ ...prev, conductorId: e.target.value }))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded"
          >
            <option value="">כל המנצחים</option>
            {teachers.map((teacher: any) => (
              <option key={teacher._id} value={teacher._id}>{getDisplayName(teacher.personalInfo)}</option>
            ))}
          </select>
          <select
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value as LocationType | '' }))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded"
          >
            <option value="">כל המיקומים</option>
            {VALID_LOCATIONS.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={filters.isActive === true}
              onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.checked ? true : undefined }))}
              className="w-4 h-4 text-primary border-border rounded ml-2"
            />
            רק פעילות
          </label>
          <span className="text-sm text-muted-foreground mr-auto">
            {filteredAndSortedOrchestras.length} תזמורות
          </span>
        </div>
      )}

      {/* Data area — grid/table views */}
      {viewMode !== 'dashboard' && (
        <>
          {filteredAndSortedOrchestras.length === 0 ? (
            searchQuery || filters.type || filters.conductorId || filters.location ? (
              <div className="text-center py-12 text-muted-foreground">לא נמצאו תזמורות התואמות לחיפוש</div>
            ) : (
              <EmptyState
                title="אין תזמורות עדיין"
                description="צור תזמורת חדשה כדי להתחיל"
                icon={<Music className="w-12 h-12" />}
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
          teachers={teachers}
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
    </div>
  )
}