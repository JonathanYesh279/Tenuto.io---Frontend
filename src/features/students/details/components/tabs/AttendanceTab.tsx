/**
 * Attendance Tab Component
 * 
 * Displays attendance statistics and records for the student.
 */

import { useState, useMemo } from 'react'

import { StudentDetails } from '../../types'
import { useStudentAttendance } from '../../hooks'
import { Line, Doughnut } from 'react-chartjs-2'
import { CalendarIcon, ChartBarIcon, CheckCircleIcon, ClockIcon, DownloadSimpleIcon, LightningIcon, TargetIcon, TrendUpIcon, TrophyIcon, WarningIcon, XCircleIcon } from '@phosphor-icons/react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import toast from 'react-hot-toast'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface AttendanceTabProps {
  student: StudentDetails
  studentId: string
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ student, studentId }) => {
  const { attendanceRecords, attendanceStats, isLoading, error } = useStudentAttendance(studentId)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'group' | 'theory' | 'orchestra'>('all')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'year'>('30d')
  const [showExportModal, setShowExportModal] = useState(false)

  // Generate calendar heatmap data
  const heatmapData = useMemo(() => {
    if (!attendanceRecords) return []
    
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay()
    
    const monthData = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      monthData.push({ date: null, status: null, lessons: [] })
    }
    
    // Add data for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day)
      const dayRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate.toDateString() === date.toDateString()
      })
      
      if (dayRecords.length > 0) {
        const presentCount = dayRecords.filter(r => r.status === 'הגיע/ה').length
        const absentCount = dayRecords.filter(r => r.status === 'לא הגיע/ה').length
        const excusedCount = dayRecords.filter(r => r.status === 'נעדר בצידוק').length
        const lateCount = dayRecords.filter(r => r.status === 'איחור').length
        
        let status = 'neutral'
        if (presentCount === dayRecords.length) status = 'excellent'
        else if (presentCount > absentCount) status = 'good'
        else if (absentCount > 0) status = 'poor'
        
        monthData.push({
          date: day,
          status,
          lessons: dayRecords,
          stats: { present: presentCount, absent: absentCount, excused: excusedCount, late: lateCount }
        })
      } else {
        monthData.push({ date: day, status: 'neutral', lessons: [] })
      }
    }
    
    return monthData
  }, [attendanceRecords, selectedMonth, selectedYear])

  const getHeatmapColor = (status: string | null) => {
    switch (status) {
      case 'excellent': return 'bg-success-500 text-white'
      case 'good': return 'bg-success-300 text-success-900'
      case 'poor': return 'bg-red-300 text-red-900'
      case 'neutral': return 'bg-gray-100 text-gray-600'
      default: return 'bg-transparent'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendUpIcon className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">שגיאה בטעינת נתוני נוכחות</h3>
          <p className="text-gray-600 text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ComponentType<any>; 
    color: string;
    bgColor: string;
    change?: string;
  }> = ({ title, value, icon: Icon, color, bgColor, change }) => (
    <div className="bg-white rounded p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {change && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            change.includes('+') ? 'bg-success-100 text-success-800' : 'bg-red-100 text-red-800'
          }`}>
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  )

  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ]

  // Calculate attendance streaks
  const calculateStreaks = useMemo(() => {
    if (!attendanceRecords) return { current: 0, longest: 0 }
    
    const sortedRecords = [...attendanceRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    // Calculate current streak from most recent
    for (const record of sortedRecords) {
      if (record.status === 'הגיע/ה' || record.status === 'איחור') {
        currentStreak++
      } else {
        break
      }
    }
    
    // Calculate longest streak
    for (const record of sortedRecords) {
      if (record.status === 'הגיע/ה' || record.status === 'איחור') {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }
    
    return { current: currentStreak, longest: longestStreak }
  }, [attendanceRecords])

  // Absence reasons breakdown — computed from actual attendance record notes
  const absenceReasons = useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) return {}

    const reasons: Record<string, number> = {}
    attendanceRecords
      .filter((r: any) => r.status === 'לא הגיע/ה')
      .forEach((r: any) => {
        const reason = r.notes?.trim() || 'לא צוינה סיבה'
        reasons[reason] = (reasons[reason] || 0) + 1
      })

    return reasons
  }, [attendanceRecords])

  // Attendance trends data for chart — computed from real monthly attendance rates
  const trendsData = useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) return { labels: [], datasets: [] }

    const monthlyData: Record<string, { total: number; present: number }> = {}
    attendanceRecords.forEach((r: any) => {
      const d = new Date(r.date)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { total: 0, present: 0 }
      monthlyData[monthKey].total++
      if (r.status === 'הגיע/ה' || r.status === 'איחור') {
        monthlyData[monthKey].present++
      }
    })

    const sortedMonths = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b)).slice(-12)

    return {
      labels: sortedMonths.map(([key]) => {
        const [y, m] = key.split('-')
        return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('he-IL', { month: 'short', year: '2-digit' })
      }),
      datasets: [{
        label: 'אחוז נוכחות',
        data: sortedMonths.map(([, data]) =>
          data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
        ),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    }
  }, [attendanceRecords])

  // Absence reasons chart data
  const absenceChartData = useMemo(() => {
    const reasons = Object.entries(absenceReasons).filter(([, count]) => count > 0)
    if (reasons.length === 0) return null

    const chartColors = [
      '#ef4444', '#f97316', '#eab308', '#84cc16', '#6b7280',
      '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f43f5e'
    ]

    return {
      labels: reasons.map(([reason]) => reason),
      datasets: [
        {
          data: reasons.map(([, count]) => count),
          backgroundColor: reasons.map((_, i) => chartColors[i % chartColors.length]),
          borderWidth: 0
        }
      ]
    }
  }, [absenceReasons])

  // Export functionality
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      // Mock export functionality - would integrate with actual API
      toast.success(`מייצא דוח נוכחות בפורמט ${format.toUpperCase()}`)
      setShowExportModal(false)
    } catch (error) {
      toast.error('שגיאה בייצוא הדוח')
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">נוכחות</h2>
        <p className="text-gray-600 mt-1">מעקב נוכחות, סטטיסטיקות והתקדמות</p>
      </div>
      
      {/* Enhanced Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard
          title="שיעורים סה״כ"
          value={attendanceStats?.totalLessons?.toString() || attendanceStats?.overall?.totalLessons?.toString() || '0'}
          icon={CalendarIcon}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="נוכחות"
          value={attendanceStats?.attendedLessons?.toString() || attendanceStats?.overall?.totalAttended?.toString() || '0'}
          icon={CheckCircleIcon}
          color="text-success-600"
          bgColor="bg-success-100"
        />
        <StatCard
          title="אחוז נוכחות"
          value={`${Math.round(attendanceStats?.attendanceRate || attendanceStats?.overall?.attendanceRate || 0)}%`}
          icon={TrendUpIcon}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard 
          title="30 ימים אחרונים"
          value={`${Math.round(attendanceStats?.lastThirtyDays?.attendanceRate || 0)}%`}
          icon={ClockIcon}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <StatCard 
          title="רצף נוכחות"
          value={calculateStreaks.current.toString()}
          icon={LightningIcon}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
          change={`שיא מקסימלי: ${calculateStreaks.longest}`}
        />
        <StatCard 
          title="איחורים"
          value={attendanceRecords?.filter(r => r.status === 'איחור').length.toString() || '0'}
          icon={WarningIcon}
          color="text-red-600"
          bgColor="bg-red-100"
        />
      </div>

      {/* Export Actions */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <DownloadSimpleIcon className="w-4 h-4" />
          ייצא דוח
        </button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ייצא דוח נוכחות</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-xs">PDF</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">דוח PDF</div>
                  <div className="text-sm text-gray-500">לצפייה והדפסה</div>
                </div>
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-xs">XLS</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">קובץ Excel</div>
                  <div className="text-sm text-gray-500">לעיבוד נתונים</div>
                </div>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-xs">CSV</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">קובץ CSV</div>
                  <div className="text-sm text-gray-500">לייבוא למערכות אחרות</div>
                </div>
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Trends Chart */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">מתח נוכחות חודשי</h3>
        <div className="h-64">
          <Line data={trendsData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Absence Reasons Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">סיבות העדרות</h3>
          {absenceChartData ? (
            <div className="h-64">
              <Doughnut 
                data={absenceChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true
                      }
                    }
                  }
                }} 
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>אין נתונים על העדרות</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">סטטיסטיקות מתקדמות</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <TargetIcon className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">יעד נוכחות</span>
              </div>
              <span className="text-xl font-bold text-blue-600">90%</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <LightningIcon className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">רצף נוכחות נוכחי</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">{calculateStreaks.current}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <TrophyIcon className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">רצף נוכחות שיא</span>
              </div>
              <span className="text-xl font-bold text-green-600">{calculateStreaks.longest}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CalendarIcon Heatmap */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">לוח נוכחות חודשי</h3>
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Array.from({ length: new Date().getFullYear() - 2022 }, (_, i) => 2023 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CalendarIcon Grid */}
        <div className="mb-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {heatmapData.map((day, index) => (
              <div
                key={index}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all hover:scale-110 cursor-pointer ${
                  day.date ? getHeatmapColor(day.status) : 'bg-transparent'
                }`}
                title={day.date ? `${day.date} ${monthNames[selectedMonth]} - ${day.lessons.length} שיעורים` : ''}
              >
                {day.date || ''}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span className="text-gray-600">ללא שיעורים</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-300 rounded"></div>
            <span className="text-gray-600">נוכחות נמוכה</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success-300 rounded"></div>
            <span className="text-gray-600">נוכחות טובה</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success-500 rounded"></div>
            <span className="text-gray-600">נוכחות מלאה</span>
          </div>
        </div>
      </div>

      {/* Attendance by Lesson Type */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">נוכחות לפי סוג שיעור</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {attendanceStats?.byLessonType && Object.entries(attendanceStats.byLessonType).map(([type, stats]) => {
            const typeLabels = {
              individual: 'אישי',
              group: 'קבוצתי',
              theory: 'תיאוריה',
              orchestra: 'תזמורת'
            }
            
            const typeColors = {
              individual: 'from-primary-500 to-primary-600',
              group: 'from-success-500 to-success-600',
              theory: 'from-orange-500 to-orange-600',
              orchestra: 'from-purple-500 to-purple-600'
            }
            
            const percentage = stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0
            
            return (
              <div key={type} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${typeColors[type as keyof typeof typeColors] || 'from-gray-400 to-gray-500'}`}></div>
                  <h4 className="font-semibold text-gray-900">
                    {typeLabels[type as keyof typeof typeLabels] || type}
                  </h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">סה״כ שיעורים</span>
                    <span className="font-medium text-gray-900">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">נוכח</span>
                    <span className="font-medium text-gray-900">{stats.attended}</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">אחוז נוכחות</span>
                      <span className="font-bold text-gray-900">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${typeColors[type as keyof typeof typeColors] || 'from-gray-400 to-gray-500'} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Attendance Records */}
      {attendanceRecords && attendanceRecords.length > 0 ? (
        <div className="bg-white rounded shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">רשומות נוכחות אחרונות</h3>
              <span className="text-sm text-gray-500">{attendanceRecords.length} רשומות</span>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {attendanceRecords.slice(0, 20).map((record, index) => {
              const statusInfo: Record<string, { label: string; color: string; bgColor: string; icon: React.ComponentType<any> }> = {
                'הגיע/ה': { label: 'נוכח', color: 'text-success-700', bgColor: 'bg-success-100', icon: CheckCircleIcon },
                'לא הגיע/ה': { label: 'נעדר', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircleIcon },
                'נעדר בצידוק': { label: 'נעדר בצידוק', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: ClockIcon },
                'איחור': { label: 'איחור', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: ClockIcon }
              }
              const status = statusInfo[record.status] || statusInfo['הגיע/ה']
              const StatusIcon = status.icon
              
              return (
                <div key={index} className="px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${status.bgColor}`}>
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('he-IL', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {{
                            individual: 'שיעור אישי',
                            group: 'שיעור קבוצתי',
                            theory: 'שיעור תיאוריה',
                            orchestra: 'חזרת תזמורת'
                          }[record.lessonType] || record.lessonType}
                        </div>
                        {record.notes && (
                          <div className="text-sm text-gray-500 mt-1 italic">{record.notes}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 bg-white rounded shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendUpIcon className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">אין נתוני נוכחות</h3>
          <p className="text-sm text-gray-500">רשומות נוכחות יופיעו כאן לאחר תחילת השיעורים</p>
        </div>
      )}
    </div>
  )
}

export default AttendanceTab