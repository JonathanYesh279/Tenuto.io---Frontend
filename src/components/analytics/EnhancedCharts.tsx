/**
 * Enhanced Charts for Conservatory Analytics
 * Hebrew-optimized and accessible data visualization components
 */

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

// Hebrew-optimized chart colors
const CHART_COLORS = {
  primary: ['#4F46E5', '#6366F1', '#8B5CF6', '#A855F7', '#C084FC'],
  attendance: {
    present: '#10B981',
    absent: '#EF4444', 
    late: '#F59E0B'
  },
  instruments: {
    strings: '#3B82F6',
    woodwinds: '#10B981', 
    brass: '#F59E0B',
    percussion: '#EF4444',
    keyboard: '#8B5CF6',
    voice: '#EC4899'
  }
}

// Custom tooltip with Hebrew support
const HebrewTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg" dir="rtl">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{' '}
            <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Attendance overview chart
export const AttendanceChart: React.FC<{
  data: Array<{
    month: string
    present: number
    absent: number
    late: number
  }>
}> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">
        סיכום נוכחות חודשי
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip content={<HebrewTooltip />} />
          <Bar 
            dataKey="present" 
            name="נוכח" 
            fill={CHART_COLORS.attendance.present}
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="late" 
            name="איחור" 
            fill={CHART_COLORS.attendance.late}
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="absent" 
            name="נעדר" 
            fill={CHART_COLORS.attendance.absent}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.attendance.present }}></div>
          <span>נוכח</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.attendance.late }}></div>
          <span>איחור</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.attendance.absent }}></div>
          <span>נעדר</span>
        </div>
      </div>
    </div>
  )
}

// Instrument distribution pie chart
export const InstrumentDistributionChart: React.FC<{
  data: Array<{
    instrument: string
    count: number
    category: keyof typeof CHART_COLORS.instruments
  }>
}> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">
        התפלגות כלי נגינה
      </h3>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS.instruments[entry.category]}
                  />
                ))}
              </Pie>
              <Tooltip content={<HebrewTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend with percentages */}
        <div className="flex-1 space-y-3">
          {data.map((item, index) => {
            const percentage = Math.round((item.count / total) * 100)
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: CHART_COLORS.instruments[item.category] }}
                  ></div>
                  <span className="font-medium">{item.instrument}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {item.count} ({percentage}%)
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Student progress trend chart
export const ProgressTrendChart: React.FC<{
  data: Array<{
    month: string
    beginners: number
    elementary: number
    intermediate: number
    advanced: number
  }>
}> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">
        התפתחות רמות התלמידים
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip content={<HebrewTooltip />} />
          <Line 
            type="monotone" 
            dataKey="beginners" 
            name="מתחילים"
            stroke="#9CA3AF" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="elementary" 
            name="יסודי"
            stroke="#60A5FA" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="intermediate" 
            name="בינוני"
            stroke="#34D399" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="advanced" 
            name="מתקדם"
            stroke="#F59E0B" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#9CA3AF' }}></div>
          <span>מתחילים</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#60A5FA' }}></div>
          <span>יסודי</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#34D399' }}></div>
          <span>בינוני</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
          <span>מתקדם</span>
        </div>
      </div>
    </div>
  )
}

// Quick stats cards
export const QuickStatsCards: React.FC<{
  stats: {
    totalStudents: number
    activeTeachers: number
    scheduledLessons: number
    attendanceRate: number
  }
}> = ({ stats }) => {
  const cards = [
    {
      title: 'סה״כ תלמידים',
      value: stats.totalStudents,
      color: 'bg-blue-500',
      icon: '👥'
    },
    {
      title: 'מורים פעילים', 
      value: stats.activeTeachers,
      color: 'bg-green-500',
      icon: '🎭'
    },
    {
      title: 'שיעורים השבוע',
      value: stats.scheduledLessons,
      color: 'bg-purple-500',
      icon: '📅'
    },
    {
      title: 'אחוז נוכחות',
      value: `${stats.attendanceRate}%`,
      color: 'bg-orange-500',
      icon: '✅'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div 
          key={index}
          className="bg-white p-6 rounded border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${card.color} flex items-center justify-center text-white text-xl`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export const EnhancedCharts = {
  AttendanceChart,
  InstrumentDistributionChart,
  ProgressTrendChart,
  QuickStatsCards
}

export default EnhancedCharts