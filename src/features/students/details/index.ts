/**
 * Student Details Feature - Barrel Export
 * 
 * Central export point for all student details feature components,
 * hooks, types, and utilities for clean imports throughout the app.
 */

// Main Components
export { default as StudentDetailsPage } from './components/StudentDetailsPage'
export { default as StudentDetailsHeader } from './components/StudentDetailsHeader'
export { default as StudentTabNavigation } from './components/StudentTabNavigation'
export { default as StudentTabContent } from './components/StudentTabContent'
export { default as StudentDetailsErrorBoundary } from './components/StudentDetailsErrorBoundary'

// Tab Components
export { default as PersonalInfoTab } from './components/tabs/PersonalInfoTab'
export { default as AcademicInfoTab } from './components/tabs/AcademicInfoTab'
export { default as ScheduleTab } from './components/tabs/ScheduleTab'
export { default as AttendanceTab } from './components/tabs/AttendanceTab'
export { default as OrchestraTab } from './components/tabs/OrchestraTab'
export { default as TheoryTab } from './components/tabs/TheoryTab'
export { default as DocumentsTab } from './components/tabs/DocumentsTab'

// Hooks
export {
  useStudentDetails,
  useStudentSchedule,
  useStudentAttendance,
  useUpdateStudentPersonalInfo,
  useUpdateStudentAcademicInfo,
  usePrefetchStudentDetails,
  useInvalidateStudentDetails,
  studentDetailsQueryKeys
} from './hooks'

// Types
export type {
  // Main types
  StudentDetails,
  PersonalInfo,
  ParentsInfo,
  AcademicInfo,
  InstrumentProgress,
  TeacherAssignment,
  OrchestraEnrollment,
  TheoryClass,
  AttendanceRecord,
  AttendanceStatistics,
  Document,
  LessonSchedule,
  
  // Tab-specific data types
  PersonalInfoTabData,
  AcademicInfoTabData,
  ScheduleTabData,
  AttendanceTabData,
  OrchestraTabData,
  TheoryTabData,
  DocumentsTabData,
  
  // Navigation types
  TabType,
  TabConfig,
  
  // API types
  ApiResponse,
  StudentDetailsResponse,
  StudentDetailsError,
  
  // Hook return types
  UseStudentDetailsResult,
  UseStudentScheduleResult,
  UseStudentAttendanceResult,
  
  // Component prop types
  StudentDetailsPageProps,
  StudentDetailsHeaderProps,
  StudentTabNavigationProps,
  StudentTabContentProps,
  
  // Form types
  EditPersonalInfoData,
  EditAcademicInfoData,
  
  // Utility types
  StudentDetailsField,
  PartialStudentDetails
} from './types'