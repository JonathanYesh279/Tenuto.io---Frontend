/**
 * Teacher Profile Type Definitions
 * Matches the exact backend schema for teacher data
 */

export interface TeacherPersonalInfo {
  firstName: string
  lastName: string
  fullName?: string // backward compat
  email: string
  phone: string
  address: string
  idNumber?: string
  birthYear?: number
  birthDate?: string
}

export interface TeacherProfessionalInfo {
  instrument?: string // legacy single instrument
  instruments?: string[] // multi-instrument (new)
  isActive?: boolean
  classification?: string
  degree?: string
  hasTeachingCertificate?: boolean
  teachingExperienceYears?: number
  isUnionMember?: boolean
  teachingSubjects?: string[]
}

export interface TeacherManagementInfo {
  role?: string
  managementHours?: number
  accompHours?: number
  ensembleCoordHours?: number
  travelTimeHours?: number
}

export interface TeacherTeaching {
  schedule?: any[]
  timeBlocks?: any[]
}

export interface TeacherConducting {
  orchestraIds?: string[]
  ensemblesIds?: string[]
}

export interface TeacherProfile {
  _id: string
  tenantId?: string
  personalInfo: TeacherPersonalInfo
  roles: string[]
  professionalInfo?: TeacherProfessionalInfo
  managementInfo?: TeacherManagementInfo
  teaching?: TeacherTeaching
  conducting?: TeacherConducting
  ensemblesIds?: string[]
  schoolYears?: string[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface TeacherProfileUpdateData {
  firstName?: string
  lastName?: string
  fullName?: string // backward compat
  email?: string
  phone?: string
  address?: string
  idNumber?: string
  birthYear?: number
  birthDate?: string
  personalInfo?: Partial<TeacherPersonalInfo>
  professionalInfo?: Partial<TeacherProfessionalInfo>
  managementInfo?: Partial<TeacherManagementInfo>
}
