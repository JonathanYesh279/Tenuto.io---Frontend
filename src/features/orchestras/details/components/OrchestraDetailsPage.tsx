/**
 * Orchestra Details Page - Main Container Component
 * 
 * Handles route parameters, data fetching, error boundaries,
 * and coordinates all child components for the orchestra details view.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { OrchestraTabType } from '../types'
import OrchestraTabNavigation from './OrchestraTabNavigation'
import OrchestraTabContent from './OrchestraTabContent'
import apiService from '../../../../services/apiService'

const OrchestraDetailsPage: React.FC = () => {
  const { orchestraId } = useParams<{ orchestraId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<OrchestraTabType>('personal')
  const [orchestra, setOrchestra] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Validate orchestraId parameter
  if (!orchestraId || orchestraId.trim() === '') {
    return <Navigate to="/orchestras" replace />
  }

  // Fetch orchestra data - memoized to prevent unnecessary re-runs
  const fetchOrchestra = useCallback(async () => {
    if (!orchestraId) return
    
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Fetching orchestra data for ID:', orchestraId)
      
      const orchestraData = await apiService.orchestras.getOrchestra(orchestraId)
      console.log('✅ Orchestra data loaded:', orchestraData?.name)
      
      setOrchestra(orchestraData)
    } catch (err) {
      console.error('❌ Error fetching orchestra:', err)
      setError({
        code: err.status === 404 ? 'NOT_FOUND' : 
              err.status === 401 ? 'UNAUTHORIZED' : 
              err.status === 403 ? 'FORBIDDEN' : 'SERVER_ERROR',
        message: err.message || 'שגיאה בטעינת נתוני התזמורת'
      })
    } finally {
      setIsLoading(false)
    }
  }, [orchestraId])

  useEffect(() => {
    fetchOrchestra()
  }, [fetchOrchestra])

  // Handle 404 errors by redirecting to orchestras list
  if (error?.code === 'NOT_FOUND') {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">תזמורת לא נמצאה</h1>
        <p className="text-gray-600 mb-6">
          התזמורת שביקשת לא נמצאה במערכת או שאין לך הרשאה לצפות בה
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/orchestras')}
            className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזור לרשימת תזמורות
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
          אין לך הרשאה לצפות בפרטי תזמורת זו
        </p>
        <button
          onClick={() => navigate('/orchestras')}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזור לרשימת תזמורות
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
            onClick={() => navigate('/orchestras')}
            className="flex items-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזור לרשימת תזמורות
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
          <div className="text-gray-600">טוען פרטי תזמורת...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white min-h-screen orchestra-details-container orchestra-content-area">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <button
          onClick={() => navigate('/orchestras')}
          className="hover:text-primary-600 transition-colors"
        >
          תזמורות
        </button>
        <span>{'>'}</span>
        <span className="text-gray-900">
          {orchestra?.name || 'פרטי תזמורת'}
        </span>
      </nav>

      {/* Orchestra Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-xl text-primary-600">🎼</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {orchestra?.name || 'טוען...'}
            </h1>
            <p className="text-gray-600">
              {orchestra?.type || 'תזמורת'} | {orchestra?.location || 'לא צוין מיקום'}
            </p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {orchestra?.memberIds?.length || 0} חברים
          </div>
        </div>
      </div>

      {/* Tab Navigation and Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden">
        <OrchestraTabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: 'personal', label: 'פרטי תזמורת', component: () => null },
            { id: 'members', label: 'חברי תזמורת', component: () => null },
            { id: 'schedule', label: 'לוח זמנים', component: () => null },
          ]}
        />

        <OrchestraTabContent
          activeTab={activeTab}
          orchestraId={orchestraId}
          orchestra={orchestra}
          isLoading={isLoading}
          onUpdate={fetchOrchestra}
        />
      </div>
    </div>
  )
}

export default OrchestraDetailsPage