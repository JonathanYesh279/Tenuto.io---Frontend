/**
 * Orchestra and Ensemble Enrollment Hooks
 * 
 * React hooks for managing student orchestra and ensemble enrollments
 * with proper caching, error handling, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { orchestraEnrollmentApi, Orchestra, Ensemble, EnrollmentEligibility, ApiError } from '@/services/orchestraEnrollmentApi'
import { queryKeys } from './useStudentDetailsHooks'
import toast from 'react-hot-toast'

// Additional query keys for orchestras and ensembles
export const enrollmentQueryKeys = {
  orchestras: {
    all: ['orchestras'] as const,
    available: ['orchestras', 'available'] as const,
    enrolled: (studentId: string) => ['orchestras', 'enrolled', studentId] as const,
    details: (orchestraId: string) => ['orchestras', 'details', orchestraId] as const,
    eligibility: (studentId: string, orchestraId: string) => 
      ['orchestras', 'eligibility', studentId, orchestraId] as const,
  },
  ensembles: {
    all: ['ensembles'] as const,
    available: ['ensembles', 'available'] as const,
    enrolled: (studentId: string) => ['ensembles', 'enrolled', studentId] as const,
    details: (ensembleId: string) => ['ensembles', 'details', ensembleId] as const,
    eligibility: (studentId: string, ensembleId: string) => 
      ['ensembles', 'eligibility', studentId, ensembleId] as const,
  }
}

/**
 * Hook to fetch all available orchestras
 */
export function useAvailableOrchestras() {
  return useQuery({
    queryKey: enrollmentQueryKeys.orchestras.available,
    queryFn: () => orchestraEnrollmentApi.getAllAvailableOrchestras(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 3,
  })
}

/**
 * Hook to fetch all available ensembles
 */
export function useAvailableEnsembles() {
  return useQuery({
    queryKey: enrollmentQueryKeys.ensembles.available,
    queryFn: () => orchestraEnrollmentApi.getAllAvailableEnsembles(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  })
}

/**
 * Hook to fetch student's current orchestra enrollments
 */
export function useStudentOrchestraEnrollments(studentId: string, orchestraIds: string[] = []) {
  return useQuery({
    queryKey: enrollmentQueryKeys.orchestras.enrolled(studentId),
    queryFn: () => orchestraEnrollmentApi.getCurrentOrchestraEnrollments(orchestraIds),
    enabled: !!studentId && orchestraIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
  })
}

/**
 * Hook to fetch student's current ensemble enrollments
 */
export function useStudentEnsembleEnrollments(studentId: string, ensembleIds: string[] = []) {
  return useQuery({
    queryKey: enrollmentQueryKeys.ensembles.enrolled(studentId),
    queryFn: () => orchestraEnrollmentApi.getCurrentEnsembleEnrollments(ensembleIds),
    enabled: !!studentId && ensembleIds.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  })
}

/**
 * Hook to check orchestra enrollment eligibility
 */
export function useOrchestraEligibility(studentId: string, orchestraId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: enrollmentQueryKeys.orchestras.eligibility(studentId, orchestraId),
    queryFn: () => orchestraEnrollmentApi.checkOrchestraEligibility(studentId, orchestraId),
    enabled: !!studentId && !!orchestraId && enabled,
    staleTime: 1 * 60 * 1000, // 1 minute (eligibility can change)
    gcTime: 5 * 60 * 1000,
    retry: 2,
  })
}

/**
 * Hook to check ensemble enrollment eligibility
 */
export function useEnsembleEligibility(studentId: string, ensembleId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: enrollmentQueryKeys.ensembles.eligibility(studentId, ensembleId),
    queryFn: () => orchestraEnrollmentApi.checkEnsembleEligibility(studentId, ensembleId),
    enabled: !!studentId && !!ensembleId && enabled,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  })
}

/**
 * Hook for adding orchestra enrollment
 */
