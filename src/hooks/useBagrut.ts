/**
 * React Hook for Bagrut Management
 * 
 * Enhanced version that integrates with the new BagrutContext state management
 * while maintaining backward compatibility with existing components
 */

import { useState, useCallback, useEffect } from 'react';
import { bagrutService } from '../services/bagrutService.js';
import { useBagrutActions } from './useBagrutActions';
import { useBagrutSelectors } from './useBagrutSelectors';
import type {
  Bagrut,
  BagrutFormData,
  BagrutQueryParams,
  ProgramPiece,
  Accompanist,
  PresentationUpdateData,
  MagenBagrutUpdateData,
  GradingDetailsUpdateData,
  DirectorEvaluationUpdateData,
  RecitalConfigurationData
} from '../types/bagrut.types';

// Hook return type
interface UseBagrutReturn {
  // State
  bagrut: Bagrut | null;
  bagruts: Bagrut[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;

  // Core CRUD operations
  fetchAllBagruts: (params?: BagrutQueryParams) => Promise<void>;
  fetchBagrutById: (id: string) => Promise<void>;
  fetchBagrutByStudentId: (studentId: string) => Promise<void>;
  createBagrut: (data: BagrutFormData) => Promise<Bagrut | null>;
  updateBagrut: (id: string, data: Partial<Bagrut>) => Promise<Bagrut | null>;
  deleteBagrut: (id: string) => Promise<boolean>;

  // Presentation management
  updatePresentation: (bagrutId: string, index: number, data: PresentationUpdateData) => Promise<boolean>;

  // Magen Bagrut
  updateMagenBagrut: (bagrutId: string, data: MagenBagrutUpdateData) => Promise<boolean>;

  // Grading
  updateGradingDetails: (bagrutId: string, data: GradingDetailsUpdateData) => Promise<boolean>;
  calculateFinalGrade: (bagrutId: string) => Promise<boolean>;
  completeBagrut: (bagrutId: string, signature: string) => Promise<boolean>;

  // Document management
  uploadDocument: (bagrutId: string, file: File, category: string, description?: string) => Promise<boolean>;
  removeDocument: (bagrutId: string, documentId: string) => Promise<boolean>;
  downloadDocument: (bagrutId: string, documentId: string) => Promise<Blob | null>;

  // Program management
  addProgramPiece: (bagrutId: string, piece: Omit<ProgramPiece, '_id'>) => Promise<boolean>;
  updateProgram: (bagrutId: string, program: ProgramPiece[]) => Promise<boolean>;
  removeProgramPiece: (bagrutId: string, pieceId: string) => Promise<boolean>;

  // Accompanist management
  addAccompanist: (bagrutId: string, accompanist: Omit<Accompanist, '_id'>) => Promise<boolean>;
  removeAccompanist: (bagrutId: string, accompanistId: string) => Promise<boolean>;

  // New functionality
  updateDirectorEvaluation: (bagrutId: string, evaluationData: DirectorEvaluationUpdateData) => Promise<boolean>;
  setRecitalConfiguration: (bagrutId: string, configData: RecitalConfigurationData) => Promise<boolean>;
  getDefaultDetailedGrading: () => any;

  // Utilities
  clearError: () => void;
  refreshCache: () => void;
}

/**
 * Custom hook for Bagrut management
 * Enhanced with state management context integration
 */
export function useBagrut(): UseBagrutReturn {
  // Try to use the new context-based state management if available
  // Fall back to local state for backward compatibility
  let contextActions, contextSelectors;
  
  try {
    contextActions = useBagrutActions();
    contextSelectors = useBagrutSelectors();
    console.log('🔗 Using BagrutContext for state management');
  } catch (error) {
    // Context not available, use local state
    console.log('⚠️ BagrutContext not available, falling back to local state:', error);
  }

  const [localBagrut, setLocalBagrut] = useState<Bagrut | null>(null);
  const [localBagruts, setLocalBagruts] = useState<Bagrut[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseBagrutReturn['pagination']>(null);

  // Use context state if available, otherwise local state
  const bagrut = contextSelectors?.currentBagrut ?? localBagrut;
  const bagruts = contextSelectors?.allBagruts ?? localBagruts;
  const loading = contextSelectors?.loading ?? localLoading;
  const error = contextSelectors?.error ?? localError;

  // Clear error
  const clearError = useCallback(() => {
    if (contextActions) {
      contextActions.clearError();
    } else {
      setLocalError(null);
    }
  }, [contextActions]);

  // Refresh cache (placeholder)
  const refreshCache = useCallback(() => {
    // No cache to clear in existing API
  }, []);

  // Fetch all bagruts
  const fetchAllBagruts = useCallback(async (params?: BagrutQueryParams) => {
    if (contextActions) {
      return contextActions.fetchAllBagruts(params);
    }
    
    // Fallback to local implementation
    setLocalLoading(true);
    setLocalError(null);
    try {
      const bagruts = await bagrutService.getAllBagruts(params || {});
      setLocalBagruts(Array.isArray(bagruts) ? bagruts : []);
      setPagination(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setLocalError(errorMessage);
      console.error('Error fetching bagruts:', err);
    } finally {
      setLocalLoading(false);
    }
  }, [contextActions]);

  // Fetch bagrut by ID
  const fetchBagrutById = useCallback(async (id: string) => {
    if (contextActions) {
      return contextActions.fetchBagrutById(id);
    }
    
    // Fallback to local implementation
    setLocalLoading(true);
    setLocalError(null);
    try {
      const bagrut = await bagrutService.getBagrutById(id);
      setLocalBagrut(bagrut || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setLocalError(errorMessage);
      console.error('Error fetching bagrut:', err);
    } finally {
      setLocalLoading(false);
    }
  }, [contextActions]);

  // Fetch bagrut by student ID
  const fetchBagrutByStudentId = useCallback(async (studentId: string) => {
    if (contextActions) {
      return contextActions.fetchBagrutByStudentId(studentId);
    }
    
    // Fallback to local implementation
    setLocalLoading(true);
    setLocalError(null);
    try {
      const bagrut = await bagrutService.getBagrutByStudentId(studentId);
      setLocalBagrut(bagrut || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setLocalError(errorMessage);
      console.error('Error fetching student bagrut:', err);
    } finally {
      setLocalLoading(false);
    }
  }, [contextActions]);

  // Create bagrut
  const createBagrut = useCallback(async (data: BagrutFormData): Promise<Bagrut | null> => {
    if (contextActions) {
      return contextActions.createBagrut(data);
    }
    
    // Fallback to local implementation
    setLocalLoading(true);
    setLocalError(null);
    try {
      const bagrut = await bagrutService.createBagrut(data);
      setLocalBagrut(bagrut || null);
      
      // Also refresh the local bagruts list
      if (bagrut) {
        const updatedBagruts = await bagrutService.getAllBagruts({});
        setLocalBagruts(Array.isArray(updatedBagruts) ? updatedBagruts : []);
      }
      
      return bagrut;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setLocalError(errorMessage);
      console.error('Error creating bagrut:', err);
      return null;
    } finally {
      setLocalLoading(false);
    }
  }, [contextActions]);

  // Update bagrut
  const updateBagrut = useCallback(async (id: string, data: Partial<Bagrut>): Promise<Bagrut | null> => {
    if (contextActions) {
      return contextActions.updateBagrut(id, data);
    }
    
    // Fallback to local implementation
    setLocalLoading(true);
    setLocalError(null);
    try {
      const bagrut = await bagrutService.updateBagrut(id, data);
      setLocalBagrut(bagrut || null);
      return bagrut;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setLocalError(errorMessage);
      console.error('Error updating bagrut:', err);
      return null;
    } finally {
      setLocalLoading(false);
    }
  }, [contextActions]);

  // Delete bagrut
  const deleteBagrut = useCallback(async (id: string): Promise<boolean> => {
    if (contextActions) {
      return contextActions.deleteBagrut(id);
    }

    // Fallback to local implementation
    setLocalLoading(true);
    setLocalError(null);
    try {
      await bagrutService.deleteBagrut(id);

      // Remove from local state
      setLocalBagruts(prev => prev.filter(b => b._id !== id));
      if (localBagrut?._id === id) {
        setLocalBagrut(null);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה במחיקת הבגרות';
      setLocalError(errorMessage);
      console.error('Error deleting bagrut:', err);
      return false;
    } finally {
      setLocalLoading(false);
    }
  }, [contextActions, localBagrut]);

  // Update presentation
  const updatePresentation = useCallback(async (
    bagrutId: string,
    index: number,
    data: PresentationUpdateData
  ): Promise<boolean> => {
    if (contextActions) {
      return contextActions.updatePresentation(bagrutId, index, data);
    }
    
    // Fallback to local implementation
    setLocalLoading(true);
    setLocalError(null);
    try {
      const bagrut = await bagrutService.updatePresentation(bagrutId, index, data);
      setLocalBagrut(bagrut || null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בעדכון המצגת';
      setLocalError(errorMessage);
      return false;
    } finally {
      setLocalLoading(false);
    }
  }, [contextActions]);

  // Update Magen Bagrut (placeholder)
  const updateMagenBagrut = useCallback(async (
    bagrutId: string,
    data: MagenBagrutUpdateData
  ): Promise<boolean> => {
    setLocalError('עדכון מגן בגרות לא מושלם עדיין');
    return false;
  }, []);

  // Update grading details using the new API structure
  const updateGradingDetails = useCallback(async (
    bagrutId: string,
    data: GradingDetailsUpdateData
  ): Promise<boolean> => {
    try {
      setLocalError(null);
      
      // Use the new API endpoint that expects the updated structure
      await apiService.bagrutApi.updateGradingDetails(bagrutId, data);
      
      console.log(`✅ Updated grading details for bagrut: ${bagrutId}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating grading details:', error);
      setLocalError('שגיאה בעדכון פרטי הציונים');
      return false;
    }
  }, []);

  // Calculate final grade
  const calculateFinalGrade = useCallback(async (bagrutId: string): Promise<boolean> => {
    if (contextActions) {
      return contextActions.calculateFinalGrade(bagrutId);
    }
    
    // Fallback to local implementation
    setLocalLoading(true);
    setLocalError(null);
    try {
      const bagrut = await bagrutService.calculateFinalGrade(bagrutId);
      setLocalBagrut(bagrut || null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בחישוב הציון הסופי';
      setLocalError(errorMessage);
      return false;
    } finally {
      setLocalLoading(false);
    }
  }, [contextActions]);

  // Complete bagrut (placeholder)
  const completeBagrut = useCallback(async (
    bagrutId: string,
    signature: string
  ): Promise<boolean> => {
    setLocalError('השלמת בגרות לא מושלמת עדיין');
    return false;
  }, []);

  // Upload document (placeholder)
  const uploadDocument = useCallback(async (
    bagrutId: string,
    file: File,
    category: string,
    description?: string
  ): Promise<boolean> => {
    setLocalError('העלאת מסמכים לא מושלמת עדיין');
    return false;
  }, []);

  // Remove document (placeholder)
  const removeDocument = useCallback(async (
    bagrutId: string,
    documentId: string
  ): Promise<boolean> => {
    setLocalError('מחיקת מסמכים לא מושלמת עדיין');
    return false;
  }, []);

  // Download document (placeholder)
  const downloadDocument = useCallback(async (
    bagrutId: string,
    documentId: string
  ): Promise<Blob | null> => {
    setLocalError('הורדת מסמכים לא מושלמת עדיין');
    return null;
  }, []);

  // Add program piece (placeholder)
  const addProgramPiece = useCallback(async (
    bagrutId: string,
    piece: Omit<ProgramPiece, '_id'>
  ): Promise<boolean> => {
    setLocalError('הוספת יצירות לא מושלמת עדיין');
    return false;
  }, []);

  // Update program (placeholder)
  const updateProgram = useCallback(async (
    bagrutId: string,
    program: ProgramPiece[]
  ): Promise<boolean> => {
    setLocalError('עדכון תכנית לא מושלם עדיין');
    return false;
  }, []);

  // Remove program piece (placeholder)
  const removeProgramPiece = useCallback(async (
    bagrutId: string,
    pieceId: string
  ): Promise<boolean> => {
    setLocalError('מחיקת יצירות לא מושלמת עדיין');
    return false;
  }, []);

  // Add accompanist (placeholder)
  const addAccompanist = useCallback(async (
    bagrutId: string,
    accompanist: Omit<Accompanist, '_id'>
  ): Promise<boolean> => {
    setLocalError('הוספת מלווים לא מושלמת עדיין');
    return false;
  }, []);

  // Remove accompanist (placeholder)
  const removeAccompanist = useCallback(async (
    bagrutId: string,
    accompanistId: string
  ): Promise<boolean> => {
    setLocalError('מחיקת מלווים לא מושלמת עדיין');
    return false;
  }, []);

  // Update director evaluation
  const updateDirectorEvaluation = useCallback(async (
    bagrutId: string,
    evaluationData: DirectorEvaluationUpdateData
  ): Promise<boolean> => {
    if (contextActions) {
      return contextActions.updateDirectorEvaluation(bagrutId, evaluationData);
    }
    
    // Fallback to local implementation
    setLocalLoading(true);
    setLocalError(null);
    try {
      const bagrut = await bagrutService.updateDirectorEvaluation(bagrutId, evaluationData);
      setLocalBagrut(bagrut || null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בעדכון הערכת המנהל';
      setLocalError(errorMessage);
      return false;
    } finally {
      setLocalLoading(false);
    }
  }, [contextActions]);

  // Set recital configuration
  const setRecitalConfiguration = useCallback(async (
    bagrutId: string,
    configData: RecitalConfigurationData
  ): Promise<boolean> => {
    if (contextActions) {
      return contextActions.setRecitalConfiguration(bagrutId, configData);
    }
    
    // Fallback to local implementation
    setLocalLoading(true);
    setLocalError(null);
    try {
      const bagrut = await bagrutService.setRecitalConfiguration(bagrutId, configData);
      setLocalBagrut(bagrut || null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בהגדרת תצורת הרסיטל';
      setLocalError(errorMessage);
      return false;
    } finally {
      setLocalLoading(false);
    }
  }, [contextActions]);

  // Get default detailed grading
  const getDefaultDetailedGrading = useCallback(() => {
    return bagrutService.getDefaultDetailedGrading();
  }, []);

  return {
    // State
    bagrut,
    bagruts,
    loading,
    error,
    pagination,

    // Core CRUD
    fetchAllBagruts,
    fetchBagrutById,
    fetchBagrutByStudentId,
    createBagrut,
    updateBagrut,
    deleteBagrut,

    // Presentation management
    updatePresentation,

    // Magen Bagrut
    updateMagenBagrut,

    // Grading
    updateGradingDetails,
    calculateFinalGrade,
    completeBagrut,

    // Document management
    uploadDocument,
    removeDocument,
    downloadDocument,

    // Program management
    addProgramPiece,
    updateProgram,
    removeProgramPiece,

    // Accompanist management
    addAccompanist,
    removeAccompanist,

    // New functionality
    updateDirectorEvaluation,
    setRecitalConfiguration,
    getDefaultDetailedGrading,

    // Utilities
    clearError,
    refreshCache
  };
}