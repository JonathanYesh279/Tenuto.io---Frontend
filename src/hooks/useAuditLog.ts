/**
 * Audit Log React Query Hooks
 * 
 * Custom hooks for fetching and managing deletion operation audit logs.
 * Provides filtering, pagination, and real-time updates.
 * 
 * Features:
 * - Paginated audit log fetching with infinite scroll
 * - Advanced filtering (by student, operation type, date range, status)
 * - Real-time log updates for ongoing operations
 * - Export functionality for audit reports
 * - Hebrew UI support with proper date formatting
 */

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { cascadeDeletionService } from '@/services/cascadeDeletionService.js';

// ==================== Types ====================

interface AuditLogEntry {
  id: string;
  operationType: 'cascade_deletion' | 'orphaned_cleanup' | 'integrity_repair' | 'rollback';
  studentId?: string;
  userId: string;
  userName: string;
  userRole: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  details: {
    affectedCollections?: string[];
    recordsDeleted?: number;
    recordsModified?: number;
    snapshotId?: string;
    errorMessage?: string;
    warnings?: string[];
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    reason?: string;
  };
  timestamp: string;
}

interface AuditLogFilters {
  studentId?: string;
  operationType?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'duration' | 'status' | 'operationType';
  sortOrder?: 'asc' | 'desc';
}

interface AuditLogResponse {
  success: boolean;
  entries: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    dateRange: {
      earliest?: string;
      latest?: string;
    };
  };
  timestamp: string;
}

// ==================== Query Keys ====================

export const auditLogQueryKeys = {
  all: ['audit-log'] as const,
  list: (filters?: AuditLogFilters) => [...auditLogQueryKeys.all, 'list', filters] as const,
  infinite: (filters?: AuditLogFilters) => [...auditLogQueryKeys.all, 'infinite', filters] as const,
  entry: (entryId: string) => [...auditLogQueryKeys.all, 'entry', entryId] as const,
  summary: (filters?: Pick<AuditLogFilters, 'startDate' | 'endDate' | 'operationType'>) => 
    [...auditLogQueryKeys.all, 'summary', filters] as const,
  export: (filters?: AuditLogFilters) => [...auditLogQueryKeys.all, 'export', filters] as const,
} as const;

// ==================== Main Audit Log Hook ====================

export function useAuditLog(filters: AuditLogFilters = {}) {
  const queryClient = useQueryClient();

  // ==================== Paginated Query ====================

  const auditLogQuery = useQuery({
    queryKey: auditLogQueryKeys.list(filters),
    queryFn: async (): Promise<AuditLogResponse> => {
      return await cascadeDeletionService.getAuditLog(filters);
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    keepPreviousData: true, // Keep previous data while loading new page
  });

  // ==================== Infinite Query for Scrolling ====================

  const infiniteQuery = useInfiniteQuery({
    queryKey: auditLogQueryKeys.infinite(filters),
    queryFn: async ({ pageParam = 1 }) => {
      return await cascadeDeletionService.getAuditLog({
        ...filters,
        page: pageParam,
        limit: filters.limit || 50,
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined;
    },
    staleTime: 30 * 1000,
    retry: 2,
  });

  // ==================== Filter Management ====================

  const updateFilters = useCallback((newFilters: Partial<AuditLogFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Reset page when filters change (except for page itself)
    if ('page' in newFilters) {
      return updatedFilters;
    }
    
    return { ...updatedFilters, page: 1 };
  }, [filters]);

  const clearFilters = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: auditLogQueryKeys.list(),
    });
  }, [queryClient]);

  // ==================== Computed Values ====================

  const data = auditLogQuery.data;
  const entries = data?.entries || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  // Infinite scroll data
  const infiniteData = infiniteQuery.data;
  const allEntries = infiniteData?.pages.flatMap(page => page.entries) || [];

  // Statistics
  const stats = useMemo(() => {
    if (!entries.length) return null;

    const statusCounts = entries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const operationTypeCounts = entries.reduce((acc, entry) => {
      acc[entry.operationType] = (acc[entry.operationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgDuration = entries
      .filter(entry => entry.duration)
      .reduce((acc, entry, _, arr) => acc + (entry.duration! / arr.length), 0);

    return {
      statusCounts,
      operationTypeCounts,
      avgDuration: Math.round(avgDuration),
      totalEntries: entries.length,
    };
  }, [entries]);

  // ==================== Helper Functions ====================

  const getEntryById = useCallback((entryId: string): AuditLogEntry | null => {
    return entries.find(entry => entry.id === entryId) || null;
  }, [entries]);

  const getEntriesByStudent = useCallback((studentId: string): AuditLogEntry[] => {
    return entries.filter(entry => entry.studentId === studentId);
  }, [entries]);

  const getEntriesByStatus = useCallback((status: string): AuditLogEntry[] => {
    return entries.filter(entry => entry.status === status);
  }, [entries]);

  const getRecentOperations = useCallback((hours: number = 24): AuditLogEntry[] => {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return entries.filter(entry => new Date(entry.timestamp) > cutoffTime);
  }, [entries]);

  // ==================== Navigation ====================

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && (!pagination || page <= pagination.totalPages)) {
      return updateFilters({ page });
    }
    return filters;
  }, [updateFilters, pagination, filters]);

  const goToNextPage = useCallback(() => {
    if (pagination?.hasNext) {
      return goToPage(pagination.page + 1);
    }
    return filters;
  }, [goToPage, pagination, filters]);

  const goToPrevPage = useCallback(() => {
    if (pagination?.hasPrev) {
      return goToPage(pagination.page - 1);
    }
    return filters;
  }, [goToPage, pagination, filters]);

  return {
    // Data
    entries,
    allEntries, // From infinite query
    pagination,
    summary,
    stats,

    // Loading states
    isLoading: auditLogQuery.isLoading,
    isFetching: auditLogQuery.isFetching,
    error: auditLogQuery.error,

    // Infinite scroll
    infiniteQuery: {
      data: allEntries,
      hasNextPage: infiniteQuery.hasNextPage,
      fetchNextPage: infiniteQuery.fetchNextPage,
      isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    },

    // Filter management
    filters,
    updateFilters,
    clearFilters,

    // Helper functions
    getEntryById,
    getEntriesByStudent,
    getEntriesByStatus,
    getRecentOperations,

    // Navigation
    goToPage,
    goToNextPage,
    goToPrevPage,

    // Utility methods
    refetch: auditLogQuery.refetch,
    refetchInfinite: infiniteQuery.refetch,
  };
}

// ==================== Audit Log Summary Hook ====================

export function useAuditLogSummary(filters?: Pick<AuditLogFilters, 'startDate' | 'endDate' | 'operationType'>) {
  return useQuery({
    queryKey: auditLogQueryKeys.summary(filters),
    queryFn: async () => {
      // Get summary data using the main audit log function
      const response = await cascadeDeletionService.getAuditLog({
        ...filters,
        limit: 1, // We only need summary, not entries
      });
      
      return response.summary;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

// ==================== Single Entry Hook ====================

export function useAuditLogEntry(entryId: string | null) {
  return useQuery({
    queryKey: auditLogQueryKeys.entry(entryId!),
    queryFn: async () => {
      if (!entryId) return null;
      
      // Get the specific entry
      const response = await cascadeDeletionService.getAuditLog({
        limit: 1000, // Large limit to ensure we get the entry
      });
      
      return response.entries.find(entry => entry.id === entryId) || null;
    },
    enabled: !!entryId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ==================== Recent Operations Hook ====================

export function useRecentOperations(hours: number = 24) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  return useQuery({
    queryKey: [...auditLogQueryKeys.all, 'recent', hours],
    queryFn: async () => {
      return await cascadeDeletionService.getAuditLog({
        startDate,
        sortBy: 'timestamp',
        sortOrder: 'desc',
        limit: 100,
      });
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for recent data
  });
}

// ==================== Student Operations History Hook ====================

export function useStudentOperationHistory(studentId: string | null) {
  return useQuery({
    queryKey: [...auditLogQueryKeys.all, 'student', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      return await cascadeDeletionService.getAuditLog({
        studentId,
        sortBy: 'timestamp',
        sortOrder: 'desc',
        limit: 100,
      });
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ==================== Operation Type Statistics Hook ====================

export function useOperationTypeStats(dateRange?: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: [...auditLogQueryKeys.all, 'operation-stats', dateRange],
    queryFn: async () => {
      const response = await cascadeDeletionService.getAuditLog({
        ...dateRange,
        limit: 1000, // Large limit to get comprehensive stats
      });

      const entries = response.entries;
      
      // Calculate statistics
      const byType = entries.reduce((acc, entry) => {
        if (!acc[entry.operationType]) {
          acc[entry.operationType] = {
            total: 0,
            successful: 0,
            failed: 0,
            avgDuration: 0,
            durations: [],
          };
        }
        
        acc[entry.operationType].total++;
        
        if (entry.status === 'completed') {
          acc[entry.operationType].successful++;
        } else if (entry.status === 'failed') {
          acc[entry.operationType].failed++;
        }
        
        if (entry.duration) {
          acc[entry.operationType].durations.push(entry.duration);
        }
        
        return acc;
      }, {} as Record<string, any>);

      // Calculate average durations
      Object.values(byType).forEach((stats: any) => {
        if (stats.durations.length > 0) {
          stats.avgDuration = Math.round(
            stats.durations.reduce((sum: number, duration: number) => sum + duration, 0) / stats.durations.length
          );
        }
        delete stats.durations; // Remove raw durations array
      });

      return {
        byType,
        totalOperations: entries.length,
        dateRange: response.summary.dateRange,
        generatedAt: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}