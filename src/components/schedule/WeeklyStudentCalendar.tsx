import React, { useState, useMemo } from 'react'
import { Clock, MapPin, User, Music, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Card } from '../ui/Card'

interface StudentLesson {
  id: string
  instrumentName: string
  teacherName: string
  startTime: string
  endTime: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  location?: string
  roomNumber?: string
  lessonType: 'individual' | 'group' | 'orchestra' | 'theory'
}

interface WeeklyStudentCalendarProps {
  lessons: StudentLesson[]
  studentName?: string
  showHeader?: boolean
  className?: string
}

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי']
const HEBREW_DAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳']
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
]

const WeeklyStudentCalendar: React.FC<WeeklyStudentCalendarProps> = ({ 
  lessons, 
  studentName,
  showHeader = true,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'simple'>('simple')
  const [currentTime] = useState(new Date())

  // Group lessons by day
  const lessonsByDay = useMemo(() => {
    const grouped: Record<number, StudentLesson[]> = {}
    lessons.forEach(lesson => {
      if (!grouped[lesson.dayOfWeek]) {
        grouped[lesson.dayOfWeek] = []
      }
      grouped[lesson.dayOfWeek].push(lesson)
    })
    
    // Sort lessons within each day by start time
    Object.keys(grouped).forEach(day => {
      grouped[parseInt(day)].sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
      )
    })
    
    return grouped
  }, [lessons])

  // Get lesson style based on type
  const getLessonStyle = (lessonType: string) => {
    switch (lessonType) {
      case 'individual':
        return 'bg-primary-100 border-primary-300 text-primary-800 shadow-primary-100'
      case 'group':
        return 'bg-success-100 border-success-300 text-success-800 shadow-success-100'
      case 'orchestra':
        return 'bg-purple-100 border-purple-300 text-purple-800 shadow-purple-100'
      case 'theory':
        return 'bg-orange-100 border-orange-300 text-orange-800 shadow-orange-100'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800 shadow-gray-100'
    }
  }

  // Check if current time is within school hours
  const isWithinSchoolHours = () => {
    const now = new Date()
    const hours = now.getHours()
    return hours >= 8 && hours <= 20
  }

  // Get current time indicator position
  const getCurrentTimePosition = () => {
    if (!isWithinSchoolHours()) return null
    
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    
    const startHour = 8
    const totalMinutes = (hours - startHour) * 60 + minutes
    const percentage = (totalMinutes / (12 * 60)) * 100 // 12 hours (8am-8pm)
    
    return Math.min(Math.max(percentage, 0), 100)
  }

  // Simple card view for sparse schedules
  const renderSimpleView = () => {
    const hasLessons = lessons.length > 0
    
    if (!hasLessons) {
      return (
        <Card className={`p-6 text-center ${className}`}>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">אין שיעורים השבוע</h3>
          <p className="text-sm text-gray-500">לוח הזמנים יוצג כאן לאחר קביעת שיעורים</p>
        </Card>
      )
    }

    return (
      <Card className={`p-6 ${className}`}>
        {showHeader && (
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">השיעורים השבועיים</h2>
            <p className="text-sm text-gray-600">
              {lessons.length === 1 ? 'שיעור אחד בשבוע' : `${lessons.length} שיעורים בשבוע`}
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          {lessons.map(lesson => {
            const dayName = HEBREW_DAYS[lesson.dayOfWeek]
            return (
              <div 
                key={lesson.id} 
                className={`rounded-xl p-5 border-2 transition-all hover:shadow-lg ${getLessonStyle(lesson.lessonType)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/60 rounded-lg">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{lesson.instrumentName}</h3>
                      <p className="text-sm opacity-75 font-medium">{dayName}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">{lesson.startTime}</div>
                    <div className="text-xs opacity-75">- {lesson.endTime}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{lesson.teacherName}</span>
                  </div>
                  {(lesson.roomNumber || lesson.location) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{lesson.roomNumber ? `חדר ${lesson.roomNumber}` : lesson.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {lessons.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setViewMode('week')}
              className="w-full px-4 py-2 text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
            >
              הצג לוח זמנים שבועי מלא
            </button>
          </div>
        )}
      </Card>
    )
  }

  // Full weekly calendar view
  const renderWeeklyView = () => {
    const currentTimePosition = getCurrentTimePosition()
    
    return (
      <Card className={`${className}`}>
        {showHeader && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">לוח זמנים שבועי</h2>
              <button
                onClick={() => setViewMode('simple')}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                תצוגה פשוטה
              </button>
            </div>
            {studentName && (
              <p className="text-sm text-gray-600 mt-1">{studentName}</p>
            )}
          </div>
        )}
        
        <div className="p-4">
          {/* Desktop View */}
          <div className="hidden md:block">
            <div className="grid grid-cols-6 gap-px bg-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Time Header */}
              <div className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
                זמן
              </div>
              {/* Day Headers */}
              {HEBREW_DAYS.map((day, index) => {
                const hasLessons = lessonsByDay[index]?.length > 0
                return (
                  <div 
                    key={day} 
                    className={`p-3 text-center text-sm font-medium ${
                      hasLessons 
                        ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-200' 
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{day}</div>
                    <div className="text-xs mt-1 opacity-75">
                      {hasLessons ? `${lessonsByDay[index].length} שיעור${lessonsByDay[index].length > 1 ? 'ים' : ''}` : 'ריק'}
                    </div>
                  </div>
                )
              })}
              
              {/* Time slots */}
              {TIME_SLOTS.map((timeSlot, timeIndex) => (
                <React.Fragment key={timeSlot}>
                  {/* Time column */}
                  <div className="bg-white p-2 text-xs text-gray-600 text-center border-b border-gray-100 relative">
                    {timeSlot}
                    {/* Current time indicator */}
                    {currentTimePosition !== null && isWithinSchoolHours() && (
                      <div 
                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                        style={{ 
                          top: `${currentTimePosition}%`,
                          display: timeIndex === Math.floor(currentTimePosition / (100 / TIME_SLOTS.length)) ? 'block' : 'none'
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Day columns */}
                  {HEBREW_DAYS.map((_, dayIndex) => {
                    const dayLessons = lessonsByDay[dayIndex] || []
                    const lessonAtTime = dayLessons.find(lesson => 
                      lesson.startTime <= timeSlot && lesson.endTime > timeSlot
                    )
                    const lessonStartsAtTime = dayLessons.find(lesson => 
                      lesson.startTime === timeSlot
                    )
                    
                    return (
                      <div 
                        key={`${dayIndex}-${timeSlot}`} 
                        className={`bg-white p-1 min-h-[2.5rem] border-b border-gray-100 relative ${
                          dayLessons.length > 0 ? 'border-l border-primary-100' : ''
                        } ${
                          lessonAtTime ? 'bg-gradient-to-r from-primary-50 to-primary-25' : ''
                        }`}
                      >
                        {lessonStartsAtTime && (
                          <div className={`
                            text-xs p-2 rounded border-2 font-medium
                            ${getLessonStyle(lessonStartsAtTime.lessonType)}
                          `}>
                            <div className="font-bold mb-1">{lessonStartsAtTime.instrumentName}</div>
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="w-3 h-3" />
                              {lessonStartsAtTime.startTime}-{lessonStartsAtTime.endTime}
                            </div>
                            <div className="text-xs opacity-75">{lessonStartsAtTime.teacherName}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
            
            {lessons.length === 0 && (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg mt-4">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">אין שיעורים השבוע</p>
                <p className="text-sm">לוח הזמנים יוצג כאן לאחר קביעת שיעורים</p>
              </div>
            )}
            
            {lessons.length > 0 && lessons.length === 1 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm text-center font-medium">
                  ⭐ שיעור אחד בשבוע - זמן מצוין להתמקדות ותרגול!
                </p>
              </div>
            )}
          </div>
          
          {/* Mobile View */}
          <div className="md:hidden">
            {lessons.length > 0 ? (
              <div className="space-y-3">
                {HEBREW_DAYS.map((day, dayIndex) => {
                  const dayLessons = lessonsByDay[dayIndex] || []
                  if (dayLessons.length === 0) return null
                  
                  return (
                    <div key={day} className="bg-gray-50 rounded-lg p-3">
                      <h3 className="font-semibold text-primary-700 mb-2 text-center">{day}</h3>
                      <div className="space-y-2">
                        {dayLessons.map(lesson => (
                          <div 
                            key={lesson.id}
                            className={`rounded-lg p-3 border-2 ${getLessonStyle(lesson.lessonType)}`}
                          >
                            <div className="font-bold text-sm mb-1">{lesson.instrumentName}</div>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.startTime} - {lesson.endTime}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {lesson.teacherName}
                              </div>
                              {(lesson.roomNumber || lesson.location) && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {lesson.roomNumber ? `חדר ${lesson.roomNumber}` : lesson.location}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>אין שיעורים השבוע</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return viewMode === 'simple' ? renderSimpleView() : renderWeeklyView()
}

export default WeeklyStudentCalendar