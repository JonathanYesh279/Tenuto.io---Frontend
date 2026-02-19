import React, { useState, useEffect } from 'react'
import { Save, X, Music, Clock, User, AlertCircle } from 'lucide-react'
import { Card } from './ui/Card'
import type { ProgramPiece } from '../types/bagrut.types'

interface ProgramPieceFormProps {
  initialData?: Partial<ProgramPiece>
  onSubmit: (data: Omit<ProgramPiece, '_id'>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
  existingNumbers?: number[]
}

const ProgramPieceForm: React.FC<ProgramPieceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  existingNumbers = []
}) => {
  const [formData, setFormData] = useState<Omit<ProgramPiece, '_id'>>({
    pieceNumber: 1,
    composerName: '',
    pieceName: '',
    duration: '',
    period: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Musical periods for dropdown
  const musicalPeriods = [
    'בארוק',
    'קלאסי',
    'רומנטי',
    'מודרני',
    'עכשווי',
    'עממי',
    'ג\'אז',
    'פופולרי',
    'מזרחי',
    'אחר'
  ]

  useEffect(() => {
    if (initialData) {
      setFormData({
        pieceNumber: initialData.pieceNumber || getNextAvailableNumber(),
        composerName: initialData.composerName || '',
        pieceName: initialData.pieceName || '',
        duration: initialData.duration || '',
        period: initialData.period || '',
        notes: initialData.notes || ''
      })
    } else {
      setFormData(prev => ({ ...prev, pieceNumber: getNextAvailableNumber() }))
    }
  }, [initialData, existingNumbers])

  const getNextAvailableNumber = (): number => {
    for (let i = 1; i <= 10; i++) {
      if (!existingNumbers.includes(i)) {
        return i
      }
    }
    return existingNumbers.length + 1
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.composerName.trim()) {
      newErrors.composerName = 'שם המלחין הוא שדה חובה'
    }

    if (!formData.pieceName.trim()) {
      newErrors.pieceName = 'שם היצירה הוא שדה חובה'
    }

    if (formData.pieceNumber < 1 || formData.pieceNumber > 10) {
      newErrors.pieceNumber = 'מספר היצירה חייב להיות בין 1 ל-10'
    }

    if (!isEdit && existingNumbers.includes(formData.pieceNumber)) {
      newErrors.pieceNumber = 'מספר יצירה זה כבר קיים'
    }

    if (formData.duration && !formData.duration.match(/^\d{1,2}:\d{2}$/)) {
      newErrors.duration = 'פורמט זמן לא תקין (MM:SS)'
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
      console.error('Error submitting program piece:', error)
      setErrors({ general: 'שגיאה בשמירת היצירה. אנא נסה שוב.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="bg-white rounded max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'עריכת יצירה' : 'יצירה חדשה'}
          </h2>
          <p className="text-gray-600 mt-1">
            הוספת יצירה לתכנית הביצוע
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{errors.general}</span>
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-gray-600" />
            פרטי היצירה
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Piece Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מספר יצירה <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.pieceNumber}
                onChange={(e) => handleInputChange('pieceNumber', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent ${
                  errors.pieceNumber ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <option 
                    key={num} 
                    value={num}
                    disabled={!isEdit && existingNumbers.includes(num) && num !== formData.pieceNumber}
                  >
                    יצירה {num} {!isEdit && existingNumbers.includes(num) && num !== formData.pieceNumber ? '(תפוס)' : ''}
                  </option>
                ))}
              </select>
              {errors.pieceNumber && (
                <p className="text-red-600 text-sm mt-1">{errors.pieceNumber}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                משך הביצוע
              </label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="MM:SS (לדוגמה: 04:30)"
                  className={`flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.duration ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.duration && (
                <p className="text-red-600 text-sm mt-1">{errors.duration}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">פורמט: דקות:שניות</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Composer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם המלחין <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.composerName}
                  onChange={(e) => handleInputChange('composerName', e.target.value)}
                  placeholder="לדוגמה: יוהאן סבסטיאן באך"
                  className={`flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.composerName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.composerName && (
                <p className="text-red-600 text-sm mt-1">{errors.composerName}</p>
              )}
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תקופה מוזיקלית
              </label>
              <select
                value={formData.period}
                onChange={(e) => handleInputChange('period', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="">בחר תקופה</option>
                {musicalPeriods.map(period => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Piece Name */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם היצירה <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.pieceName}
              onChange={(e) => handleInputChange('pieceName', e.target.value)}
              placeholder="לדוגמה: קונצ'רטו לכינור במי מינור"
              className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent ${
                errors.pieceName ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.pieceName && (
              <p className="text-red-600 text-sm mt-1">{errors.pieceName}</p>
            )}
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הערות
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="הערות נוספות על היצירה, דרישות מיוחדות, עיבודים..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent resize-vertical"
            />
          </div>
        </Card>

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
                <Save className="w-4 h-4 ml-2" />
                שמור יצירה
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProgramPieceForm