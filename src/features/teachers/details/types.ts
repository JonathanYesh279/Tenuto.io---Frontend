/**
 * Teacher Details Types
 * 
 * Type definitions for teacher details page components
 */

export type TeacherTabType = 'personal' | 'students' | 'schedule' | 'conducting' | 'hours'

export interface TeacherTab {
  id: TeacherTabType
  label: string
  component: () => React.ReactNode
}

export interface TeacherTabNavigationProps {
  activeTab: TeacherTabType
  onTabChange: (tab: TeacherTabType) => void
  tabs: TeacherTab[]
}

export interface TeacherTabContentProps {
  activeTab: TeacherTabType
  teacherId: string
  teacher: any
  isLoading: boolean
}

export interface Teacher {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    phone: string
    email: string
    address: string
    idNumber?: string | null
    birthYear?: number | null
  }
  roles: string[]
  professionalInfo: {
    instrument: string
    instruments?: string[]
    isActive: boolean
    classification?: string | null
    degree?: string | null
    hasTeachingCertificate?: boolean | null
    teachingExperienceYears?: number | null
    isUnionMember?: boolean | null
    teachingSubjects?: string[]
  }
  managementInfo?: {
    role?: string | null
    teachingHours?: number | null
    accompHours?: number | null
    ensembleHours?: number | null
    ensembleCoordHours?: number | null
    theoryHours?: number | null
    managementHours?: number | null
    coordinationHours?: number | null
    breakTimeHours?: number | null
    totalWeeklyHours?: number | null
  }
  isActive: boolean
  conducting: {
    orchestraIds: string[]
    ensemblesIds: string[]
  }
  schoolYears: Array<{
    schoolYearId: string
    isActive: boolean
  }>
  teaching: {
    schedule: any[]
    timeBlocks: any[]
  }
  credentials: {
    email: string
    refreshToken?: string
    password?: string
    passwordSetAt?: string
    lastLogin?: string
  }
  studentCount?: number
  createdAt: string
  updatedAt: string
}