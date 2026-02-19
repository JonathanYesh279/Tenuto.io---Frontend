import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'

import { teacherService } from '../../services/apiService.js'
import type { TeacherProfile, TeacherProfileUpdateData } from '../../types/teacher.types'
import { getDisplayName, formatAddress } from '../../utils/nameUtils'
import { CalendarIcon, CheckCircleIcon, EnvelopeIcon, FloppyDiskIcon, MapPinIcon, PencilSimpleIcon, PhoneIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'

export default function GeneralInfoTab() {
  const { user, checkAuthStatus } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [profileData, setProfileData] = useState<TeacherProfile | null>(null)
  
  // State for edited fields - store as firstName + lastName
  const [editedUser, setEditedUser] = useState<TeacherProfileUpdateData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: ''
  })

  // Fetch fresh profile data on component mount
  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      const profile = await teacherService.getMyProfile()
      setProfileData(profile)
      
      // Initialize edited user state with fetched data
      const displayName = getDisplayName(profile?.personalInfo)
      setEditedUser({
        firstName: profile?.personalInfo?.firstName || displayName.split(' ')[0] || '',
        lastName: profile?.personalInfo?.lastName || displayName.split(' ').slice(1).join(' ') || '',
        email: profile?.personalInfo?.email || '',
        phone: profile?.personalInfo?.phone || '',
        address: formatAddress(profile?.personalInfo?.address),
        birthDate: profile?.personalInfo?.birthDate || ''
      })
    } catch (error) {
      console.error('Error fetching profile data:', error)
      setSaveStatus({ type: 'error', message: 'שגיאה בטעינת פרטי הפרופיל' })
      
      // Fall back to auth context user data if available
      if (user) {
        const fallbackName = getDisplayName(user?.personalInfo)
        setEditedUser({
          firstName: user?.personalInfo?.firstName || fallbackName.split(' ')[0] || '',
          lastName: user?.personalInfo?.lastName || fallbackName.split(' ').slice(1).join(' ') || '',
          email: user?.personalInfo?.email || user?.email || '',
          phone: user?.personalInfo?.phone || user?.phone || '',
          address: formatAddress(user?.personalInfo?.address || user?.address),
          birthDate: user?.personalInfo?.birthDate || user?.birthDate || ''
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setSaveStatus({ type: null, message: '' })
      
      // Call API to update profile
      const updatedProfile = await teacherService.updateMyProfile(editedUser)
      
      // Update local profile data
      setProfileData(updatedProfile)
      
      // Update auth context to reflect changes
      if (checkAuthStatus) {
        await checkAuthStatus(true) // Force refresh auth status
      }
      
      setIsEditing(false)
      setSaveStatus({ type: 'success', message: 'הפרופיל עודכן בהצלחה' })
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ type: null, message: '' })
      }, 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setSaveStatus({ type: 'error', message: 'שגיאה בעדכון הפרופיל. אנא נסה שוב.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values from profile data
    const currentData = profileData || user
    const cancelName = getDisplayName(currentData?.personalInfo)
    setEditedUser({
      firstName: currentData?.personalInfo?.firstName || cancelName.split(' ')[0] || '',
      lastName: currentData?.personalInfo?.lastName || cancelName.split(' ').slice(1).join(' ') || '',
      email: currentData?.personalInfo?.email || currentData?.email || '',
      phone: currentData?.personalInfo?.phone || currentData?.phone || '',
      address: formatAddress(currentData?.personalInfo?.address || currentData?.address),
      birthDate: currentData?.personalInfo?.birthDate || currentData?.birthDate || ''
    })
    setIsEditing(false)
    setSaveStatus({ type: null, message: '' })
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('he-IL')
  }

  // Use profile data if available, otherwise fall back to auth context user
  const displayData = profileData || user

  if (isLoading && !displayData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-reisinger-yonatan">טוען פרטי פרופיל...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {saveStatus.type && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          saveStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveStatus.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <WarningCircleIcon className="w-5 h-5" />
          )}
          <span className="font-reisinger-yonatan">{saveStatus.message}</span>
        </div>
      )}

      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
          פרטים אישיים
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PencilSimpleIcon className="w-4 h-4" />
            <span className="font-reisinger-yonatan">עריכה</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FloppyDiskIcon className="w-4 h-4" />
              )}
              <span className="font-reisinger-yonatan">שמירה</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XIcon className="w-4 h-4" />
              <span className="font-reisinger-yonatan">ביטול</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
            שם פרטי
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editedUser.firstName}
              onChange={(e) => setEditedUser(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir="rtl"
              placeholder="הזן שם פרטי"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="font-reisinger-yonatan">{editedUser.firstName || 'לא צוין'}</span>
            </div>
          )}
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
            שם משפחה
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editedUser.lastName}
              onChange={(e) => setEditedUser(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir="rtl"
              placeholder="הזן שם משפחה"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="font-reisinger-yonatan">{editedUser.lastName || 'לא צוין'}</span>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
            דוא"ל
          </label>
          {isEditing ? (
            <input
              type="email"
              value={editedUser.email}
              onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir="ltr"
              placeholder="example@email.com"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <EnvelopeIcon className="w-4 h-4 text-gray-500" />
              <span className="font-reisinger-yonatan" dir="ltr">{editedUser.email || 'לא צוין'}</span>
            </div>
          )}
        </div>

        {/* PhoneIcon */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
            טלפון
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={editedUser.phone}
              onChange={(e) => setEditedUser(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir="ltr"
              placeholder="050-1234567"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <PhoneIcon className="w-4 h-4 text-gray-500" />
              <span className="font-reisinger-yonatan" dir="ltr">{editedUser.phone || 'לא צוין'}</span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
            כתובת
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editedUser.address}
              onChange={(e) => setEditedUser(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir="rtl"
              placeholder="הזן כתובת"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <MapPinIcon className="w-4 h-4 text-gray-500" />
              <span className="font-reisinger-yonatan">{editedUser.address || 'לא צוין'}</span>
            </div>
          )}
        </div>

        {/* Birth Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
            תאריך לידה
          </label>
          {isEditing ? (
            <input
              type="date"
              value={editedUser.birthDate}
              onChange={(e) => setEditedUser(prev => ({ ...prev, birthDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <span className="font-reisinger-yonatan">{formatDate(editedUser.birthDate) || 'לא צוין'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Information (Read-only) */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-900 mb-2 font-reisinger-yonatan">
          מידע תפקיד
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-blue-700 font-reisinger-yonatan">תפקיד:</span>
            <div className="text-blue-900 font-reisinger-yonatan">
              {(() => {
                const roles = displayData?.roles || []
                if (roles.length > 0) {
                  return roles.join(', ')
                }
                const role = displayData?.role || ''
                // Handle both English and Hebrew role names from backend
                switch (role) {
                  case 'teacher': return 'מורה'
                  case 'מורה': return 'מורה'
                  case 'conductor': return 'מנצח'
                  case 'מנצח': return 'מנצח'
                  case 'theory_teacher': return 'מורה תיאוריה'
                  case 'מורה תיאוריה': return 'מורה תיאוריה'
                  case 'admin': return 'מנהל'
                  case 'מנהל': return 'מנהל'
                  default: return role || 'לא צוין'
                }
              })()}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-blue-700 font-reisinger-yonatan">מזהה משתמש:</span>
            <div className="text-blue-900 font-reisinger-yonatan font-mono text-sm">
              {displayData?.teacherId || displayData?._id || displayData?.id || 'לא צוין'}
            </div>
          </div>
          {displayData?.isActive !== undefined && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-blue-700 font-reisinger-yonatan">סטטוס:</span>
              <div className="text-blue-900 font-reisinger-yonatan">
                {displayData.isActive ? 'פעיל' : 'לא פעיל'}
              </div>
            </div>
          )}
          {displayData?.professionalInfo?.instrument && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-blue-700 font-reisinger-yonatan">כלי נגינה:</span>
              <div className="text-blue-900 font-reisinger-yonatan">
                {displayData.professionalInfo.instrument}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}