import React, { useState } from 'react';
import { X, Clock, MapPin, Calendar, Save } from 'lucide-react';
import { Card } from '../ui/card';
import apiService from '../../services/apiService';
import { VALID_LOCATIONS } from '../../constants/locations';
import { handleServerValidationError } from '../../utils/validationUtils';

interface TimeBlock {
  _id?: string;
  day: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  location: string;
  notes?: string;
  isActive: boolean;
  assignedLessons?: any[];
  recurring: {
    isRecurring: boolean;
    excludeDates: string[];
  };
}

interface TimeBlockFormProps {
  teacherId: string;
  timeBlock?: TimeBlock | null;
  onSave: () => void;
  onCancel: () => void;
}

const TimeBlockForm: React.FC<TimeBlockFormProps> = ({
  teacherId,
  timeBlock,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState(() => {
    if (timeBlock) {
      return {
        day: timeBlock.day,
        startTime: timeBlock.startTime,
        endTime: timeBlock.endTime,
        location: timeBlock.location,
        notes: timeBlock.notes || '',
        isActive: timeBlock.isActive,
        isRecurring: timeBlock.recurring?.isRecurring || true
      };
    } else {
      return {
        day: 'ראשון',
        startTime: '14:00',
        endTime: '18:00',
        location: 'חדר 25',
        notes: '',
        isActive: true,
        isRecurring: true
      };
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysOfWeek = [
    'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
  ];


  const calculateDuration = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} שעות ו-${mins} דקות` : `${hours} שעות`;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    const duration = calculateDuration(formData.startTime, formData.endTime);
    
    if (duration <= 0) {
      setError('שעת סיום חייבת להיות אחרי שעת התחלה');
      return false;
    }
    
    if (duration < 30) {
      setError('זמינות חייבת להיות לפחות 30 דקות');
      return false;
    }
    
    if (!formData.location.trim()) {
      setError('יש לבחור מיקום');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const duration = calculateDuration(formData.startTime, formData.endTime);
      
      const timeBlockData = {
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        totalDuration: duration,
        location: formData.location,
        notes: formData.notes.trim() || null,
        isActive: formData.isActive,
        recurring: {
          isRecurring: formData.isRecurring,
          excludeDates: timeBlock?.recurring?.excludeDates || []
        }
      };

      if (timeBlock?._id) {
        // Update existing time block
        await apiService.teacherSchedule.updateTimeBlock(
          teacherId, 
          timeBlock._id, 
          timeBlockData
        );
      } else {
        // Create new time block
        await apiService.teacherSchedule.createTimeBlock(
          teacherId, 
          timeBlockData
        );
      }
      
      onSave();
    } catch (error: any) {
      console.error('Error saving time block:', error);
      const { generalMessage } = handleServerValidationError(error, 'שגיאה בשמירת הזמינות');
      setError(generalMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const duration = calculateDuration(formData.startTime, formData.endTime);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {timeBlock ? 'עריכת זמינות' : 'הוספת זמינות חדשה'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Day Selection */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              יום בשבוע <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.day}
              onChange={(e) => handleInputChange('day', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
              required
            >
              {daysOfWeek.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                שעת התחלה <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                שעת סיום <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                required
              />
            </div>
          </div>

          {/* Duration Display */}
          {duration > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-700">
                <Clock className="w-4 h-4 mr-2" />
                <span className="font-medium">משך זמן: {formatDuration(duration)}</span>
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 mr-2" />
              מיקום <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
              required
            >
              {VALID_LOCATIONS.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              הערות
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="הערות אופציונליות..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 mr-3">חוזר שבועית</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 mr-3">פעיל</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {timeBlock ? 'עדכן' : 'צור'} זמינות
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeBlockForm;