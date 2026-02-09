/**
 * Centralized enum constants for the Tenuto.io conservatory system.
 * These match the backend schema exactly.
 */

// Teacher classification
export const CLASSIFICATIONS = ['ממשיך', 'חדש'] as const;
export type Classification = typeof CLASSIFICATIONS[number];

// Teacher degree
export const DEGREES = ['תואר שני', 'תואר ראשון', 'מוסמך', 'בלתי מוסמך'] as const;
export type Degree = typeof DEGREES[number];

// Management roles
export const MANAGEMENT_ROLES = ['ריכוז פדגוגי', 'ריכוז מחלקה', 'סגן מנהל', 'ריכוז אחר'] as const;
export type ManagementRole = typeof MANAGEMENT_ROLES[number];

// Teaching subjects (beyond instrument teaching)
export const TEACHING_SUBJECTS = ['ליווי פסנתר', 'ניצוח', 'תאוריה', 'הלחנה', 'ספרנות תזמורות', 'אחר'] as const;
export type TeachingSubject = typeof TEACHING_SUBJECTS[number];

// Orchestra subType — critical for Ministry reports (Sheet 3)
export const ORCHESTRA_SUBTYPES = [
  'כלי נשיפה', 'סימפונית', 'כלי קשת', 'קאמרי קלאסי',
  'קולי', 'מקהלה', 'ביג-בנד', "ג'אז-פופ-רוק", 'עממית',
] as const;
export type OrchestraSubType = typeof ORCHESTRA_SUBTYPES[number];

// Performance level for orchestras/ensembles
export const PERFORMANCE_LEVELS = ['התחלתי', 'ביניים', 'ייצוגי'] as const;
export type PerformanceLevel = typeof PERFORMANCE_LEVELS[number];

// Ministry stage level (auto-calculated, read-only display)
// Mapping: stages 1-3 → א, 4-5 → ב, 6-8 → ג
export const MINISTRY_STAGES = ['א', 'ב', 'ג'] as const;
export type MinistryStageLevel = typeof MINISTRY_STAGES[number];

// Instrument departments for grouped display
export const INSTRUMENT_DEPARTMENTS: Record<string, string[]> = {
  'כלי קשת': ['כינור', 'ויולה', "צ'לו", 'קונטרבס'],
  'כלי נשיפה-עץ': ['חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט'],
  'כלי נשיפה-פליז': ['חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון'],
  'מקלדת': ['פסנתר'],
  'כלי פריטה': ['גיטרה', 'גיטרה בס', 'גיטרה פופ', 'נבל'],
  'כלי הקשה': ['תופים', 'כלי הקשה'],
  'קולי': ['שירה'],
  'כלים אתניים': ['עוד', 'כלים אתניים'],
  'כלים עממיים': ['מנדולינה', 'אקורדיון'],
  'אחר': ['רקורדר'],
};

/**
 * Get the department name for a given instrument.
 */
export function getInstrumentDepartment(instrument: string): string | undefined {
  for (const [dept, instruments] of Object.entries(INSTRUMENT_DEPARTMENTS)) {
    if (instruments.includes(instrument)) return dept;
  }
  return undefined;
}
