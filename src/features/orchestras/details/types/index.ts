export type OrchestraTabType = 'personal' | 'members' | 'schedule'

export interface OrchestraTab {
  id: OrchestraTabType
  label: string
  component: React.ComponentType
}

export interface Orchestra {
  _id: string
  tenantId?: string
  name: string
  type: 'תזמורת' | 'הרכב'
  // Backend valid values: 'תזמורת מיתרים','תזמורת נשיפה','תזמורת סימפונית',
  // 'תזמורת קאמרית','הרכב מיתרים','הרכב נשיפה','הרכב מעורב','הרכב הקשה','הרכב גיטרות'
  subType?: string
  performanceLevel?: 'התחלתי' | 'ביניים' | 'ייצוגי'
  conductorId: string
  memberIds: string[]
  rehearsalIds: string[] // references separate rehearsal collection
  schoolYearId: string
  location: string
  ministryData?: {
    coordinationHours?: number
    totalReportingHours?: number
    ministryUseCode?: number
  }
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface OrchestraMember {
  _id: string
  personalInfo: {
    firstName: string
    lastName: string
    fullName?: string // backward compat
    phone?: string
    studentEmail?: string
  }
  academicInfo: {
    class?: string
    instrumentProgress?: {
      instrumentName: string
      currentStage: string
      isPrimary: boolean
    }[]
  }
  primaryInstrument?: string
  isActive: boolean
}

export interface OrchestraConductor {
  _id: string
  personalInfo: {
    firstName: string
    lastName: string
    fullName?: string // backward compat
    email?: string
    phone?: string
  }
  professionalInfo?: {
    instrument?: string
    instruments?: string[]
  }
  roles?: string[]
  isActive: boolean
}

export interface OrchestraRehearsal {
  _id: string
  groupId: string
  date: string
  startTime: string
  endTime: string
  location: string
  attendance?: {
    present: string[]
    absent: string[]
  }
  notes?: string
}

export interface OrchestraDetailsProps {
  orchestraId: string
  orchestra: Orchestra | null
  isLoading: boolean
  onUpdate?: () => void
}

export interface OrchestraTabProps extends OrchestraDetailsProps {
  activeTab: OrchestraTabType
}