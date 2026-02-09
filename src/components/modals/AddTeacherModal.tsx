/**
 * Add Teacher Modal Component
 * 
 * A comprehensive form for creating new teachers with all required fields
 * including personal info, roles, professional info, and schedule slots.
 * Only accessible by admin users.
 */

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Clock, MapPin, Save, AlertCircle, User, Briefcase, Calendar, Settings } from 'lucide-react'
import apiService from '../../services/apiService'
import { useSchoolYear } from '../../services/schoolYearContext'
import { VALID_LOCATIONS } from '../../constants/locations'
import { handleServerValidationError } from '../../utils/validationUtils'

interface AddTeacherModalProps {
  isOpen: boolean
  onClose: () => void
  onTeacherAdded: (teacher: any) => void
  teacherToEdit?: any // If provided, modal opens in edit mode
  mode?: 'add' | 'edit' // Mode of the modal
}

interface ScheduleSlot {
  day: string
  startTime: string
  endTime: string
  location: string
  notes: string
}

interface TeacherFormData {
  personalInfo: {
    firstName: string
    lastName: string
    phone: string
    email: string
    address: string
  }
  roles: string[]
  professionalInfo: {
    instrument: string
    isActive: boolean
  }
  teaching: {
    schedule: ScheduleSlot[]
  }
  conducting: {
    orchestraIds: string[]
  }
  ensemblesIds: string[]
}

const VALID_ROLES = ['מורה', 'מנצח', 'מדריך הרכב', 'מנהל', 'מורה תאוריה', 'מגמה']
const VALID_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']
const INSTRUMENTS = [
  'חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט',
  'חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון', 'שירה',
  'כינור', 'ויולה', "צ'לו", 'קונטרבס', 'פסנתר', 'גיטרה',
  'אורגן', 'חרמוניקה', 'מנדולינה', 'כינור בארוק', 'ויולה דה גמבה',
  'פלוטה רקורדר', 'אוקרינה', 'חליל פאן', 'דולצימר', 'אוטו-הרפ',
  'פסנתר אלקטרוני', 'גיטרה בס', 'גיטרה אקוסטית', 'גיטרה קלאסית',
  'בנג׳ו', 'חליל אירי', 'כינור קלטי', 'בודהראן'
]

// Helper function to calculate duration in minutes from start and end time
const calculateDuration = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0
  
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  
  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes
  
  // Handle case where end time is before start time (invalid)
  if (endTotalMinutes <= startTotalMinutes) {
    return 0
  }
  
  return endTotalMinutes - startTotalMinutes
}

// Helper function to validate time range
const validateTimeRange = (startTime: string, endTime: string): string | null => {
  if (!startTime || !endTime) return null
  
  const duration = calculateDuration(startTime, endTime)
  
  if (duration <= 0) {
    return 'שעת הסיום חייבת להיות אחרי שעת ההתחלה'
  }
  
  if (duration < 30) {
    return 'יום לימוד חייב להיות לפחות 30 דקות'
  }
  
  if (duration > 480) { // 8 hours
    return 'יום לימוד לא יכול להיות יותר מ-8 שעות'
  }
  
  return null
}

const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ isOpen, onClose, onTeacherAdded, teacherToEdit, mode = 'add' }) => {
  const { currentSchoolYear } = useSchoolYear()
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'schedule' | 'conducting'>('personal')
  const [formData, setFormData] = useState<TeacherFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: ''
    },
    roles: [],
    professionalInfo: {
      instrument: '',
      isActive: true
    },
    teaching: {
      schedule: []
    },
    conducting: {
      orchestraIds: []
    },
    ensemblesIds: []
  })
  const [orchestras, setOrchestras] = useState<any[]>([])
  const [ensembles, setEnsembles] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  // Load teacher data when editing
  useEffect(() => {
    if (isOpen && mode === 'edit' && teacherToEdit) {
      loadTeacherData(teacherToEdit)
    } else if (isOpen && mode === 'add') {
      resetForm()
    }
  }, [isOpen, mode, teacherToEdit])

  // Load orchestras and ensembles for conducting tab
  useEffect(() => {
    if (isOpen) {
      loadOrchestrasAndEnsembles()
    }
  }, [isOpen])

  const loadOrchestrasAndEnsembles = async () => {
    try {
      const [orchestraData, ensembleData] = await Promise.all([
        apiService.orchestras.getOrchestras(),
        apiService.orchestras.getOrchestras({ type: 'ensemble' })
      ])
      setOrchestras(orchestraData || [])
      setEnsembles(ensembleData || [])
    } catch (error) {
      console.error('Failed to load orchestras/ensembles:', error)
    }
  }

  const loadTeacherData = (teacher: any) => {
    // Load time blocks (availability windows) for editing
    const timeBlocksForForm = (teacher.teaching?.timeBlocks || []).map((block: any) => ({
      day: block.day,
      startTime: block.startTime,
      endTime: block.endTime,
      location: block.location || '',
      notes: block.notes || ''
    }))

    setFormData({
      personalInfo: {
        firstName: teacher.personalInfo?.firstName || '',
        lastName: teacher.personalInfo?.lastName || '',
        phone: teacher.personalInfo?.phone || '',
        email: teacher.personalInfo?.email || '',
        address: teacher.personalInfo?.address || ''
      },
      roles: teacher.roles || [],
      professionalInfo: {
        instrument: teacher.professionalInfo?.instrument || '',
        isActive: teacher.professionalInfo?.isActive ?? true
      },
      teaching: {
        schedule: timeBlocksForForm
      },
      conducting: {
        orchestraIds: teacher.conducting?.orchestraIds || []
      },
      ensemblesIds: teacher.ensemblesIds || []
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Personal Info validation
    if (!formData.personalInfo.firstName.trim()) {
      newErrors['personalInfo.firstName'] = 'שם פרטי נדרש'
    }
    if (!formData.personalInfo.lastName.trim()) {
      newErrors['personalInfo.lastName'] = 'שם משפחה נדרש'
    }
    if (!formData.personalInfo.phone.match(/^05\d{8}$/)) {
      newErrors['personalInfo.phone'] = 'מספר טלפון חייב להיות בפורמט: 05XXXXXXXX'
    }
    if (!formData.personalInfo.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors['personalInfo.email'] = 'כתובת אימייל לא תקינה'
    }
    if (!formData.personalInfo.address.trim()) {
      newErrors['personalInfo.address'] = 'כתובת נדרשת'
    }

    // Roles validation
    if (formData.roles.length === 0) {
      newErrors['roles'] = 'יש לבחור לפחות תפקיד אחד'
    }

    // Professional Info validation
    const hasTeacherRole = formData.roles.includes('מורה') || 
                          formData.roles.includes('מגמה') ||
                          !formData.roles.includes('מורה תאוריה')
    if (hasTeacherRole && !formData.professionalInfo.instrument) {
      newErrors['professionalInfo.instrument'] = 'יש לבחור כלי נגינה'
    }

    // Schedule validation
    formData.teaching.schedule.forEach((slot, index) => {
      if (!slot.startTime) {
        newErrors[`schedule.${index}.startTime`] = 'שעת התחלה נדרשת'
      }
      if (!slot.endTime) {
        newErrors[`schedule.${index}.endTime`] = 'שעת סיום נדרשת'
      }
      if (!slot.location) {
        newErrors[`schedule.${index}.location`] = 'יש לבחור מיקום'
      } else if (!VALID_LOCATIONS.includes(slot.location)) {
        newErrors[`schedule.${index}.location`] = 'מיקום לא תקין'
      }
      if (slot.startTime && slot.endTime) {
        const error = validateTimeRange(slot.startTime, slot.endTime)
        if (error) {
          newErrors[`schedule.${index}.timeRange`] = error
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof TeacherFormData],
        [field]: value
      }
    }))
    
    // Clear related errors
    const errorKey = `${section}.${field}`
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  const handleRoleChange = (role: string, checked: boolean) => {
    const newRoles = checked
      ? [...formData.roles, role]
      : formData.roles.filter(r => r !== role)
    
    setFormData(prev => ({ ...prev, roles: newRoles }))
    
    // Clear roles error
    if (errors['roles']) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors['roles']
        return newErrors
      })
    }
  }

  const addScheduleSlot = () => {
    const newSlot: ScheduleSlot = {
      day: 'ראשון',
      startTime: '14:00',
      endTime: '15:30',
      location: '',
      notes: ''
    }
    
    setFormData(prev => ({
      ...prev,
      teaching: {
        ...prev.teaching,
        schedule: [...prev.teaching.schedule, newSlot]
      }
    }))
  }

  const removeScheduleSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      teaching: {
        ...prev.teaching,
        schedule: prev.teaching.schedule.filter((_, i) => i !== index)
      }
    }))
  }

  const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, value: any) => {
    setFormData(prev => ({
      ...prev,
      teaching: {
        ...prev.teaching,
        schedule: prev.teaching.schedule.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      // Convert form schedule entries to timeBlocks format
      const newTimeBlocks = formData.teaching.schedule.map(slot => ({
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        totalDuration: calculateDuration(slot.startTime, slot.endTime),
        location: slot.location || null,
        notes: slot.notes || null,
        isActive: true,
        assignedLessons: [],
        recurring: {
          isRecurring: true,
          excludeDates: []
        }
      }))

      // When editing, preserve existing timeBlocks with their assigned lessons
      let finalTimeBlocks = newTimeBlocks
      if (mode === 'edit' && teacherToEdit) {
        const existingBlocksWithLessons = (teacherToEdit.teaching?.timeBlocks || []).filter(
          (block: any) => block.assignedLessons && block.assignedLessons.length > 0
        )
        console.log(`📋 Preserving ${existingBlocksWithLessons.length} existing timeBlocks with lessons`)
        finalTimeBlocks = [...newTimeBlocks, ...existingBlocksWithLessons]
      }

      // Prepare teacher data according to backend schema
      const teacherData = {
        personalInfo: formData.personalInfo,
        roles: formData.roles,
        professionalInfo: formData.professionalInfo,
        teaching: {
          studentIds: teacherToEdit?.teaching?.studentIds || [],
          timeBlocks: finalTimeBlocks
        },
        conducting: formData.conducting,
        ensemblesIds: formData.ensemblesIds,
        schoolYears: currentSchoolYear ? [{
          schoolYearId: currentSchoolYear._id,
          isActive: true
        }] : [],
        credentials: {
          email: formData.personalInfo.email,
          password: null, // Will be set through invitation system
          isInvitationAccepted: false
        },
        isActive: true
      }

      if (mode === 'edit' && teacherToEdit) {
        // Update existing teacher
        console.log('🔄 Updating teacher with preserved lessons:', teacherData)
        const updatedTeacher = await apiService.teachers.updateTeacher(teacherToEdit._id, teacherData)
        console.log('✅ Teacher updated successfully:', updatedTeacher)
        onTeacherAdded(updatedTeacher)
      } else {
        // Create new teacher
        console.log('🔄 Creating teacher:', teacherData)
        const newTeacher = await apiService.teachers.addTeacher(teacherData)
        console.log('✅ Teacher created successfully:', newTeacher)
        onTeacherAdded(newTeacher)
      }

      resetForm()
      onClose()
    } catch (error: any) {
      console.error(`❌ Failed to ${mode === 'edit' ? 'update' : 'create'} teacher:`, error)

      // Handle validation errors with field-level details using utility function
      const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(
        error,
        `שגיאה ב${mode === 'edit' ? 'עדכון' : 'יצירת'} המורה. נסה שוב.`
      )

      if (isValidationError) {
        setErrors(fieldErrors)
      }
      setSubmitError(generalMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      personalInfo: {
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: ''
      },
      roles: [],
      professionalInfo: {
        instrument: '',
        isActive: true
      },
      teaching: {
        schedule: []
      },
      conducting: {
        orchestraIds: []
      },
      ensemblesIds: []
    })
    setActiveTab('personal')
    setErrors({})
    setSubmitError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'personal', label: 'מידע אישי', icon: User },
    { id: 'professional', label: 'מידע מקצועי', icon: Briefcase },
    { id: 'schedule', label: 'לוח זמנים', icon: Calendar },
    { id: 'conducting', label: 'ניצוח', icon: Settings }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'edit' ? 'עריכת פרטי מורה' : 'הוספת מורה חדש'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שם פרטי *
                    </label>
                    <input
                      type="text"
                      value={formData.personalInfo.firstName}
                      onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-500 bg-white ${
                        errors['personalInfo.firstName']
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-primary-500'
                      }`}
                      placeholder="הכנס שם פרטי"
                    />
                    {errors['personalInfo.firstName'] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors['personalInfo.firstName']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שם משפחה *
                    </label>
                    <input
                      type="text"
                      value={formData.personalInfo.lastName}
                      onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-500 bg-white ${
                        errors['personalInfo.lastName']
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-primary-500'
                      }`}
                      placeholder="הכנס שם משפחה"
                    />
                    {errors['personalInfo.lastName'] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors['personalInfo.lastName']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      טלפון *
                    </label>
                    <input
                      type="tel"
                      value={formData.personalInfo.phone}
                      onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-500 bg-white ${
                        errors['personalInfo.phone']
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-primary-500'
                      }`}
                      placeholder="05XXXXXXXX"
                    />
                    {errors['personalInfo.phone'] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors['personalInfo.phone']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      אימייל *
                    </label>
                    <input
                      type="email"
                      value={formData.personalInfo.email}
                      onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-500 bg-white ${
                        errors['personalInfo.email']
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-primary-500'
                      }`}
                      placeholder="teacher@example.com"
                    />
                    {errors['personalInfo.email'] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors['personalInfo.email']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      כתובת *
                    </label>
                    <input
                      type="text"
                      value={formData.personalInfo.address}
                      onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-500 bg-white ${
                        errors['personalInfo.address']
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-primary-500'
                      }`}
                      placeholder="רחוב מספר, עיר"
                    />
                    {errors['personalInfo.address'] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors['personalInfo.address']}</p>
                    )}
                  </div>
                </div>

                {/* Roles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    תפקידים *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {VALID_ROLES.map(role => (
                      <label key={role} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(role)}
                          onChange={(e) => handleRoleChange(role, e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                        />
                        <span className="mr-3 text-sm text-gray-700 font-medium">{role}</span>
                      </label>
                    ))}
                  </div>
                  {errors['roles'] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors['roles']}</p>
                  )}
                </div>
              </div>
            )}

            {/* Professional Info Tab */}
            {activeTab === 'professional' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    כלי נגינה {!formData.roles.includes('מורה תאוריה') && '*'}
                  </label>
                  <select
                    value={formData.professionalInfo.instrument}
                    onChange={(e) => handleInputChange('professionalInfo', 'instrument', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      errors['professionalInfo.instrument']
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    disabled={formData.roles.includes('מורה תאוריה') && formData.roles.length === 1}
                  >
                    <option value="">בחר כלי נגינה</option>
                    {INSTRUMENTS.map(instrument => (
                      <option key={instrument} value={instrument}>{instrument}</option>
                    ))}
                  </select>
                  {errors['professionalInfo.instrument'] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors['professionalInfo.instrument']}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.professionalInfo.isActive}
                      onChange={(e) => handleInputChange('professionalInfo', 'isActive', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">מורה פעיל</span>
                  </label>
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">בלוקי זמן להוראה</h3>
                  <button
                    type="button"
                    onClick={addScheduleSlot}
                    className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף בלוק זמן
                  </button>
                </div>

                {formData.teaching.schedule.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>לא הוגדרו בלוקי זמן</p>
                    <p className="text-sm">הוסף בלוק זמן כדי לקבוע מתי המורה זמין להוראה</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.teaching.schedule.map((slot, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              יום
                            </label>
                            <select
                              value={slot.day}
                              onChange={(e) => updateScheduleSlot(index, 'day', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                            >
                              {VALID_DAYS.map(day => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              שעת התחלה
                            </label>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateScheduleSlot(index, 'startTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              שעת סיום
                            </label>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateScheduleSlot(index, 'endTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                            />
                            {/* Show duration and validation */}
                            {slot.startTime && slot.endTime && (
                              <div className="mt-1 text-xs">
                                {(() => {
                                  const duration = calculateDuration(slot.startTime, slot.endTime)
                                  const error = validateTimeRange(slot.startTime, slot.endTime)
                                  
                                  if (error) {
                                    return <span className="text-red-600">{error}</span>
                                  } else if (duration > 0) {
                                    return <span className="text-gray-500">משך: {duration} דקות</span>
                                  }
                                  return null
                                })()}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              מיקום
                            </label>
                            <select
                              value={slot.location}
                              onChange={(e) => updateScheduleSlot(index, 'location', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white ${
                                errors[`schedule.${index}.location`] 
                                  ? 'border-red-300 focus:ring-red-500' 
                                  : 'border-gray-300'
                              }`}
                            >
                              <option value="">בחר מיקום...</option>
                              {VALID_LOCATIONS.map(location => (
                                <option key={location} value={location}>{location}</option>
                              ))}
                            </select>
                            {errors[`schedule.${index}.location`] && (
                              <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[`schedule.${index}.location`]}</p>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            הערות
                          </label>
                          <input
                            type="text"
                            value={slot.notes}
                            onChange={(e) => updateScheduleSlot(index, 'notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder-gray-500 bg-white"
                            placeholder="הערות נוספות"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeScheduleSlot(index)}
                            className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 ml-1" />
                            הסר
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Conducting Tab */}
            {activeTab === 'conducting' && (
              <div className="space-y-8">
                {/* Orchestra Section */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Settings className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <label className="block text-lg font-semibold text-gray-900">
                        תזמורות לניצוח
                      </label>
                      <p className="text-sm text-gray-600">בחר את התזמורות שהמורה ינצח</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                    {orchestras.map(orchestra => (
                      <label key={orchestra._id} className="flex items-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.conducting.orchestraIds.includes(orchestra._id)}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...formData.conducting.orchestraIds, orchestra._id]
                              : formData.conducting.orchestraIds.filter(id => id !== orchestra._id)
                            handleInputChange('conducting', 'orchestraIds', newIds)
                          }}
                          className="rounded-lg border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
                        />
                        <div className="mr-4 flex-1">
                          <div className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{orchestra.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{orchestra.description || 'תזמורת ללא תיאור'}</div>
                          {orchestra.memberCount && (
                            <div className="text-xs text-purple-600 mt-1">👥 {orchestra.memberCount} חברים</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Ensemble Section */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <label className="block text-lg font-semibold text-gray-900">
                        אנסמבלים להדרכה
                      </label>
                      <p className="text-sm text-gray-600">בחר את האנסמבלים שהמורה ידריך</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                    {ensembles.map(ensemble => (
                      <label key={ensemble._id} className="flex items-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.ensemblesIds.includes(ensemble._id)}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...formData.ensemblesIds, ensemble._id]
                              : formData.ensemblesIds.filter(id => id !== ensemble._id)
                            setFormData(prev => ({ ...prev, ensemblesIds: newIds }))
                          }}
                          className="rounded-lg border-gray-300 text-green-600 focus:ring-green-500 w-5 h-5"
                        />
                        <div className="mr-4 flex-1">
                          <div className="text-base font-semibold text-gray-900 group-hover:text-green-700 transition-colors">{ensemble.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{ensemble.description || 'אנסמבל ללא תיאור'}</div>
                          {ensemble.memberCount && (
                            <div className="text-xs text-green-600 mt-1">🎵 {ensemble.memberCount} חברים</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{submitError}</span>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                {isSubmitting ? 'שומר...' : (mode === 'edit' ? 'עדכן מורה' : 'שמור מורה')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTeacherModal