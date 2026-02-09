/**
 * Student Details Feature Hooks
 * 
 * Comprehensive custom hooks using TanStack Query for data fetching and state management
 * with full error handling, real-time updates, file handling, and performance optimizations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import apiService from '@/services/apiService'
import { 
  StudentDetails, 
  StudentDetailsError, 
  UseStudentDetailsResult,
  UseStudentScheduleResult,
  UseStudentAttendanceResult,
  LessonSchedule,
  AttendanceRecord,
  AttendanceStatistics,
  EditPersonalInfoData,
  EditAcademicInfoData
} from '../types'

// Import all our comprehensive services
import {
  useStudentDetails as useEnhancedStudentDetails,
  useStudentSchedule as useEnhancedStudentSchedule,
  useStudentAttendance as useEnhancedStudentAttendance,
  useStudentOrchestras,
  useStudentTheoryClasses,
  useStudentDocuments,
  useUploadStudentDocument,
  useDownloadStudentDocument,
  useDeleteStudentDocument,
  useUpdateStudentPersonalInfo as useEnhancedUpdatePersonalInfo,
  useUpdateStudentAcademicInfo as useEnhancedUpdateAcademicInfo,
  useMarkAttendance,
  usePrefetchStudentData,
  useInvalidateStudentQueries,
  useTabData,
  queryKeys
} from './useStudentDetailsHooks'

import { useWebSocketUpdates, useBroadcastUpdate } from '@/services/websocketService'
import { useErrorHandler } from '@/services/errorHandler'
import { 
  useFileUpload, 
  useFileDownload, 
  useMultipleFileUpload,
  FILE_CATEGORIES,
  type FileCategory 
} from '@/services/fileHandlingService'
import { 
  usePerformanceOptimizations,
  SmartLoadingState,
  SkeletonComponents,
  withSuspense,
  withMemo
} from '@/services/performanceOptimizations'

// Re-export enhanced query keys
export { queryKeys as studentDetailsQueryKeys } from './useStudentDetailsHooks'

// Re-export file categories and performance utilities
export { FILE_CATEGORIES, type FileCategory } from '@/services/fileHandlingService'
export { 
  SmartLoadingState, 
  SkeletonComponents, 
  withSuspense, 
  withMemo 
} from '@/services/performanceOptimizations'

/**
 * Main hook that combines enhanced student details with real-time updates
 */
export function useStudentDetails(studentId: string, options?: { enabled?: boolean }): UseStudentDetailsResult {
  const { handleError } = useErrorHandler()
  
  // Use enhanced hook with all features
  const result = useEnhancedStudentDetails(studentId, options)
  
  // Add real-time updates
  useWebSocketUpdates(studentId)
  
  // Add performance monitoring
  const { prefetchOnHover } = usePerformanceOptimizations()
  
  // Handle errors with centralized error handler
  useEffect(() => {
    if (result.error) {
      handleError(result.error, 'student-details-fetch')
    }
  }, [result.error, handleError])
  
  return {
    ...result,
    prefetchRelated: () => prefetchOnHover(studentId)
  }
}

/**
 * Enhanced schedule hook with real-time updates
 */
export function useStudentSchedule(studentId: string, enabled: boolean = true): UseStudentScheduleResult {
  const { handleError } = useErrorHandler()
  const result = useEnhancedStudentSchedule(studentId, enabled)
  
  useEffect(() => {
    if (result.error) {
      handleError(result.error, 'student-schedule-fetch')
    }
  }, [result.error, handleError])
  
  return result
}

/**
 * Enhanced attendance hook with real-time updates and date range support
 */
export function useStudentAttendance(
  studentId: string, 
  dateRange?: { from: Date; to: Date }
): UseStudentAttendanceResult {
  const { handleError } = useErrorHandler()
  const result = useEnhancedStudentAttendance(studentId, dateRange)
  
  useEffect(() => {
    if (result.error) {
      handleError(result.error, 'student-attendance-fetch')
    }
  }, [result.error, handleError])
  
  return result
}

/**
 * Enhanced personal info update hook with optimistic updates and broadcasting
 */
