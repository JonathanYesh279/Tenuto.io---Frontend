import React, { useState, useEffect } from 'react'
import { Users, TrendingUp, Award, Clock } from 'lucide-react'
import StatCard, { ProgressStatCard } from './StatCard'
import { VALID_CLASSES, VALID_INSTRUMENTS } from '../../utils/validationUtils'

// Mock API functions - in real app, these would call actual backend APIs
const mockStudentAPI = {
  getStudentStatistics: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      totalStudents: 156,
      activeStudents: 142,
      inactiveStudents: 14,
      newStudentsThisMonth: 8,
      graduatedThisYear: 23,
      averageAttendance: 87.5,
      attendanceTrend: { value: 3.2, direction: 'up' as const, period: 'החודש האחרון' }
    }
  },

  getClassDistribution: async () => {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Generate realistic class distribution
    const distribution: Record<string, number> = {}
    VALID_CLASSES.forEach(cls => {
      if (cls === 'אחר') {
        distribution[cls] = Math.floor(Math.random() * 5) + 2
      } else {
        distribution[cls] = Math.floor(Math.random() * 15) + 8
      }
    })
    
    return distribution
  },

  getInstrumentDistribution: async () => {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    // Generate realistic instrument popularity
    const distribution: Record<string, number> = {}
    const popularInstruments = ['פסנתר', 'גיטרה', 'כינור', 'צ\'לו', 'חלילית', 'סקסופון']
    
    VALID_INSTRUMENTS.forEach(instrument => {
      if (popularInstruments.includes(instrument)) {
        distribution[instrument] = Math.floor(Math.random() * 25) + 15
      } else {
        distribution[instrument] = Math.floor(Math.random() * 8) + 2
      }
    })
    
    return distribution
  },

  getStudentsByStage: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const stages: Record<number, number> = {}
    for (let i = 1; i <= 8; i++) {
      stages[i] = Math.floor(Math.random() * 25) + 10
    }
    
    return stages
  }
}

interface StudentStatisticsProps {
  className?: string
  refreshInterval?: number
}

