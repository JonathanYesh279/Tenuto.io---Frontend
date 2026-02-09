/**
 * API Caching and Request Deduplication Service
 * 
 * Provides intelligent caching, request deduplication, and performance optimizations
 * for API calls to prevent redundant requests and improve loading times.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useQueryClient, useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query'
import apiService from './apiService'
import theoryEnrollmentService from './theoryEnrollmentService'

// Cache configuration
const CACHE_CONFIG = {
  // Static data that changes infrequently
  STATIC_DATA_STALE_TIME: 10 * 60 * 1000, // 10 minutes
  STATIC_DATA_CACHE_TIME: 30 * 60 * 1000, // 30 minutes
  
  // Dynamic data that changes more frequently
  DYNAMIC_DATA_STALE_TIME: 2 * 60 * 1000, // 2 minutes
  DYNAMIC_DATA_CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  
  // Real-time data
  REALTIME_DATA_STALE_TIME: 30 * 1000, // 30 seconds
  REALTIME_DATA_CACHE_TIME: 60 * 1000, // 1 minute
}

// Query keys for consistent caching
export const QUERY_KEYS = {
  // Students
  STUDENTS: ['students'],
  STUDENT: (id: string) => ['student', id],
  STUDENT_THEORY_LESSONS: (id: string) => ['student', id, 'theory-lessons'],
  STUDENT_ORCHESTRAS: (id: string) => ['student', id, 'orchestras'],
  STUDENT_SCHEDULE: (id: string) => ['student', id, 'schedule'],
  STUDENT_ATTENDANCE: (id: string) => ['student', id, 'attendance'],
  STUDENT_DOCUMENTS: (id: string) => ['student', id, 'documents'],
  
  // Teachers
  TEACHERS: ['teachers'],
  TEACHER: (id: string) => ['teacher', id],
  TEACHER_SCHEDULE: (id: string) => ['teacher', id, 'schedule'],
  
  // Theory Lessons
  THEORY_LESSONS: ['theory-lessons'],
  THEORY_LESSON: (id: string) => ['theory-lesson', id],
  
  // Orchestras
  ORCHESTRAS: ['orchestras'],
  ORCHESTRA: (id: string) => ['orchestra', id],
  
  // School Data (static)
  SCHOOL_YEARS: ['school-years'],
  HOLIDAYS: ['holidays'],
  INSTRUMENTS: ['instruments'],
}

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>()

/**
 * Deduplicates identical API requests
 */
function dedupeRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }
  
  const promise = requestFn()
    .finally(() => {
      pendingRequests.delete(key)
    })
  
  pendingRequests.set(key, promise)
  return promise
}

/**
 * Enhanced API service with caching and deduplication
 */
export const cachedApiService = {
  // Students
  students: {
    getAll: () => dedupeRequest('students-all', () => apiService.students.getAllStudents()),
    getById: (id: string) => dedupeRequest(`student-${id}`, () => apiService.students.getStudentById(id)),
    update: (id: string, data: any) => apiService.students.updateStudent(id, data),
  },
  
  // Teachers
  teachers: {
    getAll: () => dedupeRequest('teachers-all', () => apiService.teachers.getAllTeachers()),
    getById: (id: string) => dedupeRequest(`teacher-${id}`, () => apiService.teachers.getTeacherById(id)),
  },
  
  // Theory Lessons
  theoryLessons: {
    // getTheoryLessons returns { data: lessons[], pagination: {...} }, so extract the data array
    getAll: () => dedupeRequest('theory-lessons-all', async () => {
      const response = await apiService.theoryLessons.getTheoryLessons()
      // Handle both formats: direct array (legacy) or { data: [], pagination: {} }
      return Array.isArray(response) ? response : (response?.data || [])
    }),
    getById: (id: string) => dedupeRequest(`theory-lesson-${id}`, () => apiService.theoryLessons.getTheoryLessonById(id)),
    addStudent: (lessonId: string, studentId: string) =>
      theoryEnrollmentService.enrollStudent(lessonId, studentId, {
        method: 'manual',
        performedBy: 'teacher',
        reason: 'Manual enrollment'
      }),
    removeStudent: (lessonId: string, studentId: string) =>
      theoryEnrollmentService.unenrollStudent(lessonId, studentId, {
        reason: 'Manual unenrollment'
      }),
  },
  
  // Orchestras
  orchestras: {
    getAll: () => dedupeRequest('orchestras-all', () => apiService.orchestras.getAllOrchestras()),
    getById: (id: string) => dedupeRequest(`orchestra-${id}`, () => apiService.orchestras.getOrchestraById(id)),
  },
  
  // School Data
  schoolData: {
    getSchoolYears: () => dedupeRequest('school-years', () => apiService.schoolData?.getSchoolYears?.() || Promise.resolve([])),
    getHolidays: () => dedupeRequest('holidays', () => apiService.schoolData?.getHolidays?.() || Promise.resolve([])),
    getInstruments: () => dedupeRequest('instruments', () => apiService.schoolData?.getInstruments?.() || Promise.resolve([])),
  }
}

/**
 * Hook for cached student data with optimistic updates
 */
export function useStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.STUDENT(studentId || ''),
    queryFn: () => cachedApiService.students.getById(studentId!),
    enabled: !!studentId,
    staleTime: CACHE_CONFIG.DYNAMIC_DATA_STALE_TIME,
    gcTime: CACHE_CONFIG.DYNAMIC_DATA_CACHE_TIME,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for cached theory lessons with smart filtering
 */
export function useTheoryLessons() {
  return useQuery({
    queryKey: QUERY_KEYS.THEORY_LESSONS,
    queryFn: cachedApiService.theoryLessons.getAll,
    staleTime: CACHE_CONFIG.DYNAMIC_DATA_STALE_TIME,
    gcTime: CACHE_CONFIG.DYNAMIC_DATA_CACHE_TIME,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for student's enrolled theory lessons
 */
export function useStudentTheoryLessons(studentId: string | undefined) {
  const { data: allTheoryLessons = [] } = useTheoryLessons()
  const { data: student } = useStudent(studentId)

  return useMemo(() => {
    if (!studentId || !allTheoryLessons.length) return []

    // Check both lesson.studentIds and student.enrollments.theoryLessonIds for enrollment
    const enrolledTheoryLessonIds = student?.enrollments?.theoryLessonIds || []

    return allTheoryLessons.filter((lesson: any) =>
      lesson.studentIds?.includes(studentId) ||
      enrolledTheoryLessonIds.includes(lesson._id)
    )
  }, [allTheoryLessons, studentId, student?.enrollments?.theoryLessonIds])
}

/**
 * Hook for available (non-enrolled) theory lessons
 * Shows all non-enrolled lessons with compatibility flags (similar to OrchestraTab pattern)
 */
export function useAvailableTheoryLessons(studentId: string | undefined, studentGrade?: string, studentLevel?: string) {
  const { data: allTheoryLessons = [] } = useTheoryLessons()
  const { data: student } = useStudent(studentId)

  return useMemo(() => {
    if (!studentId || !allTheoryLessons.length) return []

    // Get enrolled theory lesson IDs from the correct path
    const enrolledTheoryLessonIds = student?.enrollments?.theoryLessonIds || []

    return allTheoryLessons
      .filter((lesson: any) => {
        // Only filter out already enrolled lessons
        const isEnrolled = lesson.studentIds?.includes(studentId) ||
                          enrolledTheoryLessonIds.includes(lesson._id)
        return !isEnrolled
      })
      .map((lesson: any) => {
        // Check if full
        const isFull = lesson.maxStudents && lesson.studentIds?.length >= lesson.maxStudents

        // Check grade compatibility
        const gradeCompatible = !lesson.targetGrades ||
                               lesson.targetGrades.length === 0 ||
                               lesson.targetGrades.includes(studentGrade)

        // Check level compatibility
        const levelCompatible = !lesson.level ||
                               lesson.level === studentLevel ||
                               lesson.level === 'all' ||
                               lesson.level === 'mixed'

        // Overall compatibility for enrollment
        const isCompatible = gradeCompatible && levelCompatible && !isFull

        return {
          ...lesson,
          isCompatible,
          gradeCompatible,
          levelCompatible,
          isFull,
          isEnrolled: false
        }
      })
  }, [allTheoryLessons, studentId, student?.enrollments?.theoryLessonIds, studentGrade, studentLevel])
}

/**
 * Hook for cached orchestras
 */
export function useOrchestras() {
  return useQuery({
    queryKey: QUERY_KEYS.ORCHESTRAS,
    queryFn: cachedApiService.orchestras.getAll,
    staleTime: CACHE_CONFIG.DYNAMIC_DATA_STALE_TIME,
    gcTime: CACHE_CONFIG.DYNAMIC_DATA_CACHE_TIME,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for student's enrolled orchestras
 */
export function useStudentOrchestras(studentId: string | undefined) {
  const { data: allOrchestras = [] } = useOrchestras()
  const { data: student } = useStudent(studentId)
  
  return useMemo(() => {
    if (!studentId || !allOrchestras.length) return []
    
    return allOrchestras.filter((orchestra: any) => 
      orchestra.memberIds?.includes(studentId) ||
      student?.orchestraIds?.includes(orchestra._id)
    )
  }, [allOrchestras, studentId, student?.orchestraIds])
}

/**
 * Hook for cached teachers
 */
export function useTeachers() {
  return useQuery({
    queryKey: QUERY_KEYS.TEACHERS,
    queryFn: cachedApiService.teachers.getAll,
    staleTime: CACHE_CONFIG.STATIC_DATA_STALE_TIME,
    gcTime: CACHE_CONFIG.STATIC_DATA_CACHE_TIME,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for cached teacher data
 */
export function useTeacher(teacherId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.TEACHER(teacherId || ''),
    queryFn: () => cachedApiService.teachers.getById(teacherId!),
    enabled: !!teacherId,
    staleTime: CACHE_CONFIG.DYNAMIC_DATA_STALE_TIME,
    gcTime: CACHE_CONFIG.DYNAMIC_DATA_CACHE_TIME,
    refetchOnWindowFocus: false,
  })
}

/**
 * Mutation hook for theory lesson enrollment with optimistic updates
 */
export function useTheoryLessonEnrollment(studentId: string) {
  const queryClient = useQueryClient()
  
  const enrollMutation = useMutation({
    mutationFn: ({ lessonId }: { lessonId: string }) => 
      cachedApiService.theoryLessons.addStudent(lessonId, studentId),
    onMutate: async ({ lessonId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.THEORY_LESSONS })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.STUDENT(studentId) })
      
      // Snapshot previous values
      const previousTheoryLessons = queryClient.getQueryData(QUERY_KEYS.THEORY_LESSONS)
      const previousStudent = queryClient.getQueryData(QUERY_KEYS.STUDENT(studentId))
      
      // Optimistically update theory lessons
      queryClient.setQueryData(QUERY_KEYS.THEORY_LESSONS, (old: any[]) => 
        old?.map(lesson => 
          lesson._id === lessonId 
            ? { ...lesson, studentIds: [...(lesson.studentIds || []), studentId] }
            : lesson
        ) || []
      )
      
      // Optimistically update student (use enrollments.theoryLessonIds path)
      queryClient.setQueryData(QUERY_KEYS.STUDENT(studentId), (old: any) =>
        old ? {
          ...old,
          enrollments: {
            ...old.enrollments,
            theoryLessonIds: [...(old.enrollments?.theoryLessonIds || []), lessonId]
          }
        } : old
      )

      return { previousTheoryLessons, previousStudent }
    },
    onError: (err, variables, context) => {
      // Revert on error
      if (context?.previousTheoryLessons) {
        queryClient.setQueryData(QUERY_KEYS.THEORY_LESSONS, context.previousTheoryLessons)
      }
      if (context?.previousStudent) {
        queryClient.setQueryData(QUERY_KEYS.STUDENT(studentId), context.previousStudent)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.THEORY_LESSONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT(studentId) })
    },
  })
  
  const unenrollMutation = useMutation({
    mutationFn: ({ lessonId }: { lessonId: string }) => 
      cachedApiService.theoryLessons.removeStudent(lessonId, studentId),
    onMutate: async ({ lessonId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.THEORY_LESSONS })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.STUDENT(studentId) })
      
      const previousTheoryLessons = queryClient.getQueryData(QUERY_KEYS.THEORY_LESSONS)
      const previousStudent = queryClient.getQueryData(QUERY_KEYS.STUDENT(studentId))
      
      // Optimistically update theory lessons
      queryClient.setQueryData(QUERY_KEYS.THEORY_LESSONS, (old: any[]) => 
        old?.map(lesson => 
          lesson._id === lessonId 
            ? { ...lesson, studentIds: lesson.studentIds?.filter((id: string) => id !== studentId) || [] }
            : lesson
        ) || []
      )
      
      // Optimistically update student (use enrollments.theoryLessonIds path)
      queryClient.setQueryData(QUERY_KEYS.STUDENT(studentId), (old: any) =>
        old ? {
          ...old,
          enrollments: {
            ...old.enrollments,
            theoryLessonIds: old.enrollments?.theoryLessonIds?.filter((id: string) => id !== lessonId) || []
          }
        } : old
      )

      return { previousTheoryLessons, previousStudent }
    },
    onError: (err, variables, context) => {
      if (context?.previousTheoryLessons) {
        queryClient.setQueryData(QUERY_KEYS.THEORY_LESSONS, context.previousTheoryLessons)
      }
      if (context?.previousStudent) {
        queryClient.setQueryData(QUERY_KEYS.STUDENT(studentId), context.previousStudent)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.THEORY_LESSONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT(studentId) })
    },
  })
  
  return {
    enroll: enrollMutation.mutate,
    unenroll: unenrollMutation.mutate,
    isEnrolling: enrollMutation.isPending,
    isUnenrolling: unenrollMutation.isPending,
    error: enrollMutation.error || unenrollMutation.error,
  }
}

