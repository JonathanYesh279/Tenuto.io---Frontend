/**
 * Personal Info Tab Component
 * 
 * Displays and allows editing of student personal information
 * including contact details, parent information, and basic demographics.
 */

import { useState, useEffect, useCallback } from 'react'
import { User, Phone, Mail, MapPin, Calendar, Edit, Save, X, UserCheck, AlertCircle, Clock, CheckCircle, Shield, History } from 'lucide-react'
import { StudentDetails, PersonalInfo, ParentsInfo } from '../../types'
import { studentDetailsApi } from '../../../../services/studentDetailsApi'
import { usePermissionsAndAudit, useFieldPermissions } from '../../hooks/usePermissionsAndAudit'
import PermissionWrapper, { ViewWrapper, EditWrapper } from '../PermissionWrapper'
import AuditTrailPanel from '../AuditTrailPanel'
import toast from 'react-hot-toast'

interface PersonalInfoTabProps {
  student: StudentDetails
  studentId: string
  onUpdate?: (updatedStudent: StudentDetails) => void
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ student, studentId, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [draftData, setDraftData] = useState<{
    personalInfo: Partial<PersonalInfo>
    parentsInfo: Partial<ParentsInfo>
  }>({ personalInfo: {}, parentsInfo: {} })
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { personalInfo, parentsInfo, isActive, registrationDate } = student

  // Permissions and audit
  const { hasPermission, checkAction, audit, userRole } = usePermissionsAndAudit(studentId, student)
  const { getFieldConfig, logFieldChange } = useFieldPermissions(studentId)

  // Check permissions
  const canView = hasPermission('view_student_personal')
  const canEdit = hasPermission('edit_student_personal')
  const canViewAudit = hasPermission('view_audit_trail')

  // Israeli ID validation
  const validateIsraeliId = (id: string): boolean => {
    if (!id || id.length !== 9) return false
    const digits = id.split('').map(Number)
    let sum = 0
    for (let i = 0; i < 9; i++) {
      let digit = digits[i]
      if (i % 2 === 1) digit *= 2
      if (digit > 9) digit = digit - 9
      sum += digit
    }
    return sum % 10 === 0
  }

  // Israeli phone validation
  const validateIsraeliPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '')
    return /^05\d{8}$/.test(cleaned) || /^0[2-4,8-9]\d{7,8}$/.test(cleaned)
  }

  // Email validation
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Calculate age
  const age = personalInfo.age || (personalInfo.birthDate ? 
    Math.floor((Date.now() - new Date(personalInfo.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
    null)

  // Format dates
  const formatDate = (date: Date | string) => {
    if (!date) return 'לא צוין'
    return new Date(date).toLocaleDateString('he-IL')
  }

  const InfoSection: React.FC<{ 
    title: string; 
    icon: React.ComponentType<any>; 
    children: React.ReactNode;
    className?: string;
  }> = ({ title, icon: Icon, children, className = '' }) => (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 bg-primary-50 rounded-lg">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!isEditing || Object.keys(draftData.personalInfo).length === 0 && Object.keys(draftData.parentsInfo).length === 0) return
    
    try {
      setIsSaving(true)
      const oldData = { personalInfo, parentsInfo }
      const updatedData = {
        personalInfo: { ...personalInfo, ...draftData.personalInfo },
        parentsInfo: { ...parentsInfo, ...draftData.parentsInfo }
      }
      
      // Get changed fields for audit log
      const changedFields = []
      if (Object.keys(draftData.personalInfo).length > 0) {
        changedFields.push(...Object.keys(draftData.personalInfo))
      }
      if (Object.keys(draftData.parentsInfo).length > 0) {
        changedFields.push(...Object.keys(draftData.parentsInfo))
      }
      
      await studentDetailsApi.updateStudentPersonalInfo(studentId, updatedData)
      
      // Log the update in audit trail
      await audit.logEdit('personal_info', studentId, oldData, updatedData, changedFields)
      
      setLastSaved(new Date())
      toast.success('שינויים נשמרו אוטומטית', { duration: 2000 })
      
      if (onUpdate) {
        onUpdate({ ...student, personalInfo: updatedData.personalInfo, parentsInfo: updatedData.parentsInfo })
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
      await audit.logFailure('update', 'personal_info', studentId, error instanceof Error ? error.message : 'Unknown error')
      toast.error('שגיאה בשמירה אוטומטית')
    } finally {
      setIsSaving(false)
    }
  }, [draftData, isEditing, personalInfo, parentsInfo, studentId, student, onUpdate, audit])

  // Auto-save every 30 seconds when editing
  useEffect(() => {
    if (!isEditing) return
    
    const interval = setInterval(autoSave, 30000)
    return () => clearInterval(interval)
  }, [autoSave, isEditing])

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {}
    const currentPersonalInfo = { ...personalInfo, ...draftData.personalInfo }
    
    // Required fields validation
    if (!currentPersonalInfo.firstName?.trim()) {
      errors.firstName = 'שם פרטי הוא שדה חובה'
    }

    if (!currentPersonalInfo.lastName?.trim()) {
      errors.lastName = 'שם משפחה הוא שדה חובה'
    }
    
    if (!currentPersonalInfo.idNumber?.trim()) {
      errors.idNumber = 'תעודת זהות הוא שדה חובה'
    } else if (!validateIsraeliId(currentPersonalInfo.idNumber)) {
      errors.idNumber = 'תעודת זהות אינה תקינה'
    }
    
    if (currentPersonalInfo.phone && !validateIsraeliPhone(currentPersonalInfo.phone)) {
      errors.phone = 'מספר טלפון אינו תקין'
    }
    
    if (currentPersonalInfo.email && !validateEmail(currentPersonalInfo.email)) {
      errors.email = 'כתובת אימייל אינה תקינה'
    }
    
    if (currentPersonalInfo.parentPhone && !validateIsraeliPhone(currentPersonalInfo.parentPhone)) {
      errors.parentPhone = 'מספר טלפון הורה אינו תקין'
    }
    
    if (currentPersonalInfo.parentEmail && !validateEmail(currentPersonalInfo.parentEmail)) {
      errors.parentEmail = 'כתובת אימייל הורה אינה תקינה'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle field changes
  const handleFieldChange = (section: 'personalInfo' | 'parentsInfo', field: string, value: any) => {
    setDraftData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Save changes manually
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('יש לתקן את השגיאות בטופס')
      return
    }
    
    await autoSave()
    setIsEditing(false)
    setDraftData({ personalInfo: {}, parentsInfo: {} })
  }

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false)
    setDraftData({ personalInfo: {}, parentsInfo: {} })
    setValidationErrors({})
  }

  // Get current field value (draft or original)
  const getFieldValue = (section: 'personalInfo' | 'parentsInfo', field: string) => {
    const sectionData = section === 'personalInfo' ? personalInfo : parentsInfo
    const draftSectionData = draftData[section]
    return draftSectionData[field as keyof typeof draftSectionData] ?? (sectionData as any)?.[field] ?? ''
  }

  // Input component with validation
  const ValidatedInput: React.FC<{
    section: 'personalInfo' | 'parentsInfo'
    field: string
    label: string
    type?: string
    required?: boolean
    placeholder?: string
  }> = ({ section, field, label, type = 'text', required = false, placeholder }) => {
    const value = getFieldValue(section, field)
    const error = validationErrors[field]
    
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => handleFieldChange(section, field, e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            error 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
          }`}
        />
        {error && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    )
  }

  const InfoRow: React.FC<{ label: string; value: string | React.ReactNode; className?: string }> = ({ 
    label, 
    value, 
    className = '' 
  }) => (
    <div className={`flex justify-between items-start py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors duration-150 ${className}`}>
      <span className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0 ml-4">{label}</span>
      <span className="text-sm text-gray-900 text-right min-w-0 flex-1 font-medium">
        {value || <span className="text-gray-400 italic">לא צוין</span>}
      </span>
    </div>
  )

  return (
    <ViewWrapper 
      resourceType="personal_info" 
      studentId={studentId}
      fallback={
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Shield className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין הרשאה</h3>
          <p className="text-gray-600">אין לך הרשאה לצפות בפרטים האישיים של תלמיד זה</p>
        </div>
      }
    >
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">פרטים אישיים</h2>
          <p className="text-gray-600 mt-1">מידע אישי ופרטי קשר של התלמיד</p>
          {isEditing && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              {isSaving ? (
                <div className="flex items-center gap-1 text-blue-600">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>שומר...</span>
                </div>
              ) : lastSaved ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>נשמר לאחרונה: {lastSaved.toLocaleTimeString('he-IL')}</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Permission indicator */}
          <div className="flex items-center gap-2 text-sm">
            {userRole && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                {userRole}
              </span>
            )}
            {canView && !canEdit && (
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                <Shield className="w-3 h-3" />
                קריאה בלבד
              </span>
            )}
          </div>

          {/* Audit trail button */}
          <PermissionWrapper permission="view_audit_trail">
            <button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className={`flex items-center gap-1 px-3 py-1 text-sm border rounded-lg transition-colors ${
                showAuditTrail 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <History className="w-4 h-4" />
              לוג פעילות
            </button>
          </PermissionWrapper>

          {isEditing && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Save className="w-4 h-4" />
                שמור
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <X className="w-4 h-4" />
                ביטול
              </button>
            </>
          )}
          <EditWrapper 
            resourceType="personal_info" 
            studentId={studentId}
            fallback={
              <span className="text-sm text-gray-500 px-3 py-2">
                אין הרשאה לעריכה
              </span>
            }
          >
            <button
              onClick={() => {
                if (isEditing) {
                  handleCancel()
                } else {
                  setIsEditing(true)
                  audit.logView('personal_info', studentId, 'Edit mode entered')
                }
              }}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                isEditing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg'
              }`}
              style={{ minHeight: '44px' }}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            {isEditing ? 'ביטול' : 'עריכה'}
          </button>
        </EditWrapper>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Basic Information */}
        <InfoSection title="מידע בסיסי" icon={User}>
          {!isEditing ? (
            <div className="space-y-1">
              <InfoRow label="שם פרטי" value={personalInfo.firstName} />
              <InfoRow label="שם משפחה" value={personalInfo.lastName} />
              <InfoRow label="תעודת זהות" value={personalInfo.idNumber} />
              <InfoRow label="תאריך לידה" value={formatDate(personalInfo.birthDate)} />
              <InfoRow label="גיל" value={age ? `${age} שנים` : 'לא צוין'} />
              <InfoRow 
                label="סטטוס" 
                value={
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <UserCheck className="w-3 h-3" />
                    {isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                } 
              />
              <InfoRow label="תאריך רישום" value={formatDate(registrationDate)} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                section="personalInfo"
                field="firstName"
                label="שם פרטי"
                required
                placeholder="הכנס שם פרטי"
              />
              <ValidatedInput
                section="personalInfo"
                field="lastName"
                label="שם משפחה"
                required
                placeholder="הכנס שם משפחה"
              />
              <ValidatedInput
                section="personalInfo"
                field="idNumber"
                label="תעודת זהות"
                required
                placeholder="123456789"
              />
              <ValidatedInput
                section="personalInfo"
                field="birthDate"
                label="תאריך לידה"
                type="date"
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">גיל</label>
                <input
                  type="number"
                  value={getFieldValue('personalInfo', 'age')}
                  onChange={(e) => handleFieldChange('personalInfo', 'age', parseInt(e.target.value) || 0)}
                  placeholder="גיל"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </InfoSection>

        {/* Contact Information */}
        <InfoSection title="פרטי קשר" icon={Phone}>
          {!isEditing ? (
            <div className="space-y-1">
              <InfoRow 
                label="טלפון" 
                value={personalInfo.phone ? (
                  <a href={`tel:${personalInfo.phone}`} className="text-primary-600 hover:text-primary-700">
                    {personalInfo.phone}
                  </a>
                ) : 'לא צוין'} 
              />
              <InfoRow 
                label="אימייל" 
                value={personalInfo.email ? (
                  <a href={`mailto:${personalInfo.email}`} className="text-primary-600 hover:text-primary-700">
                    {personalInfo.email}
                  </a>
                ) : 'לא צוין'} 
              />
              {personalInfo.address && (
                <>
                  <InfoRow label="רחוב" value={personalInfo.address.street} />
                  <InfoRow label="עיר" value={personalInfo.address.city} />
                  <InfoRow label="מיקוד" value={personalInfo.address.zipCode} />
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  section="personalInfo"
                  field="phone"
                  label="טלפון"
                  placeholder="050-1234567"
                />
                <ValidatedInput
                  section="personalInfo"
                  field="email"
                  label="אימייל"
                  type="email"
                  placeholder="student@example.com"
                />
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">כתובת</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ValidatedInput
                    section="personalInfo"
                    field="address.street"
                    label="רחוב"
                    placeholder="רחוב הרצל 123"
                  />
                  <ValidatedInput
                    section="personalInfo"
                    field="address.city"
                    label="עיר"
                    placeholder="תל אביב"
                  />
                  <ValidatedInput
                    section="personalInfo"
                    field="address.zipCode"
                    label="מיקוד"
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          )}
        </InfoSection>

        {/* Parent Information */}
        <InfoSection title="פרטי הורים" icon={UserCheck} className="xl:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Primary Parent Contact */}
            <div className="bg-primary-50 rounded-lg p-4">
              <h4 className="font-semibold text-primary-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                איש קשר ראשי
              </h4>
              {!isEditing ? (
                <div className="space-y-1">
                  <InfoRow label="שם" value={personalInfo.parentName} />
                  <InfoRow 
                    label="טלפון" 
                    value={personalInfo.parentPhone ? (
                      <a href={`tel:${personalInfo.parentPhone}`} className="text-primary-600 hover:text-primary-700">
                        {personalInfo.parentPhone}
                      </a>
                    ) : 'לא צוין'} 
                  />
                  <InfoRow 
                    label="אימייל" 
                    value={personalInfo.parentEmail ? (
                      <a href={`mailto:${personalInfo.parentEmail}`} className="text-primary-600 hover:text-primary-700">
                        {personalInfo.parentEmail}
                      </a>
                    ) : 'לא צוין'} 
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <ValidatedInput
                    section="personalInfo"
                    field="parentName"
                    label="שם"
                    required
                    placeholder="שם ההורה"
                  />
                  <ValidatedInput
                    section="personalInfo"
                    field="parentPhone"
                    label="טלפון"
                    required
                    placeholder="050-1234567"
                  />
                  <ValidatedInput
                    section="personalInfo"
                    field="parentEmail"
                    label="אימייל"
                    type="email"
                    placeholder="parent@example.com"
                  />
                </div>
              )}
            </div>

            {/* Father Info */}
            {parentsInfo?.father && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  אב
                </h4>
                <div className="space-y-1">
                  <InfoRow label="שם" value={parentsInfo.father.name} />
                  <InfoRow 
                    label="טלפון" 
                    value={parentsInfo.father.phone ? (
                      <a href={`tel:${parentsInfo.father.phone}`} className="text-primary-600 hover:text-primary-700">
                        {parentsInfo.father.phone}
                      </a>
                    ) : 'לא צוין'} 
                  />
                  <InfoRow 
                    label="אימייל" 
                    value={parentsInfo.father.email ? (
                      <a href={`mailto:${parentsInfo.father.email}`} className="text-primary-600 hover:text-primary-700">
                        {parentsInfo.father.email}
                      </a>
                    ) : 'לא צוין'} 
                  />
                  <InfoRow label="מקצוע" value={parentsInfo.father.occupation} />
                </div>
              </div>
            )}

            {/* Mother Info */}
            {parentsInfo?.mother && (
              <div className="bg-pink-50 rounded-lg p-4">
                <h4 className="font-semibold text-pink-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  אם
                </h4>
                <div className="space-y-1">
                  <InfoRow label="שם" value={parentsInfo.mother.name} />
                  <InfoRow 
                    label="טלפון" 
                    value={parentsInfo.mother.phone ? (
                      <a href={`tel:${parentsInfo.mother.phone}`} className="text-primary-600 hover:text-primary-700">
                        {parentsInfo.mother.phone}
                      </a>
                    ) : 'לא צוין'} 
                  />
                  <InfoRow 
                    label="אימייל" 
                    value={parentsInfo.mother.email ? (
                      <a href={`mailto:${parentsInfo.mother.email}`} className="text-primary-600 hover:text-primary-700">
                        {parentsInfo.mother.email}
                      </a>
                    ) : 'לא צוין'} 
                  />
                  <InfoRow label="מקצוע" value={parentsInfo.mother.occupation} />
                </div>
              </div>
            )}

            {/* Guardian Info */}
            {parentsInfo?.guardian && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  אפוטרופוס
                </h4>
                <div className="space-y-1">
                  <InfoRow label="שם" value={parentsInfo.guardian.name} />
                  <InfoRow 
                    label="טלפון" 
                    value={parentsInfo.guardian.phone ? (
                      <a href={`tel:${parentsInfo.guardian.phone}`} className="text-primary-600 hover:text-primary-700">
                        {parentsInfo.guardian.phone}
                      </a>
                    ) : 'לא צוין'} 
                  />
                  <InfoRow 
                    label="אימייל" 
                    value={parentsInfo.guardian.email ? (
                      <a href={`mailto:${parentsInfo.guardian.email}`} className="text-primary-600 hover:text-primary-700">
                        {parentsInfo.guardian.email}
                      </a>
                    ) : 'לא צוין'} 
                  />
                  <InfoRow label="קרבה משפחתית" value={parentsInfo.guardian.relationship} />
                </div>
              </div>
            )}
          </div>
        </InfoSection>

        {/* Emergency Contact */}
        {(personalInfo.emergencyContact || isEditing) && (
          <InfoSection title="איש קשר לחירום" icon={Phone} className="xl:col-span-2">
            <div className="bg-red-50 rounded-lg p-4">
              {!isEditing ? (
                personalInfo.emergencyContact && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoRow label="שם" value={personalInfo.emergencyContact.name} />
                    <InfoRow 
                      label="טלפון" 
                      value={personalInfo.emergencyContact.phone ? (
                        <a href={`tel:${personalInfo.emergencyContact.phone}`} className="text-primary-600 hover:text-primary-700">
                          {personalInfo.emergencyContact.phone}
                        </a>
                      ) : 'לא צוין'} 
                    />
                    <InfoRow label="קרבה משפחתית" value={personalInfo.emergencyContact.relationship} />
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ValidatedInput
                    section="personalInfo"
                    field="emergencyContact.name"
                    label="שם"
                    placeholder="שם איש הקשר"
                  />
                  <ValidatedInput
                    section="personalInfo"
                    field="emergencyContact.phone"
                    label="טלפון"
                    placeholder="050-1234567"
                  />
                  <ValidatedInput
                    section="personalInfo"
                    field="emergencyContact.relationship"
                    label="קרבה משפחתית"
                    placeholder="דוד/דודה, סבא/סבתא וכו'"
                  />
                </div>
              )}
            </div>
          </InfoSection>
        )}
      </div>

      {/* Status Banner for Inactive Students */}
      {!isActive && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-800">תלמיד לא פעיל</h3>
              <p className="text-sm text-orange-700 mt-1">
                תלמיד זה מסומן כלא פעיל. חלק מהפעולות עשויות להיות מוגבלות.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Panel */}
      {showAuditTrail && (
        <AuditTrailPanel 
          studentId={studentId} 
          className="mt-6"
        />
      )}
      </div>
    </ViewWrapper>
  )
}

export default PersonalInfoTab