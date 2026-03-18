/**
 * ActivityChart - Weekly lesson hours bar chart for the Student Details dashboard.
 *
 * Displays scheduled lesson hours per day (Sun-Fri) using TremorBarChart.
 * Shows empty state when no hours data is available.
 */

import { TremorBarChart } from '@/components/charts/TremorBarChart'

interface ActivityChartProps {
  weeklyHours: Array<{ day: string; hours: number }>
  totalWeeklyHours: number
  isLoading: boolean
}

export function ActivityChart({ weeklyHours, totalWeeklyHours, isLoading }: ActivityChartProps) {
  const hasData = weeklyHours.length > 0 && weeklyHours.some((e) => e.hours > 0)

  if (isLoading) {
    return (
      <div className="bg-white rounded-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-48 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card border border-border p-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3 font-semibold text-foreground">פעילות שבועית</h3>
        <span className="text-caption text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
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
