import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus, Filter, Loader, Calendar, Users, X, Grid, List, Eye, Edit, Trash2, ChevronDown } from 'lucide-react'
import { Card } from '../components/ui/Card'
import Table, { StatusBadge } from '../components/ui/Table'
import TeacherCard from '../components/TeacherCard'
import AddTeacherModal from '../components/modals/AddTeacherModal'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import apiService from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'
import { useAuth } from '../services/authContext'
import { getDisplayName } from '../utils/nameUtils'
import { TableSkeleton } from '../components/feedback/Skeleton'
import { EmptyState } from '../components/feedback/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState'

interface Teacher {
  id: string
  name: string
  specialization: string
  roles: string[]
  primaryRole: string
  studentCount: number
  email: string
  phone: string
  isActive: boolean
  hasTimeBlocks: boolean
  timeBlockCount: number
  orchestraCount: number
  ensembleCount: number
  availabilityDays: string[]
  totalTeachingHours: number
  rawData: any
}

// Helper function to check if user is admin
const isUserAdmin = (user: any): boolean => {
  if (!user) {
    return false
  }

  // Check for admin role in different formats
  const hasAdminInRoles = user?.roles?.includes('מנהל')
  const hasAdminEnglish = user?.roles?.includes('admin')
  const hasSingleAdminRole = user?.role === 'admin'
  const hasHebrewAdminRole = user?.role === 'מנהל'

  const hasAdminRole = hasAdminInRoles || hasAdminEnglish || hasSingleAdminRole || hasHebrewAdminRole

  return hasAdminRole
}

