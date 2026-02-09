import React from 'react';
import { Clock, User, MapPin, AlertTriangle } from 'lucide-react';

interface TimeSlot {
  _id?: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  location?: string;
  studentId?: string;
  studentName?: string;
  instrument?: string;
  status?: 'available' | 'booked' | 'blocked' | 'pending';
  notes?: string;
  hasConflict?: boolean;
}

interface ScheduleTimeSlotProps {
  timeSlot: TimeSlot;
  teacherId: string;
  date: string;
  onDrop: (studentId: string, timeSlot: TimeSlot, date: string) => void;
  onEdit: (timeSlot: TimeSlot) => void;
  onCancel: (timeSlot: TimeSlot) => void;
  isDragOver?: boolean;
  className?: string;
}

const ScheduleTimeSlot: React.FC<ScheduleTimeSlotProps> = ({
  timeSlot,
  teacherId,
  date,
  onDrop,
  onEdit,
  onCancel,
  isDragOver = false,
  className = ''
}) => {
  const [dragOver, setDragOver] = React.useState(false);

  const getSlotStatusColor = () => {
    if (timeSlot.hasConflict) return 'bg-red-100 border-red-300 text-red-800';
    
    switch (timeSlot.status) {
      case 'available':
        return 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100';
      case 'booked':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'blocked':
        return 'bg-gray-100 border-gray-300 text-gray-600';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return timeSlot.isAvailable
          ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
          : 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getSlotIcon = () => {
    if (timeSlot.hasConflict) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (timeSlot.studentId) return <User className="w-4 h-4" />;
    if (timeSlot.isAvailable) return <Clock className="w-4 h-4" />;
    return null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (timeSlot.isAvailable && !timeSlot.studentId) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (!timeSlot.isAvailable || timeSlot.studentId) return;

    const studentId = e.dataTransfer.getData('application/student-id');
    if (studentId) {
      onDrop(studentId, timeSlot, date);
    }
  };

  const handleClick = () => {
    if (timeSlot.studentId) {
      onEdit(timeSlot);
    }
  };

  const isDropTarget = timeSlot.isAvailable && !timeSlot.studentId;
  const slotClasses = `
    ${getSlotStatusColor()}
    ${dragOver ? 'ring-2 ring-primary-300 bg-primary-50' : ''}
    ${isDragOver ? 'ring-2 ring-primary-300' : ''}
    ${isDropTarget ? 'cursor-pointer' : ''}
    ${timeSlot.studentId ? 'cursor-pointer' : ''}
    ${className}
    border-2 rounded-lg p-3 transition-all duration-200 min-h-[80px] relative
  `;

  return (
    <div
      className={slotClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      title={timeSlot.notes || ''}
    >
      {/* Time Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getSlotIcon()}
          <span className="text-sm font-medium">
            {timeSlot.startTime}-{timeSlot.endTime}
          </span>
        </div>
        
        {timeSlot.hasConflict && (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        )}
      </div>

      {/* Student Info */}
      {timeSlot.studentId && timeSlot.studentName && (
        <div className="mb-2">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {timeSlot.studentName}
          </div>
          {timeSlot.instrument && (
            <div className="text-xs text-gray-600">
              {timeSlot.instrument}
            </div>
          )}
        </div>
      )}

      {/* Location */}
      {timeSlot.location && (
        <div className="flex items-center text-xs text-gray-600 mb-1">
          <MapPin className="w-3 h-3 mr-1" />
          {timeSlot.location}
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center justify-between">
        {timeSlot.status === 'available' && !timeSlot.studentId && (
          <span className="text-xs text-green-600 font-medium">זמין</span>
        )}
        
        {timeSlot.status === 'blocked' && (
          <span className="text-xs text-gray-500 font-medium">חסום</span>
        )}
        
        {timeSlot.status === 'pending' && (
          <span className="text-xs text-yellow-600 font-medium">ממתין</span>
        )}

        {/* Drag Drop Indicator */}
        {dragOver && isDropTarget && (
          <div className="absolute inset-0 border-2 border-dashed border-primary-400 rounded-lg bg-primary-50 bg-opacity-50 flex items-center justify-center">
            <span className="text-primary-600 text-sm font-medium">שחרר כאן</span>
          </div>
        )}
      </div>

      {/* Actions for booked slots */}
      {timeSlot.studentId && (
        <div className="absolute top-1 left-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel(timeSlot);
            }}
            className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
            title="בטל שיעור"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default ScheduleTimeSlot;