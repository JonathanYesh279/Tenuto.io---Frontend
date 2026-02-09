/**
 * Student Deletion React Query Hooks
 * 
 * Custom hooks for student cascade deletion operations using React Query.
 * Integrates with the cascade deletion service and WebSocket for real-time updates.
 * 
 * Features:
 * - Deletion preview with impact analysis
 * - Execute cascade deletion with progress tracking
 * - Real-time progress updates via WebSocket
 * - Optimistic updates and proper error handling
 * - Hebrew error messages for user-facing errors
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import { cascadeDeletionService, CascadeDeletionError } from '@/services/cascadeDeletionService.js';
import { cascadeWebSocket, EVENT_TYPES } from '@/services/cascadeWebSocket.js';

// ==================== Types ====================

interface DeletionPreview {
  studentId: string;
  summary: {
    totalRecords: number;
    affectedCollections: string[];
    estimatedDuration: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  details: {
    lessons: Array<{ id: string; title: string; date: string }>;
    attendance: Array<{ id: string; lessonId: string; date: string }>;
    orchestras: Array<{ id: string; name: string; role: string }>;
    theoryClasses: Array<{ id: string; className: string; semester: string }>;
    documents: Array<{ id: string; filename: string; category: string }>;
    rehearsals: Array<{ id: string; date: string; orchestraId: string }>;
    assignments: Array<{ id: string; title: string; dueDate: string }>;
    payments: Array<{ id: string; amount: number; date: string }>;
  };
  warnings: string[];
  dependencies: Array<{ type: string; description: string }>;
  canProceed: boolean;
  requiresConfirmation: boolean;
  timestamp: string;
}

interface DeletionResult {
  success: boolean;
  studentId: string;
  operation: {
    id: string;
    snapshotId?: string;
    duration: number;
    startTime: string;
    endTime: string;
  };
  summary: {
    deletedRecords: number;
    processedCollections: string[];
    warnings: string[];
    errors: string[];
  };
  details: Record<string, any>;
  canRollback: boolean;
  timestamp: string;
}

interface DeletionProgress {
  studentId: string;
  step: string;
  percentage: number;
  details: Record<string, any>;
  timestamp: string;
}

interface DeletionOptions {
  createSnapshot?: boolean;
  skipValidation?: boolean;
  batchSize?: number;
  forceDelete?: boolean;
  deleteDocuments?: boolean;
  notifyUsers?: boolean;
  reason?: string;
}

// ==================== Query Keys ====================

export const studentDeletionQueryKeys = {
  all: ['student-deletion'] as const,
  preview: (studentId: string) => [...studentDeletionQueryKeys.all, 'preview', studentId] as const,
  activeOperations: () => [...studentDeletionQueryKeys.all, 'active-operations'] as const,
} as const;

// ==================== Main Student Deletion Hook ====================

export function useStudentDeletion(studentId?: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<DeletionProgress | null>(null);
  const [isProgressActive, setIsProgressActive] = useState(false);
  const progressUnsubscribeRef = useRef<(() => void) | null>(null);

  // ==================== Deletion Preview ====================

  const previewQuery = useQuery({
    queryKey: studentDeletionQueryKeys.preview(studentId!),
    queryFn: async (): Promise<DeletionPreview> => {
      if (!studentId) {
        throw new CascadeDeletionError('מזהה תלמיד נדרש', 'INVALID_STUDENT_ID');
      }
      return await cascadeDeletionService.previewDeletion(studentId);
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (error instanceof CascadeDeletionError && 
          (error.code === 'NOT_FOUND' || error.code === 'UNAUTHORIZED')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const previewDeletion = useCallback(async (targetStudentId: string): Promise<DeletionPreview | null> => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: studentDeletionQueryKeys.preview(targetStudentId),
        queryFn: () => cascadeDeletionService.previewDeletion(targetStudentId),
        staleTime: 2 * 60 * 1000,
      });
      return data;
    } catch (error) {
      console.error('Preview deletion failed:', error);
      throw error;
    }
  }, [queryClient]);

  // ==================== Deletion Execution ====================

  const executionMutation = useMutation({
    mutationFn: async ({ 
      targetStudentId, 
      options = {} 
    }: { 
      targetStudentId: string;
      options?: DeletionOptions;
    }): Promise<DeletionResult> => {
      return await cascadeDeletionService.executeDelete(targetStudentId, options);
    },
    onMutate: async ({ targetStudentId }) => {
      // Start progress tracking
      setIsProgressActive(true);
      setProgress({
        studentId: targetStudentId,
        step: 'מתחיל תהליך מחיקה...',
        percentage: 0,
        details: {},
        timestamp: new Date().toISOString(),
      });

      // Set up WebSocket subscription for progress updates
      const unsubscribe = cascadeWebSocket.subscribeToProgress(
        targetStudentId,
        // Progress callback
        (progressData) => {
          setProgress({
            studentId: progressData.studentId,
            step: progressData.details?.stepDescription || progressData.step,
            percentage: progressData.percentage,
            details: progressData.details || {},
            timestamp: progressData.timestamp,
          });
        },
        // Complete callback
        (completeData) => {
          setProgress({
            studentId: completeData.studentId,
            step: completeData.success ? 'המחיקה הושלמה בהצלחה' : 'המחיקה נכשלה',
            percentage: 100,
            details: completeData.summary || {},
            timestamp: completeData.timestamp,
          });
          
          // Clean up after a delay
          setTimeout(() => {
            setIsProgressActive(false);
            setProgress(null);
          }, 3000);
        },
        // Error callback
        (errorData) => {
          setProgress({
            studentId: errorData.studentId,
            step: `שגיאה: ${errorData.error}`,
            percentage: 0,
            details: errorData.details || {},
            timestamp: errorData.timestamp,
          });
          
          setTimeout(() => {
            setIsProgressActive(false);
            setProgress(null);
          }, 5000);
        }
      );

      progressUnsubscribeRef.current = unsubscribe;

      // Cancel existing preview queries for this student
      await queryClient.cancelQueries({
        queryKey: studentDeletionQueryKeys.preview(targetStudentId),
      });

      return { targetStudentId };
    },
    onSuccess: (result, { targetStudentId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['students', 'list'],
      });
      
      queryClient.invalidateQueries({
        queryKey: ['students', 'details', targetStudentId],
      });

      // Remove the student from cache optimistically
      queryClient.setQueryData(['students', 'list'], (oldData: any) => {
        if (!oldData) return oldData;
        
        if (Array.isArray(oldData)) {
          return oldData.filter((student: any) => student.id !== targetStudentId);
        }
        
        if (oldData.data && Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: oldData.data.filter((student: any) => student.id !== targetStudentId),
          };
        }
        
        return oldData;
      });

      // Clear preview data
      queryClient.removeQueries({
        queryKey: studentDeletionQueryKeys.preview(targetStudentId),
      });
    },
    onError: (error) => {
      console.error('Student deletion failed:', error);
      
      // Clean up progress tracking
      setTimeout(() => {
        setIsProgressActive(false);
        setProgress(null);
      }, 5000);
    },
    onSettled: () => {
      // Clean up WebSocket subscription
      if (progressUnsubscribeRef.current) {
        progressUnsubscribeRef.current();
        progressUnsubscribeRef.current = null;
      }
    },
  });

  const executeDelete = useCallback((
    targetStudentId: string,
    options?: DeletionOptions
  ) => {
    return executionMutation.mutateAsync({ targetStudentId, options });
  }, [executionMutation]);

  // ==================== Cleanup on unmount ====================

  useEffect(() => {
    return () => {
      if (progressUnsubscribeRef.current) {
        progressUnsubscribeRef.current();
      }
    };
  }, []);

  return {
    // Preview operations
    previewDeletion,
    preview: previewQuery.data || null,
    isPreviewLoading: previewQuery.isLoading,
    previewError: previewQuery.error,

    // Execution operations
    executeDelete,
    isDeleting: executionMutation.isLoading,
    deletionError: executionMutation.error,
    deletionResult: executionMutation.data,

    // Progress tracking
    progress,
    isProgressActive,

    // Utility methods
    clearPreview: () => {
      if (studentId) {
        queryClient.removeQueries({
          queryKey: studentDeletionQueryKeys.preview(studentId),
        });
      }
    },
    
    refetchPreview: () => {
      if (studentId) {
        return previewQuery.refetch();
      }
    },
  };
}