import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button as HeroButton, User, Input, Chip } from '@heroui/react'
import { Clock, MapPin, CalendarBlank, MusicNote, Users as UsersIcon } from '@phosphor-icons/react'
import { roomScheduleService, teacherScheduleService, rehearsalService, theoryService } from '@/services/apiService'
import { DAY_NAMES, doTimesOverlap } from './utils'
import type { ActivityData } from './ActivityCell'
import { ACTIVITY_COLORS } from './ActivityCell'
import { getAvatarColorHex } from '@/utils/avatarColorHash'
import toast from 'react-hot-toast'

// ==================== Types ====================

interface ActivityDetailModalProps {
  activity: (ActivityData & {
    room: string
    lessonId?: string | null
    studentId?: string | null
    duration?: number | null
    blockId?: string | null
  }) | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReschedule: () => void
  onDelete: () => void
  day: number
  rooms?: Array<{ name: string; isActive: boolean }>
  scheduleData?: { rooms: Array<{ room: string; activities: Array<{ id: string; startTime: string; endTime: string; source: string; teacherName?: string; title?: string; label?: string }> }> } | null
  getScheduleForDay?: (day: number) => Promise<{ rooms: Array<{ room: string; activities: Array<any> }> }>
}

// ==================== Component ====================

export default function ActivityDetailModal({
  activity,
  open,
  onOpenChange,
  onReschedule,
  onDelete,
  day,
  rooms = [],
  scheduleData = null,
  getScheduleForDay,
}: ActivityDetailModalProps) {
  // Local edit state
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editRoom, setEditRoom] = useState('')
  const [editDay, setEditDay] = useState(day)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [previewConflicts, setPreviewConflicts] = useState<Array<{ room: string; startTime: string; endTime: string; title: string; source: string }>>([])
  const [checkingConflicts, setCheckingConflicts] = useState(false)

  // Reset edit state when activity changes
  useEffect(() => {
    if (activity && open) {
      setEditDay(day)
      setEditStartTime(activity.startTime)
      setEditEndTime(activity.endTime)
      setEditRoom(activity.room)
      setConfirmDelete(false)
    }
  }, [activity, open, day])

  // Conflict preview: check for overlapping activities when day/room/time changes
  useEffect(() => {
    if (!activity || !open) return

    const checkConflicts = async () => {
      setCheckingConflicts(true)
      try {
        // Get schedule for the target day
        let targetSchedule = scheduleData
        if (editDay !== day && getScheduleForDay) {
          targetSchedule = await getScheduleForDay(editDay)
        }

        if (!targetSchedule) {
          setPreviewConflicts([])
          return
        }

        // Find the target room's activities
        const roomData = targetSchedule.rooms.find(r => r.room === editRoom)
        if (!roomData) {
          setPreviewConflicts([])
          return
        }

        // Filter out the current activity and check for time overlaps
        const conflicts = roomData.activities
          .filter(a => a.id !== activity.id)
          .filter(a => doTimesOverlap(editStartTime, editEndTime, a.startTime, a.endTime))
          .map(a => ({
            room: editRoom,
            startTime: a.startTime,
            endTime: a.endTime,
            title: a.teacherName || a.label || a.title || '\u05E4\u05E2\u05D9\u05DC\u05D5\u05EA',
            source: a.source || 'unknown',
          }))

        setPreviewConflicts(conflicts)
      } catch {
        setPreviewConflicts([]) // fail silently — server-side check is the safety net
      } finally {
        setCheckingConflicts(false)
      }
    }

    // Debounce to avoid excessive API calls when user is still selecting
    const timer = setTimeout(checkConflicts, 300)
    return () => clearTimeout(timer)
  }, [editDay, editRoom, editStartTime, editEndTime, activity, open, day, scheduleData, getScheduleForDay])

  if (!activity) return null

  const colors = ACTIVITY_COLORS[activity.source] || ACTIVITY_COLORS.timeBlock
  const hasLesson = activity.source === 'timeBlock' && !!activity.lessonId

  // Build room list from schedule data + tenant rooms + current room
  const availableRooms = (() => {
    const roomSet = new Set<string>()
    // Add rooms from current schedule data
    if (scheduleData?.rooms) {
      for (const r of scheduleData.rooms) roomSet.add(r.room)
    }
    // Add tenant rooms
    for (const r of rooms) {
      if (r.isActive) roomSet.add(r.name)
    }
    // Always include the current activity's room
    if (activity.room) roomSet.add(activity.room)
    return Array.from(roomSet).sort((a, b) => a.localeCompare(b, 'he'))
  })()

  // ---- Save handler (all source types) ----
  const handleSave = async () => {
    setSaving(true)
    try {
      if (activity.source === 'timeBlock') {
        if (hasLesson && activity.blockId) {
          await roomScheduleService.rescheduleLesson({
            teacherId: activity.teacherId,
            sourceBlockId: activity.blockId,
            lessonId: activity.lessonId!,
            targetRoom: editRoom,
            targetDay: editDay,
            targetStartTime: editStartTime,
            targetEndTime: editEndTime,
          })
        } else if (activity.blockId) {
          await roomScheduleService.moveActivity({
            activityId: activity.id,
            source: 'timeBlock',
            targetRoom: editRoom,
            targetStartTime: editStartTime,
            targetEndTime: editEndTime,
            teacherId: activity.teacherId,
            blockId: activity.blockId,
            targetDay: editDay,
          })
        }
      } else if (activity.source === 'rehearsal') {
        const rehearsalUpdate: Record<string, any> = {
          startTime: editStartTime,
          endTime: editEndTime,
          location: editRoom,
        }
        if (editDay !== day) {
          rehearsalUpdate.dayOfWeek = editDay
          // Calculate a date that falls on the target dayOfWeek
          const today = new Date()
          const currentDayOfWeek = today.getDay() // JS: 0=Sunday
          const diff = editDay - currentDayOfWeek
          const targetDate = new Date(today)
          targetDate.setDate(today.getDate() + diff)
          if (diff < 0) targetDate.setDate(targetDate.getDate() + 7)
          rehearsalUpdate.date = targetDate.toISOString()
        }
        await rehearsalService.updateRehearsal(activity.id, rehearsalUpdate)
      } else if (activity.source === 'theory') {
        const theoryUpdate: Record<string, any> = {
          startTime: editStartTime,
          endTime: editEndTime,
          location: editRoom,
        }
        if (editDay !== day) {
          theoryUpdate.dayOfWeek = editDay
        }
        await theoryService.updateTheoryLesson(activity.id, theoryUpdate)
      }
      toast.success('הפעילות עודכנה בהצלחה')
      onReschedule()
    } catch (err: any) {
      if (err?.code === 'CONFLICT' && err?.conflicts?.length > 0) {
        const conflictNames = err.conflicts
          .map((c: any) => `${c.teacherName || 'פעילות'} (${c.startTime}-${c.endTime}${c.room ? ', ' + c.room : ''})`)
          .join(', ')
        toast.error(`התנגשות בחדר: ${conflictNames}`)
      } else if (err?.response?.status === 409 || (err?.conflicts && err.conflicts.length > 0)) {
        const conflicts = err.conflicts || []
        const conflictNames = conflicts
          .map((c: any) => `${c.teacherName || c.title || 'פעילות'} (${c.startTime}-${c.endTime})`)
          .join(', ')
        toast.error(`התנגשות בלוח: ${conflictNames || 'נמצאה התנגשות'}`)
      } else {
        toast.error('שגיאה בעדכון הפעילות')
      }
    } finally {
      setSaving(false)
    }
  }

  // ---- Delete handler (all source types) ----
  const handleDelete = async () => {
    setDeleting(true)
    try {
      if (activity.source === 'timeBlock') {
        if (activity.blockId) {
          // Delete the entire timeBlock (handles lesson cleanup internally)
          await teacherScheduleService.deleteTimeBlock(
            activity.teacherId,
            activity.blockId,
          )
        }
      } else if (activity.source === 'rehearsal') {
        await rehearsalService.deleteRehearsalPattern(activity.id)
      } else if (activity.source === 'theory') {
        await theoryService.deleteTheoryLesson(activity.id)
      }
      toast.success('הפעילות נמחקה בהצלחה')
      onDelete()
    } catch {
      toast.error('שגיאה במחיקת הפעילות')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  // Label for delete button based on source type
  const deleteLabel = activity.source === 'rehearsal' ? 'מחיקת חזרה'
    : activity.source === 'theory' ? 'מחיקת שיעור תאוריה'
    : 'מחיקת שיעור'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-visible">
        {/* Header with accent color */}
        <div
          className="px-6 pt-5 pb-4"
          style={{
            background: `linear-gradient(135deg, ${colors.iconBg}40 0%, transparent 100%)`,
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Chip
                size="sm"
                variant="flat"
                classNames={{
                  base: colors.bg,
                  content: `${colors.text} text-xs font-bold`,
                }}
              >
                {colors.label}
              </Chip>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">פרטי פעילות</span>
            </DialogTitle>
            <DialogDescription className="sr-only">עריכת פרטי פעילות</DialogDescription>
          </DialogHeader>

          {/* Teacher + Student info cards */}
          <div className="mt-4 space-y-3">
            {/* Teacher */}
            {activity.teacherName ? (
              <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/80 dark:border-slate-700/50">
                <User
                  avatarProps={{
                    radius: 'full',
                    size: 'sm',
                    showFallback: true,
                    name: activity.teacherName,
                    style: { backgroundColor: getAvatarColorHex(activity.teacherName || ''), color: '#fff' },
                  }}
                  name={activity.teacherName}
                  description={activity.source === 'rehearsal' ? 'מנצח/ת' : activity.source === 'theory' ? 'מורה תאוריה' : 'מורה'}
                  classNames={{
                    name: 'text-sm font-bold text-slate-800 dark:text-white',
                    description: 'text-xs text-slate-400',
                  }}
                />
              </div>
            ) : null}

            {/* Student/Group */}
            <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/80 dark:border-slate-700/50">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                {activity.source === 'rehearsal' ? (
                  <UsersIcon size={16} className="text-purple-500" weight="duotone" />
                ) : activity.source === 'theory' ? (
                  <MusicNote size={16} className="text-amber-500" weight="duotone" />
                ) : (
                  <MusicNote size={16} className="text-blue-500" weight="duotone" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-white">{activity.label}</div>
                <div className="text-xs text-slate-400">
                  {activity.source === 'rehearsal' ? 'תזמורת/הרכב' : activity.source === 'theory' ? 'קטגוריה' : 'תלמיד/קבוצה'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick info row */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <MapPin size={13} weight="duotone" />
              <span className="font-medium">{activity.room}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarBlank size={13} weight="duotone" />
              <span className="font-medium">{DAY_NAMES[day]}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={13} weight="duotone" />
              <span className="font-medium">{activity.startTime} - {activity.endTime}</span>
            </div>
          </div>
        </div>

        {/* Edit section -- for all activity types */}
        <div className="px-6 pb-5">
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              עריכה
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">יום</label>
                  <select
                    value={String(editDay)}
                    onChange={(e) => setEditDay(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {DAY_NAMES.map((name, idx) => (
                      <option key={idx} value={idx}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">חדר</label>
                  <select
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {availableRooms.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="time"
                  label="שעת התחלה"
                  size="sm"
                  variant="bordered"
                  value={editStartTime}
                  onValueChange={setEditStartTime}
                  classNames={{
                    inputWrapper: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
                    label: 'text-slate-500 dark:text-slate-400 font-medium',
                  }}
                />
                <Input
                  type="time"
                  label="שעת סיום"
                  size="sm"
                  variant="bordered"
                  value={editEndTime}
                  onValueChange={setEditEndTime}
                  classNames={{
                    inputWrapper: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
                    label: 'text-slate-500 dark:text-slate-400 font-medium',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Conflict preview warning */}
          {previewConflicts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mt-3">
              <div className="font-medium mb-1">&#9888; {'\u05D4\u05EA\u05E0\u05D2\u05E9\u05D5\u05EA \u05D1\u05DC\u05D5\u05D7:'}</div>
              {previewConflicts.map((c, i) => (
                <div key={i} className="text-xs">
                  {c.title} &mdash; {c.startTime}-{c.endTime} ({c.room})
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 mt-1">
            {/* Delete button */}
            <div>
              {!confirmDelete ? (
                <HeroButton
                  color="danger"
                  variant="bordered"
                  size="sm"
                  onPress={() => setConfirmDelete(true)}
                  className="font-bold hover:!bg-danger hover:!text-white hover:!border-danger transition-all"
                >
                  {deleteLabel}
                </HeroButton>
              ) : (
                <div className="flex items-center gap-2">
                  <HeroButton
                    color="danger"
                    variant="solid"
                    size="sm"
                    onPress={handleDelete}
                    isDisabled={deleting}
                    isLoading={deleting}
                    className="font-bold"
                  >
                    אישור מחיקה
                  </HeroButton>
                  <HeroButton
                    color="default"
                    variant="bordered"
                    size="sm"
                    onPress={() => setConfirmDelete(false)}
                    className="font-bold"
                  >
                    ביטול
                  </HeroButton>
                </div>
              )}
            </div>

            {/* Save button */}
            <HeroButton
              color="primary"
              variant="solid"
              size="sm"
              onPress={handleSave}
              isDisabled={saving}
              isLoading={saving}
              className="font-bold"
            >
              שמור שינויים
            </HeroButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
