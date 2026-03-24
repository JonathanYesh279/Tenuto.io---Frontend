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
import { Popover, PopoverTrigger, PopoverContent, Chip, Button } from '@heroui/react'

import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, isToday, isSameDay } from 'date-fns'
import { he } from 'date-fns/locale'
import { BookOpenIcon, CalendarIcon, CaretLeftIcon, CaretRightIcon, ClockIcon, MapPinIcon, MusicNotesIcon, PencilIcon, TrashIcon, UserIcon, UsersIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'
import { ActivityTimelineCard } from './ActivityTimelineCard'

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

  // Calculate end time from start time and duration
  const calculateEndTime = (startTime: string, duration: number): string => {
    if (!startTime || !duration) return startTime || '00:00'

    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMins = totalMinutes % 60

    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
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
      // Always calculate endTime from startTime + duration — stored endTime can be stale
      const endTime = calculateEndTime(startTime, duration)
      
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

  // Map activity type to ActivityTimelineCard type
  const getCardType = (type: string): 'individual' | 'group' | 'orchestra' | 'theory' => {
    switch (type) {
      case 'lesson': return 'individual'
      case 'orchestra': return 'orchestra'
      case 'ensemble': return 'group'
      default: return 'individual'
    }
  }

  // Only show Sunday–Friday (indices 0-5)
  const displayDays = weekDays.slice(0, 6)

  return (
    <div className={className}>
      {/* Header with Navigation */}
      {showNavigation && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousWeek}
              className="p-1.5 hover:bg-muted rounded-card transition-colors"
            >
              <CaretRightIcon className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="text-center">
              <h3 className="text-base font-semibold text-foreground">
                לוח זמנים שבועי
              </h3>
              <p className="text-xs text-muted-foreground">
                {format(weekStart, 'dd/MM', { locale: he })} - {format(weekEnd, 'dd/MM/yyyy', { locale: he })}
                {' • '}
                {weeklyActivities.length === 0
                  ? 'אין פעילויות השבוע'
                  : weeklyActivities.length === 1
                  ? 'פעילות אחת השבוע'
                  : `${weeklyActivities.length} פעילויות השבוע`}
              </p>
            </div>

            <button
              onClick={goToNextWeek}
              className="p-1.5 hover:bg-muted rounded-card transition-colors"
            >
              <CaretLeftIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={goToCurrentWeek}
          >
            השבוע הנוכחי
          </Button>
        </div>
      )}

      {/* Days Grid — matches SimpleWeeklyGrid pattern */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {displayDays.map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayActivities = activitiesByDay[dayKey] || []
          const isCurrentDay = isToday(day)

          return (
            <div key={dayKey} className="day-column">
              {/* Day Header */}
              <div className={`rounded-t-card px-3 py-2 border-b border-border ${
                isCurrentDay ? 'bg-primary/10' : 'bg-muted/50'
              }`}>
                <h4 className={`font-medium text-center text-sm ${
                  isCurrentDay ? 'text-primary' : 'text-foreground'
                }`}>
                  {ENGLISH_TO_HEBREW_DAYS[index]}
                </h4>
                <p className="text-xs text-muted-foreground text-center">
                  {dayActivities.length === 0 ? 'ריק' : String(dayActivities.length)}
                </p>
              </div>

              {/* Day Content */}
              <div className="rounded-b-card border border-t-0 border-border min-h-24 bg-card">
                {dayActivities.length === 0 ? (
                  <div className="p-3" />
                ) : (
                  <div className="p-2 space-y-2">
                    {dayActivities.map(activity => (
                      <Popover key={activity.id} placement="bottom" showArrow>
                        <PopoverTrigger>
                          <div>
                            <ActivityTimelineCard
                              title={activity.instrumentName || activity.title}
                              subtitle={activity.studentName || activity.subtitle}
                              type={getCardType(activity.type)}
                              startTime={activity.startTime}
                              endTime={activity.endTime}
                              location={activity.location}
                              onClick={activity.type === 'lesson' ? () => handleLessonClick(activity) : undefined}
                            />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="p-4 min-w-[220px] max-w-[280px] space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-bold text-foreground leading-snug">
                                {activity.instrumentName || activity.title}
                              </h4>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={activity.type === 'lesson' ? 'primary' : activity.type === 'orchestra' ? 'warning' : 'success'}
                                classNames={{ content: 'text-[10px] font-bold px-1' }}
                              >
                                {activity.title}
                              </Chip>
                            </div>
                            <div className="space-y-2 text-sm">
                              {activity.studentName && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <UserIcon size={14} className="flex-shrink-0 text-primary" />
                                  <span>{activity.studentName}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <ClockIcon size={14} className="flex-shrink-0 text-primary" />
                                <span>{activity.startTime}–{activity.endTime}</span>
                              </div>
                              {activity.location && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPinIcon size={14} className="flex-shrink-0 text-primary" />
                                  <span>{activity.location}</span>
                                </div>
                              )}
                              {activity.type === 'lesson' && onLessonUpdate && (
                                <button
                                  onClick={() => handleLessonClick(activity)}
                                  className="w-full mt-2 text-xs text-primary hover:underline font-medium"
                                >
                                  ערוך שיעור
                                </button>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
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