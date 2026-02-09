/**
 * Bagrut Utilities
 * Helper functions for processing Bagrut data, grade calculations, and validation
 */

/**
 * Grade calculation constants
 */
export const BAGRUT_CONSTANTS = {
  PRESENTATION_WEIGHTS: {
    1: 0.25, // 25% for presentation 1
    2: 0.25, // 25% for presentation 2  
    3: 0.25, // 25% for presentation 3
    4: 0.25  // 25% for Magen Bagrut (presentation 4)
  },
  
  GRADE_THRESHOLDS: {
    EXCELLENT: 90,
    VERY_GOOD: 80,
    GOOD: 70,
    SATISFACTORY: 60,
    FAIL: 60
  },
  
  MAGEN_BAGRUT_BONUS: 5, // Additional points for Magen Bagrut completion
  
  MIN_PRESENTATIONS_REQUIRED: 3,
  MAX_SCORE: 100,
  MIN_SCORE: 0
};

/**
 * Hebrew grade labels
 */
export const HEBREW_GRADES = {
  A: 'מצוין',
  B: 'טוב מאוד', 
  C: 'טוב',
  D: 'מספיק',
  F: 'נכשל'
};

/**
 * Bagrut status labels in Hebrew
 */
export const BAGRUT_STATUS_LABELS = {
  not_enrolled: 'לא רשום',
  enrolled: 'רשום',
  in_progress: 'בתהליך',
  scheduled: 'מתוכנן',
  examined: 'נבחן',
  completed: 'הושלם',
  failed: 'נכשל'
};

/**
 * Calculate final Bagrut grade from all presentations
 * @param {Array} presentations - Array of presentations with grades
 * @param {Object} options - Calculation options
 * @returns {Object} Calculated grade information
 */
export function calculateFinalBagrutGrade(presentations = [], options = {}) {
  try {
    const validPresentations = presentations.filter(p => 
      p && p.isCompleted && p.grading && p.grading.totalScore > 0
    );

    if (validPresentations.length === 0) {
      return {
        finalGrade: null,
        letterGrade: null,
        hebrewGrade: null,
        isComplete: false,
        presentationsUsed: 0,
        breakdown: [],
        status: 'incomplete'
      };
    }

    // Calculate weighted average
    let totalWeightedScore = 0;
    let totalWeight = 0;
    const breakdown = [];

    validPresentations.forEach((presentation, index) => {
      const weight = BAGRUT_CONSTANTS.PRESENTATION_WEIGHTS[index + 1] || 0.25;
      const score = presentation.grading.totalScore;
      const weightedScore = score * weight;
      
      totalWeightedScore += weightedScore;
      totalWeight += weight;
      
      breakdown.push({
        presentationNumber: index + 1,
        score,
        weight,
        weightedScore,
        type: presentation.type || 'regular'
      });
    });

    // Apply Magen Bagrut bonus if applicable
    const hasMagenBagrut = validPresentations.some(p => p.type === 'magen' && p.isCompleted);
    let bonus = 0;
    if (hasMagenBagrut && options.includeMagenBonus) {
      bonus = BAGRUT_CONSTANTS.MAGEN_BAGRUT_BONUS;
    }

    // Calculate final grade
    const rawGrade = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
    const finalGrade = Math.min(Math.max(rawGrade + bonus, BAGRUT_CONSTANTS.MIN_SCORE), BAGRUT_CONSTANTS.MAX_SCORE);
    
    const letterGrade = calculateLetterGrade(finalGrade);
    const hebrewGrade = HEBREW_GRADES[letterGrade] || '';
    
    return {
      finalGrade: Math.round(finalGrade * 100) / 100, // Round to 2 decimal places
      letterGrade,
      hebrewGrade,
      isComplete: validPresentations.length >= BAGRUT_CONSTANTS.MIN_PRESENTATIONS_REQUIRED,
      presentationsUsed: validPresentations.length,
      breakdown,
      bonus,
      hasMagenBagrut,
      status: determineOverallStatus(validPresentations, finalGrade)
    };
    
  } catch (error) {
    console.error('Error calculating final Bagrut grade:', error);
    return {
      finalGrade: null,
      letterGrade: null,
      hebrewGrade: null,
      isComplete: false,
      presentationsUsed: 0,
      breakdown: [],
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Calculate letter grade from numeric score
 * @param {number} score - Numeric score (0-100)
 * @returns {string} Letter grade (A-F)
 */
export function calculateLetterGrade(score) {
  if (score >= BAGRUT_CONSTANTS.GRADE_THRESHOLDS.EXCELLENT) return 'A';
  if (score >= BAGRUT_CONSTANTS.GRADE_THRESHOLDS.VERY_GOOD) return 'B';
  if (score >= BAGRUT_CONSTANTS.GRADE_THRESHOLDS.GOOD) return 'C';
  if (score >= BAGRUT_CONSTANTS.GRADE_THRESHOLDS.SATISFACTORY) return 'D';
  return 'F';
}

/**
 * Determine overall Bagrut status
 * @param {Array} presentations - Valid presentations
 * @param {number} finalGrade - Calculated final grade
 * @returns {string} Overall status
 */
export function determineOverallStatus(presentations, finalGrade) {
  if (presentations.length === 0) return 'not_enrolled';
  
  const completedCount = presentations.filter(p => p.isCompleted).length;
  
  if (completedCount >= BAGRUT_CONSTANTS.MIN_PRESENTATIONS_REQUIRED) {
    if (finalGrade >= BAGRUT_CONSTANTS.GRADE_THRESHOLDS.SATISFACTORY) {
      return 'completed';
    } else {
      return 'failed';
    }
  }
  
  if (completedCount > 0) {
    return 'in_progress';
  }
  
  return 'enrolled';
}

/**
 * Validate presentation data
 * @param {Object} presentation - Presentation data
 * @returns {Object} Validation result
 */
export function validatePresentation(presentation) {
  const errors = [];
  const warnings = [];
  
  if (!presentation) {
    errors.push('Presentation data is missing');
    return { isValid: false, errors, warnings };
  }
  
  // Check required fields
  if (!presentation.pieces || presentation.pieces.length === 0) {
    errors.push('No pieces defined for presentation');
  }
  
  if (presentation.grading) {
    // Validate grading data
    if (presentation.grading.totalScore < 0 || presentation.grading.totalScore > 100) {
      errors.push('Total score must be between 0 and 100');
    }
    
    // Check for incomplete grading sections
    const gradingSections = ['technique', 'musicality', 'interpretation', 'overall'];
    gradingSections.forEach(section => {
      if (presentation.grading[section] === undefined || presentation.grading[section] === null) {
        warnings.push(`Missing grade for ${section}`);
      }
    });
  }
  
  // Check exam date
  if (presentation.examDate) {
    const examDate = new Date(presentation.examDate);
    const now = new Date();
    
    if (examDate > now && presentation.isCompleted) {
      warnings.push('Presentation marked as completed but exam date is in the future');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate complete Bagrut record
 * @param {Object} bagrut - Complete bagrut data
 * @returns {Object} Validation result
 */
export function validateBagrut(bagrut) {
  const errors = [];
  const warnings = [];
  
  if (!bagrut) {
    errors.push('Bagrut data is missing');
    return { isValid: false, errors, warnings };
  }
  
  // Check student ID
  if (!bagrut.studentId) {
    errors.push('Student ID is required');
  }
  
  // Check presentations
  if (!bagrut.presentations || bagrut.presentations.length === 0) {
    errors.push('No presentations found');
  } else {
    // Validate each presentation
    bagrut.presentations.forEach((presentation, index) => {
      if (presentation) {
        const validation = validatePresentation(presentation);
        if (!validation.isValid) {
          errors.push(`Presentation ${index + 1}: ${validation.errors.join(', ')}`);
        }
        if (validation.warnings.length > 0) {
          warnings.push(`Presentation ${index + 1}: ${validation.warnings.join(', ')}`);
        }
      }
    });
  }
  
  // Check for conflicts in normalized data
  if (bagrut.presentations) {
    const magenPresentation = bagrut.presentations[3];
    if (magenPresentation && magenPresentation.conflicts && magenPresentation.conflicts.length > 0) {
      warnings.push(`Magen Bagrut has ${magenPresentation.conflicts.length} data conflicts`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate progress report for Bagrut
 * @param {Object} bagrut - Bagrut data
 * @returns {Object} Progress report
 */
export function generateProgressReport(bagrut) {
  try {
    const presentations = bagrut.presentations || [];
    const completedPresentations = presentations.filter(p => p && p.isCompleted);
    const pendingPresentations = presentations.filter(p => p && !p.isCompleted);
    
    const gradeCalculation = calculateFinalBagrutGrade(presentations, { includeMagenBonus: true });
    
    return {
      overview: {
        totalPresentations: presentations.length,
        completedCount: completedPresentations.length,
        pendingCount: pendingPresentations.length,
        completionRate: presentations.length > 0 ? (completedPresentations.length / presentations.length) * 100 : 0
      },
      
      grading: gradeCalculation,
      
      timeline: {
        nextExamDate: getNextExamDate(pendingPresentations),
        lastCompletedDate: getLastCompletedDate(completedPresentations),
        estimatedCompletionDate: estimateCompletionDate(pendingPresentations)
      },
      
      requirements: {
        minPresentationsRequired: BAGRUT_CONSTANTS.MIN_PRESENTATIONS_REQUIRED,
        minPresentationsMet: completedPresentations.length >= BAGRUT_CONSTANTS.MIN_PRESENTATIONS_REQUIRED,
        eligibleForCertificate: gradeCalculation.isComplete && 
                                gradeCalculation.finalGrade >= BAGRUT_CONSTANTS.GRADE_THRESHOLDS.SATISFACTORY
      },
      
      recommendations: generateRecommendations(bagrut, gradeCalculation)
    };
    
  } catch (error) {
    console.error('Error generating progress report:', error);
    return {
      overview: { error: error.message },
      grading: { error: error.message },
      timeline: { error: error.message },
      requirements: { error: error.message },
      recommendations: []
    };
  }
}

/**
 * Get next exam date from pending presentations
 * @param {Array} pendingPresentations - Presentations not yet completed
 * @returns {string|null} Next exam date
 */
function getNextExamDate(pendingPresentations) {
  const upcomingExams = pendingPresentations
    .filter(p => p.examDate)
    .map(p => new Date(p.examDate))
    .filter(date => date > new Date())
    .sort((a, b) => a - b);
    
  return upcomingExams.length > 0 ? upcomingExams[0].toISOString() : null;
}

/**
 * Get last completed presentation date
 * @param {Array} completedPresentations - Completed presentations
 * @returns {string|null} Last completed date
 */
function getLastCompletedDate(completedPresentations) {
  const completedDates = completedPresentations
    .filter(p => p.examDate)
    .map(p => new Date(p.examDate))
    .sort((a, b) => b - a);
    
  return completedDates.length > 0 ? completedDates[0].toISOString() : null;
}

/**
 * Estimate completion date based on pending presentations
 * @param {Array} pendingPresentations - Pending presentations
 * @returns {string|null} Estimated completion date
 */
function estimateCompletionDate(pendingPresentations) {
  if (pendingPresentations.length === 0) return null;
  
  const scheduledExams = pendingPresentations
    .filter(p => p.examDate)
    .map(p => new Date(p.examDate))
    .sort((a, b) => b - a);
    
  if (scheduledExams.length > 0) {
    return scheduledExams[0].toISOString();
  }
  
  // If no scheduled exams, estimate 3 months from now per presentation
  const now = new Date();
  const estimatedDate = new Date(now);
  estimatedDate.setMonth(now.getMonth() + (pendingPresentations.length * 3));
  
  return estimatedDate.toISOString();
}

/**
 * Generate personalized recommendations
 * @param {Object} bagrut - Bagrut data
 * @param {Object} gradeCalculation - Grade calculation result
 * @returns {Array} Array of recommendations
 */
function generateRecommendations(bagrut, gradeCalculation) {
  const recommendations = [];
  
  // Check completion status
  if (gradeCalculation.presentationsUsed < BAGRUT_CONSTANTS.MIN_PRESENTATIONS_REQUIRED) {
    recommendations.push({
      type: 'urgent',
      category: 'completion',
      message: `נדרשות עוד ${BAGRUT_CONSTANTS.MIN_PRESENTATIONS_REQUIRED - gradeCalculation.presentationsUsed} הצגות להשלמת הבגרות`,
      action: 'תכנן הצגות נוספות'
    });
  }
  
  // Check grade level
  if (gradeCalculation.finalGrade && gradeCalculation.finalGrade < BAGRUT_CONSTANTS.GRADE_THRESHOLDS.GOOD) {
    recommendations.push({
      type: 'improvement',
      category: 'grades',
      message: 'יש מקום לשיפור בציונים',
      action: 'התמקד בטכניקה ובפרשנות'
    });
  }
  
  // Check for Magen Bagrut
  if (!gradeCalculation.hasMagenBagrut && gradeCalculation.presentationsUsed >= 2) {
    recommendations.push({
      type: 'opportunity',
      category: 'magen',
      message: 'שקול הרשמה למגן בגרות לשיפור הציון',
      action: 'התייעץ עם המורה לגבי מגן בגרות'
    });
  }
  
  // Check for missing documentation
  const totalDocuments = bagrut.documents ? bagrut.documents.length : 0;
  if (totalDocuments < 3) {
    recommendations.push({
      type: 'administrative',
      category: 'documents',
      message: 'חסרים מסמכים נדרשים',
      action: 'העלה תעודות והקלטות נוספות'
    });
  }
  
  return recommendations;
}

/**
 * Format grade for display
 * @param {number} grade - Numeric grade
 * @param {Object} options - Formatting options
 * @returns {string} Formatted grade string
 */
export function formatGradeForDisplay(grade, options = {}) {
  if (grade === null || grade === undefined) {
    return options.showPlaceholder ? 'לא ידוע' : '';
  }
  
  const formattedNumber = Math.round(grade * 100) / 100;
  
  if (options.includeLetterGrade) {
    const letterGrade = calculateLetterGrade(grade);
    const hebrewGrade = HEBREW_GRADES[letterGrade] || '';
    return `${formattedNumber} (${hebrewGrade})`;
  }
  
  return formattedNumber.toString();
}

/**
 * Get status display info
 * @param {string} status - Status code
 * @returns {Object} Display information
 */
export function getStatusDisplayInfo(status) {
  const label = BAGRUT_STATUS_LABELS[status] || status;
  
  const colorMap = {
    completed: 'green',
    in_progress: 'blue', 
    scheduled: 'yellow',
    enrolled: 'gray',
    failed: 'red',
    not_enrolled: 'gray'
  };
  
  return {
    label,
    color: colorMap[status] || 'gray',
    isActive: ['completed', 'in_progress', 'scheduled'].includes(status)
  };
}

/**
 * Export all utility functions as default
 */
export default {
  calculateFinalBagrutGrade,
  calculateLetterGrade,
  determineOverallStatus,
  validatePresentation,
  validateBagrut,
  generateProgressReport,
  formatGradeForDisplay,
  getStatusDisplayInfo,
  BAGRUT_CONSTANTS,
  HEBREW_GRADES,
  BAGRUT_STATUS_LABELS
};