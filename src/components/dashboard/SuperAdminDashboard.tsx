import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import StatsCard from '../ui/StatsCard'
import { superAdminService } from '../../services/apiService'
import type { Tenant, PlatformAnalytics } from '../../types/super-admin.types'
import {
  ArrowsClockwiseIcon,
  BuildingsIcon,
  ChartBarIcon,
  GraduationCapIcon,
  ShieldIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  UsersIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'

interface Alert {
  type: string
  severity: 'critical' | 'warning' | 'info'
  tenantId: string
  tenantName: string
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await superAdminService.getReportingDashboard()
      const dashboard = res?.data || res || {}

      setAnalytics(dashboard.overview || null)
      setTenants(Array.isArray(dashboard.tenantHealth) ? dashboard.tenantHealth : [])
      setAlerts(Array.isArray(dashboard.alerts) ? dashboard.alerts : [])
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
      standard: 'סטנדרטי',
      premium: 'פרימיום',
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
            <ShieldIcon className="w-5 h-5 text-amber-500" />
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
          <ArrowsClockwiseIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
          icon={<BuildingsIcon />}
          color="blue"
        />
        <StatsCard
          title="מוסדות פעילים"
          value={loading ? '...' : String(analytics?.activeTenants ?? tenants.filter(t => t.isActive).length)}
          subtitle="פעילים כרגע"
          icon={<BuildingsIcon />}
          color="green"
        />
        <StatsCard
          title="סה״כ מורים"
          value={loading ? '...' : String(analytics?.totalTeachers ?? 0)}
          subtitle="בכל המוסדות"
          icon={<GraduationCapIcon />}
          color="purple"
        />
        <StatsCard
          title="סה״כ תלמידים"
          value={loading ? '...' : String(analytics?.totalStudents ?? 0)}
          subtitle="בכל המוסדות"
          icon={<UsersIcon />}
          color="orange"
        />
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">התראות</h3>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded border ${
                alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                alert.severity === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <WarningCircleIcon className={`w-5 h-5 flex-shrink-0 ${
                  alert.severity === 'critical' ? 'text-red-500' :
                  alert.severity === 'warning' ? 'text-amber-500' :
                  'text-blue-500'
                }`} />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">{alert.tenantName}</span>
                  {' — '}
                  {alert.type === 'subscription_expiring' ? 'מנוי פג תוקף בקרוב' :
                   alert.type === 'over_limit' ? 'חריגה ממגבלות' :
                   alert.type === 'inactive_tenant' ? 'מוסד לא פעיל' :
                   alert.type}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tenants List */}
      <section className="py-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">מוסדות</h3>
          <Link to="/tenants" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
            הצג הכל ({tenants.length})
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            טוען מוסדות...
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BuildingsIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>לא נמצאו מוסדות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tenants.slice(0, 5).map((tenant) => (
              <div
                key={tenant._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded flex items-center justify-center ${
                    tenant.isActive ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    <BuildingsIcon className={`w-5 h-5 ${
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
                        <GraduationCapIcon className="w-3.5 h-3.5" />
                        {tenant.stats?.teacherCount ?? 0} מורים
                      </span>
                      <span className="flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5" />
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors disabled:opacity-50 ${
                    tenant.isActive
                      ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                      : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                  }`}
                  title={tenant.isActive ? 'השבת מוסד' : 'הפעל מוסד'}
                >
                  {togglingId === tenant._id ? (
                    <ArrowsClockwiseIcon className="w-3.5 h-3.5 animate-spin" />
                  ) : tenant.isActive ? (
                    <ToggleRightIcon className="w-4 h-4" />
                  ) : (
                    <ToggleLeftIcon className="w-4 h-4" />
                  )}
                  {tenant.isActive ? 'השבת' : 'הפעל'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Subscription Distribution */}
      {analytics?.subscriptionsByPlan && Object.keys(analytics.subscriptionsByPlan).length > 0 && (
        <section className="mt-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">התפלגות מנויים</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(analytics.subscriptionsByPlan).map(([plan, count]) => (
              <div key={plan} className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 mt-1">{getPlanLabel(plan)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
