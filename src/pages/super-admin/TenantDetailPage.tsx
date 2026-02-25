import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { useAuth } from '../../services/authContext.jsx'
import { superAdminService } from '../../services/apiService'
import { ConfirmDeleteDialog } from '../../components/ui/ConfirmDeleteDialog'
import Modal from '../../components/ui/Modal'
import type { Tenant, DeletionPreview } from '../../types/super-admin.types'
import {
  BuildingsIcon,
  CalendarIcon,
  CaretLeftIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  MusicNotesIcon,
  PencilSimpleIcon,
  ShieldIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  TrashIcon,
  UserSwitchIcon,
  UsersIcon,
  WarningCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react'
import { format } from 'date-fns'

const getPlanLabel = (plan?: string) => {
  const labels: Record<string, string> = { basic: 'בסיסי', standard: 'סטנדרטי', premium: 'פרימיום' }
  return labels[plan || 'basic'] || plan || 'בסיסי'
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'לא הוגדר'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy')
  } catch {
    return 'לא הוגדר'
  }
}

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const navigate = useNavigate()
  const { startImpersonation } = useAuth()

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPurgeDialog, setShowPurgeDialog] = useState(false)
  const [purgeConfirmName, setPurgeConfirmName] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadTenant = useCallback(async () => {
    if (!tenantId) return
    try {
      setLoading(true)
      setError(null)
      const res = await superAdminService.getTenant(tenantId)
      const data = res?.data || res || null
      setTenant(data)
    } catch (err: any) {
      console.error('Failed to load tenant:', err)
      setError(err.message || 'שגיאה בטעינת פרטי מוסד')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadTenant()
  }, [loadTenant])

  // --- Action handlers ---

  const handleToggleActive = async () => {
    if (!tenantId) return
    try {
      setActionLoading('toggle')
      setError(null)
      await superAdminService.toggleTenantActive(tenantId)
      setTenant(prev => prev ? { ...prev, isActive: !prev.isActive } : prev)
    } catch (err: any) {
      console.error('Failed to toggle tenant:', err)
      setError(err.message || 'שגיאה בשינוי סטטוס מוסד')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteClick = async () => {
    if (!tenantId) return
    try {
      setActionLoading('delete-preview')
      setError(null)
      const res = await superAdminService.getDeletionPreview(tenantId)
      const preview = res?.data || res || null
      setDeletionPreview(preview)
      setShowDeleteDialog(true)
    } catch (err: any) {
      console.error('Failed to get deletion preview:', err)
      setError(err.message || 'שגיאה בטעינת תצוגה מקדימה למחיקה')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSoftDelete = async () => {
    if (!tenantId) return
    try {
      setActionLoading('delete')
      setError(null)
      await superAdminService.softDeleteTenant(tenantId)
      setShowDeleteDialog(false)
      await loadTenant()
    } catch (err: any) {
      console.error('Failed to soft-delete tenant:', err)
      setError(err.message || 'שגיאה בתזמון מחיקת מוסד')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePurge = async () => {
    if (!tenantId || !tenant) return
    try {
      setActionLoading('purge')
      setError(null)
      await superAdminService.purgeTenant(tenantId, purgeConfirmName)
      navigate('/tenants')
    } catch (err: any) {
      console.error('Failed to purge tenant:', err)
      setError(err.message || 'שגיאה במחיקה לצמיתות')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelDeletion = async () => {
    if (!tenantId) return
    try {
      setActionLoading('cancel-deletion')
      setError(null)
      await superAdminService.cancelDeletion(tenantId)
      await loadTenant()
    } catch (err: any) {
      console.error('Failed to cancel deletion:', err)
      setError(err.message || 'שגיאה בביטול מחיקה')
    } finally {
      setActionLoading(null)
    }
  }

  const handleImpersonate = async () => {
    if (!tenantId) return
    try {
      setActionLoading('impersonate')
      setError(null)
      await startImpersonation(tenantId)
    } catch (err: any) {
      console.error('Failed to start impersonation:', err)
      setError(err.message || 'שגיאה בכניסה למוסד')
    } finally {
      setActionLoading(null)
    }
  }

  // --- Render ---

  if (loading) {
    return (
      <div dir="rtl" className="text-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        טוען פרטי מוסד...
      </div>
    )
  }

  if (!tenant) {
    return (
      <div dir="rtl" className="text-center py-12 text-gray-500">
        <BuildingsIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>המוסד לא נמצא</p>
        <button
          onClick={() => navigate('/tenants')}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          חזרה לרשימת מוסדות
        </button>
      </div>
    )
  }

  const completionPct = tenant.ministryStatus?.completionPercentage
  const completionColor = completionPct == null
    ? 'text-gray-400'
    : completionPct > 80
      ? 'text-green-600'
      : completionPct > 50
        ? 'text-amber-600'
        : 'text-red-600'

  return (
    <div dir="rtl">
      {/* Back link */}
      <button
        onClick={() => navigate('/tenants')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <CaretLeftIcon className="w-4 h-4" />
        חזרה לרשימת מוסדות
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
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
            {tenant.deletionStatus === 'purging' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                מחיקה בתהליך
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{tenant.slug}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Edit */}
          <button
            onClick={() => navigate(`/tenants/${tenantId}/edit`)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-blue-600"
          >
            <PencilSimpleIcon className="w-4 h-4" />
            עריכה
          </button>

          {/* Impersonate */}
          <button
            onClick={handleImpersonate}
            disabled={!tenant.isActive || actionLoading === 'impersonate'}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-amber-50 text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!tenant.isActive ? 'לא ניתן להתחבר למוסד מושבת' : 'התחבר כמוסד'}
          >
            <UserSwitchIcon className="w-4 h-4" />
            {actionLoading === 'impersonate' ? 'מתחבר...' : 'התחבר כמוסד'}
          </button>

          {/* Toggle Active */}
          <button
            onClick={handleToggleActive}
            disabled={actionLoading === 'toggle'}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-50 ${
              tenant.isActive
                ? 'hover:bg-red-50 text-red-600'
                : 'hover:bg-green-50 text-green-600'
            }`}
          >
            {tenant.isActive ? (
              <ToggleRightIcon className="w-4 h-4" />
            ) : (
              <ToggleLeftIcon className="w-4 h-4" />
            )}
            {actionLoading === 'toggle' ? 'מעדכן...' : tenant.isActive ? 'השבת' : 'הפעל'}
          </button>

          {/* Delete / Manage Deletion */}
          {!tenant.deletionStatus && (
            <button
              onClick={handleDeleteClick}
              disabled={actionLoading === 'delete-preview'}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              {actionLoading === 'delete-preview' ? 'טוען...' : 'מחק מוסד'}
            </button>
          )}

          {tenant.deletionStatus === 'scheduled' && (
            <>
              <button
                onClick={handleCancelDeletion}
                disabled={actionLoading === 'cancel-deletion'}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-green-50 text-green-600 disabled:opacity-50"
              >
                {actionLoading === 'cancel-deletion' ? 'מבטל...' : 'בטל מחיקה'}
              </button>
              <button
                onClick={() => { setPurgeConfirmName(''); setShowPurgeDialog(true) }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <TrashIcon className="w-4 h-4" />
                מחק לצמיתות
              </button>
            </>
          )}

          {tenant.deletionStatus === 'purging' && (
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
            >
              <TrashIcon className="w-4 h-4" />
              מחיקה בתהליך...
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Info sections grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Section 1: General Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <BuildingsIcon className="w-5 h-5 text-blue-600" />
            פרטים כלליים
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">שם</dt>
              <dd className="text-sm font-medium text-gray-900">{tenant.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">מזהה (slug)</dt>
              <dd className="text-sm font-medium text-gray-900 font-mono" dir="ltr">{tenant.slug}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">עיר</dt>
              <dd className="text-sm font-medium text-gray-900">{tenant.city}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">שם המנהל</dt>
              <dd className="text-sm font-medium text-gray-900">{tenant.director?.name || 'לא הוגדר'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">קוד מוסד</dt>
              <dd className="text-sm font-medium text-gray-900">{tenant.ministryInfo?.institutionCode || 'לא הוגדר'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">מחוז</dt>
              <dd className="text-sm font-medium text-gray-900">{tenant.ministryInfo?.districtName || 'לא הוגדר'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">תאריך יצירה</dt>
              <dd className="text-sm font-medium text-gray-900">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(tenant.createdAt)}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Section 2: Subscription */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <ShieldIcon className="w-5 h-5 text-purple-600" />
            מנוי
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">תוכנית</dt>
              <dd className="text-sm font-medium text-gray-900">{getPlanLabel(tenant.subscription?.plan)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">סטטוס מנוי</dt>
              <dd>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  tenant.subscription?.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {tenant.subscription?.isActive ? 'פעיל' : 'לא פעיל'}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">תאריך התחלה</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(tenant.subscription?.startDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">תאריך סיום</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(tenant.subscription?.endDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">מקסימום מורים</dt>
              <dd className="text-sm font-medium text-gray-900">{tenant.subscription?.maxTeachers ?? 'ללא הגבלה'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">מקסימום תלמידים</dt>
              <dd className="text-sm font-medium text-gray-900">{tenant.subscription?.maxStudents ?? 'ללא הגבלה'}</dd>
            </div>
          </dl>
        </div>

        {/* Section 3: Usage Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <UsersIcon className="w-5 h-5 text-green-600" />
            נתוני שימוש
          </h2>
          <dl className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <dt className="text-sm text-gray-500 flex items-center gap-1">
                  <GraduationCapIcon className="w-3.5 h-3.5" />
                  מורים
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {tenant.stats?.teacherCount ?? 0}
                  {tenant.subscription?.maxTeachers ? ` / ${tenant.subscription.maxTeachers}` : ''}
                </dd>
              </div>
              {tenant.stats?.teacherUtilization != null && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, tenant.stats.teacherUtilization)}%` }}
                  />
                </div>
              )}
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <dt className="text-sm text-gray-500 flex items-center gap-1">
                  <UsersIcon className="w-3.5 h-3.5" />
                  תלמידים
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {tenant.stats?.studentCount ?? 0}
                  {tenant.subscription?.maxStudents ? ` / ${tenant.subscription.maxStudents}` : ''}
                </dd>
              </div>
              {tenant.stats?.studentUtilization != null && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, tenant.stats.studentUtilization)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 flex items-center gap-1">
                <MusicNotesIcon className="w-3.5 h-3.5" />
                תזמורות
              </dt>
              <dd className="text-sm font-medium text-gray-900">{tenant.stats?.orchestraCount ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">כניסה אחרונה של מנהל</dt>
              <dd className="text-sm font-medium text-gray-900">
                {tenant.stats?.lastAdminLogin ? formatDate(tenant.stats.lastAdminLogin) : 'לא נרשם'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Section 4: Ministry Report Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <CalendarIcon className="w-5 h-5 text-amber-600" />
            דוחות משרד החינוך
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">תאריך דוח אחרון</dt>
              <dd className="text-sm font-medium text-gray-900">
                {tenant.ministryStatus?.latestSnapshotDate
                  ? formatDate(tenant.ministryStatus.latestSnapshotDate)
                  : 'אין דוחות'}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-gray-500">אחוז השלמה</dt>
              <dd className={`text-sm font-medium ${completionColor}`}>
                {completionPct != null ? (
                  <span className="flex items-center gap-1">
                    {completionPct > 80 ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : completionPct < 50 ? (
                      <XCircleIcon className="w-4 h-4" />
                    ) : (
                      <WarningCircleIcon className="w-4 h-4" />
                    )}
                    {completionPct}%
                  </span>
                ) : 'אין נתונים'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">סך הכל דוחות</dt>
              <dd className="text-sm font-medium text-gray-900">{tenant.ministryStatus?.snapshotCount ?? 0}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Section 5: Health Alerts */}
      {tenant.alerts && tenant.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <WarningCircleIcon className="w-5 h-5 text-red-500" />
            התראות
          </h2>
          <div className="space-y-2">
            {tenant.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border border-red-200'
                    : alert.severity === 'warning'
                      ? 'bg-amber-50 border border-amber-200'
                      : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <WarningCircleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  alert.severity === 'critical'
                    ? 'text-red-500'
                    : alert.severity === 'warning'
                      ? 'text-amber-500'
                      : 'text-blue-500'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    alert.severity === 'critical'
                      ? 'text-red-700'
                      : alert.severity === 'warning'
                        ? 'text-amber-700'
                        : 'text-blue-700'
                  }`}>
                    {alert.type}
                  </p>
                  {alert.message && (
                    <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog (soft-delete) */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="מחיקת מוסד"
        description="המוסד יתוזמן למחיקה עם תקופת חסד. ניתן לבטל לפני המחיקה הסופית."
        itemName={tenant.name}
        consequences={deletionPreview ? Object.entries(deletionPreview.counts).map(([key, count]) => `${count} ${key}`) : []}
        confirmText="תזמן מחיקה"
        onConfirm={handleSoftDelete}
        isLoading={actionLoading === 'delete'}
        variant="warning"
      />

      {/* Purge confirmation dialog */}
      {showPurgeDialog && (
        <Modal isOpen={showPurgeDialog} onClose={() => setShowPurgeDialog(false)} title="מחיקה לצמיתות" maxWidth="md">
          <div className="space-y-4">
            <p className="text-red-600 font-medium">פעולה זו אינה הפיכה! כל הנתונים יימחקו לצמיתות.</p>
            <p className="text-sm text-gray-600">
              הקלד את שם המוסד "<span className="font-bold">{tenant.name}</span>" לאישור:
            </p>
            <input
              type="text"
              value={purgeConfirmName}
              onChange={(e) => setPurgeConfirmName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder={tenant.name}
              dir="rtl"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPurgeDialog(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={handlePurge}
                disabled={purgeConfirmName !== tenant.name || actionLoading === 'purge'}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'purge' ? 'מוחק...' : 'מחק לצמיתות'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
