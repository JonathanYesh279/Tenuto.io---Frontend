/**
 * Reusable Components Index
 * 
 * Central export file for all reusable components with consistent Hebrew/RTL styling
 */

// Reusable Display Components
export { default as StudentCard } from './StudentCard'
export { default as TeacherCard } from './TeacherCard'
export { default as LessonSlot } from './LessonSlot'
export { default as InstrumentProgress } from './InstrumentProgress'
export { default as TeacherNameDisplay } from './TeacherNameDisplay'

// Form Components
export { default as StudentForm } from './StudentForm'
export { default as TeacherForm } from './TeacherForm'
export { default as TheoryLessonForm } from './TheoryLessonForm'

// UI Components
export { default as Card } from './ui/Card'
export { default as Table } from './ui/Table'
export { default as StatsCard } from './ui/StatsCard'
export { default as Calendar } from './ui/Calendar'

// Schedule Components
export { default as WeeklyStudentCalendar } from './schedule/WeeklyStudentCalendar'
export { default as WeeklyCalendarGrid } from './schedule/WeeklyCalendarGrid'

// Orchestra Management Components
export { default as OrchestraEnrollmentManager } from './OrchestraEnrollmentManager'

// Layout Components
export { default as Layout } from './Layout'
export { default as Header } from './Header'
export { default as Sidebar } from './Sidebar'

// Legacy Components (to be replaced)
export { default as TheoryLessonCard } from './TheoryLessonCard'

// Type definitions for component props
export type { default as StudentCardProps } from './StudentCard'
export type { default as TeacherCardProps } from './TeacherCard'
export type { default as LessonSlotProps } from './LessonSlot'
export type { default as InstrumentProgressProps } from './InstrumentProgress'