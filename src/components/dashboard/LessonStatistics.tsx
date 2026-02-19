import React, { useState, useEffect } from 'react'

import StatCard, { ProgressStatCard } from './StatCard'
import { VALID_DAYS } from '../../utils/validationUtils'
import { BookOpenIcon, CalendarIcon, ClockIcon, TrendUpIcon, UsersIcon, WarningCircleIcon } from '@phosphor-icons/react'

// Mock API functions for lesson data
const mockLessonAPI = {
  getLessonStatistics: async () => {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      totalLessonsThisWeek: 127,
      totalLessonsThisMonth: 540,
      averageAttendanceRate: 89.2,
      cancelledLessonsThisWeek: 8,
      upcomingLessonsToday: 23,
      completedLessonsToday: 15,
      attendanceTrend: { value: 2.8, direction: 'up' as const, period: 'השבועיים האחרונים' },
      capacityUtilization: 76.5 // Percentage of available lesson slots used
    }
  },

  getWeeklySchedule: async () => {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const schedule: Record<string, { scheduled: number, attended: number, cancelled: number }> = {}
    
    VALID_DAYS.forEach(day => {
      const scheduled = Math.floor(Math.random() * 25) + 15
      const cancelled = Math.floor(Math.random() * 3)
      const attended = scheduled - cancelled - Math.floor(Math.random() * 2)
      
      schedule[day] = { scheduled, attended, cancelled }
    })
    
    return schedule
  },

  getLessonTypes: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      'שיעורים פרטיים': 89,
      'תיאוריה': 24,
      'הרכבים': 8,
      'מאסטר קלאס': 4,
      'סדנאות': 2
    }
  },

  getTimeSlotDistribution: async () => {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return {
      'בוקר (8:00-12:00)': 45,
      'צהריים (12:00-16:00)': 68,
      'אחר הצהריים (16:00-20:00)': 87
    }
  },

  getUpcomingTests: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return [
      { studentName: 'יואב כהן', instrument: 'פסנתר', stage: 4, date: '2024-01-25', type: 'מעבר שלב' },
      { studentName: 'שרה לוי', instrument: 'כינור', stage: 3, date: '2024-01-26', type: 'בחינת סוף תקופה' },
      { studentName: 'דוד רוזן', instrument: 'גיטרה', stage: 6, date: '2024-01-27', type: 'מעבר שלב' },
      { studentName: 'מיכל אברהם', instrument: 'חלילית', stage: 2, date: '2024-01-28', type: 'בחינת סוף תקופה' },
      { studentName: 'אורי מזרחי', instrument: 'צ\'לו', stage: 5, date: '2024-01-29', type: 'מעבר שלב' }
    ]
  }
}

interface LessonStatisticsProps {
  className?: string
  refreshInterval?: number
}

const LessonStatistics: React.FC<LessonStatisticsProps> = ({
  className = '',
  refreshInterval = 5 * 60 * 1000
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Statistics state
  const [lessonStats, setLessonStats] = useState<any>(null)
  const [weeklySchedule, setWeeklySchedule] = useState<any>({})
  const [lessonTypes, setLessonTypes] = useState<Record<string, number>>({})
  const [timeSlots, setTimeSlots] = useState<Record<string, number>>({})
  const [upcomingTests, setUpcomingTests] = useState<any[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [stats, schedule, types, slots, tests] = await Promise.all([
        mockLessonAPI.getLessonStatistics(),
        mockLessonAPI.getWeeklySchedule(),
        mockLessonAPI.getLessonTypes(),
        mockLessonAPI.getTimeSlotDistribution(),
        mockLessonAPI.getUpcomingTests()
      ])
      
      setLessonStats(stats)
      setWeeklySchedule(schedule)
      setLessonTypes(types)
      setTimeSlots(slots)
      setUpcomingTests(tests)
      setLastUpdated(new Date())
    } catch (err) {
      setError('שגיאה בטעינת נתוני שיעורים')
      console.error('Error fetching lesson statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  // Calculate busiest day
  const getBusiestDay = () => {
    if (!Object.keys(weeklySchedule).length) return { day: '', count: 0 }
    
    const sorted = Object.entries(weeklySchedule)
      .map(([day, data]: [string, any]) => ({ day, count: data.scheduled }))
      .sort((a, b) => b.count - a.count)
    
    return sorted[0] || { day: '', count: 0 }
  }

  // Calculate weekly attendance rate
  const getWeeklyAttendanceRate = () => {
    const totalScheduled = Object.values(weeklySchedule).reduce(
      (sum, data: any) => sum + data.scheduled, 0
    )
    const totalAttended = Object.values(weeklySchedule).reduce(
      (sum, data: any) => sum + data.attended, 0
    )
    
    return totalScheduled > 0 ? (totalAttended / totalScheduled) * 100 : 0
  }

  // Get most popular lesson type
  const getMostPopularLessonType = () => {
    const sorted = Object.entries(lessonTypes)
      .sort(([,a], [,b]) => b - a)
    
    return { type: sorted[0]?.[0] || '', count: sorted[0]?.[1] || 0 }
  }

  // Get busiest time slot
  const getBusiestTimeSlot = () => {
    const sorted = Object.entries(timeSlots)
      .sort(([,a], [,b]) => b - a)
    
    return { slot: sorted[0]?.[0] || '', count: sorted[0]?.[1] || 0 }
  }

  const busiestDay = getBusiestDay()
  const weeklyAttendance = getWeeklyAttendanceRate()
  const popularLessonType = getMostPopularLessonType()
  const busiestTimeSlot = getBusiestTimeSlot()

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Main Lesson Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* This Week's Lessons */}
        <StatCard
          title="שיעורים השבוע"
          value={lessonStats?.totalLessonsThisWeek || 0}
          subtitle={`היום: ${(lessonStats?.completedLessonsToday || 0) + (lessonStats?.upcomingLessonsToday || 0)}`}
          icon={<BookOpenIcon className="w-6 h-6" />}
          loading={loading}
          error={error}
          onClick={() => window.location.href = '/lessons'}
          actions={[
            { label: 'הצג מערכת שעות', onClick: () => window.location.href = '/schedule' },
            { label: 'תזמן שיעור חדש', onClick: () => window.location.href = '/lessons/new' }
          ]}
        />

        {/* Average Attendance */}
        <StatCard
          title="נוכחות ממוצעת"
          value={`${lessonStats?.averageAttendanceRate || 0}%`}
          subtitle="כל השיעורים"
          icon={<UsersIcon className="w-6 h-6" />}
          trend={lessonStats?.attendanceTrend}
          loading={loading}
          error={error}
        />

        {/* Upcoming Lessons Today */}
        <StatCard
          title="שיעורים היום"
          value={lessonStats?.upcomingLessonsToday || 0}
          subtitle={`הושלמו: ${lessonStats?.completedLessonsToday || 0}`}
          icon={<ClockIcon className="w-6 h-6" />}
          loading={loading}
          error={error}
        />

        {/* Capacity Utilization */}
        <StatCard
          title="ניצול קיבולת"
          value={`${lessonStats?.capacityUtilization || 0}%`}
          subtitle="מתוך זמני ההוראה הזמינים"
          icon={<TrendUpIcon className="w-6 h-6" />}
          loading={loading}
          error={error}
        />
      </div>

      {/* Weekly Schedule & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Schedule */}
        <StatCard
          title="מערכת השבוע"
          value={busiestDay.count}
          subtitle={`היום העמוס ביותר: ${busiestDay.day}`}
          loading={loading}
          error={error}
          chart={
            <div className="space-y-3">
              <div className="text-xs text-gray-600 font-reisinger-yonatan mb-3">שיעורים לפי ימים</div>
              {VALID_DAYS.map(day => {
                const dayData = weeklySchedule[day] || { scheduled: 0, attended: 0, cancelled: 0 }
                const maxScheduled = Math.max(...Object.values(weeklySchedule).map((d: any) => d.scheduled), 1)
                const scheduledPercentage = (dayData.scheduled / maxScheduled) * 100
                const attendanceRate = dayData.scheduled > 0 ? (dayData.attended / dayData.scheduled) * 100 : 0
                
                return (
                  <div key={day} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-reisinger-yonatan w-16">{day}</span>
                      <div className="flex items-center space-x-2 space-x-reverse text-xs">
                        <span className="text-green-600">{dayData.attended}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900">{dayData.scheduled}</span>
                        {dayData.cancelled > 0 && (
                          <span className="text-red-500">(-{dayData.cancelled})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1 space-x-reverse">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${scheduledPercentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-xs text-gray-600 font-reisinger-yonatan">
                        {Math.round(attendanceRate)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          }
          onClick={() => window.location.href = '/schedule'}
        />

        {/* Lesson Types Distribution */}
        <StatCard
          title="סוגי שיעורים"
          value={popularLessonType.count}
          subtitle={`הפופולרי ביותר: ${popularLessonType.type}`}
          loading={loading}
          error={error}
          chart={
            <div className="space-y-2">
              <div className="text-xs text-gray-600 font-reisinger-yonatan mb-3">התפלגות סוגי שיעורים</div>
              {Object.entries(lessonTypes)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count], index) => {
                  const total = Object.values(lessonTypes).reduce((sum, c) => sum + c, 0)
                  const percentage = total > 0 ? (count / total) * 100 : 0
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className="text-sm font-reisinger-yonatan w-20 truncate">{type}</span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-primary' :
                                index === 1 ? 'bg-blue-500' :
                                index === 2 ? 'bg-green-500' :
                                index === 3 ? 'bg-orange-500' :
                                'bg-purple-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                        {count}
                      </span>
                    </div>
                  )
                })}
            </div>
          }
          onClick={() => window.location.href = '/lessons?filter=type'}
        />
      </div>

      {/* Time Slots & Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Slot Distribution */}
        <StatCard
          title="זמני שיעורים"
          value={busiestTimeSlot.count}
          subtitle={`הזמן העמוס ביותר: ${busiestTimeSlot.slot.split(' ')[0]}`}
          loading={loading}
          error={error}
          chart={
            <div className="space-y-3">
              <div className="text-xs text-gray-600 font-reisinger-yonatan mb-3">חלוקה לפי שעות</div>
              {Object.entries(timeSlots)
                .sort(([,a], [,b]) => b - a)
                .map(([slot, count], index) => {
                  const maxCount = Math.max(...Object.values(timeSlots))
                  const percentage = (count / maxCount) * 100
                  
                  return (
                    <div key={slot} className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className="text-sm font-reisinger-yonatan w-24 truncate">{slot}</span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${
                                index === 0 ? 'bg-red-400' :
                                index === 1 ? 'bg-orange-400' :
                                'bg-green-400'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                        {count}
                      </span>
                    </div>
                  )
                })}
            </div>
          }
          onClick={() => window.location.href = '/schedule?view=timeslots'}
        />

        {/* Upcoming Tests */}
        <StatCard
          title="בחינות קרובות"
          value={upcomingTests.length}
          subtitle="השבוע הקרוב"
          icon={<CalendarIcon className="w-6 h-6" />}
          loading={loading}
          error={error}
          chart={
            <div className="space-y-2">
              <div className="text-xs text-gray-600 font-reisinger-yonatan mb-3">בחינות השבוע</div>
              {upcomingTests.slice(0, 4).map((test, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium font-reisinger-yonatan truncate">
                      {test.studentName}
                    </div>
                    <div className="text-xs text-gray-600 font-reisinger-yonatan">
                      {test.instrument} • שלב {test.stage} • {test.type}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 font-reisinger-yonatan mr-2">
                    {new Date(test.date).toLocaleDateString('he-IL', { 
                      month: 'numeric', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              ))}
              {upcomingTests.length > 4 && (
                <div className="text-xs text-gray-500 text-center font-reisinger-yonatan pt-2">
                  ועוד {upcomingTests.length - 4} בחינות...
                </div>
              )}
            </div>
          }
          onClick={() => window.location.href = '/tests'}
        />
      </div>

      {/* Attendance & Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressStatCard
          title="נוכחות שבועית"
          value={`${Math.round(weeklyAttendance)}%`}
          subtitle="מתוך השיעורים שתוזמנו"
          progress={weeklyAttendance}
          progressLabel="אחוז נוכחות השבוע"
          loading={loading}
          error={error}
        />

        <StatCard
          title="ביטולים השבוע"
          value={lessonStats?.cancelledLessonsThisWeek || 0}
          subtitle={`אחוז ביטולים: ${lessonStats?.totalLessonsThisWeek > 0 ? 
            Math.round((lessonStats.cancelledLessonsThisWeek / lessonStats.totalLessonsThisWeek) * 100) : 0}%`}
          icon={lessonStats?.cancelledLessonsThisWeek > 10 ? <WarningCircleIcon className="w-6 h-6 text-red-500" /> : <CalendarIcon className="w-6 h-6" />}
          loading={loading}
          error={error}
        />

        <ProgressStatCard
          title="ניצול קיבולת"
          value={`${lessonStats?.capacityUtilization || 0}%`}
          subtitle="שיעורים מתוך הזמן הזמין"
          progress={lessonStats?.capacityUtilization || 0}
          progressLabel="אחוז ניצול זמני הוראה"
          loading={loading}
          error={error}
        />
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-gray-500 text-center font-reisinger-yonatan">
          עודכן לאחרונה: {lastUpdated.toLocaleString('he-IL')}
        </div>
      )}
    </div>
  )
}

export default LessonStatistics