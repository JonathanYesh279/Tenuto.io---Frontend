import React from 'react'

import { getDisplayName } from '@/utils/nameUtils'
import { CalendarIcon, CheckCircleIcon, CheckSquareIcon, ClockIcon, EyeIcon, FileTextIcon, MapPinIcon, MusicNotesIcon, PencilIcon, PhoneIcon, TrashIcon, UserIcon, WarningCircleIcon } from '@phosphor-icons/react'

interface Student {
  id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    phone?: string
    age?: number
    class?: string
  }
  academicInfo: {
    instrumentProgress?: Array<{
      instrumentName: string
      currentStage: number
      isPrimary: boolean
    }>
    isActive?: boolean
  }
  teacherAssignments?: Array<{
    teacherId: string
    day: string
    time: string
    duration: number
  }>
  scheduleInfo?: {
    day: string
    startTime: string
    endTime: string
    duration: number
  }
  status?: 'active' | 'inactive'
}

interface EnhancedStudentCardProps {
  student: Student
  onEdit: (student: Student) => void
  onDelete: (studentId: string) => void
  onViewDetails: (studentId: string) => void
  onScheduleLesson?: (studentId: string) => void
  onUpdateLesson?: (student: Student) => void
  onMarkAttendance?: (studentId: string) => void
  onAddNote?: (studentId: string) => void
  className?: string
}

export default function EnhancedStudentCard({
  student,
  onEdit,
  onDelete,
  onViewDetails,
  onScheduleLesson,
  onUpdateLesson,
  onMarkAttendance,
  onAddNote,
  className = ''
}: EnhancedStudentCardProps) {
  
  // Extract primary instrument and stage
  const primaryInstrument = student.academicInfo?.instrumentProgress?.find(p => p.isPrimary) 
    || student.academicInfo?.instrumentProgress?.[0]
  
  const instrumentName = primaryInstrument?.instrumentName || 'לא הוגדר'
  const currentStage = primaryInstrument?.currentStage || 0

  // Extract lesson schedule info
  const lessonSchedule = student.scheduleInfo || student.teacherAssignments?.[0]
  const lessonTime = lessonSchedule ? `${lessonSchedule.day} ${lessonSchedule.startTime || lessonSchedule.time}` : null
  const lessonDuration = lessonSchedule?.duration || 60
  const hasScheduledLesson = !!lessonSchedule

  // Status logic
  const isActive = student.academicInfo?.isActive !== false && student.status !== 'inactive'
  const statusColor = isActive ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
  const statusText = isActive ? 'פעיל' : 'לא פעיל'
  const statusIcon = isActive ? CheckCircleIcon : WarningCircleIcon

  // Border styling based on lesson schedule
  const borderClass = hasScheduledLesson
    ? 'border-2 border-green-400 shadow-sm shadow-green-200'
    : 'border border-gray-200'

  return (
    <div className={`bg-white ${borderClass} rounded-lg hover:shadow-lg hover:border-indigo-300 transition-all duration-200 transform hover:-translate-y-1 group ${className}`}>
      {/* Card Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Student Name with Status */}
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 font-reisinger-yonatan text-lg">
                {getDisplayName(student.personalInfo)}
              </h4>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                {React.createElement(statusIcon, { className: "w-3 h-3" })}
                {statusText}
              </span>
            </div>

            {/* Primary Instrument with Icon */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MusicNotesIcon className="w-4 h-4 text-indigo-500" />
              <span className="font-reisinger-yonatan font-medium">{instrumentName}</span>
              {currentStage > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-reisinger-yonatan">
                  שלב {currentStage}
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions - Visible on Hover */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onViewDetails(student.id)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
              title="צפה בפרטים מלאים"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(student)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="עריכת תלמיד"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(student.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="מחיקת תלמיד"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-4 py-3 space-y-3">
        
        {/* Student Info Row */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Age & Class */}
          <div className="space-y-1">
            {student.personalInfo.age && (
              <div className="flex items-center gap-2 text-gray-600">
                <UserIcon className="w-3 h-3" />
                <span className="font-reisinger-yonatan">גיל: {student.personalInfo.age}</span>
              </div>
            )}
            {student.personalInfo.class && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPinIcon className="w-3 h-3" />
                <span className="font-reisinger-yonatan">כיתה: {student.personalInfo.class}</span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-1">
            {student.personalInfo.phone && (
              <div className="flex items-center gap-2 text-gray-600" dir="ltr">
                <PhoneIcon className="w-3 h-3" />
                <span className="font-mono text-xs">{student.personalInfo.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Lesson Schedule */}
        {lessonTime && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <div className="flex items-center gap-2 text-sm text-blue-800 font-reisinger-yonatan">
              <CalendarIcon className="w-4 h-4" />
              <span className="font-medium">שיעור קבוע:</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-reisinger-yonatan text-blue-700">
                {lessonTime}
              </span>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <ClockIcon className="w-3 h-3" />
                <span>{lessonDuration} דק'</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          {/* Primary Action Button */}
          <button
            onClick={() => onViewDetails(student.id)}
            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 px-3 py-1 rounded-lg text-sm font-medium font-reisinger-yonatan transition-all duration-200 flex items-center gap-1"
          >
            <EyeIcon className="w-4 h-4" />
            פרטים מלאים
          </button>

          {/* Schedule/Update Lesson Button */}
          {hasScheduledLesson && onUpdateLesson ? (
            <button
              onClick={() => onUpdateLesson(student)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-3 py-1 rounded-lg text-sm font-medium font-reisinger-yonatan transition-all duration-200 flex items-center gap-1"
            >
              <CalendarIcon className="w-4 h-4" />
              עדכן שיעור קבוע
            </button>
          ) : onScheduleLesson && !hasScheduledLesson ? (
            <button
              onClick={() => onScheduleLesson(student.id)}
              className="text-green-600 hover:text-green-800 hover:bg-green-100 px-3 py-1 rounded-lg text-sm font-medium font-reisinger-yonatan transition-all duration-200 flex items-center gap-1"
            >
              <CalendarIcon className="w-4 h-4" />
              תזמן שיעור
            </button>
          ) : null}

          {/* Mark Attendance Button */}
          {onMarkAttendance && (
            <button
              onClick={() => onMarkAttendance(student.id)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-3 py-1 rounded-lg text-sm font-medium font-reisinger-yonatan transition-all duration-200 flex items-center gap-1"
            >
              <CheckSquareIcon className="w-4 h-4" />
              נוכחות
            </button>
          )}

          {/* Add Note Button */}
          {onAddNote && (
            <button
              onClick={() => onAddNote(student.id)}
              className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 px-3 py-1 rounded-lg text-sm font-medium font-reisinger-yonatan transition-all duration-200 flex items-center gap-1"
            >
              <FileTextIcon className="w-4 h-4" />
              הערה
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper component for stage indicators
function StageIndicator({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(max)].map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            index < current
              ? 'bg-indigo-500'
              : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}