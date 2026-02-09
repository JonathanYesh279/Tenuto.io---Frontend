import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Music, Users, UserCheck, Calendar, Grid, List, MapPin, BarChart3, Settings } from 'lucide-react'
import { Card } from '../components/ui/card'
import Table from '../components/ui/Table'
import StatsCard from '../components/ui/StatsCard'
import OrchestraForm from '../components/OrchestraForm'
import OrchestraCard from '../components/OrchestraCard'
import OrchestraManagementDashboard from '../components/OrchestraManagementDashboard'
import OrchestraMemberManagement from '../components/OrchestraMemberManagement'
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal'
import { orchestraService, teacherService } from '../services/apiService'
import { useAuth } from '../services/authContext'
import { useSchoolYear } from '../services/schoolYearContext'
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
          <div className="flex items-center">
            <span className="text-lg ml-2">{typeInfo.icon}</span>
            <div>
              <div className="font-medium text-gray-900">{orchestra.name}</div>
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                {typeInfo.text}
              </span>
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען תזמורות...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-end items-center">
        <button
          onClick={handleCreateOrchestra}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 ml-2" />
          תזמורת חדשה
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters and Search - Only show for grid and table views */}
      {viewMode !== 'dashboard' && (
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="חיפוש תזמורות..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="md:w-48">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as OrchestraType | '' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">כל הסוגים</option>
                {VALID_ORCHESTRA_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Conductor Filter */}
            <div className="md:w-48">
              <select
                value={filters.conductorId}
                onChange={(e) => setFilters(prev => ({ ...prev, conductorId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">כל המנצחים</option>
                {teachers.map((teacher: any) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.personalInfo?.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="md:w-48">
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value as LocationType | '' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">כל המיקומים</option>
                {VALID_LOCATIONS.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Active Status */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isActive === true}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  isActive: e.target.checked ? true : undefined 
                }))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="mr-2 text-sm text-gray-700">רק פעילות</span>
            </label>

            {/* Has Members */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasMembers === true}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  hasMembers: e.target.checked ? true : undefined 
                }))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="mr-2 text-sm text-gray-700">עם חברים</span>
            </label>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setFilters({ 
                  type: '', 
                  conductorId: '', 
                  location: '', 
                  isActive: undefined, 
                  hasMembers: undefined 
                })
                setSearchQuery('')
              }}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 inline ml-1" />
              נקה מסננים
            </button>
          </div>
        </div>
      </Card>
      )}

      {/* Orchestras List/Grid - Only show for grid and table views */}
      {viewMode !== 'dashboard' && (
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            תזמורות והרכבים ({filteredAndSortedOrchestras.length})
          </h3>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`p-2 ${viewMode === 'dashboard' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="לוח בקרה"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="תצוגת כרטיסים"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="תצוגת טבלה"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Controls */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              title={sortOrder === 'asc' ? 'מיון יורד' : 'מיון עולה'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            <button
              onClick={loadData}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              רענן
            </button>
          </div>
        </div>

        {filteredAndSortedOrchestras.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין תזמורות</h3>
            <p className="text-gray-600 mb-4">התחל על ידי יצירת התזמורת הראשונה</p>
            <button
              onClick={handleCreateOrchestra}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 ml-2" />
              צור תזמורת ראשונה
            </button>
          </div>
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
      </Card>
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

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        title="מחיקת תזמורת"
        message="האם אתה בטוח שברצונך למחוק את התזמורת?"
        itemName={orchestraToDelete?.name}
        confirmText="מחק תזמורת"
        onConfirm={confirmDeleteOrchestra}
        onCancel={cancelDeleteOrchestra}
        isLoading={isDeleting}
      />
    </div>
  )
}