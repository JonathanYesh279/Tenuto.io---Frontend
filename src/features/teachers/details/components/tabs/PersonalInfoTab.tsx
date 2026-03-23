/**
 * Personal Info Tab Component
 *
 * Displays and allows editing of teacher's personal information
 */

import { useState } from 'react'
import { Button, Chip, Input, Switch, Select, SelectItem } from '@heroui/react'
import toast from 'react-hot-toast'

import { Teacher } from '../../types'
import { teacherDetailsApi } from '../../../../../services/teacherDetailsApi'
import { formatAddress } from '../../../../../utils/nameUtils'
import {
  Calendar as CalendarIcon,
  Certificate as CertificateIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  Envelope as EnvelopeIcon,
  FloppyDisk as FloppyDiskIcon,
  GraduationCap as GraduationCapIcon,
  IdentificationCard as IdentificationCardIcon,
  MapPin as MapPinIcon,
  Medal as MedalIcon,
  MusicNote as MusicNoteIcon,
  Pencil as PencilIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  User as UserIcon,
  UsersThree as UsersThreeIcon,
  WarningCircle as WarningCircleIcon,
  X as XIcon,
} from '@phosphor-icons/react'

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

// ─── Shared glass card style ────────────────────────────────────────────────
const glassCard: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,210,230,0.15) 50%, rgba(255,255,255,0.9) 100%)',
  boxShadow:
    '0 4px 16px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(200,220,240,0.5)',
}

// ─── Field tile — each field in its own soft container ───────────────────────
const FieldTile = ({
  icon,
  label,
  children,
  color = 'slate',
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'slate' | 'violet' | 'rose'
}) => {
  const bgMap = {
    blue: 'bg-blue-50/60 border-blue-100/50',
    indigo: 'bg-indigo-50/60 border-indigo-100/50',
    emerald: 'bg-emerald-50/60 border-emerald-100/50',
    amber: 'bg-amber-50/60 border-amber-100/50',
    slate: 'bg-slate-50/60 border-slate-100/50',
    violet: 'bg-violet-50/60 border-violet-100/50',
    rose: 'bg-rose-50/60 border-rose-100/50',
  }
  return (
    <div className={`rounded-xl border p-2.5 ${bgMap[color]}`}>
      <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">
        {icon}
        {label}
      </span>
      <div className="text-sm font-medium text-foreground leading-snug">{children}</div>
    </div>
  )
}

// ─── Section header ─────────────────────────────────────────────────────────
const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-sm font-bold text-foreground whitespace-nowrap">{children}</span>
    <div className="flex-1 h-px bg-border/60" />
  </div>
)

// ─── Main component ──────────────────────────────────────────────────────────
const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ teacher, teacherId }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [editedData, setEditedData] = useState({
    firstName: teacher.personalInfo?.firstName || '',
    lastName: teacher.personalInfo?.lastName || '',
    phone: teacher.personalInfo?.phone || '',
    email: teacher.personalInfo?.email || '',
    address: formatAddress(teacher.personalInfo?.address),
    idNumber: teacher.personalInfo?.idNumber || '',
    birthYear: teacher.personalInfo?.birthYear ?? '',
  })
  const [editedProfData, setEditedProfData] = useState({
    instrument: teacher.professionalInfo?.instrument || '',
    classification: teacher.professionalInfo?.classification || '',
    degree: teacher.professionalInfo?.degree || '',
    teachingExperienceYears: teacher.professionalInfo?.teachingExperienceYears ?? '',
    hasTeachingCertificate: teacher.professionalInfo?.hasTeachingCertificate ?? false,
    isUnionMember: teacher.professionalInfo?.isUnionMember ?? false,
  })

  // ── Validation ─────────────────────────────────────────────────────────────
  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return undefined
    const cleanPhone = phone.replace(/[\s\-]/g, '')
    if (!/^05\d{8}$/.test(cleanPhone)) {
      return 'מספר הטלפון בפורמט שגוי. יש להזין מספר בפורמט 05XXXXXXXX'
    }
    return undefined
  }

  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined
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
    return !Object.values(errors).some((error) => error !== undefined)
  }

  const cleanPhoneNumber = (phone: string): string => phone.replace(/[\s\-]/g, '')

  // ── Save / Cancel ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validateAllFields()) return

    try {
      setIsSaving(true)

      // Only send fields that have values — avoid sending null for unchanged empty fields
      const dataToSave: Record<string, any> = {
        firstName: editedData.firstName,
        lastName: editedData.lastName,
      }
      if (editedData.phone) dataToSave.phone = cleanPhoneNumber(editedData.phone)
      if (editedData.email) dataToSave.email = editedData.email
      if (editedData.address) dataToSave.address = editedData.address
      if (editedData.idNumber) dataToSave.idNumber = editedData.idNumber
      if (editedData.birthYear !== '') dataToSave.birthYear = Number(editedData.birthYear)

      await teacherDetailsApi.updateTeacherPersonalInfo(teacherId, dataToSave)

      // Also save professional info (API already wraps in { professionalInfo })
      const profToSave = {
        instrument: editedProfData.instrument || null,
        classification: editedProfData.classification || null,
        degree: editedProfData.degree || null,
        teachingExperienceYears: editedProfData.teachingExperienceYears === '' ? null : Number(editedProfData.teachingExperienceYears),
        hasTeachingCertificate: editedProfData.hasTeachingCertificate,
        isUnionMember: editedProfData.isUnionMember,
      }
      await teacherDetailsApi.updateTeacherProfessionalInfo(teacherId, profToSave)

      // Update local state
      Object.assign(teacher.personalInfo, dataToSave)
      Object.assign(teacher.professionalInfo, profToSave)

      toast.success('פרטי המורה עודכנו בהצלחה')
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error saving teacher personal info:', error)
      if (error.code === 'DUPLICATE_TEACHER_DETECTED') {
        toast.error('מורה עם פרטים דומים כבר קיים במערכת. בדוק אימייל וטלפון.')
      } else {
        toast.error(error.message || 'שגיאה בשמירת הנתונים')
      }
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
      idNumber: teacher.personalInfo?.idNumber || '',
      birthYear: teacher.personalInfo?.birthYear ?? '',
    })
    setEditedProfData({
      instrument: teacher.professionalInfo?.instrument || '',
      classification: teacher.professionalInfo?.classification || '',
      degree: teacher.professionalInfo?.degree || '',
      teachingExperienceYears: teacher.professionalInfo?.teachingExperienceYears ?? '',
      hasTeachingCertificate: teacher.professionalInfo?.hasTeachingCertificate ?? false,
      isUnionMember: teacher.professionalInfo?.isUnionMember ?? false,
    })
    setFieldErrors({})
    setIsEditing(false)
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const instruments: string[] =
    teacher.professionalInfo?.instruments?.length
      ? teacher.professionalInfo.instruments
      : teacher.professionalInfo?.instrument
        ? [teacher.professionalInfo.instrument]
        : []

  const teachingSubjects: string[] = teacher.professionalInfo?.teachingSubjects ?? []
  const roles: string[] = teacher.roles ?? []
  const weeklyHours = Math.round(
    (teacher.teaching?.timeBlocks?.reduce(
      (total, block) => total + (block.totalDuration || 0),
      0,
    ) || 0) / 60,
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4" dir="rtl">

      {/* Top row: action buttons + alerts */}
      <div className="flex items-center gap-3 flex-wrap">
        {!isEditing ? (
          <Button
            color="primary"
            variant="solid"
            size="sm"
            startContent={<PencilIcon className="w-4 h-4" />}
            onPress={() => setIsEditing(true)}
          >
            ערוך
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              color="primary"
              variant="solid"
              size="sm"
              isLoading={isSaving}
              startContent={!isSaving ? <FloppyDiskIcon className="w-4 h-4" /> : undefined}
              onPress={handleSave}
            >
              שמור
            </Button>
            <Button
              color="default"
              variant="flat"
              size="sm"
              isDisabled={isSaving}
              startContent={<XIcon className="w-4 h-4" />}
              onPress={handleCancel}
            >
              בטל
            </Button>
          </div>
        )}

      </div>

      {/* Main two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Left card: Basic Info ── */}
        <div className="rounded-card p-4" style={glassCard}>
          <SectionHeader>פרטים בסיסיים</SectionHeader>

          {isEditing ? (
            /* Edit mode — two columns of inputs */
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Input
                label="שם פרטי"
                placeholder="הכנס שם פרטי"
                value={editedData.firstName}
                isInvalid={!!fieldErrors.firstName}
                errorMessage={fieldErrors.firstName}
                startContent={<UserIcon className="w-4 h-4 text-muted-foreground" />}
                onValueChange={(v) => {
                  setEditedData({ ...editedData, firstName: v })
                  if (fieldErrors.firstName)
                    setFieldErrors({ ...fieldErrors, firstName: validateFirstName(v) })
                }}
                size="sm"
                variant="bordered"
              />
              <Input
                label="שם משפחה"
                placeholder="הכנס שם משפחה"
                value={editedData.lastName}
                isInvalid={!!fieldErrors.lastName}
                errorMessage={fieldErrors.lastName}
                startContent={<UserIcon className="w-4 h-4 text-muted-foreground" />}
                onValueChange={(v) => {
                  setEditedData({ ...editedData, lastName: v })
                  if (fieldErrors.lastName)
                    setFieldErrors({ ...fieldErrors, lastName: validateLastName(v) })
                }}
                size="sm"
                variant="bordered"
              />
              <Input
                label="טלפון"
                placeholder="05XXXXXXXX"
                type="tel"
                value={editedData.phone}
                isInvalid={!!fieldErrors.phone}
                errorMessage={fieldErrors.phone}
                startContent={<PhoneIcon className="w-4 h-4 text-muted-foreground" />}
                onValueChange={(v) => {
                  setEditedData({ ...editedData, phone: v })
                  if (fieldErrors.phone)
                    setFieldErrors({ ...fieldErrors, phone: validatePhone(v) })
                }}
                size="sm"
                variant="bordered"
              />
              <Input
                label='דוא"ל'
                placeholder="example@email.com"
                type="email"
                value={editedData.email}
                isInvalid={!!fieldErrors.email}
                errorMessage={fieldErrors.email}
                startContent={<EnvelopeIcon className="w-4 h-4 text-muted-foreground" />}
                onValueChange={(v) => {
                  setEditedData({ ...editedData, email: v })
                  if (fieldErrors.email)
                    setFieldErrors({ ...fieldErrors, email: validateEmail(v) })
                }}
                size="sm"
                variant="bordered"
              />
              <Input
                label="ת.ז."
                placeholder="9 ספרות"
                value={editedData.idNumber}
                startContent={<IdentificationCardIcon className="w-4 h-4 text-muted-foreground" />}
                onValueChange={(v) => setEditedData({ ...editedData, idNumber: v })}
                size="sm"
                variant="bordered"
                maxLength={9}
              />
              <Select
                label="שנת לידה"
                placeholder="בחר שנה"
                selectedKeys={editedData.birthYear ? [String(editedData.birthYear)] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string
                  setEditedData({ ...editedData, birthYear: val ? Number(val) : '' })
                }}
                size="sm"
                variant="bordered"
                startContent={<CalendarIcon className="w-4 h-4 text-muted-foreground" />}
              >
                {Array.from({ length: 2010 - 1940 + 1 }, (_, i) => 2010 - i).map((year) => (
                  <SelectItem key={String(year)} textValue={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </Select>
              <div className="col-span-2">
                <Input
                  label="כתובת"
                  placeholder="הכנס כתובת מגורים"
                  value={editedData.address}
                  isInvalid={!!fieldErrors.address}
                  errorMessage={fieldErrors.address}
                  startContent={<MapPinIcon className="w-4 h-4 text-muted-foreground" />}
                  onValueChange={(v) => {
                    setEditedData({ ...editedData, address: v })
                    if (fieldErrors.address)
                      setFieldErrors({ ...fieldErrors, address: validateAddress(v) })
                  }}
                  size="sm"
                  variant="bordered"
                />
              </div>
            </div>
          ) : (
            /* View mode — field tiles in grid */
            <div className="grid grid-cols-2 gap-2">
              <FieldTile icon={<UserIcon className="w-3 h-3" />} label="שם פרטי" color="blue">
                {teacher.personalInfo?.firstName || <span className="text-muted-foreground/60">לא צוין</span>}
              </FieldTile>
              <FieldTile icon={<UserIcon className="w-3 h-3" />} label="שם משפחה" color="blue">
                {teacher.personalInfo?.lastName || <span className="text-muted-foreground/60">לא צוין</span>}
              </FieldTile>
              <FieldTile icon={<PhoneIcon className="w-3 h-3" />} label="טלפון" color="emerald">
                {teacher.personalInfo?.phone ? (
                  <a href={`tel:${teacher.personalInfo.phone}`} className="text-primary hover:underline">{teacher.personalInfo.phone}</a>
                ) : <span className="text-muted-foreground/60">לא צוין</span>}
              </FieldTile>
              <FieldTile icon={<EnvelopeIcon className="w-3 h-3" />} label='דוא"ל' color="emerald">
                {teacher.personalInfo?.email ? (
                  <a href={`mailto:${teacher.personalInfo.email}`} className="text-primary hover:underline truncate block">{teacher.personalInfo.email}</a>
                ) : <span className="text-muted-foreground/60">לא צוין</span>}
              </FieldTile>
              <FieldTile icon={<IdentificationCardIcon className="w-3 h-3" />} label="ת.ז." color="slate">
                {teacher.personalInfo?.idNumber || <span className="text-muted-foreground/60">לא צוין</span>}
              </FieldTile>
              <FieldTile icon={<CalendarIcon className="w-3 h-3" />} label="שנת לידה" color="slate">
                {teacher.personalInfo?.birthYear ?? <span className="text-muted-foreground/60">לא צוין</span>}
              </FieldTile>
              <div className="col-span-2">
                <FieldTile icon={<MapPinIcon className="w-3 h-3" />} label="כתובת" color="indigo">
                  {formatAddress(teacher.personalInfo?.address) || <span className="text-muted-foreground/60">לא צוין</span>}
                </FieldTile>
              </div>
            </div>
          )}
        </div>

        {/* ── Right card: Professional Info ── */}
        <div className="rounded-card p-4" style={glassCard}>
          <SectionHeader>מידע מקצועי</SectionHeader>

          {isEditing ? (
            <div className="grid grid-cols-2 gap-2">
              <Input label="כלי נגינה" placeholder="כלי נגינה" value={editedProfData.instrument}
                onValueChange={(v) => setEditedProfData({ ...editedProfData, instrument: v })}
                startContent={<MusicNoteIcon className="w-4 h-4 text-muted-foreground" />}
                size="sm" variant="bordered" />
              <Input label="סיווג" placeholder="סיווג" value={editedProfData.classification}
                onValueChange={(v) => setEditedProfData({ ...editedProfData, classification: v })}
                startContent={<MedalIcon className="w-4 h-4 text-muted-foreground" />}
                size="sm" variant="bordered" />
              <Input label="תואר" placeholder="תואר" value={editedProfData.degree}
                onValueChange={(v) => setEditedProfData({ ...editedProfData, degree: v })}
                startContent={<MedalIcon className="w-4 h-4 text-muted-foreground" />}
                size="sm" variant="bordered" />
              <Input label="ותק בהוראה (שנים)" placeholder="מספר שנים" type="number"
                value={String(editedProfData.teachingExperienceYears)}
                onValueChange={(v) => setEditedProfData({ ...editedProfData, teachingExperienceYears: v === '' ? '' : Number(v) })}
                startContent={<CalendarIcon className="w-4 h-4 text-muted-foreground" />}
                size="sm" variant="bordered" />
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-slate-50/60 p-2.5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CertificateIcon className="w-3.5 h-3.5" /> תעודת הוראה
                </span>
                <Switch size="sm" isSelected={editedProfData.hasTeachingCertificate as boolean}
                  onValueChange={(v) => setEditedProfData({ ...editedProfData, hasTeachingCertificate: v })} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-slate-50/60 p-2.5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <UsersThreeIcon className="w-3.5 h-3.5" /> חבר ארגון עובדים
                </span>
                <Switch size="sm" isSelected={editedProfData.isUnionMember as boolean}
                  onValueChange={(v) => setEditedProfData({ ...editedProfData, isUnionMember: v })} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {/* Instruments tile */}
              <FieldTile icon={<MusicNoteIcon className="w-3 h-3" />} label="כלי נגינה" color="indigo">
                {instruments.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {instruments.map((inst, idx) => (
                      <Chip key={idx} color="primary" variant="flat" size="sm">{inst}</Chip>
                    ))}
                  </div>
                ) : <span className="text-muted-foreground/60">לא צוין</span>}
              </FieldTile>

              {/* Roles tile */}
              <FieldTile icon={<StarIcon className="w-3 h-3" />} label="תפקידים" color="amber">
                {roles.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {roles.map((role, idx) => (
                      <Chip key={idx} color="warning" variant="flat" size="sm">{role}</Chip>
                    ))}
                  </div>
                ) : <span className="text-muted-foreground/60">אין תפקידים</span>}
              </FieldTile>

              {/* Teaching subjects */}
              {teachingSubjects.length > 0 && (
                <div className="col-span-2">
                  <FieldTile icon={<GraduationCapIcon className="w-3 h-3" />} label="מקצועות הוראה" color="violet">
                    <div className="flex flex-wrap gap-1">
                      {teachingSubjects.map((subj, idx) => (
                        <Chip key={idx} color="secondary" variant="flat" size="sm">{subj}</Chip>
                      ))}
                    </div>
                  </FieldTile>
                </div>
              )}

              {/* Classification + Degree */}
              <FieldTile icon={<MedalIcon className="w-3 h-3" />} label="סיווג" color="slate">
                {teacher.professionalInfo?.classification || <span className="text-muted-foreground/60">לא צוין</span>}
              </FieldTile>
              <FieldTile icon={<MedalIcon className="w-3 h-3" />} label="תואר" color="slate">
                {teacher.professionalInfo?.degree || <span className="text-muted-foreground/60">לא צוין</span>}
              </FieldTile>

              {/* Experience + Status */}
              <FieldTile icon={<CalendarIcon className="w-3 h-3" />} label="ותק בהוראה" color="blue">
                {teacher.professionalInfo?.teachingExperienceYears != null
                  ? `${teacher.professionalInfo.teachingExperienceYears} שנים`
                  : <span className="text-muted-foreground/60">לא צוין</span>}
              </FieldTile>
              <FieldTile icon={<CheckCircleIcon className="w-3 h-3" />} label="סטטוס" color="emerald">
                <Chip color={teacher.isActive ? 'success' : 'danger'} variant="flat" size="sm">
                  {teacher.isActive ? 'פעיל' : 'לא פעיל'}
                </Chip>
              </FieldTile>

              {/* Certificate + Union */}
              <FieldTile icon={<CertificateIcon className="w-3 h-3" />} label="תעודת הוראה" color="rose">
                <Chip color={teacher.professionalInfo?.hasTeachingCertificate ? 'success' : 'default'} variant="flat" size="sm">
                  {teacher.professionalInfo?.hasTeachingCertificate ? 'כן' : 'לא'}
                </Chip>
              </FieldTile>
              <FieldTile icon={<UsersThreeIcon className="w-3 h-3" />} label="חבר ארגון עובדים" color="rose">
                <Chip color={teacher.professionalInfo?.isUnionMember ? 'success' : 'default'} variant="flat" size="sm">
                  {teacher.professionalInfo?.isUnionMember ? 'כן' : 'לא'}
                </Chip>
              </FieldTile>

              {/* Dates */}
              <FieldTile icon={<CalendarIcon className="w-3 h-3" />} label="תאריך הצטרפות" color="slate">
                {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('he-IL') : <span className="text-muted-foreground/60">לא ידוע</span>}
              </FieldTile>
              {teacher.credentials?.lastLogin && (
                <FieldTile icon={<ClockIcon className="w-3 h-3" />} label="כניסה אחרונה" color="slate">
                  {new Date(teacher.credentials.lastLogin).toLocaleDateString('he-IL')}
                </FieldTile>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default PersonalInfoTab
