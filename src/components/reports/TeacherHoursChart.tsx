import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Column {
  key: string
  label: string
  type: string
}

interface TeacherHoursChartProps {
  rows: Record<string, any>[]
  columns: Column[]
}

// Category definitions with Hebrew labels and colors
const HOUR_CATEGORIES = [
  { key: 'individualLessons', label: 'שיעורים פרטיים', color: '#3b82f6' },
  { key: 'orchestraConducting', label: 'ניצוח', color: '#8b5cf6' },
  { key: 'theoryTeaching', label: 'תאוריה', color: '#f59e0b' },
  { key: 'management', label: 'ניהול', color: '#ef4444' },
  { key: 'accompaniment', label: 'ליווי', color: '#10b981' },
  { key: 'ensembleCoordination', label: 'ריכוז הרכבים', color: '#06b6d4' },
  { key: 'coordination', label: 'תיאום', color: '#ec4899' },
  { key: 'breakTime', label: 'הפסקות', color: '#6b7280' },
  { key: 'travelTime', label: 'נסיעות', color: '#d97706' },
]

export default function TeacherHoursChart({ rows, columns }: TeacherHoursChartProps) {
  if (!rows || rows.length === 0) return null

  // Determine which categories are actually present in the data
  const activeCategories = HOUR_CATEGORIES.filter((cat) =>
    rows.some((row) => row[cat.key] && Number(row[cat.key]) > 0)
  )

  // Limit to top 15 teachers by total hours
  const sortedRows = [...rows].sort(
    (a, b) => (Number(b.totalWeeklyHours) || 0) - (Number(a.totalWeeklyHours) || 0)
  )
  const isLimited = sortedRows.length > 15
  const displayRows = isLimited ? sortedRows.slice(0, 15) : sortedRows

  // Prepare chart data
  const chartData = displayRows.map((row) => ({
    name: row.teacherName || '',
    ...activeCategories.reduce(
      (acc, cat) => ({
        ...acc,
        [cat.key]: Number(row[cat.key]) || 0,
      }),
      {}
    ),
  }))

  const chartHeight = Math.max(300, displayRows.length * 35)

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        התפלגות שעות לפי מורה
      </h3>

      {isLimited && (
        <p className="text-sm text-muted-foreground mb-3">
          מציג 15 מורים מובילים מתוך {rows.length}
        </p>
      )}

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="name"
            width={75}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              direction: 'rtl',
              textAlign: 'right',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
            formatter={(value: number, name: string) => {
              const cat = activeCategories.find((c) => c.key === name)
              return [value.toFixed(1), cat?.label || name]
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            formatter={(value: string) => {
              const cat = activeCategories.find((c) => c.key === value)
              return cat?.label || value
            }}
          />
          {activeCategories.map((cat) => (
            <Bar
              key={cat.key}
              dataKey={cat.key}
              stackId="hours"
              fill={cat.color}
              name={cat.key}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
