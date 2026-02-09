/**
 * Database Integrity Check React Query Hooks
 * 
 * Custom hooks for database integrity validation and repair operations.
 * Provides real-time updates and comprehensive error handling.
 * 
 * Features:
 * - Validate database integrity
 * - Repair integrity issues with dry-run support
 * - Real-time integrity issue notifications
 * - Comprehensive error handling with Hebrew messages
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { cascadeDeletionService } from '@/services/cascadeDeletionService.js';
import { cascadeWebSocket, EVENT_TYPES } from '@/services/cascadeWebSocket.js';

// ==================== Types ====================

interface ValidationResult {
  success: boolean;
  validation: {
    id: string;
    duration: number;
    timestamp: string;
  };
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  issues: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    collection: string;
    description: string;
    affectedRecords: number;
    fixable: boolean;
    estimatedFixTime?: number;
  }>;
  recommendations: Array<{
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    action: string;
  }>;
  repairAvailable: boolean;
  overallStatus: 'healthy' | 'warnings' | 'errors' | 'critical';
}

interface RepairResult {
  success: boolean;
  operation: {
    id: string;
    backupId?: string;
    duration: number;
    mode: 'preview' | 'repair';
  };
  summary: {
    totalIssues: number;
    repaired: number;
    failed: number;
    skipped: number;
  };
  details: {
    repairedIssues: Array<{
      id: string;
      type: string;
      description: string;
      fixApplied: string;
    }>;
    failedIssues: Array<{
      id: string;
      type: string;
      description: string;
      error: string;
    }>;
    recommendations: Array<{
      type: string;
      description: string;
      action: string;
    }>;
  };
  warnings: string[];
  timestamp: string;
}

interface RepairOptions {
  issues?: string[];
  createBackup?: boolean;
  dryRun?: boolean;
  forceRepair?: boolean;
}

interface IntegrityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  collection: string;
  count: number;
  fixable: boolean;
  details: Record<string, any>;
  timestamp: string;
}

// ==================== Query Keys ====================

export const integrityQueryKeys = {
  all: ['integrity'] as const,
  validation: () => [...integrityQueryKeys.all, 'validation'] as const,
  lastValidation: () => [...integrityQueryKeys.validation(), 'last'] as const,
  issues: () => [...integrityQueryKeys.all, 'issues'] as const,
  repairHistory: () => [...integrityQueryKeys.all, 'repair-history'] as const,
} as const;

// ==================== Main Integrity Check Hook ====================

export function useIntegrityCheck() {
  const queryClient = useQueryClient();

  // ==================== Validation Query ====================

  const validationQuery = useQuery({
    queryKey: integrityQueryKeys.lastValidation(),
    queryFn: async (): Promise<ValidationResult> => {
      return await cascadeDeletionService.validateIntegrity();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // ==================== Manual Validation ====================

  const validationMutation = useMutation({
    mutationFn: async (): Promise<ValidationResult> => {
      return await cascadeDeletionService.validateIntegrity();
    },
    onSuccess: (data) => {
      // Update cached validation result
      queryClient.setQueryData(integrityQueryKeys.lastValidation(), data);
      
      // If there are issues, show notification
      if (data.summary.failed > 0 || data.summary.warnings > 0) {
        // This would typically trigger a toast notification
        console.warn(`נמצאו ${data.summary.failed} שגיאות ו-${data.summary.warnings} אזהרות בבדיקת שלמות הנתונים`);
      }
    },
    onError: (error) => {
      console.error('Integrity validation failed:', error);
    },
  });

  const runValidation = useCallback(() => {
    return validationMutation.mutateAsync();
  }, [validationMutation]);

  // ==================== Repair Operations ====================

  const repairMutation = useMutation({
    mutationFn: async (options: RepairOptions = {}): Promise<RepairResult> => {
      return await cascadeDeletionService.repairIntegrity(options);
    },
    onMutate: async (options) => {
      // If not a dry run, show progress indication
      if (!options.dryRun) {
        console.log('מתחיל תיקון בעיות שלמות נתונים...');
      }
    },
    onSuccess: (data, options) => {
      if (options.dryRun) {
        console.log('תצוגה מקדימה של תיקון הושלמה');
      } else {
        console.log(`תיקון הושלם: ${data.summary.repaired} בעיות תוקנו`);
        
        // Invalidate validation to get fresh data
        queryClient.invalidateQueries({
          queryKey: integrityQueryKeys.validation(),
        });
      }
      
      // Add to repair history
      queryClient.invalidateQueries({
        queryKey: integrityQueryKeys.repairHistory(),
      });
    },
    onError: (error) => {
      console.error('Integrity repair failed:', error);
    },
  });

  const repairIssues = useCallback((options?: RepairOptions) => {
    return repairMutation.mutateAsync(options || {});
  }, [repairMutation]);

  const previewRepair = useCallback((options: Omit<RepairOptions, 'dryRun'> = {}) => {
    return repairMutation.mutateAsync({ ...options, dryRun: true });
  }, [repairMutation]);

  // ==================== Real-time Issue Notifications ====================

  useEffect(() => {
    const unsubscribe = cascadeWebSocket.subscribeToIntegrityIssues((issueData: IntegrityIssue) => {
      // Update cached data with new issue
      queryClient.setQueryData(integrityQueryKeys.lastValidation(), (oldData: ValidationResult | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          issues: [
            ...oldData.issues,
            {
              id: `${Date.now()}-${issueData.collection}`,
              type: 'real-time-issue',
              severity: issueData.severity,
              collection: issueData.collection,
              description: `נמצאו ${issueData.count} בעיות ב${issueData.collection}`,
              affectedRecords: issueData.count,
              fixable: issueData.fixable,
            },
          ],
          summary: {
            ...oldData.summary,
            failed: oldData.summary.failed + (issueData.severity === 'critical' || issueData.severity === 'high' ? 1 : 0),
            warnings: oldData.summary.warnings + (issueData.severity === 'medium' || issueData.severity === 'low' ? 1 : 0),
          },
        };
      });

      // Show notification based on severity
      if (issueData.severity === 'critical' || issueData.severity === 'high') {
        console.error(`בעיית שלמות נתונים חמורה: נמצאו ${issueData.count} בעיות ב${issueData.collection}`);
      } else {
        console.warn(`בעיית שלמות נתונים: נמצאו ${issueData.count} בעיות ב${issueData.collection}`);
      }
    });

    return unsubscribe;
  }, [queryClient]);

  // ==================== Computed Values ====================

  const validationData = validationQuery.data || null;
  const hasIssues = validationData ? 
    validationData.summary.failed > 0 || validationData.summary.warnings > 0 : false;
  
  const criticalIssues = validationData ? 
    validationData.issues.filter(issue => issue.severity === 'critical') : [];
  
  const fixableIssues = validationData ? 
    validationData.issues.filter(issue => issue.fixable) : [];

  return {
    // Validation operations
    runValidation,
    validation: validationData,
    isValidating: validationQuery.isLoading || validationMutation.isLoading,
    validationError: validationQuery.error || validationMutation.error,

    // Repair operations
    repairIssues,
    previewRepair,
    isRepairing: repairMutation.isLoading,
    repairError: repairMutation.error,
    repairResult: repairMutation.data,

    // Computed state
    hasIssues,
    criticalIssues,
    fixableIssues,
    
    // Status helpers
    isHealthy: validationData?.overallStatus === 'healthy',
    hasWarnings: validationData?.overallStatus === 'warnings',
    hasErrors: validationData?.overallStatus === 'errors' || validationData?.overallStatus === 'critical',
    isCritical: validationData?.overallStatus === 'critical',

    // Utility methods
    refetchValidation: () => validationQuery.refetch(),
    clearValidation: () => {
      queryClient.removeQueries({
        queryKey: integrityQueryKeys.validation(),
      });
    },
  };
}

// ==================== Integrity Issues List Hook ====================

export function useIntegrityIssues() {
  const queryClient = useQueryClient();
  
  // Get issues from the latest validation
  const validationData = queryClient.getQueryData<ValidationResult>(integrityQueryKeys.lastValidation());
  
  const issues = validationData?.issues || [];
  
  const issuesByCollection = issues.reduce((acc, issue) => {
    if (!acc[issue.collection]) {
      acc[issue.collection] = [];
    }
    acc[issue.collection].push(issue);
    return acc;
  }, {} as Record<string, typeof issues>);
  
  const issuesBySeverity = issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) {
      acc[issue.severity] = [];
    }
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, typeof issues>);

  return {
    issues,
    issuesByCollection,
    issuesBySeverity,
    totalIssues: issues.length,
    fixableCount: issues.filter(issue => issue.fixable).length,
    criticalCount: issues.filter(issue => issue.severity === 'critical').length,
    highCount: issues.filter(issue => issue.severity === 'high').length,
  };
}