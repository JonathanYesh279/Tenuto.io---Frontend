/**
 * ProfileCard - Right-column profile card for the Student Dashboard.
 *
 * Displays avatar, badges, contact actions, contact info, parent info,
 * teacher assignments, instrument progress, and inline edit mode.
 * Replaces PersonalInfoTabSimple + parts of AcademicInfoTabSimple in card layout.
 */

import { useState, useEffect } from 'react'
import { User, Chip, Button } from '@heroui/react'
import {
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  FloppyDiskIcon,
  XIcon,
  ChatCircleDotsIcon,
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
    <div className="bg-card rounded-card border border-border overflow-hidden shadow-1">
      {/* Branded gradient accent bar */}
      <div
        className="h-20 w-full"
        style={{
          background: 'linear-gradient(135deg, #082753 0%, #43a579 100%)',
        }}
      />

      {/* Content area — avatar overlaps the gradient */}
      <div className="flex flex-col items-center -mt-10 px-6 pb-6 space-y-5">
        {/* 1. Avatar + name area */}
        <div className="flex flex-col items-center text-center">
          <User
            avatarProps={{
              radius: 'full',
              size: 'lg',
              showFallback: true,
              name: displayName,
              style: { backgroundColor: avatarColor },
              classNames: { base: 'w-20 h-20 text-2xl text-white ring-4 ring-card' },
            }}
            name=""
            description=""
            classNames={{ base: 'justify-center' }}
          />
          <h3 className="text-h3 font-bold text-foreground mt-3">{displayName}</h3>

          {/* Badges row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            {primaryInstrument && (
              <Chip color="primary" variant="flat" size="sm">
                {primaryInstrument}
              </Chip>
            )}
            {studentClass && (
              <Chip color="default" variant="flat" size="sm">
                כיתה {studentClass}
              </Chip>
            )}
          </div>

          {/* Subtitle: enrollment date */}
          {enrollmentDate && (
            <p className="text-small text-muted-foreground mt-2">
              תחילת לימודים: {formatDate(enrollmentDate)}
            </p>
          )}
        </div>

      {/* 2. Contact action buttons */}
      {(phone || studentEmail) && (
        <div className="flex items-center justify-center gap-2">
          {phone && (
            <Button
              as="a"
              href={`tel:${phone}`}
              isIconOnly
              variant="flat"
              size="sm"
              aria-label="התקשר"
            >
              <PhoneIcon className="w-4 h-4" />
            </Button>
          )}
          {studentEmail && (
            <Button
              as="a"
              href={`mailto:${studentEmail}`}
              isIconOnly
              variant="flat"
              size="sm"
              aria-label="שלח אימייל"
            >
              <EnvelopeIcon className="w-4 h-4" />
            </Button>
          )}
          {phone && (
            <Button
              as="a"
              href={getWhatsAppLink(phone)}
              target="_blank"
              rel="noopener noreferrer"
              isIconOnly
              variant="flat"
              size="sm"
              aria-label="WhatsApp"
            >
              <ChatCircleDotsIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* 3. Contact info section */}
      {(studentEmail || phone || address) && (
        <div className="space-y-2">
          <h4 className="text-small font-semibold text-foreground">פרטי קשר</h4>
          {studentEmail && (
            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{studentEmail}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <PhoneIcon className="w-4 h-4 flex-shrink-0" />
              <span>{phone}</span>
            </div>
          )}
          {address && (
            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <MapPinIcon className="w-4 h-4 flex-shrink-0" />
              <span>{address}</span>
            </div>
          )}
        </div>
      )}

      {/* 4. Parent contact section */}
      {(personalInfo.parentName || personalInfo.parentPhone || personalInfo.parentEmail) && (
        <div className="space-y-2">
          <h4 className="text-small font-semibold text-foreground">הורים</h4>
          {personalInfo.parentName && (
            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <span>{personalInfo.parentName}</span>
            </div>
          )}
          {personalInfo.parentPhone && (
            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <PhoneIcon className="w-4 h-4 flex-shrink-0" />
              <span>{personalInfo.parentPhone}</span>
            </div>
          )}
          {personalInfo.parentEmail && (
            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{personalInfo.parentEmail}</span>
            </div>
          )}
        </div>
      )}

      {/* 5. Teacher assignments section */}
      {teacherAssignments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-small font-semibold text-foreground">מורים</h4>
          {teacherAssignments
            .filter((ta: any) => ta.isActive)
            .map((ta: any, idx: number) => {
              const teacher = teacherMap[ta.teacherId]
              const teacherName = teacher
                ? `${teacher.firstName} ${teacher.lastName}`.trim()
                : 'מורה'
              return (
                <div key={ta._id || idx} className="flex items-center justify-between gap-2">
                  <span className="text-small text-muted-foreground">{teacherName}</span>
                  {ta.instrumentName && (
                    <Chip size="sm" variant="flat" color="secondary">
                      {ta.instrumentName}
                    </Chip>
                  )}
                </div>
              )
            })}
        </div>
      )}

      {/* 6. Additional info: instruments with stages */}
      {academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-small font-semibold text-foreground">כלי נגינה</h4>
          {academicInfo.instrumentProgress.map((inst: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <span className="text-small text-muted-foreground">{inst.instrumentName}</span>
              <Chip size="sm" variant="flat" color="default">
                שלב {inst.currentStage || 1}
              </Chip>
            </div>
          ))}
          {academicInfo.studyYears && (
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-small text-muted-foreground">שנות לימוד</span>
              <span className="text-small font-medium text-foreground">{academicInfo.studyYears}</span>
            </div>
          )}
        </div>
      )}

        {/* 7. Edit button */}
        <Button
          variant="flat"
          color="default"
          fullWidth
          onPress={() => setIsEditing(true)}
          startContent={<PencilIcon className="w-4 h-4" />}
        >
          עריכה
        </Button>
      </div>
    </div>
  )
}
