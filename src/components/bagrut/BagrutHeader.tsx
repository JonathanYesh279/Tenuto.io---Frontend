import React from 'react';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BagrutHeaderProps {
  conservatoryName?: string;
  directorName?: string;
  recitalField?: 'קלאסי' | 'ג\'אז' | 'שירה';
  recitalUnits?: 3 | 5;
  studentName?: string;
  studentId?: string;
  onRecitalFieldChange?: (field: 'קלאסי' | 'ג\'אז' | 'שירה') => void;
  onRecitalUnitsChange?: (units: 3 | 5) => void;
  onStudentNameChange?: (name: string) => void;
  onStudentIdChange?: (id: string) => void;
}

export const BagrutHeader: React.FC<BagrutHeaderProps> = ({
  conservatoryName = "מרכז המוסיקה רעננה",
  directorName = "לימור אקטע",
  recitalField,
  recitalUnits,
  studentName,
  studentId,
  onRecitalFieldChange,
  onRecitalUnitsChange,
  onStudentNameChange,
  onStudentIdChange,
}) => {
  return (
    <Card className="p-6 mb-6 border-2 border-blue-200">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">
          משרד החינוך
        </h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          מגן בגרות - מוסיקה
        </h2>
        <div className="text-lg text-gray-700">
          {conservatoryName}
        </div>
        <div className="text-md text-gray-600 mt-2">
          מנהל/ת: {directorName}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="recital-field" className="text-right block mb-2 font-semibold">
              תחום הרסיטל
            </Label>
            <Select 
              value={recitalField} 
              onValueChange={onRecitalFieldChange}
            >
              <SelectTrigger id="recital-field" className="text-right">
                <SelectValue placeholder="בחר תחום רסיטל" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="קלאסי">קלאסי</SelectItem>
                <SelectItem value="ג'אז">ג'אז</SelectItem>
                <SelectItem value="שירה">שירה</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="recital-units" className="text-right block mb-2 font-semibold">
              יחידות לימוד
            </Label>
            <Select 
              value={recitalUnits?.toString()} 
              onValueChange={(value) => onRecitalUnitsChange?.(parseInt(value) as 3 | 5)}
            >
              <SelectTrigger id="recital-units" className="text-right">
                <SelectValue placeholder="בחר מספר יחידות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 יחידות</SelectItem>
                <SelectItem value="5">5 יחידות</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="student-name" className="text-right block mb-2 font-semibold">
              שם התלמיד/ה
            </Label>
            <Input
              id="student-name"
              value={studentName || ''}
              onChange={(e) => onStudentNameChange?.(e.target.value)}
              placeholder="הכנס שם התלמיד"
              className="text-right"
              dir="rtl"
            />
          </div>

          <div>
            <Label htmlFor="student-id" className="text-right block mb-2 font-semibold">
              תעודת זהות
            </Label>
            <Input
              id="student-id"
              value={studentId || ''}
              onChange={(e) => onStudentIdChange?.(e.target.value)}
              placeholder="הכנס מספר תעודת זהות"
              className="text-right"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <div className="text-sm text-gray-600 text-center">
          <p className="font-semibold mb-1">הערות חשובות:</p>
          <p>• הרסיטל יכלול 5 יצירות מתקופות שונות</p>
          <p>• תלמידי 5 יחידות נדרשים לבצע יצירה אחת לפחות בעל פה</p>
          <p>• ההשמעות 1-3 הן השמעות הכנה, ההשמעה הרביעית היא מגן הבגרות הסופי</p>
        </div>
      </div>
    </Card>
  );
};

export default BagrutHeader;