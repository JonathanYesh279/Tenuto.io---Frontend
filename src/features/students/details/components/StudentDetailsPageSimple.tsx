/**
 * Student Details Page - Dashboard + Tabs Hybrid
 *
 * Renders a gradient header, then HeroUI Tabs with:
 *   - Dashboard (default): 3-column grid with profile, charts, enrollment table
 *   - Schedule: weekly calendar grid
 *   - Bagrut: grading system
 *   - Orchestras: enrollment management
 *   - Theory: theory lesson enrollment
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { Tabs, Tab } from '@heroui/react'
import { DetailPageHeader } from '@/components/domain'
import {
  ArrowRight as ArrowRightIcon,
  ArrowsClockwise as ArrowsClockwiseIcon,
  BookOpen as BookOpenIcon,
  CalendarBlank as CalendarIcon,
  GraduationCap as GraduationCapIcon,
  MusicNotes as MusicNotesIcon,
  SquaresFour as SquaresFourIcon,
} from '@phosphor-icons/react'

import { StudentDashboardView } from './dashboard/StudentDashboardView'
import { useStudentDashboardData } from '../hooks/useStudentDashboardData'
import ScheduleTab from './tabs/ScheduleTab'
import OrchestraTab from './tabs/OrchestraTab'
import TheoryTabOptimized from './tabs/TheoryTabOptimized'
import BagrutTab from './tabs/BagrutTab'
import apiService from '../../../../services/apiService'

const TAB_CONFIG = [
  { key: 'dashboard', label: 'סקירה כללית', icon: SquaresFourIcon },
  { key: 'schedule', label: 'לוח זמנים', icon: CalendarIcon },
  { key: 'bagrut', label: 'בגרות', icon: GraduationCapIcon },
  { key: 'orchestra', label: 'תזמורות', icon: MusicNotesIcon },
  { key: 'theory', label: 'תאוריה', icon: BookOpenIcon },
]

const StudentDetailsPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handler to update student data without page reload
  const handleStudentUpdate = (updatedStudent: any) => {
    setStudent(updatedStudent)
  }

  // Validate studentId parameter
  if (!studentId || studentId.trim() === '') {
    return <Navigate to="/students" replace />
  }

  // Dashboard data hook (aggregates attendance, orchestras, theory, teachers)
  const dashboardData = useStudentDashboardData(studentId, student)

  // Derive primary instrument from student data
  const primaryInstrument = useMemo(() => {
    const instruments = student?.academicInfo?.instrumentProgress || []
    const primary = instruments.find((i: any) => i.isPrimary)
    return primary?.instrumentName || instruments[0]?.instrumentName || null
  }, [student?.academicInfo?.instrumentProgress])

  // Fetch student data
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await apiService.students.getStudentById(studentId)
        setStudent(response)
      } catch (err: any) {
        console.error('Error fetching student:', err)
        setError(err.message || 'Failed to load student data')
      } finally {
        setIsLoading(false)
      }
    }

    if (studentId) {
      fetchStudent()
    }
  }, [studentId])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <ArrowsClockwiseIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <div className="text-lg text-gray-600">טוען פרטי תלמיד...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">שגיאה בטעינת הנתונים</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
        >
          <ArrowsClockwiseIcon className="w-4 h-4" />
          נסה שוב
        </button>
      </div>
    )
  }

  // No student found
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">תלמיד לא נמצא</h1>
        <p className="text-gray-600 mb-6">לא נמצאו פרטים עבור התלמיד המבוקש</p>
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
        >
          <ArrowRightIcon className="w-4 h-4" />
          חזור לרשימת התלמידים
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gradient header with breadcrumb, avatar, badges, updatedAt */}
      <DetailPageHeader
        firstName={student?.personalInfo?.firstName}
        lastName={student?.personalInfo?.lastName}
        fullName={student?.personalInfo?.fullName}
        entityType="תלמיד"
        breadcrumbLabel="תלמידים"
        breadcrumbHref="/students"
        updatedAt={student?.updatedAt}
        badges={
          <>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {student?.isActive ? 'פעיל' : 'לא פעיל'}
            </span>
            {primaryInstrument && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {primaryInstrument}
              </span>
            )}
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              כיתה {student?.academicInfo?.class || '-'}
            </span>
          </>
        }
      />

      {/* HeroUI Tabs: dashboard + 4 surviving tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        variant="underlined"
        classNames={{
          tabList: 'border-b border-border bg-white rounded-t-card px-4',
          panel: 'p-0',
        }}
      >
        {TAB_CONFIG.map((tab) => (
          <Tab
            key={tab.key}
            title={
              <span className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </span>
            }
          >
            {tab.key === 'dashboard' && (
              <StudentDashboardView
                student={student}
                studentId={studentId}
                dashboardData={dashboardData}
                onStudentUpdate={handleStudentUpdate}
              />
            )}
            {tab.key === 'schedule' && (
              <ScheduleTab student={student} studentId={studentId} isLoading={false} />
            )}
            {tab.key === 'bagrut' && (
              <BagrutTab student={student} studentId={studentId} />
            )}
            {tab.key === 'orchestra' && (
              <OrchestraTab student={student} studentId={studentId} isLoading={false} />
            )}
            {tab.key === 'theory' && (
              <TheoryTabOptimized student={student} studentId={studentId} />
            )}
          </Tab>
        ))}
      </Tabs>
    </div>
  )
}

export default StudentDetailsPage
