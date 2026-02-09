/**
 * Enhanced Progress Tracker Component
 * 
 * Advanced progress tracking with real-time updates, estimated time remaining,
 * cancel operation support, and detailed error recovery UI
 */

import React, { useState, useEffect } from 'react'
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Pause,
  Play,
  Square,
  Info,
  Zap,
  TrendingUp,
  Activity,
  Timer,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { DeletionOperation } from './types'
import { ProgressBar, StepProgress } from '../feedback/ProgressIndicators'
import { Card } from '../ui/Card'

interface EnhancedProgressTrackerProps {
  operation: DeletionOperation
  onCancel?: () => void
  onPause?: () => void
  onResume?: () => void
  onRetry?: () => void
  realTimeUpdates?: boolean
  showDetailedSteps?: boolean
  className?: string
}

interface PerformanceMetrics {
  itemsPerSecond: number
  estimatedTimeRemaining: number
  totalElapsedTime: number
  averageStepDuration: number
}

const EnhancedProgressTracker: React.FC<EnhancedProgressTrackerProps> = ({
  operation,
  onCancel,
  onPause,
  onResume,
  onRetry,
  realTimeUpdates = true,
  showDetailedSteps = true,
  className = ''
}) => {
  const [showMetrics, setShowMetrics] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    itemsPerSecond: 0,
    estimatedTimeRemaining: 0,
    totalElapsedTime: 0,
    averageStepDuration: 0
  })
  const [previousProgress, setPreviousProgress] = useState(operation.progress)
  const [progressHistory, setProgressHistory] = useState<Array<{timestamp: Date, progress: number}>>([])

  // Calculate performance metrics
  useEffect(() => {
    if (!operation.startTime) return

    const now = new Date()
    const elapsed = (now.getTime() - operation.startTime.getTime()) / 1000
    const progressDelta = operation.progress - previousProgress
    
    if (progressDelta > 0 && elapsed > 0) {
      const itemsPerSecond = progressDelta / elapsed
      const remainingProgress = 100 - operation.progress
      const estimatedTimeRemaining = remainingProgress / itemsPerSecond
      
      setPerformanceMetrics(prev => ({
        ...prev,
        itemsPerSecond,
        estimatedTimeRemaining,
        totalElapsedTime: elapsed,
        averageStepDuration: elapsed / Math.max(1, operation.progress / 20)
      }))
    }
    
    // Update progress history
    setProgressHistory(prev => {
      const newHistory = [...prev, { timestamp: now, progress: operation.progress }]
      return newHistory.slice(-20) // Keep last 20 points
    })
    
    setPreviousProgress(operation.progress)
  }, [operation.progress, operation.startTime])

  const getStatusIcon = () => {
    switch (operation.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-500" />
      case 'running':
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-6 h-6 text-gray-500" />
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

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)} שניות`
    if (seconds < 3600) return `${Math.round(seconds / 60)} דקות`
    return `${Math.round(seconds / 3600)} שעות`
  }

  const formatTimeRemaining = () => {
    if (operation.status !== 'running' || performanceMetrics.estimatedTimeRemaining <= 0) {
      return 'לא זמין'
    }
    return formatDuration(performanceMetrics.estimatedTimeRemaining)
  }

  const generateDetailedSteps = () => {
    const baseSteps = [
      {
        id: 'initialization',
        label: 'אתחול מערכת',
        description: 'הכנת המערכת לתהליך המחיקה',
        status: 'completed' as const
      },
      {
        id: 'validation',
        label: 'אימות נתונים ותלות',
        description: 'בדיקת קישורים ותלות בין רשומות',
        status: operation.progress > 10 ? 'completed' as const : 'current' as const
      },
      {
        id: 'backup',
        label: 'יצירת גיבוי',
        description: 'גיבוי נתונים לשחזור אפשרי',
        status: operation.progress > 25 ? 'completed' as const : 
                operation.progress > 15 ? 'current' as const : 'pending' as const
      },
      {
        id: 'related_documents',
        label: 'טיפול במסמכים',
        description: `עיבוד ${operation.impact.relatedRecords.filter(r => r.type === 'document').length} מסמכים`,
        status: operation.progress > 40 ? 'completed' as const :
                operation.progress > 30 ? 'current' as const : 'pending' as const
      },
      {
        id: 'attendance_records',
        label: 'מחיקת רשומות נוכחות',
        description: `טיפול ברשומות נוכחות`,
        status: operation.progress > 55 ? 'completed' as const :
                operation.progress > 45 ? 'current' as const : 'pending' as const
      },
      {
        id: 'lessons_assignments',
        label: 'הסרת שיבוצים לשיעורים',
        description: `עדכון ${operation.impact.relatedRecords.filter(r => r.type === 'lesson').length} שיעורים`,
        status: operation.progress > 70 ? 'completed' as const :
                operation.progress > 60 ? 'current' as const : 'pending' as const
      },
      {
        id: 'orchestra_memberships',
        label: 'הסרה מתזמורות',
        description: `עדכון ${operation.impact.relatedRecords.filter(r => r.type === 'orchestra').length} תזמורות`,
        status: operation.progress > 85 ? 'completed' as const :
                operation.progress > 75 ? 'current' as const : 'pending' as const
      },
      {
        id: 'orphan_cleanup',
        label: 'ניקוי הפניות יתומות',
        description: `ניקוי ${operation.impact.orphanedReferences.length} הפניות`,
        status: operation.progress > 92 ? 'completed' as const :
                operation.progress > 88 ? 'current' as const : 'pending' as const
      },
      {
        id: 'main_entity',
        label: 'מחיקת הישות הראשית',
        description: operation.entityName,
        status: operation.progress === 100 ? 'completed' as const :
                operation.progress > 95 ? 'current' as const : 'pending' as const
      },
      {
        id: 'finalization',
        label: 'סיום ועדכון מערכת',
        description: 'עדכון אינדקסים ומבני נתונים',
        status: operation.progress === 100 && operation.status === 'completed' ? 'completed' as const :
                operation.progress > 98 ? 'current' as const : 'pending' as const
      }
    ]

    // Handle error states
    if (operation.status === 'failed' && operation.error) {
      const currentStepIndex = Math.floor(operation.progress / 10)
      if (currentStepIndex < baseSteps.length) {
        baseSteps[currentStepIndex].status = 'error'
      }
    }

    return baseSteps
  }

  const renderProgressChart = () => {
    if (progressHistory.length < 2) return null

    const maxProgress = Math.max(...progressHistory.map(p => p.progress))
    const points = progressHistory.map((point, index) => {
      const x = (index / (progressHistory.length - 1)) * 100
      const y = 100 - (point.progress / maxProgress) * 100
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 font-reisinger-yonatan">
          גרף התקדמות
        </h4>
        <div className="bg-gray-50 rounded-lg p-3">
          <svg viewBox="0 0 100 60" className="w-full h-16">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {[20, 40, 60, 80].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
            ))}
            
            {/* Progress area */}
            <polygon
              points={`0,60 ${points} 100,60`}
              fill="url(#progressGradient)"
            />
            
            {/* Progress line */}
            <polyline
              points={points}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    )
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
                {operation.status === 'running' ? 'מוחק את' : 'מחיקת'} {operation.entityName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium border
                  ${getStatusColor()}
                `}>
                  <span className="font-reisinger-yonatan">{getStatusText()}</span>
                </span>
                
                {operation.startTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className="font-reisinger-yonatan">
                      זמן שעבר: {formatDuration(performanceMetrics.totalElapsedTime)}
                    </span>
                  </div>
                )}
                
                {operation.status === 'running' && (
                  <div className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    <span className="font-reisinger-yonatan">
                      נותר: {formatTimeRemaining()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {operation.status === 'running' && (
              <>
                {onPause && (
                  <button
                    onClick={onPause}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span className="font-reisinger-yonatan">השהה</span>
                  </button>
                )}
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    <span className="font-reisinger-yonatan">ביטול</span>
                  </button>
                )}
              </>
            )}

            {operation.status === 'pending' && onResume && (
              <button
                onClick={onResume}
                className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span className="font-reisinger-yonatan">המשך</span>
              </button>
            )}

            {operation.status === 'failed' && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="font-reisinger-yonatan">נסה שוב</span>
              </button>
            )}

            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span className="font-reisinger-yonatan">מטריקות</span>
              {showMetrics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Main Progress Bar */}
        <div className="space-y-2">
          <ProgressBar
            value={operation.progress}
            label={`התקדמות כללית (${operation.progress}%)`}
            showPercentage={true}
            color={operation.status === 'failed' ? 'red' : 
                   operation.status === 'completed' ? 'green' : 'primary'}
            animated={operation.status === 'running'}
            striped={operation.status === 'running'}
          />
          
          {operation.currentStep && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="font-reisinger-yonatan">
                שלב נוכחי: {operation.currentStep}
              </span>
              <span className="font-reisinger-yonatan">
                {Math.floor(operation.progress / (100 / operation.totalSteps)) + 1} מתוך {operation.totalSteps}
              </span>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        {showMetrics && (
          <Card className="bg-blue-50 border-blue-200">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900 font-reisinger-yonatan">
                  מטריקות ביצועים
                </h4>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {performanceMetrics.itemsPerSecond.toFixed(1)}
                  </div>
                  <div className="text-xs text-blue-700 font-reisinger-yonatan">פריטים/שנייה</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {formatDuration(performanceMetrics.averageStepDuration)}
                  </div>
                  <div className="text-xs text-blue-700 font-reisinger-yonatan">ממוצע שלב</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {formatTimeRemaining()}
                  </div>
                  <div className="text-xs text-blue-700 font-reisinger-yonatan">זמן נותר</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {formatDuration(performanceMetrics.totalElapsedTime)}
                  </div>
                  <div className="text-xs text-blue-700 font-reisinger-yonatan">זמן כולל</div>
                </div>
              </div>

              {renderProgressChart()}
            </div>
          </Card>
        )}

        {/* Detailed Step Progress */}
        {showDetailedSteps && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-500" />
              <h4 className="font-semibold text-gray-900 font-reisinger-yonatan">
                שלבי התהליך
              </h4>
            </div>
            
            <StepProgress
              steps={generateDetailedSteps()}
              direction="vertical"
              className="mt-4"
            />
          </div>
        )}

        {/* Error Display */}
        {operation.error && (
          <Card className="bg-red-50 border-red-200">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold font-reisinger-yonatan">שגיאה בתהליך</span>
              </div>
              
              <p className="text-sm text-red-600 font-reisinger-yonatan">
                {operation.error}
              </p>

              {onRetry && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={onRetry}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="font-reisinger-yonatan">נסה שוב</span>
                  </button>
                  
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Square className="w-4 h-4" />
                      <span className="font-reisinger-yonatan">בטל תהליך</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Completion Info */}
        {operation.status === 'completed' && (
          <Card className="bg-green-50 border-green-200">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold font-reisinger-yonatan">
                  התהליך הושלם בהצלחה!
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                <div>
                  <span className="font-medium font-reisinger-yonatan">זמן כולל:</span> {formatDuration(performanceMetrics.totalElapsedTime)}
                </div>
                <div>
                  <span className="font-medium font-reisinger-yonatan">פריטים מעובדים:</span> {operation.impact.relatedRecords.length + 1}
                </div>
              </div>

              {operation.rollbackAvailable && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Info className="w-4 h-4" />
                  <span className="font-reisinger-yonatan">
                    ניתן לשחזר את הנתונים תוך 30 יום
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Cancellation Info */}
        {operation.status === 'cancelled' && (
          <Card className="bg-orange-50 border-orange-200">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-5 h-5" />
              <div>
                <span className="font-semibold font-reisinger-yonatan block">
                  התהליך בוטל על ידי המשתמש
                </span>
                <p className="text-sm text-orange-600 mt-1 font-reisinger-yonatan">
                  המידע לא נמחק ונשמר במצב המקורי. כל השינויים שבוצעו עד עתה בוטלו.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Time Information */}
        <div className="flex justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
          <div className="font-reisinger-yonatan">
            {operation.startTime && (
              <>התחיל: {operation.startTime.toLocaleString('he-IL')}</>
            )}
          </div>
          <div className="font-reisinger-yonatan">
            {operation.endTime ? (
              <>הסתיים: {operation.endTime.toLocaleString('he-IL')}</>
            ) : realTimeUpdates && (
              <>עדכון אחרון: {new Date().toLocaleTimeString('he-IL')}</>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default EnhancedProgressTracker