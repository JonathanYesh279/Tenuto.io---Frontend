/**
 * Form Validation Example
 * 
 * Comprehensive demonstration of all validated form components
 */

import React, { useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { Card } from '../ui/Card'
import {
  PhoneInput,
  TimeInput,
  ClassSelect,
  InstrumentSelect,
  DaySelect,
  DurationSelect,
  ValidationSummary,
  ValidationSuccess,
  validateForm,
  ValidationResult,
  ValidationRule
} from '../form'

interface FormData {
  studentName: string
  phone: string
  parentPhone: string
  email: string
  class: string
  instrument: string
  stage: number
  day: string
  startTime: string
  endTime: string
  duration: number
  location: string
  notes: string
}

const FormValidationExample: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    studentName: '',
    phone: '',
    parentPhone: '',
    email: '',
    class: '',
    instrument: '',
    stage: 1,
    day: '',
    startTime: '',
    endTime: '',
    duration: 45,
    location: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({})

  // Validation rules for the form
  const validationRules: Record<string, ValidationRule> = {
    studentName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      message: 'שם התלמיד נדרש (2-50 תווים)'
    },
    phone: {
      required: true,
      pattern: /^05\d{8}$/,
      message: 'מספר טלפון חייב להתחיל ב-05 ולהכיל 10 ספרות'
    },
    parentPhone: {
      required: false,
      pattern: /^05\d{8}$/,
      message: 'מספר טלפון הורה חייב להתחיל ב-05 ולהכיל 10 ספרות'
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'כתובת אימייל לא תקינה'
    },
    class: {
      required: true,
      message: 'בחירת כיתה נדרשת'
    },
    instrument: {
      required: true,
      message: 'בחירת כלי נגינה נדרשת'
    },
    day: {
      required: true,
      message: 'בחירת יום נדרשת'
    },
    startTime: {
      required: true,
      pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      message: 'שעת התחלה נדרשת בפורמט HH:MM'
    },
    duration: {
      required: true,
      min: 30,
      max: 120,
      message: 'משך השיעור חייב להיות בין 30 ל-120 דקות'
    },
    location: {
      required: true,
      minLength: 2,
      message: 'מיקום השיעור נדרש'
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    setShowSuccess(false)
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleValidationChange = (field: string, result: ValidationResult) => {
    setValidationResults(prev => ({ ...prev, [field]: result }))
  }

  const calculateEndTime = (startTime: string, duration: number): string => {
    if (!startTime || !duration) return ''
    
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMins = totalMinutes % 60
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  // Auto-calculate end time when start time or duration changes
  React.useEffect(() => {
    if (formData.startTime && formData.duration) {
      const endTime = calculateEndTime(formData.startTime, formData.duration)
      setFormData(prev => ({ ...prev, endTime }))
    }
  }, [formData.startTime, formData.duration])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setShowSuccess(false)

    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {} as Record<string, boolean>)
    setTouched(allTouched)

    // Validate entire form
    const validation = validateForm(formData, validationRules)
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      setIsSubmitting(false)
      return
    }

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Success
      setErrors({})
      setShowSuccess(true)
      console.log('Form submitted successfully:', formData)
      
    } catch (error) {
      setErrors({ general: 'שגיאה בשמירת הנתונים. נסה שוב.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      studentName: '',
      phone: '',
      parentPhone: '',
      email: '',
      class: '',
      instrument: '',
      stage: 1,
      day: '',
      startTime: '',
      endTime: '',
      duration: 45,
      location: '',
      notes: ''
    })
    setErrors({})
    setTouched({})
    setValidationResults({})
    setShowSuccess(false)
  }

  const hasErrors = Object.keys(errors).length > 0
  const isFormValid = !hasErrors && Object.keys(touched).length > 0

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">דוגמה לטופס עם ולידציה</h2>
            <p className="text-gray-600 mt-2">
              דוגמה מקיפה לכל רכיבי הטופס עם ולידציה בזמן אמת והודעות שגיאה בעברית
            </p>
          </div>

          {/* Validation Summary */}
          {hasErrors && (
            <ValidationSummary
              errors={errors}
              touched={touched}
              onClose={() => setErrors({})}
            />
          )}

          {/* Success Message */}
          {showSuccess && (
            <ValidationSuccess
              message="הטופס נשמר בהצלחה! כל השדות תקינים."
              onClose={() => setShowSuccess(false)}
            />
          )}

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי התלמיד</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם התלמיד *
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => handleFieldChange('studentName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                  placeholder="הכנס שם מלא"
                />
                {errors.studentName && (
                  <div className="text-red-600 text-sm mt-1">{errors.studentName}</div>
                )}
              </div>

              {/* Phone */}
              <PhoneInput
                value={formData.phone}
                onChange={(value) => handleFieldChange('phone', value)}
                onValidationChange={(result) => handleValidationChange('phone', result)}
                label="מספר טלפון *"
                required={true}
              />

              {/* Parent Phone */}
              <PhoneInput
                value={formData.parentPhone}
                onChange={(value) => handleFieldChange('parentPhone', value)}
                onValidationChange={(result) => handleValidationChange('parentPhone', result)}
                label="טלפון הורה"
                required={false}
              />

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  כתובת אימייל *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                  placeholder="example@email.com"
                  dir="ltr"
                />
                {errors.email && (
                  <div className="text-red-600 text-sm mt-1">{errors.email}</div>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטים אקדמיים</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class */}
              <ClassSelect
                value={formData.class}
                onChange={(value) => handleFieldChange('class', value)}
                onValidationChange={(result) => handleValidationChange('class', result)}
                label="כיתה *"
                required={true}
              />

              {/* Instrument */}
              <InstrumentSelect
                value={formData.instrument}
                onChange={(value) => handleFieldChange('instrument', value)}
                onValidationChange={(result) => handleValidationChange('instrument', result)}
                label="כלי נגינה *"
                required={true}
                categorized={true}
              />
            </div>
          </div>

          {/* Lesson Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי השיעור</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Day */}
              <DaySelect
                value={formData.day}
                onChange={(value) => handleFieldChange('day', value)}
                onValidationChange={(result) => handleValidationChange('day', result)}
                label="יום *"
                required={true}
              />

              {/* Start Time */}
              <TimeInput
                value={formData.startTime}
                onChange={(value) => handleFieldChange('startTime', value)}
                onValidationChange={(result) => handleValidationChange('startTime', result)}
                label="שעת התחלה *"
                required={true}
                min="08:00"
                max="20:00"
              />

              {/* Duration */}
              <DurationSelect
                value={formData.duration}
                onChange={(value) => handleFieldChange('duration', value)}
                onValidationChange={(result) => handleValidationChange('duration', result)}
                label="משך השיעור *"
                required={true}
              />
            </div>

            {/* Auto-calculated End Time */}
            {formData.endTime && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700">
                  <strong>שעת סיום מחושבת:</strong> {formData.endTime}
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מיקום השיעור *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
              placeholder="חדר 101, אולם גדול, וכו'"
            />
            {errors.location && (
              <div className="text-red-600 text-sm mt-1">{errors.location}</div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הערות
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
              placeholder="הערות נוספות..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              איפוס
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  שמור
                </>
              )}
            </button>
          </div>

          {/* Form Status */}
          <div className="text-center text-sm text-gray-500">
            {isFormValid && !hasErrors && (
              <span className="text-green-600">✓ הטופס תקין ומוכן לשליחה</span>
            )}
            {hasErrors && (
              <span className="text-red-600">⚠ יש שגיאות בטופס</span>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}

export default FormValidationExample