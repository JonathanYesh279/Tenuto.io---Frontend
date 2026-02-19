import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { DotsThree as DotsThreeIcon, User as UserIcon } from '@phosphor-icons/react'

// TODO: Wire to real gender demographics from student data
const defaultData = { male: 47, female: 53 }

interface StudentDemographicsChartProps {
  genderStats?: { male: number; female: number }
  totalStudents?: number
  loading?: boolean
}

export function StudentDemographicsChart({
  genderStats = defaultData,
  totalStudents = 100,
  loading = false,
}: StudentDemographicsChartProps) {
  const maleCount = genderStats.male
  const femaleCount = genderStats.female
  const total = maleCount + femaleCount || 1 // Prevent divide by zero
  const malePercentage = Math.round((maleCount / total) * 100)
  const femalePercentage = Math.round((femaleCount / total) * 100)

  const chartData = [
    { name: 'בנים', value: maleCount },
    { name: 'בנות', value: femaleCount },
  ]

  const COLORS = ['#BAE6FD', '#FDE047'] // chart-blue for boys, chart-yellow for girls

  if (loading) {
    return (
      <div className="bg-white dark:bg-sidebar-dark p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[280px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">טוען נתונים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-sidebar-dark p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
      {/* Title row */}
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">תלמידים</h3>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <DotsThreeIcon size={24} weight="bold" />
        </button>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center">
        {/* Donut chart */}
        <div className="relative w-48 h-48 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center overlay with icons */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-2">
              <UserIcon size={24} weight="fill" className="text-sky-300" />
              <UserIcon size={24} weight="fill" className="text-amber-300" />
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-12 w-full px-4">
          {/* Boys */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#BAE6FD' }}></div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {maleCount}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              בנים ({malePercentage}%)
            </span>
          </div>

          {/* Girls */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FDE047' }}></div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {femaleCount}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              בנות ({femalePercentage}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
