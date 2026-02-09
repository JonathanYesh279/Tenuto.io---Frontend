/**
 * Bagrut Validation Middleware
 * Intercepts and validates all Bagrut-related updates before they reach the state
 */

import type { 
  DetailedGrading, 
  DirectorEvaluationUpdateData, 
  RecitalConfigurationData,
  PresentationUpdateData 
} from '../types/bagrut.types';

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Validation rule definitions
export const VALIDATION_RULES = {
  POINTS: {
    PLAYING_SKILLS: { min: 0, max: 40, field: 'כישורי נגינה' },
    MUSICAL_UNDERSTANDING: { min: 0, max: 30, field: 'הבנה מוזיקלית' },
    TEXT_KNOWLEDGE: { min: 0, max: 20, field: 'ידע טקסט' },
    PLAYING_BY_HEART: { min: 0, max: 10, field: 'נגינה בעל פה' },
    DIRECTOR_EVALUATION: { min: 0, max: 100, field: 'הערכת מנהל' },
    TOTAL_PERFORMANCE: { min: 0, max: 100, field: 'סה"כ ביצוע' }
  },
  RECITAL: {
    VALID_UNITS: [3, 5],
    VALID_FIELDS: ['קלאסי', 'ג\'אז', 'שירה']
  },
  PRESENTATION: {
    SEQUENCE_REQUIRED: true,
    MIN_COMPLETION_ORDER: [0, 1, 2] // Presentations 1-3 must be completed in order
  }
} as const;

// Core validation functions
export class BagrutValidationMiddleware {
  /**
   * Validate point range for a specific field
   */
  private static validatePointRange(
    points: number | undefined, 
    rule: { min: number; max: number; field: string }
  ): ValidationError | null {
    if (points === undefined || points === null) return null;
    
    if (points < rule.min) {
      return {
        field: rule.field,
        message: `${rule.field} לא יכול להיות פחות מ-${rule.min}`,
        code: 'MIN_VALUE_ERROR'
      };
    }
    
    if (points > rule.max) {
      return {
        field: rule.field,
        message: `${rule.field} לא יכול לעלות על ${rule.max} נקודות`,
        code: 'MAX_VALUE_ERROR'
      };
    }
    
    return null;
  }

  /**
   * Validate detailed grading structure
   */
  static validateDetailedGrading(grading: DetailedGrading): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate individual point ranges
    const playingSkillsError = this.validatePointRange(
      grading.playingSkills?.points, 
      VALIDATION_RULES.POINTS.PLAYING_SKILLS
    );
    if (playingSkillsError) errors.push(playingSkillsError);

    const musicalUnderstandingError = this.validatePointRange(
      grading.musicalUnderstanding?.points, 
      VALIDATION_RULES.POINTS.MUSICAL_UNDERSTANDING
    );
    if (musicalUnderstandingError) errors.push(musicalUnderstandingError);

    const textKnowledgeError = this.validatePointRange(
      grading.textKnowledge?.points, 
      VALIDATION_RULES.POINTS.TEXT_KNOWLEDGE
    );
    if (textKnowledgeError) errors.push(textKnowledgeError);

    const playingByHeartError = this.validatePointRange(
      grading.playingByHeart?.points, 
      VALIDATION_RULES.POINTS.PLAYING_BY_HEART
    );
    if (playingByHeartError) errors.push(playingByHeartError);

    // Validate total points
    const totalPoints = (grading.playingSkills?.points || 0) +
                       (grading.musicalUnderstanding?.points || 0) +
                       (grading.textKnowledge?.points || 0) +
                       (grading.playingByHeart?.points || 0);

    const totalError = this.validatePointRange(
      totalPoints,
      VALIDATION_RULES.POINTS.TOTAL_PERFORMANCE
    );
    if (totalError) errors.push(totalError);

    // Add warnings for incomplete grading
    if (totalPoints === 0) {
      warnings.push({
        field: 'totalPoints',
        message: 'לא הוזנו נקודות ביצוع',
        code: 'INCOMPLETE_GRADING'
      });
    } else if (totalPoints < 50) {
      warnings.push({
        field: 'totalPoints',
        message: 'ציון ביצוע נמוך - יש לבדוק',
        code: 'LOW_PERFORMANCE_SCORE'
      });
    }

    // Check for missing comments on low scores
    if (grading.playingSkills?.points !== undefined && 
        grading.playingSkills.points < 20 && 
        !grading.playingSkills.comments?.trim()) {
      warnings.push({
        field: 'playingSkillsComments',
        message: 'מומלץ להוסיף הערות לציון נמוך בכישורי נגינה',
        code: 'MISSING_LOW_SCORE_COMMENT'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate director evaluation
   */
  static validateDirectorEvaluation(evaluation: DirectorEvaluationUpdateData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate points range
    const pointsError = this.validatePointRange(
      evaluation.points,
      VALIDATION_RULES.POINTS.DIRECTOR_EVALUATION
    );
    if (pointsError) errors.push(pointsError);

    // Check for missing comments on extreme scores
    if (evaluation.points !== undefined) {
      if (evaluation.points < 60 && !evaluation.comments?.trim()) {
        warnings.push({
          field: 'directorComments',
          message: 'מומלץ להוסיף הערות להערכה נמוכה',
          code: 'MISSING_LOW_EVALUATION_COMMENT'
        });
      } else if (evaluation.points === 100 && !evaluation.comments?.trim()) {
        warnings.push({
          field: 'directorComments',
          message: 'מומלץ להוסיף הערות להערכה מושלמת',
          code: 'MISSING_PERFECT_EVALUATION_COMMENT'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate recital configuration
   */
  static validateRecitalConfiguration(config: RecitalConfigurationData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate units
    if (!VALIDATION_RULES.RECITAL.VALID_UNITS.includes(config.recitalUnits)) {
      errors.push({
        field: 'recitalUnits',
        message: `יחידות רסיטל חייבות להיות ${VALIDATION_RULES.RECITAL.VALID_UNITS.join(' או ')}`,
        code: 'INVALID_RECITAL_UNITS'
      });
    }

    // Validate field
    if (!VALIDATION_RULES.RECITAL.VALID_FIELDS.includes(config.recitalField)) {
      errors.push({
        field: 'recitalField',
        message: `תחום רסיטל חייב להיות אחד מ: ${VALIDATION_RULES.RECITAL.VALID_FIELDS.join(', ')}`,
        code: 'INVALID_RECITAL_FIELD'
      });
    }

    // Add informational warnings about combinations
    if (config.recitalUnits === 3 && config.recitalField === 'קלאסי') {
      warnings.push({
        field: 'recitalCombination',
        message: 'שילוב של 3 יחידות קלאסי - נפוץ לתלמידים מתחילים',
        code: 'COMMON_BEGINNER_COMBINATION'
      });
    } else if (config.recitalUnits === 5 && config.recitalField === 'ג\'אז') {
      warnings.push({
        field: 'recitalCombination',
        message: 'שילוב של 5 יחידות ג\'אז - דורש יכולות מתקדמות',
        code: 'ADVANCED_COMBINATION'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate presentation update
   */
  static validatePresentationUpdate(
    index: number, 
    data: PresentationUpdateData, 
    existingPresentations: any[] = []
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate sequential completion for presentations 1-3
    if (index < 3 && VALIDATION_RULES.PRESENTATION.SEQUENCE_REQUIRED) {
      for (let i = 0; i < index; i++) {
        if (!existingPresentations[i]?.completed) {
          errors.push({
            field: `presentationSequence${index}`,
            message: `יש להשלים תחילה מצגת ${i + 1} לפני מצגת ${index + 1}`,
            code: 'SEQUENTIAL_COMPLETION_REQUIRED'
          });
          break;
        }
      }
    }

    // Special validation for performance presentation (index 3)
    if (index === 3) {
      if (data.detailedGrading) {
        const gradingValidation = this.validateDetailedGrading(data.detailedGrading);
        errors.push(...gradingValidation.errors);
        warnings.push(...gradingValidation.warnings);
      } else if (data.completed) {
        warnings.push({
          field: 'performancePresentationGrading',
          message: 'מצגת ביצוע מושלמת ללא ציונים מפורטים',
          code: 'COMPLETED_WITHOUT_DETAILED_GRADING'
        });
      }
    }

    // Validate date if provided
    if (data.date) {
      const presentationDate = new Date(data.date);
      const now = new Date();
      
      if (presentationDate > now) {
        warnings.push({
          field: 'presentationDate',
          message: 'תאריך המצגת בעתיד',
          code: 'FUTURE_PRESENTATION_DATE'
        });
      }
      
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (presentationDate < oneYearAgo) {
        warnings.push({
          field: 'presentationDate',
          message: 'תאריך המצגת ישן מאוד - יש לבדוק',
          code: 'OLD_PRESENTATION_DATE'
        });
      }
    }

    // Validate status transitions
    if (data.completed && !data.status) {
      warnings.push({
        field: 'presentationStatus',
        message: 'מצגת מושלמת ללא סטטוס מפורש',
        code: 'COMPLETED_WITHOUT_STATUS'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate complete Bagrut before final submission
   */
  static validateCompleteBagrut(bagrut: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check program
    if (!bagrut.program || bagrut.program.length === 0) {
      errors.push({
        field: 'program',
        message: 'נדרשת לפחות יצירה אחת בתכנית',
        code: 'MISSING_PROGRAM'
      });
    } else {
      // Validate program pieces
      bagrut.program.forEach((piece: any, index: number) => {
        if (!piece.pieceTitle?.trim()) {
          errors.push({
            field: `programPiece${index}Title`,
            message: `יצירה ${index + 1}: חסר כותרת`,
            code: 'MISSING_PIECE_TITLE'
          });
        }
        
        if (!piece.composer?.trim()) {
          errors.push({
            field: `programPiece${index}Composer`,
            message: `יצירה ${index + 1}: חסר מלחין`,
            code: 'MISSING_COMPOSER'
          });
        }
        
        if (!piece.duration?.trim()) {
          warnings.push({
            field: `programPiece${index}Duration`,
            message: `יצירה ${index + 1}: חסר משך זמן`,
            code: 'MISSING_DURATION'
          });
        }
      });
    }

    // Check presentations 1-3
    for (let i = 0; i < 3; i++) {
      if (!bagrut.presentations?.[i]?.completed) {
        errors.push({
          field: `presentation${i}`,
          message: `מצגת ${i + 1} לא הושלמה`,
          code: 'INCOMPLETE_PRESENTATION'
        });
      }
    }

    // Check performance presentation (index 3)
    const performancePresentation = bagrut.presentations?.[3];
    if (!performancePresentation?.completed) {
      errors.push({
        field: 'performancePresentation',
        message: 'מצגת ביצוע לא הושלמה',
        code: 'INCOMPLETE_PERFORMANCE_PRESENTATION'
      });
    } else if (!performancePresentation.detailedGrading) {
      errors.push({
        field: 'performancePresentationGrading',
        message: 'מצגת ביצוע ללא ציונים מפורטים',
        code: 'MISSING_PERFORMANCE_GRADING'
      });
    } else {
      const gradingValidation = this.validateDetailedGrading(performancePresentation.detailedGrading);
      errors.push(...gradingValidation.errors);
      warnings.push(...gradingValidation.warnings);
    }

    // Check director evaluation
    if (!bagrut.directorEvaluation?.points) {
      errors.push({
        field: 'directorEvaluation',
        message: 'נדרשת הערכת מנהל',
        code: 'MISSING_DIRECTOR_EVALUATION'
      });
    } else {
      const evaluationValidation = this.validateDirectorEvaluation({
        points: bagrut.directorEvaluation.points,
        comments: bagrut.directorEvaluation.comments
      });
      errors.push(...evaluationValidation.errors);
      warnings.push(...evaluationValidation.warnings);
    }

    // Check recital configuration
    if (!bagrut.recitalConfiguration?.units || !bagrut.recitalConfiguration?.field) {
      errors.push({
        field: 'recitalConfiguration',
        message: 'נדרשת הגדרת תצורת רסיטל',
        code: 'MISSING_RECITAL_CONFIG'
      });
    } else {
      const configValidation = this.validateRecitalConfiguration({
        recitalUnits: bagrut.recitalConfiguration.units,
        recitalField: bagrut.recitalConfiguration.field
      });
      errors.push(...configValidation.errors);
      warnings.push(...configValidation.warnings);
    }

    // Check accompaniment if required
    if (bagrut.accompaniment?.type && !bagrut.accompaniment?.accompanists?.length) {
      warnings.push({
        field: 'accompaniment',
        message: 'הוגדר סוג ליווי ללא פרטי מלווים',
        code: 'MISSING_ACCOMPANIST_DETAILS'
      });
    }

    // Check for missing signature if completed
    if (bagrut.isCompleted && !bagrut.teacherSignature?.trim()) {
      errors.push({
        field: 'teacherSignature',
        message: 'נדרשת חתימת מורה לבגרות מושלמת',
        code: 'MISSING_TEACHER_SIGNATURE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Middleware function to intercept and validate updates
   */
  static interceptUpdate(
    updateType: string, 
    data: any, 
    context?: any
  ): ValidationResult {
    switch (updateType) {
      case 'DETAILED_GRADING':
        return this.validateDetailedGrading(data);
        
      case 'DIRECTOR_EVALUATION':
        return this.validateDirectorEvaluation(data);
        
      case 'RECITAL_CONFIGURATION':
        return this.validateRecitalConfiguration(data);
        
      case 'PRESENTATION_UPDATE':
        return this.validatePresentationUpdate(
          data.index, 
          data.presentationData, 
          context?.existingPresentations
        );
        
      case 'COMPLETE_BAGRUT':
        return this.validateCompleteBagrut(data);
        
      default:
        return {
          isValid: true,
          errors: [],
          warnings: []
        };
    }
  }

  /**
   * Get user-friendly error messages in Hebrew
   */
  static getErrorMessages(errors: ValidationError[]): string[] {
    return errors.map(error => error.message);
  }

  /**
   * Get user-friendly warning messages in Hebrew
   */
  static getWarningMessages(warnings: ValidationError[]): string[] {
    return warnings.map(warning => warning.message);
  }

  /**
   * Check if errors are blocking (prevent save) vs non-blocking (show warning)
   */
  static categorizeErrors(errors: ValidationError[]): {
    blocking: ValidationError[];
    nonBlocking: ValidationError[];
  } {
    const blockingCodes = [
      'MIN_VALUE_ERROR',
      'MAX_VALUE_ERROR', 
      'INVALID_RECITAL_UNITS',
      'INVALID_RECITAL_FIELD',
      'SEQUENTIAL_COMPLETION_REQUIRED',
      'MISSING_PROGRAM',
      'INCOMPLETE_PRESENTATION',
      'MISSING_DIRECTOR_EVALUATION',
      'MISSING_RECITAL_CONFIG',
      'MISSING_TEACHER_SIGNATURE'
    ];

    return {
      blocking: errors.filter(error => blockingCodes.includes(error.code)),
      nonBlocking: errors.filter(error => !blockingCodes.includes(error.code))
    };
  }
}