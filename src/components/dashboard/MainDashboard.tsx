import React, { useState, useCallback } from 'react'
import { Music, TrendingUp, Users, Calendar, AlertTriangle, BarChart3 } from 'lucide-react'
import StudentStatistics from './StudentStatistics'
import TeacherStatistics from './TeacherStatistics'
import LessonStatistics from './LessonStatistics'
import RecentActivity from './RecentActivity'
import DashboardRefresh, { useDashboardRefresh } from './DashboardRefresh'
import { BarChart, DonutChart, LineChart, ProgressRingChart, GaugeChart } from '../charts/HebrewCharts'

interface DashboardTab {
  id: string
  label: string
  icon: React.ComponentType<any>
  component: React.ComponentType<any>
}

interface MainDashboardProps {
  className?: string
  defaultTab?: string
}

const MainDashboard: React.FC<MainDashboardProps> = ({
  className = '',
  defaultTab = 'overview'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Mock overview data
  const [overviewData, setOverviewData] = useState({
    totalStudents: 156,
    totalTeachers: 48,
    weeklyLessons: 127,
    attendanceRate: 89.2,
    capacityUtilization: 76.5,
    monthlyGrowth: 3.2
  })

  // Dashboard refresh functionality
  const refreshDashboard = useCallback(async () => {
    // In a real app, this would fetch fresh data from the backend
    setRefreshTrigger(prev => prev + 1)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock data update
    setOverviewData(prev => ({
      ...prev,
      totalStudents: prev.totalStudents + Math.floor(Math.random() * 3),
      attendanceRate: Math.max(80, Math.min(95, prev.attendanceRate + (Math.random() - 0.5) * 2)),
      capacityUtilization: Math.max(60, Math.min(90, prev.capacityUtilization + (Math.random() - 0.5) * 3))
    }))
  }, [])

  const { loading, lastUpdated, error, refresh } = useDashboardRefresh(refreshDashboard)

  // Dashboard tabs
  const tabs: DashboardTab[] = [
    {
      id: 'overview',
      label: 'סקירה כללית',
      icon: BarChart3,
      component: () => <OverviewDashboard data={overviewData} refreshTrigger={refreshTrigger} />
    },
    {
      id: 'students',
      label: 'תלמידים',
      icon: Users,
      component: () => <StudentStatistics key={refreshTrigger} />
    },
    {
      id: 'teachers',
      label: 'מורים',
      icon: TrendingUp,
      component: () => <TeacherStatistics key={refreshTrigger} />
    },
    {
      id: 'lessons',
      label: 'שיעורים',
      icon: Calendar,
      component: () => <LessonStatistics key={refreshTrigger} />
    }
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0]
  const ActiveComponent = activeTabData.component

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`} dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title */}
            <div className="flex items-center">
              <Music className="w-8 h-8 text-primary ml-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
                  לוח הבקרה
                </h1>
                <p className="text-sm text-gray-600 font-reisinger-yonatan">
                  ניהול הקונסרבטוריון
                </p>
              </div>
            </div>

            {/* Refresh Controls */}
            <DashboardRefresh
              onRefresh={refresh}
              autoRefreshInterval={5 * 60 * 1000} // 5 minutes
              lastUpdated={lastUpdated}
              loading={loading}
            />
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 space-x-reverse -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors font-reisinger-yonatan ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 ml-2" />
                    {tab.label}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 m-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 ml-2" />
            <span className="text-red-700 font-reisinger-yonatan">{error}</span>
            <button
              onClick={refresh}
              className="mr-4 text-red-600 hover:text-red-800 underline font-reisinger-yonatan"
            >
              נסה שוב
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActiveComponent />
      </div>
    </div>
  )
}

// Overview Dashboard Component
const OverviewDashboard: React.FC<{
  data: any
  refreshTrigger: number
}> = ({ data, refreshTrigger }) => {
  // Mock chart data
  const classDistribution = [
    { label: 'ח׳', value: 23, color: '#3B82F6' },
    { label: 'ט׳', value: 19, color: '#10B981' },
    { label: 'י׳', value: 17, color: '#F59E0B' },
    { label: 'יא', value: 15, color: '#EF4444' },
    { label: 'יב', value: 12, color: '#8B5CF6' }
  ]

  const instrumentDistribution = [
    { label: 'פסנתר', value: 35 },
    { label: 'כינור', value: 28 },
    { label: 'גיטרה', value: 22 },
    { label: 'צ\'לו', value: 18 },
    { label: 'חלילית', value: 15 }
  ]

  const weeklyTrend = [
    { label: 'א׳', value: 85 },
    { label: 'ב׳', value: 92 },
    { label: 'ג׳', value: 88 },
    { label: 'ד׳', value: 94 },
    { label: 'ה׳', value: 89 },
    { label: 'ו׳', value: 76 },
    { label: 'ש׳', value: 82 }
  ]

  return (
    <div className="space-y-8" key={refreshTrigger}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-reisinger-yonatan">סך הכל תלמידים</p>
              <p className="text-2xl font-bold text-gray-900 font-reisinger-yonatan">{data.totalStudents}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-reisinger-yonatan">סך הכל מורים</p>
              <p className="text-2xl font-bold text-gray-900 font-reisinger-yonatan">{data.totalTeachers}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-reisinger-yonatan">שיעורים השבוע</p>
              <p className="text-2xl font-bold text-gray-900 font-reisinger-yonatan">{data.weeklyLessons}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-reisinger-yonatan">נוכחות ממוצעת</p>
              <p className="text-2xl font-bold text-gray-900 font-reisinger-yonatan">{data.attendanceRate}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Class Distribution */}
        <div className="bg-white p-6 rounded border border-gray-200">
          <DonutChart
            data={classDistribution}
            title="התפלגות תלמידים לפי כיתות"
            centerText="תלמידים"
          />
        </div>

        {/* Instrument Popularity */}
        <div className="bg-white p-6 rounded border border-gray-200">
          <BarChart
            data={instrumentDistribution}
            title="כלי נגינה פופולריים"
            showValues={true}
          />
        </div>

        {/* Weekly Attendance Trend */}
        <div className="bg-white p-6 rounded border border-gray-200">
          <LineChart
            data={weeklyTrend}
            title="נוכחות שבועית"
            color="#10B981"
            trend="up"
            showDots={true}
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Attendance Rate */}
        <div className="bg-white p-6 rounded border border-gray-200">
          <ProgressRingChart
            value={data.attendanceRate}
            max={100}
            size={120}
            color="#10B981"
            label="נוכחות כללית"
            subtitle="אחוז נוכחות"
          />
        </div>

        {/* Capacity Utilization */}
        <div className="bg-white p-6 rounded border border-gray-200">
          <GaugeChart
            value={data.capacityUtilization}
            max={100}
            title="ניצול קיבולת"
            subtitle="שיעורים מתוך זמן זמין"
            thresholds={[
              { value: 60, color: '#EF4444', label: 'נמוך' },
              { value: 80, color: '#F59E0B', label: 'בינוני' },
              { value: 100, color: '#10B981', label: 'גבוה' }
            ]}
          />
        </div>

        {/* Growth Ring */}
        <div className="bg-white p-6 rounded border border-gray-200">
          <ProgressRingChart
            value={data.monthlyGrowth}
            max={10}
            size={120}
            color="#3B82F6"
            label="צמיחה חודשית"
            subtitle="אחוז גידול"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentActivity 
            key={refreshTrigger}
            maxItems={8}
            showFilters={true}
          />
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-reisinger-yonatan">
            פעולות מהירות
          </h3>
          <div className="space-y-3">
            <button className="w-full text-right p-3 bg-muted text-foreground rounded hover:bg-muted/80 transition-colors font-reisinger-yonatan">
              הוסף תלמיד חדש
            </button>
            <button className="w-full text-right p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-reisinger-yonatan">
              תזמן שיעור חדש
            </button>
            <button className="w-full text-right p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-reisinger-yonatan">
              רשום נוכחות
            </button>
            <button className="w-full text-right p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors font-reisinger-yonatan">
              צור דוח חדש
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainDashboard