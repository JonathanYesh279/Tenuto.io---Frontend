import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Music, 
  Edit2, 
  Save, 
  X,
  Play,
  Star,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Card } from './ui/card';
import type { Performance } from '../types/bagrut.types';

interface PerformanceCardProps {
  performance: Performance;
  onUpdate: (updatedPerformance: Performance) => void;
  onView: (performance: Performance) => void;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  performance,
  onUpdate,
  onView
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Performance>(performance);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(performance);
    setIsEditing(false);
  };

  const getStatusColor = (status: Performance['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: Performance['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: Performance['status']) => {
    switch (status) {
      case 'completed': return 'הושלם';
      case 'scheduled': return 'מתוזמן';
      case 'cancelled': return 'בוטל';
      default: return 'לא ידוע';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer group relative">
      <div onClick={() => !isEditing && onView(performance)} className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary-600" />
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="text-lg font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-primary-500 outline-none"
                  placeholder="כותרת הביצוע"
                />
              ) : (
                <h3 className="text-lg font-semibold text-gray-900">{performance.title}</h3>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(performance.status)}`}>
              {getStatusIcon(performance.status)}
              {getStatusText(performance.status)}
            </span>
            
            {!isEditing ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Performance Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-gray-500" />
            {isEditing ? (
              <input
                type="datetime-local"
                value={editData.date ? new Date(editData.date).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  date: e.target.value ? new Date(e.target.value) : undefined 
                })}
                className="bg-transparent border-b border-gray-300 focus:border-primary-500 outline-none text-sm"
              />
            ) : (
              <span>
                {performance.date 
                  ? new Date(performance.date).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'לא נקבע'
                }
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-gray-500" />
            {isEditing ? (
              <input
                type="text"
                value={editData.location || ''}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="bg-transparent border-b border-gray-300 focus:border-primary-500 outline-none text-sm flex-1"
                placeholder="מקום הביצוע"
              />
            ) : (
              <span>{performance.location || 'לא צוין'}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-gray-500" />
            {isEditing ? (
              <input
                type="text"
                value={editData.duration || ''}
                onChange={(e) => setEditData({ ...editData, duration: e.target.value })}
                className="bg-transparent border-b border-gray-300 focus:border-primary-500 outline-none text-sm"
                placeholder="משך זמן"
              />
            ) : (
              <span>{performance.duration || 'לא צוין'}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Music className="w-4 h-4 text-gray-500" />
            <span>{performance.pieces.length} יצירות</span>
          </div>
        </div>

        {/* Evaluation Preview */}
        {performance.evaluation && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">הערכה</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium text-gray-600">טכניקה</div>
                <div className="text-primary-600 font-semibold">
                  {performance.evaluation.technique}/100
                </div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium text-gray-600">פרשנות</div>
                <div className="text-primary-600 font-semibold">
                  {performance.evaluation.interpretation}/100
                </div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium text-gray-600">נוכחות במה</div>
                <div className="text-primary-600 font-semibold">
                  {performance.evaluation.stage_presence}/100
                </div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium text-gray-600">רושם כללי</div>
                <div className="text-primary-600 font-semibold">
                  {performance.evaluation.overall_impression}/100
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Preview */}
        {performance.notes && !isEditing && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <span className="font-medium">הערות: </span>
            {performance.notes.length > 100 
              ? `${performance.notes.substring(0, 100)}...`
              : performance.notes
            }
          </div>
        )}

        {/* Notes Edit */}
        {isEditing && (
          <div className="mt-3">
            <textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              placeholder="הערות נוספות..."
              className="w-full p-2 text-sm border border-gray-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              rows={3}
            />
          </div>
        )}

        {/* Recording Links */}
        {performance.recordingLinks && performance.recordingLinks.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
            <Play className="w-4 h-4" />
            <span>{performance.recordingLinks.length} הקלטות</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PerformanceCard;