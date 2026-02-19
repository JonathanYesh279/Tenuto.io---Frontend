/**
 * Teacher Weekly CalendarIcon Component
 * 
 * Displays a comprehensive weekly calendar showing all teacher activities:
 * - Individual lessons with students
 * - Orchestra conducting sessions
 * - Ensemble activities
 * Activities are displayed as cards within each day, sorted by time
 */

import React, { useState, useMemo } from 'react'

import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, isToday, isSameDay } from 'date-fns'
import { he } from 'date-fns/locale'
import { BookOpenIcon, CalendarIcon, CaretLeftIcon, CaretRightIcon, ClockIcon, MapPinIcon, MusicNotesIcon, PencilIcon, TrashIcon, UserIcon, UsersIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'

interface TimeBlock {
  _id: string
  day: string
  startTime: string
  endTime: string
  totalDuration: number
  location?: string
  notes?: string
  isActive: boolean
  assignedLessons: any[]
}

interface TeacherLesson {
  _id?: string
  studentId: string
  studentName?: string
  day: string
  startTime: string
  endTime: string
  duration: number
  location?: string
  instrumentName?: string
  lessonType: 'individual' | 'group'
  notes?: string
}

interface OrchestraActivity {
  _id: string
  name: string
  day: string
  startTime: string
  endTime: string
  location?: string
  participants?: number
  type: 'orchestra' | 'ensemble'
}

interface TeacherWeeklyCalendarProps {
  teacher: any
  timeBlocks?: TimeBlock[]
  lessons?: TeacherLesson[]
  orchestraActivities?: OrchestraActivity[]
  className?: string
  showNavigation?: boolean
  onLessonUpdate?: (lesson: TeacherLesson) => void
  onLessonDelete?: (lesson: TeacherLesson) => void
}

// Hebrew day names mapping
const HEBREW_DAYS_MAP: { [key: string]: number } = {
  'ראשון': 0, // Sunday
  'שני': 1,   // Monday  
  'שלישי': 2, // Tuesday
  'רביעי': 3, // Wednesday
  'חמישי': 4, // Thursday
  'שישי': 5,  // Friday
  'שבת': 6    // Saturday
}

const ENGLISH_TO_HEBREW_DAYS = [
  'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
]

const TeacherWeeklyCalendar: React.FC<TeacherWeeklyCalendarProps> = ({
  teacher,
  timeBlocks = [],
  lessons = [],
  orchestraActivities = [],
  className = '',
  showNavigation = true,
  onLessonUpdate,
  onLessonDelete
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Calculate week boundaries
  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 0 }), [currentWeek])
  const weekEnd = useMemo(() => endOfWeek(currentWeek, { weekStartsOn: 0 }), [currentWeek])
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd])

  // Convert Hebrew day names to actual dates for current week
  const convertHebrewDayToDate = (hebrewDay: string): Date | null => {
    const dayIndex = HEBREW_DAYS_MAP[hebrewDay]
    if (dayIndex === undefined) return null
    return addDays(weekStart, dayIndex)
  }

  // Process and combine all activities for the week (excluding time blocks)
  const weeklyActivities = useMemo(() => {
    const activities: Array<{
      id: string
      date: Date
      startTime: string
      endTime: string
      title: string
      subtitle?: string
      type: 'lesson' | 'orchestra' | 'ensemble'
      location?: string
      participants?: string[]
      color: string
      details?: any
      studentName?: string
      instrumentName?: string
    }> = []

    // Note: timeBlocks (יום לימוד) are no longer displayed in the calendar
    // They are shown as a separate card preview section below the calendar
    // Only actual activities (lessons with students, orchestras) appear in the calendar

    // Process lessons from lessons prop (primary source)
    lessons.forEach((lesson: any, index: number) => {
      const date = convertHebrewDayToDate(lesson.day)
      if (!date) return
      
      // Handle different data structures - check multiple possible field names
      const startTime = lesson.startTime || lesson.time || lesson.scheduleInfo?.startTime
      const duration = lesson.duration || lesson.scheduleInfo?.duration || 45
      const endTime = lesson.endTime || lesson.scheduleInfo?.endTime || calculateEndTime(startTime, duration)
      
      // Validate required fields
      if (!startTime) {
        console.warn('Lesson missing time data:', lesson)
        return
      }

      activities.push({
        id: `lesson-${lesson._id || index}`,
        date,
        startTime: startTime,
        endTime: endTime,
        title: lesson.lessonType === 'group' ? 'שיעור קבוצתי' : 'שיעור פרטי',
        subtitle: lesson.studentName || 'תלמיד',
        studentName: lesson.studentName,
        instrumentName: lesson.instrumentName || lesson.instrument?.instrumentName,
        type: 'lesson',
        location: lesson.location || lesson.scheduleInfo?.location,
        color: lesson.lessonType === 'group' 
          ? 'bg-green-100 border-green-300 text-green-800'
          : 'bg-blue-100 border-blue-300 text-blue-800',
        details: lesson
      })
    })
    

    // Time blocks are availability windows — only show actual lessons with confirmed students in the calendar

    // Process orchestra activities
    orchestraActivities.forEach(activity => {
      const date = convertHebrewDayToDate(activity.day)
      if (!date) return
      
      // Validate required fields
      if (!activity.startTime || !activity.endTime) {
        console.warn('Orchestra activity missing time data:', activity)
        return
      }

      activities.push({
        id: `orchestra-${activity._id}`,
        date,
        startTime: activity.startTime,
        endTime: activity.endTime,
        title: activity.name,
        subtitle: activity.type === 'orchestra' ? 'תזמורת' : 'אנסמבל',
        type: activity.type as 'orchestra' | 'ensemble',
        location: activity.location,
        participants: [`${activity.participants || 0} נגנים`],
        color: activity.type === 'orchestra' 
          ? 'bg-purple-100 border-purple-300 text-purple-800'
          : 'bg-green-100 border-green-300 text-green-800',
        details: activity
      })
    })

    // Sort activities by date and time
    return activities.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime()
      if (dateCompare !== 0) return dateCompare
      // Handle missing startTime gracefully
      const aTime = a.startTime || '00:00'
      const bTime = b.startTime || '00:00'
      return aTime.localeCompare(bTime)
    })
  }, [timeBlocks, lessons, orchestraActivities, teacher, weekStart])

  // Group activities by day
  const activitiesByDay = useMemo(() => {
    const grouped: { [key: string]: typeof weeklyActivities } = {}
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd')
      grouped[dayKey] = weeklyActivities.filter(activity => 
        isSameDay(activity.date, day)
      )
    })
    return grouped
  }, [weeklyActivities, weekDays])

  // Navigation functions
  const goToPreviousWeek = () => setCurrentWeek(prev => subDays(prev, 7))
  const goToNextWeek = () => setCurrentWeek(prev => addDays(prev, 7))
  const goToCurrentWeek = () => setCurrentWeek(new Date())

  // Get icon for activity type
  const getPulseIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <UserIcon className="w-4 h-4" />
      case 'orchestra':
        return <MusicNotesIcon className="w-4 h-4" />
      case 'ensemble':
        return <UsersIcon className="w-4 h-4" />
      default:
        return <BookOpenIcon className="w-4 h-4" />
    }
  }

  // Handle lesson click for editing
  const handleLessonClick = (activity: any) => {
    if (activity.type === 'lesson' && activity.details) {
      console.log('🎯 Opening lesson for editing:', activity.details)
      console.log('🆔 Activity ID:', activity.id)
      console.log('📋 Full activity object:', activity)
      setEditingLesson(activity.details)
    }
  }

  // Update lesson data
  const handleLessonUpdate = async (updatedLessonData: any) => {
    if (!editingLesson) return

    setIsUpdating(true)
    try {
      // Call the parent component's update handler if provided
      if (onLessonUpdate) {
        await onLessonUpdate({ ...editingLesson, ...updatedLessonData })
      }
      setEditingLesson(null)
    } catch (error) {
      console.error('Error updating lesson:', error)
      alert('שגיאה בעדכון השיעור. אנא נסה שוב.')
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete lesson
  const handleLessonDelete = async () => {
    if (!editingLesson) return

    setIsDeleting(true)
    try {
      if (onLessonDelete) {
        await onLessonDelete(editingLesson)
      }
      setEditingLesson(null)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('שגיאה במחיקת השיעור. אנא נסה שוב.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Calculate duration from start and end time
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    return endMinutes - startMinutes
  }

  // Calculate end time from start time and duration
  const calculateEndTime = (startTime: string, duration: number): string => {
    if (!startTime || !duration) return startTime || '00:00'
    
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMins = totalMinutes % 60
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header with Navigation */}
      {showNavigation && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CaretRightIcon className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  לוח זמנים - {format(weekStart, 'dd/MM', { locale: he })} - {format(weekEnd, 'dd/MM/yyyy', { locale: he })}
                </h2>
                <p className="text-sm text-gray-600">
                  {weeklyActivities.length} פעילויות השבוע
                </p>
              </div>
              
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CaretLeftIcon className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary transition-colors"
            >
              השבוע הנוכחי
            </button>
          </div>
        </div>
      )}

      {/* CalendarIcon Grid - Days Only */}
      <div className="p-4">
        {/* Desktop View */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-7 gap-3">
            {/* Day Columns */}
            {weekDays.map((day, index) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayActivities = activitiesByDay[dayKey] || []
              const isCurrentDay = isToday(day)
              
              return (
                <div 
                  key={dayKey}
                  className={`border rounded-lg ${
                    isCurrentDay 
                      ? 'border-border bg-muted/50/30' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Day Header */}
                  <div className={`p-3 text-center border-b ${
                    isCurrentDay
                      ? 'bg-muted text-primary border-border'
                      : dayActivities.length > 0
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    <div className="font-semibold">{ENGLISH_TO_HEBREW_DAYS[index]}</div>
                    <div className="text-sm mt-1">
                      {format(day, 'dd/MM')}
                    </div>
                    {dayActivities.length > 0 && (
                      <div className="text-xs mt-1 opacity-75">
                        {dayActivities.length} פעילויות
                      </div>
                    )}
                  </div>

                  {/* Activities for the Day */}
                  <div className="p-2 space-y-2 min-h-[400px]">
                    {dayActivities.length === 0 ? (
                      <div className="text-center text-sm text-gray-400 mt-8">
                        אין פעילויות
                      </div>
                    ) : (
                      dayActivities.map(activity => (
                        <div 
                          key={activity.id}
                          className={`p-3 rounded-lg border-l-4 ${activity.color} shadow-sm hover:shadow-md transition-shadow ${
                            activity.type === 'lesson' ? 'cursor-pointer' : 'cursor-default'
                          }`}
                          onClick={() => activity.type === 'lesson' && handleLessonClick(activity)}
                        >
                          {/* Activity Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getPulseIcon(activity.type)}
                              <span className="font-semibold text-sm">
                                {activity.title}
                              </span>
                            </div>
                            {activity.type === 'lesson' && (
                              <PencilIcon className="w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors" />
                            )}
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-1 text-xs mb-1">
                            <ClockIcon className="w-3 h-3" />
                            <span className="font-medium">
                              {activity.startTime} - {activity.endTime}
                            </span>
                          </div>

                          {/* Student/Subtitle */}
                          {activity.subtitle && (
                            <div className="text-xs opacity-90 mb-1">
                              {activity.type === 'lesson' && activity.studentName && (
                                <div className="font-medium">תלמיד: {activity.studentName}</div>
                              )}
                              {activity.type !== 'lesson' && (
                                <div>{activity.subtitle}</div>
                              )}
                            </div>
                          )}

                          {/* Instrument for lessons */}
                          {activity.type === 'lesson' && activity.instrumentName && (
                            <div className="text-xs opacity-75 mb-1">
                              כלי: {activity.instrumentName}
                            </div>
                          )}

                          {/* Location */}
                          {activity.location && (
                            <div className="flex items-center gap-1 text-xs opacity-75">
                              <MapPinIcon className="w-3 h-3" />
                              <span>{activity.location}</span>
                            </div>
                          )}

                          {/* Participants for orchestras/ensembles */}
                          {activity.participants && (
                            <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
                              <UsersIcon className="w-3 h-3" />
                              <span>{activity.participants.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile/Tablet View with enhanced touch interactions */}
        <div className="lg:hidden">
          <div className="space-y-4 pb-safe">
            {weekDays.map((day, dayIndex) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayActivities = activitiesByDay[dayKey] || []
              const isCurrentDay = isToday(day)
              
              return (
                <div key={dayKey} className={`border rounded-lg overflow-hidden ${
                  isCurrentDay ? 'border-border' : 'border-gray-200'
                }`}>
                  <div className={`p-3 font-semibold ${
                    isCurrentDay
                      ? 'bg-muted text-primary'
                      : dayActivities.length > 0
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span>{ENGLISH_TO_HEBREW_DAYS[dayIndex]} - {format(day, 'dd/MM')}</span>
                      {dayActivities.length > 0 && (
                        <span className="text-sm opacity-75">{dayActivities.length} פעילויות</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    {dayActivities.length === 0 ? (
                      <div className="text-center text-sm text-gray-400 py-4">
                        אין פעילויות
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayActivities.map(activity => (
                          <div 
                            key={activity.id} 
                            className={`p-3 rounded-lg border-l-4 ${activity.color} ${
                              activity.type === 'lesson' 
                                ? 'cursor-pointer active:bg-opacity-80 touch-manipulation select-none' 
                                : 'cursor-default'
                            } transition-all duration-200`}
                            onClick={() => activity.type === 'lesson' && handleLessonClick(activity)}
                            onTouchStart={(e) => {
                              if (activity.type === 'lesson') {
                                e.currentTarget.style.transform = 'scale(0.98)'
                              }
                            }}
                            onTouchEnd={(e) => {
                              if (activity.type === 'lesson') {
                                e.currentTarget.style.transform = 'scale(1)'
                              }
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getPulseIcon(activity.type)}
                                <h4 className="font-semibold text-sm">{activity.title}</h4>
                              </div>
                              {activity.type === 'lesson' && (
                                <PencilIcon className="w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors" />
                              )}
                            </div>
                            
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                <span className="font-medium">{activity.startTime} - {activity.endTime}</span>
                              </div>
                              
                              {activity.type === 'lesson' && activity.studentName && (
                                <div className="font-medium">תלמיד: {activity.studentName}</div>
                              )}
                              
                              {activity.instrumentName && (
                                <div className="opacity-75">כלי: {activity.instrumentName}</div>
                              )}
                              
                              {activity.location && (
                                <div className="flex items-center gap-1">
                                  <MapPinIcon className="w-3 h-3" />
                                  <span>{activity.location}</span>
                                </div>
                              )}
                              
                              {activity.participants && (
                                <div className="flex items-center gap-1">
                                  <UsersIcon className="w-3 h-3" />
                                  <span>{activity.participants.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Week Summary */}
        {weeklyActivities.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">סיכום השבוע</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {weeklyActivities.filter(a => a.type === 'lesson').length}
                </div>
                <div className="text-sm text-gray-600">שיעורים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {weeklyActivities.filter(a => a.type === 'orchestra').length}
                </div>
                <div className="text-sm text-gray-600">תזמורות</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {weeklyActivities.filter(a => a.type === 'ensemble').length}
                </div>
                <div className="text-sm text-gray-600">אנסמבלים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {weekDays.filter(day => {
                    const dayKey = format(day, 'yyyy-MM-dd')
                    return (activitiesByDay[dayKey] || []).length > 0
                  }).length}
                </div>
                <div className="text-sm text-gray-600">ימים פעילים</div>
              </div>
            </div>
          </div>
        )}

        {/* Teaching Time Blocks Preview - יום לימוד */}
        {timeBlocks.length > 0 && (
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">ימי לימוד - זמינות למערכת</h3>
              <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
                {timeBlocks.length} בלוקי זמן
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeBlocks.map(block => (
                <div key={block._id} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-gray-900 text-lg">{block.day}</span>
                        {block.isActive && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            פעיל
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-700 mb-2">
                        <ClockIcon className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">
                          {block.startTime} - {block.endTime}
                        </span>
                      </div>
                      
                      {block.location && (
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <MapPinIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{block.location}</span>
                        </div>
                      )}
                      
                      {block.notes && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md mt-2">
                          {block.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center ml-3">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.floor(block.totalDuration / 60)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">שעות</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {block.totalDuration % 60 !== 0 && `+${block.totalDuration % 60}ד'`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {block.assignedLessons?.length || 0} שיעורים מתוכננים
                      </span>
                      <span className="text-blue-600 font-medium">
                        זמין למערכת
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>הסבר:</strong> ימי הלימוד מציגים את הזמנים בהם המורה זמין ללמד. 
                רק שיעורים בפועל עם תלמידים ופעילויות הניצוח מוצגים בלוח הזמנים למעלה.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Editing Modal */}
      {editingLesson && !showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                עריכת שיעור פרטי
              </h3>
              <button
                onClick={() => setEditingLesson(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()

                const form = e.target as HTMLFormElement
                const formData = new FormData(form)
                const day = formData.get('day') as string
                const startTime = formData.get('startTime') as string
                const endTime = formData.get('endTime') as string

                if (!day || !startTime || !endTime) {
                  alert('אנא מלא את כל השדות הנדרשים')
                  return
                }

                // Calculate duration
                const duration = calculateDuration(startTime, endTime)

                if (duration <= 0) {
                  alert('זמן הסיום חייב להיות לאחר זמן ההתחלה')
                  return
                }

                await handleLessonUpdate({
                  day,
                  startTime,
                  endTime,
                  duration
                })
              }}
            >
              {/* Day Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  יום השבוע
                </label>
                <select
                  name="day"
                  defaultValue={editingLesson.day}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                >
                  <option value="">בחר יום</option>
                  <option value="ראשון">ראשון</option>
                  <option value="שני">שני</option>
                  <option value="שלישי">שלישי</option>
                  <option value="רביעי">רביעי</option>
                  <option value="חמישי">חמישי</option>
                  <option value="שישי">שישי</option>
                  <option value="שבת">שבת</option>
                </select>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    זמן התחלה
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    defaultValue={editingLesson.startTime || editingLesson.time}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    זמן סיום
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    defaultValue={editingLesson.endTime || calculateEndTime(
                      editingLesson.startTime || editingLesson.time || '00:00',
                      editingLesson.duration || 45
                    )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Student Information (Read-only) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">פרטי השיעור</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><strong>תלמיד:</strong> {editingLesson.studentName || 'לא צוין'}</div>
                  {editingLesson.instrumentName && (
                    <div><strong>כלי נגינה:</strong> {editingLesson.instrumentName}</div>
                  )}
                  {editingLesson.location && (
                    <div><strong>מיקום:</strong> {editingLesson.location}</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors font-medium disabled:opacity-50"
                >
                  {isUpdating ? 'שומר...' : 'שמור שינויים'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  ביטול
                </button>
              </div>

              {/* Delete Button */}
              {onLessonDelete && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
                  >
                    <TrashIcon className="w-4 h-4" />
                    מחק שיעור
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && editingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <WarningCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              מחיקת שיעור
            </h3>
            <p className="text-gray-600 text-center mb-2">
              האם אתה בטוח שברצונך למחוק את השיעור של
            </p>
            <p className="text-lg font-semibold text-gray-900 text-center mb-4">
              {editingLesson.studentName || 'תלמיד'}?
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              יום {editingLesson.day} בשעה {editingLesson.startTime || editingLesson.time}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                ביטול
              </button>
              <button
                onClick={handleLessonDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {isDeleting ? 'מוחק...' : 'מחק'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherWeeklyCalendar