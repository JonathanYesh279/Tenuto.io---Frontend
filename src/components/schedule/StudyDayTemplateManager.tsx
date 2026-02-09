import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Copy, Clock, MapPin, Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import apiService from '../../services/apiService';

const HEBREW_DAYS = [
  { value: 0, label: 'ראשון' },
  { value: 1, label: 'שני' },
  { value: 2, label: 'שלישי' },
  { value: 3, label: 'רביעי' },
  { value: 4, label: 'חמישי' },
  { value: 5, label: 'שישי' },
  { value: 6, label: 'שבת' }
];

const VALID_DURATIONS = [30, 45, 60];

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  location: string;
  duration?: number;
}

interface StudyDay {
  _id?: string;
  teacherId: string;
  dayOfWeek: number;
  timeSlots: TimeSlot[];
  recurring: boolean;
  schoolYearId?: string;
  isActive: boolean;
}

interface StudyDayTemplateManagerProps {
  teacherId: string;
  schoolYearId?: string;
  onSave?: (studyDay: StudyDay) => void;
  onCancel?: () => void;
  existingTemplate?: StudyDay;
}

const StudyDayTemplateManager: React.FC<StudyDayTemplateManagerProps> = ({
  teacherId,
  schoolYearId,
  onSave,
  onCancel,
  existingTemplate
}) => {
  const [studyDay, setStudyDay] = useState<StudyDay>({
    teacherId,
    dayOfWeek: 0,
    timeSlots: [],
    recurring: true,
    schoolYearId,
    isActive: true
  });

  const [newTimeSlot, setNewTimeSlot] = useState<TimeSlot>({
    startTime: '15:00',
    endTime: '15:45',
    isAvailable: true,
    location: 'חדר 5',
    duration: 45
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingTemplate) {
      setStudyDay(existingTemplate);
    }
  }, [existingTemplate]);

  const generateTimeSlot = (startTime: string, duration: number): TimeSlot => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration);
    
    const endTime = endDate.toTimeString().slice(0, 5);
    
    return {
      startTime,
      endTime,
      isAvailable: true,
      location: newTimeSlot.location,
      duration
    };
  };

  const handleAddTimeSlot = () => {
    const timeSlot = generateTimeSlot(newTimeSlot.startTime, newTimeSlot.duration || 45);
    
    // Check for time conflicts
    const hasConflict = studyDay.timeSlots.some(existing => {
      const existingStart = new Date(`2024-01-01T${existing.startTime}`);
      const existingEnd = new Date(`2024-01-01T${existing.endTime}`);
      const newStart = new Date(`2024-01-01T${timeSlot.startTime}`);
      const newEnd = new Date(`2024-01-01T${timeSlot.endTime}`);
      
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (hasConflict) {
      setError('חפיפה בזמנים עם שיעור קיים');
      return;
    }

    setStudyDay(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, timeSlot].sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
      )
    }));

    // Auto-increment next time slot
    const nextHour = parseInt(newTimeSlot.startTime.split(':')[0]) + 1;
    setNewTimeSlot(prev => ({
      ...prev,
      startTime: `${nextHour.toString().padStart(2, '0')}:00`
    }));

    setError(null);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setStudyDay(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const handleTimeSlotChange = (index: number, field: keyof TimeSlot, value: any) => {
    setStudyDay(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (studyDay.timeSlots.length === 0) {
        setError('יש להוסיף לפחות שיעור אחד');
        return;
      }

      const studyDayData = {
        ...studyDay,
        schoolYearId: schoolYearId || studyDay.schoolYearId
      };

      let result;
      if (existingTemplate?._id) {
        result = await apiService.schedule.updateStudyDay(existingTemplate._id, studyDayData);
      } else {
        result = await apiService.schedule.createStudyDay(teacherId, studyDayData);
      }

      if (onSave) {
        onSave(result);
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בשמירת יום הלימוד');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateDay = () => {
    const nextDayIndex = (studyDay.dayOfWeek + 1) % 7;
    setStudyDay(prev => ({
      ...prev,
      dayOfWeek: nextDayIndex,
      _id: undefined // Clear ID for new template
    }));
  };

  const generateBulkTimeSlots = () => {
    const startHour = 15; // 3 PM
    const endHour = 20;   // 8 PM
    const duration = 45;  // 45 minutes
    const breakMinutes = 15; // 15 minute break between lessons

    const slots: TimeSlot[] = [];
    let currentTime = startHour * 60; // Convert to minutes

    while (currentTime + duration <= endHour * 60) {
      const hours = Math.floor(currentTime / 60);
      const minutes = currentTime % 60;
      const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const slot = generateTimeSlot(startTime, duration);
      slots.push(slot);
      
      currentTime += duration + breakMinutes;
    }

    setStudyDay(prev => ({
      ...prev,
      timeSlots: slots
    }));
  };

  const selectedDay = HEBREW_DAYS.find(day => day.value === studyDay.dayOfWeek);

  return (
    <Card padding="lg" className="max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {existingTemplate ? 'עריכת יום לימוד' : 'יצירת יום לימוד חדש'}
            </h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDuplicateDay}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="שכפל ליום הבא"
            >
              <Copy className="w-4 h-4 mr-1" />
              שכפל
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Day Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              יום בשבוע *
            </label>
            <select
              value={studyDay.dayOfWeek}
              onChange={(e) => setStudyDay(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {HEBREW_DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={studyDay.recurring}
                onChange={(e) => setStudyDay(prev => ({ ...prev, recurring: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">חזרה שבועית</span>
            </label>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generateBulkTimeSlots}
            className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100"
          >
            צור לו"ז סטנדרטי (15:00-20:00)
          </button>
        </div>

        {/* Add New Time Slot */}
        <Card padding="md" className="bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">הוסף שיעור חדש</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שעת התחלה
              </label>
              <input
                type="time"
                value={newTimeSlot.startTime}
                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                משך השיעור (דקות)
              </label>
              <select
                value={newTimeSlot.duration || 45}
                onChange={(e) => {
                  const duration = parseInt(e.target.value);
                  const timeSlot = generateTimeSlot(newTimeSlot.startTime, duration);
                  setNewTimeSlot(prev => ({ ...prev, duration, endTime: timeSlot.endTime }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {VALID_DURATIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} דקות
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מיקום
              </label>
              <input
                type="text"
                value={newTimeSlot.location}
                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, location: e.target.value }))}
                placeholder="חדר 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAddTimeSlot}
                className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                הוסף
              </button>
            </div>
          </div>
        </Card>

        {/* Time Slots List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            שיעורים ביום {selectedDay?.label} ({studyDay.timeSlots.length})
          </h3>
          
          {studyDay.timeSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              טרם נוספו שיעורים ליום זה
            </div>
          ) : (
            <div className="space-y-3">
              {studyDay.timeSlots.map((slot, index) => (
                <Card key={index} padding="md" className="border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center text-gray-700">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="font-medium">
                          {slot.startTime}-{slot.endTime}
                        </span>
                        <span className="text-sm text-gray-500 mr-2">
                          ({slot.duration || 45} דק')
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <input
                          type="text"
                          value={slot.location}
                          onChange={(e) => handleTimeSlotChange(index, 'location', e.target.value)}
                          className="bg-transparent border-none focus:outline-none focus:bg-white focus:border focus:border-gray-300 focus:rounded px-1"
                          placeholder="מיקום"
                        />
                      </div>

                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slot.isAvailable}
                          onChange={(e) => handleTimeSlotChange(index, 'isAvailable', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 mr-2">זמין</span>
                      </label>
                    </div>

                    <button
                      onClick={() => handleRemoveTimeSlot(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ביטול
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isLoading || studyDay.timeSlots.length === 0}
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {existingTemplate ? 'עדכן יום לימוד' : 'צור יום לימוד'}
              </>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};

export default StudyDayTemplateManager;