/**
 * Orphaned References Cleanup React Query Hooks
 * 
 * Custom hooks for cleaning up orphaned references in the database.
 * Provides preview capabilities and batch cleanup operations.
 * 
 * Features:
 * - Preview orphaned references before cleanup
 * - Execute cleanup with configurable options
 * - Progress tracking for large cleanup operations
 * - Hebrew error messages and user feedback
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { cascadeDeletionService } from '@/services/cascadeDeletionService.js';

// ==================== Types ====================

interface CleanupResult {
  success: boolean;
  operation: {
    id: string;
    duration: number;
    mode: 'preview' | 'cleanup';
  };
  summary: {
    totalOrphaned: number;
    cleaned: number;
    skipped: number;
    errors: number;
  };
  details: {
    byCollection: Record<string, {
      orphaned: number;
      cleaned: number;
      errors: Array<{
        id: string;
        error: string;
        details?: Record<string, any>;
      }>;
    }>;
    issues: Array<{
      collection: string;
      orphanedId: string;
      parentCollection: string;
      parentId: string;
      reason: string;
    }>;
    recommendations: Array<{
      type: 'cleanup' | 'manual_review' | 'data_migration';
      description: string;
      priority: 'low' | 'medium' | 'high';
      affectedCollections: string[];
    }>;
  };
  timestamp: string;
}

interface CleanupOptions {
  collections?: string[];
  dryRun?: boolean;
  batchSize?: number;
  skipBackup?: boolean;
}

interface CleanupPreview extends CleanupResult {
  estimatedDuration: number;
  recommendedBatchSize: number;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigations: string[];
  };
}

// ==================== Query Keys ====================

export const orphanedCleanupQueryKeys = {
  all: ['orphaned-cleanup'] as const,
  preview: (collections?: string[]) => [...orphanedCleanupQueryKeys.all, 'preview', collections || 'all'] as const,
  history: () => [...orphanedCleanupQueryKeys.all, 'history'] as const,
  stats: () => [...orphanedCleanupQueryKeys.all, 'stats'] as const,
} as const;

// ==================== Main Orphaned Cleanup Hook ====================

export function useOrphanedCleanup() {
  const queryClient = useQueryClient();
  const [lastPreviewOptions, setLastPreviewOptions] = useState<CleanupOptions | null>(null);

  // ==================== Preview Operations ====================

  const previewQuery = useQuery({
    queryKey: orphanedCleanupQueryKeys.preview(lastPreviewOptions?.collections),
    queryFn: async (): Promise<CleanupPreview> => {
      const result = await cascadeDeletionService.cleanupOrphaned({
        ...lastPreviewOptions,
        dryRun: true,
      });

      // Transform the result to include preview-specific data
      return {
        ...result,
        estimatedDuration: Math.max(result.summary.totalOrphaned * 10, 1000), // 10ms per orphan, min 1s
        recommendedBatchSize: Math.min(Math.max(Math.floor(result.summary.totalOrphaned / 10), 10), 100),
        riskAssessment: {
          level: result.summary.totalOrphaned > 1000 ? 'high' : 
                 result.summary.totalOrphaned > 100 ? 'medium' : 'low',
          factors: [
            result.summary.totalOrphaned > 1000 ? 'כמות גדולה של רכיבים יתומים' : null,
            result.details.issues.some(issue => issue.collection === 'students') ? 'נמצאו רכיבי תלמידים יתומים' : null,
            result.details.issues.some(issue => issue.collection === 'payments') ? 'נמצאו רכיבי תשלומים יתומים' : null,
          ].filter(Boolean) as string[],
          mitigations: [
            'יצירת גיבוי לפני הניקוי',
            'הרצת ניקוי במנות קטנות',
            'מעקב אחר התקדמות הניקוי',
            'בדיקת שלמות לאחר הניקוי',
          ],
        },
      } as CleanupPreview;
    },
    enabled: !!lastPreviewOptions,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });

  const previewCleanup = useCallback(async (options: CleanupOptions = {}): Promise<CleanupPreview | null> => {
    try {
      setLastPreviewOptions(options);
      
      const data = await queryClient.fetchQuery({
        queryKey: orphanedCleanupQueryKeys.preview(options.collections),
        queryFn: async () => {
          const result = await cascadeDeletionService.cleanupOrphaned({
            ...options,
            dryRun: true,
          });

          return {
            ...result,
            estimatedDuration: Math.max(result.summary.totalOrphaned * 10, 1000),
            recommendedBatchSize: Math.min(Math.max(Math.floor(result.summary.totalOrphaned / 10), 10), 100),
            riskAssessment: {
              level: result.summary.totalOrphaned > 1000 ? 'high' : 
                     result.summary.totalOrphaned > 100 ? 'medium' : 'low',
              factors: [
                result.summary.totalOrphaned > 1000 ? 'כמות גדולה של רכיבים יתומים' : null,
                result.details.issues.some(issue => issue.collection === 'students') ? 'נמצאו רכיבי תלמידים יתומים' : null,
                result.details.issues.some(issue => issue.collection === 'payments') ? 'נמצאו רכיבי תשלומים יתומים' : null,
              ].filter(Boolean) as string[],
              mitigations: [
                'יצירת גיבוי לפני הניקוי',
                'הרצת ניקוי במנות קטנות',
                'מעקב אחר התקדמות הניקוי',
                'בדיקת שלמות לאחר הניקוי',
              ],
            },
          } as CleanupPreview;
        },
        staleTime: 2 * 60 * 1000,
      });

      return data;
    } catch (error) {
      console.error('Preview cleanup failed:', error);
      return null;
    }
  }, [queryClient]);

  // ==================== Cleanup Execution ====================

  const cleanupMutation = useMutation({
    mutationFn: async (options: CleanupOptions = {}): Promise<CleanupResult> => {
      return await cascadeDeletionService.cleanupOrphaned({
        ...options,
        dryRun: false, // Ensure this is actual cleanup, not preview
      });
    },
    onMutate: async (options) => {
      console.log('מתחיל ניקוי רכיבים יתומים...');
      
      // If we have collections specified, show which ones
      if (options.collections && options.collections.length > 0) {
        console.log(`ניקוי אוספים: ${options.collections.join(', ')}`);
      }
    },
    onSuccess: (data, options) => {
      console.log(`ניקוי הושלם: ${data.summary.cleaned} רכיבים נוקו`);
      
      if (data.summary.errors > 0) {
        console.warn(`${data.summary.errors} שגיאות בעת הניקוי`);
      }
      
      if (data.summary.skipped > 0) {
        console.info(`${data.summary.skipped} רכיבים דולגו`);
      }

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: orphanedCleanupQueryKeys.history(),
      });
      
      queryClient.invalidateQueries({
        queryKey: orphanedCleanupQueryKeys.stats(),
      });

      // If no collections specified, invalidate all previews
      if (!options.collections || options.collections.length === 0) {
        queryClient.invalidateQueries({
          queryKey: orphanedCleanupQueryKeys.preview(),
        });
      } else {
        // Invalidate specific preview
        queryClient.invalidateQueries({
          queryKey: orphanedCleanupQueryKeys.preview(options.collections),
        });
      }

      // Invalidate integrity queries as cleanup might affect integrity
      queryClient.invalidateQueries({
        queryKey: ['integrity'],
      });
    },
    onError: (error, options) => {
      console.error('Orphaned cleanup failed:', error);
    },
  });

  const executeCleanup = useCallback((options: CleanupOptions = {}) => {
    return cleanupMutation.mutateAsync(options);
  }, [cleanupMutation]);

  // ==================== Quick Actions ====================

  const cleanupSpecificCollections = useCallback((collections: string[], options: Omit<CleanupOptions, 'collections'> = {}) => {
    return executeCleanup({ ...options, collections });
  }, [executeCleanup]);

  const cleanupAllOrphaned = useCallback((options: CleanupOptions = {}) => {
    return executeCleanup({ ...options, collections: [] });
  }, [executeCleanup]);

  const safeCleanup = useCallback((options: Omit<CleanupOptions, 'skipBackup' | 'batchSize'> = {}) => {
    return executeCleanup({ 
      ...options, 
      skipBackup: false, 
      batchSize: 50, // Safe batch size
    });
  }, [executeCleanup]);

  // ==================== Computed Values ====================

  const previewData = previewQuery.data || null;
  const cleanupResult = cleanupMutation.data || null;

  const hasOrphanedItems = previewData ? previewData.summary.totalOrphaned > 0 : false;
  const isHighRisk = previewData?.riskAssessment.level === 'high';
  const recommendedBatchSize = previewData?.recommendedBatchSize || 50;

  // Collection-specific stats
  const orphanedByCollection = previewData?.details.byCollection || {};
  const mostOrphanedCollection = Object.entries(orphanedByCollection)
    .sort(([, a], [, b]) => b.orphaned - a.orphaned)[0];

  return {
    // Preview operations
    previewCleanup,
    preview: previewData,
    isPreviewLoading: previewQuery.isLoading,
    previewError: previewQuery.error,

    // Cleanup operations
    executeCleanup,
    cleanupSpecificCollections,
    cleanupAllOrphaned,
    safeCleanup,
    
    isCleaning: cleanupMutation.isLoading,
    cleanupError: cleanupMutation.error,
    cleanupResult,

    // Computed state
    hasOrphanedItems,
    isHighRisk,
    recommendedBatchSize,
    orphanedByCollection,
    mostOrphanedCollection: mostOrphanedCollection ? {
      collection: mostOrphanedCollection[0],
      count: mostOrphanedCollection[1].orphaned,
    } : null,

    // Status helpers
    totalOrphaned: previewData?.summary.totalOrphaned || 0,
    lastCleanedCount: cleanupResult?.summary.cleaned || 0,
    hasCleanupErrors: cleanupResult ? cleanupResult.summary.errors > 0 : false,

    // Utility methods
    refetchPreview: () => previewQuery.refetch(),
    clearPreview: () => {
      setLastPreviewOptions(null);
      queryClient.removeQueries({
        queryKey: orphanedCleanupQueryKeys.preview(),
      });
    },
  };
}

// ==================== Cleanup Statistics Hook ====================

export function useCleanupStats() {
  return useQuery({
    queryKey: orphanedCleanupQueryKeys.stats(),
    queryFn: async () => {
      // This would typically call a dedicated stats endpoint
      // For now, we'll use the preview with minimal options to get stats
      const result = await cascadeDeletionService.cleanupOrphaned({ 
        dryRun: true,
        collections: [] // All collections
      });

      return {
        totalOrphaned: result.summary.totalOrphaned,
        byCollection: result.details.byCollection,
        lastUpdated: result.timestamp,
        recommendations: result.details.recommendations,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// ==================== Collection-Specific Cleanup Hook ====================

export function useCollectionCleanup(collection: string) {
  const { previewCleanup, executeCleanup, ...rest } = useOrphanedCleanup();

  const previewCollectionCleanup = useCallback(() => {
    return previewCleanup({ collections: [collection] });
  }, [previewCleanup, collection]);

  const cleanupCollection = useCallback((options: Omit<CleanupOptions, 'collections'> = {}) => {
    return executeCleanup({ ...options, collections: [collection] });
  }, [executeCleanup, collection]);

  return {
    ...rest,
    previewCleanup: previewCollectionCleanup,
    executeCleanup: cleanupCollection,
    collection,
  };
}