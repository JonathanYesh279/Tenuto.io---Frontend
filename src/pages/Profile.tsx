import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/authContext.jsx'
import {
  UserIcon,
  UsersIcon,
  MusicNoteIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  PulseIcon,
  CheckSquareIcon,
  BuildingsIcon,
  ChalkboardTeacherIcon,
  LockKeyIcon,
  ShieldCheckIcon,
  IdentificationCardIcon,
} from '@phosphor-icons/react'
import { Chip } from '@heroui/react'
import TeacherStudentsTab from '../components/profile/TeacherStudentsTab'
import ConductorOrchestrasTab from '../components/profile/ConductorOrchestrasTab'
import TeacherScheduleTab from '../components/profile/TeacherScheduleTab'
import TheoryTeacherLessonsTab from '../components/profile/TheoryTeacherLessonsTab'
import TeacherAttendanceTab from '../components/profile/TeacherAttendanceTab'
import GeneralInfoTab from '../components/profile/GeneralInfoTab'
import CredentialsTab from '../components/profile/CredentialsTab'
import ProfileSidebar from '../components/profile/ProfileSidebar'
import apiService, { teacherService, studentService, orchestraService } from '../services/apiService'
import { getDisplayName } from '../utils/nameUtils'
import { GlassStatCard } from '../components/ui/GlassStatCard'
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from '../components/ui/animated-tabs'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<any>
}

interface ProfileStatistics {
  studentsCount: number
  orchestrasCount: number
  theoryLessonsCount: number
  weeklyHours: number
  totalRehearsals: number
  activeStudents: number
  // Admin conservatory-wide stats
  totalTeachers?: number
  totalStudents?: number
  totalOrchestras?: number
}

