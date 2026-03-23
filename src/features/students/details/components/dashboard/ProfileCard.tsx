/**
 * ProfileCard - Student Dashboard profile card (v2).
 *
 * Displays avatar, badges, contact actions, contact info, parent info,
 * teacher assignments, instrument progress, and inline edit mode.
 * Replaces PersonalInfoTabSimple + parts of AcademicInfoTabSimple in card layout.
 */

import { useState, useEffect } from 'react'
import { User, Chip, Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react'
import {
  PencilLineIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  FloppyDiskIcon,
  XIcon,
  ChatCircleDotsIcon,
  User as UserIcon,
  HouseIcon,
} from '@phosphor-icons/react'
import apiService from '../../../../../services/apiService'
import { getDisplayName, formatAddress } from '../../../../../utils/nameUtils'
import { getAvatarColorHex } from '../../../../../utils/avatarColorHash'

interface ProfileCardProps {
  student: any
  studentId: string
  teacherMap: Record<string, { firstName: string; lastName: string; instrument: string }>
  onStudentUpdate: (updated: any) => void
}

export function ProfileCard({ student, studentId, teacherMap, onStudentUpdate }: ProfileCardProps) {
  const personalInfo = student?.personalInfo || {}
  const academicInfo = student?.academicInfo || {}
  const teacherAssignments = student?.teacherAssignments || []

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedData, setEditedData] = useState({
    firstName: personalInfo.firstName || '',
    lastName: personalInfo.lastName || '',
    phone: personalInfo.phone || '',
    age: personalInfo.age || '',
    address: formatAddress(personalInfo.address),
    parentName: personalInfo.parentName || '',
    parentPhone: personalInfo.parentPhone || '',
    parentEmail: personalInfo.parentEmail || '',
    studentEmail: personalInfo.studentEmail || '',
  })

  // Sync editedData when student changes
  useEffect(() => {
    setEditedData({
      firstName: personalInfo.firstName || '',
      lastName: personalInfo.lastName || '',
      phone: personalInfo.phone || '',
      age: personalInfo.age || '',
      address: formatAddress(personalInfo.address),
      parentName: personalInfo.parentName || '',
      parentPhone: personalInfo.parentPhone || '',
      parentEmail: personalInfo.parentEmail || '',
      studentEmail: personalInfo.studentEmail || '',
    })
  }, [personalInfo])

  // Save handler - exact logic from PersonalInfoTabSimple
  const handleSave = async () => {
    try {
      setIsSaving(true)
      const updatedStudent = await apiService.students.updateStudent(studentId, {
        personalInfo: editedData,
      })
      onStudentUpdate(updatedStudent)
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error saving student personal info:', error)
      let errorMessage = 'שגיאה בשמירת הנתונים'
      if (error.message?.includes('Authentication failed')) {
        errorMessage = 'פג תוקף הפנייה. אנא התחבר מחדש.'
      } else if (error.message?.includes('validation')) {
        errorMessage = 'שגיאה בנתונים שהוזנו. אנא בדוק את הפרטים האישיים.'
      } else if (error.message?.includes('not found')) {
        errorMessage = 'התלמיד לא נמצא במערכת.'
      } else if (error.message?.includes('Network')) {
        errorMessage = 'שגיאת רשת. אנא בדוק את החיבור לאינטרנט.'
      }
      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData({
      firstName: personalInfo.firstName || '',
      lastName: personalInfo.lastName || '',
      phone: personalInfo.phone || '',
      age: personalInfo.age || '',
      address: formatAddress(personalInfo.address),
      parentName: personalInfo.parentName || '',
      parentPhone: personalInfo.parentPhone || '',
      parentEmail: personalInfo.parentEmail || '',
      studentEmail: personalInfo.studentEmail || '',
    })
    setIsEditing(false)
  }

  // Derived values
  const displayName = getDisplayName(personalInfo)
  const avatarColor = getAvatarColorHex(displayName)
  const phone = personalInfo.phone || ''
  const studentEmail = personalInfo.studentEmail || ''
  const address = formatAddress(personalInfo.address)
  const enrollmentDate = student?.startDate || student?.registrationDate

  // Primary instrument from instrumentProgress or teacherAssignments
  const primaryInstrument =
    academicInfo.instrumentProgress?.[0]?.instrumentName ||
    teacherAssignments[0]?.instrumentName ||
    ''
  const studentClass = academicInfo.class || ''

  // Format date for display
  const formatDate = (date: string | undefined) => {
    if (!date) return ''
    try {
      return new Date(date).toLocaleDateString('he-IL')
    } catch {
      return ''
    }
  }

  // WhatsApp link helper
  const getWhatsAppLink = (phoneNum: string) => {
    const cleaned = phoneNum.replace(/^0/, '').replace(/[-\s]/g, '')
    return `https://wa.me/972${cleaned}`
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="bg-white rounded-card border border-border p-6 space-y-4 shadow-1">
        <h3 className="text-h4 font-bold text-foreground">עריכת פרטים אישיים</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-small text-muted-foreground mb-1">שם פרטי</label>
            <input
              type="text"
              value={editedData.firstName}
              onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small"
              placeholder="שם פרטי"
            />
          </div>
          <div>
            <label className="block text-small text-muted-foreground mb-1">שם משפחה</label>
            <input
              type="text"
              value={editedData.lastName}
              onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small"
              placeholder="שם משפחה"
            />
          </div>
          <div>
            <label className="block text-small text-muted-foreground mb-1">טלפון</label>
            <input
              type="tel"
              value={editedData.phone}
              onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small"
              placeholder="מספר טלפון"
            />
          </div>
          <div>
            <label className="block text-small text-muted-foreground mb-1">גיל</label>
            <input
              type="number"
              value={editedData.age}
              onChange={(e) => setEditedData({ ...editedData, age: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small"
              placeholder="גיל"
              min="1"
              max="99"
            />
          </div>
          <div>
            <label className="block text-small text-muted-foreground mb-1">אימייל תלמיד</label>
            <input
              type="email"
              value={editedData.studentEmail}
              onChange={(e) => setEditedData({ ...editedData, studentEmail: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small"
              placeholder="דוא״ל תלמיד"
            />
          </div>
          <div>
            <label className="block text-small text-muted-foreground mb-1">כתובת</label>
            <textarea
              value={editedData.address}
              onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small resize-none"
              placeholder="כתובת"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-small text-muted-foreground mb-1">שם הורה</label>
            <input
              type="text"
              value={editedData.parentName}
              onChange={(e) => setEditedData({ ...editedData, parentName: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small"
              placeholder="שם הורה"
            />
          </div>
          <div>
            <label className="block text-small text-muted-foreground mb-1">טלפון הורה</label>
            <input
              type="tel"
              value={editedData.parentPhone}
              onChange={(e) => setEditedData({ ...editedData, parentPhone: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small"
              placeholder="טלפון הורה"
            />
          </div>
          <div>
            <label className="block text-small text-muted-foreground mb-1">אימייל הורה</label>
            <input
              type="email"
              value={editedData.parentEmail}
              onChange={(e) => setEditedData({ ...editedData, parentEmail: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small"
              placeholder="דוא״ל הורה"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            color="success"
            variant="solid"
            onPress={handleSave}
            isLoading={isSaving}
            isDisabled={isSaving}
            className="flex-1"
            startContent={!isSaving ? <FloppyDiskIcon className="w-4 h-4" /> : undefined}
          >
            {isSaving ? 'שומר...' : 'שמור'}
          </Button>
          <Button
            color="default"
            variant="flat"
            onPress={handleCancel}
            isDisabled={isSaving}
            className="flex-1"
            startContent={<XIcon className="w-4 h-4" />}
          >
            בטל
          </Button>
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className="bg-card rounded-card border border-border overflow-hidden shadow-1 h-full flex flex-col">
      {/* Branded gradient with curved bottom edge */}
      <div className="relative">
        <div
          className="h-28 w-full"
          style={{
            background: '#6ec49d',
          }}
        />
        {/* Edit button — top right corner */}
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 active:scale-95 z-10 flex items-center justify-center"
          style={{
            background: 'transparent',
            border: '1.5px solid rgba(255,255,255,0.6)',
          }}
          title="עריכה"
        >
          <PencilLineIcon size={14} className="text-white/80" weight="regular" />
        </button>
        {/* Curved bottom — prominent arc */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden" style={{ height: '80px' }}>
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            style={{ height: '80px', display: 'block' }}
          >
            <path
              d="M0,200 C480,40 960,40 1440,200 L1440,200 L0,200 Z"
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Content area — avatar overlaps gradient */}
      <div className="flex flex-col items-center -mt-14 px-4 pb-4 space-y-2 flex-1 relative z-10">
        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center">
          <User
            avatarProps={{
              radius: 'full',
              size: 'lg',
              showFallback: true,
              name: displayName,
              style: { backgroundColor: avatarColor },
              classNames: { base: 'w-14 h-14 text-lg text-white ring-3 ring-card' },
            }}
            name=""
            description=""
            classNames={{ base: 'justify-center' }}
          />
          <h2 className="text-xl font-bold text-foreground mt-2">{displayName || 'ללא שם'}</h2>

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
            <div className="p-3 space-y-2.5 min-w-[200px]">
              <div>
                <p className="text-xs font-semibold text-foreground">טלפון תלמיד/ה</p>
                {phone ? (
                  <a href={`tel:${phone}`} className="text-sm text-primary hover:underline block">{phone}</a>
                ) : (
                  <span className="text-sm text-muted-foreground">לא צוין</span>
                )}
              </div>
              {(personalInfo.parentName || personalInfo.parentPhone) && (
                <div className="border-t border-border pt-2">
                  <p className="text-xs font-semibold text-foreground">הורה — {personalInfo.parentName || 'לא צוין'}</p>
                  {personalInfo.parentPhone ? (
                    <a href={`tel:${personalInfo.parentPhone}`} className="text-sm text-primary hover:underline block">{personalInfo.parentPhone}</a>
                  ) : (
                    <span className="text-sm text-muted-foreground">טלפון לא צוין</span>
                  )}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Email popover */}
        <Popover placement="bottom">
          <PopoverTrigger>
            <Button isIconOnly variant="flat" size="sm" aria-label="אימייל">
              <EnvelopeIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="p-3 space-y-1.5 min-w-[180px]">
              <p className="text-xs font-semibold text-foreground">אימייל תלמיד</p>
              {studentEmail ? (
                <a href={`mailto:${studentEmail}`} className="text-sm text-primary hover:underline block truncate">{studentEmail}</a>
              ) : (
                <span className="text-sm text-muted-foreground">לא צוין</span>
              )}
              {personalInfo.parentEmail && (
                <>
                  <p className="text-xs font-semibold text-foreground mt-2">אימייל הורה</p>
                  <a href={`mailto:${personalInfo.parentEmail}`} className="text-sm text-primary hover:underline block truncate">{personalInfo.parentEmail}</a>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Address popover */}
        <Popover placement="bottom">
          <PopoverTrigger>
            <Button isIconOnly variant="flat" size="sm" aria-label="כתובת">
              <HouseIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="p-3 min-w-[180px]">
              <p className="text-xs font-semibold text-foreground mb-1">כתובת</p>
              <span className="text-sm text-muted-foreground">{address || 'לא צוין'}</span>
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
      <div className="w-full grid grid-cols-2 gap-2.5 border-t border-border pt-4 text-sm">
        {/* Teachers tile */}
        <div className="rounded-xl bg-indigo-50/50 border border-indigo-100/60 p-3">
          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">מורים</h4>
          {teacherAssignments.filter((ta: any) => ta.isActive).length > 0 ? (
            <div className="space-y-1.5">
              {teacherAssignments
                .filter((ta: any) => ta.isActive)
                .map((ta: any, idx: number) => {
                  const teacher = teacherMap[ta.teacherId]
                  const teacherName = teacher
                    ? `${teacher.firstName} ${teacher.lastName}`.trim()
                    : 'מורה'
                  return (
                    <div key={ta._id || idx}>
                      <span className="text-foreground/80 font-medium text-xs block">{teacherName}</span>
                      {(ta.instrumentName || primaryInstrument) && (
                        <Chip size="sm" variant="flat" color="secondary" className="mt-1">{ta.instrumentName || primaryInstrument}</Chip>
                      )}
                    </div>
                  )
                })}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">לא צוין</span>
          )}
        </div>

        {/* Instruments tile */}
        <div className="rounded-xl bg-amber-50/50 border border-amber-100/60 p-3">
          <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">כלי נגינה</h4>
          {academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0 ? (
            <div className="space-y-1.5">
              {academicInfo.instrumentProgress.map((inst: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-1">
                  <span className="text-foreground/80 font-medium text-xs truncate">{inst.instrumentName}</span>
                  <Chip size="sm" variant="flat" color="default">שלב {inst.currentStage || 1}</Chip>
                </div>
              ))}
              {academicInfo.studyYears && (
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-amber-100/60">
                  <span className="text-muted-foreground text-xs">שנות לימוד</span>
                  <span className="font-bold text-foreground text-xs">{academicInfo.studyYears}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">לא צוין</span>
          )}
        </div>

        {/* Grade + Enrollment tile — bottom row */}
        <div className="col-span-2 rounded-xl bg-emerald-50/50 border border-emerald-100/60 p-3 flex items-center justify-center gap-2 flex-wrap">
          {studentClass && (
            <Chip color="primary" variant="flat" size="sm">כיתה {studentClass}</Chip>
          )}
          {enrollmentDate && (
            <Chip color="default" variant="flat" size="sm">תחילת לימודים: {formatDate(enrollmentDate)}</Chip>
          )}
        </div>
      </div>

      </div>
    </div>
  )
}
