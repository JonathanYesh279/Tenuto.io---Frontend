import React, { useState, useEffect } from 'react'
import { BookOpenIcon, CalendarIcon, CheckCircleIcon, ClockIcon, GraduationCapIcon, MusicNotesIcon, StarIcon, UserCircleCheckIcon, UserPlusIcon, UsersIcon, WarningIcon } from '@phosphor-icons/react'


interface ActivityItem {
  id: string
  type: 'student_added' | 'teacher_added' | 'lesson_scheduled' | 'rehearsal_scheduled' | 
        'test_completed' | 'attendance_recorded' | 'stage_completed' | 'achievement_earned' |
        'lesson_cancelled' | 'teacher_assigned'
  title: string
  description: string
  timestamp: Date
  relatedEntity: {
    id: string
    name: string
    type: 'student' | 'teacher' | 'lesson' | 'rehearsal' | 'orchestra'
  }
  priority: 'low' | 'medium' | 'high'
  metadata?: Record<string, any>
}

// Mock API for recent activities
const mockActivityAPI = {
  getRecentActivities: async (limit = 20): Promise<ActivityItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const activities: ActivityItem[] = [
      {
        id: '1',
        type: 'student_added',
        title: 'תלמיד חדש נרשם',
        description: 'יואב כהן נרשם לשיעורי פסנתר',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        relatedEntity: { id: 'student_1', name: 'יואב כהן', type: 'student' },
        priority: 'medium'
      },
      {
        id: '2',
        type: 'lesson_scheduled',
        title: 'שיעור תיאוריה נוסף',
        description: 'שיעור תיאוריה בסיסית ליום רביעי 14:00',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        relatedEntity: { id: 'lesson_1', name: 'תיאוריה בסיסית', type: 'lesson' },
        priority: 'low'
      },
      {
        id: '3',
        type: 'stage_completed',
        title: 'מעבר שלב',
        description: 'שרה לוי עברה בהצלחה לשלב 4 בכינור',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        relatedEntity: { id: 'student_2', name: 'שרה לוי', type: 'student' },
        priority: 'high',
        metadata: { stage: 4, instrument: 'כינור' }
      },
      {
        id: '4',
        type: 'teacher_added',
        title: 'מורה חדש התקבל',
        description: 'ד"ר מיכל רוזן התקבלה כמורה לחלילית',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        relatedEntity: { id: 'teacher_1', name: 'ד"ר מיכל רוזן', type: 'teacher' },
        priority: 'medium'
      },
      {
        id: '5',
        type: 'rehearsal_scheduled',
        title: 'חזרה נתוספה',
        description: 'חזרה כללית לתזמורת הנוער - יום חמישי 16:00',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        relatedEntity: { id: 'rehearsal_1', name: 'תזמורת הנוער', type: 'rehearsal' },
        priority: 'medium'
      },
      {
        id: '6',
        type: 'attendance_recorded',
        title: 'נוכחות נרשמה',
        description: 'נוכחות נרשמה ל-23 תלמידים בשיעורי התיאוריה',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        relatedEntity: { id: 'lesson_2', name: 'שיעורי תיאוריה', type: 'lesson' },
        priority: 'low'
      },
      {
        id: '7',
        type: 'achievement_earned',
        title: 'הישג חדש',
        description: 'דוד מזרחי זכה במקום ראשון בתחרות פסנתר מחוזית',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        relatedEntity: { id: 'student_3', name: 'דוד מזרחי', type: 'student' },
        priority: 'high',
        metadata: { achievement: 'מקום ראשון', competition: 'תחרות פסנתר מחוזית' }
      },
      {
        id: '8',
        type: 'lesson_cancelled',
        title: 'שיעור בוטל',
        description: 'שיעור פסנתר של אורי לוי בוטל עקב מחלת המורה',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        relatedEntity: { id: 'lesson_3', name: 'שיעור פסנתר', type: 'lesson' },
        priority: 'medium'
      }
    ]
    
    return activities.slice(0, limit)
  }
}

interface RecentActivityProps {
  className?: string
  showFilters?: boolean
  maxItems?: number
  refreshInterval?: number
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  className = '',
  showFilters = true,
  maxItems = 10,
  refreshInterval = 2 * 60 * 1000 // 2 minutes
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await mockActivityAPI.getRecentActivities(maxItems)
      setActivities(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError('שגיאה בטעינת פעילות אחרונה')
      console.error('Error fetching activities:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    
    const interval = setInterval(fetchActivities, refreshInterval)
    return () => clearInterval(interval)
  }, [maxItems, refreshInterval])

  const getPulseIcon = (type: string) => {
    const icons = {
      student_added: <UserPlusIcon className="w-5 h-5 text-green-500" />,
      teacher_added: <GraduationCapIcon className="w-5 h-5 text-blue-500" />,
      lesson_scheduled: <BookOpenIcon className="w-5 h-5 text-purple-500" />,
      rehearsal_scheduled: <CalendarIcon className="w-5 h-5 text-orange-500" />,
      test_completed: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
      attendance_recorded: <UserCircleCheckIcon className="w-5 h-5 text-blue-600" />,
      stage_completed: <StarIcon className="w-5 h-5 text-yellow-500" />,
      achievement_earned: <StarIcon className="w-5 h-5 text-yellow-600" />,
      lesson_cancelled: <WarningIcon className="w-5 h-5 text-red-500" />,
      teacher_assigned: <UsersIcon className="w-5 h-5 text-indigo-500" />
    }
    
    return icons[type as keyof typeof icons] || <ClockIcon className="w-5 h-5 text-gray-500" />
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'border-r-red-400 bg-red-50',
      medium: 'border-r-orange-400 bg-orange-50',
      low: 'border-r-blue-400 bg-blue-50'
    }
    
    return colors[priority as keyof typeof colors] || 'border-r-gray-400 bg-gray-50'
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'עכשיו'
    if (diffInMinutes < 60) return `לפני ${diffInMinutes} דקות`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `לפני ${diffInHours} שעות`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `לפני ${diffInDays} ימים`
  }

  const filterActivities = (activities: ActivityItem[]) => {
    if (filter === 'all') return activities
    
    const typeFilters = {
      students: ['student_added', 'stage_completed', 'achievement_earned'],
      teachers: ['teacher_added', 'teacher_assigned'],
      lessons: ['lesson_scheduled', 'lesson_cancelled', 'attendance_recorded'],
      rehearsals: ['rehearsal_scheduled'],
      achievements: ['stage_completed', 'achievement_earned', 'test_completed']
    }
    
    return activities.filter(activity => 
      typeFilters[filter as keyof typeof typeFilters]?.includes(activity.type)
    )
  }

  const filteredActivities = filterActivities(activities)

  if (loading && activities.length === 0) {
    return (
      <div className={`bg-white rounded border border-gray-200 p-6 ${className}`} dir="rtl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 space-x-reverse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`} dir="rtl">
        <div className="text-center">
          <WarningIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-red-700 font-reisinger-yonatan">{error}</div>
          <button
            onClick={fetchActivities}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline font-reisinger-yonatan"
          >
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded border border-gray-200 ${className}`} dir="rtl">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
            פעילות אחרונה
          </h3>
          <div className="flex items-center space-x-2 space-x-reverse">
            {lastUpdated && (
              <span className="text-xs text-gray-500 font-reisinger-yonatan">
                עודכן: {formatTimeAgo(lastUpdated)}
              </span>
            )}
            <button
              onClick={fetchActivities}
              className="text-sm text-primary hover:opacity-80 font-reisinger-yonatan"
              disabled={loading}
            >
              {loading ? 'מעדכן...' : 'רענן'}
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'הכל' },
              { key: 'students', label: 'תלמידים' },
              { key: 'teachers', label: 'מורים' },
              { key: 'lessons', label: 'שיעורים' },
              { key: 'rehearsals', label: 'חזרות' },
              { key: 'achievements', label: 'הישגים' }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-3 py-1 text-xs rounded-full transition-colors font-reisinger-yonatan ${
                  filter === filterOption.key
                    ? 'bg-muted text-foreground'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center">
            <MusicNotesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-reisinger-yonatan">
              {filter === 'all' ? 'אין פעילות אחרונה' : `אין פעילות אחרונה בקטגוריה ${
                filter === 'students' ? 'תלמידים' :
                filter === 'teachers' ? 'מורים' :
                filter === 'lessons' ? 'שיעורים' :
                filter === 'rehearsals' ? 'חזרות' :
                filter === 'achievements' ? 'הישגים' : filter
              }`}
            </p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`p-4 border-r-4 hover:bg-gray-50 transition-colors cursor-pointer ${getPriorityColor(activity.priority)}`}
              onClick={() => {
                // Handle click to navigate to related entity
                console.log('Navigate to:', activity.relatedEntity)
              }}
            >
              <div className="flex items-start space-x-3 space-x-reverse">
                <div className="flex-shrink-0 mt-1">
                  {getPulseIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 font-reisinger-yonatan">
                      {activity.title}
                    </h4>
                    <span className="text-xs text-gray-500 font-reisinger-yonatan">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 font-reisinger-yonatan mt-1">
                    {activity.description}
                  </p>
                  
                  {activity.metadata && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full font-reisinger-yonatan"
                        >
                          {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredActivities.length > 0 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={() => window.location.href = '/activity'}
            className="text-sm text-primary hover:text-primary font-reisinger-yonatan"
          >
            הצג את כל הפעילות
          </button>
        </div>
      )}
    </div>
  )
}

export default RecentActivity