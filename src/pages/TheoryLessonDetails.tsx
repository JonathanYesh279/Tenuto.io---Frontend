import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CaretLeftIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  UsersIcon,
  CalendarIcon,
  MapPinIcon,
  BookOpenIcon,
  ClockIcon,
  UserPlusIcon,
  CheckIcon,
  XIcon,
  FileTextIcon,
  CheckCircleIcon,
  ChartBarIcon,
  XCircleIcon,
} from '@phosphor-icons/react'
import { Button as HeroButton, Chip, Tabs as HeroTabs, Tab as HeroTab } from '@heroui/react'
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from '@/components/ui/animated-tabs'
import { Card } from '../components/ui/Card'
import { GlassStatCard } from '../components/ui/GlassStatCard'
import TheoryLessonForm from '../components/TheoryLessonForm'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import { theoryService, studentService, teacherService } from '../services/apiService'
import { getDisplayName } from '@/utils/nameUtils'
import { VerticalAutoScroll } from '@/components/animations/VerticalAutoScroll'

interface TheoryLesson {
  _id: string
  category: string
  teacherId: string
  date: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location: string
  studentIds: string[]
  attendance: {
    present: string[]
    absent: string[]
    late: string[]
  }
  notes: string
  syllabus: string
  homework: string
  schoolYearId: string
  createdAt: string
  updatedAt: string
}

interface Student {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    phone?: string
    studentEmail?: string
  }
  academicInfo: {
    class: string
    instrumentProgress?: Array<{
      instrumentName: string
      isPrimary: boolean
      currentStage: string
    }>
  }
  isActive: boolean
}

interface Teacher {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    email?: string
    phone?: string
  }
}

const DAYS_OF_WEEK = {
  0: 'ראשון',
  1: 'שני',
  2: 'שלישי',
  3: 'רביעי',
  4: 'חמישי',
  5: 'שישי',
  6: 'שבת'
}

// Teal-tinted glass — lesson info card
const GLASS_INFO_STYLE = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(153,220,200,0.18) 50%, rgba(255,255,255,0.92) 100%)',
  boxShadow:
    '0 4px 16px rgba(0,170,140,0.08), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(160,210,195,0.45)',
} as const

// Blue-tinted glass — students widget
const GLASS_STUDENTS_STYLE = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(170,200,235,0.18) 50%, rgba(255,255,255,0.92) 100%)',
  boxShadow:
    '0 4px 16px rgba(0,120,210,0.08), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(180,210,240,0.45)',
} as const

// Warm glass — materials card
const GLASS_MATERIALS_STYLE = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(220,200,170,0.12) 50%, rgba(255,255,255,0.92) 100%)',
  boxShadow:
    '0 4px 16px rgba(180,150,80,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(220,210,185,0.45)',
} as const

