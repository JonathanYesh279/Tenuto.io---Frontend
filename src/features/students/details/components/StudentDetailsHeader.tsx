/**
 * Student Details Header Component
 * 
 * Displays student photo, name, key information, and status badges
 * in a visually appealing header layout.
 */

import { useState } from 'react'
import { User, Phone, Mail, Calendar, MapPin, Edit, Camera, Printer, Download } from 'lucide-react'
import { StudentDetailsHeaderProps } from '../types'
import { getDisplayName } from '@/utils/nameUtils'
import { StatusBadge } from '@/components/ui/Table'
import QuickActionsModal from './QuickActionsModal'

const StudentDetailsHeader: React.FC<StudentDetailsHeaderProps> = ({ 
  student, 
  isLoading = false 
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false)
  if (isLoading || !student) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
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

  // Format registration date
  const formattedRegistrationDate = registrationDate ? 
    new Date(registrationDate).toLocaleDateString('he-IL') : null

  return (
    <div className="bg-gradient-to-l from-primary-500 via-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
      {/* Main Header Content */}
      <div className="p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6 flex-1">
            {/* Student Photo - moved to the right side */}
            <div className="flex-1">
              {/* Name and basic info */}
              <h1 className="text-3xl font-bold mb-2">
                {getDisplayName(personalInfo)}
              </h1>
              
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isActive ? 'bg-success-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {isActive ? 'פעיל' : 'לא פעיל'}
                </span>
                
                {primaryInstrument !== 'ללא כלי נגינה' && (
                  <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                    {primaryInstrument}
                  </span>
                )}

                {student.orchestraEnrollments?.some(oe => oe.isActive) && (
                  <span className="px-3 py-1 bg-success-500/80 text-white rounded-full text-sm font-medium">
                    חבר תזמורת
                  </span>
                )}

                {teacherAssignments?.filter(ta => ta.isActive).length > 0 && (
                  <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                    {teacherAssignments.filter(ta => ta.isActive).length} מורים
                  </span>
                )}
              </div>

              {/* Quick action buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowQuickActions(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 backdrop-blur-sm border border-white/20"
                >
                  <Edit className="w-4 h-4" />
                  ערוך
                </button>
                <button 
                  onClick={() => setShowQuickActions(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 backdrop-blur-sm border border-white/20"
                >
                  <Printer className="w-4 h-4" />
                  הדפס
                </button>
                <button 
                  onClick={() => setShowQuickActions(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 backdrop-blur-sm border border-white/20"
                >
                  <Download className="w-4 h-4" />
                  ייצא
                </button>
              </div>
            </div>

            {/* Student Photo */}
            <div className="relative group">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white/30 backdrop-blur-sm">
                {getDisplayName(personalInfo) ? getDisplayName(personalInfo).charAt(0) : <User className="w-8 h-8" />}
              </div>
              
              {/* Photo upload button */}
              <button className="absolute bottom-0 left-0 w-8 h-8 bg-white rounded-full shadow-md border-2 border-primary-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110">
                <Camera className="w-4 h-4 text-primary-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Additional info below */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="flex flex-wrap gap-6 text-sm">
            {age && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{age} שנים</span>
              </div>
            )}
            {academicInfo.class && (
              <div className="flex items-center gap-2">
                <span>כיתה {academicInfo.class}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {primaryTeacher && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>מורה: {primaryTeacher}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white/10 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between text-sm text-white">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {academicInfo.instrumentProgress?.length || 0}
              </div>
              <div className="text-white/80">כלי נגינה</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold">
                {teacherAssignments?.filter(ta => ta.isActive).length || 0}
              </div>
              <div className="text-white/80">מורים פעילים</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold">
                {student.orchestraEnrollments?.filter(oe => oe.isActive).length || 0}
              </div>
              <div className="text-white/80">תזמורות</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold">
                {student.attendanceStats?.attendanceRate ? 
                  `${Math.round(student.attendanceStats.attendanceRate)}%` : '--'
                }
              </div>
              <div className="text-white/80">נוכחות</div>
            </div>
          </div>

          {/* Parent Contact */}
          {personalInfo.parentName && personalInfo.parentPhone && (
            <div className="text-left bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="font-medium text-white">{personalInfo.parentName}</div>
              <div className="text-white/80 flex items-center gap-1 text-sm">
                <Phone className="w-3 h-3" />
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