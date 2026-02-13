/**
 * Personal Info Tab Component (Simplified)
 * 
 * Displays ONLY actual backend fields - aligned with schema
 * Fields: firstName, lastName, phone, age, address, parentName, parentPhone, parentEmail, studentEmail
 */

import { useState, useEffect } from 'react'
import { User, Phone, Mail, MapPin, Edit, Save, X } from 'lucide-react'
import apiService from '../../../../../services/apiService'
import { getDisplayName, formatAddress } from '../../../../../utils/nameUtils'

interface PersonalInfoTabProps {
  student: any
  studentId: string
  isLoading?: boolean
  onStudentUpdate?: (updatedStudent: any) => void
}

const PersonalInfoTabSimple: React.FC<PersonalInfoTabProps> = ({ student, studentId, isLoading, onStudentUpdate }) => {
  const personalInfo = student?.personalInfo || {}
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedData, setEditedData] = useState({
    firstName: personalInfo.firstName || '',
    lastName: personalInfo.lastName || '',
    phone: personalInfo.phone || '',
    age: personalInfo.age || '',
    address: formatAddress(personalInfo.address),
    parentName: personalInfo.parentName || '',
    parentPhone: personalInfo.parentPhone || '',
    parentEmail: personalInfo.parentEmail || '',
    studentEmail: personalInfo.studentEmail || '',
  })

  // Update editedData when student data changes
  useEffect(() => {
    setEditedData({
      firstName: personalInfo.firstName || '',
      lastName: personalInfo.lastName || '',
      phone: personalInfo.phone || '',
      age: personalInfo.age || '',
      address: formatAddress(personalInfo.address),
      parentName: personalInfo.parentName || '',
      parentPhone: personalInfo.parentPhone || '',
      parentEmail: personalInfo.parentEmail || '',
      studentEmail: personalInfo.studentEmail || '',
    })
  }, [personalInfo])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const updatedStudent = await apiService.students.updateStudent(studentId, {
        personalInfo: editedData
      })
      
      if (onStudentUpdate) {
        onStudentUpdate(updatedStudent)
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving student personal info:', error)
      
      // Provide more specific error messages
      let errorMessage = 'שגיאה בשמירת הנתונים'
      
      if (error.message.includes('Authentication failed')) {
        errorMessage = 'פג תוקף הפנייה. אנא התחבר מחדש.'
      } else if (error.message.includes('validation')) {
        errorMessage = 'שגיאה בנתונים שהוזנו. אנא בדוק את הפרטים האישיים.'
      } else if (error.message.includes('not found')) {
        errorMessage = 'התלמיד לא נמצא במערכת.'
      } else if (error.message.includes('Network')) {
        errorMessage = 'שגיאת רשת. אנא בדוק את החיבור לאינטרנט.'
      }
      
      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData({
      firstName: personalInfo.firstName || '',
      lastName: personalInfo.lastName || '',
      phone: personalInfo.phone || '',
      age: personalInfo.age || '',
      address: formatAddress(personalInfo.address),
      parentName: personalInfo.parentName || '',
      parentPhone: personalInfo.parentPhone || '',
      parentEmail: personalInfo.parentEmail || '',
      studentEmail: personalInfo.studentEmail || '',
    })
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header with Edit Button */}
      <div className="flex justify-end">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
            ערוך
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'שומר...' : 'שמור'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              בטל
            </button>
          </div>
        )}
      </div>

      {/* Student Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">פרטי תלמיד</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם פרטי</label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.firstName}
                onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס שם פרטי"
              />
            ) : (
              <div className="text-gray-900 text-lg font-medium">{personalInfo.firstName || 'לא צוין'}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם משפחה</label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.lastName}
                onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס שם משפחה"
              />
            ) : (
              <div className="text-gray-900 text-lg font-medium">{personalInfo.lastName || 'לא צוין'}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
            {isEditing ? (
              <input
                type="tel"
                value={editedData.phone}
                onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס מספר טלפון"
              />
            ) : (
              <div className="text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                {personalInfo.phone || 'לא צוין'}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">גיל</label>
            {isEditing ? (
              <input
                type="number"
                value={editedData.age}
                onChange={(e) => setEditedData({ ...editedData, age: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס גיל"
                min="1"
                max="99"
              />
            ) : (
              <div className="text-gray-900">{personalInfo.age || 'לא צוין'}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">אימייל תלמיד</label>
            {isEditing ? (
              <input
                type="email"
                value={editedData.studentEmail}
                onChange={(e) => setEditedData({ ...editedData, studentEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס כתובת דוא״ל תלמיד"
              />
            ) : (
              <div className="text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                {personalInfo.studentEmail || 'לא צוין'}
              </div>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">כתובת</label>
            {isEditing ? (
              <textarea
                value={editedData.address}
                onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס כתובת מגורים"
                rows={2}
              />
            ) : (
              <div className="text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                {formatAddress(personalInfo.address) || 'לא צוין'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Parent Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">פרטי הורה</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם הורה</label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.parentName}
                onChange={(e) => setEditedData({ ...editedData, parentName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס שם הורה"
              />
            ) : (
              <div className="text-gray-900">{personalInfo.parentName || 'לא צוין'}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">טלפון הורה</label>
            {isEditing ? (
              <input
                type="tel"
                value={editedData.parentPhone}
                onChange={(e) => setEditedData({ ...editedData, parentPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס מספר טלפון הורה"
              />
            ) : (
              <div className="text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                {personalInfo.parentPhone || 'לא צוין'}
              </div>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">אימייל הורה</label>
            {isEditing ? (
              <input
                type="email"
                value={editedData.parentEmail}
                onChange={(e) => setEditedData({ ...editedData, parentEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס כתובת דוא״ל הורה"
              />
            ) : (
              <div className="text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                {personalInfo.parentEmail || 'לא צוין'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoTabSimple