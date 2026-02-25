import { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import { superAdminService } from '../../services/apiService'
import type { SuperAdmin } from '../../types/super-admin.types'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import {
  ShieldIcon,
  PlusIcon,
  PencilSimpleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowsClockwiseIcon,
  EnvelopeIcon,
  UserIcon,
} from '@phosphor-icons/react'

const PERMISSION_OPTIONS = [
  { value: 'manage_tenants', label: 'ניהול מוסדות' },
  { value: 'view_analytics', label: 'צפייה בנתונים' },
  { value: 'billing', label: 'חיוב ותשלומים' },
] as const

const getPermissionLabel = (value: string): string => {
  const option = PERMISSION_OPTIONS.find(p => p.value === value)
  return option ? option.label : value
}

const emptyFormData = { name: '', email: '', password: '', permissions: [] as string[] }

export default function SuperAdminManagementPage() {
  const { user } = useAuth()
  const currentUserId = user?._id || user?.teacherId || ''

  const [admins, setAdmins] = useState<SuperAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<SuperAdmin | null>(null)
  const [formData, setFormData] = useState(emptyFormData)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await superAdminService.getAdmins()
      const data = res?.data || res || []
      setAdmins(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Failed to load admins:', err)
      setError(err.message || 'שגיאה בטעינת מנהלי-על')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ ...emptyFormData, permissions: [] })
  }

  const openCreateForm = () => {
    resetForm()
    setEditingAdmin(null)
    setShowForm(true)
  }

  const openEditForm = (admin: SuperAdmin) => {
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      password: '',
      permissions: [...(admin.permissions || [])],
    })
    setEditingAdmin(admin)
    setShowForm(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.permissions.length === 0) {
      toast.error('יש לבחור לפחות הרשאה אחת')
      return
    }

    try {
      setSaving(true)

      if (editingAdmin) {
        // Edit mode — omit password if empty
        const payload: Record<string, any> = {
          name: formData.name,
          email: formData.email,
          permissions: formData.permissions,
        }
        if (formData.password.trim()) {
          payload.password = formData.password
        }
        await superAdminService.updateAdmin(editingAdmin._id, payload)
        toast.success('מנהל-על עודכן בהצלחה')
      } else {
        // Create mode
        await superAdminService.createAdmin({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          permissions: formData.permissions,
        })
        toast.success('מנהל-על נוצר בהצלחה')
      }

      setShowForm(false)
      setEditingAdmin(null)
      resetForm()
      await loadAdmins()
    } catch (err: any) {
      console.error('Failed to save admin:', err)
      toast.error(err.response?.data?.message || err.message || 'שגיאה בשמירת מנהל-על')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'לא נרשם'
    try {
      return new Date(dateStr).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'לא נרשם'
    }
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldIcon className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900">ניהול מנהלי-על</h1>
          </div>
          <p className="text-sm text-gray-600">
            {loading ? 'טוען...' : `${admins.length} מנהלי-על`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAdmins}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="רענן נתונים"
          >
            <ArrowsClockwiseIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            רענן
          </button>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            הוסף מנהל-על
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Admin List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          טוען מנהלי-על...
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ShieldIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>לא נמצאו מנהלי-על</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => {
            const isSelf = admin._id === currentUserId

            return (
              <div
                key={admin._id}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100"
              >
                {/* Left side: admin info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    admin.isActive ? 'bg-blue-100' : 'bg-gray-200'
                  }`}>
                    <UserIcon className={`w-5 h-5 ${
                      admin.isActive ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{admin.name}</span>
                      {isSelf && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                          (את/ה)
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        admin.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {admin.isActive ? (
                          <><CheckCircleIcon className="w-3 h-3" /> פעיל</>
                        ) : (
                          <><XCircleIcon className="w-3 h-3" /> לא פעיל</>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <EnvelopeIcon className="w-3.5 h-3.5" />
                      <span dir="ltr">{admin.email}</span>
                    </div>

                    {/* Permissions badges */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {(admin.permissions || []).map((perm) => (
                        <span
                          key={perm}
                          className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100"
                        >
                          {getPermissionLabel(perm)}
                        </span>
                      ))}
                    </div>

                    {/* Last login */}
                    <p className="text-xs text-gray-400 mt-1.5">
                      כניסה אחרונה: {formatDate(admin.lastLogin)}
                    </p>
                  </div>
                </div>

                {/* Right side: actions */}
                <div className="flex items-center gap-2 flex-shrink-0 mr-4">
                  <button
                    onClick={() => openEditForm(admin)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="ערוך מנהל-על"
                  >
                    <PencilSimpleIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingAdmin(null); resetForm() }}
        title={editingAdmin ? 'עריכת מנהל-על' : 'הוספת מנהל-על'}
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="rtl"
            />
          </div>

          {/* Email input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="ltr"
            />
          </div>

          {/* Password input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה {editingAdmin && <span className="text-gray-400 font-normal">(השאר ריק ללא שינוי)</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
              required={!editingAdmin}
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="ltr"
              placeholder={editingAdmin ? '••••••••' : ''}
            />
          </div>

          {/* Permissions checkboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">הרשאות</label>
            <div className="space-y-2">
              {PERMISSION_OPTIONS.map(perm => (
                <label key={perm.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(perm.value)}
                    onChange={e => {
                      setFormData(f => ({
                        ...f,
                        permissions: e.target.checked
                          ? [...f.permissions, perm.value]
                          : f.permissions.filter(p => p !== perm.value)
                      }))
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingAdmin(null); resetForm() }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving || formData.permissions.length === 0}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'שומר...' : editingAdmin ? 'עדכן' : 'צור'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
