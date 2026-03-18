/**
 * useStudentDashboardData - Aggregates all dashboard data for student details.
 *
 * Fetches attendance summary, attendance stats (monthly trend), orchestras (for name resolution),
 * and theory lessons. Derives weekly hours from teacherAssignments and builds a unified
 * enrollments list and teacher map for child components.
 */

import { useState, useEffect, useMemo } from 'react'
import apiService from '../../../../services/apiService'
import { getDisplayName } from '../../../../utils/nameUtils'

// Hebrew day names (Sunday=0 through Friday=5)
const DAY_NAMES: Record<number, string> = {
  0: 'ראשון',
  1: 'שני',
  2: 'שלישי',
  3: 'רביעי',
  4: 'חמישי',
  5: 'שישי',
}

export interface AttendanceSummary {
  totalSessions: number
  attendedCount: number
  lateCount: number
  absentCount: number
  attendanceRate: number
}

export interface MonthlyAttendance {
  month: string
  rate: number
}

export interface WeeklyHoursEntry {
  day: string
  hours: number
}

export interface EnrollmentEntry {
  id: string
  type: 'individual' | 'orchestra' | 'theory'
  name: string
  instrument: string
  dayTime: string
  room: string
  status: string
}

export interface TeacherInfo {
  firstName: string
  lastName: string
  instrument: string
}

export interface StudentDashboardData {
  // Profile
  student: any
  isLoading: boolean

  // Attendance
  attendanceSummary: AttendanceSummary | null
  attendanceLoading: boolean
  monthlyAttendance: MonthlyAttendance[]

  // Weekly hours
  weeklyHours: WeeklyHoursEntry[]
  totalWeeklyHours: number

  // Enrollments (unified)
  enrollments: EnrollmentEntry[]

  // Counts
  orchestraCount: number
  theoryCount: number

  // Teacher map for child components
  teacherMap: Record<string, TeacherInfo>
}

