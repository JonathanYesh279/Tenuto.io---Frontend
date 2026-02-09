/**
 * Presentation Index Mapping Utilities
 * 
 * This module handles the critical mapping between frontend display indices
 * and backend storage indices for presentations and מגן בגרות.
 * 
 * Backend Schema:
 * - presentations[0-2]: Regular השמעות (השמעה 1, 2, 3)
 * - magenBagrut: Separate field for מגן בגרות (not in presentations array)
 * 
 * Frontend Display:
 * - Display indices 1-4 for user interface
 * - Index 4 represents מגן בגרות
 */

import type { PresentationDisplay, Bagrut } from '../types/bagrut.types';

/**
 * Convert backend bagrut data to display presentations array (ONLY regular presentations)
 */
export const createDisplayPresentations = (bagrut: Bagrut): PresentationDisplay[] => {
  // Regular presentations from backend array (indices 0-2) - EXCLUDING מגן בגרות
  // Backend should only have 3 presentations max (indices 0, 1, 2)
  const presentationsToProcess = bagrut.presentations?.slice(0, 3) || [];
  
  const regularPresentations = presentationsToProcess.map((presentation, index) => ({
    presentationNumber: index + 1,
    title: `השמעה ${index + 1}`,
    date: presentation.date,
    status: presentation.completed ? 'עבר/ה' as const : 'לא נבחן' as const,
    completed: presentation.completed || false,
    grade: presentation.grade,
    gradeLevel: presentation.gradeLevel,
    recordingLinks: presentation.recordingLinks || [],
    notes: presentation.notes || '',
    reviewedBy: presentation.reviewedBy,
    detailedGrading: presentation.detailedGrading,
    type: 'regular' as const,
    backendIndex: index // Store actual backend index (0-2)
  }));

  // Return ONLY regular presentations (max 3) - מגן בגרות is handled separately in its own tab
  return regularPresentations;
};

/**
 * Determine if presentation is מגן בגרות based on display index or type
 */
export const isMagenBagrut = (presentation: PresentationDisplay): boolean => {
  return presentation.type === 'magen' || presentation.presentationNumber === 4 || presentation.backendIndex === -1;
};

/**
 * Get the correct backend index for API calls
 * Returns the actual array index for regular presentations (0-2)
 * Returns -1 for מגן בגרות (indicates separate endpoint)
 */
export const getBackendIndex = (presentation: PresentationDisplay): number => {
  if (isMagenBagrut(presentation)) {
    return -1; // Special marker for מגן בגרות
  }
  
  return presentation.backendIndex ?? (presentation.presentationNumber - 1);
};

/**
 * Validate backend index for regular presentations
 */
export const isValidPresentationIndex = (index: number): boolean => {
  return index >= 0 && index <= 2;
};

/**
 * Convert presentation data for מגן בגרות API format
 */
export const convertToMagenBagrutData = (presentation: PresentationDisplay) => {
  return {
    completed: presentation.completed,
    status: presentation.status,
    date: presentation.date,
    review: presentation.notes,
    reviewedBy: presentation.reviewedBy,
    grade: presentation.grade,
    gradeLevel: presentation.gradeLevel,
    recordingLinks: presentation.recordingLinks || []
  };
};

/**
 * Calculate total completed presentations including מגן בגרות
 */
export const calculateCompletedPresentations = (bagrut: Bagrut): { regular: number, magen: number, total: number } => {
  const regularCompleted = bagrut.presentations?.filter(p => p.completed).length || 0;
  const magenCompleted = bagrut.magenBagrut?.completed ? 1 : 0;
  
  return {
    regular: regularCompleted,
    magen: magenCompleted,
    total: regularCompleted + magenCompleted
  };
};

/**
 * Presentation mapping constants
 */
export const PRESENTATION_CONSTANTS = {
  MAX_REGULAR_PRESENTATIONS: 3,
  TOTAL_PRESENTATIONS_WITH_MAGEN: 4, // 3 regular + 1 magen
  MAGEN_DISPLAY_INDEX: 4, // Display index for UI (not used in backend)
  MAGEN_BACKEND_MARKER: -1 // Special marker for API calls
} as const;