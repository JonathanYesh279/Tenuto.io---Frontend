import React, { useState } from 'react'

import { Card } from './ui/Card'
import ConfirmationModal from './ui/ConfirmationModal'
import { getDisplayName, getInitials as getNameInitials } from '../utils/nameUtils'
import { CalendarIcon, PhoneIcon, TrashIcon, UserIcon } from '@phosphor-icons/react'

interface Student {
  _id: string
  personalInfo: {
    firstName?: string
    lastName?: string
    fullName?: string
    phone: string
    parentName?: string
    parentPhone?: string
  }
  academicInfo: {
    class: string
    instrumentProgress: Array<{
      instrumentName: string
      isPrimary: boolean
      currentStage: number
    }>
  }
  teacherAssignments?: Array<{
    teacherId: string
    day: string
    time: string
  }>
  isActive: boolean
}

interface StudentCardProps {
  student: Student
  showInstruments?: boolean
  showTeacherAssignments?: boolean
  showParentContact?: boolean
  onClick?: () => void
  onDelete?: (studentId: string) => void
  className?: string
  isSelectMode?: boolean
  isSelected?: boolean
  onSelectionChange?: (studentId: string, selected: boolean) => void
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  showInstruments = true,
  showTeacherAssignments = true,
  showParentContact = false,
  onClick,
  onDelete,
  className = '',
  isSelectMode = false,
  isSelected = false,
  onSelectionChange
}) => {
  // Get primary instrument or first instrument
  const primaryInstrument = student.academicInfo.instrumentProgress?.find(inst => inst.isPrimary) 
    || student.academicInfo.instrumentProgress?.[0]

  // Get stage color based on current stage
  const getStageColor = (stage: number): string => {
    const colors = {
      1: 'bg-gray-100 text-gray-800',
      2: 'bg-blue-100 text-blue-800', 
      3: 'bg-green-100 text-green-800',
      4: 'bg-yellow-100 text-yellow-800',
      5: 'bg-orange-100 text-orange-800',
      6: 'bg-red-100 text-red-800',
      7: 'bg-purple-100 text-purple-800',
      8: 'bg-indigo-100 text-indigo-800'
    }
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Generate avatar initials using nameUtils
  const getInitials = () => {
    return getNameInitials(student.personalInfo) || 'ת'
  }

  // Get avatar background color based on stage
  const getAvatarColor = (stage: number): string => {
    const colors = {
      1: 'bg-gray-500',
      2: 'bg-blue-500',
      3: 'bg-green-500', 
      4: 'bg-yellow-500',
      5: 'bg-orange-500',
      6: 'bg-red-500',
      7: 'bg-purple-500',
      8: 'bg-indigo-500'
    }
    return colors[stage as keyof typeof colors] || 'bg-gray-500'
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when clicking delete
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(student._id)
    }
    setShowDeleteModal(false)
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation() // Prevent card click when clicking checkbox
    if (onSelectionChange) {
      onSelectionChange(student._id, e.target.checked)
    }
  }

  return (
    <Card 
      className={`relative transition-all duration-200 hover:shadow-md ${onClick ? (isSelectMode ? 'cursor-pointer hover:shadow-lg' : 'cursor-pointer hover:shadow-lg') : ''} ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''} ${className}`}
      onClick={onClick}
      padding="md"
    >
      {/* Selection checkbox */}
      {isSelectMode && (
        <div className="absolute top-3 right-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
      )}
      
      <div className="flex items-start space-x-4 space-x-reverse">
        {/* Avatar with stage color */}
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm
          ${primaryInstrument ? getAvatarColor(primaryInstrument.currentStage) : 'bg-gray-500'}
        `}>
          {getInitials()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header with name and status */}
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'} ${isSelectMode ? 'ml-6' : ''}`}>
              {getDisplayName(student.personalInfo)}
            </h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              {/* Delete button */}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="מחק תלמיד"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
              {/* Active status indicator */}
              <div className={`w-3 h-3 rounded-full ${student.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
              {/* Class badge */}
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                כיתה {student.academicInfo.class}
              </span>
            </div>
          </div>

          {/* Primary instrument and stage */}
          {showInstruments && primaryInstrument && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm text-gray-600">כלי ראשי:</span>
                <span className="text-sm font-medium text-gray-900">
                  {primaryInstrument.instrumentName}
                </span>
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${getStageColor(primaryInstrument.currentStage)}
                `}>
                  שלב {primaryInstrument.currentStage}
                </span>
              </div>
            </div>
          )}

          {/* Teacher assignments count */}
          {showTeacherAssignments && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  {student.teacherAssignments?.length || 0} שיעורים שבועיים
                </span>
              </div>
            </div>
          )}

          {/* Additional instruments (if more than one) */}
          {showInstruments && student.academicInfo.instrumentProgress && student.academicInfo.instrumentProgress.length > 1 && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">כלים נוספים:</div>
              <div className="flex flex-wrap gap-1">
                {student.academicInfo.instrumentProgress
                  .filter(inst => !inst.isPrimary)
                  .map((instrument, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                    >
                      {instrument.instrumentName} (שלב {instrument.currentStage})
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Parent contact info */}
          {showParentContact && student.personalInfo.parentName && (
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="text-xs text-gray-500 mb-1">פרטי הורה:</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <UserIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-700">{student.personalInfo.parentName}</span>
                </div>
                {student.personalInfo.parentPhone && (
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <PhoneIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-700 font-mono" dir="ltr">
                      {student.personalInfo.parentPhone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student contact */}
          <div className="border-t border-gray-100 pt-2 mt-2">
            <div className="flex items-center space-x-2 space-x-reverse text-sm">
              <PhoneIcon className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600 font-mono" dir="ltr">
                {student.personalInfo.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת תלמיד"
        message={`האם אתה בטוח שברצונך למחוק את התלמיד ${getDisplayName(student.personalInfo)}? פעולה זו לא ניתנת לביטול.`}
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
    </Card>
  )
}

export default StudentCard