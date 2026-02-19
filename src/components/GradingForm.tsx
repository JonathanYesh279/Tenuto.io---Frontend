import React, { useState, useEffect } from 'react'

import { Card } from './ui/Card'
import type { GradingDetailsUpdateData } from '../types/bagrut.types'
import { handleServerValidationError } from '../utils/validationUtils'
import { CalculatorIcon, CheckCircleIcon, FloppyDiskIcon, MedalIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'

interface GradingFormProps {
  initialData?: GradingDetailsUpdateData
  onSubmit: (data: GradingDetailsUpdateData) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

const GradingForm: React.FC<GradingFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<GradingDetailsUpdateData>({
    performanceGrade: undefined,
    presentationsAverage: undefined,
    magenBagrutGrade: undefined,
    teacherEvaluation: undefined,
    juryGrade: undefined,
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [calculatedFinal, setCalculatedFinal] = useState<number | null>(null)

  useEffect(() => {
    if (initialData) {
      setFormData({
        performanceGrade: initialData.performanceGrade,
        presentationsAverage: initialData.presentationsAverage,
        magenBagrutGrade: initialData.magenBagrutGrade,
        teacherEvaluation: initialData.teacherEvaluation,
        juryGrade: initialData.juryGrade,
        notes: initialData.notes || ''
      })
    }
  }, [initialData])

  // Calculate final grade automatically
  useEffect(() => {
    calculateFinalGrade()
  }, [formData])

  const calculateFinalGrade = () => {
    const grades = [
      formData.performanceGrade,
      formData.presentationsAverage,
      formData.magenBagrutGrade,
      formData.teacherEvaluation,
      formData.juryGrade
    ].filter(grade => grade !== undefined && grade !== null) as number[]

    if (grades.length === 0) {
      setCalculatedFinal(null)
      return
    }

    // Weight calculation (can be customized based on requirements)
    const weights = {
      performance: 0.35,      // 35% - ציון ביצוע
      presentations: 0.20,    // 20% - ממוצע מצגות
      magen: 0.15,           // 15% - מגן בגרות
      teacher: 0.15,         // 15% - הערכת מורה
      jury: 0.15             // 15% - ציון חבר שופטים
    }

    let totalWeighted = 0
    let totalWeight = 0

    if (formData.performanceGrade !== undefined) {
      totalWeighted += formData.performanceGrade * weights.performance
      totalWeight += weights.performance
    }
    if (formData.presentationsAverage !== undefined) {
      totalWeighted += formData.presentationsAverage * weights.presentations
      totalWeight += weights.presentations
    }
    if (formData.magenBagrutGrade !== undefined) {
      totalWeighted += formData.magenBagrutGrade * weights.magen
      totalWeight += weights.magen
    }
    if (formData.teacherEvaluation !== undefined) {
      totalWeighted += formData.teacherEvaluation * weights.teacher
      totalWeight += weights.teacher
    }
    if (formData.juryGrade !== undefined) {
      totalWeighted += formData.juryGrade * weights.jury
      totalWeight += weights.jury
    }

    if (totalWeight > 0) {
      const finalGrade = Math.round((totalWeighted / totalWeight) * 100) / 100
      setCalculatedFinal(finalGrade)
    } else {
      setCalculatedFinal(null)
    }
  }

  const getGradeLevel = (grade: number): string => {
    if (grade >= 95) return 'מצטיין במיוחד'
    if (grade >= 90) return 'מצטיין'
    if (grade >= 85) return 'טוב מאוד'
    if (grade >= 70) return 'טוב'
    if (grade >= 60) return 'עובר'
    return 'לא עובר'
  }

  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return 'text-green-600'
    if (grade >= 80) return 'text-blue-600'
    if (grade >= 70) return 'text-yellow-600'
    if (grade >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate grade ranges
    const gradeFields: (keyof GradingDetailsUpdateData)[] = [
      'performanceGrade', 'presentationsAverage', 'magenBagrutGrade', 
      'teacherEvaluation', 'juryGrade'
    ]

    gradeFields.forEach(field => {
      const value = formData[field] as number | undefined
      if (value !== undefined && (value < 0 || value > 100)) {
        const fieldNames = {
          performanceGrade: 'ציון ביצוע',
          presentationsAverage: 'ממוצע מצגות',
          magenBagrutGrade: 'ציון מגן בגרות',
          teacherEvaluation: 'הערכת מורה',
          juryGrade: 'ציון חבר שופטים'
        }
        newErrors[field] = `${fieldNames[field]} חייב להיות בין 0 ל-100`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error: any) {
      console.error('Error submitting grading:', error)
      const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(error, 'שגיאה בשמירת הציונים. אנא נסה שוב.')
      if (isValidationError) {
        setErrors({ ...fieldErrors, general: generalMessage })
      } else {
        setErrors({ general: generalMessage })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof GradingDetailsUpdateData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="bg-white rounded max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'עריכת ציונים' : 'הזנת ציונים'}
          </h2>
          <p className="text-gray-600 mt-1">
            הזנת פירוט הציונים וחישוב הציון הסופי
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded flex items-center gap-3">
            <WarningCircleIcon className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{errors.general}</span>
          </div>
        )}

        {/* Grade Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance and Presentations */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MedalIcon className="w-5 h-5 text-gray-600" />
              ציוני ביצוע ומצגות
            </h3>
            
            <div className="space-y-4">
              {/* Performance Grade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ציון ביצוע (35%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.performanceGrade || ''}
                  onChange={(e) => handleInputChange('performanceGrade', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0-100"
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.performanceGrade ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.performanceGrade && (
                  <p className="text-red-600 text-sm mt-1">{errors.performanceGrade}</p>
                )}
              </div>

              {/* Presentations Average */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ממוצע מצגות (20%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.presentationsAverage || ''}
                  onChange={(e) => handleInputChange('presentationsAverage', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0-100"
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.presentationsAverage ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.presentationsAverage && (
                  <p className="text-red-600 text-sm mt-1">{errors.presentationsAverage}</p>
                )}
              </div>

              {/* Magen Bagrut Grade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ציון מגן בגרות (15%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.magenBagrutGrade || ''}
                  onChange={(e) => handleInputChange('magenBagrutGrade', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0-100"
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.magenBagrutGrade ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.magenBagrutGrade && (
                  <p className="text-red-600 text-sm mt-1">{errors.magenBagrutGrade}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Evaluations */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-gray-600" />
              הערכות
            </h3>
            
            <div className="space-y-4">
              {/* Teacher Evaluation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  הערכת מורה (15%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.teacherEvaluation || ''}
                  onChange={(e) => handleInputChange('teacherEvaluation', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0-100"
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.teacherEvaluation ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.teacherEvaluation && (
                  <p className="text-red-600 text-sm mt-1">{errors.teacherEvaluation}</p>
                )}
              </div>

              {/* Jury Grade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ציון חבר שופטים (15%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.juryGrade || ''}
                  onChange={(e) => handleInputChange('juryGrade', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0-100"
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.juryGrade ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.juryGrade && (
                  <p className="text-red-600 text-sm mt-1">{errors.juryGrade}</p>
                )}
              </div>

              {/* Calculated Final Grade Preview */}
              {calculatedFinal !== null && (
                <div className="mt-6 p-4 bg-muted/50 border border-border rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <CalculatorIcon className="w-5 h-5 text-primary" />
                    <span className="font-medium text-primary">ציון סופי משוער</span>
                  </div>
                  <div className={`text-3xl font-bold ${getGradeColor(calculatedFinal)}`}>
                    {calculatedFinal}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {getGradeLevel(calculatedFinal)}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Notes */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">הערות</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="הערות נוספות על הציונים, הביצוע, או המלצות..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent resize-vertical"
          />
        </Card>

        {/* Grading Scale Info */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <h4 className="font-medium text-gray-900 mb-3">סולם ציונים</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex flex-col items-center">
              <span className="font-medium text-green-600">95-100</span>
              <span className="text-gray-600">מצטיין במיוחד</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium text-green-600">90-94</span>
              <span className="text-gray-600">מצטיין</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium text-blue-600">85-89</span>
              <span className="text-gray-600">טוב מאוד</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium text-yellow-600">70-84</span>
              <span className="text-gray-600">טוב</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium text-orange-600">60-69</span>
              <span className="text-gray-600">עובר</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ביטול
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                שומר...
              </>
            ) : (
              <>
                <FloppyDiskIcon className="w-4 h-4 ml-2" />
                שמור ציונים
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default GradingForm