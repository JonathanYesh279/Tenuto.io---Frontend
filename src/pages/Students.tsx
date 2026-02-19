import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EyeIcon, PencilSimpleIcon, FunnelIcon, CircleNotchIcon, XIcon, SquaresFourIcon, ListIcon, TrashIcon, CaretUpIcon, CaretDownIcon, WarningIcon, ShieldIcon, ArchiveIcon, ClockIcon, UsersIcon, GraduationCapIcon, UserCheckIcon, UserCircleMinusIcon, BookOpenIcon } from '@phosphor-icons/react'
import { PlusIcon } from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { Card } from '../components/ui/Card'
import Table from '../components/ui/Table'
import { Badge } from '../components/ui/badge'
import { StatusBadge, InstrumentBadge, AvatarInitials } from '../components/domain'
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
          <div className="flex space-x-2 space-x-reverse">
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
              className="p-1.5 text-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation() // Prevent row click
                console.log('Eye icon clicked for student:', student.id)
                handleViewStudent(student.id)
              }}
              title="צפה בפרטי התלמיד"
            >
              <EyeIcon size={16} weight="regular" />
            </button>
            <button
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation() // Prevent row click
                handleEditStudent(student.id)
              }}
              title="ערוך פרטי התלמיד"
            >
              <PencilSimpleIcon size={16} weight="regular" />
            </button>
            {(student.referenceCount || student.rawData?.referenceCount || 0) > 0 ? (
              <button 
                className="p-1.5 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation() // Prevent row click
                  handleSafeDeleteClick(student.id, student.name)
                }}
                title="מחיקה מאובטחת"
              >
                <ShieldIcon size={16} weight="regular" />
              </button>
            ) : (
              <button 
                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation() // Prevent row click
                  handleDeleteClick(student.id, student.name)
                }}
                title="מחק תלמיד"
              >
                <TrashIcon size={16} weight="fill" />
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
          <AvatarInitials
            firstName={row.rawData?.personalInfo?.firstName}
            lastName={row.rawData?.personalInfo?.lastName}
            size="sm"
            colorClassName="bg-students-bg text-students-fg"
          />
          <span className="font-medium text-gray-900">{row.name}</span>
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
    <div className="relative">
      
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {loadingStudentData ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">טוען נתוני תלמיד...</p>
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
      {/* Compact identity strip */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">תלמידים</h1>
          <span className="text-sm text-muted-foreground">{activeStudents} פעילים</span>
        </div>
        <button
          onClick={handleAddStudent}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <PlusIcon size={14} weight="fill" />
          הוסף תלמיד
        </button>
      </div>

      {/* Compact Filter Toolbar — flush with table, no gap below */}
      <div className="flex items-center gap-3 pt-2 pb-2 border-b border-border flex-wrap">
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
          className="px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
        >
          <option value="">כל התזמורות</option>
          <option value="תזמורת">תזמורת</option>
          <option value="ללא תזמורת">ללא תזמורת</option>
        </select>
        <select
          value={filters.instrument}
          onChange={(e) => setFilters(prev => ({ ...prev, instrument: e.target.value }))}
          className="px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
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
          className="px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
        >
          <option value="">כל השלבים</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(level => (
            <option key={level} value={level}>שלב {level}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground mr-auto">
          {totalStudents} תלמידים
        </span>
      </div>

      {/* Results Info */}
      <div className="py-2 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {searchTerm || filters.orchestra || filters.instrument || filters.stageLevel ? (
            <span>
              מציג {students.length} תלמידים מתוך {totalStudents} סה"כ
              {hasMore && <span className="text-primary font-medium"> (טען עוד לתוצאות נוספות)</span>}
            </span>
          ) : (
            <span>
              מציג {students.length} מתוך {totalStudents} תלמידים
              {hasMore && <span className="text-primary font-medium"> (טען עוד לצפייה בנוספים)</span>}
            </span>
          )}
        </div>
        
        {/* View Mode Toggle and Selection Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggleSelectMode}
            className={`flex items-center px-3 py-1 rounded text-xs transition-colors ${
              isSelectMode 
                ? 'bg-gray-500 text-white hover:bg-gray-600' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            title={isSelectMode ? 'בטל בחירה מרובה' : 'הפעל בחירה מרובה'}
          >
            <UsersIcon size={12} weight="regular" className="ml-1" />
            {isSelectMode ? 'בטל בחירה' : 'בחירה מרובה'}
          </button>
          
          {isSelectMode && selectedStudents.size > 0 && (
            <button 
              onClick={handleBatchDelete}
              className="flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
            >
              <TrashIcon size={12} weight="fill" className="ml-1" />
              מחק נבחרים ({selectedStudents.size})
            </button>
          )}
          
          <div className="flex items-center bg-gray-50 p-1 rounded border border-gray-200">
          <button
            onClick={() => setViewMode('table')}
            className={`relative px-3 py-2 rounded text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2 ${
              viewMode === 'table'
                ? 'bg-white text-foreground shadow-sm border border-border'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
            aria-pressed={viewMode === 'table'}
            aria-label="תצוגת טבלה"
          >
            <ListIcon size={16} weight="regular" />
            <span className="hidden sm:inline">טבלה</span>
            {viewMode === 'table' && (
              <div className="absolute inset-0 rounded bg-muted/40 pointer-events-none" />
            )}
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`relative px-3 py-2 rounded text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2 ${
              viewMode === 'grid'
                ? 'bg-white text-foreground shadow-sm border border-border'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
            aria-pressed={viewMode === 'grid'}
            aria-label="תצוגת רשת"
          >
            <SquaresFourIcon size={16} weight="regular" />
            <span className="hidden sm:inline">רשת</span>
            {viewMode === 'grid' && (
              <div className="absolute inset-0 rounded bg-muted/40 pointer-events-none" />
            )}
          </button>
        </div>
        </div>
      </div>

      {/* Students Display */}
      <div className="relative">
        {searchLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded">
            <div className="text-center">
              <CircleNotchIcon size={24} weight="regular" className="animate-spin mx-auto mb-2 text-primary" />
              <div className="text-sm text-gray-600">מחפש תלמידים...</div>
            </div>
          </div>
        )}

      {viewMode === 'table' ? (
        <Table
          columns={columns}
          data={filteredStudents}
          onRowClick={(row) => {
            if (isSelectMode) {
              // In select mode, clicking row toggles selection
              const newSelected = new Set(selectedStudents)
              if (newSelected.has(row.id)) {
                newSelected.delete(row.id)
              } else {
                newSelected.add(row.id)
              }
              setSelectedStudents(newSelected)
            } else {
              // In normal mode, navigate to student details
              handleViewStudent(row.id)
            }
          }}
          rowClassName={(row) => {
            const isSelected = selectedStudents.has(row.id)
            return clsx(
              'cursor-pointer transition-all duration-150',
              isSelected
                ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                : 'hover:bg-muted'
            )
          }}
        />
      ) : (
        <div>
          {/* Grid Select All Header */}
          {isSelectMode && (
            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
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
                    className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    בחר הכל ({filteredStudents.length} תלמידים)
                  </span>
                </div>
                {selectedStudents.size > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>נבחרו: {selectedStudents.size}</span>
                    <button
                      onClick={() => setSelectedStudents(new Set())}
                      className="text-blue-600 hover:text-blue-800 underline"
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
          <div className="text-center py-12 text-muted-foreground">לא נמצאו תלמידים התואמים לחיפוש</div>
        ) : (
          <EmptyState
            title="אין תלמידים עדיין"
            description="הוסף תלמידים לקונסרבטוריון כדי להתחיל"
            icon={<GraduationCapIcon size={48} weight="regular" />}
            action={{ label: 'הוסף תלמיד', onClick: () => setShowForm(true) }}
          />
        )
      )}
      </div>

      {/* Load More Button */}
      {hasMore && filteredStudents.length > 0 && !loading && (
        <div className="flex justify-center mt-8 mb-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <CircleNotchIcon size={20} weight="regular" className="animate-spin" />
                <span>טוען עוד תלמידים...</span>
              </>
            ) : (
              <>
                <CaretDownIcon size={20} weight="regular" />
                <span>טען עוד תלמידים</span>
              </>
            )}
          </button>
        </div>
      )}

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
