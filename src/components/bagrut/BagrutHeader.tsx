import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button as HeroButton } from '@heroui/react';
import { FloppyDiskIcon } from '@phosphor-icons/react';

interface BagrutHeaderProps {
  conservatoryName?: string;
  directorName?: string;
  recitalField?: 'קלאסי' | 'ג\'אז' | 'שירה';
  recitalUnits?: 3 | 5;
  studentName: string;
  studentIdNumber?: string;
  onRecitalFieldChange?: (field: 'קלאסי' | 'ג\'אז' | 'שירה') => void;
  onRecitalUnitsChange?: (units: 3 | 5) => void;
  onStudentIdNumberChange?: (idNumber: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
}

export const BagrutHeader: React.FC<BagrutHeaderProps> = ({
  conservatoryName = '',
  directorName = '',
  recitalField,
  recitalUnits,
  studentName,
  studentIdNumber,
  onRecitalFieldChange,
  onRecitalUnitsChange,
  onStudentIdNumberChange,
  onSave,
  isSaving,
  isDirty,
}) => {
  return (
    <div className="space-y-4">
      {/* Conservatory info — compact */}
      <div className="text-center pb-3 border-b border-border">
        <div className="text-sm font-bold text-primary">משרד החינוך</div>
        <div className="text-sm font-semibold text-foreground">מגן בגרות - מוסיקה</div>
        <div className="text-xs text-muted-foreground mt-0.5">{conservatoryName} • מנהל/ת: {directorName}</div>
      </div>

      {/* Student info — name is read-only, ID is editable */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium text-muted-foreground block mb-1">שם התלמיד/ה</Label>
          <div className="text-sm font-semibold text-foreground">{studentName}</div>
        </div>

        <div>
          <Label htmlFor="student-id-number" className="text-xs font-medium text-muted-foreground block mb-1">
            תעודת זהות
          </Label>
          <Input
            id="student-id-number"
            value={studentIdNumber || ''}
            onChange={(e) => onStudentIdNumberChange?.(e.target.value)}
            placeholder="הכנס מספר ת.ז."
            className="text-right text-sm"
            dir="rtl"
          />
        </div>
      </div>

      {/* Recital settings */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="recital-field" className="text-xs font-medium text-muted-foreground block mb-1">
            תחום הרסיטל
          </Label>
          <Select value={recitalField} onValueChange={onRecitalFieldChange}>
            <SelectTrigger id="recital-field" className="text-right text-sm">
              <SelectValue placeholder="בחר תחום" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="קלאסי">קלאסי</SelectItem>
              <SelectItem value="ג'אז">ג'אז</SelectItem>
              <SelectItem value="שירה">שירה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="recital-units" className="text-xs font-medium text-muted-foreground block mb-1">
            יחידות לימוד
          </Label>
          <Select value={recitalUnits?.toString()} onValueChange={(v) => onRecitalUnitsChange?.(parseInt(v) as 3 | 5)}>
            <SelectTrigger id="recital-units" className="text-right text-sm">
              <SelectValue placeholder="בחר יחידות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 יחידות</SelectItem>
              <SelectItem value="5">5 יחידות</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Save button */}
      {onSave && (
        <HeroButton
          color="primary"
          variant="solid"
          size="sm"
          onPress={onSave}
          isLoading={isSaving}
          isDisabled={!isDirty}
          startContent={!isSaving ? <FloppyDiskIcon size={14} weight="bold" /> : undefined}
          className="font-bold w-full"
        >
          {isSaving ? 'שומר...' : 'שמור הגדרות'}
        </HeroButton>
      )}

      {/* Notes — compact */}
      <div className="bg-primary/5 border border-primary/10 rounded-card px-3 py-2">
        <div className="text-[11px] text-muted-foreground text-center space-y-0.5">
          <div className="font-semibold text-foreground text-xs mb-1">הערות חשובות:</div>
          <div>• הרסיטל יכלול 5 יצירות מתקופות שונות</div>
          <div>• תלמידי 5 יח' נדרשים לבצע יצירה אחת לפחות בעל פה</div>
          <div>• השמעות 1-3 הכנה, ההשמעה ה-4 היא מגן הבגרות</div>
        </div>
      </div>
    </div>
  );
};

export default BagrutHeader;
