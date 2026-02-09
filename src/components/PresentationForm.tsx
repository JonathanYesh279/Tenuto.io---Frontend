import React, { useState, useEffect } from 'react'
import { Save, X, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react'
import { Card } from './ui/Card'
import type { PresentationUpdateData } from '../types/bagrut.types'

interface PresentationFormProps {
  presentationNumber: number
  initialData?: PresentationUpdateData & { presentationNumber: number; isCompleted: boolean }
  onSubmit: (data: PresentationUpdateData) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

const PresentationForm: React.FC<PresentationFormProps> = ({
  presentationNumber,
  initialData,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<PresentationUpdateData>({
    topic: '',
    description: '',
    duration: '',
    grade: undefined,
    teacherNotes: '',
    presentationDate: undefined,
    isCompleted: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        topic: initialData.topic || '',
        description: initialData.description || '',
        duration: initialData.duration || '',
        grade: initialData.grade,
        teacherNotes: initialData.teacherNotes || '',
        presentationDate: initialData.presentationDate ? new Date(initialData.presentationDate) : undefined,
        isCompleted: initialData.isCompleted || false
      })
    }
  }, [initialData])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.topic?.trim()) {
      newErrors.topic = 'נושא המצגת הוא שדה חובה'
    }

    if (formData.duration && !formData.duration.match(/^\d{1,2}:\d{2}$/)) {
      newErrors.duration = 'פורמט זמן לא תקין (MM:SS)'
    }

    if (formData.grade !== undefined) {
      if (formData.grade < 0 || formData.grade > 100) {
        newErrors.grade = 'ציון חייב להיות בין 0 ל-100'
      }
    }

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
    } catch (error) {
      console.error('Error submitting presentation:', error)
      setErrors({ general: 'שגיאה בשמירת המצגת. אנא נסה שוב.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof PresentationUpdateData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="bg-white rounded-lg max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? `עריכת מצגת ${presentationNumber}` : `מצגת ${presentationNumber}`}
          </h2>
          <p className="text-gray-600 mt-1">
            הזנת פרטי המצגת וציון
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{errors.general}</span>
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-600" />
            פרטי המצגת
          </h3>
          
          <div className="space-y-4">
            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                נושא המצגת <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="לדוגמה: מוזיקה בארוקית"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.topic ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.topic && (
                <p className="text-red-600 text-sm mt-1">{errors.topic}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תיאור המצגת
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="תיאור מפורט של תוכן המצגת..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                משך המצגת
              </label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="MM:SS (לדוגמה: 15:30)"
                  className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.duration ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.duration && (
                <p className="text-red-600 text-sm mt-1">{errors.duration}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">פורמט: דקות:שניות (לדוגמה: 15:30)</p>
            </div>
          </div>
        </Card>

        {/* Date and Completion */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">תאריך וסטטוס</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Presentation Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך המצגת
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.presentationDate ? formData.presentationDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('presentationDate', e.target.value ? new Date(e.target.value) : undefined)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Completed Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סטטוס השלמה
              </label>
              <label className="flex items-center space-x-3 space-x-reverse p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.isCompleted || false}
                  onChange={(e) => handleInputChange('isCompleted', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">המצגת הושלמה</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Grade and Notes */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ציון והערות</h3>
          
          <div className="space-y-4">
            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ציון המצגת
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.grade || ''}
                onChange={(e) => handleInputChange('grade', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0-100"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.grade ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.grade && (
                <p className="text-red-600 text-sm mt-1">{errors.grade}</p>
              )}
            </div>

            {/* Teacher Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                הערות המורה
              </label>
              <textarea
                value={formData.teacherNotes}
                onChange={(e) => handleInputChange('teacherNotes', e.target.value)}
                placeholder="הערות על הביצוע, איכות המצגת, נקודות לשיפור..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ביטול
          </button>
          
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
                שמור מצגת
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PresentationForm