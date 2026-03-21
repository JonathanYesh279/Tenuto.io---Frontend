/**
 * Student Details Page - Main Container Component
 *
 * Handles route parameters, data fetching, error boundaries,
 * and coordinates all child components for the student details view.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRightIcon, ArrowClockwiseIcon, WifiHighIcon, WifiSlashIcon, TrashIcon, ShieldIcon, DatabaseIcon, WarningCircleIcon,
  UserIcon, GraduationCapIcon, CalendarIcon, CheckCircleIcon, MusicNotesIcon, BookOpenIcon, CertificateIcon, FileTextIcon, SpinnerIcon
} from '@phosphor-icons/react'
import { TabType } from '../types'
import { DetailPageHeader } from '@/components/domain'
import { AnimatePresence, motion } from 'framer-motion'
import PersonalInfoTab from './tabs/PersonalInfoTabSimple'
import AcademicInfoTab from './tabs/AcademicInfoTabSimple'
import ScheduleTab from './tabs/ScheduleTab'
import OrchestraTab from './tabs/OrchestraTab'
import TheoryTabOptimized from './tabs/TheoryTabOptimized'
import BagrutTab from './tabs/BagrutTab'
import apiService from '../../../../services/apiService'
import { getDisplayName } from '../../../../utils/nameUtils'
import { useWebSocketStatus } from '../../../../services/websocketService'
import { usePerformanceOptimizations } from '../../../../services/performanceOptimizations'
import { StudentDetailsErrorBoundary } from './StudentDetailsErrorBoundary'
import ConfirmationModal from '../../../../components/ui/ConfirmationModal'
import { useCascadeDeletion } from '../../../../hooks/useCascadeDeletion'
import { cascadeDeletionService } from '../../../../services/cascadeDeletionService'
import SafeDeleteModal from '../../../../components/SafeDeleteModal'
import DeletionImpactModal from '../../../../components/DeletionImpactModal'
import DeletionImpactSummary from './DeletionImpactSummary'
import React, { Suspense } from 'react'

// Simple placeholder components for tabs that need more work
const AttendanceTab = ({ student }: { student: any }) => (
  <div className="px-6 py-6 text-center text-muted-foreground">
    <div className="text-4xl mb-4">✅</div>
    <div>נוכחות - בפיתוח</div>
  </div>
)

const DocumentsTab = ({ student }: { student: any }) => (
  <div className="px-6 py-6 text-center text-muted-foreground">
    <div className="text-4xl mb-4">📄</div>
    <div>מסמכים - בפיתוח</div>
  </div>
)

// Loading component for tab content
const TabLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <SpinnerIcon className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
      <div className="text-sm text-muted-foreground">טוען נתונים...</div>
    </div>
  </div>
)

const StudentDetailsPage: React.FC = () => {
  console.log('🔍 StudentDetailsPage component loading...')
  const { studentId } = useParams<{ studentId: string }>()
  console.log('📝 Student ID from params:', studentId)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('personal')

  // Validate studentId parameter
  if (!studentId || studentId.trim() === '') {
    return <Navigate to="/students" replace />
  }

  // State management
  const [student, setStudent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Cascade deletion states
  const [showSafeDeleteModal, setShowSafeDeleteModal] = useState(false)
  const [showDeletionImpactModal, setShowDeletionImpactModal] = useState(false)
  const [deletionPreview, setDeletionPreview] = useState(null)
  const [showImpactSummary, setShowImpactSummary] = useState(false)

  // Cascade deletion hooks
  const { previewDeletion, executeDeletion, isDeleting } = useCascadeDeletion()

  // WebSocket connection status (with error handling)
  let wsStatus = null
  let wsError = false

  try {
    wsStatus = useWebSocketStatus()
  } catch (error) {
    console.warn('WebSocket status unavailable:', error)
    wsError = true
  }

  // Performance optimizations
  const { prefetchTabData } = usePerformanceOptimizations()

  // Fetch student data
  const fetchStudent = useCallback(async () => {
    if (!studentId) return

    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Fetching student data for ID:', studentId)

      const studentData = await apiService.students.getStudentById(studentId)
      setStudent(studentData)

      console.log('✅ Student data loaded successfully:', getDisplayName(studentData.personalInfo))
    } catch (err) {
      console.error('❌ Error fetching student:', err)
      setError({
        code: err.status === 404 ? 'NOT_FOUND' :
              err.status === 401 ? 'UNAUTHORIZED' :
              err.status === 403 ? 'FORBIDDEN' : 'SERVER_ERROR',
        message: err.message || 'שגיאה בטעינת נתוני התלמיד'
      })
    } finally {
      setIsLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchStudent()
  }, [fetchStudent])

  // Handle student data updates
  const handleStudentUpdate = useCallback((updatedStudent: any) => {
    setStudent(updatedStudent)
    console.log('🔄 Student data updated:', getDisplayName(updatedStudent.personalInfo))
  }, [])

  // Handle student deletion
  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!studentId) return

    try {
      await apiService.students.deleteStudent(studentId)
      // Navigate back to students list after successful deletion
      navigate('/students')
    } catch (err) {
      console.error('Error deleting student:', err)
      alert('שגיאה במחיקת התלמיד')
    } finally {
      setShowDeleteModal(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
  }

  // New cascade deletion handlers
  const handleSafeDeleteClick = async () => {
    if (!studentId || !getDisplayName(student?.personalInfo)) return
    setShowSafeDeleteModal(true)
  }

  const handleCheckReferences = async () => {
    if (!studentId) return
    try {
      const preview = await cascadeDeletionService.previewDeletion(studentId)
      setDeletionPreview(preview)
      setShowDeletionImpactModal(true)
    } catch (error) {
      console.error('Error checking references:', error)
      alert('שגיאה בבדיקת התלויות')
    }
  }

  const handleSafeDelete = async (studentIdParam: string, options: any) => {
    try {
      await cascadeDeletionService.executeDelete(studentIdParam, options)
      setShowSafeDeleteModal(false)
      navigate('/students')
    } catch (error) {
      console.error('Error in safe deletion:', error)
      alert('שגיאה במחיקה המאובטחת')
    }
  }

  const handleToggleImpactSummary = () => {
    setShowImpactSummary(!showImpactSummary)
  }

  // Prefetch tab data when tab changes
  useEffect(() => {
    if (activeTab !== 'personal' && student) {
      try {
        prefetchTabData(activeTab)
      } catch (error) {
        console.warn('Failed to prefetch tab data:', error)
      }
    }
  }, [activeTab, prefetchTabData, student])

  // Handle 404 errors by redirecting to students list
  if (error?.code === 'NOT_FOUND') {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">תלמיד לא נמצא</h1>
        <p className="text-muted-foreground mb-6">
          התלמיד שביקשת לא נמצא במערכת או שאין לך הרשאה לצפות בו
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/students')}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4 ml-2" />
            חזור לרשימת תלמידים
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center px-4 py-2 border border-border text-foreground rounded hover:bg-muted transition-colors"
          >
            <ArrowClockwiseIcon className="w-4 h-4 ml-2" />
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  // Handle unauthorized access
  if (error?.code === 'UNAUTHORIZED' || error?.code === 'FORBIDDEN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">אין הרשאה</h1>
        <p className="text-muted-foreground mb-6">
          אין לך הרשאה לצפות בפרטי תלמיד זה
        </p>
        <button
          onClick={() => navigate('/students')}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
        >
          <ArrowRightIcon className="w-4 h-4 ml-2" />
          חזור לרשימת תלמידים
        </button>
      </div>
    )
  }

  // Handle network or server errors
  if (error && !['NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN'].includes(error.code)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">שגיאה בטעינת הנתונים</h1>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
          >
            <ArrowClockwiseIcon className="w-4 h-4 ml-2" />
            נסה שוב
          </button>
          <button
            onClick={() => navigate('/students')}
            className="flex items-center px-4 py-2 border border-border text-foreground rounded hover:bg-muted transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4 ml-2" />
            חזור לרשימת תלמידים
          </button>
        </div>
      </div>
    )
  }

  // Enhanced loading state with skeletons
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="bg-muted/40 border-b border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-muted rounded mb-2 w-48"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-10 bg-muted/50 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-10 bg-muted/50 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <StudentDetailsErrorBoundary>
      <div className="min-h-screen bg-background student-details-container student-content-area">
        {/* Connection Status Indicator - only show if WebSocket is available and relevant */}
        {wsStatus && !wsError && wsStatus.isConnected && (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-4 py-2 text-sm mx-6 mt-4">
            <div className="flex items-center gap-2">
              <WifiHighIcon className="w-4 h-4 text-green-500" />
              <span className="text-green-700">מחובר לעדכונים בזמן אמת</span>
            </div>
          </div>
        )}

        {/* Only show disconnection warning if we were previously connected */}
        {wsStatus && !wsError && !wsStatus.isConnected && wsStatus.reconnectAttempts > 0 && (
          <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded px-4 py-2 text-sm mx-6 mt-4">
            <div className="flex items-center gap-2">
              <WifiSlashIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-700">מנסה להתחבר לעדכונים בזמן אמת...</span>
            </div>
            <span className="text-muted-foreground">
              ניסיון {wsStatus.reconnectAttempts}
            </span>
          </div>
        )}

        {/* Identity block with attached tab bar — Dossier archetype */}
        <DetailPageHeader
          firstName={student?.personalInfo?.firstName}
          lastName={student?.personalInfo?.lastName}
          fullName={student?.personalInfo?.fullName}
          entityType="תלמיד"
          entityColor="students"
          breadcrumbLabel="תלמידים"
          breadcrumbHref="/students"
          updatedAt={student?.updatedAt}
          badges={
            <>
              <span className="px-2.5 py-0.5 bg-students-fg/10 text-students-fg rounded-full text-xs font-medium">
                כיתה {student?.academicInfo?.class || '-'}
              </span>
              <span className="px-2.5 py-0.5 bg-students-fg/10 text-students-fg rounded-full text-xs font-medium">
                {student?.primaryInstrument || 'ללא כלי'}
              </span>
            </>
          }
        >
          {/* Tab bar — attached inside the identity block, no gap */}
          <nav className="flex gap-6 overflow-x-auto scrollbar-hide" aria-label="Student tabs">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'personal'
                  ? 'text-foreground font-semibold border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <UserIcon className="h-4 w-4" />
              פרטים אישיים
            </button>
            <button
              onClick={() => setActiveTab('academic')}
              className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'academic'
                  ? 'text-foreground font-semibold border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <GraduationCapIcon className="h-4 w-4" />
              מידע אקדמי
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'schedule'
                  ? 'text-foreground font-semibold border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              לוח זמנים
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'attendance'
                  ? 'text-foreground font-semibold border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <CheckCircleIcon className="h-4 w-4" />
              נוכחות
            </button>
            <button
              onClick={() => setActiveTab('orchestra')}
              className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'orchestra'
                  ? 'text-foreground font-semibold border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <MusicNotesIcon className="h-4 w-4" />
              תזמורות
            </button>
            <button
              onClick={() => setActiveTab('theory')}
              className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'theory'
                  ? 'text-foreground font-semibold border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <BookOpenIcon className="h-4 w-4" />
              תאוריה
            </button>
            <button
              onClick={() => setActiveTab('bagrut')}
              className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'bagrut'
                  ? 'text-foreground font-semibold border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <CertificateIcon className="h-4 w-4" />
              בגרות
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'text-foreground font-semibold border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <FileTextIcon className="h-4 w-4" />
              מסמכים
            </button>
          </nav>
        </DetailPageHeader>

        {/* Action buttons */}
        <div className="flex items-center gap-2 justify-end px-6 py-3 border-b border-border">
          <button
            onClick={handleToggleImpactSummary}
            className={`p-2 rounded transition-colors ${
              showImpactSummary
                ? 'bg-blue-100 text-blue-700'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            title="הצג/הסתר השפעת מחיקה"
          >
            <DatabaseIcon className="w-5 h-5" />
          </button>

          <button
            onClick={handleCheckReferences}
            className="p-2 text-muted-foreground hover:bg-muted rounded transition-colors"
            title="בדוק תלויות ומחיקה"
          >
            <WarningCircleIcon className="w-5 h-5" />
          </button>

          <button
            onClick={handleSafeDeleteClick}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
            title="מחיקה מאובטחת"
          >
            <ShieldIcon className="w-5 h-5" />
          </button>

          <button
            onClick={handleDeleteClick}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="מחיקה רגילה"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Deletion Impact Summary */}
        <DeletionImpactSummary
          studentId={studentId}
          studentName={getDisplayName(student?.personalInfo) || 'תלמיד'}
          isVisible={showImpactSummary}
          onClose={() => setShowImpactSummary(false)}
        />

        {/* Tab content — continuous document, no card wrapper */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onAnimationComplete={() => {
              try {
                prefetchTabData(activeTab)
              } catch (error) {
                console.warn('Failed to prefetch tab data:', error)
              }
            }}
          >
            {activeTab === 'personal' && (
              <Suspense fallback={<TabLoadingFallback />}>
                <PersonalInfoTab
                  student={student}
                  studentId={studentId}
                  onStudentUpdate={handleStudentUpdate}
                />
              </Suspense>
            )}
            {activeTab === 'academic' && (
              <Suspense fallback={<TabLoadingFallback />}>
                <AcademicInfoTab
                  student={student}
                  studentId={studentId}
                  onStudentUpdate={handleStudentUpdate}
                />
              </Suspense>
            )}
            {activeTab === 'schedule' && (
              <Suspense fallback={<TabLoadingFallback />}>
                <ScheduleTab
                  studentId={studentId}
                  isLoading={false}
                />
              </Suspense>
            )}
            {activeTab === 'attendance' && (
              <Suspense fallback={<TabLoadingFallback />}>
                <AttendanceTab student={student} />
              </Suspense>
            )}
            {activeTab === 'orchestra' && (
              <Suspense fallback={<TabLoadingFallback />}>
                <OrchestraTab
                  student={student}
                  studentId={studentId}
                  isLoading={false}
                />
              </Suspense>
            )}
            {activeTab === 'theory' && (
              <Suspense fallback={<TabLoadingFallback />}>
                <TheoryTabOptimized
                  student={student}
                  studentId={studentId}
                />
              </Suspense>
            )}
            {activeTab === 'bagrut' && (
              <Suspense fallback={<TabLoadingFallback />}>
                <BagrutTab
                  student={student}
                  studentId={studentId}
                  onStudentUpdate={handleStudentUpdate}
                />
              </Suspense>
            )}
            {activeTab === 'documents' && (
              <Suspense fallback={<TabLoadingFallback />}>
                <DocumentsTab student={student} />
              </Suspense>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת תלמיד"
        message={`האם אתה בטוח שברצונך למחוק את התלמיד ${getDisplayName(student?.personalInfo)}? פעולה זו לא ניתנת לביטול.`}
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />

      {/* Safe Delete Modal */}
      <SafeDeleteModal
        isOpen={showSafeDeleteModal}
        studentId={studentId || ''}
        studentName={getDisplayName(student?.personalInfo) || ''}
        onClose={() => setShowSafeDeleteModal(false)}
        onConfirm={handleSafeDelete}
      />

      {/* Deletion Impact Modal */}
      <DeletionImpactModal
        isOpen={showDeletionImpactModal}
        preview={deletionPreview}
        onClose={() => setShowDeletionImpactModal(false)}
      />
    </StudentDetailsErrorBoundary>
  )
}

// Export directly for now to test routing
export default StudentDetailsPage