export function useUpdateStudentPersonalInfo() {
  const { handleError } = useErrorHandler()
  const { broadcastStudentUpdate } = useBroadcastUpdate()
  const mutation = useEnhancedUpdatePersonalInfo()
  
  return {
    ...mutation,
    mutateAsync: async (variables: { studentId: string, data: EditPersonalInfoData }) => {
      try {
        const result = await mutation.mutateAsync(variables)
        
        // Broadcast update to other clients
        broadcastStudentUpdate(variables.studentId, 'personalInfo', variables.data)
        
        return result
      } catch (error) {
        handleError(error, 'student-personal-info-update')
        throw error
      }
    }
  }
}

/**
 * Enhanced academic info update hook with optimistic updates and broadcasting
 */
export function useUpdateStudentAcademicInfo() {
  const { handleError } = useErrorHandler()
  const { broadcastStudentUpdate } = useBroadcastUpdate()
  const mutation = useEnhancedUpdateAcademicInfo()
  
  return {
    ...mutation,
    mutateAsync: async (variables: { studentId: string, data: EditAcademicInfoData }) => {
      try {
        const result = await mutation.mutateAsync(variables)
        
        // Broadcast update to other clients
        broadcastStudentUpdate(variables.studentId, 'academicInfo', variables.data)
        
        return result
      } catch (error) {
        handleError(error, 'student-academic-info-update')
        throw error
      }
    }
  }
}

// Re-export enhanced hooks with additional functionality
export { 
  useStudentOrchestras,
  useStudentTheoryClasses,
  useStudentDocuments,
  useMarkAttendance,
  useTabData
} from './useStudentDetailsHooks'

// Re-export file handling hooks
export {
  useFileUpload,
  useFileDownload,
  useMultipleFileUpload
} from '@/services/fileHandlingService'

// Enhanced prefetch hook
export function usePrefetchStudentDetails() {
  return usePrefetchStudentData()
}

// Re-export invalidation utilities
export { useInvalidateStudentQueries as useInvalidateStudentDetails } from './useStudentDetailsHooks'

/**
 * Comprehensive hook that provides all student details functionality
 * This is the main hook components should use for complete functionality
 */
export function useStudentDetailsComplete(studentId: string) {
  const studentDetails = useStudentDetails(studentId)
  const schedule = useStudentSchedule(studentId, !!studentDetails.student)
  const attendance = useStudentAttendance(studentId)
  const orchestras = useStudentOrchestras(studentId)
  const theoryClasses = useStudentTheoryClasses(studentId)
  const documents = useStudentDocuments(studentId)
  
  const updatePersonalInfo = useUpdateStudentPersonalInfo()
  const updateAcademicInfo = useUpdateStudentAcademicInfo()
  const markAttendance = useMarkAttendance()
  
  const fileUpload = useFileUpload()
  const fileDownload = useFileDownload()
  
  const invalidateQueries = useInvalidateStudentQueries()
  const { prefetchTabData } = usePerformanceOptimizations()
  
  return {
    // Data
    student: studentDetails.student,
    schedule: schedule.data || [],
    attendance,
    orchestras: orchestras.data || [],
    theoryClasses: theoryClasses.data || [],
    documents: documents.data || [],
    
    // Loading states
    isLoading: {
      student: studentDetails.isLoading,
      schedule: schedule.isLoading,
      attendance: attendance.isLoading,
      orchestras: orchestras.isLoading,
      theoryClasses: theoryClasses.isLoading,
      documents: documents.isLoading
    },
    
    // Errors
    errors: {
      student: studentDetails.error,
      schedule: schedule.error,
      attendance: attendance.error,
      orchestras: orchestras.error,
      theoryClasses: theoryClasses.error,
      documents: documents.error
    },
    
    // Actions
    actions: {
      updatePersonalInfo: updatePersonalInfo.mutateAsync,
      updateAcademicInfo: updateAcademicInfo.mutateAsync,
      markAttendance: markAttendance.mutateAsync,
      uploadFile: fileUpload.uploadFile,
      downloadFile: fileDownload.downloadFile,
      refetchAll: () => {
        studentDetails.refetch()
        schedule.refetch()
        attendance.refetch()
        orchestras.refetch()
        theoryClasses.refetch()
        documents.refetch()
      },
      invalidateQueries,
      prefetchTabData: (tabId: string) => prefetchTabData(studentId, tabId)
    },
    
    // File handling
    fileHandling: {
      upload: fileUpload,
      download: fileDownload
    }
  }
}