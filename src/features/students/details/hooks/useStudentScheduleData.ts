/**
 * useStudentScheduleData - Fetches live schedule data from the backend weekly-schedule endpoint.
 *
 * Uses useEffect + useState to fetch schedule data on mount and when studentId changes.
 * Cache invalidation is handled at the apiService level — moveActivity and rescheduleLesson
 * clear the /student cache so the next fetch returns fresh data.
 */

import { useState, useEffect, useMemo } from 'react'
import apiService from '../../../../services/apiService'

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
  const [data, setData] = useState<WeeklyScheduleResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!studentId) return

    let cancelled = false
    setIsLoading(true)
    setIsError(false)
    setError(null)

    apiService.students.getStudentWeeklySchedule(studentId)
      .then((response: WeeklyScheduleResponse) => {
        if (!cancelled) {
          setData(response)
          setIsLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          console.error('[ScheduleData] Fetch error:', err)
          setIsError(true)
          setError(err)
          setIsLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [studentId])

  // Transform backend response into ScheduleLesson[] for SimpleWeeklyGrid
  const lessons: ScheduleLesson[] = useMemo(() => {
    if (!data) return []
    const result: ScheduleLesson[] = []

    for (const lesson of data.individualLessons || []) {
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

    for (const rehearsal of data.orchestraRehearsals || []) {
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

    for (const theory of data.theoryLessons || []) {
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
  }, [data])

  const personalLessons = useMemo(
    () => lessons.filter((l) => l.lessonType !== 'orchestra'),
    [lessons]
  )

  const orchestraActivities = useMemo<OrchestraActivity[]>(
    () =>
      (data?.orchestraRehearsals || []).map((r: any) => ({
        id: r.orchestraId || r.id,
        name: r.orchestraName || '',
        conductorName: r.conductorName,
        startTime: r.startTime,
        endTime: r.endTime,
        location: r.location,
        dayOfWeek: r.dayOfWeek,
      })),
    [data]
  )

  return {
    lessons,
    personalLessons,
    orchestraActivities,
    isLoading,
    isError,
    error,
  }
}
