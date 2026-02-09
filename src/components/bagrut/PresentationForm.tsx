import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Users, Link, FileText } from 'lucide-react';
import { Presentation } from '@/types/bagrut.types';

interface PresentationFormProps {
  presentationNumber: 1 | 2 | 3;
  presentation?: Presentation;
  onUpdate: (presentation: Presentation) => void;
  readonly?: boolean;
}

export const PresentationForm: React.FC<PresentationFormProps> = ({
  presentationNumber,
  presentation = {},
  onUpdate,
  readonly = false,
}) => {
  const [formData, setFormData] = useState<Presentation>({
    date: presentation.date,
    review: presentation.review || '',
    reviewedBy: presentation.reviewedBy || '',
    notes: presentation.notes || '',
    recordingLinks: presentation.recordingLinks || [''],
    completed: presentation.completed || false,
    status: presentation.status || 'pending',
  });

  const updateField = (field: keyof Presentation, value: any) => {
    const updated = { ...formData, [field]: value };
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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <FileText className="w-6 h-6 ml-3 text-blue-600" />
          השמעה {presentationNumber}
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          formData.completed
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {formData.completed ? 'הושלמה' : 'ממתינה'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor={`date-${presentationNumber}`} className="text-right block mb-2 font-semibold">
              <Calendar className="w-4 h-4 inline ml-2" />
              תאריך ההשמעה
            </Label>
            <Input
              id={`date-${presentationNumber}`}
              type="date"
              value={formatDate(formData.date)}
              onChange={(e) => updateField('date', parseDate(e.target.value))}
              disabled={readonly}
              className="text-right"
            />
          </div>

          <div>
            <Label htmlFor={`reviewedBy-${presentationNumber}`} className="text-right block mb-2 font-semibold">
              <Users className="w-4 h-4 inline ml-2" />
              שמות הבוחנים
            </Label>
            <Input
              id={`reviewedBy-${presentationNumber}`}
              value={formData.reviewedBy || ''}
              onChange={(e) => updateField('reviewedBy', e.target.value)}
              placeholder="שם הבוחן הראשי, שם הבוחן השני"
              disabled={readonly}
              className="text-right"
              dir="rtl"
            />
          </div>

          <div>
            <Label className="text-right block mb-2 font-semibold">
              <Link className="w-4 h-4 inline ml-2" />
              קישורי הקלטות
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
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor={`notes-${presentationNumber}`} className="text-right block mb-2 font-semibold">
              הערות והערכה כללית
            </Label>
            <Textarea
              id={`notes-${presentationNumber}`}
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="הערות על הביצוע, נקודות חוזק וחולשה, המלצות לשיפור..."
              disabled={readonly}
              className="text-right min-h-[200px] resize-y"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">מטרות השמעה {presentationNumber}:</h4>
        <div className="text-sm text-gray-700 space-y-1">
          {presentationNumber === 1 && (
            <>
              <p>• הכרה ראשונית עם תוכנית הרסיטל</p>
              <p>• הערכת רמת הביצוע הנוכחית</p>
              <p>• זיהוי נקודות לשיפור והתמקדות</p>
            </>
          )}
          {presentationNumber === 2 && (
            <>
              <p>• מעקב אחר התקדמות בתוכנית</p>
              <p>• השלמת עבודה טכנית ומוזיקלית</p>
              <p>• הכנה לקראת המגן הסופי</p>
            </>
          )}
          {presentationNumber === 3 && (
            <>
              <p>• השמעה אחרונה לפני המגן הסופי</p>
              <p>• וידוא מוכנות מלאה לבחינה</p>
              <p>• עדכונים אחרונים לתוכנית</p>
            </>
          )}
        </div>
      </div>

      {!readonly && (
        <div className="mt-6 flex justify-between items-center">
          <Button
            onClick={() => updateField('completed', !formData.completed)}
            variant={formData.completed ? "destructive" : "default"}
          >
            {formData.completed ? 'בטל השלמה' : 'סמן כהושלמה'}
          </Button>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">סטטוס:</span> {
              formData.completed ? 'השמעה הושלמה' : 'השמעה לא הושלמה'
            }
          </div>
        </div>
      )}
    </Card>
  );
};

export default PresentationForm;