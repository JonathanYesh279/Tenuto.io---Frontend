import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Music, 
  Edit2, 
  Save, 
  X,
  Play,
  Star,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  FileText,
  Link2,
  Plus,
  Trash2
} from 'lucide-react';
import { Card } from './ui/Card';
import type { PresentationDisplay, ProgramPiece } from '../types/bagrut.types';
import { getPresentationStatusColor, getPresentationStatusIcon } from '../services/presentationService';
import DetailedMagenBagrutEditor from './DetailedMagenBagrutEditor';
import apiService from '../services/apiService';
import { getDisplayName } from '@/utils/nameUtils';

interface PresentationCardProps {
  presentation: PresentationDisplay;
  onUpdate: (presentationIndex: number, updatedPresentation: PresentationDisplay) => void;
  onView: (presentation: PresentationDisplay) => void;
  onDelete?: (presentationIndex: number) => void;
  programPieces?: ProgramPiece[];
}

export const PresentationCard: React.FC<PresentationCardProps> = ({
  presentation,
  onUpdate,
  onView,
  onDelete,
  programPieces = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDetailedEditor, setShowDetailedEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editData, setEditData] = useState<PresentationDisplay>(presentation);
  const [examiners, setExaminers] = useState<string[]>([]);
  const [recordingLinks, setRecordingLinks] = useState<string[]>([]);
  const [examinerNames, setExaminerNames] = useState<string>('');

  console.log('🔍 PresentationCard render:', {
    presentationNumber: presentation.presentationNumber,
    'presentation.reviewedBy': presentation.reviewedBy,
    examinerNames,
    renderTime: new Date().toISOString()
  });

  // Initialize form data when presentation changes or editing starts
  React.useEffect(() => {
    if (isEditing) {
      // Initialize examiners from reviewedBy field
      const examinerList = presentation.reviewedBy 
        ? presentation.reviewedBy.split(',').map(name => name.trim()).filter(name => name.length > 0)
        : [''];
      setExaminers(examinerList.length > 0 ? examinerList : ['']);
      
      // Initialize recording links
      const links = presentation.recordingLinks && presentation.recordingLinks.length > 0 
        ? presentation.recordingLinks 
        : [''];
      setRecordingLinks(links);
    }
  }, [isEditing, presentation.reviewedBy, presentation.recordingLinks]);

  // Fetch teacher names if reviewedBy contains IDs
  React.useEffect(() => {
    const fetchExaminerNames = async () => {
      if (presentation.reviewedBy) {
        console.log('🔍 Starting examiner name resolution for:', presentation.reviewedBy);
        const parts = presentation.reviewedBy.split(',').map(s => s.trim());
        const names = [];
        
        for (const part of parts) {
          console.log('🔍 Processing part:', part, 'Is ObjectId?', /^[a-f\d]{24}$/i.test(part));
          // Check if it's a MongoDB ObjectId (24 hex characters)
          if (/^[a-f\d]{24}$/i.test(part)) {
            try {
              console.log('🔍 Fetching teacher for ObjectId:', part);
              const teacher = await apiService.teachers.getTeacher(part);
              console.log('📋 Teacher response for ID', part, ':', teacher);
              const resolvedName = getDisplayName(teacher?.personalInfo) || part;
              console.log('✅ Resolved teacher name:', part, '->', resolvedName);
              names.push(resolvedName);
            } catch (error) {
              console.error('❌ Error fetching teacher name for', part, ':', error);
              names.push(part); // Fallback to ID if fetch fails
            }
          } else {
            // It's already a name, not an ID
            console.log('✅ Using name as-is:', part);
            names.push(part);
          }
        }
        
        const finalNames = names.join(', ');
        console.log('🔍 Final examiner names:', finalNames);
        console.log('🔍 Setting examinerNames state to:', finalNames);
        setExaminerNames(finalNames);
        console.log('🔍 examinerNames state should now be:', finalNames);
      } else {
        setExaminerNames('');
      }
    };
    
    fetchExaminerNames();
  }, [presentation.reviewedBy]);

  const handleSave = () => {
    // Combine examiners into reviewedBy field
    const reviewedByString = examiners.filter(name => name.trim().length > 0).join(', ');
    // Filter out empty recording links
    const validLinks = recordingLinks.filter(link => link.trim().length > 0);
    // Pass the updated data with the correct backendIndex for mapping
    const updatedData = {
      ...editData,
      reviewedBy: reviewedByString,
      recordingLinks: validLinks,
      backendIndex: presentation.backendIndex ?? (presentation.presentationNumber - 1)
    };
    
    console.log('🔍 PresentationCard handleSave:', {
      examiners,
      reviewedByString,
      updatedData,
      presentationNumber: presentation.presentationNumber
    });
    
    onUpdate(presentation.presentationNumber - 1, updatedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(presentation);
    setExaminers([]);
    setRecordingLinks([]);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(presentation.presentationNumber - 1);
      setShowDeleteConfirm(false);
    }
  };

  // Helper functions for managing examiners
  const addExaminer = () => {
    setExaminers([...examiners, '']);
  };

  const updateExaminer = (index: number, value: string) => {
    const updated = [...examiners];
    updated[index] = value;
    setExaminers(updated);
  };

  const removeExaminer = (index: number) => {
    if (examiners.length > 1) {
      setExaminers(examiners.filter((_, i) => i !== index));
    }
  };

  // Helper functions for managing recording links
  const addRecordingLink = () => {
    setRecordingLinks([...recordingLinks, '']);
  };

  const updateRecordingLink = (index: number, value: string) => {
    const updated = [...recordingLinks];
    updated[index] = value;
    setRecordingLinks(updated);
  };

  const removeRecordingLink = (index: number) => {
    if (recordingLinks.length > 1) {
      setRecordingLinks(recordingLinks.filter((_, i) => i !== index));
    }
  };

  const getStatusText = (status?: string, completed?: boolean) => {
    if (completed || status === 'עבר/ה') return 'עבר/ה';
    if (status === 'לא עבר/ה') return 'לא עבר/ה';
    if (status === 'לא נבחן') return 'לא נבחן';
    return 'ממתין';
  };

  const getStatusIcon = (status?: string, completed?: boolean) => {
    if (completed || status === 'עבר/ה') return <CheckCircle className="w-4 h-4" />;
    if (status === 'לא עבר/ה') return <XCircle className="w-4 h-4" />;
    if (status === 'לא נבחן') return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const isMagen = presentation.type === 'magen';

  return (
    <>
      <Card className={`hover:shadow-lg transition-all cursor-pointer group relative ${isMagen ? 'bg-blue-50' : ''}`}>
        <div onClick={() => !isEditing && onView(presentation)} className="p-4">
          {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {isMagen ? <Star className="w-5 h-5 text-yellow-500" /> : <Play className="w-5 h-5 text-primary-600" />}
              <h3 className="text-lg font-semibold text-gray-900">{presentation.title}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPresentationStatusColor(presentation.status, presentation.completed)}`}>
              {getStatusIcon(presentation.status, presentation.completed)}
              {getStatusText(presentation.status, presentation.completed)}
            </span>
            
            {!isEditing && !showDetailedEditor ? (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // For מגן בגרות, show detailed editor
                    if (isMagen && programPieces.length > 0) {
                      setShowDetailedEditor(true);
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                  title="עריכה"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
                    title="מחיקה"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : isEditing ? (
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
            ) : null}
          </div>
        </div>

        {/* Presentation Details */}
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>
                {presentation.date 
                  ? new Date(presentation.date).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'לא נקבע'
                }
              </span>
            </div>

            {(examinerNames || presentation.reviewedBy) && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                <span title={`Original: ${presentation.reviewedBy}, Resolved: ${examinerNames || 'none'}`}>
                  {(() => {
                    const displayName = examinerNames || presentation.reviewedBy;
                    console.log('🔍 Rendering examiner display:', {
                      examinerNames,
                      'presentation.reviewedBy': presentation.reviewedBy,
                      displayName,
                      presentationNumber: presentation.presentationNumber
                    });
                    return displayName;
                  })()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 mb-4">
            {/* Date Input */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700 w-24">תאריך השמעה:</label>
              <input
                type="datetime-local"
                value={editData.date ? new Date(editData.date).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  date: e.target.value ? new Date(e.target.value) : undefined 
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm"
              />
            </div>

            {/* Examiners */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">שמות הבוחנים:</label>
              </div>
              {examiners.map((examiner, index) => (
                <div key={index} className="flex items-center gap-2 mr-6">
                  <input
                    type="text"
                    value={examiner}
                    onChange={(e) => updateExaminer(index, e.target.value)}
                    placeholder="שם הבוחן"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm"
                  />
                  {examiners.length > 1 && (
                    <button
                      onClick={() => removeExaminer(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addExaminer}
                className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded transition-colors text-sm mr-6"
                type="button"
              >
                <Plus className="w-4 h-4" />
                הוסף בוחן
              </button>
            </div>

            {/* Recording Links */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">קישורי תיעוד:</label>
              </div>
              {recordingLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2 mr-6">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => updateRecordingLink(index, e.target.value)}
                    placeholder="https://example.com/recording"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm"
                  />
                  {recordingLinks.length > 1 && (
                    <button
                      onClick={() => removeRecordingLink(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addRecordingLink}
                className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded transition-colors text-sm mr-6"
                type="button"
              >
                <Plus className="w-4 h-4" />
                הוסף קישור
              </button>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">הערות כלליות:</label>
              </div>
              <textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder="הערות כלליות על הביצוע..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm resize-vertical"
                rows={3}
              />
            </div>
          </div>
        )}


        {/* Detailed Grading Preview for Magen */}
        {isMagen && presentation.detailedGrading && !isEditing && (
          <div className="mb-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-blue-200">
                <div className="font-medium text-gray-600">מיומנות נגינה</div>
                <div className="text-primary-600 font-semibold">
                  {presentation.detailedGrading.playingSkills?.points || 0}/40
                </div>
              </div>
              <div className="bg-white p-2 rounded border border-blue-200">
                <div className="font-medium text-gray-600">הבנה מוסיקלית</div>
                <div className="text-primary-600 font-semibold">
                  {presentation.detailedGrading.musicalUnderstanding?.points || 0}/30
                </div>
              </div>
              <div className="bg-white p-2 rounded border border-blue-200">
                <div className="font-medium text-gray-600">ידיעת הטקסט</div>
                <div className="text-primary-600 font-semibold">
                  {presentation.detailedGrading.textKnowledge?.points || 0}/20
                </div>
              </div>
              <div className="bg-white p-2 rounded border border-blue-200">
                <div className="font-medium text-gray-600">נוגן בע"פ</div>
                <div className="text-primary-600 font-semibold">
                  {presentation.detailedGrading.playingByHeart?.points || 0}/10
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Preview */}
        {presentation.notes && !isEditing && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <span className="font-medium">הערות: </span>
            {presentation.notes.length > 100 
              ? `${presentation.notes.substring(0, 100)}...`
              : presentation.notes
            }
          </div>
        )}


        {/* Recording Links */}
        {presentation.recordingLinks && presentation.recordingLinks.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
            <Link2 className="w-4 h-4" />
            <span>{presentation.recordingLinks.length} קישורי תיעוד</span>
          </div>
        )}
        </div>
      </Card>
      
      {/* Detailed Editor Modal for Magen Bagrut */}
      {showDetailedEditor && (
        <DetailedMagenBagrutEditor
          presentation={presentation}
          programPieces={programPieces}
          onSave={(index, updatedPresentation) => {
            onUpdate(index, updatedPresentation);
            setShowDetailedEditor(false);
          }}
          onCancel={() => setShowDetailedEditor(false)}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">מחיקת {presentation.title}</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              האם אתה בטוח שברצונך למחוק את {presentation.title}? 
              פעולה זו לא ניתנת לביטול.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PresentationCard;