/**
 * Student Details Header Component
 *
 * Displays student name, key information, and status badges.
 * Phase 22: Dossier archetype — flat tonal surface, semantic tokens.
 * Note: StudentDetailsPage uses DetailPageHeader directly; this component
 * is available for legacy usage contexts.
 */

import { useState } from 'react'
import { PhoneIcon, CalendarIcon, UserIcon, PencilIcon, PrinterIcon, DownloadSimpleIcon } from '@phosphor-icons/react'
import { StudentDetailsHeaderProps } from '../types'
import { getDisplayName } from '@/utils/nameUtils'
import { AvatarInitials } from '@/components/domain/AvatarInitials'
import QuickActionsModal from './QuickActionsModal'

const StudentDetailsHeader: React.FC<StudentDetailsHeaderProps> = ({
  student,
  isLoading = false
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false)
  if (isLoading || !student) {
    return (
      <div className="bg-muted/40 border-b border-border p-6">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-muted rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-muted rounded animate-pulse w-1/3"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/4"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
              <div className="h-6 bg-muted rounded animate-pulse w-20"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { personalInfo, academicInfo, isActive, registrationDate, teacherAssignments } = student

  // Calculate age
  const age = personalInfo.age || (personalInfo.birthDate ?
    Math.floor((Date.now() - new Date(personalInfo.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) :
    null)

  // Get primary instrument
  const primaryInstrument = academicInfo.instrumentProgress?.find(inst => inst.isPrimary)?.instrumentName ||
    academicInfo.instrumentProgress?.[0]?.instrumentName || 'ללא כלי נגינה'

  // Get primary teacher
  const primaryTeacher = teacherAssignments?.find(ta => ta.isActive)?.teacherName ||
    teacherAssignments?.[0]?.teacherName || null

  return (
    <div className="bg-muted/40 border-b border-border">
      {/* Main Header Content */}
      <div className="px-6 pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            <AvatarInitials
              firstName={personalInfo.firstName}
              lastName={personalInfo.lastName}
              fullName={personalInfo.fullName}
              size="xl"
              colorClassName="bg-students-fg/15 text-students-fg"
              style={{ borderRight: '3px solid hsl(var(--color-students-fg))' }}
            />
            <div className="flex-1">
              {/* Name */}
              <h1 className="text-2xl font-bold text-foreground mb-1.5">
                {getDisplayName(personalInfo)}
              </h1>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isActive ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {isActive ? 'פעיל' : 'לא פעיל'}
                </span>

                {primaryInstrument !== 'ללא כלי נגינה' && (
                  <span className="px-2.5 py-0.5 bg-students-fg/10 text-students-fg rounded-full text-xs font-medium">
                    {primaryInstrument}
                  </span>
                )}

                {student.orchestraEnrollments?.some(oe => oe.isActive) && (
                  <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    חבר תזמורת
                  </span>
                )}

                {teacherAssignments?.filter(ta => ta.isActive).length > 0 && (
                  <span className="px-2.5 py-0.5 bg-students-fg/10 text-students-fg rounded-full text-xs font-medium">
                    {teacherAssignments.filter(ta => ta.isActive).length} מורים
                  </span>
                )}
              </div>

              {/* Quick action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuickActions(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                  ערוך
                </button>
                <button
                  onClick={() => setShowQuickActions(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  הדפס
                </button>
                <button
                  onClick={() => setShowQuickActions(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
                >
                  <DownloadSimpleIcon className="w-3.5 h-3.5" />
                  ייצא
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-4 pt-3 border-t border-border/60">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            {age && (
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                <span>{age} שנים</span>
              </div>
            )}
            {academicInfo.class && (
              <div className="flex items-center gap-1.5">
                <span>כיתה {academicInfo.class}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-center gap-1.5">
                <PhoneIcon className="w-4 h-4" />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {primaryTeacher && (
              <div className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4" />
                <span>מורה: {primaryTeacher}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="px-6 py-3 border-t border-border/60 bg-muted/20">
        <div className="flex items-center gap-8 text-sm">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">
              {academicInfo.instrumentProgress?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">כלי נגינה</div>
          </div>

          <div className="text-center">
            <div className="text-xl font-bold text-foreground">
              {teacherAssignments?.filter(ta => ta.isActive).length || 0}
            </div>
            <div className="text-xs text-muted-foreground">מורים פעילים</div>
          </div>

          <div className="text-center">
            <div className="text-xl font-bold text-foreground">
              {student.orchestraEnrollments?.filter(oe => oe.isActive).length || 0}
            </div>
            <div className="text-xs text-muted-foreground">תזמורות</div>
          </div>

          <div className="text-center">
            <div className="text-xl font-bold text-foreground">
              {student.attendanceStats?.attendanceRate ?
                `${Math.round(student.attendanceStats.attendanceRate)}%` : '--'
              }
            </div>
            <div className="text-xs text-muted-foreground">נוכחות</div>
          </div>

          {/* Parent Contact */}
          {personalInfo.parentName && personalInfo.parentPhone && (
            <div className="mr-auto text-right bg-muted rounded p-2.5">
              <div className="font-medium text-foreground text-sm">{personalInfo.parentName}</div>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <PhoneIcon className="w-3 h-3" />
                {personalInfo.parentPhone}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Modal */}
      <QuickActionsModal
        student={student}
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
      />
    </div>
  )
}

export default StudentDetailsHeader
