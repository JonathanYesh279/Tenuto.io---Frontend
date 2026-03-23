import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bagrut, DirectorEvaluation } from '@/types/bagrut.types';
import { WarningIcon } from '@phosphor-icons/react';

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

interface CompletionStatus {
  presentations: { completed: number; total: number; percentage: number };
  programPieces: { completed: number; required: number; percentage: number };
  directorEvaluation: { completed: boolean; percentage: number };
  overall: { percentage: number; canComplete: boolean };
}

interface GradeSummaryProps {
  bagrut: Bagrut;
  completionStatus: CompletionStatus | null;
  validationErrors: ValidationError[];
}

const GRADE_SCALE = [
  { level: 'מצוין', range: '95-100', min: 95 },
  { level: 'טוב מאוד', range: '85-94', min: 85 },
  { level: 'טוב', range: '75-84', min: 75 },
  { level: 'כמעט טוב', range: '65-74', min: 65 },
  { level: 'מספק', range: '55-64', min: 55 },
  { level: 'כמעט מספק', range: '45-54', min: 45 },
  { level: 'לא מספק', range: '35-44', min: 35 },
  { level: 'גרוע', range: '0-34', min: 0 },
];

export const GradeSummary: React.FC<GradeSummaryProps> = ({
  bagrut,
  completionStatus,
  validationErrors,
}) => {
  const magenPresentation = bagrut.presentations?.[3];
  const magenGrade = magenPresentation?.grade;
  const directorPoints = bagrut.directorEvaluation?.points;
  const isComplete = !!(magenGrade && directorPoints);

  const finalGrade = isComplete
    ? Math.round(magenGrade! * 0.9 + directorPoints! * 1.0)
    : 0;

  const gradeLevel = GRADE_SCALE.find(g => finalGrade >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];

  return (
    <div className="space-y-4">
      {/* Compact grade overview — single row */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Magen Bagrut */}
        <div className="col-span-1 bg-white rounded-card border border-border p-3 text-center">
          <div className="text-[11px] text-muted-foreground font-medium mb-1">ציון מגן</div>
          <div className="text-xl font-extrabold text-foreground tabular-nums">
            {magenGrade ?? '--'}<span className="text-sm font-medium text-muted-foreground">/100</span>
          </div>
          <div className="text-[10px] text-muted-foreground">90% מהסופי</div>
        </div>

        {/* Director */}
        <div className="col-span-1 bg-white rounded-card border border-border p-3 text-center">
          <div className="text-[11px] text-muted-foreground font-medium mb-1">הערכת מנהל</div>
          <div className="text-xl font-extrabold text-foreground tabular-nums">
            {directorPoints ?? '--'}<span className="text-sm font-medium text-muted-foreground">/10</span>
          </div>
          <div className="text-[10px] text-muted-foreground">10% מהסופי</div>
        </div>

        {/* Final */}
        <div className={`col-span-1 rounded-card border p-3 text-center ${
          isComplete ? 'bg-primary/5 border-primary/20' : 'bg-white border-border'
        }`}>
          <div className="text-[11px] text-muted-foreground font-medium mb-1">ציון סופי</div>
          <div className={`text-xl font-extrabold tabular-nums ${isComplete ? 'text-primary' : 'text-foreground'}`}>
            {isComplete ? finalGrade : '--'}<span className="text-sm font-medium text-muted-foreground">/100</span>
          </div>
          {isComplete && <div className="text-[10px] text-primary font-medium">{gradeLevel.level}</div>}
        </div>

        {/* Completion stats */}
        <div className="col-span-1 bg-white rounded-card border border-border p-3 text-center">
          <div className="text-[11px] text-muted-foreground font-medium mb-1">השמעות</div>
          <div className="text-xl font-extrabold text-foreground tabular-nums">
            {completionStatus?.presentations?.completed ?? 0}<span className="text-sm font-medium text-muted-foreground">/4</span>
          </div>
        </div>

        <div className="col-span-1 bg-white rounded-card border border-border p-3 text-center">
          <div className="text-[11px] text-muted-foreground font-medium mb-1">יצירות</div>
          <div className="text-xl font-extrabold text-foreground tabular-nums">
            {completionStatus?.programPieces?.completed ?? 0}<span className="text-sm font-medium text-muted-foreground">/{completionStatus?.programPieces?.required ?? 3}</span>
          </div>
        </div>

        <div className="col-span-1 bg-white rounded-card border border-border p-3 text-center">
          <div className="text-[11px] text-muted-foreground font-medium mb-1">השלמה</div>
          <div className="text-xl font-extrabold text-foreground tabular-nums">
            {Math.round(completionStatus?.overall?.percentage ?? 0)}<span className="text-sm font-medium text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      {/* Formula — compact inline */}
      <div className="bg-muted/50 rounded-card px-4 py-2.5 flex items-center justify-center gap-3 text-sm text-muted-foreground flex-wrap">
        <span className="font-medium">נוסחה:</span>
        <span className="bg-white rounded px-2 py-0.5 border border-border text-foreground font-medium">
          מגן × 90%
        </span>
        <span>+</span>
        <span className="bg-white rounded px-2 py-0.5 border border-border text-foreground font-medium">
          הערכת מנהל × 10%
        </span>
        <span>=</span>
        <span className={`rounded px-2 py-0.5 font-bold ${
          isComplete ? 'bg-primary text-white' : 'bg-white border border-border text-muted-foreground'
        }`}>
          {isComplete ? finalGrade : '--'}
        </span>
      </div>

      {/* Validation errors — compact */}
      {validationErrors.length > 0 && (
        <div className="space-y-1.5">
          {validationErrors.map((error, index) => (
            <div key={index} className={`flex items-center gap-2 px-3 py-2 rounded-card text-sm ${
              error.type === 'error'
                ? 'bg-destructive/5 text-destructive border border-destructive/10'
                : 'bg-warning/5 text-warning-foreground border border-warning/10'
            }`}>
              <WarningIcon className="w-3.5 h-3.5 flex-shrink-0" />
              {error.message}
            </div>
          ))}
        </div>
      )}

      {/* Grade scale — compact inline chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">סולם:</span>
        {GRADE_SCALE.map((g, i) => (
          <span
            key={i}
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              isComplete && finalGrade >= g.min && (i === 0 || finalGrade < GRADE_SCALE[i - 1].min)
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-muted-foreground border-border'
            }`}
          >
            {g.level} {g.range}
          </span>
        ))}
      </div>
    </div>
  );
};

export default GradeSummary;