export default function Profile() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')
  const [statistics, setStatistics] = useState<ProfileStatistics | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [actionParam, setActionParam] = useState<string | null>(null)

  // Handle navigation from dashboard or sidebar with specific tab
  useEffect(() => {
    const state = location.state as { activeTab?: string } | null
    if (state?.activeTab) {
      setActiveTab(state.activeTab)
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    const searchParams = new URLSearchParams(location.search)
    const tabParam = searchParams.get('tab')
    const action = searchParams.get('action')

    if (tabParam) setActiveTab(tabParam)
    if (action) setActionParam(action)

    if (tabParam || action) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [location])

  useEffect(() => {
    if (user) loadProfileStatistics()
  }, [user])

  const isConductor = () => {
    return (
      user?.roles?.includes('conductor') ||
      user?.roles?.includes('מנצח') ||
      (user?.conducting?.orchestraIds && user.conducting.orchestraIds.length > 0)
    )
  }

  const isTeacher = () => {
    return user?.roles?.includes('teacher') || user?.roles?.includes('מורה')
  }

  const isTheoryTeacher = () => {
    return (
      user?.roles?.includes('תאוריה') || user?.roles?.includes('מורה תאוריה')
    )
  }

  const isAdmin = () => {
    return user?.roles?.includes('admin') || user?.roles?.includes('מנהל')
  }

  const loadProfileStatistics = async () => {
    try {
      setLoadingStats(true)
      const userId = user?._id || user?.teacherId || user?.id

      if (!userId) {
        console.warn('No user ID available for loading profile statistics')
        return
      }

      const teacherProfile = await teacherService.getMyProfile()

      if (!teacherProfile) {
        console.warn('No teacher profile found')
        setStatistics({
          studentsCount: 0,
          activeStudents: 0,
          weeklyHours: 0,
          orchestrasCount: 0,
          theoryLessonsCount: 0,
          totalRehearsals: 0,
        })
        return
      }

      const orchestraIds = teacherProfile?.conducting?.orchestraIds || []
      const timeBlocks = teacherProfile?.teaching?.timeBlocks || []

      // Base personal stats fetch
      const [studentDataResult, orchestraDataResult] = await Promise.allSettled([
        apiService.teachers.getTeacherStudents(user._id),
        orchestraIds.length > 0
          ? apiService.orchestras.getBatchOrchestras(orchestraIds)
          : Promise.resolve([]),
      ])

      const studentData =
        studentDataResult.status === 'fulfilled' ? studentDataResult.value : []
      if (studentDataResult.status === 'rejected') {
        console.error('Failed to load student data:', studentDataResult.reason)
      }

      const orchestraData =
        orchestraDataResult.status === 'fulfilled' ? orchestraDataResult.value : []
      if (orchestraDataResult.status === 'rejected') {
        console.error('Failed to load orchestra data:', orchestraDataResult.reason)
      }

      const activeStudents = Array.isArray(studentData)
        ? studentData.filter((s) => s.academicInfo?.isActive !== false)
        : []
      const totalWeeklyMinutes = Array.isArray(timeBlocks)
        ? timeBlocks.reduce(
            (total, block) => total + (parseInt(block.totalDuration) || 0),
            0
          )
        : 0
      const weeklyHours = Math.round((totalWeeklyMinutes / 60) * 10) / 10

      const stats: ProfileStatistics = {
        studentsCount: Array.isArray(studentData) ? studentData.length : 0,
        activeStudents: activeStudents.length,
        weeklyHours,
        orchestrasCount: Array.isArray(orchestraData) ? orchestraData.length : 0,
        theoryLessonsCount: 0,
        totalRehearsals: 0,
      }

      // Admin conservatory-wide stats
      if (isAdmin()) {
        const [teachersResult, allStudentsResult, allOrchestrasResult] =
          await Promise.allSettled([
            apiService.teachers.getTeachers(),
            apiService.students.getStudents(),
            apiService.orchestras.getOrchestras(),
          ])

        stats.totalTeachers =
          teachersResult.status === 'fulfilled'
            ? (Array.isArray(teachersResult.value) ? teachersResult.value.length : 0)
            : 0
        stats.totalStudents =
          allStudentsResult.status === 'fulfilled'
            ? (Array.isArray(allStudentsResult.value) ? allStudentsResult.value.length : 0)
            : 0
        stats.totalOrchestras =
          allOrchestrasResult.status === 'fulfilled'
            ? (Array.isArray(allOrchestrasResult.value) ? allOrchestrasResult.value.length : 0)
            : 0
      }

      setStatistics(stats)
    } catch (error) {
      console.error('Error loading profile statistics:', error)
      setStatistics({
        studentsCount: 0,
        activeStudents: 0,
        weeklyHours: 0,
        orchestrasCount: 0,
        theoryLessonsCount: 0,
        totalRehearsals: 0,
      })
    } finally {
      setLoadingStats(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">טוען פרטי משתמש...</div>
        </div>
      </div>
    )
  }

  const getTabsByRole = (): Tab[] => {
    const baseTabs: Tab[] = [
      {
        id: 'general',
        label: 'פרטים כלליים',
        icon: UserIcon,
        component: GeneralInfoTab,
      },
    ]

    const tabs = [...baseTabs]

    // Credentials tab available to all users
    tabs.push({
      id: 'credentials',
      label: 'סיסמה',
      icon: LockKeyIcon,
      component: CredentialsTab,
    })

    if (isTeacher()) {
      tabs.push({
        id: 'students',
        label: 'התלמידים שלי',
        icon: UsersIcon,
        component: TeacherStudentsTab,
      })
      tabs.push({
        id: 'schedule',
        label: 'לוח זמנים שבועי',
        icon: CalendarIcon,
        component: TeacherScheduleTab,
      })
      tabs.push({
        id: 'attendance',
        label: 'נוכחות',
        icon: CheckSquareIcon,
        component: TeacherAttendanceTab,
      })
    }

    if (isConductor()) {
      tabs.push({
        id: 'orchestras',
        label: 'התזמורות שלי',
        icon: MusicNoteIcon,
        component: ConductorOrchestrasTab,
      })
    }

    if (isTheoryTeacher()) {
      tabs.push({
        id: 'lessons',
        label: 'שיעורי התיאוריה שלי',
        icon: BookOpenIcon,
        component: TheoryTeacherLessonsTab,
      })
    }

    return tabs
  }

  const tabs = getTabsByRole()
  const activeTabData = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'teacher':
      case 'מורה':
        return 'מורה'
      case 'conductor':
      case 'מנצח':
        return 'מנצח'
      case 'תאוריה':
      case 'מורה תיאוריה':
        return 'מורה תיאוריה'
      case 'admin':
      case 'מנהל':
        return 'מנהל'
      default:
        return role
    }
  }

  // Choose stat cards based on role
  const getStatCards = () => {
    const cards: {
      label: string
      value: number | string
      loading: boolean
    }[] = []

    if (isAdmin()) {
      // Admin sees conservatory-wide totals
      cards.push({
        label: 'סה״כ מורים',
        value: statistics?.totalTeachers ?? 0,
        loading: loadingStats,
      })
      cards.push({
        label: 'סה״כ תלמידים',
        value: statistics?.totalStudents ?? 0,
        loading: loadingStats,
      })
      cards.push({
        label: 'סה״כ תזמורות',
        value: statistics?.totalOrchestras ?? 0,
        loading: loadingStats,
      })
      cards.push({
        label: 'שעות שבועיות',
        value: statistics?.weeklyHours ?? 0,
        loading: loadingStats,
      })
    } else {
      // Non-admin sees personal stats
      cards.push({
        label: 'סה״כ תלמידים',
        value: statistics?.studentsCount ?? 0,
        loading: loadingStats,
      })
      cards.push({
        label: 'תלמידים פעילים',
        value: statistics?.activeStudents ?? 0,
        loading: loadingStats,
      })
      cards.push({
        label: 'שעות שבועיות',
        value: statistics?.weeklyHours ?? 0,
        loading: loadingStats,
      })

      if (isConductor()) {
        cards.push({
          label: 'תזמורות',
          value: statistics?.orchestrasCount ?? 0,
          loading: loadingStats,
        })
      } else {
        cards.push({
          label: 'שיעורי תיאוריה',
          value: statistics?.theoryLessonsCount ?? 0,
          loading: loadingStats,
        })
      }
    }

    return cards
  }

  const statCards = getStatCards()

  return (
    <div className="space-y-5" dir="rtl">
      {/* Row 1: 3-column dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Right column (RTL first): Profile sidebar card */}
        <ProfileSidebar user={user} />

        {/* Center + Left columns: Stats + role widgets */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Stat cards row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map((card) => (
              <GlassStatCard
                key={card.label}
                value={card.value}
                label={card.label}
                loading={card.loading}
                size="sm"
              />
            ))}
          </div>

          {/* Role info summary card */}
          <div className="bg-primary/5 rounded-card border border-primary/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheckIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">מידע תפקיד</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(user?.roles || []).map((role: string, idx: number) => (
                <Chip key={idx} color="primary" variant="flat" size="sm">
                  {getRoleLabel(role)}
                </Chip>
              ))}
              {user?.professionalInfo?.instrument && (
                <Chip color="secondary" variant="flat" size="sm" startContent={<MusicNoteIcon className="w-3 h-3" />}>
                  {user.professionalInfo.instrument}
                </Chip>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <IdentificationCardIcon className="w-3.5 h-3.5" />
                {user?.teacherId || user?._id || user?.id || ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Tabs + Content (full-width) */}
      <div className="bg-card rounded-card border border-border shadow-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab triggers */}
          <div className="border-b border-border px-4 pt-2">
            <TabsList className="bg-transparent h-auto p-0 gap-0 justify-start rounded-none">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-none border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary bg-transparent shadow-none'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 bg-transparent shadow-none'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {/* Tab content */}
          <div className="p-6">
            <TabsContents>
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id}>
                  {activeTab === tab.id && (
                    <tab.component
                      {...(tab.id === 'students' && actionParam
                        ? { action: actionParam }
                        : {})}
                    />
                  )}
                </TabsContent>
              ))}
            </TabsContents>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
