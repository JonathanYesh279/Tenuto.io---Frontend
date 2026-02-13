import { useState, useEffect } from 'react'
import { Save, X, Plus, Trash2, Loader, AlertCircle } from 'lucide-react'
import { Card } from './ui/Card'
import apiService from '../services/apiService'
import { handleServerValidationError } from '../utils/validationUtils'

interface StudentFormProps {
  studentId?: string | null
  onClose: () => void
  onSave: () => void
}

export default function StudentForm({ studentId, onClose, onSave }: StudentFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form data with exact backend schema structure
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      age: '',
      address: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      studentEmail: ''
    },
    academicInfo: {
      instrumentProgress: [
        {
          instrumentName: 'פסנתר',
          isPrimary: true,
          currentStage: 1,
          startDate: new Date(),
          tests: {
            stageTest: { 
              status: 'לא נבחן',
              lastTestDate: null,
              nextTestDate: null,
              notes: ''
            },
            technicalTest: { 
              status: 'לא נבחן',
              lastTestDate: null,
              nextTestDate: null,
              notes: ''
            }
          }
        }
      ],
      class: 'א',
      studyYears: null as number | null,
      extraHour: null as number | null,
      tests: { bagrutId: null }
    },
    enrollments: {
      orchestraIds: [],
      ensembleIds: [],
      theoryLessonIds: [],
      schoolYears: []
    },
    teacherAssignments: [],
    isActive: true
  })

  // Dropdown options - EXACT backend constants
  const VALID_CLASSES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'אחר']
  const VALID_INSTRUMENTS = [
    'כינור', 'ויולה', "צ'לו", 'קונטרבס',
    'חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט',
    'חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון',
    'פסנתר', 'גיטרה', 'גיטרה בס', 'גיטרה פופ', 'נבל',
    'תופים', 'כלי הקשה', 'שירה',
    'עוד', 'כלים אתניים', 'מנדולינה', 'אקורדיון', 'רקורדר'
  ]
  const VALID_STAGES = [1, 2, 3, 4, 5, 6, 7, 8]
  const TEST_STATUSES = ['לא נבחן', 'עבר/ה', 'לא עבר/ה', 'עבר/ה בהצטיינות', 'עבר/ה בהצטיינות יתרה']

  // Load student data for editing
  useEffect(() => {
    if (studentId) {
      loadStudent()
    }
  }, [studentId])

  const loadStudent = async () => {
    try {
      setLoading(true)
      const student = await apiService.students.getStudent(studentId!)
      setFormData(student)
    } catch (error) {
      console.error('Error loading student:', error)
      setErrors({ general: 'שגיאה בטעינת נתוני התלמיד' })
    } finally {
      setLoading(false)
    }
  }

  // Validation functions
  const validatePhone = (phone: string): boolean => {
    const phonePattern = /^05\d{8}$/
    return phonePattern.test(phone)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.personalInfo.firstName?.trim()) {
      newErrors.firstName = 'שם פרטי נדרש'
    }
    if (!formData.personalInfo.lastName?.trim()) {
      newErrors.lastName = 'שם משפחה נדרש'
    }

    if (!formData.personalInfo.phone.trim()) {
      newErrors.phone = 'מספר טלפון נדרש'
    } else if (!validatePhone(formData.personalInfo.phone)) {
      newErrors.phone = 'מספר טלפון חייב להתחיל ב-05 ולהכיל 10 ספרות'
    }

    if (!formData.personalInfo.age) {
      newErrors.age = 'גיל נדרש'
    } else {
      const age = parseInt(formData.personalInfo.age.toString())
      if (isNaN(age) || age < 0 || age > 99) {
        newErrors.age = 'גיל חייב להיות בין 0 ל-99'
      }
    }

    if (!formData.academicInfo.class) {
      newErrors.class = 'כיתה נדרשת'
    }

    if (formData.academicInfo.instrumentProgress.length === 0) {
      newErrors.instruments = 'לפחות כלי נגינה אחד נדרש'
    } else {
      // Validate instrument progress
      const primaryInstruments = formData.academicInfo.instrumentProgress.filter(inst => inst.isPrimary)
      if (primaryInstruments.length !== 1) {
        newErrors.instruments = 'חובה לבחור כלי נגינה עיקרי אחד בלבד'
      }

      // Validate each instrument has required fields
      formData.academicInfo.instrumentProgress.forEach((instrument, index) => {
        if (!instrument.instrumentName) {
          newErrors[`instrument_${index}`] = `כלי נגינה ${index + 1}: חובה לבחור כלי נגינה`
        }
        if (!instrument.currentStage || instrument.currentStage < 1 || instrument.currentStage > 8) {
          newErrors[`stage_${index}`] = `כלי נגינה ${index + 1}: שלב חייב להיות בין 1 ל-8`
        }
      })
    }

    // Parent phone validation if provided
    if (formData.personalInfo.parentPhone && !validatePhone(formData.personalInfo.parentPhone)) {
      newErrors.parentPhone = 'מספר טלפון הורה חייב להתחיל ב-05 ולהכיל 10 ספרות'
    }

    // Email validation if provided
    if (formData.personalInfo.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.parentEmail)) {
      newErrors.parentEmail = 'כתובת דואר אלקטרוני הורה לא תקינה'
    }

    if (formData.personalInfo.studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.studentEmail)) {
      newErrors.studentEmail = 'כתובת דואר אלקטרוני תלמיד לא תקינה'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      if (studentId) {
        await apiService.students.updateStudent(studentId, formData)
      } else {
        await apiService.students.createStudent(formData)
      }
      
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error saving student:', error)

      // Handle validation errors with field-level details using utility function
      const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(
        error,
        'שגיאה בשמירת הנתונים'
      )

      if (isValidationError) {
        setErrors({ ...fieldErrors, general: generalMessage })
      } else {
        setErrors({ general: generalMessage })
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle input changes
  const handlePersonalInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleAcademicInfoChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        [field]: value
      }
    }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Ministry stage level: stages 1-3 → א, 4-5 → ב, 6-8 → ג
  const getMinistryStageLevel = (stage: number): string => {
    if (stage >= 1 && stage <= 3) return 'א'
    if (stage >= 4 && stage <= 5) return 'ב'
    if (stage >= 6 && stage <= 8) return 'ג'
    return ''
  }

  const handleClassChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        class: value
      }
    }))
    
    if (errors.class) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.class
        return newErrors
      })
    }
  }

  // Handle instrument changes
  const addInstrument = () => {
    setFormData(prev => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        instrumentProgress: [
          ...prev.academicInfo.instrumentProgress,
          {
            instrumentName: 'פסנתר',
            isPrimary: false,
            currentStage: 1,
            startDate: new Date(),
            tests: {
              stageTest: { 
                status: 'לא נבחן',
                lastTestDate: null,
                nextTestDate: null,
                notes: ''
              },
              technicalTest: { 
                status: 'לא נבחן',
                lastTestDate: null,
                nextTestDate: null,
                notes: ''
              }
            }
          }
        ]
      }
    }))
    
    if (errors.instruments) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.instruments
        return newErrors
      })
    }
  }

  const removeInstrument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        instrumentProgress: prev.academicInfo.instrumentProgress.filter((_, i) => i !== index)
      }
    }))
  }

  const updateInstrument = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        instrumentProgress: prev.academicInfo.instrumentProgress.map((inst, i) => 
          i === index ? { ...inst, [field]: value } : inst
        )
      }
    }))
  }

  if (loading && studentId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center">
            <Loader className="w-6 h-6 animate-spin mr-3" />
            <span>טוען נתוני תלמיד...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{
        position: 'fixed !important',
        top: '0 !important',
        left: '280px !important',
        width: 'calc(100vw - 280px) !important',
        height: '100vh !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        zIndex: 9999
      }}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {studentId ? 'עריכת תלמיד' : 'הוספת תלמיד חדש'}
            </h2>
            <button 
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Error message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {errors.general}
              </div>
            )}

            {/* Personal Information */}
            <Card padding="md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטים אישיים</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם פרטי *
                  </label>
                  <input
                    type="text"
                    value={formData.personalInfo.firstName}
                    onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="הכנס שם פרטי"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם משפחה *
                  </label>
                  <input
                    type="text"
                    value={formData.personalInfo.lastName}
                    onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="הכנס שם משפחה"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מספר טלפון *
                  </label>
                  <input
                    type="tel"
                    value={formData.personalInfo.phone}
                    onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="050-1234567"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    גיל *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={formData.personalInfo.age}
                    onChange={(e) => handlePersonalInfoChange('age', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.age ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="16"
                  />
                  {errors.age && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.age}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    כתובת
                  </label>
                  <input
                    type="text"
                    value={formData.personalInfo.address}
                    onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="רחוב, עיר"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם הורה
                  </label>
                  <input
                    type="text"
                    value={formData.personalInfo.parentName}
                    onChange={(e) => handlePersonalInfoChange('parentName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="שם הורה"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    טלפון הורה
                  </label>
                  <input
                    type="tel"
                    value={formData.personalInfo.parentPhone}
                    onChange={(e) => handlePersonalInfoChange('parentPhone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.parentPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="050-1234567"
                  />
                  {errors.parentPhone && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.parentPhone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    אימייל הורה
                  </label>
                  <input
                    type="email"
                    value={formData.personalInfo.parentEmail}
                    onChange={(e) => handlePersonalInfoChange('parentEmail', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.parentEmail ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="parent@example.com"
                  />
                  {errors.parentEmail && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.parentEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    אימייל תלמיד
                  </label>
                  <input
                    type="email"
                    value={formData.personalInfo.studentEmail}
                    onChange={(e) => handlePersonalInfoChange('studentEmail', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.studentEmail ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="student@example.com"
                  />
                  {errors.studentEmail && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.studentEmail}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Academic Information */}
            <Card padding="md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטים אקדמיים</h3>
              
              {/* Class */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כיתה *
                </label>
                <select
                  value={formData.academicInfo.class}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className={`w-full md:w-48 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.class ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {VALID_CLASSES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                {errors.class && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.class}
                  </p>
                )}
              </div>

              {/* Study Years & Extra Hour */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שנות לימוד
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.academicInfo.studyYears ?? ''}
                    onChange={(e) => handleAcademicInfoChange('studyYears', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שעה נוספת
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.25"
                    value={formData.academicInfo.extraHour ?? ''}
                    onChange={(e) => handleAcademicInfoChange('extraHour', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0-10"
                  />
                </div>
              </div>

              {/* Instruments */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    כלי נגינה *
                  </label>
                  <button
                    type="button"
                    onClick={addInstrument}
                    className="flex items-center px-3 py-1 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    הוסף כלי
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.academicInfo.instrumentProgress.map((instrument, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            כלי נגינה
                          </label>
                          <select
                            value={instrument.instrumentName}
                            onChange={(e) => updateInstrument(index, 'instrumentName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              errors[`instrument_${index}`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            {VALID_INSTRUMENTS.map(inst => (
                              <option key={inst} value={inst}>{inst}</option>
                            ))}
                          </select>
                          {errors[`instrument_${index}`] && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors[`instrument_${index}`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            שלב נוכחי
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              value={instrument.currentStage}
                              onChange={(e) => updateInstrument(index, 'currentStage', parseInt(e.target.value))}
                              className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                errors[`stage_${index}`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            >
                              {VALID_STAGES.map(stage => (
                                <option key={stage} value={stage}>שלב {stage}</option>
                              ))}
                            </select>
                            {getMinistryStageLevel(instrument.currentStage) && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded whitespace-nowrap" title="דרגת משרד החינוך">
                                {getMinistryStageLevel(instrument.currentStage)}&apos;
                              </span>
                            )}
                          </div>
                          {errors[`stage_${index}`] && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors[`stage_${index}`]}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`primary-${index}`}
                            checked={instrument.isPrimary}
                            onChange={(e) => {
                              // Only one instrument can be primary
                              const newInstruments = formData.academicInfo.instrumentProgress.map((inst, i) => ({
                                ...inst,
                                isPrimary: i === index ? e.target.checked : false
                              }))
                              setFormData(prev => ({
                                ...prev,
                                academicInfo: {
                                  ...prev.academicInfo,
                                  instrumentProgress: newInstruments
                                }
                              }))
                            }}
                            className="ml-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label htmlFor={`primary-${index}`} className="text-sm text-gray-700">
                            כלי ראשי
                          </label>
                        </div>

                        <div className="flex justify-end">
                          {formData.academicInfo.instrumentProgress.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeInstrument(index)}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Test Status Section */}
                      <div className="border-t pt-3 mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">סטטוס בחינות</h4>
                        
                        {/* Stage Test */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">בחינת שלב</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">סטטוס</label>
                              <select
                                value={instrument.tests.stageTest.status}
                                onChange={(e) => {
                                  const newTests = {
                                    ...instrument.tests,
                                    stageTest: { ...instrument.tests.stageTest, status: e.target.value }
                                  }
                                  updateInstrument(index, 'tests', newTests)
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              >
                                {TEST_STATUSES.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">תאריך בחינה אחרונה</label>
                              <input
                                type="date"
                                value={instrument.tests.stageTest.lastTestDate || ''}
                                onChange={(e) => {
                                  const newTests = {
                                    ...instrument.tests,
                                    stageTest: { ...instrument.tests.stageTest, lastTestDate: e.target.value || null }
                                  }
                                  updateInstrument(index, 'tests', newTests)
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">תאריך בחינה הבאה</label>
                              <input
                                type="date"
                                value={instrument.tests.stageTest.nextTestDate || ''}
                                onChange={(e) => {
                                  const newTests = {
                                    ...instrument.tests,
                                    stageTest: { ...instrument.tests.stageTest, nextTestDate: e.target.value || null }
                                  }
                                  updateInstrument(index, 'tests', newTests)
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="block text-xs text-gray-600 mb-1">הערות</label>
                            <textarea
                              value={instrument.tests.stageTest.notes || ''}
                              onChange={(e) => {
                                const newTests = {
                                  ...instrument.tests,
                                  stageTest: { ...instrument.tests.stageTest, notes: e.target.value }
                                }
                                updateInstrument(index, 'tests', newTests)
                              }}
                              rows={2}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              placeholder="הערות על בחינת השלב..."
                            />
                          </div>
                        </div>

                        {/* Technical Test */}
                        <div className="mb-2 p-3 bg-gray-50 rounded-md">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">בחינה טכנית</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">סטטוס</label>
                              <select
                                value={instrument.tests.technicalTest.status}
                                onChange={(e) => {
                                  const newTests = {
                                    ...instrument.tests,
                                    technicalTest: { ...instrument.tests.technicalTest, status: e.target.value }
                                  }
                                  updateInstrument(index, 'tests', newTests)
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              >
                                {TEST_STATUSES.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">תאריך בחינה אחרונה</label>
                              <input
                                type="date"
                                value={instrument.tests.technicalTest.lastTestDate || ''}
                                onChange={(e) => {
                                  const newTests = {
                                    ...instrument.tests,
                                    technicalTest: { ...instrument.tests.technicalTest, lastTestDate: e.target.value || null }
                                  }
                                  updateInstrument(index, 'tests', newTests)
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">תאריך בחינה הבאה</label>
                              <input
                                type="date"
                                value={instrument.tests.technicalTest.nextTestDate || ''}
                                onChange={(e) => {
                                  const newTests = {
                                    ...instrument.tests,
                                    technicalTest: { ...instrument.tests.technicalTest, nextTestDate: e.target.value || null }
                                  }
                                  updateInstrument(index, 'tests', newTests)
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="block text-xs text-gray-600 mb-1">הערות</label>
                            <textarea
                              value={instrument.tests.technicalTest.notes || ''}
                              onChange={(e) => {
                                const newTests = {
                                  ...instrument.tests,
                                  technicalTest: { ...instrument.tests.technicalTest, notes: e.target.value }
                                }
                                updateInstrument(index, 'tests', newTests)
                              }}
                              rows={2}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              placeholder="הערות על הבחינה הטכנית..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.instruments && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.instruments}
                  </p>
                )}
              </div>
            </Card>

            {/* Enrollments */}
            <Card padding="md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">הרשמות והשתייכויות</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מספר זהות בגרות
                  </label>
                  <input
                    type="text"
                    value={formData.academicInfo.tests.bagrutId || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      academicInfo: {
                        ...prev.academicInfo,
                        tests: { bagrutId: e.target.value || null }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    הערות
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="הערות כלליות על התלמיד..."
                  />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>הרשמות לתזמורות והרכבים יתווספו על ידי המנהל</p>
              </div>
            </Card>

            {/* Status */}
            <Card padding="md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">סטטוס</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="ml-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  תלמיד פעיל
                </label>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end space-x-3 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {studentId ? 'שמור שינויים' : 'הוסף תלמיד'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}