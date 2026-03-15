import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { User } from '@heroui/react'
import { cn } from '@/lib/utils'
import { getAvatarColorHex } from '@/utils/avatarColorHash'
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
    bg: 'bg-blue-50/80',
    border: 'border-blue-200',
    text: 'text-blue-900',
    label: 'שיעור פרטי',
    accent: 'border-r-[4px] border-r-blue-500',
    accentHex: '#3b82f6',
    iconBg: '#dbeafe',
  },
  rehearsal: {
    bg: 'bg-purple-50/80',
    border: 'border-purple-200',
    text: 'text-purple-900',
    label: 'חזרה',
    accent: 'border-r-[4px] border-r-purple-500',
    accentHex: '#8b5cf6',
    iconBg: '#f3e8ff',
  },
  theory: {
    bg: 'bg-amber-50/80',
    border: 'border-amber-200',
    text: 'text-amber-900',
    label: 'תאוריה',
    accent: 'border-r-[4px] border-r-amber-500',
    accentHex: '#f59e0b',
    iconBg: '#fef3c7',
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
        'rounded-lg px-2 py-1.5 text-xs overflow-hidden h-full border backdrop-blur-sm transition-shadow hover:shadow-md',
        isDragEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        isDragging && 'opacity-30',
        colors.bg,
        colors.accent,
        activity.hasConflict ? CONFLICT_BORDER : colors.border
      )}
    >
      {/* Time range */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
        {activity.startTime} - {activity.endTime}
      </div>
      {/* Activity type label */}
      <div className={cn('font-bold text-[11px] leading-tight mb-1', colors.text)}>
        {activity.source === 'timeBlock' ? colors.label : activity.activityType || colors.label}
      </div>
      {/* Teacher avatar + name */}
      <User
        avatarProps={{
          radius: 'full',
          size: 'sm',
          showFallback: true,
          name: activity.teacherName,
          style: { backgroundColor: getAvatarColorHex(activity.teacherName || ''), color: '#fff', width: 20, height: 20, fontSize: 9 },
          classNames: { base: 'shrink-0' },
        }}
        name={activity.teacherName}
        classNames={{
          base: 'justify-start gap-1.5',
          name: 'text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate leading-tight',
        }}
      />
      {/* Student / group label */}
      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 pr-[26px]">
        {activity.label}
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