export function useAddOrchestraEnrollment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ studentId, orchestraId }: { studentId: string; orchestraId: string }) => {
      return orchestraEnrollmentApi.addOrchestraEnrollment(studentId, orchestraId)
    },
    onMutate: async ({ studentId, orchestraId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: enrollmentQueryKeys.orchestras.enrolled(studentId) 
      })
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.students.details(studentId) 
      })

      // Snapshot previous values
      const previousEnrollments = queryClient.getQueryData(
        enrollmentQueryKeys.orchestras.enrolled(studentId)
      )
      const previousStudent = queryClient.getQueryData(
        queryKeys.students.details(studentId)
      )

      // Optimistically update student data
      queryClient.setQueryData(queryKeys.students.details(studentId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          orchestraIds: [...(old.orchestraIds || []), orchestraId],
          updatedAt: new Date()
        }
      })

      return { previousEnrollments, previousStudent }
    },
    onError: (error: ApiError, { studentId }, context) => {
      // Rollback optimistic updates
      if (context?.previousStudent) {
        queryClient.setQueryData(queryKeys.students.details(studentId), context.previousStudent)
      }
      if (context?.previousEnrollments) {
        queryClient.setQueryData(
          enrollmentQueryKeys.orchestras.enrolled(studentId), 
          context.previousEnrollments
        )
      }

      // Show error message
      toast.error(error.message || 'שגיאה ברישום לתזמורת')
    },
    onSuccess: (_, { studentId, orchestraId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.orchestras.enrolled(studentId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.students.details(studentId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.orchestras.available 
      })
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.orchestras.eligibility(studentId, orchestraId) 
      })

      toast.success('נרשמת בהצלחה לתזמורת!')
    }
  })
}

/**
 * Hook for removing orchestra enrollment
 */
export function useRemoveOrchestraEnrollment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ studentId, orchestraId }: { studentId: string; orchestraId: string }) => {
      return orchestraEnrollmentApi.removeOrchestraEnrollment(studentId, orchestraId)
    },
    onMutate: async ({ studentId, orchestraId }) => {
      await queryClient.cancelQueries({ 
        queryKey: enrollmentQueryKeys.orchestras.enrolled(studentId) 
      })
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.students.details(studentId) 
      })

      const previousEnrollments = queryClient.getQueryData(
        enrollmentQueryKeys.orchestras.enrolled(studentId)
      )
      const previousStudent = queryClient.getQueryData(
        queryKeys.students.details(studentId)
      )

      // Optimistically remove from student data
      queryClient.setQueryData(queryKeys.students.details(studentId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          orchestraIds: (old.orchestraIds || []).filter((id: string) => id !== orchestraId),
          updatedAt: new Date()
        }
      })

      return { previousEnrollments, previousStudent }
    },
    onError: (error: ApiError, { studentId }, context) => {
      if (context?.previousStudent) {
        queryClient.setQueryData(queryKeys.students.details(studentId), context.previousStudent)
      }
      if (context?.previousEnrollments) {
        queryClient.setQueryData(
          enrollmentQueryKeys.orchestras.enrolled(studentId), 
          context.previousEnrollments
        )
      }

      toast.error(error.message || 'שגיאה בביטול רישום מהתזמורת')
    },
    onSuccess: (_, { studentId, orchestraId }) => {
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.orchestras.enrolled(studentId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.students.details(studentId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.orchestras.available 
      })
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.orchestras.eligibility(studentId, orchestraId) 
      })

      toast.success('הרישום לתזמורת בוטל בהצלחה')
    }
  })
}

/**
 * Hook for adding ensemble enrollment
 */
export function useAddEnsembleEnrollment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ studentId, ensembleId }: { studentId: string; ensembleId: string }) => {
      return orchestraEnrollmentApi.addEnsembleEnrollment(studentId, ensembleId)
    },
    onMutate: async ({ studentId, ensembleId }) => {
      await queryClient.cancelQueries({ 
        queryKey: enrollmentQueryKeys.ensembles.enrolled(studentId) 
      })
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.students.details(studentId) 
      })

      const previousEnrollments = queryClient.getQueryData(
        enrollmentQueryKeys.ensembles.enrolled(studentId)
      )
      const previousStudent = queryClient.getQueryData(
        queryKeys.students.details(studentId)
      )

      queryClient.setQueryData(queryKeys.students.details(studentId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          ensembleIds: [...(old.ensembleIds || []), ensembleId],
          updatedAt: new Date()
        }
      })

      return { previousEnrollments, previousStudent }
    },
    onError: (error: ApiError, { studentId }, context) => {
      if (context?.previousStudent) {
        queryClient.setQueryData(queryKeys.students.details(studentId), context.previousStudent)
      }
      if (context?.previousEnrollments) {
        queryClient.setQueryData(
          enrollmentQueryKeys.ensembles.enrolled(studentId), 
          context.previousEnrollments
        )
      }

      toast.error(error.message || 'שגיאה ברישום להרכב')
    },
    onSuccess: (_, { studentId, ensembleId }) => {
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.ensembles.enrolled(studentId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.students.details(studentId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.ensembles.available 
      })
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.ensembles.eligibility(studentId, ensembleId) 
      })

      toast.success('נרשמת בהצלחה להרכב!')
    }
  })
}

/**
 * Hook for removing ensemble enrollment
 */
