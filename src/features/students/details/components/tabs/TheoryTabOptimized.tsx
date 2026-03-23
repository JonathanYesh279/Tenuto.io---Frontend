/**
 * Theory Tab Component - Optimized Version
 *
 * Uses caching, request deduplication, and performance optimizations
 * to eliminate redundant API calls and improve loading performance.
 */

import React, { useState, useMemo, memo } from 'react'
import { Chip, Button, Tabs, Tab } from '@heroui/react'
import { motion, AnimatePresence } from 'framer-motion'

import TeacherNameDisplay from '../../../../../components/TeacherNameDisplay'
import { ArrowsClockwiseIcon, BookOpenIcon, CalendarBlankIcon, CalendarIcon, CheckCircleIcon, ClockIcon, GraduationCapIcon, InfoIcon, MapPinIcon, MedalIcon, MusicNotesIcon, PlusIcon, TrashIcon, TrendUpIcon, UserIcon, UsersIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'
import { DAY_OF_WEEK_NAMES } from '../../../../../utils/theoryLessonUtils'
import {
  useStudent,
  useStudentTheoryLessons,
  useAvailableTheoryLessons,
  useTheoryLessonEnrollment,
  useTheoryLessons
} from '../../../../../services/apiCache'
import { SmartLoadingState, SkeletonComponents } from '../../../../../services/performanceOptimizations'

interface TheoryTabProps {
  student: any
  studentId: string
  isLoading?: boolean
}

const getLevelChipColor = (level: string): 'success' | 'warning' | 'danger' | 'primary' => {
  switch (level?.toLowerCase()) {
    case 'beginner': case 'מתחילים': return 'success'
    case 'intermediate': case 'בינוני': return 'warning'
    case 'advanced': case 'מתקדמים': return 'danger'
    default: return 'primary'
  }
}

const categoryChipStyle: Record<string, string> = {
  'תלמידים חדשים ב-ד': 'bg-blue-100 text-blue-700 border-blue-200',
  'תלמידים חדשים צעירים': 'bg-sky-100 text-sky-700 border-sky-200',
  'תלמידים חדשים בוגרים (ה - ט)': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'מתחילים': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'מתחילים ב': 'bg-green-100 text-green-700 border-green-200',
  'מתחילים ד': 'bg-teal-100 text-teal-700 border-teal-200',
  'מתקדמים א': 'bg-amber-100 text-amber-700 border-amber-200',
  'מתקדמים ב': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'מתקדמים ג': 'bg-orange-100 text-orange-700 border-orange-200',
  'הכנה לרסיטל קלאסי יא': 'bg-rose-100 text-rose-700 border-rose-200',
  "הכנה לרסיטל רוק\\פופ\\ג'אז יא": 'bg-red-100 text-red-700 border-red-200',
  "הכנה לרסיטל רוק\\פופ\\ג'אז יב": 'bg-pink-100 text-pink-700 border-pink-200',
  'מגמה': 'bg-violet-100 text-violet-700 border-violet-200',
  'תאוריה כלי': 'bg-cyan-100 text-cyan-700 border-cyan-200',
}

const defaultCategoryStyle = 'bg-neutral-100 text-neutral-700 border-neutral-200'

// Memoized lesson card component to prevent unnecessary re-renders
const LessonCard = memo(({
  lesson,
  isEnrolled = false,
  onEnroll,
  onUnenroll,
  isEnrolling = false,
  isUnenrolling = false,
  studentGrade,
  canEnroll = true
}: {
  lesson: any
  isEnrolled?: boolean
  onEnroll?: () => void
  onUnenroll?: () => void
  isEnrolling?: boolean
  isUnenrolling?: boolean
  studentGrade?: string
  canEnroll?: boolean
}) => {
  const categoryIcon = useMemo(() => {
    switch (lesson.category?.toLowerCase()) {
      case 'harmony':
      case 'הרמוניה':
        return <MusicNotesIcon className="w-4 h-4" />
      case 'theory':
      case 'תיאוריה':
        return <BookOpenIcon className="w-4 h-4" />
      case 'composition':
      case 'קומפוזיציה':
        return <GraduationCapIcon className="w-4 h-4" />
      default:
        return <BookOpenIcon className="w-4 h-4" />
    }
  }, [lesson.category])

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  // Teacher name will be handled by TeacherNameDisplay component

  const studentsProgress = useMemo(() => {
    if (!lesson.maxStudents) return null
    const current = lesson.studentIds?.length || 0
    const percentage = (current / lesson.maxStudents) * 100
    return { current, total: lesson.maxStudents, percentage }
  }, [lesson.maxStudents, lesson.studentIds])

  return (
    <div className="relative h-full pt-3">
      {/* Floating category chip */}
      {lesson.category && (
        <span className={`absolute top-0 right-4 z-10 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${categoryChipStyle[lesson.category] || defaultCategoryStyle}`}>
          {lesson.category}
        </span>
      )}

      <motion.div
        className="bg-card rounded-card border border-border h-full flex flex-col shadow-sm hover:shadow-md hover:border-primary transition-all"
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Header: action buttons */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {lesson.dayOfWeek != null && DAY_OF_WEEK_NAMES[lesson.dayOfWeek] && (
              <Chip
                size="sm"
                variant="flat"
                color="secondary"
                startContent={<CalendarBlankIcon className="w-3 h-3" />}
              >
                יום {DAY_OF_WEEK_NAMES[lesson.dayOfWeek]}
              </Chip>
            )}
            {lesson.level && (
              <Chip color={getLevelChipColor(lesson.level)} variant="flat" size="sm">
                {lesson.level}
              </Chip>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isEnrolled ? (
              <>
                <Chip color="success" variant="flat" size="sm" startContent={<CheckCircleIcon className="w-3 h-3" />}>
                  רשום
                </Chip>
                <Button
                  isIconOnly
                  onPress={onUnenroll}
                  isDisabled={isUnenrolling}
                  color="danger"
                  variant="light"
                  size="sm"
                  title="בטל הרשמה"
                >
                  {isUnenrolling ? (
                    <ArrowsClockwiseIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                </Button>
              </>
            ) : (
              <Button
                onPress={onEnroll}
                isDisabled={!canEnroll || isEnrolling}
                isLoading={isEnrolling}
                color="primary"
                variant="solid"
                size="sm"
                startContent={!isEnrolling ? <PlusIcon className="w-4 h-4" /> : undefined}
              >
                {isEnrolling ? 'נרשם...' : 'הרשם'}
              </Button>
            )}
          </div>
        </div>

        {/* Body: Teacher + Location */}
        <div className="px-4 pb-2 space-y-1.5 flex-1">
          <TeacherNameDisplay
            lesson={lesson}
            className="text-sm text-muted-foreground"
            showIcon={true}
          />
          {lesson.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPinIcon className="w-4 h-4 shrink-0" />
              <span>{lesson.location}</span>
            </div>
          )}
          {lesson.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{lesson.description}</p>
          )}
        </div>

        {/* Warnings (compact) */}
        {!isEnrolled && (lesson.isFull || !lesson.gradeCompatible || !lesson.levelCompatible) && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {lesson.isFull && (
              <Chip size="sm" variant="flat" color="warning" startContent={<WarningCircleIcon className="w-3 h-3" />}>
                השיעור מלא
              </Chip>
            )}
            {!lesson.gradeCompatible && (
              <Chip size="sm" variant="flat" color="danger" startContent={<WarningCircleIcon className="w-3 h-3" />}>
                לא מתאים לכיתה
              </Chip>
            )}
            {!lesson.levelCompatible && (
              <Chip size="sm" variant="flat" color="warning" startContent={<WarningCircleIcon className="w-3 h-3" />}>
                רמה לא מתאימה
              </Chip>
            )}
          </div>
        )}

        {/* Students progress (compact) */}
        {studentsProgress && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <UsersIcon className="w-3.5 h-3.5" />
              <span>{studentsProgress.current} / {studentsProgress.total} תלמידים</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${studentsProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer: Date + Time */}
        <div className="px-4 py-2.5 border-t border-border mt-auto">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {(lesson.date || lesson.startTime) && (
              <span className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 shrink-0" />
                <span>
                  {lesson.date && new Date(lesson.date).toLocaleDateString('he-IL')}
                  {lesson.startTime && lesson.endTime && (
                    <>
                      {lesson.date ? ' • ' : ''}
                      {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                    </>
                  )}
                </span>
              </span>
            )}
            {lesson.targetGrades && lesson.targetGrades.length > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <InfoIcon className="w-3.5 h-3.5" />
                כיתות: {lesson.targetGrades.join(', ')}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
})

LessonCard.displayName = 'LessonCard'

// Memoized empty state component
const EmptyState = memo(({
  icon,
  title,
  description,
  actionLabel,
  onAction
}: {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-muted-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6">{description}</p>
    {actionLabel && onAction && (
      <Button
        onPress={onAction}
        color="primary"
        variant="solid"
        size="sm"
      >
        {actionLabel}
      </Button>
    )}
  </div>
))

EmptyState.displayName = 'EmptyState'

const TheoryTabOptimized: React.FC<TheoryTabProps> = ({ student, studentId }) => {
  const [activeView, setActiveView] = useState<'current' | 'manage'>('current')
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null)

  // Use cached data hooks
  const { data: studentData, isLoading: studentLoading, error: studentError } = useStudent(studentId)
  const { data: allTheoryLessons, isLoading: theoryLessonsLoading } = useTheoryLessons()

  // Get student's grade and level with memoization
  const studentGrade = useMemo(() => student?.academicInfo?.class || studentData?.academicInfo?.class || 'ז', [student, studentData])
  const studentLevel = useMemo(() => student?.theoryLevel || studentData?.theoryLevel || 'beginner', [student, studentData])

  // Get enrolled and available lessons using cached hooks
  const enrolledLessons = useStudentTheoryLessons(studentId)
  const availableLessons = useAvailableTheoryLessons(studentId, studentGrade, studentLevel)

  // Use optimistic mutation hook
  const { enroll, unenroll, isEnrolling, isUnenrolling, enrollingLessonId, unenrollingLessonId, error: mutationError } = useTheoryLessonEnrollment(studentId)

  // Memoized handlers
  const handleEnrollment = useMemo(() => (lessonId: string) => {
    enroll({ lessonId })
  }, [enroll])

  const handleUnenrollment = useMemo(() => (lessonId: string) => {
    unenroll({ lessonId })
    setShowConfirmDialog(null)
  }, [unenroll])

  // Loading state
  const isLoading = studentLoading || theoryLessonsLoading
  const hasError = studentError || mutationError

  if (isLoading) {
    return (
      <SmartLoadingState
        isLoading={true}
        skeleton={<SkeletonComponents.TabContent />}
        minHeight="400px"
      >
        <div />
      </SmartLoadingState>
    )
  }

  if (hasError) {
    return (
      <div className="p-6 text-center">
        <div className="text-danger text-lg mb-2">⚠️ שגיאה בטעינת הנתונים</div>
        <div className="text-muted-foreground mb-4 text-sm">
          {(studentError as Error)?.message || (mutationError as Error)?.message || 'אירעה שגיאה לא צפויה'}
        </div>
        <Button
          onPress={() => window.location.reload()}
          color="primary"
          variant="solid"
          size="sm"
        >
          נסה שוב
        </Button>
      </div>
    )
  }

  const renderCurrentEnrollments = () => {
    if (enrolledLessons.length === 0) {
      return (
        <EmptyState
          icon={<BookOpenIcon className="w-8 h-8 text-muted-foreground" />}
          title="אין שיעורי תיאוריה רשומים"
          description="התלמיד אינו רשום כרגע לשיעורי תיאוריה"
          actionLabel="צפה בשיעורים זמינים"
          onAction={() => setActiveView('manage')}
        />
      )
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpenIcon className="w-5 h-5 text-primary" />
          שיעורי תיאוריה רשומים ({enrolledLessons.length})
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {enrolledLessons.map((lesson, index) => (
            <motion.div
              key={lesson._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <LessonCard
                lesson={lesson}
                isEnrolled={true}
                onUnenroll={() => setShowConfirmDialog(lesson._id)}
                isUnenrolling={unenrollingLessonId === lesson._id}
                studentGrade={studentGrade}
              />
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  const renderManagementView = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <PlusIcon className="w-5 h-5 text-success" />
          שיעורי תיאוריה זמינים להרשמה
        </h3>

        {availableLessons.length === 0 ? (
          <EmptyState
            icon={<BookOpenIcon className="w-8 h-8 text-muted-foreground" />}
            title="אין שיעורים זמינים"
            description="כל השיעורים המתאימים מלאים או שכבר נרשמת אליהם"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {availableLessons.map((lesson, index) => (
              <motion.div
                key={lesson._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <LessonCard
                  lesson={lesson}
                  isEnrolled={false}
                  onEnroll={() => handleEnrollment(lesson._id)}
                  isEnrolling={enrollingLessonId === lesson._id}
                  studentGrade={studentGrade}
                  canEnroll={lesson.isCompatible}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">שיעורי תיאוריה</h2>
        </div>

        {/* View Toggle */}
        <Tabs
          selectedKey={activeView}
          onSelectionChange={(key) => setActiveView(key as 'current' | 'manage')}
          size="sm"
          variant="solid"
        >
          <Tab
            key="current"
            title={
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4" />
                שיעורים רשומים ({enrolledLessons.length})
              </div>
            }
          />
          <Tab
            key="manage"
            title={
              <div className="flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                הרשמה חדשה ({availableLessons.length})
              </div>
            }
          />
        </Tabs>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'current' ? renderCurrentEnrollments() : renderManagementView()}
        </motion.div>
      </AnimatePresence>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-card p-6 max-w-md w-full mx-4 shadow-1">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              בטל הרשמה לשיעור תיאוריה
            </h3>
            <p className="text-muted-foreground mb-6">
              האם אתה בטוח שברצונך לבטל את ההרשמה לשיעור זה?
              פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onPress={() => setShowConfirmDialog(null)}
                variant="flat"
                size="sm"
              >
                ביטול
              </Button>
              <Button
                onPress={() => handleUnenrollment(showConfirmDialog)}
                isDisabled={unenrollingLessonId === showConfirmDialog}
                isLoading={unenrollingLessonId === showConfirmDialog}
                color="danger"
                variant="solid"
                size="sm"
              >
                {unenrollingLessonId === showConfirmDialog ? 'מבטל...' : 'בטל הרשמה'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(TheoryTabOptimized)
