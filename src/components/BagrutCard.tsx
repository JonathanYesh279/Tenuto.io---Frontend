import React from 'react'

import { Card } from './ui/Card'
import type { Bagrut } from '../types/bagrut.types'
import { CalendarIcon, CheckCircleIcon, DownloadSimpleIcon, EyeIcon, FileTextIcon, MusicNotesIcon, PencilIcon, TrashIcon, UserIcon } from '@phosphor-icons/react'

interface BagrutCardProps {
  bagrut: Bagrut
  studentName: string
  teacherName: string
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onExport?: () => void
  className?: string
}

const BagrutCard: React.FC<BagrutCardProps> = ({
  bagrut,
  studentName,
  teacherName,
  onClick,
  onEdit,
  onDelete,
  onExport,
  className = ''
}) => {
  // Calculate progress
  const presentationsCompleted = bagrut.presentations?.filter(p => p.completed).length || 0
  const totalPresentations = 4
  const magenCompleted = bagrut.magenBagrut?.completed ? 1 : 0
  const programPieces = bagrut.program?.length || 0
  
  const totalTasks = totalPresentations + 1 // presentations + magen
  const completedTasks = presentationsCompleted + magenCompleted
  const progressPercentage = Math.round((completedTasks / totalTasks) * 100)

  // Get status color
  const getStatusColor = () => {
    if (bagrut.isCompleted) return 'bg-green-100 text-green-800'
    if (progressPercentage >= 50) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  // Get grade color
  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600'
    if (grade >= 80) return 'text-blue-600'
    if (grade >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card 
      className={`hover:shadow-card-hover transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
      padding="md"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{studentName}</h3>
            <p className="text-sm text-gray-600">{teacherName}</p>
          </div>
        </div>
        
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {bagrut.isCompleted ? 'הושלם' : 'בתהליך'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">התקדמות</span>
          <span className="text-sm font-medium text-gray-900">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              progressPercentage >= 100 ? 'bg-green-500' :
              progressPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <FileTextIcon className="w-4 h-4 ml-1 text-gray-400" />
          <span>{presentationsCompleted}/{totalPresentations} מצגות</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MusicNotesIcon className="w-4 h-4 ml-1 text-gray-400" />
          <span>{programPieces} יצירות</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <CheckCircleIcon className="w-4 h-4 ml-1 text-gray-400" />
          <span>מגן: {magenCompleted ? 'הושלם' : 'בתהליך'}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4 ml-1 text-gray-400" />
          <span>
            {bagrut.testDate 
              ? new Date(bagrut.testDate).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })
              : 'לא נקבע'}
          </span>
        </div>
      </div>

      {/* Grade Display */}
      {bagrut.finalGrade && (
        <div className="text-center p-3 bg-gray-50 rounded mb-4">
          <div className="text-xs text-gray-600 mb-1">ציון סופי</div>
          <div className={`text-2xl font-bold ${getGradeColor(bagrut.finalGrade)}`}>
            {bagrut.finalGrade}
          </div>
          {bagrut.finalGradeLevel && (
            <div className="text-xs text-gray-600 mt-1">{bagrut.finalGradeLevel}</div>
          )}
        </div>
      )}

      {/* Conservatory Name */}
      {bagrut.conservatoryName && (
        <div className="text-sm text-gray-600 mb-4 text-center">
          {bagrut.conservatoryName}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.()
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="ערוך"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExport?.()
            }}
            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded transition-colors"
            title="ייצא PDF"
          >
            <DownloadSimpleIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.()
            }}
            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
            title="מחק"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
          className="flex items-center px-3 py-1.5 bg-primary text-white rounded hover:bg-neutral-800 transition-colors text-sm"
        >
          <EyeIcon className="w-3.5 h-3.5 ml-1" />
          פרטים
        </button>
      </div>
    </Card>
  )
}

export default BagrutCard