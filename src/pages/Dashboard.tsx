import { useState, useEffect, useRef } from 'react'
import { MoonIcon, MapPinIcon, ClockIcon, UsersIcon, MusicNotesIcon } from '@phosphor-icons/react'
import { Tooltip } from '@heroui/react'
import apiService, { hoursSummaryService, roomScheduleService } from '../services/apiService'
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
import { DashboardRoomSchedule } from '../components/dashboard/v4/DashboardRoomSchedule'
import { VacantRoomsWidget } from '../components/dashboard/v4/VacantRoomsWidget'
import { DashboardChartSection } from '../components/dashboard/v4/DashboardChartSection'
import { ComboChart, TremorBarChart } from '../components/charts'

import { ScrollReveal } from '../components/ui/ScrollReveal'
import type { BarClickPayload } from '../components/charts/TremorBarChart'

const hebrewMonthNames: Record<string, string> = {
  '01': "ינו'", '02': "פבר'", '03': 'מרץ', '04': "אפר'",
  '05': 'מאי', '06': 'יוני', '07': 'יולי', '08': "אוג'",
  '09': "ספט'", '10': "אוק'", '11': "נוב'", '12': "דצמ'",
}

/** Chart card wrapper — consistent styling for all chart sections */
function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-white dark:bg-sidebar-dark p-6 rounded-md shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden ${className}`}>
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
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [teacherTableData, setTeacherTableData] = useState<any[]>([])
  const [agendaData, setAgendaData] = useState<any[]>([])

  // New chart data state
  const [activityByDay, setActivityByDay] = useState<Array<Record<string, any>>>([])
  const [comboChartData, setComboChartData] = useState<Array<Record<string, any>>>([])
  const [instrumentDistribution, setInstrumentDistribution] = useState<Array<{ name: string; count: number }>>([])
  const [rehearsalHistory, setRehearsalHistory] = useState<Array<{ color?: string; tooltip?: string; dateStr?: string; status?: string; rehearsals?: any[] }>>([])
  const [sparkStudents, setSparkStudents] = useState<Array<Record<string, any>>>([])
  const [sparkTeachers, setSparkTeachers] = useState<Array<Record<string, any>>>([])
  const [sparkOrchestras, setSparkOrchestras] = useState<Array<Record<string, any>>>([])
  const [sparkRehearsals, setSparkRehearsals] = useState<Array<Record<string, any>>>([])

  // Activity popover state
  const [activityPopover, setActivityPopover] = useState<{
    day: string
    rehearsals: number
    theory: number
    total: number
    pct: { rehearsals: string; theory: string }
    x: number
    y: number
  } | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect(() => {
    if (!activityPopover) return
    const handler = (e: MouseEvent) => {
      const popEl = document.getElementById('activity-popover')
      if (popEl && !popEl.contains(e.target as Node)) {
        setActivityPopover(null)
      }
    }
    // Delay listener so the opening click doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [activityPopover])

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
        apiService.theory.getTheoryLessons({ ...filters, limit: 9999 }),
        apiService.bagrut.getBagruts()
      ])

      const studentsData = students.status === 'fulfilled' ? (Array.isArray(students.value) ? students.value : []) : []
      const teachersData = teachers.status === 'fulfilled' ? (Array.isArray(teachers.value) ? teachers.value : []) : []
      const orchestrasData = orchestras.status === 'fulfilled' ? (Array.isArray(orchestras.value) ? orchestras.value : []) : []
      const rehearsalsData = rehearsals.status === 'fulfilled' ? (Array.isArray(rehearsals.value) ? rehearsals.value : []) : []
      const theoryRaw = theoryLessons.status === 'fulfilled' ? theoryLessons.value : null
      const theoryData = Array.isArray(theoryRaw) ? theoryRaw : Array.isArray(theoryRaw?.data) ? theoryRaw.data : []
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

      // Teacher table — includes weeklyHours from Phase 73 dual-write
      const teacherTable = teachersData.map((t: any) => ({
        id: t._id,
        name: getDisplayName(t.personalInfo) || 'מורה',
        department: t.professionalInfo?.instrument || t.teaching?.instruments?.[0] || '—',
        studentCount: t.studentCount || t.teaching?.studentIds?.length || 0,
        weeklyHours: t.weeklyHoursSummary?.totalWeeklyHours || 0,
        isActive: t.isActive !== false,
        avatarUrl: t.personalInfo?.avatarUrl || null,
        roles: t.allRoles || t.roles || [],
      }))
      setTeacherTableData(teacherTable)

      // Agenda — fetch from daily agenda API (all activity types for today)
      try {
        const agendaResult = await roomScheduleService.getDailyAgenda()
        if (agendaResult?.activities?.length > 0) {
          setAgendaData(agendaResult.activities.map((a: any) => ({
            time: a.startTime || '09:00',
            title: a.title || a.badge || 'פעילות',
            location: a.location || '',
            badge: a.badge || '',
          })))
        }
      } catch (agendaErr) {
        console.warn('Failed to load daily agenda:', agendaErr)
      }

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

      // Teacher workload data flows through weeklyHoursSummary on teacher docs (Phase 73/74)

      // ── NEW: 30-day rehearsal tracker ──
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 29)

      // Build orchestra name lookup from already-loaded data
      const orchestraNameMap = new Map<string, string>()
      orchestrasData.forEach((o: any) => {
        if (o._id) orchestraNameMap.set(o._id, o.name || o.basicInfo?.name || 'הרכב')
      })

      // Group rehearsals by date string for quick lookup, enriched with orchestra name
      const rehearsalsByDate = new Map<string, any[]>()
      rehearsalsData
        .filter((r: any) => r.date)
        .forEach((r: any) => {
          const key = new Date(r.date).toDateString()
          if (!rehearsalsByDate.has(key)) rehearsalsByDate.set(key, [])
          rehearsalsByDate.get(key)!.push({
            ...r,
            orchestraDisplayName: r.groupId ? (orchestraNameMap.get(r.groupId) || r.type || 'חזרה') : (r.type || 'חזרה'),
          })
        })

      const trackerData: Array<{ color?: string; tooltip?: string; dateStr?: string; status?: string; rehearsals?: any[] }> = []
      for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo)
        d.setDate(thirtyDaysAgo.getDate() + i)
        const dayOfWeek = d.getDay()
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}`
        const dateKey = d.toDateString()
        const dayRehearsals = rehearsalsByDate.get(dateKey) || []

        if (dayOfWeek === 5 || dayOfWeek === 6) {
          trackerData.push({ color: 'bg-slate-100 dark:bg-slate-800', tooltip: `${dateStr} — סוף שבוע`, dateStr, status: 'weekend' })
        } else if (dayRehearsals.length > 0) {
          trackerData.push({ color: 'bg-emerald-500', tooltip: `${dateStr} — חזרה התקיימה`, dateStr, status: 'held', rehearsals: dayRehearsals })
        } else if (d <= today) {
          trackerData.push({ color: 'bg-rose-500', tooltip: `${dateStr} — אין חזרה`, dateStr, status: 'missed' })
        } else {
          trackerData.push({ color: 'bg-slate-200 dark:bg-slate-700', tooltip: `${dateStr} — עתידי`, dateStr, status: 'future' })
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

  const [recalcError, setRecalcError] = useState<string | null>(null)

  const handleRecalculateHours = async () => {
    setIsRecalculating(true)
    setRecalcError(null)

    // Temporarily suppress auth:expired so a 401 here doesn't force-logout
    let authExpiredSuppressed = false
    const suppressAuthExpired = (e: Event) => { e.stopImmediatePropagation(); authExpiredSuppressed = true }
    window.addEventListener('auth:expired', suppressAuthExpired, { capture: true })

    try {
      await hoursSummaryService.calculateAll()
      await loadDashboardData()
    } catch (err: any) {
      console.error('Error recalculating hours:', err)
      if (authExpiredSuppressed || err?.message?.includes('Authentication')) {
        setRecalcError('הפעולה נכשלה — יש להתחבר מחדש')
      } else {
        setRecalcError('שגיאה בחישוב שעות')
      }
    } finally {
      window.removeEventListener('auth:expired', suppressAuthExpired, { capture: true })
      setIsRecalculating(false)
    }
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
            <ScrollReveal delay={0}>
              <StatCard
                entity="students"
                value={stats.activeStudents}
                label="תלמידים פעילים"
                trend={stats.studentsTrend > 0 ? `${stats.studentsTrend}%` : undefined}
                loading={loading}
                sparkData={sparkStudents}
              />
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <StatCard
                entity="teachers"
                value={stats.staffMembers}
                label="סגל הוראה"
                loading={loading}
                sparkData={sparkTeachers}
              />
            </ScrollReveal>
            <ScrollReveal delay={0.16}>
              <StatCard
                entity="orchestras"
                value={stats.activeOrchestras}
                label="הרכבים פעילים"
                loading={loading}
                sparkData={sparkOrchestras}
              />
            </ScrollReveal>
            <ScrollReveal delay={0.24}>
              <StatCard
                entity="rehearsals"
                value={stats.weeklyRehearsals}
                label="חזרות שבועיות"
                trend="שבועי"
                loading={loading}
                sparkData={sparkRehearsals}
              />
            </ScrollReveal>
          </div>

          {/* Section 2: Teacher performance table */}
          <ScrollReveal>
            <TeacherPerformanceTable
              teachers={teacherTableData}
              loading={loading}
              isRecalculating={isRecalculating}
              onRecalculate={handleRecalculateHours}
              error={recalcError}
            />
          </ScrollReveal>


        </div>

        {/* Right sidebar — 3 columns (agenda + vacant rooms) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <ScrollReveal delay={0.1}>
            <AgendaWidget events={agendaData} loading={loading} />
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <VacantRoomsWidget />
          </ScrollReveal>
        </div>
      </div>

      {/* Section 3: Room schedule — full width */}
      <ScrollReveal className="mt-6">
        <DashboardRoomSchedule />
      </ScrollReveal>

      {/* Full-width sections below the 9/3 grid */}
      <div className="space-y-6 mt-6">
        {/* Charts — responsive tabs on mobile, grid+focus on desktop */}
        <ScrollReveal>
          <DashboardChartSection
            comboChartTitle="רישומים ופעילות חודשית"
            comboChartContent={
              loading ? (
                <div className="h-56 flex items-center justify-center">
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
                  className="h-52"
                />
              ) : (
                <div className="h-52 flex items-center justify-center text-sm text-slate-400">אין נתונים להצגה</div>
              )
            }
            activityChartTitle={`פעילויות לפי יום${activityByDay.length > 0 ? ` (${activityByDay.reduce((s, d) => s + d.rehearsals + d.theory, 0)} סה״כ)` : ''}`}
            activityChartContent={
              loading ? (
                <div className="h-56 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : activityByDay.some(d => d.rehearsals > 0 || d.theory > 0) ? (
                <div className="relative" ref={chartContainerRef}>
                  <TremorBarChart
                    data={activityByDay}
                    index="day"
                    categories={['rehearsals', 'theory']}
                    colors={['indigo', 'amber']}
                    type="default"
                    categoryLabels={{ rehearsals: 'חזרות', theory: 'תיאוריה' }}
                    className="h-52"
                    barRadius={6}
                    showLabels
                    onBarClick={(payload: BarClickPayload) => {
                      const row = payload.row
                      const total = (row.rehearsals || 0) + (row.theory || 0)
                      if (total === 0) return
                      const pctR = ((row.rehearsals / total) * 100).toFixed(0)
                      const pctT = ((row.theory / total) * 100).toFixed(0)
                      const containerRect = chartContainerRef.current?.getBoundingClientRect()
                      const x = containerRect ? payload.mouseX - containerRect.left : payload.mouseX
                      const y = containerRect ? payload.mouseY - containerRect.top : payload.mouseY
                      setActivityPopover({
                        day: payload.index,
                        rehearsals: row.rehearsals || 0,
                        theory: row.theory || 0,
                        total,
                        pct: { rehearsals: pctR, theory: pctT },
                        x, y,
                      })
                    }}
                  />

                  {/* Click-positioned floating detail panel */}
                  {activityPopover && (
                    <div
                      id="activity-popover"
                      className="absolute z-50 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 p-4 text-right animate-in fade-in zoom-in-95 duration-150"
                      style={{
                        top: Math.max(8, activityPopover.y - 160),
                        left: Math.min(Math.max(8, activityPopover.x - 112), (chartContainerRef.current?.offsetWidth || 400) - 232),
                      }}
                      dir="rtl"
                    >
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                        יום {activityPopover.day} — {activityPopover.total} פעילויות
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            חזרות
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-800 dark:text-white">{activityPopover.rehearsals}</span>
                            <span className="text-xs text-slate-400">({activityPopover.pct.rehearsals}%)</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            תיאוריה
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-800 dark:text-white">{activityPopover.theory}</span>
                            <span className="text-xs text-slate-400">({activityPopover.pct.theory}%)</span>
                          </div>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 mt-1">
                          {activityPopover.rehearsals > 0 && (
                            <div className="bg-indigo-500 transition-all duration-300" style={{ width: `${activityPopover.pct.rehearsals}%` }} />
                          )}
                          {activityPopover.theory > 0 && (
                            <div className="bg-amber-500 transition-all duration-300" style={{ width: `${activityPopover.pct.theory}%` }} />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 mt-1 text-center">לחץ על עמודה לפרטים נוספים</p>
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center text-sm text-slate-400">אין נתוני פעילות</div>
              )
            }
            instrumentChartTitle="התפלגות כלי נגינה"
            instrumentChartContent={
              instrumentDistribution.length > 0 ? (
                <div className="relative space-y-2.5">
                  {instrumentDistribution.map((item, i) => {
                    const maxCount = Math.max(...instrumentDistribution.map(d => d.count))
                    const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                    const barColors = [
                      'from-indigo-400 to-indigo-500',
                      'from-emerald-400 to-emerald-500',
                      'from-amber-400 to-amber-500',
                      'from-sky-400 to-sky-500',
                      'from-rose-400 to-rose-500',
                      'from-violet-400 to-violet-500',
                      'from-cyan-400 to-cyan-500',
                      'from-lime-400 to-lime-500',
                      'from-pink-400 to-pink-500',
                    ]
                    const gradient = barColors[i % barColors.length]
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-16 text-left truncate">{item.name}</span>
                        <div className="flex-1 h-6 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-sm overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-l ${gradient} transition-all duration-700 ease-out flex items-center justify-start px-2`}
                            style={{ width: `${Math.max(pct, 8)}%` }}
                          >
                            <span className="text-[10px] font-bold text-white drop-shadow-sm">{item.count}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-sm text-slate-400">אין נתוני כלים</div>
              )
            }
          />
        </ScrollReveal>

          {/* Section 5: Rehearsal tracker — full width */}
          <ScrollReveal>
          <ChartCard title="חזרות — 30 יום אחרונים">
            {rehearsalHistory.length > 0 ? (
              <div>
                <div className="flex gap-1">
                  {rehearsalHistory.map((block, i) => (
                    <Tooltip
                      key={i}
                      placement="bottom"
                      showArrow
                      delay={150}
                      closeDelay={0}
                      classNames={{ content: 'p-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg' }}
                      content={
                        <div className="w-[300px]" dir="rtl">
                          {/* Header bar */}
                          <div className={`px-3.5 py-2 rounded-t-lg flex items-center justify-between ${
                            block.status === 'held' ? 'bg-emerald-500 text-white' :
                            block.status === 'missed' ? 'bg-rose-500 text-white' :
                            block.status === 'weekend' ? 'bg-slate-200 text-slate-600' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            <span className="text-sm font-bold">{block.dateStr}</span>
                            <span className="text-xs font-medium opacity-90">
                              {block.status === 'held' ? `${block.rehearsals?.length} חזרות` :
                               block.status === 'missed' ? 'לא התקיימה' :
                               block.status === 'weekend' ? 'סוף שבוע' : 'עתידי'}
                            </span>
                          </div>

                          {/* Body */}
                          <div className="px-3.5 py-2.5 max-h-[200px] overflow-y-auto">
                            {block.status === 'held' && block.rehearsals ? (
                              <div className="space-y-2">
                                {block.rehearsals.map((r: any, ri: number) => (
                                  <div
                                    key={ri}
                                    className={`flex items-start gap-3 p-2 rounded-md animate-[tooltipItemIn_0.25s_ease-out_both] ${
                                    ri % 2 === 0 ? 'bg-emerald-50/60' : 'bg-slate-50/60'
                                  }`}
                                    style={{ animationDelay: `${ri * 60}ms` }}
                                  >
                                    {/* Color accent bar */}
                                    <div className="w-1 self-stretch rounded-full bg-emerald-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                        {r.orchestraDisplayName}
                                      </p>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1">
                                          <ClockIcon className="w-3 h-3" />
                                          {r.startTime || '—'} – {r.endTime || '—'}
                                        </span>
                                        {r.location && (
                                          <span className="flex items-center gap-1">
                                            <MapPinIcon className="w-3 h-3" />
                                            {r.location}
                                          </span>
                                        )}
                                      </div>
                                      {r.attendanceCount?.total > 0 && (
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                          <UsersIcon className="w-3 h-3" />
                                          <span>{r.attendanceCount.present}/{r.attendanceCount.total} נוכחים</span>
                                          <span className="text-[10px] text-emerald-600 font-medium">
                                            ({Math.round((r.attendanceCount.present / r.attendanceCount.total) * 100)}%)
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : block.status === 'missed' ? (
                              <p className="text-xs text-rose-600 py-1">לא נרשמו חזרות ביום זה</p>
                            ) : block.status === 'weekend' ? (
                              <p className="text-xs text-slate-400 py-1">יום מנוחה — אין פעילות</p>
                            ) : (
                              <p className="text-xs text-slate-400 py-1">טרם הגיע</p>
                            )}
                          </div>
                        </div>
                      }
                    >
                      <div
                        className={`h-12 flex-1 rounded transition-all hover:scale-y-110 hover:opacity-90 cursor-pointer ${block.color ?? 'bg-slate-200 dark:bg-slate-700'}`}
                      />
                    </Tooltip>
                  ))}
                </div>
                <div className="flex gap-4 text-xs text-slate-500 mt-4 justify-center">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" />התקיימה</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500" />לא התקיימה</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" />סוף שבוע / עתידי</span>
                </div>
                {(() => {
                  const held = rehearsalHistory.filter(b => b.color === 'bg-emerald-500').length
                  const missed = rehearsalHistory.filter(b => b.color === 'bg-rose-500').length
                  const total = held + missed
                  const rate = total > 0 ? Math.round((held / total) * 100) : 0
                  return total > 0 ? (
                    <p className="text-center text-sm text-slate-500 mt-3">
                      <span className="font-semibold text-slate-700 dark:text-white">{rate}%</span> אחוז קיום ({held} מתוך {total})
                    </p>
                  ) : null
                })()}
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center text-sm text-slate-400">אין נתוני חזרות</div>
            )}
          </ChartCard>
          </ScrollReveal>
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
