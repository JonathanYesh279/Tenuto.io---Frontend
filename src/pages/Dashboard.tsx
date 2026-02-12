import { useState, useEffect } from 'react'
import { Users, GraduationCap, Music, Calendar, BarChart3, Award, Clock, BookOpen, RefreshCw } from 'lucide-react'
import StatsCard from '../components/ui/StatsCard'
import { Card } from '../components/ui/Card'
import apiService from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'
import { useAuth } from '../services/authContext.jsx'
import { getDisplayName } from '../utils/nameUtils'
import ConductorDashboard from '../components/dashboard/ConductorDashboard'
import TeacherDashboard from '../components/dashboard/TeacherDashboard'
import TheoryTeacherDashboard from '../components/dashboard/TheoryTeacherDashboard'
import SuperAdminDashboard from '../components/dashboard/SuperAdminDashboard'
import {
  StudentActivityCharts,
  InstrumentDistributionChart,
  ClassDistributionChart,
  BagrutProgressDashboard,
  DailyTeacherRoomTable
} from '../components/dashboard/charts'

type DashboardTab = 'overview' | 'students' | 'schedule' | 'bagrut';

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
        user.role === 'מורה' || user.roles?.includes('מורה') ||
        user.teaching?.studentIds?.length > 0) {
      return 'teacher'
    }

    return 'admin'
  }

  const userRole = getUserRole()

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
    { id: 'bagrut' as const, label: 'בגרויות', icon: Award }
  ]

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
          <p className="text-sm text-gray-600">
            {currentSchoolYear?.name || 'שנת לימודים נוכחית'} |
            עדכון אחרון: {lastRefresh.toLocaleTimeString('he-IL')}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          רענן נתונים
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6 p-1 flex overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatsCard
              title="תלמידים פעילים"
              value={loading ? "..." : stats.activeStudents.toString()}
              subtitle="תלמידים רשומים"
              icon={<Users />}
              color="blue"
              trend={stats.studentsTrend !== 0 ? {
                value: Math.abs(stats.studentsTrend),
                label: "מהחודש שעבר",
                direction: stats.studentsTrend > 0 ? "up" : "down"
              } : undefined}
            />

            <StatsCard
              title="חברי סגל"
              value={loading ? "..." : stats.staffMembers.toString()}
              subtitle="מורים ומדריכים"
              icon={<GraduationCap />}
              color="green"
            />

            <StatsCard
              title="הרכבים פעילים"
              value={loading ? "..." : stats.activeOrchestras.toString()}
              subtitle="תזמורות וקבוצות"
              icon={<Music />}
              color="purple"
            />

            <StatsCard
              title="חזרות השבוע"
              value={loading ? "..." : stats.weeklyRehearsals.toString()}
              subtitle="מפגשים מתוכננים"
              icon={<Calendar />}
              color="orange"
            />

            <StatsCard
              title="שיעורי תאוריה"
              value={loading ? "..." : stats.theoryLessonsThisWeek.toString()}
              subtitle="השבוע"
              icon={<BookOpen />}
              color="teal"
            />

            <StatsCard
              title="בגרויות פעילות"
              value={loading ? "..." : stats.activeBagruts.toString()}
              subtitle="תלמידים בתהליך"
              icon={<Award />}
              color="amber"
            />
          </div>

          {/* Teacher Room Schedule Table - Top Priority */}
          <div className="mb-8">
            <DailyTeacherRoomTable />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Instrument Distribution */}
            <InstrumentDistributionChart
              schoolYearId={currentSchoolYear?._id}
              maxItems={8}
            />

            {/* Class Distribution */}
            <ClassDistributionChart
              schoolYearId={currentSchoolYear?._id}
            />
          </div>

          {/* Activity Feed and Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">פעילות אחרונה</h3>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    צפה בהכל
                  </button>
                </div>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">טוען...</div>
                  ) : recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start">
                        <div className={`w-2 h-2 ${activity.color === 'primary' ? 'bg-blue-500' : activity.color === 'success' ? 'bg-green-500' : 'bg-orange-500'} rounded-full mt-2 ml-4`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <span className="text-xs text-gray-500">{activity.time}</span>
                          </div>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">אין פעילות אחרונה</div>
                  )}
                </div>
              </Card>
            </div>

            {/* Upcoming Events */}
            <div>
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">אירועים קרובים</h3>
                </div>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">טוען...</div>
                  ) : upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${event.isPrimary ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium ${event.isPrimary ? 'text-primary-900' : 'text-gray-900'}`}>
                            {event.title}
                          </p>
                          <span className={`text-xs ${event.isPrimary ? 'text-primary-600' : 'text-gray-500'}`}>
                            {event.date}
                          </span>
                        </div>
                        <p className={`text-sm ${event.isPrimary ? 'text-primary-700' : 'text-gray-600'}`}>
                          {event.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">אין אירועים קרובים</div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">סיכום שבועי</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">חזרות תזמורת</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{stats.weeklyRehearsals}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">שיעורי תאוריה</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">{stats.theoryLessonsThisWeek}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">מורים פעילים</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{stats.staffMembers}</span>
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
    </div>
  )
}
