import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/authContext.jsx'
import { tenantService, teacherService, getUploadUrl } from '../services/apiService'
import { Input } from '../components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { getDisplayName } from '../utils/nameUtils'
import toast from 'react-hot-toast'
import {
  GearIcon, FloppyDiskIcon, PencilSimpleIcon, PlusIcon, CheckIcon, XIcon, ProhibitIcon,
  UploadSimpleIcon, ImageIcon, TrashIcon,
} from '@phosphor-icons/react'
import StaffRoleTable from '../components/settings/StaffRoleTable'
import Folder from '../components/Folder'

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
  branding: {
    logoUrl: string | null
    logoKey: string | null
  }
  conservatoryProfile: ConservatoryProfile
}

interface Room {
  _id: string
  name: string
  isActive: boolean
  createdAt: string
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
  const { user, checkAuthStatus } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState('')
  const [addingRoom, setAddingRoom] = useState(false)
  const [editingRoom, setEditingRoom] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [importingRooms, setImportingRooms] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const roomFileInputRef = useRef<HTMLInputElement>(null)
  const logoFileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<TenantData>({
    _id: '',
    name: '',
    city: '',
    director: { name: '', teacherId: '' },
    ministryInfo: { institutionCode: '', districtName: '' },
    settings: { lessonDurations: [30, 45, 60], schoolStartMonth: 9 },
    branding: { logoUrl: null, logoKey: null },
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

      const [tenantResponse, teacherList, roomsResponse] = await Promise.all([
        tenantService.getTenantById(tenantId),
        teacherService.getTeachers(),
        tenantService.getRooms(tenantId),
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
        branding: {
          logoUrl: tenantData.branding?.logoUrl || null,
          logoKey: tenantData.branding?.logoKey || null,
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

      const roomsData = roomsResponse?.data || roomsResponse || []
      setRooms(Array.isArray(roomsData) ? roomsData : [])

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

  const handleAddRoom = async () => {
    const trimmed = newRoomName.trim()
    if (!trimmed) return
    try {
      setAddingRoom(true)
      const response = await tenantService.addRoom(formData._id, { name: trimmed })
      const newRoom = response?.data || response
      setRooms(prev => [...prev, newRoom])
      setNewRoomName('')
      toast.success('החדר נוסף בהצלחה')
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'שגיאה בהוספת חדר'
      toast.error(msg)
    } finally {
      setAddingRoom(false)
    }
  }

  const handleUpdateRoom = async (roomId: string) => {
    const trimmed = editName.trim()
    if (!trimmed) return
    try {
      const response = await tenantService.updateRoom(formData._id, roomId, { name: trimmed })
      const updatedRooms = response?.data || response
      if (Array.isArray(updatedRooms)) {
        setRooms(updatedRooms)
      } else {
        setRooms(prev => prev.map(r => r._id === roomId ? { ...r, name: trimmed } : r))
      }
      setEditingRoom(null)
      setEditName('')
      toast.success('שם החדר עודכן')
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'שגיאה בעדכון חדר'
      toast.error(msg)
    }
  }

  const handleDeactivateRoom = async (roomId: string) => {
    try {
      const response = await tenantService.deactivateRoom(formData._id, roomId)
      const updatedRooms = response?.data || response
      if (Array.isArray(updatedRooms)) {
        setRooms(updatedRooms)
      } else {
        setRooms(prev => prev.map(r => r._id === roomId ? { ...r, isActive: false } : r))
      }
      toast.success('החדר הושבת')
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'שגיאה בהשבתת חדר'
      toast.error(msg)
    }
  }

  const startEditing = (room: Room) => {
    setEditingRoom(room._id)
    setEditName(room.name)
  }

  const cancelEditing = () => {
    setEditingRoom(null)
    setEditName('')
  }

  const handleImportRooms = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImportingRooms(true)
      const response = await tenantService.importRooms(formData._id, file)
      const result = response?.data || response
      const added = result?.added ?? 0
      const skipped = result?.skipped ?? 0
      toast.success(`${added > 0 ? `\u05D9\u05D5\u05D1\u05D0\u05D5 ${added} \u05D7\u05D3\u05E8\u05D9\u05DD \u05D7\u05D3\u05E9\u05D9\u05DD` : '\u05DC\u05D0 \u05E0\u05D5\u05E1\u05E4\u05D5 \u05D7\u05D3\u05E8\u05D9\u05DD'}${skipped > 0 ? `, ${skipped} \u05D3\u05D5\u05DC\u05D2\u05D5 (\u05DB\u05D1\u05E8 \u05E7\u05D9\u05D9\u05DE\u05D9\u05DD)` : ''}`)
      if (result?.rooms) {
        setRooms(result.rooms)
      } else {
        // Reload rooms if not returned in response
        const roomsResponse = await tenantService.getRooms(formData._id)
        const roomsData = roomsResponse?.data || roomsResponse || []
        setRooms(Array.isArray(roomsData) ? roomsData : [])
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || '\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D9\u05D9\u05D1\u05D5\u05D0 \u05D7\u05D3\u05E8\u05D9\u05DD'
      toast.error(msg)
    } finally {
      setImportingRooms(false)
      // Reset file input so the same file can be re-selected
      if (roomFileInputRef.current) {
        roomFileInputRef.current.value = ''
      }
    }
  }

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingLogo(true)
      const response = await tenantService.uploadLogo(formData._id, file)
      const updated = response?.data || response
      setFormData(prev => ({
        ...prev,
        branding: {
          logoUrl: updated?.branding?.logoUrl || null,
          logoKey: updated?.branding?.logoKey || null,
        },
      }))
      toast.success('הלוגו הועלה בהצלחה')
      // Refresh user context so Header picks up the new logo
      checkAuthStatus()
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'שגיאה בהעלאת לוגו'
      toast.error(msg)
    } finally {
      setUploadingLogo(false)
      if (logoFileInputRef.current) logoFileInputRef.current.value = ''
    }
  }

  const handleDeleteLogo = async () => {
    try {
      setUploadingLogo(true)
      await tenantService.deleteLogo(formData._id)
      setFormData(prev => ({
        ...prev,
        branding: { logoUrl: null, logoKey: null },
      }))
      toast.success('הלוגו הוסר בהצלחה')
      checkAuthStatus()
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'שגיאה בהסרת לוגו'
      toast.error(msg)
    } finally {
      setUploadingLogo(false)
    }
  }

  const activeRoomCount = rooms.filter(r => r.isActive !== false).length

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
      {/* Page Header */}
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
      </div>

      <Tabs defaultValue="general" dir="rtl" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">הגדרות כלליות</TabsTrigger>
          <TabsTrigger value="roles">תפקידים והרשאות</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
      {/* Save button for general tab */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
        >
          <FloppyDiskIcon size={16} weight="regular" />
          {saving ? 'שומר...' : 'שמור הגדרות'}
        </button>
      </div>

      {/* Rooms Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-800">חדרים</h3>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {activeRoomCount}
            </span>
          </div>
        </div>

        {/* Add Room + Import */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Input
            type="text"
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddRoom() }}
            className="text-right text-sm flex-1 max-w-xs"
            placeholder="שם חדר"
            disabled={addingRoom}
          />
          <button
            onClick={handleAddRoom}
            disabled={addingRoom || !newRoomName.trim()}
            className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <PlusIcon size={14} weight="bold" />
            הוסף חדר
          </button>
          <div className="flex items-center gap-2">
            <input
              ref={roomFileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportRooms}
              className="hidden"
            />
            <button
              onClick={() => roomFileInputRef.current?.click()}
              disabled={importingRooms}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <UploadSimpleIcon size={14} weight="bold" />
              {importingRooms ? 'מייבא...' : 'ייבוא מ-Excel'}
            </button>
            <span className="text-xs text-gray-400 hidden sm:inline">קובץ Excel עם שמות חדרים בעמודה A</span>
          </div>
        </div>

        {/* Room List */}
        {rooms.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">לא נמצאו חדרים. הוסף חדר ראשון.</div>
        ) : (
          <div className="space-y-2">
            {rooms.map(room => (
              <div
                key={room._id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {editingRoom === room._id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdateRoom(room._id)
                          if (e.key === 'Escape') cancelEditing()
                        }}
                        className="text-right text-sm flex-1 max-w-xs"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateRoom(room._id)}
                        disabled={!editName.trim()}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                        title="שמור"
                      >
                        <CheckIcon size={16} weight="bold" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
                        title="ביטול"
                      >
                        <XIcon size={16} weight="bold" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-gray-800 font-medium">{room.name}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                          room.isActive !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {room.isActive !== false ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </>
                  )}
                </div>
                {editingRoom !== room._id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(room)}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                      title="ערוך"
                    >
                      <PencilSimpleIcon size={16} weight="regular" />
                    </button>
                    {room.isActive !== false && (
                      <button
                        onClick={() => handleDeactivateRoom(room._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="השבת"
                      >
                        <ProhibitIcon size={16} weight="regular" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Branding — Logo Upload */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={18} weight="regular" className="text-gray-600" />
          <h3 className="text-sm font-bold text-gray-800">מיתוג</h3>
        </div>

        <div className="flex items-center gap-6">
          {/* Upload zone / Logo preview */}
          {uploadingLogo ? (
            <div className="w-28 h-28 flex items-center justify-center shrink-0">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : formData.branding.logoUrl ? (
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50/50 shrink-0 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => logoFileInputRef.current?.click()}
            >
              <img
                src={getUploadUrl(formData.branding.logoUrl)!}
                alt="לוגו"
                className="max-w-full max-h-full object-contain p-2"
              />
            </div>
          ) : (
            <div
              className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0 cursor-pointer hover:border-primary/40 hover:bg-gray-50 transition-colors"
              onClick={() => logoFileInputRef.current?.click()}
            >
              <Folder color="#409b78" size={0.7} />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-500">לוגו המוסד יוצג בכותרת לצד שם הקונסרבטוריון. PNG או JPG, עד 2MB.</p>
            <div className="flex items-center gap-2">
              <input
                ref={logoFileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={handleUploadLogo}
                className="hidden"
              />
              <button
                onClick={() => logoFileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <UploadSimpleIcon size={14} weight="bold" />
                {uploadingLogo ? 'מעלה...' : formData.branding.logoUrl ? 'החלף לוגו' : 'העלה לוגו'}
              </button>
              {formData.branding.logoUrl && (
                <button
                  onClick={handleDeleteLogo}
                  disabled={uploadingLogo}
                  className="flex items-center gap-1 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <TrashIcon size={14} weight="bold" />
                  הסר לוגו
                </button>
              )}
            </div>
          </div>
        </div>
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
          <h3 className="text-sm font-bold text-gray-800 mb-3">מנהל\ת הקונסרבטוריון</h3>
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
          <Field label="יחידה מקדמת לצורך תמיכה">
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <Field label="סטטוס פיקוח">
            <Input type="text" value={formData.conservatoryProfile.supervisionStatus} onChange={e => updateProfile('supervisionStatus', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="מחלקה עיקרית">
            <Input type="text" value={formData.conservatoryProfile.mainDepartment} onChange={e => updateProfile('mainDepartment', e.target.value)} className="text-right text-sm" placeholder="—" />
          </Field>
          <Field label="רשות גדולה\קטנה">
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
            <Field label="הערות מנהל\ת">
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
        </TabsContent>

        <TabsContent value="roles">
          <StaffRoleTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
