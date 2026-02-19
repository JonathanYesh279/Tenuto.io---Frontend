import { useState, useEffect } from 'react'
import { ClockIcon, ArrowsClockwiseIcon, WarningCircleIcon, MoonIcon, UsersIcon, GraduationCapIcon, MusicNotesIcon, CalendarCheckIcon } from '@phosphor-icons/react'
import apiService, { hoursSummaryService } from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'
import { useAuth } from '../services/authContext.jsx'
import { getDisplayName } from '../utils/nameUtils'
import ConductorDashboard from '../components/dashboard/ConductorDashboard'
import TeacherDashboard from '../components/dashboard/TeacherDashboard'
import TheoryTeacherDashboard from '../components/dashboard/TheoryTeacherDashboard'
import SuperAdminDashboard from '../components/dashboard/SuperAdminDashboard'
import { StatCard } from '../components/dashboard/v4/StatCard'
import { FinancialTrendsChart } from '../components/dashboard/v4/FinancialTrendsChart'
import { AttendanceBarChart } from '../components/dashboard/v4/AttendanceBarChart'
import { StudentDemographicsChart } from '../components/dashboard/v4/StudentDemographicsChart'
import { TeacherPerformanceTable } from '../components/dashboard/v4/TeacherPerformanceTable'
import { CalendarWidget } from '../components/dashboard/v4/CalendarWidget'
import { AgendaWidget } from '../components/dashboard/v4/AgendaWidget'
import { MessagesWidget } from '../components/dashboard/v4/MessagesWidget'

interface TeacherHoursSummary {
  teacherId: string
  teacherName: string
  totals: {
    totalWeeklyHours: number
    individualLessons: number
    orchestraConducting: number
    theoryTeaching: number
    management: number
  }
  calculatedAt: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const { currentSchoolYear } = useSchoolYear()
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [stats, setStats] = useState({
    activeStudents: 0,
    totalStudents: 0,
    staffMembers: 0,
    activeOrchestras: 0,
    weeklyRehearsals: 0,
    studentsTrend: 0,
    activeBagruts: 0,
    theoryLessonsThisWeek: 0,
    genderStats: { male: 0, female: 0 }
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [hoursSummaries, setHoursSummaries] = useState<TeacherHoursSummary[]>([])
  const [hoursLoading, setHoursLoading] = useState(false)
  const [hoursError, setHoursError] = useState<string | null>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [teacherTableData, setTeacherTableData] = useState<any[]>([])
  const [agendaData, setAgendaData] = useState<any[]>([])

  // Dark mode initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [currentSchoolYear])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const filters = currentSchoolYear ? { schoolYearId: currentSchoolYear._id } : {}

      // Load all data in parallel
      const [students, teachers, orchestras, rehearsals, theoryLessons, bagruts] = await Promise.allSettled([
        apiService.students.getStudents(filters),
        apiService.teachers.getTeachers(filters),
        apiService.orchestras.getOrchestras(filters),
        apiService.rehearsals.getRehearsals(filters),
        apiService.theory.getTheoryLessons(filters),
        apiService.bagrut.getBagruts()
      ])

      const studentsData = students.status === 'fulfilled' ? (Array.isArray(students.value) ? students.value : []) : []
      const teachersData = teachers.status === 'fulfilled' ? (Array.isArray(teachers.value) ? teachers.value : []) : []
      const orchestrasData = orchestras.status === 'fulfilled' ? (Array.isArray(orchestras.value) ? orchestras.value : []) : []
      const rehearsalsData = rehearsals.status === 'fulfilled' ? (Array.isArray(rehearsals.value) ? rehearsals.value : []) : []
      const theoryData = theoryLessons.status === 'fulfilled' ? (Array.isArray(theoryLessons.value) ? theoryLessons.value : []) : []
      const bagrutsData = bagruts.status === 'fulfilled' ? (Array.isArray(bagruts.value) ? bagruts.value : []) : []

      console.log('Dashboard data loaded:', {
        students: studentsData.length,
        teachers: teachersData.length,
        orchestras: orchestrasData.length,
        rehearsals: rehearsalsData.length,
        theory: theoryData.length,
        bagruts: bagrutsData.length
      })

      // Calculate stats
      const activeStudents = studentsData.filter((s: any) => s.isActive !== false).length
      const totalStudents = studentsData.length
      const activeTeachers = teachersData.filter((t: any) => t.isActive !== false).length
      const activeOrchestras = orchestrasData.filter((o: any) => o.isActive !== false).length

      // Calculate weekly rehearsals
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const weeklyRehearsals = rehearsalsData.filter((r: any) => {
        if (!r.date) return false
        const date = new Date(r.date)
        return date >= weekStart && date < weekEnd
      }).length

      const weeklyTheory = theoryData.filter((t: any) => {
        if (!t.date) return false
        const date = new Date(t.date)
        return date >= weekStart && date < weekEnd
      }).length

      // Calculate trend (new students this month)
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const newThisMonth = studentsData.filter((s: any) =>
        s.createdAt && new Date(s.createdAt) >= monthStart
      ).length
      const studentsTrend = activeStudents > 0 ? Math.round((newThisMonth / activeStudents) * 100) : 0

      // Active bagruts
      const activeBagruts = bagrutsData.filter((b: any) => !b.isCompleted && b.isActive !== false).length

      // Calculate gender stats
      const maleCount = studentsData.filter((s: any) =>
        s.personalInfo?.gender === 'male' ||
        s.personalInfo?.gender === 'זכר'
      ).length
      const femaleCount = studentsData.filter((s: any) =>
        s.personalInfo?.gender === 'female' ||
        s.personalInfo?.gender === 'נקבה'
      ).length

      setStats({
        activeStudents,
        totalStudents,
        staffMembers: activeTeachers,
        activeOrchestras,
        weeklyRehearsals,
        studentsTrend,
        activeBagruts,
        theoryLessonsThisWeek: weeklyTheory,
        genderStats: { male: maleCount, female: femaleCount }
      })

      // Generate recent activities
      const activities: any[] = []

      // Recent students
      const recentStudents = [...studentsData]
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 3)

      recentStudents.forEach((student: any) => {
        activities.push({
          type: 'student',
          title: 'רישום תלמיד חדש',
          description: `${getDisplayName(student.personalInfo) || 'תלמיד'} נרשם לקונסרבטוריון`,
          time: getRelativeTime(student.createdAt),
          color: 'primary'
        })
      })

      // Upcoming rehearsals — enrich with orchestra name
      const upcomingRehearsals = rehearsalsData
        .filter((r: any) => new Date(r.date) >= today)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3)

