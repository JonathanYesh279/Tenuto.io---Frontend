import React from 'react';
import { ChatTextIcon, ClockIcon, MapPinIcon, PencilSimpleIcon, TrashIcon, UsersIcon } from '@phosphor-icons/react'


interface TimeBlock {
  _id: string;
  day: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  location: string;
  notes?: string;
  isActive: boolean;
  assignedLessons: any[];
  recurring: {
    isRecurring: boolean;
    excludeDates: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface TimeBlockCardProps {
  block: TimeBlock;
  onEdit: () => void;
  onDelete: () => void;
}

const TimeBlockCard: React.FC<TimeBlockCardProps> = ({ block, onEdit, onDelete }) => {
  const formatTimeRange = (start: string, end: string) => {
    return `${start} - ${end}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${hours}:00`;
  };

  const handleDeleteClick = () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הזמינות הזו?')) {
      onDelete();
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-3 transition-all duration-200 ${
      !block.isActive 
        ? 'bg-gray-50 border-gray-300 opacity-60' 
        : 'bg-white border-gray-200 hover:border-border hover:shadow-md'
    }`}>
      {/* Time Range Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-4 h-4 text-primary" />
          <span className="font-semibold text-gray-900">
            {formatTimeRange(block.startTime, block.endTime)}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {formatDuration(block.totalDuration)} שעות
        </div>
      </div>
      
      {/* Location */}
      <div className="flex items-center space-x-2 mb-2">
        <MapPinIcon className="w-4 h-4 text-gray-500" />
        <span className="text-gray-700">{block.location}</span>
      </div>
      
      {/* Notes */}
      {block.notes && (
        <div className="flex items-start space-x-2 mb-3">
          <ChatTextIcon className="w-4 h-4 text-gray-500 mt-0.5" />
          <span className="text-sm text-gray-600">{block.notes}</span>
        </div>
      )}
      
      {/* Assigned Lessons */}
      {block.assignedLessons && block.assignedLessons.length > 0 && (
        <div className="flex items-center space-x-2 mb-3 p-2 bg-blue-50 rounded">
          <UsersIcon className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-700">
            {block.assignedLessons.length} שיעורים מתוכננים
          </span>
        </div>
      )}
      
      {/* Status Indicators */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex space-x-2">
          {/* Active Status */}
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            block.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {block.isActive ? 'פעיל' : 'לא פעיל'}
          </span>
          
          {/* Recurring Status */}
          {block.recurring.isRecurring && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              חוזר שבועית
            </span>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex space-x-2 pt-2 border-t border-gray-100">
        <button 
          className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          onClick={onEdit}
        >
          <PencilSimpleIcon className="w-3 h-3 mr-1" />
          עריכה
        </button>
        <button 
          className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          onClick={handleDeleteClick}
        >
          <TrashIcon className="w-3 h-3 mr-1" />
          מחיקה
        </button>
      </div>
    </div>
  );
};

export default TimeBlockCard;