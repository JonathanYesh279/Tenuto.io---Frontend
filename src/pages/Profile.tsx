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
} from '@phosphor-icons/react'
import { User } from '@heroui/react'
import TeacherStudentsTab from '../components/profile/TeacherStudentsTab'
import ConductorOrchestrasTab from '../components/profile/ConductorOrchestrasTab'
import TeacherScheduleTab from '../components/profile/TeacherScheduleTab'
import TheoryTeacherLessonsTab from '../components/profile/TheoryTeacherLessonsTab'
import TeacherAttendanceTab from '../components/profile/TeacherAttendanceTab'
import GeneralInfoTab from '../components/profile/GeneralInfoTab'
import CredentialsTab from '../components/profile/CredentialsTab'
import apiService, { teacherService } from '../services/apiService'
import { getDisplayName, getInitials as getNameInitials } from '../utils/nameUtils'
import { getAvatarColorHex } from '../utils/avatarColorHash'
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

      setStatistics({
        studentsCount: Array.isArray(studentData) ? studentData.length : 0,
        activeStudents: activeStudents.length,
        weeklyHours,
        orchestrasCount: Array.isArray(orchestraData) ? orchestraData.length : 0,
        theoryLessonsCount: 0,
        totalRehearsals: 0,
      })
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
  const ActiveComponent = activeTabData.component

  const componentProps: any = {}
  if (activeTab === 'students' && actionParam) {
    componentProps.action = actionParam
  }

  const getRoleDisplayName = () => {
    const roles = user?.roles || []
    if (roles.length > 0) {
      return roles
        .map((role: string) => {
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
        })
        .join(' · ')
    }
    const role = user?.role || ''
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
        return role || 'משתמש'
    }
  }

  const getUserFullName = () => {
    return getDisplayName(user?.personalInfo) || user?.name || 'משתמש'
  }

  const getUserEmail = () => {
    return user?.personalInfo?.email || user?.email || ''
  }

  const displayName = getUserFullName()
  const avatarColor = getAvatarColorHex(displayName)

  // Choose stat cards based on role
  const getStatCards = () => {
    const cards: {
      label: string
      value: number | string
      loading: boolean
    }[] = []

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

    return cards
  }

  const statCards = getStatCards()

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header — gradient with curved bottom edge (matching dashboard ProfileCard) */}
      <div className="bg-card rounded-card border border-border overflow-hidden shadow-1">
        <div className="relative">
          {/* Gradient band */}
          <div
            className="h-32 w-full"
            style={{ background: 'linear-gradient(135deg, #6ec49d 0%, #4db8a4 50%, #3aa89e 100%)' }}
          />
          {/* Curved bottom edge */}
          <div
            className="absolute bottom-0 left-0 w-full overflow-hidden"
            style={{ height: '80px' }}
          >
            <svg
              className="absolute bottom-0 left-0 w-full"
              viewBox="0 0 1440 200"
              preserveAspectRatio="none"
              style={{ height: '80px', display: 'block' }}
            >
              <path
                d="M0,200 C480,40 960,40 1440,200 L1440,200 L0,200 Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        {/* Identity block — overlapping avatar */}
        <div className="flex flex-col items-center -mt-14 px-6 pb-6 relative z-10">
          <User
            avatarProps={{
              radius: 'full',
              size: 'lg',
              showFallback: true,
              name: displayName,
              style: { backgroundColor: avatarColor },
              classNames: {
                base: 'w-20 h-20 text-2xl text-white ring-4 ring-card shadow-2',
              },
            }}
            name=""
            description=""
            classNames={{ base: 'justify-center' }}
          />
          <h1 className="text-2xl font-bold text-foreground mt-3">{displayName}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {isAdmin() && <BuildingsIcon className="w-4 h-4" />}
              {isTeacher() && !isAdmin() && <ChalkboardTeacherIcon className="w-4 h-4" />}
              {getRoleDisplayName()}
            </span>
            {getUserEmail() && (
              <span className="text-sm text-muted-foreground">{getUserEmail()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Statistics — glass stat cards */}
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

      {/* Tabs + Content — unified card */}
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
