/**
 * Teacher Details Page - Main Container Component
 * 
 * Handles route parameters, data fetching, error boundaries,
 * and coordinates all child components for the teacher details view.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { TeacherTabType } from '../types'
import TeacherTabNavigation from './TeacherTabNavigation'
import TeacherTabContent from './TeacherTabContent'
import apiService from '../../../../services/apiService'
import { getDisplayName } from '../../../../utils/nameUtils'

const TeacherDetailsPage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TeacherTabType>('personal')
  const [teacher, setTeacher] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Validate teacherId parameter
  if (!teacherId || teacherId.trim() === '') {
    return <Navigate to="/teachers" replace />
  }

  // Fetch teacher data - memoized to prevent unnecessary re-runs
  const fetchTeacher = useCallback(async () => {
    if (!teacherId) return
    
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Fetching teacher data for ID:', teacherId)
      
      const teacherData = await apiService.teachers.getTeacherById(teacherId)
      console.log('✅ Teacher data loaded:', getDisplayName(teacherData?.personalInfo))
      
      setTeacher(teacherData)
    } catch (err) {
      console.error('❌ Error fetching teacher:', err)
      setError({
        code: err.status === 404 ? 'NOT_FOUND' : 
              err.status === 401 ? 'UNAUTHORIZED' : 
              err.status === 403 ? 'FORBIDDEN' : 'SERVER_ERROR',
        message: err.message || 'שגיאה בטעינת נתוני המורה'
      })
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    fetchTeacher()
  }, [fetchTeacher])

  // Handle 404 errors by redirecting to teachers list
  if (error?.code === 'NOT_FOUND') {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">מורה לא נמצא</h1>
        <p className="text-gray-600 mb-6">
          המורה שביקשת לא נמצא במערכת או שאין לך הרשאה לצפות בו
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/teachers')}
            className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזור לרשימת מורים
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
          אין לך הרשאה לצפות בפרטי מורה זה
        </p>
        <button
          onClick={() => navigate('/teachers')}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזור לרשימת מורים
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
            onClick={() => navigate('/teachers')}
            className="flex items-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזור לרשימת מורים
          </button>
        </div>
      </div>
    )
  }

  // Simple loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען פרטי מורה...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white min-h-screen teacher-details-container teacher-content-area">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <button
          onClick={() => navigate('/teachers')}
          className="hover:text-primary-600 transition-colors"
        >
          מורים
        </button>
        <span>{'>'}</span>
        <span className="text-gray-900">
          {getDisplayName(teacher?.personalInfo) || 'פרטי מורה'}
        </span>
      </nav>

      {/* Teacher Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-xl text-primary-600">👨‍🏫</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getDisplayName(teacher?.personalInfo) || 'טוען...'}
            </h1>
            <p className="text-gray-600">
              {teacher?.professionalInfo?.instrument || 'ללא כלי'} | {teacher?.roles?.join(', ') || 'מורה'}
            </p>
          </div>
          {teacher?.conducting?.orchestraIds?.length > 0 && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              מנצח
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation and Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden">
        <TeacherTabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: 'personal', label: 'מידע אישי', component: () => null },
            { id: 'students', label: 'ניהול תלמידים', component: () => null },
            { id: 'schedule', label: 'לוח זמנים', component: () => null },
            ...(teacher?.conducting?.orchestraIds?.length > 0 || (teacher as any)?.conducting?.ensemblesIds?.length > 0 || teacher?.ensemblesIds?.length > 0 || teacher?.roles?.includes('מנצח') ?
              [{ id: 'conducting' as TeacherTabType, label: 'ניצוח', component: () => null }] : []
            ),
            { id: 'hours', label: 'שעות שבועיות', component: () => null },
          ]}
        />

        <TeacherTabContent
          activeTab={activeTab}
          teacherId={teacherId}
          teacher={teacher}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}

export default TeacherDetailsPage