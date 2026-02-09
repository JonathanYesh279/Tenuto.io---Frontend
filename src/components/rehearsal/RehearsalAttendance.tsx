import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Calendar,
  MapPin,
  Music,
  UserCheck,
  AlertCircle,
  Save,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import apiService from '../../services/apiService'
import { getDisplayName } from '../../utils/nameUtils'

interface AttendanceMember {
  id: string
  name: string
  instrument: string
  section: string
  status: 'present' | 'absent' | 'late' | 'not_marked'
  arrivalTime?: string
  notes?: string
}

interface RehearsalDetails {
  id: string
  orchestraId: string
  orchestraName: string
  date: string
  startTime: string
  endTime: string
  location: string
  duration: number
  status: 'scheduled' | 'in_progress' | 'completed'
}

interface RehearsalAttendanceProps {
  rehearsalId?: string
  orchestraId?: string
}

export default function RehearsalAttendance({ rehearsalId, orchestraId }: RehearsalAttendanceProps) {
  const { user } = useAuth()
  const [rehearsal, setRehearsal] = useState<RehearsalDetails | null>(null)
  const [members, setMembers] = useState<AttendanceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'not_marked'>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (rehearsalId) {
      loadRehearsalAttendance()
    } else if (orchestraId) {
      loadCurrentRehearsal()
    }
  }, [rehearsalId, orchestraId])

  const loadRehearsalAttendance = async () => {
    if (!rehearsalId) return

    try {
      setLoading(true)
      setError(null)

      const [rehearsalData, attendanceData] = await Promise.all([
        apiService.rehearsals.getRehearsal(rehearsalId),
        apiService.rehearsals.getAttendance(rehearsalId)
      ])

      // Get orchestra details
      const orchestra = await apiService.orchestras.getOrchestra(rehearsalData.groupId)

      setRehearsal({
        id: rehearsalData._id,
        orchestraId: rehearsalData.groupId,
        orchestraName: orchestra.name,
        date: new Date(rehearsalData.scheduledDate).toLocaleDateString('he-IL'),
        startTime: rehearsalData.startTime || '19:00',
        endTime: rehearsalData.endTime || '21:00',
        location: rehearsalData.location || 'אולם מוזיקה',
        duration: rehearsalData.duration || 120,
        status: rehearsalData.status || 'scheduled'
      })

      // Map members with attendance status
      const orchestraMembers = orchestra.memberDetails || []
      const attendanceMap = new Map()

      if (attendanceData && attendanceData.attendanceList) {
        attendanceData.attendanceList.forEach(record => {
          attendanceMap.set(record.studentId, {
            status: record.status,
            arrivalTime: record.arrivalTime,
            notes: record.notes
          })
        })
      }

      const membersWithAttendance = orchestraMembers.map(member => {
        const attendance = attendanceMap.get(member._id)
        return {
          id: member._id,
          name: getDisplayName(member.personalInfo) || 'שם לא ידוע',
          instrument: member.academicInfo?.instrumentProgress?.find(p => p.isPrimary)?.instrumentName || '',
          section: member.section || 'כללי',
          status: attendance?.status || 'not_marked',
          arrivalTime: attendance?.arrivalTime,
          notes: attendance?.notes
        }
      })

      setMembers(membersWithAttendance)
    } catch (error) {
      console.error('Error loading rehearsal attendance:', error)
      setError('שגיאה בטעינת נתוני נוכחות')
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentRehearsal = async () => {
    if (!orchestraId) return

    try {
      setLoading(true)
      setError(null)

      // Find today's rehearsal for this orchestra
      const today = new Date().toISOString().split('T')[0]
      const rehearsals = await apiService.rehearsals.getRehearsals({
        groupId: orchestraId,
        date: today
      })

      if (rehearsals.length === 0) {
        setError('אין חזרה מתוכננת היום לתזמורת זו')
        return
      }

      const todayRehearsal = rehearsals[0]
      await loadRehearsalAttendance()
    } catch (error) {
      console.error('Error loading current rehearsal:', error)
      setError('שגיאה בטעינת חזרה נוכחית')
    } finally {
      setLoading(false)
    }
  }

  const updateAttendance = (memberId: string, status: 'present' | 'absent' | 'late', notes?: string) => {
    setMembers(prev => prev.map(member => {
      if (member.id === memberId) {
        return {
          ...member,
          status,
          arrivalTime: status === 'present' || status === 'late' ? new Date().toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
          }) : undefined,
          notes
        }
      }
      return member
    }))
  }

  const saveAttendance = async () => {
    if (!rehearsal) return

    try {
      setSaving(true)

      const attendanceData = {
        rehearsalId: rehearsal.id,
        attendanceList: members.filter(member => member.status !== 'not_marked').map(member => ({
          studentId: member.id,
          status: member.status,
          arrivalTime: member.arrivalTime,
          notes: member.notes || ''
        }))
      }

      await apiService.rehearsals.updateAttendance(rehearsal.id, attendanceData)

      // Show success message
      alert('נוכחות נשמרה בהצלחה')
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('שגיאה בשמירת הנוכחות')
    } finally {
      setSaving(false)
    }
  }

  const markAllPresent = () => {
    setMembers(prev => prev.map(member => ({
      ...member,
      status: 'present',
      arrivalTime: new Date().toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit'
      })
    })))
  }

  const getFilteredMembers = () => {
    return members.filter(member => {
      const matchesSearch = searchTerm === '' ||
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.section.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filterStatus === 'all' || member.status === filterStatus

      return matchesSearch && matchesFilter
    })
  }

  const getAttendanceStats = () => {
    const total = members.length
    const present = members.filter(m => m.status === 'present').length
    const absent = members.filter(m => m.status === 'absent').length
    const late = members.filter(m => m.status === 'late').length
    const notMarked = members.filter(m => m.status === 'not_marked').length

    return { total, present, absent, late, notMarked }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100'
      case 'absent': return 'text-red-600 bg-red-100'
      case 'late': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'נוכח'
      case 'absent': return 'נעדר'
      case 'late': return 'מאחר'
      default: return 'לא סומן'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-reisinger-yonatan">טוען נתוני נוכחות...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <div className="font-reisinger-yonatan">{error}</div>
        </div>
      </div>
    )
  }

  if (!rehearsal) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-600 font-reisinger-yonatan">לא נמצאה חזרה</div>
      </div>
    )
  }

  const stats = getAttendanceStats()
  const filteredMembers = getFilteredMembers()

  return (
    <div className="space-y-6">
      {/* Rehearsal Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
            נוכחות חזרה
          </h2>
          <div className="flex gap-2">
            <button
              onClick={loadRehearsalAttendance}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              רענן
            </button>
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'שומר...' : 'שמור נוכחות'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Music className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="font-medium text-gray-900 font-reisinger-yonatan">{rehearsal.orchestraName}</div>
              <div className="text-sm text-gray-600">{rehearsal.date}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="font-medium text-gray-900">{rehearsal.startTime} - {rehearsal.endTime}</div>
              <div className="text-sm text-gray-600">{rehearsal.duration} דקות</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="font-medium text-gray-900">{rehearsal.location}</div>
              <div className="text-sm text-gray-600">מקום החזרה</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
            סיכום נוכחות
          </h3>
          <button
            onClick={markAllPresent}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            סמן הכל כנוכח
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 font-reisinger-yonatan">סה״כ חברים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <div className="text-sm text-gray-600 font-reisinger-yonatan">נוכחים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <div className="text-sm text-gray-600 font-reisinger-yonatan">נעדרים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <div className="text-sm text-gray-600 font-reisinger-yonatan">מאחרים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500">{stats.notMarked}</div>
            <div className="text-sm text-gray-600 font-reisinger-yonatan">לא סומנו</div>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <BarChart3 className="w-4 h-4" />
              <span>אחוז נוכחות: {Math.round((stats.present / stats.total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.present / stats.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חיפוש לפי שם, כלי או קבוצה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              dir="rtl"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="present">נוכחים</option>
            <option value="absent">נעדרים</option>
            <option value="late">מאחרים</option>
            <option value="not_marked">לא סומנו</option>
          </select>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
            רשימת חברים ({filteredMembers.length})
          </h3>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-reisinger-yonatan">
              {searchTerm || filterStatus !== 'all' ? 'לא נמצאו חברים' : 'אין חברים רשומים'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <div key={member.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      member.status === 'present' ? 'bg-green-500' :
                      member.status === 'absent' ? 'bg-red-500' :
                      member.status === 'late' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900 font-reisinger-yonatan">
                        {member.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {member.instrument} • {member.section}
                        {member.arrivalTime && (
                          <span className="mr-2">• הגיע ב-{member.arrivalTime}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                      {getStatusLabel(member.status)}
                    </span>

                    <div className="flex gap-1">
                      <button
                        onClick={() => updateAttendance(member.id, 'present')}
                        className={`p-1.5 rounded transition-colors ${
                          member.status === 'present'
                            ? 'bg-green-100 text-green-600'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title="נוכח"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateAttendance(member.id, 'late')}
                        className={`p-1.5 rounded transition-colors ${
                          member.status === 'late'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                        }`}
                        title="מאחר"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateAttendance(member.id, 'absent')}
                        className={`p-1.5 rounded transition-colors ${
                          member.status === 'absent'
                            ? 'bg-red-100 text-red-600'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title="נעדר"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}