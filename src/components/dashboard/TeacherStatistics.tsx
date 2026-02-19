import React, { useState, useEffect } from 'react'
import { GraduationCap, Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import StatCard, { ProgressStatCard } from './StatCard'
import { VALID_INSTRUMENTS } from '../../utils/validationUtils'

// Mock API functions for teacher data
const mockTeacherAPI = {
  getTeacherStatistics: async () => {
    await new Promise(resolve => setTimeout(resolve, 900))
    
    return {
      totalTeachers: 48,
      activeTeachers: 44,
      inactiveTeachers: 4,
      newTeachersThisYear: 3,
      averageStudentsPerTeacher: 3.25,
      averageWorkloadHours: 28.5,
      teacherUtilization: 85.2, // Percentage of optimal workload
      workloadTrend: { value: -2.1, direction: 'down' as const, period: 'החודש האחרון' }
    }
  },

  getTeachersBySpecialization: async () => {
    await new Promise(resolve => setTimeout(resolve, 700))
    
    const specializations: Record<string, number> = {}
    
    // Popular instruments get more teachers
    const popularInstruments = ['פסנתר', 'גיטרה', 'כינור', 'צ\'לו', 'תיאוריה']
    
    VALID_INSTRUMENTS.forEach(instrument => {
      if (popularInstruments.includes(instrument)) {
        specializations[instrument] = Math.floor(Math.random() * 8) + 3
      } else {
        specializations[instrument] = Math.floor(Math.random() * 3) + 1
      }
    })
    
    // Add theory and conducting
    specializations['תיאוריה'] = 8
    specializations['ניצוח'] = 3
    specializations['חיבור'] = 2
    
    return specializations
  },

  getTeacherWorkload: async () => {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    return {
      underloaded: 8,  // <20 hours
      optimal: 28,     // 20-35 hours
      overloaded: 12   // >35 hours
    }
  },

  getTeacherEmploymentTypes: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      'משרה מלאה': 25,
      'משרה חלקית': 18,
      'עצמאי': 12,
      'מחליף': 5
    }
  },

  getTeacherCapabilities: async () => {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return {
      canTeachTheory: 35,
      canConduct: 8,
      canTeachEnsemble: 22,
      canTeachIndividual: 48
    }
  }
}

interface TeacherStatisticsProps {
  className?: string
  refreshInterval?: number
}

