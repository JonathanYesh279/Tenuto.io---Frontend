/**
 * ActivityChart - Weekly lesson hours bar chart for the Student Details dashboard.
 *
 * Displays scheduled lesson hours per day (Sun-Fri) using TremorBarChart.
 * Shows empty state when no hours data is available.
 */

import { TremorBarChart } from '@/components/charts/TremorBarChart'

const GLASS_CARD_STYLE = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,230,210,0.15) 50%, rgba(255,255,255,0.9) 100%)',
  boxShadow: '0 4px 16px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(200,220,240,0.5)',
} as const

interface ActivityChartProps {
  weeklyHours: Array<{ day: string; hours: number }>
  totalWeeklyHours: number
  isLoading: boolean
}

export function ActivityChart({ weeklyHours, totalWeeklyHours, isLoading }: ActivityChartProps) {
  const hasData = weeklyHours.length > 0 && weeklyHours.some((e) => e.hours > 0)

  if (isLoading) {
    return (
      <div className="rounded-card p-6" style={GLASS_CARD_STYLE}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-28 bg-muted rounded animate-pulse" />
          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-48 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="rounded-card p-6" style={GLASS_CARD_STYLE}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3 font-semibold text-foreground">פעילות שבועית</h3>
        <span className="text-caption text-muted-foreground bg-muted px-3 py-1 rounded-full">
          השבוע
        </span>
      </div>

      {/* Chart or empty state */}
      {hasData ? (
        <TremorBarChart
          data={weeklyHours}
          index="day"
          categories={['hours']}
          colors={['indigo']}
          valueFormatter={(v) => `${v} שעות`}
          showLegend={false}
          showYAxis={false}
          showGridLines={false}
          className="h-48"
        />
      ) : (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-body">
          אין נתוני שעות
        </div>
      )}
    </div>
  )
}
