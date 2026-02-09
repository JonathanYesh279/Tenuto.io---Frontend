/**
 * Student Details Page - Optimized Version
 * 
 * Uses React.memo, useMemo, and performance optimizations
 * to minimize re-renders and improve performance
 */

import React, { useState, useMemo, memo, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { TabType, TabConfig } from '../types'
import StudentTabNavigation from './StudentTabNavigation'
import StudentTabContent from './StudentTabContent'
import { useStudent } from '../../../../services/apiCache'
import { 
  SmartLoadingState, 
  SkeletonComponents,
  usePerformanceOptimizations 
} from '../../../../services/performanceOptimizations'

// Memoized header component to prevent unnecessary re-renders
const StudentHeader = memo(({ student }: { student: any }) => {
  const displayName = useMemo(() => 
    student?.personalInfo?.fullName || 'שם לא זמין', 
    [student?.personalInfo?.fullName]
  )
  
  const initials = useMemo(() => 
    displayName.charAt(0) || '?', 
    [displayName]
  )
  
  const statusBadge = useMemo(() => {
    const isActive = student?.isActive
    return {
      className: isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
      text: isActive ? 'פעיל' : 'לא פעיל'
    }
  }, [student?.isActive])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-primary-600">
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
      className="hover:text-primary-600 transition-colors"
    >
      תלמידים
    </button>
    <ArrowRight className="w-4 h-4 rotate-180" />
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
      className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
    >
      <RefreshCw className="w-4 h-4" />
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
      className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
    >
      <ArrowRight className="w-4 h-4" />
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

  const tabs: TabConfig[] = useMemo(() => [
    { id: 'personal', label: 'פרטים אישיים', component: () => null },
    { id: 'academic', label: 'מידע אקדמי', component: () => null },
    { id: 'schedule', label: 'לוח זמנים', component: () => null },
    { id: 'attendance', label: 'נוכחות', component: () => null },
    { id: 'orchestra', label: 'תזמורות', component: () => null },
    { id: 'theory', label: 'תאוריה', component: () => null },
    { id: 'documents', label: 'מסמכים', component: () => null }
  ], [])

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

      {/* Tab Navigation */}
      <StudentTabNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        tabs={tabs}
      />

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <StudentTabContent 
          activeTab={activeTab}
          studentId={studentId!}
          student={student}
          isLoading={false}
          onStudentUpdate={handleStudentUpdate}
        />
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