const TeacherStatistics: React.FC<TeacherStatisticsProps> = ({
  className = '',
  refreshInterval = 5 * 60 * 1000
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Statistics state
  const [teacherStats, setTeacherStats] = useState<any>(null)
  const [specializations, setSpecializations] = useState<Record<string, number>>({})
  const [workloadDistribution, setWorkloadDistribution] = useState<any>(null)
  const [employmentTypes, setEmploymentTypes] = useState<Record<string, number>>({})
  const [capabilities, setCapabilities] = useState<any>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [stats, specs, workload, employment, caps] = await Promise.all([
        mockTeacherAPI.getTeacherStatistics(),
        mockTeacherAPI.getTeachersBySpecialization(),
        mockTeacherAPI.getTeacherWorkload(),
        mockTeacherAPI.getTeacherEmploymentTypes(),
        mockTeacherAPI.getTeacherCapabilities()
      ])
      
      setTeacherStats(stats)
      setSpecializations(specs)
      setWorkloadDistribution(workload)
      setEmploymentTypes(employment)
      setCapabilities(caps)
      setLastUpdated(new Date())
    } catch (err) {
      setError('שגיאה בטעינת נתוני מורים')
      console.error('Error fetching teacher statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  // Calculate most needed specialization
  const getMostNeededSpecialization = () => {
    if (!Object.keys(specializations).length) return { name: '', count: 0 }
    
    const sorted = Object.entries(specializations)
      .sort(([,a], [,b]) => a - b) // Least teachers = most needed
    
    return { name: sorted[0]?.[0] || '', count: sorted[0]?.[1] || 0 }
  }

  // Calculate teacher utilization percentage
  const getUtilizationPercentage = () => {
    if (!workloadDistribution) return 0
    
    const total = workloadDistribution.underloaded + workloadDistribution.optimal + workloadDistribution.overloaded
    return total > 0 ? (workloadDistribution.optimal / total) * 100 : 0
  }

  // Get top specializations
  const getTopSpecializations = (limit = 4) => {
    return Object.entries(specializations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }))
  }

  const mostNeeded = getMostNeededSpecialization()
  const utilizationPercentage = getUtilizationPercentage()
  const topSpecs = getTopSpecializations()

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Main Teacher Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Teachers */}
        <StatCard
          title="סך הכל מורים"
          value={teacherStats?.totalTeachers || 0}
          subtitle={`פעילים: ${teacherStats?.activeTeachers || 0}`}
          icon={<GraduationCap className="w-6 h-6" />}
          loading={loading}
          error={error}
          onClick={() => window.location.href = '/teachers'}
          actions={[
            { label: 'הצג כל המורים', onClick: () => window.location.href = '/teachers' },
            { label: 'הוסף מורה חדש', onClick: () => window.location.href = '/teachers/new' }
          ]}
        />

        {/* Students per Teacher */}
        <StatCard
          title="עומס מורים"
          value={teacherStats?.averageStudentsPerTeacher || 0}
          subtitle="ממוצע תלמידים למורה"
          icon={<Users className="w-6 h-6" />}
          loading={loading}
          error={error}
        />

        {/* Average Workload */}
        <StatCard
          title="שעות עבודה"
          value={teacherStats?.averageWorkloadHours || 0}
          subtitle="ממוצע שעות שבועיות"
          icon={<Clock className="w-6 h-6" />}
          trend={teacherStats?.workloadTrend}
          loading={loading}
          error={error}
        />

        {/* Teacher Utilization */}
        <StatCard
          title="ניצול מורים"
          value={`${teacherStats?.teacherUtilization || 0}%`}
          subtitle="אחוז ניצול אופטימלי"
          icon={<TrendingUp className="w-6 h-6" />}
          loading={loading}
          error={error}
        />
      </div>

      {/* Detailed Teacher Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Specialization Distribution */}
        <StatCard
          title="התמחויות מורים"
          value={topSpecs[0]?.count || 0}
          subtitle={`הכי פופולרי: ${topSpecs[0]?.name || 'לא זמין'}`}
          loading={loading}
          error={error}
          chart={
            <div className="space-y-2">
              <div className="text-xs text-gray-600 font-reisinger-yonatan mb-3">מורים לפי התמחות</div>
              {topSpecs.map((spec, index) => {
                const maxCount = topSpecs[0]?.count || 1
                const percentage = (spec.count / maxCount) * 100
                
                return (
                  <div key={spec.name} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-sm font-reisinger-yonatan w-16 truncate">{spec.name}</span>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              index === 0 ? 'bg-primary' :
                              index === 1 ? 'bg-blue-500' :
                              index === 2 ? 'bg-green-500' :
                              'bg-orange-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                      {spec.count}
                    </span>
                  </div>
                )
              })}
            </div>
          }
          onClick={() => window.location.href = '/teachers?filter=specialization'}
        />

        {/* Workload Distribution */}
        <StatCard
          title="התפלגות עומס"
          value={workloadDistribution?.optimal || 0}
          subtitle="מורים בעומס אופטימלי"
          loading={loading}
          error={error}
          chart={
            workloadDistribution && (
              <div className="space-y-3">
                <div className="text-xs text-gray-600 font-reisinger-yonatan mb-3">חלוקת עומס עבודה</div>
                
                {/* Under-loaded */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-400 rounded-full ml-2"></div>
                    <span className="text-sm font-reisinger-yonatan">עומס נמוך</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                    {workloadDistribution.underloaded}
                  </span>
                </div>
                
                {/* Optimal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full ml-2"></div>
                    <span className="text-sm font-reisinger-yonatan">עומס אופטימלי</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                    {workloadDistribution.optimal}
                  </span>
                </div>
                
                {/* Over-loaded */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full ml-2"></div>
                    <span className="text-sm font-reisinger-yonatan">עומס גבוה</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                    {workloadDistribution.overloaded}
                  </span>
                </div>
                
                {/* Warning for overloaded teachers */}
                {workloadDistribution.overloaded > 0 && (
                  <div className="mt-3 p-2 bg-orange-50 rounded-lg flex items-center">
                    <AlertTriangle className="w-4 h-4 text-orange-500 ml-2" />
                    <span className="text-xs text-orange-700 font-reisinger-yonatan">
                      {workloadDistribution.overloaded} מורים בעומס יתר
                    </span>
                  </div>
                )}
              </div>
            )
          }
          onClick={() => window.location.href = '/teachers?filter=workload'}
        />

        {/* Employment Types */}
        <StatCard
          title="סוגי העסקה"
          value={Object.values(employmentTypes).reduce((sum, count) => sum + count, 0)}
          subtitle="סך הכל מורים"
          loading={loading}
          error={error}
          chart={
            <div className="space-y-2">
              <div className="text-xs text-gray-600 font-reisinger-yonatan mb-3">חלוקה לפי סוג העסקה</div>
              {Object.entries(employmentTypes)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count], index) => {
                  const total = Object.values(employmentTypes).reduce((sum, c) => sum + c, 0)
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
                                'bg-orange-500'
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
          onClick={() => window.location.href = '/teachers?filter=employment'}
        />
      </div>

      {/* Teacher Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="מלמדי תיאוריה"
          value={capabilities?.canTeachTheory || 0}
          subtitle={`מתוך ${teacherStats?.totalTeachers || 0} מורים`}
          loading={loading}
          error={error}
        />
        
        <StatCard
          title="מנצחים"
          value={capabilities?.canConduct || 0}
          subtitle="יכולת ניצוח"
          loading={loading}
          error={error}
        />
        
        <StatCard
          title="מלמדי הרכבים"
          value={capabilities?.canTeachEnsemble || 0}
          subtitle="הוראה קבוצתית"
          loading={loading}
          error={error}
        />
        
        <ProgressStatCard
          title="כיסוי יכולות"
          value={`${Math.round(utilizationPercentage)}%`}
          subtitle="מורים בעומס אופטימלי"
          progress={utilizationPercentage}
          progressLabel="אחוז ניצול מורים"
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

export default TeacherStatistics