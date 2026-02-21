import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DotsThree as DotsThreeIcon } from '@phosphor-icons/react'

interface ActivityData {
  month: string
  students: number
  lessons: number
}

interface FinancialTrendsChartProps {
  data?: ActivityData[]
  loading?: boolean
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: '12px 16px',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        border: '1px solid #e2e8f0',
      }}
    >
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ marginBottom: index < payload.length - 1 ? '4px' : '0' }}>
          <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
            {entry.name}:{' '}
          </span>
          <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

const CustomLegend = () => {
  return (
    <div className="flex gap-4 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FBBF24' }}></div>
        <span className="text-slate-500 dark:text-slate-400 font-medium">רישומים</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#D1D5DB' }}></div>
        <span className="text-slate-500 dark:text-slate-400 font-medium">פעילויות</span>
      </div>
    </div>
  )
}

export function FinancialTrendsChart({ data, loading }: FinancialTrendsChartProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-sidebar-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-full flex flex-col items-center justify-center min-h-[280px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-slate-400">טוען נתונים...</p>
      </div>
    )
  }

  const hasData = data && data.length > 0 && data.some(d => d.students > 0 || d.lessons > 0)

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-sidebar-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-full flex flex-col items-center justify-center min-h-[280px]">
        <p className="text-sm text-slate-400">אין נתונים להצגה</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-sidebar-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-full flex flex-col">
      {/* Title row */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">מגמות חודשיות</h3>
          <CustomLegend />
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <DotsThreeIcon size={20} weight="bold" />
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="students"
            stroke="#FBBF24"
            strokeWidth={2.5}
            dot={false}
            name="רישומים"
          />
          <Line
            type="monotone"
            dataKey="lessons"
            stroke="#D1D5DB"
            strokeWidth={2}
            dot={false}
            name="פעילויות"
            strokeDasharray="6 3"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
