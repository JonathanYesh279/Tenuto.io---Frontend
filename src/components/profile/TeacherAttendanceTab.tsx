import React, { useState, useEffect } from 'react'

import { useAuth } from '../../services/authContext'
import apiService from '../../services/apiService'
import { getDisplayName, getInitials as getNameInitials } from '../../utils/nameUtils'
import { toast } from 'react-hot-toast'
import { CalendarIcon, CheckCircleIcon, CircleNotchIcon, ClockIcon, TrendUpIcon, UsersIcon, XCircleIcon } from '@phosphor-icons/react'

interface Student {
  _id: string
  id?: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    idNumber?: string
  }
  academicInfo?: {
    isActive?: boolean
    grade?: string
  }
  instrument?: string
  attendanceStatus?: 'present' | 'absent' | null
  isMarking?: boolean
}

interface AttendanceStats {
  totalStudents: number
  markedToday: number
  presentToday: number
  absentToday: number
}

export default function TeacherAttendanceTab() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    markedToday: 0,
    presentToday: 0,
    absentToday: 0
  })

  useEffect(() => {
    loadStudentsAndAttendance()
  }, [selectedDate])

  const loadStudentsAndAttendance = async () => {
    try {
      setLoading(true)
      const teacherId = user?._id || user?.teacherId || user?.id

      if (!teacherId) {
        toast.error('לא נמצא מזהה מורה')
        return
      }

      // Get teacher's students via dedicated endpoint
      const studentsData = await apiService.teachers.getTeacherStudents(teacherId)

      if (!Array.isArray(studentsData) || studentsData.length === 0) {
        setStudents([])
        setStats({
          totalStudents: 0,
          markedToday: 0,
          presentToday: 0,
          absentToday: 0
        })
        setLoading(false)
        return
      }

      // Get attendance records for selected date
      const attendancePromises = studentsData.map(async (student: any) => {
        try {
          const attendance = await apiService.attendance.getIndividualLessonAttendance({
            studentId: student._id || student.id,
            teacherId: teacherId,
            date: selectedDate
          })
          return {
            ...student,
            attendanceStatus: attendance?.status || null,
            isMarking: false
          }
        } catch (error) {
          return {
            ...student,
            attendanceStatus: null,
            isMarking: false
          }
        }
      })

      const studentsWithAttendance = await Promise.all(attendancePromises)
      setStudents(studentsWithAttendance)

      // Calculate stats
      const marked = studentsWithAttendance.filter(s => s.attendanceStatus !== null)
      const present = studentsWithAttendance.filter(s => s.attendanceStatus === 'present')
      const absent = studentsWithAttendance.filter(s => s.attendanceStatus === 'absent')

      setStats({
        totalStudents: studentsWithAttendance.length,
        markedToday: marked.length,
        presentToday: present.length,
        absentToday: absent.length
      })

    } catch (error: any) {
      console.error('Error loading students and attendance:', error)
      toast.error('שגיאה בטעינת נתוני נוכחות')
    } finally {
      setLoading(false)
    }
  }

  const markAttendance = async (studentId: string, status: 'present' | 'absent') => {
    const teacherId = user?._id || user?.teacherId || user?.id
    if (!teacherId) {
      toast.error('לא נמצא מזהה מורה')
      return
    }

    // Set marking state for this student
    setStudents(prev => prev.map(s =>
      (s._id || s.id) === studentId ? { ...s, isMarking: true } : s
    ))

    try {
      const attendanceData = {
        studentId,
        teacherId,
        date: selectedDate,
        status,
        lessonType: 'individual' as const
      }

      await apiService.attendance.saveIndividualLessonAttendance(attendanceData)

      // Update student status locally
      setStudents(prev => prev.map(s => {
        if ((s._id || s.id) === studentId) {
          return { ...s, attendanceStatus: status, isMarking: false }
        }
        return s
      }))

      // Update stats
      setStats(prev => {
        const wasMarked = students.find(s => (s._id || s.id) === studentId)?.attendanceStatus !== null
        const wasPresent = students.find(s => (s._id || s.id) === studentId)?.attendanceStatus === 'present'

        return {
          ...prev,
          markedToday: wasMarked ? prev.markedToday : prev.markedToday + 1,
          presentToday: status === 'present'
            ? (wasPresent ? prev.presentToday : prev.presentToday + 1)
            : (wasPresent ? prev.presentToday - 1 : prev.presentToday),
          absentToday: status === 'absent'
            ? (!wasPresent && wasMarked ? prev.absentToday : prev.absentToday + 1)
            : (wasMarked && !wasPresent ? prev.absentToday - 1 : prev.absentToday)
        }
      })

      // Show success toast
      const studentRecord = students.find(s => (s._id || s.id) === studentId)
      const studentName = getDisplayName(studentRecord?.personalInfo) || 'התלמיד'
      toast.success(
        status === 'present'
          ? `${studentName} סומן כנוכח ✓`
          : `${studentName} סומן כנעדר`,
        { duration: 2000 }
      )

    } catch (error: any) {
      console.error('Error marking attendance:', error)
      toast.error('שגיאה בסימון נוכחות')

      // Reset marking state on error
      setStudents(prev => prev.map(s =>
        (s._id || s.id) === studentId ? { ...s, isMarking: false } : s
      ))
    }
  }

  const markAllAs = async (status: 'present' | 'absent') => {
    const unmarkedStudents = students.filter(s => s.attendanceStatus === null)

    if (unmarkedStudents.length === 0) {
      toast('כל התלמידים כבר סומנו', { icon: 'ℹ️' })
      return
    }

    // Set marking state for all unmarked students
    setStudents(prev => prev.map(s =>
      s.attendanceStatus === null ? { ...s, isMarking: true } : s
    ))

    const statusHebrew = status === 'present' ? 'נוכחים' : 'נעדרים'
    const loadingToast = toast.loading(`מסמן ${unmarkedStudents.length} תלמידים כ${statusHebrew}...`)

    try {
      const promises = unmarkedStudents.map(student =>
        markAttendance(student._id || student.id!, status)
      )

      await Promise.all(promises)
      toast.success(`כל התלמידים סומנו כ${statusHebrew} ✓`, { id: loadingToast })

    } catch (error) {
      toast.error('שגיאה בסימון נוכחות המונית', { id: loadingToast })
      // Reset marking state on error
      setStudents(prev => prev.map(s => ({ ...s, isMarking: false })))
    }
  }

  const getTodayDateString = () => {
    const today = new Date()
    return today.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <CircleNotchIcon className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">טוען נתוני נוכחות...</p>
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">אין תלמידים</h3>
        <p className="text-gray-600">טרם הוקצו לך תלמידים</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תאריך
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {isToday && (
            <div className="text-sm text-gray-600 font-medium">
              {getTodayDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">סה״כ תלמידים</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalStudents}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">נוכחים</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.presentToday}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">נעדרים</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{stats.absentToday}</p>
            </div>
            <XCircleIcon className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">אחוז נוכחות</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {stats.markedToday > 0
                  ? Math.round((stats.presentToday / stats.markedToday) * 100)
                  : 0}%
              </p>
            </div>
            <TrendUpIcon className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {stats.markedToday < stats.totalStudents && (
        <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-900">
                סמן את כל התלמידים שטרם סומנו:
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => markAllAs('present')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <CheckCircleIcon className="w-4 h-4" />
                סמן הכל כנוכחים
              </button>
              <button
                onClick={() => markAllAs('absent')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <XCircleIcon className="w-4 h-4" />
                סמן הכל כנעדרים
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">רשימת תלמידים</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {students.map((student) => {
            const studentId = student._id || student.id
            return (
              <div
                key={studentId}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  student.isMarking ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-semibold">
                          {getNameInitials(student.personalInfo)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {getDisplayName(student.personalInfo)}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {student.instrument && (
                            <span>{student.instrument}</span>
                          )}
                          {student.academicInfo?.grade && (
                            <>
                              <span>•</span>
                              <span>כיתה {student.academicInfo.grade}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {student.attendanceStatus === 'present' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                        <CheckCircleIcon className="w-4 h-4" />
                        נוכח
                      </span>
                    )}
                    {student.attendanceStatus === 'absent' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                        <XCircleIcon className="w-4 h-4" />
                        נעדר
                      </span>
                    )}
                    {student.attendanceStatus === null && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                        לא סומן
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => markAttendance(studentId!, 'present')}
                      disabled={student.isMarking || student.attendanceStatus === 'present'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        student.attendanceStatus === 'present'
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {student.isMarking ? (
                        <CircleNotchIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircleIcon className="w-4 h-4" />
                      )}
                      נוכח
                    </button>
                    <button
                      onClick={() => markAttendance(studentId!, 'absent')}
                      disabled={student.isMarking || student.attendanceStatus === 'absent'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        student.attendanceStatus === 'absent'
                          ? 'bg-red-100 text-red-700 cursor-default'
                          : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {student.isMarking ? (
                        <CircleNotchIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircleIcon className="w-4 h-4" />
                      )}
                      נעדר
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary Footer */}
      {stats.markedToday === stats.totalStudents && stats.totalStudents > 0 && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">
                כל התלמידים סומנו! ✓
              </p>
              <p className="text-sm text-green-700">
                {stats.presentToday} נוכחים • {stats.absentToday} נעדרים
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
