/**
 * useTeacherDashboardData - Aggregates dashboard data for the Teacher Details overview.
 *
 * Fetches hours summary, students list, and conducting info to build
 * a unified dashboard state consumed by TeacherDashboardView.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiService, { hoursSummaryService } from '../../../../services/apiService'

export interface TeacherDashboardData {
  // Stats
  totalWeeklyHours: number
  studentCount: number
  timeBlockCount: number
  conductingCount: number
  // Hours breakdown
  hoursTotals: {
    individualLessons: number
    orchestraConducting: number
    theoryTeaching: number
    management: number
    accompaniment: number
    ensembleCoordination: number
    coordination: number
    breakTime: number
    travelTime: number
  } | null
  // Students list
  students: Array<{
    _id: string
    name: string
    instrument: string
    class: string
    hasActiveLessons: boolean
  }>
  // Loading states
  isLoading: boolean
  hoursLoading: boolean
  studentsLoading: boolean
}

export function useTeacherDashboardData(teacherId: string, teacher: any): TeacherDashboardData {
  // Fetch hours summary
  const hoursQuery = useQuery({
    queryKey: ['teachers', 'hours-summary', teacherId],
    queryFn: async () => {
      try {
        return await hoursSummaryService.getTeacherSummary(teacherId)
      } catch (err: any) {
        if (err.status === 404 || err.message?.includes('404')) return null
        throw err
      }
    },
    enabled: !!teacherId,
    staleTime: 3 * 60 * 1000,
    retry: 1,
  })

  // Fetch teacher's students
  const studentsQuery = useQuery({
    queryKey: ['teachers', 'dashboard-students', teacherId],
    queryFn: () => apiService.teachers.getTeacherStudents(teacherId),
    enabled: !!teacherId,
    staleTime: 3 * 60 * 1000,
    retry: 1,
  })

  // Derive student list
  const students = useMemo(() => {
    if (!studentsQuery.data) return []
    return studentsQuery.data.map((s: any) => ({
      _id: s._id,
      name: `${s.personalInfo?.firstName || ''} ${s.personalInfo?.lastName || ''}`.trim() || s.personalInfo?.fullName || 'ללא שם',
      instrument: s.primaryInstrument || s.academicInfo?.instrumentProgress?.[0]?.instrumentName || '',
      class: s.academicInfo?.class || '',
      hasActiveLessons: s.teacherAssignments?.some((a: any) => a.teacherId === teacherId && a.isActive) || false,
    }))
  }, [studentsQuery.data, teacherId])

  // Derive stats from teacher data and hours
  const totalWeeklyHours = hoursQuery.data?.totals?.totalWeeklyHours ?? 0
  const studentCount = teacher?.studentCount ?? students.length
  const timeBlockCount = teacher?.teaching?.timeBlocks?.length ?? 0
  const conductingCount = (teacher?.conducting?.orchestraIds?.length ?? 0) +
    (teacher?.conducting?.ensemblesIds?.length ?? 0)

  const hoursTotals = hoursQuery.data?.totals ? {
    individualLessons: hoursQuery.data.totals.individualLessons ?? 0,
    orchestraConducting: hoursQuery.data.totals.orchestraConducting ?? 0,
    theoryTeaching: hoursQuery.data.totals.theoryTeaching ?? 0,
    management: hoursQuery.data.totals.management ?? 0,
    accompaniment: hoursQuery.data.totals.accompaniment ?? 0,
    ensembleCoordination: hoursQuery.data.totals.ensembleCoordination ?? 0,
    coordination: hoursQuery.data.totals.coordination ?? 0,
    breakTime: hoursQuery.data.totals.breakTime ?? 0,
    travelTime: hoursQuery.data.totals.travelTime ?? 0,
  } : null

  return {
    totalWeeklyHours,
    studentCount,
    timeBlockCount,
    conductingCount,
    hoursTotals,
    students,
    isLoading: hoursQuery.isLoading || studentsQuery.isLoading,
    hoursLoading: hoursQuery.isLoading,
    studentsLoading: studentsQuery.isLoading,
  }
}