/**
 * Hook for prefetching data
 */
export function usePrefetch() {
  const queryClient = useQueryClient()
  
  const prefetchStudent = useCallback((studentId: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.STUDENT(studentId),
      queryFn: () => cachedApiService.students.getById(studentId),
      staleTime: CACHE_CONFIG.DYNAMIC_DATA_STALE_TIME,
    })
  }, [queryClient])
  
  const prefetchTheoryLessons = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.THEORY_LESSONS,
      queryFn: cachedApiService.theoryLessons.getAll,
      staleTime: CACHE_CONFIG.DYNAMIC_DATA_STALE_TIME,
    })
  }, [queryClient])
  
  const prefetchOrchestras = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.ORCHESTRAS,
      queryFn: cachedApiService.orchestras.getAll,
      staleTime: CACHE_CONFIG.DYNAMIC_DATA_STALE_TIME,
    })
  }, [queryClient])
  
  return {
    prefetchStudent,
    prefetchTheoryLessons,
    prefetchOrchestras,
  }
}

/**
 * Cache management utilities
 */
export function useCacheManagement() {
  const queryClient = useQueryClient()
  
  const clearCache = useCallback(() => {
    queryClient.clear()
  }, [queryClient])
  
  const invalidateStudent = useCallback((studentId: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT(studentId) })
  }, [queryClient])
  
  const invalidateTheoryLessons = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.THEORY_LESSONS })
  }, [queryClient])
  
  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache()
    return {
      totalQueries: cache.getAll().length,
      cachedData: cache.getAll().reduce((acc, query) => {
        if (query.state.data) acc++
        return acc
      }, 0)
    }
  }, [queryClient])
  
  return {
    clearCache,
    invalidateStudent,
    invalidateTheoryLessons,
    getCacheStats,
  }
}