/**
 * Date and Time Utility Functions for Hebrew/RTL Support
 * 
 * Comprehensive date/time formatting utilities optimized for Hebrew locale
 * and conservatory management system requirements.
 */

/**
 * Format date in Hebrew locale with various options
 * @param date - Date string or Date object
 * @param format - Format type ('short', 'medium', 'long', 'full')
 * @returns Formatted date string in Hebrew
 */
export const formatHebrewDate = (
  date: string | Date, 
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jerusalem',
    calendar: 'gregory'
  }

  switch (format) {
    case 'short':
      options.day = '2-digit'
      options.month = '2-digit'
      options.year = 'numeric'
      break
    case 'medium':
      options.day = 'numeric'
      options.month = 'long'
      options.year = 'numeric'
      break
    case 'long':
      options.weekday = 'long'
      options.day = 'numeric'
      options.month = 'long'
      options.year = 'numeric'
      break
    case 'full':
      options.weekday = 'long'
      options.day = 'numeric'
      options.month = 'long'
      options.year = 'numeric'
      options.era = 'long'
      break
  }

  return dateObj.toLocaleDateString('he-IL', options)
}

/**
 * Format time in Hebrew locale
 * @param time - Time string (HH:MM format) or Date object
 * @param includeSeconds - Whether to include seconds
 * @returns Formatted time string
 */
export const formatHebrewTime = (
  time: string | Date,
  includeSeconds: boolean = false
): string => {
  let dateObj: Date

  if (typeof time === 'string') {
    // Handle HH:MM format
    const [hours, minutes] = time.split(':').map(Number)
    dateObj = new Date()
    dateObj.setHours(hours, minutes, 0, 0)
  } else {
    dateObj = time
  }

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jerusalem'
  }

  if (includeSeconds) {
    options.second = '2-digit'
  }

  return dateObj.toLocaleTimeString('he-IL', options)
}

/**
 * Format datetime for Hebrew display
 * @param datetime - Date string or Date object
 * @param dateFormat - Date format type
 * @param includeTime - Whether to include time
 * @returns Formatted datetime string
 */
export const formatHebrewDateTime = (
  datetime: string | Date,
  dateFormat: 'short' | 'medium' | 'long' = 'medium',
  includeTime: boolean = true
): string => {
  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime
  
  const formattedDate = formatHebrewDate(dateObj, dateFormat)
  
  if (!includeTime) {
    return formattedDate
  }

  const formattedTime = formatHebrewTime(dateObj)
  return `${formattedDate} בשעה ${formattedTime}`
}

/**
 * Get Hebrew day name from date
 * @param date - Date string or Date object
 * @returns Hebrew day name
 */
export const getHebrewDayName = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('he-IL', { weekday: 'long' })
}

/**
 * Get Hebrew month name from date
 * @param date - Date string or Date object
 * @returns Hebrew month name
 */
export const getHebrewMonthName = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('he-IL', { month: 'long' })
}

/**
 * Format relative time in Hebrew (e.g., "לפני 5 דקות", "בעוד שעתיים")
 * @param date - Date to compare
 * @param baseDate - Base date for comparison (defaults to now)
 * @returns Hebrew relative time string
 */
export const formatHebrewRelativeTime = (
  date: string | Date,
  baseDate: Date = new Date()
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const diffMs = baseDate.getTime() - dateObj.getTime()
  const diffMinutes = Math.floor(Math.abs(diffMs) / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  const isPast = diffMs > 0

  if (diffMinutes < 1) {
    return 'עכשיו'
  } else if (diffMinutes < 60) {
    return isPast ? `לפני ${diffMinutes} דקות` : `בעוד ${diffMinutes} דקות`
  } else if (diffHours < 24) {
    return isPast ? `לפני ${diffHours} שעות` : `בעוד ${diffHours} שעות`
  } else if (diffDays === 1) {
    return isPast ? 'אתמול' : 'מחר'
  } else if (diffDays < 7) {
    return isPast ? `לפני ${diffDays} ימים` : `בעוד ${diffDays} ימים`
  } else {
    return formatHebrewDate(dateObj, 'medium')
  }
}

/**
 * Format time range in Hebrew
 * @param startTime - Start time (HH:MM or Date)
 * @param endTime - End time (HH:MM or Date)
 * @returns Formatted time range
 */
export const formatHebrewTimeRange = (
  startTime: string | Date,
  endTime: string | Date
): string => {
  const formattedStart = formatHebrewTime(startTime)
  const formattedEnd = formatHebrewTime(endTime)
  return `${formattedStart} - ${formattedEnd}`
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return dateObj.toDateString() === today.toDateString()
}

/**
 * Check if date is this week
 * @param date - Date to check
 * @returns True if date is this week
 */
export const isThisWeek = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  return dateObj >= weekStart && dateObj <= weekEnd
}

/**
 * Get Hebrew-formatted academic year
 * @param date - Date within the academic year
 * @returns Academic year string (e.g., "תשפ״ד")
 */
export const getHebrewAcademicYear = (date: string | Date = new Date()): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth()
  
  // Academic year starts in September (month 8)
  const academicYear = month >= 8 ? year : year - 1
  
  // Convert to Hebrew year notation
  const hebrewYear = academicYear - 1240 // Approximate conversion to Hebrew calendar
  const hebrewNumerals = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט']
  
  const hundreds = Math.floor((hebrewYear % 1000) / 100)
  const tens = Math.floor((hebrewYear % 100) / 10)
  const ones = hebrewYear % 10
  
  let result = 'תש'
  if (hundreds > 0) result += hebrewNumerals[hundreds]
  if (tens > 0) result += hebrewNumerals[tens]
  if (ones > 0) result += hebrewNumerals[ones]
  result += '״'
  
  return result
}

/**
 * Format duration in Hebrew
 * @param minutes - Duration in minutes
 * @returns Hebrew duration string
 */
export const formatHebrewDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} דקות`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return hours === 1 ? 'שעה אחת' : `${hours} שעות`
  }
  
  const hoursText = hours === 1 ? 'שעה' : `${hours} שעות`
  const minutesText = remainingMinutes === 1 ? 'דקה' : `${remainingMinutes} דקות`
  
  return `${hoursText} ו${minutesText}`
}