      // Build a lookup map for orchestra names
      const orchestraNameMap = new Map<string, string>()
      orchestrasData.forEach((o: any) => orchestraNameMap.set(o._id, o.name))

      upcomingRehearsals.forEach((rehearsal: any) => {
        const orchName = orchestraNameMap.get(rehearsal.groupId) || rehearsal.orchestraName || 'תזמורת'
        activities.push({
          type: 'rehearsal',
          title: 'חזרה מתוכננת',
          description: `${orchName} - ${formatDate(rehearsal.date)} ${rehearsal.startTime || ''}`,
          time: getRelativeTime(rehearsal.createdAt),
          color: 'success'
        })
      })

      setRecentActivities(activities.slice(0, 6))

      // Generate upcoming events
      const events: any[] = upcomingRehearsals.slice(0, 4).map((rehearsal: any) => ({
        title: orchestraNameMap.get(rehearsal.groupId) || rehearsal.orchestraName || 'חזרת תזמורת',
        date: formatDate(rehearsal.date),
        description: `${rehearsal.type || 'חזרה'} - ${rehearsal.location || 'אולם ראשי'}`,
        isPrimary: false
      }))

      setUpcomingEvents(events)
      setLastRefresh(new Date())

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadDashboardData()
  }

  const getRelativeTime = (date: string | Date) => {
    if (!date) return 'לאחרונה'
    const now = new Date()
    const then = new Date(date)
    const diff = now.getTime() - then.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `לפני ${minutes} דקות`
    if (hours < 24) return `לפני ${hours} שעות`
    if (days < 7) return `לפני ${days} ימים`
    return 'השבוע'
  }

  const formatDate = (date: string | Date) => {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  const getUserRole = () => {
    if (!user) return 'admin'

    if (user.role === 'admin' || user.roles?.includes('admin') ||
        user.role === 'מנהל' || user.roles?.includes('מנהל')) {
      return 'admin'
    }

    if (user.role === 'theory-teacher' || user.roles?.includes('theory-teacher') ||
        user.roles?.includes('theory_teacher') || user.role === 'מורה תיאוריה' ||
        user.roles?.includes('מורה תיאוריה')) {
      return 'theory-teacher'
    }

    if (user.role === 'conductor' || user.roles?.includes('conductor') ||
        user.role === 'מנצח' || user.roles?.includes('מנצח') ||
        user.conducting?.orchestraIds?.length > 0) {
      return 'conductor'
    }

    if (user.role === 'teacher' || user.roles?.includes('teacher') ||
        user.role === 'מורה' || user.roles?.includes('מורה')) {
      return 'teacher'
    }

    return 'admin'
  }

  const userRole = getUserRole()

  const getTimeGreeting = (): string => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'בוקר טוב'
    if (hour >= 12 && hour < 17) return 'צהריים טובים'
    if (hour >= 17 && hour < 21) return 'ערב טוב'
    return 'לילה טוב'
  }

  const userFirstName = user?.personalInfo?.firstName
    || getDisplayName(user?.personalInfo)?.split(' ')[0]
    || 'מנהל'

  // Super admin gets a dedicated dashboard (can't use regular tenant-scoped APIs)
  if (user?.isSuperAdmin) {
    return <SuperAdminDashboard />
  }

  // Role-specific dashboards
  if (userRole === 'theory-teacher') {
    return <TheoryTeacherDashboard />
  }

  if (userRole === 'conductor') {
    return <ConductorDashboard />
  }

  if (userRole === 'teacher') {
    return <TeacherDashboard />
  }

  // Admin Dashboard — v4.0 Visual Redesign
  return (
    <div dir="rtl">
      <div className="grid grid-cols-12 gap-8">
        {/* Main content — 9 columns */}
        <div className="col-span-12 lg:col-span-9 space-y-8">

          {/* Stat cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              entity="students"
              value={stats.activeStudents}
              label="תלמידים פעילים"
              trend={stats.studentsTrend > 0 ? `+${stats.studentsTrend}%` : undefined}
              icon={<UsersIcon size={28} weight="duotone" />}
              loading={loading}
            />
            <StatCard
              entity="teachers"
              value={stats.staffMembers}
              label="סגל הוראה"
              icon={<GraduationCapIcon size={28} weight="duotone" />}
              loading={loading}
            />
            <StatCard
              entity="orchestras"
              value={stats.activeOrchestras}
              label="הרכבים פעילים"
              icon={<MusicNotesIcon size={28} weight="duotone" />}
              loading={loading}
            />
            <StatCard
              entity="rehearsals"
              value={stats.weeklyRehearsals}
              label="חזרות שבועיות"
              trend="שבועי"
              icon={<CalendarCheckIcon size={28} weight="duotone" />}
              loading={loading}
            />
          </div>

          {/* Financial trends chart — full width */}
          <FinancialTrendsChart />

          {/* Charts section — 2 columns */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Attendance chart */}
            <AttendanceBarChart />
            {/* Demographics chart */}
            <StudentDemographicsChart
              genderStats={stats.genderStats}
              totalStudents={stats.totalStudents}
              loading={loading}
            />
          </div>

          {/* Teacher performance table placeholder (Plan 05) */}
          <div id="teacher-table-slot" className="bg-white dark:bg-sidebar-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[200px] flex items-center justify-center text-slate-400">
            <span className="text-sm p-8">ביצועי מורים — טוען...</span>
          </div>
        </div>

        {/* Right sidebar — 3 columns */}
        <div className="col-span-12 lg:col-span-3 space-y-8">
          {/* Calendar widget placeholder (Plan 05) */}
          <div className="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[200px] flex items-center justify-center text-slate-400">
            <span className="text-sm">לוח שנה</span>
          </div>
          {/* Agenda widget placeholder (Plan 05) */}
          <div className="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[200px] flex items-center justify-center text-slate-400">
            <span className="text-sm">סדר יום</span>
          </div>
          {/* Messages widget placeholder (Plan 05) */}
          <div className="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[200px] flex items-center justify-center text-slate-400">
            <span className="text-sm">הודעות</span>
          </div>
        </div>
      </div>

      {/* Dark mode FAB toggle */}
      <button
        onClick={() => {
          document.documentElement.classList.toggle('dark')
          localStorage.setItem('theme',
            document.documentElement.classList.contains('dark') ? 'dark' : 'light'
          )
        }}
        className="fixed bottom-6 left-6 w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
        aria-label="Toggle dark mode"
      >
        <MoonIcon weight="fill" className="text-primary dark:text-amber-400" size={20} />
      </button>
    </div>
  )
}

function AdminHoursOverview({
  hoursSummaries,
  loading,
  error,
  isRecalculating,
  onLoad,
  onRecalculateAll
}: {
  hoursSummaries: TeacherHoursSummary[]
  loading: boolean
  error: string | null
  isRecalculating: boolean
  onLoad: () => void
  onRecalculateAll: () => void
}) {
  useEffect(() => {
    if (hoursSummaries.length === 0 && !loading && !error) {
      onLoad()
    }
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        טוען נתוני שעות...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <WarningCircleIcon size={48} weight="fill" className="text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">שגיאה בטעינת נתוני שעות</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={onLoad}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
        >
          <ArrowsClockwiseIcon size={16} weight="regular" />
          נסה שוב
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">שעות שבועיות — כל המורים</span>
        <button
          onClick={onRecalculateAll}
          disabled={isRecalculating}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-muted text-foreground border border-border rounded hover:bg-muted/80 disabled:opacity-50"
        >
          <ArrowsClockwiseIcon size={16} weight="regular" className={isRecalculating ? 'animate-spin' : ''} />
          {isRecalculating ? 'מחשב...' : 'חשב מחדש הכל'}
        </button>
      </div>

      {hoursSummaries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClockIcon size={48} weight="regular" className="mx-auto mb-3 text-muted-foreground/40" />
          <p>לא נמצאו נתוני שעות. לחץ "חשב מחדש הכל" ליצירת חישוב ראשוני.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">מורה</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">סה"כ ש"ש</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">פרטניים</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">תזמורות</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">תיאוריה</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">ניהול</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {hoursSummaries.map((summary) => (
                <tr key={summary.teacherId} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-foreground font-medium">{summary.teacherName}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-sm font-bold bg-muted text-foreground">
                      {summary.totals.totalWeeklyHours}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{summary.totals.individualLessons}</td>
                  <td className="px-4 py-3 text-muted-foreground">{summary.totals.orchestraConducting}</td>
                  <td className="px-4 py-3 text-muted-foreground">{summary.totals.theoryTeaching}</td>
                  <td className="px-4 py-3 text-muted-foreground">{summary.totals.management}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
