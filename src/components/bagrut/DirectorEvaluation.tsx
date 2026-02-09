import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserCheck, Star, FileSignature } from 'lucide-react';
import { DirectorEvaluation as DirectorEvaluationType } from '@/types/bagrut.types';

interface DirectorEvaluationProps {
  directorEvaluation?: DirectorEvaluationType;
  directorName?: string;
  onUpdate: (evaluation: DirectorEvaluationType) => void;
  readonly?: boolean;
}

export const DirectorEvaluation: React.FC<DirectorEvaluationProps> = ({
  directorEvaluation = {},
  directorName = "לימור אקטע",
  onUpdate,
  readonly = false,
}) => {
  const [formData, setFormData] = useState<DirectorEvaluationType>({
    points: directorEvaluation.points,
    percentage: directorEvaluation.percentage,
    comments: directorEvaluation.comments || '',
  });

  const [signature, setSignature] = useState('');
  const [evaluationDate, setEvaluationDate] = useState('');

  useEffect(() => {
    const percentage = formData.points !== undefined ? (formData.points / 10) * 100 : undefined;
    const updated = { ...formData, percentage };
    setFormData(updated);
    onUpdate(updated);
  }, [formData.points]);

  const updateField = (field: keyof DirectorEvaluationType, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  const getPointDescription = (points: number): string => {
    if (points >= 9) return 'מצוין';
    if (points >= 8) return 'טוב מאוד';
    if (points >= 7) return 'טוב';
    if (points >= 6) return 'מספק';
    if (points >= 5) return 'כמעט מספק';
    return 'לא מספק';
  };

  const getPointColor = (points: number): string => {
    if (points >= 8) return 'text-green-700';
    if (points >= 6) return 'text-blue-700';
    if (points >= 5) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <UserCheck className="w-6 h-6 ml-3 text-blue-600" />
          הערכת המנהל/ת
        </h3>
        <div className="text-sm text-gray-600">
          <span className="font-medium">משקל:</span> 10% מהציון הסופי
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <Star className="w-5 h-5 text-blue-600 ml-3 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">על הערכת המנהל/ת</h4>
            <p className="text-sm text-blue-800 mb-2">
              הערכת המנהל/ת מהווה 10% מהציון הסופי בבגרות המוסיקה ומבוססת על:
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• מעורבות והשתתפות בחיי בית הספר המוסיקלי</li>
              <li>• התקדמות והתפתחות לאורך השנים</li>
              <li>• יחס והתנהגות כלפי הלמידה והחברים</li>
              <li>• תרומה לקהילה המוסיקלית</li>
              <li>• מוכנות והקפדה על משימות</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="director-points" className="text-right block mb-3 font-semibold text-lg">
              ציון המנהל/ת (0-10 נקודות)
            </Label>
            <div className="relative">
              <Input
                id="director-points"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.points || ''}
                onChange={(e) => updateField('points', parseFloat(e.target.value) || undefined)}
                disabled={readonly}
                className="text-center text-2xl font-bold h-16 border-2 focus:border-blue-500"
                placeholder="0.0"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                /10
              </div>
            </div>
            
            {formData.points !== undefined && (
              <div className={`text-center mt-2 font-semibold ${getPointColor(formData.points)}`}>
                {getPointDescription(formData.points)}
                {formData.percentage !== undefined && (
                  <span className="block text-sm text-gray-600 mt-1">
                    ({formData.percentage.toFixed(1)}%)
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="evaluation-date" className="text-right block mb-2 font-semibold">
              תאריך הערכה
            </Label>
            <Input
              id="evaluation-date"
              type="date"
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
              disabled={readonly}
              className="text-right"
            />
          </div>

          <div>
            <Label htmlFor="director-signature" className="text-right block mb-2 font-semibold">
              <FileSignature className="w-4 h-4 inline ml-2" />
              חתימת המנהל/ת
            </Label>
            <div className="text-sm text-gray-600 mb-2 text-right">
              {directorName}
            </div>
            <Input
              id="director-signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="חתימה דיגיטלית"
              disabled={readonly}
              className="text-right"
              dir="rtl"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="director-comments" className="text-right block mb-2 font-semibold">
            הערות והסבר להערכה
          </Label>
          <Textarea
            id="director-comments"
            value={formData.comments || ''}
            onChange={(e) => updateField('comments', e.target.value)}
            placeholder="הערות המנהל/ת על התלמיד/ה: התקדמות, מעורבות, יחס, תרומה לקהילה..."
            disabled={readonly}
            className="text-right min-h-[200px] resize-y"
            dir="rtl"
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">חישוב במסגרת הציון הסופי:</h4>
        <div className="text-sm text-yellow-700">
          <p>• ציון מגן הבגרות: 90% מהציון הסופי</p>
          <p>• הערכת המנהל/ת: 10% מהציון הסופי</p>
          {formData.points !== undefined && (
            <p className="mt-2 font-semibold">
              תרומה לציון הסופי: {(formData.points / 10 * 10).toFixed(1)} נקודות
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 border-2 border-gray-300 rounded-lg">
        <h4 className="font-bold text-gray-900 mb-3">סולם הערכה</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div className="flex justify-between p-2 bg-green-100 rounded">
            <span className="font-medium">מצוין</span>
            <span>9.0-10.0</span>
          </div>
          <div className="flex justify-between p-2 bg-blue-100 rounded">
            <span className="font-medium">טוב מאוד</span>
            <span>8.0-8.9</span>
          </div>
          <div className="flex justify-between p-2 bg-blue-50 rounded">
            <span className="font-medium">טוב</span>
            <span>7.0-7.9</span>
          </div>
          <div className="flex justify-between p-2 bg-yellow-100 rounded">
            <span className="font-medium">מספק</span>
            <span>6.0-6.9</span>
          </div>
          <div className="flex justify-between p-2 bg-orange-100 rounded">
            <span className="font-medium">כמעט מספק</span>
            <span>5.0-5.9</span>
          </div>
          <div className="flex justify-between p-2 bg-red-100 rounded">
            <span className="font-medium">לא מספק</span>
            <span>0.0-4.9</span>
          </div>
        </div>
      </div>

      {!readonly && formData.points !== undefined && (
        <div className="mt-6 text-center">
          <div className="text-lg font-bold text-gray-900">
            הערכת המנהל/ת: {formData.points}/10
          </div>
          <div className="text-sm text-gray-600">
            משמעות: {getPointDescription(formData.points)} • תרומה לציון הסופי: {(formData.points / 10 * 10).toFixed(1)} נקודות
          </div>
        </div>
      )}
    </Card>
  );
};

export default DirectorEvaluation;