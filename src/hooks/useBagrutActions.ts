/**
 * Enhanced Bagrut Actions Hook
 * Provides action creators that integrate with the BagrutContext and API service
 */

import { useCallback } from 'react';
import { useBagrutContext } from '../contexts/BagrutContext';
import { bagrutService } from '../services/bagrutService.js';
import type {
  BagrutFormData,
  BagrutQueryParams,
  PresentationUpdateData,
  DirectorEvaluationUpdateData,
  RecitalConfigurationData,
  ProgramPiece,
  Accompanist,
  DetailedGrading
} from '../types/bagrut.types';

export function useBagrutActions() {
  const { state, actions } = useBagrutContext();

  // Enhanced fetch operations with context integration
  const fetchAllBagruts = useCallback(async (params?: BagrutQueryParams) => {
    actions.setLoading(true);
    actions.clearValidationErrors();
    
    try {
      console.log('🔍 Fetching bagruts with params:', params);
      const bagruts = await bagrutService.getAllBagruts(params || {});
      console.log('📋 Raw bagruts from service:', bagruts);
      
      const bagrutArray = Array.isArray(bagruts) ? bagruts : [];
      console.log('✅ Setting bagruts in context:', bagrutArray.length, 'items');
      
      actions.setBagruts(bagrutArray);
      
      // Verify the state after setting
      setTimeout(() => {
        console.log('🔍 Context state after setBagruts:', state.bagruts?.length || 0);
      }, 100);
    } catch (error) {
      console.error('❌ Error fetching bagruts:', error);
      const message = error instanceof Error ? error.message : 'שגיאה בטעינת בגרויות';
      actions.setError(message);
    } finally {
      actions.setLoading(false);
    }
  }, [actions, state.bagruts]);

  const fetchBagrutById = useCallback(async (id: string) => {
    actions.setLoading(true);
    actions.clearValidationErrors();
    
    try {
      console.log('🔍 fetchBagrutById: Fetching bagrut with ID:', id);
      const bagrut = await bagrutService.getBagrutById(id);
      console.log('✅ fetchBagrutById: Bagrut fetched successfully:', bagrut);
      
      actions.setCurrentBagrut(bagrut);
      console.log('✅ fetchBagrutById: CurrentBagrut set in context');
      
      // Temporarily disable grade recalculation to fix the loading issue
      // TODO: Fix CALCULATE_COMPUTED_VALUES reducer logic
      // if (bagrut?._id) {
      //   actions.recalculateGrade(bagrut._id);
      // }
    } catch (error) {
      console.error('❌ fetchBagrutById: Error:', error);
      const message = error instanceof Error ? error.message : 'שגיאה בטעינת בגרות';
      actions.setError(message);
    } finally {
      actions.setLoading(false);
    }
  }, [actions]);

  const fetchBagrutByStudentId = useCallback(async (studentId: string) => {
    actions.setLoading(true);
    actions.clearValidationErrors();
    
    try {
      const bagrut = await bagrutService.getBagrutByStudentId(studentId);
      actions.setCurrentBagrut(bagrut);
      if (bagrut?._id) {
        actions.recalculateGrade(bagrut._id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה בטעינת בגרות התלמיד';
      actions.setError(message);
    } finally {
      actions.setLoading(false);
    }
  }, [actions]);

  // Enhanced create operation
  const createBagrut = useCallback(async (data: BagrutFormData) => {
    actions.setLoading(true);
    actions.clearValidationErrors();
    
    try {
      console.log('🚀 Creating bagrut with data:', data);
      const bagrut = await bagrutService.createBagrut(data);
      
      console.log('✅ Bagrut created successfully:', bagrut);
      
      if (bagrut && (bagrut._id || bagrut.id)) {
        actions.setCurrentBagrut(bagrut);
        // Refresh the list to show the new bagrut
        await fetchAllBagruts();
        console.log('✅ Context updated with new bagrut');
        return bagrut;
      } else {
        console.error('❌ Invalid bagrut object returned:', bagrut);
        actions.setError('בגרות נוצרה אך לא ניתן היה לטעון אותה');
        return null;
      }
    } catch (error) {
      console.error('❌ Error in createBagrut:', error);
      const message = error instanceof Error ? error.message : 'שגיאה ביצירת בגרות';
      actions.setError(message);
      return null;
    } finally {
      actions.setLoading(false);
    }
  }, [actions, fetchAllBagruts]);

  // Enhanced update operation
  const updateBagrut = useCallback(async (id: string, updateData: any) => {
    actions.setLoading(true);
    actions.clearValidationErrors();

    try {
      const updatedBagrut = await bagrutService.updateBagrut(id, updateData);
      if (updatedBagrut) {
        actions.setCurrentBagrut(updatedBagrut);
        actions.recalculateGrade(id);
        return updatedBagrut;
      }
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון בגרות';
      actions.setError(message);
      return null;
    } finally {
      actions.setLoading(false);
    }
  }, [actions]);

  // Delete bagrut operation
  const deleteBagrut = useCallback(async (id: string): Promise<boolean> => {
    actions.setLoading(true);
    actions.clearValidationErrors();

    try {
      await bagrutService.deleteBagrut(id);

      // Remove from context state
      const updatedBagruts = state.bagruts.filter(b => b._id !== id);
      actions.setBagruts(updatedBagruts);

      // Clear current bagrut if it was the deleted one
      if (state.currentBagrut?._id === id) {
        actions.setCurrentBagrut(null);
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה במחיקת בגרות';
      actions.setError(message);
      return false;
    } finally {
      actions.setLoading(false);
    }
  }, [actions, state.bagruts, state.currentBagrut]);

  // Enhanced presentation update with validation
  const updatePresentation = useCallback(async (
    bagrutId: string, 
    index: number, 
    data: PresentationUpdateData
  ) => {
    // Validate sequential presentation completion for presentations 1-3
    if (index < 3 && state.currentBagrut) {
      const isValidSequence = actions.validateSequentialPresentation(
        index, 
        state.currentBagrut.presentations || []
      );
      if (!isValidSequence) return false;
    }

    // Special validation for presentation 4 (performance presentation)
    if (index === 3 && data.detailedGrading) {
      const isValidTotal = actions.validatePointTotal(data.detailedGrading);
      if (!isValidTotal) return false;
    }

    actions.setLoading(true);
    
    try {
      const updatedBagrut = await bagrutService.updatePresentation(bagrutId, index, data);
      if (updatedBagrut) {
        actions.updatePresentation(bagrutId, index, data);
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון מצגת';
      actions.setError(message);
      return false;
    } finally {
      actions.setLoading(false);
    }
  }, [actions, state.currentBagrut]);

  // Enhanced director evaluation with validation
  const updateDirectorEvaluation = useCallback(async (
    bagrutId: string, 
    evaluationData: DirectorEvaluationUpdateData
  ) => {
    // Validate points before API call
    if (evaluationData.points < 0 || evaluationData.points > 100) {
      actions.setValidationError('directorEvaluation', 'הערכת מנהל חייבת להיות בין 0 ל-100');
      return false;
    }

    actions.setLoading(true);
    
    try {
      const updatedBagrut = await bagrutService.updateDirectorEvaluation(bagrutId, evaluationData);
      if (updatedBagrut) {
        actions.updateDirectorEvaluation(bagrutId, {
          points: evaluationData.points,
          percentage: (evaluationData.points / 100) * 100,
          comments: evaluationData.comments
        });
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון הערכת מנהל';
      actions.setError(message);
      return false;
    } finally {
      actions.setLoading(false);
    }
  }, [actions]);

  // Enhanced recital configuration with validation
  const setRecitalConfiguration = useCallback(async (
    bagrutId: string, 
    configData: RecitalConfigurationData
  ) => {
    // Validate configuration before API call
    if (configData.recitalUnits !== 3 && configData.recitalUnits !== 5) {
      actions.setValidationError('recitalUnits', 'יחידות רסיטל חייבות להיות 3 או 5');
      return false;
    }

    const validFields = ['קלאסי', 'ג\'אז', 'שירה'];
    if (!validFields.includes(configData.recitalField)) {
      actions.setValidationError('recitalField', 'תחום רסיטל לא חוקי');
      return false;
    }

    actions.setLoading(true);
    
    try {
      const updatedBagrut = await bagrutService.setRecitalConfiguration(bagrutId, configData);
      if (updatedBagrut) {
        actions.updateRecitalConfig(bagrutId, configData);
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה בהגדרת תצורת רסיטל';
      actions.setError(message);
      return false;
    } finally {
      actions.setLoading(false);
    }
  }, [actions]);

  // Enhanced grade calculation with 90/10 formula
  const calculateFinalGrade = useCallback(async (bagrutId: string) => {
    actions.setLoading(true);
    
    try {
      // First calculate locally to validate
      actions.recalculateGrade(bagrutId);
      
      // Then sync with backend
      const updatedBagrut = await bagrutService.calculateFinalGrade(bagrutId);
      if (updatedBagrut) {
        actions.setCurrentBagrut(updatedBagrut);
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה בחישוב ציון סופי';
      actions.setError(message);
      return false;
    } finally {
      actions.setLoading(false);
    }
  }, [actions]);

  // Program management with validation
  const addProgramPiece = useCallback(async (
    bagrutId: string, 
    piece: Omit<ProgramPiece, '_id'>
  ) => {
    // Validate required fields
    if (!piece.pieceTitle?.trim() || !piece.composer?.trim() || !piece.duration?.trim()) {
      actions.setValidationError('programPiece', 'נדרשים כותרת יצירה, מלחין ומשך זמן');
      return false;
    }

    actions.setLoading(true);
    
    try {
      const success = await bagrutService.addProgramPiece(bagrutId, piece);
      if (success) {
        // Refresh current bagrut to get updated program
        await fetchBagrutById(bagrutId);
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה בהוספת יצירה';
      actions.setError(message);
      return false;
    } finally {
      actions.setLoading(false);
    }
  }, [actions, fetchBagrutById]);

  // Validation utilities
  const validateBagrutCompletion = useCallback((bagrutId: string) => {
    const bagrut = state.bagruts.find(b => b._id === bagrutId) || state.currentBagrut;
    if (!bagrut) return false;

    const errors: string[] = [];

    // Check program
    if (!bagrut.program?.length) {
      errors.push('נדרשת לפחות יצירה אחת בתכנית');
    }

    // Check presentations 1-3
    for (let i = 0; i < 3; i++) {
      if (!bagrut.presentations?.[i]?.completed) {
        errors.push(`מצגת ${i + 1} לא הושלמה`);
      }
    }

    // Check performance presentation (index 3)
    if (!bagrut.presentations?.[3]?.detailedGrading) {
      errors.push('מצגת ביצוע לא הושלמה');
    } else {
      const grading = bagrut.presentations[3].detailedGrading;
      const totalPoints = (grading.playingSkills?.points || 0) +
                         (grading.musicalUnderstanding?.points || 0) +
                         (grading.textKnowledge?.points || 0) +
                         (grading.playingByHeart?.points || 0);
      
      if (totalPoints === 0) {
        errors.push('נדרש ציון ביצוע');
      }
    }

    // Check director evaluation
    if (!bagrut.directorEvaluation?.points) {
      errors.push('נדרשת הערכת מנהל');
    }

    // Check recital configuration
    if (!bagrut.recitalConfiguration?.units || !bagrut.recitalConfiguration?.field) {
      errors.push('נדרשת הגדרת תצורת רסיטל');
    }

    if (errors.length > 0) {
      actions.setValidationError('completion', errors.join(', '));
      return false;
    }

    actions.clearValidationErrors();
    return true;
  }, [state.bagruts, state.currentBagrut, actions]);

  // Export validation results
  const getValidationSummary = useCallback((bagrutId: string) => {
    const bagrut = state.bagruts.find(b => b._id === bagrutId) || state.currentBagrut;
    if (!bagrut) return null;

    const completionStatus = bagrut.computedValues?.completionStatus || {
      presentations: [false, false, false, false],
      directorEvaluation: false,
      recitalConfig: false,
      program: false
    };

    const totalSteps = 7; // 4 presentations + director + recital config + program
    const completedSteps = completionStatus.presentations.filter(Boolean).length +
                          (completionStatus.directorEvaluation ? 1 : 0) +
                          (completionStatus.recitalConfig ? 1 : 0) +
                          (completionStatus.program ? 1 : 0);

    return {
      completedSteps,
      totalSteps,
      percentageComplete: Math.round((completedSteps / totalSteps) * 100),
      isComplete: completedSteps === totalSteps,
      missingSteps: [
        ...completionStatus.presentations.map((completed, i) => 
          !completed ? `מצגת ${i + 1}` : null
        ).filter(Boolean),
        !completionStatus.directorEvaluation ? 'הערכת מנהל' : null,
        !completionStatus.recitalConfig ? 'תצורת רסיטל' : null,
        !completionStatus.program ? 'תכנית' : null
      ].filter(Boolean)
    };
  }, [state.bagruts, state.currentBagrut]);

  return {
    // State
    state,

    // Core operations
    fetchAllBagruts,
    fetchBagrutById,
    fetchBagrutByStudentId,
    createBagrut,
    updateBagrut,
    deleteBagrut,

    // Enhanced operations
    updatePresentation,
    updateDirectorEvaluation,
    setRecitalConfiguration,
    calculateFinalGrade,
    addProgramPiece,

    // Validation
    validateBagrutCompletion,
    getValidationSummary,

    // Utilities
    clearError: () => actions.setError(null),
    clearValidationErrors: actions.clearValidationErrors,
    recalculateGrade: actions.recalculateGrade
  };
}