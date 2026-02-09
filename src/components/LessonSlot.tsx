import React from 'react'
import { Clock, MapPin, User, Music, Edit, Trash2 } from 'lucide-react'
import { Card } from './ui/Card'

interface LessonSlot {
  _id?: string
  time: string
  duration: number
  studentId?: string
  studentName?: string
  instrumentName?: string
  currentStage?: number
  location?: string
  day?: string
  endTime?: string
  isAvailable?: boolean
  notes?: string
}

interface LessonSlotProps {
  lesson: LessonSlot
  showStudent?: boolean
  showTime?: boolean
  showInstrument?: boolean
  showLocation?: boolean
  editable?: boolean
  compact?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onClick?: () => void
  className?: string
}

const LessonSlot: React.FC<LessonSlotProps> = ({
  lesson,
  showStudent = true,
  showTime = true,
  showInstrument = true,
  showLocation = true,
  editable = false,
  compact = false,
  onEdit,
  onDelete,
  onClick,
  className = ''
}) => {
  // Calculate end time if not provided
  const getEndTime = (): string => {
    if (lesson.endTime) return lesson.endTime
    
    const [hours, minutes] = lesson.time.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + lesson.duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMins = totalMinutes % 60
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  // Get stage color
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

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} דק'`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}:${mins.toString().padStart(2, '0')} שע'` : `${hours} שע'`
  }

  const endTime = getEndTime()
  const isAvailable = lesson.isAvailable !== false

  if (compact) {
    return (
      <div 
        className={`
          p-2 rounded-lg border transition-colors duration-200
          ${isAvailable ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}
          ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            {showTime && (
              <span className="text-sm font-medium text-gray-900">
                {lesson.time}-{endTime}
              </span>
            )}
            {lesson.duration && (
              <span className="text-xs text-gray-500">
                ({formatDuration(lesson.duration)})
              </span>
            )}
          </div>
          
          {editable && (
            <div className="flex items-center space-x-1 space-x-reverse">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {showStudent && lesson.studentName && (
          <div className="mt-1 text-sm text-gray-700 truncate">
            {lesson.studentName}
          </div>
        )}

        {showInstrument && lesson.instrumentName && (
          <div className="mt-1 flex items-center space-x-1 space-x-reverse">
            <span className="text-xs text-gray-600">{lesson.instrumentName}</span>
            {lesson.currentStage && (
              <span className={`
                inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                ${getStageColor(lesson.currentStage)}
              `}>
                {lesson.currentStage}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card 
      className={`
        transition-all duration-200 hover:shadow-sm
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${!isAvailable ? 'opacity-60' : ''}
        ${className}
      `}
      onClick={onClick}
      padding="sm"
    >
      <div className="space-y-3">
        {/* Header with time and actions */}
        <div className="flex items-center justify-between">
          {showTime && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {lesson.time} - {endTime}
              </span>
              <span className="text-xs text-gray-500">
                ({formatDuration(lesson.duration)})
              </span>
            </div>
          )}

          {editable && (
            <div className="flex items-center space-x-2 space-x-reverse">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Student info */}
        {showStudent && lesson.studentName && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">{lesson.studentName}</span>
          </div>
        )}

        {/* Available slot indicator */}
        {!lesson.studentName && isAvailable && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 italic">זמין לשיעור</span>
          </div>
        )}

        {/* Instrument and stage */}
        {showInstrument && lesson.instrumentName && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Music className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">{lesson.instrumentName}</span>
            {lesson.currentStage && (
              <span className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${getStageColor(lesson.currentStage)}
              `}>
                שלב {lesson.currentStage}
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {showLocation && lesson.location && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{lesson.location}</span>
          </div>
        )}

        {/* Notes */}
        {lesson.notes && (
          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs text-gray-600">{lesson.notes}</p>
          </div>
        )}

        {/* Status indicators */}
        {!isAvailable && (
          <div className="border-t border-gray-100 pt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              לא זמין
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

export default LessonSlot