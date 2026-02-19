import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, GraduationCap, Music, Calendar, BarChart3, Award, Clock, BookOpen, RefreshCw, AlertCircle } from 'lucide-react'
import StatsCard from '../components/ui/StatsCard'
import { Card } from '../components/ui/Card'
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

type DashboardTab = 'overview' | 'students' | 'schedule' | 'bagrut' | 'hours';

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
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [stats, setStats] = useState({
    activeStudents: 0,
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

      console.log('📊 Dashboard data loaded:', {
        students: studentsData.length,
        teachers: teachersData.length,
        orchestras: orchestrasData.length,
        rehearsals: rehearsalsData.length,
        theory: theoryData.length,
        bagruts: bagrutsData.length
      })

      // Calculate stats
      const activeStudents = studentsData.filter((s: any) => s.isActive !== false).length
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

  const cardRowVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
  }

  const cardItemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 400, damping: 25 }
    }
  }

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

  // Admin Dashboard with tabs
  const tabs = [
    { id: 'overview' as const, label: 'סקירה כללית', icon: BarChart3 },
    { id: 'students' as const, label: 'תלמידים', icon: Users },
    { id: 'schedule' as const, label: 'לוח זמנים', icon: Calendar },
    { id: 'bagrut' as const, label: 'בגרויות', icon: Award },
    { id: 'hours' as const, label: 'שעות מורים', icon: Clock }
  ]

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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
          className="flex items-center gap-2 px-4 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          רענן נתונים
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card border border-border rounded-lg mb-6 p-1 flex overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main content column */}
          <div className="space-y-6">
            {/* Stat cards row — staggered entrance */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
              variants={cardRowVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={cardItemVariants}>
                <StatsCard
                  title="תלמידים פעילים"
                  value={loading ? "..." : stats.activeStudents.toString()}
                  subtitle="תלמידים רשומים"
                  icon={<Users />}
                  color="students"
                  coloredBg
                  trend={stats.studentsTrend !== 0 ? {
                    value: Math.abs(stats.studentsTrend),
                    label: "מהחודש שעבר",
                    direction: stats.studentsTrend > 0 ? "up" : "down"
                  } : undefined}
                />
              </motion.div>

              <motion.div variants={cardItemVariants}>
                <StatsCard
                  title="חברי סגל"
                  value={loading ? "..." : stats.staffMembers.toString()}
                  subtitle="מורים ומדריכים"
                  icon={<GraduationCap />}
                  color="teachers"
                  coloredBg
                />
              </motion.div>

              <motion.div variants={cardItemVariants}>
                <StatsCard
                  title="הרכבים פעילים"
                  value={loading ? "..." : stats.activeOrchestras.toString()}
                  subtitle="תזמורות וקבוצות"
                  icon={<Music />}
                  color="orchestras"
                  coloredBg
                />
              </motion.div>

              <motion.div variants={cardItemVariants}>
                <StatsCard
                  title="חזרות השבוע"
                  value={loading ? "..." : stats.weeklyRehearsals.toString()}
                  subtitle="מפגשים מתוכננים"
                  icon={<Calendar />}
                  color="rehearsals"
                  coloredBg
                />
              </motion.div>

              <motion.div variants={cardItemVariants}>
                <StatsCard
                  title="שיעורי תאוריה"
                  value={loading ? "..." : stats.theoryLessonsThisWeek.toString()}
                  subtitle="השבוע"
                  icon={<BookOpen />}
                  color="theory"
                  coloredBg
                />
              </motion.div>

              <motion.div variants={cardItemVariants}>
                <StatsCard
                  title="בגרויות פעילות"
                  value={loading ? "..." : stats.activeBagruts.toString()}
                  subtitle="תלמידים בתהליך"
                  icon={<Award />}
                  color="bagrut"
                  coloredBg
                />
              </motion.div>
            </motion.div>

            {/* Teacher Room Schedule Table */}
            <DailyTeacherRoomTable />

            {/* Charts Grid */}
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

          {/* Right widget column */}
          <div className="space-y-4">
            <MiniCalendarWidget />
            <UpcomingEventsWidget events={upcomingEvents} loading={loading} />
            <RecentActivityWidget activities={recentActivities} loading={loading} />
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <StudentActivityCharts
          schoolYearId={currentSchoolYear?._id}
        />
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Daily Teacher Room Table - Main Feature */}
          <DailyTeacherRoomTable />

          {/* Additional schedule info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClassDistributionChart
              schoolYearId={currentSchoolYear?._id}
            />
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">סיכום שבועי</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-primary" />
                    <span className="text-foreground/80">חזרות תזמורת</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{stats.weeklyRehearsals}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground/80">שיעורי תאוריה</span>
                  </div>
                  <span className="text-xl font-bold text-muted-foreground">{stats.theoryLessonsThisWeek}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground/80">מורים פעילים</span>
                  </div>
                  <span className="text-xl font-bold text-muted-foreground">{stats.staffMembers}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Bagrut Tab */}
      {activeTab === 'bagrut' && (
        <BagrutProgressDashboard
          schoolYearId={currentSchoolYear?._id}
        />
      )}

      {/* Hours Tab */}
      {activeTab === 'hours' && (
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
      )}
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
      <div className="text-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        טוען נתוני שעות...
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="flex flex-col items-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">שגיאה בטעינת נתוני שעות</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onLoad}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-neutral-800"
          >
            <RefreshCw className="w-4 h-4" />
            נסה שוב
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">שעות שבועיות — כל המורים</h3>
        <button
          onClick={onRecalculateAll}
          disabled={isRecalculating}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-muted text-foreground border border-border rounded-lg hover:bg-muted/80 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
          {isRecalculating ? 'מחשב...' : 'חשב מחדש הכל'}
        </button>
      </div>

      {hoursSummaries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>לא נמצאו נתוני שעות. לחץ "חשב מחדש הכל" ליצירת חישוב ראשוני.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-700">מורה</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">סה"כ ש"ש</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">פרטניים</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">תזמורות</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">תיאוריה</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">ניהול</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hoursSummaries.map((summary) => (
                <tr key={summary.teacherId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">{summary.teacherName}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-muted text-foreground">
                      {summary.totals.totalWeeklyHours}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{summary.totals.individualLessons}</td>
                  <td className="px-4 py-3 text-gray-600">{summary.totals.orchestraConducting}</td>
                  <td className="px-4 py-3 text-gray-600">{summary.totals.theoryTeaching}</td>
                  <td className="px-4 py-3 text-gray-600">{summary.totals.management}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
