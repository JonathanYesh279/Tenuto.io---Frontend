/**
 * Test Status Utilities
 *
 * Provides constants and helper functions for managing student test statuses,
 * including stage tests and technical tests.
 */

// Test Status Constants
export const TEST_STATUSES = {
  NOT_TESTED: 'לא נבחן',
  PASSED: 'עבר/ה',
  FAILED: 'לא עבר/ה',
  PASSED_WITH_DISTINCTION: 'עבר/ה בהצטיינות',
  PASSED_WITH_HIGH_DISTINCTION: 'עבר/ה בהצטיינות יתרה'
} as const;

export const TEST_STATUS_ARRAY = [
  TEST_STATUSES.NOT_TESTED,
  TEST_STATUSES.PASSED,
  TEST_STATUSES.FAILED,
  TEST_STATUSES.PASSED_WITH_DISTINCTION,
  TEST_STATUSES.PASSED_WITH_HIGH_DISTINCTION
] as const;

export type TestStatus = typeof TEST_STATUS_ARRAY[number];

// Test Types
export const TEST_TYPES = {
  STAGE_TEST: 'stageTest',
  TECHNICAL_TEST: 'technicalTest'
} as const;

export type TestType = typeof TEST_TYPES[keyof typeof TEST_TYPES];

// Stage Level Constants
export const STAGE_LEVELS = {
  MIN: 1,
  MAX: 8
} as const;

/**
 * Check if a test status represents a passing grade
 * @param status - Test status to check
 * @returns true if the status is any passing variant
 */
export function isPassingStatus(status: string): boolean {
  const passingStatuses: string[] = [
    TEST_STATUSES.PASSED,
    TEST_STATUSES.PASSED_WITH_DISTINCTION,
    TEST_STATUSES.PASSED_WITH_HIGH_DISTINCTION
  ];
  return passingStatuses.includes(status);
}

/**
 * Check if a test status represents a failing grade
 * @param status - Test status to check
 * @returns true if the status is a failing grade
 */
export function isFailingStatus(status: string): boolean {
  const failingStatuses: string[] = [
    TEST_STATUSES.NOT_TESTED,
    TEST_STATUSES.FAILED
  ];
  return failingStatuses.includes(status);
}

/**
 * Validate if a status string is a valid test status
 * @param status - Status string to validate
 * @returns true if valid
 */
export function isValidTestStatus(status: string): status is TestStatus {
  return TEST_STATUS_ARRAY.includes(status as TestStatus);
}

/**
 * Validate if a stage level is valid (1-8)
 * @param stage - Stage level to validate
 * @returns true if valid
 */
export function isValidStageLevel(stage: number): boolean {
  return Number.isInteger(stage) && stage >= STAGE_LEVELS.MIN && stage <= STAGE_LEVELS.MAX;
}

/**
 * Check if a student can advance to the next stage
 * @param currentStage - Current stage level
 * @param testStatus - Stage test status
 * @returns true if advancement is possible
 */
export function canAdvanceStage(currentStage: number, testStatus: string): boolean {
  return (
    isValidStageLevel(currentStage) &&
    currentStage < STAGE_LEVELS.MAX &&
    isPassingStatus(testStatus)
  );
}

/**
 * Calculate the next stage level if advancement is allowed
 * @param currentStage - Current stage level
 * @param testStatus - Stage test status
 * @returns Next stage level or current stage if no advancement
 */
export function calculateNextStage(currentStage: number, testStatus: string): number {
  if (canAdvanceStage(currentStage, testStatus)) {
    return currentStage + 1;
  }
  return currentStage;
}

/**
 * Get color class for test status badge
 * @param status - Test status
 * @returns Tailwind CSS color classes
 */
export function getTestStatusColorClass(status: string): string {
  switch (status) {
    case TEST_STATUSES.NOT_TESTED:
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case TEST_STATUSES.PASSED:
      return 'bg-green-100 text-green-800 border-green-300';
    case TEST_STATUSES.FAILED:
      return 'bg-red-100 text-red-800 border-red-300';
    case TEST_STATUSES.PASSED_WITH_DISTINCTION:
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case TEST_STATUSES.PASSED_WITH_HIGH_DISTINCTION:
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

/**
 * Get icon for test status
 * @param status - Test status
 * @returns Icon name or emoji
 */
export function getTestStatusIcon(status: string): string {
  switch (status) {
    case TEST_STATUSES.NOT_TESTED:
      return '⏳';
    case TEST_STATUSES.PASSED:
      return '✓';
    case TEST_STATUSES.FAILED:
      return '✗';
    case TEST_STATUSES.PASSED_WITH_DISTINCTION:
      return '⭐';
    case TEST_STATUSES.PASSED_WITH_HIGH_DISTINCTION:
      return '🏆';
    default:
      return '❓';
  }
}

/**
 * Format test date for display
 * @param date - Date string or Date object
 * @returns Formatted date string in Hebrew locale
 */
export function formatTestDate(date: string | Date | null | undefined): string {
  if (!date) return 'לא נבחן';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting test date:', error);
    return 'תאריך לא תקין';
  }
}

/**
 * Get student's primary instrument from instrument progress array
 * @param instrumentProgress - Array of instrument progress objects
 * @returns Primary instrument object or null
 */
export function getPrimaryInstrument(instrumentProgress: any[]): any | null {
  if (!Array.isArray(instrumentProgress) || instrumentProgress.length === 0) {
    return null;
  }

  return instrumentProgress.find(inst => inst.isPrimary === true) || instrumentProgress[0];
}

/**
 * Get test data for a specific instrument
 * @param instrumentProgress - Array of instrument progress objects
 * @param instrumentName - Name of the instrument
 * @returns Test data object or null
 */
export function getInstrumentTests(instrumentProgress: any[], instrumentName: string): any | null {
  if (!Array.isArray(instrumentProgress) || !instrumentName) {
    return null;
  }

  const instrument = instrumentProgress.find(inst => inst.instrumentName === instrumentName);
  return instrument?.tests || null;
}

/**
 * Validate test update request data
 * @param studentId - Student ID
 * @param instrumentName - Instrument name
 * @param status - Test status
 * @throws Error with Hebrew message if validation fails
 */
export function validateTestUpdateData(
  studentId: string | undefined,
  instrumentName: string | undefined,
  status: string | undefined
): void {
  if (!studentId || !instrumentName || !status) {
    throw new Error('חסרים נתונים נדרשים: מזהה תלמיד, כלי נגינה וסטטוס');
  }

  if (!isValidTestStatus(status)) {
    throw new Error(`סטטוס מבחן לא תקין: ${status}`);
  }
}

/**
 * Get Hebrew description for a test status transition
 * @param previousStatus - Previous test status
 * @param newStatus - New test status
 * @returns Hebrew description of the transition
 */
export function getStatusTransitionDescription(previousStatus: string, newStatus: string): string {
  if (previousStatus === newStatus) {
    return 'הסטטוס לא השתנה';
  }

  if (isFailingStatus(previousStatus) && isPassingStatus(newStatus)) {
    return 'התלמיד עבר את המבחן!';
  }

  if (isPassingStatus(previousStatus) && isFailingStatus(newStatus)) {
    return 'התלמיד לא עבר את המבחן';
  }

  if (previousStatus === TEST_STATUSES.NOT_TESTED && isPassingStatus(newStatus)) {
    return 'המבחן הושלם בהצלחה!';
  }

  return 'הסטטוס עודכן';
}

/**
 * Error messages in Hebrew for test-related operations
 */
export const TEST_ERROR_MESSAGES = {
  STUDENT_NOT_FOUND: 'תלמיד לא נמצא',
  INSTRUMENT_NOT_FOUND: 'כלי הנגינה לא נמצא',
  UNAUTHORIZED: 'אין לך הרשאה לבצע פעולה זו',
  INVALID_STATUS: 'סטטוס מבחן לא תקין',
  INVALID_STAGE: 'שלב לא תקין (חייב להיות בין 1-8)',
  MAX_STAGE_REACHED: 'התלמיד כבר בשלב 8 - השלב הגבוה ביותר',
  MISSING_DATA: 'חסרים נתונים נדרשים',
  UPDATE_FAILED: 'עדכון המבחן נכשל',
  NETWORK_ERROR: 'שגיאת תקשורת - נסה שוב'
} as const;

/**
 * Success messages in Hebrew for test-related operations
 */
export const TEST_SUCCESS_MESSAGES = {
  STAGE_TEST_UPDATED: 'מבחן שלב עודכן בהצלחה',
  TECHNICAL_TEST_UPDATED: 'מבחן טכני עודכן בהצלחה',
  STAGE_ADVANCED: 'השלב עודכן בהצלחה',
  STAGE_TEST_PASSED_WITH_ADVANCEMENT: 'מבחן שלב עודכן והשלב קודם בהצלחה!'
} as const;
