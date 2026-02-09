import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Users, AlertCircle, X } from 'lucide-react'

interface RehearsalScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  orchestraId: string
  orchestraName: string
  onSave: (rehearsalData: RehearsalData) => void
}

interface RehearsalData {
  date: string
  startTime: string
  endTime: string
  location: string
  notes: string
  recurring: boolean
  recurrencePattern?: 'weekly' | 'biweekly' | 'monthly'
  endRecurrence?: string
}

export default function RehearsalScheduleModal({
  isOpen,
  onClose,
  orchestraId,
  orchestraName,
  onSave
}: RehearsalScheduleModalProps) {
  const [formData, setFormData] = useState<RehearsalData>({
    date: '',
    startTime: '19:00',
    endTime: '21:00',
    location: 'אולם מוזיקה',
    notes: '',
    recurring: false,
    recurrencePattern: 'weekly',
    endRecurrence: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Set default date to tomorrow
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setFormData(prev => ({
        ...prev,
        date: tomorrow.toISOString().split('T')[0]
      }))
    }
  }, [isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) {
      newErrors.date = 'יש לבחור תאריך'
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.date = 'לא ניתן לקבוע חזרה בעבר'
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = 'יש לבחור שעת התחלה'
    }

    if (!formData.endTime) {
      newErrors.endTime = 'יש לבחור שעת סיום'
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`)
      const end = new Date(`2000-01-01T${formData.endTime}`)
      if (end <= start) {
        newErrors.endTime = 'שעת הסיום חייבת להיות אחרי שעת ההתחלה'
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'יש לציין מקום'
    }

    if (formData.recurring && !formData.endRecurrence) {
      newErrors.endRecurrence = 'יש לציין תאריך סיום לחזרות קבועות'
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
      await onSave(formData)
      onClose()
      // Reset form
      setFormData({
        date: '',
        startTime: '19:00',
        endTime: '21:00',
        location: 'אולם מוזיקה',
        notes: '',
        recurring: false,
        recurrencePattern: 'weekly',
        endRecurrence: ''
      })
    } catch (error) {
      console.error('Error saving rehearsal:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = (): string => {
    if (!formData.startTime || !formData.endTime) return ''

    const start = new Date(`2000-01-01T${formData.startTime}`)
    const end = new Date(`2000-01-01T${formData.endTime}`)
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60)

    if (diffMinutes <= 0) return ''

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    if (hours === 0) {
      return `${minutes} דקות`
    } else if (minutes === 0) {
      return `${hours} שעות`
    } else {
      return `${hours} שעות ו-${minutes} דקות`
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 font-reisinger-yonatan">
            קביעת חזרה חדשה
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <Users className="w-4 h-4" />
            <span className="font-medium font-reisinger-yonatan">תזמורת: {orchestraName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              תאריך החזרה *
            </label>
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={`w-full pl-3 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.date && (
              <p className="text-red-600 text-xs mt-1 font-reisinger-yonatan">{errors.date}</p>
            )}
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת התחלה *
              </label>
              <div className="relative">
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className={`w-full pl-3 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    errors.startTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.startTime && (
                <p className="text-red-600 text-xs mt-1 font-reisinger-yonatan">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת סיום *
              </label>
              <div className="relative">
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className={`w-full pl-3 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    errors.endTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.endTime && (
                <p className="text-red-600 text-xs mt-1 font-reisinger-yonatan">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {calculateDuration() && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded font-reisinger-yonatan">
              משך החזרה: {calculateDuration()}
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              מקום החזרה *
            </label>
            <div className="relative">
              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className={`w-full pl-3 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  errors.location ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="למשל: אולם מוזיקה, חדר 101"
              />
            </div>
            {errors.location && (
              <p className="text-red-600 text-xs mt-1 font-reisinger-yonatan">{errors.location}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              הערות
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="הערות נוספות על החזרה (אופציונלי)"
            />
          </div>

          {/* Recurring */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                id="recurring"
                type="checkbox"
                checked={formData.recurring}
                onChange={(e) => setFormData(prev => ({ ...prev, recurring: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="recurring" className="mr-2 text-sm text-gray-700 font-reisinger-yonatan">
                חזרה קבועה (חוזרת)
              </label>
            </div>

            {formData.recurring && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    תדירות
                  </label>
                  <select
                    value={formData.recurrencePattern}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurrencePattern: e.target.value as 'weekly' | 'biweekly' | 'monthly'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="weekly">שבועי</option>
                    <option value="biweekly">דו-שבועי</option>
                    <option value="monthly">חודשי</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                    תאריך סיום החזרות הקבועות *
                  </label>
                  <input
                    type="date"
                    required={formData.recurring}
                    value={formData.endRecurrence}
                    onChange={(e) => setFormData(prev => ({ ...prev, endRecurrence: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                      errors.endRecurrence ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.endRecurrence && (
                    <p className="text-red-600 text-xs mt-1 font-reisinger-yonatan">{errors.endRecurrence}</p>
                  )}
                </div>

                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="font-reisinger-yonatan">
                    חזרות קבועות ייווצרו אוטומטית עד התאריך שצוין
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-reisinger-yonatan"
            >
              {loading ? 'קובע חזרה...' : 'קבע חזרה'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-reisinger-yonatan"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}