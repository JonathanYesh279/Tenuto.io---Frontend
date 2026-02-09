/**
 * Teacher Details Types
 * 
 * Type definitions for teacher details page components
 */

export type TeacherTabType = 'personal' | 'students' | 'schedule' | 'conducting'

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
    fullName: string
    phone: string
    email: string
    address: string
  }
  roles: string[]
  professionalInfo: {
    instrument: string
    isActive: boolean
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
    studentIds: string[]
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
  createdAt: string
  updatedAt: string
}