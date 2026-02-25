import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../services/authContext.jsx'
import { superAdminService } from '../../services/apiService'
import { ConfirmDeleteDialog } from '../../components/ui/ConfirmDeleteDialog'
import type { Tenant } from '../../types/super-admin.types'
import {
  ArrowsClockwiseIcon,
  BuildingsIcon,
  GraduationCapIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  ShieldIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  TrashIcon,
  UserSwitchIcon,
  UsersIcon,
} from '@phosphor-icons/react'

const getPlanLabel = (plan?: string) => {
  const labels: Record<string, string> = { basic: 'בסיסי', standard: 'סטנדרטי', premium: 'פרימיום' }
  return labels[plan || 'basic'] || plan || 'בסיסי'
}

export default function TenantListPage() {
  const navigate = useNavigate()
  const { startImpersonation } = useAuth()

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null)
  const [softDeleting, setSoftDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await superAdminService.getTenants()
      const data = res?.data || res || []
      setTenants(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Failed to load tenants:', err)
      setError(err.message || 'שגיאה בטעינת מוסדות')
    } finally {
      setLoading(false)
    }
  }

  const filteredTenants = useMemo(() => {
    if (!searchQuery.trim()) return tenants
    const q = searchQuery.trim().toLowerCase()
    return tenants.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.slug?.toLowerCase().includes(q) ||
      t.city?.toLowerCase().includes(q)
    )
  }, [tenants, searchQuery])

  const handleToggleActive = async (tenantId: string, isActive: boolean) => {
    const action = isActive ? 'להשבית' : 'להפעיל'
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

  const handleImpersonate = async (tenantId: string) => {
    try {
      setError(null)
      await startImpersonation(tenantId)
    } catch (err: any) {
      console.error('Failed to start impersonation:', err)
      setError(err.message || 'שגיאה בכניסה למוסד')
    }
  }

  const handleSoftDelete = async () => {
    if (!deletingTenant) return
    try {
      setSoftDeleting(true)
      await superAdminService.softDeleteTenant(deletingTenant._id)
      setDeletingTenant(null)
      await loadData()
    } catch (err: any) {
      console.error('Failed to soft-delete tenant:', err)
      setError(err.message || 'שגיאה בתזמון מחיקת מוסד')
    } finally {
      setSoftDeleting(false)
    }
  }

  const handleEdit = (tenantId: string) => {
    navigate(`/tenants/${tenantId}/edit`)
  }

  const handleViewDetail = (tenantId: string) => {
    navigate(`/tenants/${tenantId}`)
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldIcon className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900">ניהול מוסדות</h1>
          </div>
          <p className="text-sm text-gray-600">
            {loading ? 'טוען...' : `${filteredTenants.length} מוסדות`}
            {searchQuery && !loading && ` (מתוך ${tenants.length})`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="רענן נתונים"
          >
            <ArrowsClockwiseIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            רענן
          </button>
          <button
            onClick={() => navigate('/tenants/new')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            הוסף מוסד
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חפש מוסד..."
          className="w-full pr-10 pl-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tenant List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          טוען מוסדות...
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BuildingsIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>{searchQuery ? 'לא נמצאו מוסדות התואמים לחיפוש' : 'לא נמצאו מוסדות'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTenants.map((tenant) => (
            <div
              key={tenant._id}
              onClick={() => handleViewDetail(tenant._id)}
              className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {/* Left side: tenant info */}
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${
                  tenant.isActive ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                  <BuildingsIcon className={`w-5 h-5 ${
                    tenant.isActive ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{tenant.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tenant.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {tenant.isActive ? 'פעיל' : 'מושבת'}
                    </span>
                    {tenant.deletionStatus === 'scheduled' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        ממתין למחיקה
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
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
                    {tenant.city && (
                      <>
                        <span className="text-gray-400">|</span>
                        <span>{tenant.city}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side: action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 mr-4">
                {/* Edit */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(tenant._id)
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="ערוך מוסד"
                >
                  <PencilSimpleIcon className="w-4 h-4" />
                </button>

                {/* Impersonate — only for active tenants */}
                {tenant.isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleImpersonate(tenant._id)
                    }}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                    title="היכנס כמנהל מוסד"
                  >
                    <UserSwitchIcon className="w-4 h-4" />
                  </button>
                )}

                {/* Toggle active */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleActive(tenant._id, tenant.isActive)
                  }}
                  disabled={togglingId === tenant._id}
                  className={`p-2 rounded transition-colors disabled:opacity-50 ${
                    tenant.isActive
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={tenant.isActive ? 'השבת מוסד' : 'הפעל מוסד'}
                >
                  {togglingId === tenant._id ? (
                    <ArrowsClockwiseIcon className="w-4 h-4 animate-spin" />
                  ) : tenant.isActive ? (
                    <ToggleRightIcon className="w-4 h-4" />
                  ) : (
                    <ToggleLeftIcon className="w-4 h-4" />
                  )}
                </button>

                {/* Delete — disabled if already scheduled */}
                {tenant.deletionStatus === 'scheduled' ? (
                  <span className="p-2 text-gray-400 cursor-not-allowed" title="המוסד כבר ממתין למחיקה">
                    <TrashIcon className="w-4 h-4" />
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingTenant(tenant)
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="מחק מוסד"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!deletingTenant}
        onOpenChange={(open) => !open && setDeletingTenant(null)}
        title="מחיקת מוסד"
        description="פעולה זו תתזמן את המוסד למחיקה. ניתן לבטל תוך תקופת חסד."
        itemName={deletingTenant?.name}
        consequences={[
          `${deletingTenant?.stats?.teacherCount ?? 0} מורים יימחקו`,
          `${deletingTenant?.stats?.studentCount ?? 0} תלמידים יימחקו`,
          'כל הנתונים הקשורים יימחקו לצמיתות לאחר תקופת החסד'
        ]}
        confirmText="תזמן מחיקה"
        onConfirm={handleSoftDelete}
        isLoading={softDeleting}
        variant="warning"
      />
    </div>
  )
}
