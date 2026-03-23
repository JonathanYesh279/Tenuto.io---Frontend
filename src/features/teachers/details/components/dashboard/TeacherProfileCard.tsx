/**
 * TeacherProfileCard - Teacher Dashboard profile card.
 *
 * Matches the student ProfileCard design: gradient header with curved bottom edge,
 * HeroUI avatar, contact popovers, and info tiles for instruments/roles/status.
 */

import { useState, useEffect } from 'react'
import { User, Chip, Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react'
import {
  PencilLine as PencilLineIcon,
  Phone as PhoneIcon,
  Envelope as EnvelopeIcon,
  FloppyDisk as FloppyDiskIcon,
  X as XIcon,
  ChatCircleDots as ChatCircleDotsIcon,
  WarningCircle as WarningCircleIcon,
} from '@phosphor-icons/react'
import { teacherDetailsApi } from '../../../../../services/teacherDetailsApi'
import { getDisplayName, formatAddress } from '../../../../../utils/nameUtils'
import { getAvatarColorHex } from '../../../../../utils/avatarColorHash'

interface TeacherProfileCardProps {
  teacher: any
  teacherId: string
  onTeacherUpdate: (updated: any) => void
}

export function TeacherProfileCard({ teacher, teacherId, onTeacherUpdate }: TeacherProfileCardProps) {
  const personalInfo = teacher?.personalInfo || {}
  const professionalInfo = teacher?.professionalInfo || {}
  const roles = teacher?.roles || []

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [editedData, setEditedData] = useState({
    firstName: personalInfo.firstName || '',
    lastName: personalInfo.lastName || '',
    phone: personalInfo.phone || '',
    email: personalInfo.email || '',
    address: formatAddress(personalInfo.address),
  })

  useEffect(() => {
    setEditedData({
      firstName: personalInfo.firstName || '',
      lastName: personalInfo.lastName || '',
      phone: personalInfo.phone || '',
      email: personalInfo.email || '',
      address: formatAddress(personalInfo.address),
    })
  }, [personalInfo])

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return undefined
    const cleanPhone = phone.replace(/[\s\-]/g, '')
    if (!/^05\d{8}$/.test(cleanPhone)) return 'מספר הטלפון בפורמט שגוי'
    return undefined
  }

  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'כתובת דוא"ל אינה תקינה'
    return undefined
  }

  const handleSave = async () => {
    const errors: Record<string, string> = {}
    if (!editedData.firstName.trim()) errors.firstName = 'שם פרטי נדרש'
    if (!editedData.lastName.trim()) errors.lastName = 'שם משפחה נדרש'
    const phoneErr = validatePhone(editedData.phone)
    if (phoneErr) errors.phone = phoneErr
    const emailErr = validateEmail(editedData.email)
    if (emailErr) errors.email = emailErr
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setIsSaving(true)
      await teacherDetailsApi.updateTeacherPersonalInfo(teacherId, {
        ...editedData,
        phone: editedData.phone.replace(/[\s\-]/g, ''),
      })
      // Update local teacher data
      teacher.personalInfo.firstName = editedData.firstName
      teacher.personalInfo.lastName = editedData.lastName
      teacher.personalInfo.phone = editedData.phone
      teacher.personalInfo.email = editedData.email
      teacher.personalInfo.address = editedData.address
      onTeacherUpdate({ ...teacher })
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error saving teacher info:', error)
      let msg = 'שגיאה בשמירת הנתונים'
      if (error.message?.includes('Authentication')) msg = 'פג תוקף הפנייה. אנא התחבר מחדש.'
      alert(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData({
      firstName: personalInfo.firstName || '',
      lastName: personalInfo.lastName || '',
      phone: personalInfo.phone || '',
      email: personalInfo.email || '',
      address: formatAddress(personalInfo.address),
    })
    setFieldErrors({})
    setIsEditing(false)
  }

  // Derived values
  const displayName = getDisplayName(personalInfo)
  const avatarColor = getAvatarColorHex(displayName)
  const phone = personalInfo.phone || ''
  const email = personalInfo.email || ''

  const getWhatsAppLink = (phoneNum: string) => {
    const cleaned = phoneNum.replace(/^0/, '').replace(/[-\s]/g, '')
    return `https://wa.me/972${cleaned}`
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return ''
    try { return new Date(date).toLocaleDateString('he-IL') } catch { return '' }
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="bg-white rounded-card border border-border shadow-1 h-full p-4 space-y-2">
        <h3 className="text-sm font-bold text-foreground">עריכת פרטים אישיים</h3>

        <div className="space-y-2">
          {[
            { key: 'firstName', label: 'שם פרטי', type: 'text', placeholder: 'שם פרטי' },
            { key: 'lastName', label: 'שם משפחה', type: 'text', placeholder: 'שם משפחה' },
            { key: 'phone', label: 'טלפון', type: 'tel', placeholder: '05XXXXXXXX' },
            { key: 'email', label: 'דוא"ל', type: 'email', placeholder: 'example@email.com' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-[11px] text-muted-foreground mb-0.5">{label}</label>
              <input
                type={type}
                value={editedData[key as keyof typeof editedData]}
                onChange={(e) => {
                  setEditedData({ ...editedData, [key]: e.target.value })
                  if (fieldErrors[key]) setFieldErrors({ ...fieldErrors, [key]: '' })
                }}
                className={`w-full px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-2 text-xs ${
                  fieldErrors[key] ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-primary'
                }`}
                placeholder={placeholder}
              />
              {fieldErrors[key] && (
                <p className="text-[11px] text-red-600 flex items-center gap-1 mt-0.5">
                  <WarningCircleIcon className="w-3 h-3" />
                  {fieldErrors[key]}
                </p>
              )}
            </div>
          ))}
          <div>
            <label className="block text-[11px] text-muted-foreground mb-0.5">כתובת</label>
            <input
              type="text"
              value={editedData.address}
              onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-xs"
              placeholder="כתובת"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            color="primary"
            variant="solid"
            size="sm"
            onPress={handleSave}
            isLoading={isSaving}
            isDisabled={isSaving}
            className="flex-1"
            startContent={!isSaving ? <FloppyDiskIcon className="w-3.5 h-3.5" /> : undefined}
          >
            {isSaving ? 'שומר...' : 'שמור'}
          </Button>
          <Button
            color="default"
            variant="flat"
            size="sm"
            onPress={handleCancel}
            isDisabled={isSaving}
            className="flex-1"
            startContent={<XIcon className="w-3.5 h-3.5" />}
          >
            בטל
          </Button>
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className="bg-card rounded-card border border-border overflow-hidden shadow-1">
      {/* Branded gradient with curved bottom edge */}
      <div className="relative">
        <div
          className="h-20 w-full"
          style={{ background: '#5b8fb9' }}
        />
        {/* Edit button */}
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 active:scale-95 z-10 flex items-center justify-center"
          style={{
            background: 'transparent',
            border: '1.5px solid rgba(255,255,255,0.6)',
          }}
          title="עריכה"
        >
          <PencilLineIcon size={13} className="text-white/80" weight="regular" />
        </button>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden" style={{ height: '50px' }}>
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            style={{ height: '50px', display: 'block' }}
          >
            <path d="M0,200 C480,60 960,60 1440,200 L1440,200 L0,200 Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* Content area — avatar overlaps gradient */}
      <div className="flex flex-col items-center -mt-10 px-3 pb-3 space-y-1.5 relative z-10">
        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center">
          <User
            avatarProps={{
              radius: 'full',
              size: 'md',
              showFallback: true,
              name: displayName,
              style: { backgroundColor: avatarColor },
              classNames: { base: 'w-11 h-11 text-base text-white ring-2 ring-card' },
            }}
            name=""
            description=""
            classNames={{ base: 'justify-center' }}
          />
          <h2 className="text-lg font-bold text-foreground mt-1">{displayName || 'ללא שם'}</h2>
        </div>

        {/* Quick contact icon row with popovers */}
        <div className="flex items-center justify-center gap-1.5">
          {/* Phone popover */}
          <Popover placement="bottom">
            <PopoverTrigger>
              <Button isIconOnly variant="flat" size="sm" aria-label="טלפון">
                <PhoneIcon className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="p-3 space-y-1.5 min-w-[200px]">
                <p className="text-xs font-semibold text-foreground">טלפון</p>
                {phone ? (
                  <a href={`tel:${phone}`} className="text-sm text-primary hover:underline block">{phone}</a>
                ) : (
                  <span className="text-sm text-muted-foreground">לא צוין</span>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Email popover */}
          <Popover placement="bottom">
            <PopoverTrigger>
              <Button isIconOnly variant="flat" size="sm" aria-label="דוא״ל">
                <EnvelopeIcon className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="p-3 space-y-1.5 min-w-[180px]">
                <p className="text-xs font-semibold text-foreground">דוא"ל</p>
                {email ? (
                  <a href={`mailto:${email}`} className="text-sm text-primary hover:underline block truncate">{email}</a>
                ) : (
                  <span className="text-sm text-muted-foreground">לא צוין</span>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* WhatsApp */}
          {phone && (
            <Button as="a" href={getWhatsAppLink(phone)} target="_blank" rel="noopener noreferrer" isIconOnly variant="flat" size="sm" aria-label="WhatsApp">
              <ChatCircleDotsIcon className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Info grid — elegant card tiles */}
        <div className="w-full grid grid-cols-2 gap-2 border-t border-border pt-3 text-sm">
          {/* Instruments tile */}
          <div className="rounded-xl bg-indigo-50/50 border border-indigo-100/60 p-2.5">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">כלי נגינה</h4>
            {professionalInfo.instruments && professionalInfo.instruments.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {professionalInfo.instruments.map((inst: string, idx: number) => (
                  <Chip key={idx} size="sm" variant="flat" color="primary">{inst}</Chip>
                ))}
              </div>
            ) : professionalInfo.instrument ? (
              <Chip size="sm" variant="flat" color="primary">{professionalInfo.instrument}</Chip>
            ) : (
              <span className="text-muted-foreground text-xs">לא צוין</span>
            )}
          </div>

          {/* Roles tile */}
          <div className="rounded-xl bg-amber-50/50 border border-amber-100/60 p-2.5">
            <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">תפקידים</h4>
            {roles.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {roles.map((role: string, idx: number) => (
                  <Chip key={idx} size="sm" variant="flat" color="warning">{role}</Chip>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">אין תפקידים</span>
            )}
          </div>

          {/* Status + Classification + Degree — bottom row */}
          <div className="col-span-2 rounded-xl bg-emerald-50/50 border border-emerald-100/60 p-2 flex items-center justify-center gap-1.5 flex-wrap">
            <Chip
              color={teacher?.isActive ? 'success' : 'danger'}
              variant="flat"
              size="sm"
            >
              {teacher?.isActive ? 'פעיל' : 'לא פעיל'}
            </Chip>
            {professionalInfo.classification && (
              <Chip color="default" variant="flat" size="sm">{professionalInfo.classification}</Chip>
            )}
            {professionalInfo.degree && (
              <Chip color="secondary" variant="flat" size="sm">{professionalInfo.degree}</Chip>
            )}
            {teacher?.createdAt && (
              <Chip color="default" variant="flat" size="sm">הצטרפות: {formatDate(teacher.createdAt)}</Chip>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
