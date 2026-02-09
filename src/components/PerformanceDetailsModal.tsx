import React, { useState } from 'react';
import { 
  X,
  Calendar,
  MapPin,
  Clock,
  Music,
  Play,
  Star,
  User,
  FileText,
  Link2,
  Edit3,
  Save
} from 'lucide-react';
import { Card } from './ui/Card';
import type { Performance, ProgramPiece } from '../types/bagrut.types';

interface PerformanceDetailsModalProps {
  isOpen: boolean;
  performance: Performance | null;
  programPieces: ProgramPiece[];
  onClose: () => void;
  onUpdate: (performance: Performance) => void;
}

export const PerformanceDetailsModal: React.FC<PerformanceDetailsModalProps> = ({
  isOpen,
  performance,
  programPieces,
  onClose,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Performance | null>(performance);

  React.useEffect(() => {
    setEditData(performance);
    setIsEditing(false);
  }, [performance]);

  if (!isOpen || !performance || !editData) return null;

  const handleSave = () => {
    if (editData) {
      onUpdate(editData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditData(performance);
    setIsEditing(false);
  };

  const updateEvaluation = (field: keyof NonNullable<Performance['evaluation']>, value: any) => {
    setEditData(prev => prev ? {
      ...prev,
      evaluation: {
        ...prev.evaluation,
        technique: 0,
        interpretation: 0,
        stage_presence: 0,
        overall_impression: 0,
        ...prev.evaluation,
        [field]: value
      }
    } : null);
  };

  const addRecordingLink = () => {
    const link = prompt('הכנס קישור להקלטה:');
    if (link && editData) {
      setEditData({
        ...editData,
        recordingLinks: [...(editData.recordingLinks || []), link]
      });
    }
  };

  const removeRecordingLink = (index: number) => {
    if (editData) {
      setEditData({
        ...editData,
        recordingLinks: editData.recordingLinks?.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 text-primary-600" />
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 focus:border-primary-500 outline-none"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">{performance.title}</h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
              >
                <Edit3 className="w-4 h-4" />
                ערוך
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                  שמור
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  ביטול
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי הביצוع</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך וזמן</label>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editData.date ? new Date(editData.date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditData({ 
                        ...editData, 
                        date: e.target.value ? new Date(e.target.value) : undefined 
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {performance.date 
                        ? new Date(performance.date).toLocaleString('he-IL', {
                            dateStyle: 'full',
                            timeStyle: 'short'
                          })
                        : 'לא נקבע'
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">מקום</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.location || ''}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="מקום הביצוע"
                    />
                  ) : (
                    <p className="text-gray-900">{performance.location || 'לא צוין'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">משך זמן</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.duration || ''}
                      onChange={(e) => setEditData({ ...editData, duration: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="לדוגמה: 45 דקות"
                    />
                  ) : (
                    <p className="text-gray-900">{performance.duration || 'לא צוין'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                  {isEditing ? (
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ 
                        ...editData, 
                        status: e.target.value as Performance['status']
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="scheduled">מתוזמן</option>
                      <option value="completed">הושלם</option>
                      <option value="cancelled">בוטל</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {performance.status === 'completed' && 'הושלם'}
                      {performance.status === 'scheduled' && 'מתוזמן'}
                      {performance.status === 'cancelled' && 'בוטל'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Program Pieces */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">יצירות בביצוע</h3>
            <div className="space-y-2">
              {performance.pieces.map((pieceTitle, index) => {
                const piece = programPieces.find(p => 
                  (p.pieceTitle === pieceTitle) || 
                  (p.pieceName === pieceTitle)
                );
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Music className="w-4 h-4 text-primary-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{pieceTitle}</div>
                      {piece && (
                        <div className="text-sm text-gray-600">
                          {piece.composer} {piece.duration && `• ${piece.duration}`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {performance.pieces.length === 0 && (
                <p className="text-gray-500 text-center py-4">אין יצירות שהוגדרו לביצוע זה</p>
              )}
            </div>
          </Card>

          {/* Evaluation */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">הערכה</h3>
            {performance.evaluation || isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'technique', label: 'טכניקה' },
                    { key: 'interpretation', label: 'פרשנות' },
                    { key: 'stage_presence', label: 'נוכחות במה' },
                    { key: 'overall_impression', label: 'רושם כללי' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editData.evaluation?.[key as keyof NonNullable<Performance['evaluation']>] || 0}
                          onChange={(e) => updateEvaluation(
                            key as keyof NonNullable<Performance['evaluation']>, 
                            parseInt(e.target.value) || 0
                          )}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <div className="text-2xl font-bold text-primary-600">
                          {performance.evaluation?.[key as keyof NonNullable<Performance['evaluation']>] || 0}/100
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">הערות המעריך</label>
                  {isEditing ? (
                    <textarea
                      value={editData.evaluation?.comments || ''}
                      onChange={(e) => updateEvaluation('comments', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={4}
                      placeholder="הערות על הביצוע..."
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {performance.evaluation?.comments || 'אין הערות'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">מעריך</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.evaluation?.evaluator || ''}
                        onChange={(e) => updateEvaluation('evaluator', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="שם המעריך"
                      />
                    ) : (
                      <p className="text-gray-900">{performance.evaluation?.evaluator || 'לא צוין'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תאריך הערכה</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editData.evaluation?.evaluationDate 
                          ? new Date(editData.evaluation.evaluationDate).toISOString().slice(0, 10)
                          : ''
                        }
                        onChange={(e) => updateEvaluation(
                          'evaluationDate', 
                          e.target.value ? new Date(e.target.value) : undefined
                        )}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {performance.evaluation?.evaluationDate 
                          ? new Date(performance.evaluation.evaluationDate).toLocaleDateString('he-IL')
                          : 'לא צוין'
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">לא בוצעה הערכה עדיין</p>
            )}
          </Card>

          {/* Recording Links */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">הקלטות</h3>
              {isEditing && (
                <button
                  onClick={addRecordingLink}
                  className="flex items-center gap-1 px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                >
                  <Link2 className="w-4 h-4" />
                  הוסף קישור
                </button>
              )}
            </div>
            {editData.recordingLinks && editData.recordingLinks.length > 0 ? (
              <div className="space-y-2">
                {editData.recordingLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Play className="w-4 h-4 text-blue-600" />
                    <a 
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-blue-600 hover:underline truncate"
                    >
                      {link}
                    </a>
                    {isEditing && (
                      <button
                        onClick={() => removeRecordingLink(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">אין הקלטות</p>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">הערות נוספות</h3>
            {isEditing ? (
              <textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={4}
                placeholder="הערות נוספות על הביצוע..."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">
                {performance.notes || 'אין הערות נוספות'}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDetailsModal;