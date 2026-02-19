/**
 * Teacher Details Page - Main Container Component
 *
 * Handles route parameters, data fetching, error boundaries,
 * and coordinates all child components for the teacher details view.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRightIcon, ArrowClockwiseIcon, UserIcon, UsersIcon, CalendarIcon, MusicNotesIcon, ClockIcon } from '@phosphor-icons/react'
import { TeacherTabType } from '../types'
import { DetailPageHeader } from '@/components/domain'
import { AnimatePresence, motion } from 'framer-motion'
import PersonalInfoTab from './tabs/PersonalInfoTab'
import StudentManagementTab from './tabs/StudentManagementTab'
import ScheduleTab from './tabs/ScheduleTab'
import ConductingTab from './tabs/ConductingTab'
import HoursSummaryTab from './tabs/HoursSummaryTab'
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
        <h1 className="text-2xl font-bold text-foreground mb-2">מורה לא נמצא</h1>
        <p className="text-muted-foreground mb-6">
          המורה שביקשת לא נמצא במערכת או שאין לך הרשאה לצפות בו
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/teachers')}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4 ml-2" />
            חזור לרשימת מורים
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
          אין לך הרשאה לצפות בפרטי מורה זה
        </p>
        <button
          onClick={() => navigate('/teachers')}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
        >
          <ArrowRightIcon className="w-4 h-4 ml-2" />
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
            onClick={() => navigate('/teachers')}
            className="flex items-center px-4 py-2 border border-border text-foreground rounded hover:bg-muted transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4 ml-2" />
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">טוען פרטי מורה...</div>
        </div>
      </div>
    )
  }

  // Derived: show conducting tab only if teacher conducts
  const showConductingTab =
    teacher?.conducting?.orchestraIds?.length > 0 ||
    (teacher as any)?.conducting?.ensemblesIds?.length > 0 ||
    teacher?.ensemblesIds?.length > 0 ||
    teacher?.roles?.includes('מנצח')

  return (
    <div className="min-h-screen bg-background teacher-details-container teacher-content-area">

      {/* Identity block with attached tab bar — Dossier archetype */}
      <DetailPageHeader
        firstName={teacher?.personalInfo?.firstName}
        lastName={teacher?.personalInfo?.lastName}
        fullName={teacher?.personalInfo?.fullName}
        entityType="מורה"
        entityColor="teachers"
        breadcrumbLabel="מורים"
        breadcrumbHref="/teachers"
        updatedAt={teacher?.updatedAt}
        badges={
          <>
            <span className="px-2.5 py-0.5 bg-teachers-fg/10 text-teachers-fg rounded-full text-xs font-medium">
              {teacher?.professionalInfo?.instrument || 'ללא כלי'}
            </span>
            {teacher?.roles?.map((role: string) => (
              <span key={role} className="px-2.5 py-0.5 bg-teachers-fg/10 text-teachers-fg rounded-full text-xs font-medium">
                {role}
              </span>
            ))}
          </>
        }
      >
        {/* Tab bar — attached inside the identity block, no gap */}
        <nav className="flex gap-6 overflow-x-auto" aria-label="Teacher tabs">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'personal'
                ? 'text-foreground font-semibold border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            מידע אישי
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'text-foreground font-semibold border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <UsersIcon className="h-4 w-4" />
            ניהול תלמידים
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
          {showConductingTab && (
            <button
              onClick={() => setActiveTab('conducting')}
              className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'conducting'
                  ? 'text-foreground font-semibold border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <MusicNotesIcon className="h-4 w-4" />
              ניצוח
            </button>
          )}
          <button
            onClick={() => setActiveTab('hours')}
            className={`flex items-center gap-2 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'hours'
                ? 'text-foreground font-semibold border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <ClockIcon className="h-4 w-4" />
            שעות שבועיות
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
            <PersonalInfoTab teacher={teacher} teacherId={teacherId} />
          )}
          {activeTab === 'students' && (
            <StudentManagementTab teacher={teacher} teacherId={teacherId} />
          )}
          {activeTab === 'schedule' && (
            <ScheduleTab teacher={teacher} teacherId={teacherId} />
          )}
          {activeTab === 'conducting' && showConductingTab && (
            <ConductingTab teacher={teacher} teacherId={teacherId} />
          )}
          {activeTab === 'hours' && (
            <HoursSummaryTab teacher={teacher} teacherId={teacherId} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default TeacherDetailsPage
