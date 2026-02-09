/**
 * Theory Lesson Utility Functions
 * 
 * Helper functions for formatting and handling theory lesson data
 * according to the specified backend data structure and display requirements.
 */

export interface TheoryLesson {
  _id: string
  category: string
  title: string
  description: string
  teacherId: string
  teacherName: string
  date: string
  startTime: string
  endTime: string
  duration: number
  location: string
  maxStudents: number
  studentIds: string[]
  attendanceList: Array<{
    studentId: string
    studentName: string
    status: string
    markedAt: string
  }>
  schoolYearId: string
  isActive: boolean
}

/**
 * Format theory lesson date according to requirements
 * @param lesson - Theory lesson object
 * @returns Formatted date string in Hebrew locale
 */
export const formatLessonDate = (lesson: TheoryLesson): string => {
  return new Date(lesson.date).toLocaleDateString('he-IL')
}

/**
 * Format theory lesson time according to requirements
 * @param lesson - Theory lesson object
 * @returns Formatted time string as "startTime - endTime"
 */
export const formatLessonTime = (lesson: TheoryLesson): string => {
  return `${lesson.startTime} - ${lesson.endTime}`
}

/**
 * Format theory lesson attendance according to requirements
 * @param lesson - Theory lesson object
 * @returns Formatted attendance string as "present/maxStudents"
 */
export const formatLessonAttendance = (lesson: TheoryLesson): string => {
  const presentCount = lesson.attendanceList?.filter(a => a.status === 'הגיע/ה').length || 0
  return `${presentCount}/${lesson.maxStudents}`
}

/**
 * Calculate attendance percentage
 * @param lesson - Theory lesson object
 * @returns Attendance percentage (0-100)
 */
export const calculateAttendancePercentage = (lesson: TheoryLesson): number => {
  if (lesson.maxStudents === 0) return 0
  const presentCount = lesson.attendanceList?.filter(a => a.status === 'הגיע/ה').length || 0
  return Math.round((presentCount / lesson.maxStudents) * 100)
}

/**
 * Get lesson status based on current time and lesson schedule
 * @param lesson - Theory lesson object
 * @returns Object with status text and color class
 */
export const getLessonStatus = (lesson: TheoryLesson): { text: string, colorClass: string } => {
  if (!lesson.isActive) {
    return { text: 'לא פעיל', colorClass: 'bg-gray-100 text-gray-800' }
  }

  const now = new Date()
  const lessonStart = new Date(`${lesson.date}T${lesson.startTime}:00`)
  const lessonEnd = new Date(`${lesson.date}T${lesson.endTime}:00`)

  if (now < lessonStart) {
    return { text: 'עתיד', colorClass: 'bg-blue-100 text-blue-800' }
  }
  
  if (now >= lessonStart && now <= lessonEnd) {
    return { text: 'מתקיים', colorClass: 'bg-green-100 text-green-800' }
  }
  
  if (now > lessonEnd) {
    return { text: 'הסתיים', colorClass: 'bg-orange-100 text-orange-800' }
  }

  return { text: 'לא ידוע', colorClass: 'bg-gray-100 text-gray-800' }
}

/**
 * Get attendance status color for progress bars and indicators
 * @param percentage - Attendance percentage (0-100)
 * @returns CSS color class
 */
export const getAttendanceColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Format lesson duration in a human-readable way
 * @param duration - Duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (duration: number): string => {
  if (duration < 60) {
    return `${duration} דקות`
  }
  
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  
  if (minutes === 0) {
    return `${hours} שעות`
  }
  
  return `${hours} שעות ו-${minutes} דקות`
}

/**
 * Get the number of enrolled students vs capacity
 * @param lesson - Theory lesson object
 * @returns Object with enrolled count, capacity, and availability
 */
export const getEnrollmentInfo = (lesson: TheoryLesson) => {
  const enrolled = lesson.studentIds?.length || 0
  const capacity = lesson.maxStudents
  const available = capacity - enrolled
  const isFull = enrolled >= capacity
  
  return {
    enrolled,
    capacity,
    available,
    isFull,
    percentage: capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0
  }
}

/**
 * Filter lessons by various criteria
 * @param lessons - Array of theory lessons
 * @param filters - Filter criteria
 * @returns Filtered lessons array
 */
export const filterLessons = (
  lessons: TheoryLesson[], 
  filters: {
    searchQuery?: string
    category?: string
    teacherId?: string
    date?: string
    isActive?: boolean
  }
): TheoryLesson[] => {
  return lessons.filter(lesson => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      const matchesSearch = 
        lesson.title?.toLowerCase().includes(query) ||
        lesson.teacherName?.toLowerCase().includes(query) ||
        lesson.category?.toLowerCase().includes(query) ||
        lesson.description?.toLowerCase().includes(query)
      
      if (!matchesSearch) return false
    }

    // Category filter
    if (filters.category && lesson.category !== filters.category) {
      return false
    }

    // Teacher filter
    if (filters.teacherId && lesson.teacherId !== filters.teacherId) {
      return false
    }

    // Date filter
    if (filters.date) {
      const filterDate = new Date(filters.date).toDateString()
      const lessonDate = new Date(lesson.date).toDateString()
      if (filterDate !== lessonDate) {
        return false
      }
    }

    // Active status filter
    if (filters.isActive !== undefined && lesson.isActive !== filters.isActive) {
      return false
    }

    return true
  })
}

/**
 * Sort lessons by various criteria
 * @param lessons - Array of theory lessons
 * @param sortBy - Sort criteria
 * @param sortOrder - Sort order (asc/desc)
 * @returns Sorted lessons array
 */
export const sortLessons = (
  lessons: TheoryLesson[], 
  sortBy: 'date' | 'title' | 'teacher' | 'attendance' | 'category' = 'date',
  sortOrder: 'asc' | 'desc' = 'asc'
): TheoryLesson[] => {
  const sorted = [...lessons].sort((a, b) => {
    let compareValue = 0

    switch (sortBy) {
      case 'date':
        compareValue = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case 'title':
        compareValue = a.title.localeCompare(b.title, 'he')
        break
      case 'teacher':
        compareValue = (a.teacherName || '').localeCompare(b.teacherName || '', 'he')
        break
      case 'category':
        compareValue = a.category.localeCompare(b.category, 'he')
        break
      case 'attendance':
        const aAttendance = calculateAttendancePercentage(a)
        const bAttendance = calculateAttendancePercentage(b)
        compareValue = aAttendance - bAttendance
        break
      default:
        compareValue = 0
    }

    return sortOrder === 'desc' ? -compareValue : compareValue
  })

  return sorted
}