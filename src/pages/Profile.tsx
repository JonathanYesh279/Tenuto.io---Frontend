import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/authContext.jsx'
import { User, Users, Music, BookOpen, Calendar, Clock, TrendingUp, Activity, ArrowRight, CheckSquare } from 'lucide-react'
import TeacherStudentsTab from '../components/profile/TeacherStudentsTab'
import ConductorOrchestrasTab from '../components/profile/ConductorOrchestrasTab'
import TeacherScheduleTab from '../components/profile/TeacherScheduleTab'
import TheoryTeacherLessonsTab from '../components/profile/TheoryTeacherLessonsTab'
import TeacherAttendanceTab from '../components/profile/TeacherAttendanceTab'
import GeneralInfoTab from '../components/profile/GeneralInfoTab'
import apiService, { teacherService } from '../services/apiService'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType
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
    // Check for state-based navigation first (from navigate with state)
    const state = location.state as { activeTab?: string } | null
    if (state?.activeTab) {
      setActiveTab(state.activeTab)
      // Clear the state to prevent persistence on refresh
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    // Check for query parameter-based navigation (from URL)
    const searchParams = new URLSearchParams(location.search)
    const tabParam = searchParams.get('tab')
    const action = searchParams.get('action')

    if (tabParam) {
      setActiveTab(tabParam)
    }

    if (action) {
      setActionParam(action)
    }

    // Clear the query parameters
    if (tabParam || action) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [location])

  useEffect(() => {
    if (user) {
      loadProfileStatistics()
    }
  }, [user])

  const loadProfileStatistics = async () => {
    try {
      setLoadingStats(true)
      const userId = user?._id || user?.teacherId || user?.id
      
      if (!userId) {
        console.warn('No user ID available for loading profile statistics')
        return
      }
      
      // Load teacher profile first to get all relevant data
      const teacherProfile = await teacherService.getMyProfile()
      
      if (!teacherProfile) {
        console.warn('No teacher profile found')
        setStatistics({
          studentsCount: 0,
          activeStudents: 0,
          weeklyHours: 0,
          orchestrasCount: 0,
          theoryLessonsCount: 0
        })
        return
      }
      
      // Extract data from teacher profile structure
      const studentIds = teacherProfile?.teaching?.studentIds || []
      const orchestraIds = teacherProfile?.conducting?.orchestraIds || []
      const timeBlocks = teacherProfile?.teaching?.timeBlocks || []
      
      // Fetch actual data only if IDs exist, with individual error handling
      const [studentDataResult, orchestraDataResult] = await Promise.allSettled([
        studentIds.length > 0 ? apiService.students.getBatchStudents(studentIds) : Promise.resolve([]),
        orchestraIds.length > 0 ? apiService.orchestras.getBatchOrchestras(orchestraIds) : Promise.resolve([])
      ])
      
      // Handle student data result
      const studentData = studentDataResult.status === 'fulfilled' ? studentDataResult.value : []
      if (studentDataResult.status === 'rejected') {
        console.error('Failed to load student data:', studentDataResult.reason)
      }
      
      // Handle orchestra data result  
      const orchestraData = orchestraDataResult.status === 'fulfilled' ? orchestraDataResult.value : []
      if (orchestraDataResult.status === 'rejected') {
        console.error('Failed to load orchestra data:', orchestraDataResult.reason)
      }
      
      const activeStudents = Array.isArray(studentData) ? studentData.filter(s => s.academicInfo?.isActive !== false) : []
      const totalWeeklyMinutes = Array.isArray(timeBlocks) ? timeBlocks.reduce((total, block) => 
        total + (parseInt(block.totalDuration) || 0), 0) : 0
      const weeklyHours = Math.round((totalWeeklyMinutes / 60) * 10) / 10 // Convert to hours with 1 decimal
      
      setStatistics({
        studentsCount: Array.isArray(studentData) ? studentData.length : 0,
        activeStudents: activeStudents.length,
        weeklyHours: weeklyHours,
        orchestrasCount: Array.isArray(orchestraData) ? orchestraData.length : 0,
        theoryLessonsCount: 0 // Will implement if theory teacher
      })
    } catch (error) {
      console.error('Error loading profile statistics:', error)
      // Set fallback statistics
      setStatistics({
        studentsCount: 0,
        activeStudents: 0,
        weeklyHours: 0,
        orchestrasCount: 0,
        theoryLessonsCount: 0
      })
    } finally {
      setLoadingStats(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען פרטי משתמש...</div>
        </div>
      </div>
    )
  }

  // Helper function to check if user is a conductor
  const isConductor = () => {
    return (
      user?.roles?.includes('conductor') ||
      user?.roles?.includes('מנצח') ||
      (user?.conducting?.orchestraIds && user.conducting.orchestraIds.length > 0)
    )
  }

  // Helper function to check if user is a teacher
  const isTeacher = () => {
    return (
      user?.roles?.includes('teacher') ||
      user?.roles?.includes('מורה') ||
      (user?.teaching?.studentIds && user.teaching.studentIds.length > 0)
    )
  }

  // Helper function to check if user is a theory teacher
  const isTheoryTeacher = () => {
    return (
      user?.roles?.includes('theory_teacher') ||
      user?.roles?.includes('מורה תאוריה')
    )
  }

  const getTabsByRole = (): Tab[] => {
    const baseTabs: Tab[] = [
      {
        id: 'general',
        label: 'פרטים כלליים',
        icon: User,
        component: GeneralInfoTab
      }
    ]

    const tabs = [...baseTabs]

    // Add teacher tabs if user is a teacher
    if (isTeacher()) {
      tabs.push({
        id: 'students',
        label: 'התלמידים שלי',
        icon: Users,
        component: TeacherStudentsTab
      })
      tabs.push({
        id: 'schedule',
        label: 'לוח זמנים שבועי',
        icon: Calendar,
        component: TeacherScheduleTab
      })
      // Add attendance tab only if teacher has students
      const hasStudents = user?.teaching?.studentIds && user.teaching.studentIds.length > 0
      if (hasStudents) {
        tabs.push({
          id: 'attendance',
          label: 'נוכחות',
          icon: CheckSquare,
          component: TeacherAttendanceTab
        })
      }
    }

    // Add conductor tab if user is a conductor
    if (isConductor()) {
      tabs.push({
        id: 'orchestras',
        label: 'התזמורות שלי',
        icon: Music,
        component: ConductorOrchestrasTab
      })
    }

    // Add theory teacher tab if user is a theory teacher
    if (isTheoryTeacher()) {
      tabs.push({
        id: 'lessons',
        label: 'שיעורי התיאוריה שלי',
        icon: BookOpen,
        component: TheoryTeacherLessonsTab
      })
    }

    return tabs
  }

  const tabs = getTabsByRole()
  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0]
  const ActiveComponent = activeTabData.component

  // Component props to pass action parameter
  const componentProps: any = {}
  if (activeTab === 'students' && actionParam) {
    componentProps.action = actionParam
  }

  const getRoleDisplayName = () => {
    const role = user?.role || user?.roles?.[0] || ''
    // Handle both English and Hebrew role names from backend
    switch (role) {
      case 'teacher': return 'מורה'
      case 'מורה': return 'מורה'
      case 'conductor': return 'מנצח'
      case 'מנצח': return 'מנצח'
      case 'theory_teacher': return 'מורה תיאוריה'
      case 'מורה תיאוריה': return 'מורה תיאוריה'
      case 'admin': return 'מנהל'
      case 'מנהל': return 'מנהל'
      default: return role || 'משתמש'
    }
  }
  
  const getUserFullName = () => {
    return user?.personalInfo?.fullName || user?.fullName || user?.name || 'משתמש'
  }
  
  const getInitials = () => {
    const fullName = getUserFullName()
    if (!fullName || fullName === 'משתמש') return 'מ'
    const words = fullName.trim().split(' ')
    if (words.length >= 2) {
      return words[0][0] + words[1][0]
    }
    return words[0][0] || 'מ'
  }
  
  const getUserEmail = () => {
    return user?.personalInfo?.email || user?.email || ''
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-xl font-bold text-white font-reisinger-yonatan">
              {getInitials()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-reisinger-yonatan">
              {getUserFullName()}
            </h1>
            <p className="text-gray-600 mt-1">
              {getRoleDisplayName()} • {getUserEmail()}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          title="סה״כ תלמידים"
          value={loadingStats ? '...' : statistics?.studentsCount?.toString() || '0'}
          icon={Users}
          color="blue"
          loading={loadingStats}
        />
        <StatCard
          title="תלמידים פעילים"
          value={loadingStats ? '...' : statistics?.activeStudents?.toString() || '0'}
          icon={Activity}
          color="green"
          loading={loadingStats}
        />
        <StatCard
          title="שעות שבועיות"
          value={loadingStats ? '...' : statistics?.weeklyHours?.toString() || '0'}
          icon={Clock}
          color="purple"
          loading={loadingStats}
        />
        <StatCard
          title={isConductor() ? 'תזמורות' : 'שיעורי תיאוריה'}
          value={loadingStats ? '...' : (statistics?.orchestrasCount || statistics?.theoryLessonsCount)?.toString() || '0'}
          icon={isConductor() ? Music : BookOpen}
          color="indigo"
          loading={loadingStats}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex gap-0 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-reisinger-yonatan">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <ActiveComponent {...componentProps} />
        </div>
      </div>
    </div>
  )
}

// Statistics Card Component
interface StatCardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'purple' | 'indigo'
  loading?: boolean
}

function StatCard({ title, value, icon: Icon, color, loading }: StatCardProps) {
  const colorVariants = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200'
    }
  }

  const variant = colorVariants[color]

  return (
    <div className={`bg-white rounded-lg border ${variant.border} p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 font-reisinger-yonatan truncate">
            {title}
          </p>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 font-reisinger-yonatan">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-12 sm:w-16 rounded"></div>
            ) : (
              value
            )}
          </div>
        </div>
        <div className={`${variant.bg} p-2 sm:p-3 rounded-full flex-shrink-0 ml-2`}>
          <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${variant.text}`} />
        </div>
      </div>
    </div>
  )
}