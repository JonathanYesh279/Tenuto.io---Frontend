import { useState, useEffect } from 'react'
import { Clock, RefreshCw, AlertCircle } from 'lucide-react'
import apiService, { hoursSummaryService } from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'
import { useAuth } from '../services/authContext.jsx'
import { getDisplayName } from '../utils/nameUtils'
import ConductorDashboard from '../components/dashboard/ConductorDashboard'
import TeacherDashboard from '../components/dashboard/TeacherDashboard'
import TheoryTeacherDashboard from '../components/dashboard/TheoryTeacherDashboard'
import SuperAdminDashboard from '../components/dashboard/SuperAdminDashboard'
import { MiniCalendarWidget, UpcomingEventsWidget, RecentActivityWidget } from '../components/dashboard/widgets'
import {
  StudentActivityCharts,
  InstrumentDistributionChart,
  ClassDistributionChart,
  BagrutProgressDashboard,
  DailyTeacherRoomTable
} from '../components/dashboard/charts'

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
    theoryLessonsThisWeek: 0
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [hoursSummaries, setHoursSummaries] = useState<TeacherHoursSummary[]>([])
  const [hoursLoading, setHoursLoading] = useState(false)
  const [hoursError, setHoursError] = useState<string | null>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)

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

      setStats({
        activeStudents,
        totalStudents,
        staffMembers: activeTeachers,
        activeOrchestras,
        weeklyRehearsals,
        studentsTrend,
        activeBagruts,
        theoryLessonsThisWeek: weeklyTheory
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

  // Admin — Command Center Dashboard
  return (
    <div dir="rtl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getTimeGreeting()}, {userFirstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentSchoolYear?.name || 'שנת לימודים נוכחית'} |
            עדכון אחרון: {lastRefresh.toLocaleTimeString('he-IL')}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-card border border-border rounded hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          רענן נתונים
        </button>
      </div>

      {/* DOMINANT ZONE — primary metric 2fr, secondary stack 1fr */}
      <div className="grid grid-cols-[2fr_1fr] gap-8 mb-10 pb-10 border-b border-border">
        {/* PRIMARY metric — the ONE number that matters most */}
        <div className="py-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">תלמידים פעילים</span>
          <div className="text-7xl font-bold text-foreground mt-2 tabular-nums leading-none">
            {loading ? '—' : stats.activeStudents}
          </div>
          <span className="text-sm text-muted-foreground mt-3 block">
            מתוך {loading ? '—' : stats.totalStudents} רשומים
            {stats.studentsTrend > 0 && !loading && (
              <span className="mr-2 text-xs text-foreground/60">+{stats.studentsTrend}% החודש</span>
            )}
          </span>
        </div>

        {/* SECONDARY metrics — stacked, clearly smaller */}
        <div className="flex flex-col justify-center gap-5 py-4 border-r border-border pr-8">
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">מורים פעילים</span>
            <div className="text-3xl font-semibold text-foreground tabular-nums">
              {loading ? '—' : stats.staffMembers}
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">הרכבים פעילים</span>
            <div className="text-3xl font-semibold text-foreground tabular-nums">
              {loading ? '—' : stats.activeOrchestras}
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">חזרות השבוע</span>
            <div className="text-3xl font-semibold text-foreground tabular-nums">
              {loading ? '—' : stats.weeklyRehearsals}
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">בגרויות פעילות</span>
            <div className="text-3xl font-semibold text-foreground tabular-nums">
              {loading ? '—' : stats.activeBagruts}
            </div>
          </div>
        </div>
      </div>

      {/* OPERATIONAL PANELS — 3:2 asymmetric split */}
      <div className="grid grid-cols-[3fr_2fr] gap-8 mb-10">
        {/* Primary operational panel: daily schedule table */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">מערכת יומית</h2>
          <DailyTeacherRoomTable />
        </div>

        {/* Secondary panel: widgets stack */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">אירועים קרובים</h2>
            <UpcomingEventsWidget events={upcomingEvents} loading={loading} />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">פעילות אחרונה</h2>
            <RecentActivityWidget activities={recentActivities} loading={loading} />
          </div>
          <div>
            <MiniCalendarWidget />
          </div>
        </div>
      </div>

      {/* TERTIARY — charts at bottom, lower visual weight */}
      <div className="border-t border-border pt-8 mb-10">
        <h2 className="text-xs font-semibold text-muted-foreground mb-6 uppercase tracking-wider">נתונים וניתוח</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InstrumentDistributionChart
            schoolYearId={currentSchoolYear?._id}
            maxItems={8}
          />
          <ClassDistributionChart
            schoolYearId={currentSchoolYear?._id}
          />
        </div>
      </div>

      {/* SECONDARY SECTIONS — below-fold content, accessible without tabs */}
      <div className="border-t border-border pt-8 mb-10">
        <h2 className="text-xs font-semibold text-muted-foreground mb-6 uppercase tracking-wider">ניתוח תלמידים</h2>
        <StudentActivityCharts schoolYearId={currentSchoolYear?._id} />
      </div>

      <div className="border-t border-border pt-8 mb-10">
        <h2 className="text-xs font-semibold text-muted-foreground mb-6 uppercase tracking-wider">בגרויות</h2>
        <BagrutProgressDashboard schoolYearId={currentSchoolYear?._id} />
      </div>

      <div className="border-t border-border pt-8">
        <h2 className="text-xs font-semibold text-muted-foreground mb-6 uppercase tracking-wider">שעות מורים</h2>
        <AdminHoursOverview
          hoursSummaries={hoursSummaries}
          loading={hoursLoading}
          error={hoursError}
          isRecalculating={isRecalculating}
          onLoad={async () => {
            try {
              setHoursLoading(true)
              setHoursError(null)
              const data = await hoursSummaryService.getAllSummaries()
              setHoursSummaries(Array.isArray(data) ? data : data?.data || [])
            } catch (err: any) {
              setHoursError(err.message || 'שגיאה בטעינת נתוני שעות')
            } finally {
              setHoursLoading(false)
            }
          }}
          onRecalculateAll={async () => {
            if (!window.confirm('האם לחשב מחדש את השעות עבור כל המורים? פעולה זו עשויה לקחת מספר שניות.')) return
            try {
              setIsRecalculating(true)
              await hoursSummaryService.calculateAll()
              const data = await hoursSummaryService.getAllSummaries()
              setHoursSummaries(Array.isArray(data) ? data : data?.data || [])
            } catch (err: any) {
              setHoursError(err.message || 'שגיאה בחישוב מחדש')
            } finally {
              setIsRecalculating(false)
            }
          }}
        />
      </div>
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
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">שגיאה בטעינת נתוני שעות</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={onLoad}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800"
        >
          <RefreshCw className="w-4 h-4" />
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
          <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
          {isRecalculating ? 'מחשב...' : 'חשב מחדש הכל'}
        </button>
      </div>

      {hoursSummaries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
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
