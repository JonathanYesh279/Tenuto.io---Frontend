/**
 * Personal Info Tab Component
 *
 * Displays and allows editing of teacher's personal information
 */

import { useState } from 'react'

import { Teacher } from '../../types'
import { teacherDetailsApi } from '../../../../../services/teacherDetailsApi'
import { getDisplayName, formatAddress } from '../../../../../utils/nameUtils'
import { CalendarIcon, CertificateIcon, CheckCircleIcon, EnvelopeIcon, FloppyDiskIcon, GraduationCapIcon, IdentificationCardIcon, MapPinIcon, MedalIcon, MusicNoteIcon, PencilIcon, PhoneIcon, UserIcon, UsersThreeIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'

interface PersonalInfoTabProps {
  teacher: Teacher
  teacherId: string
}

interface FieldErrors {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  address?: string
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ teacher, teacherId }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [editedData, setEditedData] = useState({
    firstName: teacher.personalInfo?.firstName || '',
    lastName: teacher.personalInfo?.lastName || '',
    phone: teacher.personalInfo?.phone || '',
    email: teacher.personalInfo?.email || '',
    address: formatAddress(teacher.personalInfo?.address),
  })

  // Validation functions
  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return undefined // PhoneIcon is optional
    // Remove any dashes, spaces, or other formatting
    const cleanPhone = phone.replace(/[\s\-]/g, '')
    // Must be 10 digits starting with 05
    if (!/^05\d{8}$/.test(cleanPhone)) {
      return 'מספר הטלפון בפורמט שגוי. יש להזין מספר בפורמט 05XXXXXXXX'
    }
    return undefined
  }

  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'כתובת הדוא"ל אינה תקינה'
    }
    return undefined
  }

  const validateFirstName = (name: string): string | undefined => {
    if (!name || name.trim().length === 0) {
      return 'יש להזין שם פרטי'
    }
    return undefined
  }

  const validateLastName = (name: string): string | undefined => {
    if (!name || name.trim().length === 0) {
      return 'יש להזין שם משפחה'
    }
    return undefined
  }

  const validateAddress = (address: string): string | undefined => {
    if (!address || address.trim().length === 0) {
      return 'יש להזין כתובת'
    }
    return undefined
  }

  const validateAllFields = (): boolean => {
    const errors: FieldErrors = {
      firstName: validateFirstName(editedData.firstName),
      lastName: validateLastName(editedData.lastName),
      phone: validatePhone(editedData.phone),
      email: validateEmail(editedData.email),
      address: validateAddress(editedData.address),
    }

    setFieldErrors(errors)

    // Return true if no errors
    return !Object.values(errors).some(error => error !== undefined)
  }

  // Clean phone number before sending to API
  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/[\s\-]/g, '')
  }

  const handleSave = async () => {
    // Validate all fields before saving
    if (!validateAllFields()) {
      return // Don't save if validation fails
    }

    try {
      setIsSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      // Prepare data with cleaned phone number
      const dataToSave = {
        ...editedData,
        phone: cleanPhoneNumber(editedData.phone),
      }

      // Call API to update teacher personal info
      await teacherDetailsApi.updateTeacherPersonalInfo(teacherId, dataToSave)

      // Update local teacher data
      teacher.personalInfo.firstName = editedData.firstName
      teacher.personalInfo.lastName = editedData.lastName
      teacher.personalInfo.phone = editedData.phone
      teacher.personalInfo.email = editedData.email
      teacher.personalInfo.address = editedData.address

      setSaveSuccess(true)
      setIsEditing(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      console.error('Error saving teacher personal info:', error)
      setSaveError(error.message || 'שגיאה בשמירת הנתונים')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData({
      firstName: teacher.personalInfo?.firstName || '',
      lastName: teacher.personalInfo?.lastName || '',
      phone: teacher.personalInfo?.phone || '',
      email: teacher.personalInfo?.email || '',
      address: formatAddress(teacher.personalInfo?.address),
    })
    setSaveError(null)
    setFieldErrors({})
    setIsEditing(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded text-green-800">
          <CheckCircleIcon className="w-5 h-5" />
          <span>הנתונים נשמרו בהצלחה!</span>
        </div>
      )}

      {/* Error Message */}
      {saveError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          <WarningCircleIcon className="w-5 h-5" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Header with PencilIcon Button */}
      <div className="flex justify-end">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            ערוך
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  שומר...
                </>
              ) : (
                <>
                  <FloppyDiskIcon className="w-4 h-4" />
                  שמור
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XIcon className="w-4 h-4" />
              בטל
            </button>
          </div>
        )}
      </div>

      {/* Personal Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700 border-b pb-2">פרטים בסיסיים</h3>
          
          {/* First Name */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <UserIcon className="w-4 h-4" />
              שם פרטי
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editedData.firstName}
                  onChange={(e) => {
                    setEditedData({ ...editedData, firstName: e.target.value })
                    if (fieldErrors.firstName) {
                      setFieldErrors({ ...fieldErrors, firstName: validateFirstName(e.target.value) })
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                    fieldErrors.firstName
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary'
                  }`}
                  placeholder="הכנס שם פרטי"
                />
                {fieldErrors.firstName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <WarningCircleIcon className="w-3 h-3" />
                    {fieldErrors.firstName}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-900">{teacher.personalInfo?.firstName || 'לא צוין'}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <UserIcon className="w-4 h-4" />
              שם משפחה
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editedData.lastName}
                  onChange={(e) => {
                    setEditedData({ ...editedData, lastName: e.target.value })
                    if (fieldErrors.lastName) {
                      setFieldErrors({ ...fieldErrors, lastName: validateLastName(e.target.value) })
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                    fieldErrors.lastName
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary'
                  }`}
                  placeholder="הכנס שם משפחה"
                />
                {fieldErrors.lastName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <WarningCircleIcon className="w-3 h-3" />
                    {fieldErrors.lastName}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-900">{teacher.personalInfo?.lastName || 'לא צוין'}</p>
            )}
          </div>

          {/* PhoneIcon */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <PhoneIcon className="w-4 h-4" />
              טלפון
            </label>
            {isEditing ? (
              <>
                <input
                  type="tel"
                  value={editedData.phone}
                  onChange={(e) => {
                    setEditedData({ ...editedData, phone: e.target.value })
                    if (fieldErrors.phone) {
                      setFieldErrors({ ...fieldErrors, phone: validatePhone(e.target.value) })
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                    fieldErrors.phone
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary'
                  }`}
                  placeholder="05XXXXXXXX"
                />
                {fieldErrors.phone && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <WarningCircleIcon className="w-3 h-3" />
                    {fieldErrors.phone}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-900">{teacher.personalInfo?.phone || 'לא צוין'}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <EnvelopeIcon className="w-4 h-4" />
              דוא"ל
            </label>
            {isEditing ? (
              <>
                <input
                  type="email"
                  value={editedData.email}
                  onChange={(e) => {
                    setEditedData({ ...editedData, email: e.target.value })
                    if (fieldErrors.email) {
                      setFieldErrors({ ...fieldErrors, email: validateEmail(e.target.value) })
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                    fieldErrors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary'
                  }`}
                  placeholder="example@email.com"
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <WarningCircleIcon className="w-3 h-3" />
                    {fieldErrors.email}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-900">{teacher.personalInfo?.email || 'לא צוין'}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <MapPinIcon className="w-4 h-4" />
              כתובת
            </label>
            {isEditing ? (
              <>
                <textarea
                  value={editedData.address}
                  onChange={(e) => {
                    setEditedData({ ...editedData, address: e.target.value })
                    if (fieldErrors.address) {
                      setFieldErrors({ ...fieldErrors, address: validateAddress(e.target.value) })
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                    fieldErrors.address
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary'
                  }`}
                  placeholder="הכנס כתובת מגורים"
                  rows={2}
                />
                {fieldErrors.address && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <WarningCircleIcon className="w-3 h-3" />
                    {fieldErrors.address}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-900">{formatAddress(teacher.personalInfo?.address) || 'לא צוין'}</p>
            )}
          </div>

          {/* ID Number */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <IdentificationCardIcon className="w-4 h-4" />
              ת.ז.
            </label>
            <p className="text-gray-900">{teacher.personalInfo?.idNumber || 'לא צוין'}</p>
          </div>

          {/* Birth Year */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <CalendarIcon className="w-4 h-4" />
              שנת לידה
            </label>
            <p className="text-gray-900">{teacher.personalInfo?.birthYear || 'לא צוין'}</p>
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700 border-b pb-2">מידע מקצועי</h3>
          
          {/* Instruments */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <MusicNoteIcon className="w-4 h-4" />
              כלי נגינה
            </label>
            {teacher.professionalInfo?.instruments && teacher.professionalInfo.instruments.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {teacher.professionalInfo.instruments.map((inst, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {inst}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-900">{teacher.professionalInfo?.instrument || 'לא צוין'}</p>
            )}
          </div>

          {/* Teaching Subjects */}
          {teacher.professionalInfo?.teachingSubjects && teacher.professionalInfo.teachingSubjects.length > 0 && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <GraduationCapIcon className="w-4 h-4" />
                מקצועות הוראה
              </label>
              <div className="flex flex-wrap gap-1.5">
                {teacher.professionalInfo.teachingSubjects.map((subj, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {subj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Roles */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">תפקידים</label>
            <div className="flex flex-wrap gap-2">
              {teacher.roles?.map((role, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {role}
                </span>
              )) || <span className="text-gray-500">אין תפקידים</span>}
            </div>
          </div>

          {/* Classification */}
          {teacher.professionalInfo?.classification && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">סיווג</label>
              <p className="text-gray-900">{teacher.professionalInfo.classification}</p>
            </div>
          )}

          {/* Degree */}
          {teacher.professionalInfo?.degree && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <MedalIcon className="w-4 h-4" />
                תואר
              </label>
              <p className="text-gray-900">{teacher.professionalInfo.degree}</p>
            </div>
          )}

          {/* Teaching Experience */}
          {teacher.professionalInfo?.teachingExperienceYears != null && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">ותק בהוראה</label>
              <p className="text-gray-900">{teacher.professionalInfo.teachingExperienceYears} שנים</p>
            </div>
          )}

          {/* Teaching Certificate */}
          {teacher.professionalInfo?.hasTeachingCertificate != null && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <CertificateIcon className="w-4 h-4" />
                תעודת הוראה
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                teacher.professionalInfo.hasTeachingCertificate
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {teacher.professionalInfo.hasTeachingCertificate ? 'כן' : 'לא'}
              </span>
            </div>
          )}

          {/* Union Member */}
          {teacher.professionalInfo?.isUnionMember != null && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <UsersThreeIcon className="w-4 h-4" />
                חבר ארגון עובדים
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                teacher.professionalInfo.isUnionMember
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {teacher.professionalInfo.isUnionMember ? 'כן' : 'לא'}
              </span>
            </div>
          )}

          {/* Active Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">סטטוס</label>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              teacher.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {teacher.isActive ? 'פעיל' : 'לא פעיל'}
            </div>
          </div>

          {/* Creation Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <CalendarIcon className="w-4 h-4" />
              תאריך הצטרפות
            </label>
            <p className="text-gray-900">
              {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('he-IL') : 'לא ידוע'}
            </p>
          </div>

          {/* Last Login */}
          {teacher.credentials?.lastLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">כניסה אחרונה</label>
              <p className="text-gray-900">
                {new Date(teacher.credentials.lastLogin).toLocaleDateString('he-IL')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Student Count Summary */}
      <div className="bg-muted/30 rounded p-4">
        <h3 className="text-md font-medium text-gray-700 mb-3">סיכום תלמידים</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {teacher.studentCount || 0}
            </div>
            <div className="text-sm text-gray-600">סך התלמידים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {teacher.teaching?.timeBlocks?.length || 0}
            </div>
            <div className="text-sm text-gray-600">בלוקי זמן</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((teacher.teaching?.timeBlocks?.reduce((total, block) => total + (block.totalDuration || 0), 0) || 0) / 60)}
            </div>
            <div className="text-sm text-gray-600">שעות שבועיות</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoTab