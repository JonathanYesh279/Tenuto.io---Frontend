/**
 * Orchestra Details Page - Main Container Component
 *
 * Handles route parameters, data fetching, error boundaries,
 * and coordinates all child components for the orchestra details view.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRightIcon, ArrowClockwiseIcon, InfoIcon, UsersIcon, CalendarIcon } from '@phosphor-icons/react'
import { OrchestraTabType } from '../types'
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
        <h1 className="text-2xl font-bold text-foreground mb-2">תזמורת לא נמצאה</h1>
        <p className="text-muted-foreground mb-6">
          התזמורת שביקשת לא נמצאה במערכת או שאין לך הרשאה לצפות בה
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/orchestras')}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4 ml-2" />
            חזור לרשימת תזמורות
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
          אין לך הרשאה לצפות בפרטי תזמורת זו
        </p>
        <button
          onClick={() => navigate('/orchestras')}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
        >
          <ArrowRightIcon className="w-4 h-4 ml-2" />
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
            onClick={() => navigate('/orchestras')}
            className="flex items-center px-4 py-2 border border-border text-foreground rounded hover:bg-muted transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4 ml-2" />
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
          <div className="text-muted-foreground">טוען פרטי תזמורת...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background orchestra-details-container orchestra-content-area">

      {/* Identity block with attached tab bar — Dossier archetype */}
      <DetailPageHeader
        fullName={orchestra?.name}
        entityType="תזמורת"
        entityColor="orchestras"
        breadcrumbLabel="תזמורות"
        breadcrumbHref="/orchestras"
        updatedAt={orchestra?.updatedAt}
        badges={
          <>
            <span className="px-2.5 py-0.5 bg-orchestras-fg/10 text-orchestras-fg rounded-full text-xs font-medium">
              {orchestra?.type || 'תזמורת'}
            </span>
            <span className="px-2.5 py-0.5 bg-orchestras-fg/10 text-orchestras-fg rounded-full text-xs font-medium">
              {orchestra?.memberIds?.length || 0} חברים
            </span>
          </>
        }
      >
        {/* Tab bar — attached inside the identity block, no gap */}
        <nav className="flex gap-6" aria-label="Orchestra tabs">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'personal'
                ? 'text-foreground font-semibold border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <InfoIcon className="h-4 w-4" />
            פרטי תזמורת
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'text-foreground font-semibold border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <UsersIcon className="h-4 w-4" />
            חברי תזמורת
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
        </nav>
      </DetailPageHeader>

      {/* Tab content — continuous document, no card wrapper */}
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
    </div>
  )
}

export default OrchestraDetailsPage
