/**
 * Student Details Page - Optimized Version
 *
 * Uses React.memo, useMemo, and performance optimizations
 * to minimize re-renders and improve performance
 */

import React, { useState, useMemo, memo, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'

import { TabType } from '../types'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import PersonalInfoTab from './tabs/PersonalInfoTabSimple'
import AcademicInfoTab from './tabs/AcademicInfoTabSimple'
import ScheduleTab from './tabs/ScheduleTab'
import OrchestraTab from './tabs/OrchestraTab'
import TheoryTabOptimized from './tabs/TheoryTabOptimized'
import { useStudent } from '../../../../services/apiCache'
import { getDisplayName, getInitials } from '../../../../utils/nameUtils'
import {
import { ArrowRightIcon, ArrowsClockwiseIcon, BookOpenIcon, CalendarIcon, CheckCircleIcon, FileTextIcon, GraduationCapIcon, MusicNotesIcon, UserIcon } from '@phosphor-icons/react'
  SkeletonComponents,
  usePerformanceOptimizations
} from '../../../../services/performanceOptimizations'

// Placeholder tabs not yet implemented
const AttendanceTab = ({ student }: { student: any }) => (
  <div className="p-6 text-center text-gray-500">
    <div className="text-4xl mb-4">✅</div>
    <div>נוכחות - בפיתוח</div>
  </div>
)

const DocumentsTab = ({ student }: { student: any }) => (
  <div className="p-6 text-center text-gray-500">
    <div className="text-4xl mb-4">📄</div>
    <div>מסמכים - בפיתוח</div>
  </div>
)

// Memoized header component to prevent unnecessary re-renders
const StudentHeader = memo(({ student }: { student: any }) => {
  const displayName = useMemo(() =>
    getDisplayName(student?.personalInfo) || 'שם לא זמין',
    [student?.personalInfo?.firstName, student?.personalInfo?.lastName, student?.personalInfo?.fullName]
  )

  const initials = useMemo(() =>
    getInitials(student?.personalInfo) || '?',
    [student?.personalInfo?.firstName, student?.personalInfo?.lastName, student?.personalInfo?.fullName]
  )

  const statusBadge = useMemo(() => {
    const isActive = student?.isActive
    return {
      className: isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
      text: isActive ? 'פעיל' : 'לא פעיל'
    }
  }, [student?.isActive])

  return (
    <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">
            {initials}
          </span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {displayName}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
              {statusBadge.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

StudentHeader.displayName = 'StudentHeader'

// Memoized breadcrumb component
const Breadcrumb = memo(({ onNavigateBack }: { onNavigateBack: () => void }) => (
  <nav className="flex items-center gap-2 text-sm text-gray-600">
    <button
      onClick={onNavigateBack}
      className="hover:text-primary transition-colors"
    >
      תלמידים
    </button>
    <ArrowRightIcon className="w-4 h-4 rotate-180" />
    <span className="text-gray-900 font-medium">פרטי תלמיד</span>
  </nav>
))

Breadcrumb.displayName = 'Breadcrumb'

// Memoized error component
const ErrorState = memo(({
  error,
  onRetry
}: {
  error: string
  onRetry: () => void
}) => (
  <div className="flex flex-col items-center justify-center min-h-96 text-center">
    <div className="text-6xl mb-4">❌</div>
    <h1 className="text-2xl font-bold text-red-600 mb-2">שגיאה בטעינת הנתונים</h1>
    <p className="text-gray-600 mb-6">{error}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
    >
      <ArrowsClockwiseIcon className="w-4 h-4" />
      נסה שוב
    </button>
  </div>
))

ErrorState.displayName = 'ErrorState'

// Memoized not found component
const NotFoundState = memo(({ onNavigateBack }: { onNavigateBack: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-96 text-center">
    <div className="text-6xl mb-4">🔍</div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">תלמיד לא נמצא</h1>
    <p className="text-gray-600 mb-6">לא נמצאו פרטים עבור התלמיד המבוקש</p>
    <button
      onClick={onNavigateBack}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
    >
      <ArrowRightIcon className="w-4 h-4" />
      חזור לרשימת התלמידים
    </button>
  </div>
))

NotFoundState.displayName = 'NotFoundState'

const StudentDetailsPageOptimized: React.FC = () => {
  console.log('🔍 StudentDetailsPageOptimized component loading...')

  // Performance monitoring
  const { monitoring } = usePerformanceOptimizations({
    componentName: 'StudentDetailsPageOptimized',
    enablePerformanceMonitoring: true
  })

  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('personal')

  // Use cached data hook
  const { data: student, isLoading, error, refetch } = useStudent(studentId)

  // Memoized computed values
  const isValidStudentId = useMemo(() =>
    !!studentId && studentId.trim() !== '',
    [studentId]
  )

  // Memoized handlers
  const handleNavigateBack = useCallback(() => {
    navigate('/students')
  }, [navigate])

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
  }, [])

  const handleStudentUpdate = useCallback((updatedStudent: any) => {
    // Optimistic update would be handled by React Query automatically
    console.log('Student updated:', updatedStudent)
  }, [])

  // Early return for invalid student ID
  if (!isValidStudentId) {
    return <Navigate to="/students" replace />
  }

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonComponents.StudentHeader />
        <div className="h-12 bg-gray-200 rounded animate-pulse w-96"></div>
        <SkeletonComponents.TabContent />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        error={(error as Error).message || 'Failed to load student data'}
        onRetry={handleRetry}
      />
    )
  }

  // No student found state
  if (!student) {
    return <NotFoundState onNavigateBack={handleNavigateBack} />
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb onNavigateBack={handleNavigateBack} />

      {/* Student Header */}
      <StudentHeader student={student} />

      {/* Tab Navigation and Content — shadcn Tabs */}
      <div className="bg-white rounded border border-border w-full overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabType)} className="w-full">
          <TabsList className="sticky top-0 z-10 w-full justify-start rounded-none border-b bg-white h-auto px-6 overflow-x-auto scrollbar-hide">
            <TabsTrigger value="personal" className="gap-2 inline-flex items-center whitespace-nowrap">
              <UserIcon className="h-4 w-4" />
              פרטים אישיים
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-2 inline-flex items-center whitespace-nowrap">
              <GraduationCapIcon className="h-4 w-4" />
              מידע אקדמי
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2 inline-flex items-center whitespace-nowrap">
              <CalendarIcon className="h-4 w-4" />
              לוח זמנים
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2 inline-flex items-center whitespace-nowrap">
              <CheckCircleIcon className="h-4 w-4" />
              נוכחות
            </TabsTrigger>
            <TabsTrigger value="orchestra" className="gap-2 inline-flex items-center whitespace-nowrap">
              <MusicNotesIcon className="h-4 w-4" />
              תזמורות
            </TabsTrigger>
            <TabsTrigger value="theory" className="gap-2 inline-flex items-center whitespace-nowrap">
              <BookOpenIcon className="h-4 w-4" />
              תאוריה
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2 inline-flex items-center whitespace-nowrap">
              <FileTextIcon className="h-4 w-4" />
              מסמכים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0">
            <PersonalInfoTab
              student={student}
              studentId={studentId!}
              onStudentUpdate={handleStudentUpdate}
            />
          </TabsContent>
          <TabsContent value="academic" className="mt-0">
            <AcademicInfoTab
              student={student}
              studentId={studentId!}
              onStudentUpdate={handleStudentUpdate}
            />
          </TabsContent>
          <TabsContent value="schedule" className="mt-0">
            <ScheduleTab
              student={student}
              studentId={studentId!}
              isLoading={false}
            />
          </TabsContent>
          <TabsContent value="attendance" className="mt-0">
            <AttendanceTab student={student} />
          </TabsContent>
          <TabsContent value="orchestra" className="mt-0">
            <OrchestraTab
              student={student}
              studentId={studentId!}
              isLoading={false}
            />
          </TabsContent>
          <TabsContent value="theory" className="mt-0">
            <TheoryTabOptimized
              student={student}
              studentId={studentId!}
            />
          </TabsContent>
          <TabsContent value="documents" className="mt-0">
            <DocumentsTab student={student} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Performance monitoring in dev mode */}
      {process.env.NODE_ENV === 'development' && monitoring && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          Renders: {monitoring.renderCount}
        </div>
      )}
    </div>
  )
}

export default memo(StudentDetailsPageOptimized)
