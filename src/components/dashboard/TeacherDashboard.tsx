import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../services/authContext.jsx'

import apiService, { hoursSummaryService } from '../../services/apiService'
import { TeacherDataTransformUtils } from '../../services/teacherDetailsApi'
import type { Bagrut } from '../../types/bagrut.types'
import { getDisplayName } from '@/utils/nameUtils'
import { ActivityIcon, BellIcon, BookOpenIcon, CalendarClockIcon, CalendarIcon, CaretRightIcon, ChartBarIcon, CheckSquareIcon, ClockIcon, EyeIcon, FileTextIcon, FloppyDiskIcon, GearIcon, GraduationCapIcon, MedalIcon, MusicNotesIcon, PencilIcon, PlusIcon, TargetIcon, TrashIcon, TrendUpIcon, UserCircleCheckIcon, UsersIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'

interface DashboardStats {
  totalStudents: number
  todaysLessons: number
  weeklyHours: number
  activeBagrutStudents: number
}

interface UpcomingLesson {
  id: string
  studentName: string
  time: string
  instrument: string
  duration: number
  type: 'individual' | 'group'
}

interface RecentActivity {
  id: string
  type: 'lesson' | 'attendance' | 'note' | 'grade'
  title: string
  description: string
  timestamp: string
  studentName?: string
}

interface StudentAttendance {
  studentId: string
  studentName: string
  lastLesson: string
  attendanceRate: number
  status: 'present' | 'absent' | 'late'
}

interface BagrutStudent {
  studentId: string
  studentName: string
  instrument: string
  stage: number
  progress: number
  nextExamDate?: Date
  status: 'active' | 'completed' | 'pending' | 'failed'
  finalGrade?: number
  completedPresentations: number
  totalPresentations: number
  bagrutId?: string
}

interface Orchestra {
  _id: string
  name: string
  conductorId: string
  members: any[]
  memberCount?: number
  rehearsalSchedule?: any[]
  nextRehearsal?: string
  level?: string
}

interface TheoryLesson {
  _id: string
  title: string
  subject: string
  level: string
  teacherId: string
  enrolledStudents: any[]
  schedule?: any
  dayOfWeek?: string
  time?: string
  room?: string
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    todaysLessons: 0,
    weeklyHours: 0,
    activeBagrutStudents: 0
  })
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([])
  const [bagrutStudents, setBagrutStudents] = useState<BagrutStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [showAddLessonModal, setShowAddLessonModal] = useState(false)
  const [showTimeBlockNotification, setShowTimeBlockNotification] = useState(false)
  const [teacherTimeBlocks, setTeacherTimeBlocks] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [orchestras, setOrchestras] = useState<Orchestra[]>([])
  const [theoryLessons, setTheoryLessons] = useState<TheoryLesson[]>([])
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [hoursSummary, setHoursSummary] = useState<{
    totalWeeklyHours: number
    individualLessons: number
    orchestraConducting: number
    theoryTeaching: number
  } | null>(null)

  // Weekly schedule state for overview
  const [weeklySchedule, setWeeklySchedule] = useState<any>({
    days: []
  })

  useEffect(() => {
    if (user?._id) {
      detectUserRoles()
    }
  }, [user])

  useEffect(() => {
    if (user?._id && userRoles.length >= 0) {
      loadDashboardData()
    }
  }, [user, userRoles])

  // Toast timeout effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const detectUserRoles = () => {
    // Detect user roles from various possible fields
    const roles = user?.roles || []
    const role = user?.role
    const allRoles = user?.allRoles || []

    // Combine all possible role sources
    let combinedRoles = [...roles]
    if (role && !combinedRoles.includes(role)) {
      combinedRoles.push(role)
    }
    combinedRoles = [...new Set([...combinedRoles, ...allRoles])]

    // Normalize role names
    const normalizedRoles = combinedRoles.map(r => {
      const lowerRole = r?.toLowerCase()
      if (lowerRole === 'conductor' || lowerRole === 'מנצח') return 'conductor'
      if (lowerRole === 'theory-teacher' || lowerRole === 'מורה תיאוריה' || lowerRole === 'theory teacher') return 'theory-teacher'
      if (lowerRole === 'teacher' || lowerRole === 'מורה') return 'teacher'
      return r
    })

    setUserRoles([...new Set(normalizedRoles)])
  }

  const loadWeeklySchedule = async (teacherId: string) => {
    try {
      const transformedData = await TeacherDataTransformUtils.getTransformedWeeklySchedule(teacherId)
      if (transformedData) {
        setWeeklySchedule(transformedData)
        return transformedData
      }
    } catch (error) {
      console.log('Error loading weekly schedule:', error)
    }
    return getEmptyWeeklySchedule()
  }

  const getEmptyWeeklySchedule = () => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'].map(dayName => ({
      dayName,
      lessons: []
    }))
    return { days }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const teacherId = user._id

      // Load teacher profile and students
      // Use getMyProfile() for current user's data (includes all teaching info)
      const [teacherProfile, weekSchedule] = await Promise.all([
        apiService.teachers.getMyProfile(), // Changed to getMyProfile for authenticated user
        loadWeeklySchedule(teacherId)
      ])

      if (!teacherProfile) {
        throw new Error('לא נמצא פרופיל מורה')
      }

      // Debug log to see what data we're getting
      console.log('Teacher profile loaded:', {
        name: getDisplayName(teacherProfile?.personalInfo),
        timeBlocks: teacherProfile?.teaching?.timeBlocks?.length || 0
      })

      const timeBlocks = teacherProfile?.teaching?.timeBlocks || []
      setTeacherTimeBlocks(timeBlocks)

      // Load students data via dedicated endpoint
      let studentsData = []
      try {
        studentsData = await apiService.teachers.getTeacherStudents(teacherId)
        console.log(`✅ Loaded ${studentsData.length} students for teacher`)
      } catch (err) {
        console.warn('Failed to load teacher students:', err)
      }
      setStudents(studentsData)

      // Calculate statistics
      const today = new Date()
      const dayName = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][today.getDay()]

      // Count today's lessons from schedule
      const todaysLessons = weekSchedule.days
        .find(day => day.dayName === dayName)
        ?.lessons.filter(lesson => lesson.lessonType !== 'availability').length || 0

      // Calculate weekly hours
      const weeklyHours = weekSchedule.days.reduce((total, day) => {
        return total + day.lessons
          .filter(lesson => lesson.lessonType !== 'availability')
          .reduce((dayTotal, lesson) => {
            const start = new Date(`2000-01-01T${lesson.startTime}`)
            const end = new Date(`2000-01-01T${lesson.endTime}`)
            return dayTotal + ((end.getTime() - start.getTime()) / (1000 * 60 * 60))
          }, 0)
      }, 0)

      // Skip Bagrut data loading to avoid API errors - will be implemented when Bagrut records exist
      let bagruts: Bagrut[] = []
      // Bagrut loading disabled due to 404 errors for students without Bagrut records

      // Load orchestras if user is a conductor
      if (userRoles.includes('conductor')) {
        try {
          const orchestraData = await apiService.orchestras.getOrchestras()
          const myOrchestras = orchestraData.filter((o: Orchestra) => o.conductorId === teacherId)
          setOrchestras(myOrchestras)
          console.log(`🎼 Loaded ${myOrchestras.length} orchestras for conductor`)
        } catch (error) {
          console.log('Error loading orchestras:', error)
        }
      }

      // Load theory lessons if user is a theory teacher
      if (userRoles.includes('theory-teacher')) {
        try {
          const theoryData = await apiService.theory.getTheoryLessons({ teacherId })
          setTheoryLessons(theoryData || [])
          console.log(`📚 Loaded ${theoryData?.length || 0} theory lessons`)
        } catch (error) {
          console.log('Error loading theory lessons:', error)
        }
      }

      // Load hours summary from backend
      try {
        const hoursData = await hoursSummaryService.getTeacherSummary(teacherId)
        if (hoursData?.totals) {
          setHoursSummary(hoursData.totals)
        }
      } catch (error) {
        console.log('Hours summary not calculated yet:', error)
      }

      // Process Bagrut students data
      const bagrutStudentsData: BagrutStudent[] = bagruts.map(bagrut => {
        const student = students.find(s => s._id === bagrut.studentId)
        const completedPresentations = bagrut.presentations?.filter(p => p.completed).length || 0
        const totalPresentations = 4 // Always 4 presentations for Bagrut
        const progress = (completedPresentations / totalPresentations) * 100

        // Determine status
        let status: BagrutStudent['status'] = 'active'
        if (bagrut.isCompleted && bagrut.finalGrade && bagrut.finalGrade >= 55) {
          status = 'completed'
        } else if (bagrut.isCompleted && bagrut.finalGrade && bagrut.finalGrade < 55) {
          status = 'failed'
        } else if (completedPresentations === 0) {
          status = 'pending'
        }

        // Generate next exam date (mock)
        let nextExamDate: Date | undefined
        if (status === 'active' && completedPresentations < 4) {
          const today = new Date()
          const daysToAdd = Math.floor(Math.random() * 30) + 7
          nextExamDate = new Date(today)
          nextExamDate.setDate(today.getDate() + daysToAdd)
        }

        return {
          studentId: bagrut.studentId,
          studentName: getDisplayName(student?.personalInfo) || 'תלמיד לא ידוע',
          instrument: student?.academicInfo?.primaryInstrument || 'לא צוין',
          stage: completedPresentations + 1,
          progress,
          nextExamDate,
          status,
          finalGrade: bagrut.finalGrade,
          completedPresentations,
          totalPresentations,
          bagrutId: bagrut._id
        }
      })

      setBagrutStudents(bagrutStudentsData)

      // Count Bagrut students
      const activeBagrutStudents = bagrutStudentsData.filter(s => s.status === 'active').length

      setStats({
        totalStudents: studentsData.length,
        todaysLessons,
        weeklyHours: Math.round(weeklyHours * 10) / 10,
        activeBagrutStudents
      })

      // Generate upcoming lessons (from multiple sources)
      let upcomingLessonsData: UpcomingLesson[] = []

      // Try to get from weekSchedule first
      const todaySchedule = weekSchedule.days.find(day => day.dayName === dayName)
      if (todaySchedule) {
        const currentTime = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`
        const upcoming = todaySchedule.lessons
          .filter(lesson =>
            lesson.lessonType !== 'availability' &&
            lesson.startTime >= currentTime
          )
          .slice(0, 5)
          .map(lesson => ({
            id: lesson.id,
            studentName: lesson.studentName || 'תלמיד',
            time: lesson.startTime,
            instrument: lesson.instrument || '',
            duration: parseInt(lesson.notes?.match(/\d+/)?.[0] || '60'),
            type: lesson.lessonType
          }))
        upcomingLessonsData = upcoming
      }

      // If no lessons from weekSchedule, try teacher's timeBlocks data
      if (upcomingLessonsData.length === 0 && teacherProfile?.teaching?.timeBlocks) {
        const currentTime = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`
        const todayLessons: any[] = []
        teacherProfile.teaching.timeBlocks.forEach(block => {
          if (block.day !== dayName) return
          ;(block.assignedLessons || [])
            .filter(l => l.isActive !== false)
            .forEach(lesson => {
              todayLessons.push({
                ...lesson,
                day: block.day,
                location: block.location
              })
            })
        })

        const upcoming = todayLessons
          .filter(lesson => lesson.startTime >= currentTime)
          .slice(0, 5)
          .map(lesson => ({
            id: lesson._id || `lesson-${lesson.studentId}`,
            studentName: lesson.studentName || 'תלמיד',
            time: lesson.startTime,
            instrument: lesson.instrument || '',
            duration: lesson.duration || 60,
            type: 'individual' as const
          }))
        upcomingLessonsData = upcoming
      }

      // If still no lessons, try to get from student assignments with real times
      if (upcomingLessonsData.length === 0 && studentsData.length > 0) {
        const currentTime = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`

        // Get today's lessons from student assignments
        studentsData.forEach((student) => {
          const assignments = student.teacherAssignments?.filter(
            (assignment: any) => assignment.teacherId === user._id && assignment.day === dayName
          ) || []

          assignments.forEach((assignment: any) => {
            if (assignment.time && assignment.time >= currentTime) {
              upcomingLessonsData.push({
                id: `${student._id}-${assignment.time}`,
                studentName: getDisplayName(student.personalInfo) || 'תלמיד',
                time: assignment.time,
                instrument: student.academicInfo?.primaryInstrument || assignment.instrument || 'כלי מוזיקה',
                duration: assignment.duration || 60,
                type: 'individual'
              })
            }
          })
        })

        // Sort by time
        upcomingLessonsData.sort((a, b) => a.time.localeCompare(b.time))
      }

      setUpcomingLessons(upcomingLessonsData.slice(0, 5))

      // TODO: Implement real recent activities from user actions log
      // For now, show empty state instead of mock data
      setRecentActivities([])

      // TODO: Implement real attendance data from backend
      // For now, show empty state instead of mock data
      setStudentAttendance([])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('שגיאה בטעינת נתוני לוח הבקרה')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    console.log('handleQuickAction called with:', action)
    console.log('Teacher time blocks:', teacherTimeBlocks)

    switch (action) {
      case 'addLesson':
        // Navigate to profile students tab with add student action
        navigate('/profile?tab=students&action=addStudent')
        break
      case 'markAttendance':
        // Navigate to profile attendance tab
        navigate('/profile?tab=attendance')
        break
      case 'viewSchedule':
        // Navigate to profile schedule tab
        navigate('/profile?tab=schedule')
        break
      case 'manageStudents':
        // Navigate to profile students tab
        navigate('/profile?tab=students')
        break
      case 'manageTeachingDays':
        // Navigate to profile schedule tab (where teachers manage their teaching days)
        navigate('/profile?tab=schedule')
        break
      case 'viewOrchestras':
        // Navigate to profile orchestras tab
        navigate('/profile?tab=orchestras')
        break
      case 'viewTheoryLessons':
        // Navigate to profile theory lessons tab
        navigate('/profile?tab=lessons')
        break
      case 'addOrchestra':
        // Navigate to orchestra creation or open modal
        navigate('/orchestras/new')
        break
      case 'addTheoryLesson':
        // Navigate to theory lesson creation
        navigate('/theory/new')
        break
      case 'manageBagrut':
        window.location.href = '/teacher/bagrut'
        break
      case 'scheduleBagrutExam':
        window.location.href = '/teacher/bagrut/schedule'
        break
      case 'viewBagrutProgress':
        window.location.href = '/teacher/bagrut/progress'
        break
      case 'updateBagrutStatus':
        window.location.href = '/teacher/bagrut/update'
        break
      default:
        console.log('Action:', action)
    }
  }

  const getStatusColor = (status: BagrutStudent['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'active': return 'text-blue-600 bg-blue-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'failed': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status: BagrutStudent['status']) => {
    switch (status) {
      case 'completed': return 'הושלם'
      case 'active': return 'פעיל'
      case 'pending': return 'ממתין'
      case 'failed': return 'נכשל'
      default: return 'לא ידוע'
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
          <div className="text-gray-600 font-reisinger-yonatan">טוען לוח בקרה...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-800 font-reisinger-yonatan text-center">
            <BellIcon className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-bold mb-2">{error}</h3>
            <button
              onClick={loadDashboardData}
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
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' :
            'bg-red-100 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckSquareIcon className="w-5 h-5" />
              ) : (
                <WarningCircleIcon className="w-5 h-5" />
              )}
              <span className="font-reisinger-yonatan">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900 font-reisinger-yonatan">
              לוח בקרה - {getDisplayName(user?.personalInfo) || user?.fullName || 'מורה'}
            </h1>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<UsersIcon className="w-6 h-6" />}
            title="סה״כ תלמידים"
            value={stats.totalStudents}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
            borderColor="border-blue-200"
          />
          <StatCard
            icon={<CalendarIcon className="w-6 h-6" />}
            title="שיעורים היום"
            value={stats.todaysLessons}
            bgColor="bg-green-50"
            iconColor="text-green-600"
            borderColor="border-green-200"
          />
          <StatCard
            icon={<ClockIcon className="w-6 h-6" />}
            title="ש״ש שבועי"
            value={hoursSummary?.totalWeeklyHours ?? stats.weeklyHours}
            suffix={hoursSummary ? 'ש"ש' : 'שעות'}
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
            borderColor="border-purple-200"
          />
          <StatCard
            icon={<GraduationCapIcon className="w-6 h-6" />}
            title="תלמידי בגרות פעילים"
            value={stats.activeBagrutStudents}
            bgColor="bg-yellow-50"
            iconColor="text-yellow-600"
            borderColor="border-yellow-200"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
            פעולות מהירות
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              icon={<PlusIcon className="w-5 h-5" />}
              label="הוסף שיעור"
              onClick={() => handleQuickAction('addLesson')}
              color="indigo"
            />
            <QuickActionButton
              icon={<CheckSquareIcon className="w-5 h-5" />}
              label="סמן נוכחות"
              onClick={() => handleQuickAction('markAttendance')}
              color="green"
            />
            <QuickActionButton
              icon={<CalendarIcon className="w-5 h-5" />}
              label="צפה בלו״ז"
              onClick={() => handleQuickAction('viewSchedule')}
              color="blue"
            />
            <QuickActionButton
              icon={<UserCircleCheckIcon className="w-5 h-5" />}
              label="ניהול תלמידים"
              onClick={() => handleQuickAction('manageStudents')}
              color="purple"
            />
            {/* Only show ימי לימוד for teachers */}
            {userRoles.includes('teacher') && (
              <QuickActionButton
                icon={<ClockIcon className="w-5 h-5" />}
                label="ימי לימוד"
                onClick={() => handleQuickAction('manageTeachingDays')}
                color="orange"
              />
            )}

            {/* Only show orchestra actions for conductors */}
            {userRoles.includes('conductor') && (
              <QuickActionButton
                icon={<MusicNotesIcon className="w-5 h-5" />}
                label="התזמורות שלי"
                onClick={() => handleQuickAction('viewOrchestras')}
                color="rose"
              />
            )}

            {/* Only show theory actions for theory teachers */}
            {userRoles.includes('theory-teacher') && (
              <QuickActionButton
                icon={<BookOpenIcon className="w-5 h-5" />}
                label="שיעורי תיאוריה"
                onClick={() => handleQuickAction('viewTheoryLessons')}
                color="amber"
              />
            )}

            {/* Bagrut management actions - only if there are bagrut students */}
            {bagrutStudents.length > 0 && (
              <>
                <QuickActionButton
                  icon={<GraduationCapIcon className="w-5 h-5" />}
                  label="ניהול בגרות"
                  onClick={() => handleQuickAction('manageBagrut')}
                  color="emerald"
                />
                <QuickActionButton
                  icon={<CalendarClockIcon className="w-5 h-5" />}
                  label="תזמון מבחן"
                  onClick={() => handleQuickAction('scheduleBagrutExam')}
                  color="orange"
                />
                <QuickActionButton
                  icon={<TargetIcon className="w-5 h-5" />}
                  label="מעקב התקדמות"
                  onClick={() => handleQuickAction('viewBagrutProgress')}
                  color="cyan"
                />
                <QuickActionButton
                  icon={<PencilIcon className="w-5 h-5" />}
                  label="עדכון סטטוס"
                  onClick={() => handleQuickAction('updateBagrutStatus')}
                  color="pink"
                />
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Lessons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                  השיעורים הבאים
                </h2>
                <button
                  onClick={() => handleQuickAction('viewSchedule')}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                >
                  צפה בכל
                  <CaretRightIcon className="w-4 h-4" />
                </button>
              </div>

              {upcomingLessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-reisinger-yonatan">אין שיעורים מתוכננים היום</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingLessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <ClockIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 font-reisinger-yonatan">{lesson.studentName}</div>
                          <div className="text-sm text-gray-600">{lesson.instrument}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{lesson.time}</div>
                        <div className="text-xs text-gray-500">
                          {lesson.duration} דקות • {lesson.type === 'individual' ? 'פרטני' : 'קבוצתי'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Attendance Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                  סקירת נוכחות
                </h2>
                <button
                  onClick={() => handleQuickAction('manageStudents')}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                >
                  צפה בכל
                  <CaretRightIcon className="w-4 h-4" />
                </button>
              </div>

              {studentAttendance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-reisinger-yonatan">אין נתוני נוכחות</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentAttendance.map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          student.status === 'present' ? 'bg-green-500' :
                          student.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900 font-reisinger-yonatan">{student.studentName}</div>
                          <div className="text-sm text-gray-600">שיעור אחרון: {student.lastLesson}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          student.attendanceRate >= 90 ? 'text-green-600' :
                          student.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {student.attendanceRate}%
                        </div>
                        <div className="text-xs text-gray-500">נוכחות</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bagrut Students Progress */}
            {bagrutStudents.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                    התקדמות תלמידי בגרות
                  </h2>
                  <button
                    onClick={() => handleQuickAction('manageBagrut')}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 mx-auto"
                  >
                    צפה בכל תלמידי הבגרות ({bagrutStudents.length})
                    <CaretRightIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {bagrutStudents.slice(0, 5).map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <GraduationCapIcon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 font-reisinger-yonatan">{student.studentName}</div>
                          <div className="text-sm text-gray-600">{student.instrument}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(student.status)}`}>
                            {getStatusText(student.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                student.progress >= 75 ? 'bg-green-500' :
                                student.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{Math.round(student.progress)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent ActivityIcon */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
                  פעילות אחרונה
                </h2>
                <ActivityIcon className="w-5 h-5 text-gray-400" />
              </div>

              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BellIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-reisinger-yonatan">אין פעילות לאחרונה</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'lesson' ? 'bg-blue-100' :
                        activity.type === 'attendance' ? 'bg-green-100' :
                        activity.type === 'note' ? 'bg-yellow-100' : 'bg-purple-100'
                      }`}>
                        {activity.type === 'lesson' && <BookOpenIcon className="w-4 h-4 text-blue-600" />}
                        {activity.type === 'attendance' && <CheckSquareIcon className="w-4 h-4 text-green-600" />}
                        {activity.type === 'note' && <FileTextIcon className="w-4 h-4 text-yellow-600" />}
                        {activity.type === 'grade' && <MedalIcon className="w-4 h-4 text-purple-600" />}
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

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
                נתונים מהירים
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">תלמידים פעילים</span>
                  <span className="font-bold text-indigo-600">{students.filter(s => s.academicInfo?.isActive !== false).length}</span>
                </div>
                {userRoles.includes('conductor') && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">תזמורות</span>
                    <span className="font-bold text-purple-600">{orchestras.length}</span>
                  </div>
                )}
                {userRoles.includes('theory-teacher') && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">שיעורי תיאוריה</span>
                    <span className="font-bold text-blue-600">{theoryLessons.length}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">שעות השבוע</span>
                  <span className="font-bold text-green-600">{hoursSummary?.totalWeeklyHours ?? stats.weeklyHours} {hoursSummary ? 'ש"ש' : 'שעות'}</span>
                </div>
                {hoursSummary && (
                  <>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <span className="text-xs font-medium text-gray-500 mb-2 block">פירוט ש"ש</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">שיעורים פרטניים</span>
                      <span className="font-medium text-blue-600">{hoursSummary.individualLessons}</span>
                    </div>
                    {hoursSummary.orchestraConducting > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">ניצוח תזמורות</span>
                        <span className="font-medium text-purple-600">{hoursSummary.orchestraConducting}</span>
                      </div>
                    )}
                    {hoursSummary.theoryTeaching > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">הוראת תיאוריה</span>
                        <span className="font-medium text-green-600">{hoursSummary.theoryTeaching}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
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
  color: 'indigo' | 'green' | 'blue' | 'purple' | 'orange' | 'rose' | 'amber' | 'emerald' | 'cyan' | 'pink'
}

function QuickActionButton({ icon, label, onClick, color }: QuickActionButtonProps) {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200',
    green: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200',
    rose: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200',
    amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200',
    cyan: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-cyan-200',
    pink: 'bg-pink-50 text-pink-600 hover:bg-pink-100 border-pink-200'
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