export function useRemoveEnsembleEnrollment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ studentId, ensembleId }: { studentId: string; ensembleId: string }) => {
      return orchestraEnrollmentApi.removeEnsembleEnrollment(studentId, ensembleId)
    },
    onMutate: async ({ studentId, ensembleId }) => {
      await queryClient.cancelQueries({ 
        queryKey: enrollmentQueryKeys.ensembles.enrolled(studentId) 
      })
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.students.details(studentId) 
      })

      const previousEnrollments = queryClient.getQueryData(
        enrollmentQueryKeys.ensembles.enrolled(studentId)
      )
      const previousStudent = queryClient.getQueryData(
        queryKeys.students.details(studentId)
      )

      queryClient.setQueryData(queryKeys.students.details(studentId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          ensembleIds: (old.ensembleIds || []).filter((id: string) => id !== ensembleId),
          updatedAt: new Date()
        }
      })

      return { previousEnrollments, previousStudent }
    },
    onError: (error: ApiError, { studentId }, context) => {
      if (context?.previousStudent) {
        queryClient.setQueryData(queryKeys.students.details(studentId), context.previousStudent)
      }
      if (context?.previousEnrollments) {
        queryClient.setQueryData(
          enrollmentQueryKeys.ensembles.enrolled(studentId), 
          context.previousEnrollments
        )
      }

      toast.error(error.message || 'שגיאה בביטול רישום מההרכב')
    },
    onSuccess: (_, { studentId, ensembleId }) => {
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.ensembles.enrolled(studentId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.students.details(studentId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.ensembles.available 
      })
      queryClient.invalidateQueries({ 
        queryKey: enrollmentQueryKeys.ensembles.eligibility(studentId, ensembleId) 
      })

      toast.success('הרישום להרכב בוטל בהצלחה')
    }
  })
}

/**
 * Comprehensive hook for managing all enrollment operations
 */
export function useEnrollmentManager(studentId: string) {
  const [selectedOrchestra, setSelectedOrchestra] = useState<string | null>(null)
  const [selectedEnsemble, setSelectedEnsemble] = useState<string | null>(null)
  
  // Fetch hooks
  const availableOrchestras = useAvailableOrchestras()
  const availableEnsembles = useAvailableEnsembles()
  
  // Mutation hooks
  const addOrchestraEnrollment = useAddOrchestraEnrollment()
  const removeOrchestraEnrollment = useRemoveOrchestraEnrollment()
  const addEnsembleEnrollment = useAddEnsembleEnrollment()
  const removeEnsembleEnrollment = useRemoveEnsembleEnrollment()

  // Eligibility hooks
  const orchestraEligibility = useOrchestraEligibility(
    studentId, 
    selectedOrchestra || '', 
    !!selectedOrchestra
  )
  const ensembleEligibility = useEnsembleEligibility(
    studentId, 
    selectedEnsemble || '', 
    !!selectedEnsemble
  )

  const enrollInOrchestra = async (orchestraId: string) => {
    return addOrchestraEnrollment.mutateAsync({ studentId, orchestraId })
  }

  const unenrollFromOrchestra = async (orchestraId: string) => {
    return removeOrchestraEnrollment.mutateAsync({ studentId, orchestraId })
  }

  const enrollInEnsemble = async (ensembleId: string) => {
    return addEnsembleEnrollment.mutateAsync({ studentId, ensembleId })
  }

  const unenrollFromEnsemble = async (ensembleId: string) => {
    return removeEnsembleEnrollment.mutateAsync({ studentId, ensembleId })
  }

  const isLoading = 
    availableOrchestras.isLoading || 
    availableEnsembles.isLoading ||
    addOrchestraEnrollment.isPending ||
    removeOrchestraEnrollment.isPending ||
    addEnsembleEnrollment.isPending ||
    removeEnsembleEnrollment.isPending

  return {
    // Data
    availableOrchestras: availableOrchestras.data || [],
    availableEnsembles: availableEnsembles.data || [],
    
    // Selection
    selectedOrchestra,
    setSelectedOrchestra,
    selectedEnsemble,
    setSelectedEnsemble,
    
    // Eligibility
    orchestraEligibility: orchestraEligibility.data,
    ensembleEligibility: ensembleEligibility.data,
    
    // Actions
    enrollInOrchestra,
    unenrollFromOrchestra,
    enrollInEnsemble,
    unenrollFromEnsemble,
    
    // Status
    isLoading,
    error: availableOrchestras.error || availableEnsembles.error,
    
    // Individual mutation states
    isEnrollingOrchestra: addOrchestraEnrollment.isPending,
    isUnenrollingOrchestra: removeOrchestraEnrollment.isPending,
    isEnrollingEnsemble: addEnsembleEnrollment.isPending,
    isUnenrollingEnsemble: removeEnsembleEnrollment.isPending,
  }
}