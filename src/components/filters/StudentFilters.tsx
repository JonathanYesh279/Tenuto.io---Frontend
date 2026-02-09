import React from 'react'
import FilterPanel, { FilterGroup, FilterState } from './FilterPanel'
import { VALID_CLASSES, VALID_INSTRUMENTS, VALID_DAYS } from '../../utils/validationUtils'

interface StudentFiltersProps {
  values: FilterState
  onChange: (values: FilterState) => void
  onReset?: () => void
  variant?: 'sidebar' | 'horizontal' | 'modal'
  className?: string
}

// Student-specific filter configurations
const studentFilterGroups: FilterGroup[] = [
  {
    key: 'class',
    label: 'כיתה',
    type: 'multiselect',
    options: VALID_CLASSES.map(cls => ({
      value: cls,
      label: cls,
      count: Math.floor(Math.random() * 20) + 1 // Mock count
    }))
  },
  {
    key: 'instrument',
    label: 'כלי נגינה',
    type: 'multiselect',
    options: VALID_INSTRUMENTS.map(instrument => ({
      value: instrument,
      label: instrument,
      count: Math.floor(Math.random() * 15) + 1 // Mock count
    }))
  },
  {
    key: 'stage',
    label: 'שלב',
    type: 'multiselect',
    options: Array.from({ length: 8 }, (_, i) => ({
      value: String(i + 1),
      label: `שלב ${i + 1}`,
      count: Math.floor(Math.random() * 25) + 1 // Mock count
    }))
  },
  {
    key: 'status',
    label: 'סטטוס',
    type: 'select',
    options: [
      { value: 'active', label: 'פעיל', count: 150 },
      { value: 'inactive', label: 'לא פעיל', count: 23 },
      { value: 'graduated', label: 'בוגר', count: 45 },
      { value: 'suspended', label: 'מושעה', count: 3 }
    ]
  },
  {
    key: 'age',
    label: 'גיל',
    type: 'range',
    min: 5,
    max: 18
  },
  {
    key: 'hasActiveViolationProgram',
    label: 'תכנית בגרות פעילה',
    type: 'boolean'
  },
  {
    key: 'attendanceRate',
    label: 'אחוז נוכחות',
    type: 'range',
    min: 0,
    max: 100
  },
  {
    key: 'enrollmentDate',
    label: 'תאריך הרשמה',
    type: 'date'
  }
]

const StudentFilters: React.FC<StudentFiltersProps> = ({
  values,
  onChange,
  onReset,
  variant = 'sidebar',
  className = ''
}) => {
  return (
    <FilterPanel
      filters={studentFilterGroups}
      values={values}
      onChange={onChange}
      onReset={onReset}
      variant={variant}
      collapsible={variant === 'sidebar'}
      className={className}
    />
  )
}

export default StudentFilters

// Export utility functions for student filtering
export const getStudentFilterDefaults = (): FilterState => ({
  class: [],
  instrument: [],
  stage: [],
  status: '',
  age: { min: 5, max: 18 },
  hasActiveViolationProgram: false,
  attendanceRate: { min: 0, max: 100 },
  enrollmentDate: ''
})

export const applyStudentFilters = (students: any[], filters: FilterState) => {
  return students.filter(student => {
    // Class filter
    if (filters.class?.length > 0 && !filters.class.includes(student.academicInfo?.class)) {
      return false
    }
    
    // Instrument filter
    if (filters.instrument?.length > 0 && !filters.instrument.includes(student.professionalInfo?.instrument)) {
      return false
    }
    
    // Stage filter
    if (filters.stage?.length > 0 && !filters.stage.includes(String(student.academicInfo?.stage))) {
      return false
    }
    
    // Status filter
    if (filters.status && student.status !== filters.status) {
      return false
    }
    
    // Age filter
    if (filters.age?.min && student.personalInfo?.age < filters.age.min) {
      return false
    }
    if (filters.age?.max && student.personalInfo?.age > filters.age.max) {
      return false
    }
    
    // Bagrut program filter
    if (filters.hasActiveViolationProgram && !student.bagrut?.isActive) {
      return false
    }
    
    // Attendance rate filter
    if (filters.attendanceRate?.min && (student.stats?.attendanceRate || 0) < filters.attendanceRate.min) {
      return false
    }
    if (filters.attendanceRate?.max && (student.stats?.attendanceRate || 0) > filters.attendanceRate.max) {
      return false
    }
    
    // Enrollment date filter
    if (filters.enrollmentDate) {
      const enrollmentDate = new Date(student.personalInfo?.enrollmentDate)
      const filterDate = new Date(filters.enrollmentDate)
      if (enrollmentDate.getTime() !== filterDate.getTime()) {
        return false
      }
    }
    
    return true
  })
}

// Get active filter summary for display
export const getStudentFilterSummary = (filters: FilterState): string[] => {
  const summary: string[] = []
  
  if (filters.class?.length > 0) {
    summary.push(`כיתות: ${filters.class.join(', ')}`)
  }
  
  if (filters.instrument?.length > 0) {
    summary.push(`כלי נגינה: ${filters.instrument.join(', ')}`)
  }
  
  if (filters.stage?.length > 0) {
    summary.push(`שלבים: ${filters.stage.map((s: string) => `שלב ${s}`).join(', ')}`)
  }
  
  if (filters.status) {
    const statusLabels = {
      active: 'פעיל',
      inactive: 'לא פעיל',
      graduated: 'בוגר',
      suspended: 'מושעה'
    }
    summary.push(`סטטוס: ${statusLabels[filters.status as keyof typeof statusLabels]}`)
  }
  
  if (filters.age?.min || filters.age?.max) {
    summary.push(`גיל: ${filters.age.min || 5}-${filters.age.max || 18}`)
  }
  
  if (filters.hasActiveViolationProgram) {
    summary.push('תכנית בגרות פעילה')
  }
  
  if (filters.attendanceRate?.min || filters.attendanceRate?.max) {
    summary.push(`נוכחות: ${filters.attendanceRate.min || 0}%-${filters.attendanceRate.max || 100}%`)
  }
  
  if (filters.enrollmentDate) {
    summary.push(`הרשמה: ${new Date(filters.enrollmentDate).toLocaleDateString('he-IL')}`)
  }
  
  return summary
}