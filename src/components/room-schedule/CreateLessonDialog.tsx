import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button as HeroButton, Input, User, Chip } from '@heroui/react'
import { MapPin, CalendarBlank, Clock, MagnifyingGlass } from '@phosphor-icons/react'
import { teacherScheduleService } from '@/services/apiService'
import { getAvatarColorHex } from '@/utils/avatarColorHash'
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
  return combined || teacher.personalInfo?.fullName || 'ללא שם'
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

    // 1. Room conflict
    const targetRoom = scheduleData.rooms.find(r => r.room === state.room)
    if (targetRoom) {
      for (const activity of targetRoom.activities) {
        if (doTimesOverlap(state.startTime, endTime, activity.startTime, activity.endTime)) {
          warnings.push(`החדר תפוס ע"י ${activity.teacherName} בשעות ${activity.startTime}-${activity.endTime}`)
        }
      }
    }

    // 2. Teacher double-booking
    if (selectedTeacherId) {
      for (const room of scheduleData.rooms) {
        if (room.room === state.room) continue
        for (const activity of room.activities) {
          if (
            String(activity.teacherId) === String(selectedTeacherId) &&
            doTimesOverlap(state.startTime, endTime, activity.startTime, activity.endTime)
          ) {
            const selectedTeacher = teachers.find(t => t._id === selectedTeacherId)
            const teacherName = selectedTeacher ? getTeacherDisplayName(selectedTeacher) : activity.teacherName
            warnings.push(`${teacherName} כבר מלמד/ת בחדר ${room.room} בשעות ${activity.startTime}-${activity.endTime}`)
          }
        }
      }
    }

    return warnings.length > 0 ? warnings : null
  }, [scheduleData, state.open, state.room, state.startTime, endTime, selectedTeacherId, teachers])

  const handleSubmit = async () => {
    if (!selectedTeacherId) {
      setError('יש לבחור מורה')
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
      toast.success('השיעור נוצר בהצלחה')
      onCreated()
      onOpenChange(false)
    } catch {
      toast.error('שגיאה ביצירת השיעור')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTeacher = teachers.find((t) => t._id === selectedTeacherId)

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header with context info */}
        <div className="px-6 pt-5 pb-4 bg-gradient-to-b from-primary/5 to-transparent">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-900 dark:text-white">
              צור שיעור חדש
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              יצירת שיעור חדש בחדר ובשעה שנבחרו
            </DialogDescription>
          </DialogHeader>

          {/* Context chips */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Chip size="sm" variant="flat" startContent={<MapPin size={12} weight="duotone" />}
              classNames={{ base: 'bg-slate-100 dark:bg-slate-800', content: 'text-xs font-medium text-slate-600 dark:text-slate-300' }}>
              {state.room}
            </Chip>
            <Chip size="sm" variant="flat" startContent={<CalendarBlank size={12} weight="duotone" />}
              classNames={{ base: 'bg-slate-100 dark:bg-slate-800', content: 'text-xs font-medium text-slate-600 dark:text-slate-300' }}>
              {DAY_NAMES[state.day]}
            </Chip>
            <Chip size="sm" variant="flat" startContent={<Clock size={12} weight="duotone" />}
              classNames={{ base: 'bg-slate-100 dark:bg-slate-800', content: 'text-xs font-medium text-slate-600 dark:text-slate-300' }}>
              {state.startTime}
            </Chip>
          </div>
        </div>

        <div className="px-6 pb-5 space-y-4">
          {/* End time */}
          <Input
            type="time"
            label="שעת סיום"
            size="sm"
            variant="bordered"
            value={endTime}
            onValueChange={setEndTime}
            classNames={{
              inputWrapper: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
              label: 'text-slate-500 dark:text-slate-400 font-medium',
            }}
          />

          {/* Teacher selection */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              מורה
            </label>

            {/* Search input */}
            <Input
              type="text"
              placeholder="חיפוש מורה..."
              size="sm"
              variant="bordered"
              value={teacherSearch}
              onValueChange={setTeacherSearch}
              startContent={<MagnifyingGlass size={14} className="text-slate-400" />}
              classNames={{
                inputWrapper: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mb-2',
                label: 'text-slate-500 dark:text-slate-400 font-medium',
              }}
            />

            {/* Selected teacher indicator */}
            {selectedTeacher && (
              <div className="mb-2 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                <User
                  avatarProps={{
                    radius: 'full',
                    size: 'sm',
                    showFallback: true,
                    name: getTeacherDisplayName(selectedTeacher),
                    style: { backgroundColor: getAvatarColorHex(getTeacherDisplayName(selectedTeacher)), color: '#fff' },
                  }}
                  name={getTeacherDisplayName(selectedTeacher)}
                  classNames={{
                    name: 'text-sm font-bold text-primary',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSelectedTeacherId('')}
                  className="text-primary/60 hover:text-primary text-xs font-medium transition-colors"
                >
                  שנה
                </button>
              </div>
            )}

            {/* Teacher list */}
            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              {filteredTeachers.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-400 text-center">
                  לא נמצאו מורים
                </div>
              ) : (
                filteredTeachers.map((teacher) => {
                  const isSelected = teacher._id === selectedTeacherId
                  const name = getTeacherDisplayName(teacher)
                  return (
                    <div
                      key={teacher._id}
                      onClick={() => {
                        setSelectedTeacherId(teacher._id)
                        setError('')
                      }}
                      className={`px-3 py-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/5 border-r-2 border-primary font-medium'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <User
                        avatarProps={{
                          radius: 'full',
                          size: 'sm',
                          showFallback: true,
                          name,
                          style: { backgroundColor: getAvatarColorHex(name), color: '#fff', width: 24, height: 24, fontSize: 10 },
                        }}
                        name={name}
                        classNames={{
                          base: 'justify-start gap-2',
                          name: `text-sm ${isSelected ? 'font-bold text-primary' : 'text-slate-700 dark:text-slate-300'}`,
                        }}
                      />
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

          {/* Conflict warnings */}
          {conflictWarning && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 space-y-1">
              <div className="text-sm font-bold text-red-800 dark:text-red-400">התנגשויות שנמצאו:</div>
              {conflictWarning.map((w, i) => (
                <div key={i} className="text-sm text-red-700 dark:text-red-300">• {w}</div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <HeroButton
              color="default"
              variant="bordered"
              size="sm"
              onPress={() => onOpenChange(false)}
              className="font-bold"
            >
              ביטול
            </HeroButton>
            <HeroButton
              color="primary"
              variant="solid"
              size="sm"
              onPress={handleSubmit}
              isDisabled={submitting || !selectedTeacherId || conflictWarning !== null}
              isLoading={submitting}
              className="font-bold"
            >
              צור שיעור
            </HeroButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
