import React from 'react'
import FilterPanel, { FilterGroup, FilterState } from './FilterPanel'
import { VALID_DAYS, VALID_INSTRUMENTS } from '../../utils/validationUtils'

interface LessonFiltersProps {
  values: FilterState
  onChange: (values: FilterState) => void
  onReset?: () => void
  variant?: 'sidebar' | 'horizontal' | 'modal'
  className?: string
}

// Lesson-specific filter configurations
const lessonFilterGroups: FilterGroup[] = [
  {
    key: 'type',
    label: 'סוג השיעור',
    type: 'multiselect',
    options: [
      { value: 'individual', label: 'שיעור פרטי', count: 120 },
      { value: 'theory', label: 'תיאוריה', count: 45 },
      { value: 'ensemble', label: 'הרכב', count: 30 },
      { value: 'masterclass', label: 'מאסטר קלאס', count: 12 },
      { value: 'workshop', label: 'סדנה', count: 8 }
    ]
  },
  {
    key: 'instrument',
    label: 'כלי נגינה',
    type: 'multiselect',
    options: VALID_INSTRUMENTS.map(instrument => ({
      value: instrument,
      label: instrument,
      count: Math.floor(Math.random() * 25) + 1
    })).concat([
      { value: 'theory', label: 'תיאוריה', count: 45 },
      { value: 'ensemble', label: 'הרכב', count: 30 }
    ])
  },
  {
    key: 'day',
    label: 'יום',
    type: 'multiselect',
    options: VALID_DAYS.map(day => ({
      value: day,
      label: day,
      count: Math.floor(Math.random() * 40) + 10
    }))
  },
  {
    key: 'timeSlot',
    label: 'משמרת',
    type: 'multiselect',
    options: [
      { value: 'morning', label: 'בוקר (08:00-12:00)', count: 45 },
      { value: 'afternoon', label: 'צהריים (12:00-16:00)', count: 80 },
      { value: 'evening', label: 'ערב (16:00-20:00)', count: 95 }
    ]
  },
  {
    key: 'duration',
    label: 'משך זמן (דקות)',
    type: 'multiselect',
    options: [
      { value: '30', label: '30 דקות', count: 60 },
      { value: '45', label: '45 דקות', count: 85 },
      { value: '60', label: '60 דקות', count: 70 },
      { value: '90', label: '90 דקות', count: 25 }
    ]
  },
  {
    key: 'level',
    label: 'רמה',
    type: 'multiselect',
    options: [
      { value: 'beginner', label: 'מתחיל', count: 40 },
      { value: 'intermediate', label: 'בינוני', count: 60 },
      { value: 'advanced', label: 'מתקדם', count: 45 },
      { value: 'professional', label: 'מקצועי', count: 15 }
    ]
  },
  {
    key: 'location',
    label: 'מיקום',
    type: 'multiselect',
    options: [
      { value: 'room101', label: 'חדר 101', count: 25 },
      { value: 'room102', label: 'חדר 102', count: 20 },
      { value: 'room103', label: 'חדר 103', count: 18 },
      { value: 'main-hall', label: 'אולם גדול', count: 15 },
      { value: 'practice-room-a', label: 'חדר תרגול א׳', count: 30 },
      { value: 'practice-room-b', label: 'חדר תרגול ב׳', count: 25 },
      { value: 'online', label: 'אונליין', count: 12 }
    ]
  },
  {
    key: 'status',
    label: 'סטטוס',
    type: 'select',
    options: [
      { value: 'scheduled', label: 'מתוזמן', count: 150 },
      { value: 'ongoing', label: 'מתרחש כעת', count: 8 },
      { value: 'completed', label: 'הושלם', count: 450 },
      { value: 'cancelled', label: 'בוטל', count: 23 },
      { value: 'rescheduled', label: 'נדחה', count: 15 }
    ]
  },
  {
    key: 'attendanceRate',
    label: 'אחוז נוכחות',
    type: 'range',
    min: 0,
    max: 100
  },
  {
    key: 'hasRecording',
    label: 'יש הקלטה',
    type: 'boolean'
  },
  {
    key: 'isRecurring',
    label: 'שיעור קבוע',
    type: 'boolean'
  },
  {
    key: 'requiresEquipment',
    label: 'דורש ציוד מיוחד',
    type: 'boolean'
  },
  {
    key: 'dateRange',
    label: 'תאריך',
    type: 'date'
  }
]

const LessonFilters: React.FC<LessonFiltersProps> = ({
  values,
  onChange,
  onReset,
  variant = 'sidebar',
  className = ''
}) => {
  return (
    <FilterPanel
      filters={lessonFilterGroups}
      values={values}
      onChange={onChange}
      onReset={onReset}
      variant={variant}
      collapsible={variant === 'sidebar'}
      className={className}
    />
  )
}

export default LessonFilters

// Export utility functions for lesson filtering
export const getLessonFilterDefaults = (): FilterState => ({
  type: [],
  instrument: [],
  day: [],
  timeSlot: [],
  duration: [],
  level: [],
  location: [],
  status: '',
  attendanceRate: { min: 0, max: 100 },
  hasRecording: false,
  isRecurring: false,
  requiresEquipment: false,
  dateRange: ''
})