export default function Teachers() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { currentSchoolYear, isLoading: schoolYearLoading } = useSchoolYear()

  // Initialize state from URL params for persistence
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({
    instrument: searchParams.get('instrument') || '',
    role: searchParams.get('role') || ''
  })
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [totalTeachersCount, setTotalTeachersCount] = useState(0)
  const TEACHERS_PER_PAGE = 20
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [scheduleData, setScheduleData] = useState(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [instrumentSearchTerm, setInstrumentSearchTerm] = useState(searchParams.get('instrument') || '')
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>((searchParams.get('view') as 'table' | 'grid') || 'table')
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false)
  const [teacherToEdit, setTeacherToEdit] = useState(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null)

  // Debounce search term - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Sync filter state to URL params for persistence
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (filters.instrument) params.set('instrument', filters.instrument)
    if (filters.role) params.set('role', filters.role)
    if (viewMode !== 'table') params.set('view', viewMode)

    // Update URL without causing navigation
    const newSearch = params.toString()
    const currentSearch = searchParams.toString()
    if (newSearch !== currentSearch) {
      setSearchParams(params, { replace: true })
    }
  }, [searchTerm, filters.instrument, filters.role, viewMode])

  // Fetch teachers from real API when school year changes
  useEffect(() => {
    if (!schoolYearLoading) {
      // Load even if no school year is selected, backend will handle it
      loadTeachers(1, false)
    }
  }, [currentSchoolYear, schoolYearLoading])

  const loadTeachers = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        // Only show full page loading on initial load
        if (isInitialLoad) {
          setLoading(true)
        } else {
          setSearchLoading(true)
        }
        setCurrentPage(1)
        setHasMore(true)
      }
      setError(null)

      console.log('Loading teachers for page:', page)

      // Include schoolYearId, search, filters and pagination in the request
      const apiFilters = {
        ...(currentSchoolYear ? { schoolYearId: currentSchoolYear._id } : {}),
        // Add search and filter parameters (using debounced search term)
        ...(debouncedSearchTerm ? { name: debouncedSearchTerm } : {}),
        ...(filters.instrument ? { instrument: filters.instrument } : {}),
        ...(filters.role ? { role: filters.role } : {}),
        page,
        limit: TEACHERS_PER_PAGE
      }
      const result = await apiService.teachers.getTeachers(apiFilters)

      let teachersData
      let paginationMeta = null

      // Check if response is paginated
      if (result.data && result.pagination) {
        teachersData = result.data
        paginationMeta = result.pagination
        setHasMore(result.pagination.hasNextPage)
        setTotalTeachersCount(result.pagination.totalCount)
        console.log('Loaded teachers page', page, ':', result.data.length, '/', result.pagination.totalCount)
      } else {
        // Fallback for non-paginated response
        teachersData = result
        setHasMore(false)
        setTotalTeachersCount(result.length)
        console.log('Loaded all teachers:', result.length)
      }

      // Filter out current user from the list and use processed data from API service with computed fields
      const filteredTeachers = teachersData.filter(teacher => teacher._id !== user?._id)
      const transformedTeachers = filteredTeachers.map(teacher => ({
        id: teacher._id,
        name: getDisplayName(teacher.personalInfo) || 'לא צוין',
        specialization: teacher.professionalInfo?.instrument || 'לא צוין',
        // Use roles array from database
        roles: teacher.allRoles || teacher.roles || [],
        primaryRole: teacher.primaryRole || 'לא מוגדר',
        // Use computed student count
        studentCount: teacher.studentCount || 0,
        // Contact information
        email: teacher.personalInfo?.email || '',
        phone: teacher.personalInfo?.phone || '',
        // Use computed active status (checks both levels)
        isActive: teacher.isTeacherActive,
        // Additional computed fields
        hasTimeBlocks: teacher.hasTimeBlocks || false,
        timeBlockCount: teacher.timeBlockCount || 0,
        orchestraCount: teacher.orchestraCount || 0,
        ensembleCount: teacher.ensembleCount || 0,
        availabilityDays: teacher.availabilityDays || [],
        totalTeachingHours: Math.round((teacher.totalTeachingHours / 60) * 10) / 10 || 0, // Convert to hours
        rawData: teacher, // Keep original data
        // Table display fields
        rolesDisplay: teacher.allRoles?.length > 0 ? teacher.allRoles.join(', ') : 'לא מוגדר',
        status: <StatusBadge status={teacher.isTeacherActive ? "active" : "inactive"}>
          {teacher.isTeacherActive ? 'פעיל' : 'לא פעיל'}
        </StatusBadge>
      }))

      // Either append to existing teachers or replace them
      if (append) {
        setTeachers(prevTeachers => [...prevTeachers, ...transformedTeachers])
      } else {
        setTeachers(transformedTeachers)
      }
    } catch (err) {
      console.error('Error loading teachers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setSearchLoading(false)
      setLoadingMore(false)
      setIsInitialLoad(false)
    }
  }

  const handleViewSchedule = async (teacherId) => {
    try {
      setScheduleLoading(true)
      const teacher = teachers.find(t => t.id === teacherId)
      setSelectedTeacher(teacher)
      
      const response = await apiService.teachers.getTeacherWeeklySchedule(teacherId)
      
      // Process response data
      const scheduleByDay = {}
      if (response.schedule) {
        response.schedule.forEach(lesson => {
          const day = lesson.day
          if (!scheduleByDay[day]) scheduleByDay[day] = []
          
          scheduleByDay[day].push({
            lessonId: lesson.lessonId,
            studentId: lesson.studentId,
            studentName: lesson.studentName,
            time: lesson.time,
            duration: lesson.duration,
            location: lesson.location,
            instrument: lesson.instrumentName,
            currentStage: lesson.currentStage,
            endTime: lesson.endTime
          })
        })
      }
      
      setScheduleData(scheduleByDay)
    } catch (error) {
      console.error('Error loading teacher schedule:', error)
      setError('שגיאה בטעינת לוח הזמנים')
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleCloseSchedule = () => {
    setSelectedTeacher(null)
    setScheduleData(null)
  }

  const handleViewTeacher = (teacherId: string) => {
    const targetPath = `/teachers/${teacherId}`

    // Force navigation with window.location as fallback
    try {
      navigate(targetPath)
    } catch (error) {
      window.location.href = targetPath
    }
  }

  const handleEditTeacher = async (teacherId: string) => {
    try {
      // Fetch the full teacher data
      const teacher = await apiService.teachers.getTeacher(teacherId)
      setTeacherToEdit(teacher)
      setModalMode('edit')
      setShowAddTeacherModal(true)
    } catch (error) {
      console.error('Error loading teacher for edit:', error)
      alert('שגיאה בטעינת נתוני המורה')
    }
  }

  const handleDeleteTeacher = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId)
    if (!teacher) return

    setTeacherToDelete(teacher)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete) return

    try {
      await apiService.teachers.deleteTeacher(teacherToDelete.id)
      // Refresh the teachers list from page 1
      loadTeachers(1, false)
      setShowDeleteConfirm(false)
      setTeacherToDelete(null)
    } catch (error) {
      console.error('Error deleting teacher:', error)
      alert('שגיאה במחיקת המורה: ' + (error.message || 'אירעה שגיאה'))
      setShowDeleteConfirm(false)
      setTeacherToDelete(null)
    }
  }

  const cancelDeleteTeacher = () => {
    setShowDeleteConfirm(false)
    setTeacherToDelete(null)
  }

  const handleAddTeacher = () => {
    const isAdmin = isUserAdmin(user)

    if (isAdmin) {
      setTeacherToEdit(null)
      setModalMode('add')
      setShowAddTeacherModal(true)
    } else {
      alert('רק מנהלים יכולים להוסיף מורים')
    }
  }

  const handleTeacherAdded = (newTeacher: any) => {
    // Refresh the teachers list from page 1
    if (!schoolYearLoading) {
      loadTeachers(1, false)
    }
  }

  // Handle loading more teachers
  const handleLoadMore = async () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    await loadTeachers(nextPage, true)
  }

  // Reload teachers from page 1 when filters or debounced search change
  useEffect(() => {
    if (!schoolYearLoading) {
      loadTeachers(1, false)
    }
  }, [debouncedSearchTerm, filters.instrument, filters.role])

  // Available instruments list - base instruments only
  const allInstruments = [
    'כינור', 'ויולה', "צ'לו", 'קונטרבס',
    'גיטרה', 'גיטרה בס',
    'חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט',
    'חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון',
    'פסנתר',
    'תופים',
    'שירה'
  ]

  // Filter instruments based on search term
  const filteredInstruments = allInstruments.filter(instrument =>
    instrument.toLowerCase().includes(instrumentSearchTerm.toLowerCase())
  )

  // Handle instrument selection
  const handleInstrumentSelect = (instrument: string, instrumentName: string) => {
    setFilters(prev => ({ ...prev, instrument: instrument }))
    setInstrumentSearchTerm(instrumentName)
    setShowInstrumentDropdown(false)
  }

  // Handle instrument search input
  const handleInstrumentSearchChange = (value: string) => {
    setInstrumentSearchTerm(value)
    setShowInstrumentDropdown(true)
    
    // If the input is cleared, clear the filter
    if (value === '') {
      setFilters(prev => ({ ...prev, instrument: '' }))
    }
  }

  // Filter teachers - backend handles name and role filtering, but instrument is client-side
  // since the backend doesn't support instrument parameter for teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      if (!filters.instrument) return true

      const teacherInstrument = (teacher.specialization || '').toLowerCase().trim()
      const filterInstrument = filters.instrument.toLowerCase().trim()

      // Check for exact match, contains, or the filter is contained in teacher's instrument
      // This handles cases like "כינור" matching "כינור בארוק" and vice versa
      return teacherInstrument === filterInstrument ||
             teacherInstrument.includes(filterInstrument) ||
             filterInstrument.includes(teacherInstrument)
    })
  }, [teachers, filters.instrument])

  // Calculate statistics using correct database structure
  // Use totalTeachersCount from pagination when available, otherwise use loaded teachers length
  const totalTeachers = totalTeachersCount > 0 ? totalTeachersCount : teachers.length
  const activeTeachers = teachers.filter(t => t.isActive).length
  const totalStudents = teachers.reduce((sum, t) => sum + t.studentCount, 0)
  const avgStudentsPerTeacher = totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : 0

  // Additional statistics from enhanced data (based on loaded teachers only)
  const teachersWithAvailability = teachers.filter(t => t.hasTimeBlocks).length
  const totalTeachingHours = teachers.reduce((sum, t) => sum + t.totalTeachingHours, 0)
  const teachersWithOrchestras = teachers.filter(t => t.orchestraCount > 0).length

  // Table columns definition
  const columns = [
    { key: 'name', header: 'שם המורה' },
    { key: 'specialization', header: 'התמחות' },
    { key: 'rolesDisplay', header: 'תפקידים' },
    { key: 'studentCount', header: 'מס\' תלמידים', align: 'center' as const },
    { key: 'status', header: 'סטטוס', align: 'center' as const },
    {
      key: 'actions',
      header: 'פעולות',
      align: 'center' as const,
      width: '100px',
      render: (row: any) => (
        <div className="flex space-x-2 space-x-reverse justify-center">
          <button
            className="p-1.5 text-primary-600 hover:text-primary-900 hover:bg-primary-100 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleViewTeacher(row.id)
            }}
            title="צפה בפרטי המורה"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleEditTeacher(row.id)
            }}
            title="ערוך פרטי המורה"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteTeacher(row.id)
            }}
            title="מחק מורה"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ]

  // Schedule display component
  const renderSchedule = () => {
    if (!selectedTeacher || !scheduleData) return null

    const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        style={{
          position: 'fixed !important',
          top: '0 !important',
          left: '0 !important',
          right: '0 !important',
          bottom: '0 !important',
          display: 'flex !important',
          alignItems: 'center !important',
          justifyContent: 'center !important',
          zIndex: 9999
        }}
      >
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                לוח זמנים - {selectedTeacher.name}
              </h2>
              <button 
                onClick={handleCloseSchedule}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {scheduleLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary-600" />
                <span className="mr-3 text-gray-600">טוען לוח זמנים...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hebrewDays.map(day => (
                  <Card key={day} padding="md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                      {day}
                    </h3>
                    <div className="space-y-3">
                      {scheduleData[day] && scheduleData[day].length > 0 ? (
                        scheduleData[day].map((lesson, index) => (
                          <div key={lesson.lessonId || index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {lesson.time}-{lesson.endTime}
                            </div>
                            <div className="text-sm text-gray-700">
                              {lesson.studentName} | {lesson.instrument} | שלב {lesson.currentStage}
                            </div>
                            {lesson.location && (
                              <div className="text-xs text-gray-500 mt-1">
                                מיקום: {lesson.location}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-6">
                          אין שיעורים ביום {day}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <TableSkeleton rows={8} cols={5} />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => loadTeachers(1, false)} />
  }

  return (
    <div>
      {renderSchedule()}
      {/* Search and Filters Container */}
      <Card className="mb-6" padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש מורים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            {/* Instrument Filter - Searchable */}
            <div className="relative">
              <input
                type="text"
                placeholder="חפש כלי נגינה..."
                value={instrumentSearchTerm}
                onChange={(e) => handleInstrumentSearchChange(e.target.value)}
                onFocus={() => setShowInstrumentDropdown(true)}
                onBlur={() => {
                  // Delay hiding dropdown to allow click events
                  setTimeout(() => setShowInstrumentDropdown(false), 200)
                }}
                className="w-48 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder-gray-500"
              />
              
              {/* Clear button */}
              {instrumentSearchTerm && (
                <button
                  onClick={() => {
                    setInstrumentSearchTerm('')
                    setFilters(prev => ({ ...prev, instrument: '' }))
                    setShowInstrumentDropdown(false)
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Dropdown */}
              {showInstrumentDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 direction-rtl">
                  {/* "All instruments" option */}
                  <button
                    onClick={() => handleInstrumentSelect('', 'כל הכלים')}
                    className={`w-full text-right px-3 py-2 hover:bg-gray-50 border-b border-gray-100 direction-rtl ${
                      filters.instrument === '' ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                    }`}
                  >
                    כל הכלים
                  </button>
                  
                  {/* Instrument options */}
                  {filteredInstruments.map(instrument => (
                    <button
                      key={instrument}
                      onClick={() => handleInstrumentSelect(instrument, instrument)}
                      className={`w-full text-right px-3 py-2 hover:bg-gray-50 direction-rtl ${
                        filters.instrument === instrument ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                      }`}
                    >
                      {instrument}
                    </button>
                  ))}
                  
                  {filteredInstruments.length === 0 && instrumentSearchTerm && (
                    <div className="px-3 py-2 text-gray-500 text-center">
                      לא נמצאו כלים
                    </div>
                  )}
                </div>
              )}
            </div>
            <select 
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            >
              <option value="">כל התפקידים</option>
              <option value="מורה">מורה</option>
              <option value="מנצח">מנצח</option>
              <option value="מדריך הרכב">מדריך הרכב</option>
              <option value="מנהל">מנהל</option>
              <option value="מורה תאוריה">מורה תאוריה</option>
              <option value="מגמה">מגמה</option>
            </select>
            {/* Show Add Teacher button for admins */}
            {isUserAdmin(user) && (
              <button
                onClick={handleAddTeacher}
                className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                title="Add Teacher"
              >
                <Plus className="w-4 h-4 ml-2" />
                הוסף מורה
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">{totalTeachers}</div>
            <div className="text-xs text-gray-600">סה״כ מורים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-success-600 mb-1">{activeTeachers}</div>
            <div className="text-xs text-gray-600">פעילים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{totalStudents}</div>
            <div className="text-xs text-gray-600">סה״כ תלמידים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{avgStudentsPerTeacher}</div>
            <div className="text-xs text-gray-600">ממוצע תלמידים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">{teachersWithAvailability}</div>
            <div className="text-xs text-gray-600">עם זמינות</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600 mb-1">{Math.round(totalTeachingHours)}</div>
            <div className="text-xs text-gray-600">שעות זמינות</div>
          </div>
        </Card>
      </div>

      {/* Results Info and View Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {searchTerm || filters.instrument || filters.role ? (
            <span>
              מציג {filteredTeachers.length} מורים מתוך {totalTeachers} סה"כ
              {hasMore && <span className="text-primary-600 font-medium"> (טען עוד לתוצאות נוספות)</span>}
            </span>
          ) : (
            <span>
              מציג {teachers.length} מתוך {totalTeachers} מורים
              {hasMore && <span className="text-primary-600 font-medium"> (טען עוד לצפייה בנוספים)</span>}
            </span>
          )}
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => setViewMode('table')}
            className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2 ${
              viewMode === 'table'
                ? 'bg-white text-primary-700 shadow-sm border border-gray-200 ring-1 ring-primary-500/20'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
            aria-pressed={viewMode === 'table'}
            aria-label="תצוגת טבלה"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">טבלה</span>
            {viewMode === 'table' && (
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary-500/5 to-primary-600/5 pointer-events-none" />
            )}
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2 ${
              viewMode === 'grid'
                ? 'bg-white text-primary-700 shadow-sm border border-gray-200 ring-1 ring-primary-500/20'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
            aria-pressed={viewMode === 'grid'}
            aria-label="תצוגת רשת"
          >
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">רשת</span>
            {viewMode === 'grid' && (
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary-500/5 to-primary-600/5 pointer-events-none" />
            )}
          </button>
        </div>
      </div>

      {/* Teachers Display */}
      <div className="relative">
        {searchLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
              <div className="text-sm text-gray-600">מחפש מורים...</div>
            </div>
          </div>
        )}

      {viewMode === 'table' ? (
        <Table
          columns={columns}
          data={filteredTeachers}
          onRowClick={(row) => {
            handleViewTeacher(row.id)
          }}
          rowClassName="hover:bg-gray-50 cursor-pointer transition-colors"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredTeachers.map((teacher) => {
            // Transform teacher data to match TeacherCard interface
            const teacherForCard = {
              _id: teacher.id,
              personalInfo: {
                firstName: teacher.rawData?.personalInfo?.firstName || teacher.name,
                lastName: teacher.rawData?.personalInfo?.lastName || '',
                phone: teacher.phone,
                email: teacher.email
              },
              roles: teacher.roles || [],
              professionalInfo: {
                instrument: teacher.specialization,
                isActive: teacher.isActive // Use the computed isActive from API
              },
              studentCount: teacher.studentCount || 0,
              teaching: {
                schedule: [] // Will be populated if needed
              },
              isActive: teacher.isActive
            }
            
            return (
              <TeacherCard
                key={teacher.id}
                teacher={teacherForCard}
                showStudentCount={true}
                showSchedule={false}
                showContact={false}
                onClick={() => handleViewTeacher(teacher.id)}
                className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1"
              />
            )
          })}
        </div>
      )}

      {filteredTeachers.length === 0 && !loading && !searchLoading && (
        searchTerm || filters.instrument || filters.role ? (
          <div className="text-center py-12 text-muted-foreground">לא נמצאו מורים התואמים לחיפוש</div>
        ) : (
          <EmptyState
            title="אין מורים עדיין"
            description="הוסף מורים לקונסרבטוריון כדי להתחיל"
            icon={<Users className="w-12 h-12" />}
            action={{ label: 'הוסף מורה', onClick: () => setShowAddTeacherModal(true) }}
          />
        )
      )}
      </div>

      {/* Load More Button */}
      {hasMore && filteredTeachers.length > 0 && !loading && (
        <div className="flex justify-center mt-8 mb-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loadingMore ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>טוען עוד מורים...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                <span>טען עוד מורים</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Add/Edit Teacher Modal */}
      <AddTeacherModal
        isOpen={showAddTeacherModal}
        onClose={() => {
          setShowAddTeacherModal(false)
          setTeacherToEdit(null)
          setModalMode('add')
        }}
        onTeacherAdded={handleTeacherAdded}
        teacherToEdit={teacherToEdit}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="מחיקת מורה"
        message={teacherToDelete ? `האם אתה בטוח שברצונך למחוק את המורה ${teacherToDelete.name}? פעולה זו היא בלתי הפיכה.` : ''}
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={confirmDeleteTeacher}
        onCancel={cancelDeleteTeacher}
        variant="danger"
      />
    </div>
  )
}