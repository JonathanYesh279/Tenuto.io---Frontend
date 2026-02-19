/**
 * Student Deletion Modal Component
 * 
 * Multi-step deletion workflow with impact preview, warnings,
 * and typed confirmation for student deletion
 */

import React, { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  User, 
  ChevronRight,
  ChevronLeft,
  X,
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Modal from '../ui/Modal'
import { Card } from '../ui/Card'
import { DeletionImpact, DeletionFormData } from './types'
import DeletionImpactPreview from './DeletionImpactPreview'
import DeletionProgressTracker from './DeletionProgressTracker'

interface StudentDeletionModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName: string
  onConfirmDeletion: (formData: DeletionFormData) => Promise<void>
  onGetDeletionImpact: (studentId: string) => Promise<DeletionImpact>
  isLoading?: boolean
  className?: string
}

type Step = 'impact' | 'confirmation' | 'progress' | 'complete'

const StudentDeletionModal: React.FC<StudentDeletionModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  onConfirmDeletion,
  onGetDeletionImpact,
  isLoading = false,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('impact')
  const [impact, setImpact] = useState<DeletionImpact | null>(null)
  const [formData, setFormData] = useState<DeletionFormData>({
    confirmationText: '',
    reassignments: {},
    cleanupOptions: {
      orphanedReferences: true,
      relatedDocuments: true,
      attendanceRecords: true
    },
    reason: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [loadingImpact, setLoadingImpact] = useState(false)

  // Load deletion impact when modal opens
  useEffect(() => {
    if (isOpen && !impact) {
      loadDeletionImpact()
    }
  }, [isOpen, studentId])

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('impact')
      setImpact(null)
      setFormData({
        confirmationText: '',
        reassignments: {},
        cleanupOptions: {
          orphanedReferences: true,
          relatedDocuments: true,
          attendanceRecords: true
        },
        reason: ''
      })
      setIsProcessing(false)
    }
  }, [isOpen])

  const loadDeletionImpact = async () => {
    setLoadingImpact(true)
    try {
      const impactData = await onGetDeletionImpact(studentId)
      setImpact(impactData)
    } catch (error) {
      console.error('Failed to load deletion impact:', error)
    } finally {
      setLoadingImpact(false)
    }
  }

  const handleNext = () => {
    switch (currentStep) {
      case 'impact':
        setCurrentStep('confirmation')
        break
      case 'confirmation':
        if (canProceedToConfirmation()) {
          handleStartDeletion()
        }
        break
    }
  }

  const handlePrevious = () => {
    switch (currentStep) {
      case 'confirmation':
        setCurrentStep('impact')
        break
      case 'progress':
        // Cannot go back once started
        break
      case 'complete':
        onClose()
        break
    }
  }

  const handleStartDeletion = async () => {
    if (!impact || !canProceedToConfirmation()) return

    setCurrentStep('progress')
    setIsProcessing(true)

    try {
      await onConfirmDeletion(formData)
      setCurrentStep('complete')
    } catch (error) {
      console.error('Deletion failed:', error)
      // Stay in progress step to show error
    } finally {
      setIsProcessing(false)
    }
  }

  const canProceedFromImpact = () => {
    return impact && impact.canDelete
  }

  const canProceedToConfirmation = () => {
    return (
      formData.confirmationText === studentName &&
      formData.reason?.trim().length > 0
    )
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'impact': return 'בדיקת השפעה'
      case 'confirmation': return 'אישור מחיקה'
      case 'progress': return 'ביצוע מחיקה'
      case 'complete': return 'הושלם'
      default: return ''
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { id: 'impact', label: 'השפעה', icon: Shield },
      { id: 'confirmation', label: 'אישור', icon: FileText },
      { id: 'progress', label: 'ביצוע', icon: Clock },
      { id: 'complete', label: 'הושלם', icon: CheckCircle }
    ]

    const getCurrentStepIndex = () => {
      return steps.findIndex(step => step.id === currentStep)
    }

    const currentIndex = getCurrentStepIndex()

    return (
      <div className="flex items-center justify-center mb-6 px-4" dir="rtl">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isUpcoming = index > currentIndex

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                  ${isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`
                  mr-2 text-sm font-medium font-reisinger-yonatan
                  ${isCompleted 
                    ? 'text-green-600' 
                    : isCurrent 
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }
                `}>
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-0.5 mx-4 transition-all duration-200
                  ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}
                `} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  const renderImpactStep = () => (
    <div className="space-y-6" dir="rtl">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
          <User className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 font-reisinger-yonatan mb-2">
          מחיקת תלמיד - {studentName}
        </h3>
        <p className="text-gray-600 font-reisinger-yonatan">
          נבדקת השפעת המחיקה על המערכת
        </p>
      </div>

      {loadingImpact ? (
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      ) : impact ? (
        <DeletionImpactPreview impact={impact} />
      ) : (
        <Card className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 font-reisinger-yonatan">
            לא ניתן לטעון את נתוני ההשפעה
          </p>
          <button
            onClick={loadDeletionImpact}
            className="mt-4 px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors font-reisinger-yonatan"
          >
            נסה שוב
          </button>
        </Card>
      )}
    </div>
  )

  const renderConfirmationStep = () => (
    <div className="space-y-6" dir="rtl">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full">
          <AlertTriangle className="w-8 h-8 text-orange-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 font-reisinger-yonatan mb-2">
          אישור סופי למחיקה
        </h3>
        <p className="text-gray-600 font-reisinger-yonatan">
          פעולה זו אינה הפיכה ותמחק לצמיתות את כל הנתונים
        </p>
      </div>

      <Card className="bg-red-50 border-red-200">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            <span className="font-semibold font-reisinger-yonatan">אזהרה חמורה</span>
          </div>
          <div className="text-sm text-red-700 space-y-1 font-reisinger-yonatan">
            <p>• כל הנתונים של התלמיד יימחקו לצמיתות</p>
            <p>• היסטוריית נוכחות וציונים תאבד</p>
            <p>• קבצים ומסמכים קשורים יימחקו</p>
            <p>• לא ניתן לשחזר את הנתונים לאחר המחיקה</p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-reisinger-yonatan">
            סיבת המחיקה (חובה)
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="הזן את הסיבה למחיקת התלמיד..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-reisinger-yonatan"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-reisinger-yonatan">
            אפשרויות ניקוי
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
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
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="mr-2 text-sm text-gray-700 font-reisinger-yonatan">
                נקה הפניות יתומות
              </span>
            </label>
            
            <label className="flex items-center">
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
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="mr-2 text-sm text-gray-700 font-reisinger-yonatan">
                מחק מסמכים קשורים
              </span>
            </label>
            
            <label className="flex items-center">
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
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="mr-2 text-sm text-gray-700 font-reisinger-yonatan">
                מחק רשומות נוכחות
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-reisinger-yonatan">
            אישור סופי - הקלד את שם התלמיד: <strong>{studentName}</strong>
          </label>
          <input
            type="text"
            value={formData.confirmationText}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmationText: e.target.value }))}
            placeholder={studentName}
            className={`
              w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-reisinger-yonatan
              ${formData.confirmationText === studentName 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300'
              }
            `}
            required
          />
          <p className="text-xs text-gray-500 mt-1 font-reisinger-yonatan">
            יש להקליד את שם התלמיד בדיוק כפי שמופיע למעלה
          </p>
        </div>
      </div>
    </div>
  )

  const renderProgressStep = () => {
    if (!impact) return null

    // Mock deletion operation for demo
    const mockOperation = {
      id: 'deletion-' + studentId,
      entityType: 'student',
      entityId: studentId,
      entityName: studentName,
      status: 'running' as const,
      progress: 45,
      currentStep: 'מחיקת רשומות קשורות',
      totalSteps: 5,
      startTime: new Date(),
      impact,
      rollbackAvailable: false
    }

    return (
      <div className="space-y-6" dir="rtl">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 font-reisinger-yonatan mb-2">
            תהליך המחיקה מתבצע
          </h3>
          <p className="text-gray-600 font-reisinger-yonatan">
            אנא המתן עד להשלמת התהליך. לא לסגור חלון זה.
          </p>
        </div>

        <DeletionProgressTracker
          operation={mockOperation}
          onCancel={() => {
            // Handle cancellation
            setCurrentStep('confirmation')
            setIsProcessing(false)
          }}
        />

        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Clock className="w-5 h-5" />
            <span className="font-semibold font-reisinger-yonatan">הערה חשובה</span>
          </div>
          <p className="text-sm text-blue-700 mt-2 font-reisinger-yonatan">
            תהליך המחיקה עלול להימשך מספר דקות. המערכת תעדכן אותך על ההתקדמות.
          </p>
        </Card>
      </div>
    )
  }

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center" dir="rtl">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-900 font-reisinger-yonatan mb-2">
          המחיקה הושלמה בהצלחה
        </h3>
        <p className="text-gray-600 font-reisinger-yonatan">
          התלמיד {studentName} נמחק מהמערכת יחד עם כל הנתונים הקשורים
        </p>
      </div>

      <Card className="bg-green-50 border-green-200 text-right">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold font-reisinger-yonatan">פעולות שבוצעו:</span>
          </div>
          <ul className="text-sm text-green-700 space-y-1 font-reisinger-yonatan">
            <li>• מחיקת פרטי התלמיד האישיים</li>
            <li>• הסרת השיבוצים לשיעורים</li>
            <li>• מחיקת היסטוריית נוכחות</li>
            <li>• ניקוי הפניות יתומות במערכת</li>
            <li>• רישום פעולה ביומן המערכת</li>
          </ul>
        </div>
      </Card>
    </div>
  )

  const renderFooter = () => {
    const showPrevious = currentStep !== 'impact' && currentStep !== 'progress'
    const showNext = currentStep !== 'progress' && currentStep !== 'complete'
    const showClose = currentStep === 'complete'

    return (
      <div className="flex justify-between items-center pt-6 border-t border-gray-200" dir="rtl">
        <div>
          {showPrevious && (
            <button
              onClick={handlePrevious}
              className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="font-reisinger-yonatan">הקודם</span>
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {currentStep !== 'progress' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors font-reisinger-yonatan"
            >
              ביטול
            </button>
          )}
          
          {showNext && (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 'impact' && !canProceedFromImpact()) ||
                (currentStep === 'confirmation' && !canProceedToConfirmation()) ||
                isProcessing
              }
              className={`
                flex items-center gap-1 px-4 py-2 text-sm rounded transition-colors
                ${(currentStep === 'impact' && canProceedFromImpact()) || 
                  (currentStep === 'confirmation' && canProceedToConfirmation())
                  ? 'text-white bg-red-600 hover:bg-red-700' 
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }
              `}
            >
              <span className="font-reisinger-yonatan">
                {currentStep === 'impact' ? 'המשך' : 'מחק תלמיד'}
              </span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {showClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="font-reisinger-yonatan">סגור</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'impact': return renderImpactStep()
      case 'confirmation': return renderConfirmationStep()
      case 'progress': return renderProgressStep()
      case 'complete': return renderCompleteStep()
      default: return null
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={currentStep === 'progress' ? () => {} : onClose}
      maxWidth="4xl"
      closeOnBackdrop={currentStep !== 'progress'}
      showCloseButton={currentStep !== 'progress'}
      className={className}
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 font-reisinger-yonatan">
            {getStepTitle()}
          </h2>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderCurrentStep()}
        </div>

        {/* Footer */}
        {renderFooter()}
      </div>
    </Modal>
  )
}

export default StudentDeletionModal