export default function TheoryLessonDetails() {
  const { theoryId } = useParams<{ theoryId: string }>()
  const navigate = useNavigate()

  const [theoryLesson, setTheoryLesson] = useState<TheoryLesson | null>(null)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [categoryLessons, setCategoryLessons] = useState<TheoryLesson[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Remove parent Layout overflow-y-auto to prevent page scrollbar
  useEffect(() => {
    const parent = containerRef.current?.parentElement
    if (parent?.classList.contains('overflow-y-auto')) {
      parent.classList.remove('overflow-y-auto')
      parent.classList.add('overflow-hidden')
      return () => {
        parent.classList.remove('overflow-hidden')
        parent.classList.add('overflow-y-auto')
      }
    }
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [tempAttendance, setTempAttendance] = useState<{present: string[], absent: string[], late: string[]}>({
    present: [],
    absent: [],
    late: []
  })

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationConfig, setConfirmationConfig] = useState<{
    title: string
    message: string
    onConfirm: () => void
    variant?: 'danger' | 'warning' | 'info'
  } | null>(null)

  const showConfirmationModal = (config: {
    title: string
    message: string
    onConfirm: () => void
    variant?: 'danger' | 'warning' | 'info'
  }) => {
    setConfirmationConfig(config)
    setShowConfirmation(true)
  }

  const handleConfirmation = () => {
    if (confirmationConfig?.onConfirm) {
      confirmationConfig.onConfirm()
    }
    setShowConfirmation(false)
    setConfirmationConfig(null)
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setConfirmationConfig(null)
  }

  useEffect(() => {
    if (theoryId) {
      loadTheoryLessonDetails()
    }
  }, [theoryId])

  const loadTheoryLessonDetails = async () => {
    if (!theoryId) return

    try {
      setLoading(true)
      setError(null)

      const [theoryData, studentsData, teachersData] = await Promise.all([
        theoryService.getTheoryLesson(theoryId),
        studentService.getStudents(),
        teacherService.getTeachers()
      ])

      setTheoryLesson(theoryData)
      setAllStudents(studentsData)
      setTeachers(teachersData)
      setTempAttendance(theoryData.attendance || { present: [], absent: [], late: [] })

      // Load all lessons of the same category for analytics
      if (theoryData.category) {
        try {
          const result = await theoryService.getTheoryLessons({ category: theoryData.category, limit: 500 })
          const lessons = result?.data || (Array.isArray(result) ? result : [])
          setCategoryLessons(lessons)
        } catch {
          setCategoryLessons([])
        }
      }
    } catch (error) {
      console.error('Error loading theory lesson details:', error)
      setError('שגיאה בטעינת פרטי שיעור התאוריה')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTheoryLesson = async (theoryData: any) => {
    if (!theoryId) return

    try {
      await theoryService.updateTheoryLesson(theoryId, theoryData)
      setShowEditForm(false)
      await loadTheoryLessonDetails()
    } catch (error) {
      console.error('Error updating theory lesson:', error)
      throw error
    }
  }

  const handleAddStudent = async (studentId: string) => {
    if (!theoryId || !theoryLesson) return

    // Optimistic update — only mutate studentIds, no full reload
    setTheoryLesson(prev => prev ? {
      ...prev,
      studentIds: [...prev.studentIds, studentId]
    } : prev)

    try {
      await theoryService.addStudentToTheory(theoryId, studentId)
    } catch (error) {
      console.error('Error adding student:', error)
      setError('שגיאה בהוספת תלמיד לשיעור')
      // Rollback on failure
      setTheoryLesson(prev => prev ? {
        ...prev,
        studentIds: prev.studentIds.filter(id => id !== studentId)
      } : prev)
    }
  }

  const handleRemoveStudent = (studentId: string) => {
    if (!theoryId || !theoryLesson) return

    showConfirmationModal({
      title: 'הסרת תלמיד מהשיעור',
      message: 'האם אתה בטוח שברצונך להסיר את התלמיד מהשיעור?',
      variant: 'danger',
      onConfirm: async () => {
        // Optimistic update
        setTheoryLesson(prev => prev ? {
          ...prev,
          studentIds: prev.studentIds.filter(id => id !== studentId)
        } : prev)

        try {
          await theoryService.removeStudentFromTheory(theoryId, studentId)
        } catch (error) {
          console.error('Error removing student:', error)
          setError('שגיאה בהסרת תלמיד מהשיעור')
          // Rollback on failure
          setTheoryLesson(prev => prev ? {
            ...prev,
            studentIds: [...prev.studentIds, studentId]
          } : prev)
        }
      }
    })
  }

  const handleDeleteTheoryLesson = () => {
    if (!theoryId) return

    showConfirmationModal({
      title: 'מחיקת שיעור תאוריה',
      message: 'האם אתה בטוח שברצונך למחוק את שיעור התאוריה? פעולה זו אינה הפיכה.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await theoryService.deleteTheoryLesson(theoryId)
          navigate('/theories')
        } catch (error) {
          console.error('Error deleting theory lesson:', error)
          setError('שגיאה במחיקת שיעור התאוריה')
        }
      }
    })
  }

  const handleSaveAttendance = async () => {
    if (!theoryId) return

    try {
      await theoryService.updateTheoryAttendance(theoryId, tempAttendance)
      await loadTheoryLessonDetails()
    } catch (error) {
      console.error('Error updating attendance:', error)
      setError('שגיאה בעדכון נוכחות')
    }
  }

  const toggleAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setTempAttendance(prev => {
      const cleaned = {
        present: prev.present.filter(id => id !== studentId),
        absent: prev.absent.filter(id => id !== studentId),
        late: (prev.late || []).filter(id => id !== studentId),
      }

      if (status === 'present') cleaned.present.push(studentId)
      else if (status === 'absent') cleaned.absent.push(studentId)
      else if (status === 'late') cleaned.late.push(studentId)

      return cleaned
    })
  }

  const markAllPresent = useCallback(() => {
    if (!theoryLesson) return
    const allStudentIds = allStudents
      .filter(student => theoryLesson.studentIds.includes(student._id))
      .map(student => student._id)
    setTempAttendance({
      present: allStudentIds,
      absent: [],
      late: []
    })
  }, [theoryLesson, allStudents])

  const markAllAbsent = useCallback(() => {
    if (!theoryLesson) return
    const allStudentIds = allStudents
      .filter(student => theoryLesson.studentIds.includes(student._id))
      .map(student => student._id)
    setTempAttendance({
      present: [],
      absent: allStudentIds,
      late: []
    })
  }, [theoryLesson, allStudents])

  const clearAllAttendance = useCallback(() => {
    setTempAttendance({
      present: [],
      absent: [],
      late: []
    })
  }, [])

  const handleViewStudentProfile = (studentId: string) => {
    navigate(`/students/${studentId}`)
  }

  const handleViewTeacherProfile = (teacherId: string) => {
    navigate(`/teachers/${teacherId}`)
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="space-y-0">
        <div className="bg-muted/40 border-b border-border p-6 animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-4"></div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-muted rounded-xl"></div>
            <div className="flex-1">
              <div className="h-7 bg-muted rounded w-48 mb-2"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-muted/60 rounded-full w-16"></div>
                <div className="h-6 bg-muted/60 rounded-full w-24"></div>
                <div className="h-6 bg-muted/60 rounded-full w-20"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
            <div className="h-64 bg-muted/30 rounded-card"></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1">
                <div className="h-[90px] bg-muted/30 rounded-md"></div>
                <div className="h-[90px] bg-muted/30 rounded-md"></div>
                <div className="h-[90px] bg-muted/30 rounded-md"></div>
                <div className="h-[90px] bg-muted/30 rounded-md"></div>
              </div>
              <div className="h-40 bg-muted/30 rounded-card"></div>
            </div>
            <div className="h-64 bg-muted/30 rounded-card"></div>
          </div>
        </div>
      </div>
    )
  }

  // --- Error state ---
  if (error || !theoryLesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <BookOpenIcon size={48} weight="regular" className="text-muted-foreground/40 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">שגיאה בטעינת שיעור התאוריה</h1>
        <p className="text-muted-foreground mb-6">{error || 'שיעור תאוריה לא נמצא'}</p>
        <HeroButton
          color="primary"
          variant="solid"
          onPress={() => navigate('/theories')}
          startContent={<CaretLeftIcon size={16} weight="bold" />}
        >
          חזור לשיעורי תאוריה
        </HeroButton>
      </div>
    )
  }

  // --- Derived data ---
  const availableStudents = allStudents.filter(student =>
    !theoryLesson.studentIds.includes(student._id) &&
    student.isActive &&
    (!searchQuery ||
      getDisplayName(student.personalInfo).toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.academicInfo?.class?.includes(searchQuery))
  )

  const enrolledStudents = allStudents.filter(student =>
    theoryLesson.studentIds.includes(student._id)
  )

  const teacher = teachers.find(t => t._id === theoryLesson.teacherId)

  const stats = {
    totalStudents: enrolledStudents.length,
    attendanceRate: theoryLesson.attendance && enrolledStudents.length > 0 ?
      ((theoryLesson.attendance.present.length + (theoryLesson.attendance.late?.length || 0)) / enrolledStudents.length * 100) : 0,
    presentCount: theoryLesson.attendance?.present.length || 0,
    absentCount: theoryLesson.attendance?.absent.length || 0,
    lateCount: theoryLesson.attendance?.late?.length || 0
  }

  const dayName = DAYS_OF_WEEK[theoryLesson.dayOfWeek as keyof typeof DAYS_OF_WEEK]
  const hasMaterials = theoryLesson.notes || theoryLesson.syllabus || theoryLesson.homework

  // Compute per-student attendance analytics across all category lessons
  const studentAttendanceAnalytics = enrolledStudents.length > 0 && categoryLessons.length > 0
    ? enrolledStudents.map(student => {
        let totalSessions = 0
        let presentCount = 0
        let absentCount = 0
        let lateCount = 0

        categoryLessons.forEach(lesson => {
          if (!lesson.studentIds?.includes(student._id)) return
          const hasRecord = lesson.attendance?.present?.includes(student._id) || lesson.attendance?.absent?.includes(student._id) || lesson.attendance?.late?.includes(student._id)
          if (!hasRecord) return
          totalSessions++
          if (lesson.attendance?.present?.includes(student._id)) presentCount++
          if (lesson.attendance?.absent?.includes(student._id)) absentCount++
          if (lesson.attendance?.late?.includes(student._id)) lateCount++
        })

        // Rate counts present + late as attended
        const rate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : null
        return {
          studentId: student._id,
          name: getDisplayName(student.personalInfo),
          class: student.academicInfo?.class || '',
          instrument: student.academicInfo?.instrumentProgress?.find(p => p.isPrimary)?.instrumentName || '',
          totalSessions,
          presentCount,
          lateCount,
          absentCount,
          rate,
        }
      }).sort((a, b) => (a.rate ?? -1) - (b.rate ?? -1))
    : []

  return (
    <div ref={containerRef} className="bg-background">
      {/* ─── Header ─── */}
      <div className="bg-muted/40 border-b border-border">
        {/* Breadcrumb */}
        <div className="px-6 pt-4 pb-0">
          <button
            onClick={() => navigate('/theories')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <CaretLeftIcon size={14} weight="bold" />
            שיעורי תאוריה
          </button>
        </div>

        {/* Identity + Actions */}
        <div className="px-6 pt-3 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-foreground truncate">{theoryLesson.category}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Chip
                    size="sm"
                    variant="flat"
                    classNames={{ base: 'bg-teal-100/70 text-teal-800', content: 'font-medium' }}
                    startContent={<CalendarIcon size={12} />}
                  >
                    {dayName}
                  </Chip>
                  <Chip
                    size="sm"
                    variant="flat"
                    classNames={{ base: 'bg-blue-100/70 text-blue-800', content: 'font-medium' }}
                    startContent={<ClockIcon size={12} />}
                  >
                    {theoryLesson.startTime} - {theoryLesson.endTime}
                  </Chip>
                  <Chip
                    size="sm"
                    variant="flat"
                    classNames={{ base: 'bg-amber-100/70 text-amber-800', content: 'font-medium' }}
                    startContent={<MapPinIcon size={12} />}
                  >
                    {theoryLesson.location}
                  </Chip>
                  {theoryLesson.updatedAt && (
                    <span className="text-xs text-muted-foreground">
                      עודכן: {new Date(theoryLesson.updatedAt).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <HeroButton
                variant="bordered"
                size="sm"
                startContent={<PencilSimpleIcon size={16} />}
                onPress={() => setShowEditForm(true)}
              >
                ערוך
              </HeroButton>
              <HeroButton
                color="danger"
                variant="flat"
                size="sm"
                startContent={<TrashIcon size={16} weight="fill" />}
                onPress={handleDeleteTheoryLesson}
              >
                מחק
              </HeroButton>
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-card p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* ─── Main content: 3-column asymmetric grid ─── */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[400px]">

          {/* ── Column 1: Lesson Info Card ── */}
          <div
            className="rounded-card p-5 flex flex-col h-full overflow-auto"
            style={GLASS_INFO_STYLE}
          >
            <h3 className="text-sm font-bold text-foreground mb-4">פרטי השיעור</h3>

            <div className="space-y-5 flex-1">
              {/* Teacher */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-100 shadow-sm">
                  <UserIcon size={17} weight="duotone" className="text-teal-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-muted-foreground mb-0.5">מורה</div>
                  {teacher ? (
                    <>
                      <button
                        onClick={() => handleViewTeacherProfile(teacher._id)}
                        className="text-sm font-semibold text-foreground hover:underline transition-colors block truncate"
                        style={{ color: 'hsl(var(--color-theory-fg))' }}
                      >
                        {getDisplayName(teacher.personalInfo)}
                      </button>
                      {teacher.personalInfo?.email && (
                        <div className="text-[11px] text-muted-foreground truncate">{teacher.personalInfo.email}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">לא הוקצה מורה</div>
                  )}
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Schedule */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100 shadow-sm">
                  <ClockIcon size={17} weight="duotone" className="text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-muted-foreground mb-0.5">זמן</div>
                  <div className="text-sm font-semibold text-foreground">
                    {dayName} {theoryLesson.startTime} - {theoryLesson.endTime}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(theoryLesson.date).toLocaleDateString('he-IL')}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100 shadow-sm">
                  <MapPinIcon size={17} weight="duotone" className="text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-muted-foreground mb-0.5">מיקום</div>
                  <div className="text-sm font-semibold text-foreground">{theoryLesson.location}</div>
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Category */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-violet-100 shadow-sm">
                  <BookOpenIcon size={17} weight="duotone" className="text-violet-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-muted-foreground mb-0.5">קטגוריה</div>
                  <div className="text-sm font-semibold text-foreground">{theoryLesson.category}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Column 2: Stats + Materials ── */}
          <div className="flex flex-col gap-3 min-h-0 h-full overflow-hidden">
            {/* 2x2 GlassStatCards */}
            <div className="grid grid-cols-2 gap-1">
              <GlassStatCard
                size="sm"
                value={stats.totalStudents}
                label="תלמידים רשומים"
                className="!h-[90px] !p-2.5"
              />
              <GlassStatCard
                size="sm"
                value={stats.presentCount}
                label="נוכחים"
                className="!h-[90px] !p-2.5"
                valueClassName="text-green-700"
              />
              <GlassStatCard
                size="sm"
                value={stats.absentCount}
                label="נעדרים"
                className="!h-[90px] !p-2.5"
                valueClassName="text-red-600"
              />
              <GlassStatCard
                size="sm"
                value={`${isNaN(stats.attendanceRate) ? 0 : Math.round(stats.attendanceRate)}%`}
                label="אחוז נוכחות"
                className="!h-[90px] !p-2.5"
                valueClassName={
                  stats.attendanceRate >= 75 ? 'text-green-700' :
                  stats.attendanceRate >= 50 ? 'text-orange-600' : 'text-red-600'
                }
              />
            </div>

            {/* Materials card */}
            <div
              className="rounded-card p-4 flex-1 min-h-0 overflow-auto"
              style={GLASS_MATERIALS_STYLE}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-amber-100">
                  <FileTextIcon size={14} className="text-amber-700" />
                </div>
                <h3 className="text-sm font-bold text-foreground">חומרי לימוד</h3>
              </div>

              {hasMaterials ? (
                <HeroTabs
                  variant="underlined"
                  size="sm"
                  classNames={{
                    tabList: 'gap-4 border-b border-border/50 pb-0',
                    tab: 'text-xs font-medium',
                    cursor: 'bg-foreground',
                    panel: 'pt-3',
                  }}
                >
                  {theoryLesson.syllabus && (
                    <HeroTab key="syllabus" title="סילבוס">
                      <div className="text-sm text-muted-foreground leading-relaxed p-2.5 bg-muted/30 rounded-lg whitespace-pre-wrap">
                        {theoryLesson.syllabus}
                      </div>
                    </HeroTab>
                  )}
                  {theoryLesson.homework && (
                    <HeroTab key="homework" title="שיעורי בית">
                      <div className="text-sm text-muted-foreground leading-relaxed p-2.5 bg-muted/30 rounded-lg whitespace-pre-wrap">
                        {theoryLesson.homework}
                      </div>
                    </HeroTab>
                  )}
                  {theoryLesson.notes && (
                    <HeroTab key="notes" title="הערות">
                      <div className="text-sm text-muted-foreground leading-relaxed p-2.5 bg-muted/30 rounded-lg whitespace-pre-wrap">
                        {theoryLesson.notes}
                      </div>
                    </HeroTab>
                  )}
                </HeroTabs>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                    <FileTextIcon className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="text-xs">אין חומרי לימוד</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Column 3: Students Widget ── */}
          <div
            className="rounded-card p-4 overflow-hidden flex flex-col"
            style={GLASS_STUDENTS_STYLE}
          >
            {/* Widget header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">תלמידים</h3>
                <Chip size="sm" variant="flat" color="default">{enrolledStudents.length}</Chip>
              </div>
              <HeroButton
                color="primary"
                variant={showAddStudent ? 'bordered' : 'solid'}
                size="sm"
                startContent={showAddStudent ? <XIcon size={14} /> : <PlusIcon size={14} weight="bold" />}
                onPress={() => {
                  setShowAddStudent(!showAddStudent)
                  setSearchQuery('')
                }}
              >
                {showAddStudent ? 'ביטול' : 'הוסף'}
              </HeroButton>
            </div>

            {/* Add student search panel */}
            <AnimatePresence>
              {showAddStudent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mb-3 pb-3 border-b border-border/50">
                    <div className="relative mb-2">
                      <MagnifyingGlassIcon size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="חיפוש תלמיד..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-8 pl-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {availableStudents.length > 0 ? (
                        availableStudents.map(student => (
                          <button
                            key={student._id}
                            onClick={() => handleAddStudent(student._id)}
                            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-blue-50/60 transition-colors text-start"
                          >
                            <UserPlusIcon size={14} style={{ color: 'hsl(var(--color-theory-fg))' }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-foreground truncate">
                                {getDisplayName(student.personalInfo)}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                כיתה {student.academicInfo?.class}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-3 text-xs text-muted-foreground">
                          אין תלמידים זמינים
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enrolled students list — auto-scroll like סדר יום */}
            {enrolledStudents.length > 0 && (
              <div className="text-[11px] font-bold text-muted-foreground mb-1.5">רשומים</div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">
              {enrolledStudents.length > 0 ? (
                <VerticalAutoScroll speed={12} className="h-full" itemCount={enrolledStudents.length} minItems={4}>
                  <div className="space-y-2 pb-2">
                    {enrolledStudents.map((student) => {
                      const primaryInstrument = student.academicInfo?.instrumentProgress?.find(p => p.isPrimary)
                      const isPresent = theoryLesson.attendance?.present?.includes(student._id)
                      const isAbsent = theoryLesson.attendance?.absent?.includes(student._id)
                      const isLate = theoryLesson.attendance?.late?.includes(student._id)

                      return (
                        <motion.div
                          key={student._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="rounded-xl bg-blue-50/50 border border-blue-100/50 p-2.5 cursor-pointer hover:bg-blue-50/80 transition-colors select-none group"
                          onClick={() => handleViewStudentProfile(student._id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-foreground/80 font-medium text-xs block truncate">
                                {getDisplayName(student.personalInfo)}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-blue-600/70">
                                {student.academicInfo?.class && (
                                  <span>כיתה {student.academicInfo.class}</span>
                                )}
                                {student.academicInfo?.class && primaryInstrument && (
                                  <span>·</span>
                                )}
                                {primaryInstrument && (
                                  <span>{primaryInstrument.instrumentName}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {isPresent && (
                                <Chip size="sm" variant="flat" color="success" className="text-[10px] h-5">נוכח</Chip>
                              )}
                              {isLate && (
                                <Chip size="sm" variant="flat" color="warning" className="text-[10px] h-5">מאחר</Chip>
                              )}
                              {isAbsent && (
                                <Chip size="sm" variant="flat" color="danger" className="text-[10px] h-5">נעדר</Chip>
                              )}
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleRemoveStudent(student._id)}
                                  className="p-1 rounded-md hover:bg-red-50 transition-colors"
                                  title="הסר מהשיעור"
                                >
                                  <TrashIcon size={13} className="text-red-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </VerticalAutoScroll>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                    <UsersIcon className="w-7 h-7 text-blue-300" />
                  </div>
                  <span className="text-sm font-medium text-foreground/60 mb-1">אין תלמידים רשומים</span>
                  <span className="text-xs mb-4">התחל על ידי הוספת התלמיד הראשון</span>
                  <HeroButton
                    color="primary"
                    variant="solid"
                    size="sm"
                    startContent={<PlusIcon size={14} weight="bold" />}
                    onPress={() => setShowAddStudent(true)}
                  >
                    הוסף תלמיד ראשון
                  </HeroButton>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ─── Attendance & Analytics Section ─── */}
        <Card className="mt-4">
          {/* Section header + tabs */}
          <div className="p-5 pb-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
                  <CheckCircleIcon size={16} weight="duotone" className="text-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">נוכחות</h3>
                  <p className="text-[11px] text-muted-foreground">{dayName} · {theoryLesson.startTime} - {theoryLesson.endTime} · {enrolledStudents.length} תלמידים</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <Tabs defaultValue="mark">
              <TabsList className="w-auto inline-flex gap-1 mr-auto">
                <TabsTrigger value="mark" className="flex-none font-bold text-xs px-2.5 py-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircleIcon size={14} weight="fill" />
                    רישום נוכחות
                  </span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex-none font-bold text-xs px-2.5 py-1">
                  <span className="flex items-center gap-1.5">
                    <ChartBarIcon size={14} weight="fill" />
                    סטטיסטיקה
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContents>
                {/* ── Tab 1: Mark Attendance ── */}
                <TabsContent value="mark">
                  <div className="pt-4">
                    {/* Date + Bulk actions row */}
                    <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-border">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-muted-foreground">תאריך:</label>
                        <input
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          className="border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="flex gap-2">
                        <HeroButton size="sm" color="success" variant="flat" onPress={markAllPresent} startContent={<CheckIcon size={13} weight="bold" />}>
                          הכל נוכח
                        </HeroButton>
                        <HeroButton size="sm" color="danger" variant="flat" onPress={markAllAbsent} startContent={<XIcon size={13} weight="bold" />}>
                          הכל נעדר
                        </HeroButton>
                        <HeroButton size="sm" variant="bordered" onPress={clearAllAttendance}>
                          נקה
                        </HeroButton>
                      </div>
                    </div>

                    {/* Student attendance grid */}
                    {enrolledStudents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-5">
                        {enrolledStudents.map(student => {
                          const isPresent = tempAttendance.present.includes(student._id)
                          const isAbsent = tempAttendance.absent.includes(student._id)
                          const isLate = (tempAttendance.late || []).includes(student._id)

                          return (
                            <Card
                              key={student._id}
                              className="rounded-card border-none shadow-1 transition-shadow duration-200 hover:shadow-md flex items-center justify-between p-3"
                              style={{
                                background: isPresent
                                  ? 'linear-gradient(135deg, rgba(219,234,254,0.8), rgba(191,219,254,0.4))'
                                  : isLate
                                  ? 'linear-gradient(135deg, rgba(220,252,231,0.8), rgba(187,247,208,0.4))'
                                  : isAbsent
                                  ? 'linear-gradient(135deg, rgba(254,226,226,0.8), rgba(254,202,202,0.4))'
                                  : 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,210,230,0.15) 50%, rgba(255,255,255,0.9) 100%)',
                              }}
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="font-medium text-sm text-foreground truncate">{getDisplayName(student.personalInfo)}</div>
                                <div className="text-[11px] text-muted-foreground">כיתה {student.academicInfo?.class}</div>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <button
                                  className={`p-1.5 rounded-full transition-all duration-200 ${isPresent ? 'bg-blue-100 text-blue-600 scale-110' : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50 hover:scale-110'}`}
                                  onClick={() => toggleAttendance(student._id, 'present')}
                                  title="נוכח"
                                >
                                  <CheckIcon className="w-4 h-4" weight={isPresent ? 'bold' : 'regular'} />
                                </button>
                                <button
                                  className={`p-1.5 rounded-full transition-all duration-200 ${isLate ? 'bg-green-100 text-green-600 scale-110' : 'text-muted-foreground hover:text-green-600 hover:bg-green-50 hover:scale-110'}`}
                                  onClick={() => toggleAttendance(student._id, 'late')}
                                  title="מאחר"
                                >
                                  <ClockIcon className="w-4 h-4" weight={isLate ? 'fill' : 'regular'} />
                                </button>
                                <button
                                  className={`p-1.5 rounded-full transition-all duration-200 ${isAbsent ? 'bg-red-100 text-red-600 scale-110' : 'text-muted-foreground hover:text-red-600 hover:bg-red-50 hover:scale-110'}`}
                                  onClick={() => toggleAttendance(student._id, 'absent')}
                                  title="נעדר"
                                >
                                  <XIcon className="w-4 h-4" weight={isAbsent ? 'bold' : 'regular'} />
                                </button>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">אין תלמידים רשומים לשיעור</p>
                      </div>
                    )}

                    {/* Save + stats footer */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <HeroButton
                        color="primary"
                        variant="solid"
                        onPress={handleSaveAttendance}
                        startContent={<CheckCircleIcon size={16} weight="fill" />}
                        className="font-medium"
                      >
                        שמור נוכחות
                      </HeroButton>
                      <div className="flex-1" />
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span className="text-muted-foreground">
                            נוכחים: {tempAttendance.present.length + (tempAttendance.late || []).length}
                            {(tempAttendance.late || []).length > 0 && (
                              <span className="text-amber-600"> ({(tempAttendance.late || []).length} מאחרים)</span>
                            )}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span className="text-muted-foreground">נעדרים: {tempAttendance.absent.length}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                          <span className="text-muted-foreground">לא סומן: {enrolledStudents.length - tempAttendance.present.length - tempAttendance.absent.length - (tempAttendance.late || []).length}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ── Tab 2: Analytics ── */}
                <TabsContent value="analytics">
                  <div className="pt-4">
                    {/* Summary stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
                      <GlassStatCard
                        size="sm"
                        value={categoryLessons.length}
                        label="שיעורים בקטגוריה"
                        className="!h-[80px] !p-2.5"
                      />
                      <GlassStatCard
                        size="sm"
                        value={enrolledStudents.length}
                        label="תלמידים רשומים"
                        className="!h-[80px] !p-2.5"
                      />
                      <GlassStatCard
                        size="sm"
                        value={`${studentAttendanceAnalytics.length > 0
                          ? Math.round(studentAttendanceAnalytics.reduce((sum, s) => sum + (s.rate ?? 0), 0) / (studentAttendanceAnalytics.filter(s => s.rate !== null).length || 1))
                          : 0}%`}
                        label="ממוצע נוכחות"
                        className="!h-[80px] !p-2.5"
                        valueClassName={
                          (() => {
                            const avg = studentAttendanceAnalytics.length > 0
                              ? studentAttendanceAnalytics.reduce((sum, s) => sum + (s.rate ?? 0), 0) / (studentAttendanceAnalytics.filter(s => s.rate !== null).length || 1)
                              : 0
                            return avg >= 75 ? 'text-green-700' : avg >= 50 ? 'text-orange-600' : 'text-red-600'
                          })()
                        }
                      />
                      <GlassStatCard
                        size="sm"
                        value={studentAttendanceAnalytics.filter(s => s.rate !== null && s.rate < 75).length}
                        label="תלמידים מתחת ל-75%"
                        className="!h-[80px] !p-2.5"
                        valueClassName="text-red-600"
                      />
                    </div>

                    {/* Per-student table */}
                    {studentAttendanceAnalytics.length > 0 ? (
                      <Card className="overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50 border-b border-border">
                              <th className="text-right py-2.5 px-3 text-xs font-bold text-muted-foreground">תלמיד</th>
                              <th className="text-right py-2.5 px-3 text-xs font-bold text-muted-foreground">כיתה</th>
                              <th className="text-right py-2.5 px-3 text-xs font-bold text-muted-foreground">כלי</th>
                              <th className="text-center py-2.5 px-3 text-xs font-bold text-muted-foreground">שיעורים</th>
                              <th className="text-center py-2.5 px-3 text-xs font-bold text-muted-foreground">נוכח</th>
                              <th className="text-center py-2.5 px-3 text-xs font-bold text-muted-foreground">מאחר</th>
                              <th className="text-center py-2.5 px-3 text-xs font-bold text-muted-foreground">נעדר</th>
                              <th className="text-center py-2.5 px-3 text-xs font-bold text-muted-foreground">אחוז נוכחות</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentAttendanceAnalytics.map((row) => (
                              <tr
                                key={row.studentId}
                                className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => handleViewStudentProfile(row.studentId)}
                              >
                                <td className="py-2.5 px-3 font-medium text-foreground">{row.name}</td>
                                <td className="py-2.5 px-3 text-muted-foreground text-xs">{row.class}</td>
                                <td className="py-2.5 px-3 text-muted-foreground text-xs">{row.instrument}</td>
                                <td className="py-2.5 px-3 text-center text-muted-foreground">{row.totalSessions}</td>
                                <td className="py-2.5 px-3 text-center text-green-700 font-medium">{row.presentCount}</td>
                                <td className="py-2.5 px-3 text-center text-yellow-600 font-medium">{row.lateCount}</td>
                                <td className="py-2.5 px-3 text-center text-red-600 font-medium">{row.absentCount}</td>
                                <td className="py-2.5 px-3 text-center">
                                  {row.rate !== null ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all ${
                                            row.rate >= 75 ? 'bg-green-500' : row.rate >= 50 ? 'bg-orange-400' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${row.rate}%` }}
                                        />
                                      </div>
                                      <span className={`text-xs font-bold ${
                                        row.rate >= 75 ? 'text-green-700' : row.rate >= 50 ? 'text-orange-600' : 'text-red-600'
                                      }`}>
                                        {row.rate}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Card>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <ChartBarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">אין נתוני נוכחות להצגה</p>
                        <p className="text-xs mt-1">רשום נוכחות בלשונית ״רישום נוכחות״ כדי לראות סטטיסטיקות</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </TabsContents>
            </Tabs>
          </div>
        </Card>
      </div>

      {/* Theory Lesson Edit Form Modal */}
      {showEditForm && (
        <TheoryLessonForm
          theoryLesson={theoryLesson}
          teachers={teachers}
          onSubmit={handleEditTheoryLesson}
          onCancel={() => setShowEditForm(false)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmationConfig && (
        <ConfirmationModal
          isOpen={showConfirmation}
          title={confirmationConfig.title}
          message={confirmationConfig.message}
          onConfirm={handleConfirmation}
          onCancel={handleCancelConfirmation}
          variant={confirmationConfig.variant}
        />
      )}
    </div>
  )
}
