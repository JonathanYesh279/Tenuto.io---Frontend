/**
 * Simple Weekly Grid Component
 * 
 * A simple day-based grid that shows student activities without complex time slots
 * Focus on displaying lesson cards in a clean, scrollable format
 */

import React from 'react'
import { ClockIcon, MapPinIcon, MusicNotesIcon, UserIcon } from '@phosphor-icons/react'


interface CalendarLesson {
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

interface SimpleWeeklyGridProps {
  lessons: CalendarLesson[]
  className?: string
}

const SimpleWeeklyGrid: React.FC<SimpleWeeklyGridProps> = ({ lessons, className = '' }) => {
  // Hebrew day names
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']
  
  // Group lessons by day of week
  const lessonsByDay = lessons.reduce((acc, lesson) => {
    if (lesson.dayOfWeek >= 0 && lesson.dayOfWeek <= 5) { // Sunday (0) to Friday (5)
      if (!acc[lesson.dayOfWeek]) {
        acc[lesson.dayOfWeek] = []
      }
      acc[lesson.dayOfWeek].push(lesson)
    }
    return acc
  }, {} as Record<number, CalendarLesson[]>)

  // Sort lessons within each day by start time
  Object.keys(lessonsByDay).forEach(day => {
    lessonsByDay[parseInt(day)].sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number)
      const timeB = b.startTime.split(':').map(Number)
      const minutesA = timeA[0] * 60 + timeA[1]
      const minutesB = timeB[0] * 60 + timeB[1]
      return minutesA - minutesB
    })
  })

  // Get lesson type styling
  const getLessonTypeStyle = (type: string) => {
    switch (type) {
      case 'individual':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600'
      case 'group':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600'
      case 'orchestra':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-600'
      case 'theory':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-600'
    }
  }

  // Get lesson type in Hebrew
  const getLessonTypeHebrew = (type: string) => {
    switch (type) {
      case 'individual': return 'שיעור אישי'
      case 'group': return 'שיעור קבוצתי'
      case 'orchestra': return 'תזמורת'
      case 'theory': return 'תיאוריה'
      default: return 'שיעור'
    }
  }

  // Calculate duration
  const getDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    return endMinutes - startMinutes
  }

  return (
    <div className={`simple-weekly-grid ${className}`}>
      {/* Header - Compact */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">לוח זמנים שבועי</h3>
        <p className="text-xs text-gray-600">
          {lessons.length === 0
            ? 'אין שיעורים השבוע'
            : lessons.length === 1
            ? 'שיעור אחד השבוע'
            : `${lessons.length} שיעורים השבוע`
          }
        </p>
      </div>

      {/* Days Grid - More compact */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {dayNames.map((dayName, dayIndex) => {
          const dayLessons = lessonsByDay[dayIndex] || []

          return (
            <div key={dayIndex} className="day-column">
              {/* Day Header - Smaller */}
              <div className="day-header bg-gray-50 rounded-t-lg px-3 py-2 border-b">
                <h4 className="font-medium text-gray-900 text-center text-sm">{dayName}</h4>
                <p className="text-xs text-gray-500 text-center">
                  {dayLessons.length === 0
                    ? 'ריק'
                    : dayLessons.length === 1
                    ? '1'
                    : `${dayLessons.length}`
                  }
                </p>
              </div>

              {/* Day Content - More compact */}
              <div className="day-content bg-white rounded-b-lg border border-t-0 border-gray-200 min-h-24">
                {dayLessons.length === 0 ? (
                  // Empty day - Much smaller
                  <div className="p-3 text-center">
                    <div className="text-gray-300 mb-1">
                      <MusicNotesIcon className="w-5 h-5 mx-auto" />
                    </div>
                    <p className="text-gray-400 text-xs">אין</p>
                  </div>
                ) : (
                  // Day with lessons - Compact
                  <div className="p-2 space-y-2">
                    {dayLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`lesson-card rounded-md p-2 border shadow-sm hover:shadow-md transition-all duration-200 ${getLessonTypeStyle(lesson.lessonType)}`}
                      >
                        {/* Lesson Header - Compact */}
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-semibold text-sm truncate">{lesson.instrumentName}</h5>
                          <span className="text-xs bg-white bg-opacity-20 px-1 py-0.5 rounded">
                            {getLessonTypeHebrew(lesson.lessonType)}
                          </span>
                        </div>

                        {/* Time - Compact */}
                        <div className="flex items-center gap-1 mb-1">
                          <ClockIcon className="w-3 h-3" />
                          <span className="text-xs font-medium">
                            {lesson.startTime}-{lesson.endTime}
                          </span>
                          <span className="text-xs bg-white bg-opacity-20 px-1 rounded">
                            {getDuration(lesson.startTime, lesson.endTime)}ד'
                          </span>
                        </div>

                        {/* Teacher - Compact */}
                        <div className="flex items-center gap-1 mb-1">
                          <UserIcon className="w-3 h-3" />
                          <span className="text-xs truncate">{lesson.teacherName}</span>
                        </div>

                        {/* Location - Compact */}
                        {(lesson.roomNumber || lesson.location) && (
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" />
                            <span className="text-xs truncate">
                              {lesson.roomNumber ? `חדר ${lesson.roomNumber}` : lesson.location}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend - Compact */}
      <div className="legend bg-gray-50 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 mb-2 text-sm">מקרא</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
            <span className="text-xs text-gray-700">אישי</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
            <span className="text-xs text-gray-700">קבוצתי</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded"></div>
            <span className="text-xs text-gray-700">תזמורת</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded"></div>
            <span className="text-xs text-gray-700">תיאוריה</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleWeeklyGrid