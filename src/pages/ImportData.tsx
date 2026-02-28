import React, { useState, useRef, useCallback } from 'react'
import { importService } from '../services/apiService'
import { StepProgress } from '../components/feedback/ProgressIndicators'
import toast from 'react-hot-toast'
import {
  UploadIcon,
  FileXlsIcon,
  CheckCircleIcon,
  XCircleIcon,
  WarningIcon,
  UsersIcon,
  GraduationCapIcon,
  ArrowsClockwiseIcon,
  ArrowLeftIcon,
  PlusIcon,
  InfoIcon,
  BuildingsIcon,
  MusicNotesIcon,
} from '@phosphor-icons/react'

type ImportTab = 'teachers' | 'students' | 'conservatory' | 'ensembles'
type ImportState = 'upload' | 'preview' | 'results'

interface ConservatoryPreviewField {
  field: string
  label: string
  currentValue: string | null
  importedValue: string | null
  changed: boolean
}

interface ConservatoryPreviewData {
  importLogId: string
  preview: {
    fields: ConservatoryPreviewField[]
    changedCount: number
    unchangedCount: number
    warnings: any[]
  }
}

interface ConservatoryImportResult {
  success: boolean
  updatedFields: number
}

interface PreviewRow {
  row: number
  status: 'matched' | 'not_found' | 'error'
  name?: string
  data?: Record<string, any>
  changes?: string[]
  error?: string
}

interface PreviewData {
  importLogId: string
  preview: {
    totalRows: number
    matched: any[]      // Backend returns full objects, not just PreviewRow
    notFound: any[]
    errors: any[]
    warnings: any[]
    headerRowIndex?: number     // NEW: detected header row (0 = standard)
    matchedColumns?: number     // NEW: how many columns matched
    instrumentColumnsDetected?: string[]  // existing for teachers
  }
}

interface ImportResult {
  totalRows: number
  successCount: number
  createdCount: number       // NEW: count of created students
  errorCount: number
  skippedCount: number
  matchedCount: number       // NEW: total matched rows
  notFoundCount: number      // NEW: total unmatched rows
  errors: Array<{ row?: number; message?: string; error?: string; studentName?: string }>
}

interface EnsemblePreviewEnsemble {
  row: number
  rawName: string
  name: string
  type: string
  subType: string | null
  performanceLevel: string | null
  participantCount: number
  conductorMatch: {
    status: 'resolved' | 'unresolved' | 'ambiguous' | 'none'
    teacherId?: string
    teacherName?: string
    candidateCount?: number
    importedName?: string
  }
  schedule: {
    activity1: { day: string; dayOfWeek: string; startTime: string; endTime: string; actualHours: number } | null
    activity2: { day: string; dayOfWeek: string; startTime: string; endTime: string; actualHours: number } | null
  }
  hours: { totalActual: number; coordinationHours: number; totalReporting: number }
  ministryUseCode: number | null
  orchestraMatch: {
    status: 'new' | 'existing-updated' | 'existing-no-change'
    orchestraId?: string
    orchestraName?: string
  }
}

interface EnsemblePreviewData {
  importLogId: string
  preview: {
    totalRows: number
    ensembles: EnsemblePreviewEnsemble[]
    conductorSummary: { resolved: number; unresolved: number; ambiguous: number; none: number }
    orchestraMatchSummary: { new: number; existingUpdated: number; existingNoChange: number }
    analytics: any | null
    warnings: Array<{ row: number; field: string; message: string }>
    errors: any[]
  }
}

interface EnsembleImportResult {
  totalRows: number
  createdCount: number
  updatedCount: number
  skippedCount: number
  noChangeCount: number
  errorCount: number
  skipped: Array<{ row: number; name: string; reason: string }>
  errors: Array<{ row: number; name: string; error: string }>
}

const IMPORT_STEPS = [
  { id: 'upload', label: 'העלאת קובץ' },
  { id: 'preview', label: 'תצוגה מקדימה' },
  { id: 'results', label: 'תוצאות' },
] as const

// Helper: Format teaching hours object to Hebrew labels
function formatTeachingHours(hours: Record<string, number>): string {
  const labels: Record<string, string> = {
    teachingHours: 'הוראה',
    accompHours: 'ליווי',
    ensembleHours: 'הרכב',
    ensembleCoordHours: 'ריכוז הרכב',
    theoryHours: 'תאוריה',
    managementHours: 'ניהול',
    coordinationHours: 'ריכוז',
    breakTimeHours: 'ביטול זמן',
    totalWeeklyHours: 'סה"כ',
  }

  const parts = Object.entries(hours)
    .filter(([_, value]) => value && value > 0)
    .map(([key, value]) => `${labels[key] || key}: ${value}`)

  return parts.join(', ')
}

// Helper: Format a single teacher change with Hebrew field labels
function formatTeacherChange(change: any): string {
  const field = change.field || change.path || ''
  const newValue = change.newValue

  // Personal info fields
  if (field.startsWith('personalInfo.')) {
    const subField = field.replace('personalInfo.', '')
    const personalLabels: Record<string, string> = {
      firstName: 'שם פרטי',
      lastName: 'שם משפחה',
      email: 'דוא"ל',
      phone: 'טלפון',
      idNumber: 'ת.ז.',
      birthYear: 'שנת לידה',
    }
    const label = personalLabels[subField] || subField
    return `${label}: ${newValue}`
  }

  // Professional info fields
  if (field.startsWith('professionalInfo.')) {
    const subField = field.replace('professionalInfo.', '')
    const professionalLabels: Record<string, string> = {
      classification: 'סיווג',
      degree: 'תואר',
      teachingExperienceYears: 'ותק',
      hasTeachingCertificate: 'תעודת הוראה',
      isUnionMember: 'ארגון עובדים',
    }
    if (subField === 'instruments') {
      return `כלים: ${Array.isArray(newValue) ? newValue.join(', ') : newValue}`
    }
    if (subField === 'teachingSubjects') {
      return `מקצועות הוראה: ${Array.isArray(newValue) ? newValue.join(', ') : newValue}`
    }
    const label = professionalLabels[subField] || subField
    return `${label}: ${newValue}`
  }

  // Management info fields (includes teaching hours)
  if (field.startsWith('managementInfo.')) {
    const subField = field.replace('managementInfo.', '')
    const managementLabels: Record<string, string> = {
      role: 'תפקיד ניהולי',
      teachingHours: 'הוראה',
      accompHours: 'ליווי',
      ensembleHours: 'הרכב',
      ensembleCoordHours: 'ריכוז הרכב',
      theoryHours: 'תאוריה',
      managementHours: 'ניהול',
      coordinationHours: 'ריכוז',
      breakTimeHours: 'ביטול זמן',
      totalWeeklyHours: 'סה"כ',
    }
    const label = managementLabels[subField] || subField
    return `${label}: ${newValue}`
  }

  // Direct fields
  if (field === 'roles') {
    const rolesValue = Array.isArray(newValue) ? newValue.join(', ') : newValue
    return `תפקידים: ${rolesValue}`
  }

  // Default fallback
  return `${field}: ${newValue}`
}

// Helper: Generate teacher row details JSX for preview table
function getTeacherRowDetails(row: any): React.ReactNode {
  // Error case
  if (row.error) {
    return <span className="text-red-600">{row.error}</span>
  }

  // Not found (create) case
  if (row.status === 'not_found') {
    const mapped = row.data?.mapped || row.mapped || {}
    const instruments = row.data?.instruments || row.instruments
    const roles = row.data?.roles || row.roles
    const teachingHours = row.data?.teachingHours || row.teachingHours
    const teachingSubjects = row.data?.teachingSubjects || row.teachingSubjects

    return (
      <div className="space-y-1 text-xs">
        <div className="text-blue-600 font-medium">מורה חדש - ייווצר ברשומה חדשה</div>
        {instruments && instruments.length > 0 && (
          <div className="text-gray-600">כלים: {instruments.join(', ')}</div>
        )}
        {teachingSubjects && teachingSubjects.length > 0 && (
          <div className="text-gray-600">מקצועות הוראה: {teachingSubjects.join(', ')}</div>
        )}
        {roles && roles.length > 0 && (
          <div className="text-gray-600">תפקידים: {roles.join(', ')}</div>
        )}
        {teachingHours && Object.keys(teachingHours).some(k => teachingHours[k] > 0) && (
          <div className="text-gray-600">שעות: {formatTeachingHours(teachingHours)}</div>
        )}
        {mapped.classification && (
          <div className="text-gray-600">סיווג: {mapped.classification}</div>
        )}
        {mapped.degree && (
          <div className="text-gray-600">תואר: {mapped.degree}</div>
        )}
        {mapped.experience != null && (
          <div className="text-gray-600">ותק: {mapped.experience} שנים</div>
        )}
        {mapped.teachingCertificate != null && (
          <div className="text-gray-600">תעודת הוראה: {mapped.teachingCertificate ? 'כן' : 'לא'}</div>
        )}
        {mapped.isUnionMember != null && (
          <div className="text-gray-600">חבר ארגון: {mapped.isUnionMember ? 'כן' : 'לא'}</div>
        )}
      </div>
    )
  }

  // Matched (update) case
  if (row.status === 'matched') {
    const mapped = row.data?.mapped || row.mapped || {}
    const changes = row.changes || []
    const instruments = row.data?.instruments || row.instruments
    const roles = row.data?.roles || row.roles
    const teachingHours = row.data?.teachingHours || row.teachingHours
    const teachingSubjects = row.data?.teachingSubjects || row.teachingSubjects

    const hasChanges = changes.length > 0
    const hasInstruments = instruments && instruments.length > 0
    const hasRoles = roles && roles.length > 0
    const hasHours = teachingHours && Object.keys(teachingHours).some(k => teachingHours[k] > 0)
    const hasSubjects = teachingSubjects && teachingSubjects.length > 0
    const hasProfessional = mapped.classification || mapped.degree || mapped.experience != null || mapped.teachingCertificate != null || mapped.isUnionMember != null

    // If no changes and no additional info, show "אין שינויים"
    if (!hasChanges && !hasInstruments && !hasRoles && !hasHours && !hasSubjects && !hasProfessional) {
      return <span className="text-gray-400">אין שינויים</span>
    }

    return (
      <div className="space-y-1 text-xs">
        {hasChanges && changes.map((change: any, idx: number) => (
          <div key={idx} className="text-gray-700">{formatTeacherChange(change)}</div>
        ))}
        {hasInstruments && (
          <div className="text-gray-600">כלים: {instruments.join(', ')}</div>
        )}
        {hasSubjects && (
          <div className="text-gray-600">מקצועות הוראה: {teachingSubjects.join(', ')}</div>
        )}
        {hasRoles && (
          <div className="text-gray-600">תפקידים: {roles.join(', ')}</div>
        )}
        {hasHours && (
          <div className="text-gray-600">שעות: {formatTeachingHours(teachingHours)}</div>
        )}
        {mapped.classification && (
          <div className="text-gray-600">סיווג: {mapped.classification}</div>
        )}
        {mapped.degree && (
          <div className="text-gray-600">תואר: {mapped.degree}</div>
        )}
        {mapped.experience != null && (
          <div className="text-gray-600">ותק: {mapped.experience} שנים</div>
        )}
        {mapped.teachingCertificate != null && (
          <div className="text-gray-600">תעודת הוראה: {mapped.teachingCertificate ? 'כן' : 'לא'}</div>
        )}
        {mapped.isUnionMember != null && (
          <div className="text-gray-600">חבר ארגון: {mapped.isUnionMember ? 'כן' : 'לא'}</div>
        )}
      </div>
    )
  }

  return null
}

// Helper: Format a single student change with Hebrew field labels
function formatStudentChange(change: any): string {
  const field = change.field || change.path || ''
  const oldValue = change.oldValue
  const newValue = change.newValue

  const fieldLabels: Record<string, string> = {
    'academicInfo.class': 'כיתה',
    'academicInfo.studyYears': 'שנות לימוד',
    'academicInfo.extraHour': 'שעה נוספת',
    'academicInfo.lessonDuration': 'זמן שיעור',
    'academicInfo.isBagrutCandidate': 'מגמת בגרות',
    'academicInfo.instrumentProgress': 'כלי נגינה',
    'academicInfo.instrumentProgress[0].instrumentName': 'כלי נגינה',
    'academicInfo.instrumentProgress[0].ministryStageLevel': 'שלב',
    'academicInfo.instrumentProgress[0].currentStage': 'שלב',
    'personalInfo.age': 'גיל',
  }

  const label = fieldLabels[field] || field

  if (typeof newValue === 'boolean') {
    return `${label}: ${newValue ? 'כן' : 'לא'}`
  }

  if (oldValue !== null && oldValue !== undefined) {
    return `${label}: ${oldValue} \u2192 ${newValue}`
  }

  return `${label}: ${newValue}`
}

// Helper: Render teacher match badge for student preview rows
function getTeacherMatchBadge(teacherMatch: any): React.ReactNode {
  if (!teacherMatch || teacherMatch.status === 'none') {
    return null
  }

  switch (teacherMatch.status) {
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircleIcon size={12} weight="fill" />
          מורה: {teacherMatch.teacherName}
        </span>
      )
    case 'unresolved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircleIcon size={12} weight="fill" />
          מורה לא נמצא
        </span>
      )
    case 'ambiguous':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <WarningIcon size={12} weight="fill" />
          {teacherMatch.candidateCount} מורים אפשריים
        </span>
      )
    default:
      return null
  }
}

// Helper: Render conductor match badge for ensemble preview rows
function getConductorMatchBadge(conductorMatch: any): React.ReactNode {
  if (!conductorMatch || conductorMatch.status === 'none') return null

  switch (conductorMatch.status) {
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircleIcon size={12} weight="fill" />
          {conductorMatch.teacherName}
        </span>
      )
    case 'unresolved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircleIcon size={12} weight="fill" />
          {conductorMatch.importedName ? `${conductorMatch.importedName} - לא נמצא` : 'מנצח לא נמצא'}
        </span>
      )
    case 'ambiguous':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <WarningIcon size={12} weight="fill" />
          {conductorMatch.candidateCount} מנצחים אפשריים
        </span>
      )
    default:
      return null
  }
}

// Helper: Render orchestra match badge for ensemble preview rows
function getOrchestraMatchBadge(orchestraMatch: any): React.ReactNode {
  switch (orchestraMatch?.status) {
    case 'new':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <PlusIcon size={12} weight="bold" />
          חדש
        </span>
      )
    case 'existing-updated':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <ArrowsClockwiseIcon size={12} weight="regular" />
          עדכון
        </span>
      )
    case 'existing-no-change':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          ללא שינוי
        </span>
      )
    default:
      return null
  }
}

// Helper: Render orchestra match badges for student preview rows
function getOrchestraLinkBadges(orchestraMatches: any[]): React.ReactNode {
  if (!orchestraMatches || orchestraMatches.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {orchestraMatches.map((match: any, idx: number) => (
        match.status === 'resolved' ? (
          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircleIcon size={12} weight="fill" />
            {match.orchestraName}
          </span>
        ) : (
          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <WarningIcon size={12} weight="fill" />
            {match.importedName} (לא נמצא)
          </span>
        )
      ))}
    </div>
  )
}

// Helper: Generate student row details JSX for preview table
function getStudentRowDetails(row: any): React.ReactNode {
  // Error case
  if (row.error) {
    return <span className="text-red-600">{row.error}</span>
  }

  // Not found (create) case
  if (row.status === 'not_found') {
    const mapped = row.data?.mapped || row.mapped || {}
    const teacherMatch = row.teacherMatch

    return (
      <div className="space-y-1 text-xs">
        <div className="text-blue-600 font-medium">תלמיד חדש - ייווצר ברשומה חדשה</div>
        {mapped.instrument && (
          <div className="text-gray-600">כלי נגינה: {mapped.instrument}</div>
        )}
        {mapped.class && (
          <div className="text-gray-600">כיתה: {mapped.class}</div>
        )}
        {mapped.studyYears != null && (
          <div className="text-gray-600">שנות לימוד: {mapped.studyYears}</div>
        )}
        {mapped.ministryStageLevel && (
          <div className="text-gray-600">שלב: {mapped.ministryStageLevel}</div>
        )}
        {mapped.isBagrutCandidate != null && (
          <div className="text-gray-600">מגמת בגרות: {mapped.isBagrutCandidate ? 'כן' : 'לא'}</div>
        )}
        {mapped.lessonDuration != null && (
          <div className="text-gray-600">זמן שיעור: {mapped.lessonDuration}</div>
        )}
        {mapped.extraHour && (
          <div className="text-gray-600">שעה נוספת: {mapped.extraHour}</div>
        )}
        {mapped.departmentHint && (
          <div className="text-gray-600">מחלקה: {mapped.departmentHint}</div>
        )}
        {getTeacherMatchBadge(teacherMatch)}
        {getOrchestraLinkBadges(mapped._orchestraMatches)}
      </div>
    )
  }

  // Matched (update) case
  if (row.status === 'matched') {
    const changes = row.changes || []
    const teacherMatch = row.teacherMatch

    const hasOrchestraMatches = (row.mapped?._orchestraMatches || []).length > 0;
    if (changes.length === 0 && (!teacherMatch || teacherMatch.status === 'none' || !teacherMatch.status) && !hasOrchestraMatches) {
      return <span className="text-gray-400">אין שינויים</span>
    }

    return (
      <div className="space-y-1 text-xs">
        {changes.map((change: any, idx: number) => (
          <div key={idx} className="text-gray-700">{formatStudentChange(change)}</div>
        ))}
        {getTeacherMatchBadge(teacherMatch)}
        {getOrchestraLinkBadges(row.mapped?._orchestraMatches)}
      </div>
    )
  }

  return null
}

function TeacherFileStructureGuide() {
  return (
    <div className="rounded-3xl shadow-sm bg-white p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">מבנה הקובץ הנדרש</h3>

      {/* Ministry compatibility banner */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-4">
        <div className="flex items-start gap-2">
          <InfoIcon size={20} weight="fill" className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">תומך בקבצי מימשק משרד החינוך</p>
            <p className="text-xs text-blue-700 mt-0.5">המערכת מזהה אוטומטית שורות מטא-דאטה, עמודות כלי נגינה, ותפקידי הוראה</p>
          </div>
        </div>
      </div>

      {/* Column guide table */}
      <div className="space-y-0 text-sm">
        {/* Header row */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <span className="font-medium text-gray-700 w-28">עמודה</span>
          <span className="font-medium text-gray-700 flex-1">שמות אפשריים</span>
          <span className="font-medium text-gray-700 w-24 text-center">סטטוס</span>
        </div>

        {/* --- Personal Info Section --- */}
        <div className="pt-3 pb-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">מידע אישי</span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">שם מורה</span>
          <span className="text-gray-500 flex-1 text-xs">שם פרטי + שם משפחה, או שם ומשפחה</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">חובה</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">ת.ז.</span>
          <span className="text-gray-500 flex-1 text-xs">מספר זהות, ת.ז., תעודת זהות</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">שנת לידה</span>
          <span className="text-gray-500 flex-1 text-xs">שנת לידה</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">טלפון</span>
          <span className="text-gray-500 flex-1 text-xs">טלפון, נייד</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">דוא"ל</span>
          <span className="text-gray-500 flex-1 text-xs">דוא"ל, email, מייל</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        {/* --- Professional Info Section --- */}
        <div className="pt-4 pb-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">מידע מקצועי</span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">סיווג</span>
          <span className="text-gray-500 flex-1 text-xs">ממשיך / חדש</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">תואר</span>
          <span className="text-gray-500 flex-1 text-xs">תואר שלישי, תואר שני, תואר ראשון, מוסמך בכיר, מוסמך, בלתי מוסמך</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">ותק</span>
          <span className="text-gray-500 flex-1 text-xs">ותק, שנות ותק, ותק בהוראה</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">תעודת הוראה</span>
          <span className="text-gray-500 flex-1 text-xs">V / ✓ = יש תעודה</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">ארגון עובדים</span>
          <span className="text-gray-500 flex-1 text-xs">חבר ארגון, ארגון עובדים</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">כלי נגינה</span>
          <span className="text-gray-500 flex-1 text-xs">עמודות קיצור: Vi, VL, CH, FL, PI, GI וכו' (V = מלמד)</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">אוטומטי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">תפקידי הוראה</span>
          <span className="text-gray-500 flex-1 text-xs">הוראה, ניצוח, הרכב, תאוריה, מגמה, ליווי פסנתר, הלחנה (V = פעיל)</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">אוטומטי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">תיאור תפקיד</span>
          <span className="text-gray-500 flex-1 text-xs">ריכוז פדגוגי, ריכוז מחלקה, סגן מנהל, ריכוז אחר, ריכוז אחר (פרט), תיאור תפקיד</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        {/* --- Hours Section --- */}
        <div className="pt-4 pb-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">שעות הוראה</span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">שעות הוראה</span>
          <span className="text-gray-500 flex-1 text-xs">שעות הוראה שבועיות</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">ליווי פסנתר</span>
          <span className="text-gray-500 flex-1 text-xs">שעות ליווי פסנתר</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">הרכב ביצוע</span>
          <span className="text-gray-500 flex-1 text-xs">שעות הרכב ביצוע</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">ריכוז הרכב</span>
          <span className="text-gray-500 flex-1 text-xs">שעות ריכוז הרכב</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">תאוריה</span>
          <span className="text-gray-500 flex-1 text-xs">שעות תאוריה</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">ניהול</span>
          <span className="text-gray-500 flex-1 text-xs">שעות ניהול</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">ריכוז</span>
          <span className="text-gray-500 flex-1 text-xs">שעות ריכוז</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <span className="text-gray-700 w-28 font-medium">ביטול זמן</span>
          <span className="text-gray-500 flex-1 text-xs">שעות ביטול זמן</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>

        <div className="flex items-center gap-2 py-2.5">
          <span className="text-gray-700 w-28 font-medium">סה"כ ש"ש</span>
          <span className="text-gray-500 flex-1 text-xs">סה"כ שעות שבועיות</span>
          <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
        </div>
      </div>
    </div>
  )
}

function ConservatoryFileGuide() {
  return (
    <div className="rounded-3xl shadow-sm bg-white p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">קובץ פרטי קונסרבטוריון</h3>
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-4">
        <div className="flex items-start gap-2">
          <InfoIcon size={20} weight="fill" className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">קובץ מימשק משרד החינוך - פרטי קונסרבטוריון</p>
            <p className="text-xs text-blue-700 mt-0.5">
              יש להעלות את קובץ ה-Excel של פרטי הקונסרבטוריון כפי שהתקבל ממשרד החינוך.
              הקובץ מכיל גיליון אחד עם פרטי המוסד בפורמט טופס (לא טבלה).
            </p>
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-600 space-y-2">
        <p>השדות שייקראו מהקובץ:</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
          <span>שם קונסרבטוריון</span>
          <span>קוד קונסרבטוריון</span>
          <span>שם בעלות / רשות</span>
          <span>אשכול חברתי</span>
          <span>סטטוס</span>
          <span>יחידה מקדמת</span>
          <span>מספר עוסק (ח.פ.)</span>
          <span>שלב קונסרבטוריון</span>
          <span>מנהל/ת</span>
          <span>סמל ישוב</span>
          <span>טלפון משרד / נייד</span>
          <span>רשות גדולה / קטנה</span>
          <span>דוא"ל</span>
          <span>מחלקה עיקרית</span>
          <span>כתובת</span>
          <span>סטטוס פיקוח</span>
          <span>מחוז</span>
          <span>מקדם עיר מעורבת</span>
        </div>
      </div>
    </div>
  )
}

function EnsembleFileGuide() {
  return (
    <div className="rounded-3xl shadow-sm bg-white p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">קובץ הרכבי ביצוע</h3>
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-4">
        <div className="flex items-start gap-2">
          <InfoIcon size={20} weight="fill" className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">תומך בקבצי מימשק משרד החינוך - גיליון הרכבי ביצוע</p>
            <p className="text-xs text-blue-700 mt-0.5">
              המערכת מזהה אוטומטית את סוג ההרכב, מנצח, לוח זמנים ושעות דיווח
            </p>
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-600 space-y-2">
        <p>יש להעלות את קובץ ה-Excel של הרכבי הביצוע כפי שהתקבל ממשרד החינוך. המערכת תזהה את הגיליון 'הרכבי ביצוע' אוטומטית.</p>
        <p className="font-medium text-gray-700 mt-3">שדות שייקראו מהקובץ:</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
          <span>שם הרכב</span>
          <span>סוג (תזמורת/הרכב)</span>
          <span>מנצח/מדריך</span>
          <span>מספר משתתפים</span>
          <span>יום פעילות</span>
          <span>שעת התחלה</span>
          <span>שעת סיום</span>
          <span>שעות בפועל</span>
          <span>שעות ריכוז</span>
          <span>סה"כ שעות דיווח</span>
        </div>
      </div>
    </div>
  )
}

export default function ImportData() {
  const [activeTab, setActiveTab] = useState<ImportTab>('teachers')
  const [importState, setImportState] = useState<ImportState>('upload')
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [results, setResults] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [conservatoryPreview, setConservatoryPreview] = useState<ConservatoryPreviewData | null>(null)
  const [conservatoryResults, setConservatoryResults] = useState<ConservatoryImportResult | null>(null)
  const [ensemblePreview, setEnsemblePreview] = useState<EnsemblePreviewData | null>(null)
  const [ensembleResults, setEnsembleResults] = useState<EnsembleImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setImportState('upload')
    setPreviewData(null)
    setResults(null)
    setConservatoryPreview(null)
    setConservatoryResults(null)
    setEnsemblePreview(null)
    setEnsembleResults(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleTabChange = (tab: ImportTab) => {
    setActiveTab(tab)
    resetState()
  }

  const getImportSteps = () => {
    const order = ['upload', 'preview', 'results'] as const
    const currentIdx = order.indexOf(importState)
    return IMPORT_STEPS.map((step, idx) => ({
      ...step,
      description: undefined as string | undefined,
      status: (idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : 'pending') as 'completed' | 'current' | 'pending',
    }))
  }

  const handleFile = useCallback(async (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (!validTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      toast.error('יש להעלות קובץ Excel בלבד (.xlsx / .xls)')
      return
    }

    try {
      setLoading(true)
      if (activeTab === 'ensembles') {
        const result = await importService.previewEnsembleImport(file)
        setEnsemblePreview(result)
      } else if (activeTab === 'conservatory') {
        const result = await importService.previewConservatoryImport(file)
        setConservatoryPreview(result)
      } else {
        const result = activeTab === 'teachers'
          ? await importService.previewTeacherImport(file)
          : await importService.previewStudentImport(file)
        setPreviewData(result)
      }
      setImportState('preview')
    } catch (error: any) {
      console.error('Error previewing import:', error)
      toast.error(error.message || 'שגיאה בעיבוד הקובץ')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleExecute = async () => {
    const importLogId = activeTab === 'ensembles'
      ? ensemblePreview?.importLogId
      : activeTab === 'conservatory'
        ? conservatoryPreview?.importLogId
        : previewData?.importLogId
    if (!importLogId) return

    try {
      setExecuting(true)
      const result = await importService.executeImport(importLogId)

      if (activeTab === 'ensembles') {
        setEnsembleResults(result)
        setImportState('results')
        const parts = []
        if (result.createdCount > 0) parts.push(`${result.createdCount} נוצרו`)
        if (result.updatedCount > 0) parts.push(`${result.updatedCount} עודכנו`)
        if (result.noChangeCount > 0) parts.push(`${result.noChangeCount} ללא שינוי`)
        toast.success(`ייבוא הרכבים הושלם: ${parts.join(', ')}`)
      } else if (activeTab === 'conservatory') {
        setConservatoryResults(result)
        setImportState('results')
        toast.success(`הנתונים עודכנו בהצלחה: ${result.updatedFields} שדות עודכנו`)
      } else {
        setResults(result)
        setImportState('results')

        // Show breakdown toast
        const parts = []
        if (result.successCount > 0) parts.push(`${result.successCount} עודכנו`)
        if (result.createdCount > 0) parts.push(`${result.createdCount} נוצרו`)
        toast.success(`הייבוא הושלם: ${parts.join(', ')}`)
      }
    } catch (error: any) {
      console.error('Error executing import:', error)
      toast.error(error.message || 'שגיאה בביצוע הייבוא')
    } finally {
      setExecuting(false)
    }
  }

  const getRowStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircleIcon size={12} weight="fill" />
            עדכון
          </span>
        )
      case 'not_found':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <PlusIcon size={12} weight="bold" />
            יצירה
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircleIcon size={12} weight="fill" />
            שגיאה
          </span>
        )
      default:
        return null
    }
  }

  const allPreviewRows = (activeTab !== 'conservatory' && activeTab !== 'ensembles' && previewData)
    ? [
        ...previewData.preview.matched.map((r: any) => ({ ...r, status: 'matched' as const, name: r.importedName || r.studentName || r.teacherName })),
        ...previewData.preview.notFound.map((r: any) => ({ ...r, status: 'not_found' as const, name: r.importedName })),
        ...previewData.preview.errors.map((r: any) => ({ ...r, status: 'error' as const, name: '', error: r.message })),
      ].sort((a, b) => (a.row || 0) - (b.row || 0))
    : []

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
          <UploadIcon size={20} weight="regular" className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ייבוא נתונים</h1>
          <p className="text-sm text-gray-500">
            {activeTab === 'teachers' && 'ייבוא מורים מקובץ Excel'}
            {activeTab === 'students' && 'ייבוא תלמידים מקובץ Excel'}
            {activeTab === 'conservatory' && 'ייבוא פרטי קונסרבטוריון מקובץ Excel'}
            {activeTab === 'ensembles' && 'ייבוא הרכבים מקובץ Excel'}
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleTabChange('teachers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'teachers'
              ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <GraduationCapIcon size={16} weight="regular" />
          ייבוא מורים
        </button>
        <button
          onClick={() => handleTabChange('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <UsersIcon size={16} weight="regular" />
          ייבוא תלמידים
        </button>
        <button
          onClick={() => handleTabChange('conservatory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'conservatory'
              ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <BuildingsIcon size={16} weight="regular" />
          פרטי קונסרבטוריון
        </button>
        <button
          onClick={() => handleTabChange('ensembles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'ensembles'
              ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <MusicNotesIcon size={16} weight="regular" />
          הרכבים
        </button>
      </div>

      {/* Step Progress Indicator */}
      <div className="mb-6">
        <StepProgress
          steps={getImportSteps()}
          direction="horizontal"
        />
      </div>

      {/* Upload State */}
      {importState === 'upload' && (
        <div className="space-y-6">
          {/* File Structure Guide — show for both tabs */}
          {activeTab === 'students' && (
            <div className="rounded-3xl shadow-sm bg-white p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">מבנה הקובץ הנדרש</h3>

              {/* Ministry compatibility banner */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-4">
                <div className="flex items-start gap-2">
                  <InfoIcon size={20} weight="fill" className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">תומך בקבצי מימשק משרד החינוך</p>
                    <p className="text-xs text-blue-700 mt-0.5">המערכת מזהה אוטומטית שורות מטא-דאטה ועמודות משתנות</p>
                  </div>
                </div>
              </div>

              {/* Column guide */}
              <div className="space-y-0 text-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700 w-28">עמודה</span>
                  <span className="font-medium text-gray-700 flex-1">שמות אפשריים</span>
                  <span className="font-medium text-gray-700 w-24 text-center">סטטוס</span>
                </div>

                <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
                  <span className="text-gray-700 w-28 font-medium">שם תלמיד</span>
                  <span className="text-gray-500 flex-1 text-xs">שם פרטי + שם משפחה, או שם ומשפחה</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">חובה</span></span>
                </div>

                <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
                  <span className="text-gray-700 w-28 font-medium">כלי נגינה</span>
                  <span className="text-gray-500 flex-1 text-xs">כלי, כלי נגינה, או עמודות מחלקות (כלי קשת, כלי נשיפה...)</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">מומלץ</span></span>
                </div>

                <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
                  <span className="text-gray-700 w-28 font-medium">כיתה</span>
                  <span className="text-gray-500 flex-1 text-xs">כיתה</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
                </div>

                <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
                  <span className="text-gray-700 w-28 font-medium">שנות לימוד</span>
                  <span className="text-gray-500 flex-1 text-xs">שנות לימוד, שנת לימוד</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">אופציונלי</span></span>
                </div>

                <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
                  <span className="text-gray-700 w-28 font-medium">שעה נוספת</span>
                  <span className="text-gray-500 flex-1 text-xs">שעה נוספת, שעה נוספת ל.., שעה נוספת לבחירת התלמיד</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">זיהוי אוטומטי</span></span>
                </div>

                <div className="flex items-center gap-2 py-2.5">
                  <span className="text-gray-700 w-28 font-medium">זמן שיעור</span>
                  <span className="text-gray-500 flex-1 text-xs">זמן שעור (שעות שבועיות: 0.75 = 45 דק')</span>
                  <span className="w-24 text-center"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">זיהוי אוטומטי</span></span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teachers' && (
            <TeacherFileStructureGuide />
          )}

          {activeTab === 'conservatory' && (
            <ConservatoryFileGuide />
          )}

          {activeTab === 'ensembles' && (
            <EnsembleFileGuide />
          )}

          {/* Upload Zone */}
          <div className="rounded-3xl shadow-sm bg-white p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mb-4"></div>
                <p className="text-gray-600">מעבד את הקובץ...</p>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-3xl cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-500/5'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <FileXlsIcon size={48} weight="regular" className={`mb-4 ${dragActive ? 'text-primary-500' : 'text-gray-400'}`} />
                <p className="text-lg font-medium text-gray-700 mb-1">
                  גרור קובץ לכאן או לחץ לבחירה
                </p>
                <p className="text-sm text-gray-500">
                  קבצים נתמכים: .xlsx, .xls
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview State — Ensembles */}
      {importState === 'preview' && activeTab === 'ensembles' && ensemblePreview && (
        <div className="space-y-6">
          {/* Orchestra Match Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{ensemblePreview.preview.totalRows}</p>
                <p className="text-sm text-gray-500">סה"כ הרכבים</p>
              </div>
            </div>
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{ensemblePreview.preview.orchestraMatchSummary.new}</p>
                <p className="text-sm text-gray-500">הרכבים חדשים</p>
              </div>
            </div>
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{ensemblePreview.preview.orchestraMatchSummary.existingUpdated}</p>
                <p className="text-sm text-gray-500">עדכונים</p>
              </div>
            </div>
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-gray-500/10 to-gray-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">{ensemblePreview.preview.orchestraMatchSummary.existingNoChange}</p>
                <p className="text-sm text-gray-500">ללא שינוי</p>
              </div>
            </div>
          </div>

          {/* Conductor Summary Cards */}
          {(ensemblePreview.preview.conductorSummary.resolved > 0 ||
            ensemblePreview.preview.conductorSummary.unresolved > 0 ||
            ensemblePreview.preview.conductorSummary.ambiguous > 0) && (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-3xl shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 p-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600">
                    {ensemblePreview.preview.conductorSummary.resolved}
                  </p>
                  <p className="text-xs text-gray-500">מנצחים שובצו</p>
                </div>
              </div>
              <div className="rounded-3xl shadow-sm bg-gradient-to-br from-red-500/10 to-red-500/5 p-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-red-600">
                    {ensemblePreview.preview.conductorSummary.unresolved}
                  </p>
                  <p className="text-xs text-gray-500">מנצחים לא נמצאו</p>
                </div>
              </div>
              <div className="rounded-3xl shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-600">
                    {ensemblePreview.preview.conductorSummary.ambiguous}
                  </p>
                  <p className="text-xs text-gray-500">מנצחים מעורפלים</p>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {ensemblePreview.preview.warnings.length > 0 && (
            <div className="rounded-3xl shadow-sm bg-amber-50 border border-amber-200 p-6">
              <div className="flex items-start gap-2">
                <WarningIcon size={20} weight="fill" className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {ensemblePreview.preview.warnings.slice(0, 10).map((w, i) => (
                    <p key={i} className="text-sm text-amber-700">
                      שורה {w.row}: {w.message}
                    </p>
                  ))}
                  {ensemblePreview.preview.warnings.length > 10 && (
                    <p className="text-xs text-amber-500">
                      ועוד {ensemblePreview.preview.warnings.length - 10} אזהרות...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ensemble Preview Cards */}
          <div className="rounded-3xl shadow-sm bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">תצוגה מקדימה</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {ensemblePreview.preview.ensembles.slice(0, 50).map((ens, idx) => (
                <div key={idx} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  {/* Row 1: Name + badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-gray-900">{ens.name}</span>
                    {/* Type badge */}
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      ens.type === 'תזמורת'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {ens.type}
                    </span>
                    {/* SubType badge */}
                    {ens.subType && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {ens.subType}
                      </span>
                    )}
                    {/* Performance level badge */}
                    {ens.performanceLevel && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        ens.performanceLevel === 'ייצוגי'
                          ? 'bg-amber-100 text-amber-700'
                          : ens.performanceLevel === 'ביניים'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {ens.performanceLevel}
                      </span>
                    )}
                    {/* Orchestra match badge */}
                    {getOrchestraMatchBadge(ens.orchestraMatch)}
                    {/* Row number */}
                    <span className="text-gray-400 font-mono text-xs mr-auto">#{ens.row}</span>
                  </div>
                  {/* Row 2: Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                    {/* Conductor */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 text-xs">מנצח:</span>
                      {getConductorMatchBadge(ens.conductorMatch)}
                    </div>
                    {/* Participants */}
                    <div>
                      <span className="text-gray-400 text-xs">משתתפים: </span>
                      <span className="text-gray-700 font-medium">{ens.participantCount || '---'}</span>
                    </div>
                    {/* Schedule */}
                    <div>
                      <span className="text-gray-400 text-xs">לוח זמנים: </span>
                      {ens.schedule.activity1 ? (
                        <span className="text-gray-700">
                          {ens.schedule.activity1.day} {ens.schedule.activity1.startTime}-{ens.schedule.activity1.endTime}
                          {ens.schedule.activity1.actualHours != null && (
                            <span className="text-gray-400 text-xs"> ({ens.schedule.activity1.actualHours} ש')</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-300">---</span>
                      )}
                      {ens.schedule.activity2 && (
                        <div className="mt-0.5">
                          <span className="text-gray-400 text-xs">פעילות II: </span>
                          <span className="text-gray-700">
                            {ens.schedule.activity2.day} {ens.schedule.activity2.startTime}-{ens.schedule.activity2.endTime}
                            {ens.schedule.activity2.actualHours != null && (
                              <span className="text-gray-400 text-xs"> ({ens.schedule.activity2.actualHours} ש')</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Hours summary */}
                    <div>
                      <span className="text-gray-400 text-xs">שעות: </span>
                      <span className="text-gray-700">
                        {[
                          ens.hours.totalActual != null ? `${ens.hours.totalActual} בפועל` : null,
                          ens.hours.coordinationHours != null ? `${ens.hours.coordinationHours} ריכוז` : null,
                          ens.hours.totalReporting != null ? `${ens.hours.totalReporting} דיווח` : null,
                        ].filter(Boolean).join(' · ') || '---'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {ensemblePreview.preview.ensembles.length > 50 && (
              <div className="text-center py-3 border-t border-gray-100">
                <p className="text-sm text-gray-400">
                  מוצגות 50 מתוך {ensemblePreview.preview.ensembles.length} שורות
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={resetState}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon size={16} weight="regular" />
              ביטול
            </button>
            <button
              onClick={handleExecute}
              disabled={executing || ensemblePreview.preview.ensembles.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              {executing ? (
                <>
                  <ArrowsClockwiseIcon size={16} weight="regular" className="animate-spin" />
                  מבצע ייבוא...
                </>
              ) : (
                <>
                  <CheckCircleIcon size={16} weight="fill" />
                  אשר ייבוא ({ensemblePreview.preview.ensembles.length} הרכבים)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview State — Conservatory */}
      {importState === 'preview' && activeTab === 'conservatory' && conservatoryPreview && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{conservatoryPreview.preview.changedCount}</p>
                <p className="text-sm text-gray-500">שדות שישתנו</p>
              </div>
            </div>
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-gray-500/10 to-gray-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">{conservatoryPreview.preview.unchangedCount}</p>
                <p className="text-sm text-gray-500">ללא שינוי</p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {conservatoryPreview.preview.warnings.length > 0 && (
            <div className="rounded-3xl shadow-sm bg-amber-50 border border-amber-200 p-6">
              <div className="flex items-start gap-2">
                <WarningIcon size={20} weight="fill" className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {conservatoryPreview.preview.warnings.slice(0, 10).map((w: any, i: number) => (
                    <p key={i} className="text-sm text-amber-700">
                      {typeof w === 'string' ? w : w.message || String(w)}
                    </p>
                  ))}
                  {conservatoryPreview.preview.warnings.length > 10 && (
                    <p className="text-xs text-amber-500">
                      ועוד {conservatoryPreview.preview.warnings.length - 10} אזהרות...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Diff Table */}
          <div className="rounded-3xl shadow-sm bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">השוואת נתונים</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">שדה</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">ערך נוכחי</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">ערך מיובא</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {conservatoryPreview.preview.fields.map((f) => (
                    <tr key={f.field} className={`transition-colors ${f.changed ? 'bg-amber-50/60' : 'hover:bg-gray-50/50'}`}>
                      <td className="py-3 px-4 font-medium text-gray-700">{f.label}</td>
                      <td className={`py-3 px-4 ${f.changed ? 'text-red-500 line-through' : 'text-gray-500'}`}>
                        {f.currentValue || <span className="text-gray-300">---</span>}
                      </td>
                      <td className={`py-3 px-4 ${f.changed ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                        {f.importedValue || <span className="text-gray-300">---</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={resetState}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon size={16} weight="regular" />
              ביטול
            </button>
            <button
              onClick={handleExecute}
              disabled={executing || conservatoryPreview.preview.changedCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              {executing ? (
                <>
                  <ArrowsClockwiseIcon size={16} weight="regular" className="animate-spin" />
                  מעדכן נתונים...
                </>
              ) : (
                <>
                  <CheckCircleIcon size={16} weight="fill" />
                  עדכן {conservatoryPreview.preview.changedCount} שדות
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview State — Teachers/Students */}
      {importState === 'preview' && activeTab !== 'conservatory' && activeTab !== 'ensembles' && previewData && (
        <div className="space-y-6">
          {/* Header Detection Banner — only show when header row > 0 */}
          {previewData.preview.headerRowIndex != null && previewData.preview.headerRowIndex > 0 && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-start gap-2">
                <InfoIcon size={20} weight="fill" className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    שורת כותרות זוהתה בשורה {previewData.preview.headerRowIndex + 1}
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {previewData.preview.headerRowIndex} שורות מטא-דאטה דולגו אוטומטית
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stat Cards — v4.0 gradient style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Rows */}
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{previewData.preview.totalRows}</p>
                <p className="text-sm text-gray-500">סה"כ שורות</p>
              </div>
            </div>

            {/* Updates (matched) */}
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{previewData.preview.matched.length}</p>
                <p className="text-sm text-gray-500">עדכונים</p>
              </div>
            </div>

            {/* Creates (notFound) */}
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{previewData.preview.notFound.length}</p>
                <p className="text-sm text-gray-500">יצירות חדשות</p>
              </div>
            </div>

            {/* Errors */}
            <div className="rounded-3xl shadow-sm bg-gradient-to-br from-red-500/10 to-red-500/5 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{previewData.preview.errors.length}</p>
                <p className="text-sm text-gray-500">שגיאות</p>
              </div>
            </div>
          </div>

          {/* Teacher Match Summary Cards — student tab only */}
          {activeTab === 'students' && (previewData.preview as any).teacherMatchSummary &&
            ((previewData.preview as any).teacherMatchSummary.resolved > 0 ||
             (previewData.preview as any).teacherMatchSummary.unresolved > 0 ||
             (previewData.preview as any).teacherMatchSummary.ambiguous > 0) && (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-3xl shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 p-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600">
                    {(previewData.preview as any).teacherMatchSummary.resolved}
                  </p>
                  <p className="text-xs text-gray-500">מורים שובצו</p>
                </div>
              </div>
              <div className="rounded-3xl shadow-sm bg-gradient-to-br from-red-500/10 to-red-500/5 p-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-red-600">
                    {(previewData.preview as any).teacherMatchSummary.unresolved}
                  </p>
                  <p className="text-xs text-gray-500">מורים לא נמצאו</p>
                </div>
              </div>
              <div className="rounded-3xl shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-600">
                    {(previewData.preview as any).teacherMatchSummary.ambiguous}
                  </p>
                  <p className="text-xs text-gray-500">מורים מעורפלים</p>
                </div>
              </div>
            </div>
          )}

          {/* Orchestra Match Summary Cards — student tab only */}
          {activeTab === 'students' && (previewData.preview as any).orchestraMatchSummary &&
            ((previewData.preview as any).orchestraMatchSummary.resolved > 0 ||
             (previewData.preview as any).orchestraMatchSummary.unresolved > 0) && (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-3xl shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 p-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600">
                    {(previewData.preview as any).orchestraMatchSummary.totalLinks}
                  </p>
                  <p className="text-xs text-gray-500">שיוכי הרכבים</p>
                </div>
              </div>
              <div className="rounded-3xl shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">
                    {(previewData.preview as any).orchestraMatchSummary.resolved}
                  </p>
                  <p className="text-xs text-gray-500">הרכבים שובצו</p>
                </div>
              </div>
              <div className="rounded-3xl shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-600">
                    {(previewData.preview as any).orchestraMatchSummary.unresolved}
                  </p>
                  <p className="text-xs text-gray-500">הרכבים לא נמצאו</p>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {previewData.preview.warnings.length > 0 && (
            <div className="rounded-3xl shadow-sm bg-amber-50 border border-amber-200 p-6">
              <div className="flex items-start gap-2">
                <WarningIcon size={20} weight="fill" className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {previewData.preview.warnings.slice(0, 10).map((w: any, i: number) => (
                    <p key={i} className="text-sm text-amber-700">
                      {typeof w === 'string' ? w : `שורה ${w.row}: ${w.message}`}
                    </p>
                  ))}
                  {previewData.preview.warnings.length > 10 && (
                    <p className="text-xs text-amber-500">
                      ועוד {previewData.preview.warnings.length - 10} אזהרות...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="rounded-3xl shadow-sm bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">תצוגה מקדימה</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">שורה</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">סטטוס</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">שם</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">שינויים / הערות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allPreviewRows.slice(0, 50).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-4 text-gray-500 font-mono text-xs">{row.row}</td>
                      <td className="py-2.5 px-4">{getRowStatusBadge(row.status)}</td>
                      <td className="py-2.5 px-4 font-medium text-gray-900">{row.name || '---'}</td>
                      <td className="py-2.5 px-4 text-gray-600 text-xs">
                        {activeTab === 'teachers' ? (
                          getTeacherRowDetails(row)
                        ) : (
                          getStudentRowDetails(row)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allPreviewRows.length > 50 && (
                <div className="text-center py-3 border-t border-gray-100">
                  <p className="text-sm text-gray-400">
                    מוצגות 50 מתוך {allPreviewRows.length} שורות
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={resetState}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon size={16} weight="regular" />
              ביטול
            </button>
            <button
              onClick={handleExecute}
              disabled={executing || (previewData.preview.matched.length === 0 && previewData.preview.notFound.length === 0)}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              {executing ? (
                <>
                  <ArrowsClockwiseIcon size={16} weight="regular" className="animate-spin" />
                  מבצע ייבוא...
                </>
              ) : (
                <>
                  <CheckCircleIcon size={16} weight="fill" />
                  אשר ייבוא ({previewData.preview.matched.length + previewData.preview.notFound.length} שורות)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results State — Ensembles */}
      {importState === 'results' && activeTab === 'ensembles' && ensembleResults && (
        <div className="space-y-6">
          {/* Success Header */}
          <div className="rounded-3xl shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircleIcon size={32} weight="fill" className="text-green-600" />
              <h2 className="text-xl font-bold text-green-800">ייבוא הרכבים הושלם</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{ensembleResults.totalRows}</p>
                <p className="text-sm text-gray-600">סה"כ שורות</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{ensembleResults.createdCount}</p>
                <p className="text-sm text-gray-600">נוצרו</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{ensembleResults.updatedCount}</p>
                <p className="text-sm text-gray-600">עודכנו</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">{ensembleResults.noChangeCount}</p>
                <p className="text-sm text-gray-600">ללא שינוי</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{ensembleResults.errorCount}</p>
                <p className="text-sm text-gray-600">שגיאות</p>
              </div>
            </div>
          </div>

          {/* Skipped Details */}
          {ensembleResults.skipped.length > 0 && (
            <div className="rounded-3xl shadow-sm bg-white border border-amber-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/50">
                <div className="flex items-center gap-2">
                  <WarningIcon size={20} weight="fill" className="text-amber-500" />
                  <h3 className="text-lg font-bold text-gray-900">הרכבים שדולגו</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {ensembleResults.skipped.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-400 font-mono text-xs">שורה {s.row}:</span>
                      <span className="text-gray-600 font-medium">{s.name}</span>
                      <span className="text-amber-600">{s.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Error Details */}
          {ensembleResults.errors.length > 0 && (
            <div className="rounded-3xl shadow-sm bg-white border border-red-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50/50">
                <div className="flex items-center gap-2">
                  <XCircleIcon size={20} weight="fill" className="text-red-500" />
                  <h3 className="text-lg font-bold text-gray-900">פרטי שגיאות</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {ensembleResults.errors.map((e, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-400 font-mono text-xs">שורה {e.row}:</span>
                      <span className="text-gray-600 font-medium">{e.name}</span>
                      <span className="text-red-600">{e.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={resetState}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium shadow-sm"
            >
              <UploadIcon size={16} weight="regular" />
              ייבוא קובץ נוסף
            </button>
          </div>
        </div>
      )}

      {/* Results State — Conservatory */}
      {importState === 'results' && activeTab === 'conservatory' && conservatoryResults && (
        <div className="space-y-6">
          <div className="rounded-3xl shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircleIcon size={32} weight="fill" className="text-green-600" />
              <h2 className="text-xl font-bold text-green-800">הייבוא הושלם</h2>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{conservatoryResults.updatedFields}</p>
              <p className="text-sm text-gray-600">שדות עודכנו</p>
              <p className="text-sm text-gray-500 mt-2">פרטי הקונסרבטוריון עודכנו בהצלחה</p>
            </div>
          </div>

          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={resetState}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium shadow-sm"
            >
              <UploadIcon size={16} weight="regular" />
              ייבוא קובץ נוסף
            </button>
          </div>
        </div>
      )}

      {/* Results State — Teachers/Students */}
      {importState === 'results' && activeTab !== 'conservatory' && activeTab !== 'ensembles' && results && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="rounded-3xl shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircleIcon size={32} weight="fill" className="text-green-600" />
              <h2 className="text-xl font-bold text-green-800">הייבוא הושלם</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{results.totalRows}</p>
                <p className="text-sm text-gray-600">סה"כ שורות</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{results.successCount}</p>
                <p className="text-sm text-gray-600">עודכנו</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{results.createdCount || 0}</p>
                <p className="text-sm text-gray-600">נוצרו</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">{results.skippedCount}</p>
                <p className="text-sm text-gray-600">דולגו</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{results.errorCount}</p>
                <p className="text-sm text-gray-600">שגיאות</p>
              </div>
            </div>
          </div>

          {/* Error Details */}
          {results.errors.length > 0 && (
            <div className="rounded-3xl shadow-sm bg-white border border-red-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50/50">
                <div className="flex items-center gap-2">
                  <XCircleIcon size={20} weight="fill" className="text-red-500" />
                  <h3 className="text-lg font-bold text-gray-900">פרטי שגיאות</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {results.errors.map((err: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {err.row && <span className="text-gray-400 font-mono text-xs">שורה {err.row}:</span>}
                      {(err.studentName || err.teacherName) && <span className="text-gray-600 font-medium">{err.studentName || err.teacherName}</span>}
                      <span className="text-red-600">{err.message || err.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={resetState}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium shadow-sm"
            >
              <UploadIcon size={16} weight="regular" />
              ייבוא קובץ נוסף
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
