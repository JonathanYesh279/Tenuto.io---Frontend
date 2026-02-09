/**
 * Bagrut Entity Type Definitions
 * Based on the actual backend Bagrut schema and database structure
 */

// Basic Bagrut interface matching the backend schema
export interface Bagrut {
  _id?: string;
  studentId: string;
  teacherId: string;
  conservatoryName?: string;
  program: ProgramPiece[];
  accompaniment: AccompanimentInfo;
  presentations: Presentation[];
  performances?: Performance[];
  gradingDetails?: GradingDetails;
  magenBagrut?: MagenBagrut;
  documents?: BagrutDocument[];
  finalGrade?: number;
  finalGradeLevel?: string;
  teacherSignature?: string;
  completionDate?: Date;
  isCompleted: boolean;
  testDate?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  directorName?: string;
  directorEvaluation?: DirectorEvaluation;
  recitalUnits?: 3 | 5;
  recitalField?: 'קלאסי' | 'ג\'אז' | 'שירה';
}

// Program piece from the backend schema
export interface ProgramPiece {
  _id?: string;
  pieceNumber: number;
  pieceTitle: string;
  composer: string;
  duration: string;
  movement?: string;
  youtubeLink?: string;
}

// Accompaniment info from backend schema
export interface AccompanimentInfo {
  type: 'נגן מלווה' | 'הרכב';
  accompanists: Accompanist[];
}

// Accompanist from backend schema
export interface Accompanist {
  _id?: string;
  name: string;
  instrument: string;
  phone?: string;
  email?: string;
}

// Presentation from backend schema - Full structure for השמעות
export interface Presentation {
  completed?: boolean;
  status?: 'עבר/ה' | 'לא עבר/ה' | 'לא נבחן';
  date?: Date;
  review?: string;
  reviewedBy?: string; // שמות הבוחנים
  notes?: string; // הערות כלליות
  recordingLinks?: string[]; // קישור תיעוד
  grade?: number; // 0-100
  gradeLevel?: 'מעולה' | 'טוב מאוד' | 'טוב' | 'מספיק' | 'מספיק בקושי' | 'לא עבר/ה';
  detailedGrading?: DetailedGrading; // For השמעה 4 (מגן בגרות)
  presentationNumber?: number; // 1-4
  type?: 'regular' | 'magen'; // regular for 1-3, magen for 4
  isCompleted?: boolean;
}

// Grade level helper function
export const getGradeLevelFromScore = (score: number): string => {
  if (score >= 95) return 'מעולה';
  if (score >= 90) return 'טוב מאוד';
  if (score >= 85) return 'כמעט טוב מאוד';
  if (score >= 75) return 'טוב';
  if (score >= 65) return 'כמעט טוב';
  if (score >= 55) return 'מספיק';
  if (score >= 45) return 'מספיק בקושי';
  return 'לא עבר/ה';
};

// Helper to convert presentation to display format
export interface PresentationDisplay {
  presentationNumber: number; // 1-4
  title: string; // השמעה 1, השמעה 2, השמעה 3, מגן בגרות
  date?: Date;
  status?: 'עבר/ה' | 'לא עבר/ה' | 'לא נבחן';
  completed?: boolean;
  grade?: number;
  gradeLevel?: string;
  notes?: string;
  reviewedBy?: string;
  recordingLinks?: string[];
  detailedGrading?: DetailedGrading;
  type: 'regular' | 'magen';
  backendIndex?: number; // Backend array index (0-2 for regular, -1 for magen)
}

// Director evaluation interface
export interface DirectorEvaluation {
  points?: number;
  percentage?: number;
  comments?: string;
}

// Detailed grading for מגן בגרות (השמעה 4)
export interface DetailedGrading {
  playingSkills: { // מיומנות נגינה/שירה
    grade?: string;
    points?: number; // 0-40
    maxPoints: 40;
    comments?: string;
  };
  musicalUnderstanding: { // הבנה מוסיקלית
    grade?: string;
    points?: number; // 0-30
    maxPoints: 30;
    comments?: string;
  };
  textKnowledge: { // ידיעת הטקסט
    grade?: string;
    points?: number; // 0-20
    maxPoints: 20;
    comments?: string;
  };
  playingByHeart: { // נוגן בע"פ
    grade?: string;
    points?: number; // 0-10
    maxPoints: 10;
    comments?: string;
  };
}

// Grading details (simplified for backward compatibility)
export interface GradingDetails {
  technique?: {
    grade?: number;
    maxPoints?: number;
    comments?: string;
  };
  interpretation?: {
    grade?: number;
    maxPoints?: number;
    comments?: string;
  };
  musicality?: {
    grade?: number;
    maxPoints?: number;
    comments?: string;
  };
  overall?: {
    grade?: number;
    maxPoints?: number;
    comments?: string;
  };
  detailedGrading?: DetailedGrading;
}

// Magen Bagrut (simplified)
export interface MagenBagrut {
  completed?: boolean;
  status?: string;
  date?: Date;
  review?: string;
  reviewedBy?: string;
  grade?: number;
  gradeLevel?: string;
  recordingLinks?: string[];
}

// Document from backend schema
export interface BagrutDocument {
  _id?: string;
  title: string;
  fileUrl: string;
  fileKey?: string;
  uploadDate: Date;
  uploadedBy: string;
}

// Form data types for comprehensive usage
export interface BagrutFormData {
  // Basic Information
  studentId: string;
  teacherId: string;
  conservatoryName?: string;
  testDate?: Date;
  notes?: string;
  
  // Recital Configuration
  recitalUnits?: 3 | 5;
  recitalField?: 'קלאסי' | 'ג\'אז' | 'שירה';
  
  // Program Management (5 pieces)
  program?: ProgramPiece[];
  
  // Accompaniment Info
  accompaniment?: AccompanimentInfo;
  
  // Presentations (3 regular + 1 final)
  presentations?: Presentation[];
  
  // Director Evaluation
  directorEvaluation?: DirectorEvaluation;
  
  // Final Assessment Details
  gradingDetails?: GradingDetails;
}

// Query parameters for API calls
export interface BagrutQueryParams {
  studentId?: string;
  teacherId?: string;
  isActive?: boolean;
  showInactive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Update data types
export interface PresentationUpdateData {
  completed?: boolean;
  status?: string;
  date?: Date;
  review?: string;
  notes?: string;
  detailedGrading?: DetailedGrading;
}

export interface MagenBagrutUpdateData {
  completed?: boolean;
  status?: string;
  date?: Date;
  review?: string;
  grade?: number;
}

// Updated grading details structure for API calls
export interface GradingDetailsUpdateData {
  playingSkills: {
    grade?: string;
    points: number;
    maxPoints: number;
    comments?: string;
  };
  musicalUnderstanding: {
    grade?: string;
    points: number;
    maxPoints: number;
    comments?: string;
  };
  textKnowledge: {
    grade?: string;
    points: number;
    maxPoints: number;
    comments?: string;
  };
  playingByHeart: {
    grade?: string;
    points: number;
    maxPoints: number;
    comments?: string;
  };
}

export interface DirectorEvaluationUpdateData {
  points: number;
  comments?: string;
}

export interface RecitalConfigurationData {
  recitalUnits: 3 | 5;
  recitalField: 'קלאסי' | 'ג\'אז' | 'שירה';
}

// Response types (for future use when API is fully implemented)
export interface BagrutResponse {
  success: boolean;
  data: Bagrut;
  message?: string;
}

export interface BagrutListResponse {
  success: boolean;
  data: Bagrut[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  message?: string;
}

// Error type
export interface BagrutError {
  message: string;
  field?: string;
  code?: string;
}