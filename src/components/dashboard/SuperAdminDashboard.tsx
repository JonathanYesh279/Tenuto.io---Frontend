import { useState, useEffect } from 'react'
import { Building2, Users, GraduationCap, BarChart3, RefreshCw, Shield, ChevronLeft, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card } from '../ui/Card'
import StatsCard from '../ui/StatsCard'
import { superAdminService } from '../../services/apiService'

interface TenantWithStats {
  _id: string
  tenantId?: string
  name: string
  slug?: string
  isActive: boolean
  subscription?: {
    plan?: string
    expiresAt?: string
  }
  stats?: {
    teacherCount: number
    studentCount: number
  }
  createdAt?: string
}

interface PlatformAnalytics {
  totalTenants: number
  activeTenants: number
  totalTeachers: number
  totalStudents: number
  subscriptionsByPlan: Record<string, number>
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<TenantWithStats[]>([])
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [tenantsRes, analyticsRes] = await Promise.allSettled([
        superAdminService.getTenants(),
        superAdminService.getAnalytics()
      ])

      if (tenantsRes.status === 'fulfilled') {
        const data = tenantsRes.value?.data || tenantsRes.value || []
        setTenants(Array.isArray(data) ? data : [])
      }

      if (analyticsRes.status === 'fulfilled') {
        const data = analyticsRes.value?.data || analyticsRes.value || null
        setAnalytics(data)
      }
    } catch (err: any) {
      console.error('Failed to load super admin data:', err)
      setError(err.message || 'שגיאה בטעינת נתונים')
    } finally {
      setLoading(false)
    }
  }

  const getPlanLabel = (plan?: string) => {
    const labels: Record<string, string> = {
      basic: 'בסיסי',
      professional: 'מקצועי',
      enterprise: 'ארגוני'
    }
    return labels[plan || 'basic'] || plan || 'בסיסי'
  }

  const handleToggleTenant = async (tenantId: string, currentlyActive: boolean) => {
    const action = currentlyActive ? 'להשבית' : 'להפעיל'
    const tenant = tenants.find(t => t._id === tenantId)
    if (!window.confirm(`האם ${action} את המוסד "${tenant?.name}"?`)) return

    try {
      setTogglingId(tenantId)
      await superAdminService.toggleTenantActive(tenantId)
      setTenants(prev => prev.map(t =>
        t._id === tenantId ? { ...t, isActive: !t.isActive } : t
      ))
    } catch (err: any) {
      console.error('Failed to toggle tenant:', err)
      setError(err.message || 'שגיאה בשינוי סטטוס מוסד')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900">לוח בקרה — מנהל-על</h1>
          </div>
          <p className="text-sm text-gray-600">
            ניהול פלטפורמה | {tenants.length} מוסדות
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          רענן נתונים
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="סה״כ מוסדות"
          value={loading ? '...' : String(analytics?.totalTenants ?? tenants.length)}
          subtitle="פלטפורמה"
          icon={<Building2 />}
          color="blue"
        />
        <StatsCard
          title="מוסדות פעילים"
          value={loading ? '...' : String(analytics?.activeTenants ?? tenants.filter(t => t.isActive).length)}
          subtitle="פעילים כרגע"
          icon={<Building2 />}
          color="green"
        />
        <StatsCard
          title="סה״כ מורים"
          value={loading ? '...' : String(analytics?.totalTeachers ?? 0)}
          subtitle="בכל המוסדות"
          icon={<GraduationCap />}
          color="purple"
        />
        <StatsCard
          title="סה״כ תלמידים"
          value={loading ? '...' : String(analytics?.totalStudents ?? 0)}
          subtitle="בכל המוסדות"
          icon={<Users />}
          color="orange"
        />
      </div>

      {/* Tenants List */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">מוסדות</h3>
          <span className="text-sm text-gray-500">{tenants.length} מוסדות</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            טוען מוסדות...
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>לא נמצאו מוסדות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tenants.map((tenant) => (
              <div
                key={tenant._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tenant.isActive ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    <Building2 className={`w-5 h-5 ${
                      tenant.isActive ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{tenant.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        tenant.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {tenant.isActive ? 'פעיל' : 'מושבת'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {tenant.stats?.teacherCount ?? 0} מורים
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {tenant.stats?.studentCount ?? 0} תלמידים
                      </span>
                      <span className="text-gray-400">|</span>
                      <span>תוכנית: {getPlanLabel(tenant.subscription?.plan)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleTenant(tenant._id, tenant.isActive)
                  }}
                  disabled={togglingId === tenant._id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                    tenant.isActive
                      ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                      : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                  }`}
                  title={tenant.isActive ? 'השבת מוסד' : 'הפעל מוסד'}
                >
                  {togglingId === tenant._id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : tenant.isActive ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                  {tenant.isActive ? 'השבת' : 'הפעל'}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Subscription Distribution */}
      {analytics?.subscriptionsByPlan && Object.keys(analytics.subscriptionsByPlan).length > 0 && (
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">התפלגות מנויים</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(analytics.subscriptionsByPlan).map(([plan, count]) => (
              <div key={plan} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 mt-1">{getPlanLabel(plan)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
