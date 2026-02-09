/**
 * Student Details Page - Main Container Component
 * 
 * Handles route parameters, data fetching, error boundaries,
 * and coordinates all child components for the student details view.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCw, Wifi, WifiOff, Trash2, Shield, Database, AlertTriangle, Archive } from 'lucide-react'
import { TabType } from '../types'
import StudentTabNavigation from './StudentTabNavigation'
import StudentTabContent from './StudentTabContent'
import apiService from '../../../../services/apiService'
import { getDisplayName } from '../../../../utils/nameUtils'
import { useWebSocketStatus } from '../../../../services/websocketService'
import { usePerformanceOptimizations } from '../../../../services/performanceOptimizations'
import { 
  SmartLoadingState, 
  SkeletonComponents 
} from '../../../../services/performanceOptimizations'
import { StudentDetailsErrorBoundary } from './StudentDetailsErrorBoundary'
import ConfirmationModal from '../../../../components/ui/ConfirmationModal'
import { useCascadeDeletion } from '../../../../hooks/useCascadeDeletion'
import { cascadeDeletionService } from '../../../../services/cascadeDeletionService'
import SafeDeleteModal from '../../../../components/SafeDeleteModal'
import DeletionImpactModal from '../../../../components/DeletionImpactModal'
import DeletionImpactSummary from './DeletionImpactSummary'

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">תלמיד לא נמצא</h1>
        <p className="text-gray-600 mb-6">
          התלמיד שביקשת לא נמצא במערכת או שאין לך הרשאה לצפות בו
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/students')}
            className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזור לרשימת תלמידים
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">אין הרשאה</h1>
        <p className="text-gray-600 mb-6">
          אין לך הרשאה לצפות בפרטי תלמיד זה
        </p>
        <button
          onClick={() => navigate('/students')}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">שגיאה בטעינת הנתונים</h1>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            נסה שוב
          </button>
          <button
            onClick={() => navigate('/students')}
            className="flex items-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזור לרשימת תלמידים
          </button>
        </div>
      </div>
    )
  }

  // Enhanced loading state with smart loading and skeletons
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton with better structure */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded mb-2 w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>

        {/* Tab navigation skeleton with proper spacing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex gap-6">
              {['פרטים אישיים', 'פרטים אקדמיים', 'לוח זמנים', 'נוכחות', 'תזמורות', 'תיאוריה', 'מסמכים'].map((label, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{width: `${label.length * 8}px`}}></div>
              ))}
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-100 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-10 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <StudentDetailsErrorBoundary>
      <div className="space-y-6 bg-white min-h-screen student-details-container student-content-area">
        {/* Connection Status Indicator - only show if WebSocket is available and relevant */}
        {wsStatus && !wsError && wsStatus.isConnected && (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-700">מחובר לעדכונים בזמן אמת</span>
            </div>
          </div>
        )}
        
        {/* Only show disconnection warning if we were previously connected */}
        {wsStatus && !wsError && !wsStatus.isConnected && wsStatus.reconnectAttempts > 0 && (
          <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-700">מנסה להתחבר לעדכונים בזמן אמת...</span>
            </div>
            <span className="text-gray-600">
              ניסיון {wsStatus.reconnectAttempts}
            </span>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => navigate('/students')}
            className="hover:text-primary-600 transition-colors"
          >
            תלמידים
          </button>
          <span>{'>'}</span>
          <span className="text-gray-900">
            {getDisplayName(student?.personalInfo) || 'פרטי תלמיד'}
          </span>
        </nav>

        {/* Student Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-xl text-primary-600">👤</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getDisplayName(student?.personalInfo) || 'טוען...'}
                </h1>
                <p className="text-gray-600">
                  כיתה {student?.academicInfo?.class || '-'} | {student?.primaryInstrument || 'ללא כלי'}
                </p>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleImpactSummary}
                className={`p-2 rounded-lg transition-colors ${
                  showImpactSummary 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
                title="הצג/הסתר השפעת מחיקה"
              >
                <Database className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleCheckReferences}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="בדוק תלויות ומחיקה"
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSafeDeleteClick}
                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="מחיקה מאובטחת"
              >
                <Shield className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleDeleteClick}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="מחיקה רגילה"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Deletion Impact Summary */}
        <DeletionImpactSummary
          studentId={studentId}
          studentName={getDisplayName(student?.personalInfo) || 'תלמיד'}
          isVisible={showImpactSummary}
          onClose={() => setShowImpactSummary(false)}
        />

        {/* Tab Navigation and Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden">
          <StudentTabNavigation
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab)
              // Prefetch data for the new tab if available
              try {
                prefetchTabData(tab)
              } catch (error) {
                console.warn('Failed to prefetch tab data:', error)
              }
            }}
            tabs={[
              { id: 'personal', label: 'פרטים אישיים', component: () => null },
              { id: 'academic', label: 'פרטים אקדמיים', component: () => null },
              { id: 'schedule', label: 'לוח זמנים', component: () => null },
              { id: 'attendance', label: 'נוכחות', component: () => null },
              { id: 'orchestra', label: 'תזמורות', component: () => null },
              { id: 'theory', label: 'תיאוריה', component: () => null },
              { id: 'bagrut', label: 'בגרות', component: () => null },
              { id: 'documents', label: 'מסמכים', component: () => null },
            ]}
          />

          <StudentTabContent
            activeTab={activeTab}
            studentId={studentId}
            student={student}
            isLoading={isLoading}
            onStudentUpdate={handleStudentUpdate}
          />
        </div>
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