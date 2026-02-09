import React, { useState, useEffect, useCallback } from 'react'
import {
  X, Save, User, AlertCircle, CheckCircle, Search, Music, Users,
  Star, FileText, Calculator, ChevronLeft, ChevronRight, Plus, Trash2,
  Calendar, Link, PlayCircle
} from 'lucide-react'
import { Card } from './ui/Card'
import type { BagrutFormData } from '../types/bagrut.types'
import { handleServerValidationError } from '../utils/validationUtils'
import { getDisplayName } from '@/utils/nameUtils'

interface BagrutFormProps {
  students: any[]
  teachers: any[]
  initialData?: any
  isEdit?: boolean
  onSubmit: (data: BagrutFormData) => Promise<void>
  onCancel: () => void
}

// Simplified steps for initial bagrut creation
const STEPS = [
  { id: 'basic', name: 'מידע בסיסי', icon: User },
  { id: 'recital', name: 'הגדרת רסיטל', icon: Music },
  { id: 'program', name: 'תוכנית הרסיטל', icon: FileText }
] as const

const BagrutForm: React.FC<BagrutFormProps> = ({
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
    // Basic program pieces (3 pieces minimum)
    program: [
      { pieceTitle: '', composer: '', duration: '', movement: '' },
      { pieceTitle: '', composer: '', duration: '', movement: '' },
      { pieceTitle: '', composer: '', duration: '', movement: '' }
    ],
    // Basic accompaniment info
    accompaniment: {
      type: 'נגן מלווה',
      accompanists: [{ name: '', instrument: '' }]
    }
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [teacherSearch, setTeacherSearch] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)
  const [customAccompanistMode, setCustomAccompanistMode] = useState<{[key: number]: boolean}>({})

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        studentId: initialData.studentId || '',
        teacherId: initialData.teacherId || '',
        conservatoryName: initialData.conservatoryName || '',
        testDate: initialData.testDate ? new Date(initialData.testDate) : undefined,
        notes: initialData.notes || '',
        recitalUnits: initialData.recitalUnits || 5,
        recitalField: initialData.recitalField || 'קלאסי',
        program: initialData.program || prev.program,
        accompaniment: initialData.accompaniment || prev.accompaniment,
        presentations: initialData.presentations || prev.presentations,
        directorEvaluation: initialData.directorEvaluation || prev.directorEvaluation,
        gradingDetails: initialData.gradingDetails || prev.gradingDetails
      }))
    }
  }, [initialData])

  const validateStep = useCallback((stepIndex: number, setFieldErrors: boolean = false): boolean => {
    const newErrors: Record<string, string> = {}

    switch (stepIndex) {
      case 0: // Basic Info
        if (!formData.studentId) {
          newErrors.studentId = 'יש לבחור תלמיד'
        }
        if (!formData.teacherId) {
          newErrors.teacherId = 'יש לבחור מורה מנחה'
        }
        break
      case 1: // Recital Setup
        if (!formData.recitalUnits) {
          newErrors.recitalUnits = 'יש לבחור מספר יחידות'
        }
        if (!formData.recitalField) {
          newErrors.recitalField = 'יש לבחור תחום רסיטל'
        }
        break
      case 2: // Program
        const validPieces = formData.program?.filter(piece =>
          piece.pieceTitle.trim() && piece.composer.trim()
        ) || []
        if (validPieces.length < 1) {
          newErrors.program = 'יש להזין לפחות יצירה אחת עם שם היצירה ומלחין'
        }
        break
      default:
        break
    }

    if (setFieldErrors) {
      setErrors(prev => ({ ...prev, ...newErrors }))
    }

    return Object.keys(newErrors).length === 0
  }, [
    formData.studentId,
    formData.teacherId,
    formData.recitalUnits,
    formData.recitalField,
    formData.program
  ])

  const canProceedToNext = useCallback(() => {
    return validateStep(currentStep, false) && currentStep < STEPS.length - 1
  }, [currentStep, validateStep])

  const canGoBack = useCallback(() => {
    return currentStep > 0
  }, [currentStep])

  const nextStep = useCallback(() => {
    // Validate with field errors shown
    if (validateStep(currentStep, true)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1)
      }
    }
  }, [currentStep, validateStep])

  const previousStep = useCallback(() => {
    if (canGoBack()) {
      setCurrentStep(prev => prev - 1)
    }
  }, [canGoBack])

  const handleInputChange = useCallback((field: keyof BagrutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  // Helper function to update program pieces
  const updateProgramPiece = useCallback((index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      program: prev.program?.map((piece, i) => 
        i === index ? { ...piece, [field]: value } : piece
      ) || []
    }))
  }, [])

  // Helper function to update accompanists
  const updateAccompanist = useCallback((index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      accompaniment: {
        ...prev.accompaniment!,
        accompanists: prev.accompaniment!.accompanists.map((acc, i) => 
          i === index ? { ...acc, [field]: value } : acc
        )
      }
    }))
  }, [])


  // Helper function to add program piece
  const addProgramPiece = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      program: [...(prev.program || []), { pieceTitle: '', composer: '', duration: '', movement: '' }]
    }))
  }, [])

  // Helper function to remove program piece
  const removeProgramPiece = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      program: prev.program?.filter((_, i) => i !== index) || []
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all steps before final submission
    for (let i = 0; i < STEPS.length; i++) {
      if (!validateStep(i, true)) {
        setCurrentStep(i)
        return
      }
    }

    setLoading(true)
    try {
      await onSubmit(formData)
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

  const renderProgressBar = () => (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isDisabled = index > currentStep
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isCompleted 
                  ? 'bg-green-500 border-green-500 text-white'
                  : isCurrent
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="mr-3">
                <p className={`text-sm font-medium ${
                  isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step.name}
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
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
          {/* Search */}
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
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Selected Student Display */}
          {selectedStudent && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
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

          {/* Student List */}
          {showStudentDropdown && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
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
                      formData.studentId === student._id ? 'bg-primary-50' : ''
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

          {errors.studentId && (
            <p className="text-red-600 text-sm">{errors.studentId}</p>
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
          {/* Search */}
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
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Selected Teacher Display */}
          {selectedTeacher && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
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

          {/* Teacher List */}
          {showTeacherDropdown && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
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
                    formData.teacherId === teacher._id ? 'bg-primary-50' : ''
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

          {errors.teacherId && (
            <p className="text-red-600 text-sm">{errors.teacherId}</p>
          )}
        </div>
      </Card>

      {/* Additional Details */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטים נוספים</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Conservatory Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם הקונסרבטוריון
            </label>
            <input
              type="text"
              value={formData.conservatoryName || ''}
              onChange={(e) => handleInputChange('conservatoryName', e.target.value)}
              placeholder="לדוגמה: קונסרבטוריון ירושלים"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Test Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תאריך מבחן (אופציונלי)
            </label>
            <input
              type="date"
              value={formData.testDate ? formData.testDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleInputChange('testDate', e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הערות
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="הערות נוספות על הבגרות..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
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
          {/* Recital Units */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              יחידות רסיטל
            </label>
            <select
              value={formData.recitalUnits || 5}
              onChange={(e) => handleInputChange('recitalUnits', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={3}>3 יחידות</option>
              <option value={5}>5 יחידות</option>
            </select>
          </div>

          {/* Recital Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תחום רסיטל
            </label>
            <select
              value={formData.recitalField || 'קלאסי'}
              onChange={(e) => handleInputChange('recitalField', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="קלאסי">קלאסי</option>
              <option value="ג'אז">ג'אז</option>
              <option value="שירה">שירה</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  )

  // Stage 3: Program
  const renderProgram = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          תוכנית הרסיטל
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          יש להזין לפחות 3 יצירות. ניתן להזין עד 5 יצירות.
        </p>
        {errors.program && (
          <p className="text-red-600 text-sm mb-4">{errors.program}</p>
        )}

        <div className="space-y-6">
          {formData.program?.map((piece, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">יצירה {index + 1}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם היצירה *
                  </label>
                  <input
                    type="text"
                    value={piece.pieceTitle}
                    onChange={(e) => updateProgramPiece(index, 'pieceTitle', e.target.value)}
                    placeholder="לדוגמה: סונטה למשל..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מלחין *
                  </label>
                  <input
                    type="text"
                    value={piece.composer}
                    onChange={(e) => updateProgramPiece(index, 'composer', e.target.value)}
                    placeholder="לדוגמה: בטהובן"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    משך זמן
                  </label>
                  <input
                    type="text"
                    value={piece.duration}
                    onChange={(e) => updateProgramPiece(index, 'duration', e.target.value)}
                    placeholder="לדוגמה: 8 דקות"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    פרק/חלק
                  </label>
                  <input
                    type="text"
                    value={piece.movement || ''}
                    onChange={(e) => updateProgramPiece(index, 'movement', e.target.value)}
                    placeholder="לדוגמה: פרק 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קישור יוטיוב (אופציונלי)
                  </label>
                  <div className="relative">
                    <Link className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={piece.youtubeLink || ''}
                      onChange={(e) => updateProgramPiece(index, 'youtubeLink', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Accompaniment */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          ליווי
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סוג ליווי
            </label>
            <select
              value={formData.accompaniment?.type || 'נגן מלווה'}
              onChange={(e) => handleInputChange('accompaniment', {
                ...formData.accompaniment!,
                type: e.target.value as 'נגן מלווה' | 'הרכב'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="נגן מלווה">נגן מלווה</option>
              <option value="הרכב">הרכב</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">מלווים</h4>
              <button
                type="button"
                onClick={addAccompanist}
                className="flex items-center px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
              >
                <Plus className="w-4 h-4 ml-1" />
                הוסף מלווה
              </button>
            </div>

            {formData.accompaniment?.accompanists.map((accompanist, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">מלווה {index + 1}</h5>
                  {formData.accompaniment!.accompanists.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAccompanist(index)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      שם המלווה
                    </label>
                    {formData.accompaniment?.type === 'נגן מלווה' ? (
                      <div className="space-y-3">
                        {/* Radio buttons for selection mode */}
                        <div className="flex gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`accompanist-mode-${index}`}
                              checked={!customAccompanistMode[index]}
                              onChange={() => {
                                setCustomAccompanistMode(prev => ({ ...prev, [index]: false }))
                                updateAccompanist(index, 'name', '')
                              }}
                              className="ml-2 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">בחר מרשימת המורים</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`accompanist-mode-${index}`}
                              checked={customAccompanistMode[index] === true}
                              onChange={() => {
                                setCustomAccompanistMode(prev => ({ ...prev, [index]: true }))
                                updateAccompanist(index, 'name', '')
                              }}
                              className="ml-2 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">הזן שם מלווה חדש</span>
                          </label>
                        </div>

                        {/* Conditional input based on selected mode */}
                        {customAccompanistMode[index] ? (
                          /* Text input for custom accompanist */
                          <input
                            type="text"
                            value={accompanist.name}
                            onChange={(e) => updateAccompanist(index, 'name', e.target.value)}
                            placeholder="הזן שם מלא של המלווה"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            autoFocus
                          />
                        ) : (
                          <select
                            value={accompanist.name}
                            onChange={(e) => updateAccompanist(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">בחר מורה מהרשימה</option>
                            {teachers
                              .filter(teacher => getDisplayName(teacher.personalInfo))
                              .map(teacher => (
                              <option key={teacher._id} value={getDisplayName(teacher.personalInfo)}>
                                {getDisplayName(teacher.personalInfo)} 
                                {teacher.professionalInfo?.instruments?.includes('פסنתר') ? ' (פסנתר)' : ''}
                              </option>
                              ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={accompanist.name}
                        onChange={(e) => updateAccompanist(index, 'name', e.target.value)}
                        placeholder="שם מלא"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      כלי נגינה
                    </label>
                    <input
                      type="text"
                      value={accompanist.instrument}
                      onChange={(e) => updateAccompanist(index, 'instrument', e.target.value)}
                      placeholder="לדוגמה: פסנתר"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      טלפון
                    </label>
                    <input
                      type="tel"
                      value={accompanist.phone || ''}
                      onChange={(e) => updateAccompanist(index, 'phone', e.target.value)}
                      placeholder="050-1234567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      אימייל
                    </label>
                    <input
                      type="email"
                      value={accompanist.email || ''}
                      onChange={(e) => updateAccompanist(index, 'email', e.target.value)}
                      placeholder="example@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )

  // Stage 4: Presentations
  const renderPresentations = () => (
    <div className="space-y-6">
      {/* Regular Presentations (1-3) */}
      {formData.presentations?.slice(0, 3).map((presentation, index) => (
        <Card key={index}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-600" />
            מצגת {index + 1}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`presentation-${index}-completed`}
                checked={presentation.completed || false}
                onChange={(e) => updatePresentation(index, 'completed', e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor={`presentation-${index}-completed`} className="mr-2 text-sm font-medium text-gray-700">
                הושלמה
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סטטוס
              </label>
              <select
                value={presentation.status || ''}
                onChange={(e) => updatePresentation(index, 'status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">בחר סטטוס</option>
                <option value="ממתין">ממתין</option>
                <option value="בתהליך">בתהליך</option>
                <option value="הושלם">הושלם</option>
                <option value="דחוי">דחוי</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך
              </label>
              <input
                type="date"
                value={presentation.date ? new Date(presentation.date).toISOString().split('T')[0] : ''}
                onChange={(e) => updatePresentation(index, 'date', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                בוחן
              </label>
              <input
                type="text"
                value={presentation.reviewedBy || ''}
                onChange={(e) => updatePresentation(index, 'reviewedBy', e.target.value)}
                placeholder="שם הבוחן"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הערות
            </label>
            <textarea
              value={presentation.notes || ''}
              onChange={(e) => updatePresentation(index, 'notes', e.target.value)}
              placeholder="הערות על המצגת..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קישורי הקלטות
            </label>
            <input
              type="url"
              value={presentation.recordingLinks?.[0] || ''}
              onChange={(e) => {
                const links = presentation.recordingLinks || []
                links[0] = e.target.value
                updatePresentation(index, 'recordingLinks', links)
              }}
              placeholder="קישור להקלטה"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </Card>
      ))}

      {/* Final Assessment (Presentation 4) */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-gray-600" />
          הערכה סופית - מצגת 4
        </h3>

        <div className="space-y-6">
          {/* Basic presentation info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="final-presentation-completed"
                checked={formData.presentations?.[3]?.completed || false}
                onChange={(e) => updatePresentation(3, 'completed', e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="final-presentation-completed" className="mr-2 text-sm font-medium text-gray-700">
                הושלמה
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך
              </label>
              <input
                type="date"
                value={formData.presentations?.[3]?.date ? new Date(formData.presentations[3].date).toISOString().split('T')[0] : ''}
                onChange={(e) => updatePresentation(3, 'date', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                בוחן
              </label>
              <input
                type="text"
                value={formData.presentations?.[3]?.reviewedBy || ''}
                onChange={(e) => updatePresentation(3, 'reviewedBy', e.target.value)}
                placeholder="שם הבוחן"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Detailed Grading */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">דירוג מפורט</h4>
            
            <div className="space-y-4">
              {/* Playing Skills - 40 points */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">כישורי נגינה</h5>
                  <span className="text-sm text-gray-500">מקסימום 40 נקודות</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">נקודות</label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={formData.gradingDetails?.detailedGrading?.playingSkills.points || ''}
                      onChange={(e) => updateDetailedGrading('playingSkills', 'points', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                    <input
                      type="text"
                      value={formData.gradingDetails?.detailedGrading?.playingSkills.comments || ''}
                      onChange={(e) => updateDetailedGrading('playingSkills', 'comments', e.target.value)}
                      placeholder="הערות על כישורי הנגינה"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Musical Understanding - 30 points */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">הבנה מוזיקלית</h5>
                  <span className="text-sm text-gray-500">מקסימום 30 נקודות</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">נקודות</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={formData.gradingDetails?.detailedGrading?.musicalUnderstanding.points || ''}
                      onChange={(e) => updateDetailedGrading('musicalUnderstanding', 'points', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                    <input
                      type="text"
                      value={formData.gradingDetails?.detailedGrading?.musicalUnderstanding.comments || ''}
                      onChange={(e) => updateDetailedGrading('musicalUnderstanding', 'comments', e.target.value)}
                      placeholder="הערות על ההבנה המוזיקלית"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Text Knowledge - 20 points */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">ידע בטקסט</h5>
                  <span className="text-sm text-gray-500">מקסימום 20 נקודות</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">נקודות</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={formData.gradingDetails?.detailedGrading?.textKnowledge.points || ''}
                      onChange={(e) => updateDetailedGrading('textKnowledge', 'points', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                    <input
                      type="text"
                      value={formData.gradingDetails?.detailedGrading?.textKnowledge.comments || ''}
                      onChange={(e) => updateDetailedGrading('textKnowledge', 'comments', e.target.value)}
                      placeholder="הערות על הידע בטקסט"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Playing by Heart - 10 points */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">נגינה בעל פה</h5>
                  <span className="text-sm text-gray-500">מקסימום 10 נקודות</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">נקודות</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.gradingDetails?.detailedGrading?.playingByHeart.points || ''}
                      onChange={(e) => updateDetailedGrading('playingByHeart', 'points', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                    <input
                      type="text"
                      value={formData.gradingDetails?.detailedGrading?.playingByHeart.comments || ''}
                      onChange={(e) => updateDetailedGrading('playingByHeart', 'comments', e.target.value)}
                      placeholder="הערות על הנגינה בעל פה"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  // Stage 5: Director Evaluation
  const renderDirectorEvaluation = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          הערכת מנהל
        </h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            הערכת המנהל מהווה 10% מהציון הסופי. טווח הנקודות הוא 0-10.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              נקודות (0-10) *
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.directorEvaluation?.points || ''}
              onChange={(e) => updateDirectorEvaluation('points', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0-10"
            />
            <p className="text-xs text-gray-500 mt-1">
              ההערכה מהווה 10% מהציון הסופי
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הערות
            </label>
            <textarea
              value={formData.directorEvaluation?.comments || ''}
              onChange={(e) => updateDirectorEvaluation('comments', e.target.value)}
              placeholder="הערות המנהל על ביצועי הסטודנט..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
            />
          </div>
        </div>
      </Card>
    </div>
  )

  // Stage 6: Final Grade & Review
  const renderFinalGrade = () => {
    const finalGrade = calculateFinalGrade()
    const gradeLevel = getGradeLevel(finalGrade)
    const detailedGrading = formData.gradingDetails?.detailedGrading
    const directorPoints = formData.directorEvaluation?.points || 0

    return (
      <div className="space-y-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-gray-600" />
            סיכום וציון סופי
          </h3>

          {/* Final Grade Display */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                ציון סופי: {finalGrade}
              </h4>
              <p className="text-xl text-gray-700 mb-4">
                רמה: {gradeLevel}
              </p>
              
              <div className="text-sm text-gray-600">
                <p>חישוב: {Math.round(((detailedGrading?.playingSkills.points || 0) + 
                                      (detailedGrading?.musicalUnderstanding.points || 0) + 
                                      (detailedGrading?.textKnowledge.points || 0) + 
                                      (detailedGrading?.playingByHeart.points || 0)) * 0.9)} (90%) + {Math.round(directorPoints * 0.1)} (10%)</p>
              </div>
            </div>
          </div>

          {/* Grade Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">פירוט ציונים (90%)</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>כישורי נגינה:</span>
                  <span>{detailedGrading?.playingSkills.points || 0}/40</span>
                </div>
                <div className="flex justify-between">
                  <span>הבנה מוזיקלית:</span>
                  <span>{detailedGrading?.musicalUnderstanding.points || 0}/30</span>
                </div>
                <div className="flex justify-between">
                  <span>ידע בטקסט:</span>
                  <span>{detailedGrading?.textKnowledge.points || 0}/20</span>
                </div>
                <div className="flex justify-between">
                  <span>נגינה בעל פה:</span>
                  <span>{detailedGrading?.playingByHeart.points || 0}/10</span>
                </div>
                <hr />
                <div className="flex justify-between font-medium">
                  <span>סה"כ:</span>
                  <span>{(detailedGrading?.playingSkills.points || 0) + 
                         (detailedGrading?.musicalUnderstanding.points || 0) + 
                         (detailedGrading?.textKnowledge.points || 0) + 
                         (detailedGrading?.playingByHeart.points || 0)}/100</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">הערכת מנהל (10%)</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>נקודות:</span>
                  <span>{directorPoints}/10</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">הערות:</span>
                  <p className="text-sm mt-1">
                    {formData.directorEvaluation?.comments || 'אין הערות'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student & Teacher Summary */}
          <div className="border-t border-gray-200 pt-6">
            <h5 className="font-medium text-gray-900 mb-3">פרטי הבגרות</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">תלמיד:</span>
                <span className="mr-2 font-medium">
                  {getDisplayName(selectedStudent?.personalInfo) || 'לא נבחר'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">מורה מנחה:</span>
                <span className="mr-2 font-medium">
                  {getDisplayName(selectedTeacher?.personalInfo) || 'לא נבחר'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">יחידות:</span>
                <span className="mr-2 font-medium">{formData.recitalUnits}</span>
              </div>
              <div>
                <span className="text-gray-600">תחום:</span>
                <span className="mr-2 font-medium">{formData.recitalField}</span>
              </div>
            </div>
          </div>

          {/* Program Summary */}
          <div className="border-t border-gray-200 pt-6">
            <h5 className="font-medium text-gray-900 mb-3">תוכנית הרסיטל</h5>
            <div className="space-y-2">
              {formData.program?.filter(piece => piece.pieceTitle.trim() && piece.composer.trim()).map((piece, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{piece.pieceTitle}</span>
                  <span className="text-gray-600 mr-2">מאת {piece.composer}</span>
                  {piece.duration && <span className="text-gray-500">({piece.duration})</span>}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo()
      case 1:
        return renderRecitalSetup()
      case 2:
        return renderProgram()
      case 3:
        return renderPresentations()
      case 4:
        return renderDirectorEvaluation()
      case 5:
        return renderFinalGrade()
      default:
        return <div className="p-8 text-center text-gray-500">תוכן שלב {currentStep + 1} בפיתוח...</div>
    }
  }

  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'עריכת בגרות' : 'בגרות חדשה'}
          </h2>
          <p className="text-gray-600 mt-1">
            שלב {currentStep + 1} מתוך {STEPS.length}: {STEPS[currentStep].name}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
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
            disabled={!canGoBack()}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 ml-2" />
            הקודם
          </button>
          
          {currentStep === STEPS.length - 1 ? (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  {isEdit ? 'עדכן בגרות' : 'שמור בגרות'}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceedToNext()}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              הבא
              <ChevronLeft className="w-4 h-4 mr-2" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default BagrutForm