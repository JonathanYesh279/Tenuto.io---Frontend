/**
 * TypeScript Type Definitions for Test-Related Data
 *
 * Use these types for type safety when working with student tests
 */

/**
 * Valid test status values
 */
export type TestStatus =
  | 'לא נבחן'
  | 'עבר/ה'
  | 'לא עבר/ה'
  | 'עבר/ה בהצטיינות'
  | 'עבר/ה בהצטיינות יתרה';

/**
 * Test types
 */
export type TestType = 'stageTest' | 'technicalTest';

/**
 * Test information
 */
export interface TestInfo {
  status: TestStatus;
  lastTestDate?: Date | string | null;
  nextTestDate?: Date | string | null;
  notes?: string;
}

/**
 * Tests object containing both stage and technical test info
 */
export interface StudentTests {
  stageTest: TestInfo;
  technicalTest: TestInfo;
}

/**
 * Instrument progress data
 */
export interface InstrumentProgress {
  instrumentName: string;
  currentStage: number; // 1-8
  isPrimary: boolean;
  tests: StudentTests;
  // Legacy fields for backward compatibility
  instrument?: string;
  stage?: number;
}

/**
 * Academic information
 */
export interface AcademicInfo {
  class: string;
  instrumentProgress: InstrumentProgress[];
  tests?: {
    bagrutId?: string | null;
  };
}

/**
 * Personal information
 */
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  fullName?: string; // backward compat
  idNumber?: string;
  dateOfBirth?: Date | string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  studentEmail?: string;
}

/**
 * Student object (simplified version for test operations)
 */
export interface Student {
  _id: string;
  personalInfo: PersonalInfo;
  academicInfo: AcademicInfo;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Test update request payload
 */
export interface TestUpdateRequest {
  instrumentName: string;
  testType: TestType;
  status: TestStatus;
}

/**
 * Test update response
 */
export interface TestUpdateResponse extends Student {
  // Response is the full updated student object
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  details?: any;
  validOptions?: string[];
  received?: any;
}

/**
 * Stage advancement check result
 */
export interface StageAdvancementCheck {
  canAdvance: boolean;
  currentStage: number;
  nextStage: number;
  reason?: string;
}

/**
 * Test status color mapping
 */
export interface TestStatusColorMap {
  background: string;
  text: string;
  border: string;
}

/**
 * Service method options
 */
export interface TestUpdateOptions {
  instrumentName: string;
  status: TestStatus;
  optimistic?: boolean; // Enable optimistic updates
  skipCache?: boolean;  // Skip cache invalidation
}

/**
 * Cache invalidation options
 */
export interface CacheInvalidationOptions {
  studentId: string;
  includeRelated?: boolean; // Also invalidate teacher/orchestra caches
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Test statistics
 */
export interface TestStatistics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  notTested: number;
  passRate: number;
}

/**
 * Type guard to check if a string is a valid test status
 */
export function isTestStatus(value: string): value is TestStatus {
  const validStatuses: TestStatus[] = [
    'לא נבחן',
    'עבר/ה',
    'לא עבר/ה',
    'עבר/ה בהצטיינות',
    'עבר/ה בהצטיינות יתרה'
  ];
  return validStatuses.includes(value as TestStatus);
}

/**
 * Type guard to check if a string is a valid test type
 */
export function isTestType(value: string): value is TestType {
  return value === 'stageTest' || value === 'technicalTest';
}

/**
 * Type guard to check if a value is a valid InstrumentProgress object
 */
export function isInstrumentProgress(value: any): value is InstrumentProgress {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.instrumentName === 'string' &&
    typeof value.currentStage === 'number' &&
    typeof value.isPrimary === 'boolean' &&
    value.tests &&
    typeof value.tests === 'object'
  );
}

/**
 * Type guard to check if stage level is valid (1-8)
 */
export function isValidStage(stage: number): boolean {
  return Number.isInteger(stage) && stage >= 1 && stage <= 8;
}
