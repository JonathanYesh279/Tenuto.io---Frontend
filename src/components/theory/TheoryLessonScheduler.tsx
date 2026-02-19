import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'

import apiService from '../../services/apiService'
import { ArrowCounterClockwiseIcon, BookOpenIcon, CalendarIcon, CaretLeftIcon, CaretRightIcon, CheckSquareIcon, ClockIcon, CopyIcon, FunnelIcon, MagnifyingGlassIcon, MapPinIcon, PencilIcon, PlusIcon, TrashIcon, UsersIcon, WarningIcon } from '@phosphor-icons/react'

interface TheoryLessonEvent {
  id: string
  title: string
  description?: string
  teacherId: string
  teacherName: string
  date: string
  startTime: string
  endTime: string
  duration: number
  location: string
  level: 'beginner' | 'intermediate' | 'advanced'
  maxStudents: number
  enrolledStudents: number
  studentIds: string[]
  category: string
  isRecurring: boolean
  recurringPattern?: 'weekly' | 'biweekly' | 'monthly'
  recurringEndDate?: string
  materials?: string[]
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  conflicts?: ConflictInfo[]
}

interface ConflictInfo {
  type: 'teacher' | 'room' | 'student'
  conflictWith: string
  severity: 'low' | 'medium' | 'high'
  details: string
}

interface CalendarView {
  year: number
  month: number
  weeks: CalendarWeek[]
}

interface CalendarWeek {
  days: CalendarDay[]
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  lessons: TheoryLessonEvent[]
}

export default function TheoryLessonScheduler() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<TheoryLessonEvent[]>([])
  const [calendarView, setCalendarView] = useState<CalendarView | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<TheoryLessonEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    level: 'all',
    teacher: 'all',
    status: 'all',
    search: ''
  })

  useEffect(() => {
    loadTheoryLessons()
    generateCalendarView()
  }, [currentDate, user])

  const loadTheoryLessons = async () => {
    try {
      setLoading(true)
      const allLessons = await apiService.theory.getTheoryLessons()

      // Map backend data to calendar events
      const mappedLessons: TheoryLessonEvent[] = allLessons.map(lesson => ({
        id: lesson._id,
        title: lesson.title || lesson.category || 'שיעור תיאוריה',
        description: lesson.description,
        teacherId: lesson.teacherId,
        teacherName: lesson.teacherName || 'מורה',
        date: lesson.date,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        duration: lesson.duration || 90,
        location: lesson.location || 'חדר תיאוריה',
        level: mapLevelFromCategory(lesson.category),
        maxStudents: lesson.maxStudents || 15,
        enrolledStudents: lesson.studentIds?.length || 0,
        studentIds: lesson.studentIds || [],
        category: lesson.category || 'מגמה',
        isRecurring: false, // Could be derived from backend data
        status: lesson.isActive ? 'scheduled' : 'cancelled',
        conflicts: detectConflicts(lesson, allLessons)
      }))

      setLessons(mappedLessons)
    } catch (error) {
      console.error('Error loading theory lessons:', error)
      setError('שגיאה בטעינת שיעורי התיאוריה')
    } finally {
      setLoading(false)
    }
  }

  const mapLevelFromCategory = (category: string): 'beginner' | 'intermediate' | 'advanced' => {
    if (category?.includes('מתחיל') || category?.includes('בסיס')) return 'beginner'
    if (category?.includes('מתקדם') || category?.includes('גבוה')) return 'advanced'
    return 'intermediate'
  }

  const detectConflicts = (lesson: any, allLessons: any[]): ConflictInfo[] => {
    const conflicts: ConflictInfo[] = []

    // Check for teacher conflicts
    const teacherConflicts = allLessons.filter(otherLesson =>
      otherLesson._id !== lesson._id &&
      otherLesson.teacherId === lesson.teacherId &&
      otherLesson.date === lesson.date &&
      timeRangesOverlap(
        lesson.startTime, lesson.endTime,
        otherLesson.startTime, otherLesson.endTime
      )
    )

    teacherConflicts.forEach(conflict => {
      conflicts.push({
        type: 'teacher',
        conflictWith: conflict.title || 'שיעור אחר',
        severity: 'high',
        details: `המורה עסוק בשיעור אחר: ${conflict.startTime}-${conflict.endTime}`
      })
    })

    // Check for room conflicts
    const roomConflicts = allLessons.filter(otherLesson =>
      otherLesson._id !== lesson._id &&
      otherLesson.location === lesson.location &&
      otherLesson.date === lesson.date &&
      timeRangesOverlap(
        lesson.startTime, lesson.endTime,
        otherLesson.startTime, otherLesson.endTime
      )
    )

    roomConflicts.forEach(conflict => {
      conflicts.push({
        type: 'room',
        conflictWith: conflict.title || 'שיעור אחר',
        severity: 'medium',
        details: `החדר תפוס: ${conflict.startTime}-${conflict.endTime}`
      })
    })

    return conflicts
  }

  const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const start1Minutes = timeToMinutes(start1)
    const end1Minutes = timeToMinutes(end1)
    const start2Minutes = timeToMinutes(start2)
    const end2Minutes = timeToMinutes(end2)

    return start1Minutes < end2Minutes && start2Minutes < end1Minutes
  }

  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  const generateCalendarView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Get first day of calendar (Sunday of first week)
    const firstCalendarDay = new Date(firstDay)
    firstCalendarDay.setDate(firstDay.getDate() - firstDay.getDay())

    // Get last day of calendar (Saturday of last week)
    const lastCalendarDay = new Date(lastDay)
    lastCalendarDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()))

    const weeks: CalendarWeek[] = []
    const currentWeekDay = new Date(firstCalendarDay)

    while (currentWeekDay <= lastCalendarDay) {
      const week: CalendarDay[] = []

      for (let i = 0; i < 7; i++) {
        const dayLessons = lessons.filter(lesson => {
          const lessonDate = new Date(lesson.date)
          return lessonDate.toDateString() === currentWeekDay.toDateString()
        })

        week.push({
          date: new Date(currentWeekDay),
          isCurrentMonth: currentWeekDay.getMonth() === month,
          isToday: currentWeekDay.toDateString() === new Date().toDateString(),
          lessons: dayLessons
        })

        currentWeekDay.setDate(currentWeekDay.getDate() + 1)
      }

      weeks.push({ days: week })
    }

    setCalendarView({ year, month, weeks })
  }

  const handleCreateLesson = async (lessonData: Partial<TheoryLessonEvent>) => {
    try {
      const backendData = {
        title: lessonData.title,
        description: lessonData.description,
        teacherId: user?._id,
        teacherName: user?.firstName || 'מורה',
        date: lessonData.date,
        startTime: lessonData.startTime,
        endTime: lessonData.endTime,
        duration: lessonData.duration,
        location: lessonData.location,
        category: lessonData.category,
        maxStudents: lessonData.maxStudents,
        isActive: lessonData.status !== 'cancelled'
      }

      const newLesson = await apiService.theory.createTheoryLesson(backendData)
      await loadTheoryLessons()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating lesson:', error)
      alert('שגיאה ביצירת השיעור')
    }
  }

  const handleUpdateLesson = async (lessonId: string, updates: Partial<TheoryLessonEvent>) => {
    try {
      const backendData = {
        title: updates.title,
        description: updates.description,
        date: updates.date,
        startTime: updates.startTime,
        endTime: updates.endTime,
        duration: updates.duration,
        location: updates.location,
        category: updates.category,
        maxStudents: updates.maxStudents,
        isActive: updates.status !== 'cancelled'
      }

      await apiService.theory.updateTheoryLesson(lessonId, backendData)
      await loadTheoryLessons()
      setEditingLesson(null)
    } catch (error) {
      console.error('Error updating lesson:', error)
      alert('שגיאה בעדכון השיעור')
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק שיעור זה?')) return

    try {
      await apiService.theory.deleteTheoryLesson(lessonId)
      await loadTheoryLessons()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('שגיאה במחיקת השיעור')
    }
  }

  const handleDuplicateLesson = async (lesson: TheoryLessonEvent) => {
    const duplicatedData = {
      ...lesson,
      title: `${lesson.title} - עותק`,
      id: undefined,
      date: new Date(new Date(lesson.date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Next week
    }

    await handleCreateLesson(duplicatedData)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-blue-100 text-blue-800'
      case 'advanced': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'מתחילים'
      case 'intermediate': return 'בינוניים'
      case 'advanced': return 'מתקדמים'
      default: return level
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'מתוכנן'
      case 'in_progress': return 'בביצוע'
      case 'completed': return 'הושלם'
      case 'cancelled': return 'בוטל'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 font-reisinger-yonatan">טוען לוח שיעורי תיאוריה...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-800 font-reisinger-yonatan text-center">
            <WarningIcon className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-bold mb-2">{error}</h3>
            <button
              onClick={loadTheoryLessons}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-reisinger-yonatan">
              מתזמן שיעורי תיאוריה 📅
            </h1>
            <p className="text-gray-600 mt-2">תכנון וניהול שיעורי תיאוריה מתקדם</p>
          </div>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-white border border-gray-300 rounded-lg">
              {(['month', 'week', 'day'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  } ${mode === 'month' ? 'rounded-r-lg' : mode === 'day' ? 'rounded-l-lg' : ''}`}
                >
                  {mode === 'month' ? 'חודש' : mode === 'week' ? 'שבוע' : 'יום'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="font-reisinger-yonatan">שיעור חדש</span>
            </button>
          </div>
        </div>

        {/* CalendarIcon Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CaretRightIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
                {currentDate.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CaretLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowCounterClockwiseIcon className="w-4 h-4" />
                <span className="font-reisinger-yonatan">היום</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="חיפוש שיעורים..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  dir="rtl"
                />
              </div>
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">כל הרמות</option>
                <option value="beginner">מתחילים</option>
                <option value="intermediate">בינוניים</option>
                <option value="advanced">מתקדמים</option>
              </select>
            </div>
          </div>

          {/* CalendarIcon Grid */}
          {viewMode === 'month' && calendarView && (
            <div className="p-4">
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2" dir="rtl">
                {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* CalendarIcon days */}
              <div className="space-y-1">
                {calendarView.weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1" dir="rtl">
                    {week.days.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`min-h-[120px] p-2 border border-gray-200 rounded-lg cursor-pointer transition-colors ${
                          day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                        } ${day.isToday ? 'ring-2 ring-indigo-500' : ''}`}
                        onClick={() => setSelectedDate(day.date)}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        } ${day.isToday ? 'text-indigo-600' : ''}`}>
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {day.lessons.slice(0, 3).map((lesson) => (
                            <div
                              key={lesson.id}
                              className="px-2 py-1 text-xs rounded bg-indigo-100 text-indigo-800 truncate hover:bg-indigo-200 transition-colors"
                              title={`${lesson.title} (${lesson.startTime}-${lesson.endTime})`}
                            >
                              <div className="font-medium font-reisinger-yonatan">{lesson.startTime} {lesson.title}</div>
                              {lesson.conflicts && lesson.conflicts.length > 0 && (
                                <WarningIcon className="w-3 h-3 text-red-500 inline ml-1" />
                              )}
                            </div>
                          ))}
                          {day.lessons.length > 3 && (
                            <div className="text-xs text-gray-500 text-center font-reisinger-yonatan">
                              +{day.lessons.length - 3} עוד
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
              שיעורים ל{selectedDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>

            {lessons.filter(lesson => new Date(lesson.date).toDateString() === selectedDate.toDateString()).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-reisinger-yonatan">אין שיעורים מתוכננים ליום זה</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium font-reisinger-yonatan"
                >
                  הוסף שיעור חדש
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons
                  .filter(lesson => new Date(lesson.date).toDateString() === selectedDate.toDateString())
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <BookOpenIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 font-reisinger-yonatan">{lesson.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              <span>{lesson.startTime} - {lesson.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="w-4 h-4" />
                              <span>{lesson.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <UsersIcon className="w-4 h-4" />
                              <span>{lesson.enrolledStudents}/{lesson.maxStudents}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(lesson.level)}`}>
                              {getLevelLabel(lesson.level)}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lesson.status)}`}>
                              {getStatusLabel(lesson.status)}
                            </span>
                            {lesson.conflicts && lesson.conflicts.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <WarningIcon className="w-3 h-3 mr-1" />
                                {lesson.conflicts.length} התנגשויות
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDuplicateLesson(lesson)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="שכפל שיעור"
                        >
                          <CopyIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingLesson(lesson)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="ערוך שיעור"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="מחק שיעור"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Lesson Modal */}
      {(showCreateModal || editingLesson) && (
        <LessonModal
          lesson={editingLesson}
          onClose={() => {
            setShowCreateModal(false)
            setEditingLesson(null)
          }}
          onSubmit={editingLesson ?
            (data) => handleUpdateLesson(editingLesson.id, data) :
            handleCreateLesson
          }
          selectedDate={selectedDate}
        />
      )}
    </div>
  )
}

// Lesson Modal Component
interface LessonModalProps {
  lesson: TheoryLessonEvent | null
  onClose: () => void
  onSubmit: (data: Partial<TheoryLessonEvent>) => void
  selectedDate?: Date | null
}

function LessonModal({ lesson, onClose, onSubmit, selectedDate }: LessonModalProps) {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    date: lesson?.date || selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    startTime: lesson?.startTime || '09:00',
    endTime: lesson?.endTime || '10:30',
    duration: lesson?.duration || 90,
    location: lesson?.location || 'חדר תיאוריה 1',
    level: lesson?.level || 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    maxStudents: lesson?.maxStudents || 15,
    category: lesson?.category || 'מגמה',
    status: lesson?.status || 'scheduled' as TheoryLessonEvent['status'],
    isRecurring: lesson?.isRecurring || false,
    recurringPattern: lesson?.recurringPattern || 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    recurringEndDate: lesson?.recurringEndDate || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
        <h3 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
          {lesson ? 'עריכת שיעור תיאוריה' : 'יצירת שיעור תיאוריה חדש'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                כותרת השיעור *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                קטגוריה
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="מגמה">מגמה</option>
                <option value="הרמוניה">הרמוניה</option>
                <option value="קומפוזיציה">קומפוזיציה</option>
                <option value="היסטוריה">היסטוריה של המוזיקה</option>
                <option value="ניתוח">ניתוח מוזיקלי</option>
                <option value="סולפז'">סולפז'</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              תיאור השיעור
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                תאריך *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת התחלה *
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת סיום *
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                רמה
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">מתחילים</option>
                <option value="intermediate">בינוניים</option>
                <option value="advanced">מתקדמים</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                מקסימום תלמידים
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.maxStudents}
                onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                מיקום
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700 font-reisinger-yonatan">שיעור חוזר</span>
            </label>

            {formData.isRecurring && (
              <>
                <select
                  value={formData.recurringPattern}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurringPattern: e.target.value as any }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="weekly">שבועי</option>
                  <option value="biweekly">דו-שבועי</option>
                  <option value="monthly">חודשי</option>
                </select>

                <input
                  type="date"
                  placeholder="תאריך סיום"
                  value={formData.recurringEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-reisinger-yonatan"
            >
              {lesson ? 'עדכן שיעור' : 'צור שיעור'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-reisinger-yonatan"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}