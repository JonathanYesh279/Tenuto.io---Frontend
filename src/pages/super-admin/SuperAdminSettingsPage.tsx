import { useState } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import { superAdminService } from '../../services/apiService'
import toast from 'react-hot-toast'
import {
  GearIcon,
  UserIcon,
  EnvelopeIcon,
  LockIcon,
  ShieldCheckIcon,
  FloppyDiskIcon,
} from '@phosphor-icons/react'

const PERMISSION_LABELS: Record<string, string> = {
  manage_tenants: 'ניהול מוסדות',
  view_analytics: 'צפייה בנתונים',
  billing: 'חיוב ותשלומים',
}

export default function SuperAdminSettingsPage() {
  const { user } = useAuth()
  const adminId = user?._id || user?.teacherId || ''

  const [name, setName] = useState(user?.personalInfo?.firstName || '')
  const [email, setEmail] = useState(user?.personalInfo?.email || '')
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const permissions: string[] = user?.permissions || []

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('שם ואימייל הם שדות חובה')
      return
    }
    try {
      setSaving(true)
      await superAdminService.updateAdmin(adminId, { name: name.trim(), email: email.trim() })
      toast.success('הפרופיל עודכן בהצלחה')
    } catch (err: any) {
      console.error('Failed to update profile:', err)
      toast.error(err.response?.data?.message || 'שגיאה בעדכון הפרופיל')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('סיסמה חייבת להכיל לפחות 8 תווים')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('הסיסמאות אינן תואמות')
      return
    }
    try {
      setSavingPassword(true)
      await superAdminService.updateAdmin(adminId, { password: newPassword })
      toast.success('הסיסמה שונתה בהצלחה')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error('Failed to change password:', err)
      toast.error(err.response?.data?.message || 'שגיאה בשינוי הסיסמה')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div dir="rtl" className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <GearIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הגדרות</h1>
          <p className="text-sm text-gray-500">ניהול פרופיל מנהל-על</p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">פרטי פרופיל</h2>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dir="ltr"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <FloppyDiskIcon className="w-4 h-4" />
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <LockIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">שינוי סיסמה</h2>
        </div>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="ltr"
              placeholder="לפחות 8 תווים"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="ltr"
              placeholder="הקלד שוב את הסיסמה"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword || !newPassword || !confirmPassword}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <LockIcon className="w-4 h-4" />
              {savingPassword ? 'משנה...' : 'שנה סיסמה'}
            </button>
          </div>
        </form>
      </div>

      {/* Permissions Section (read-only) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheckIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">הרשאות</h2>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          ההרשאות שלך מוגדרות על ידי מנהל-על אחר
        </p>
        <div className="flex flex-wrap gap-2">
          {permissions.length > 0 ? (
            permissions.map(perm => (
              <span
                key={perm}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100"
              >
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                {PERMISSION_LABELS[perm] || perm}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">אין הרשאות מוגדרות</span>
          )}
        </div>
      </div>
    </div>
  )
}
