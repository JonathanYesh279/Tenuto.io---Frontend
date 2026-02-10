import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/authContext.jsx'
import { tenantService, teacherService } from '../services/apiService'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { getDisplayName } from '../utils/nameUtils'
import toast from 'react-hot-toast'
import { Settings as SettingsIcon, Building2, User, Landmark, SlidersHorizontal, Save } from 'lucide-react'

interface TenantData {
  _id: string
  name: string
  city: string
  director: {
    name: string
    teacherId: string
  }
  ministryInfo: {
    institutionCode: string
    districtName: string
  }
  settings: {
    lessonDurations: number[]
    schoolStartMonth: number
  }
}

interface TeacherOption {
  _id: string
  displayName: string
}

const AVAILABLE_DURATIONS = [30, 45, 60]
const MONTHS = [
  { value: 1, label: 'ינואר' },
  { value: 2, label: 'פברואר' },
  { value: 3, label: 'מרץ' },
  { value: 4, label: 'אפריל' },
  { value: 5, label: 'מאי' },
  { value: 6, label: 'יוני' },
  { value: 7, label: 'יולי' },
  { value: 8, label: 'אוגוסט' },
  { value: 9, label: 'ספטמבר' },
  { value: 10, label: 'אוקטובר' },
  { value: 11, label: 'נובמבר' },
  { value: 12, label: 'דצמבר' },
]

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [formData, setFormData] = useState<TenantData>({
    _id: '',
    name: '',
    city: '',
    director: { name: '', teacherId: '' },
    ministryInfo: { institutionCode: '', districtName: '' },
    settings: { lessonDurations: [30, 45, 60], schoolStartMonth: 9 },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const tenantId = user?.tenantId
      if (!tenantId) {
        toast.error('לא נמצא מזהה מוסד')
        return
      }

      const [tenantData, teacherList] = await Promise.all([
        tenantService.getTenantById(tenantId),
        teacherService.getTeachers(),
      ])

      setFormData({
        _id: tenantData._id || '',
        name: tenantData.name || '',
        city: tenantData.city || '',
        director: {
          name: tenantData.director?.name || '',
          teacherId: tenantData.director?.teacherId || '',
        },
        ministryInfo: {
          institutionCode: tenantData.ministryInfo?.institutionCode || '',
          districtName: tenantData.ministryInfo?.districtName || '',
        },
        settings: {
          lessonDurations: tenantData.settings?.lessonDurations || [30, 45, 60],
          schoolStartMonth: tenantData.settings?.schoolStartMonth || 9,
        },
      })

      const mappedTeachers = (teacherList || []).map((t: any) => ({
        _id: t._id,
        displayName: getDisplayName(t) || getDisplayName(t.personalInfo) || t.personalInfo?.fullName || 'ללא שם',
      }))
      setTeachers(mappedTeachers)
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('שגיאה בטעינת ההגדרות')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { _id, ...updateData } = formData
      await tenantService.updateTenant(_id, updateData)
      toast.success('ההגדרות נשמרו בהצלחה')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('שגיאה בשמירת ההגדרות')
    } finally {
      setSaving(false)
    }
  }

  const handleDurationToggle = (duration: number) => {
    setFormData(prev => {
      const current = prev.settings.lessonDurations
      const updated = current.includes(duration)
        ? current.filter(d => d !== duration)
        : [...current, duration].sort((a, b) => a - b)
      // Must have at least one duration
      if (updated.length === 0) return prev
      return { ...prev, settings: { ...prev.settings, lessonDurations: updated } }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען הגדרות...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הגדרות קונסרבטוריון</h1>
          <p className="text-sm text-gray-500">ניהול פרטי המוסד וההגדרות</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* General Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg">פרטים כלליים</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם המוסד</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-right"
                  placeholder="שם הקונסרבטוריון"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-right"
                  placeholder="עיר"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Director */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg">מנהל/ת</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם המנהל/ת</label>
                <input
                  type="text"
                  value={formData.director.name}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    director: { ...prev.director, name: e.target.value },
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-right"
                  placeholder="שם מלא"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מורה משויך</label>
                <select
                  value={formData.director.teacherId}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    director: { ...prev.director, teacherId: e.target.value },
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-right"
                >
                  <option value="">-- בחר מורה --</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.displayName}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ministry Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg">פרטי משרד החינוך</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קוד מוסד</label>
                <input
                  type="text"
                  value={formData.ministryInfo.institutionCode}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    ministryInfo: { ...prev.ministryInfo, institutionCode: e.target.value },
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-right"
                  placeholder="קוד מוסד"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם מחוז</label>
                <input
                  type="text"
                  value={formData.ministryInfo.districtName}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    ministryInfo: { ...prev.ministryInfo, districtName: e.target.value },
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-right"
                  placeholder="שם המחוז"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Defaults */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg">ברירות מחדל</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  משכי שיעור מותרים (דקות)
                </label>
                <div className="flex gap-4">
                  {AVAILABLE_DURATIONS.map(d => (
                    <label key={d} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings.lessonDurations.includes(d)}
                        onChange={() => handleDurationToggle(d)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{d} דקות</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  חודש תחילת שנת לימודים
                </label>
                <select
                  value={formData.settings.schoolStartMonth}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, schoolStartMonth: Number(e.target.value) },
                  }))}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-right"
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-2 pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'שומר...' : 'שמור הגדרות'}
          </button>
        </div>
      </div>
    </div>
  )
}