export function useStudentDashboardData(
  studentId: string,
  student: any
): StudentDashboardData {
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(true)
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendance[]>([])
  const [orchestras, setOrchestras] = useState<any[]>([])
  const [theoryLessons, setTheoryLessons] = useState<any[]>([])
  const [teachersData, setTeachersData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Stable teacher IDs list from assignments
  const teacherIdsToFetch = useMemo(() => {
    const assignments = student?.teacherAssignments || []
    const ids = assignments
      .map((ta: any) => ta.teacherId)
      .filter(Boolean)
    return [...new Set(ids)] as string[]
  }, [student?.teacherAssignments])

  // Fetch all supplemental data
  useEffect(() => {
    if (!studentId) return

    let cancelled = false

    const fetchAll = async () => {
      setIsLoading(true)
      setAttendanceLoading(true)

      // Fetch attendance summary
      const fetchAttendance = async () => {
        try {
          const summary = await apiService.attendanceAlerts.getStudentSummary(studentId)
          if (!cancelled) {
            setAttendanceSummary({
              totalSessions: summary?.totalSessions || 0,
              attendedCount: summary?.attendedCount || 0,
              lateCount: summary?.lateCount || 0,
              absentCount: summary?.absentCount || 0,
              attendanceRate: summary?.attendanceRate || 0,
            })
          }
        } catch (err) {
          console.error('Failed to fetch attendance summary:', err)
          if (!cancelled) setAttendanceSummary(null)
        }
      }

      // Fetch monthly attendance stats
      const fetchMonthlyStats = async () => {
        try {
          const stats = await apiService.analytics.getStudentAttendanceStats(studentId, { months: 6 })
          if (!cancelled && stats?.monthlyBreakdown) {
            setMonthlyAttendance(
              stats.monthlyBreakdown.map((m: any) => ({
                month: m.month || m.label || '',
                rate: m.attendanceRate || m.rate || 0,
              }))
            )
          } else if (!cancelled && Array.isArray(stats)) {
            // Handle case where stats is directly an array
            setMonthlyAttendance(
              stats.map((m: any) => ({
                month: m.month || m.label || '',
                rate: m.attendanceRate || m.rate || 0,
              }))
            )
          }
        } catch (err) {
          console.error('Failed to fetch monthly attendance stats:', err)
          if (!cancelled) setMonthlyAttendance([])
        }
      }

      // Fetch orchestras for name resolution
      const fetchOrchestras = async () => {
        try {
          const result = await apiService.orchestras.getOrchestras()
          if (!cancelled) {
            setOrchestras(Array.isArray(result) ? result : (result?.data || []))
          }
        } catch (err) {
          console.error('Failed to fetch orchestras:', err)
          if (!cancelled) setOrchestras([])
        }
      }

      // Fetch theory lessons for this student
      const fetchTheory = async () => {
        try {
          const result = await apiService.theoryLessons.getTheoryLessons()
          if (!cancelled) {
            const lessons = Array.isArray(result) ? result : (result?.data || [])
            // Filter to lessons that include this student
            const studentLessons = lessons.filter((lesson: any) =>
              lesson.studentIds?.includes(studentId)
            )
            setTheoryLessons(studentLessons)
          }
        } catch (err) {
          console.error('Failed to fetch theory lessons:', err)
          if (!cancelled) setTheoryLessons([])
        }
      }

      // Fetch teacher details
      const fetchTeachers = async () => {
        if (teacherIdsToFetch.length === 0) {
          if (!cancelled) setTeachersData([])
          return
        }
        try {
          const promises = teacherIdsToFetch.map((id) =>
            apiService.teachers.getTeacher(id).catch(() => null)
          )
          const results = (await Promise.all(promises)).filter(Boolean)
          if (!cancelled) setTeachersData(results)
        } catch (err) {
          console.error('Failed to fetch teachers:', err)
          if (!cancelled) setTeachersData([])
        }
      }

      await Promise.all([
        fetchAttendance(),
        fetchMonthlyStats(),
        fetchOrchestras(),
        fetchTheory(),
        fetchTeachers(),
      ])

      if (!cancelled) {
        setAttendanceLoading(false)
        setIsLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [studentId, teacherIdsToFetch])

  // Build teacher map
  const teacherMap = useMemo<Record<string, TeacherInfo>>(() => {
    const map: Record<string, TeacherInfo> = {}
    for (const teacher of teachersData) {
      if (teacher?._id) {
        map[teacher._id] = {
          firstName: teacher.personalInfo?.firstName || '',
          lastName: teacher.personalInfo?.lastName || '',
          instrument: teacher.professionalInfo?.instrument || teacher.personalInfo?.instrument || '',
        }
      }
    }
    return map
  }, [teachersData])

  // Derive weekly hours from teacherAssignments
  const { weeklyHours, totalWeeklyHours } = useMemo(() => {
    const dayHours: Record<number, number> = {}
    // Initialize all days
    for (let d = 0; d <= 5; d++) dayHours[d] = 0

    const assignments = student?.teacherAssignments || []
    for (const assignment of assignments) {
      if (!assignment.isActive) continue
      const hours = assignment.weeklyHours || 0
      if (hours <= 0) continue

      const day = assignment.dayOfWeek
      if (day != null && day >= 0 && day <= 5) {
        dayHours[day] += hours
      }
      // If dayOfWeek is missing, skip (don't break)
    }

    const entries: WeeklyHoursEntry[] = Object.keys(DAY_NAMES).map((d) => {
      const dayNum = Number(d)
      return { day: DAY_NAMES[dayNum], hours: dayHours[dayNum] || 0 }
    })

    const total = entries.reduce((sum, e) => sum + e.hours, 0)
    return { weeklyHours: entries, totalWeeklyHours: total }
  }, [student?.teacherAssignments])

  // Build unified enrollments list
  const enrollments = useMemo<EnrollmentEntry[]>(() => {
    const result: EnrollmentEntry[] = []

    // Individual lessons from teacherAssignments
    const assignments = student?.teacherAssignments || []
    for (const assignment of assignments) {
      if (!assignment.isActive) continue
      const teacher = teacherMap[assignment.teacherId]
      const teacherName = teacher
        ? `${teacher.firstName} ${teacher.lastName}`.trim()
        : 'מורה'
      result.push({
        id: assignment._id || assignment.teacherId || `ind-${result.length}`,
        type: 'individual',
        name: teacherName,
        instrument: assignment.instrumentName || '',
        dayTime: assignment.dayOfWeek != null
          ? `${DAY_NAMES[assignment.dayOfWeek] || ''}`
          : '',
        room: assignment.room || '',
        status: assignment.isActive ? 'פעיל' : 'לא פעיל',
      })
    }

    // Orchestra enrollments
    const orchestraEnrollments = student?.orchestraEnrollments || student?.enrollments?.orchestraIds || []
    for (const enrollment of orchestraEnrollments) {
      const orchId = typeof enrollment === 'string' ? enrollment : enrollment?.orchestraId
      if (!orchId) continue
      const orch = orchestras.find((o: any) => o._id === orchId)
      result.push({
        id: orchId,
        type: 'orchestra',
        name: orch?.name || 'תזמורת',
        instrument: orch?.type || '',
        dayTime: orch?.rehearsalDay != null
          ? `${DAY_NAMES[orch.rehearsalDay] || ''} ${orch.rehearsalTime || ''}`
          : '',
        room: orch?.room || '',
        status: typeof enrollment === 'object' && enrollment?.isActive === false ? 'לא פעיל' : 'פעיל',
      })
    }

    // Theory lessons
    for (const lesson of theoryLessons) {
      result.push({
        id: lesson._id || `theory-${result.length}`,
        type: 'theory',
        name: lesson.title || lesson.category || 'שיעור תאוריה',
        instrument: '',
        dayTime: lesson.date
          ? `${new Date(lesson.date).toLocaleDateString('he-IL')} ${lesson.startTime || ''}`
          : (lesson.startTime || ''),
        room: lesson.location || '',
        status: lesson.isActive !== false ? 'פעיל' : 'לא פעיל',
      })
    }

    return result
  }, [student, teacherMap, orchestras, theoryLessons])

  // Counts
  const orchestraCount = useMemo(() => {
    const orchEnrollments = student?.orchestraEnrollments || student?.enrollments?.orchestraIds || []
    return orchEnrollments.length
  }, [student])

  const theoryCount = theoryLessons.length

  return {
    student,
    isLoading,
    attendanceSummary,
    attendanceLoading,
    monthlyAttendance,
    weeklyHours,
    totalWeeklyHours,
    enrollments,
    orchestraCount,
    theoryCount,
    teacherMap,
  }
}
