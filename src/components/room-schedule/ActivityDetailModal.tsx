import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button as HeroButton, User, Select, SelectItem, Input, Chip } from '@heroui/react'
import { Clock, MapPin, CalendarBlank, MusicNote, Users as UsersIcon } from '@phosphor-icons/react'
import { roomScheduleService } from '@/services/apiService'
import { DAY_NAMES } from './utils'
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
}: ActivityDetailModalProps) {
  // Local edit state
  const [editDay, setEditDay] = useState(day)
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editRoom, setEditRoom] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  if (!activity) return null

  const colors = ACTIVITY_COLORS[activity.source] || ACTIVITY_COLORS.timeBlock
  const isEditable = activity.source === 'timeBlock' && !!activity.lessonId

  const handleSave = async () => {
    if (!activity.blockId || !activity.lessonId) return
    setSaving(true)
    try {
      await roomScheduleService.rescheduleLesson({
        teacherId: activity.teacherId,
        sourceBlockId: activity.blockId,
        lessonId: activity.lessonId,
        targetRoom: editRoom,
        targetDay: editDay,
        targetStartTime: editStartTime,
        targetEndTime: editEndTime,
      })
      toast.success('השיעור עודכן בהצלחה')
      onReschedule()
    } catch (err: any) {
      if (err?.code === 'CONFLICT' && err?.conflicts?.length > 0) {
        const conflictNames = err.conflicts
          .map((c: any) => `${c.teacherName} (${c.startTime}-${c.endTime})`)
          .join(', ')
        toast.error(`התנגשות בחדר: ${conflictNames}`)
      } else {
        toast.error('שגיאה בעדכון השיעור')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activity.blockId || !activity.lessonId) return
    setDeleting(true)
    try {
      await roomScheduleService.deleteLessonFromBlock(
        activity.teacherId,
        activity.blockId,
        activity.lessonId,
      )
      toast.success('השיעור נמחק בהצלחה')
      onDelete()
    } catch {
      toast.error('שגיאה במחיקת השיעור')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
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
          </DialogHeader>

          {/* Teacher + Student info cards */}
          <div className="mt-4 space-y-3">
            {/* Teacher */}
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
                description="מורה"
                classNames={{
                  name: 'text-sm font-bold text-slate-800 dark:text-white',
                  description: 'text-xs text-slate-400',
                }}
              />
            </div>

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
                <div className="text-xs text-slate-400">תלמיד/קבוצה</div>
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

        {/* Edit section -- only for timeBlock with lessonId */}
        {isEditable && (
          <div className="px-6 pb-5">
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                עריכת שיעור
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="יום"
                    size="sm"
                    variant="bordered"
                    selectedKeys={[String(editDay)]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0]
                      if (val !== undefined) setEditDay(Number(val))
                    }}
                    classNames={{
                      trigger: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
                      label: 'text-slate-500 dark:text-slate-400 font-medium',
                    }}
                  >
                    {DAY_NAMES.map((name, idx) => (
                      <SelectItem key={String(idx)}>{name}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="חדר"
                    size="sm"
                    variant="bordered"
                    selectedKeys={[editRoom]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] as string
                      if (val) setEditRoom(val)
                    }}
                    classNames={{
                      trigger: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
                      label: 'text-slate-500 dark:text-slate-400 font-medium',
                    }}
                  >
                    {rooms.filter(r => r.isActive).map((r) => (
                      <SelectItem key={r.name}>{r.name}</SelectItem>
                    ))}
                    {editRoom && !rooms.some(r => r.name === editRoom && r.isActive) && (
                      <SelectItem key={editRoom}>{editRoom}</SelectItem>
                    )}
                  </Select>
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
                    className="font-bold"
                  >
                    מחיקת שיעור
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
        )}

        {/* Read-only notice for rehearsal/theory */}
        {activity.source !== 'timeBlock' && (
          <div className="px-6 pb-5">
            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-700">
              ניתן לערוך חזרות ותאוריה בעמודים הייעודיים
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
