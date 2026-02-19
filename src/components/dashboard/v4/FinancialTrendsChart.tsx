import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DotsThree as DotsThreeIcon } from '@phosphor-icons/react'

// TODO: Wire to /api/dashboard/financial-trends when backend endpoint available
const MOCK_FINANCIAL_DATA = [
  { month: "ינו'", income: 120000, expenses: 80000 },
  { month: "פבר'", income: 140000, expenses: 85000 },
  { month: "מרץ", income: 100000, expenses: 90000 },
  { month: "אפר'", income: 160000, expenses: 75000 },
  { month: "מאי", income: 130000, expenses: 95000 },
  { month: "יוני", income: 145000, expenses: 88000 },
  { month: "יולי", income: 155000, expenses: 82000 },
  { month: "אוג'", income: 170000, expenses: 100000 },
  { month: "ספט'", income: 180000, expenses: 92000 },
  { month: "אוק'", income: 165000, expenses: 88000 },
  { month: "נוב'", income: 175000, expenses: 95000 },
  { month: "דצמ'", income: 190000, expenses: 105000 },
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
            {entry.name}:{' '}
          </span>
          <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>
            ₪{entry.value.toLocaleString('he-IL')}
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
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#BAE6FD' }}></div>
        <span className="text-slate-600 dark:text-slate-300 font-medium">הכנסות</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C7D2FE' }}></div>
        <span className="text-slate-600 dark:text-slate-300 font-medium">הוצאות</span>
      </div>
    </div>
  )
}

export function FinancialTrendsChart() {
  return (
    <div className="bg-white dark:bg-sidebar-dark p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
      {/* Title row */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">מגמות פיננסיות</h3>
          <CustomLegend />
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <DotsThreeIcon size={24} weight="bold" />
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={256}>
        <LineChart data={MOCK_FINANCIAL_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
            dataKey="income"
            stroke="#BAE6FD"
            strokeWidth={3}
            dot={false}
            name="הכנסות"
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#C7D2FE"
            strokeWidth={3}
            dot={false}
            name="הוצאות"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
