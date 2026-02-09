import React, { useState, useEffect, useMemo } from 'react'
import { Save, X, Users, Music, Phone, Mail, AlertCircle, Search, User } from 'lucide-react'
import { Card } from './ui/Card'
import type { Accompanist } from '../types/bagrut.types'
import apiService from '../services/apiService'
import { handleServerValidationError } from '../utils/validationUtils'

interface Teacher {
  _id: string
  personalInfo: {
    fullName: string
    firstName?: string
    lastName?: string
    phone?: string
    email?: string
  }
  professionalInfo?: {
    instruments?: string[]
    specializations?: string[]
  }
}

interface EnhancedAccompanistFormProps {
  initialData?: Partial<Accompanist>
  onSubmit: (data: Omit<Accompanist, '_id'>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
  showTeacherSearch?: boolean
}

const EnhancedAccompanistForm: React.FC<EnhancedAccompanistFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  showTeacherSearch = true
}) => {
  const [formData, setFormData] = useState<Omit<Accompanist, '_id'>>({
    name: '',
    instrument: '',
    phone: '',
    email: ''
  })

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [useCustomEntry, setUseCustomEntry] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(true)

  // Common accompaniment instruments
  const accompanimentInstruments = [
    'פסנתר',
    'גיטרה',
    'כינור',
    'ויולה',
    "צ'לו",
    'קונטרבס',
    'חלילית',
    'חליל צד',
    'אבוב',
    'קלרינט',
    'סקסופון',
    'בסון',
    'חצוצרה',
    'קרן יער',
    'טרומבון',
    'תופים',
    'כלי הקשה',
    'אחר'
  ]

  // Load teachers on component mount
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoadingTeachers(true)
        const response = await apiService.teachers.getTeachers()
        console.log('🎭 Loaded teachers for accompanist selection:', response?.length || 0)
        setTeachers(response || [])
      } catch (error) {
        console.error('Error loading teachers:', error)
      } finally {
        setLoadingTeachers(false)
      }
    }

    if (showTeacherSearch) {
      loadTeachers()
    }
  }, [showTeacherSearch])

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        instrument: initialData.instrument || '',
        phone: initialData.phone || '',
        email: initialData.email || ''
      })
      setUseCustomEntry(true) // If editing existing data, assume custom entry
    }
  }, [initialData])

  // Filter teachers based on search query
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim() || !teachers) return teachers.slice(0, 10) // Show first 10 by default

    const query = searchQuery.toLowerCase().trim()
    return teachers
      .filter(teacher => {
        const fullName = teacher.personalInfo?.fullName?.toLowerCase() || ''
        const firstName = teacher.personalInfo?.firstName?.toLowerCase() || ''
        const lastName = teacher.personalInfo?.lastName?.toLowerCase() || ''
        const instruments = teacher.professionalInfo?.instruments?.join(' ').toLowerCase() || ''
        
        return fullName.includes(query) || 
               firstName.includes(query) || 
               lastName.includes(query) ||
               instruments.includes(query)
      })
      .slice(0, 20) // Limit results to prevent overwhelming UI
  }, [teachers, searchQuery])

  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setFormData(prev => ({
      ...prev,
      name: teacher.personalInfo?.fullName || '',
      phone: teacher.personalInfo?.phone || '',
      email: teacher.personalInfo?.email || ''
    }))
    setSearchQuery(teacher.personalInfo?.fullName || '')
    setShowDropdown(false)
    setUseCustomEntry(false)

    // Clear name error if it was set
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }))
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setShowDropdown(true)
    setSelectedTeacher(null)
    
    // If user is typing, switch to custom entry mode
    if (!selectedTeacher) {
      setFormData(prev => ({ ...prev, name: value }))
    }
  }

  const handleUseCustomEntry = () => {
    setUseCustomEntry(true)
    setSelectedTeacher(null)
    setSearchQuery('')
    setShowDropdown(false)
    setFormData(prev => ({
      ...prev,
      name: '',
      phone: '',
      email: ''
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'שם המלווה הוא שדה חובה'
    }

    if (!formData.instrument.trim()) {
      newErrors.instrument = 'כלי הליווי הוא שדה חובה'
    }

    // Email validation (optional field)
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'כתובת אימייל לא תקינה'
    }

    // Phone validation (optional field, Israeli format - must match backend pattern)
    if (formData.phone && formData.phone.trim()) {
      const phonePattern = /^05\d{8}$/
      if (!phonePattern.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'מספר טלפון לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)'
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
    } catch (error: any) {
      console.error('Error submitting accompanist:', error)
      const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(error, 'שגיאה בשמירת המלווה. אנא נסה שוב.')
      if (isValidationError) {
        setErrors({ ...fieldErrors, general: generalMessage })
      } else {
        setErrors({ general: generalMessage })
      }
    } finally {
      setLoading(false)
    }
  }

  const formatIsraeliPhone = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    
    // Handle international format conversion (972 -> 0)
    if (digits.startsWith('972') && digits.length >= 12) {
      return '0' + digits.slice(3)
    }
    
    // Ensure it starts with 05 and limit to 10 digits
    if (digits.length > 0 && !digits.startsWith('05')) {
      if (digits.startsWith('5')) {
        return '05' + digits.slice(1, 9)
      }
    }
    
    return digits.slice(0, 10)
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    let processedValue = value
    
    // Format phone number automatically
    if (field === 'phone') {
      processedValue = formatIsraeliPhone(value)
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }))
    
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
            {isEdit ? 'עריכת מלווה' : 'מלווה חדש'}
          </h2>
          <p className="text-gray-600 mt-1">
            הוספת נגן מלווה לביצוע הבגרות
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

        {/* Teacher Selection */}
        {showTeacherSearch && !useCustomEntry && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              בחירת מורה מהמערכת
            </h3>
            
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  חיפוש מורה
                </label>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="חפש לפי שם או כלי נגינה..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={loadingTeachers}
                  />
                </div>
                
                {loadingTeachers && (
                  <p className="text-sm text-gray-500 mt-1">טוען רשימת מורים...</p>
                )}

                {/* Dropdown */}
                {showDropdown && !loadingTeachers && filteredTeachers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {filteredTeachers.map((teacher) => (
                      <div
                        key={teacher._id}
                        onClick={() => handleTeacherSelect(teacher)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {teacher.personalInfo?.fullName || 'ללא שם'}
                            </div>
                            {teacher.professionalInfo?.instruments && teacher.professionalInfo.instruments.length > 0 && (
                              <div className="text-sm text-gray-600">
                                כלים: {teacher.professionalInfo.instruments.join(', ')}
                              </div>
                            )}
                            {teacher.personalInfo?.phone && (
                              <div className="text-xs text-gray-500">
                                {teacher.personalInfo.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Teacher Display */}
              {selectedTeacher && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-green-900">
                        נבחר: {selectedTeacher.personalInfo?.fullName}
                      </div>
                      {selectedTeacher.personalInfo?.phone && (
                        <div className="text-sm text-green-700">
                          טלפון: {selectedTeacher.personalInfo.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Entry Toggle */}
              <div className="pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleUseCustomEntry}
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  לא מצאת את המורה? הזן פרטים באופן ידני
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Manual Entry Form */}
        {(useCustomEntry || !showTeacherSearch) && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                פרטי המלווה
              </h3>
              {showTeacherSearch && (
                <button
                  type="button"
                  onClick={() => setUseCustomEntry(false)}
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  חזור לחיפוש מורים
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם המלווה <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="לדוגמה: יוסי כהן"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מספר טלפון
                </label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="0501234567"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    dir="ltr"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  כתובת אימייל
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="לדוגמה: yosi@example.com"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    dir="ltr"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Instrument Selection - Always Visible */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-gray-600" />
            כלי הליווי
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              כלי הליווי <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.instrument}
              onChange={(e) => handleInputChange('instrument', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.instrument ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">בחר כלי</option>
              {accompanimentInstruments.map(instrument => (
                <option key={instrument} value={instrument}>
                  {instrument}
                </option>
              ))}
            </select>
            {errors.instrument && (
              <p className="text-red-600 text-sm mt-1">{errors.instrument}</p>
            )}
            
            {/* Custom instrument input if "אחר" is selected */}
            {formData.instrument === 'אחר' && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="הכנס את שם הכלי"
                  onChange={(e) => handleInputChange('instrument', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">מידע חשוב</p>
              <p>
                פרטי הקשר יועברו למלווה לתיאום חזרות ויום הבגרות. 
                ודא שהפרטים נכונים ועדכניים.
              </p>
            </div>
          </div>
        </div>

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
                שמור מלווה
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EnhancedAccompanistForm