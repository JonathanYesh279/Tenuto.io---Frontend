/**
 * Super Admin Domain Types
 * TypeScript interfaces for all super admin entities.
 * Matches backend response shapes from super-admin.service.js and tenant.service.js
 */

export interface Tenant {
  _id: string
  tenantId?: string
  slug: string
  name: string
  city: string
  isActive: boolean
  director: { name: string | null; teacherId: string | null }
  ministryInfo: { institutionCode: string | null; districtName: string | null }
  settings: { lessonDurations: number[]; schoolStartMonth: number }
  subscription: {
    plan: 'basic' | 'standard' | 'premium'
    startDate: string
    endDate: string | null
    isActive: boolean
    maxTeachers: number
    maxStudents: number
  }
  conservatoryProfile?: Record<string, string | null>
  deletionStatus?: 'scheduled' | 'purging' | 'cancelled'
  deletionScheduledAt?: string
  deletionPurgeAt?: string
  deletionReason?: string
  stats?: {
    teacherCount: number
    studentCount: number
    orchestraCount?: number
    lastAdminLogin?: string | null
    teacherUtilization?: number | null
    studentUtilization?: number | null
  }
  ministryStatus?: {
    latestSnapshotDate: string | null
    completionPercentage: number | null
    snapshotCount: number
  }
  alerts?: Array<{
    type: string
    severity: 'critical' | 'warning' | 'info'
    [key: string]: any
  }>
  createdAt: string
  updatedAt: string
}

export interface SuperAdmin {
  _id: string
  email: string
  name: string
  permissions: Array<'manage_tenants' | 'view_analytics' | 'billing'>
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export interface DeletionPreview {
  tenantId: string
  tenantName: string
  counts: Record<string, number>
}

export interface PlatformAnalytics {
  totalTenants: number
  activeTenants: number
  totalTeachers: number
  totalStudents: number
  subscriptionsByPlan: Record<string, number>
}

export interface ReportingDashboard {
  overview: PlatformAnalytics & {
    totalOrchestras: number
    alertCount: number
  }
  tenantHealth: Tenant[]
  alerts: Array<{ type: string; severity: string; tenantId: string; tenantName: string }>
}

export interface AuditLogEntry {
  _id: string
  action: string
  actorId: string
  actorType: string
  targetType: string
  targetId: string
  details: Record<string, any>
  timestamp: string
  tenantId?: string
}

export interface TenantFormData {
  slug: string
  name: string
  city: string
  director?: {
    name?: string
    teacherId?: string
  }
  ministryInfo?: {
    institutionCode?: string
    districtName?: string
  }
  settings?: {
    lessonDurations?: number[]
    schoolStartMonth?: number
  }
  subscription?: {
    plan?: 'basic' | 'standard' | 'premium'
    maxTeachers?: number
    maxStudents?: number
  }
}
