/**
 * AttendanceChart - Attendance donut chart + monthly trend line for Student Details dashboard.
 *
 * Displays attendance breakdown (present/absent/late) as a donut chart with center percentage,
 * plus a monthly attendance rate trend line below.
 */

import { TremorDonutChart } from '@/components/charts/TremorDonutChart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const GLASS_CARD_STYLE = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,230,210,0.15) 50%, rgba(255,255,255,0.9) 100%)',
  boxShadow: '0 4px 16px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(200,220,240,0.5)',
} as const

interface AttendanceChartProps {
  attendanceSummary: {
    totalSessions: number
    attendedCount: number
    lateCount: number
    absentCount: number
    attendanceRate: number
  } | null
  monthlyAttendance: Array<{ month: string; rate: number }>
  isLoading: boolean
}

export function AttendanceChart({
  attendanceSummary,
  monthlyAttendance,
  isLoading,
}: AttendanceChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-card p-6 space-y-6" style={GLASS_CARD_STYLE}>
        <div className="h-6 w-20 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-full mx-auto w-48 animate-pulse" />
        <div className="flex justify-around">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const hasAttendanceData =
    attendanceSummary != null && attendanceSummary.totalSessions > 0

  const donutData = hasAttendanceData
    ? [
        { status: 'נוכח', count: attendanceSummary!.attendedCount },
        { status: 'חיסור', count: attendanceSummary!.absentCount },
        { status: 'איחור', count: attendanceSummary!.lateCount },
      ]
    : []

  const legendItems = hasAttendanceData
    ? [
        {
          label: 'נוכח',
          count: attendanceSummary!.attendedCount,
          color: 'bg-emerald-500',
        },
        {
          label: 'חיסור',
          count: attendanceSummary!.absentCount,
          color: 'bg-rose-500',
        },
        {
          label: 'איחור',
          count: attendanceSummary!.lateCount,
          color: 'bg-amber-500',
        },
      ]
    : []

  const hasMonthlyData = monthlyAttendance.length > 0

  return (
    <div className="rounded-card p-6 space-y-6" style={GLASS_CARD_STYLE}>
      {/* Donut section */}
      <div>
        <h3 className="text-h3 font-semibold text-foreground mb-4">נוכחות</h3>

        {hasAttendanceData ? (
          <>
            <TremorDonutChart
              data={donutData}
              category="status"
              value="count"
              colors={['emerald', 'rose', 'amber']}
              variant="donut"
              label={`${Math.round(attendanceSummary!.attendanceRate)}%`}
              showLabel
              showLegend={false}
              className="h-48"
            />

            {/* Legend row */}
            <div className="flex justify-around mt-4">
              {legendItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-caption">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-muted-foreground">
                    {item.label} ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-body">
            אין נתוני נוכחות
          </div>
        )}
      </div>

      {/* Monthly trend section */}
      {hasMonthlyData && (
        <div>
          <h4 className="text-body font-medium text-foreground mb-3">מגמה חודשית</h4>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={monthlyAttendance}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'נוכחות']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: '#6366f1' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
