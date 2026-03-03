import { ACTIVITY_COLORS } from './ActivityCell'
import { timeToMinutes, GRID_START_HOUR, GRID_END_HOUR } from './utils'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ==================== Types ====================

interface MiniActivity {
  source: 'timeBlock' | 'rehearsal' | 'theory'
  startTime: string
  endTime: string
  teacherName: string
  label: string
  hasConflict: boolean
}

interface WeekMiniGridProps {
  activities: MiniActivity[]
}

// ==================== Constants ====================

const TOTAL_GRID_MINUTES = (GRID_END_HOUR - GRID_START_HOUR) * 60

// ==================== Component ====================

export default function WeekMiniGrid({ activities }: WeekMiniGridProps) {
  if (activities.length === 0) {
    return <div className="h-10 border-b border-l" />
  }

  const gridStartMinutes = GRID_START_HOUR * 60

  return (
    <div className="relative h-10 border-b border-l">
      {activities.map((activity, idx) => {
        const startMin = timeToMinutes(activity.startTime)
        const endMin = timeToMinutes(activity.endTime)
        const offsetMin = Math.max(startMin - gridStartMinutes, 0)
        const durationMin = Math.min(endMin, GRID_END_HOUR * 60) - Math.max(startMin, gridStartMinutes)

        const leftPct = (offsetMin / TOTAL_GRID_MINUTES) * 100
        const widthPct = Math.max((durationMin / TOTAL_GRID_MINUTES) * 100, 2)

        const colors = ACTIVITY_COLORS[activity.source] || ACTIVITY_COLORS.timeBlock

        return (
          <TooltipProvider key={idx} delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'absolute top-1 bottom-1 rounded-sm cursor-default',
                    colors.bg,
                    activity.hasConflict && 'ring-1 ring-red-400'
                  )}
                  style={{
                    insetInlineStart: `${leftPct}%`,
                    width: `${widthPct}%`,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[200px]">
                <div>
                  <div className="font-medium">{activity.teacherName} - {activity.label}</div>
                  <div className="opacity-70">{activity.startTime}-{activity.endTime}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}
