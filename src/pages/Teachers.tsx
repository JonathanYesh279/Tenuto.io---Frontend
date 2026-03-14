import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PlusIcon, CircleNotchIcon, UsersIcon, SquaresFourIcon, ListIcon, ArrowUpRightIcon, PencilLineIcon, TrashIcon, ArrowsClockwise as ArrowsClockwiseIcon } from '@phosphor-icons/react'
import {
  Table as HeroTable,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Pagination,
  Spinner,
  Badge as HeroBadge,
  Button as HeroButton,
  Chip,
} from '@heroui/react'
import { GlassStatCard } from '../components/ui/GlassStatCard'
import { StatusBadge, InstrumentBadge } from '../components/domain'
import { SearchInput } from '../components/ui/SearchInput'
import { GlassSelect } from '../components/ui/GlassSelect'
import TeacherCard from '../components/TeacherCard'
import AddTeacherModal from '../components/modals/AddTeacherModal'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import apiService, { hoursSummaryService } from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'
import { useAuth } from '../services/authContext'
import { getDisplayName } from '../utils/nameUtils'
import { getWorkloadColor } from '../utils/workloadColors'
import { getAvatarColorHex } from '../utils/avatarColorHash'
import { getRoleChipColor } from '../utils/roleColors'
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
  weeklyHours: number
  hoursCalculated: boolean
  loginCount: number
  lastLogin: string | null
  rawData: any
}

// Avatar colors imported from shared utility

// Helper function to check if user is admin
const isUserAdmin = (user: any): boolean => {
  if (!user) return false
  const hasAdminInRoles = user?.roles?.includes('מנהל')
  const hasAdminEnglish = user?.roles?.includes('admin')
  const hasSingleAdminRole = user?.role === 'admin'
  const hasHebrewAdminRole = user?.role === 'מנהל'
  return hasAdminInRoles || hasAdminEnglish || hasSingleAdminRole || hasHebrewAdminRole
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
  // Load-all state (matching Students pattern)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [totalTeachersCount, setTotalTeachersCount] = useState(0)
  const TEACHERS_PER_PAGE = 10000 // Load all at once
  const [viewMode, setViewMode] = useState<'table' | 'grid'>((searchParams.get('view') as 'table' | 'grid') || 'table')
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false)
  const [teacherToEdit, setTeacherToEdit] = useState(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)

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

    const newSearch = params.toString()
    const currentSearch = searchParams.toString()
    if (newSearch !== currentSearch) {
      setSearchParams(params, { replace: true })
    }
  }, [searchTerm, filters.instrument, filters.role, viewMode])

  // Fetch teachers from real API when school year changes
  useEffect(() => {
    if (!schoolYearLoading) {
      loadTeachers()
    }
  }, [currentSchoolYear, schoolYearLoading])

  const loadTeachers = async () => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      } else {
        setSearchLoading(true)
      }
      setError(null)

      // Load all teachers at once (match Students pattern)
      const apiFilters = {
        ...(currentSchoolYear ? { schoolYearId: currentSchoolYear._id } : {}),
        ...(debouncedSearchTerm ? { name: debouncedSearchTerm } : {}),
        ...(filters.role ? { role: filters.role } : {}),
        limit: TEACHERS_PER_PAGE
      }
      const result = await apiService.teachers.getTeachers(apiFilters)

      let teachersData
      if (result.data && result.pagination) {
        teachersData = result.data
        setTotalTeachersCount(result.pagination.totalCount)
      } else {
        teachersData = result
        setTotalTeachersCount(result.length)
      }

      // Filter out current user and transform
      const filteredTeachers = teachersData.filter(teacher => teacher._id !== user?._id)
      const transformedTeachers = filteredTeachers.map(teacher => ({
        id: teacher._id,
        name: getDisplayName(teacher.personalInfo) || 'לא צוין',
        specialization: teacher.professionalInfo?.instrument || 'לא צוין',
        roles: teacher.allRoles || teacher.roles || [],
        primaryRole: teacher.primaryRole || 'לא מוגדר',
        studentCount: teacher.studentCount || 0,
        email: teacher.personalInfo?.email || '',
        phone: teacher.personalInfo?.phone || '',
        isActive: teacher.isTeacherActive,
        hasTimeBlocks: teacher.hasTimeBlocks || false,
        timeBlockCount: teacher.timeBlockCount || 0,
        orchestraCount: teacher.orchestraCount || 0,
        ensembleCount: teacher.ensembleCount || 0,
        availabilityDays: teacher.availabilityDays || [],
        totalTeachingHours: Math.round((teacher.totalTeachingHours / 60) * 10) / 10 || 0,
        weeklyHours: teacher.weeklyHoursSummary?.totalWeeklyHours || 0,
        hoursCalculated: teacher.weeklyHoursSummary != null,
        loginCount: teacher.loginCount || 0,
        lastLogin: teacher.lastLogin || null,
        rawData: teacher,
        rolesDisplay: teacher.allRoles?.length > 0 ? teacher.allRoles.join(', ') : 'לא מוגדר',
      }))

      setTeachers(transformedTeachers)
    } catch (err) {
      console.error('Error loading teachers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setSearchLoading(false)
      setIsInitialLoad(false)
    }
  }

  const handleViewTeacher = (teacherId: string) => {
    const targetPath = `/teachers/${teacherId}`
    try {
      navigate(targetPath)
    } catch (error) {
      window.location.href = targetPath
    }
  }

  const handleEditTeacher = async (teacherId: string) => {
    try {
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
      loadTeachers()
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
    if (isUserAdmin(user)) {
      setTeacherToEdit(null)
      setModalMode('add')
      setShowAddTeacherModal(true)
    } else {
      alert('רק מנהלים יכולים להוסיף מורים')
    }
  }

  const handleTeacherAdded = (newTeacher: any) => {
    if (!schoolYearLoading) {
      loadTeachers()
    }
  }

  const handleRecalculateAll = async () => {
    setIsRecalculating(true)
    try {
      await hoursSummaryService.calculateAll()
      await loadTeachers()
    } catch (err) {
      console.error('Error recalculating hours:', err)
    } finally {
      setIsRecalculating(false)
    }
  }

  // Reload teachers when filters or debounced search change
  useEffect(() => {
    if (!schoolYearLoading) {
      loadTeachers()
    }
  }, [debouncedSearchTerm, filters.role])

  // Client-side instrument filtering (backend doesn't support instrument param for teachers)
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      if (!filters.instrument) return true
      const teacherInstrument = (teacher.specialization || '').toLowerCase().trim()
      const filterInstrument = filters.instrument.toLowerCase().trim()
      return teacherInstrument === filterInstrument ||
             teacherInstrument.includes(filterInstrument) ||
             filterInstrument.includes(teacherInstrument)
    })
  }, [teachers, filters.instrument])

  // Calculate statistics
  const totalTeachers = totalTeachersCount > 0 ? totalTeachersCount : teachers.length
  const activeTeachers = teachers.filter(t => t.isActive).length
  const uniqueInstruments = new Set(
    teachers
      .map(t => t.specialization)
      .filter(s => s && s !== 'לא צוין')
  ).size
  const avgWeeklyHours = activeTeachers > 0
    ? Math.round(teachers.reduce((sum, t) => sum + t.weeklyHours, 0) / activeTeachers * 10) / 10
    : 0
  const overloadedTeachers = teachers.filter(t => t.weeklyHours >= 20).length

  // HeroUI table columns
  const heroColumns = [
    { uid: 'name', name: 'שם המורה' },
    { uid: 'specialization', name: 'התמחות' },
    { uid: 'roles', name: 'תפקידים' },
    { uid: 'studentCount', name: 'מס\' תלמידים' },
    { uid: 'weeklyHours', name: 'ש"ש' },
    { uid: 'status', name: 'סטטוס' },
    { uid: 'actions', name: 'פעולות' },
  ]

  // HeroUI sorting + pagination state
  const [tablePage, setTablePage] = useState(1)
  const [sortDescriptor, setSortDescriptor] = useState<{ column: string; direction: 'ascending' | 'descending' }>({ column: 'name', direction: 'ascending' })
  const tableRowsPerPage = 20

  const sortedTeachers = useMemo(() => {
    const sorted = [...filteredTeachers].sort((a, b) => {
      const col = sortDescriptor.column
      let cmp = 0
      if (col === 'weeklyHours') cmp = a.weeklyHours - b.weeklyHours
      else if (col === 'studentCount') cmp = a.studentCount - b.studentCount
      else if (col === 'name') cmp = a.name.localeCompare(b.name, 'he')
      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
    return sorted
  }, [filteredTeachers, sortDescriptor])

  const tablePages = Math.ceil(sortedTeachers.length / tableRowsPerPage)
  const paginatedTeachers = React.useMemo(() => {
    const start = (tablePage - 1) * tableRowsPerPage
    return sortedTeachers.slice(start, start + tableRowsPerPage)
  }, [sortedTeachers, tablePage])

  // Reset page when data changes
  useEffect(() => { setTablePage(1) }, [filteredTeachers.length])

  // HeroUI renderCell
  const renderCell = React.useCallback((teacher: any, columnKey: string) => {
    switch (columnKey) {
      case 'name': {
        const userEl = (
          <User
            avatarProps={{
              radius: 'full',
              size: 'md',
              showFallback: true,
              name: teacher.name,
              style: { backgroundColor: getAvatarColorHex(teacher.name || ''), color: '#fff' },
            }}
            description={teacher.email || ''}
            name={teacher.name}
          />
        )

        if (teacher.loginCount > 0) {
          return (
            <HeroBadge content={teacher.loginCount} color="primary" size="sm" shape="circle">
              {userEl}
            </HeroBadge>
          )
        }

        return userEl
      }
      case 'specialization':
        return teacher.specialization && teacher.specialization !== 'לא צוין'
          ? <InstrumentBadge instrument={teacher.specialization} />
          : <span className="text-default-400">--</span>
      case 'roles': {
        const roles: string[] = teacher.roles || []
        if (roles.length === 0) return <span className="text-xs text-slate-400">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role: string) => (
              <Chip
                key={role}
                variant="bordered"
                size="sm"
                classNames={{ content: 'text-[10px] font-bold px-1' }}
                style={{ borderColor: getRoleChipColor(role), color: getRoleChipColor(role) }}
              >
                {role}
              </Chip>
            ))}
          </div>
        )
      }
      case 'studentCount':
        return <span className="text-sm">{teacher.studentCount}</span>
      case 'weeklyHours': {
        const hours = teacher.weeklyHours || 0
        const { bg, text } = getWorkloadColor(hours)
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${bg} ${text}`}>
            {hours}
          </span>
        )
      }
      case 'status':
        return <StatusBadge status={teacher.isActive ? 'פעיל' : 'לא פעיל'} />
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            <button
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700/50 transition-colors"
              onClick={(e) => { e.stopPropagation(); handleViewTeacher(teacher.id) }}
              title="צפה בפרטי המורה"
            >
              <ArrowUpRightIcon size={15} weight="regular" />
            </button>
            <button
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700/50 transition-colors"
              onClick={(e) => { e.stopPropagation(); handleEditTeacher(teacher.id) }}
              title="ערוך פרטי המורה"
            >
              <PencilLineIcon size={15} weight="regular" />
            </button>
            <button
              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); handleDeleteTeacher(teacher.id) }}
              title="מחק מורה"
            >
              <TrashIcon size={15} weight="regular" />
            </button>
          </div>
        )
      default:
        return teacher[columnKey] ?? ''
    }
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in">
        <TableSkeleton rows={8} cols={5} />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => loadTeachers()} />
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden relative">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">מורים</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{activeTeachers} פעילים מתוך {totalTeachers}</p>
        </div>
      </div>

      {/* Analytics: 5 stat cards in a row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <GlassStatCard value={totalTeachers} label="סה״כ מורים" size="sm" />
        <GlassStatCard value={activeTeachers} label="מורים פעילים" size="sm" />
        <GlassStatCard value={uniqueInstruments} label="כלים ייחודיים" size="sm" />
        <GlassStatCard value={avgWeeklyHours} label='ממוצע ש"ש' size="sm" />
        <GlassStatCard
          value={overloadedTeachers}
          label="עומס גבוה"
          size="sm"
          valueClassName={overloadedTeachers > 0 ? 'text-red-600' : undefined}
        />
      </div>

      {/* Table Section -- fills remaining height */}
      <div className="flex-1 min-h-0 flex flex-col gap-4">
        {/* Filters + View Toggle */}
        <div>
          <div className="flex items-center gap-3 flex-wrap px-1">
            <div className="w-64 flex-none">
              <SearchInput
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                onClear={() => setSearchTerm('')}
                placeholder="חיפוש מורים..."
                isLoading={searchLoading}
              />
            </div>
            <GlassSelect
              value={filters.instrument || '__all__'}
              onValueChange={(v) => setFilters(prev => ({ ...prev, instrument: v === '__all__' ? '' : v }))}
              placeholder="כל הכלים"
              options={[
                { value: '__all__', label: 'כל הכלים' },
                { value: 'כינור', label: 'כינור' },
                { value: 'ויולה', label: 'ויולה' },
                { value: "צ'לו", label: "צ'לו" },
                { value: 'קונטרבס', label: 'קונטרבס' },
                { value: 'גיטרה', label: 'גיטרה' },
                { value: 'גיטרה בס', label: 'גיטרה בס' },
                { value: 'חלילית', label: 'חלילית' },
                { value: 'חליל צד', label: 'חליל צד' },
                { value: 'אבוב', label: 'אבוב' },
                { value: 'בסון', label: 'בסון' },
                { value: 'סקסופון', label: 'סקסופון' },
                { value: 'קלרינט', label: 'קלרינט' },
                { value: 'חצוצרה', label: 'חצוצרה' },
                { value: 'קרן יער', label: 'קרן יער' },
                { value: 'טרומבון', label: 'טרומבון' },
                { value: 'טובה/בריטון', label: 'טובה/בריטון' },
                { value: 'פסנתר', label: 'פסנתר' },
                { value: 'תופים', label: 'תופים' },
                { value: 'שירה', label: 'שירה' },
              ]}
            />
            <GlassSelect
              value={filters.role || '__all__'}
              onValueChange={(v) => setFilters(prev => ({ ...prev, role: v === '__all__' ? '' : v }))}
              placeholder="כל התפקידים"
              options={[
                { value: '__all__', label: 'כל התפקידים' },
                { value: 'מורה', label: 'מורה' },
                { value: 'ניצוח', label: 'ניצוח' },
                { value: 'מדריך הרכב', label: 'מדריך הרכב' },
                { value: 'מנהל', label: 'מנהל' },
                { value: 'תאוריה', label: 'תאוריה' },
                { value: 'מגמה', label: 'מגמה' },
                { value: 'ליווי פסנתר', label: 'ליווי פסנתר' },
                { value: 'הלחנה', label: 'הלחנה' },
              ]}
            />

            <div className="mr-auto flex items-center gap-3">
              {isUserAdmin(user) && (
                <>
                  <HeroButton
                    color="default"
                    variant="bordered"
                    size="sm"
                    onPress={handleRecalculateAll}
                    isLoading={isRecalculating}
                    startContent={!isRecalculating ? <ArrowsClockwiseIcon size={14} weight="bold" /> : undefined}
                    className="font-bold"
                  >
                    {isRecalculating ? 'מחשב...' : 'חשב ש"ש'}
                  </HeroButton>
                  <HeroButton
                    color="primary"
                    variant="solid"
                    size="sm"
                    onPress={handleAddTeacher}
                    startContent={<PlusIcon size={14} weight="bold" />}
                    className="font-bold"
                  >
                    הוסף מורה
                  </HeroButton>
                </>
              )}
              <span className="text-xs font-medium text-slate-400">
                {searchTerm || filters.instrument || filters.role
                  ? `${filteredTeachers.length} מתוך ${totalTeachers}`
                  : `${teachers.length} מתוך ${totalTeachers}`}
              </span>
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200 dark:border-slate-700">
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
        <div className="relative flex-1 min-h-0 flex flex-col">
          {searchLoading && (
            <div className="absolute inset-0 bg-white/75 dark:bg-sidebar-dark/75 flex items-center justify-center z-10 rounded-large">
              <div className="text-center">
                <CircleNotchIcon size={24} weight="regular" className="animate-spin mx-auto mb-2 text-primary" />
                <div className="text-sm text-slate-500">מחפש מורים...</div>
              </div>
            </div>
          )}

          {viewMode === 'table' ? (
            <HeroTable
              aria-label="טבלת מורים"
              isHeaderSticky
              sortDescriptor={sortDescriptor as any}
              onSortChange={(descriptor) => setSortDescriptor(descriptor as any)}
              bottomContent={
                tablePages > 1 ? (
                  <div className="flex w-full justify-center">
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      color="primary"
                      page={tablePage}
                      total={tablePages}
                      onChange={setTablePage}
                    />
                  </div>
                ) : null
              }
              bottomContentPlacement="outside"
              classNames={{
                base: 'flex-1 min-h-0 animate-table-rows',
                wrapper: 'h-full bg-transparent shadow-none',
                th: 'bg-default-100 text-default-600',
                thead: '[&>tr]:border-b-0',
                tr: 'transition-colors duration-150 hover:bg-primary/5',
                td: 'py-3',
              }}
            >
              <TableHeader columns={heroColumns}>
                {(column) => (
                  <TableColumn
                    key={column.uid}
                    align={column.uid === 'actions' ? 'end' : ['studentCount', 'weeklyHours', 'status'].includes(column.uid) ? 'center' : 'start'}
                    allowsSorting={['name', 'studentCount', 'weeklyHours'].includes(column.uid)}
                  >
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                items={paginatedTeachers}
                isLoading={loading}
                loadingContent={<Spinner color="primary" label="טוען..." />}
                emptyContent="אין מורים להצגה"
              >
                {(item: any) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => handleViewTeacher(item.id)}
                  >
                    {(columnKey) => (
                      <TableCell>{renderCell(item, columnKey as string)}</TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </HeroTable>
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {paginatedTeachers.map((teacher) => {
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

        {/* Pagination for grid view */}
        {viewMode === 'grid' && tablePages > 1 && (
          <div className="flex w-full justify-center py-2">
            <Pagination
              isCompact
              showControls
              showShadow
              color="primary"
              page={tablePage}
              total={tablePages}
              onChange={setTablePage}
            />
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
