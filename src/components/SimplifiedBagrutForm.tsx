import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  X, Save, User, AlertCircle, CheckCircle, Search, Music,
  FileText, ChevronLeft, ChevronRight, Plus, Trash2,
  Info, Clock, CheckCircle2, AlertTriangle, Sparkles, ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import type { BagrutFormData } from '../types/bagrut.types'
import { handleServerValidationError } from '../utils/validationUtils'
import { getDisplayName } from '@/utils/nameUtils'

interface SimplifiedBagrutFormProps {
  students: any[]
  teachers: any[]
  initialData?: any
  isEdit?: boolean
  onSubmit: (data: BagrutFormData) => Promise<void>
  onCancel: () => void
}

// Field validation states
interface FieldState {
  value: any
  isValid: boolean
  error?: string
  touched: boolean
  isValidating?: boolean
}

// Form step completion state
interface StepState {
  isValid: boolean
  isComplete: boolean
  completedFields: number
  totalFields: number
}

// Simplified steps for initial bagrut creation
const STEPS = [
  { id: 'basic', name: 'מידע בסיסי', icon: User },
  { id: 'recital', name: 'הגדרת רסיטל', icon: Music },
  { id: 'program', name: 'תוכנית בסיסית', icon: FileText }
] as const

const SimplifiedBagrutForm: React.FC<SimplifiedBagrutFormProps> = ({
  students,
  teachers,
  initialData,
  isEdit = false,
  onSubmit,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [formData, setFormData] = useState<BagrutFormData>({
    studentId: '',
    teacherId: '',
    conservatoryName: 'מרכז המוסיקה רעננה',
    testDate: undefined,
    notes: '',
    recitalUnits: 5,
    recitalField: 'קלאסי',
    // Basic program pieces (start with 2)
    program: [
      { pieceTitle: '', composer: '', duration: '' },
      { pieceTitle: '', composer: '', duration: '' }
    ],
    // Basic accompanist info
    accompaniment: {
      type: 'נגן מלווה',
      accompanists: [{ name: '', instrument: 'פסנתר' }]
    }
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [stepStates, setStepStates] = useState<StepState[]>([])  
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({})
  const [studentSearch, setStudentSearch] = useState('')
  const [teacherSearch, setTeacherSearch] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)
  const [isValidatingStep, setIsValidatingStep] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // Refs for focus management
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const firstFieldRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize field states and step validation
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        studentId: initialData.studentId || '',
        teacherId: initialData.teacherId || '',
        conservatoryName: initialData.conservatoryName || 'מרכז המוסיקה רעננה',
        testDate: initialData.testDate ? new Date(initialData.testDate) : undefined,
        notes: initialData.notes || '',
        recitalUnits: initialData.recitalUnits || 5,
        recitalField: initialData.recitalField || 'קלאסי',
        program: initialData.program?.slice(0, 3) || prev.program,
        accompaniment: {
          type: initialData.accompaniment?.type || 'נגן מלווה',
          accompanists: initialData.accompaniment?.accompanists?.map((a: any) => ({
            name: a.name || '',
            instrument: a.instrument || 'פסנתר'
          })) || [{ name: '', instrument: 'פסנתר' }]
        }
      }))
    }
    
    // Initialize field states
    updateStepStates()
  }, [initialData])

  // Update step states when form data changes
  useEffect(() => {
    updateStepStates()
  }, [formData])

  // Enhanced field validation with specific error messages
  const validateField = useCallback((field: string, value: any): { isValid: boolean; error?: string } => {
    switch (field) {
      case 'studentId':
        if (!value) return { isValid: false, error: 'יש לבחור תלמיד' }
        return { isValid: true }
      case 'teacherId':
        if (!value) return { isValid: false, error: 'יש לבחור מורה מנחה' }
        return { isValid: true }
      case 'conservatoryName':
        if (value && value.length < 2) return { isValid: false, error: 'שם הקונסרבטוריון קצר מדי' }
        return { isValid: true }
      case 'recitalUnits':
        if (!value || (value !== 3 && value !== 5)) return { isValid: false, error: 'יש לבחור 3 או 5 יחידות' }
        return { isValid: true }
      case 'recitalField':
        if (!value) return { isValid: false, error: 'יש לבחור תחום רסיטל' }
        return { isValid: true }
      default:
        return { isValid: true }
    }
  }, [])

  // Update step states for progress tracking
  const updateStepStates = useCallback(() => {
    const states: StepState[] = []
    
    // Step 0: Basic Info
    const basicFields = ['studentId', 'teacherId']
    const basicCompleted = basicFields.filter(field => {
      const validation = validateField(field, formData[field as keyof BagrutFormData])
      return validation.isValid
    })
    states.push({
      isValid: basicCompleted.length === basicFields.length,
      isComplete: basicCompleted.length === basicFields.length,
      completedFields: basicCompleted.length,
      totalFields: basicFields.length
    })

    // Step 1: Recital Setup  
    const recitalFields = ['recitalUnits', 'recitalField']
    const recitalCompleted = recitalFields.filter(field => {
      const validation = validateField(field, formData[field as keyof BagrutFormData])
      return validation.isValid
    })
    states.push({
      isValid: recitalCompleted.length === recitalFields.length,
      isComplete: recitalCompleted.length === recitalFields.length,
      completedFields: recitalCompleted.length,
      totalFields: recitalFields.length
    })

    // Step 2: Program
    const validPieces = formData.program?.filter(piece => 
      piece.pieceTitle.trim() && piece.composer.trim()
    ) || []
    states.push({
      isValid: validPieces.length >= 1,
      isComplete: validPieces.length >= 1,
      completedFields: validPieces.length,
      totalFields: Math.max(1, formData.program?.length || 2)
    })

    setStepStates(states)
  }, [formData, validateField])

  // Enhanced field state management
  const updateFieldState = useCallback((field: string, value: any, touched: boolean = true) => {
    const validation = validateField(field, value)
    setFieldStates(prev => ({
      ...prev,
      [field]: {
        value,
        isValid: validation.isValid,
        error: validation.error,
        touched,
        isValidating: false
      }
    }))
  }, [validateField])

  const validateStep = useCallback((stepIndex: number): boolean => {
    if (stepStates.length > stepIndex) {
      return stepStates[stepIndex].isValid
    }
    return false
  }, [stepStates])

  const canProceedToNext = useCallback(() => {
    return validateStep(currentStep) && currentStep < STEPS.length - 1
  }, [currentStep, validateStep])

  const canGoBack = useCallback(() => {
    return currentStep > 0
  }, [currentStep])

  const nextStep = useCallback(async () => {
    if (canProceedToNext()) {
      setIsValidatingStep(true)
      
      // Brief animation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const nextStepIndex = currentStep + 1
      setCurrentStep(nextStepIndex)
      setIsValidatingStep(false)
      
      // Focus first field in next step for accessibility
      setTimeout(() => {
        const firstField = firstFieldRefs.current[nextStepIndex]
        if (firstField) {
          firstField.focus()
        }
      }, 100)
    }
  }, [canProceedToNext, currentStep])

  const previousStep = useCallback(() => {
    if (canGoBack()) {
      const prevStepIndex = currentStep - 1
      setCurrentStep(prevStepIndex)
      
      // Focus first field in previous step for accessibility
      setTimeout(() => {
        const firstField = firstFieldRefs.current[prevStepIndex]
        if (firstField) {
          firstField.focus()
        }
      }, 100)
    }
  }, [canGoBack, currentStep])

  const handleInputChange = useCallback((field: keyof BagrutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Update field state with validation
    updateFieldState(field, value)
    
    // Clear general error when user interacts with form
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }))
    }
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors, updateFieldState])

  // Helper function to update program pieces
  const updateProgramPiece = useCallback((index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      program: prev.program?.map((piece, i) => 
        i === index ? { ...piece, [field]: value } : piece
      ) || []
    }))
  }, [])

  // Helper function to add program piece
  const addProgramPiece = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      program: [...(prev.program || []), { pieceTitle: '', composer: '', duration: '' }]
    }))
  }, [])

  // Helper function to remove program piece
  const removeProgramPiece = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      program: prev.program?.filter((_, i) => i !== index) || []
    }))
  }, [])

  // Helper function to update accompanist
  const updateAccompanist = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      accompaniment: {
        ...prev.accompaniment!,
        accompanists: [{
          ...prev.accompaniment!.accompanists[0],
          [field]: value
        }]
      }
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    
    // Validate all steps before final submission
    for (let i = 0; i < STEPS.length; i++) {
      if (!validateStep(i)) {
        let errorMessage = ''
        switch (i) {
          case 0:
            errorMessage = 'יש לבחור תלמיד ומורה'
            break
          case 1:
            errorMessage = 'יש להשלים את הגדרת הרסיטל'
            break
          case 2:
            errorMessage = 'יש להזין לפחות יצירה אחת בתוכנית'
            break
        }
        setCurrentStep(i)
        setErrors({ general: errorMessage })
        
        // Focus the step container for accessibility
        setTimeout(() => {
          const stepContainer = stepRefs.current[i]
          if (stepContainer) {
            stepContainer.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
        
        return
      }
    }

    setLoading(true)
    try {
      // Prepare data for backend - ensure all required fields are present
      const submitData = {
        studentId: formData.studentId,
        teacherId: formData.teacherId,
        conservatoryName: formData.conservatoryName || 'מרכז המוסיקה רעננה',
        testDate: formData.testDate || null,
        notes: formData.notes || '',
        recitalUnits: formData.recitalUnits || 5,
        recitalField: formData.recitalField || 'קלאסי',
        // Filter out empty program pieces - backend expects pieceTitle, composer, and duration fields
        program: formData.program?.filter(p => p.pieceTitle && p.composer).map((piece, index) => ({
          pieceNumber: index + 1,
          pieceTitle: piece.pieceTitle,  // Backend expects pieceTitle, not pieceName
          composer: piece.composer,      // Backend expects composer, not composerName
          duration: piece.duration || 'לא צוין',  // Backend requires duration field, provide default if empty
          movement: piece.movement || ''
        })) || [],
        // Initialize accompaniment properly
        accompaniment: {
          type: formData.accompaniment?.type || 'נגן מלווה',
          // Only include accompanists with names, otherwise send empty array
          // Backend requires name and instrument fields for each accompanist
          accompanists: formData.accompaniment?.accompanists
            ?.filter(a => a.name && a.name.trim() !== '' && a.instrument && a.instrument.trim() !== '')
            .map(a => ({
              name: a.name.trim(),
              instrument: a.instrument.trim(),
              phone: '0500000000'  // Backend requires phone format: /^05\d{8}$/ (10 digits, no dashes)
            })) || []
        },
        // Initialize presentations with 4 items as backend expects exactly 4
        presentations: [
          { completed: false, status: 'לא נבחן', date: null, review: null, reviewedBy: null, notes: '', recordingLinks: [] },
          { completed: false, status: 'לא נבחן', date: null, review: null, reviewedBy: null, notes: '', recordingLinks: [] },
          { completed: false, status: 'לא נבחן', date: null, review: null, reviewedBy: null, notes: '', recordingLinks: [] },
          { 
            completed: false, 
            status: 'לא נבחן', 
            date: null, 
            review: null, 
            reviewedBy: null, 
            grade: null, 
            gradeLevel: null,
            recordingLinks: [],
            detailedGrading: {
              playingSkills: { grade: 'לא הוערך', points: null, maxPoints: 40, comments: 'אין הערות' },
              musicalUnderstanding: { grade: 'לא הוערך', points: null, maxPoints: 30, comments: 'אין הערות' },
              textKnowledge: { grade: 'לא הוערך', points: null, maxPoints: 20, comments: 'אין הערות' },
              playingByHeart: { grade: 'לא הוערך', points: null, maxPoints: 10, comments: 'אין הערות' }
            }
          }
        ],
        // Initialize magen bagrut as an object (backend expects object, not null)
        magenBagrut: {
          completed: false,
          status: 'לא נבחן',
          date: null,
          review: null,
          reviewedBy: null,
          grade: null,
          gradeLevel: null,
          recordingLinks: [],
          detailedGrading: {
            playingSkills: { grade: 'לא הוערך', points: null, maxPoints: 40, comments: 'אין הערות' },
            musicalUnderstanding: { grade: 'לא הוערך', points: null, maxPoints: 30, comments: 'אין הערות' },
            textKnowledge: { grade: 'לא הוערך', points: null, maxPoints: 20, comments: 'אין הערות' },
            playingByHeart: { grade: 'לא הוערך', points: null, maxPoints: 10, comments: 'אין הערות' }
          }
        },
        finalGrade: null,
        finalGradeLevel: null,
        isCompleted: false
      }
      
      console.log('Submitting bagrut data:', submitData)
      await onSubmit(submitData)
      
      // Show success state
      setShowSuccessModal(true)
    } catch (error: any) {
      console.error('Error submitting form:', error)
      const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(error, 'שגיאה בשמירת הנתונים. אנא נסה שוב.')
      if (isValidationError) {
        setErrors({ ...fieldErrors, general: generalMessage })
      } else {
        setErrors({ general: generalMessage })
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter students based on search
  const filteredStudents = students.filter(student => {
    if (!studentSearch) return true
    const displayName = getDisplayName(student.personalInfo)
    const className = student.academicInfo?.class || ''
    return displayName.toLowerCase().includes(studentSearch.toLowerCase()) ||
           className.toLowerCase().includes(studentSearch.toLowerCase())
  })

  // Filter teachers based on search
  const filteredTeachers = teachers.filter(teacher => {
    if (!teacherSearch) return true
    const displayName = getDisplayName(teacher.personalInfo)
    const email = teacher.personalInfo?.email || ''
    return displayName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
           email.toLowerCase().includes(teacherSearch.toLowerCase())
  })

  const selectedStudent = students.find(s => s._id === formData.studentId)
  const selectedTeacher = teachers.find(t => t._id === formData.teacherId)

  // Get field state helper
  const getFieldState = (field: string) => fieldStates[field] || { isValid: true, touched: false }

  // Check if field has error
  const hasFieldError = (field: string) => {
    const fieldState = getFieldState(field)
    return fieldState.touched && !fieldState.isValid && submitted
  }

  // Get field error message
  const getFieldError = (field: string) => {
    const fieldState = getFieldState(field)
    return hasFieldError(field) ? fieldState.error : ''
  }

  const renderProgressBar = () => (
    <div className="px-6 py-6 border-b border-gray-200 bg-gray-50">
      {/* Progress percentage */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>התקדמות</span>
          <span>{Math.round(((currentStep + (stepStates[currentStep]?.isValid ? 1 : 0)) / STEPS.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${((currentStep + (stepStates[currentStep]?.isValid ? 1 : 0)) / STEPS.length) * 100}%` 
            }}
          />
        </div>
      </div>
      
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const stepState = stepStates[index]
          const isValid = stepState?.isValid || false
          const completionPercentage = stepState ? Math.round((stepState.completedFields / stepState.totalFields) * 100) : 0
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-success-500 border-success-500 text-white shadow-lg scale-105'
                    : isCurrent
                    ? isValid
                      ? 'bg-muted border-border text-white shadow-md'
                      : 'bg-white border-border text-primary shadow-md'
                    : isValid
                    ? 'bg-success-100 border-success-300 text-success-600'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : isCurrent && isValidatingStep ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                  
                  {/* Completion indicator */}
                  {isCurrent && !isCompleted && stepState && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border border-gray-200 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {stepState.completedFields}/{stepState.totalFields}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium transition-colors ${
                    isCurrent ? 'text-primary' : isCompleted ? 'text-success-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  
                  {/* Step completion status */}
                  {isCurrent && stepState && (
                    <p className="text-xs text-gray-500 mt-1">
                      {isValid ? (
                        <span className="flex items-center justify-center gap-1 text-success-600">
                          <CheckCircle2 className="w-3 h-3" />
                          מוכן
                        </span>
                      ) : (
                        <span className="text-orange-600">
                          {completionPercentage}% מושלם
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              
              {index < STEPS.length - 1 && (
                <div className={`w-16 h-1 mx-4 rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-success-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderBasicInfo = () => (
    <div className="space-y-6">
      {/* Student Selection */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-600" />
          בחירת תלמיד <span className="text-red-500">*</span>
        </h3>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש תלמיד לפי שם או כיתה..."
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value)
                setShowStudentDropdown(true)
              }}
              onFocus={() => setShowStudentDropdown(true)}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          {selectedStudent && (
            <div className="p-4 bg-muted/50 border border-border rounded">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {getDisplayName(selectedStudent.personalInfo)}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>כיתה: {selectedStudent.academicInfo?.class}</p>
                    <p>טלפון: {selectedStudent.personalInfo?.phone}</p>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          )}

          {showStudentDropdown && !selectedStudent && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <button
                    key={student._id}
                    type="button"
                    onClick={() => {
                      handleInputChange('studentId', student._id)
                      setStudentSearch('')
                      setShowStudentDropdown(false)
                    }}
                    className={`w-full p-3 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      formData.studentId === student._id ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {getDisplayName(student.personalInfo)}
                    </div>
                    <div className="text-sm text-gray-600">
                      כיתה {student.academicInfo?.class}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  לא נמצאו תלמידים
                </div>
              )}
            </div>
          )}

          {!formData.studentId && submitted && (
            <p className="text-red-600 text-sm mt-2">יש לבחור תלמיד</p>
          )}
        </div>
      </Card>

      {/* Teacher Selection */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-600" />
          בחירת מורה מנחה <span className="text-red-500">*</span>
        </h3>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש מורה לפי שם..."
              value={teacherSearch}
              onChange={(e) => {
                setTeacherSearch(e.target.value)
                setShowTeacherDropdown(true)
              }}
              onFocus={() => setShowTeacherDropdown(true)}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          {selectedTeacher && (
            <div className="p-4 bg-muted/50 border border-border rounded">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {getDisplayName(selectedTeacher.personalInfo)}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>אימייל: {selectedTeacher.personalInfo?.email}</p>
                    <p>טלפון: {selectedTeacher.personalInfo?.phone}</p>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          )}

          {showTeacherDropdown && !selectedTeacher && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map(teacher => (
                  <button
                    key={teacher._id}
                    type="button"
                    onClick={() => {
                      handleInputChange('teacherId', teacher._id)
                      setTeacherSearch('')
                      setShowTeacherDropdown(false)
                    }}
                    className={`w-full p-3 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      formData.teacherId === teacher._id ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {getDisplayName(teacher.personalInfo)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {teacher.personalInfo?.email}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  לא נמצאו מורים
                </div>
              )}
            </div>
          )}

          {!formData.teacherId && submitted && (
            <p className="text-red-600 text-sm mt-2">יש לבחור מורה מנחה</p>
          )}
        </div>
      </Card>

      {/* Additional Basic Info */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטים נוספים</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם הקונסרבטוריון
            </label>
            <input
              type="text"
              value={formData.conservatoryName || ''}
              onChange={(e) => handleInputChange('conservatoryName', e.target.value)}
              placeholder="לדוגמה: קונסרבטוריון ירושלים"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תאריך מבחן משוער
            </label>
            <input
              type="date"
              value={formData.testDate ? formData.testDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleInputChange('testDate', e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הערות ראשוניות
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="הערות כלליות על התלמיד או הבגרות..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent resize-vertical"
          />
        </div>
      </Card>
    </div>
  )

  const renderRecitalSetup = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Music className="w-5 h-5 text-gray-600" />
          הגדרת רסיטל
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              יחידות רסיטל
            </label>
            <select
              value={formData.recitalUnits || 5}
              onChange={(e) => handleInputChange('recitalUnits', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value={3}>3 יחידות</option>
              <option value={5}>5 יחידות</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תחום רסיטל
            </label>
            <select
              value={formData.recitalField || 'קלאסי'}
              onChange={(e) => handleInputChange('recitalField', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="קלאסי">קלאסי</option>
              <option value="ג'אז">ג'אז</option>
              <option value="שירה">שירה</option>
              <option value="מוסיקה ישראלית">מוסיקה ישראלית</option>
              <option value="מוסיקה עולמית">מוסיקה עולמית</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">מלווה ראשי</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם המלווה
              </label>
              <input
                type="text"
                value={formData.accompaniment?.accompanists[0]?.name || ''}
                onChange={(e) => updateAccompanist('name', e.target.value)}
                placeholder="שם המלווה (אופציונלי)"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כלי נגינה
              </label>
              <input
                type="text"
                value={formData.accompaniment?.accompanists[0]?.instrument || ''}
                onChange={(e) => updateAccompanist('instrument', e.target.value)}
                placeholder="לדוגמה: פסנתר"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderProgram = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          תוכנית בסיסית
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          הזן לפחות יצירה אחת. ניתן להוסיף יצירות נוספות ופרטים מלאים בדף הבגרות לאחר היצירה.
        </p>
        {submitted && !(formData.program?.some(p => p.pieceTitle.trim() && p.composer.trim())) && (
          <p className="text-red-600 text-sm mb-4">יש להזין לפחות יצירה אחת עם שם היצירה ומלחין</p>
        )}

        <div className="space-y-4">
          {formData.program?.map((piece, index) => (
            <div key={index} className="border border-gray-200 rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">יצירה {index + 1}</h4>
                {formData.program && formData.program.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProgramPiece(index)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם היצירה *
                  </label>
                  <input
                    type="text"
                    value={piece.pieceTitle}
                    onChange={(e) => updateProgramPiece(index, 'pieceTitle', e.target.value)}
                    placeholder="לדוגמה: סונטה מס' 14"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מלחין *
                  </label>
                  <input
                    type="text"
                    value={piece.composer}
                    onChange={(e) => updateProgramPiece(index, 'composer', e.target.value)}
                    placeholder="לדוגמה: בטהובן"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    משך זמן
                  </label>
                  <input
                    type="text"
                    value={piece.duration || ''}
                    onChange={(e) => updateProgramPiece(index, 'duration', e.target.value)}
                    placeholder="לדוגמה: 8 דקות"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={addProgramPiece}
              className="flex items-center px-4 py-2 text-primary border border-border rounded hover:bg-muted/50 transition-colors"
            >
              <Plus className="w-4 h-4 ml-1" />
              הוסף יצירה
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>שים לב:</strong> לאחר יצירת הבגרות, תוכל להוסיף בדף הפרטים:
          </p>
          <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
            <li>פרטי מצגות ותאריכים</li>
            <li>מגן בגרות</li>
            <li>ציונים והערכות</li>
            <li>מסמכים וקבצים</li>
            <li>קישורי יוטיוב והקלטות</li>
            <li>פרטי מלווים נוספים</li>
          </ul>
        </div>
      </Card>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo()
      case 1:
        return renderRecitalSetup()
      case 2:
        return renderProgram()
      default:
        return null
    }
  }

  // Success modal component
  const renderSuccessModal = () => {
    if (!showSuccessModal) return null

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
      >
        <div className="bg-white rounded max-w-md w-full p-6 shadow-2xl animate-scale-in">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-4">
              <CheckCircle2 className="w-8 h-8 text-success-600" aria-hidden="true" />
            </div>
            
            <h3 id="success-title" className="text-xl font-bold text-gray-900 mb-2">
              בגרות נוצרה בהצלחה!
            </h3>
            
            <div className="text-sm text-gray-600 mb-6 space-y-2">
              <p>הבגרות עבור {getDisplayName(selectedStudent?.personalInfo)} נוצרה.</p>
              <p className="text-success-700 font-medium">עכשיו תוכל להשלים פרטים נוספים</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  onCancel() // Close the form
                }}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded hover:bg-muted transition-colors font-medium"
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  עבור לדף הבגרות
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  // Reset form for creating another bagrut
                  setFormData({
                    studentId: '',
                    teacherId: '',
                    conservatoryName: 'מרכז המוסיקה רעננה',
                    testDate: undefined,
                    notes: '',
                    recitalUnits: 5,
                    recitalField: 'קלאסי',
                    program: [
                      { pieceTitle: '', composer: '', duration: '' },
                      { pieceTitle: '', composer: '', duration: '' }
                    ],
                    accompaniment: {
                      type: 'נגן מלווה',
                      accompanists: [{ name: '', instrument: 'פסנתר' }]
                    }
                  })
                  setCurrentStep(0)
                  setErrors({})
                  setSubmitted(false)
                  setFieldStates({})
                  setStudentSearch('')
                  setTeacherSearch('')
                }}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                צור בגרות אחרת
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'עריכת בגרות' : 'יצירת בגרות חדשה'}
          </h2>
          <p className="text-gray-600 mt-1">
            שלב {currentStep + 1} מתוך {STEPS.length}: {STEPS[currentStep].name}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6">
        {/* General Error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{errors.general}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={previousStep}
            disabled={!canGoBack() || loading}
            className="flex items-center px-4 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[120px] justify-center"
            aria-label="חזר לשלב הקודם"
          >
            <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
            הקודם
          </button>
          
          {/* Step indicator for mobile */}
          <div className="flex md:hidden items-center gap-1">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index <= currentStep ? 'bg-muted' : 'bg-gray-300'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
          
          {currentStep === STEPS.length - 1 ? (
            <button
              type="submit"
              disabled={loading || !validateStep(currentStep)}
              className={`flex items-center px-6 py-3 rounded font-medium transition-all duration-200 min-w-[160px] justify-center ${
                loading || !validateStep(currentStep)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-muted hover:shadow-md'
              }`}
              aria-label={isEdit ? 'עדכן בגרות' : 'צור בגרות חדשה'}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" aria-hidden="true" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" aria-hidden="true" />
                  {isEdit ? 'עדכן בגרות' : 'צור בגרות'}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceedToNext() || isValidatingStep}
              className={`flex items-center px-6 py-3 rounded font-medium transition-all duration-200 min-w-[120px] justify-center ${
                !canProceedToNext() || isValidatingStep
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-muted hover:shadow-md'
              }`}
              aria-label="עבור לשלב הבא"
            >
              {isValidatingStep ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" aria-hidden="true" />
                  בודק...
                </>
              ) : (
                <>
                  הבא
                  <ChevronLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
      
      {/* Success Modal */}
      {renderSuccessModal()}
    </div>
  )
}

export default SimplifiedBagrutForm