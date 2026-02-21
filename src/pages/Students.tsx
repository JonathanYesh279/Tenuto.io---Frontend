import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRightIcon, PencilLineIcon, FunnelIcon, CircleNotchIcon, XIcon, SquaresFourIcon, ListIcon, TrashIcon, CaretUpIcon, CaretDownIcon, WarningIcon, ShieldIcon, ArchiveIcon, ClockIcon, UsersIcon, GraduationCapIcon, UserCheckIcon, UserCircleMinusIcon, BookOpenIcon, UserCircleIcon } from '@phosphor-icons/react'
import { PlusIcon } from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { Card } from '../components/ui/Card'
import Table from '../components/ui/Table'
import { Badge } from '../components/ui/badge'
import { StatusBadge, InstrumentBadge } from '../components/domain'
import { SearchInput } from '../components/ui/SearchInput'
import StudentCard from '../components/StudentCard'
import StudentForm from '../components/forms/StudentForm'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import apiService from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'
import { useAuth } from '../services/authContext.jsx'
import { useCascadeDeletion } from '../hooks/useCascadeDeletion'
import { cascadeDeletionService } from '../services/cascadeDeletionService'
import { getDisplayName } from '../utils/nameUtils'
import SafeDeleteModal from '../components/SafeDeleteModal'
import DeletionImpactModal from '../components/DeletionImpactModal'
import BatchDeletionModal from '../components/BatchDeletionModal'
import { TableSkeleton } from '../components/feedback/Skeleton'
import { EmptyState } from '../components/feedback/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState'


