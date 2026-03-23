/**
 * Teacher Details Page - Dashboard + Tabs Hybrid
 *
 * Renders animated tabs with:
 *   - Dashboard (default): 3-column grid with profile, stats, students list
 *   - Personal Info: contact & professional details
 *   - Student Management: assigned students
 *   - Schedule: weekly calendar
 *   - Conducting: orchestra assignments (conditional)
 *   - Hours: weekly hours breakdown
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from '@/components/ui/animated-tabs'
import { Spinner } from '@heroui/react'
import {
  ArrowRight as ArrowRightIcon,
  ArrowsClockwise as ArrowsClockwiseIcon,
  SquaresFour as SquaresFourIcon,
  User as UserIcon,
  Users as UsersIcon,
  CalendarBlank as CalendarIcon,
  MusicNotes as MusicNotesIcon,
  Clock as ClockIcon,
  Notebook as NotebookIcon,
} from '@phosphor-icons/react'

import { TeacherDashboardView } from './dashboard/TeacherDashboardView'
import { useTeacherDashboardData } from '../hooks/useTeacherDashboardData'
import PersonalInfoTab from './tabs/PersonalInfoTab'
import StudentManagementTab from './tabs/StudentManagementTab'
import ScheduleTab from './tabs/ScheduleTab'
import ConductingTab from './tabs/ConductingTab'
import HoursSummaryTab from './tabs/HoursSummaryTab'
import TeachingDaysTab from './tabs/TeachingDaysTab'
import apiService from '../../../../services/apiService'
import { getDisplayName } from '../../../../utils/nameUtils'

const TeacherDetailsPage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [teacher, setTeacher] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handler to update teacher data without page reload
  const handleTeacherUpdate = (updatedTeacher: any) => {
    setTeacher(updatedTeacher)
  }

  // Validate teacherId parameter
  if (!teacherId || teacherId.trim() === '') {
    return <Navigate to="/teachers" replace />
  }

  // Dashboard data hook
  const dashboardData = useTeacherDashboardData(teacherId, teacher)

  // Fetch teacher data
  const fetchTeacher = useCallback(async () => {
    if (!teacherId) return
    try {
      setIsLoading(true)
      setError(null)
      const teacherData = await apiService.teachers.getTeacherById(teacherId)
      setTeacher(teacherData)
    } catch (err: any) {
      console.error('Error fetching teacher:', err)
      setError(err.message || 'שגיאה בטעינת נתוני המורה')
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    fetchTeacher()
  }, [fetchTeacher])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner color="primary" label="טוען פרטי מורה..." />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">שגיאה בטעינת הנתונים</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
          >
            <ArrowsClockwiseIcon className="w-4 h-4" />
            נסה שוב
          </button>
          <button
            onClick={() => navigate('/teachers')}
            className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded hover:bg-muted transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4" />
            חזור לרשימת מורים
          </button>
        </div>
      </div>
    )
  }

  // No teacher found
  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">מורה לא נמצא</h1>
        <p className="text-gray-600 mb-6">לא נמצאו פרטים עבור המורה המבוקש</p>
        <button
          onClick={() => navigate('/teachers')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
        >
          <ArrowRightIcon className="w-4 h-4" />
          חזור לרשימת מורים
        </button>
      </div>
    )
  }

  // Derived: show conducting tab only if teacher conducts
  const showConductingTab =
    teacher?.conducting?.orchestraIds?.length > 0 ||
    teacher?.conducting?.ensemblesIds?.length > 0 ||
    teacher?.ensemblesIds?.length > 0 ||
    teacher?.roles?.includes('מנצח')

  // Build tab config dynamically
  const TAB_CONFIG = [
    { key: 'dashboard', label: 'סקירה כללית', icon: SquaresFourIcon },
    { key: 'personal', label: 'מידע אישי', icon: UserIcon },
    { key: 'students', label: 'ניהול תלמידים', icon: UsersIcon },
    { key: 'teaching-days', label: 'ימי לימוד', icon: NotebookIcon },
    { key: 'schedule', label: 'לוח זמנים', icon: CalendarIcon },
    ...(showConductingTab ? [{ key: 'conducting', label: 'ניצוח', icon: MusicNotesIcon }] : []),
    { key: 'hours', label: 'שעות שבועיות', icon: ClockIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Animated tabs: dashboard + existing tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-auto inline-flex gap-1 mr-auto">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="flex-none font-bold text-xs px-2.5 py-1">
              <span className="flex items-center gap-1.5">
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContents>
          <TabsContent value="dashboard">
            <TeacherDashboardView
              teacher={teacher}
              teacherId={teacherId}
              dashboardData={dashboardData}
              onTeacherUpdate={handleTeacherUpdate}
            />
          </TabsContent>
          <TabsContent value="personal">
            <PersonalInfoTab teacher={teacher} teacherId={teacherId} />
          </TabsContent>
          <TabsContent value="students">
            <StudentManagementTab teacher={teacher} teacherId={teacherId} />
          </TabsContent>
          <TabsContent value="teaching-days">
            <TeachingDaysTab teacher={teacher} teacherId={teacherId} />
          </TabsContent>
          <TabsContent value="schedule">
            <ScheduleTab teacher={teacher} teacherId={teacherId} />
          </TabsContent>
          {showConductingTab && (
            <TabsContent value="conducting">
              <ConductingTab teacher={teacher} teacherId={teacherId} />
            </TabsContent>
          )}
          <TabsContent value="hours">
            <HoursSummaryTab teacher={teacher} teacherId={teacherId} />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  )
}

export default TeacherDetailsPage
