import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface DroppableCellProps {
  room: string
  timeSlot: string      // "HH:MM"
  isEmpty: boolean       // whether this slot is unoccupied
  onClick?: () => void   // click-to-create handler (only for empty cells)
  children?: React.ReactNode
}

export default function DroppableCell({ room, timeSlot, isEmpty, onClick, children }: DroppableCellProps) {
  const droppableId = `${room}::${timeSlot}`
  const { isOver, setNodeRef } = useDroppable({ id: droppableId })

  return (
    <div
      ref={setNodeRef}
      onClick={isEmpty ? onClick : undefined}
      className={cn(
        'h-full w-full transition-colors',
        isOver && 'bg-blue-50 ring-2 ring-blue-300 ring-inset rounded',
        isEmpty && onClick && 'cursor-pointer hover:bg-gray-50'
      )}
    >
      {children}
    </div>
  )
}
