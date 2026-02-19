import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../services/authContext.jsx'
import {
  Users,
  Calendar,
  Clock,
  Award,
  Plus,
  CheckSquare,
  Music,
  UserCheck,
  TrendingUp,
  Bell,
  ChevronRight,
  Activity,
  FileText,
  BarChart3,
  Mic,
  Volume2,
  CalendarDays,
  Timer,
  Star,
  Target,
  BookOpen,
  MapPin,
  GraduationCap,
  AlertCircle,
  Eye
} from 'lucide-react'
import apiService from '../../services/apiService'
import type { Bagrut } from '../../types/bagrut.types'
import { getDisplayName } from '@/utils/nameUtils'

interface ConductorDashboardStats {
  totalOrchestras: number
  activeMusicians: number
  upcomingRehearsals: number
  completedConcerts: number
  totalMembers: number
  weeklyRehearsals: number
  bagrutMembers: number
  activeBagrutStudents: number
}

interface UpcomingRehearsal {
  id: string
  orchestraName: string
  date: string
  time: string
  location: string
  attendanceRate?: number
  duration: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

interface RecentActivity {
  id: string
  type: 'rehearsal' | 'enrollment' | 'performance' | 'attendance'
  title: string
  description: string
  timestamp: string
  orchestraName?: string
}

interface OrchestraPerformance {
  orchestraId: string
  orchestraName: string
  totalRehearsals: number
  averageAttendance: number
  upcomingConcerts: number
  lastRehearsal: string
  status: 'excellent' | 'good' | 'needs_attention'
}

interface BagrutOrchestraMember {
  studentId: string
  studentName: string
  instrument: string
  section: string
  bagrutStatus: 'active' | 'completed' | 'pending' | 'none'
  stage?: number
  progress?: number
  nextExamDate?: Date
  orchestraName: string
}

export default function ConductorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ConductorDashboardStats>({
    totalOrchestras: 0,
    activeMusicians: 0,
    upcomingRehearsals: 0,
    completedConcerts: 0,
    totalMembers: 0,
    weeklyRehearsals: 0,
    bagrutMembers: 0,
    activeBagrutStudents: 0
  })
  const [upcomingRehearsals, setUpcomingRehearsals] = useState<UpcomingRehearsal[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [orchestraPerformance, setOrchestraPerformance] = useState<OrchestraPerformance[]>([])
  const [bagrutMembers, setBagrutMembers] = useState<BagrutOrchestraMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?._id) {
      loadConductorDashboardData()
    }
  }, [user])

  const loadConductorDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const conductorId = user._id

      // Load conductor profile and orchestras
      const [conductorProfile] = await Promise.all([
        apiService.teachers.getTeacher(conductorId)
      ])

      if (!conductorProfile) {
        throw new Error('לא נמצא פרופיל מנצח')
      }

      const orchestraIds = conductorProfile?.conducting?.orchestraIds || []

      let orchestras = []
      let totalMembers = 0
      let allRehearsals = []

      if (orchestraIds.length > 0) {
        // Load orchestras and their details
        orchestras = await apiService.orchestras.getBatchOrchestras(orchestraIds)

        // Calculate total members
        totalMembers = orchestras.reduce((sum, orchestra) => sum + (orchestra.memberCount || 0), 0)

        // Load rehearsals for all orchestras
        try {
          const allRehearsalsData = await apiService.rehearsals.getRehearsals({
            groupIds: orchestraIds.join(','),
            limit: 100
          })
          allRehearsals = Array.isArray(allRehearsalsData) ? allRehearsalsData : []
        } catch (rehearsalError) {
          console.warn('Error loading rehearsals:', rehearsalError)
          allRehearsals = []
        }
      }

      // Calculate upcoming rehearsals (next 7 days)
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      const upcomingRehearsalsData = allRehearsals
        .filter(rehearsal => {
          const rehearsalDate = new Date(rehearsal.date)
          return rehearsalDate >= today && rehearsalDate <= nextWeek
        })
        .slice(0, 5)
        .map(rehearsal => {
          const orchestra = orchestras.find(o => o._id === rehearsal.groupId)
          return {
            id: rehearsal._id,
            orchestraName: orchestra?.name || 'תזמורת',
            date: new Date(rehearsal.date).toLocaleDateString('he-IL'),
            time: rehearsal.startTime || '19:00',
            location: rehearsal.location || 'אולם מוזיקה',
            attendanceRate: Math.floor(Math.random() * 20) + 80, // Mock data
            duration: 120,
            status: 'scheduled' as const
          }
        })

      setUpcomingRehearsals(upcomingRehearsalsData)

      // Calculate weekly rehearsals count
      const weeklyRehearsals = allRehearsals.filter(rehearsal => {
        const rehearsalDate = new Date(rehearsal.date)
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return rehearsalDate >= weekStart && rehearsalDate <= weekEnd
      }).length

      // Load Bagrut data for orchestra members
      let bagrutMembersData: BagrutOrchestraMember[] = []
      let bagrutCount = 0
      let activeBagrutCount = 0

      if (orchestras.length > 0) {
        // Get all orchestra members
        const allMemberIds = orchestras.flatMap(orchestra =>
          orchestra?.members?.map(m => m.studentId) || []
        )

        if (allMemberIds.length > 0) {
          try {
            // Load Bagrut data for orchestra members
            const [bagruts, students] = await Promise.all([
              Promise.all(allMemberIds.map(id =>
                apiService.bagrut.getBagrutByStudent(id).catch(() => null)
              )).then(results => results.filter(Boolean)),
              apiService.students.getBatchStudents(allMemberIds)
            ])

            // Process Bagrut data for orchestra members
            bagrutMembersData = allMemberIds.map(studentId => {
              const student = students.find(s => s._id === studentId)
              const bagrut = bagruts.find(b => b.studentId === studentId)
              const memberInfo = orchestras.flatMap(o => o.members || []).find(m => m.studentId === studentId)
              const orchestra = orchestras.find(o => o.members?.some(m => m.studentId === studentId))

              let bagrutStatus: BagrutOrchestraMember['bagrutStatus'] = 'none'
              let stage: number | undefined
              let progress: number | undefined
              let nextExamDate: Date | undefined

              if (bagrut) {
                const completedPresentations = bagrut.presentations?.filter(p => p.completed).length || 0
                stage = completedPresentations + 1
                progress = (completedPresentations / 4) * 100

                if (bagrut.isCompleted && bagrut.finalGrade && bagrut.finalGrade >= 55) {
                  bagrutStatus = 'completed'
                } else if (bagrut.isCompleted && bagrut.finalGrade && bagrut.finalGrade < 55) {
                  bagrutStatus = 'none' // Failed, treated as none for orchestra purposes
                } else if (completedPresentations === 0) {
                  bagrutStatus = 'pending'
                } else {
                  bagrutStatus = 'active'
                }

                // Generate next exam date for active students
                if (bagrutStatus === 'active') {
                  const today = new Date()
                  const daysToAdd = Math.floor(Math.random() * 30) + 7
                  nextExamDate = new Date(today)
                  nextExamDate.setDate(today.getDate() + daysToAdd)
                }
              }

              return {
                studentId,
                studentName: getDisplayName(student?.personalInfo) || 'תלמיד לא ידוע',
                instrument: memberInfo?.instrument || student?.academicInfo?.primaryInstrument || 'לא צוין',
                section: memberInfo?.section || 'לא צוין',
                bagrutStatus,
                stage,
                progress,
                nextExamDate,
                orchestraName: orchestra?.name || 'תזמורת'
              }
            })

            bagrutCount = bagrutMembersData.filter(m => m.bagrutStatus !== 'none').length
            activeBagrutCount = bagrutMembersData.filter(m => m.bagrutStatus === 'active').length

          } catch (bagrutError) {
            console.warn('Error loading Bagrut data:', bagrutError)
          }
        }
      }

      setBagrutMembers(bagrutMembersData)

      // Calculate dashboard statistics
      const dashboardStats: ConductorDashboardStats = {
        totalOrchestras: orchestras.length,
        activeMusicians: totalMembers,
        upcomingRehearsals: upcomingRehearsalsData.length,
        completedConcerts: Math.floor(Math.random() * 5) + 2, // Mock data
        totalMembers,
        weeklyRehearsals,
        bagrutMembers: bagrutCount,
        activeBagrutStudents: activeBagrutCount
      }

      setStats(dashboardStats)

      // Generate orchestra performance data
      const performanceData: OrchestraPerformance[] = orchestras.map(orchestra => {
        const orchestraRehearsals = allRehearsals.filter(r => r.groupId === orchestra._id)
        const averageAttendance = Math.floor(Math.random() * 20) + 80 // Mock data

        return {
          orchestraId: orchestra._id,
          orchestraName: orchestra.name,
          totalRehearsals: orchestraRehearsals.length,
          averageAttendance,
          upcomingConcerts: Math.floor(Math.random() * 3) + 1, // Mock data
          lastRehearsal: orchestraRehearsals.length > 0
            ? new Date(orchestraRehearsals[orchestraRehearsals.length - 1].date).toLocaleDateString('he-IL')
            : 'אין נתונים',
          status: averageAttendance >= 90 ? 'excellent' : averageAttendance >= 75 ? 'good' : 'needs_attention'
        }
      })

      setOrchestraPerformance(performanceData)

      // Generate recent activities
      const activities: RecentActivity[] = []

      // Add rehearsal activities
      allRehearsals.slice(0, 3).forEach(rehearsal => {
        const orchestra = orchestras.find(o => o._id === rehearsal.groupId)
        activities.push({
          id: `rehearsal-${rehearsal._id}`,
          type: 'rehearsal',
          title: 'חזרה הושלמה',
          description: `חזרה של ${orchestra?.name || 'תזמורת'} - ${rehearsal.location || 'אולם מוזיקה'}`,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          orchestraName: orchestra?.name
        })
      })

      // Add enrollment activities
      orchestras.slice(0, 2).forEach(orchestra => {
        activities.push({
          id: `enrollment-${orchestra._id}`,
          type: 'enrollment',
          title: 'רישום חדש',
          description: `תלמיד חדש הצטרף ל${orchestra.name}`,
          timestamp: new Date(Date.now() - Math.random() * 172800000).toISOString(),
          orchestraName: orchestra.name
        })
      })

      setRecentActivities(activities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ))

    } catch (error) {
      console.error('Error loading conductor dashboard data:', error)
      setError('שגיאה בטעינת נתוני לוח הבקרה')
    } finally {
      setLoading(false)
    }
  }

  const navigate = useNavigate()

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scheduleRehearsal':
        // Navigate to profile with orchestras tab for rehearsal scheduling
        navigate('/profile', { state: { activeTab: 'orchestras' } })
        break
      case 'markAttendance':
        // Navigate to profile with orchestras tab for attendance
        navigate('/profile', { state: { activeTab: 'orchestras' } })
        break
      case 'manageOrchestras':
        // Navigate to profile with orchestras tab
        navigate('/profile', { state: { activeTab: 'orchestras' } })
        break
      case 'viewMusicians':
        // Navigate to profile with orchestras tab to view musicians
        navigate('/profile', { state: { activeTab: 'orchestras' } })
        break
      default:
        console.log('Action:', action)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `לפני ${minutes} דקות`
    } else if (hours < 24) {
      return `לפני ${hours} שעות`
    } else {
      const days = Math.floor(hours / 24)
      return `לפני ${days} ימים`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-reisinger-yonatan">טוען לוח בקרה למנצח...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-800 font-reisinger-yonatan text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-bold mb-2">{error}</h3>
            <button
              onClick={loadConductorDashboardData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-reisinger-yonatan">
            שלום מנצח {user?.firstName || 'יקר'} 🎼
          </h1>
          <p className="text-gray-600 mt-2">
            {new Date().toLocaleDateString('he-IL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <StatCard
            icon={<Music className="w-6 h-6" />}
            title="סה״כ תזמורות"
            value={stats.totalOrchestras}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
            borderColor="border-blue-200"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="מוזיקאים פעילים"
            value={stats.activeMusicians}
            bgColor="bg-green-50"
            iconColor="text-green-600"
            borderColor="border-green-200"
          />
          <StatCard
            icon={<CalendarDays className="w-6 h-6" />}
            title="חזרות השבוע"
            value={stats.weeklyRehearsals}
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
            borderColor="border-purple-200"
          />
          <StatCard
            icon={<Star className="w-6 h-6" />}
            title="קונצרטים השנה"
            value={stats.completedConcerts}
            bgColor="bg-yellow-50"
            iconColor="text-yellow-600"
            borderColor="border-yellow-200"
          />
          <StatCard
            icon={<GraduationCap className="w-6 h-6" />}
            title="חברי בגרות"
            value={stats.bagrutMembers}
            bgColor="bg-indigo-50"
            iconColor="text-indigo-600"
            borderColor="border-indigo-200"
          />
          <StatCard
            icon={<Target className="w-6 h-6" />}
            title="בגרות פעילה"
            value={stats.activeBagrutStudents}
            bgColor="bg-orange-50"
            iconColor="text-orange-600"
            borderColor="border-orange-200"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
            פעולות מהירות
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              icon={<Calendar className="w-5 h-5" />}
              label="קבע חזרה"
              onClick={() => handleQuickAction('scheduleRehearsal')}
              color="indigo"
            />
            <QuickActionButton
              icon={<CheckSquare className="w-5 h-5" />}
              label="סמן נוכחות"
              onClick={() => handleQuickAction('markAttendance')}
              color="green"
            />
            <QuickActionButton
              icon={<Mic className="w-5 h-5" />}
              label="נהל תזמורות"
              onClick={() => handleQuickAction('manageOrchestras')}
              color="blue"
            />
            <QuickActionButton
              icon={<UserCheck className="w-5 h-5" />}
              label="צפה במוזיקאים"
              onClick={() => handleQuickAction('viewMusicians')}
              color="purple"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Rehearsals */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                  החזרות הקרובות
                </h2>
                <button
                  onClick={() => navigate('/profile', { state: { activeTab: 'orchestras' } })}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                >
                  צפה בכל
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {upcomingRehearsals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-reisinger-yonatan">אין חזרות מתוכננות השבוע</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingRehearsals.map((rehearsal) => (
                    <div key={rehearsal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Volume2 className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 font-reisinger-yonatan">{rehearsal.orchestraName}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {rehearsal.location}
                          </div>
                          {rehearsal.attendanceRate && (
                            <div className="text-xs text-gray-500">
                              נוכחות ממוצעת: {rehearsal.attendanceRate}%
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{rehearsal.date}</div>
                        <div className="text-sm text-gray-600">{rehearsal.time}</div>
                        <div className="text-xs text-gray-500">
                          <Timer className="w-3 h-3 inline mr-1" />
                          {rehearsal.duration} דקות
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bagrut Orchestra Members */}
            {bagrutMembers.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                    חברי תזמורת עם בגרות
                  </h2>
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                </div>

                {/* Bagrut Status Summary */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {bagrutMembers.filter(m => m.bagrutStatus === 'active').length}
                    </div>
                    <div className="text-sm text-gray-600">בגרות פעילה</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {bagrutMembers.filter(m => m.bagrutStatus === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">הושלמה</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-xl font-bold text-yellow-600">
                      {bagrutMembers.filter(m => m.bagrutStatus === 'pending').length}
                    </div>
                    <div className="text-sm text-gray-600">ממתינים</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-600">
                      {bagrutMembers.filter(m => m.bagrutStatus === 'none').length}
                    </div>
                    <div className="text-sm text-gray-600">ללא בגרות</div>
                  </div>
                </div>

                {/* Active Bagrut Students List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">תלמידי בגרות פעילים</h3>
                  {bagrutMembers
                    .filter(m => m.bagrutStatus === 'active')
                    .slice(0, 5)
                    .map((member) => (
                      <div key={member.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Music className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{member.studentName}</div>
                            <div className="text-sm text-gray-600">
                              {member.instrument} • {member.section} • {member.orchestraName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {member.stage && (
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              השמעה {member.stage}/4
                            </div>
                          )}
                          {member.progress !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${member.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{Math.round(member.progress)}%</span>
                            </div>
                          )}
                          {member.nextExamDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              מבחן הבא: {member.nextExamDate.toLocaleDateString('he-IL')}
                            </div>
                          )}
                          <button className="mt-2 p-1 text-gray-400 hover:text-blue-600">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  {bagrutMembers.filter(m => m.bagrutStatus === 'active').length > 5 && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => window.location.href = '/teacher/bagrut'}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        צפה בכל תלמידי הבגרות ({bagrutMembers.filter(m => m.bagrutStatus === 'active').length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orchestra Performance Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                  ביצועי תזמורות
                </h2>
                <button
                  onClick={() => navigate('/profile', { state: { activeTab: 'orchestras' } })}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                >
                  דוח מפורט
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {orchestraPerformance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-reisinger-yonatan">אין נתוני ביצועים</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orchestraPerformance.map((performance) => (
                    <div key={performance.orchestraId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          performance.status === 'excellent' ? 'bg-green-500' :
                          performance.status === 'good' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900 font-reisinger-yonatan">{performance.orchestraName}</div>
                          <div className="text-sm text-gray-600">
                            {performance.totalRehearsals} חזרות השנה • חזרה אחרונה: {performance.lastRehearsal}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className={`font-medium ${
                            performance.averageAttendance >= 90 ? 'text-green-600' :
                            performance.averageAttendance >= 75 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {performance.averageAttendance}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">נוכחות ממוצעת</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                פעילות אחרונה
              </h2>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>

            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-reisinger-yonatan">אין פעילות לאחרונה</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'rehearsal' ? 'bg-blue-100' :
                      activity.type === 'enrollment' ? 'bg-green-100' :
                      activity.type === 'performance' ? 'bg-purple-100' : 'bg-yellow-100'
                    }`}>
                      {activity.type === 'rehearsal' && <Music className="w-4 h-4 text-blue-600" />}
                      {activity.type === 'enrollment' && <UserCheck className="w-4 h-4 text-green-600" />}
                      {activity.type === 'performance' && <Star className="w-4 h-4 text-purple-600" />}
                      {activity.type === 'attendance' && <CheckSquare className="w-4 h-4 text-yellow-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 font-reisinger-yonatan">{activity.title}</p>
                      <p className="text-sm text-gray-600 truncate font-reisinger-yonatan">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: number
  suffix?: string
  bgColor: string
  iconColor: string
  borderColor: string
}

function StatCard({ icon, title, value, suffix, bgColor, iconColor, borderColor }: StatCardProps) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {value} {suffix && <span className="text-lg font-normal">{suffix}</span>}
          </p>
        </div>
        <div className={`${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Quick Action Button Component
interface QuickActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  color: 'indigo' | 'green' | 'blue' | 'purple'
}

function QuickActionButton({ icon, label, onClick, color }: QuickActionButtonProps) {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200',
    green: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200'
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded border transition-colors ${colorClasses[color]}`}
    >
      {icon}
      <span className="mt-2 text-sm font-medium font-reisinger-yonatan">{label}</span>
    </button>
  )
}