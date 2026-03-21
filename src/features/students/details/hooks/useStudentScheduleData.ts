/**
 * useStudentScheduleData - Fetches live schedule data from the backend weekly-schedule endpoint.
 *
 * Replaces the old pattern of 3 parallel useEffect fetches (teacher data, orchestras, theory lessons)
 * with N+1 teacher lookups and stale scheduleInfo snapshot reads. Now a single API call returns
 * all schedule data with teacher/conductor names already resolved.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studentDetailsApi } from '../../../../services/studentDetailsApi'

export interface ScheduleLesson {
  id: string
  instrumentName: string
  teacherName: string
  teacherId?: string
  startTime: string
  endTime: string
  dayOfWeek: number
  location: string | null
  roomNumber?: string | null
  lessonType: 'individual' | 'orchestra' | 'theory'
  isLegacy?: boolean
}

interface WeeklyScheduleResponse {
  individualLessons: any[]
  orchestraRehearsals: any[]
  theoryLessons: any[]
  meta: { studentId: string; totalActivities: number; fetchedAt: string }
}

export interface OrchestraActivity {
  id: string
  name: string
  conductorName?: string
  startTime: string
  endTime: string
  location?: string
  dayOfWeek: number
}

export function useStudentScheduleData(studentId: string) {
  const query = useQuery({
    queryKey: ['student', studentId, 'weekly-schedule'],
    queryFn: async () => {
      const response = await studentDetailsApi.getStudentSchedule(studentId)
      return response as WeeklyScheduleResponse
    },
    enabled: !!studentId,
    staleTime: 30_000, // 30s - schedule data doesn't change frequently
  })

  // Transform backend response into ScheduleLesson[] for SimpleWeeklyGrid
  const lessons: ScheduleLesson[] = useMemo(() => {
    if (!query.data) return []
    const result: ScheduleLesson[] = []

    // Individual lessons - already have all data from backend
    for (const lesson of query.data.individualLessons || []) {
      result.push({
        id: lesson.id || lesson.lessonId || `ind-${result.length}`,
        instrumentName: lesson.instrument || lesson.instrumentName || '',
        teacherName: lesson.teacherName || '',
        teacherId: lesson.teacherId,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        dayOfWeek: lesson.dayOfWeek,
        location: lesson.location || null,
        roomNumber: lesson.roomNumber || null,
        lessonType: 'individual',
        isLegacy: lesson.isLegacy,
      })
    }

    // Orchestra rehearsals
    for (const rehearsal of query.data.orchestraRehearsals || []) {
      result.push({
        id: `orchestra-${rehearsal.orchestraId || rehearsal.id || result.length}`,
        instrumentName: rehearsal.orchestraName || '',
        teacherName: rehearsal.conductorName || '',
        startTime: rehearsal.startTime,
        endTime: rehearsal.endTime,
        dayOfWeek: rehearsal.dayOfWeek,
        location: rehearsal.location || null,
        roomNumber: null,
        lessonType: 'orchestra',
      })
    }

    // Theory lessons
    for (const theory of query.data.theoryLessons || []) {
      result.push({
        id: `theory-${theory.id || result.length}`,
        instrumentName: theory.category || theory.title || '',
        teacherName: theory.teacherName || '',
        teacherId: theory.teacherId,
        startTime: theory.startTime,
        endTime: theory.endTime,
        dayOfWeek: theory.dayOfWeek,
        location: theory.location || null,
        roomNumber: null,
        lessonType: 'theory',
      })
    }

    return result
  }, [query.data])

  // Filter personal lessons (non-orchestra)
  const personalLessons = useMemo(
    () => lessons.filter((l) => l.lessonType !== 'orchestra'),
    [lessons]
  )

  // Derived orchestra activities for summary section
  const orchestraActivities = useMemo<OrchestraActivity[]>(
    () =>
      (query.data?.orchestraRehearsals || []).map((r: any) => ({
        id: r.orchestraId || r.id,
        name: r.orchestraName || '',
        conductorName: r.conductorName,
        startTime: r.startTime,
        endTime: r.endTime,
        location: r.location,
        dayOfWeek: r.dayOfWeek,
      })),
    [query.data]
  )

  return {
    lessons,
    personalLessons,
    orchestraActivities,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
