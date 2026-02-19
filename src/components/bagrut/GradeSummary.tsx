import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';

import { Bagrut, DirectorEvaluation } from '@/types/bagrut.types';
import { CalculatorIcon, MedalIcon, StarIcon, TrophyIcon, WarningIcon } from '@phosphor-icons/react'

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

interface CompletionStatus {
  presentations: {
    completed: number;
    total: number;
    percentage: number;
  };
  programPieces: {
    completed: number;
    required: number;
    percentage: number;
  };
  directorEvaluation: {
    completed: boolean;
    percentage: number;
  };
  overall: {
    percentage: number;
    canComplete: boolean;
  };
}

interface GradeSummaryProps {
  bagrut: Bagrut;
  completionStatus: CompletionStatus | null;
  validationErrors: ValidationError[];
}

export const GradeSummary: React.FC<GradeSummaryProps> = ({
  bagrut,
  completionStatus,
  validationErrors,
}) => {
  const calculateFinalGrade = (): number => {
    const magenPresentation = bagrut.presentations?.[3];
    if (!magenPresentation?.grade) return 0;
    
    const performanceWeight = magenPresentation.grade * 0.9; // 90%
    const directorWeight = (bagrut.directorEvaluation?.points || 0) * 0.1 * 10; // 10% (convert 0-10 to 0-100 scale)
    
    return Math.round(performanceWeight + directorWeight);
  };

  const getGradeLevel = (score: number): { level: string; range: string; description: string } => {
    const gradeCategories = [
      { level: 'מצוין', range: '95-100', description: 'רמה יוצאת דופן', min: 95, color: 'bg-green-600' },
      { level: 'טוב מאוד', range: '85-94', description: 'רמה גבוהה מאוד', min: 85, color: 'bg-green-500' },
      { level: 'טוב', range: '75-84', description: 'רמה טובה', min: 75, color: 'bg-blue-500' },
      { level: 'כמעט טוב', range: '65-74', description: 'רמה מעל הממוצע', min: 65, color: 'bg-blue-400' },
      { level: 'מספק', range: '55-64', description: 'רמה מספקת', min: 55, color: 'bg-yellow-500' },
      { level: 'כמעט מספק', range: '45-54', description: 'רמה מתחת לממוצע', min: 45, color: 'bg-orange-500' },
      { level: 'לא מספק', range: '35-44', description: 'רמה נמוכה', min: 35, color: 'bg-red-500' },
      { level: 'גרוע', range: '0-34', description: 'רמה לא מתאימה', min: 0, color: 'bg-red-600' },
    ];

    for (const category of gradeCategories) {
      if (score >= category.min) {
        return category;
      }
    }
    
    return gradeCategories[gradeCategories.length - 1];
  };

  const finalGrade = calculateFinalGrade();
  const gradeInfo = getGradeLevel(finalGrade);
  const magenPresentation = bagrut.presentations?.[3];
  const isComplete = !!(magenPresentation?.grade && bagrut.directorEvaluation?.points);
  const hasErrors = validationErrors.filter(e => e.type === 'error').length > 0;

  const getAllGradeCategories = () => [
    { level: 'מצוין', range: '95-100', description: 'רמה יוצאת דופן', color: 'bg-green-600' },
    { level: 'טוב מאוד', range: '85-94', description: 'רמה גבוהה מאוד', color: 'bg-green-500' },
    { level: 'טוב', range: '75-84', description: 'רמה טובה', color: 'bg-blue-500' },
    { level: 'כמעט טוב', range: '65-74', description: 'רמה מעל הממוצע', color: 'bg-blue-400' },
    { level: 'מספק', range: '55-64', description: 'רמה מספקת', color: 'bg-yellow-500' },
    { level: 'כמעט מספק', range: '45-54', description: 'רמה מתחת לממוצע', color: 'bg-orange-500' },
    { level: 'לא מספק', range: '35-44', description: 'רמה נמוכה', color: 'bg-red-500' },
    { level: 'גרוע', range: '0-34', description: 'רמה לא מתאימה', color: 'bg-red-600' },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <CalculatorIcon className="w-7 h-7 ml-3 text-blue-600" />
            סיכום ציונים - בגרות במוסיקה
          </h3>
          {isComplete && (
            <Badge variant="success" className="text-lg px-4 py-2">
              <TrophyIcon className="w-5 h-5 ml-2" />
              הושלם
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Grade */}
          <div className="text-center">
            <div className="bg-blue-50 rounded p-4 border-2 border-blue-200">
              <MedalIcon className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <h4 className="font-semibold text-gray-900 mb-1">ציון מגן בגרות</h4>
              <div className="text-3xl font-bold text-blue-800">
                {magenPresentation?.grade !== undefined ? magenPresentation.grade : '--'}/100
              </div>
              <div className="text-sm text-gray-600 mt-1">
                90% מהציון הסופי
              </div>
              {magenPresentation?.grade !== undefined && (
                <div className="text-xs text-blue-700 mt-1">
                  תרומה: {(magenPresentation.grade * 0.9).toFixed(1)} נקודות
                </div>
              )}
            </div>
          </div>

          {/* Director Evaluation */}
          <div className="text-center">
            <div className="bg-green-50 rounded p-4 border-2 border-green-200">
              <StarIcon className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <h4 className="font-semibold text-gray-900 mb-1">הערכת המנהל/ת</h4>
              <div className="text-3xl font-bold text-green-800">
                {bagrut.directorEvaluation?.points !== undefined ? bagrut.directorEvaluation.points : '--'}/10
              </div>
              <div className="text-sm text-gray-600 mt-1">
                10% מהציון הסופי
              </div>
              {bagrut.directorEvaluation?.points !== undefined && (
                <div className="text-xs text-green-700 mt-1">
                  תרומה: {(bagrut.directorEvaluation.points * 0.1 * 10).toFixed(1)} נקודות
                </div>
              )}
            </div>
          </div>

          {/* Final Grade */}
          <div className="text-center">
            <div className={`rounded p-4 border-2 ${
              isComplete ? `${gradeInfo.color} text-white` : 'bg-gray-50 border-gray-200'
            }`}>
              <TrophyIcon className="w-8 h-8 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">ציון סופי</h4>
              <div className="text-3xl font-bold">
                {isComplete ? finalGrade.toFixed(1) : '--'}/100
              </div>
              {isComplete && (
                <div className="text-sm mt-1 font-medium">
                  {gradeInfo.level}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calculation Formula */}
        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h4 className="font-semibold text-gray-900 mb-3 text-center">נוסחת החישוב</h4>
          <div className="text-center">
            <div className="inline-flex items-center gap-4 text-lg">
              <div className="bg-blue-100 px-3 py-1 rounded">
                <span className="font-semibold">ציון מגן בגרות</span> × 90%
              </div>
              <span className="text-xl">+</span>
              <div className="bg-green-100 px-3 py-1 rounded">
                <span className="font-semibold">הערכת המנהל/ת</span> × 10%
              </div>
              <span className="text-xl">=</span>
              <div className={`px-3 py-1 rounded font-bold ${
                isComplete ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                ציון סופי
              </div>
            </div>
          </div>

          {isComplete && (
            <div className="text-center mt-4 text-sm text-gray-700">
              <div className="font-mono">
                {magenPresentation!.grade} × 0.9 + {bagrut.directorEvaluation!.points} × 1.0 = {finalGrade.toFixed(1)}
              </div>
              <div className="mt-1">
                ({(magenPresentation!.grade! * 0.9).toFixed(1)} + {(bagrut.directorEvaluation!.points! * 1.0).toFixed(1)} = {finalGrade.toFixed(1)})
              </div>
            </div>
          )}
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 space-y-2">
              {validationErrors.map((error, index) => (
                <div key={index} className={`flex items-center p-3 rounded ${
                  error.type === 'error' 
                    ? 'bg-red-50 border border-red-200 text-red-800' 
                    : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                }`}>
                  <WarningIcon className="w-4 h-4 ml-2 flex-shrink-0" />
                  <span className="text-sm">{error.message}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Completion Status */}
          {completionStatus && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h4 className="font-semibold text-gray-900 mb-3">סטטוס השלמה</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold">השמעות</div>
                  <div className={`text-lg ${completionStatus.presentations.completed === 4 ? 'text-green-600' : 'text-gray-600'}`}>
                    {completionStatus.presentations.completed}/4
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">תכנית</div>
                  <div className={`text-lg ${completionStatus.programPieces.percentage === 100 ? 'text-green-600' : 'text-gray-600'}`}>
                    {completionStatus.programPieces.completed}/{completionStatus.programPieces.required}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">הערכת מנהל</div>
                  <div className={`text-lg ${completionStatus.directorEvaluation.completed ? 'text-green-600' : 'text-gray-600'}`}>
                    {completionStatus.directorEvaluation.completed ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isComplete && (
          <div className="mt-6 text-center">
            <div className="inline-block p-6 rounded border-2 border-blue-200 bg-blue-50">
              <h4 className="text-xl font-bold text-blue-900 mb-2">
                תוצאה סופית
              </h4>
              <div className="text-4xl font-bold text-blue-800 mb-2">
                {finalGrade.toFixed(1)}
              </div>
              <div className={`text-lg font-semibold mb-1`}>
                {gradeInfo.level} ({gradeInfo.range})
              </div>
              <div className="text-sm text-blue-700">
                {gradeInfo.description}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Grade Categories Reference */}
      <Card className="p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">
          סולם הציונים - משרד החינוך
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {getAllGradeCategories().map((category, index) => (
            <div
              key={index}
              className={`p-3 rounded border-2 ${
                isComplete && finalGrade >= (category.range.split('-')[0] as any)
                  ? `${category.color} text-white border-transparent`
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <div className="font-semibold text-sm">{category.level}</div>
              <div className="text-xs mt-1">{category.range}</div>
              <div className="text-xs mt-1 opacity-90">{category.description}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default GradeSummary;