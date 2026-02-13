/**
 * Student Details Feature Types
 * 
 * Comprehensive TypeScript interfaces matching the backend schema
 * for the student details page functionality.
 */

// Base types
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  fullName?: string; // backward compat — prefer firstName/lastName
  idNumber: string;
  birthDate: Date;
  age: number;
  phone: string;
  email?: string;
  address?: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  studentEmail?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface ParentsInfo {
  father?: {
    name: string;
    phone: string;
    email?: string;
    occupation?: string;
  };
  mother?: {
    name: string;
    phone: string;
    email?: string;
    occupation?: string;
  };
  guardian?: {
    name: string;
    phone: string;
    email?: string;
    relationship: string;
  };
}

export interface InstrumentProgress {
  instrumentName: string;
  isPrimary: boolean;
  currentStage: number;
  targetStage: number;
  ministryStageLevel?: string; // auto-calculated: א | ב | ג
  startDate: Date;
  progressNotes?: string;
  skillAssessments?: {
    technique: number;
    musicality: number;
    rhythm: number;
    pitch: number;
    performance: number;
  };
  tests?: {
    stageTest: {
      status: string;
      lastTestDate?: string;
      nextTestDate?: string;
      notes?: string;
    };
    technicalTest: {
      status: string;
      lastTestDate?: string;
      nextTestDate?: string;
      notes?: string;
    };
  };
}

export interface AcademicInfo {
  class: string;
  schoolName?: string;
  instrumentProgress: InstrumentProgress[];
  studyYears?: number; // years at conservatory (1-12)
  extraHour?: number; // extra lesson hours (decimal)
  theoreticalKnowledge?: {
    musicTheory: number;
    solfege: number;
    musicHistory: number;
  };
  specialNeeds?: string;
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
}

export interface TeacherAssignment {
  teacherId: string;
  teacherName: string;
  instrumentName: string;
  lessonType: 'individual' | 'group' | 'masterclass';
  weeklyHours: number;
  assignmentDate: Date;
  isActive: boolean;
  notes?: string;
}

export interface OrchestraEnrollment {
  orchestraId: string;
  orchestraName: string;
  enrollmentDate: Date;
  position?: string;
  partAssignment?: string;
  isActive: boolean;
  performanceHistory?: {
    concertId: string;
    concertName: string;
    date: Date;
    role: string;
  }[];
}

export interface TheoryClass {
  classId: string;
  className: string;
  level: number;
  enrollmentDate: Date;
  isActive: boolean;
  grade?: number;
  progress?: {
    completed: number;
    total: number;
    lastUpdate: Date;
  };
}

export interface AttendanceRecord {
  date: Date;
  lessonType: 'individual' | 'group' | 'theory' | 'orchestra';
  teacherId?: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  notes?: string;
}

export interface AttendanceStatistics {
  totalLessons: number;
  attendedLessons: number;
  attendanceRate: number;
  lastThirtyDays: {
    totalLessons: number;
    attendedLessons: number;
    attendanceRate: number;
  };
  byLessonType: {
    individual: { total: number; attended: number; rate: number };
    group: { total: number; attended: number; rate: number };
    theory: { total: number; attended: number; rate: number };
    orchestra: { total: number; attended: number; rate: number };
  };
}

export interface Document {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  uploadedBy: string;
  category: 'registration' | 'medical' | 'performance' | 'assessment' | 'other';
  description?: string;
  url: string;
}

export interface LessonSchedule {
  _id: string;
  teacherId: string;
  teacherName: string;
  instrumentName: string;
  dayOfWeek: number; // 0-6, Sunday = 0
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  lessonType: 'individual' | 'group' | 'orchestra' | 'theory';
  roomNumber?: string;
  location?: string;
  isRecurring: boolean;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

// Calendar event interface for processed schedule data
export interface CalendarEvent {
  _id: string;
  title: string;
  day: string;  // Hebrew day name
  dayOfWeek: number;  // 0=Sunday, 1=Monday, etc.
  startTime: string;
  endTime: string;
  location: string;
  lessonType: 'individual' | 'group' | 'orchestra' | 'theory';
  teacherName: string;
  instrumentName: string;
  roomNumber?: string;
}

// Main StudentDetails interface
export interface StudentDetails {
  _id: string;
  tenantId?: string;
  personalInfo: PersonalInfo;
  parentsInfo: ParentsInfo;
  academicInfo: AcademicInfo;
  teacherAssignments: TeacherAssignment[];
  orchestraEnrollments: OrchestraEnrollment[];
  theoryClasses: TheoryClass[];
  schedule: LessonSchedule[];
  attendanceRecords: AttendanceRecord[];
  attendanceStats: AttendanceStatistics;
  documents: Document[];
  enrollments: {
    orchestraIds: string[];
    theoryClassIds: string[];
  };
  isActive: boolean;
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
  schoolYearId: string;
}

// Tab-specific data types for better organization
export interface PersonalInfoTabData {
  personalInfo: PersonalInfo;
  parentsInfo: ParentsInfo;
  isActive: boolean;
  registrationDate: Date;
}

export interface AcademicInfoTabData {
  academicInfo: AcademicInfo;
  teacherAssignments: TeacherAssignment[];
}

export interface ScheduleTabData {
  schedule: LessonSchedule[];
  teacherAssignments: TeacherAssignment[];
}

export interface AttendanceTabData {
  attendanceRecords: AttendanceRecord[];
  attendanceStats: AttendanceStatistics;
}

export interface OrchestraTabData {
  orchestraEnrollments: OrchestraEnrollment[];
}

export interface TheoryTabData {
  theoryClasses: TheoryClass[];
}

export interface DocumentsTabData {
  documents: Document[];
}

export interface BagrutTabData {
  bagrutId?: string;
  isEnrolledInBagrut: boolean;
  bagrutStatus: 'not_started' | 'in_progress' | 'completed';
}

// Tab navigation types
export type TabType = 
  | 'personal' 
  | 'academic' 
  | 'schedule' 
  | 'attendance' 
  | 'orchestra' 
  | 'theory' 
  | 'bagrut'
  | 'documents';

export interface TabConfig {
  id: TabType;
  label: string;
  icon?: string;
  component: React.ComponentType<any>;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface StudentDetailsResponse extends ApiResponse<StudentDetails> {}

// Error types
export interface StudentDetailsError {
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'SERVER_ERROR';
  message: string;
  details?: any;
}

// Hook return types
export interface UseStudentDetailsResult {
  student: StudentDetails | null;
  isLoading: boolean;
  error: StudentDetailsError | null;
  refetch: () => Promise<void>;
}

export interface UseStudentScheduleResult {
  schedule: LessonSchedule[];
  isLoading: boolean;
  error: StudentDetailsError | null;
  refetch: () => Promise<void>;
}

export interface UseStudentAttendanceResult {
  attendanceRecords: AttendanceRecord[];
  attendanceStats: AttendanceStatistics;
  isLoading: boolean;
  error: StudentDetailsError | null;
  refetch: () => Promise<void>;
}

// Component prop types
export interface StudentDetailsPageProps {
  studentId: string;
}

export interface StudentDetailsHeaderProps {
  student: StudentDetails;
  isLoading?: boolean;
}

export interface StudentTabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  tabs: TabConfig[];
}

export interface StudentTabContentProps {
  activeTab: TabType;
  studentId: string;
  student: StudentDetails | null;
  isLoading: boolean;
}

// Form types for inline editing
export interface EditPersonalInfoData {
  personalInfo: Partial<PersonalInfo>;
  parentsInfo: Partial<ParentsInfo>;
}

export interface EditAcademicInfoData {
  academicInfo: Partial<AcademicInfo>;
}

// Utility types
export type StudentDetailsField = keyof StudentDetails;
export type PartialStudentDetails = Partial<StudentDetails>;