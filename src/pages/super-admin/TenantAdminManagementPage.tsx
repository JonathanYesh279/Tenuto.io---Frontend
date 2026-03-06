import { useState, useEffect, useMemo } from 'react'
import { superAdminService } from '../../services/apiService'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import {
  ArrowsClockwiseIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from '@phosphor-icons/react'

interface TenantAdmin {
  _id: string
  tenantId: string
  tenantName?: string
  tenantSlug?: string
  firstName?: string
  lastName?: string
  personalInfo?: {
    firstName?: string
    lastName?: string
    email?: string
  }
  credentials?: {
    email?: string
    lastLogin?: string | null
    requiresPasswordChange?: boolean
  }
  roles?: string[]
}

const ROLE_COLORS: Record<string, string> = {
  // Admin tier
  'מנהל': 'bg-red-100 text-red-700 border-red-200',
  'סגן מנהל': 'bg-red-50 text-red-600 border-red-100',
  'מזכירות': 'bg-red-50 text-red-600 border-red-100',
  // Coordinator tier
  'רכז/ת כללי': 'bg-blue-100 text-blue-700 border-blue-200',
  'רכז/ת מחלקתי': 'bg-blue-50 text-blue-600 border-blue-100',
  // Teaching tier
  'מורה': 'bg-green-100 text-green-700 border-green-200',
  'ניצוח': 'bg-green-50 text-green-600 border-green-100',
  'מדריך הרכב': 'bg-green-50 text-green-600 border-green-100',
  'תאוריה': 'bg-green-50 text-green-600 border-green-100',
  'ליווי פסנתר': 'bg-green-50 text-green-600 border-green-100',
  'הלחנה': 'bg-green-50 text-green-600 border-green-100',
  'מורה מגמה': 'bg-green-50 text-green-600 border-green-100',
  // View-only
  'צפייה בלבד': 'bg-gray-100 text-gray-600 border-gray-200',
}

const getAdminName = (admin: TenantAdmin) => {
  const fn = admin.firstName || admin.personalInfo?.firstName || ''
  const ln = admin.lastName || admin.personalInfo?.lastName || ''
  return `${fn} ${ln}`.trim() || 'ללא שם'
}

const getAdminEmail = (admin: TenantAdmin) => {
  return admin.credentials?.email || admin.personalInfo?.email || ''
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return 'אף פעם'
  try {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'אף פעם'
  }
}

export default function TenantAdminManagementPage() {
  const [admins, setAdmins] = useState<TenantAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Edit modal state
  const [editingAdmin, setEditingAdmin] = useState<TenantAdmin | null>(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '' })
  const [saving, setSaving] = useState(false)

  // Reset password dialog state
  const [resetConfirmAdmin, setResetConfirmAdmin] = useState<TenantAdmin | null>(null)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await superAdminService.getAllTenantAdmins()
      const data = res?.data || res || []
      setAdmins(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Failed to load tenant admins:', err)
      setError(err.message || 'שגיאה בטעינת מנהלי מוסדות')
    } finally {
      setLoading(false)
    }
  }

  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return admins
    const q = searchQuery.trim().toLowerCase()
    return admins.filter(admin => {
      const name = getAdminName(admin).toLowerCase()
      const email = getAdminEmail(admin).toLowerCase()
      const tenant = (admin.tenantName || '').toLowerCase()
      return name.includes(q) || email.includes(q) || tenant.includes(q)
    })
  }, [admins, searchQuery])

  // Edit handlers
  const openEdit = (admin: TenantAdmin) => {
    setEditForm({
      firstName: admin.firstName || admin.personalInfo?.firstName || '',
      lastName: admin.lastName || admin.personalInfo?.lastName || '',
      email: getAdminEmail(admin),
    })
    setEditingAdmin(admin)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAdmin) return

    try {
      setSaving(true)
      await superAdminService.updateTenantAdmin(editingAdmin.tenantId, editingAdmin._id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
      })
      toast.success('פרטי מנהל עודכנו בהצלחה')
      setEditingAdmin(null)
      await loadData()
    } catch (err: any) {
      console.error('Failed to update admin:', err)
      const msg = err.response?.data?.message || err.message || 'שגיאה בעדכון מנהל'
      if (err.response?.status === 409) {
        toast.error('כתובת האימייל כבר קיימת במוסד זה')
      } else {
        toast.error(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  // Reset password handler
  const handleResetPassword = async () => {
    if (!resetConfirmAdmin) return

    try {
      setResetting(true)
      await superAdminService.resetTenantAdminPassword(resetConfirmAdmin.tenantId, resetConfirmAdmin._id)
      toast.success('הסיסמה אופסה בהצלחה')
      setResetConfirmAdmin(null)
      await loadData()
    } catch (err: any) {
      console.error('Failed to reset password:', err)
      toast.error(err.response?.data?.message || err.message || 'שגיאה באיפוס סיסמה')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UsersIcon className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900">ניהול מנהלי מוסדות</h1>
            {!loading && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                {filteredAdmins.length}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {loading ? 'טוען...' : `${filteredAdmins.length} מנהלים`}
            {searchQuery && !loading && ` (מתוך ${admins.length})`}
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
          placeholder="חפש מנהל לפי שם, אימייל או מוסד..."
          className="w-full pr-10 pl-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Admin List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          טוען מנהלי מוסדות...
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>{searchQuery ? 'לא נמצאו מנהלים התואמים לחיפוש' : 'לא נמצאו מנהלי מוסדות'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">מוסד</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">שם מנהל</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">אימייל</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">תפקידים</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">כניסה אחרונה</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס סיסמה</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAdmins.map((admin) => (
                  <tr key={`${admin.tenantId}-${admin._id}`} className="hover:bg-gray-50 transition-colors">
                    {/* Tenant */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{admin.tenantName || 'ללא שם'}</div>
                      {admin.tenantSlug && (
                        <div className="text-xs text-gray-400" dir="ltr">{admin.tenantSlug}</div>
                      )}
                    </td>

                    {/* Admin Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-900">{getAdminName(admin)}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600" dir="ltr">{getAdminEmail(admin)}</span>
                    </td>

                    {/* Roles */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(admin.roles || []).map((role) => (
                          <span
                            key={role}
                            className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Last Login */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">{formatDate(admin.credentials?.lastLogin)}</span>
                    </td>

                    {/* Password Status */}
                    <td className="px-4 py-3">
                      {admin.credentials?.requiresPasswordChange ? (
                        <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                          דורש שינוי
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                          פעילה
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(admin)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="ערוך פרטים"
                        >
                          <PencilSimpleIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setResetConfirmAdmin(admin)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="אפס סיסמה"
                        >
                          <KeyIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingAdmin}
        onClose={() => { setEditingAdmin(null) }}
        title="עריכת פרטי מנהל"
        maxWidth="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4" dir="rtl">
          {editingAdmin && (
            <div className="text-sm text-gray-500 mb-2">
              מוסד: <span className="font-medium text-gray-700">{editingAdmin.tenantName}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם פרטי</label>
            <input
              type="text"
              value={editForm.firstName}
              onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם משפחה</label>
            <input
              type="text"
              value={editForm.lastName}
              onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              type="email"
              value={editForm.email}
              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="ltr"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setEditingAdmin(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Confirmation */}
      <Modal
        isOpen={!!resetConfirmAdmin}
        onClose={() => setResetConfirmAdmin(null)}
        title="איפוס סיסמה"
        maxWidth="sm"
      >
        <div className="space-y-4" dir="rtl">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm">
              האם לאפס את הסיסמה של{' '}
              <span className="font-bold">{resetConfirmAdmin ? getAdminName(resetConfirmAdmin) : ''}</span>?
            </p>
            <p className="text-amber-600 text-xs mt-1">
              המנהל יצטרך להגדיר סיסמה חדשה בכניסה הבאה.
            </p>
          </div>

          {resetConfirmAdmin && (
            <div className="text-sm text-gray-500">
              מוסד: <span className="font-medium text-gray-700">{resetConfirmAdmin.tenantName}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
            <button
              onClick={() => setResetConfirmAdmin(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleResetPassword}
              disabled={resetting}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {resetting ? 'מאפס...' : 'אפס סיסמה'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
