import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { teacherScheduleService } from '@/services/apiService'
import { DAY_NAMES, doTimesOverlap } from './utils'
import toast from 'react-hot-toast'

// ==================== Types ====================

export interface CreateDialogState {
  open: boolean
  room: string
  day: number // numeric day 0-5
  startTime: string // "HH:MM"
  endTime: string // "HH:MM" (default: startTime + 30 min)
}

interface Teacher {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
  }
}

interface ScheduleActivity {
  id: string
  startTime: string
  endTime: string
  teacherName: string
  teacherId: string
  source: string
}

interface ScheduleRoom {
  room: string
  activities: ScheduleActivity[]
}

interface ScheduleResponse {
  rooms: ScheduleRoom[]
}

interface CreateLessonDialogProps {
  state: CreateDialogState
  onOpenChange: (open: boolean) => void
  teachers: Teacher[]
  onCreated: () => void // callback to refresh grid after creation
  scheduleData: ScheduleResponse | null // full day schedule for conflict checking
}

// ==================== Helpers ====================

function getTeacherDisplayName(teacher: Teacher): string {
  const first = teacher.personalInfo?.firstName || ''
  const last = teacher.personalInfo?.lastName || ''
  const combined = `${first} ${last}`.trim()
  return combined || teacher.personalInfo?.fullName || '\u05DC\u05DC\u05D0 \u05E9\u05DD'
}

// ==================== Component ====================

export default function CreateLessonDialog({
  state,
  onOpenChange,
  teachers,
  onCreated,
  scheduleData,
}: CreateLessonDialogProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [endTime, setEndTime] = useState(state.endTime)
  const [submitting, setSubmitting] = useState(false)
  const [teacherSearch, setTeacherSearch] = useState('')
  const [error, setError] = useState('')

  // Reset form state when dialog opens
  useEffect(() => {
    if (state.open) {
      setSelectedTeacherId('')
      setTeacherSearch('')
      setEndTime(state.endTime)
      setSubmitting(false)
      setError('')
    }
  }, [state.open, state.endTime])

  // Filter teachers by search text
  const filteredTeachers = teachers.filter((teacher) => {
    if (!teacherSearch) return true
    const name = getTeacherDisplayName(teacher)
    return name.includes(teacherSearch)
  })

  // Check for conflicts with existing activities
  const conflictWarning = useMemo(() => {
    if (!scheduleData || !state.open) return null

    const warnings: string[] = []

    // 1. Room conflict: check if any activity in the target room overlaps with the selected time
    const targetRoom = scheduleData.rooms.find(r => r.room === state.room)
    if (targetRoom) {
      for (const activity of targetRoom.activities) {
        if (doTimesOverlap(state.startTime, endTime, activity.startTime, activity.endTime)) {
          warnings.push(`\u05D4\u05D7\u05D3\u05E8 \u05EA\u05E4\u05D5\u05E1 \u05E2"\u05D9 ${activity.teacherName} \u05D1\u05E9\u05E2\u05D5\u05EA ${activity.startTime}-${activity.endTime}`)
        }
      }
    }

    // 2. Teacher double-booking: if a teacher is selected, check all rooms for same teacherId + overlapping time
    if (selectedTeacherId) {
      for (const room of scheduleData.rooms) {
        for (const activity of room.activities) {
          if (
            activity.teacherId === selectedTeacherId &&
            doTimesOverlap(state.startTime, endTime, activity.startTime, activity.endTime)
          ) {
            const selectedTeacher = teachers.find(t => t._id === selectedTeacherId)
            const teacherName = selectedTeacher ? getTeacherDisplayName(selectedTeacher) : activity.teacherName
            warnings.push(`${teacherName} \u05DB\u05D1\u05E8 \u05DE\u05DC\u05DE\u05D3/\u05EA \u05D1\u05D7\u05D3\u05E8 ${room.room} \u05D1\u05E9\u05E2\u05D5\u05EA ${activity.startTime}-${activity.endTime}`)
          }
        }
      }
    }

    return warnings.length > 0 ? warnings : null
  }, [scheduleData, state.open, state.room, state.startTime, endTime, selectedTeacherId, teachers])

  const handleSubmit = async () => {
    if (!selectedTeacherId) {
      setError('\u05D9\u05E9 \u05DC\u05D1\u05D7\u05D5\u05E8 \u05DE\u05D5\u05E8\u05D4')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const data = {
        day: DAY_NAMES[state.day],
        startTime: state.startTime,
        endTime,
        location: state.room,
      }

      await teacherScheduleService.createTimeBlock(selectedTeacherId, data)
      toast.success('\u05D4\u05E9\u05D9\u05E2\u05D5\u05E8 \u05E0\u05D5\u05E6\u05E8 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4')
      onCreated()
      onOpenChange(false)
    } catch {
      toast.error('\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D9\u05E6\u05D9\u05E8\u05EA \u05D4\u05E9\u05D9\u05E2\u05D5\u05E8')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTeacher = teachers.find((t) => t._id === selectedTeacherId)

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{'\u05E6\u05D5\u05E8 \u05E9\u05D9\u05E2\u05D5\u05E8 \u05D7\u05D3\u05E9'}</DialogTitle>
          <DialogDescription>
            {'\u05D9\u05E6\u05D9\u05E8\u05EA \u05E9\u05D9\u05E2\u05D5\u05E8 \u05D7\u05D3\u05E9 \u05D1\u05D7\u05D3\u05E8 \u05D5\u05D1\u05E9\u05E2\u05D4 \u05E9\u05E0\u05D1\u05D7\u05E8\u05D5'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Read-only fields: Room, Day, Start Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {'\u05D7\u05D3\u05E8'}
              </label>
              <div className="text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                {state.room}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {'\u05D9\u05D5\u05DD'}
              </label>
              <div className="text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                {DAY_NAMES[state.day]}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {'\u05E9\u05E2\u05EA \u05D4\u05EA\u05D7\u05DC\u05D4'}
              </label>
              <div className="text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                {state.startTime}
              </div>
            </div>
          </div>

          {/* Editable end time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {'\u05E9\u05E2\u05EA \u05E1\u05D9\u05D5\u05DD'}
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Teacher selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {'\u05DE\u05D5\u05E8\u05D4'}
            </label>

            {/* Search input */}
            <input
              type="text"
              placeholder="...\u05D7\u05D9\u05E4\u05D5\u05E9 \u05DE\u05D5\u05E8\u05D4"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Selected teacher indicator */}
            {selectedTeacher && (
              <div className="text-sm text-blue-700 bg-blue-50 rounded-md px-3 py-1.5 mb-2 flex items-center justify-between">
                <span>{getTeacherDisplayName(selectedTeacher)}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTeacherId('')}
                  className="text-blue-500 hover:text-blue-700 text-xs"
                >
                  {'\u05E9\u05E0\u05D4'}
                </button>
              </div>
            )}

            {/* Teacher list */}
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
              {filteredTeachers.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  {'\u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0\u05D5 \u05DE\u05D5\u05E8\u05D9\u05DD'}
                </div>
              ) : (
                filteredTeachers.map((teacher) => {
                  const isSelected = teacher._id === selectedTeacherId
                  return (
                    <div
                      key={teacher._id}
                      onClick={() => {
                        setSelectedTeacherId(teacher._id)
                        setError('')
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-r-2 border-blue-300 font-medium'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {getTeacherDisplayName(teacher)}
                    </div>
                  )
                })
              )}
            </div>

            {/* Validation error */}
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>
        </div>

        {/* Conflict warnings */}
        {conflictWarning && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-1">
            <div className="text-sm font-medium text-red-800">{'\u05D4\u05EA\u05E0\u05D2\u05E9\u05D5\u05D9\u05D5\u05EA \u05E9\u05E0\u05DE\u05E6\u05D0\u05D5:'}</div>
            {conflictWarning.map((w, i) => (
              <div key={i} className="text-sm text-red-700">{'\u2022'} {w}</div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {'\u05D1\u05D9\u05D8\u05D5\u05DC'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedTeacherId || conflictWarning !== null}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '\u05D9\u05D5\u05E6\u05E8...' : '\u05E6\u05D5\u05E8 \u05E9\u05D9\u05E2\u05D5\u05E8'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