export const applyLessonFilters = (lessons: any[], filters: FilterState) => {
  return lessons.filter(lesson => {
    // Type filter
    if (filters.type?.length > 0 && !filters.type.includes(lesson.type)) {
      return false
    }
    
    // Instrument filter
    if (filters.instrument?.length > 0 && !filters.instrument.includes(lesson.instrument || lesson.subject)) {
      return false
    }
    
    // Day filter
    if (filters.day?.length > 0 && !filters.day.includes(lesson.schedule?.day)) {
      return false
    }
    
    // Time slot filter
    if (filters.timeSlot?.length > 0) {
      const startHour = parseInt(lesson.schedule?.startTime?.split(':')[0] || '0')
      let timeSlot = ''
      if (startHour >= 8 && startHour < 12) timeSlot = 'morning'
      else if (startHour >= 12 && startHour < 16) timeSlot = 'afternoon'
      else if (startHour >= 16 && startHour < 20) timeSlot = 'evening'
      
      if (!filters.timeSlot.includes(timeSlot)) return false
    }
    
    // Duration filter
    if (filters.duration?.length > 0 && !filters.duration.includes(String(lesson.schedule?.duration))) {
      return false
    }
    
    // Level filter
    if (filters.level?.length > 0 && !filters.level.includes(lesson.level)) {
      return false
    }
    
    // Location filter
    if (filters.location?.length > 0 && !filters.location.includes(lesson.location)) {
      return false
    }
    
    // Status filter
    if (filters.status && lesson.status !== filters.status) {
      return false
    }
    
    // Attendance rate filter
    if (filters.attendanceRate?.min && (lesson.stats?.attendanceRate || 0) < filters.attendanceRate.min) {
      return false
    }
    if (filters.attendanceRate?.max && (lesson.stats?.attendanceRate || 0) > filters.attendanceRate.max) {
      return false
    }
    
    // Boolean filters
    if (filters.hasRecording && !lesson.hasRecording) {
      return false
    }
    if (filters.isRecurring && !lesson.isRecurring) {
      return false
    }
    if (filters.requiresEquipment && !lesson.requiresEquipment) {
      return false
    }
    
    // Date filter
    if (filters.dateRange) {
      const lessonDate = new Date(lesson.schedule?.date)
      const filterDate = new Date(filters.dateRange)
      if (lessonDate.getTime() !== filterDate.getTime()) {
        return false
      }
    }
    
    return true
  })
}

// Get active filter summary for display
export const getLessonFilterSummary = (filters: FilterState): string[] => {
  const summary: string[] = []
  
  if (filters.type?.length > 0) {
    const typeLabels = {
      individual: 'פרטי',
      theory: 'תיאוריה',
      ensemble: 'הרכב',
      masterclass: 'מאסטר קלאס',
      workshop: 'סדנה'
    }
    const types = filters.type.map((type: string) => typeLabels[type as keyof typeof typeLabels])
    summary.push(`סוג: ${types.join(', ')}`)
  }
  
  if (filters.instrument?.length > 0) {
    summary.push(`כלי: ${filters.instrument.join(', ')}`)
  }
  
  if (filters.day?.length > 0) {
    summary.push(`ימים: ${filters.day.join(', ')}`)
  }
  
  if (filters.timeSlot?.length > 0) {
    const timeSlotLabels = {
      morning: 'בוקר',
      afternoon: 'צהריים',
      evening: 'ערב'
    }
    const slots = filters.timeSlot.map((slot: string) => timeSlotLabels[slot as keyof typeof timeSlotLabels])
    summary.push(`משמרת: ${slots.join(', ')}`)
  }
  
  if (filters.duration?.length > 0) {
    summary.push(`משך: ${filters.duration.map((d: string) => `${d} דק׳`).join(', ')}`)
  }
  
  if (filters.level?.length > 0) {
    const levelLabels = {
      beginner: 'מתחיל',
      intermediate: 'בינוני',
      advanced: 'מתקדם',
      professional: 'מקצועי'
    }
    const levels = filters.level.map((level: string) => levelLabels[level as keyof typeof levelLabels])
    summary.push(`רמה: ${levels.join(', ')}`)
  }
  
  if (filters.location?.length > 0) {
    summary.push(`מיקום: ${filters.location.join(', ')}`)
  }
  
  if (filters.status) {
    const statusLabels = {
      scheduled: 'מתוזמן',
      ongoing: 'מתרחש',
      completed: 'הושלם',
      cancelled: 'בוטל',
      rescheduled: 'נדחה'
    }
    summary.push(`סטטוס: ${statusLabels[filters.status as keyof typeof statusLabels]}`)
  }
  
  if (filters.attendanceRate?.min || filters.attendanceRate?.max) {
    summary.push(`נוכחות: ${filters.attendanceRate.min || 0}%-${filters.attendanceRate.max || 100}%`)
  }
  
  const capabilities = []
  if (filters.hasRecording) capabilities.push('יש הקלטה')
  if (filters.isRecurring) capabilities.push('קבוע')
  if (filters.requiresEquipment) capabilities.push('דורש ציוד')
  if (capabilities.length > 0) {
    summary.push(capabilities.join(', '))
  }
  
  if (filters.dateRange) {
    summary.push(`תאריך: ${new Date(filters.dateRange).toLocaleDateString('he-IL')}`)
  }
  
  return summary
}