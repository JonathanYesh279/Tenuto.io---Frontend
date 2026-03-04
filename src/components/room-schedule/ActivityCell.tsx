import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ==================== Types ====================

export interface ActivityData {
  id: string
  source: 'timeBlock' | 'rehearsal' | 'theory'
  startTime: string
  endTime: string
  teacherName: string
  teacherId: string
  label: string
  activityType: string
  hasConflict: boolean
  conflictGroupId: string | null
  lessonId?: string | null
  studentId?: string | null
  duration?: number | null
  blockId?: string | null
}

interface ActivityCellProps {
  activity: ActivityData
  isDragEnabled?: boolean  // false by default, true when DndContext is active
  dragData?: {             // extra data attached to the draggable for onDragEnd
    room: string
    teacherId: string
  }
  onClick?: () => void     // click handler for opening detail modal
}

// ==================== Constants ====================

const ACTIVITY_COLORS = {
  timeBlock: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-900',
    label: 'שיעור פרטי',
    borderAccent: 'border-r-[6px] border-r-blue-600',
    borderAccentLeft: 'border-l-2 border-l-blue-400',
  },
  rehearsal: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-900',
    label: 'חזרה',
    borderAccent: 'border-r-[6px] border-r-purple-600',
    borderAccentLeft: 'border-l-2 border-l-purple-400',
  },
  theory: {
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    text: 'text-orange-900',
    label: 'תאוריה',
    borderAccent: 'border-r-[6px] border-r-orange-600',
    borderAccentLeft: 'border-l-2 border-l-orange-400',
  },
} as const

const CONFLICT_BORDER = 'border border-red-400'

// ==================== Component ====================

export default function ActivityCell({ activity, isDragEnabled, dragData, onClick }: ActivityCellProps) {
  const colors = ACTIVITY_COLORS[activity.source] || ACTIVITY_COLORS.timeBlock

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id,
    data: { ...activity, ...dragData },
    disabled: !isDragEnabled,
  })

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
  } : undefined

  const card = (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDragEnabled ? { ...attributes, ...listeners } : {})}
      onClick={(e) => {
        if (!isDragging && onClick) {
          e.stopPropagation()
          onClick()
        }
      }}
      className={cn(
        'rounded px-1.5 py-1 text-xs overflow-hidden h-full border',
        isDragEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        isDragging && 'opacity-30',
        colors.bg,
        colors.text,
        colors.borderAccent,
        colors.borderAccentLeft,
        activity.hasConflict ? CONFLICT_BORDER : colors.border
      )}
    >
      {/* Content: 3 lines with prefix labels */}
      <div className="font-medium truncate leading-tight text-[11px]">
        מורה: {activity.teacherName}
      </div>
      <div className="truncate leading-tight text-[10px] opacity-80">
        תלמיד: {activity.label}
      </div>
      <div className="truncate leading-tight text-[9px] opacity-60">
        {activity.startTime}-{activity.endTime}
      </div>
    </div>
  )

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[220px]">
          <div className="space-y-1">
            <div className="font-semibold">{colors.label}</div>
            <div>{activity.teacherName}</div>
            <div className="opacity-80">{activity.label}</div>
            <div className="opacity-70">
              {activity.startTime} - {activity.endTime}
            </div>
            {activity.hasConflict && (
              <div className="text-red-600 font-semibold">התנגשות!</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { ACTIVITY_COLORS, CONFLICT_BORDER }