const StudentStatistics: React.FC<StudentStatisticsProps> = ({
  className = '',
  refreshInterval = 5 * 60 * 1000 // 5 minutes
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Statistics state
  const [studentStats, setStudentStats] = useState<any>(null)
  const [classDistribution, setClassDistribution] = useState<Record<string, number>>({})
  const [instrumentDistribution, setInstrumentDistribution] = useState<Record<string, number>>({})
  const [stageDistribution, setStageDistribution] = useState<Record<number, number>>({})

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [stats, classes, instruments, stages] = await Promise.all([
        mockStudentAPI.getStudentStatistics(),
        mockStudentAPI.getClassDistribution(),
        mockStudentAPI.getInstrumentDistribution(),
        mockStudentAPI.getStudentsByStage()
      ])
      
      setStudentStats(stats)
      setClassDistribution(classes)
      setInstrumentDistribution(instruments)
      setStageDistribution(stages)
      setLastUpdated(new Date())
    } catch (err) {
      setError('שגיאה בטעינת נתוני תלמידים')
      console.error('Error fetching student statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  // Calculate most popular class
  const getMostPopularClass = () => {
    if (!Object.keys(classDistribution).length) return { name: '', count: 0 }
    
    const sorted = Object.entries(classDistribution)
      .sort(([,a], [,b]) => b - a)
    
    return { name: sorted[0]?.[0] || '', count: sorted[0]?.[1] || 0 }
  }

  // Calculate most popular instruments
  const getTopInstruments = (limit = 3) => {
    return Object.entries(instrumentDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }))
  }

  // Calculate stage distribution for progress
  const getStageProgress = () => {
    const totalStudents = Object.values(stageDistribution).reduce((sum, count) => sum + count, 0)
    const advancedStudents = (stageDistribution[6] || 0) + (stageDistribution[7] || 0) + (stageDistribution[8] || 0)
    
    return totalStudents > 0 ? (advancedStudents / totalStudents) * 100 : 0
  }

  const mostPopularClass = getMostPopularClass()
  const topInstruments = getTopInstruments()
  const advancedStageProgress = getStageProgress()

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Main Student Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <StatCard
          title="סך הכל תלמידים"
          value={studentStats?.totalStudents || 0}
          subtitle={`פעילים: ${studentStats?.activeStudents || 0}`}
          icon={<Users className="w-6 h-6" />}
          trend={
            studentStats?.newStudentsThisMonth > 0 ? {
              value: Math.round((studentStats.newStudentsThisMonth / studentStats.totalStudents) * 100),
              direction: 'up' as const,
              period: 'החודש'
            } : undefined
          }
          loading={loading}
          error={error}
          onClick={() => window.location.href = '/students'}
          actions={[
            { label: 'הצג כל התלמידים', onClick: () => window.location.href = '/students' },
            { label: 'הוסף תלמיד חדש', onClick: () => window.location.href = '/students/new' }
          ]}
        />

        {/* New Students This Month */}
        <StatCard
          title="תלמידים חדשים"
          value={studentStats?.newStudentsThisMonth || 0}
          subtitle="החודש"
          icon={<TrendingUp className="w-6 h-6" />}
          loading={loading}
          error={error}
        />

        {/* Graduated This Year */}
        <StatCard
          title="בוגרים השנה"
          value={studentStats?.graduatedThisYear || 0}
          subtitle="הושלמו כל השלבים"
          icon={<Award className="w-6 h-6" />}
          loading={loading}
          error={error}
        />

        {/* Average Attendance */}
        <StatCard
          title="נוכחות ממוצעת"
          value={`${studentStats?.averageAttendance || 0}%`}
          subtitle="כל התלמידים"
          icon={<Clock className="w-6 h-6" />}
          trend={studentStats?.attendanceTrend}
          loading={loading}
          error={error}
        />
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Distribution */}
        <StatCard
          title="תלמידים לפי כיתות"
          value={mostPopularClass.count}
          subtitle={`הכיתה הפופולרית ביותר: ${mostPopularClass.name}`}
          loading={loading}
          error={error}
          chart={
            <div className="space-y-2">
              <div className="text-xs text-gray-600 font-reisinger-yonatan mb-3">התפלגות לפי כיתות</div>
              {Object.entries(classDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([className, count]) => {
                  const percentage = studentStats?.totalStudents > 0 
                    ? (count / studentStats.totalStudents) * 100 
                    : 0
                  
                  return (
                    <div key={className} className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className="text-sm font-reisinger-yonatan w-8">{className}</span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full"
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
          onClick={() => window.location.href = '/students?filter=class'}
        />

        {/* Instrument Distribution */}
        <StatCard
          title="כלי נגינה פופולריים"
          value={topInstruments[0]?.count || 0}
          subtitle={`${topInstruments[0]?.name || 'לא זמין'}`}
          loading={loading}
          error={error}
          chart={
            <div className="space-y-2">
              <div className="text-xs text-gray-600 font-reisinger-yonatan mb-3">הכלים הפופולריים</div>
              {topInstruments.map((instrument, index) => {
                const maxCount = topInstruments[0]?.count || 1
                const percentage = (instrument.count / maxCount) * 100
                
                return (
                  <div key={instrument.name} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-sm font-reisinger-yonatan w-16 truncate">{instrument.name}</span>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              index === 0 ? 'bg-primary-500' :
                              index === 1 ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                      {instrument.count}
                    </span>
                  </div>
                )
              })}
            </div>
          }
          onClick={() => window.location.href = '/students?filter=instrument'}
        />

        {/* Stage Progress */}
        <ProgressStatCard
          title="תלמידים מתקדמים"
          value={`${Math.round(advancedStageProgress)}%`}
          subtitle="שלבים 6-8"
          progress={advancedStageProgress}
          progressLabel="אחוז תלמידים מתקדמים"
          loading={loading}
          error={error}
          chart={
            <div className="space-y-2 mt-4">
              <div className="text-xs text-gray-600 font-reisinger-yonatan mb-3">התפלגות לפי שלבים</div>
              {Object.entries(stageDistribution)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([stage, count]) => {
                  const totalStageStudents = Object.values(stageDistribution).reduce((sum, c) => sum + c, 0)
                  const percentage = totalStageStudents > 0 ? (count / totalStageStudents) * 100 : 0
                  
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className="text-sm font-reisinger-yonatan w-12">שלב {stage}</span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                Number(stage) <= 2 ? 'bg-red-400' :
                                Number(stage) <= 4 ? 'bg-orange-400' :
                                Number(stage) <= 6 ? 'bg-blue-400' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-700 font-reisinger-yonatan">
                        {count}
                      </span>
                    </div>
                  )
                })}
            </div>
          }
          onClick={() => window.location.href = '/students?filter=stage'}
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

export default StudentStatistics