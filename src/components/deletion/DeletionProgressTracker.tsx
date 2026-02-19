/**
 * Deletion Progress Tracker Component
 * 
 * Real-time progress tracking with step-by-step visualization
 * and cancellation support
 */

import React from 'react'

import { DeletionOperation } from './types'
import { ProgressBar, StepProgress } from '../feedback/ProgressIndicators'
import { Card } from '../ui/Card'
import { CheckCircleIcon, CircleNotchIcon, ClockIcon, PauseIcon, PlayIcon, SquareIcon, WarningIcon, XCircleIcon } from '@phosphor-icons/react'

interface DeletionProgressTrackerProps {
  operation: DeletionOperation
  onCancel?: () => void
  onPause?: () => void
  onResume?: () => void
  className?: string
}

const DeletionProgressTracker: React.FC<DeletionProgressTrackerProps> = ({
  operation,
  onCancel,
  onPause,
  onResume,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (operation.status) {
      case 'completed':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />
      case 'failed':
      case 'cancelled':
        return <XCircleIcon className="w-6 h-6 text-red-500" />
      case 'running':
        return <CircleNotchIcon className="w-6 h-6 text-blue-500 animate-spin" />
      default:
        return <ClockIcon className="w-6 h-6 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (operation.status) {
      case 'completed': return 'text-green-700 bg-green-50 border-green-200'
      case 'failed': return 'text-red-700 bg-red-50 border-red-200'
      case 'cancelled': return 'text-orange-700 bg-orange-50 border-orange-200'
      case 'running': return 'text-blue-700 bg-blue-50 border-blue-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = () => {
    switch (operation.status) {
      case 'pending': return 'ממתין'
      case 'running': return 'מבוצע'
      case 'completed': return 'הושלם'
      case 'failed': return 'נכשל'
      case 'cancelled': return 'בוטל'
      default: return operation.status
    }
  }

  const formatDuration = (startTime?: Date, endTime?: Date) => {
    if (!startTime) return ''
    
    const end = endTime || new Date()
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000)
    
    if (duration < 60) return `${duration} שניות`
    if (duration < 3600) return `${Math.floor(duration / 60)} דקות`
    return `${Math.floor(duration / 3600)} שעות`
  }

  const generateSteps = () => {
    const baseSteps = [
      {
        id: 'validation',
        label: 'אימות נתונים',
        description: 'בדיקת תלות וקישורים',
        status: 'completed' as const
      },
      {
        id: 'backup',
        label: 'גיבוי מידע',
        description: 'יצירת נקודת שחזור',
        status: operation.progress > 20 ? 'completed' as const : 
                operation.progress > 10 ? 'current' as const : 'pending' as const
      },
      {
        id: 'related_records',
        label: 'מחיקת רשומות קשורות',
        description: `טיפול ב-${operation.impact.relatedRecords.length} רשומות`,
        status: operation.progress > 60 ? 'completed' as const :
                operation.progress > 30 ? 'current' as const : 'pending' as const
      },
      {
        id: 'orphan_cleanup',
        label: 'ניקוי הפניות יתומות',
        description: `ניקוי ${operation.impact.orphanedReferences.length} הפניות`,
        status: operation.progress > 80 ? 'completed' as const :
                operation.progress > 70 ? 'current' as const : 'pending' as const
      },
      {
        id: 'main_entity',
        label: 'מחיקת הישות הראשית',
        description: operation.entityName,
        status: operation.progress === 100 ? 'completed' as const :
                operation.progress > 90 ? 'current' as const : 'pending' as const
      }
    ]

    // Handle error states
    if (operation.status === 'failed') {
      const currentStepIndex = Math.floor(operation.progress / 20)
      if (currentStepIndex < baseSteps.length) {
        baseSteps[currentStepIndex].status = 'error'
      }
    }

    return baseSteps
  }

  return (
    <Card className={`${className}`}>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 font-reisinger-yonatan">
                מחיקת {operation.entityName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium border
                  ${getStatusColor()}
                `}>
                  <span className="font-reisinger-yonatan">{getStatusText()}</span>
                </span>
                {operation.startTime && (
                  <span className="font-reisinger-yonatan">
                    {formatDuration(operation.startTime, operation.endTime)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {operation.status === 'running' && (
            <div className="flex gap-2">
              {onPause && (
                <button
                  onClick={onPause}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors"
                >
                  <PauseIcon className="w-4 h-4" />
                  <span className="font-reisinger-yonatan">השהה</span>
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                >
                  <SquareIcon className="w-4 h-4" />
                  <span className="font-reisinger-yonatan">ביטול</span>
                </button>
              )}
            </div>
          )}

          {operation.status === 'pending' && onResume && (
            <button
              onClick={onResume}
              className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
            >
              <PlayIcon className="w-4 h-4" />
              <span className="font-reisinger-yonatan">התחל</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <ProgressBar
            value={operation.progress}
            label="התקדמות כללית"
            showPercentage={true}
            color={operation.status === 'failed' ? 'red' : 
                   operation.status === 'completed' ? 'green' : 'primary'}
            animated={operation.status === 'running'}
          />
          
          {operation.currentStep && (
            <p className="text-sm text-gray-600 font-reisinger-yonatan">
              שלב נוכחי: {operation.currentStep}
            </p>
          )}
        </div>

        {/* Step Progress */}
        <StepProgress
          steps={generateSteps()}
          direction="vertical"
          className="mt-6"
        />

        {/* Error Display */}
        {operation.error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <WarningIcon className="w-5 h-5" />
              <span className="font-semibold font-reisinger-yonatan">שגיאה</span>
            </div>
            <p className="text-sm text-red-600 font-reisinger-yonatan">
              {operation.error}
            </p>
          </div>
        )}

        {/* Completion Info */}
        {operation.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-semibold font-reisinger-yonatan">
                המחיקה הושלמה בהצלחה
              </span>
            </div>
            {operation.rollbackAvailable && (
              <p className="text-sm text-green-600 mt-2 font-reisinger-yonatan">
                ניתן לשחזר את הנתונים תוך 30 יום
              </p>
            )}
          </div>
        )}

        {/* Cancellation Info */}
        {operation.status === 'cancelled' && (
          <div className="bg-orange-50 border border-orange-200 rounded p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <XCircleIcon className="w-5 h-5" />
              <span className="font-semibold font-reisinger-yonatan">
                התהליך בוטל
              </span>
            </div>
            <p className="text-sm text-orange-600 mt-2 font-reisinger-yonatan">
              המידע לא נמחק ונשמר במצב המקורי
            </p>
          </div>
        )}

        {/* Time Information */}
        <div className="flex justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
          <div className="font-reisinger-yonatan">
            {operation.startTime && (
              <>התחיל: {operation.startTime.toLocaleString('he-IL')}</>
            )}
          </div>
          <div className="font-reisinger-yonatan">
            {operation.endTime && (
              <>הסתיים: {operation.endTime.toLocaleString('he-IL')}</>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default DeletionProgressTracker