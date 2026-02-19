import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../services/authContext.jsx'

import apiService from '../../services/apiService'
import { getDisplayName } from '../../utils/nameUtils'
import { VALID_LOCATIONS } from '../../constants/locations'
import { BookOpenIcon, CalendarIcon, CaretLeftIcon, CaretRightIcon, CheckIcon, ClockIcon, EyeIcon, FloppyDiskIcon, GearIcon, MagnifyingGlassIcon, MapPinIcon, MusicNotesIcon, PencilIcon, PlusIcon, StarIcon, TrashIcon, UserIcon, UsersIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'

interface LessonDay {
  id: string
  day: string
  startTime: string
  endTime: string
  studentName?: string
  studentId?: string
  instrument?: string
  location?: string
  notes?: string
  recurring: {
    isRecurring: boolean
    excludeDates: string[]
  }
  totalDuration?: number
  // Additional fields for display
  studentClass?: string
  studentPhone?: string
  studentStage?: number
}

interface DaySchedule {
  date: string
  dayName: string
  lessons: LessonDay[]
}

interface WeekSchedule {
  weekStart: Date
  weekEnd: Date
  days: DaySchedule[]
}

interface StudentOption {
  id: string
  firstName: string
  lastName: string
  instrument?: string
  class?: string
  stage?: number
}

export default function TeacherScheduleTab() {
  const { user } = useAuth()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule | null>(null)
  const [lessonDays, setLessonDays] = useState<LessonDay[]>([])
  const [teachingDays, setTeachingDays] = useState<any[]>([]) // Teacher's availability blocks (ימי לימוד)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingLessonDay, setEditingLessonDay] = useState<LessonDay | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showQuickLessonModal, setShowQuickLessonModal] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{date: string, time: string, dayName: string} | null>(null)
  const [showEditLessonModal, setShowEditLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonDay | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    message: string
    onConfirm: () => void
  } | null>(null)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  useEffect(() => {
    loadScheduleData()
  }, [currentWeek, user])

  const loadScheduleData = async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      const teacherId = user._id

      // Load teacher's lesson days (time blocks)
      const timeBlocksResponse = await apiService.teacherSchedule.getTimeBlocks(teacherId)
      console.log('Raw API Response:', timeBlocksResponse)

      // Handle different response formats from API - more robust handling
      let timeBlocks = []
      try {
        if (Array.isArray(timeBlocksResponse)) {
          timeBlocks = timeBlocksResponse
        } else if (timeBlocksResponse?.data && Array.isArray(timeBlocksResponse.data)) {
          timeBlocks = timeBlocksResponse.data
        } else if (timeBlocksResponse?.timeBlocks && Array.isArray(timeBlocksResponse.timeBlocks)) {
          timeBlocks = timeBlocksResponse.timeBlocks
        } else if (timeBlocksResponse && typeof timeBlocksResponse === 'object') {
          // Try to find any array property in the response
          const arrayProperty = Object.values(timeBlocksResponse).find(value => Array.isArray(value))
          if (arrayProperty) {
            timeBlocks = arrayProperty
          } else {
            console.warn('No array found in response, using empty array')
            timeBlocks = []
          }
        } else {
          console.warn('Unexpected timeBlocks format:', timeBlocksResponse)
          timeBlocks = []
        }
      } catch (parseError) {
        console.error('Error parsing timeBlocks response:', parseError)
        timeBlocks = []
      }

      console.log('Parsed timeBlocks:', timeBlocks)
      console.log('Time block IDs:', timeBlocks.map(tb => ({ _id: tb._id, day: tb.day, time: `${tb.startTime}-${tb.endTime}`, location: tb.location })))

      // Filter out time blocks without valid _id (corrupted data)
      const validTimeBlocks = timeBlocks.filter(tb => tb._id && tb._id !== 'undefined')
      console.log('Valid timeBlocks after filtering:', validTimeBlocks)

      // Store teacher's availability blocks (ימי לימוד)
      setTeachingDays(validTimeBlocks)

      // Load teacher profile for students information
      const teacherProfile = await apiService.teachers.getTeacher(teacherId)
      console.log('Teacher profile:', teacherProfile)

      // Get students data for enriching lesson days
      let students = []
      try {
        students = await apiService.teachers.getTeacherStudents(teacherId)
        console.log('Students loaded:', students.length)
      } catch (error) {
        console.warn('Failed to load students:', error)
      }

      // Create lesson blocks from student assignments
      console.log('Creating lesson blocks from student assignments...')

      const convertedLessons = []

      // CheckIcon each student's assignments and create lesson blocks
      students.forEach(student => {
        console.log('Processing student:', getDisplayName(student.personalInfo))
        console.log('Student assignments:', student.teacherAssignments)

        if (student.teacherAssignments) {
          student.teacherAssignments.forEach(assignment => {
            if (assignment.teacherId === teacherId) {
              console.log('Creating lesson from assignment:', assignment)

              // Create a lesson block from the assignment
              const startTime = assignment.time || assignment.startTime
              const duration = assignment.duration || 45 // Default 45 minutes

              // Calculate endTime properly based on startTime + duration
              const calculateEndTime = (start: string, durationMinutes: number): string => {
                const [hours, minutes] = start.split(':').map(Number)
                const totalMinutes = hours * 60 + minutes + durationMinutes
                const endHours = Math.floor(totalMinutes / 60)
                const endMins = totalMinutes % 60
                return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
              }

              const endTime = assignment.endTime || calculateEndTime(startTime, duration)

              // Find the teaching day for this assignment's day to get default location
              const teachingDayForAssignment = teachingDays.find(td => td.day === assignment.day)
              const defaultLocation = teachingDayForAssignment?.location || ''

              const lessonBlock = {
                _id: `${student._id}-${assignment.day}-${assignment.time}`,
                day: assignment.day,
                startTime: startTime,
                endTime: endTime,
                totalDuration: duration,
                studentId: student._id,
                studentName: getDisplayName(student.personalInfo),
                teacherId: teacherId,
                instrument: student.academicInfo?.instrumentProgress?.find(p => p.isPrimary)?.instrumentName,
                location: assignment.location || defaultLocation,
                type: 'lesson' // Mark as actual lesson, not availability
              }

              console.log(`Creating lesson: Student="${getDisplayName(student.personalInfo)}", Day="${assignment.day}", Time="${startTime}-${endTime}"`)
              convertedLessons.push(lessonBlock)
            }
          })
        }
      })

      console.log('Converted lessons from assignments:', convertedLessons)

      // Use converted lessons instead of filtered time blocks
      const filteredBlocks = convertedLessons

      const mappedLessonDays = filteredBlocks.map(block => {
        // Find student assignment for this time block
        const student = students.find(s =>
          s.teacherAssignments?.some(a =>
            a.teacherId === teacherId &&
            a.day === block.day &&
            a.time === block.startTime
          )
        )

        const primaryInstrument = student?.academicInfo?.instrumentProgress?.find(p => p.isPrimary)
          || student?.academicInfo?.instrumentProgress?.[0]

        // Find the teaching day for this block's day to get default location
        const teachingDayForBlock = teachingDays.find(td => td.day === block.day)
        const defaultBlockLocation = teachingDayForBlock?.location || ''

        return {
          id: block._id || block.id || `${block.day}-${block.startTime}`,
          day: block.day,
          startTime: block.startTime,
          endTime: block.endTime,
          studentName: student ? getDisplayName(student.personalInfo) : block.studentName,
          studentId: student?._id || block.studentId,
          instrument: primaryInstrument?.instrumentName || block.instrument,
          location: block.location || defaultBlockLocation,
          notes: block.notes,
          recurring: block.recurring || { isRecurring: true, excludeDates: [] },
          totalDuration: block.totalDuration || calculateDuration(block.startTime, block.endTime),
          studentClass: student?.personalInfo?.class || student?.academicInfo?.class,
          studentPhone: student?.personalInfo?.phone,
          studentStage: primaryInstrument?.currentStage
        }
      })

      setLessonDays(mappedLessonDays)

      // Generate calendar view
      const weekStart = getWeekStart(currentWeek)
      const weekEnd = getWeekEnd(currentWeek)
      const days = generateWeekWithLessons(weekStart, mappedLessonDays)

      console.log('Generated calendar days:', days)
      console.log('CalendarIcon week range:', { weekStart, weekEnd })
      console.log('Mapped lesson days for calendar:', mappedLessonDays)

      setWeekSchedule({
        weekStart,
        weekEnd,
        days
      })

    } catch (error) {
      console.error('Error loading schedule:', error)
      setError('שגיאה בטעינת לוח הזמנים')
    } finally {
      setLoading(false)
    }
  }

  const generateWeekWithLessons = (weekStart: Date, lessons: LessonDay[]): DaySchedule[] => {
    const days: DaySchedule[] = []
    // Hebrew day names - Sunday (0) to Saturday (6)
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

    // Create a map for easy day name to index lookup
    const dayNameToIndex = new Map<string, number>()
    dayNames.forEach((name, index) => {
      dayNameToIndex.set(name, index)
    })

    console.log('=== GENERATING CALENDAR ===')
    console.log('weekStart:', weekStart, 'Day:', weekStart.getDay())
    console.log('lessons input:', lessons)
    console.log('Day name mapping:', Array.from(dayNameToIndex.entries()))

    // Group lessons by day name for efficient lookup
    const lessonsByDay = new Map<string, LessonDay[]>()
    lessons.forEach(lesson => {
      if (!lessonsByDay.has(lesson.day)) {
        lessonsByDay.set(lesson.day, [])
      }
      lessonsByDay.get(lesson.day)!.push(lesson)
    })
    console.log('Lessons grouped by day:', Array.from(lessonsByDay.keys()))

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)

      const dayName = dayNames[i]
      const dayLessons = lessonsByDay.get(dayName) || []

      console.log(`Day ${i} (${dayName}): found ${dayLessons.length} lessons`,
        dayLessons.map(l => ({ day: l.day, time: l.startTime, student: l.studentName })))

      days.push({
        date: date.toISOString().split('T')[0],
        dayName,
        lessons: dayLessons
      })
    }

    console.log('Generated calendar days with lessons:', days.map(d => ({
      dayName: d.dayName,
      lessonCount: d.lessons.length
    })))
    return days
  }

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    return (endHour * 60 + endMin) - (startHour * 60 + startMin)
  }

  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Calculate difference to get to Sunday (day 0)
    const diff = start.getDate() - day
    start.setDate(diff)
    // Ensure we set to start of day
    start.setHours(0, 0, 0, 0)
    console.log('getWeekStart: input date:', date, 'weekStart (Sunday):', start, 'day:', start.getDay())
    return start
  }

  const getWeekEnd = (date: Date) => {
    const end = getWeekStart(date)
    end.setDate(end.getDate() + 6)
    return end
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM format
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short'
    })
  }

  const handleAddLessonDay = () => {
    setEditingLessonDay(null)
    setShowLessonModal(true)
  }

  const handleEditLessonDay = (lessonDay: LessonDay) => {
    console.log('handleEditLessonDay called with:', {
      studentId: lessonDay.studentId,
      studentName: lessonDay.studentName,
      id: lessonDay.id,
      _id: lessonDay._id,
      type: lessonDay.type
    })

    // If this is an actual lesson with a student, open the lesson edit modal
    if (lessonDay.studentId && lessonDay.studentName) {
      console.log('Opening EditLessonModal for student lesson')
      setEditingLesson(lessonDay)
      setShowEditLessonModal(true)
    } else {
      // Otherwise, open the teaching day modal (for availability blocks)
      console.log('Opening LessonDayModal for teaching day/availability block')
      setEditingLessonDay(lessonDay)
      setShowLessonModal(true)
    }
  }

  const handleDeleteLessonDay = async (lessonDay: LessonDay) => {
    setConfirmModalConfig({
      message: 'האם אתה בטוח שברצונך למחוק יום לימוד זה? פעולה זו תמחק את כל השיעורים הקבועים ביום זה.',
      onConfirm: async () => {
        try {
          await apiService.teacherSchedule.deleteTimeBlock(user?._id, lessonDay.id)
          showNotification('יום הלימוד נמחק בהצלחה', 'success')
          loadScheduleData()
        } catch (error) {
          console.error('Error deleting lesson day:', error)
          showNotification('שגיאה במחיקת יום הלימוד', 'error')
        }
      }
    })
    setShowConfirmModal(true)
  }

  const handleEditTeachingDay = (teachingDay: any) => {
    console.log('handleEditTeachingDay called with:', {
      _id: teachingDay._id,
      id: teachingDay.id,
      day: teachingDay.day,
      startTime: teachingDay.startTime,
      hasStudentId: !!teachingDay.studentId,
      fullData: teachingDay
    })

    // Convert teaching day to lesson day format for modal
    const lessonDay: LessonDay = {
      id: teachingDay._id || teachingDay.id,
      day: teachingDay.day,
      startTime: teachingDay.startTime,
      endTime: teachingDay.endTime,
      location: teachingDay.location || 'חדר מוזיקה',
      notes: teachingDay.notes || '',
      recurring: teachingDay.recurring || { isRecurring: true, excludeDates: [] },
      totalDuration: calculateDuration(teachingDay.startTime, teachingDay.endTime)
    }

    console.log('Opening LessonDayModal with lessonDay:', lessonDay)
    setEditingLessonDay(lessonDay)
    setShowLessonModal(true)
  }

  const handleDeleteTeachingDay = async (teachingDay: any) => {
    setConfirmModalConfig({
      message: 'האם אתה בטוח שברצונך למחוק יום לימוד זה? פעולה זו תבטל את הזמינות שלך בזמן זה.',
      onConfirm: async () => {
        try {
          await apiService.teacherSchedule.deleteTimeBlock(user?._id, teachingDay._id || teachingDay.id)
          showNotification('יום הלימוד נמחק בהצלחה', 'success')
          loadScheduleData()
        } catch (error) {
          console.error('Error deleting teaching day:', error)
          showNotification('שגיאה במחיקת יום הלימוד', 'error')
        }
      }
    })
    setShowConfirmModal(true)
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
    }`
    notification.innerHTML = `<div class="flex items-center gap-2 font-reisinger-yonatan">
      ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${message}
    </div>`
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  const showAlert = (message: string) => {
    setAlertMessage(message)
    setShowAlertModal(true)
  }

  const getTimeSlots = () => {
    const slots = []
    for (let hour = 7; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  const getLessonForTimeSlot = (date: string, time: string) => {
    const day = weekSchedule?.days.find(d => d.date === date)

    // Convert times to minutes for easier comparison
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }

    const lesson = day?.lessons.find(lesson => {
      const currentSlotMinutes = timeToMinutes(time)
      const nextSlotMinutes = currentSlotMinutes + 30 // Next 30-minute slot
      const lessonStartMinutes = timeToMinutes(lesson.startTime)
      const lessonEndMinutes = timeToMinutes(lesson.endTime)

      // A lesson should be found for this time slot if:
      // 1. The lesson starts within this 30-minute window, OR
      // 2. The lesson is ongoing during this time slot
      const lessonStartsInThisSlot = lessonStartMinutes >= currentSlotMinutes && lessonStartMinutes < nextSlotMinutes
      const lessonOngoingInThisSlot = currentSlotMinutes >= lessonStartMinutes && currentSlotMinutes < lessonEndMinutes

      return lessonStartsInThisSlot || lessonOngoingInThisSlot
    })
    return lesson
  }

  const getLessonSpanHeight = (lesson: LessonDay) => {
    const durationMinutes = calculateDuration(lesson.startTime, lesson.endTime)
    const timeSlots = Math.ceil(durationMinutes / 30) // Each slot is 30 minutes
    return timeSlots * 60 // Each slot is 60px high (increased from 40px)
  }

  const isLessonStart = (lesson: LessonDay, time: string) => {
    // CheckIcon if this is the first time slot that contains the lesson
    // Since time slots are every 30 minutes, we need to find the slot that the lesson start time falls into
    const lessonStartTime = lesson.startTime
    const currentTimeSlot = time

    // Convert times to minutes for easier comparison
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }

    const lessonStartMinutes = timeToMinutes(lessonStartTime)
    const currentSlotMinutes = timeToMinutes(currentTimeSlot)
    const nextSlotMinutes = currentSlotMinutes + 30 // Next 30-minute slot

    // This slot should show the lesson if the lesson starts within this 30-minute window
    return lessonStartMinutes >= currentSlotMinutes && lessonStartMinutes < nextSlotMinutes
  }

  const isTimeSlotAvailableForLesson = (dayName: string, time: string) => {
    // CheckIcon if this time slot is within any יום לימוד (teaching day) availability
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }

    const currentTimeMinutes = timeToMinutes(time)
    const nextSlotMinutes = currentTimeMinutes + 30

    // First check if teacher has any availability blocks for this day
    const teacherAvailableOnDay = teachingDays.some(block => {
      if (block.day !== dayName) return false

      const blockStartMinutes = timeToMinutes(block.startTime)
      const blockEndMinutes = timeToMinutes(block.endTime)

      // CheckIcon if current time slot is within this availability block
      return currentTimeMinutes >= blockStartMinutes && nextSlotMinutes <= blockEndMinutes
    })

    if (!teacherAvailableOnDay) return false

    // Then check if this slot is not already occupied by an existing lesson
    const slotOccupied = lessonDays.some(lesson => {
      if (lesson.day !== dayName) return false

      const lessonStartMinutes = timeToMinutes(lesson.startTime)
      const lessonEndMinutes = timeToMinutes(lesson.endTime)

      // CheckIcon if this time slot overlaps with any existing lesson
      return (currentTimeMinutes < lessonEndMinutes && nextSlotMinutes > lessonStartMinutes)
    })

    return !slotOccupied // Available if NOT occupied
  }

  const handleTimeSlotClick = (date: string, time: string, dayName: string) => {
    if (isTimeSlotAvailableForLesson(dayName, time)) {
      setSelectedTimeSlot({ date, time, dayName })
      setShowQuickLessonModal(true)
    }
  }

  const filteredLessonDays = lessonDays.filter(lesson => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      lesson.studentName?.toLowerCase().includes(query) ||
      lesson.instrument?.toLowerCase().includes(query) ||
      lesson.location?.toLowerCase().includes(query) ||
      lesson.day.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען לוח זמנים...</div>
        </div>
      </div>
    )
  }

  if (error && !weekSchedule) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-reisinger-yonatan">{error}</div>
      </div>
    )
  }

  const timeSlots = getTimeSlots()

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
            לוח זמנים שבועי
          </h3>
          <p className="text-gray-600 mt-1">
            {weekSchedule && `${formatDate(weekSchedule.weekStart.toISOString().split('T')[0])} - ${formatDate(weekSchedule.weekEnd.toISOString().split('T')[0])}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <CaretRightIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-reisinger-yonatan"
          >
            השבוע
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <CaretLeftIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Clean CalendarIcon View */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-3 bg-gray-50 font-medium text-gray-700 font-reisinger-yonatan">
            שעה
          </div>
          {weekSchedule?.days.map((day) => (
            <div key={day.date} className="p-3 bg-gray-50 text-center">
              <div className="font-medium text-gray-900 font-reisinger-yonatan">
                {day.dayName}
              </div>
              <div className="text-sm text-gray-500 font-reisinger-yonatan">
                {formatDate(day.date)}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots Grid */}
        <div className="max-h-96 overflow-y-auto relative">
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 border-b border-gray-100" style={{ height: '60px' }}>
              <div className="p-3 bg-gray-50 text-sm font-medium text-gray-600 font-reisinger-yonatan flex items-center">
                {formatTime(time)}
              </div>
              {weekSchedule?.days.map((day) => {
                const lesson = getLessonForTimeSlot(day.date, time)
                const isAvailable = !lesson && isTimeSlotAvailableForLesson(day.dayName, time)

                return (
                  <div
                    key={`${day.date}-${time}`}
                    className={`border-l border-gray-100 relative transition-all duration-300 group ${
                      isAvailable
                        ? 'bg-blue-50/30 hover:bg-blue-100/50 cursor-pointer border-2 border-transparent hover:border-blue-200'
                        : 'cursor-default'
                    }`}
                    style={{ height: '60px' }}
                    onClick={() => !lesson && handleTimeSlotClick(day.date, time, day.dayName)}
                    title={isAvailable ? 'לחץ להוספת שיעור חדש' : ''}
                  >
                    {/* PlusIcon icon and label for available slots */}
                    {isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center opacity-30 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                          <PlusIcon className="w-6 h-6 text-blue-500" />
                          <span className="text-[10px] text-blue-600 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            הוסף שיעור
                          </span>
                        </div>
                      </div>
                    )}

                    {lesson && isLessonStart(lesson, time) && (
                      <div
                        className="absolute left-1 right-1 top-1 p-2.5 rounded text-xs font-reisinger-yonatan bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 shadow-sm cursor-pointer transition-all hover:scale-[1.02] z-10 overflow-hidden"
                        style={{
                          height: `${getLessonSpanHeight(lesson) - 2}px`,
                          minHeight: '82px'
                        }}
                        onClick={() => handleEditLessonDay(lesson)}
                        title={`${lesson.studentName || 'תלמיד'} - ${lesson.instrument || ''}`}
                      >
                        <div className="flex flex-col h-full justify-between">
                          <div className="flex-shrink-0 space-y-1">
                            <div className="font-medium truncate flex items-center gap-1">
                              <UserIcon className="w-3 h-3 opacity-60" />
                              {lesson.studentName || 'תלמיד'}
                            </div>
                            <div className="text-[10px] opacity-75">
                              {formatTime(lesson.startTime)}-{formatTime(lesson.endTime)}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] opacity-80 h-4">
                              {lesson.instrument ? (
                                <>
                                  <MusicNotesIcon className="w-2.5 h-2.5" />
                                  <span className="truncate">{lesson.instrument}</span>
                                </>
                              ) : (
                                <span className="invisible">placeholder</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] opacity-70 h-4">
                              {lesson.location ? (
                                <>
                                  <MapPinIcon className="w-2.5 h-2.5" />
                                  <span className="truncate">{lesson.location}</span>
                                </>
                              ) : (
                                <span className="invisible">placeholder</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Teaching Days Management Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
              ימי לימוד - זמינות המורה
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              הגדר את הימים והשעות שבהם אתה זמין להוראה
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Add Button */}
            <button
              onClick={handleAddLessonDay}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="font-reisinger-yonatan">הוסף יום לימוד</span>
            </button>
          </div>
        </div>

        {/* Teaching Days Cards */}
        {teachingDays.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-reisinger-yonatan text-lg">
              אין ימי לימוד מוגדרים
            </p>
            <button
              onClick={handleAddLessonDay}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              הוסף יום לימוד ראשון
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachingDays.map((teachingDay) => (
              <TeachingDayCard
                key={teachingDay._id || teachingDay.id}
                teachingDay={teachingDay}
                onEdit={() => handleEditTeachingDay(teachingDay)}
                onDelete={() => handleDeleteTeachingDay(teachingDay)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900 font-reisinger-yonatan">
              ימי לימוד
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2 font-reisinger-yonatan">
            {teachingDays.length}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            ימי זמינות להוראה
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900 font-reisinger-yonatan">
              שעות זמינות
            </span>
          </div>
          <div className="text-2xl font-bold text-green-900 mt-2 font-reisinger-yonatan">
            {(teachingDays.reduce((total, day) => {
              const duration = calculateDuration(day.startTime, day.endTime)
              return total + duration
            }, 0) / 60).toFixed(1)}
          </div>
          <div className="text-xs text-green-700 mt-1">
            שעות שבועיות זמינות
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900 font-reisinger-yonatan">
              תלמידים
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-2 font-reisinger-yonatan">
            {new Set(lessonDays.map(l => l.studentId).filter(Boolean)).size}
          </div>
          <div className="text-xs text-purple-700 mt-1">
            תלמידים פעילים
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-900 font-reisinger-yonatan">
              שיעורים
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-900 mt-2 font-reisinger-yonatan">
            {lessonDays.length}
          </div>
          <div className="text-xs text-orange-700 mt-1">
            שיעורים קבועים
          </div>
        </div>
      </div>

      {/* Quick Lesson Creation Modal */}
      {showQuickLessonModal && selectedTimeSlot && (
        <QuickLessonModal
          timeSlot={selectedTimeSlot}
          teacherId={user?._id || ''}
          teachingDays={teachingDays}
          onClose={() => {
            setShowQuickLessonModal(false)
            setSelectedTimeSlot(null)
          }}
          onSave={() => {
            setShowQuickLessonModal(false)
            setSelectedTimeSlot(null)
            loadScheduleData()
          }}
          showNotification={showNotification}
        />
      )}

      {/* Lesson Day Modal */}
      {showLessonModal && (
        <LessonDayModal
          lessonDay={editingLessonDay}
          teacherId={user?._id || ''}
          onClose={() => {
            setShowLessonModal(false)
            setEditingLessonDay(null)
          }}
          onSave={() => {
            setShowLessonModal(false)
            setEditingLessonDay(null)
            loadScheduleData()
          }}
          showAlert={showAlert}
        />
      )}

      {/* PencilIcon Lesson Modal */}
      {showEditLessonModal && editingLesson && (
        <EditLessonModal
          lesson={editingLesson}
          teacherId={user?._id || ''}
          teachingDays={teachingDays}
          onClose={() => {
            setShowEditLessonModal(false)
            setEditingLesson(null)
          }}
          onSave={() => {
            setShowEditLessonModal(false)
            setEditingLesson(null)
            loadScheduleData()
          }}
          showAlert={showAlert}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmModalConfig && (
        <ConfirmModal
          message={confirmModalConfig.message}
          onConfirm={() => {
            confirmModalConfig.onConfirm()
            setShowConfirmModal(false)
            setConfirmModalConfig(null)
          }}
          onCancel={() => {
            setShowConfirmModal(false)
            setConfirmModalConfig(null)
          }}
        />
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <AlertModal
          message={alertMessage}
          onClose={() => {
            setShowAlertModal(false)
            setAlertMessage('')
          }}
        />
      )}
    </div>
  )
}

// Teaching Day Card Component - for teacher's availability blocks
interface TeachingDayCardProps {
  teachingDay: any
  onEdit: () => void
  onDelete: () => void
}

function TeachingDayCard({ teachingDay, onEdit, onDelete }: TeachingDayCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <CalendarIcon className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h5 className="font-bold text-gray-900 font-reisinger-yonatan">
              יום {teachingDay.day}
            </h5>
            <p className="text-xs text-gray-500 mt-0.5">
              זמינות להוראה
            </p>
          </div>
        </div>
        {teachingDay.isRecurring !== false && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-reisinger-yonatan">
            שבועי
          </span>
        )}
      </div>

      {/* Time Range */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <ClockIcon className="w-4 h-4 text-gray-400" />
          <span className="font-medium">
            {teachingDay.startTime} - {teachingDay.endTime}
          </span>
        </div>
      </div>

      {/* Location */}
      {teachingDay.location && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
          <span>{teachingDay.location}</span>
        </div>
      )}

      {/* Available Slots Info */}
      <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <UsersIcon className="w-3 h-3" />
          <span>זמין לקביעת שיעורים בזמן זה</span>
        </div>
      </div>

      {/* Notes */}
      {teachingDay.notes && (
        <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 mb-3">
          {teachingDay.notes}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-sm"
        >
          <PencilIcon className="w-3.5 h-3.5" />
          <span className="font-reisinger-yonatan">ערוך</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          title="מחק יום לימוד"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// Helper function for calculating duration
const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  return (endHour * 60 + endMin) - (startHour * 60 + startMin)
}

// Lesson Day Card Component
interface LessonDayCardProps {
  lessonDay: LessonDay
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}

function LessonDayCard({ lessonDay, onEdit, onDelete, onView }: LessonDayCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <CalendarIcon className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h5 className="font-bold text-gray-900 font-reisinger-yonatan">
              יום {lessonDay.day}
            </h5>
            <p className="text-xs text-gray-500 mt-0.5">
              {lessonDay.startTime} - {lessonDay.endTime}
            </p>
          </div>
        </div>
        {lessonDay.recurring?.isRecurring && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-reisinger-yonatan">
            קבוע
          </span>
        )}
      </div>

      {/* Student Info */}
      {lessonDay.studentName && (
        <div className="mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <UserIcon className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{lessonDay.studentName}</span>
          </div>
          {lessonDay.studentClass && (
            <div className="text-xs text-gray-500 mr-6 mt-1">
              כיתה {lessonDay.studentClass}
            </div>
          )}
        </div>
      )}

      {/* Instrument & Location */}
      <div className="space-y-2 mb-3">
        {lessonDay.instrument && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MusicNotesIcon className="w-3.5 h-3.5 text-gray-400" />
            <span>{lessonDay.instrument}</span>
            {lessonDay.studentStage && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                שלב {lessonDay.studentStage}
              </span>
            )}
          </div>
        )}
        {lessonDay.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
            <span>{lessonDay.location}</span>
          </div>
        )}
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
        <span>{lessonDay.totalDuration || 0} דקות</span>
      </div>

      {/* Notes */}
      {lessonDay.notes && (
        <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 mb-3">
          {lessonDay.notes}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {lessonDay.studentId && (
          <button
            onClick={onView}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
            title="צפה בפרטי התלמיד"
          >
            <EyeIcon className="w-3.5 h-3.5" />
            <span className="font-reisinger-yonatan">צפה</span>
          </button>
        )}
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-sm"
        >
          <PencilIcon className="w-3.5 h-3.5" />
          <span className="font-reisinger-yonatan">ערוך</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          title="מחק יום לימוד"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// Lesson Day Modal Component
interface LessonDayModalProps {
  lessonDay: LessonDay | null
  teacherId: string
  onClose: () => void
  onSave: () => void
  showAlert: (message: string) => void
}

function LessonDayModal({ lessonDay, teacherId, onClose, onSave, showAlert }: LessonDayModalProps) {
  const [formData, setFormData] = useState<Partial<LessonDay>>({
    day: lessonDay?.day || 'ראשון',
    startTime: lessonDay?.startTime || '14:00',
    endTime: lessonDay?.endTime || '18:00',
    location: lessonDay?.location || 'חדר מוזיקה',
    notes: lessonDay?.notes || '',
    recurring: lessonDay?.recurring || { isRecurring: true, excludeDates: [] }
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // This modal should only handle teaching day blocks (availability), not student lessons
    if (lessonDay?.studentId) {
      showAlert('לא ניתן לערוך שיעור תלמיד מכאן. אנא השתמש באפשרות העריכה בכרטיס השיעור.')
      return
    }

    if (!formData.day || !formData.startTime || !formData.endTime) {
      showAlert('יש למלא את כל השדות הנדרשים')
      return
    }

    try {
      setSaving(true)

      const timeBlockData = {
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location || null,
        notes: formData.notes || null,
        recurring: formData.recurring || { isRecurring: true, excludeDates: [] }
      }

      // CheckIcon if this is a real time block (has valid MongoDB ID, not composite ID from student assignment)
      const isRealTimeBlock = lessonDay?.id && /^[0-9a-fA-F]{24}$/.test(lessonDay.id)

      if (isRealTimeBlock) {
        // Update existing time block
        await apiService.teacherSchedule.updateTimeBlock(teacherId, lessonDay.id, timeBlockData)
      } else {
        // Create new time block
        await apiService.teacherSchedule.createTimeBlock(teacherId, timeBlockData)
      }

      onSave()
    } catch (error: any) {
      console.error('Error saving lesson day:', error)

      // If resource not found, it means this time block was deleted or doesn't exist
      if (error?.message?.includes('not found') || error?.message?.includes('Resource not found')) {
        showAlert('יום הלימוד הזה כבר לא קיים במערכת. הוא יוסר מהתצוגה.')
        onClose() // Close the modal
        onSave() // Trigger refresh to remove the orphaned time block from UI
      } else {
        showAlert('שגיאה בשמירת יום הלימוד')
      }
    } finally {
      setSaving(false)
    }
  }

  const getDayOptions = () => [
    'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
  ]


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
            {lessonDay ? 'עריכת יום לימוד' : 'הוספת יום לימוד חדש'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Day and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                יום בשבוע *
              </label>
              <select
                value={formData.day}
                onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              >
                {getDayOptions().map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת התחלה *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת סיום *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              מיקום / חדר
            </label>
            <select
              value={formData.location || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">בחר חדר</option>
              {VALID_LOCATIONS.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              הערות
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="הערות נוספות לגבי השיעור..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Recurring GearIcon */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.recurring?.isRecurring !== false}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  recurring: {
                    isRecurring: e.target.checked,
                    excludeDates: prev.recurring?.excludeDates || []
                  }
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">שיעור קבוע (חוזר שבועית)</span>
            </label>
            {formData.recurring?.isRecurring && (
              <p className="text-xs text-gray-500 mr-6 mt-1">
                השיעור יופיע באופן קבוע בכל שבוע ביום ובשעה שהוגדרו
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-reisinger-yonatan flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  שומר...
                </>
              ) : (
                <>
                  {lessonDay ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      עדכן יום לימוד
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      הוסף יום לימוד
                    </>
                  )}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-reisinger-yonatan"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Quick Lesson Creation Modal Component
interface QuickLessonModalProps {
  timeSlot: {date: string, time: string, dayName: string}
  teacherId: string
  teachingDays: any[]
  onClose: () => void
  onSave: () => void
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void
}

function QuickLessonModal({ timeSlot, teacherId, teachingDays, onClose, onSave, showNotification }: QuickLessonModalProps) {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [duration, setDuration] = useState(45)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [minuteOffset, setMinuteOffset] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    loadStudents()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.student-search-dropdown')) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const loadStudents = async () => {
    try {
      setLoading(true)
      // Fetch ALL students from the app
      const allStudents = await apiService.students.getStudents()

      const mappedStudents: StudentOption[] = allStudents.map(student => {
        const primaryInstrument = student.academicInfo?.instrumentProgress?.find(p => p.isPrimary)
          || student.academicInfo?.instrumentProgress?.[0]

        return {
          id: student._id,
          firstName: student.personalInfo?.firstName || getDisplayName(student.personalInfo).split(' ')[0] || '',
          lastName: student.personalInfo?.lastName || getDisplayName(student.personalInfo).split(' ').slice(1).join(' ') || '',
          instrument: primaryInstrument?.instrumentName || '',
          class: student.personalInfo?.class || student.academicInfo?.class,
          stage: primaryInstrument?.currentStage
        }
      })

      setStudents(mappedStudents)
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
    return fullName.includes(query) ||
           student.instrument?.toLowerCase().includes(query) ||
           student.class?.toLowerCase().includes(query)
  })

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60)
    const endMins = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  // Calculate the actual start time based on the slot time and minute offset
  const getActualStartTime = (): string => {
    const [hours] = timeSlot.time.split(':').map(Number)
    const actualMinutes = minuteOffset
    return `${hours.toString().padStart(2, '0')}:${actualMinutes.toString().padStart(2, '0')}`
  }

  // Available minute options (5-minute intervals)
  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStudent) {
      showNotification('יש לבחור תלמיד', 'error')
      return
    }

    try {
      setSaving(true)

      const selectedStudentData = students.find(s => s.id === selectedStudent)
      const actualStartTime = getActualStartTime()
      const endTime = calculateEndTime(actualStartTime, duration)

      console.log('📝 Creating lesson for student:', selectedStudentData)
      console.log('📅 Lesson details:', { day: timeSlot.dayName, time: actualStartTime, duration })

      // Find the teaching day for this slot's day to get default location
      const teachingDayForSlot = teachingDays.find(td => td.day === timeSlot.dayName)
      const slotLocation = teachingDayForSlot?.location || ''

      // Create teacher assignment for the student with the actual start time
      const teacherAssignment = {
        teacherId: teacherId,
        day: timeSlot.dayName,
        time: actualStartTime,
        endTime: endTime,
        duration: duration,
        location: slotLocation,
        isActive: true,
        startDate: new Date().toISOString(),
        isRecurring: true
      }

      // Get current student data
      console.log('📖 Fetching student data...')
      const student = await apiService.students.getStudent(selectedStudent)

      // Add new teacher assignment to student's existing assignments
      const updatedTeacherAssignments = [
        ...(student.teacherAssignments || []),
        teacherAssignment
      ]

      // Update student with new teacher assignment
      console.log('💾 Updating student with teacher assignment...')
      await apiService.students.updateStudent(selectedStudent, {
        teacherAssignments: updatedTeacherAssignments
      })

      // Student-teacher link is managed via teacherAssignments (backend handles it)

      // Also create time block for teacher's schedule with the actual start time
      const timeBlockData = {
        day: timeSlot.dayName,
        startTime: actualStartTime,
        endTime: endTime,
        studentId: selectedStudent,
        studentName: selectedStudentData ? `${selectedStudentData.firstName} ${selectedStudentData.lastName}` : '',
        instrument: selectedStudentData?.instrument || '',
        location: slotLocation,
        notes: `שיעור קבוע שבועי - נוצר ב-${new Date().toLocaleDateString('he-IL')}`,
        recurring: { isRecurring: true, excludeDates: [] },
        isRecurring: true,
        totalDuration: duration
      }

      console.log('📋 Creating time block for teacher schedule...')
      await apiService.teacherSchedule.createTimeBlock(teacherId, timeBlockData)

      console.log('✅ Lesson created successfully!')
      showNotification('השיעור נוצר בהצלחה!', 'success')
      onSave()
    } catch (error) {
      console.error('❌ Error creating weekly lesson assignment:', error)
      showNotification(`שגיאה ביצירת השיעור השבועי: ${error.message || 'שגיאה לא ידועה'}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
            הוספת שיעור חדש
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <CalendarIcon className="w-4 h-4" />
            <span className="font-medium">שיעור קבוע שבועי - יום {timeSlot.dayName}</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <ClockIcon className="w-4 h-4" />
            <span>{formatTime(getActualStartTime())} - {formatTime(calculateEndTime(getActualStartTime(), duration))} ({duration} דקות)</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            השיעור יתקיים כל שבוע ביום {timeSlot.dayName} באותה שעה
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selection with MagnifyingGlassIcon */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              בחר תלמיד *
            </label>
            {loading ? (
              <div className="text-center py-2 text-gray-500">טוען רשימת תלמידים...</div>
            ) : (
              <div className="relative student-search-dropdown">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="חפש תלמיד לפי שם, כלי נגינה או כיתה..."
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Selected Student Display */}
                {selectedStudent && !showDropdown && (
                  <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium text-indigo-900">
                          {students.find(s => s.id === selectedStudent)?.firstName} {students.find(s => s.id === selectedStudent)?.lastName}
                        </span>
                        {students.find(s => s.id === selectedStudent)?.instrument && (
                          <span className="text-indigo-700"> - {students.find(s => s.id === selectedStudent)?.instrument}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent('')
                          setSearchQuery('')
                          setShowDropdown(true)
                        }}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Dropdown List */}
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(student.id)
                            setSearchQuery(`${student.firstName} ${student.lastName}`)
                            setShowDropdown(false)
                          }}
                          className={`w-full text-right px-3 py-2 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedStudent === student.id ? 'bg-indigo-100' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            {student.instrument && `${student.instrument}`}
                            {student.class && ` • כיתה ${student.class}`}
                            {student.stage && ` • שלב ${student.stage}`}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-gray-500">
                        לא נמצאו תלמידים מתאימים
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Minute Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-reisinger-yonatan">
              זמן התחלה מדויק (שעה {timeSlot.time.split(':')[0]}:__)
            </label>
            <div className="grid grid-cols-6 gap-2">
              {minuteOptions.map((minute) => (
                <button
                  key={minute}
                  type="button"
                  onClick={() => setMinuteOffset(minute)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all font-medium ${
                    minuteOffset === minute
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  :{minute.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              שעת התחלה: {getActualStartTime()}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              משך השיעור (דקות)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value={30}>30 דקות</option>
              <option value={45}>45 דקות</option>
              <option value={60}>60 דקות</option>
              <option value={90}>90 דקות</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving || !selectedStudent}
              className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-reisinger-yonatan flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  יוצר שיעור שבועי...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  צור שיעור שבועי
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-reisinger-yonatan"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Confirmation Modal Component
interface ConfirmModalProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" dir="rtl">
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-orange-100 rounded-full">
            <WarningCircleIcon className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 text-center mb-4 font-reisinger-yonatan">
          {message}
        </h3>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 transition-colors font-reisinger-yonatan font-medium"
          >
            אישור
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors font-reisinger-yonatan font-medium"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

// Alert Modal Component
interface AlertModalProps {
  message: string
  onClose: () => void
}

function AlertModal({ message, onClose }: AlertModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" dir="rtl">
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-blue-100 rounded-full">
            <WarningCircleIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 text-center mb-6 font-reisinger-yonatan">
          {message}
        </h3>

        <button
          onClick={onClose}
          className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-reisinger-yonatan font-medium"
        >
          הבנתי
        </button>
      </div>
    </div>
  )
}

// PencilIcon Lesson Modal Component - for editing individual lessons
interface EditLessonModalProps {
  lesson: LessonDay
  teacherId: string
  teachingDays: any[]
  onClose: () => void
  onSave: () => void
  showAlert: (message: string) => void
}

function EditLessonModal({ lesson, teacherId, teachingDays, onClose, onSave, showAlert }: EditLessonModalProps) {
  // Helper function defined first
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    return (endHour * 60 + endMin) - (startHour * 60 + startMin)
  }

  // Find the teaching day for this lesson's day to get default location
  const teachingDayForLesson = teachingDays.find(td => td.day === lesson.day)
  const defaultLessonLocation = teachingDayForLesson?.location || ''

  const [formData, setFormData] = useState({
    day: lesson.day,
    startTime: lesson.startTime,
    endTime: lesson.endTime,
    location: lesson.location || defaultLessonLocation,
    notes: lesson.notes || ''
  })
  const [saving, setSaving] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState<number>(
    calculateDuration(lesson.startTime, lesson.endTime)
  )
  const [availableSlots, setAvailableSlots] = useState<Array<{
    id: string
    startTime: string
    endTime: string
    duration: number
  }>>([])
  const [validationError, setValidationError] = useState<string>('')

  // Generate available time slots based on selected day and duration
  useEffect(() => {
    if (!formData.day || !selectedDuration) return

    const dayTeachingBlocks = teachingDays.filter(td => td.day === formData.day)
    const slots: Array<{id: string, startTime: string, endTime: string, duration: number}> = []

    dayTeachingBlocks.forEach((block) => {
      const [startHour, startMin] = block.startTime.split(':').map(Number)
      const [endHour, endMin] = block.endTime.split(':').map(Number)

      const startTimeMinutes = startHour * 60 + startMin
      const endTimeMinutes = endHour * 60 + endMin
      const totalAvailableTime = endTimeMinutes - startTimeMinutes

      // Calculate how many slots of this duration can fit
      const possibleSlots = Math.floor(totalAvailableTime / selectedDuration)

      for (let i = 0; i < possibleSlots; i++) {
        const slotStartMinutes = startTimeMinutes + (i * selectedDuration)
        const slotEndMinutes = slotStartMinutes + selectedDuration

        // Convert back to time format
        const slotStartHour = Math.floor(slotStartMinutes / 60)
        const slotStartMinute = slotStartMinutes % 60
        const slotEndHour = Math.floor(slotEndMinutes / 60)
        const slotEndMinute = slotEndMinutes % 60

        const slotStartTime = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`
        const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`

        slots.push({
          id: `${block._id || block.id}-${selectedDuration}-${i}`,
          startTime: slotStartTime,
          endTime: slotEndTime,
          duration: selectedDuration
        })
      }
    })

    setAvailableSlots(slots)
  }, [formData.day, selectedDuration, teachingDays])

  const handleSlotSelection = (slot: {startTime: string, endTime: string, duration: number}) => {
    setFormData(prev => ({
      ...prev,
      startTime: slot.startTime,
      endTime: slot.endTime
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.day || !formData.startTime || !formData.endTime) {
      showAlert('יש למלא את כל השדות הנדרשים')
      return
    }

    const duration = calculateDuration(formData.startTime, formData.endTime)
    if (duration <= 0) {
      showAlert('זמן הסיום חייב להיות לאחר זמן ההתחלה')
      return
    }

    try {
      setSaving(true)

      // Update the teacher assignment for this student
      if (lesson.studentId) {
        const assignmentUpdate = {
          teacherId: teacherId,
          day: formData.day,
          time: formData.startTime,
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration: duration,
          location: formData.location,
          isActive: true
        }

        // Update student's teacher assignment
        await apiService.students.updateTeacherAssignment(
          lesson.studentId,
          teacherId,
          assignmentUpdate
        )
      }

      showNotification('השיעור עודכן בהצלחה', 'success')
      onSave()
    } catch (error) {
      console.error('Error updating lesson:', error)
      showNotification('שגיאה בעדכון השיעור', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`
    notification.innerHTML = `<div class="flex items-center gap-2 font-reisinger-yonatan">
      ${type === 'success' ? '✅' : '❌'} ${message}
    </div>`
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  const getDayOptions = () => {
    // Get unique days from teachingDays (teacher's availability blocks)
    const availableDays = Array.from(new Set(teachingDays.map(td => td.day)))

    // If no teaching days configured, return all days as fallback
    if (availableDays.length === 0) {
      return ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    }

    // Return only days where teacher has teaching hours
    return availableDays
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
            עריכת שיעור
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Student Info Display */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2 font-reisinger-yonatan">פרטי התלמיד</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <strong>תלמיד:</strong> {lesson.studentName || 'לא צוין'}
            </div>
            {lesson.instrument && (
              <div className="flex items-center gap-2">
                <MusicNotesIcon className="w-4 h-4" />
                <strong>כלי נגינה:</strong> {lesson.instrument}
              </div>
            )}
            {lesson.studentClass && (
              <div><strong>כיתה:</strong> {lesson.studentClass}</div>
            )}
            {lesson.studentStage && (
              <div><strong>שלב:</strong> {lesson.studentStage}</div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Day Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              יום בשבוע *
            </label>
            <select
              value={formData.day}
              onChange={(e) => {
                const newDay = e.target.value
                const newDayTeachingBlock = teachingDays.find(td => td.day === newDay)
                setFormData(prev => ({
                  ...prev,
                  day: newDay,
                  // If no location is set or current location is the default from another day, update to new day's location
                  location: (!prev.location || prev.location === '') && newDayTeachingBlock?.location
                    ? newDayTeachingBlock.location
                    : prev.location
                }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              {getDayOptions().map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              משך השיעור (דקות) *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[30, 45, 60].map(duration => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setSelectedDuration(duration)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedDuration === duration
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  {duration} דק׳
                </button>
              ))}
            </div>
          </div>

          {/* Available Time Slots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-reisinger-yonatan">
              בחר זמן שיעור זמין *
            </label>
            {availableSlots.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                <ClockIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">
                  אין זמנים זמינים ליום ומשך שיעור שנבחרו
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                {availableSlots.map(slot => {
                  const isSelected = formData.startTime === slot.startTime && formData.endTime === slot.endTime
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleSlotSelection(slot)}
                      className={`p-3 rounded-lg border-2 transition-all text-sm ${
                        isSelected
                          ? 'border-green-600 bg-green-50 text-green-800 font-semibold shadow-md'
                          : slot.duration === 30
                          ? 'border-green-300 bg-green-50 text-green-800 hover:border-green-500'
                          : slot.duration === 45
                          ? 'border-blue-300 bg-blue-50 text-blue-800 hover:border-blue-500'
                          : 'border-purple-300 bg-purple-50 text-purple-800 hover:border-purple-500'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        <span className="font-medium">
                          {slot.startTime}-{slot.endTime}
                        </span>
                      </div>
                      <div className="text-xs mt-1 opacity-75">
                        {slot.duration} דקות
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Selected Time Display */}
          {formData.startTime && formData.endTime && (
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-2 text-indigo-800">
                <ClockIcon className="w-4 h-4" />
                <span className="font-reisinger-yonatan font-medium">
                  זמן שיעור נבחר: {formData.startTime} - {formData.endTime} ({calculateDuration(formData.startTime, formData.endTime)} דקות)
                </span>
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              מיקום / חדר
            </label>
            <select
              value={formData.location || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">בחר חדר</option>
              {VALID_LOCATIONS.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              הערות
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="הערות נוספות לגבי השיעור..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={saving || !formData.startTime || !formData.endTime}
              className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-reisinger-yonatan flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  שומר...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  עדכן שיעור
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-reisinger-yonatan"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
