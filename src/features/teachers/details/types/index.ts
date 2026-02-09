/**
 * Teacher Details Feature Types
 * 
 * TypeScript interfaces matching the actual backend teacher schema
 * Based on the provided teacher document structure
 */

// Base types matching backend structure
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  fullName?: string; // backward compat — prefer firstName/lastName
  phone: string;
  email: string;
  address: string;
  idNumber?: string;
  birthYear?: number;
}

export interface ProfessionalInfo {
  instrument?: string; // legacy single instrument
  instruments?: string[]; // multi-instrument (new)
  isActive: boolean;
  classification?: string; // ממשיך | חדש
  degree?: string; // תואר שני | תואר ראשון | מוסמך | בלתי מוסמך
  hasTeachingCertificate?: boolean;
  teachingExperienceYears?: number;
  isUnionMember?: boolean;
  teachingSubjects?: string[];
}

export interface ManagementInfo {
  role?: string; // ריכוז פדגוגי | ריכוז מחלקה | סגן מנהל | ריכוז אחר
  managementHours?: number;
  accompHours?: number;
  ensembleCoordHours?: number;
  travelTimeHours?: number;
}

export interface Conducting {
  orchestraIds: string[];
}

export interface SchoolYear {
  schoolYearId: string;
  isActive: boolean;
}

export interface Teaching {
  studentIds: string[];
  schedule: TeachingScheduleSlot[];
}

export interface TeachingScheduleSlot {
  _id: string;
  studentId: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  location?: string;
  notes?: string;
  recurring: {
    isRecurring: boolean;
    excludeDates: Date[];
  };
  assignedLessons: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeBlock {
  _id: string;
  day: string; // Hebrew day name (ראשון, שני, שלישי, etc.)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  totalDuration: number; // in minutes
  location: string;
  notes?: string;
  isActive: boolean;
  assignedLessons: any[];
  recurring: {
    isRecurring: boolean;
    excludeDates: Date[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Credentials {
  email: string;
  refreshToken?: string;
  password: string;
  passwordSetAt?: Date;
  lastLogin?: Date;
  invitationToken?: string;
  invitationExpiry?: Date;
  isInvitationAccepted?: boolean;
  invitedAt?: Date;
  invitedBy?: string;
  invitationMode?: 'EMAIL' | 'DEFAULT_PASSWORD';
  requiresPasswordChange?: boolean;
}

// Main Teacher interface matching backend document
export interface TeacherDetails {
  _id: string;
  tenantId?: string;
  personalInfo: PersonalInfo;
  roles: string[];
  professionalInfo: ProfessionalInfo;
  managementInfo?: ManagementInfo;
  isActive: boolean;
  conducting: Conducting;
  orchestraIds: string[]; // Legacy field
  ensemblesIds: string[];
  schoolYears: SchoolYear[];
  teaching: Teaching;
  timeBlocks: TimeBlock[];
  credentials: Credentials;
  createdAt: Date;
  updatedAt: Date;
}

// Derived types for UI components
export interface TeacherSummary {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string; // backward compat
  email: string;
  instrument?: string;
  instruments?: string[];
  isActive: boolean;
  studentCount: number;
  weeklyHours: number;
  roles: string[];
}

export interface TeacherScheduleView {
  teacherId: string;
  teacherName: string;
  timeBlocks: TimeBlock[];
  scheduledLessons: TeachingScheduleSlot[];
  availableSlots: string[];
  weeklyCapacity: number;
  utilizationRate: number;
}

export interface StudentAssignment {
  studentId: string;
  studentName: string;
  instrument: string;
  lessonDay: string;
  lessonTime: string;
  duration: number;
  location: string;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export interface TeacherStatistics {
  totalStudents: number;
  activeStudents: number;
  weeklyHours: number;
  monthlyLessons: number;
  attendanceRate: number;
  utilizationRate: number;
  paymentStatus: {
    paid: number;
    pending: number;
    overdue: number;
  };
  instrumentBreakdown: {
    [instrument: string]: number;
  };
  gradeDistribution: {
    [grade: string]: number;
  };
}

export interface ScheduleConflict {
  type: 'TIME_OVERLAP' | 'STUDENT_DOUBLE_BOOKING' | 'LOCATION_CONFLICT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  conflictingSlots: string[];
  suggestedResolution?: string;
}

export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  studentId?: string;
  studentName?: string;
  location: string;
}

// Form types for editing
export interface EditPersonalInfoData {
  personalInfo: Partial<PersonalInfo>;
}

export interface EditProfessionalInfoData {
  professionalInfo: Partial<ProfessionalInfo>;
  roles: string[];
}

export interface CreateTimeBlockData {
  day: string;
  startTime: string;
  endTime: string;
  location: string;
  notes?: string;
  isActive: boolean;
}

export interface UpdateTimeBlockData extends Partial<CreateTimeBlockData> {
  _id: string;
}

export interface ScheduleLessonData {
  studentId: string;
  day: string;
  startTime: string;
  duration: number;
  location?: string;
  notes?: string;
  startDate?: Date;
  recurring?: {
    isRecurring: boolean;
    excludeDates: Date[];
  };
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  warnings?: {
    potentialDuplicates?: any[];
    message?: string;
  };
}

export interface TeacherDetailsResponse extends ApiResponse<TeacherDetails> {}

export interface TeacherListResponse extends ApiResponse<TeacherDetails[]> {}

export interface CreateTeacherResponse extends ApiResponse<TeacherDetails> {
  invitationInfo?: {
    mode: 'EMAIL' | 'DEFAULT_PASSWORD';
    requiresPasswordChange: boolean;
    defaultPassword?: string;
  };
}

// Hook return types
export interface UseTeacherDetailsResult {
  teacher: TeacherDetails | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isFetching: boolean;
}

export interface UseTeacherStudentsResult {
  students: any[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addStudent: (studentId: string) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;
}

export interface UseTeacherScheduleResult {
  schedule: TeacherScheduleView;
  isLoading: boolean;
  error: Error | null;
  conflicts: ScheduleConflict[];
  refetch: () => Promise<void>;
  addTimeBlock: (timeBlockData: CreateTimeBlockData) => Promise<void>;
  updateTimeBlock: (timeBlockData: UpdateTimeBlockData) => Promise<void>;
  removeTimeBlock: (timeBlockId: string) => Promise<void>;
  scheduleLesson: (lessonData: ScheduleLessonData) => Promise<void>;
}

export interface UseTeacherStatisticsResult {
  statistics: TeacherStatistics | null;
  isLoading: boolean;
  error: Error | null;
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
  refetch: () => Promise<void>;
}

// Component prop types
export interface TeacherDetailsPageProps {
  teacherId: string;
}

export interface TeacherDetailsHeaderProps {
  teacher: TeacherDetails;
  isLoading?: boolean;
  onEdit?: () => void;
  onDeactivate?: () => void;
}

export interface TeacherTabNavigationProps {
  activeTab: TeacherTabType;
  onTabChange: (tab: TeacherTabType) => void;
  tabs: TeacherTabConfig[];
}

export interface TeacherTabContentProps {
  activeTab: TeacherTabType;
  teacherId: string;
  teacher: TeacherDetails | null;
  isLoading: boolean;
}

// Tab types
export type TeacherTabType =
  | 'overview'
  | 'personal'
  | 'professional'
  | 'instruments'
  | 'teachingSubjects'
  | 'management'
  | 'schedule'
  | 'students'
  | 'statistics'
  | 'settings';

export interface TeacherTabConfig {
  id: TeacherTabType;
  label: string;
  icon?: string;
  component: React.ComponentType<any>;
  adminOnly?: boolean;
}

// Error types
export interface TeacherDetailsError {
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'SERVER_ERROR' | 'DUPLICATE_TEACHER_DETECTED';
  message: string;
  details?: any;
  duplicateInfo?: {
    blocked: boolean;
    reason: string;
    duplicates: any[];
    totalDuplicatesFound: number;
  };
}

// Filter and search types
export interface TeacherFilterOptions {
  name?: string;
  instrument?: string;
  isActive?: boolean;
  role?: string;
  studentId?: string;
  orchestraId?: string;
  ensembleId?: string;
  showInactive?: boolean;
}

export interface TeacherSortOptions {
  field: 'name' | 'instrument' | 'studentCount' | 'createdAt' | 'lastLogin';
  direction: 'asc' | 'desc';
}

// Time and scheduling utilities
export interface DaySchedule {
  day: string;
  dayOfWeek: number;
  timeBlocks: TimeBlock[];
  scheduledLessons: TeachingScheduleSlot[];
  availableSlots: AvailabilitySlot[];
}

export interface WeeklySchedule {
  teacherId: string;
  weekStart: Date;
  days: DaySchedule[];
  totalHours: number;
  utilizationRate: number;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TimeBlockValidation extends ValidationResult {
  conflicts: ScheduleConflict[];
  suggestions: string[];
}

// Utility types
export type PartialTeacherDetails = Partial<TeacherDetails>;
export type TeacherDetailsField = keyof TeacherDetails;

// Constants
export const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] as const;
export const WORKING_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'] as const;

export const TEACHER_ROLES = [
  'מורה',
  'מנהל מקצועי', 
  'מנצח',
  'רכז מחלקה',
  'מנהל'
] as const;

export const INSTRUMENTS = [
  'כינור', 'ויולה', 'צ\'לו', 'קונטרבס',
  'חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט',
  'חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון',
  'פסנתר',
  'גיטרה', 'גיטרה בס', 'גיטרה פופ', 'נבל',
  'תופים', 'כלי הקשה',
  'שירה',
  'עוד', 'כלים אתניים',
  'מנדולינה', 'אקורדיון',
  'רקורדר',
] as const;

export type HebrewDay = typeof HEBREW_DAYS[number];
export type WorkingDay = typeof WORKING_DAYS[number]; 
export type TeacherRole = typeof TEACHER_ROLES[number];
export type Instrument = typeof INSTRUMENTS[number];

// Hours Summary (from /api/hours-summary)
export interface HoursSummary {
  teacherId: string;
  schoolYearId: string;
  teachingHours: {
    privateLessons: number;
    byInstrument: Record<string, number>;
  };
  theoryHours: {
    total: number;
    byCategory: Record<string, number>;
  };
  ensembleHours: {
    actual: number;
    coordination: number;
    byOrchestra: Record<string, number>;
  };
  accompHours: number;
  managementHours: number;
  travelTime: number;
  totalWeeklyHours: number;
  calculatedAt: Date;
  isStale: boolean;
}