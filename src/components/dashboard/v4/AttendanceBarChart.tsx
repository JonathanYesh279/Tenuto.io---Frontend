import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { DotsThree as DotsThreeIcon } from '@phosphor-icons/react'

// TODO: Wire to real attendance stats from API
const MOCK_ATTENDANCE_DATA = [
  { day: "א'", present: 85, absent: 15 },
  { day: "ב'", present: 92, absent: 8 },
  { day: "ג'", present: 88, absent: 12 },
  { day: "ד'", present: 78, absent: 22 },
  { day: "ה'", present: 90, absent: 10 },
]

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
            {entry.name === 'present' ? 'נוכחים' : 'נעדרים'}:{' '}
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
    <div className="flex gap-6 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FDE047' }}></div>
        <span className="text-slate-600 dark:text-slate-300 font-medium">נוכחים</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#BAE6FD' }}></div>
        <span className="text-slate-600 dark:text-slate-300 font-medium">נעדרים</span>
      </div>
    </div>
  )
}

interface AttendanceBarChartProps {
  attendanceData?: Array<{ day: string; present: number; absent: number }>
}

export function AttendanceBarChart({ attendanceData }: AttendanceBarChartProps) {
  const data = attendanceData && attendanceData.length > 0 ? attendanceData : MOCK_ATTENDANCE_DATA

  return (
    <div className="bg-white dark:bg-sidebar-dark p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
      {/* Title row */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">נוכחות</h3>
          <CustomLegend />
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <DotsThreeIcon size={24} weight="bold" />
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={192}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="present" fill="#FDE047" radius={[8, 8, 8, 8]} barSize={8} name="present" />
          <Bar dataKey="absent" fill="#BAE6FD" radius={[8, 8, 8, 8]} barSize={8} name="absent" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
