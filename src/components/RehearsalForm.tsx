import { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, Users, Plus, Minus, AlertCircle } from 'lucide-react'
import ConflictDetector from './ConflictDetector'
import {
  validateRehearsalForm,
  validateBulkRehearsalForm,
  generateRehearsalDates,
  getDayName,
  DAYS_OF_WEEK_ARRAY,
  VALID_REHEARSAL_TYPES,
  type RehearsalFormData,
  type BulkRehearsalData,
  type Rehearsal
} from '../utils/rehearsalUtils'
import { handleServerValidationError } from '../utils/validationUtils'

interface RehearsalFormProps {
  orchestras: Array<{
    _id: string
    name: string
    type: string
    location: string
    conductor?: {
      _id: string
      personalInfo: { fullName: string }
    }
    members?: Array<{ _id: string }>
  }>
  existingRehearsals?: Rehearsal[]
  onSubmit: (data: RehearsalFormData | BulkRehearsalData, isBulk: boolean) => Promise<void>
  onCancel: () => void
  initialData?: Partial<RehearsalFormData>
}

export default function RehearsalForm({
  orchestras,
  existingRehearsals = [],
  onSubmit,
  onCancel,
  initialData
}: RehearsalFormProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Single rehearsal form state
  const [singleForm, setSingleForm] = useState<Partial<RehearsalFormData>>({
    groupId: '',
    type: 'תזמורת',
    date: '',
    startTime: '19:00',
    endTime: '21:00',
    location: '',
    notes: '',
    isActive: true,
    ...initialData
  })

  // Bulk rehearsal form state
  const [bulkForm, setBulkForm] = useState<Partial<BulkRehearsalData>>({
    orchestraId: '',
    startDate: '',
    endDate: '',
    dayOfWeek: 0, // Sunday
    startTime: '19:00',
    endTime: '21:00',
    location: '',
    notes: '',
    excludeDates: [],
    schoolYearId: 'current'
  })

  const [excludeDateInput, setExcludeDateInput] = useState('')
  const [previewDates, setPreviewDates] = useState<string[]>([])
  const [hasConflicts, setHasConflicts] = useState(false)
  const [hasCriticalConflicts, setHasCriticalConflicts] = useState(false)

  // Auto-fill location when orchestra is selected
  useEffect(() => {
    if (mode === 'single' && singleForm.groupId) {
      const selectedOrchestra = orchestras.find(o => o._id === singleForm.groupId)
      if (selectedOrchestra && !singleForm.location) {
        setSingleForm(prev => ({
          ...prev,
          location: selectedOrchestra.location,
          type: selectedOrchestra.type as any
        }))
      }
    }
  }, [singleForm.groupId, orchestras, mode])

  useEffect(() => {
    if (mode === 'bulk' && bulkForm.orchestraId) {
      const selectedOrchestra = orchestras.find(o => o._id === bulkForm.orchestraId)
      if (selectedOrchestra && !bulkForm.location) {
        setBulkForm(prev => ({
          ...prev,
          location: selectedOrchestra.location
        }))
      }
    }
  }, [bulkForm.orchestraId, orchestras, mode])

  // Generate preview dates for bulk creation
  useEffect(() => {
    if (mode === 'bulk' && bulkForm.startDate && bulkForm.endDate && bulkForm.dayOfWeek !== undefined) {
      try {
        const dates = generateRehearsalDates(bulkForm as BulkRehearsalData)
        setPreviewDates(dates)
      } catch (error) {
        setPreviewDates([])
      }
    } else {
      setPreviewDates([])
    }
  }, [mode, bulkForm.startDate, bulkForm.endDate, bulkForm.dayOfWeek, bulkForm.excludeDates])

  const handleSingleFormChange = (field: keyof RehearsalFormData, value: any) => {
    setSingleForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBulkFormChange = (field: keyof BulkRehearsalData, value: any) => {
    setBulkForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddExcludeDate = () => {
    if (!excludeDateInput) return
    
    setBulkForm(prev => ({
      ...prev,
      excludeDates: [...(prev.excludeDates || []), excludeDateInput]
    }))
    setExcludeDateInput('')
  }

  const handleRemoveExcludeDate = (dateToRemove: string) => {
    setBulkForm(prev => ({
      ...prev,
      excludeDates: (prev.excludeDates || []).filter(date => date !== dateToRemove)
    }))
  }

  const handleConflictsChanged = (conflicts: any[]) => {
    setHasConflicts(conflicts.length > 0)
    setHasCriticalConflicts(conflicts.some(c => c.severity === 'critical'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Check for critical conflicts before submitting
      if (hasCriticalConflicts) {
        setErrors({ submit: 'יש לפתור התנגשויות קריטיות לפני יצירת החזרה' })
        return
      }

      if (mode === 'single') {
        const validation = validateRehearsalForm(singleForm)
        if (!validation.isValid) {
          setErrors(validation.errors)
          return
        }

        // Calculate dayOfWeek from date
        const date = new Date(singleForm.date!)
        const dayOfWeek = date.getDay()

        const rehearsalData: RehearsalFormData = {
          ...singleForm as RehearsalFormData,
          dayOfWeek
        }

        await onSubmit(rehearsalData, false)
      } else {
        const validation = validateBulkRehearsalForm(bulkForm)
        if (!validation.isValid) {
          setErrors(validation.errors)
          return
        }

        await onSubmit(bulkForm as BulkRehearsalData, true)
      }
    } catch (error: any) {
      const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(error, 'שגיאה בשמירת החזרה')
      if (isValidationError) {
        setErrors({ ...fieldErrors, submit: generalMessage })
      } else {
        setErrors({ submit: generalMessage })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex-1 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {initialData ? 'ערוך חזרה' : 'חזרה חדשה'}
              </h3>
              
              {!initialData && (
                <div className="flex justify-center mt-3">
                  <div className="flex bg-gray-100 rounded p-1">
                    <button
                      type="button"
                      onClick={() => setMode('single')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        mode === 'single'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      חזרה יחידה
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('bulk')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        mode === 'bulk'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      חזרות חוזרות
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-8" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'single' ? (
              // Single Rehearsal Form
              <div className="space-y-4">
                {/* Orchestra Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline ml-1" />
                    תזמורת <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={singleForm.groupId || ''}
                    onChange={(e) => handleSingleFormChange('groupId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                      errors.groupId ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={!!initialData}
                  >
                    <option value="">בחר תזמורת</option>
                    {orchestras.map(orchestra => (
                      <option key={orchestra._id} value={orchestra._id}>
                        {orchestra.name} ({orchestra.type})
                      </option>
                    ))}
                  </select>
                  {errors.groupId && (
                    <p className="text-red-600 text-sm mt-1">{errors.groupId}</p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline ml-1" />
                    תאריך <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={singleForm.date || ''}
                    onChange={(e) => handleSingleFormChange('date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                      errors.date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.date && (
                    <p className="text-red-600 text-sm mt-1">{errors.date}</p>
                  )}
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline ml-1" />
                      שעת התחלה <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={singleForm.startTime || ''}
                      onChange={(e) => handleSingleFormChange('startTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                        errors.startTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.startTime && (
                      <p className="text-red-600 text-sm mt-1">{errors.startTime}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">שעת סיום <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      value={singleForm.endTime || ''}
                      onChange={(e) => handleSingleFormChange('endTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                        errors.endTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.endTime && (
                      <p className="text-red-600 text-sm mt-1">{errors.endTime}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline ml-1" />
                    מיקום <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={singleForm.location || ''}
                    onChange={(e) => handleSingleFormChange('location', e.target.value)}
                    placeholder="כגון: אולם ערן, סטודיו קאמרי 1"
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                      errors.location ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.location && (
                    <p className="text-red-600 text-sm mt-1">{errors.location}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">הערות</label>
                  <textarea
                    value={singleForm.notes || ''}
                    onChange={(e) => handleSingleFormChange('notes', e.target.value)}
                    rows={3}
                    placeholder="הערות נוספות עבור החזרה..."
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              // Bulk Rehearsal Form
              <div className="space-y-4">
                {/* Orchestra Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline ml-1" />
                    תזמורת <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bulkForm.orchestraId || ''}
                    onChange={(e) => handleBulkFormChange('orchestraId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                      errors.orchestraId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">בחר תזמורת</option>
                    {orchestras.map(orchestra => (
                      <option key={orchestra._id} value={orchestra._id}>
                        {orchestra.name} ({orchestra.type})
                      </option>
                    ))}
                  </select>
                  {errors.orchestraId && (
                    <p className="text-red-600 text-sm mt-1">{errors.orchestraId}</p>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline ml-1" />
                      תאריך התחלה <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={bulkForm.startDate || ''}
                      onChange={(e) => handleBulkFormChange('startDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                        errors.startDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.startDate && (
                      <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">תאריך סיום <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={bulkForm.endDate || ''}
                      onChange={(e) => handleBulkFormChange('endDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                        errors.endDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.endDate && (
                      <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Day of Week */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">יום בשבוע <span className="text-red-500">*</span></label>
                  <select
                    value={bulkForm.dayOfWeek || 0}
                    onChange={(e) => handleBulkFormChange('dayOfWeek', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                      errors.dayOfWeek ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {DAYS_OF_WEEK_ARRAY.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  {errors.dayOfWeek && (
                    <p className="text-red-600 text-sm mt-1">{errors.dayOfWeek}</p>
                  )}
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline ml-1" />
                      שעת התחלה <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={bulkForm.startTime || ''}
                      onChange={(e) => handleBulkFormChange('startTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                        errors.startTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.startTime && (
                      <p className="text-red-600 text-sm mt-1">{errors.startTime}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">שעת סיום <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      value={bulkForm.endTime || ''}
                      onChange={(e) => handleBulkFormChange('endTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                        errors.endTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.endTime && (
                      <p className="text-red-600 text-sm mt-1">{errors.endTime}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline ml-1" />
                    מיקום <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bulkForm.location || ''}
                    onChange={(e) => handleBulkFormChange('location', e.target.value)}
                    placeholder="כגון: אולם ערן, סטודיו קאמרי 1"
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-gray-900 ${
                      errors.location ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.location && (
                    <p className="text-red-600 text-sm mt-1">{errors.location}</p>
                  )}
                </div>

                {/* Exclude Dates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תאריכים לדילוג</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="date"
                      value={excludeDateInput}
                      onChange={(e) => setExcludeDateInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="בחר תאריך לדילוג"
                    />
                    <button
                      type="button"
                      onClick={handleAddExcludeDate}
                      disabled={!excludeDateInput}
                      className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {bulkForm.excludeDates && bulkForm.excludeDates.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bulkForm.excludeDates.map(date => (
                        <div key={date} className="flex items-center bg-gray-100 rounded px-2 py-1">
                          <span className="text-sm text-gray-700">
                            {new Date(date).toLocaleDateString('he-IL')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExcludeDate(date)}
                            className="mr-1 text-gray-500 hover:text-red-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">הערות</label>
                  <textarea
                    value={bulkForm.notes || ''}
                    onChange={(e) => handleBulkFormChange('notes', e.target.value)}
                    rows={3}
                    placeholder="הערות נוספות עבור כל החזרות..."
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                {/* Preview Dates */}
                {previewDates.length > 0 && (
                  <div className="bg-blue-50 rounded p-4">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 ml-1" />
                      <span className="text-sm font-medium text-blue-900">
                        תיווצרו {previewDates.length} חזרות
                      </span>
                    </div>
                    <div className="text-xs text-blue-700 max-h-32 overflow-y-auto">
                      {previewDates.slice(0, 10).map(date => (
                        <div key={date}>
                          {new Date(date).toLocaleDateString('he-IL')} - {getDayName(new Date(date).getDay())}
                        </div>
                      ))}
                      {previewDates.length > 10 && (
                        <div className="text-blue-600">...ועוד {previewDates.length - 10}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Conflict Detection */}
            <ConflictDetector
              newRehearsal={mode === 'single' ? singleForm as RehearsalFormData : null}
              bulkData={mode === 'bulk' ? bulkForm as BulkRehearsalData : null}
              existingRehearsals={existingRehearsals}
              orchestras={orchestras}
              onConflictsChanged={handleConflictsChanged}
            />

            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-800 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={loading || hasCriticalConflicts}
                className={`px-6 py-2 bg-muted text-white rounded hover:bg-muted transition-colors ${
                  loading || hasCriticalConflicts ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'שומר...' : (initialData ? 'עדכן חזרה' : 
                  mode === 'single' ? 'צור חזרה' : `צור ${previewDates.length} חזרות`)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}