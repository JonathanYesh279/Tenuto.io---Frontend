/**
 * Teacher Details Hooks
 * 
 * React hooks using TanStack Query for teacher details data fetching
 * with proper caching, error handling, and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { teacherDetailsApi, TeacherDataTransformUtils } from '@/services/teacherDetailsApi'
import { 
  TeacherDetails, 
  TeacherStatistics, 
  CreateTimeBlockData, 
  UpdateTimeBlockData,
  ScheduleLessonData,
  TeacherDetailsError,
  TeacherFilterOptions
} from '../types'
import toast from 'react-hot-toast'
import { getDisplayName } from '../../../../utils/nameUtils'

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
export const teacherQueryKeys = {
  teachers: {
    all: ['teachers'] as const,
    filtered: (filters: TeacherFilterOptions) => ['teachers', 'filtered', filters] as const,
    details: (teacherId: string) => ['teachers', 'details', teacherId] as const,
    students: (teacherId: string) => ['teachers', 'students', teacherId] as const,
    schedule: (teacherId: string) => ['teachers', 'schedule', teacherId] as const,
    statistics: (teacherId: string, dateRange?: DateRange) => 
      ['teachers', 'statistics', teacherId, dateRange] as const,
    availability: (teacherId: string, day: string) => 
      ['teachers', 'availability', teacherId, day] as const,
  }
}

/**
 * Main Teacher Details Hook
 */
export function useTeacherDetails(teacherId: string, options: QueryOptions = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: teacherQueryKeys.teachers.details(teacherId),
    queryFn: async () => {
      const data = await teacherDetailsApi.getTeacherDetails(teacherId)
      return TeacherDataTransformUtils.transformHebrewDates(data)
    },
    enabled: !!teacherId && (options.enabled !== false),
    staleTime: options.staleTime ?? 2 * 60 * 1000, // 2 minutes
    gcTime: options.gcTime ?? 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    retry: (failureCount, error: any) => {
      const apiError = error as TeacherDetailsError
      if (apiError.code === 'NOT_FOUND' || apiError.code === 'UNAUTHORIZED' || apiError.code === 'FORBIDDEN') {
        return false
      }
      return failureCount < 3
    },
  })

  // Prefetch related data on successful load
  useEffect(() => {
    if (query.data && !query.isLoading) {
      // Prefetch students and statistics
      queryClient.prefetchQuery({
        queryKey: teacherQueryKeys.teachers.students(teacherId),
        queryFn: () => teacherDetailsApi.getTeacherStudents(teacherId),
        staleTime: 5 * 60 * 1000,
      })

      queryClient.prefetchQuery({
        queryKey: teacherQueryKeys.teachers.statistics(teacherId),
        queryFn: () => teacherDetailsApi.getTeacherStatistics(teacherId),
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [query.data, query.isLoading, teacherId, queryClient])

  return {
    teacher: query.data || null,
    isLoading: query.isLoading,
    error: query.error as TeacherDetailsError | null,
    refetch: query.refetch,
    isFetching: query.isFetching,
    isError: query.isError,
  }
}

/**
 * Teacher Students Hook
 */
export function useTeacherStudents(teacherId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: teacherQueryKeys.teachers.students(teacherId),
    queryFn: async () => {
      const data = await teacherDetailsApi.getTeacherStudents(teacherId)
      return TeacherDataTransformUtils.transformHebrewDates(data)
    },
    enabled: !!teacherId && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000,
    retry: 2,
  })
}

/**
 * Teacher Schedule Hook
 */
export function useTeacherSchedule(teacherId: string, enabled: boolean = true) {
  const query = useQuery({
    queryKey: teacherQueryKeys.teachers.schedule(teacherId),
    queryFn: async () => {
      const teacher = await teacherDetailsApi.getTeacherDetails(teacherId)
      
      // Transform the schedule data for UI consumption
      const timeBlocks = TeacherDataTransformUtils.sortTimeBlocks(teacher.teaching?.timeBlocks || [])
      const assignedLessons = timeBlocks.flatMap(block =>
        (block.assignedLessons || []).filter(l => l.isActive !== false)
      )

      return {
        teacherId,
        teacherName: getDisplayName(teacher.personalInfo) || 'Unknown',
        timeBlocks,
        scheduledLessons: assignedLessons,
        weeklyCapacity: timeBlocks.reduce((total, block) => total + block.totalDuration, 0) / 60,
        utilizationRate: TeacherDataTransformUtils.calculateTeachingHours(assignedLessons)
      }
    },
    enabled: !!teacherId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
  })

  return {
    schedule: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Teacher Statistics Hook
 */
export function useTeacherStatistics(teacherId: string, dateRange?: DateRange) {
  const [currentDateRange, setCurrentDateRange] = useState<DateRange>(
    dateRange || {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date()
    }
  )

  const query = useQuery({
    queryKey: teacherQueryKeys.teachers.statistics(teacherId, currentDateRange),
    queryFn: async () => {
      const data = await teacherDetailsApi.getTeacherStatistics(teacherId, currentDateRange)
      return data
    },
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
    retry: 2,
  })

  return {
    statistics: query.data,
    isLoading: query.isLoading,
    error: query.error,
    dateRange: currentDateRange,
    setDateRange: setCurrentDateRange,
    refetch: query.refetch,
  }
}

/**
 * All Teachers Hook (for listing/filtering)
 */
export function useAllTeachers(filterBy: TeacherFilterOptions = {}) {
  return useQuery({
    queryKey: teacherQueryKeys.teachers.filtered(filterBy),
    queryFn: () => teacherDetailsApi.getAllTeachers(filterBy),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
    retry: 2,
  })
}

/**
 * Update Teacher Personal Info Hook
 */
export function useUpdateTeacherPersonalInfo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ teacherId, data }: {
      teacherId: string
      data: any
    }) => {
      return teacherDetailsApi.updateTeacherPersonalInfo(teacherId, data)
    },
    onMutate: async ({ teacherId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
      
      // Snapshot previous value
      const previousTeacher = queryClient.getQueryData(teacherQueryKeys.teachers.details(teacherId))
      
      // Optimistically update
      queryClient.setQueryData(teacherQueryKeys.teachers.details(teacherId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          personalInfo: { ...old.personalInfo, ...data },
          updatedAt: new Date()
        }
      })
      
      return { previousTeacher }
    },
    onError: (error, { teacherId }, context) => {
      // Rollback on error
      if (context?.previousTeacher) {
        queryClient.setQueryData(teacherQueryKeys.teachers.details(teacherId), context.previousTeacher)
      }
      
      const apiError = error as TeacherDetailsError
      if (apiError.code === 'DUPLICATE_TEACHER_DETECTED') {
        toast.error('מורה עם פרטים אלו כבר קיים במערכת')
      } else {
        toast.error(apiError.message || 'שגיאה בעדכון פרטי המורה')
      }
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
      toast.success('פרטי המורה עודכנו בהצלחה')
    }
  })
}

/**
 * Update Teacher Professional Info Hook
 */
export function useUpdateTeacherProfessionalInfo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ teacherId, data }: {
      teacherId: string
      data: any
    }) => {
      return teacherDetailsApi.updateTeacherProfessionalInfo(teacherId, data)
    },
    onMutate: async ({ teacherId, data }) => {
      await queryClient.cancelQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
      
      const previousTeacher = queryClient.getQueryData(teacherQueryKeys.teachers.details(teacherId))
      
      queryClient.setQueryData(teacherQueryKeys.teachers.details(teacherId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          professionalInfo: { ...old.professionalInfo, ...data.professionalInfo },
          roles: data.roles || old.roles,
          updatedAt: new Date()
        }
      })
      
      return { previousTeacher }
    },
    onError: (error, { teacherId }, context) => {
      if (context?.previousTeacher) {
        queryClient.setQueryData(teacherQueryKeys.teachers.details(teacherId), context.previousTeacher)
      }
      toast.error('שגיאה בעדכון המידע המקצועי')
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
      toast.success('המידע המקצועי עודכן בהצלחה')
    }
  })
}

/**
 * Add Time Block Hook
 */
export function useAddTimeBlock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ teacherId, timeBlockData }: {
      teacherId: string
      timeBlockData: CreateTimeBlockData
    }) => {
      return teacherDetailsApi.addTimeBlock(teacherId, timeBlockData)
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.schedule(teacherId) })
      toast.success('בלוק זמן נוסף בהצלחה')
    },
    onError: (error) => {
      const apiError = error as TeacherDetailsError
      toast.error(apiError.message || 'שגיאה בהוספת בלוק הזמן')
    }
  })
}

/**
 * Update Time Block Hook
 */
export function useUpdateTimeBlock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ teacherId, timeBlockId, timeBlockData }: {
      teacherId: string
      timeBlockId: string
      timeBlockData: UpdateTimeBlockData
    }) => {
      return teacherDetailsApi.updateTimeBlock(teacherId, timeBlockId, timeBlockData)
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.schedule(teacherId) })
      toast.success('בלוק הזמן עודכן בהצלחה')
    },
    onError: (error) => {
      const apiError = error as TeacherDetailsError
      toast.error(apiError.message || 'שגיאה בעדכון בלוק הזמן')
    }
  })
}

/**
 * Remove Time Block Hook
 */
export function useRemoveTimeBlock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ teacherId, timeBlockId }: {
      teacherId: string
      timeBlockId: string
    }) => {
      return teacherDetailsApi.removeTimeBlock(teacherId, timeBlockId)
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.schedule(teacherId) })
      toast.success('בלוק הזמן הוסר בהצלחה')
    },
    onError: (error) => {
      const apiError = error as TeacherDetailsError
      toast.error(apiError.message || 'שגיאה בהסרת בלוק הזמן')
    }
  })
}

/**
 * Add Student to Teacher Hook
 */
export function useAddStudentToTeacher() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ teacherId, studentId }: {
      teacherId: string
      studentId: string
    }) => {
      return teacherDetailsApi.addStudentToTeacher(teacherId, studentId)
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.students(teacherId) })
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.statistics(teacherId) })
      toast.success('התלמיד נוסף למורה בהצלחה')
    },
    onError: (error) => {
      const apiError = error as TeacherDetailsError
      toast.error(apiError.message || 'שגיאה בהוספת התלמיד')
    }
  })
}

/**
 * Remove Student from Teacher Hook
 */
export function useRemoveStudentFromTeacher() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ teacherId, studentId }: {
      teacherId: string
      studentId: string
    }) => {
      return teacherDetailsApi.removeStudentFromTeacher(teacherId, studentId)
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.students(teacherId) })
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.statistics(teacherId) })
      toast.success('התלמיד הוסר מהמורה בהצלחה')
    },
    onError: (error) => {
      const apiError = error as TeacherDetailsError
      toast.error(apiError.message || 'שגיאה בהסרת התלמיד')
    }
  })
}

/**
 * Schedule Lesson Hook
 */
export function useScheduleLesson() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ teacherId, lessonData }: {
      teacherId: string
      lessonData: ScheduleLessonData
    }) => {
      return teacherDetailsApi.updateTeacherSchedule(teacherId, lessonData)
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.schedule(teacherId) })
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.students(teacherId) })
      toast.success('השיעור נוסף ללוח הזמנים בהצלחה')
    },
    onError: (error) => {
      const apiError = error as TeacherDetailsError
      toast.error(apiError.message || 'שגיאה בתזמון השיעור')
    }
  })
}

