import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { roomScheduleService } from '@/services/apiService'
import { DAY_NAMES } from './utils'
import type { ActivityData } from './ActivityCell'
import { ACTIVITY_COLORS } from './ActivityCell'
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
      toast.success('\u05D4\u05E9\u05D9\u05E2\u05D5\u05E8 \u05E2\u05D5\u05D3\u05DB\u05DF \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4')
      onReschedule()
    } catch (err: any) {
      if (err?.code === 'CONFLICT' && err?.conflicts?.length > 0) {
        const conflictNames = err.conflicts
          .map((c: any) => `${c.teacherName} (${c.startTime}-${c.endTime})`)
          .join(', ')
        toast.error(`\u05D4\u05EA\u05E0\u05D2\u05E9\u05D5\u05EA \u05D1\u05D7\u05D3\u05E8: ${conflictNames}`)
      } else {
        toast.error('\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05E2\u05D3\u05DB\u05D5\u05DF \u05D4\u05E9\u05D9\u05E2\u05D5\u05E8')
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
      toast.success('\u05D4\u05E9\u05D9\u05E2\u05D5\u05E8 \u05E0\u05DE\u05D7\u05E7 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4')
      onDelete()
    } catch {
      toast.error('\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05DE\u05D7\u05D9\u05E7\u05EA \u05D4\u05E9\u05D9\u05E2\u05D5\u05E8')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${colors.bg} ${colors.text}`}
            >
              {colors.label}
            </span>
            {'\u05E4\u05E8\u05D8\u05D9 \u05E4\u05E2\u05D9\u05DC\u05D5\u05EA'}
          </DialogTitle>
        </DialogHeader>

        {/* Read-only details section */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-0.5">
                {'\u05DE\u05D5\u05E8\u05D4'}
              </label>
              <div className="text-sm text-gray-900">{activity.teacherName}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-0.5">
                {'\u05EA\u05DC\u05DE\u05D9\u05D3/\u05E7\u05D1\u05D5\u05E6\u05D4'}
              </label>
              <div className="text-sm text-gray-900">{activity.label}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-0.5">
                {'\u05D7\u05D3\u05E8'}
              </label>
              <div className="text-sm text-gray-900">{activity.room}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-0.5">
                {'\u05D9\u05D5\u05DD'}
              </label>
              <div className="text-sm text-gray-900">{DAY_NAMES[day]}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-0.5">
                {'\u05E9\u05E2\u05D5\u05EA'}
              </label>
              <div className="text-sm text-gray-900">
                {activity.startTime} - {activity.endTime}
              </div>
            </div>
          </div>
        </div>

        {/* Edit section -- only for timeBlock with lessonId */}
        {isEditable && (
          <>
            <div className="border-t pt-3 mt-1">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {'\u05E2\u05E8\u05D9\u05DB\u05EA \u05E9\u05D9\u05E2\u05D5\u05E8'}
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {'\u05D9\u05D5\u05DD'}
                    </label>
                    <select
                      value={editDay}
                      onChange={(e) => setEditDay(Number(e.target.value))}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {DAY_NAMES.map((name, idx) => (
                        <option key={idx} value={idx}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {'\u05D7\u05D3\u05E8'}
                    </label>
                    <select
                      value={editRoom}
                      onChange={(e) => setEditRoom(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {rooms.filter(r => r.isActive).map((r) => (
                        <option key={r.name} value={r.name}>{r.name}</option>
                      ))}
                      {editRoom && !rooms.some(r => r.name === editRoom && r.isActive) && (
                        <option value={editRoom}>{editRoom}</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {'\u05E9\u05E2\u05EA \u05D4\u05EA\u05D7\u05DC\u05D4'}
                    </label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {'\u05E9\u05E2\u05EA \u05E1\u05D9\u05D5\u05DD'}
                    </label>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between border-t pt-3 mt-1">
              {/* Delete button */}
              <div>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                  >
                    {'\u05DE\u05D7\u05D9\u05E7\u05EA \u05E9\u05D9\u05E2\u05D5\u05E8'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {deleting ? '\u05DE\u05D5\u05D7\u05E7...' : '\u05D0\u05D9\u05E9\u05D5\u05E8 \u05DE\u05D7\u05D9\u05E7\u05D4'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {'\u05D1\u05D9\u05D8\u05D5\u05DC'}
                    </button>
                  </div>
                )}
              </div>

              {/* Save button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '\u05E9\u05D5\u05DE\u05E8...' : '\u05E9\u05DE\u05D5\u05E8 \u05E9\u05D9\u05E0\u05D5\u05D9\u05D9\u05DD'}
              </button>
            </div>
          </>
        )}

        {/* Read-only notice for rehearsal/theory */}
        {activity.source !== 'timeBlock' && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2 mt-2">
            {'\u05E0\u05D9\u05EA\u05DF \u05DC\u05E2\u05E8\u05D5\u05DA \u05D7\u05D6\u05E8\u05D5\u05EA \u05D5\u05EA\u05D0\u05D5\u05E8\u05D9\u05D4 \u05D1\u05E2\u05DE\u05D5\u05D3\u05D9\u05DD \u05D4\u05D9\u05D9\u05E2\u05D5\u05D3\u05D9\u05D9\u05DD'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
