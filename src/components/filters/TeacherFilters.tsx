import React from 'react'
import FilterPanel, { FilterGroup, FilterState } from './FilterPanel'
import { VALID_INSTRUMENTS } from '../../utils/validationUtils'

interface TeacherFiltersProps {
  values: FilterState
  onChange: (values: FilterState) => void
  onReset?: () => void
  variant?: 'sidebar' | 'horizontal' | 'modal'
  className?: string
}

// Teacher-specific filter configurations
const teacherFilterGroups: FilterGroup[] = [
  {
    key: 'specialization',
    label: 'התמחות',
    type: 'multiselect',
    options: [
      ...VALID_INSTRUMENTS.map(instrument => ({
        value: instrument,
        label: instrument,
        count: Math.floor(Math.random() * 5) + 1
      })),
      { value: 'theory', label: 'תיאוריה', count: 8 },
      { value: 'conducting', label: 'ניצוח', count: 3 },
      { value: 'composition', label: 'חיבור', count: 2 }
    ]
  },
  {
    key: 'employment',
    label: 'סוג העסקה',
    type: 'select',
    options: [
      { value: 'full-time', label: 'משרה מלאה', count: 25 },
      { value: 'part-time', label: 'משרה חלקית', count: 18 },
      { value: 'freelance', label: 'עצמאי', count: 12 },
      { value: 'substitute', label: 'מחליף', count: 5 }
    ]
  },
  {
    key: 'degree',
    label: 'השכלה',
    type: 'multiselect',
    options: [
      { value: 'bachelor', label: 'תואר ראשון', count: 35 },
      { value: 'master', label: 'תואר שני', count: 20 },
      { value: 'doctorate', label: 'דוקטורט', count: 8 },
      { value: 'certificate', label: 'תעודה', count: 15 }
    ]
  },
  {
    key: 'experience',
    label: 'ותק (שנים)',
    type: 'range',
    min: 0,
    max: 40
  },
  {
    key: 'teachingLoad',
    label: 'עומס הוראה (שעות שבועיות)',
    type: 'range',
    min: 1,
    max: 40
  },
  {
    key: 'status',
    label: 'סטטוס',
    type: 'select',
    options: [
      { value: 'active', label: 'פעיל', count: 45 },
      { value: 'inactive', label: 'לא פעיל', count: 8 },
      { value: 'sabbatical', label: 'חופש שבתון', count: 3 },
      { value: 'retired', label: 'פנסיונר', count: 2 }
    ]
  },
  {
    key: 'canTeachTheory',
    label: 'מלמד תיאוריה',
    type: 'boolean'
  },
  {
    key: 'canConduct',
    label: 'מנצח',
    type: 'boolean'
  },
  {
    key: 'canTeachEnsemble',
    label: 'מלמד הרכבים',
    type: 'boolean'
  },
  {
    key: 'hireDateRange',
    label: 'תאריך קבלה לעבודה',
    type: 'date'
  }
]

const TeacherFilters: React.FC<TeacherFiltersProps> = ({
  values,
  onChange,
  onReset,
  variant = 'sidebar',
  className = ''
}) => {
  return (
    <FilterPanel
      filters={teacherFilterGroups}
      values={values}
      onChange={onChange}
      onReset={onReset}
      variant={variant}
      collapsible={variant === 'sidebar'}
      className={className}
    />
  )
}

export default TeacherFilters

// Export utility functions for teacher filtering
export const getTeacherFilterDefaults = (): FilterState => ({
  specialization: [],
  employment: '',
  degree: [],
  experience: { min: 0, max: 40 },
  teachingLoad: { min: 1, max: 40 },
  status: '',
  canTeachTheory: false,
  canConduct: false,
  canTeachEnsemble: false,
  hireDateRange: ''
})

export const applyTeacherFilters = (teachers: any[], filters: FilterState) => {
  return teachers.filter(teacher => {
    // Specialization filter
    if (filters.specialization?.length > 0) {
      const teacherSpecializations = teacher.professionalInfo?.specializations || []
      const hasMatchingSpecialization = filters.specialization.some((spec: string) => 
        teacherSpecializations.includes(spec)
      )
      if (!hasMatchingSpecialization) return false
    }
    
    // Employment filter
    if (filters.employment && teacher.professionalInfo?.employment !== filters.employment) {
      return false
    }
    
    // Degree filter
    if (filters.degree?.length > 0) {
      const teacherDegrees = teacher.professionalInfo?.degrees || []
      const hasMatchingDegree = filters.degree.some((degree: string) => 
        teacherDegrees.includes(degree)
      )
      if (!hasMatchingDegree) return false
    }
    
    // Experience filter
    if (filters.experience?.min && (teacher.professionalInfo?.experienceYears || 0) < filters.experience.min) {
      return false
    }
    if (filters.experience?.max && (teacher.professionalInfo?.experienceYears || 0) > filters.experience.max) {
      return false
    }
    
    // Teaching load filter
    if (filters.teachingLoad?.min && (teacher.schedule?.weeklyHours || 0) < filters.teachingLoad.min) {
      return false
    }
    if (filters.teachingLoad?.max && (teacher.schedule?.weeklyHours || 0) > filters.teachingLoad.max) {
      return false
    }
    
    // Status filter
    if (filters.status && teacher.status !== filters.status) {
      return false
    }
    
    // Capability filters
    if (filters.canTeachTheory && !teacher.professionalInfo?.capabilities?.canTeachTheory) {
      return false
    }
    if (filters.canConduct && !teacher.professionalInfo?.capabilities?.canConduct) {
      return false
    }
    if (filters.canTeachEnsemble && !teacher.professionalInfo?.capabilities?.canTeachEnsemble) {
      return false
    }
    
    // Hire date filter
    if (filters.hireDateRange) {
      const hireDate = new Date(teacher.professionalInfo?.hireDate)
      const filterDate = new Date(filters.hireDateRange)
      if (hireDate.getTime() !== filterDate.getTime()) {
        return false
      }
    }
    
    return true
  })
}

// Get active filter summary for display
export const getTeacherFilterSummary = (filters: FilterState): string[] => {
  const summary: string[] = []
  
  if (filters.specialization?.length > 0) {
    summary.push(`התמחות: ${filters.specialization.join(', ')}`)
  }
  
  if (filters.employment) {
    const employmentLabels = {
      'full-time': 'משרה מלאה',
      'part-time': 'משרה חלקית',
      'freelance': 'עצמאי',
      'substitute': 'מחליף'
    }
    summary.push(`העסקה: ${employmentLabels[filters.employment as keyof typeof employmentLabels]}`)
  }
  
  if (filters.degree?.length > 0) {
    const degreeLabels = {
      bachelor: 'תואר ראשון',
      master: 'תואר שני',
      doctorate: 'דוקטורט',
      certificate: 'תעודה'
    }
    const degrees = filters.degree.map((deg: string) => degreeLabels[deg as keyof typeof degreeLabels])
    summary.push(`השכלה: ${degrees.join(', ')}`)
  }
  
  if (filters.experience?.min || filters.experience?.max) {
    summary.push(`ותק: ${filters.experience.min || 0}-${filters.experience.max || 40} שנים`)
  }
  
  if (filters.teachingLoad?.min || filters.teachingLoad?.max) {
    summary.push(`עומס: ${filters.teachingLoad.min || 1}-${filters.teachingLoad.max || 40} שעות`)
  }
  
  if (filters.status) {
    const statusLabels = {
      active: 'פעיל',
      inactive: 'לא פעיל',
      sabbatical: 'חופש שבתון',
      retired: 'פנסיונר'
    }
    summary.push(`סטטוס: ${statusLabels[filters.status as keyof typeof statusLabels]}`)
  }
  
  const capabilities = []
  if (filters.canTeachTheory) capabilities.push('תיאוריה')
  if (filters.canConduct) capabilities.push('ניצוח')
  if (filters.canTeachEnsemble) capabilities.push('הרכבים')
  if (capabilities.length > 0) {
    summary.push(`יכולות: ${capabilities.join(', ')}`)
  }
  
  if (filters.hireDateRange) {
    summary.push(`קבלה לעבודה: ${new Date(filters.hireDateRange).toLocaleDateString('he-IL')}`)
  }
  
  return summary
}