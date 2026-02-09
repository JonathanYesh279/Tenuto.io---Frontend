import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Users, Link, Award, CheckCircle } from 'lucide-react';
import { DetailedGrading, MagenBagrut } from '@/types/bagrut.types';

interface MagenBagrutFormProps {
  magenBagrut?: MagenBagrut;
  onUpdate: (magenBagrut: MagenBagrut & { detailedGrading?: DetailedGrading }) => void;
  readonly?: boolean;
}

export const MagenBagrutForm: React.FC<MagenBagrutFormProps> = ({
  magenBagrut = {},
  onUpdate,
  readonly = false,
}) => {
  const [formData, setFormData] = useState<MagenBagrut & { detailedGrading?: DetailedGrading }>({
    date: magenBagrut.date,
    review: magenBagrut.review || '',
    reviewedBy: magenBagrut.reviewedBy || '',
    recordingLinks: magenBagrut.recordingLinks || [''],
    completed: magenBagrut.completed || false,
    status: magenBagrut.status || 'pending',
    grade: magenBagrut.grade,
    gradeLevel: magenBagrut.gradeLevel,
    detailedGrading: {
      playingSkills: {
        points: (magenBagrut as any)?.detailedGrading?.playingSkills?.points || undefined,
        maxPoints: 40,
        comments: (magenBagrut as any)?.detailedGrading?.playingSkills?.comments || '',
      },
      musicalUnderstanding: {
        points: (magenBagrut as any)?.detailedGrading?.musicalUnderstanding?.points || undefined,
        maxPoints: 30,
        comments: (magenBagrut as any)?.detailedGrading?.musicalUnderstanding?.comments || '',
      },
      textKnowledge: {
        points: (magenBagrut as any)?.detailedGrading?.textKnowledge?.points || undefined,
        maxPoints: 20,
        comments: (magenBagrut as any)?.detailedGrading?.textKnowledge?.comments || '',
      },
      playingByHeart: {
        points: (magenBagrut as any)?.detailedGrading?.playingByHeart?.points || undefined,
        maxPoints: 10,
        comments: (magenBagrut as any)?.detailedGrading?.playingByHeart?.comments || '',
      },
    },
  });

  const [examinerSignatures, setExaminerSignatures] = useState({
    examiner1: '',
    examiner2: '',
    examiner3: '',
  });

  useEffect(() => {
    const total = calculateTotal();
    const updatedData = {
      ...formData,
      grade: total,
      gradeLevel: getGradeLevel(total),
    };
    setFormData(updatedData);
    onUpdate(updatedData);
  }, [
    formData.detailedGrading?.playingSkills.points,
    formData.detailedGrading?.musicalUnderstanding.points,
    formData.detailedGrading?.textKnowledge.points,
    formData.detailedGrading?.playingByHeart.points,
  ]);

  const calculateTotal = (): number => {
    const { playingSkills, musicalUnderstanding, textKnowledge, playingByHeart } = formData.detailedGrading!;
    return (playingSkills.points || 0) + (musicalUnderstanding.points || 0) + 
           (textKnowledge.points || 0) + (playingByHeart.points || 0);
  };

  const getGradeLevel = (score: number): string => {
    if (score >= 95) return 'מצוין (95-100)';
    if (score >= 85) return 'טוב מאוד (85-94)';
    if (score >= 75) return 'טוב (75-84)';
    if (score >= 65) return 'כמעט טוב (65-74)';
    if (score >= 55) return 'מספק (55-64)';
    if (score >= 45) return 'כמעט מספק (45-54)';
    if (score >= 35) return 'לא מספק (35-44)';
    return 'גרוע (0-34)';
  };

  const updateField = (field: keyof MagenBagrut, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  const updateGradingField = (
    category: keyof DetailedGrading,
    field: 'points' | 'comments',
    value: number | string
  ) => {
    const updated = {
      ...formData,
      detailedGrading: {
        ...formData.detailedGrading!,
        [category]: {
          ...formData.detailedGrading![category],
          [field]: value,
        },
      },
    };
    setFormData(updated);
    onUpdate(updated);
  };

  const updateRecordingLink = (index: number, value: string) => {
    const links = [...(formData.recordingLinks || [''])];
    links[index] = value;
    
    if (index === links.length - 1 && value) {
      links.push('');
    }
    
    updateField('recordingLinks', links.filter((link, i) => link || i === links.length - 1));
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const parseDate = (dateString: string) => {
    return dateString ? new Date(dateString) : undefined;
  };

  const isFormValid = () => {
    const { playingSkills, musicalUnderstanding, textKnowledge, playingByHeart } = formData.detailedGrading!;
    return playingSkills.points !== undefined && 
           musicalUnderstanding.points !== undefined && 
           textKnowledge.points !== undefined && 
           playingByHeart.points !== undefined &&
           formData.date && formData.reviewedBy;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Award className="w-6 h-6 ml-3 text-gold-600" />
          מגן בגרות - השמעה סופית
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          formData.completed
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {formData.completed ? 'הושלמה' : 'טרם הושלמה'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <Label htmlFor="magen-date" className="text-right block mb-2 font-semibold">
            <Calendar className="w-4 h-4 inline ml-2" />
            תאריך מגן הבגרות
          </Label>
          <Input
            id="magen-date"
            type="date"
            value={formatDate(formData.date)}
            onChange={(e) => updateField('date', parseDate(e.target.value))}
            disabled={readonly}
            className="text-right"
          />
        </div>

        <div>
          <Label htmlFor="magen-reviewedBy" className="text-right block mb-2 font-semibold">
            <Users className="w-4 h-4 inline ml-2" />
            ועדת הבוחנים
          </Label>
          <Input
            id="magen-reviewedBy"
            value={formData.reviewedBy || ''}
            onChange={(e) => updateField('reviewedBy', e.target.value)}
            placeholder="שמות הבוחנים בוועדה"
            disabled={readonly}
            className="text-right"
            dir="rtl"
          />
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">טבלת ציונים - מגן בגרות במוסיקה</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-blue-100">
                <th className="border-2 border-gray-400 px-4 py-3 text-right font-bold text-gray-900">
                  קריטריון הערכה
                </th>
                <th className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-gray-900">
                  ניקוד מקסימלי
                </th>
                <th className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-gray-900">
                  ניקוד שהתקבל
                </th>
                <th className="border-2 border-gray-400 px-4 py-3 text-right font-bold text-gray-900">
                  הערות
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-2 border-gray-400 px-4 py-3 font-semibold text-right">
                  מיומנות נגינה
                </td>
                <td className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-lg">
                  40
                </td>
                <td className="border-2 border-gray-400 px-2 py-2 text-center">
                  <Input
                    type="number"
                    min="0"
                    max="40"
                    value={formData.detailedGrading?.playingSkills.points || ''}
                    onChange={(e) => updateGradingField('playingSkills', 'points', parseInt(e.target.value) || 0)}
                    disabled={readonly}
                    className="w-20 mx-auto text-center font-bold text-lg border-2 focus:border-blue-500"
                  />
                </td>
                <td className="border-2 border-gray-400 px-2 py-2">
                  <Input
                    value={formData.detailedGrading?.playingSkills.comments || ''}
                    onChange={(e) => updateGradingField('playingSkills', 'comments', e.target.value)}
                    disabled={readonly}
                    placeholder="הערות על מיומנות הנגינה"
                    className="border-0 text-right text-sm"
                    dir="rtl"
                  />
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border-2 border-gray-400 px-4 py-3 font-semibold text-right">
                  הבנה מוסיקלית
                </td>
                <td className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-lg">
                  30
                </td>
                <td className="border-2 border-gray-400 px-2 py-2 text-center">
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.detailedGrading?.musicalUnderstanding.points || ''}
                    onChange={(e) => updateGradingField('musicalUnderstanding', 'points', parseInt(e.target.value) || 0)}
                    disabled={readonly}
                    className="w-20 mx-auto text-center font-bold text-lg border-2 focus:border-blue-500"
                  />
                </td>
                <td className="border-2 border-gray-400 px-2 py-2">
                  <Input
                    value={formData.detailedGrading?.musicalUnderstanding.comments || ''}
                    onChange={(e) => updateGradingField('musicalUnderstanding', 'comments', e.target.value)}
                    disabled={readonly}
                    placeholder="הערות על הבנה מוסיקלית"
                    className="border-0 text-right text-sm"
                    dir="rtl"
                  />
                </td>
              </tr>
              <tr>
                <td className="border-2 border-gray-400 px-4 py-3 font-semibold text-right">
                  ידיעת הטקסט
                </td>
                <td className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-lg">
                  20
                </td>
                <td className="border-2 border-gray-400 px-2 py-2 text-center">
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.detailedGrading?.textKnowledge.points || ''}
                    onChange={(e) => updateGradingField('textKnowledge', 'points', parseInt(e.target.value) || 0)}
                    disabled={readonly}
                    className="w-20 mx-auto text-center font-bold text-lg border-2 focus:border-blue-500"
                  />
                </td>
                <td className="border-2 border-gray-400 px-2 py-2">
                  <Input
                    value={formData.detailedGrading?.textKnowledge.comments || ''}
                    onChange={(e) => updateGradingField('textKnowledge', 'comments', e.target.value)}
                    disabled={readonly}
                    placeholder="הערות על ידיעת הטקסט"
                    className="border-0 text-right text-sm"
                    dir="rtl"
                  />
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border-2 border-gray-400 px-4 py-3 font-semibold text-right">
                  נגינה בע"פ
                </td>
                <td className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-lg">
                  10
                </td>
                <td className="border-2 border-gray-400 px-2 py-2 text-center">
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.detailedGrading?.playingByHeart.points || ''}
                    onChange={(e) => updateGradingField('playingByHeart', 'points', parseInt(e.target.value) || 0)}
                    disabled={readonly}
                    className="w-20 mx-auto text-center font-bold text-lg border-2 focus:border-blue-500"
                  />
                </td>
                <td className="border-2 border-gray-400 px-2 py-2">
                  <Input
                    value={formData.detailedGrading?.playingByHeart.comments || ''}
                    onChange={(e) => updateGradingField('playingByHeart', 'comments', e.target.value)}
                    disabled={readonly}
                    placeholder="הערות על נגינה בעל פה"
                    className="border-0 text-right text-sm"
                    dir="rtl"
                  />
                </td>
              </tr>
              <tr className="bg-blue-200">
                <td className="border-2 border-gray-400 px-4 py-3 font-bold text-right text-lg">
                  סה"כ ציון
                </td>
                <td className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-xl">
                  100
                </td>
                <td className="border-2 border-gray-400 px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {calculateTotal()}
                  </div>
                </td>
                <td className="border-2 border-gray-400 px-4 py-3 text-right">
                  <div className="font-semibold text-blue-800">
                    {getGradeLevel(calculateTotal())}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <Label className="text-right block mb-2 font-semibold">
            <Link className="w-4 h-4 inline ml-2" />
            קישורי הקלטות למגן
          </Label>
          <div className="space-y-2">
            {(formData.recordingLinks || ['']).map((link, index) => (
              <Input
                key={index}
                value={link}
                onChange={(e) => updateRecordingLink(index, e.target.value)}
                placeholder={`קישור הקלטה ${index + 1}`}
                disabled={readonly}
                className="text-left"
                dir="ltr"
              />
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="magen-review" className="text-right block mb-2 font-semibold">
            הערות כלליות של הוועדה
          </Label>
          <Textarea
            id="magen-review"
            value={formData.review || ''}
            onChange={(e) => updateField('review', e.target.value)}
            placeholder="הערות כלליות על הביצוע והרמה הכללית..."
            disabled={readonly}
            className="text-right min-h-[120px]"
            dir="rtl"
          />
        </div>
      </div>

      <div className="mb-6 p-4 border-2 border-gray-300 rounded-lg">
        <h4 className="font-bold text-gray-900 mb-3">חתימות ועדת הבוחנים</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-right block mb-2">בוחן ראשי</Label>
            <Input
              value={examinerSignatures.examiner1}
              onChange={(e) => setExaminerSignatures(prev => ({...prev, examiner1: e.target.value}))}
              placeholder="חתימה"
              disabled={readonly}
              className="text-right"
              dir="rtl"
            />
          </div>
          <div>
            <Label className="text-right block mb-2">בוחן שני</Label>
            <Input
              value={examinerSignatures.examiner2}
              onChange={(e) => setExaminerSignatures(prev => ({...prev, examiner2: e.target.value}))}
              placeholder="חתימה"
              disabled={readonly}
              className="text-right"
              dir="rtl"
            />
          </div>
          <div>
            <Label className="text-right block mb-2">בוחן שלישי</Label>
            <Input
              value={examinerSignatures.examiner3}
              onChange={(e) => setExaminerSignatures(prev => ({...prev, examiner3: e.target.value}))}
              placeholder="חתימה"
              disabled={readonly}
              className="text-right"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      {!readonly && (
        <div className="flex justify-between items-center">
          <Button
            onClick={() => updateField('completed', !formData.completed)}
            disabled={!isFormValid()}
            variant={formData.completed ? "destructive" : "default"}
            className="flex items-center"
          >
            {formData.completed ? (
              <>
                <CheckCircle className="w-4 h-4 ml-2" />
                בטל השלמת מגן
              </>
            ) : (
              <>
                <Award className="w-4 h-4 ml-2" />
                השלם מגן בגרות
              </>
            )}
          </Button>

          <div className="text-right">
            <div className="text-2xl font-bold text-blue-800">
              ציון סופי: {calculateTotal()}/100
            </div>
            <div className="text-sm text-gray-600">
              {getGradeLevel(calculateTotal())}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MagenBagrutForm;