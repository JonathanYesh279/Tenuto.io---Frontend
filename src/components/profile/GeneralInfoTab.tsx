// Design system tokens: verified compliant (Phase 82)
// Card containers use rounded-card, border-border, shadow-1
// Status message colors (emerald/red) are semantic feedback, not card styling
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import { Button, Chip } from '@heroui/react'

import { teacherService } from '../../services/apiService.js'
import type { TeacherProfile, TeacherProfileUpdateData } from '../../types/teacher.types'
import { getDisplayName, formatAddress } from '../../utils/nameUtils'
import {
  CalendarIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  FloppyDiskIcon,
  MapPinIcon,
  PencilSimpleIcon,
  PhoneIcon,
  WarningCircleIcon,
  XIcon,
  IdentificationCardIcon,
  ShieldCheckIcon,
  MusicNoteIcon,
} from '@phosphor-icons/react'

export default function GeneralInfoTab() {
  const { user, checkAuthStatus } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [profileData, setProfileData] = useState<TeacherProfile | null>(null)

  const [editedUser, setEditedUser] = useState<TeacherProfileUpdateData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
  })

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      const profile = await teacherService.getMyProfile()
      setProfileData(profile)

      const displayName = getDisplayName(profile?.personalInfo)
      setEditedUser({
        firstName:
          profile?.personalInfo?.firstName || displayName.split(' ')[0] || '',
        lastName:
          profile?.personalInfo?.lastName ||
          displayName.split(' ').slice(1).join(' ') ||
          '',
        email: profile?.personalInfo?.email || '',
        phone: profile?.personalInfo?.phone || '',
        address: formatAddress(profile?.personalInfo?.address),
        birthDate: profile?.personalInfo?.birthDate || '',
      })
    } catch (error) {
      console.error('Error fetching profile data:', error)
      setSaveStatus({ type: 'error', message: 'שגיאה בטעינת פרטי הפרופיל' })

      if (user) {
        const fallbackName = getDisplayName(user?.personalInfo)
        setEditedUser({
          firstName:
            user?.personalInfo?.firstName || fallbackName.split(' ')[0] || '',
          lastName:
            user?.personalInfo?.lastName ||
            fallbackName.split(' ').slice(1).join(' ') ||
            '',
          email: user?.personalInfo?.email || user?.email || '',
          phone: user?.personalInfo?.phone || user?.phone || '',
          address: formatAddress(
            user?.personalInfo?.address || user?.address
          ),
          birthDate:
            user?.personalInfo?.birthDate || user?.birthDate || '',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setSaveStatus({ type: null, message: '' })

      const updatedProfile = await teacherService.updateMyProfile(editedUser)
      setProfileData(updatedProfile)

      if (checkAuthStatus) {
        await checkAuthStatus(true)
      }

      setIsEditing(false)
      setSaveStatus({ type: 'success', message: 'הפרופיל עודכן בהצלחה' })

      setTimeout(() => {
        setSaveStatus({ type: null, message: '' })
      }, 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setSaveStatus({
        type: 'error',
        message: 'שגיאה בעדכון הפרופיל. אנא נסה שוב.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    const currentData = profileData || user
    const cancelName = getDisplayName(currentData?.personalInfo)
    setEditedUser({
      firstName:
        currentData?.personalInfo?.firstName ||
        cancelName.split(' ')[0] ||
        '',
      lastName:
        currentData?.personalInfo?.lastName ||
        cancelName.split(' ').slice(1).join(' ') ||
        '',
      email:
        currentData?.personalInfo?.email || currentData?.email || '',
      phone:
        currentData?.personalInfo?.phone || currentData?.phone || '',
      address: formatAddress(
        currentData?.personalInfo?.address || currentData?.address
      ),
      birthDate:
        currentData?.personalInfo?.birthDate ||
        currentData?.birthDate ||
        '',
    })
    setIsEditing(false)
    setSaveStatus({ type: null, message: '' })
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('he-IL')
  }

  const displayData = profileData || user

  if (isLoading && !displayData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">טוען פרטי פרופיל...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {saveStatus.type && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <WarningCircleIcon className="w-5 h-5" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Personal Information Card */}
      <div className="bg-card rounded-card border border-border p-6 shadow-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground">פרטים אישיים</h3>
          {!isEditing ? (
            <Button
              color="primary"
              variant="solid"
              size="sm"
              onPress={() => setIsEditing(true)}
              isDisabled={isLoading}
              startContent={<PencilSimpleIcon className="w-4 h-4" />}
            >
              עריכה
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                color="success"
                variant="solid"
                size="sm"
                onPress={handleSave}
                isLoading={isLoading}
                isDisabled={isLoading}
                startContent={
                  !isLoading ? (
                    <FloppyDiskIcon className="w-4 h-4" />
                  ) : undefined
                }
              >
                שמירה
              </Button>
              <Button
                color="default"
                variant="flat"
                size="sm"
                onPress={handleCancel}
                isDisabled={isLoading}
                startContent={<XIcon className="w-4 h-4" />}
              >
                ביטול
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* First Name */}
          <InfoField
            label="שם פרטי"
            value={editedUser.firstName}
            placeholder="הזן שם פרטי"
            isEditing={isEditing}
            onChange={(val) =>
              setEditedUser((prev) => ({ ...prev, firstName: val }))
            }
            dir="rtl"
          />

          {/* Last Name */}
          <InfoField
            label="שם משפחה"
            value={editedUser.lastName}
            placeholder="הזן שם משפחה"
            isEditing={isEditing}
            onChange={(val) =>
              setEditedUser((prev) => ({ ...prev, lastName: val }))
            }
            dir="rtl"
          />

          {/* Email */}
          <InfoField
            label="דוא״ל"
            value={editedUser.email}
            placeholder="example@email.com"
            isEditing={isEditing}
            onChange={(val) =>
              setEditedUser((prev) => ({ ...prev, email: val }))
            }
            type="email"
            dir="ltr"
            icon={<EnvelopeIcon className="w-4 h-4 text-muted-foreground" />}
          />

          {/* Phone */}
          <InfoField
            label="טלפון"
            value={editedUser.phone}
            placeholder="050-1234567"
            isEditing={isEditing}
            onChange={(val) =>
              setEditedUser((prev) => ({ ...prev, phone: val }))
            }
            type="tel"
            dir="ltr"
            icon={<PhoneIcon className="w-4 h-4 text-muted-foreground" />}
          />

          {/* Address */}
          <InfoField
            label="כתובת"
            value={editedUser.address}
            placeholder="הזן כתובת"
            isEditing={isEditing}
            onChange={(val) =>
              setEditedUser((prev) => ({ ...prev, address: val }))
            }
            dir="rtl"
            icon={<MapPinIcon className="w-4 h-4 text-muted-foreground" />}
          />

          {/* Birth Date */}
          <InfoField
            label="תאריך לידה"
            value={editedUser.birthDate}
            displayValue={formatDate(editedUser.birthDate)}
            placeholder=""
            isEditing={isEditing}
            onChange={(val) =>
              setEditedUser((prev) => ({ ...prev, birthDate: val }))
            }
            type="date"
            icon={<CalendarIcon className="w-4 h-4 text-muted-foreground" />}
          />
        </div>
      </div>

      {/* Role Information Card */}
      <div className="bg-primary/5 rounded-card border border-primary/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheckIcon className="w-5 h-5 text-primary" />
          <h4 className="text-lg font-semibold text-foreground">מידע תפקיד</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              תפקיד
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const roles = displayData?.roles || []
                if (roles.length > 0) {
                  return roles.map((role: string, idx: number) => {
                    const roleLabel = (() => {
                      switch (role) {
                        case 'teacher':
                        case 'מורה':
                          return 'מורה'
                        case 'conductor':
                        case 'מנצח':
                          return 'מנצח'
                        case 'theory_teacher':
                        case 'מורה תיאוריה':
                          return 'מורה תיאוריה'
                        case 'admin':
                        case 'מנהל':
                          return 'מנהל'
                        default:
                          return role
                      }
                    })()
                    return (
                      <Chip
                        key={idx}
                        color="primary"
                        variant="flat"
                        size="sm"
                      >
                        {roleLabel}
                      </Chip>
                    )
                  })
                }
                const role = displayData?.role || ''
                const roleLabel = (() => {
                  switch (role) {
                    case 'teacher':
                    case 'מורה':
                      return 'מורה'
                    case 'conductor':
                    case 'מנצח':
                      return 'מנצח'
                    case 'theory_teacher':
                    case 'מורה תיאוריה':
                      return 'מורה תיאוריה'
                    case 'admin':
                    case 'מנהל':
                      return 'מנהל'
                    default:
                      return role || 'לא צוין'
                  }
                })()
                return (
                  <Chip color="primary" variant="flat" size="sm">
                    {roleLabel}
                  </Chip>
                )
              })()}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              מזהה משתמש
            </span>
            <div className="flex items-center gap-2">
              <IdentificationCardIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-mono text-sm">
                {displayData?.teacherId ||
                  displayData?._id ||
                  displayData?.id ||
                  'לא צוין'}
              </span>
            </div>
          </div>

          {displayData?.isActive !== undefined && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                סטטוס
              </span>
              <div>
                <Chip
                  color={displayData.isActive ? 'success' : 'default'}
                  variant="flat"
                  size="sm"
                >
                  {displayData.isActive ? 'פעיל' : 'לא פעיל'}
                </Chip>
              </div>
            </div>
          )}

          {displayData?.professionalInfo?.instrument && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                כלי נגינה
              </span>
              <div className="flex items-center gap-2">
                <MusicNoteIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {displayData.professionalInfo.instrument}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Reusable info field component for display/edit mode
interface InfoFieldProps {
  label: string
  value: string
  displayValue?: string
  placeholder: string
  isEditing: boolean
  onChange: (value: string) => void
  type?: string
  dir?: 'rtl' | 'ltr'
  icon?: React.ReactNode
}

function InfoField({
  label,
  value,
  displayValue,
  placeholder,
  isEditing,
  onChange,
  type = 'text',
  dir = 'rtl',
  icon,
}: InfoFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      {isEditing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-colors"
          dir={dir}
          placeholder={placeholder}
        />
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 rounded-lg min-h-[42px]">
          {icon}
          <span className="text-sm text-foreground" dir={dir}>
            {displayValue || value || 'לא צוין'}
          </span>
        </div>
      )}
    </div>
  )
}
