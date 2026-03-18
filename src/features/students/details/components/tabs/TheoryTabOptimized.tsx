/**
 * Theory Tab Component - Optimized Version
 *
 * Uses caching, request deduplication, and performance optimizations
 * to eliminate redundant API calls and improve loading performance.
 */

import React, { useState, useMemo, memo } from 'react'
import { Chip, Button, Tabs, Tab } from '@heroui/react'
import { motion } from 'framer-motion'

import TeacherNameDisplay from '../../../../../components/TeacherNameDisplay'
import { ArrowsClockwiseIcon, BookOpenIcon, CalendarIcon, CheckCircleIcon, ClockIcon, GraduationCapIcon, InfoIcon, MapPinIcon, MedalIcon, MusicNotesIcon, PlusIcon, TrashIcon, TrendUpIcon, UserIcon, UsersIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'
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
    <motion.div
      className="bg-card rounded-card border border-border p-6 shadow-1"
      whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {categoryIcon}
            <h4 className="text-xl font-semibold text-foreground">
              {lesson.title || lesson.name || 'שיעור תיאוריה'}
            </h4>
          </div>

          {lesson.category && (
            <span className="text-sm text-muted-foreground">קטגוריה: {lesson.category}</span>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {lesson.level && (
              <Chip color={getLevelChipColor(lesson.level)} variant="flat" size="sm">
                {lesson.level}
              </Chip>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEnrolled ? (
            <>
              <span className="inline-flex items-center px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                רשום
              </span>
              <Button
                isIconOnly
                onPress={onUnenroll}
                isDisabled={isUnenrolling}
                color="danger"
                variant="flat"
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

      {/* Teacher info */}
      <TeacherNameDisplay
        lesson={lesson}
        className="mb-3"
        showIcon={true}
      />

      {/* Schedule */}
      {(lesson.date || lesson.startTime) && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon className="w-4 h-4" />
            <span className="text-sm">
              {lesson.date && new Date(lesson.date).toLocaleDateString('he-IL')}
              {lesson.startTime && lesson.endTime && (
                <>
                  {lesson.date ? ' • ' : ''}
                  {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Location */}
      {lesson.location && (
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <MapPinIcon className="w-4 h-4" />
          <span className="text-sm">{lesson.location}</span>
        </div>
      )}

      {/* Students count with progress bar */}
      {studentsProgress && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <UsersIcon className="w-4 h-4" />
            <span className="text-sm">
              {studentsProgress.current} / {studentsProgress.total} תלמידים
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${studentsProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Warning messages for non-enrolled lessons */}
      {!isEnrolled && (
        <>
          {lesson.isFull && (
            <div className="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-card">
              <div className="flex items-center gap-2 text-warning">
                <WarningCircleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">השיעור מלא</span>
              </div>
            </div>
          )}

          {!lesson.gradeCompatible && (
            <div className="mb-3 p-3 bg-danger/10 border border-danger/20 rounded-card">
              <div className="flex items-center gap-2 text-danger">
                <WarningCircleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">לא מתאים לכיתה</span>
              </div>
            </div>
          )}

          {!lesson.levelCompatible && (
            <div className="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-card">
              <div className="flex items-center gap-2 text-warning">
                <WarningCircleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">רמה לא מתאימה</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Description */}
      {lesson.description && (
        <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
          {lesson.description}
        </p>
      )}

      {/* Target grades */}
      {lesson.targetGrades && lesson.targetGrades.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <InfoIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              מיועד לכיתות: {lesson.targetGrades.join(', ')}
            </span>
          </div>
        </div>
      )}
    </motion.div>
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
  const { enroll, unenroll, isEnrolling, isUnenrolling, error: mutationError } = useTheoryLessonEnrollment(studentId)

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                isUnenrolling={isUnenrolling}
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <PlusIcon className="w-5 h-5 text-success" />
            שיעורי תיאוריה זמינים להרשמה
          </h3>
          <div className="text-sm text-muted-foreground">
            כיתה: {studentGrade} • רמה: {studentLevel}
          </div>
        </div>

        {availableLessons.length === 0 ? (
          <EmptyState
            icon={<BookOpenIcon className="w-8 h-8 text-muted-foreground" />}
            title="אין שיעורים זמינים"
            description="כל השיעורים המתאימים מלאים או שכבר נרשמת אליהם"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  isEnrolling={isEnrolling}
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
      {activeView === 'current' ? renderCurrentEnrollments() : renderManagementView()}

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
                isDisabled={isUnenrolling}
                isLoading={isUnenrolling}
                color="danger"
                variant="solid"
                size="sm"
                startContent={!isUnenrolling ? undefined : undefined}
              >
                {isUnenrolling ? 'מבטל...' : 'בטל הרשמה'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(TheoryTabOptimized)
