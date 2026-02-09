import { useState, useEffect } from 'react'
import { X, Save, Music, User, MapPin, Users } from 'lucide-react'
import {
  VALID_ORCHESTRA_TYPES,
  VALID_LOCATIONS,
  validateOrchestraForm,
  type Orchestra,
  type OrchestraFormData,
  type OrchestraType,
  type LocationType
} from '../utils/orchestraUtils'
import { handleServerValidationError } from '../utils/validationUtils'

interface OrchestraFormProps {
  orchestra?: Orchestra | null
  teachers: any[]
  onSubmit: (data: OrchestraFormData) => Promise<void>
  onCancel: () => void
}

export default function OrchestraForm({ orchestra, teachers, onSubmit, onCancel }: OrchestraFormProps) {
  const [formData, setFormData] = useState<OrchestraFormData>({
    name: '',
    type: 'תזמורת',
    conductorId: '',
    memberIds: [],
    location: 'חדר 1',
    isActive: true
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-populate form if editing existing orchestra
  useEffect(() => {
    if (orchestra) {
      setFormData({
        name: orchestra.name || '',
        type: orchestra.type || 'תזמורת',
        conductorId: orchestra.conductorId || '',
        memberIds: orchestra.memberIds || [],
        location: orchestra.location || 'חדר 1',
        isActive: orchestra.isActive !== undefined ? orchestra.isActive : true
      })
    }
  }, [orchestra])

  const handleInputChange = (field: keyof OrchestraFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    const validation = validateOrchestraForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)
    try {
      // Strip memberIds from submission — members are managed through
      // dedicated addMember/removeMember endpoints, not through the form
      const { memberIds, ...submitData } = formData
      await onSubmit(submitData as any)
    } catch (error: any) {
      console.error('Error submitting orchestra form:', error)
      const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(error, 'שגיאה בשמירת התזמורת')
      if (isValidationError) {
        setErrors({ ...fieldErrors, general: generalMessage })
      } else {
        setErrors({ general: generalMessage })
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter conductors (teachers with conductor role)
  const conductors = teachers.filter(teacher => 
    teacher.roles?.includes('מנצח') || 
    teacher.professionalInfo?.instrument === 'מנהיגות מוזיקלית' ||
    teacher.conducting?.orchestraIds?.length > 0
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Form Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {orchestra ? 'עריכת תזמורת' : 'תזמורת חדשה'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orchestra Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Music className="w-4 h-4 inline ml-1" />
                שם התזמורת *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="הזן שם לתזמורת"
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Orchestra Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג הרכב *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as OrchestraType)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 ${
                  errors.type ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              >
                {VALID_ORCHESTRA_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">{errors.type}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline ml-1" />
                מיקום חזרות *
              </label>
              <select
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value as LocationType)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 ${
                  errors.location ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              >
                {/* Group locations by category */}
                <optgroup label="אולמות">
                  {VALID_LOCATIONS.filter(loc => loc.includes('אולם')).map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </optgroup>
                
                <optgroup label="סטודיואים">
                  {VALID_LOCATIONS.filter(loc => loc.includes('סטודיו')).map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </optgroup>
                
                <optgroup label="חדרי חזרות">
                  {VALID_LOCATIONS.filter(loc => loc.includes('חדר חזרות')).map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </optgroup>
                
                <optgroup label="חדרי לימוד">
                  {VALID_LOCATIONS.filter(loc => 
                    loc.startsWith('חדר') && 
                    !loc.includes('חזרות') && 
                    !loc.includes('תאוריה')
                  ).map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </optgroup>
                
                <optgroup label="חדרי תיאוריה">
                  {VALID_LOCATIONS.filter(loc => loc.includes('תאוריה')).map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </optgroup>
                
                <optgroup label="אחר">
                  {VALID_LOCATIONS.filter(loc => 
                    !loc.includes('אולם') && 
                    !loc.includes('סטודיו') && 
                    !loc.includes('חדר')
                  ).map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </optgroup>
              </select>
              {errors.location && (
                <p className="text-red-500 text-xs mt-1">{errors.location}</p>
              )}
            </div>
          </div>

          {/* Conductor Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline ml-1" />
              מנצח *
            </label>
            <select
              value={formData.conductorId}
              onChange={(e) => handleInputChange('conductorId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.conductorId ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              <option value="">בחר מנצח</option>
              {conductors.map(conductor => (
                <option key={conductor._id} value={conductor._id}>
                  {conductor.personalInfo?.fullName}
                  {conductor.professionalInfo?.instrument && (
                    <span className="text-gray-500"> - {conductor.professionalInfo.instrument}</span>
                  )}
                </option>
              ))}
            </select>
            {errors.conductorId && (
              <p className="text-red-500 text-xs mt-1">{errors.conductorId}</p>
            )}
            
            {conductors.length === 0 && (
              <p className="text-orange-600 text-xs mt-1">
                ⚠️ לא נמצאו מורים עם תפקיד מנצח. ניתן להוסיף מורים חדשים בעמוד המורים.
              </p>
            )}
          </div>

          {/* Members Section - Read Only Display for Now */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline ml-1" />
              חברי התזמורת
            </label>
            
            {formData.memberIds.length > 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  {formData.memberIds.length} חברים בתזמורת
                </p>
                <p className="text-xs text-gray-500">
                  ניהול חברים יהיה זמין בעמוד הפרטים של התזמורת
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  📝 לאחר יצירת התזמורת, תוכל להוסיף חברים בעמוד הפרטים
                </p>
              </div>
            )}
          </div>

          {/* Orchestra Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="mr-2 text-sm text-gray-700">תזמורת פעילה</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              תזמורות לא פעילות לא יוצגו ברשימות הראשיות
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              {orchestra ? 'עדכן תזמורת' : 'צור תזמורת'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}