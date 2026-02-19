import React, { useState, useEffect } from 'react';

import { Card } from './ui/Card';
import { InputModal } from './ui/InputModal';
import type { PresentationDisplay, DetailedGrading, ProgramPiece } from '../types/bagrut.types';
import { calculateDetailedGradingTotal, getGradeLevelFromScore } from '../services/presentationService';
import { CalendarIcon, ClockIcon, FileTextIcon, FloppyDiskIcon, LinkIcon, MedalIcon, MusicNotesIcon, PencilSimpleIcon, PlayIcon, StarIcon, UserIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'

interface PresentationDetailsModalProps {
  isOpen: boolean;
  presentation: PresentationDisplay | null;
  programPieces: ProgramPiece[];
  onClose: () => void;
  onUpdate: (presentationIndex: number, presentation: PresentationDisplay) => void;
  onNavigateToTab?: (tabName: string) => void;
}

export const PresentationDetailsModal: React.FC<PresentationDetailsModalProps> = ({
  isOpen,
  presentation,
  programPieces,
  onClose,
  onUpdate,
  onNavigateToTab
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<PresentationDisplay | null>(presentation);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    setEditData(presentation);
    setIsEditing(false);
  }, [presentation]);

  if (!isOpen || !presentation || !editData) return null;

  const isMagen = presentation.type === 'magen';

  const handleSave = () => {
    if (editData) {
      // Calculate total grade for מגן בגרות
      if (isMagen && editData.detailedGrading) {
        const total = calculateDetailedGradingTotal(editData.detailedGrading);
        editData.grade = total;
        editData.gradeLevel = getGradeLevelFromScore(total);
      }
      
      onUpdate(presentation.presentationNumber - 1, editData);
      setIsEditing(false);
      
      // Close modal and navigate to presentations tab after update
      setTimeout(() => {
        onClose();
        if (onNavigateToTab) {
          onNavigateToTab('השמעות');
        }
      }, 100);
    }
  };

  const handleCancel = () => {
    setEditData(presentation);
    setIsEditing(false);
  };

  const updateDetailedGrading = (
    category: keyof DetailedGrading,
    field: 'grade' | 'points' | 'comments',
    value: any
  ) => {
    if (!editData.detailedGrading) {
      editData.detailedGrading = {
        playingSkills: { grade: '', points: 0, maxPoints: 40, comments: '' },
        musicalUnderstanding: { grade: '', points: 0, maxPoints: 30, comments: '' },
        textKnowledge: { grade: '', points: 0, maxPoints: 20, comments: '' },
        playingByHeart: { grade: '', points: 0, maxPoints: 10, comments: '' }
      };
    }
    
    setEditData({
      ...editData,
      detailedGrading: {
        ...editData.detailedGrading,
        [category]: {
          ...editData.detailedGrading[category],
          [field]: value
        }
      }
    });
  };

  const addRecordingLink = (link: string) => {
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
      <div className="bg-white rounded max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {isMagen ? (
              <StarIcon className="w-6 h-6 text-yellow-500" />
            ) : (
              <PlayIcon className="w-6 h-6 text-primary" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">{presentation.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-2 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
              >
                <PencilSimpleIcon className="w-4 h-4" />
                ערוך
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <FloppyDiskIcon className="w-4 h-4" />
                  שמור
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-3 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  <XIcon className="w-4 h-4" />
                  ביטול
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי ההשמעה</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך השמעה</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.date ? new Date(editData.date).toISOString().slice(0, 10) : ''}
                      onChange={(e) => setEditData({ 
                        ...editData, 
                        date: e.target.value ? new Date(e.target.value) : undefined 
                      })}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {presentation.date 
                        ? new Date(presentation.date).toLocaleDateString('he-IL')
                        : 'לא נקבע'
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">שמות הבוחנים</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.reviewedBy || ''}
                      onChange={(e) => setEditData({ ...editData, reviewedBy: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="שמות הבוחנים"
                    />
                  ) : (
                    <p className="text-gray-900">{presentation.reviewedBy || 'לא צוין'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <WarningCircleIcon className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                  {isEditing ? (
                    <select
                      value={editData.status || 'לא נבחן'}
                      onChange={(e) => setEditData({ 
                        ...editData, 
                        status: e.target.value as any,
                        completed: e.target.value === 'עבר/ה'
                      })}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="לא נבחן">לא נבחן</option>
                      <option value="עבר/ה">עבר/ה</option>
                      <option value="לא עבר/ה">לא עבר/ה</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{presentation.status || 'לא נבחן'}</p>
                  )}
                </div>
              </div>

            </div>
          </Card>

          {/* Detailed Grading for מגן בגרות */}
          {isMagen && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">פירוט ציונים - מגן בגרות</h3>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-right px-4 py-2 font-medium text-gray-700">קריטריון</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-700">ניקוד</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-700">מקסימום</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-700">הערות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 font-medium">מיומנות נגינה/שירה</td>
                        <td className="text-center px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={editData.detailedGrading?.playingSkills?.points || 0}
                              onChange={(e) => updateDetailedGrading('playingSkills', 'points', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          ) : (
                            <span className="font-semibold text-primary">
                              {editData.detailedGrading?.playingSkills?.points || 0}
                            </span>
                          )}
                        </td>
                        <td className="text-center px-4 py-3 text-gray-600">40</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.detailedGrading?.playingSkills?.comments || ''}
                              onChange={(e) => updateDetailedGrading('playingSkills', 'comments', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="הערות..."
                            />
                          ) : (
                            <span className="text-gray-600 text-sm">
                              {editData.detailedGrading?.playingSkills?.comments || '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">הבנה מוסיקלית</td>
                        <td className="text-center px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={editData.detailedGrading?.musicalUnderstanding?.points || 0}
                              onChange={(e) => updateDetailedGrading('musicalUnderstanding', 'points', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          ) : (
                            <span className="font-semibold text-primary">
                              {editData.detailedGrading?.musicalUnderstanding?.points || 0}
                            </span>
                          )}
                        </td>
                        <td className="text-center px-4 py-3 text-gray-600">30</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.detailedGrading?.musicalUnderstanding?.comments || ''}
                              onChange={(e) => updateDetailedGrading('musicalUnderstanding', 'comments', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="הערות..."
                            />
                          ) : (
                            <span className="text-gray-600 text-sm">
                              {editData.detailedGrading?.musicalUnderstanding?.comments || '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">ידיעת הטקסט</td>
                        <td className="text-center px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={editData.detailedGrading?.textKnowledge?.points || 0}
                              onChange={(e) => updateDetailedGrading('textKnowledge', 'points', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          ) : (
                            <span className="font-semibold text-primary">
                              {editData.detailedGrading?.textKnowledge?.points || 0}
                            </span>
                          )}
                        </td>
                        <td className="text-center px-4 py-3 text-gray-600">20</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.detailedGrading?.textKnowledge?.comments || ''}
                              onChange={(e) => updateDetailedGrading('textKnowledge', 'comments', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="הערות..."
                            />
                          ) : (
                            <span className="text-gray-600 text-sm">
                              {editData.detailedGrading?.textKnowledge?.comments || '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">נוגן בע"פ</td>
                        <td className="text-center px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={editData.detailedGrading?.playingByHeart?.points || 0}
                              onChange={(e) => updateDetailedGrading('playingByHeart', 'points', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          ) : (
                            <span className="font-semibold text-primary">
                              {editData.detailedGrading?.playingByHeart?.points || 0}
                            </span>
                          )}
                        </td>
                        <td className="text-center px-4 py-3 text-gray-600">10</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.detailedGrading?.playingByHeart?.comments || ''}
                              onChange={(e) => updateDetailedGrading('playingByHeart', 'comments', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="הערות..."
                            />
                          ) : (
                            <span className="text-gray-600 text-sm">
                              {editData.detailedGrading?.playingByHeart?.comments || '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="bg-primary font-semibold">
                        <td className="px-4 py-3">סה"כ</td>
                        <td className="text-center px-4 py-3 text-primary text-lg">
                          {calculateDetailedGradingTotal(editData.detailedGrading)}
                        </td>
                        <td className="text-center px-4 py-3">100</td>
                        <td className="px-4 py-3 text-primary">
                          {getGradeLevelFromScore(calculateDetailedGradingTotal(editData.detailedGrading))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* Recording Links */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">קישורי תיעוד</h3>
              {isEditing && (
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center gap-1 px-3 py-2 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                >
                  <LinkIcon className="w-4 h-4" />
                  הוסף קישור
                </button>
              )}
            </div>
            {editData.recordingLinks && editData.recordingLinks.length > 0 ? (
              <div className="space-y-2">
                {editData.recordingLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <PlayIcon className="w-4 h-4 text-blue-600" />
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
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">אין קישורי תיעוד</p>
            )}
          </Card>

          {/* General Notes */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">הערות כלליות</h3>
            {isEditing ? (
              <textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                rows={4}
                placeholder="הערות כלליות על ההשמעה..."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">
                {presentation.notes || 'אין הערות'}
              </p>
            )}
          </Card>
        </div>
        
        {/* Link Input Modal */}
        <InputModal
          isOpen={showLinkModal}
          title="הוסף קישור לתיעוד"
          placeholder="https://example.com/recording"
          onSubmit={addRecordingLink}
          onClose={() => setShowLinkModal(false)}
        />
      </div>
    </div>
  );
};

export default PresentationDetailsModal;