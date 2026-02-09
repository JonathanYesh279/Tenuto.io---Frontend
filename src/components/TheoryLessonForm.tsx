import { useState, useEffect } from 'react'
import { X, Save, Clock, MapPin, Users, BookOpen, Calendar, Repeat } from 'lucide-react'
import { teacherService, schoolYearService } from '../services/apiService'
import { VALID_LOCATIONS } from '../constants/locations'
import { handleServerValidationError } from '../utils/validationUtils'

interface TheoryLessonFormProps {
  theoryLesson?: any
  theoryLessons?: any[] // For bulk editing multiple lessons
  teachers?: any[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  mode?: 'create' | 'edit' | 'bulk-edit'
}

export default function TheoryLessonForm({ 
  theoryLesson, 
  theoryLessons, 
  teachers: propTeachers, 
  onSubmit, 
  onCancel, 
  mode = 'create'
}: TheoryLessonFormProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  const [formData, setFormData] = useState({
    category: 'מגמה',
    teacherId: '',
    date: '',
    dayOfWeek: 0,
    startTime: '14:00',
    endTime: '15:00',
    location: 'אולם ערן',
    studentIds: [],
    attendance: { present: [], absent: [] },
    notes: '',
    syllabus: '',
    homework: '',
    schoolYearId: ''
  })

  // Bulk creation data
  const [bulkFormData, setBulkFormData] = useState({
    category: 'מגמה',
    teacherId: '',
    startDate: '',
    endDate: '',
    dayOfWeek: 0,
    startTime: '14:00',
    endTime: '15:00',
    location: 'אולם ערן',
    studentIds: [],
    notes: '',
    syllabus: '',
    excludeDates: [] as string[],
    schoolYearId: ''
  })

  const [teachers, setTeachers] = useState(propTeachers || [])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Theory lesson categories from backend schema
  const categories = [
    'תלמידים חדשים ב-ד',
    'מתחילים',
    'מתחילים ב',
    'מתחילים ד',
    'מתקדמים ב',
    'מתקדמים א',
    'מתקדמים ג',
    'תלמידים חדשים בוגרים (ה - ט)',
    'תלמידים חדשים צעירים',
    'הכנה לרסיטל קלאסי יא',
    "הכנה לרסיטל רוק\\פופ\\ג'אז יא",
    "הכנה לרסיטל רוק\\פופ\\ג'אז יב",
    'מגמה',
    'תאוריה כלי',
  ]


  const DAYS_OF_WEEK = {
    0: 'ראשון',
    1: 'שני',
    2: 'שלישי',
    3: 'רביעי',
    4: 'חמישי',
    5: 'שישי',
    6: 'שבת'
  }

  // Load teachers and current school year on component mount
  useEffect(() => {
    if (!propTeachers) {
      loadTeachers()
    }
    loadCurrentSchoolYear()
  }, [propTeachers])

  // Pre-populate form data based on mode
  useEffect(() => {
    if (mode === 'edit' && theoryLesson) {
      // Single lesson edit mode
      const lessonDate = new Date(theoryLesson.date)
      setFormData({
        category: theoryLesson.category || 'מגמה',
        teacherId: theoryLesson.teacherId || '',
        date: theoryLesson.date ? new Date(theoryLesson.date).toISOString().split('T')[0] : '',
        dayOfWeek: theoryLesson.dayOfWeek !== undefined ? theoryLesson.dayOfWeek : lessonDate.getDay(),
        startTime: theoryLesson.startTime || '14:00',
        endTime: theoryLesson.endTime || '15:00',
        location: theoryLesson.location || 'אולם ערן',
        studentIds: theoryLesson.studentIds || [],
        attendance: theoryLesson.attendance || { present: [], absent: [] },
        notes: theoryLesson.notes || '',
        syllabus: theoryLesson.syllabus || '',
        homework: theoryLesson.homework || '',
        schoolYearId: theoryLesson.schoolYearId || ''
      })
      // Set bulk form for consistency
      setBulkFormData(prev => ({
        ...prev,
        category: theoryLesson.category || 'מגמה',
        teacherId: theoryLesson.teacherId || '',
        location: theoryLesson.location || 'אולם ערן',
        startTime: theoryLesson.startTime || '14:00',
        endTime: theoryLesson.endTime || '15:00',
        notes: theoryLesson.notes || '',
        syllabus: theoryLesson.syllabus || '',
        schoolYearId: theoryLesson.schoolYearId || ''
      }))
    } else if (mode === 'bulk-edit' && theoryLessons && theoryLessons.length > 0) {
      // Bulk edit mode - populate with common values
      const firstLesson = theoryLessons[0]
      
      // Find common values across all lessons
      const commonCategory = theoryLessons.every(l => l.category === firstLesson.category) ? firstLesson.category : ''
      const commonTeacherId = theoryLessons.every(l => l.teacherId === firstLesson.teacherId) ? firstLesson.teacherId : ''
      const commonLocation = theoryLessons.every(l => l.location === firstLesson.location) ? firstLesson.location : ''
      const commonStartTime = theoryLessons.every(l => l.startTime === firstLesson.startTime) ? firstLesson.startTime : ''
      const commonEndTime = theoryLessons.every(l => l.endTime === firstLesson.endTime) ? firstLesson.endTime : ''
      const commonNotes = theoryLessons.every(l => l.notes === firstLesson.notes) ? firstLesson.notes : ''
      const commonSyllabus = theoryLessons.every(l => l.syllabus === firstLesson.syllabus) ? firstLesson.syllabus : ''
      
      setBulkFormData({
        category: commonCategory || 'מגמה',
        teacherId: commonTeacherId || '',
        startDate: '',
        endDate: '',
        dayOfWeek: 0,
        startTime: commonStartTime || '14:00',
        endTime: commonEndTime || '15:00',
        location: commonLocation || 'אולם ערן',
        studentIds: [],
        notes: commonNotes || '',
        syllabus: commonSyllabus || '',
        excludeDates: [],
        schoolYearId: firstLesson.schoolYearId || ''
      })
    }
  }, [theoryLesson, theoryLessons, mode])

  const loadTeachers = async () => {
    try {
      const teachersData = await teacherService.getTeachers()
      // Filter teachers to show only those with "מורה תאוריה" role
      const theoryTeachers = teachersData.filter(teacher => 
        teacher.roles && teacher.roles.includes('מורה תאוריה')
      )
      setTeachers(theoryTeachers)
    } catch (error) {
      console.error('Error loading teachers:', error)
    }
  }

  const loadCurrentSchoolYear = async () => {
    try {
      const currentSchoolYear = await schoolYearService.getCurrentSchoolYear()
      if (currentSchoolYear) {
        // Set school year for both forms
        if (!formData.schoolYearId) {
          setFormData(prev => ({
            ...prev,
            schoolYearId: currentSchoolYear._id
          }))
        }
        if (!bulkFormData.schoolYearId) {
          setBulkFormData(prev => ({
            ...prev,
            schoolYearId: currentSchoolYear._id
          }))
        }
      }
    } catch (error) {
      console.error('Error loading current school year:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (mode === 'edit' || (mode === 'create' && activeTab === 'single')) {
      // Handle single form data (edit mode or single create)
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))

      // Auto-calculate dayOfWeek when date changes
      if (field === 'date' && value) {
        const date = new Date(value)
        const dayOfWeek = date.getDay()
        setFormData(prev => ({
          ...prev,
          date: value,
          dayOfWeek
        }))
      }
    } else {
      // Handle bulk form data (bulk-edit or bulk-create)
      setBulkFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleExcludeDateToggle = (date: string) => {
    setBulkFormData(prev => ({
      ...prev,
      excludeDates: prev.excludeDates.includes(date)
        ? prev.excludeDates.filter(d => d !== date)
        : [...prev.excludeDates, date]
    }))
  }

  const validateForm = (): boolean => {
    if (activeTab === 'single') {
      if (!formData.category.trim()) {
        setError('יש לבחור קטגוריה לשיעור')
        return false
      }

      if (!formData.teacherId) {
        setError('יש לבחור מורה לשיעור')
        return false
      }

      if (!formData.date) {
        setError('יש לבחור תאריך לשיעור')
        return false
      }

      if (!formData.startTime || !formData.endTime) {
        setError('יש להזין שעות התחלה וסיום')
        return false
      }

      if (!formData.location.trim()) {
        setError('יש להזין מיקום לשיעור')
        return false
      }

      // Validate time logic
      const startTime = formData.startTime.split(':').map(Number)
      const endTime = formData.endTime.split(':').map(Number)
      const startMinutes = startTime[0] * 60 + startTime[1]
      const endMinutes = endTime[0] * 60 + endTime[1]
      
      if (endMinutes <= startMinutes) {
        setError('שעת הסיום חייבת להיות אחרי שעת ההתחלה')
        return false
      }
    } else {
      // Validate bulk form
      if (!bulkFormData.category.trim()) {
        setError('יש לבחור קטגוריה לשיעורים')
        return false
      }

      if (!bulkFormData.teacherId) {
        setError('יש לבחור מורה לשיעורים')
        return false
      }

      if (!bulkFormData.startDate || !bulkFormData.endDate) {
        setError('יש לבחור תאריכי התחלה וסיום')
        return false
      }

      if (!bulkFormData.startTime || !bulkFormData.endTime) {
        setError('יש להזין שעות התחלה וסיום')
        return false
      }

      if (!bulkFormData.location.trim()) {
        setError('יש להזין מיקום לשיעורים')
        return false
      }

      if (bulkFormData.dayOfWeek < 0 || bulkFormData.dayOfWeek > 6) {
        setError('יש לבחור יום בשבוע')
        return false
      }

      if (!bulkFormData.schoolYearId) {
        setError('יש לבחור שנת לימודים')
        return false
      }

      // Validate date range
      if (new Date(bulkFormData.endDate) <= new Date(bulkFormData.startDate)) {
        setError('תאריך הסיום חייב להיות אחרי תאריך ההתחלה')
        return false
      }

      // Validate time logic
      const startTime = bulkFormData.startTime.split(':').map(Number)
      const endTime = bulkFormData.endTime.split(':').map(Number)
      const startMinutes = startTime[0] * 60 + startTime[1]
      const endMinutes = endTime[0] * 60 + endTime[1]
      
      if (endMinutes <= startMinutes) {
        setError('שעת הסיום חייבת להיות אחרי שעת ההתחלה')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      if (mode === 'edit') {
        // Single lesson edit mode
        const submitData = {
          ...formData,
          date: new Date(formData.date + 'T' + formData.startTime + ':00.000Z').toISOString(),
          mode: 'edit',
          lessonId: theoryLesson?._id
        }

        await onSubmit(submitData)
        setSuccess('שיעור התיאוריה עודכן בהצלחה')
      } else if (mode === 'bulk-edit') {
        // Bulk edit mode
        const updateData: any = {}
        
        // Only include fields that have values (non-empty)
        if (bulkFormData.category && bulkFormData.category.trim()) {
          updateData.category = bulkFormData.category
        }
        if (bulkFormData.teacherId && bulkFormData.teacherId.trim()) {
          updateData.teacherId = bulkFormData.teacherId
        }
        if (bulkFormData.location && bulkFormData.location.trim()) {
          updateData.location = bulkFormData.location
        }
        if (bulkFormData.startTime && bulkFormData.startTime.trim()) {
          updateData.startTime = bulkFormData.startTime
        }
        if (bulkFormData.endTime && bulkFormData.endTime.trim()) {
          updateData.endTime = bulkFormData.endTime
        }
        if (bulkFormData.notes && bulkFormData.notes.trim()) {
          updateData.notes = bulkFormData.notes
        }
        if (bulkFormData.syllabus && bulkFormData.syllabus.trim()) {
          updateData.syllabus = bulkFormData.syllabus
        }

        const submitData = {
          mode: 'bulk-edit',
          lessonIds: theoryLessons?.map(lesson => lesson._id) || [],
          updateData
        }

        await onSubmit(submitData)
        setSuccess(`${theoryLessons?.length || 0} שיעורי תיאוריה עודכנו בהצלחה`)
      } else if (activeTab === 'single') {
        // Single lesson creation mode
        const submitData = {
          ...formData,
          date: new Date(formData.date + 'T' + formData.startTime + ':00.000Z').toISOString(),
          mode: 'create'
        }

        await onSubmit(submitData)
        setSuccess('שיעור התיאוריה נוצר בהצלחה')
      } else {
        // Bulk creation mode
        const submitData = {
          ...bulkFormData,
          isBulk: true, // Flag to indicate bulk creation
          mode: 'bulk-create'
        }

        // Debug: Log the data being sent
        console.log('🚀 Bulk theory lesson creation data:', JSON.stringify(submitData, null, 2))
        
        // Validate required fields before sending
        const requiredFields = ['category', 'teacherId', 'startDate', 'endDate', 'dayOfWeek', 'startTime', 'endTime', 'location', 'schoolYearId']
        const missingFields = requiredFields.filter(field => {
          const value = submitData[field];
          return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
        });
        
        if (missingFields.length > 0) {
          console.error('❌ Missing required fields:', missingFields)
          setError(`חסרים שדות חובה: ${missingFields.join(', ')}`)
          return
        }

        await onSubmit(submitData)
        setSuccess('רצף שיעורי התיאוריה נוצר בהצלחה')
      }
    } catch (error: any) {
      console.error('Error submitting theory lesson form:', error)
      const { generalMessage } = handleServerValidationError(error, 'שגיאה בשמירת השיעור')
      setError(generalMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Form Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'edit' ? 'עריכת שיעור תיאוריה' : 
               mode === 'bulk-edit' ? 'עריכה קבוצתית של שיעורי תיאוריה' :
               'שיעור תיאוריה חדש'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs - Only show for create mode */}
          {mode === 'create' && (
            <div className="flex space-x-4 rtl:space-x-reverse">
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'single'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4 ml-2" />
                שיעור בודד
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bulk')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'bulk'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Repeat className="w-4 h-4 ml-2" />
                רצף שיעורים
              </button>
            </div>
          )}
          
          {/* Bulk Edit Info */}
          {mode === 'bulk-edit' && theoryLessons && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-blue-600 ml-2" />
                <p className="text-blue-800">
                  עריכה קבוצתית של {theoryLessons.length} שיעורי תיאוריה
                </p>
              </div>
              <p className="text-blue-600 text-sm mt-1">
                שדות ריקים יישארו ללא שינוי, רק שדות שימולאו יעודכנו
              </p>
            </div>
          )}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Loading State */}
          {dataLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
                <p className="text-blue-800 text-sm">טוען נתוני שיעור...</p>
              </div>
            </div>
          )}
          
          {/* Success Display */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 inline ml-1" />
                קטגוריה *
              </label>
              <select
                value={mode === 'edit' || (mode === 'create' && activeTab === 'single') ? formData.category : bulkFormData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                required={mode !== 'bulk-edit'}
              >
                {mode === 'bulk-edit' && <option value="">השאר ללא שינוי</option>}
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Teacher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מורה *
              </label>
              <select
                value={mode === 'edit' || (mode === 'create' && activeTab === 'single') ? formData.teacherId : bulkFormData.teacherId}
                onChange={(e) => handleInputChange('teacherId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                required={mode !== 'bulk-edit'}
              >
                <option value="">{mode === 'bulk-edit' ? 'השאר ללא שינוי' : 'בחר מורה'}</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.personalInfo?.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline ml-1" />
              מיקום *
            </label>
            <select
              value={mode === 'edit' || (mode === 'create' && activeTab === 'single') ? formData.location : bulkFormData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              required={mode !== 'bulk-edit'}
            >
              {mode === 'bulk-edit' && <option value="">השאר ללא שינוי</option>}
              {VALID_LOCATIONS.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Date and Time - Different for Edit vs Bulk Edit vs Create */}
          {mode === 'edit' || (mode === 'create' && activeTab === 'single') ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תאריך *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              {/* Day of Week (Auto-calculated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  יום בשבוע
                </label>
                <input
                  type="text"
                  value={DAYS_OF_WEEK[formData.dayOfWeek as keyof typeof DAYS_OF_WEEK] || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                  disabled
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline ml-1" />
                  שעת התחלה *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שעת סיום *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>
            </div>
          ) : mode === 'bulk-edit' ? (
            /* Bulk Edit - Only Time Fields */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline ml-1" />
                  שעת התחלה
                </label>
                <input
                  type="time"
                  value={bulkFormData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  placeholder="השאר ללא שינוי"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שעת סיום
                </label>
                <input
                  type="time"
                  value={bulkFormData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  placeholder="השאר ללא שינוי"
                />
              </div>
            </div>
          ) : (
            /* Bulk Creation Date and Time */
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תאריך התחלה *
                  </label>
                  <input
                    type="date"
                    value={bulkFormData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תאריך סיום *
                  </label>
                  <input
                    type="date"
                    value={bulkFormData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                {/* Day of Week */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    יום בשבוע *
                  </label>
                  <select
                    value={bulkFormData.dayOfWeek}
                    onChange={(e) => handleInputChange('dayOfWeek', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    required
                  >
                    {Object.entries(DAYS_OF_WEEK).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline ml-1" />
                    שעת התחלה *
                  </label>
                  <input
                    type="time"
                    value={bulkFormData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שעת סיום *
                  </label>
                  <input
                    type="time"
                    value={bulkFormData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Notes and Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Syllabus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סילבוס
              </label>
              <textarea
                value={mode === 'edit' || (mode === 'create' && activeTab === 'single') ? formData.syllabus : bulkFormData.syllabus}
                onChange={(e) => handleInputChange('syllabus', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder={mode === 'bulk-edit' ? "השאר ללא שינוי - נושאי השיעור..." : mode === 'edit' ? "נושאי השיעור..." : activeTab === 'single' ? "נושאי השיעור..." : "נושאי השיעורים..."}
              />
            </div>

            {/* Homework - Only for single lesson edit/create */}
            {(mode === 'edit' || (mode === 'create' && activeTab === 'single')) ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שיעורי בית
                </label>
                <textarea
                  value={formData.homework}
                  onChange={(e) => handleInputChange('homework', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  placeholder="משימות לבית..."
                />
              </div>
            ) : null}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                הערות
              </label>
              <textarea
                value={mode === 'edit' || (mode === 'create' && activeTab === 'single') ? formData.notes : bulkFormData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder={mode === 'bulk-edit' ? "השאר ללא שינוי - הערות כלליות..." : "הערות כלליות..."}
              />
            </div>
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
              {mode === 'edit' ? 'עדכן שיעור' : 
               mode === 'bulk-edit' ? 'עדכן שיעורים' :
               activeTab === 'single' ? 'צור שיעור' : 'צור רצף שיעורים'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}