/**
 * Cascade Deletion Workflow Component
 * 
 * Complete workflow for entity deletion with impact analysis,
 * confirmation dialogs, and progress tracking
 */

import React, { useState, useEffect, useRef } from 'react'
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { DeletionImpact, DeletionOperation, DeletionFormData } from './types'
import DeletionImpactPreview from './DeletionImpactPreview'
import DeletionProgressTracker from './DeletionProgressTracker'
import { StepProgress } from '../feedback/ProgressIndicators'
import Modal from '../ui/Modal'
import { Card } from '../ui/card'

interface CascadeDeletionWorkflowProps {
  entityType: string
  entityId: string
  entityName: string
  isOpen: boolean
  onClose: () => void
  onConfirm?: (formData: DeletionFormData) => Promise<void>
  onCancel?: () => void
  className?: string
}

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'current' | 'completed' | 'error'
}

const CascadeDeletionWorkflow: React.FC<CascadeDeletionWorkflowProps> = ({
  entityType,
  entityId,
  entityName,
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [impact, setImpact] = useState<DeletionImpact | null>(null)
  const [operation, setOperation] = useState<DeletionOperation | null>(null)
  const [formData, setFormData] = useState<DeletionFormData>({
    confirmationText: '',
    reassignments: {},
    cleanupOptions: {
      orphanedReferences: true,
      relatedDocuments: false,
      attendanceRecords: false
    },
    reason: ''
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Accessibility refs
  const stepperRef = useRef<HTMLDivElement>(null)
  const confirmationInputRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  const steps: WorkflowStep[] = [
    {
      id: 'analysis',
      title: 'ניתוח השפעה',
      description: 'בדיקת תלות ורשומות קשורות',
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'current' : 'pending'
    },
    {
      id: 'confirmation',
      title: 'אישור מחיקה',
      description: 'סקירה ואישור הפעולה',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending'
    },
    {
      id: 'execution',
      title: 'ביצוע המחיקה',
      description: 'מחיקת הנתונים והרשומות הקשורות',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending'
    }
  ]

  // Auto-focus management for accessibility
  useEffect(() => {
    if (!isOpen) return

    const focusTimeout = setTimeout(() => {
      if (currentStep === 0 && stepperRef.current) {
        stepperRef.current.focus()
      } else if (currentStep === 1 && confirmationInputRef.current) {
        confirmationInputRef.current.focus()
      }
    }, 100)

    return () => clearTimeout(focusTimeout)
  }, [currentStep, isOpen])

  // Announce step changes to screen readers
  useEffect(() => {
    if (!isOpen) return

    const announcement = document.getElementById('step-announcement')
    if (announcement) {
      announcement.textContent = `שלב ${currentStep + 1} מתוך ${steps.length}: ${steps[currentStep]?.title}`
    }
  }, [currentStep, isOpen])

  // Error announcement
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  const analyzeImpact = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      // Simulate API call for impact analysis
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock impact data
      const mockImpact: DeletionImpact = {
        entityType,
        entityId,
        entityName,
        relatedRecords: [
          {
            type: 'lesson',
            id: '1',
            name: 'שיעורים פרטיים',
            count: 12,
            action: 'delete'
          },
          {
            type: 'attendance',
            id: '2',
            name: 'רשומות נוכחות',
            count: 45,
            action: 'archive'
          }
        ],
        orphanedReferences: [
          {
            table: 'lesson_assignments',
            field: 'student_id',
            count: 3,
            canCleanup: true,
            cleanupMethod: 'delete'
          }
        ],
        severity: 'medium',
        canDelete: true,
        warnings: ['חלק מהשיעורים עדיין לא התקיימו'],
        estimatedTime: 45
      }

      setImpact(mockImpact)
      setCurrentStep(1)
    } catch (err) {
      setError('שגיאה בניתוח השפעת המחיקה. אנא נסה שוב.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleConfirm = async () => {
    if (!impact || !onConfirm) return

    // Validate confirmation text
    const expectedConfirmation = `DELETE ${entityName}`
    if (formData.confirmationText !== expectedConfirmation) {
      setError(`אנא הזן "${expectedConfirmation}" לאישור המחיקה`)
      return
    }

    setError(null)
    setCurrentStep(2)

    // Create operation tracking
    const newOperation: DeletionOperation = {
      id: `delete_${entityId}_${Date.now()}`,
      entityType,
      entityId,
      entityName,
      status: 'running',
      progress: 0,
      currentStep: 'מתחיל...',
      totalSteps: 5,
      startTime: new Date(),
      impact,
      rollbackAvailable: true
    }

    setOperation(newOperation)

    try {
      await onConfirm(formData)
      
      // Simulate progress updates
      const progressSteps = [
        'יצירת גיבוי...',
        'מחיקת רשומות קשורות...',
        'ניקוי הפניות יתומות...',
        'מחיקת הישות הראשית...',
        'סיום הפעולה...'
      ]

      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setOperation(prev => prev ? {
          ...prev,
          progress: ((i + 1) / progressSteps.length) * 100,
          currentStep: progressSteps[i]
        } : null)
      }

      // Complete operation
      setOperation(prev => prev ? {
        ...prev,
        status: 'completed',
        endTime: new Date(),
        currentStep: 'הושלם בהצלחה'
      } : null)

    } catch (err) {
      setOperation(prev => prev ? {
        ...prev,
        status: 'failed',
        endTime: new Date(),
        error: err instanceof Error ? err.message : 'שגיאה לא צפויה'
      } : null)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onClose()
  }

  const canProceed = () => {
    if (currentStep === 0) return impact !== null
    if (currentStep === 1) {
      const expectedConfirmation = `DELETE ${entityName}`
      return formData.confirmationText === expectedConfirmation
    }
    return false
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 font-reisinger-yonatan mb-2">
                ניתוח השפעת המחיקה
              </h3>
              <p className="text-gray-600 font-reisinger-yonatan">
                בוחן את כל הרשומות והקישורים הקשורים לישות זו
              </p>
              
              {!impact && !isAnalyzing && (
                <button
                  onClick={analyzeImpact}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto font-reisinger-yonatan"
                  aria-describedby="analysis-description"
                >
                  <Loader2 className="w-5 h-5" />
                  התחל ניתוח
                </button>
              )}

              {isAnalyzing && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="text-blue-600 font-reisinger-yonatan">מנתח השפעה...</span>
                </div>
              )}
            </div>

            {impact && (
              <DeletionImpactPreview impact={impact} />
            )}
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            {impact && <DeletionImpactPreview impact={impact} />}

            <Card className="border-red-200 bg-red-50">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 font-reisinger-yonatan">
                      אישור מחיקה
                    </h3>
                    <p className="text-sm text-red-700 font-reisinger-yonatan">
                      פעולה זו בלתי הפיכה ותמחק לצמיתות את כל הנתונים הקשורים
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-900 mb-2 font-reisinger-yonatan">
                      להמשך, הזן: <code className="bg-red-100 px-2 py-1 rounded font-mono">DELETE {entityName}</code>
                    </label>
                    <input
                      ref={confirmationInputRef}
                      type="text"
                      value={formData.confirmationText}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        confirmationText: e.target.value 
                      }))}
                      className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                      placeholder={`DELETE ${entityName}`}
                      aria-describedby="confirmation-help"
                      aria-required="true"
                    />
                    <div id="confirmation-help" className="mt-1 text-xs text-red-600 font-reisinger-yonatan">
                      הזן את הטקסט המדויק כפי שמוצג למעלה
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-red-900 mb-2 font-reisinger-yonatan">
                      סיבת המחיקה (אופציונלי)
                    </label>
                    <textarea
                      value={formData.reason || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        reason: e.target.value 
                      }))}
                      className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-reisinger-yonatan"
                      rows={3}
                      placeholder="תאר את הסיבה למחיקת הרשומה..."
                    />
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-red-900 font-reisinger-yonatan">
                      אפשרויות מחיקה
                    </h4>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.cleanupOptions.orphanedReferences}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            cleanupOptions: {
                              ...prev.cleanupOptions,
                              orphanedReferences: e.target.checked
                            }
                          }))}
                          className="rounded border-red-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-red-900 font-reisinger-yonatan">
                          נקה הפניות יתומות
                        </span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.cleanupOptions.relatedDocuments}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            cleanupOptions: {
                              ...prev.cleanupOptions,
                              relatedDocuments: e.target.checked
                            }
                          }))}
                          className="rounded border-red-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-red-900 font-reisinger-yonatan">
                          מחק מסמכים קשורים
                        </span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.cleanupOptions.attendanceRecords}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            cleanupOptions: {
                              ...prev.cleanupOptions,
                              attendanceRecords: e.target.checked
                            }
                          }))}
                          className="rounded border-red-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-red-900 font-reisinger-yonatan">
                          מחק רשומות נוכחות
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            {operation && (
              <DeletionProgressTracker 
                operation={operation}
                onCancel={operation.status === 'running' ? () => {
                  setOperation(prev => prev ? { ...prev, status: 'cancelled' } : null)
                } : undefined}
              />
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      closeOnBackdrop={false}
      showCloseButton={currentStep < 2}
      className={className}
    >
      <div dir="rtl" className="min-h-[600px]">
        {/* Accessibility announcements */}
        <div 
          id="step-announcement" 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
        />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 font-reisinger-yonatan">
                מחיקת {entityName}
              </h2>
              <p className="text-sm text-gray-600 font-reisinger-yonatan">
                {entityType} • מזהה: {entityId}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-gray-100">
          <StepProgress
            steps={steps.map(step => ({
              id: step.id,
              label: step.title,
              description: step.description,
              status: step.status
            }))}
            direction="horizontal"
            ref={stepperRef}
            tabIndex={-1}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label="התקדמות תהליך המחיקה"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div 
            ref={errorRef}
            className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4"
            role="alert"
            tabIndex={-1}
          >
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold font-reisinger-yonatan">שגיאה</span>
            </div>
            <p className="text-sm text-red-600 mt-1 font-reisinger-yonatan">
              {error}
            </p>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6 flex-1">
          {getStepContent()}
        </div>

        {/* Footer Actions */}
        {currentStep < 2 && (
          <div className="flex justify-between p-6 border-t border-gray-100">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-4 py-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-reisinger-yonatan"
            >
              <ArrowRight className="w-4 h-4" />
              ביטול
            </button>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex items-center gap-1 px-4 py-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-reisinger-yonatan"
                >
                  <ArrowLeft className="w-4 h-4" />
                  חזרה
                </button>
              )}

              {currentStep === 0 && impact && (
                <button
                  onClick={() => setCurrentStep(1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-reisinger-yonatan"
                >
                  המשך
                  <ArrowRight className="w-4 h-4 scale-x-[-1]" />
                </button>
              )}

              {currentStep === 1 && (
                <button
                  onClick={handleConfirm}
                  disabled={!canProceed()}
                  className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-reisinger-yonatan"
                >
                  <Trash2 className="w-4 h-4" />
                  מחק כעת
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default CascadeDeletionWorkflow