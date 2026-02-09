/**
 * Individual Lesson Attendance Component
 *
 * Allows teachers to mark attendance for weekly 1-on-1 lessons with students.
 * Features:
 * - Quick mark present/absent/excused/late
 * - Attendance history view
 * - Weekly calendar view
 * - Smart defaults and UX feedback
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Music,
  ChevronLeft,
  ChevronRight,
  Save,
  History,
  TrendingUp,
  XCircle,
  Info,
  FileText
} from 'lucide-react'
import apiService from '../../services/apiService'
import { getDisplayName } from '@/utils/nameUtils'

interface Student {
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
  personalInfo?: {
    firstName?: string
    lastName?: string
    fullName?: string
    phone?: string
    class?: string
  }
  academicInfo?: {
    instrumentProgress?: Array<{
      instrumentName: string
      isPrimary: boolean
    }>
  }
  scheduleInfo?: {
    day: string
    startTime: string
    duration: number
  }
}

interface AttendanceRecord {
  _id?: string
  studentId: string
  teacherId: string
  date: string
  status: 'present' | 'absent'
  notes?: string
  lessonType: 'individual'
  duration?: number
  createdAt?: string
}

interface IndividualLessonAttendanceProps {
  student: Student
  teacherId: string
  onClose: () => void
  onSave?: () => void
}

export default function IndividualLessonAttendance({
  student,
  teacherId,
  onClose,
  onSave
}: IndividualLessonAttendanceProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState<'present' | 'absent' | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const studentName = getDisplayName(student.personalInfo) || student.fullName || `${student.firstName} ${student.lastName}`.trim()
  const primaryInstrument = student.academicInfo?.instrumentProgress?.find(i => i.isPrimary)?.instrumentName || 'לא צוין'
  const scheduleInfo = student.scheduleInfo

  // Load attendance for selected date
  useEffect(() => {
    loadAttendanceForDate(selectedDate)
  }, [selectedDate])

  // Load attendance history when opening history view
  useEffect(() => {
    if (showHistory && attendanceHistory.length === 0) {
      loadAttendanceHistory()
    }
  }, [showHistory])

  const loadAttendanceForDate = async (date: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.attendance.getIndividualLessonAttendance({
        studentId: student.id,
        teacherId: teacherId,
        date: date
      })

      if (response) {
        setStatus(response.status)
        setNotes(response.notes || '')
      } else {
        // Reset for new date
        setStatus(null)
        setNotes('')
      }
    } catch (err: any) {
      console.error('Error loading attendance:', err)
      // Don't show error for non-existent records
      setStatus(null)
      setNotes('')
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceHistory = async () => {
    setLoadingHistory(true)

    try {
      const history = await apiService.attendance.getStudentAttendanceHistory({
        studentId: student.id,
        teacherId: teacherId,
        lessonType: 'individual',
        limit: 20
      })

      setAttendanceHistory(history)
    } catch (err: any) {
      console.error('Error loading attendance history:', err)
      setAttendanceHistory([]) // Set empty array on error
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSaveAttendance = async () => {
    if (!status) {
      setError('יש לבחור סטטוס נוכחות')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const attendanceData: AttendanceRecord = {
        studentId: student.id,
        teacherId: teacherId,
        date: selectedDate,
        status: status,
        notes: notes.trim(),
        lessonType: 'individual',
        duration: scheduleInfo?.duration || 45
      }

      await apiService.attendance.saveIndividualLessonAttendance(attendanceData)

      // Update local history
      setAttendanceHistory(prev => {
        const filtered = prev.filter(r => r.date !== selectedDate)
        return [{ ...attendanceData, _id: Date.now().toString(), createdAt: new Date().toISOString() }, ...filtered]
      })

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        if (onSave) onSave()
        onClose()
      }, 1500)
    } catch (err: any) {
      console.error('Error saving attendance:', err)
      setError(err.message || 'שגיאה בשמירת הנוכחות')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (statusType: 'present' | 'absent') => {
    switch (statusType) {
      case 'present':
        return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
      case 'absent':
        return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200'
    }
  }

  const getStatusIcon = (statusType: 'present' | 'absent') => {
    switch (statusType) {
      case 'present':
        return <Check className="w-5 h-5" />
      case 'absent':
        return <X className="w-5 h-5" />
    }
  }

  const getStatusLabel = (statusType: 'present' | 'absent') => {
    switch (statusType) {
      case 'present':
        return 'נוכח'
      case 'absent':
        return 'נעדר'
    }
  }

  const changeDate = (days: number) => {
    const currentDate = new Date(selectedDate)
    currentDate.setDate(currentDate.getDate() + days)
    setSelectedDate(currentDate.toISOString().split('T')[0])
  }

  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    const total = attendanceHistory.length
    const present = attendanceHistory.filter(r => r.status === 'present').length
    const absent = attendanceHistory.filter(r => r.status === 'absent').length
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0

    return { total, present, absent, attendanceRate }
  }, [attendanceHistory])

  // Success animation screen
  if (success) {
    return (
      <>
        <style>{`
          @keyframes scaleIn {
            0% {
              transform: scale(0.7);
              opacity: 0;
            }
            50% {
              transform: scale(1.05);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes checkMark {
            0% {
              transform: scale(0) rotate(-45deg);
            }
            50% {
              transform: scale(1.2) rotate(-45deg);
            }
            100% {
              transform: scale(1) rotate(0deg);
            }
          }
          .animate-scale-in {
            animation: scaleIn 0.4s ease-out forwards;
          }
          .animate-check {
            animation: checkMark 0.6s ease-out 0.2s forwards;
          }
        `}</style>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center animate-scale-in">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4 animate-check">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">הנוכחות נשמרה בהצלחה!</h3>
            <p className="text-gray-600">
              {studentName} סומן כ{getStatusLabel(status!)} ב-{new Date(selectedDate).toLocaleDateString('he-IL')}
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="סגור"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 text-center">
              <h3 className="text-xl font-bold text-gray-900">רישום נוכחות - שיעור אישי</h3>
              <div className="flex items-center justify-center gap-2 mt-1 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{studentName}</span>
                {scheduleInfo && (
                  <>
                    <span>•</span>
                    <span>{scheduleInfo.day} {scheduleInfo.startTime}</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${
                showHistory
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="היסטוריה"
              title="היסטוריית נוכחות"
            >
              <History className="w-5 h-5" />
            </button>
          </div>

          {/* Student Info Card */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 mt-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{primaryInstrument}</div>
                <div className="text-sm text-gray-600">
                  {student.personalInfo?.class && `כיתה ${student.personalInfo.class}`}
                </div>
              </div>
              {attendanceHistory.length > 0 && (
                <div className="text-center px-3 py-1 bg-white rounded-lg border border-indigo-200">
                  <div className="text-2xl font-bold text-indigo-600">{attendanceStats.attendanceRate}%</div>
                  <div className="text-xs text-gray-600">נוכחות</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {showHistory ? (
            /* History View */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">היסטוריית נוכחות</h4>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  חזור לרישום
                </button>
              </div>

              {/* Statistics Summary */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{attendanceStats.total}</div>
                  <div className="text-xs text-gray-600">סה״כ</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                  <div className="text-xs text-gray-600">נוכח</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                  <div className="text-xs text-gray-600">נעדר</div>
                </div>
              </div>

              {/* History List */}
              {loadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                  <div className="text-gray-600">טוען היסטוריה...</div>
                </div>
              ) : attendanceHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-gray-900 font-medium mb-2">אין היסטוריית נוכחות</h4>
                  <p className="text-gray-600 text-sm">התחל לרשום נוכחות כדי לראות היסטוריה</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {attendanceHistory.map((record) => (
                    <div
                      key={record._id}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          record.status === 'present' ? 'bg-green-100' :
                          record.status === 'absent' ? 'bg-red-100' :
                          record.status === 'excused' ? 'bg-yellow-100' :
                          'bg-orange-100'
                        }`}>
                          {getStatusIcon(record.status)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString('he-IL', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {record.notes && (
                            <div className="text-sm text-gray-600 mt-1">{record.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        record.status === 'excused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {getStatusLabel(record.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Attendance Marking View */
            <div className="space-y-6">
              {/* Date Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">תאריך השיעור</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => changeDate(-7)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="שבוע קודם"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-medium"
                  />

                  <button
                    onClick={() => changeDate(7)}
                    disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="שבוע הבא"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-center mt-2 text-sm text-gray-600">
                  {new Date(selectedDate).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">סטטוס נוכחות *</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['present', 'absent'] as const).map((statusOption) => (
                    <button
                      key={statusOption}
                      onClick={() => setStatus(statusOption)}
                      className={`flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all transform ${
                        status === statusOption
                          ? getStatusColor(statusOption) + ' scale-105 shadow-lg ring-2 ring-offset-2 ' + (
                            statusOption === 'present' ? 'ring-green-500' : 'ring-red-500'
                          )
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {getStatusIcon(statusOption)}
                      <span className="font-semibold text-lg">{getStatusLabel(statusOption)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  הערות (אופציונלי)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="הוסף הערות על השיעור, ההתקדמות או נושאים לתרגול..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-900">שגיאה</div>
                    <div className="text-red-700 text-sm">{error}</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveAttendance}
                  disabled={!status || saving || loading}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold transition-all ${
                    !status || saving || loading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-indigo-700 hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>שומר...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>שמור נוכחות</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
