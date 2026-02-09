/**
 * Comprehensive Student Details Hooks
 * 
 * Custom hooks using TanStack Query for all student details data fetching
 * with proper caching, error handling, and real-time updates
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { studentDetailsApi, DataTransformUtils, requestDeduplicator, RetryUtils, ApiError } from '@/services/studentDetailsApi'
import { calendarDataProcessor } from '@/services/calendarDataProcessor'

// Types
interface QueryOptions {
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  refetchOnWindowFocus?: boolean
}

interface DateRange {
  from: Date
  to: Date
}

// Query Keys for consistent cache management
export const queryKeys = {
  students: {
    all: ['students'] as const,
    details: (studentId: string) => ['students', 'details', studentId] as const,
    schedule: (studentId: string) => ['students', 'schedule', studentId] as const,
    attendance: (studentId: string, dateRange?: DateRange) => 
      ['students', 'attendance', studentId, dateRange] as const,
    attendanceStats: (studentId: string, dateRange?: DateRange) => 
      ['students', 'attendanceStats', studentId, dateRange] as const,
    orchestras: (studentId: string) => ['students', 'orchestras', studentId] as const,
    theoryClasses: (studentId: string) => ['students', 'theoryClasses', studentId] as const,
    documents: (studentId: string) => ['students', 'documents', studentId] as const,
  }
}

// Main Student Details Hook
export function useStudentDetails(studentId: string, options: QueryOptions = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.students.details(studentId),
    queryFn: async () => {
      return requestDeduplicator.deduplicate(
        `student-details-${studentId}`,
        async () => {
          const data = await RetryUtils.withExponentialBackoff(
            () => studentDetailsApi.getStudentDetails(studentId)
          )
          return DataTransformUtils.transformHebrewDates(data)
        }
      )
    },
    enabled: !!studentId && (options.enabled !== false),
    staleTime: options.staleTime ?? 1 * 60 * 1000, // 1 minute
    gcTime: options.gcTime ?? 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    retry: (failureCount, error: any) => {
      const apiError = error as ApiError
      if (apiError.code === 'NOT_FOUND' || apiError.code === 'UNAUTHORIZED' || apiError.code === 'FORBIDDEN') {
        return false
      }
      return failureCount < 3
    },
  })

  // Prefetch related data on successful load
  useEffect(() => {
    if (query.data && !query.isLoading) {
      // Prefetch schedule and attendance stats
      queryClient.prefetchQuery({
        queryKey: queryKeys.students.schedule(studentId),
        queryFn: () => studentDetailsApi.getStudentSchedule(studentId),
        staleTime: 5 * 60 * 1000,
      })

      queryClient.prefetchQuery({
        queryKey: queryKeys.students.attendanceStats(studentId),
        queryFn: () => studentDetailsApi.getStudentAttendanceStats(studentId),
        staleTime: 2 * 60 * 1000,
      })
    }
  }, [query.data, query.isLoading, studentId, queryClient])

  return {
    student: query.data || null,
    isLoading: query.isLoading,
    error: query.error as ApiError | null,
    refetch: query.refetch,
    isFetching: query.isFetching,
    isError: query.isError,
  }
}

// Student Schedule Hook - now uses the calendar data processor
export function useStudentSchedule(studentId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.students.schedule(studentId),
    queryFn: async () => {
      // Use the calendar data processor to get properly formatted events
      const events = await calendarDataProcessor.getWeeklySchedule(studentId)
      return events
    },
    enabled: !!studentId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 3,
  })
}

// Student Attendance Hook with date range support
export function useStudentAttendance(studentId: string, dateRange?: DateRange) {
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [attendanceStats, setAttendanceStats] = useState(null)

  const recordsQuery = useQuery({
    queryKey: queryKeys.students.attendance(studentId, dateRange),
    queryFn: async () => {
      const data = await studentDetailsApi.getStudentAttendanceRecords(studentId, dateRange)
      return DataTransformUtils.transformHebrewDates(data)
    },
    enabled: !!studentId,
    staleTime: 1 * 60 * 1000, // 1 minute for fresh attendance data
    gcTime: 5 * 60 * 1000,
  })

  const statsQuery = useQuery({
    queryKey: queryKeys.students.attendanceStats(studentId, dateRange),
    queryFn: async () => {
      const data = await studentDetailsApi.getStudentAttendanceStats(studentId, dateRange)
      return data
    },
    enabled: !!studentId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (recordsQuery.data) {
      setAttendanceRecords(recordsQuery.data)
    }
  }, [recordsQuery.data])

  useEffect(() => {
    if (statsQuery.data) {
      setAttendanceStats(statsQuery.data)
    }
  }, [statsQuery.data])

  return {
    attendanceRecords,
    attendanceStats,
    isLoading: recordsQuery.isLoading || statsQuery.isLoading,
    error: recordsQuery.error || statsQuery.error,
    refetch: () => {
      recordsQuery.refetch()
      statsQuery.refetch()
    },
    isFetching: recordsQuery.isFetching || statsQuery.isFetching,
  }
}

// Student Orchestras Hook
export function useStudentOrchestras(studentId: string) {
  return useQuery({
    queryKey: queryKeys.students.orchestras(studentId),
    queryFn: async () => {
      const data = await studentDetailsApi.getStudentOrchestras(studentId)
      return DataTransformUtils.transformHebrewDates(data)
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Student Theory Classes Hook
export function useStudentTheoryClasses(studentId: string) {
  return useQuery({
    queryKey: queryKeys.students.theoryClasses(studentId),
    queryFn: async () => {
      const data = await studentDetailsApi.getStudentTheoryClasses(studentId)
      return DataTransformUtils.transformHebrewDates(data)
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Student Documents Hook with infinite query for large document lists
export function useStudentDocuments(studentId: string) {
  return useQuery({
    queryKey: queryKeys.students.documents(studentId),
    queryFn: async () => {
      const data = await studentDetailsApi.getStudentDocuments(studentId)
      return DataTransformUtils.transformHebrewDates(data)
    },
    enabled: !!studentId,
    staleTime: 10 * 60 * 1000, // Documents change less frequently
    gcTime: 15 * 60 * 1000,
  })
}

// File Upload Hook
export function useUploadStudentDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ studentId, file, category, description }: {
      studentId: string
      file: File
      category: string
      description?: string
    }) => {
      return studentDetailsApi.uploadStudentDocument(studentId, file, category, description)
    },
    onSuccess: (_, { studentId }) => {
      // Invalidate documents query to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.documents(studentId)
      })
    },
    onError: (error) => {
      console.error('Document upload failed:', error)
    }
  })
}

// File Download Hook
export function useDownloadStudentDocument() {
  return useMutation({
    mutationFn: async ({ studentId, documentId, filename }: {
      studentId: string
      documentId: string
      filename: string
    }) => {
      const blob = await studentDetailsApi.downloadStudentDocument(studentId, documentId)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return blob
    },
    onError: (error) => {
      console.error('Document download failed:', error)
    }
  })
}

// Delete Document Hook
export function useDeleteStudentDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ studentId, documentId }: {
      studentId: string
      documentId: string
    }) => {
      return studentDetailsApi.deleteStudentDocument(studentId, documentId)
    },
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.documents(studentId)
      })
    },
    onError: (error) => {
      console.error('Document deletion failed:', error)
    }
  })
}

// Update Personal Info Hook
export function useUpdateStudentPersonalInfo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ studentId, data }: {
      studentId: string
      data: any
    }) => {
      return studentDetailsApi.updateStudentPersonalInfo(studentId, data)
    },
    onMutate: async ({ studentId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.students.details(studentId) })
      
      // Snapshot previous value
      const previousStudent = queryClient.getQueryData(queryKeys.students.details(studentId))
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.students.details(studentId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          personalInfo: { ...old.personalInfo, ...data },
          updatedAt: new Date()
        }
      })
      
      return { previousStudent }
    },
    onError: (error, { studentId }, context) => {
      // Rollback on error
      if (context?.previousStudent) {
        queryClient.setQueryData(queryKeys.students.details(studentId), context.previousStudent)
      }
    },
    onSettled: (_, __, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.details(studentId) })
    }
  })
}

// Update Academic Info Hook
export function useUpdateStudentAcademicInfo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ studentId, data }: {
      studentId: string
      data: any
    }) => {
      return studentDetailsApi.updateStudentAcademicInfo(studentId, data)
    },
    onMutate: async ({ studentId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.students.details(studentId) })
      
      const previousStudent = queryClient.getQueryData(queryKeys.students.details(studentId))
      
      queryClient.setQueryData(queryKeys.students.details(studentId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          academicInfo: { ...old.academicInfo, ...data },
          updatedAt: new Date()
        }
      })
      
      return { previousStudent }
    },
    onError: (error, { studentId }, context) => {
      if (context?.previousStudent) {
        queryClient.setQueryData(queryKeys.students.details(studentId), context.previousStudent)
      }
    },
    onSettled: (_, __, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.details(studentId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.students.schedule(studentId) })
    }
  })
}

// Mark Attendance Hook
export function useMarkAttendance() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ studentId, lessonId, status, notes }: {
      studentId: string
      lessonId: string
      status: 'present' | 'absent' | 'excused' | 'late'
      notes?: string
    }) => {
      return studentDetailsApi.markAttendance(studentId, lessonId, status, notes)
    },
    onSuccess: (_, { studentId }) => {
      // Invalidate attendance-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.attendance(studentId)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.attendanceStats(studentId)
      })
    }
  })
}

// Prefetch Hook for performance optimization
export function usePrefetchStudentData() {
  const queryClient = useQueryClient()
  
  return useCallback((studentId: string) => {
    // Prefetch all student-related data
    const prefetchPromises = [
      queryClient.prefetchQuery({
        queryKey: queryKeys.students.details(studentId),
        queryFn: () => studentDetailsApi.getStudentDetails(studentId),
        staleTime: 1 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.students.schedule(studentId),
        queryFn: () => studentDetailsApi.getStudentSchedule(studentId),
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.students.attendanceStats(studentId),
        queryFn: () => studentDetailsApi.getStudentAttendanceStats(studentId),
        staleTime: 2 * 60 * 1000,
      }),
    ]
    
    return Promise.allSettled(prefetchPromises)
  }, [queryClient])
}

// Cache Invalidation Utilities
export function useInvalidateStudentQueries() {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all })
    },
    invalidateStudent: (studentId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.details(studentId) })
    },
    invalidateSchedule: (studentId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.schedule(studentId) })
    },
    invalidateAttendance: (studentId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.attendance(studentId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.students.attendanceStats(studentId) })
    },
    invalidateOrchestras: (studentId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.orchestras(studentId) })
    },
    invalidateTheory: (studentId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.theoryClasses(studentId) })
    },
    invalidateDocuments: (studentId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.documents(studentId) })
    }
  }
}

// Tab-specific data loading hook
export function useTabData(studentId: string, activeTab: string) {
  const [isTabLoading, setIsTabLoading] = useState(false)
  const queryClient = useQueryClient()

  // Preload data when tab becomes active
  useEffect(() => {
    if (!studentId || !activeTab) return

    setIsTabLoading(true)

    const loadTabData = async () => {
      try {
        switch (activeTab) {
          case 'schedule':
            await queryClient.ensureQueryData({
              queryKey: queryKeys.students.schedule(studentId),
              queryFn: () => studentDetailsApi.getStudentSchedule(studentId),
            })
            break
          case 'attendance':
            await Promise.all([
              queryClient.ensureQueryData({
                queryKey: queryKeys.students.attendance(studentId),
                queryFn: () => studentDetailsApi.getStudentAttendanceRecords(studentId),
              }),
              queryClient.ensureQueryData({
                queryKey: queryKeys.students.attendanceStats(studentId),
                queryFn: () => studentDetailsApi.getStudentAttendanceStats(studentId),
              }),
            ])
            break
          case 'orchestra':
            await queryClient.ensureQueryData({
              queryKey: queryKeys.students.orchestras(studentId),
              queryFn: () => studentDetailsApi.getStudentOrchestras(studentId),
            })
            break
          case 'theory':
            await queryClient.ensureQueryData({
              queryKey: queryKeys.students.theoryClasses(studentId),
              queryFn: () => studentDetailsApi.getStudentTheoryClasses(studentId),
            })
            break
          case 'documents':
            await queryClient.ensureQueryData({
              queryKey: queryKeys.students.documents(studentId),
              queryFn: () => studentDetailsApi.getStudentDocuments(studentId),
            })
            break
        }
      } catch (error) {
        console.error(`Failed to load data for tab ${activeTab}:`, error)
      } finally {
        setIsTabLoading(false)
      }
    }

    loadTabData()
  }, [studentId, activeTab, queryClient])

  return { isTabLoading }
}