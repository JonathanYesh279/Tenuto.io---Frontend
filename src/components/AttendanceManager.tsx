import { useState, useEffect } from 'react'

import { ArrowCounterClockwiseIcon, CalendarIcon, CheckCircleIcon, CheckIcon, ClockIcon, FloppyDiskIcon, MagnifyingGlassIcon, UsersIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'
import {
  formatRehearsalDateTime,
  calculateAttendanceStats,
  formatAttendanceList,
  type Rehearsal,
  type AttendanceUpdate
} from '../utils/rehearsalUtils'
import { getDisplayName } from '@/utils/nameUtils'

interface AttendanceMember {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    phone?: string
    email?: string
  }
  academicInfo?: {
    class?: string
    instrumentProgress?: Array<{
      instrumentName: string
      isPrimary: boolean
    }>
  }
}

interface AttendanceManagerProps {
  rehearsal: Rehearsal
  onUpdateAttendance: (attendanceData: AttendanceUpdate) => Promise<void>
  onClose: () => void
}

export default function AttendanceManager({
  rehearsal,
  onUpdateAttendance,
  onClose
}: AttendanceManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [attendanceState, setAttendanceState] = useState<{
    present: Set<string>
    absent: Set<string>
  }>({
    present: new Set(rehearsal.attendance?.present || []),
    absent: new Set(rehearsal.attendance?.absent || [])
  })
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const dateTime = formatRehearsalDateTime(rehearsal)
  const originalStats = calculateAttendanceStats(rehearsal)
  const members = rehearsal.orchestra?.members || []
  
  // Filter members based on search
  const filteredMembers = members.filter(member =>
    getDisplayName(member.personalInfo)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.academicInfo?.class?.includes(searchQuery)
  )

  // Calculate current stats
  const currentStats = {
    presentCount: attendanceState.present.size,
    absentCount: attendanceState.absent.size,
    totalMembers: members.length,
    unmarkedCount: members.length - attendanceState.present.size - attendanceState.absent.size
  }

  useEffect(() => {
    // CheckIcon if there are changes
    const originalPresent = new Set(rehearsal.attendance?.present || [])
    const originalAbsent = new Set(rehearsal.attendance?.absent || [])
    
    const hasChanges = 
      originalPresent.size !== attendanceState.present.size ||
      originalAbsent.size !== attendanceState.absent.size ||
      [...attendanceState.present].some(id => !originalPresent.has(id)) ||
      [...attendanceState.absent].some(id => !originalAbsent.has(id))
    
    setHasChanges(hasChanges)
  }, [attendanceState, rehearsal.attendance])

  const handleAttendanceChange = (memberId: string, status: 'present' | 'absent' | 'unmarked') => {
    setAttendanceState(prev => {
      const newState = {
        present: new Set(prev.present),
        absent: new Set(prev.absent)
      }

      // Remove from both sets first
      newState.present.delete(memberId)
      newState.absent.delete(memberId)

      // Add to appropriate set if not unmarked
      if (status === 'present') {
        newState.present.add(memberId)
      } else if (status === 'absent') {
        newState.absent.add(memberId)
      }

      return newState
    })
    setError(null)
  }

  const handleQuickMarkAll = (status: 'present' | 'absent') => {
    setAttendanceState(prev => {
      const newState = {
        present: new Set<string>(),
        absent: new Set<string>()
      }

      if (status === 'present') {
        members.forEach(member => newState.present.add(member._id))
      } else {
        members.forEach(member => newState.absent.add(member._id))
      }

      return newState
    })
    setError(null)
  }

  const handleReset = () => {
    setAttendanceState({
      present: new Set(rehearsal.attendance?.present || []),
      absent: new Set(rehearsal.attendance?.absent || [])
    })
    setError(null)
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      const attendanceData: AttendanceUpdate = {
        present: [...attendanceState.present],
        absent: [...attendanceState.absent]
      }

      await onUpdateAttendance(attendanceData)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
    } catch (error: any) {
      setError(error.message || 'שגיאה בשמירת הנוכחות')
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceStatus = (memberId: string): 'present' | 'absent' | 'unmarked' => {
    if (attendanceState.present.has(memberId)) return 'present'
    if (attendanceState.absent.has(memberId)) return 'absent'
    return 'unmarked'
  }

  const getStatusColor = (status: 'present' | 'absent' | 'unmarked') => {
    switch (status) {
      case 'present':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'absent':
        return 'bg-red-100 border-red-300 text-red-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600'
    }
  }

  const getStatusIcon = (status: 'present' | 'absent' | 'unmarked') => {
    switch (status) {
      case 'present':
        return <CheckIcon className="w-4 h-4 text-green-600" />
      case 'absent':
        return <XIcon className="w-4 h-4 text-red-600" />
      default:
        return <UsersIcon className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status: 'present' | 'absent' | 'unmarked') => {
    switch (status) {
      case 'present':
        return 'נוכח'
      case 'absent':
        return 'נעדר'
      default:
        return 'לא סומן'
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded shadow-2xl p-8 max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">הנוכחות נשמרה בהצלחה</h3>
            <p className="text-sm text-gray-500">הנתונים עודכנו במערכת</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
            
            <div className="flex-1 text-center">
              <h3 className="text-lg font-semibold text-gray-900">ניהול נוכחות</h3>
              <div className="text-sm text-gray-600 mt-1">
                <div className="flex items-center justify-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{dateTime.fullDateTime}</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <UsersIcon className="w-4 h-4" />
                  <span>{rehearsal.orchestra?.name}</span>
                </div>
              </div>
            </div>
            
            <div className="w-8" />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentStats.presentCount}</div>
              <div className="text-sm text-gray-600">נוכחים</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{currentStats.absentCount}</div>
              <div className="text-sm text-gray-600">נעדרים</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{currentStats.unmarkedCount}</div>
              <div className="text-sm text-gray-600">לא סומנו</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentStats.totalMembers}</div>
              <div className="text-sm text-gray-600">סך הכל</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => handleQuickMarkAll('present')}
                className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                <CheckIcon className="w-4 h-4 ml-1" />
                סמן הכל כנוכח
              </button>
              <button
                onClick={() => handleQuickMarkAll('absent')}
                className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                <XIcon className="w-4 h-4 ml-1" />
                סמן הכל כנעדר
              </button>
            </div>

            {/* MagnifyingGlassIcon */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש חבר..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 pl-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 flex items-center">
              <WarningCircleIcon className="w-5 h-5 text-red-600 ml-2" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {/* Members List */}
          <div className="bg-white border border-gray-200 rounded overflow-hidden mb-6">
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 gap-1 p-2">
                {filteredMembers.map(member => {
                  const status = getAttendanceStatus(member._id)
                  const primaryInstrument = member.academicInfo?.instrumentProgress?.find(p => p.isPrimary)
                  
                  return (
                    <div
                      key={member._id}
                      className={`flex items-center justify-between p-3 rounded border ${getStatusColor(status)} transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getStatusIcon(status)}
                        </div>
                        <div>
                          <div className="font-medium">{getDisplayName(member.personalInfo)}</div>
                          <div className="text-sm opacity-75">
                            {member.academicInfo?.class && `כיתה ${member.academicInfo.class}`}
                            {primaryInstrument && ` • ${primaryInstrument.instrumentName}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAttendanceChange(member._id, 'present')}
                          className={`p-2 rounded transition-colors ${
                            status === 'present'
                              ? 'bg-green-200 text-green-800'
                              : 'bg-white hover:bg-green-50 text-gray-600 hover:text-green-600'
                          }`}
                          title="נוכח"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(member._id, 'absent')}
                          className={`p-2 rounded transition-colors ${
                            status === 'absent'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-white hover:bg-red-50 text-gray-600 hover:text-red-600'
                          }`}
                          title="נעדר"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(member._id, 'unmarked')}
                          className={`p-2 rounded transition-colors ${
                            status === 'unmarked'
                              ? 'bg-gray-200 text-gray-800'
                              : 'bg-white hover:bg-gray-50 text-gray-600'
                          }`}
                          title="בטל סימון"
                        >
                          <ArrowCounterClockwiseIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">אין תוצאות</h3>
                <p className="text-gray-600">לא נמצאו חברים התואמים לחיפוש</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              disabled={!hasChanges || loading}
              className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowCounterClockwiseIcon className="w-4 h-4 ml-1" />
              איפוס
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || loading}
                className={`flex items-center px-6 py-2 bg-primary text-white rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  loading ? 'cursor-wait' : ''
                }`}
              >
                <FloppyDiskIcon className="w-4 h-4 ml-1" />
                {loading ? 'שומר...' : 'שמור נוכחות'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}