import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Link2, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Calculator,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Card } from './ui/Card';
import type { Bagrut, ProgramPiece, DetailedGrading } from '../types/bagrut.types';
import apiService from '../services/apiService';

interface PieceGrading {
  pieceNumber: number;
  pieceTitle: string;
  composer: string;
  playingSkills: number; // 0-40
  musicalUnderstanding: number; // 0-30 
  textKnowledge: number; // 0-20
  playingByHeart: boolean; // כן/לא - if true, gets 10 points
  comments?: string;
}

interface MagenBagrutTabProps {
  bagrut: Bagrut;
  onUpdate: (magenData: any) => Promise<void>;
}

export const MagenBagrutTab: React.FC<MagenBagrutTabProps> = ({ bagrut, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [examinerDisplayNames, setExaminerDisplayNames] = useState<string>('');
  const [formData, setFormData] = useState({
    date: '',
    reviewedBy: [''],
    recordingLinks: [''],
    review: '',
    completed: false,
    grade: 0,
    detailedGrading: null
  });
  const [pieceGradings, setPieceGradings] = useState<PieceGrading[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data from bagrut.magenBagrut
  useEffect(() => {
    if (bagrut.magenBagrut) {
      const examiners = bagrut.magenBagrut.reviewedBy 
        ? bagrut.magenBagrut.reviewedBy.split(',').map(name => name.trim())
        : [''];
      
      const links = bagrut.magenBagrut.recordingLinks && bagrut.magenBagrut.recordingLinks.length > 0
        ? bagrut.magenBagrut.recordingLinks
        : [''];

      setFormData({
        date: bagrut.magenBagrut.date ? new Date(bagrut.magenBagrut.date).toISOString().slice(0, 16) : '',
        reviewedBy: examiners.length > 0 ? examiners : [''],
        recordingLinks: links,
        review: bagrut.magenBagrut.review || '',
        completed: bagrut.magenBagrut.completed || false,
        grade: bagrut.magenBagrut.grade || 0,
        detailedGrading: bagrut.magenBagrut.detailedGrading || null
      });
    }

    // Initialize piece gradings from program pieces
    if (bagrut.program && bagrut.program.length > 0) {
      const initialGradings = bagrut.program.map((piece, index) => ({
        pieceNumber: piece.pieceNumber || index + 1,
        pieceTitle: piece.pieceTitle,
        composer: piece.composer,
        playingSkills: 0,
        musicalUnderstanding: 0,
        textKnowledge: 0,
        playingByHeart: false,
        comments: ''
      }));

      // Don't auto-populate with averages - let each piece start with zeros
      // Only restore specific piece gradings if they exist
      
      // Override with piece-specific gradings if available (for backward compatibility)
      if (bagrut.magenBagrut?.pieceGradings) {
        bagrut.magenBagrut.pieceGradings.forEach((stored, index) => {
          if (initialGradings[index]) {
            initialGradings[index] = { ...initialGradings[index], ...stored };
          }
        });
      }
      
      setPieceGradings(initialGradings);
    }
  }, [bagrut.magenBagrut, bagrut.program]);

  // Fetch teacher names if reviewedBy contains IDs
  useEffect(() => {
    const fetchExaminerNames = async () => {
      if (bagrut.magenBagrut?.reviewedBy) {
        const parts = bagrut.magenBagrut.reviewedBy.split(',').map(s => s.trim());
        const names = [];
        
        for (const part of parts) {
          // Check if it's a MongoDB ObjectId (24 hex characters)
          if (/^[a-f\d]{24}$/i.test(part)) {
            try {
              const teacher = await apiService.teachers.getTeacher(part);
              console.log('📋 Teacher response for ID', part, ':', teacher);
              const fullName = teacher?.personalInfo?.fullName 
                || (teacher?.personalInfo?.firstName && teacher?.personalInfo?.lastName
                  ? `${teacher.personalInfo.firstName} ${teacher.personalInfo.lastName}`
                  : teacher?.personalInfo?.firstName || teacher?.personalInfo?.lastName)
                || part;
              console.log('✅ Resolved teacher name:', part, '->', fullName);
              names.push(fullName);
            } catch (error) {
              console.error('Error fetching teacher name:', error);
              names.push(part); // Fallback to ID if fetch fails
            }
          } else {
            // It's already a name, not an ID
            names.push(part);
          }
        }
        
        setExaminerDisplayNames(names.join(', '));
      } else {
        setExaminerDisplayNames('');
      }
    };
    
    fetchExaminerNames();
  }, [bagrut.magenBagrut?.reviewedBy]);

  // Grading helper functions
  const validateGrading = (pieceIndex: number, field: string, value: number): string | null => {
    const maxValues = {
      playingSkills: 40,
      musicalUnderstanding: 30,
      textKnowledge: 20
    };

    const maxValue = maxValues[field as keyof typeof maxValues];
    if (value < 0) return 'הציון חייב להיות חיובי';
    if (value > maxValue) return `הציון המקסימלי הוא ${maxValue}`;
    return null;
  };

  const updatePieceGrading = (pieceIndex: number, field: keyof PieceGrading, value: any) => {
    setPieceGradings(prev => {
      const updated = [...prev];
      updated[pieceIndex] = { ...updated[pieceIndex], [field]: value };
      return updated;
    });

    // Clear error for this field
    const errorKey = `piece${pieceIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const calculateTotalScore = (piece: PieceGrading): number => {
    return piece.playingSkills + piece.musicalUnderstanding + piece.textKnowledge + (piece.playingByHeart ? 10 : 0);
  };

  const calculateOverallAverage = (): number => {
    if (pieceGradings.length === 0) return 0;
    const totalScore = pieceGradings.reduce((sum, piece) => sum + calculateTotalScore(piece), 0);
    const maxPossibleScore = pieceGradings.length * 100; // Each piece can get max 100 points
    return Math.round((totalScore / maxPossibleScore) * 100);
  };

  const getGradeLevel = (grade: number): string => {
    if (grade >= 90) return 'מעולה';
    if (grade >= 80) return 'טוב מאוד';
    if (grade >= 70) return 'טוב';
    if (grade >= 60) return 'מספיק';
    if (grade >= 55) return 'מספיק בקושי';
    if (grade >= 1) return 'לא עבר/ה';
    return null; // For grade 0 or no grade
  };

  const generateScoreOptions = (max: number) => {
    const options = [];
    for (let i = 0; i <= max; i++) {
      options.push(
        <option key={i} value={i}>
          {i}
        </option>
      );
    }
    return options;
  };

  const handleSave = async () => {
    try {
      console.log('🔄 Starting מגן בגרות save process...');
      console.log('🔍 Current form data:', formData);
      console.log('🔍 Current piece gradings:', pieceGradings);
      
      const reviewedByString = formData.reviewedBy.filter(name => name.trim().length > 0).join(', ');
      const validLinks = formData.recordingLinks.filter(link => link.trim().length > 0);
      
      console.log('🔍 Processed reviewedByString:', reviewedByString);
      console.log('🔍 Processed validLinks:', validLinks);
      
      // Calculate overall grade from piece gradings
      const overallGrade = calculateOverallAverage();
      console.log('🔍 Calculated overall grade:', overallGrade);
      
      // Create detailed grading object from piece gradings
      let detailedGrading: DetailedGrading | null = null;
      if (pieceGradings.length > 0) {
        detailedGrading = {
          playingSkills: {
            points: Math.round(pieceGradings.reduce((sum, p) => sum + p.playingSkills, 0) / pieceGradings.length),
            maxPoints: 40,
            grade: 'מעולה',
            comments: 'ממוצע מכל היצירות'
          },
          musicalUnderstanding: {
            points: Math.round(pieceGradings.reduce((sum, p) => sum + p.musicalUnderstanding, 0) / pieceGradings.length),
            maxPoints: 30,
            grade: 'טוב מאוד',
            comments: 'ממוצע מכל היצירות'
          },
          textKnowledge: {
            points: Math.round(pieceGradings.reduce((sum, p) => sum + p.textKnowledge, 0) / pieceGradings.length),
            maxPoints: 20,
            grade: 'טוב',
            comments: 'ממוצע מכל היצירות'
          },
          playingByHeart: {
            points: pieceGradings.filter(p => p.playingByHeart).length > pieceGradings.length / 2 ? 10 : 0,
            maxPoints: 10,
            grade: pieceGradings.filter(p => p.playingByHeart).length > pieceGradings.length / 2 ? 'מעולה' : 'לא הוערך',
            comments: `${pieceGradings.filter(p => p.playingByHeart).length} מתוך ${pieceGradings.length} יצירות נוגנו בע"פ`
          }
        };
      }
      
      const magenData = {
        date: formData.date ? new Date(formData.date) : undefined,
        reviewedBy: reviewedByString,
        review: formData.review,
        recordingLinks: validLinks,
        completed: overallGrade >= 60,
        grade: overallGrade,
        gradeLevel: getGradeLevel(overallGrade),
        detailedGrading: detailedGrading,
        pieceGradings: pieceGradings // Store individual piece gradings
      };

      console.log('💾 Final מגן בגרות data to save:', magenData);
      
      // Save to backend through the API via parent component
      console.log('📡 Calling onUpdate with magen data...');
      await onUpdate(magenData);
      console.log('✅ onUpdate completed successfully');
      
      setIsEditing(false);
      console.log('🔄 Edit mode disabled, save process completed');
    } catch (error) {
      console.error('❌ Error saving מגן בגרות:', error);
      console.error('❌ Error details:', error.message, error.stack);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original
  };

  const addExaminer = () => {
    setFormData(prev => ({ ...prev, reviewedBy: [...prev.reviewedBy, ''] }));
  };

  const updateExaminer = (index: number, value: string) => {
    setFormData(prev => {
      const updated = [...prev.reviewedBy];
      updated[index] = value;
      return { ...prev, reviewedBy: updated };
    });
  };

  const removeExaminer = (index: number) => {
    if (formData.reviewedBy.length > 1) {
      setFormData(prev => ({
        ...prev,
        reviewedBy: prev.reviewedBy.filter((_, i) => i !== index)
      }));
    }
  };

  const addRecordingLink = () => {
    setFormData(prev => ({ ...prev, recordingLinks: [...prev.recordingLinks, ''] }));
  };

  const updateRecordingLink = (index: number, value: string) => {
    setFormData(prev => {
      const updated = [...prev.recordingLinks];
      updated[index] = value;
      return { ...prev, recordingLinks: updated };
    });
  };

  const removeRecordingLink = (index: number) => {
    if (formData.recordingLinks.length > 1) {
      setFormData(prev => ({
        ...prev,
        recordingLinks: prev.recordingLinks.filter((_, i) => i !== index)
      }));
    }
  };

  const getStatusColor = () => {
    if (!bagrut.magenBagrut) return 'gray';
    if (bagrut.magenBagrut.completed) return 'green';
    if (bagrut.magenBagrut.date) return 'orange';
    return 'gray';
  };

  const getStatusIcon = () => {
    if (!bagrut.magenBagrut) return <AlertCircle className="w-4 h-4" />;
    if (bagrut.magenBagrut.completed) return <CheckCircle className="w-4 h-4" />;
    if (bagrut.magenBagrut.date) return <Clock className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!bagrut.magenBagrut) return 'לא נקבע';
    if (bagrut.magenBagrut.completed) return 'הושלם';
    if (bagrut.magenBagrut.date) return 'מתוזמן';
    // Since bagrut exists, show 'בתהליך' instead of 'ממתין'
    return 'בתהליך';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900">מגן בגרות</h3>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium 
            ${getStatusColor() === 'green' ? 'bg-green-100 text-green-800' : 
              getStatusColor() === 'orange' ? 'bg-orange-100 text-orange-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {getStatusIcon()}
            {getStatusText()}
          </span>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              עריכה
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                שמור
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                ביטול
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {bagrut.magenBagrut || isEditing ? (
        <div className="space-y-6">
          {/* Basic Information Card - Full Width */}
          <Card>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">פרטי השמעה</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Date Section */}
              <div>
                {!isEditing ? (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-600">תאריך השמעה</div>
                      <div className="font-medium text-gray-900">
                        {bagrut.magenBagrut?.date ? (
                          new Date(bagrut.magenBagrut.date).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        ) : (
                          <span className="text-gray-400">לא נקבע</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4" />
                      תאריך השמעה
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Examiners Section */}
              <div className="md:col-span-2">
                {!isEditing ? (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-600">בוחנים</div>
                      <div className="font-medium text-gray-900">
                        {(examinerDisplayNames || bagrut.magenBagrut?.reviewedBy) ? (
                          examinerDisplayNames || bagrut.magenBagrut.reviewedBy
                        ) : (
                          <span className="text-gray-400">לא הוזנו</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      שמות הבוחנים
                    </label>
                    {formData.reviewedBy.map((examiner, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={examiner}
                          onChange={(e) => updateExaminer(index, e.target.value)}
                          placeholder="שם הבוחן"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {formData.reviewedBy.length > 1 && (
                          <button
                            onClick={() => removeExaminer(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addExaminer}
                      className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      הוסף בוחן
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recording Links Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              {!isEditing ? (
                <div className="flex items-start gap-3">
                  <Link2 className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-2">קישורי תיעוד</div>
                    {bagrut.magenBagrut?.recordingLinks && bagrut.magenBagrut.recordingLinks.length > 0 ? (
                      <div className="space-y-1">
                        {bagrut.magenBagrut.recordingLinks.map((link, index) => (
                          <a 
                            key={index}
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block text-blue-600 hover:text-blue-800 hover:underline text-sm"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">אין קישורים</div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Link2 className="w-4 h-4" />
                    קישורי תיעוד
                  </label>
                  {formData.recordingLinks.map((link, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => updateRecordingLink(index, e.target.value)}
                        placeholder="https://example.com/recording"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {formData.recordingLinks.length > 1 && (
                        <button
                          onClick={() => removeRecordingLink(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addRecordingLink}
                    className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    הוסף קישור
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Grading Table - Show when we have program pieces */}
          {bagrut.program && bagrut.program.length > 0 ? (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-gray-900">טבלת ציונים מפורטת</h4>
                {pieceGradings.length > 0 && (
                  <div className="flex items-center gap-2 text-lg font-bold text-primary-600">
                    <Calculator className="w-5 h-5" />
                    ממוצע כללי: {calculateOverallAverage()}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 border border-gray-200">
                        מס' יצירה
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 border border-gray-200 min-w-[200px]">
                        שם היצירה ומלחין
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-gray-200">
                        מיומנות נגינה/שירה<br />
                        <span className="text-xs text-gray-500">(מקס' 40)</span>
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-gray-200">
                        הבנה מוסיקלית<br />
                        <span className="text-xs text-gray-500">(מקס' 30)</span>
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-gray-200">
                        ידיעת הטקסט<br />
                        <span className="text-xs text-gray-500">(מקס' 20)</span>
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-gray-200">
                        נוגן בע"פ<br />
                        <span className="text-xs text-gray-500">(10)</span>
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-gray-200">
                        סה"כ<br />
                        <span className="text-xs text-gray-500">(100)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pieceGradings.length > 0 ? pieceGradings.map((piece, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-center font-medium text-gray-900 border border-gray-200">
                          {piece.pieceNumber}
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{piece.pieceTitle}</div>
                            <div className="text-gray-600">{piece.composer}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-200">
                          {isEditing ? (
                            <select
                              value={piece.playingSkills}
                              onChange={(e) => updatePieceGrading(index, 'playingSkills', parseInt(e.target.value))}
                              className={`w-20 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                errors[`piece${index}_playingSkills`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            >
                              {generateScoreOptions(40)}
                            </select>
                          ) : (
                            <span className="font-medium text-gray-900">{piece.playingSkills}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-200">
                          {isEditing ? (
                            <select
                              value={piece.musicalUnderstanding}
                              onChange={(e) => updatePieceGrading(index, 'musicalUnderstanding', parseInt(e.target.value))}
                              className={`w-20 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                errors[`piece${index}_musicalUnderstanding`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            >
                              {generateScoreOptions(30)}
                            </select>
                          ) : (
                            <span className="font-medium text-gray-900">{piece.musicalUnderstanding}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-200">
                          {isEditing ? (
                            <select
                              value={piece.textKnowledge}
                              onChange={(e) => updatePieceGrading(index, 'textKnowledge', parseInt(e.target.value))}
                              className={`w-20 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                errors[`piece${index}_textKnowledge`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            >
                              {generateScoreOptions(20)}
                            </select>
                          ) : (
                            <span className="font-medium text-gray-900">{piece.textKnowledge}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-200">
                          {isEditing ? (
                            <div className="flex flex-col items-center">
                              <button
                                type="button"
                                onClick={() => updatePieceGrading(index, 'playingByHeart', !piece.playingByHeart)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                                  piece.playingByHeart ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    piece.playingByHeart ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                              <span className="text-xs text-gray-600 mt-1">
                                {piece.playingByHeart ? '10' : '0'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              {piece.playingByHeart ? (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">כן</span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm font-medium">לא</span>
                              )}
                              <span className="text-xs text-gray-600 mt-1">
                                {piece.playingByHeart ? '10' : '0'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-primary-600 border border-gray-200">
                          {calculateTotalScore(piece)}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500 border border-gray-200">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="w-8 h-8 text-gray-300" />
                            <p>אין יצירות בתכנית הבגרות לדירוג</p>
                            <p className="text-sm">יש להוסיף יצירות בלשונית "יצירות בתכנית" לפני המשך הדירוג</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Grade Scale Reference - Only show when editing */}
              {isEditing && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">מפתח ציונים</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-green-600">95-100</span>
                      <span className="text-gray-600">מצטיין במיוחד</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-green-600">90-94</span>
                      <span className="text-gray-600">מצטיין</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-blue-600">85-89</span>
                      <span className="text-gray-600">טוב מאוד</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-yellow-600">70-84</span>
                      <span className="text-gray-600">טוב</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-orange-600">60-69</span>
                      <span className="text-gray-600">עובר</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-red-600">0-59</span>
                      <span className="text-gray-600">לא עובר</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">אין יצירות בתכנית הבגרות</h4>
                <p className="text-gray-600 mb-6">
                  לפני שניתן לדרג את המגן בגרות, יש להוסיף יצירות לתכנית הבגרות.
                  <br />
                  עבור ללשונית "יצירות בתכנית" והוסף לפחות יצירה אחת.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      // Simulate clicking on the "יצירות בתכנית" tab
                      const worksTab = document.querySelector('[data-tab="works"]');
                      if (worksTab) {
                        (worksTab as HTMLElement).click();
                      }
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    עבור לרשימת יצירות
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">מגן בגרות טרם נקבע</h4>
          <p className="text-gray-600 mb-6">השמעת מגן בגרות היא השמעה אחרונה לקראת רסיטל וקביעת ציון מגן</p>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            הגדר מגן בגרות
          </button>
        </div>
      )}
    </div>
  );
};

export default MagenBagrutTab;