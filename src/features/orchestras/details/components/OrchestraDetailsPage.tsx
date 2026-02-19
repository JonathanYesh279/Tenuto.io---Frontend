/**
 * Orchestra Details Page - Main Container Component
 *
 * Handles route parameters, data fetching, error boundaries,
 * and coordinates all child components for the orchestra details view.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCw, Info, Users, Calendar } from 'lucide-react'
import { OrchestraTabType } from '../types'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimatePresence, motion } from 'framer-motion'
import { DetailPageHeader } from '@/components/domain'
import PersonalInfoTab from './tabs/PersonalInfoTab'
import MembersTab from './tabs/MembersTab'
import ScheduleTab from './tabs/ScheduleTab'
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
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזור לרשימת תזמורות
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center px-4 py-2 border border-border text-foreground rounded hover:bg-muted transition-colors"
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
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
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
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            נסה שוב
          </button>
          <button
            onClick={() => navigate('/orchestras')}
            className="flex items-center px-4 py-2 border border-border text-foreground rounded hover:bg-muted transition-colors"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-600">טוען פרטי תזמורת...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white min-h-screen orchestra-details-container orchestra-content-area">

      {/* Gradient header with breadcrumb */}
      <DetailPageHeader
        fullName={orchestra?.name}
        entityType="תזמורת"
        entityColor="orchestras"
        breadcrumbLabel="תזמורות"
        breadcrumbHref="/orchestras"
        updatedAt={orchestra?.updatedAt}
        badges={
          <>
            <span className="px-3 py-1 bg-orchestras-fg/10 text-orchestras-fg rounded-full text-sm font-medium">
              {orchestra?.type || 'תזמורת'}
            </span>
            <span className="px-3 py-1 bg-orchestras-fg/10 text-orchestras-fg rounded-full text-sm font-medium">
              {orchestra?.memberIds?.length || 0} חברים
            </span>
          </>
        }
      />

      {/* Tab Navigation and Content — shadcn Tabs with AnimatePresence fade */}
      <div className="bg-background border border-border w-full overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrchestraTabType)} className="w-full">
          <TabsList className="sticky top-0 z-10 w-full justify-start rounded-none border-b bg-white h-auto px-6">
            <TabsTrigger value="personal" className="gap-2 inline-flex items-center data-[state=active]:bg-orchestras-bg data-[state=active]:text-orchestras-fg data-[state=active]:shadow-none rounded px-3 py-1.5 text-sm font-medium transition-colors">
              <Info className="h-4 w-4" />
              פרטי תזמורת
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2 inline-flex items-center data-[state=active]:bg-orchestras-bg data-[state=active]:text-orchestras-fg data-[state=active]:shadow-none rounded px-3 py-1.5 text-sm font-medium transition-colors">
              <Users className="h-4 w-4" />
              חברי תזמורת
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2 inline-flex items-center data-[state=active]:bg-orchestras-bg data-[state=active]:text-orchestras-fg data-[state=active]:shadow-none rounded px-3 py-1.5 text-sm font-medium transition-colors">
              <Calendar className="h-4 w-4" />
              לוח זמנים
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'personal' && (
                <PersonalInfoTab
                  orchestraId={orchestraId}
                  orchestra={orchestra}
                  isLoading={false}
                  activeTab={activeTab}
                />
              )}
              {activeTab === 'members' && (
                <MembersTab
                  orchestraId={orchestraId}
                  orchestra={orchestra}
                  isLoading={false}
                  activeTab={activeTab}
                  onUpdate={fetchOrchestra}
                />
              )}
              {activeTab === 'schedule' && (
                <ScheduleTab
                  orchestraId={orchestraId}
                  orchestra={orchestra}
                  isLoading={false}
                  activeTab={activeTab}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  )
}

export default OrchestraDetailsPage
