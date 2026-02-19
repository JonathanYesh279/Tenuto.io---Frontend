import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Calculator, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import type { ProgramPiece, DetailedGrading, PresentationDisplay } from '../types/bagrut.types';

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

interface DetailedMagenBagrutEditorProps {
  presentation: PresentationDisplay;
  programPieces: ProgramPiece[];
  onSave: (presentationIndex: number, updatedPresentation: PresentationDisplay) => void;
  onCancel: () => void;
}

export const DetailedMagenBagrutEditor: React.FC<DetailedMagenBagrutEditorProps> = ({
  presentation,
  programPieces,
  onSave,
  onCancel
}) => {
  const [presentationDate, setPresentationDate] = useState<string>(
    presentation.date ? new Date(presentation.date).toISOString().slice(0, 16) : ''
  );
  const [examinerNames, setExaminerNames] = useState(presentation.reviewedBy || '');
  const [generalNotes, setGeneralNotes] = useState(presentation.notes || '');
  const [recordingLinks, setRecordingLinks] = useState<string[]>(presentation.recordingLinks || ['']);
  
  // Initialize piece gradings from program pieces
  const [pieceGradings, setPieceGradings] = useState<PieceGrading[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize piece gradings based on program pieces
    const initialGradings = programPieces.map((piece, index) => ({
      pieceNumber: index + 1,
      pieceTitle: piece.pieceTitle,
      composer: piece.composer,
      playingSkills: 0,
      musicalUnderstanding: 0,
      textKnowledge: 0,
      playingByHeart: false,
      comments: ''
    }));
    
    // If we have existing detailed grading data, populate it
    if (presentation.detailedGrading) {
      // This is a simplified mapping - in real implementation, you'd need to match pieces
      // For now, we'll just use the first piece's data for all criteria
      initialGradings.forEach((grading, index) => {
        if (index === 0 && presentation.detailedGrading) {
          grading.playingSkills = presentation.detailedGrading.playingSkills?.points || 0;
          grading.musicalUnderstanding = presentation.detailedGrading.musicalUnderstanding?.points || 0;
          grading.textKnowledge = presentation.detailedGrading.textKnowledge?.points || 0;
          grading.playingByHeart = (presentation.detailedGrading.playingByHeart?.points || 0) === 10;
        }
      });
    }
    
    setPieceGradings(initialGradings);
  }, [programPieces, presentation.detailedGrading]);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate piece gradings
    pieceGradings.forEach((piece, index) => {
      const playingError = validateGrading(index, 'playingSkills', piece.playingSkills);
      const musicalError = validateGrading(index, 'musicalUnderstanding', piece.musicalUnderstanding);
      const textError = validateGrading(index, 'textKnowledge', piece.textKnowledge);

      if (playingError) newErrors[`piece${index}_playingSkills`] = playingError;
      if (musicalError) newErrors[`piece${index}_musicalUnderstanding`] = musicalError;
      if (textError) newErrors[`piece${index}_textKnowledge`] = textError;
    });

    // Validate presentation date
    if (!presentationDate) {
      newErrors.presentationDate = 'תאריך השמעה נדרש';
    }

    // Validate examiner names
    if (!examinerNames.trim()) {
      newErrors.examinerNames = 'שמות הבוחנים נדרשים';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    // Calculate overall grade
    const overallGrade = calculateOverallAverage();
    
    // Create detailed grading object
    const detailedGrading: DetailedGrading = {
      playingSkills: {
        points: Math.round(pieceGradings.reduce((sum, p) => sum + p.playingSkills, 0) / pieceGradings.length),
        maxPoints: 40,
        grade: 'מעולה', // This should be calculated based on points
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
        grade: pieceGradings.filter(p => p.playingByHeart).length > pieceGradings.length / 2 ? 'כן' : 'לא',
        comments: `${pieceGradings.filter(p => p.playingByHeart).length} מתוך ${pieceGradings.length} יצירות נוגנו בע"פ`
      }
    };

    // Update presentation object
    const updatedPresentation: PresentationDisplay = {
      ...presentation,
      date: presentationDate ? new Date(presentationDate) : undefined,
      reviewedBy: examinerNames,
      notes: generalNotes,
      recordingLinks: recordingLinks.filter(link => link.trim() !== ''),
      detailedGrading,
      grade: overallGrade,
      gradeLevel: getGradeLevel(overallGrade),
      completed: overallGrade >= 60,
      status: overallGrade >= 60 ? 'עבר/ה' : 'לא עבר/ה'
    };

    // Add correct backendIndex for מגן בגרות (always -1 to indicate separate endpoint)
    const updatedPresentationWithIndex = {
      ...updatedPresentation,
      backendIndex: -1 // Special marker for מגן בגרות
    };
    
    onSave(presentation.presentationNumber - 1, updatedPresentationWithIndex);
  };

  const getGradeLevel = (grade: number): string => {
    if (grade >= 95) return 'מצטיין במיוחד';
    if (grade >= 90) return 'מצטיין';
    if (grade >= 85) return 'טוב מאוד';
    if (grade >= 70) return 'טוב';
    if (grade >= 60) return 'עובר';
    return 'לא עובר';
  };

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

  // Generate options for select dropdowns
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

  return (
    <div className="detailed-grading-modal">
      <div className="detailed-grading-content">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">מגן בגרות - השמעה 4</h2>
            <p className="text-gray-600 mt-1">השמעה אחרונה לקראת רסיטל וקביעת ציון מגן</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="סגור"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth focus:scroll-auto">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי השמעה</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תאריך השמעה *
                  </label>
                  <input
                    type="datetime-local"
                    value={presentationDate}
                    onChange={(e) => setPresentationDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.presentationDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.presentationDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.presentationDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שמות הבוחנים *
                  </label>
                  <input
                    type="text"
                    value={examinerNames}
                    onChange={(e) => setExaminerNames(e.target.value)}
                    placeholder="שם מלא של הבוחן/ים"
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.examinerNames ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.examinerNames && (
                    <p className="text-red-600 text-sm mt-1">{errors.examinerNames}</p>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">תיעוד השמעה</h3>
              
              <div className="space-y-3">
                {recordingLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updateRecordingLink(index, e.target.value)}
                      placeholder="https://example.com/recording"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {recordingLinks.length > 1 && (
                      <button
                        onClick={() => removeRecordingLink(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addRecordingLink}
                  className="flex items-center gap-2 px-3 py-2 text-primary hover:bg-muted rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  הוסף קישור נוסף
                </button>
              </div>
            </Card>
          </div>

          {/* Detailed Grading Table */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">טבלת ציונים מפורטת</h3>
              <div className="flex items-center gap-2 text-lg font-bold text-primary">
                <Calculator className="w-5 h-5" />
                ממוצע כללי: {calculateOverallAverage()}
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="detailed-grading-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-right text-sm font-semibold text-gray-700 border border-gray-200">
                      מס' יצירה
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-right text-sm font-semibold text-gray-700 border border-gray-200 min-w-[180px]">
                      שם היצירה ומלחין
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border border-gray-200">
                      מיומנות נגינה/שירה<br />
                      <span className="text-xs text-gray-500">(מקס' 40)</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border border-gray-200">
                      הבנה מוסיקלית<br />
                      <span className="text-xs text-gray-500">(מקס' 30)</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border border-gray-200">
                      ידיעת הטקסט<br />
                      <span className="text-xs text-gray-500">(מקס' 20)</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border border-gray-200">
                      נוגן בע"פ<br />
                      <span className="text-xs text-gray-500">(10)</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border border-gray-200">
                      סה"כ<br />
                      <span className="text-xs text-gray-500">(100)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pieceGradings.map((piece, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-3 text-center font-medium text-gray-900 border border-gray-200">
                        {piece.pieceNumber}
                      </td>
                      <td className="px-2 sm:px-4 py-3 border border-gray-200">
                        <div className="text-xs sm:text-sm">
                          <div className="font-medium text-gray-900">{piece.pieceTitle}</div>
                          <div className="text-gray-600">{piece.composer}</div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center border border-gray-200">
                        <select
                          value={piece.playingSkills}
                          onChange={(e) => updatePieceGrading(index, 'playingSkills', parseInt(e.target.value))}
                          className={`w-16 sm:w-20 px-1 sm:px-2 py-1 text-center text-sm border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
                            errors[`piece${index}_playingSkills`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          {generateScoreOptions(40)}
                        </select>
                        {errors[`piece${index}_playingSkills`] && (
                          <div className="text-red-600 text-xs mt-1">{errors[`piece${index}_playingSkills`]}</div>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center border border-gray-200">
                        <select
                          value={piece.musicalUnderstanding}
                          onChange={(e) => updatePieceGrading(index, 'musicalUnderstanding', parseInt(e.target.value))}
                          className={`w-16 sm:w-20 px-1 sm:px-2 py-1 text-center text-sm border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
                            errors[`piece${index}_musicalUnderstanding`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          {generateScoreOptions(30)}
                        </select>
                        {errors[`piece${index}_musicalUnderstanding`] && (
                          <div className="text-red-600 text-xs mt-1">{errors[`piece${index}_musicalUnderstanding`]}</div>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center border border-gray-200">
                        <select
                          value={piece.textKnowledge}
                          onChange={(e) => updatePieceGrading(index, 'textKnowledge', parseInt(e.target.value))}
                          className={`w-16 sm:w-20 px-1 sm:px-2 py-1 text-center text-sm border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
                            errors[`piece${index}_textKnowledge`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          {generateScoreOptions(20)}
                        </select>
                        {errors[`piece${index}_textKnowledge`] && (
                          <div className="text-red-600 text-xs mt-1">{errors[`piece${index}_textKnowledge`]}</div>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center border border-gray-200">
                        <input
                          type="checkbox"
                          checked={piece.playingByHeart}
                          onChange={(e) => updatePieceGrading(index, 'playingByHeart', e.target.checked)}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                        />
                        <div className="text-xs text-gray-600 mt-1">
                          {piece.playingByHeart ? '10' : '0'}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center font-bold text-primary border border-gray-200">
                        {calculateTotalScore(piece)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grade Scale Reference */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
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
          </Card>

          {/* General Notes */}
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">הערות כלליות</h3>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="הערות כלליות על הביצוע, המלצות לשיפור, נקודות חוזק..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
            />
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
            >
              ביטול
            </button>
            
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center px-6 py-2 bg-primary text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <Save className="w-4 h-4 ml-2" />
              שמור ציונים
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedMagenBagrutEditor;