/**
 * Presentation Service
 * Handles conversion and management of Bagrut presentations (השמעות)
 * Maps backend presentations array to display format
 */

import type { Presentation, PresentationDisplay, DetailedGrading, Bagrut } from '../types/bagrut.types';
import { getGradeLevelFromScore } from '../types/bagrut.types';

// Re-export the function for convenience
export { getGradeLevelFromScore };

/**
 * Convert backend presentations array to display format
 * Backend has 4 presentations: indexes 0-3
 * Index 3 is the מגן בגרות (final presentation with detailed grading)
 */
export const convertPresentationsToDisplay = (presentations: Presentation[] = []): PresentationDisplay[] => {
  const displayPresentations: PresentationDisplay[] = [];
  
  // Process up to 4 presentations
  for (let i = 0; i < 4; i++) {
    const presentation = presentations[i] || {};
    const isMagen = i === 3; // 4th presentation is מגן בגרות
    
    displayPresentations.push({
      presentationNumber: i + 1,
      title: isMagen ? 'מגן בגרות' : `השמעה ${i + 1}`,
      date: presentation.date ? new Date(presentation.date) : undefined,
      status: presentation.status,
      completed: presentation.completed || false,
      grade: presentation.grade,
      gradeLevel: presentation.gradeLevel || (presentation.grade ? getGradeLevelFromScore(presentation.grade) : undefined),
      notes: presentation.notes,
      reviewedBy: presentation.reviewedBy,
      recordingLinks: presentation.recordingLinks || [],
      detailedGrading: isMagen ? presentation.detailedGrading : undefined,
      type: isMagen ? 'magen' : 'regular'
    });
  }
  
  return displayPresentations;
};

/**
 * Calculate total score from detailed grading
 */
export const calculateDetailedGradingTotal = (detailedGrading?: DetailedGrading): number => {
  if (!detailedGrading) return 0;
  
  const playingSkills = detailedGrading.playingSkills?.points || 0;
  const musicalUnderstanding = detailedGrading.musicalUnderstanding?.points || 0;
  const textKnowledge = detailedGrading.textKnowledge?.points || 0;
  const playingByHeart = detailedGrading.playingByHeart?.points || 0;
  
  return playingSkills + musicalUnderstanding + textKnowledge + playingByHeart;
};

/**
 * Get presentation status color for UI
 */
export const getPresentationStatusColor = (status?: string, completed?: boolean): string => {
  if (completed || status === 'עבר/ה') return 'text-green-600 bg-green-50';
  if (status === 'לא עבר/ה') return 'text-red-600 bg-red-50';
  if (status === 'לא נבחן') return 'text-gray-600 bg-gray-50';
  return 'text-orange-600 bg-orange-50';
};

/**
 * Get presentation status icon
 */
export const getPresentationStatusIcon = (status?: string, completed?: boolean): string => {
  if (completed || status === 'עבר/ה') return 'CheckCircle';
  if (status === 'לא עבר/ה') return 'XCircle';
  if (status === 'לא נבחן') return 'AlertCircle';
  return 'Clock';
};

/**
 * Format presentation for API update
 */
export const formatPresentationForUpdate = (presentation: PresentationDisplay): Presentation => {
  return {
    completed: presentation.completed,
    status: presentation.status,
    date: presentation.date,
    review: presentation.notes, // Map notes to review for backward compatibility
    reviewedBy: presentation.reviewedBy,
    notes: presentation.notes,
    recordingLinks: presentation.recordingLinks,
    grade: presentation.grade,
    gradeLevel: presentation.gradeLevel,
    detailedGrading: presentation.detailedGrading
  };
};

/**
 * Count completed presentations
 */
export const countCompletedPresentations = (presentations: Presentation[]): number => {
  return presentations.filter(p => p.completed || p.status === 'עבר/ה').length;
};

/**
 * Check if all regular presentations are completed (not including מגן)
 */
export const areRegularPresentationsComplete = (presentations: Presentation[]): boolean => {
  // Check first 3 presentations only
  for (let i = 0; i < 3 && i < presentations.length; i++) {
    if (!presentations[i].completed && presentations[i].status !== 'עבר/ה') {
      return false;
    }
  }
  return true;
};

/**
 * Check if מגן בגרות is completed
 */
export const isMagenBagrutComplete = (presentations: Presentation[]): boolean => {
  if (presentations.length < 4) return false;
  const magen = presentations[3];
  return magen?.completed || magen?.status === 'עבר/ה' || false;
};

/**
 * Calculate presentations average grade
 */
export const calculatePresentationsAverage = (presentations: Presentation[]): number | null => {
  const grades = presentations
    .filter(p => p.grade !== undefined && p.grade !== null)
    .map(p => p.grade as number);
  
  if (grades.length === 0) return null;
  
  const sum = grades.reduce((acc, grade) => acc + grade, 0);
  return Math.round(sum / grades.length);
};

/**
 * Get presentation pieces from program
 */
export const getPresentationPieces = (
  presentationNumber: number, 
  program: any[]
): string[] => {
  // Map presentation number to program pieces
  // This is a simplified mapping - adjust based on actual requirements
  switch (presentationNumber) {
    case 1: // השמעה 1 - first 2 pieces
      return program.slice(0, 2).map(p => p.pieceTitle || p.pieceName || '');
    case 2: // השמעה 2 - next 2 pieces
      return program.slice(2, 4).map(p => p.pieceTitle || p.pieceName || '');
    case 3: // השמעה 3 - remaining pieces
      return program.slice(4).map(p => p.pieceTitle || p.pieceName || '');
    case 4: // מגן בגרות - all pieces
      return program.map(p => p.pieceTitle || p.pieceName || '');
    default:
      return [];
  }
};

/**
 * Initialize empty presentations array
 */
export const initializeEmptyPresentations = (): Presentation[] => {
  return Array(4).fill(null).map((_, index) => ({
    completed: false,
    status: 'לא נבחן' as const,
    date: undefined,
    review: '',
    reviewedBy: '',
    notes: '',
    recordingLinks: [],
    grade: undefined,
    gradeLevel: undefined,
    detailedGrading: index === 3 ? {
      playingSkills: { grade: '', points: 0, maxPoints: 40, comments: '' },
      musicalUnderstanding: { grade: '', points: 0, maxPoints: 30, comments: '' },
      textKnowledge: { grade: '', points: 0, maxPoints: 20, comments: '' },
      playingByHeart: { grade: '', points: 0, maxPoints: 10, comments: '' }
    } : undefined
  }));
};