/**
 * Create Teacher Hook
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ teacherData, adminId }: {
      teacherData: any
      adminId?: string
    }) => {
      return teacherDetailsApi.createTeacher(teacherData, adminId)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.all })
      
      // Show success message with invitation info
      if (data.invitationInfo?.mode === 'DEFAULT_PASSWORD') {
        toast.success(`מורה נוסף בהצלחה! סיסמה זמנית: ${data.invitationInfo.defaultPassword}`)
      } else {
        toast.success('מורה נוסף בהצלחה! הודעת הזמנה נשלחה במייל')
      }
      
      // Show warnings if duplicates were detected but allowed
      if (data.warnings) {
        toast.warning(data.warnings.message || 'זוהו רישומים דומים במערכת')
      }
    },
    onError: (error) => {
      const apiError = error as TeacherDetailsError
      if (apiError.code === 'DUPLICATE_TEACHER_DETECTED') {
        const duplicateInfo = apiError.duplicateInfo
        toast.error(`${apiError.message}\nנמצאו ${duplicateInfo?.totalDuplicatesFound} רישומים דומים`)
      } else {
        toast.error(apiError.message || 'שגיאה ביצירת המורה')
      }
    }
  })
}

/**
 * Deactivate Teacher Hook
 */
export function useDeactivateTeacher() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ teacherId }: { teacherId: string }) => {
      return teacherDetailsApi.deactivateTeacher(teacherId)
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.all })
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
      toast.success('המורה הוסר מהמערכת')
    },
    onError: (error) => {
      const apiError = error as TeacherDetailsError
      toast.error(apiError.message || 'שגיאה בהסרת המורה')
    }
  })
}

/**
 * Prefetch Teacher Data Hook (for performance optimization)
 */
export function usePrefetchTeacherData() {
  const queryClient = useQueryClient()
  
  return useCallback((teacherId: string) => {
    // Prefetch all teacher-related data
    const prefetchPromises = [
      queryClient.prefetchQuery({
        queryKey: teacherQueryKeys.teachers.details(teacherId),
        queryFn: () => teacherDetailsApi.getTeacherDetails(teacherId),
        staleTime: 2 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: teacherQueryKeys.teachers.students(teacherId),
        queryFn: () => teacherDetailsApi.getTeacherStudents(teacherId),
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: teacherQueryKeys.teachers.statistics(teacherId),
        queryFn: () => teacherDetailsApi.getTeacherStatistics(teacherId),
        staleTime: 5 * 60 * 1000,
      }),
    ]
    
    return Promise.allSettled(prefetchPromises)
  }, [queryClient])
}

/**
 * Cache Invalidation Utilities
 */
export function useInvalidateTeacherQueries() {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.all })
    },
    invalidateTeacher: (teacherId: string) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.details(teacherId) })
    },
    invalidateSchedule: (teacherId: string) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.schedule(teacherId) })
    },
    invalidateStudents: (teacherId: string) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.students(teacherId) })
    },
    invalidateStatistics: (teacherId: string) => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.teachers.statistics(teacherId) })
    }
  }
}

/**
 * Tab-specific data loading hook
 */
export function useTeacherTabData(teacherId: string, activeTab: string) {
  const [isTabLoading, setIsTabLoading] = useState(false)
  const queryClient = useQueryClient()

  // Preload data when tab becomes active
  useEffect(() => {
    if (!teacherId || !activeTab) return

    setIsTabLoading(true)

    const loadTabData = async () => {
      try {
        switch (activeTab) {
          case 'schedule':
            await queryClient.ensureQueryData({
              queryKey: teacherQueryKeys.teachers.schedule(teacherId),
              queryFn: () => teacherDetailsApi.getTeacherDetails(teacherId),
            })
            break
          case 'students':
            await queryClient.ensureQueryData({
              queryKey: teacherQueryKeys.teachers.students(teacherId),
              queryFn: () => teacherDetailsApi.getTeacherStudents(teacherId),
            })
            break
          case 'statistics':
            await queryClient.ensureQueryData({
              queryKey: teacherQueryKeys.teachers.statistics(teacherId),
              queryFn: () => teacherDetailsApi.getTeacherStatistics(teacherId),
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
  }, [teacherId, activeTab, queryClient])

  return { isTabLoading }
}