/**
 * Theory Tab Component - Optimized Version
 * 
 * Uses caching, request deduplication, and performance optimizations
 * to eliminate redundant API calls and improve loading performance.
 */

import React, { useState, useMemo, memo } from 'react'
import {
  BookOpen, Calendar, TrendingUp, Award, Clock, User, Plus,
  Trash2, AlertCircle, MapPin, CheckCircle, X, Music,
  GraduationCap, Users, Info, RefreshCw
} from 'lucide-react'
import TeacherNameDisplay from '../../../../../components/TeacherNameDisplay'
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
  // Memoized computed values
  const levelColor = useMemo(() => {
    switch (lesson.level?.toLowerCase()) {
      case 'beginner':
      case 'מתחילים':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
      case 'בינוני':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
      case 'מתקדמים':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }, [lesson.level])

  const categoryIcon = useMemo(() => {
    switch (lesson.category?.toLowerCase()) {
      case 'harmony':
      case 'הרמוניה':
        return <Music className="w-4 h-4" />
      case 'theory':
      case 'תיאוריה':
        return <BookOpen className="w-4 h-4" />
      case 'composition':
      case 'קומפוזיציה':
        return <GraduationCap className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
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
    <div className="bg-white rounded border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {categoryIcon}
            <h4 className="text-xl font-semibold text-gray-900">
              {lesson.title || lesson.name || 'שיעור תיאוריה'}
            </h4>
          </div>
          
          {lesson.category && (
            <span className="text-sm text-gray-600">קטגוריה: {lesson.category}</span>
          )}
          
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {lesson.level && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColor}`}>
                {lesson.level}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEnrolled ? (
            <>
              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <CheckCircle className="w-3 h-3 mr-1" />
                רשום
              </span>
              <button
                onClick={onUnenroll}
                disabled={isUnenrolling}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="בטל הרשמה"
              >
                {isUnenrolling ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onEnroll}
              disabled={!canEnroll || isEnrolling}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                canEnroll
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isEnrolling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  נרשם...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  הרשם
                </>
              )}
            </button>
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
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
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
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{lesson.location}</span>
        </div>
      )}

      {/* Students count with progress bar */}
      {studentsProgress && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {studentsProgress.current} / {studentsProgress.total} תלמידים
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${studentsProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Warning messages for non-enrolled lessons */}
      {!isEnrolled && (
        <>
          {lesson.isFull && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">השיעור מלא</span>
              </div>
            </div>
          )}
          
          {!lesson.gradeCompatible && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">לא מתאים לכיתה</span>
              </div>
            </div>
          )}

          {!lesson.levelCompatible && (
            <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">רמה לא מתאימה</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Description */}
      {lesson.description && (
        <p className="text-sm text-gray-600 mt-3 pt-3 border-t">
          {lesson.description}
        </p>
      )}

      {/* Target grades */}
      {lesson.targetGrades && lesson.targetGrades.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">
              מיועד לכיתות: {lesson.targetGrades.join(', ')}
            </span>
          </div>
        </div>
      )}
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
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-gray-600 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
      >
        {actionLabel}
      </button>
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
        <div className="text-red-600 text-lg mb-2">⚠️ שגיאה בטעינת הנתונים</div>
        <div className="text-gray-600 mb-4 text-sm">
          {(studentError as Error)?.message || (mutationError as Error)?.message || 'אירעה שגיאה לא צפויה'}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-neutral-800 transition-colors text-sm"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  const renderCurrentEnrollments = () => {
    if (enrolledLessons.length === 0) {
      return (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-gray-300" />}
          title="אין שיעורי תיאוריה רשומים"
          description="התלמיד אינו רשום כרגע לשיעורי תיאוריה"
          actionLabel="צפה בשיעורים זמינים"
          onAction={() => setActiveView('manage')}
        />
      )
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          שיעורי תיאוריה רשומים ({enrolledLessons.length})
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {enrolledLessons.map((lesson) => (
            <LessonCard
              key={lesson._id}
              lesson={lesson}
              isEnrolled={true}
              onUnenroll={() => setShowConfirmDialog(lesson._id)}
              isUnenrolling={isUnenrolling}
              studentGrade={studentGrade}
            />
          ))}
        </div>
      </div>
    )
  }

  const renderManagementView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            שיעורי תיאוריה זמינים להרשמה
          </h3>
          <div className="text-sm text-gray-600">
            כיתה: {studentGrade} • רמה: {studentLevel}
          </div>
        </div>

        {availableLessons.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-8 h-8 text-gray-300" />}
            title="אין שיעורים זמינים"
            description="כל השיעורים המתאימים מלאים או שכבר נרשמת אליהם"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableLessons.map((lesson) => (
              <LessonCard
                key={lesson._id}
                lesson={lesson}
                isEnrolled={false}
                onEnroll={() => handleEnrollment(lesson._id)}
                isEnrolling={isEnrolling}
                studentGrade={studentGrade}
                canEnroll={lesson.isCompatible}
              />
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
          <h2 className="text-2xl font-bold text-gray-900">שיעורי תיאוריה</h2>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('current')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'current'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              שיעורים רשומים ({enrolledLessons.length})
            </div>
          </button>
          <button
            onClick={() => setActiveView('manage')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'manage'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              הרשמה חדשה ({availableLessons.length})
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'current' ? renderCurrentEnrollments() : renderManagementView()}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              בטל הרשמה לשיעור תיאוריה
            </h3>
            <p className="text-gray-600 mb-6">
              האם אתה בטוח שברצונך לבטל את ההרשמה לשיעור זה? 
              פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={() => handleUnenrollment(showConfirmDialog)}
                disabled={isUnenrolling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isUnenrolling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    מבטל...
                  </>
                ) : (
                  'בטל הרשמה'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(TheoryTabOptimized)