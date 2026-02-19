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
  BookOpen,
  UserCheck,
  TrendingUp,
  Music,
  Bell,
  ChevronRight,
  Activity,
  FileText,
  BarChart3,
  BookOpenCheck,
  GraduationCap,
  ClipboardList,
  UserPlus
} from 'lucide-react'
import apiService from '../../services/apiService'

interface TheoryDashboardStats {
  totalTheoryStudents: number
  todaysLessons: number
  weeklyTheoryHours: number
  upcomingExams: number
  activeTheoryGroups: number
  pendingGrades: number
}

interface TheoryUpcomingLesson {
  id: string
  name: string
  time: string
  duration: number
  enrolledCount: number
  capacity: number
  level: string
  venue?: string
}

interface TheoryRecentActivity {
  id: string
  type: 'lesson' | 'attendance' | 'grade' | 'enrollment' | 'exam'
  title: string
  description: string
  timestamp: string
  groupName?: string
}

interface TheoryStudentProgress {
  studentId: string
  studentName: string
  theoryGroup: string
  currentLevel: string
  progressPercentage: number
  lastActivity: string
  attendanceRate: number
}

export default function TheoryTeacherDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<TheoryDashboardStats>({
    totalTheoryStudents: 0,
    todaysLessons: 0,
    weeklyTheoryHours: 0,
    upcomingExams: 0,
    activeTheoryGroups: 0,
    pendingGrades: 0
  })
  const [upcomingLessons, setUpcomingLessons] = useState<TheoryUpcomingLesson[]>([])
  const [recentActivities, setRecentActivities] = useState<TheoryRecentActivity[]>([])
  const [studentProgress, setStudentProgress] = useState<TheoryStudentProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?._id) {
      loadTheoryDashboardData()
    }
  }, [user])

  const loadTheoryDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const teacherId = user._id

      // Load theory lessons for this teacher
      const allTheoryLessons = await apiService.theory.getTheoryLessons()
      const teacherTheoryLessons = allTheoryLessons.filter(lesson => lesson.teacherId === teacherId)

      // Calculate today's theory lessons
      const today = new Date()
      const todayISOString = today.toISOString().split('T')[0]

      const todaysTheoryLessons = teacherTheoryLessons.filter(lesson => {
        const lessonDate = new Date(lesson.date)
        return lessonDate.toISOString().split('T')[0] === todayISOString
      })

      // Calculate weekly theory hours
      const weekStart = getWeekStart(new Date())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      const weeklyLessons = teacherTheoryLessons.filter(lesson => {
        const lessonDate = new Date(lesson.date)
        return lessonDate >= weekStart && lessonDate < weekEnd
      })

      const weeklyTheoryHours = weeklyLessons.reduce((total, lesson) => total + (lesson.duration || 90), 0) / 60

      // Count unique enrolled students across all theory groups
      const allEnrolledStudents = new Set()
      teacherTheoryLessons.forEach(lesson => {
        if (lesson.studentIds && lesson.studentIds.length > 0) {
          lesson.studentIds.forEach(studentId => allEnrolledStudents.add(studentId))
        }
      })

      // Count active theory groups (lessons with enrolled students)
      const activeTheoryGroups = teacherTheoryLessons.filter(lesson =>
        lesson.isActive && lesson.studentIds && lesson.studentIds.length > 0
      ).length

      // Generate upcoming lessons for today and tomorrow
      const tomorrowISOString = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const upcomingTheoryLessons = teacherTheoryLessons
        .filter(lesson => {
          const lessonDate = lesson.date.split('T')[0]
          return lessonDate === todayISOString || lessonDate === tomorrowISOString
        })
        .slice(0, 5)
        .map(lesson => ({
          id: lesson._id,
          name: lesson.title || lesson.category,
          time: lesson.startTime,
          duration: lesson.duration || 90,
          enrolledCount: lesson.studentIds?.length || 0,
          capacity: lesson.maxStudents || 15,
          level: lesson.category || 'תיאוריה',
          venue: lesson.location
        }))

      setStats({
        totalTheoryStudents: allEnrolledStudents.size,
        todaysLessons: todaysTheoryLessons.length,
        weeklyTheoryHours: Math.round(weeklyTheoryHours * 10) / 10,
        upcomingExams: Math.floor(Math.random() * 5) + 1, // Mock data
        activeTheoryGroups,
        pendingGrades: Math.floor(Math.random() * 10) + 2 // Mock data
      })

      setUpcomingLessons(upcomingTheoryLessons)

      // Generate recent activities (mock data based on real lessons)
      const activities: TheoryRecentActivity[] = []
      teacherTheoryLessons.slice(0, 5).forEach((lesson, index) => {
        activities.push({
          id: `activity-${lesson._id}-${index}`,
          type: 'lesson',
          title: 'שיעור תיאוריה הושלם',
          description: `שיעור ${lesson.title || lesson.category} - ${lesson.studentIds?.length || 0} תלמידים`,
          timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
          groupName: lesson.title || lesson.category
        })
      })

      // Add some mock attendance activities
      activities.push({
        id: 'attendance-1',
        type: 'attendance',
        title: 'נוכחות עודכנה',
        description: 'נוכחות לשיעור מגמה מתקדמת',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        groupName: 'מגמה מתקדמת'
      })

      setRecentActivities(activities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ))

      // Generate student progress data (mock data)
      const progressData: TheoryStudentProgress[] = []
      const sampleGroups = ['מגמה מתחילים', 'מגמה בינוניים', 'מגמה מתקדמים', 'הרמוניה', 'קומפוזיציה']
      const sampleNames = ['דניאל כהן', 'רחל לוי', 'יוסף גרין', 'שרה אברהם', 'מיכל דוד']

      for (let i = 0; i < Math.min(5, allEnrolledStudents.size); i++) {
        progressData.push({
          studentId: `student-${i}`,
          studentName: sampleNames[i % sampleNames.length],
          theoryGroup: sampleGroups[i % sampleGroups.length],
          currentLevel: Math.random() > 0.5 ? 'בינוני' : 'מתקדם',
          progressPercentage: Math.floor(Math.random() * 30) + 70,
          lastActivity: new Date(Date.now() - Math.random() * 604800000).toLocaleDateString('he-IL'),
          attendanceRate: Math.floor(Math.random() * 20) + 80
        })
      }

      setStudentProgress(progressData)

    } catch (error) {
      console.error('Error loading theory dashboard data:', error)
      setError('שגיאה בטעינת נתוני לוח הבקרה לתיאוריה')
    } finally {
      setLoading(false)
    }
  }

  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day
    return new Date(start.setDate(diff))
  }

  const navigate = useNavigate()

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scheduleTheoryLesson':
        // Navigate to profile with theory lessons tab
        navigate('/profile', { state: { activeTab: 'theory-lessons' } })
        break
      case 'markTheoryAttendance':
        // Navigate to profile with theory lessons tab for attendance
        navigate('/profile', { state: { activeTab: 'theory-lessons' } })
        break
      case 'manageTheoryGroups':
        // Navigate to profile with theory lessons tab for group management
        navigate('/profile', { state: { activeTab: 'theory-lessons' } })
        break
      case 'gradeStudents':
        // Navigate to theory grades page
        window.location.href = '/teacher/theory-grades'
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
          <div className="text-gray-600 font-reisinger-yonatan">טוען לוח בקרה לתיאוריה...</div>
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
              onClick={loadTheoryDashboardData}
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
            לוח בקרה - מורה תיאוריה 🎼
          </h1>
          <p className="text-gray-600 mt-2">
            שלום {user?.firstName || 'מורה'} • {new Date().toLocaleDateString('he-IL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <TheoryStatCard
            icon={<Users className="w-6 h-6" />}
            title="תלמידי תיאוריה"
            value={stats.totalTheoryStudents}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
            borderColor="border-blue-200"
          />
          <TheoryStatCard
            icon={<Calendar className="w-6 h-6" />}
            title="שיעורים היום"
            value={stats.todaysLessons}
            bgColor="bg-green-50"
            iconColor="text-green-600"
            borderColor="border-green-200"
          />
          <TheoryStatCard
            icon={<Clock className="w-6 h-6" />}
            title="שעות השבוע"
            value={stats.weeklyTheoryHours}
            suffix="שעות"
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
            borderColor="border-purple-200"
          />
          <TheoryStatCard
            icon={<GraduationCap className="w-6 h-6" />}
            title="בחינות קרובות"
            value={stats.upcomingExams}
            bgColor="bg-yellow-50"
            iconColor="text-yellow-600"
            borderColor="border-yellow-200"
          />
          <TheoryStatCard
            icon={<BookOpen className="w-6 h-6" />}
            title="קבוצות פעילות"
            value={stats.activeTheoryGroups}
            bgColor="bg-indigo-50"
            iconColor="text-indigo-600"
            borderColor="border-indigo-200"
          />
          <TheoryStatCard
            icon={<ClipboardList className="w-6 h-6" />}
            title="ציונים ממתינים"
            value={stats.pendingGrades}
            bgColor="bg-orange-50"
            iconColor="text-orange-600"
            borderColor="border-orange-200"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
            פעולות מהירות - תיאוריה
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TheoryQuickActionButton
              icon={<Plus className="w-5 h-5" />}
              label="תזמן שיעור תיאוריה"
              onClick={() => handleQuickAction('scheduleTheoryLesson')}
              color="indigo"
            />
            <TheoryQuickActionButton
              icon={<CheckSquare className="w-5 h-5" />}
              label="סמן נוכחות תיאוריה"
              onClick={() => handleQuickAction('markTheoryAttendance')}
              color="green"
            />
            <TheoryQuickActionButton
              icon={<UserPlus className="w-5 h-5" />}
              label="נהל קבוצות תיאוריה"
              onClick={() => handleQuickAction('manageTheoryGroups')}
              color="blue"
            />
            <TheoryQuickActionButton
              icon={<BookOpenCheck className="w-5 h-5" />}
              label="דרג תלמידים"
              onClick={() => handleQuickAction('gradeStudents')}
              color="purple"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Theory Lessons */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                  השיעורים הבאים - תיאוריה
                </h2>
                <button
                  onClick={() => navigate('/profile', { state: { activeTab: 'theory-lessons' } })}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                >
                  צפה בכל
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {upcomingLessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-reisinger-yonatan">אין שיעורי תיאוריה מתוכננים</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingLessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 font-reisinger-yonatan">{lesson.name}</div>
                          <div className="text-sm text-gray-600 font-reisinger-yonatan">
                            {lesson.level} • {lesson.enrolledCount}/{lesson.capacity} תלמידים
                          </div>
                          {lesson.venue && (
                            <div className="text-xs text-gray-500 font-reisinger-yonatan">{lesson.venue}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{lesson.time}</div>
                        <div className="text-xs text-gray-500">
                          {lesson.duration} דקות
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theory Student Progress */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                  התקדמות תלמידי תיאוריה
                </h2>
                <button
                  onClick={() => navigate('/profile', { state: { activeTab: 'theory-lessons' } })}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                >
                  צפה בכל
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {studentProgress.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-reisinger-yonatan">אין נתוני התקדמות</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentProgress.map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 font-reisinger-yonatan">{student.studentName}</div>
                          <div className="text-sm text-gray-600 font-reisinger-yonatan">
                            {student.theoryGroup} • רמה: {student.currentLevel}
                          </div>
                          <div className="text-xs text-gray-500 font-reisinger-yonatan">
                            פעילות אחרונה: {student.lastActivity}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                student.progressPercentage >= 90 ? 'bg-green-500' :
                                student.progressPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${student.progressPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{student.progressPercentage}%</span>
                        </div>
                        <div className="text-xs text-gray-500 font-reisinger-yonatan">
                          נוכחות: {student.attendanceRate}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Theory Activity Feed */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                פעילות אחרונה - תיאוריה
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
                      activity.type === 'lesson' ? 'bg-blue-100' :
                      activity.type === 'attendance' ? 'bg-green-100' :
                      activity.type === 'grade' ? 'bg-purple-100' :
                      activity.type === 'enrollment' ? 'bg-yellow-100' : 'bg-indigo-100'
                    }`}>
                      {activity.type === 'lesson' && <BookOpen className="w-4 h-4 text-blue-600" />}
                      {activity.type === 'attendance' && <CheckSquare className="w-4 h-4 text-green-600" />}
                      {activity.type === 'grade' && <TrendingUp className="w-4 h-4 text-purple-600" />}
                      {activity.type === 'enrollment' && <UserPlus className="w-4 h-4 text-yellow-600" />}
                      {activity.type === 'exam' && <GraduationCap className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 font-reisinger-yonatan">{activity.title}</p>
                      <p className="text-sm text-gray-600 truncate font-reisinger-yonatan">{activity.description}</p>
                      {activity.groupName && (
                        <p className="text-xs text-indigo-600 font-reisinger-yonatan">{activity.groupName}</p>
                      )}
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

// Theory Stat Card Component
interface TheoryStatCardProps {
  icon: React.ReactNode
  title: string
  value: number
  suffix?: string
  bgColor: string
  iconColor: string
  borderColor: string
}

function TheoryStatCard({ icon, title, value, suffix, bgColor, iconColor, borderColor }: TheoryStatCardProps) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 font-reisinger-yonatan">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {value} {suffix && <span className="text-sm font-normal">{suffix}</span>}
          </p>
        </div>
        <div className={`${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Theory Quick Action Button Component
interface TheoryQuickActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  color: 'indigo' | 'green' | 'blue' | 'purple'
}

function TheoryQuickActionButton({ icon, label, onClick, color }: TheoryQuickActionButtonProps) {
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
      <span className="mt-2 text-sm font-medium font-reisinger-yonatan text-center">{label}</span>
    </button>
  )
}