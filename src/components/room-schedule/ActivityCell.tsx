import { WarningCircle } from '@phosphor-icons/react'
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
  label: string
  activityType: string
  hasConflict: boolean
  conflictGroupId: string | null
}

interface ActivityCellProps {
  activity: ActivityData
}

// ==================== Constants ====================

const ACTIVITY_COLORS = {
  timeBlock: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-900',
    label: 'שיעור פרטי',
  },
  rehearsal: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-900',
    label: 'חזרה',
  },
  theory: {
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    text: 'text-orange-900',
    label: 'תאוריה',
  },
} as const

const CONFLICT_BORDER = 'border-2 border-red-500 ring-2 ring-red-200'

// ==================== Component ====================

export default function ActivityCell({ activity }: ActivityCellProps) {
  const colors = ACTIVITY_COLORS[activity.source] || ACTIVITY_COLORS.timeBlock

  const card = (
    <div
      className={cn(
        'rounded px-1.5 py-1 text-xs overflow-hidden h-full cursor-default border relative',
        colors.bg,
        colors.text,
        activity.hasConflict ? CONFLICT_BORDER : colors.border
      )}
    >
      {/* Conflict warning indicator */}
      {activity.hasConflict && (
        <WarningCircle
          size={12}
          weight="fill"
          className="absolute top-0.5 left-0.5 text-red-500"
        />
      )}

      {/* Content */}
      <div className="font-medium truncate leading-tight">
        {activity.teacherName}
      </div>
      <div className="truncate leading-tight text-[10px] opacity-80">
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
