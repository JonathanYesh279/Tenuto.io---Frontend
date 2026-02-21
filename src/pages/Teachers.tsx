import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PlusIcon, CircleNotchIcon, UsersIcon, XIcon, SquaresFourIcon, ListIcon, ArrowUpRightIcon, PencilLineIcon, TrashIcon, CaretDownIcon, UserCircleIcon } from '@phosphor-icons/react'
import { Card } from '../components/ui/Card'
import Table from '../components/ui/Table'
import { StatusBadge, InstrumentBadge } from '../components/domain'
import { SearchInput } from '../components/ui/SearchInput'
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
import { RoleDistributionPanel } from '../components/teachers/RoleDistributionPanel'

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
        status: <StatusBadge status={teacher.isTeacherActive ? 'פעיל' : 'לא פעיל'} />
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
  const avgStudentsPerTeacher = activeTeachers > 0
    ? Math.round(teachers.reduce((sum, t) => sum + t.studentCount, 0) / activeTeachers * 10) / 10
    : 0
  const totalTeachingHours = Math.round(teachers.reduce((sum, t) => sum + t.totalTeachingHours, 0) * 10) / 10

  // Table columns definition
  const columns = [
    {
      key: 'name',
      header: 'שם המורה',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 text-slate-300 dark:text-slate-600">
            <UserCircleIcon size={40} weight="fill" />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{row.name}</span>
        </div>
      )
    },
    {
      key: 'specialization',
      header: 'התמחות',
      render: (row: any) => row.specialization && row.specialization !== 'לא צוין'
        ? <InstrumentBadge instrument={row.specialization} />
        : <span className="text-muted-foreground">לא צוין</span>
    },
    { key: 'rolesDisplay', header: 'תפקידים' },
    { key: 'studentCount', header: 'מס\' תלמידים', align: 'center' as const },
    { key: 'status', header: 'סטטוס', align: 'center' as const },
    {
      key: 'actions',
      header: 'פעולות',
      align: 'center' as const,
      width: '100px',
      render: (row: any) => (
        <div className="flex items-center gap-0.5 justify-center">
          <button
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleViewTeacher(row.id)
            }}
            title="צפה בפרטי המורה"
          >
            <ArrowUpRightIcon size={15} weight="regular" />
          </button>
          <button
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleEditTeacher(row.id)
            }}
            title="ערוך פרטי המורה"
          >
            <PencilLineIcon size={15} weight="regular" />
          </button>
          <button
            className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteTeacher(row.id)
            }}
            title="מחק מורה"
          >
            <TrashIcon size={15} weight="regular" />
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
                <CircleNotchIcon size={32} weight="regular" className="animate-spin text-primary" />
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
                          <div key={lesson.lessonId || index} className="bg-gray-50 p-3 rounded">
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
    <div className="space-y-4">
      {renderSchedule()}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">מורים</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{activeTeachers} פעילים מתוך {totalTeachers}</p>
        </div>
        {isUserAdmin(user) && (
          <button
            onClick={handleAddTeacher}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <PlusIcon size={16} weight="bold" />
            הוסף מורה
          </button>
        )}
      </div>

      {/* Analytics Section: 3 columns — Stats | Top Teachers | Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-[160px]">
        {/* RIGHT: 2x2 Stat Cards */}
        <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
          {[
            { value: totalTeachers, label: 'סה״כ מורים' },
            { value: activeTeachers, label: 'מורים פעילים' },
            { value: avgStudentsPerTeacher, label: 'ממוצע תלמידים/מורה' },
            { value: totalTeachingHours, label: 'שעות הוראה' },
          ].map((s) => (
            <div key={s.label} className="bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-sky-900/40 dark:to-cyan-900/40 rounded-xl flex flex-col items-center justify-center">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">{typeof s.value === 'number' ? s.value.toLocaleString('he-IL') : s.value}</h3>
              <p className="text-[10px] font-bold text-sky-800/50 dark:text-sky-300/50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* MIDDLE: Top Teachers by Student Count */}
        <div className="bg-white dark:bg-sidebar-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 px-4 py-3 flex flex-col h-full overflow-hidden">
          <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">מורים מובילים</h3>
          <div className="space-y-1.5 flex-1 overflow-y-auto">
            {(() => {
              const top = [...teachers].sort((a, b) => b.studentCount - a.studentCount).slice(0, 5)
              if (top.length === 0) return <p className="text-[10px] text-slate-400 text-center py-2">אין נתונים</p>
              const maxSc = top[0]?.studentCount || 1
              return top.map((t, i) => (
                <div key={t.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 w-3 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200 truncate">{t.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 mr-1">{t.studentCount}</span>
                    </div>
                    <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-400 dark:bg-indigo-500 transition-all duration-500" style={{ width: `${Math.round((t.studentCount / maxSc) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>

        {/* LEFT: Role Distribution Panel */}
        <RoleDistributionPanel teachers={teachers} loading={loading} />
      </div>

      {/* Table Card Container */}
      <div className="bg-white dark:bg-sidebar-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Card Header: Filters + View Toggle */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-64 flex-none">
              <SearchInput
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                onClear={() => setSearchTerm('')}
                placeholder="חיפוש מורים..."
                isLoading={searchLoading}
              />
            </div>
            {/* Instrument searchable dropdown */}
            <div className="relative">
              <input
                type="text"
                placeholder="כלי נגינה..."
                value={instrumentSearchTerm}
                onChange={(e) => handleInstrumentSearchChange(e.target.value)}
                onFocus={() => setShowInstrumentDropdown(true)}
                onBlur={() => setTimeout(() => setShowInstrumentDropdown(false), 200)}
                className="w-40 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white dark:bg-slate-800 text-foreground placeholder-muted-foreground"
              />
              {instrumentSearchTerm && (
                <button
                  onClick={() => { setInstrumentSearchTerm(''); setFilters(prev => ({ ...prev, instrument: '' })); setShowInstrumentDropdown(false) }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XIcon size={12} weight="regular" />
                </button>
              )}
              {showInstrumentDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 direction-rtl">
                  <button
                    onClick={() => handleInstrumentSelect('', 'כל הכלים')}
                    className={`w-full text-right px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 direction-rtl ${
                      filters.instrument === '' ? 'bg-primary/5 text-primary font-medium' : 'text-foreground'
                    }`}
                  >
                    כל הכלים
                  </button>
                  {filteredInstruments.map(instrument => (
                    <button
                      key={instrument}
                      onClick={() => handleInstrumentSelect(instrument, instrument)}
                      className={`w-full text-right px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 direction-rtl ${
                        filters.instrument === instrument ? 'bg-primary/5 text-primary font-medium' : 'text-foreground'
                      }`}
                    >
                      {instrument}
                    </button>
                  ))}
                  {filteredInstruments.length === 0 && instrumentSearchTerm && (
                    <div className="px-3 py-2 text-slate-400 text-center text-sm">לא נמצאו כלים</div>
                  )}
                </div>
              )}
            </div>
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white dark:bg-slate-800 text-foreground"
            >
              <option value="">כל התפקידים</option>
              <option value="מורה">מורה</option>
              <option value="מנצח">מנצח</option>
              <option value="מדריך הרכב">מדריך הרכב</option>
              <option value="מנהל">מנהל</option>
              <option value="מורה תאוריה">מורה תאוריה</option>
              <option value="מגמה">מגמה</option>
            </select>

            <div className="mr-auto flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400">
                {searchTerm || filters.instrument || filters.role
                  ? `${filteredTeachers.length} מתוך ${totalTeachers}`
                  : `${teachers.length} מתוך ${totalTeachers}`}
                {hasMore && ' +'}
              </span>
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  aria-pressed={viewMode === 'table'}
                  aria-label="תצוגת טבלה"
                >
                  <ListIcon size={14} weight="bold" />
                  <span className="hidden sm:inline">טבלה</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  aria-pressed={viewMode === 'grid'}
                  aria-label="תצוגת רשת"
                >
                  <SquaresFourIcon size={14} weight="bold" />
                  <span className="hidden sm:inline">רשת</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table / Grid Content */}
        <div className="relative">
          {searchLoading && (
            <div className="absolute inset-0 bg-white/75 dark:bg-sidebar-dark/75 flex items-center justify-center z-10">
              <div className="text-center">
                <CircleNotchIcon size={24} weight="regular" className="animate-spin mx-auto mb-2 text-primary" />
                <div className="text-sm text-slate-500">מחפש מורים...</div>
              </div>
            </div>
          )}

          {viewMode === 'table' ? (
            <Table
              columns={columns}
              data={filteredTeachers}
              onRowClick={(row) => handleViewTeacher(row.id)}
              rowClassName="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
            />
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredTeachers.map((teacher) => {
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
                    isActive: teacher.isActive
                  },
                  studentCount: teacher.studentCount || 0,
                  teaching: { schedule: [] },
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
              <div className="text-center py-12 text-slate-400">לא נמצאו מורים התואמים לחיפוש</div>
            ) : (
              <div className="p-5">
                <EmptyState
                  title="אין מורים עדיין"
                  description="הוסף מורים לקונסרבטוריון כדי להתחיל"
                  icon={<UsersIcon size={48} weight="regular" />}
                  action={{ label: 'הוסף מורה', onClick: () => setShowAddTeacherModal(true) }}
                />
              </div>
            )
          )}
        </div>

        {/* Load More inside card */}
        {hasMore && filteredTeachers.length > 0 && !loading && (
          <div className="flex justify-center py-5 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <CircleNotchIcon size={18} weight="regular" className="animate-spin" />
                  <span>טוען עוד מורים...</span>
                </>
              ) : (
                <>
                  <CaretDownIcon size={18} weight="bold" />
                  <span>טען עוד מורים</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

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
