/**
 * Form Validation Utilities for Conservatory Management System
 * 
 * Comprehensive validation functions with Hebrew error messages
 * and backend requirements compliance
 */

// Backend constants for validation
export const VALID_CLASSES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'אחר']
export const VALID_INSTRUMENTS = [
  // כלי קשת
  'כינור', 'ויולה', "צ'לו", 'קונטרבס',
  // כלי נשיפה-עץ
  'חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט',
  // כלי נשיפה-פליז
  'חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון',
  // מקלדת
  'פסנתר',
  // כלי פריטה
  'גיטרה', 'גיטרה בס', 'גיטרה פופ', 'נבל',
  // כלי הקשה
  'תופים', 'כלי הקשה',
  // קולי
  'שירה',
  // כלים אתניים
  'עוד', 'כלים אתניים',
  // כלים עממיים
  'מנדולינה', 'אקורדיון',
  // אחר
  'רקורדר',
]
export const VALID_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']
export const VALID_DURATIONS = [30, 45, 60]
export const VALID_STAGES = [1, 2, 3, 4, 5, 6, 7, 8]
export const VALID_ROLES = ['מורה', 'מנצח', 'מדריך הרכב', 'מנהל', 'מורה תאוריה', 'מגמה']
export const TEST_STATUSES = ['לא נבחן', 'עבר/ה', 'לא עבר/ה', 'עבר/ה בהצטיינות', 'עבר/ה בהצטיינות יתרה']

// Validation patterns
export const VALIDATION_PATTERNS = {
  phone: /^05\d{8}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  time: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  hebrewText: /^[\u0590-\u05FF\s\d\-\(\)\.]+$/,
  bagrutId: /^\d{9}$/,
  age: /^([0-9]|[1-9][0-9])$/
} as const

// Hebrew error messages
export const ERROR_MESSAGES = {
  required: 'שדה חובה',
  invalidPhone: 'מספר טלפון חייב להתחיל ב-05 ולהכיל 10 ספרות',
  invalidEmail: 'כתובת אימייל לא תקינה',
  invalidTime: 'זמן חייב להיות בפורמט HH:MM',
  invalidAge: 'גיל חייב להיות בין 0 ל-99',
  invalidBagrutId: 'מספר זהות בגרות חייב להכיל 9 ספרות',
  minLength: (min: number) => `חייב להכיל לפחות ${min} תווים`,
  maxLength: (max: number) => `לא יכול להכיל יותר מ-${max} תווים`,
  invalidSelection: 'בחירה לא תקינה',
  passwordMismatch: 'סיסמאות לא תואמות',
  weakPassword: 'סיסמה חייבת להכיל לפחות 6 תווים',
  duplicateEntry: 'ערך כבר קיים במערכת',
  futureDate: 'תאריך חייב להיות בעתיד',
  pastDate: 'תאריך חייב להיות בעבר',
  invalidRange: 'טווח לא תקין'
} as const

// Field name mapping to Hebrew
export const FIELD_LABELS = {
  fullName: 'שם מלא',
  firstName: 'שם פרטי',
  lastName: 'שם משפחה',
  phone: 'מספר טלפון',
  email: 'כתובת אימייל',
  age: 'גיל',
  address: 'כתובת',
  parentName: 'שם הורה',
  parentPhone: 'טלפון הורה',
  parentEmail: 'אימייל הורה',
  studentEmail: 'אימייל תלמיד',
  class: 'כיתה',
  instrument: 'כלי נגינה',
  instruments: 'כלי נגינה',
  stage: 'שלב',
  day: 'יום',
  time: 'שעה',
  duration: 'משך זמן',
  location: 'מיקום',
  bagrutId: 'מספר זהות בגרות',
  password: 'סיסמה',
  confirmPassword: 'אישור סיסמה',
  role: 'תפקיד',
  testStatus: 'סטטוס בחינה',
  notes: 'הערות',
  idNumber: 'תעודת זהות',
  birthYear: 'שנת לידה',
  classification: 'סיווג',
  degree: 'תואר',
  hasTeachingCertificate: 'תעודת הוראה',
  teachingExperienceYears: 'שנות ניסיון בהוראה',
  isUnionMember: 'חבר/ת ארגון מורים',
  teachingSubjects: 'מקצועות הוראה',
  managementHours: 'שעות ניהול',
  accompHours: 'שעות ליווי',
  ensembleCoordHours: 'שעות ריכוז הרכבים',
  travelTimeHours: 'שעות נסיעה',
  studyYears: 'שנות לימוד',
  extraHour: 'שעה נוספת',
  subType: 'סוג משנה',
  performanceLevel: 'רמת ביצוע',
  coordinationHours: 'שעות ריכוז',
} as const

// Validation rule interface
export interface ValidationRule {
  required?: boolean
  pattern?: RegExp
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  custom?: (value: any) => boolean
  message?: string
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  message?: string
  field?: string
}

/**
 * Validate a single field value
 */
export const validateField = (
  value: any,
  rules: ValidationRule,
  fieldName?: string
): ValidationResult => {
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return {
      isValid: false,
      message: rules.message || ERROR_MESSAGES.required,
      field: fieldName
    }
  }

  // Skip other validations if field is empty and not required
  if (!rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return { isValid: true }
  }

  // Pattern validation
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    return {
      isValid: false,
      message: rules.message || getPatternErrorMessage(rules.pattern),
      field: fieldName
    }
  }

  // Length validation
  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    return {
      isValid: false,
      message: rules.message || ERROR_MESSAGES.minLength(rules.minLength),
      field: fieldName
    }
  }

  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    return {
      isValid: false,
      message: rules.message || ERROR_MESSAGES.maxLength(rules.maxLength),
      field: fieldName
    }
  }

  // Numeric range validation
  if (rules.min !== undefined && Number(value) < rules.min) {
    return {
      isValid: false,
      message: rules.message || `ערך חייב להיות לפחות ${rules.min}`,
      field: fieldName
    }
  }

  if (rules.max !== undefined && Number(value) > rules.max) {
    return {
      isValid: false,
      message: rules.message || `ערך לא יכול להיות יותר מ-${rules.max}`,
      field: fieldName
    }
  }

  // Custom validation
  if (rules.custom && !rules.custom(value)) {
    return {
      isValid: false,
      message: rules.message || 'ערך לא תקין',
      field: fieldName
    }
  }

  return { isValid: true }
}

/**
 * Get error message for common patterns
 */
const getPatternErrorMessage = (pattern: RegExp): string => {
  switch (pattern) {
    case VALIDATION_PATTERNS.phone:
      return ERROR_MESSAGES.invalidPhone
    case VALIDATION_PATTERNS.email:
      return ERROR_MESSAGES.invalidEmail
    case VALIDATION_PATTERNS.time:
      return ERROR_MESSAGES.invalidTime
    case VALIDATION_PATTERNS.age:
      return ERROR_MESSAGES.invalidAge
    case VALIDATION_PATTERNS.bagrutId:
      return ERROR_MESSAGES.invalidBagrutId
    default:
      return 'פורמט לא תקין'
  }
}

/**
 * Validate multiple fields
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}
  let isValid = true

  Object.keys(rules).forEach(fieldName => {
    const result = validateField(data[fieldName], rules[fieldName], fieldName)
    if (!result.isValid) {
      errors[fieldName] = result.message || 'שגיאה בשדה'
      isValid = false
    }
  })

  return { isValid, errors }
}

/**
 * Validate phone number specifically
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  return validateField(phone, {
    required: true,
    pattern: VALIDATION_PATTERNS.phone,
    message: ERROR_MESSAGES.invalidPhone
  })
}

/**
 * Validate email address
 */
export const validateEmail = (email: string): ValidationResult => {
  return validateField(email, {
    required: true,
    pattern: VALIDATION_PATTERNS.email,
    message: ERROR_MESSAGES.invalidEmail
  })
}

/**
 * Validate time format
 */
export const validateTime = (time: string): ValidationResult => {
  return validateField(time, {
    required: true,
    pattern: VALIDATION_PATTERNS.time,
    message: ERROR_MESSAGES.invalidTime
  })
}

/**
 * Validate age
 */
export const validateAge = (age: string | number): ValidationResult => {
  const ageNum = typeof age === 'string' ? parseInt(age) : age
  return validateField(ageNum, {
    required: true,
    min: 0,
    max: 99,
    message: ERROR_MESSAGES.invalidAge
  })
}

/**
 * Validate selection from predefined options
 */
export const validateSelection = (
  value: string,
  options: readonly string[],
  fieldName?: string
): ValidationResult => {
  if (!options.includes(value)) {
    return {
      isValid: false,
      message: ERROR_MESSAGES.invalidSelection,
      field: fieldName
    }
  }
  return { isValid: true }
}

/**
 * Real-time validation hook helper
 */
export const useValidation = () => {
  const validateFieldRealTime = (
    value: any,
    rules: ValidationRule,
    fieldName?: string
  ): ValidationResult => {
    // For real-time validation, we might want to be less strict
    // For example, don't show "required" error until blur or submit
    const modifiedRules = { ...rules }
    
    // Don't show required error during typing
    if (value === '' || value === undefined || value === null) {
      delete modifiedRules.required
    }

    return validateField(value, modifiedRules, fieldName)
  }

  return { validateFieldRealTime }
}

/**
 * Format error message with field name
 */
export const formatErrorMessage = (fieldName: string, message: string): string => {
  const hebrewFieldName = FIELD_LABELS[fieldName as keyof typeof FIELD_LABELS] || fieldName
  return `${hebrewFieldName}: ${message}`
}

/**
 * Backend error mapping utility
 */
export const mapBackendErrors = (
  backendErrors: Record<string, string>
): Record<string, string> => {
  const mappedErrors: Record<string, string> = {}
  
  Object.entries(backendErrors).forEach(([field, message]) => {
    // Map backend field names to frontend field names if needed
    const frontendField = mapBackendFieldName(field)
    const hebrewMessage = translateErrorMessage(message)
    mappedErrors[frontendField] = hebrewMessage
  })
  
  return mappedErrors
}

/**
 * Map backend field names to frontend field names
 */
const mapBackendFieldName = (backendField: string): string => {
  const fieldMapping: Record<string, string> = {
    'personalInfo.fullName': 'fullName',
    'personalInfo.firstName': 'firstName',
    'personalInfo.lastName': 'lastName',
    'personalInfo.phone': 'phone',
    'personalInfo.email': 'email',
    'personalInfo.idNumber': 'idNumber',
    'personalInfo.birthYear': 'birthYear',
    'academicInfo.class': 'class',
    'academicInfo.studyYears': 'studyYears',
    'academicInfo.extraHour': 'extraHour',
    'professionalInfo.instrument': 'instrument',
    'professionalInfo.instruments': 'instruments',
    'professionalInfo.classification': 'classification',
    'professionalInfo.degree': 'degree',
    'managementInfo.role': 'role',
    'managementInfo.managementHours': 'managementHours',
  }

  return fieldMapping[backendField] || backendField
}

/**
 * Translate backend error messages to Hebrew
 */
const translateErrorMessage = (message: string): string => {
  // Common backend error patterns to Hebrew translations
  const translations: Record<string, string> = {
    'required': ERROR_MESSAGES.required,
    'invalid email': ERROR_MESSAGES.invalidEmail,
    'must be a valid email': ERROR_MESSAGES.invalidEmail,
    'invalid phone': ERROR_MESSAGES.invalidPhone,
    'invalid format': 'פורמט לא תקין',
    'already exists': ERROR_MESSAGES.duplicateEntry,
    'not found': 'לא נמצא במערכת',
    'unauthorized': 'אין הרשאה',
    'forbidden': 'פעולה אסורה',
    'is not allowed to be empty': ERROR_MESSAGES.required,
    'is required': ERROR_MESSAGES.required,
    'must be a string': 'ערך לא תקין',
    'length must be at least': 'הערך קצר מדי',
    'must be a number': 'חייב להיות מספר',
    'must be greater than': 'ערך נמוך מדי',
    'must be less than': 'ערך גבוה מדי',
  }

  const lowerMessage = message.toLowerCase()
  for (const [pattern, translation] of Object.entries(translations)) {
    if (lowerMessage.includes(pattern)) {
      return translation
    }
  }

  return message // Return original if no translation found
}

// ==================== Server Validation Error Handler ====================

/**
 * Interface for server validation error structure
 */
export interface ServerValidationError extends Error {
  code?: string
  validationErrors?: Record<string, string>
}

/**
 * Result of processing a server error
 */
export interface ProcessedServerError {
  /** Field-level errors mapped to form fields */
  fieldErrors: Record<string, string>
  /** General error message for display */
  generalMessage: string
  /** Whether this was a validation error */
  isValidationError: boolean
}

/**
 * Map server field paths to form field paths
 * Customize this based on your form structure
 */
const DEFAULT_FIELD_PATH_MAP: Record<string, string> = {
  'credentials.email': 'personalInfo.email',
  'credentials.password': 'password',
}

/**
 * Process a server error and extract field-level validation errors
 *
 * Usage in form components:
 * ```typescript
 * } catch (error: any) {
 *   const { fieldErrors, generalMessage, isValidationError } = handleServerValidationError(error)
 *   if (isValidationError) {
 *     setErrors(fieldErrors)
 *   }
 *   setSubmitError(generalMessage)
 * }
 * ```
 *
 * @param error - The caught error from an API call
 * @param defaultMessage - Default message if error has no message (Hebrew)
 * @param fieldPathMap - Optional custom mapping of server field paths to form field paths
 * @returns ProcessedServerError with field errors and general message
 */
export function handleServerValidationError(
  error: any,
  defaultMessage: string = 'שגיאה בשמירת הנתונים',
  fieldPathMap: Record<string, string> = {}
): ProcessedServerError {
  const combinedFieldMap = { ...DEFAULT_FIELD_PATH_MAP, ...fieldPathMap }

  // Check if this is a validation error with field details
  if (error?.code === 'VALIDATION_ERROR' && error?.validationErrors) {
    const fieldErrors: Record<string, string> = {}
    const validationErrors = error.validationErrors as Record<string, string>

    Object.entries(validationErrors).forEach(([field, message]) => {
      // Map field path if needed (e.g., credentials.email -> personalInfo.email)
      const mappedField = combinedFieldMap[field] || field
      // Translate the error message to Hebrew
      const hebrewMessage = translateErrorMessage(message)
      fieldErrors[mappedField] = hebrewMessage
    })

    return {
      fieldErrors,
      generalMessage: 'יש לתקן את השדות המסומנים באדום',
      isValidationError: true
    }
  }

  // Not a validation error - return general error message
  return {
    fieldErrors: {},
    generalMessage: error?.message || defaultMessage,
    isValidationError: false
  }
}

/**
 * Hook for handling server validation errors in forms
 *
 * Usage:
 * ```typescript
 * const { processError } = useServerValidationError()
 *
 * const handleSubmit = async () => {
 *   try {
 *     await apiService.updateData(data)
 *   } catch (error) {
 *     const { fieldErrors, generalMessage, isValidationError } = processError(error)
 *     if (isValidationError) {
 *       setErrors(prev => ({ ...prev, ...fieldErrors }))
 *     }
 *     setSubmitError(generalMessage)
 *   }
 * }
 * ```
 */
export function useServerValidationError(customFieldPathMap?: Record<string, string>) {
  const processError = (error: any, defaultMessage?: string): ProcessedServerError => {
    return handleServerValidationError(error, defaultMessage, customFieldPathMap)
  }

  return { processError }
}