export default function Students() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { currentSchoolYear, isLoading: schoolYearLoading } = useSchoolYear()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState(null)
  // Initialize state from URL params for persistence
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({
    orchestra: searchParams.get('orchestra') || '',
    instrument: searchParams.get('instrument') || '',
    stageLevel: searchParams.get('stage') || ''
  })
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [totalStudentsCount, setTotalStudentsCount] = useState(0)
  const STUDENTS_PER_PAGE = 20
  const [showForm, setShowForm] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>((searchParams.get('view') as 'table' | 'grid') || 'table')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<{id: string, name: string} | null>(null)
  const [editingStudentData, setEditingStudentData] = useState<any>(null)
  const [loadingStudentData, setLoadingStudentData] = useState(false)
  const [stageLevelConfirm, setStageLevelConfirm] = useState<{studentId: string, studentName: string, currentLevel: number, newLevel: number} | null>(null)
  const [updatingStageLevel, setUpdatingStageLevel] = useState<string | null>(null)
  const [editingStageLevelId, setEditingStageLevelId] = useState<string | null>(null)
  
  // Cascade deletion states
  const [showSafeDeleteModal, setShowSafeDeleteModal] = useState(false)
  const [showDeletionImpactModal, setShowDeletionImpactModal] = useState(false)
  const [showBatchDeletionModal, setShowBatchDeletionModal] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [deletionPreview, setDeletionPreview] = useState<any>(null)
  const [isSelectMode, setIsSelectMode] = useState(false)

  // Teachers lookup map for displaying teacher names
  const [teachersMap, setTeachersMap] = useState<Map<string, string>>(new Map())

  // Cascade deletion hooks
  const { previewDeletion, executeDeletion, isDeleting } = useCascadeDeletion()

  // Fetch teachers for name lookup
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachers = await apiService.teachers.getTeachers()
        const map = new Map<string, string>()
        teachers.forEach((teacher: any) => {
          const name = getDisplayName(teacher.personalInfo) ||
                      teacher.name ||
                      'לא מוגדר'
          map.set(teacher._id, name)
        })
        setTeachersMap(map)
      } catch (error) {
        console.error('Error fetching teachers for lookup:', error)
      }
    }
    fetchTeachers()
  }, [])

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
    if (filters.orchestra) params.set('orchestra', filters.orchestra)
    if (filters.instrument) params.set('instrument', filters.instrument)
    if (filters.stageLevel) params.set('stage', filters.stageLevel)
    if (viewMode !== 'table') params.set('view', viewMode)

    // Update URL without causing navigation
    const newSearch = params.toString()
    const currentSearch = searchParams.toString()
    if (newSearch !== currentSearch) {
      setSearchParams(params, { replace: true })
    }
  }, [searchTerm, filters.orchestra, filters.instrument, filters.stageLevel, viewMode])

  // Close stage level edit mode when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (editingStageLevelId) {
        setEditingStageLevelId(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [editingStageLevelId])

  // Fetch students from real API when school year changes
  useEffect(() => {
    if (!schoolYearLoading) {
      // Load even if no school year is selected, backend will handle it
      loadStudents(1, false)
    }
  }, [currentSchoolYear, schoolYearLoading])

  // Helper function to determine user role and filter logic
  const getUserRole = () => {
    if (!user) return 'admin'

    // Check for admin role first
    if (user.role === 'admin' ||
        user.roles?.includes('admin') ||
        user.role === 'מנהל' ||
        user.roles?.includes('מנהל')) {
      return 'admin'
    }

    // Check for teacher role - check Hebrew roles too!
    if (user.role === 'teacher' ||
        user.roles?.includes('teacher') ||
        user.role === 'מורה' ||
        user.roles?.includes('מורה')) {
      return 'teacher'
    }

    // Check for theory teacher role
    if (user.role === 'theory-teacher' ||
        user.roles?.includes('theory-teacher') ||
        user.roles?.includes('theory_teacher') ||
        user.role === 'מורה תיאוריה' ||
        user.roles?.includes('מורה תיאוריה')) {
      return 'theory-teacher'
    }

    // Check for conductor role
    if (user.role === 'conductor' ||
        user.roles?.includes('conductor') ||
        user.role === 'מנצח' ||
        user.roles?.includes('מנצח') ||
        user.conducting?.orchestraIds?.length > 0) {
      return 'conductor'
    }

    // Default to admin
    return 'admin'
  }

  const loadStudents = async (page = 1, append = false) => {
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

      const userRole = getUserRole()
      console.log('Loading students for user role:', userRole, 'User:', getDisplayName(user?.personalInfo), 'Page:', page)

      let studentsResponse = []

      let response
      let paginationMeta = null

      if (userRole === 'admin') {
        // Admin sees all students with pagination and filters
        const apiFilters = {
          ...(currentSchoolYear ? { schoolYearId: currentSchoolYear._id } : {}),
          // Add search and filter parameters (using debounced search term)
          ...(debouncedSearchTerm ? { name: debouncedSearchTerm } : {}),
          ...(filters.instrument ? { instrument: filters.instrument } : {}),
          ...(filters.stageLevel ? { stage: filters.stageLevel } : {}),
          page,
          limit: STUDENTS_PER_PAGE
        }
        const result = await apiService.students.getStudents(apiFilters)

        // Check if response is paginated
        if (result.data && result.pagination) {
          response = result.data
          paginationMeta = result.pagination
          setHasMore(result.pagination.hasNextPage)
          setTotalStudentsCount(result.pagination.totalCount)
          console.log('Admin - loaded students page', page, ':', result.data.length, '/', result.pagination.totalCount)
        } else {
          // Fallback for non-paginated response
          response = result
          setHasMore(false)
          setTotalStudentsCount(result.length)
          console.log('Admin - loaded all students:', result.length)
        }
      } else if (userRole === 'teacher') {
        // Teacher sees only their assigned students via dedicated endpoint
        response = await apiService.teachers.getTeacherStudents(user._id)
        console.log('Teacher - loaded assigned students:', response.length)
        // For teachers, we load all at once, so no more pages
        setHasMore(false)
        setTotalStudentsCount(response.length)
      } else {
        // Other roles get filtered students based on their permissions with pagination and filters
        const apiFilters = {
          ...(currentSchoolYear ? { schoolYearId: currentSchoolYear._id } : {}),
          // Add search and filter parameters (using debounced search term)
          ...(debouncedSearchTerm ? { name: debouncedSearchTerm } : {}),
          ...(filters.instrument ? { instrument: filters.instrument } : {}),
          ...(filters.stageLevel ? { stage: filters.stageLevel } : {}),
          page,
          limit: STUDENTS_PER_PAGE
        }
        const result = await apiService.students.getStudents(apiFilters)

        // Check if response is paginated
        if (result.data && result.pagination) {
          response = result.data
          paginationMeta = result.pagination
          setHasMore(result.pagination.hasNextPage)
          setTotalStudentsCount(result.pagination.totalCount)
          console.log('Other role - loaded students page', page, ':', result.data.length, '/', result.pagination.totalCount)
        } else {
          // Fallback for non-paginated response
          response = result
          setHasMore(false)
          setTotalStudentsCount(result.length)
          console.log('Other role - loaded all students:', result.length)
        }
      }

      studentsResponse = response
      
      // Map response data using CORRECT database field names
      const students = response.map(student => ({
        id: student._id,
        displayName: getDisplayName(student.personalInfo),
        phone: student.personalInfo.phone,
        age: student.personalInfo.age,
        class: student.academicInfo.class,
        primaryInstrument: student.academicInfo.instrumentProgress
          .find(inst => inst.isPrimary)?.instrumentName ||
          student.academicInfo.instrumentProgress[0]?.instrumentName || 'ללא כלי',
        currentStage: student.academicInfo.instrumentProgress
          .find(inst => inst.isPrimary)?.currentStage || 1,
        teacherAssignments: student.teacherAssignments,
        parentName: student.personalInfo.parentName,
        parentPhone: student.personalInfo.parentPhone,
        orchestraIds: student.enrollments?.orchestraIds,
        isActive: student.isActive
      }))

      // Transform for table display
      const transformedStudents = students.map(student => ({
        id: student.id,
        name: student.displayName,
        instrument: student.primaryInstrument,
        stageLevel: student.currentStage,
        orchestra: student.orchestraIds?.length > 0 ? 'תזמורת' : 'ללא תזמורת',
        grade: <Badge variant="outline">{student.class}</Badge>,
        status: <StatusBadge status={student.isActive ? 'פעיל' : 'לא פעיל'} />,
        teacherAssignments: student.teacherAssignments?.length || 0,
        rawData: {
          ...student,
          // Add cascade deletion related fields
          referenceCount: student.referenceCount || 0,
          isOrphaned: student.isOrphaned || false,
          hasNoRecentActivity: student.hasNoRecentActivity || false,
          integrityStatus: student.integrityStatus || 'healthy',
          lastActivity: student.lastActivity || null
        },
        // Add the original API response data for StudentCard compatibility
        originalStudent: response.find(s => s._id === student.id),
        actions: (
          <div className="flex items-center gap-0.5">
            {isSelectMode && (
              <input
                type="checkbox"
                checked={selectedStudents.has(student.id)}
                onChange={(e) => {
                  e.stopPropagation()
                  const newSelected = new Set(selectedStudents)
                  if (e.target.checked) {
                    newSelected.add(student.id)
                  } else {
                    newSelected.delete(student.id)
                  }
                  setSelectedStudents(newSelected)
                }}
                className="rounded border-border text-primary focus:ring-ring"
              />
            )}
            <button
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                handleViewStudent(student.id)
              }}
              title="צפה בפרטי התלמיד"
            >
              <ArrowUpRightIcon size={15} weight="regular" />
            </button>
            <button
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                handleEditStudent(student.id)
              }}
              title="ערוך פרטי התלמיד"
            >
              <PencilLineIcon size={15} weight="regular" />
            </button>
            {(student.referenceCount || student.rawData?.referenceCount || 0) > 0 ? (
              <button
                className="p-1.5 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSafeDeleteClick(student.id, student.name)
                }}
                title="מחיקה מאובטחת"
              >
                <ShieldIcon size={15} weight="regular" />
              </button>
            ) : (
              <button
                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteClick(student.id, student.name)
                }}
                title="מחק תלמיד"
              >
                <TrashIcon size={15} weight="regular" />
              </button>
            )}
          </div>
        )
      }))

      // Either append to existing students or replace them
      if (append) {
        setStudents(prevStudents => [...prevStudents, ...transformedStudents])
      } else {
        setStudents(transformedStudents)
      }
    } catch (err) {
      console.error('Error loading students:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setSearchLoading(false)
      setLoadingMore(false)
      setIsInitialLoad(false)
    }
  }


  const handleViewStudent = (studentId) => {
    console.log('=== NAVIGATION DEBUG ===')
    console.log('Student ID:', studentId)
    console.log('Target path:', `/students/${studentId}`)
    console.log('Current location:', window.location.pathname)
    
    // Direct navigation without async
    const targetPath = `/students/${studentId}`
    
    // Force navigation with window.location as fallback
    try {
      navigate(targetPath)
      console.log('Navigate function called successfully')
    } catch (error) {
      console.error('Navigate failed, using window.location:', error)
      window.location.href = targetPath
    }
  }

  const handleEditStudent = async (studentId: string) => {
    try {
      setLoadingStudentData(true)
      setEditingStudentId(studentId)
      
      // Load student data for editing
      const studentData = await apiService.students.getStudentById(studentId)
      setEditingStudentData(studentData)
      
      setShowForm(true)
    } catch (error) {
      console.error('Error loading student for editing:', error)
      alert('שגיאה בטעינת נתוני התלמיד לעריכה')
    } finally {
      setLoadingStudentData(false)
    }
  }

  const handleAddStudent = () => {
    setEditingStudentId(null)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingStudentId(null)
    setEditingStudentData(null)
  }

  const handleFormSubmit = async (formData: any) => {
    try {
      let studentId = editingStudentId

      // Separate orchestra enrollment from other student data —
      // addMember/removeMember handle both student AND orchestra sides atomically
      const newOrchestraIds = formData.enrollments?.orchestraIds || []
      const studentData = {
        ...formData,
        enrollments: {
          ...formData.enrollments,
          orchestraIds: undefined // Don't send orchestraIds in student update
        }
      }

      if (editingStudentId) {
        // Update existing student (without orchestraIds — handled below)
        await apiService.students.updateStudent(editingStudentId, studentData)

        // Handle orchestra enrollment changes via addMember/removeMember
        const oldOrchestraIds = editingStudentData?.enrollments?.orchestraIds || []

        // Remove from orchestras that are no longer selected
        for (const oldId of oldOrchestraIds) {
          if (!newOrchestraIds.includes(oldId)) {
            await apiService.orchestras.removeMember(oldId, editingStudentId)
          }
        }

        // Add to newly selected orchestras
        for (const newId of newOrchestraIds) {
          if (!oldOrchestraIds.includes(newId)) {
            await apiService.orchestras.addMember(newId, editingStudentId)
          }
        }
      } else {
        // Create new student (without orchestraIds — handled below)
        const newStudent = await apiService.students.createStudent(studentData)
        studentId = newStudent._id

        // Enroll new student in selected orchestras
        for (const orchestraId of newOrchestraIds) {
          await apiService.orchestras.addMember(orchestraId, studentId)
        }
      }

      loadStudents(1, false) // Reload the students list from page 1
      handleCloseForm() // Close the form
    } catch (error) {
      console.error('Error saving student:', error)
      throw error // Let the form handle the error display
    }
  }

  const handleFormCancel = () => {
    handleCloseForm()
  }

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await apiService.students.deleteStudent(studentId)
      // Reload students list after successful deletion from page 1
      loadStudents(1, false)
    } catch (err) {
      console.error('Error deleting student:', err)
      alert('שגיאה במחיקת התלמיד')
    }
  }

  // New cascade deletion handlers
  const handleSafeDeleteClick = async (studentId: string, studentName: string) => {
    setStudentToDelete({ id: studentId, name: studentName })
    setShowSafeDeleteModal(true)
  }

  const handleCheckReferences = async (studentId: string) => {
    try {
      const preview = await cascadeDeletionService.previewDeletion(studentId)
      setDeletionPreview(preview)
      setShowDeletionImpactModal(true)
    } catch (error) {
      console.error('Error checking references:', error)
      alert('שגיאה בבדיקת התלויות')
    }
  }

  const handleBatchDelete = () => {
    if (selectedStudents.size === 0) {
      alert('יש לבחור לפחות תלמיד אחד')
      return
    }
    setShowBatchDeletionModal(true)
  }

  const handleToggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedStudents(new Set())
  }

  const handleStudentSelection = (studentId: string, selected: boolean) => {
    const newSelected = new Set(selectedStudents)
    if (selected) {
      newSelected.add(studentId)
    } else {
      newSelected.delete(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSafeDelete = async (studentId: string, options: any) => {
    try {
      await cascadeDeletionService.executeDelete(studentId, options)
      setShowSafeDeleteModal(false)
      setStudentToDelete(null)
      loadStudents(1, false)
    } catch (error) {
      console.error('Error in safe deletion:', error)
      alert('שגיאה במחיקה המאובטחת')
    }
  }

  const handleDeleteClick = (studentId: string, studentName: string) => {
    setStudentToDelete({ id: studentId, name: studentName })
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      handleDeleteStudent(studentToDelete.id)
      setStudentToDelete(null)
    }
    setShowDeleteModal(false)
  }

  const handleCancelDelete = () => {
    setStudentToDelete(null)
    setShowDeleteModal(false)
  }


  // Handle stage level edit mode
  const handleStageLevelClick = (studentId: string) => {
    setEditingStageLevelId(studentId)
  }

  // Handle stage level update confirmation
  const handleStageLevelChange = (studentId: string, studentName: string, currentLevel: number, increment: boolean) => {
    const newLevel = increment ? currentLevel + 1 : currentLevel - 1
    
    // Validate stage level bounds (1-8)
    if (newLevel < 1 || newLevel > 8) {
      return
    }
    
    setStageLevelConfirm({
      studentId,
      studentName,
      currentLevel,
      newLevel
    })
  }

  const handleConfirmStageLevelUpdate = async () => {
    if (!stageLevelConfirm) return
    
    try {
      setUpdatingStageLevel(stageLevelConfirm.studentId)
      
      await apiService.students.updateStudentStageLevel(stageLevelConfirm.studentId, stageLevelConfirm.newLevel)

      // Refresh students data from page 1
      await loadStudents(1, false)

      setStageLevelConfirm(null)
      setEditingStageLevelId(null)
    } catch (error) {
      console.error('Error updating stage level:', error)
      alert('שגיאה בעדכון השלב: ' + error.message)
    } finally {
      setUpdatingStageLevel(null)
    }
  }

  const handleCancelStageLevelUpdate = () => {
    setStageLevelConfirm(null)
    setEditingStageLevelId(null)
  }

  // Handle loading more students
  const handleLoadMore = async () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    await loadStudents(nextPage, true)
  }

  // Reload students from page 1 when filters or debounced search change
  useEffect(() => {
    if (!schoolYearLoading) {
      loadStudents(1, false)
    }
  }, [debouncedSearchTerm, filters.orchestra, filters.instrument, filters.stageLevel])

  // No client-side filtering - backend does the filtering
  const filteredStudents = students

  // Calculate statistics
  // Use totalStudentsCount from pagination when available, otherwise use loaded students length
  const totalStudents = totalStudentsCount > 0 ? totalStudentsCount : students.length
  const activeStudents = students.filter(s => s.rawData?.isActive).length
  const studentsInOrchestras = students.filter(s => s.rawData?.orchestraIds?.length > 0).length
  const avgStageLevel = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + (s.stageLevel || 0), 0) / students.length * 10) / 10
    : 0

  const columns = [
    ...(isSelectMode ? [{
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedStudents(new Set(filteredStudents.map(s => s.id)))
            } else {
              setSelectedStudents(new Set())
            }
          }}
          className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-ring cursor-pointer"
        />
      ),
      render: (student: any) => (
        <input
          type="checkbox"
          checked={selectedStudents.has(student.id)}
          onChange={(e) => {
            e.stopPropagation()
            const newSelected = new Set(selectedStudents)
            if (e.target.checked) {
              newSelected.add(student.id)
            } else {
              newSelected.delete(student.id)
            }
            setSelectedStudents(newSelected)
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-ring cursor-pointer"
        />
      ),
      width: '60px',
      align: 'center' as const
    }] : []),
    {
      key: 'name',
      header: 'שם התלמיד',
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
      key: 'instrument',
      header: 'כלי נגינה',
      render: (student: any) => student.instrument
        ? <InstrumentBadge instrument={student.instrument} />
        : <span className="text-muted-foreground">—</span>
    },
    {
      key: 'teacherName',
      header: 'שם המורה',
      render: (student: any) => {
        const assignments = student.rawData?.teacherAssignments || student.originalStudent?.teacherAssignments || []
        if (!assignments || assignments.length === 0) {
          return <span className="text-gray-400">לא משוייך</span>
        }

        // Get first teacher's ID and look up name from teachersMap
        const firstAssignment = assignments[0]
        const teacherId = firstAssignment?.teacherId

        if (!teacherId) {
          return <span className="text-gray-400">לא משוייך</span>
        }

        const teacherName = teachersMap.get(teacherId)
        if (!teacherName) {
          return <span className="text-gray-400">לא משוייך</span>
        }

        return <span className="text-gray-700">{teacherName}</span>
      }
    },
    {
      key: 'stageLevel',
      header: 'שלב', 
      align: 'center' as const,
      render: (student: any) => {
        const isEditing = editingStageLevelId === student.id
        const isUpdating = updatingStageLevel === student.id
        
        if (isUpdating) {
          return (
            <div className="flex items-center justify-center">
              <div className="w-16 h-8 flex items-center justify-center bg-blue-50 rounded border-2 border-blue-200">
                <span className="text-blue-600 font-medium">...</span>
              </div>
            </div>
          )
        }
        
        if (isEditing) {
          return (
            <div 
              className="flex items-center justify-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStageLevelChange(student.id, student.name, student.stageLevel, false)
                }}
                disabled={student.stageLevel <= 1}
                className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                title="הורד שלב"
              >
                -
              </button>
              
              <div className="w-12 h-8 flex items-center justify-center bg-blue-50 rounded border-2 border-blue-300 mx-1">
                <span className="text-blue-700 font-bold text-sm">{student.stageLevel}</span>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStageLevelChange(student.id, student.name, student.stageLevel, true)
                }}
                disabled={student.stageLevel >= 8}
                className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 hover:bg-green-200 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                title="העלה שלב"
              >
                +
              </button>
            </div>
          )
        }
        
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStageLevelClick(student.id)
              }}
              className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors font-medium border border-transparent hover:border-blue-200"
              title="לחץ לעריכת השלב"
            >
              {student.stageLevel}
            </button>
          </div>
        )
      }
    },
    { key: 'orchestra', header: 'תזמורת' },
    { key: 'grade', header: 'כיתה', align: 'center' as const },
    { key: 'status', header: 'סטטוס', align: 'center' as const },
    { key: 'actions', header: 'פעולות', align: 'center' as const, width: isSelectMode ? '120px' : '140px' },
  ]

  if (loading) {
    return (
      <div className="animate-fade-in">
        <TableSkeleton rows={8} cols={6} />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadStudents} />
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden relative">

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {loadingStudentData ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-slate-500">טוען נתוני תלמיד...</p>
              </div>
            ) : (
              <StudentForm
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isEdit={!!editingStudentId}
                initialData={editingStudentData}
              />
            )}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">תלמידים</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{activeStudents} פעילים מתוך {totalStudents}</p>
        </div>
        <button
          onClick={handleAddStudent}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <PlusIcon size={16} weight="bold" />
          הוסף תלמיד
        </button>
      </div>

      {/* Analytics Section: 3 columns — Stats | Instrument Pie | Stage Distribution */}
      {/* Analytics: 4 stat cards in a row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { value: totalStudents, label: 'סה״כ תלמידים' },
          { value: activeStudents, label: 'תלמידים פעילים' },
          { value: studentsInOrchestras, label: 'רשומים לתזמורות' },
          { value: avgStageLevel, label: 'ממוצע שלב לימוד' },
        ].map((s) => (
          <div key={s.label} className="bg-gradient-to-br from-sky-400 to-cyan-400 dark:from-sky-900/40 dark:to-cyan-900/40 rounded-xl flex flex-col items-center justify-center py-3">
            <h3 className="text-xl font-extrabold text-white leading-none flex items-center gap-2">
              {typeof s.value === 'number' ? s.value.toLocaleString('he-IL') : s.value}
              <svg width="28" height="14" viewBox="0 0 40 20" fill="none" className="opacity-40">
                <polyline points="0,12 5,8 10,14 15,4 20,10 25,6 30,16 35,9 40,11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </h3>
            <p className="text-[11px] font-bold text-white/70 dark:text-sky-300/50 mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table Card Container — fills remaining height */}
      <div className="bg-white dark:bg-sidebar-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex-1 min-h-0 flex flex-col">
        {/* Card Header: Filters + Selection + View Toggle */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-64 flex-none">
              <SearchInput
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                onClear={() => setSearchTerm('')}
                placeholder="חיפוש תלמידים..."
                isLoading={searchLoading}
              />
            </div>
            <select
              value={filters.orchestra}
              onChange={(e) => setFilters(prev => ({ ...prev, orchestra: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white dark:bg-slate-800 text-foreground"
            >
              <option value="">כל התזמורות</option>
              <option value="תזמורת">תזמורת</option>
              <option value="ללא תזמורת">ללא תזמורת</option>
            </select>
            <select
              value={filters.instrument}
              onChange={(e) => setFilters(prev => ({ ...prev, instrument: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white dark:bg-slate-800 text-foreground"
            >
              <option value="">כל הכלים</option>
              <option value="חלילית">חלילית</option>
              <option value="חליל צד">חליל צד</option>
              <option value="אבוב">אבוב</option>
              <option value="בסון">בסון</option>
              <option value="סקסופון">סקסופון</option>
              <option value="קלרינט">קלרינט</option>
              <option value="חצוצרה">חצוצרה</option>
              <option value="קרן יער">קרן יער</option>
              <option value="טרומבון">טרומבון</option>
              <option value="טובה/בריטון">טובה/בריטון</option>
              <option value="שירה">שירה</option>
              <option value="כינור">כינור</option>
              <option value="ויולה">ויולה</option>
              <option value="צ'לו">צ'לו</option>
              <option value="קונטרבס">קונטרבס</option>
              <option value="פסנתר">פסנתר</option>
              <option value="גיטרה">גיטרה</option>
              <option value="גיטרה בס">גיטרה בס</option>
              <option value="תופים">תופים</option>
            </select>
            <select
              value={filters.stageLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, stageLevel: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white dark:bg-slate-800 text-foreground"
            >
              <option value="">כל השלבים</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(level => (
                <option key={level} value={level}>שלב {level}</option>
              ))}
            </select>

            <div className="mr-auto flex items-center gap-3">
              {/* Selection Controls */}
              <button
                onClick={handleToggleSelectMode}
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                  isSelectMode
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
                title={isSelectMode ? 'בטל בחירה מרובה' : 'הפעל בחירה מרובה'}
              >
                <UsersIcon size={12} weight="bold" className="ml-1" />
                {isSelectMode ? 'בטל בחירה' : 'בחירה מרובה'}
              </button>

              {isSelectMode && selectedStudents.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center px-2.5 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-[10px] font-bold"
                >
                  <TrashIcon size={12} weight="bold" className="ml-1" />
                  מחק נבחרים ({selectedStudents.size})
                </button>
              )}

              <span className="text-xs font-medium text-slate-400">
                {searchTerm || filters.orchestra || filters.instrument || filters.stageLevel
                  ? `${students.length} מתוך ${totalStudents}`
                  : `${students.length} מתוך ${totalStudents}`}
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

        {/* Table / Grid Content — scrolls internally, load-more stays visible */}
        <div className="relative flex-1 min-h-0">
          {searchLoading && (
            <div className="absolute inset-0 bg-white/75 dark:bg-sidebar-dark/75 flex items-center justify-center z-10">
              <div className="text-center">
                <CircleNotchIcon size={24} weight="regular" className="animate-spin mx-auto mb-2 text-primary" />
                <div className="text-sm text-slate-500">מחפש תלמידים...</div>
              </div>
            </div>
          )}

          {viewMode === 'table' ? (
            <Table
              columns={columns}
              data={filteredStudents}
              onRowClick={(row) => {
                if (isSelectMode) {
                  const newSelected = new Set(selectedStudents)
                  if (newSelected.has(row.id)) {
                    newSelected.delete(row.id)
                  } else {
                    newSelected.add(row.id)
                  }
                  setSelectedStudents(newSelected)
                } else {
                  handleViewStudent(row.id)
                }
              }}
              rowClassName={(row) => {
                const isSelected = selectedStudents.has(row.id)
                return clsx(
                  'cursor-pointer transition-all duration-150',
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-l-4 border-blue-500'
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                )
              }}
            />
          ) : (
            <div className="p-5">
              {/* Grid Select All Header */}
              {isSelectMode && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents(new Set(filteredStudents.map(s => s.id)))
                          } else {
                            setSelectedStudents(new Set())
                          }
                        }}
                        className="w-4 h-4 text-primary bg-white border-2 border-slate-300 rounded focus:ring-primary focus:ring-2"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        בחר הכל ({filteredStudents.length} תלמידים)
                      </span>
                    </div>
                    {selectedStudents.size > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>נבחרו: {selectedStudents.size}</span>
                        <button
                          onClick={() => setSelectedStudents(new Set())}
                          className="text-primary hover:underline font-medium"
                        >
                          נקה בחירה
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student.originalStudent}
                    showInstruments={true}
                    showTeacherAssignments={true}
                    showParentContact={false}
                    onClick={() => {
                      if (isSelectMode) {
                        handleStudentSelection(student.id, !selectedStudents.has(student.id))
                      } else {
                        handleViewStudent(student.id)
                      }
                    }}
                    onDelete={handleDeleteStudent}
                    className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1"
                    isSelectMode={isSelectMode}
                    isSelected={selectedStudents.has(student.id)}
                    onSelectionChange={handleStudentSelection}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredStudents.length === 0 && !loading && !searchLoading && (
            searchTerm || filters.orchestra || filters.instrument || filters.stageLevel ? (
              <div className="text-center py-12 text-slate-400">לא נמצאו תלמידים התואמים לחיפוש</div>
            ) : (
              <div className="p-5">
                <EmptyState
                  title="אין תלמידים עדיין"
                  description="הוסף תלמידים לקונסרבטוריון כדי להתחיל"
                  icon={<GraduationCapIcon size={48} weight="regular" />}
                  action={{ label: 'הוסף תלמיד', onClick: () => setShowForm(true) }}
                />
              </div>
            )
          )}
        </div>

        {/* Load More inside card */}
        {hasMore && filteredStudents.length > 0 && !loading && (
          <div className="flex justify-center py-5 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <CircleNotchIcon size={18} weight="regular" className="animate-spin" />
                  <span>טוען עוד תלמידים...</span>
                </>
              ) : (
                <>
                  <CaretDownIcon size={18} weight="bold" />
                  <span>טען עוד תלמידים</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת תלמיד"
        message={`האם אתה בטוח שברצונך למחוק את התלמיד ${studentToDelete?.name}? פעולה זו לא ניתנת לביטול.`}
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />

      {/* Stage Level Update confirmation modal */}
      <ConfirmationModal
        isOpen={!!stageLevelConfirm}
        title="עדכון שלב התלמיד"
        message={stageLevelConfirm ?
          `האם אתה בטוח שברצונך לשנות את שלב התלמיד "${stageLevelConfirm.studentName}" משלב ${stageLevelConfirm.currentLevel} לשלב ${stageLevelConfirm.newLevel}?`
          : ''
        }
        confirmText="עדכן שלב"
        cancelText="ביטול"
        onConfirm={handleConfirmStageLevelUpdate}
        onCancel={handleCancelStageLevelUpdate}
        variant="primary"
      />

      {/* Safe Delete Modal */}
      <SafeDeleteModal
        isOpen={showSafeDeleteModal}
        studentId={studentToDelete?.id || ''}
        studentName={studentToDelete?.name || ''}
        onClose={() => setShowSafeDeleteModal(false)}
        onConfirm={handleSafeDelete}
      />

      {/* Deletion Impact Modal */}
      <DeletionImpactModal
        isOpen={showDeletionImpactModal}
        preview={deletionPreview}
        onClose={() => setShowDeletionImpactModal(false)}
      />

      {/* Batch Deletion Modal */}
      <BatchDeletionModal
        isOpen={showBatchDeletionModal}
        selectedStudentIds={Array.from(selectedStudents)}
        onClose={() => setShowBatchDeletionModal(false)}
        onComplete={() => {
          setShowBatchDeletionModal(false)
          setSelectedStudents(new Set())
          setIsSelectMode(false)
          loadStudents(1, false)
        }}
      />
    </div>
  )
}
