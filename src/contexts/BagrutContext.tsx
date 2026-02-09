/**
 * Bagrut State Management Context
 * Provides comprehensive state management for Bagrut entities with enhanced structure
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { 
  Bagrut, 
  DirectorEvaluation, 
  PresentationUpdateData,
  DetailedGrading,
  RecitalConfigurationData 
} from '../types/bagrut.types';

// Enhanced Bagrut state structure
export interface BagrutState extends Bagrut {
  recitalConfiguration?: {
    units: 3 | 5;
    field: 'קלאסי' | 'ג\'אז' | 'שירה';
  };
  computedValues?: {
    totalPerformancePoints: number;
    weightedFinalGrade: number;
    gradeLevel: string;
    completionStatus: {
      presentations: boolean[];
      directorEvaluation: boolean;
      recitalConfig: boolean;
      program: boolean;
    };
  };
}

// Context state
interface BagrutContextState {
  currentBagrut: BagrutState | null;
  bagruts: BagrutState[];
  loading: boolean;
  error: string | null;
  validation: {
    errors: Record<string, string>;
    warnings: Record<string, string>;
  };
}

// Action types
type BagrutAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_BAGRUT'; payload: BagrutState | null }
  | { type: 'SET_BAGRUTS'; payload: BagrutState[] }
  | { type: 'UPDATE_DIRECTOR_EVALUATION'; payload: { bagrutId: string; evaluation: DirectorEvaluation } }
  | { type: 'UPDATE_RECITAL_CONFIG'; payload: { bagrutId: string; config: RecitalConfigurationData } }
  | { type: 'UPDATE_PRESENTATION'; payload: { bagrutId: string; index: number; data: PresentationUpdateData } }
  | { type: 'RECALCULATE_GRADE'; payload: { bagrutId: string } }
  | { type: 'SET_VALIDATION_ERROR'; payload: { field: string; message: string } }
  | { type: 'CLEAR_VALIDATION_ERRORS' }
  | { type: 'CALCULATE_COMPUTED_VALUES'; payload: { bagrutId: string } };

// Initial state
const initialState: BagrutContextState = {
  currentBagrut: null,
  bagruts: [],
  loading: false,
  error: null,
  validation: {
    errors: {},
    warnings: {}
  }
};

// Utility functions
const calculateTotalPerformancePoints = (presentations: any[]): number => {
  if (!presentations[3]?.detailedGrading) return 0;
  
  const grading = presentations[3].detailedGrading;
  return (grading.playingSkills?.points || 0) +
         (grading.musicalUnderstanding?.points || 0) +
         (grading.textKnowledge?.points || 0) +
         (grading.playingByHeart?.points || 0);
};

const calculateWeightedFinalGrade = (
  performancePoints: number, 
  directorPoints: number
): number => {
  const performanceGrade = (performancePoints / 100) * 100;
  const directorGrade = (directorPoints / 100) * 100;
  return (performanceGrade * 0.9) + (directorGrade * 0.1);
};

const determineGradeLevel = (finalGrade: number): string => {
  if (finalGrade >= 95) return 'מצוין (100-95)';
  if (finalGrade >= 85) return 'טוב מאד (94-85)';
  if (finalGrade >= 75) return 'טוב (84-75)';
  if (finalGrade >= 65) return 'כמעט טוב (74-65)';
  if (finalGrade >= 55) return 'מספיק (64-55)';
  return 'לא מספיק (54-0)';
};

const calculateCompletionStatus = (bagrut: BagrutState) => {
  return {
    presentations: [
      bagrut.presentations?.[0]?.completed || false,
      bagrut.presentations?.[1]?.completed || false,
      bagrut.presentations?.[2]?.completed || false,
      bagrut.presentations?.[3]?.completed || false
    ],
    directorEvaluation: Boolean(bagrut.directorEvaluation?.points),
    recitalConfig: Boolean(bagrut.recitalConfiguration?.units && bagrut.recitalConfiguration?.field),
    program: Boolean(bagrut.program?.length > 0)
  };
};

// Validation functions
const validatePointRange = (points: number, max: number, field: string): string | null => {
  if (points < 0) return `${field} לא יכול להיות שלילי`;
  if (points > max) return `${field} לא יכול לעלות על ${max} נקודות`;
  return null;
};

const validateRecitalUnits = (units: number): string | null => {
  if (units !== 3 && units !== 5) return 'יחידות רסיטל חייבות להיות 3 או 5';
  return null;
};

// Reducer
const bagrutReducer = (state: BagrutContextState, action: BagrutAction): BagrutContextState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_CURRENT_BAGRUT':
      console.log('✅ BagrutContext: SET_CURRENT_BAGRUT reducer:', action.payload?._id);
      return { ...state, currentBagrut: action.payload };

    case 'SET_BAGRUTS':
      return { ...state, bagruts: action.payload };

    case 'UPDATE_DIRECTOR_EVALUATION': {
      const { bagrutId, evaluation } = action.payload;
      
      const updatedBagrut = state.currentBagrut?._id === bagrutId 
        ? { ...state.currentBagrut, directorEvaluation: evaluation }
        : state.currentBagrut;

      const updatedBagruts = state.bagruts.map(bagrut =>
        bagrut._id === bagrutId 
          ? { ...bagrut, directorEvaluation: evaluation }
          : bagrut
      );

      return {
        ...state,
        currentBagrut: updatedBagrut,
        bagruts: updatedBagruts
      };
    }

    case 'UPDATE_RECITAL_CONFIG': {
      const { bagrutId, config } = action.payload;
      
      const recitalConfiguration = {
        units: config.recitalUnits,
        field: config.recitalField
      };

      const updatedBagrut = state.currentBagrut?._id === bagrutId 
        ? { 
            ...state.currentBagrut, 
            recitalConfiguration,
            recitalUnits: config.recitalUnits,
            recitalField: config.recitalField
          }
        : state.currentBagrut;

      const updatedBagruts = state.bagruts.map(bagrut =>
        bagrut._id === bagrutId 
          ? { 
              ...bagrut, 
              recitalConfiguration,
              recitalUnits: config.recitalUnits,
              recitalField: config.recitalField
            }
          : bagrut
      );

      return {
        ...state,
        currentBagrut: updatedBagrut,
        bagruts: updatedBagruts
      };
    }

    case 'UPDATE_PRESENTATION': {
      const { bagrutId, index, data } = action.payload;
      
      const updatePresentations = (presentations: any[] = []) => {
        const updated = [...presentations];
        updated[index] = { ...updated[index], ...data };
        return updated;
      };

      const updatedBagrut = state.currentBagrut?._id === bagrutId 
        ? { 
            ...state.currentBagrut, 
            presentations: updatePresentations(state.currentBagrut.presentations)
          }
        : state.currentBagrut;

      const updatedBagruts = state.bagruts.map(bagrut =>
        bagrut._id === bagrutId 
          ? { 
              ...bagrut, 
              presentations: updatePresentations(bagrut.presentations)
            }
          : bagrut
      );

      return {
        ...state,
        currentBagrut: updatedBagrut,
        bagruts: updatedBagruts
      };
    }

    case 'CALCULATE_COMPUTED_VALUES': {
      const { bagrutId } = action.payload;
      
      const calculateForBagrut = (bagrut: BagrutState): BagrutState => {
        if (bagrut._id !== bagrutId) return bagrut;

        const totalPerformancePoints = calculateTotalPerformancePoints(bagrut.presentations || []);
        const directorPoints = bagrut.directorEvaluation?.points || 0;
        const weightedFinalGrade = calculateWeightedFinalGrade(totalPerformancePoints, directorPoints);
        const gradeLevel = determineGradeLevel(weightedFinalGrade);
        const completionStatus = calculateCompletionStatus(bagrut);

        return {
          ...bagrut,
          computedValues: {
            totalPerformancePoints,
            weightedFinalGrade,
            gradeLevel,
            completionStatus
          },
          finalGrade: weightedFinalGrade,
          finalGradeLevel: gradeLevel
        };
      };

      return {
        ...state,
        currentBagrut: state.currentBagrut ? calculateForBagrut(state.currentBagrut) : null,
        bagruts: state.bagruts.map(calculateForBagrut)
      };
    }

    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        validation: {
          ...state.validation,
          errors: {
            ...state.validation.errors,
            [action.payload.field]: action.payload.message
          }
        }
      };

    case 'CLEAR_VALIDATION_ERRORS':
      return {
        ...state,
        validation: {
          ...state.validation,
          errors: {}
        }
      };

    default:
      return state;
  }
};

// Context
const BagrutContext = createContext<{
  state: BagrutContextState;
  actions: {
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setCurrentBagrut: (bagrut: BagrutState | null) => void;
    setBagruts: (bagruts: BagrutState[]) => void;
    updateDirectorEvaluation: (bagrutId: string, evaluation: DirectorEvaluation) => void;
    updateRecitalConfig: (bagrutId: string, config: RecitalConfigurationData) => void;
    updatePresentation: (bagrutId: string, index: number, data: PresentationUpdateData) => void;
    recalculateGrade: (bagrutId: string) => void;
    setValidationError: (field: string, message: string) => void;
    clearValidationErrors: () => void;
    validatePointTotal: (grading: DetailedGrading) => boolean;
    validateSequentialPresentation: (presentationIndex: number, presentations: any[]) => boolean;
  };
} | null>(null);

// Provider component
export const BagrutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bagrutReducer, initialState);

  const actions = useMemo(() => ({
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    setCurrentBagrut: (bagrut: BagrutState | null) => {
      console.log('💾 BagrutContext: setCurrentBagrut action called with:', bagrut?._id);
      dispatch({ type: 'SET_CURRENT_BAGRUT', payload: bagrut });
    },
    setBagruts: (bagruts: BagrutState[]) => dispatch({ type: 'SET_BAGRUTS', payload: bagruts }),
    
    updateDirectorEvaluation: (bagrutId: string, evaluation: DirectorEvaluation) => {
      const pointError = validatePointRange(evaluation.points || 0, 100, 'הערכת מנהל');
      if (pointError) {
        dispatch({ type: 'SET_VALIDATION_ERROR', payload: { field: 'directorEvaluation', message: pointError } });
        return;
      }
      
      dispatch({ type: 'UPDATE_DIRECTOR_EVALUATION', payload: { bagrutId, evaluation } });
      dispatch({ type: 'CALCULATE_COMPUTED_VALUES', payload: { bagrutId } });
    },

    updateRecitalConfig: (bagrutId: string, config: RecitalConfigurationData) => {
      const unitsError = validateRecitalUnits(config.recitalUnits);
      if (unitsError) {
        dispatch({ type: 'SET_VALIDATION_ERROR', payload: { field: 'recitalUnits', message: unitsError } });
        return;
      }

      dispatch({ type: 'UPDATE_RECITAL_CONFIG', payload: { bagrutId, config } });
      dispatch({ type: 'CALCULATE_COMPUTED_VALUES', payload: { bagrutId } });
    },

    updatePresentation: (bagrutId: string, index: number, data: PresentationUpdateData) => {
      // Validate detailed grading points if present
      if (data.detailedGrading) {
        const grading = data.detailedGrading;
        const errors: string[] = [];
        
        if (grading.playingSkills?.points !== undefined) {
          const error = validatePointRange(grading.playingSkills.points, 40, 'כישורי נגינה');
          if (error) errors.push(error);
        }
        
        if (grading.musicalUnderstanding?.points !== undefined) {
          const error = validatePointRange(grading.musicalUnderstanding.points, 30, 'הבנה מוזיקלית');
          if (error) errors.push(error);
        }
        
        if (grading.textKnowledge?.points !== undefined) {
          const error = validatePointRange(grading.textKnowledge.points, 20, 'ידע טקסט');
          if (error) errors.push(error);
        }
        
        if (grading.playingByHeart?.points !== undefined) {
          const error = validatePointRange(grading.playingByHeart.points, 10, 'נגינה בעל פה');
          if (error) errors.push(error);
        }

        if (errors.length > 0) {
          dispatch({ type: 'SET_VALIDATION_ERROR', payload: { field: `presentation${index}`, message: errors[0] } });
          return;
        }
      }

      dispatch({ type: 'UPDATE_PRESENTATION', payload: { bagrutId, index, data } });
      dispatch({ type: 'CALCULATE_COMPUTED_VALUES', payload: { bagrutId } });
    },

    recalculateGrade: (bagrutId: string) => {
      dispatch({ type: 'CALCULATE_COMPUTED_VALUES', payload: { bagrutId } });
    },

    setValidationError: (field: string, message: string) => {
      dispatch({ type: 'SET_VALIDATION_ERROR', payload: { field, message } });
    },

    clearValidationErrors: () => {
      dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
    },

    validatePointTotal: (grading: DetailedGrading): boolean => {
      const total = (grading.playingSkills?.points || 0) +
                   (grading.musicalUnderstanding?.points || 0) +
                   (grading.textKnowledge?.points || 0) +
                   (grading.playingByHeart?.points || 0);
      
      if (total > 100) {
        dispatch({ 
          type: 'SET_VALIDATION_ERROR', 
          payload: { field: 'totalPoints', message: 'סך הנקודות לא יכול לעלות על 100' } 
        });
        return false;
      }
      
      return true;
    },

    validateSequentialPresentation: (presentationIndex: number, presentations: any[]): boolean => {
      if (presentationIndex > 0 && !presentations[presentationIndex - 1]?.completed) {
        dispatch({ 
          type: 'SET_VALIDATION_ERROR', 
          payload: { 
            field: `presentation${presentationIndex}`, 
            message: `יש להשלים תחילה מצגת ${presentationIndex}` 
          } 
        });
        return false;
      }
      
      return true;
    }
  }), []);

  const contextValue = useMemo(() => ({ state, actions }), [state, actions]);

  return (
    <BagrutContext.Provider value={contextValue}>
      {children}
    </BagrutContext.Provider>
  );
};

// Hook to use the context
export const useBagrutContext = () => {
  const context = useContext(BagrutContext);
  if (!context) {
    throw new Error('useBagrutContext must be used within a BagrutProvider');
  }
  return context;
};

// Selectors
export const bagrutSelectors = {
  getCurrentBagrut: (state: BagrutContextState) => state.currentBagrut,
  getAllBagruts: (state: BagrutContextState) => state.bagruts,
  getLoadingState: (state: BagrutContextState) => state.loading,
  getError: (state: BagrutContextState) => state.error,
  getValidationErrors: (state: BagrutContextState) => state.validation.errors,
  
  getBagrutById: (state: BagrutContextState, id: string) => 
    state.bagruts.find(bagrut => bagrut._id === id),
    
  getCompletedPresentations: (state: BagrutContextState, bagrutId: string) => {
    const bagrut = state.bagruts.find(b => b._id === bagrutId);
    return bagrut?.presentations?.filter(p => p.completed) || [];
  },
  
  getTotalPerformancePoints: (state: BagrutContextState, bagrutId: string) => {
    const bagrut = state.bagruts.find(b => b._id === bagrutId);
    return bagrut?.computedValues?.totalPerformancePoints || 0;
  },
  
  getWeightedFinalGrade: (state: BagrutContextState, bagrutId: string) => {
    const bagrut = state.bagruts.find(b => b._id === bagrutId);
    return bagrut?.computedValues?.weightedFinalGrade || 0;
  },
  
  getCompletionStatus: (state: BagrutContextState, bagrutId: string) => {
    const bagrut = state.bagruts.find(b => b._id === bagrutId);
    return bagrut?.computedValues?.completionStatus || {
      presentations: [false, false, false, false],
      directorEvaluation: false,
      recitalConfig: false,
      program: false
    };
  }
};