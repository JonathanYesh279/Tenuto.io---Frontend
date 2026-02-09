import React, { useState, useEffect } from 'react'
import { Save, X, Music, Clock, User, Link, Bookmark, Hash } from 'lucide-react'
import { Card } from './ui/Card'
import type { ProgramPiece } from '../types/bagrut.types'

interface AddPieceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (pieceData: Omit<ProgramPiece, '_id'>) => Promise<void>
  existingPieces?: ProgramPiece[]
  initialData?: ProgramPiece | null
  title?: string
  submitText?: string
}

const AddPieceModal: React.FC<AddPieceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingPieces = [],
  initialData = null,
  title = 'הוסף יצירה',
  submitText = 'הוסף יצירה'
}) => {
  const [formData, setFormData] = useState<Omit<ProgramPiece, '_id'>>({
    pieceNumber: 1,
    pieceTitle: '',
    composer: '',
    duration: '',
    movement: '',
    youtubeLink: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Calculate next available piece number
  const getNextPieceNumber = (): number => {
    const existingNumbers = existingPieces.map(p => p.pieceNumber).filter(n => n != null)
    for (let i = 1; i <= 10; i++) {
      if (!existingNumbers.includes(i)) {
        return i
      }
    }
    return existingNumbers.length + 1
  }

  // Reset form with the next available piece number
  const resetForm = () => {
    if (initialData) {
      // If we have initial data (edit mode), use it
      setFormData({
        pieceNumber: initialData.pieceNumber || 1,
        pieceTitle: initialData.pieceTitle || '',
        composer: initialData.composer || '',
        duration: initialData.duration || '',
        movement: initialData.movement || '',
        youtubeLink: initialData.youtubeLink || ''
      })
    } else {
      // Otherwise, create new piece with next available number
      setFormData({
        pieceNumber: getNextPieceNumber(),
        pieceTitle: '',
        composer: '',
        duration: '',
        movement: '',
        youtubeLink: ''
      })
    }
    setErrors({})
    setLoading(false)
  }

  // Update form data when modal opens or initial data changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode - populate with existing data
        setFormData({
          pieceNumber: initialData.pieceNumber || 1,
          pieceTitle: initialData.pieceTitle || '',
          composer: initialData.composer || '',
          duration: initialData.duration || '',
          movement: initialData.movement || '',
          youtubeLink: initialData.youtubeLink || ''
        })
      } else {
        // Add mode - use next available number
        setFormData(prev => ({ ...prev, pieceNumber: getNextPieceNumber() }))
      }
    }
  }, [isOpen, existingPieces, initialData])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.pieceNumber || formData.pieceNumber < 1) {
      newErrors.pieceNumber = 'מספר יצירה חובה'
    }

    // Check if piece number is already used (but not if we're editing the same piece)
    const isNumberUsed = existingPieces.some(p => p.pieceNumber === formData.pieceNumber)
    if (isNumberUsed && (!initialData || initialData.pieceNumber !== formData.pieceNumber)) {
      newErrors.pieceNumber = 'מספר יצירה זה כבר קיים'
    }

    if (!formData.pieceTitle.trim()) {
      newErrors.pieceTitle = 'שם היצירה הוא שדה חובה'
    }

    if (!formData.composer.trim()) {
      newErrors.composer = 'שם המלחין הוא שדה חובה'
    }

    if (!formData.duration.trim()) {
      newErrors.duration = 'משך הביצוע הוא שדה חובה'
    }

    // Validate YouTube link format if provided
    if (formData.youtubeLink && formData.youtubeLink.trim()) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
      if (!youtubeRegex.test(formData.youtubeLink)) {
        newErrors.youtubeLink = 'קישור יוטיוב לא תקין'
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
      await onSubmit({
        ...formData,
        // Clean up optional fields
        movement: formData.movement?.trim() || undefined,
        youtubeLink: formData.youtubeLink?.trim() || undefined
      })
      handleClose()
    } catch (error) {
      console.error('Error adding piece:', error)
      setErrors({ general: 'שגיאה בהוספת היצירה. אנא נסה שוב.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600 mt-1">{initialData ? 'ערוך את פרטי היצירה' : 'הוסף יצירה חדשה לתכנית הביצוע'}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-700">{errors.general}</span>
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-gray-600" />
              פרטי היצירה
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Piece Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מספר יצירה <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <select
                    value={formData.pieceNumber}
                    onChange={(e) => handleInputChange('pieceNumber', parseInt(e.target.value))}
                    disabled={!!initialData}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.pieceNumber ? 'border-red-300' : 'border-gray-300'
                    } ${initialData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => {
                      const isUsed = existingPieces.some(p => p.pieceNumber === num)
                      return (
                        <option key={num} value={num} disabled={isUsed}>
                          יצירה {num} {isUsed ? '(תפוס)' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                {errors.pieceNumber && (
                  <p className="text-red-600 text-sm mt-1">{errors.pieceNumber}</p>
                )}
              </div>

              {/* Piece Title - spans 2 columns */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם היצירה <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pieceTitle}
                  onChange={(e) => handleInputChange('pieceTitle', e.target.value)}
                  placeholder="לדוגמה: סונטה לפסנתר במי מינור"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.pieceTitle ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.pieceTitle && (
                  <p className="text-red-600 text-sm mt-1">{errors.pieceTitle}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Composer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מלחין <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.composer}
                    onChange={(e) => handleInputChange('composer', e.target.value)}
                    placeholder="לדוגמה: יוהאן סבסטיאן באך"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.composer ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.composer && (
                  <p className="text-red-600 text-sm mt-1">{errors.composer}</p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  משך הביצוע <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="לדוגמה: 7 דקות"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.duration ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.duration && (
                  <p className="text-red-600 text-sm mt-1">{errors.duration}</p>
                )}
              </div>
            </div>

            {/* Movement */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                פרק
              </label>
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.movement || ''}
                  onChange={(e) => handleInputChange('movement', e.target.value)}
                  placeholder="לדוגמה: פרק ראשון - Allegro"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">אופציונלי - ציין פרק או תנועה ספציפיים</p>
            </div>

            {/* YouTube Link */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קישור יוטיוב
              </label>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={formData.youtubeLink || ''}
                  onChange={(e) => handleInputChange('youtubeLink', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.youtubeLink ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.youtubeLink && (
                <p className="text-red-600 text-sm mt-1">{errors.youtubeLink}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">אופציונלי - קישור להקלטה ביוטיוב</p>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
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
                  מוסיף...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  {submitText}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddPieceModal