import { useState, useEffect, useRef, useCallback } from 'react'
import {
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CircleNotchIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  WarningIcon,
  WarningCircleIcon,
  XIcon,
  TrendUpIcon,
  PencilLineIcon,
} from '@phosphor-icons/react'
import {
  formatRehearsalDateTime,
  STATUS_MAP,
  STATUS_CYCLE,
  STATUS_LABELS,
  type Rehearsal,
  type AttendanceStatus,
  type MemberAttendanceRate,
} from '../utils/rehearsalUtils'
import { rehearsalService, orchestraService } from '../services/apiService'
import { getDisplayName } from '@/utils/nameUtils'

interface AttendanceManagerProps {
  rehearsal: Rehearsal
  orchestraId: string
  onSaved: () => void
  onClose: () => void
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface MemberAttendance {
  status: AttendanceStatus
  notes: string
}

export default function AttendanceManager({
  rehearsal,
  orchestraId,
  onSaved,
  onClose,
}: AttendanceManagerProps) {
  const [attendanceMap, setAttendanceMap] = useState<Map<string, MemberAttendance>>(new Map())
  const [memberRates, setMemberRates] = useState<MemberAttendanceRate[]>([])
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasInteractedRef = useRef(false)
  const savedIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const members = rehearsal.orchestra?.members || []
  const dateTime = formatRehearsalDateTime(rehearsal)

  // Initialize attendance map from rehearsal data
  useEffect(() => {
    const map = new Map<string, MemberAttendance>()
    const presentSet = new Set(rehearsal.attendance?.present || [])
    const absentSet = new Set(rehearsal.attendance?.absent || [])
    const lateSet = new Set(rehearsal.attendance?.late || [])

    for (const member of members) {
      let status: AttendanceStatus = 'unmarked'
      if (presentSet.has(member._id)) status = 'present'
      else if (lateSet.has(member._id)) status = 'late'
      else if (absentSet.has(member._id)) status = 'absent'

      map.set(member._id, { status, notes: '' })
    }

    setAttendanceMap(map)
  }, [rehearsal._id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch member attendance rates
  useEffect(() => {
    if (!orchestraId) return

    orchestraService.getMemberAttendanceRates(orchestraId)
      .then((rates: MemberAttendanceRate[]) => {
        setMemberRates(Array.isArray(rates) ? rates : [])
      })
      .catch((err: Error) => {
        console.error('Failed to fetch member attendance rates:', err)
        // Don't show error to user -- just skip suggestions
      })
  }, [orchestraId])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (savedIndicatorTimerRef.current) clearTimeout(savedIndicatorTimerRef.current)
    }
  }, [])

  // Auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    if (!hasInteractedRef.current) return

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(async () => {
      await performSave()
    }, 1500)
  }, []) // performSave is stable via ref pattern below

  const performSave = useCallback(async () => {
    setSaveState('saving')
    setErrorMessage(null)

    try {
      // Build records array -- only include non-unmarked entries
      const records: Array<{ studentId: string; status: string; notes: string }> = []
      attendanceMap.forEach((entry, studentId) => {
        if (entry.status !== 'unmarked') {
          records.push({
            studentId,
            status: STATUS_MAP[entry.status as keyof typeof STATUS_MAP],
            notes: entry.notes,
          })
        }
      })

      await rehearsalService.updateAttendance(rehearsal._id, records)
      setSaveState('saved')
      onSaved()

      if (savedIndicatorTimerRef.current) clearTimeout(savedIndicatorTimerRef.current)
      savedIndicatorTimerRef.current = setTimeout(() => {
        setSaveState('idle')
      }, 2000)
    } catch (err: any) {
      setSaveState('error')
      setErrorMessage(err.message || 'שגיאה בשמירה')
    }
  }, [attendanceMap, rehearsal._id, onSaved])

  // Re-bind triggerAutoSave when performSave changes
  const triggerAutoSaveRef = useRef(triggerAutoSave)
  triggerAutoSaveRef.current = () => {
    if (!hasInteractedRef.current) return
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(async () => {
      await performSave()
    }, 1500)
  }

  // Update map helper that also triggers auto-save
  const updateMap = useCallback((updater: (prev: Map<string, MemberAttendance>) => Map<string, MemberAttendance>) => {
    hasInteractedRef.current = true
    setAttendanceMap(prev => {
      const next = updater(prev)
      return next
    })
  }, [])

  // Trigger auto-save when attendanceMap changes (after interaction)
  useEffect(() => {
    if (hasInteractedRef.current) {
      triggerAutoSaveRef.current()
    }
  }, [attendanceMap])

  // Status cycling handler
  const cycleStatus = useCallback((memberId: string) => {
    updateMap(prev => {
      const next = new Map(prev)
      const current = next.get(memberId) || { status: 'unmarked' as AttendanceStatus, notes: '' }
      const currentIndex = STATUS_CYCLE.indexOf(current.status)
      const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length
      next.set(memberId, { ...current, status: STATUS_CYCLE[nextIndex] })
      return next
    })
  }, [updateMap])

  // Notes handlers
  const toggleNotes = useCallback((memberId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }, [])

  const updateNotes = useCallback((memberId: string, notes: string) => {
    updateMap(prev => {
      const next = new Map(prev)
      const current = next.get(memberId) || { status: 'unmarked' as AttendanceStatus, notes: '' }
      next.set(memberId, { ...current, notes })
      return next
    })
  }, [updateMap])

  // Batch operations
  const markAllPresent = useCallback(() => {
    updateMap(prev => {
      const next = new Map(prev)
      for (const member of members) {
        const current = next.get(member._id) || { status: 'unmarked' as AttendanceStatus, notes: '' }
        next.set(member._id, { ...current, status: 'present' })
      }
      return next
    })
  }, [updateMap, members])

  const markAllAbsent = useCallback(() => {
    updateMap(prev => {
      const next = new Map(prev)
      for (const member of members) {
        const current = next.get(member._id) || { status: 'unmarked' as AttendanceStatus, notes: '' }
        next.set(member._id, { ...current, status: 'absent' })
      }
      return next
    })
  }, [updateMap, members])

  // Get rate info for a member
  const getMemberRate = useCallback((studentId: string): MemberAttendanceRate | undefined => {
    return memberRates.find(r => r.studentId === studentId)
  }, [memberRates])

  // Filter members by search
  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true
    const name = getDisplayName(member.personalInfo)?.toLowerCase() || ''
    const cls = member.academicInfo?.class?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    return name.includes(query) || cls.includes(query)
  })

  // Calculate stats
  const stats = {
    present: 0,
    late: 0,
    absent: 0,
    unmarked: 0,
  }
  attendanceMap.forEach(entry => {
    stats[entry.status]++
  })

  // Status color classes
  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-green-50 border-green-300 text-green-800'
      case 'late': return 'bg-amber-50 border-amber-300 text-amber-800'
      case 'absent': return 'bg-red-50 border-red-300 text-red-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-600'
    }
  }

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return <CheckIcon className="w-4 h-4 text-green-600" weight="bold" />
      case 'late': return <ClockIcon className="w-4 h-4 text-amber-600" weight="fill" />
      case 'absent': return <XIcon className="w-4 h-4 text-red-600" weight="bold" />
      default: return <UsersIcon className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
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

            {/* Save indicator */}
            <div className="w-28 flex items-center justify-end">
              {saveState === 'saving' && (
                <div className="flex items-center text-blue-600 text-sm">
                  <CircleNotchIcon className="w-4 h-4 ml-1 animate-spin" />
                  <span>שומר...</span>
                </div>
              )}
              {saveState === 'saved' && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircleIcon className="w-4 h-4 ml-1" weight="fill" />
                  <span>נשמר</span>
                </div>
              )}
              {saveState === 'error' && (
                <div className="flex items-center text-red-600 text-sm">
                  <WarningCircleIcon className="w-4 h-4 ml-1" weight="fill" />
                  <span>שגיאה בשמירה</span>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex items-center">
              <WarningCircleIcon className="w-5 h-5 text-red-600 ml-2 flex-shrink-0" />
              <span className="text-red-800 text-sm">{errorMessage}</span>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <div className="text-sm text-gray-600">נוכחים</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.late}</div>
              <div className="text-sm text-gray-600">איחור</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              <div className="text-sm text-gray-600">נעדרים</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.unmarked}</div>
              <div className="text-sm text-gray-600">לא סומנו</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm"
              >
                <CheckIcon className="w-4 h-4 ml-1" />
                סמן הכל כנוכח
              </button>
              <button
                onClick={markAllAbsent}
                className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
              >
                <XIcon className="w-4 h-4 ml-1" />
                סמן הכל כנעדר
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש חבר..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 pl-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white border border-gray-200 rounded overflow-hidden mb-4">
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 gap-1 p-2">
                {filteredMembers.map(member => {
                  const entry = attendanceMap.get(member._id) || { status: 'unmarked' as AttendanceStatus, notes: '' }
                  const rate = getMemberRate(member._id)
                  const primaryInstrument = member.academicInfo?.instrumentProgress?.find((p: { isPrimary: boolean }) => p.isPrimary)
                  const isNotesExpanded = expandedNotes.has(member._id)

                  return (
                    <div key={member._id}>
                      <div
                        className={`flex items-center justify-between p-3 rounded border cursor-pointer select-none ${getStatusColor(entry.status)} transition-colors`}
                        onClick={() => cycleStatus(member._id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getStatusIcon(entry.status)}
                          </div>
                          <div>
                            <div className="font-medium">{getDisplayName(member.personalInfo)}</div>
                            <div className="text-sm opacity-75">
                              {member.academicInfo?.class && `כיתה ${member.academicInfo.class}`}
                              {primaryInstrument && ` \u2022 ${primaryInstrument.instrumentName}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Smart suggestion indicator */}
                          {rate?.suggestion === 'likelyPresent' && (
                            <div className="flex items-center gap-1" title={`נוכחות גבוהה (${Math.round(rate.attendanceRate)}%)`}>
                              <TrendUpIcon className="w-4 h-4 text-green-500" weight="bold" />
                              <span className="text-xs text-green-600">{Math.round(rate.attendanceRate)}%</span>
                            </div>
                          )}
                          {rate?.suggestion === 'frequentAbsent' && (
                            <div className="flex items-center gap-1" title={`נוכחות נמוכה (${Math.round(rate.attendanceRate)}%)`}>
                              <WarningIcon className="w-4 h-4 text-amber-500" weight="fill" />
                              <span className="text-xs text-amber-600">{Math.round(rate.attendanceRate)}%</span>
                            </div>
                          )}

                          {/* Status label */}
                          <span className="text-xs font-medium min-w-[50px] text-center">
                            {STATUS_LABELS[entry.status]}
                          </span>

                          {/* Note icon button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleNotes(member._id)
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              isNotesExpanded || entry.notes
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-white bg-opacity-50 text-gray-400 hover:text-gray-600'
                            }`}
                            title="הערות"
                          >
                            <PencilLineIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable notes input */}
                      {isNotesExpanded && (
                        <div className="px-3 py-2 bg-white border border-t-0 border-gray-200 rounded-b">
                          <input
                            type="text"
                            placeholder="הערות (סיבת היעדרות, פרטי איחור...)"
                            value={entry.notes}
                            onChange={(e) => updateNotes(member._id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      )}
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
        </div>
      </div>
    </div>
  )
}
