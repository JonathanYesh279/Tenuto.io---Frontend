import { useState, useEffect } from 'react'
import { ClockIcon, ArrowsClockwiseIcon, WarningCircleIcon, MoonIcon } from '@phosphor-icons/react'
import apiService, { hoursSummaryService } from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'
import { useAuth } from '../services/authContext.jsx'
import { getDisplayName } from '../utils/nameUtils'
import ConductorDashboard from '../components/dashboard/ConductorDashboard'
import TeacherDashboard from '../components/dashboard/TeacherDashboard'
import TheoryTeacherDashboard from '../components/dashboard/TheoryTeacherDashboard'
import SuperAdminDashboard from '../components/dashboard/SuperAdminDashboard'
import { StatCard } from '../components/dashboard/v4/StatCard'
import { TeacherPerformanceTable } from '../components/dashboard/v4/TeacherPerformanceTable'
import { AgendaWidget } from '../components/dashboard/v4/AgendaWidget'
import { MessagesWidget } from '../components/dashboard/v4/MessagesWidget'
import { ComboChart, TremorBarChart, TremorDonutChart, CategoryBar, Tracker } from '../components/charts'

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

const hebrewMonthNames: Record<string, string> = {
  '01': "ינו'", '02': "פבר'", '03': 'מרץ', '04': "אפר'",
  '05': 'מאי', '06': 'יוני', '07': 'יולי', '08': "אוג'",
  '09': "ספט'", '10': "אוק'", '11': "נוב'", '12': "דצמ'",
}

/** Chart card wrapper — consistent styling for all chart sections */
function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-sidebar-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 ${className}`}>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  )
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

  // New chart data state
  const [activityByDay, setActivityByDay] = useState<Array<Record<string, any>>>([])
  const [comboChartData, setComboChartData] = useState<Array<Record<string, any>>>([])
  const [instrumentDistribution, setInstrumentDistribution] = useState<Array<{ name: string; count: number }>>([])
  const [teacherWorkloads, setTeacherWorkloads] = useState<Array<{ name: string; individual: number; orchestra: number; theory: number; management: number }>>([])
  const [rehearsalHistory, setRehearsalHistory] = useState<Array<{ color?: string; tooltip?: string }>>([])
  const [sparkStudents, setSparkStudents] = useState<Array<Record<string, any>>>([])
  const [sparkTeachers, setSparkTeachers] = useState<Array<Record<string, any>>>([])
  const [sparkOrchestras, setSparkOrchestras] = useState<Array<Record<string, any>>>([])
  const [sparkRehearsals, setSparkRehearsals] = useState<Array<Record<string, any>>>([])

  // Dark mode initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    // Super admin uses a dedicated dashboard — skip tenant-scoped API calls
    if (user?.isSuperAdmin) return
    loadDashboardData()
  }, [currentSchoolYear, user?.isSuperAdmin])

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

      // Calculate stats
      const activeStudents = studentsData.filter((s: any) => s.isActive !== false).length
      const totalStudents = studentsData.length
      const activeTeachers = teachersData.filter((t: any) => t.isActive !== false).length
      const activeOrchestras = orchestrasData.filter((o: any) => o.isActive !== false).length

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

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const newThisMonth = studentsData.filter((s: any) =>
        s.createdAt && new Date(s.createdAt) >= monthStart
      ).length
      const studentsTrend = activeStudents > 0 ? Math.round((newThisMonth / activeStudents) * 100) : 0

      const activeBagruts = bagrutsData.filter((b: any) => !b.isCompleted && b.isActive !== false).length

      setStats({
        activeStudents,
        totalStudents,
        staffMembers: activeTeachers,
        activeOrchestras,
        weeklyRehearsals,
        studentsTrend,
        activeBagruts,
        theoryLessonsThisWeek: weeklyTheory,
        genderStats: { male: 0, female: 0 }
      })

      // ── Activities & events ──
      const activities: any[] = []
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

      const upcomingRehearsals = rehearsalsData
        .filter((r: any) => new Date(r.date) >= today)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3)

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

      setUpcomingEvents(upcomingRehearsals.slice(0, 4).map((rehearsal: any) => ({
        title: orchestraNameMap.get(rehearsal.groupId) || rehearsal.orchestraName || 'חזרת תזמורת',
        date: formatDate(rehearsal.date),
        description: `${rehearsal.type || 'חזרה'} - ${rehearsal.location || 'אולם ראשי'}`,
        isPrimary: false
      })))

      // Teacher table
      const teacherTable = teachersData.slice(0, 6).map((t: any) => ({
        id: t._id,
        name: getDisplayName(t.personalInfo) || 'מורה',
        department: t.professionalInfo?.instrument || t.teaching?.instruments?.[0] || '—',
        studentCount: t.teaching?.studentIds?.length || 0,
        rating: t.professionalInfo?.rating || null,
        isActive: t.isActive !== false,
        avatarUrl: t.personalInfo?.avatarUrl || null,
      }))
      setTeacherTableData(teacherTable)

      // Agenda
      const agenda = upcomingRehearsals.slice(0, 3).map((rehearsal: any) => ({
        time: rehearsal.startTime || '09:00',
        title: orchestraNameMap.get(rehearsal.groupId) || rehearsal.orchestraName || 'חזרת תזמורת',
        location: rehearsal.location || 'אולם ראשי',
        badge: rehearsal.type || 'חזרה',
      }))
      setAgendaData(agenda)

      // ── NEW: Activity by day — stacked rehearsals vs theory ──
      const hebrewDays = ["א'", "ב'", "ג'", "ד'", "ה'"]
      const rehearsalsByDay = [0, 0, 0, 0, 0]
      const theoryByDay = [0, 0, 0, 0, 0]

      rehearsalsData.forEach((r: any) => {
        if (!r.date) return
        const di = new Date(r.date).getDay()
        if (di >= 0 && di <= 4) rehearsalsByDay[di]++
      })
      theoryData.forEach((t: any) => {
        if (!t.date) return
        const di = new Date(t.date).getDay()
        if (di >= 0 && di <= 4) theoryByDay[di]++
      })

      setActivityByDay(
        hebrewDays.map((day, i) => ({
          day,
          rehearsals: rehearsalsByDay[i],
          theory: theoryByDay[i],
        }))
      )

      // ── NEW: Monthly combo chart data — registrations (bar) + cumulative (line) ──
      const monthMap = new Map<string, { registrations: number; activities: number }>()
      const allActivities = [...rehearsalsData, ...theoryData]

      studentsData.forEach((s: any) => {
        if (!s.createdAt) return
        const d = new Date(s.createdAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const entry = monthMap.get(key) || { registrations: 0, activities: 0 }
        entry.registrations++
        monthMap.set(key, entry)
      })

      allActivities.forEach((item: any) => {
        if (!item.date) return
        const d = new Date(item.date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const entry = monthMap.get(key) || { registrations: 0, activities: 0 }
        entry.activities++
        monthMap.set(key, entry)
      })

      const sortedMonths = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-10)
      let cumulative = 0
      const comboData = sortedMonths.map(([key, data]) => {
        cumulative += data.registrations
        return {
          month: hebrewMonthNames[key.split('-')[1]] || key,
          registrations: data.registrations,
          activities: data.activities,
          cumulative,
        }
      })
      setComboChartData(comboData)

      // ── NEW: Instrument distribution from students ──
      const instrumentCounts = new Map<string, number>()
      studentsData.forEach((s: any) => {
        // Primary instrument is in academicInfo.instrumentProgress[0].instrumentName
        const instrument = s.academicInfo?.instrumentProgress?.[0]?.instrumentName
          || s.academicInfo?.instrument
          || s.instrument
        if (instrument) {
          instrumentCounts.set(instrument, (instrumentCounts.get(instrument) || 0) + 1)
        }
      })
      const sortedInstruments = [...instrumentCounts.entries()]
        .sort((a, b) => b[1] - a[1])
      const topInstruments = sortedInstruments.slice(0, 8)
      const otherCount = sortedInstruments.slice(8).reduce((sum, [, count]) => sum + count, 0)
      const instrumentData = topInstruments.map(([name, count]) => ({ name, count }))
      if (otherCount > 0) instrumentData.push({ name: 'אחר', count: otherCount })
      setInstrumentDistribution(instrumentData)

      // ── NEW: Teacher workloads — try hours summary API ──
      try {
        const summariesRes = await hoursSummaryService.getAllSummaries()
        const summaries = Array.isArray(summariesRes) ? summariesRes : summariesRes?.data || []
        if (summaries.length > 0) {
          setTeacherWorkloads(
            summaries.slice(0, 6).map((s: any) => {
              const name = s.teacherName
                || (s.teacherInfo ? `${s.teacherInfo.firstName || ''} ${s.teacherInfo.lastName || ''}`.trim() : '')
                || 'מורה'
              return {
                name,
                individual: s.totals?.individualLessons || 0,
                orchestra: s.totals?.orchestraConducting || 0,
                theory: s.totals?.theoryTeaching || 0,
                management: s.totals?.management || 0,
              }
            })
          )
        }
      } catch {
        // Hours summary not available — leave empty
      }

      // ── NEW: 30-day rehearsal tracker ──
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 29)
      const rehearsalDates = new Set(
        rehearsalsData
          .filter((r: any) => r.date)
          .map((r: any) => new Date(r.date).toDateString())
      )

      const trackerData: Array<{ color?: string; tooltip?: string }> = []
      for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo)
        d.setDate(thirtyDaysAgo.getDate() + i)
        const dayOfWeek = d.getDay()
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}`

        if (dayOfWeek === 5 || dayOfWeek === 6) {
          // Friday/Saturday — no activity expected
          trackerData.push({ color: 'bg-slate-100 dark:bg-slate-800', tooltip: `${dateStr} — סוף שבוע` })
        } else if (rehearsalDates.has(d.toDateString())) {
          trackerData.push({ color: 'bg-emerald-500', tooltip: `${dateStr} — חזרה התקיימה` })
        } else if (d <= today) {
          trackerData.push({ color: 'bg-rose-400', tooltip: `${dateStr} — אין חזרה` })
        } else {
          trackerData.push({ color: 'bg-slate-200 dark:bg-slate-700', tooltip: `${dateStr} — עתידי` })
        }
      }
      setRehearsalHistory(trackerData)

      // ── NEW: Spark data per stat — 6-month rolling, zero-filled ──
      const buildSparkData = (items: any[], dateField: string) => {
        const buckets = new Map<string, number>()
        items.forEach((item: any) => {
          const dateVal = item[dateField]
          if (!dateVal) return
          const d = new Date(dateVal)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          buckets.set(key, (buckets.get(key) || 0) + 1)
        })
        // Always generate 6 months of data, filling missing months with 0
        const months: Array<{ month: string; value: number }> = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const monthLabel = hebrewMonthNames[String(d.getMonth() + 1).padStart(2, '0')] || key
          months.push({ month: monthLabel, value: buckets.get(key) || 0 })
        }
        return months
      }

      setSparkStudents(buildSparkData(studentsData, 'createdAt'))
      setSparkTeachers(buildSparkData(teachersData, 'createdAt'))
      setSparkOrchestras(buildSparkData(orchestrasData, 'createdAt'))
      setSparkRehearsals(buildSparkData(rehearsalsData, 'date'))

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

  // Admin Dashboard — v5.0 Analytics Redesign
  return (
    <div dir="rtl">
      <div className="grid grid-cols-12 gap-6">
        {/* Main content — 9 columns */}
        <div className="col-span-12 lg:col-span-9 space-y-6">

          {/* Section 1: Stat cards — single row with sparklines */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              entity="students"
              value={stats.activeStudents}
              label="תלמידים פעילים"
              trend={stats.studentsTrend > 0 ? `${stats.studentsTrend}%` : undefined}
              loading={loading}
              sparkData={sparkStudents}
            />
            <StatCard
              entity="teachers"
              value={stats.staffMembers}
              label="סגל הוראה"
              loading={loading}
              sparkData={sparkTeachers}
            />
            <StatCard
              entity="orchestras"
              value={stats.activeOrchestras}
              label="הרכבים פעילים"
              loading={loading}
              sparkData={sparkOrchestras}
            />
            <StatCard
              entity="rehearsals"
              value={stats.weeklyRehearsals}
              label="חזרות שבועיות"
              trend="שבועי"
              loading={loading}
              sparkData={sparkRehearsals}
            />
          </div>

          {/* Section 2: Primary charts — ComboChart + Stacked BarChart */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard title="רישומים ופעילות חודשית">
              {loading ? (
                <div className="h-72 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : comboChartData.length > 0 ? (
                <ComboChart
                  data={comboChartData}
                  index="month"
                  barSeries={{ categories: ['registrations'], colors: ['amber'], showYAxis: true }}
                  lineSeries={{ categories: ['cumulative'], colors: ['indigo'], showYAxis: true }}
                  enableBiaxial
                  categoryLabels={{ registrations: 'רישומים', cumulative: 'מצטבר', activities: 'פעילויות' }}
                  className="h-64"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-sm text-slate-400">אין נתונים להצגה</div>
              )}
            </ChartCard>

            <ChartCard title="פעילויות לפי יום">
              {loading ? (
                <div className="h-72 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : activityByDay.some(d => d.rehearsals > 0 || d.theory > 0) ? (
                <TremorBarChart
                  data={activityByDay}
                  index="day"
                  categories={['rehearsals', 'theory']}
                  colors={['sky', 'amber']}
                  type="stacked"
                  categoryLabels={{ rehearsals: 'חזרות', theory: 'תיאוריה' }}
                  className="h-64"
                  barRadius={6}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-sm text-slate-400">אין נתוני פעילות</div>
              )}
            </ChartCard>
          </div>

          {/* Section 3: Distribution charts — Instrument donut + Teacher workloads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="התפלגות כלי נגינה">
              {instrumentDistribution.length > 0 ? (
                <TremorDonutChart
                  data={instrumentDistribution}
                  category="name"
                  value="count"
                  variant="donut"
                  label={`${instrumentDistribution.reduce((s, d) => s + d.count, 0)}`}
                  showLabel
                  className="h-44"
                />
              ) : (
                <div className="h-44 flex items-center justify-center text-sm text-slate-400">אין נתוני כלים</div>
              )}
            </ChartCard>

            <ChartCard title="עומס מורים (ש״ש)">
              {teacherWorkloads.length > 0 ? (
                <div className="space-y-3">
                  {teacherWorkloads.slice(0, 5).map((teacher) => (
                    <div key={teacher.name}>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 truncate">{teacher.name}</p>
                      <CategoryBar
                        values={[teacher.individual, teacher.orchestra, teacher.theory, teacher.management]}
                        colors={['indigo', 'amber', 'cyan', 'gray']}
                        labels={['פרטני', 'תזמורת', 'תיאוריה', 'ניהול']}
                        showLabels={false}
                      />
                    </div>
                  ))}
                  <div className="flex gap-3 text-[10px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />פרטני</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />תזמורת</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />תיאוריה</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />ניהול</span>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-sm text-slate-400">אין נתוני שעות</div>
              )}
            </ChartCard>
          </div>

          {/* Section 4: Teacher table + Rehearsal tracker */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <TeacherPerformanceTable teachers={teacherTableData} loading={loading} />
            </div>
            <ChartCard title="חזרות — 30 יום אחרונים">
              {rehearsalHistory.length > 0 ? (
                <div>
                  <Tracker data={rehearsalHistory} />
                  <div className="flex gap-3 text-[10px] text-slate-400 mt-3">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" />התקיימה</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-400" />לא התקיימה</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-200 dark:bg-slate-700" />סוף שבוע / עתידי</span>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-sm text-slate-400">אין נתוני חזרות</div>
              )}
            </ChartCard>
          </div>
        </div>

        {/* Right sidebar — 3 columns (agenda + messages only) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <AgendaWidget events={agendaData} loading={loading} />
          <MessagesWidget activities={recentActivities} loading={loading} />
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
