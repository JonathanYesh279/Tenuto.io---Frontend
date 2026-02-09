import React, { useState, useEffect } from 'react'
import { Edit, Save, X, User, MapPin, Music, Clock, Calendar } from 'lucide-react'
import { OrchestraTabProps } from '../../types'
import apiService from '../../../../../services/apiService'
import { useAuth } from '../../../../../services/authContext'
import { VALID_LOCATIONS } from '../../../../../constants/locations'

const PersonalInfoTab: React.FC<OrchestraTabProps> = ({
  orchestraId,
  orchestra,
  isLoading,
}) => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState(null)
  const [conductor, setConductor] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // Check if user can edit this orchestra
  const canEdit = () => {
    if (!user) return false
    
    // Admin can always edit
    if (user.roles?.includes('מנהל')) return true
    
    // Conductor of this specific orchestra can edit
    if (orchestra && user._id === orchestra.conductorId) {
      return user.roles?.includes('מנצח') || user.roles?.includes('מדריך הרכב')
    }
    
    return false
  }

  useEffect(() => {
    if (orchestra) {
      // Only include editable basic fields — memberIds and rehearsalIds are
      // managed through dedicated endpoints, not through the update form
      setEditedData({
        name: orchestra.name,
        type: orchestra.type,
        location: orchestra.location,
        conductorId: orchestra.conductorId,
        schoolYearId: orchestra.schoolYearId,
        isActive: orchestra.isActive,
      })
    }
  }, [orchestra])

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachersData = await apiService.teachers.getTeachers()
        setTeachers(teachersData || [])
        
        if (orchestra?.conductorId && teachersData) {
          const foundConductor = teachersData.find(t => t._id === orchestra.conductorId)
          setConductor(foundConductor)
        }
      } catch (error) {
        console.error('Error loading teachers:', error)
      }
    }

    loadTeachers()
  }, [orchestra?.conductorId])

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData({
      name: orchestra.name,
      type: orchestra.type,
      location: orchestra.location,
      conductorId: orchestra.conductorId,
      schoolYearId: orchestra.schoolYearId,
      isActive: orchestra.isActive,
    })
    setError(null)
  }

  const handleSave = async () => {
    if (!editedData || !orchestraId) return

    try {
      setIsSaving(true)
      setError(null)
      
      await apiService.orchestras.updateOrchestra(orchestraId, editedData)
      setIsEditing(false)
      
      // Refresh the page to get updated data
      window.location.reload()
    } catch (error) {
      console.error('Error updating orchestra:', error)
      setError('שגיאה בעדכון פרטי התזמורת')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!orchestra) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">לא נמצאו נתוני תזמורת</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">פרטי התזמורת</h3>
        {canEdit() && !isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center px-3 py-2 text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
          >
            <Edit className="w-4 h-4 ml-1" />
            ערוך
          </button>
        ) : canEdit() && isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 ml-1" />
              {isSaving ? 'שומר...' : 'שמור'}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 ml-1" />
              ביטול
            </button>
          </div>
        ) : null}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Orchestra Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם התזמורת
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData?.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            ) : (
              <div className="flex items-center">
                <Music className="w-5 h-5 text-gray-400 ml-2" />
                <span className="text-gray-900">{orchestra.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סוג הרכב
            </label>
            {isEditing ? (
              <select
                value={editedData?.type || ''}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">בחר סוג הרכב</option>
                <option value="הרכב">הרכב</option>
                <option value="תזמורת">תזמורת</option>
              </select>
            ) : (
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 ml-2" />
                <span className="text-gray-900">{orchestra.type}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מיקום
            </label>
            {isEditing ? (
              <select
                value={editedData?.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">בחר מיקום</option>
                {VALID_LOCATIONS.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 ml-2" />
                <span className="text-gray-900">{orchestra.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Conductor Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מנצח
            </label>
            {isEditing ? (
              <select
                value={editedData?.conductorId || ''}
                onChange={(e) => handleInputChange('conductorId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">בחר מנצח</option>
                {teachers
                  .filter(teacher => teacher.roles?.includes('מנצח') || teacher.roles?.includes('מדריך הרכב'))
                  .map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.personalInfo?.fullName}
                    </option>
                  ))}
              </select>
            ) : (
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 ml-2" />
                <div>
                  {conductor ? (
                    <div>
                      <span className="text-gray-900">{conductor.personalInfo?.fullName}</span>
                      {conductor.personalInfo?.email && (
                        <div className="text-sm text-gray-500">{conductor.personalInfo.email}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500">לא הוקצה מנצח</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סטטיסטיקות
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 ml-2" />
                <span className="text-gray-900">
                  {orchestra.memberIds?.length || 0} חברים
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 ml-2" />
                <span className="text-gray-900">
                  {orchestra.rehearsalIds?.length || 0} חזרות מתוכננות
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סטטוס
            </label>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ml-2 ${orchestra.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-900">
                {orchestra.isActive ? 'פעילה' : 'לא פעילה'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoTab