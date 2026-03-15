import { useDroppable, useDndContext } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { doTimesOverlap, timeToMinutes, minutesToTime } from './utils'

interface DroppableCellProps {
  room: string
  timeSlot: string      // "HH:MM"
  isEmpty: boolean       // whether this slot is unoccupied
  roomActivities: Array<{ id: string; startTime: string; endTime: string; teacherId?: string }>
  onClick?: () => void   // click-to-create handler (only for empty cells)
  children?: React.ReactNode
}

export default function DroppableCell({ room, timeSlot, isEmpty, roomActivities, onClick, children }: DroppableCellProps) {
  const droppableId = `${room}::${timeSlot}`
  const { isOver, setNodeRef } = useDroppable({ id: droppableId })
  const { active } = useDndContext()

  // Determine if dropping the active item here would create a room conflict
  const wouldConflict = (() => {
    if (!active || !isOver) return false

    const dragData = active.data.current as {
      id: string
      startTime: string
      endTime: string
    } | undefined

    if (!dragData) return false

    // Calculate the drop time range preserving the dragged activity's duration
    const durationMinutes = timeToMinutes(dragData.endTime) - timeToMinutes(dragData.startTime)
    const dropStart = timeSlot
    const dropEnd = minutesToTime(timeToMinutes(timeSlot) + durationMinutes)

    // Check all room activities (excluding the dragged item itself) for time overlap
    for (const activity of roomActivities) {
      if (activity.id === dragData.id) continue
      if (doTimesOverlap(dropStart, dropEnd, activity.startTime, activity.endTime)) {
        return true
      }
    }

    return false
  })()

  return (
    <div
      ref={setNodeRef}
      onClick={isEmpty ? onClick : undefined}
      className={cn(
        'h-full w-full transition-colors',
        isOver && !wouldConflict && 'bg-green-50 ring-2 ring-green-400 ring-inset rounded',
        isOver && wouldConflict && 'bg-red-50 ring-2 ring-red-400 ring-inset rounded cursor-not-allowed',
        isEmpty && onClick && !isOver && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'
      )}
    >
      {children}
    </div>
  )
}
