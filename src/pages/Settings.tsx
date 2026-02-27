import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/authContext.jsx'
import { tenantService, teacherService } from '../services/apiService'
import { Input } from '../components/ui/input'
import { getDisplayName } from '../utils/nameUtils'
import toast from 'react-hot-toast'
import {
  GearIcon, FloppyDiskIcon,
} from '@phosphor-icons/react'

interface ConservatoryProfile {
  code: string
  ownershipName: string
  status: string
  socialCluster: string
  businessNumber: string
  supportUnit: string
  mixedCityFactor: string
  stage: string
  stageDescription: string
  officePhone: string
  mobilePhone: string
  cityCode: string
  sizeCategory: string
  mainDepartment: string
  supervisionStatus: string
  email: string
  address: string
  managerName: string
  managerNotes: string
  district: string
}

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
  conservatoryProfile: ConservatoryProfile
}

interface TeacherOption {
  _id: string
  displayName: string
}

const EMPTY_PROFILE: ConservatoryProfile = {
  code: '', ownershipName: '', status: '', socialCluster: '', businessNumber: '',
  supportUnit: '', mixedCityFactor: '', stage: '', stageDescription: '',
  officePhone: '', mobilePhone: '', cityCode: '', sizeCategory: '',
  mainDepartment: '', supervisionStatus: '', email: '', address: '',
  managerName: '', managerNotes: '', district: '',
}

const AVAILABLE_DURATIONS = [30, 45, 60, 90, 120]
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

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
    conservatoryProfile: { ...EMPTY_PROFILE },
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

      const [tenantResponse, teacherList] = await Promise.all([
        tenantService.getTenantById(tenantId),
        teacherService.getTeachers(),
      ])

      // API returns { success, data } — unwrap
      const tenantData = tenantResponse?.data || tenantResponse || {}
      const cp = tenantData.conservatoryProfile || {}

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
        conservatoryProfile: {
          code: cp.code || '',
          ownershipName: cp.ownershipName || '',
          status: cp.status || '',
          socialCluster: cp.socialCluster || '',
          businessNumber: cp.businessNumber || '',
          supportUnit: cp.supportUnit || '',
          mixedCityFactor: cp.mixedCityFactor || '',
          stage: cp.stage || '',
          stageDescription: cp.stageDescription || '',
          officePhone: cp.officePhone || '',
          mobilePhone: cp.mobilePhone || '',
          cityCode: cp.cityCode || '',
          sizeCategory: cp.sizeCategory || '',
          mainDepartment: cp.mainDepartment || '',
          supervisionStatus: cp.supervisionStatus || '',
          email: cp.email || '',
          address: cp.address || '',
          managerName: cp.managerName || '',
          managerNotes: cp.managerNotes || '',
          district: cp.district || '',
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
      if (updated.length === 0) return prev
      return { ...prev, settings: { ...prev.settings, lessonDurations: updated } }
    })
  }

  const updateProfile = (field: keyof ConservatoryProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      conservatoryProfile: { ...prev.conservatoryProfile, [field]: value },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-600">טוען הגדרות...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Page Header + Save */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GearIcon size={20} weight="regular" className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">הגדרות קונסרבטוריון</h1>
            <p className="text-sm text-gray-500">ניהול פרטי המוסד וההגדרות</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
        >
          <FloppyDiskIcon size={16} weight="regular" />
          {saving ? 'שומר...' : 'שמור הגדרות'}
        </button>
      </div>

      {/* Top row: General + Director + Ministry side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* General Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">פרטים כלליים</h3>
          <div className="space-y-3">
            <Field label="שם המוסד">
              <Input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="text-right text-sm" placeholder="שם הקונסרבטוריון" />
            </Field>
            <Field label="עיר">
              <Input type="text" value={formData.city} onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))} className="text-right text-sm" placeholder="עיר" />
            </Field>
          </div>
        </div>

        {/* Director */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">מנהל/ת</h3>
          <div className="space-y-3">
            <Field label="שם המנהל/ת">
              <Input type="text" value={formData.director.name} onChange={e => setFormData(prev => ({ ...prev, director: { ...prev.director, name: e.target.value } }))} className="text-right text-sm" placeholder="שם מלא" />
            </Field>
            <Field label="מורה משויך">
              <select
                value={formData.director.teacherId}
                onChange={e => setFormData(prev => ({ ...prev, director: { ...prev.director, teacherId: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent text-right"
              >
                <option value="">-- בחר מורה --</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.displayName}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Ministry Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">פרטי משרד החינוך</h3>
          <div className="space-y-3">
            <Field label="קוד מוסד">
              <Input type="text" value={formData.ministryInfo.institutionCode} onChange={e => setFormData(prev => ({ ...prev, ministryInfo: { ...prev.ministryInfo, institutionCode: e.target.value } }))} className="text-right text-sm" placeholder="קוד מוסד" />
            </Field>
            <Field label="שם מחוז">
              <Input type="text" value={formData.ministryInfo.districtName} onChange={e => setFormData(prev => ({ ...prev, ministryInfo: { ...prev.ministryInfo, districtName: e.target.value } }))} className="text-right text-sm" placeholder="שם המחוז" />
            </Field>
          </div>
        </div>
      </div>

      {/* Conservatory Profile — compact grid */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <h3 className="text-sm font-bold text-gray-800 mb-4">פרופיל קונסרבטוריון</h3>

        {/* Identification row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Field label="קוד קונסרבטוריון">
            <Input type="text" value={formData.conservatoryProfile.code} onChange={e => updateProfile('code', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="שם בעלות / רשות">
            <Input type="text" value={formData.conservatoryProfile.ownershipName} onChange={e => updateProfile('ownershipName', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="מספר עוסק (ח.פ.)">
            <Input type="text" value={formData.conservatoryProfile.businessNumber} onChange={e => updateProfile('businessNumber', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="סטטוס">
            <Input type="text" value={formData.conservatoryProfile.status} onChange={e => updateProfile('status', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
        </div>

        {/* Classification row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Field label="אשכול חברתי">
            <Input type="text" value={formData.conservatoryProfile.socialCluster} onChange={e => updateProfile('socialCluster', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="יחידה מקדמת">
            <Input type="text" value={formData.conservatoryProfile.supportUnit} onChange={e => updateProfile('supportUnit', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="שלב (קוד)">
            <Input type="text" value={formData.conservatoryProfile.stage} onChange={e => updateProfile('stage', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="שלב (תיאור)">
            <Input type="text" value={formData.conservatoryProfile.stageDescription} onChange={e => updateProfile('stageDescription', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
        </div>

        {/* Supervision + classification row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Field label="סטטוס פיקוח">
            <Input type="text" value={formData.conservatoryProfile.supervisionStatus} onChange={e => updateProfile('supervisionStatus', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="מחלקה עיקרית">
            <Input type="text" value={formData.conservatoryProfile.mainDepartment} onChange={e => updateProfile('mainDepartment', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="מקדם עיר מעורבת">
            <Input type="text" value={formData.conservatoryProfile.mixedCityFactor} onChange={e => updateProfile('mixedCityFactor', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="רשות גדולה / קטנה">
            <Input type="text" value={formData.conservatoryProfile.sizeCategory} onChange={e => updateProfile('sizeCategory', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
        </div>

        {/* Contact row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Field label="טלפון משרד">
            <Input type="text" value={formData.conservatoryProfile.officePhone} onChange={e => updateProfile('officePhone', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="טלפון נייד">
            <Input type="text" value={formData.conservatoryProfile.mobilePhone} onChange={e => updateProfile('mobilePhone', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="דוא״ל">
            <Input type="text" value={formData.conservatoryProfile.email} onChange={e => updateProfile('email', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="כתובת">
            <Input type="text" value={formData.conservatoryProfile.address} onChange={e => updateProfile('address', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
        </div>

        {/* Location row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Field label="מחוז">
            <Input type="text" value={formData.conservatoryProfile.district} onChange={e => updateProfile('district', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="סמל ישוב">
            <Input type="text" value={formData.conservatoryProfile.cityCode} onChange={e => updateProfile('cityCode', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <div className="md:col-span-2">
            <Field label="הערות מנהל/ת">
              <textarea
                value={formData.conservatoryProfile.managerNotes}
                onChange={e => updateProfile('managerNotes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent text-right resize-y"
                placeholder="—"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Defaults */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-3">ברירות מחדל</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">משכי שיעור מותרים (דקות)</label>
            <div className="flex gap-4">
              {AVAILABLE_DURATIONS.map(d => (
                <label key={d} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.settings.lessonDurations.includes(d)}
                    onChange={() => handleDurationToggle(d)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                  />
                  <span className="text-sm text-gray-700">{d} דקות</span>
                </label>
              ))}
            </div>
          </div>
          <Field label="חודש תחילת שנת לימודים">
            <select
              value={formData.settings.schoolStartMonth}
              onChange={e => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, schoolStartMonth: Number(e.target.value) },
              }))}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent text-right"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>
    </div>
  )
}
