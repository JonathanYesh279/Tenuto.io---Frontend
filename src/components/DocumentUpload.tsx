import React, { useState, useRef } from 'react'
import { Upload, X, File, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { Card } from './ui/Card'

interface DocumentUploadProps {
  onUpload: (file: File, category: string, description?: string) => Promise<void>
  onCancel: () => void
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  onCancel,
  maxFileSize = 10, // 10MB default
  acceptedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Document categories
  const documentCategories = [
    { value: 'תעודה', label: 'תעודה', description: 'תעודת זיכוי או הסמכה' },
    { value: 'תכנית', label: 'תכנית', description: 'תכנית הביצוע והנוטות' },
    { value: 'הקלטה', label: 'הקלטה', description: 'הקלטות אודיו/וידאו של הביצועים' },
    { value: 'מכתב המלצה', label: 'מכתב המלצה', description: 'מכתבי המלצה ממורים או מוזיקאים' },
    { value: 'אחר', label: 'אחר', description: 'מסמכים נוספים' }
  ]

  const validateFile = (file: File): boolean => {
    const newErrors: Record<string, string> = {}

    // File size check
    if (file.size > maxFileSize * 1024 * 1024) {
      newErrors.file = `גודל הקובץ חייב להיות קטן מ-${maxFileSize}MB`
    }

    // File type check
    if (!acceptedTypes.includes(file.type)) {
      newErrors.file = 'סוג קובץ לא נתמך'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file)
      setErrors({})
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedFile) {
      newErrors.file = 'יש לבחור קובץ'
    }

    if (!category) {
      newErrors.category = 'יש לבחור קטגוריה'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !selectedFile) {
      return
    }

    setLoading(true)
    try {
      await onUpload(selectedFile, category, description.trim() || undefined)
    } catch (error) {
      console.error('Error uploading document:', error)
      setErrors({ general: 'שגיאה בהעלאת הקובץ. אנא נסה שוב.' })
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.startsWith('video/')) return '🎬'
    if (fileType === 'application/pdf') return '📄'
    if (fileType.includes('document') || fileType.includes('word')) return '📝'
    return '📎'
  }

  return (
    <div className="bg-white rounded max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">העלאת מסמך</h2>
          <p className="text-gray-600 mt-1">הוספת מסמך לבגרות</p>
        </div>
        <button
          onClick={onCancel}
          disabled={loading}
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

        {/* File Upload Area */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">בחירת קובץ</h3>
          
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? 'border-primary bg-muted'
                  : errors.file
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${
                dragOver ? 'text-primary' : 'text-gray-400'
              }`} />
              <p className="text-lg font-medium text-gray-900 mb-2">
                גרור קובץ לכאן או לחץ לבחירה
              </p>
              <p className="text-sm text-gray-600 mb-4">
                גודל מקסימלי: {maxFileSize}MB
              </p>
              <p className="text-xs text-gray-500">
                קבצים נתמכים: PDF, תמונות, אודיו, וידאו, Word
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept={acceptedTypes.join(',')}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(selectedFile.type)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedFile.name}</h4>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {errors.file && (
            <p className="text-red-600 text-sm mt-2">{errors.file}</p>
          )}
        </Card>

        {/* Category Selection */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            קטגוריית המסמך <span className="text-red-500">*</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentCategories.map(cat => (
              <label
                key={cat.value}
                className={`flex flex-col p-4 border rounded cursor-pointer transition-colors ${
                  category === cat.value
                    ? 'border-primary bg-muted'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={category === cat.value}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <span className="font-medium text-gray-900">{cat.label}</span>
                </div>
                <p className="text-sm text-gray-600 mr-7">{cat.description}</p>
              </label>
            ))}
          </div>

          {errors.category && (
            <p className="text-red-600 text-sm mt-2">{errors.category}</p>
          )}
        </Card>

        {/* Description */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">תיאור המסמך</h3>
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="תיאור קצר של המסמך (אופציונלי)..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
          />
        </Card>

        {/* Upload Guidelines */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-start gap-3">
            <File className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">הנחיות העלאה</p>
              <ul className="space-y-1 text-xs">
                <li>• ודא שהקובץ ברור וקריא</li>
                <li>• השתמש בשמות קבצים תיאוריים</li>
                <li>• עבור הקלטות, ודא איכות שמע טובה</li>
                <li>• מסמכים סרוקים - רזולוציה מינימלית 150 DPI</li>
              </ul>
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
            disabled={loading || !selectedFile}
            className="flex items-center px-6 py-2 bg-primary text-white rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin ml-2" />
                מעלה...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 ml-2" />
                העלה מסמך
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DocumentUpload