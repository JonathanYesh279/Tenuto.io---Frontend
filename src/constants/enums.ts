/**
 * Centralized enum constants for the Tenuto.io conservatory system.
 * These match the backend schema exactly.
 */

// Teacher classification
export const CLASSIFICATIONS = ['ממשיך', 'חדש'] as const;
export type Classification = typeof CLASSIFICATIONS[number];

// Teacher degree
export const DEGREES = ['תואר שלישי', 'תואר שני', 'תואר ראשון', 'מוסמך בכיר', 'מוסמך', 'בלתי מוסמך'] as const;
export type Degree = typeof DEGREES[number];

// Management roles
export const MANAGEMENT_ROLES = ['ריכוז פדגוגי', 'ריכוז מחלקה', 'סגן מנהל', 'ריכוז אחר', 'ריכוז אחר (פרט)', 'תיאור תפקיד'] as const;
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

// ==================== RBAC Constants ====================

// RBAC role constants (match backend config/constants.js)
export const TEACHER_ROLES = [
  'מנהל', 'סגן מנהל', 'מזכירות',
  'רכז/ת כללי', 'רכז/ת מחלקתי',
  'מורה', 'ניצוח', 'מדריך הרכב', 'תאוריה', 'ליווי פסנתר', 'הלחנה', 'מורה מגמה',
  'צפייה בלבד',
] as const;
export type TeacherRole = typeof TEACHER_ROLES[number];

export const ADMIN_TIER_ROLES: TeacherRole[] = ['מנהל', 'סגן מנהל', 'מזכירות'];
export const COORDINATOR_ROLES: TeacherRole[] = ['רכז/ת כללי', 'רכז/ת מחלקתי'];

// Role tier labels for grouped display in UI
export const ROLE_TIERS = [
  { label: 'הנהלה', roles: ['מנהל', 'סגן מנהל', 'מזכירות'] },
  { label: 'ריכוז', roles: ['רכז/ת כללי', 'רכז/ת מחלקתי'] },
  { label: 'הוראה', roles: ['מורה', 'ניצוח', 'מדריך הרכב', 'תאוריה', 'ליווי פסנתר', 'הלחנה', 'מורה מגמה'] },
  { label: 'צפייה', roles: ['צפייה בלבד'] },
] as const;

// Permission domains and their Hebrew labels
export const PERMISSION_DOMAIN_LABELS: Record<string, string> = {
  students: 'תלמידים',
  schedules: 'מערכת שעות',
  orchestras: 'תזמורות',
  rehearsals: 'חזרות',
  theory: 'תאוריה',
  teachers: 'מורים',
  reports: 'דוחות',
  settings: 'הגדרות',
  roles: 'תפקידים',
};

// Actions per domain type (match backend PERMISSION_ACTIONS)
export const PERMISSION_ACTIONS_BY_DOMAIN: Record<string, string[]> = {
  students: ['view', 'create', 'update', 'delete'],
  schedules: ['view', 'create', 'update', 'delete'],
  orchestras: ['view', 'create', 'update', 'delete'],
  rehearsals: ['view', 'create', 'update', 'delete'],
  theory: ['view', 'create', 'update', 'delete'],
  teachers: ['view', 'create', 'update', 'delete'],
  reports: ['view', 'export'],
  settings: ['view', 'update'],
  roles: ['view', 'assign'],
};

export const ACTION_LABELS: Record<string, string> = {
  view: 'צפייה',
  create: 'יצירה',
  update: 'עדכון',
  delete: 'מחיקה',
  export: 'ייצוא',
  assign: 'הקצאה',
};

export const SCOPE_LABELS: Record<string, string> = {
  all: 'הכל',
  department: 'מחלקה',
  own: 'אישי',
};

export const LOCKED_DOMAINS = ['settings', 'roles'] as const;
