/**
 * Student Tab Content Component
 * 
 * Dynamically renders content based on the active tab using lazy loading
 * and proper error boundaries for each tab component.
 */

import React, { Suspense } from 'react'

import { StudentTabContentProps } from '../types'
import { CircleNotchIcon } from '@phosphor-icons/react'
import {
  SmartLoadingState, 
  SkeletonComponents 
} from '@/services/performanceOptimizations'

// Import simplified tab components for now
import PersonalInfoTab from './tabs/PersonalInfoTabSimple'
import AcademicInfoTab from './tabs/AcademicInfoTabSimple'
// Import optimized components
import TheoryTabOptimized from './tabs/TheoryTabOptimized'
import ScheduleTab from './tabs/ScheduleTab'
import OrchestraTab from './tabs/OrchestraTab'
import BagrutTab from './tabs/BagrutTab'

// Simple placeholder components for tabs that need more work

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

// Loading component for tab content
const TabLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <CircleNotchIcon className="w-6 h-6 animate-spin mx-auto mb-3 text-foreground" />
      <div className="text-sm text-gray-600">טוען נתונים...</div>
    </div>
  </div>
)

// Error fallback for individual tabs
const TabErrorFallback: React.FC<{ error: Error; resetError: () => void; tabName: string }> = ({ 
  error, 
  resetError, 
  tabName 
}) => (
  <div className="text-center py-12">
    <div className="text-red-600 text-lg mb-2">⚠️ שגיאה בטעינת {tabName}</div>
    <div className="text-gray-600 mb-4 text-sm">{error.message}</div>
    <button
      onClick={resetError}
      className="px-4 py-2 bg-muted text-white rounded hover:bg-muted transition-colors text-sm"
    >
      נסה שוב
    </button>
  </div>
)

// Tab-specific error boundary
class TabErrorBoundary extends React.Component<
  { children: React.ReactNode; tabName: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; tabName: string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.tabName} tab:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <TabErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
          tabName={this.props.tabName}
        />
      )
    }

    return this.props.children
  }
}

// Enhanced prop interface to include all comprehensive functionality
interface EnhancedStudentTabContentProps extends StudentTabContentProps {
  errors?: {
    student?: any
    schedule?: any
    attendance?: any
    orchestras?: any
    theoryClasses?: any
    documents?: any
  }
  actions?: {
    updatePersonalInfo?: (data: any) => Promise<any>
    updateAcademicInfo?: (data: any) => Promise<any>
    markAttendance?: (data: any) => Promise<any>
    refetchAll?: () => void
    prefetchTabData?: (tabId: string) => Promise<any>
  }
  fileHandling?: {
    upload?: any
    download?: any
  }
  onStudentUpdate?: (updatedStudent: any) => void
}

const StudentTabContent: React.FC<EnhancedStudentTabContentProps> = ({
  activeTab,
  studentId,
  student,
  isLoading,
  errors = {},
  actions = {},
  fileHandling = {},
  onStudentUpdate
}) => {
  // Enhanced loading state with smart loading and appropriate skeletons
  const getSkeletonForTab = () => {
    switch (activeTab) {
      case 'documents':
        return <SkeletonComponents.DocumentsList />
      case 'schedule':
        return <SkeletonComponents.Schedule />
      default:
        return <SkeletonComponents.TabContent />
    }
  }

  // Check if current tab is loading
  const isCurrentTabLoading = typeof isLoading === 'object' 
    ? isLoading[activeTab] || isLoading.student
    : isLoading

  if (isCurrentTabLoading) {
    return (
      <SmartLoadingState 
        isLoading={true} 
        skeleton={getSkeletonForTab()}
        minHeight="400px"
      >
        <div />
      </SmartLoadingState>
    )
  }

  // If no student data, show empty state
  if (!student) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">📄</div>
          <div className="text-gray-600">אין נתונים להצגה</div>
        </div>
      </div>
    )
  }

  // Render the appropriate tab content with enhanced props
  const renderTabContent = () => {
    const commonProps = { 
      student, 
      studentId,
      actions,
      fileHandling,
      errors
    }

    switch (activeTab) {
      case 'personal':
        return (
          <TabErrorBoundary tabName="פרטים אישיים">
            <Suspense fallback={<TabLoadingFallback />}>
              <PersonalInfoTab 
                student={student}
                studentId={studentId}
                onStudentUpdate={onStudentUpdate}
              />
            </Suspense>
          </TabErrorBoundary>
        )

      case 'academic':
        return (
          <TabErrorBoundary tabName="פרטים אקדמיים">
            <Suspense fallback={<TabLoadingFallback />}>
              <AcademicInfoTab 
                student={student}
                studentId={studentId}
                onStudentUpdate={onStudentUpdate}
              />
            </Suspense>
          </TabErrorBoundary>
        )

      case 'schedule':
        return (
          <TabErrorBoundary tabName="לוח זמנים">
            <Suspense fallback={<TabLoadingFallback />}>
              <ScheduleTab 
                student={student}
                studentId={studentId}
                isLoading={isCurrentTabLoading}
              />
            </Suspense>
          </TabErrorBoundary>
        )

      case 'attendance':
        return (
          <TabErrorBoundary tabName="נוכחות">
            <Suspense fallback={<TabLoadingFallback />}>
              <AttendanceTab student={student} />
            </Suspense>
          </TabErrorBoundary>
        )

      case 'orchestra':
        return (
          <TabErrorBoundary tabName="תזמורות">
            <Suspense fallback={<TabLoadingFallback />}>
              <OrchestraTab 
                student={student}
                studentId={studentId}
                isLoading={isCurrentTabLoading}
              />
            </Suspense>
          </TabErrorBoundary>
        )

      case 'theory':
        return (
          <TabErrorBoundary tabName="תיאוריה">
            <Suspense fallback={<TabLoadingFallback />}>
              <TheoryTabOptimized 
                student={student}
                studentId={studentId}
              />
            </Suspense>
          </TabErrorBoundary>
        )

      case 'bagrut':
        return (
          <TabErrorBoundary tabName="בגרות">
            <Suspense fallback={<TabLoadingFallback />}>
              <BagrutTab 
                student={student}
                studentId={studentId}
                onStudentUpdate={onStudentUpdate}
              />
            </Suspense>
          </TabErrorBoundary>
        )

      case 'documents':
        return (
          <TabErrorBoundary tabName="מסמכים">
            <Suspense fallback={<TabLoadingFallback />}>
              <DocumentsTab student={student} />
            </Suspense>
          </TabErrorBoundary>
        )

      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">🚧</div>
            <div className="text-gray-600">תוכן טרם פותח</div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-96">
      {renderTabContent()}
    </div>
  )
}

export default StudentTabContent