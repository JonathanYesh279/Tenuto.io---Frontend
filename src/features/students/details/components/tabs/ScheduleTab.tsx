/**
 * Schedule Tab Component - Weekly CalendarIcon Grid
 *
 * Displays student's schedule in a proper weekly calendar grid from Sunday to Friday
 * Shows lessons as calendar events with proper time slots and Hebrew labels
 */

import { useMemo, useEffect, useState } from 'react'

import SimpleWeeklyGrid from '../../../../../components/schedule/SimpleWeeklyGrid'
import { ActivityTimelineCard } from '../../../../../components/schedule/ActivityTimelineCard'
import apiService from '../../../../../services/apiService'
import { getDisplayName } from '../../../../../utils/nameUtils'
import { CalendarIcon, MusicNotesIcon, UsersIcon } from '@phosphor-icons/react'

interface ScheduleTabProps {
  student: any
  studentId: string
  isLoading?: boolean
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ student, studentId, isLoading }) => {
  const [teacherData, setTeacherData] = useState<Record<string, any>>({})
  const [enrolledOrchestras, setEnrolledOrchestras] = useState<any[]>([])
  const [isLoadingOrchestras, setIsLoadingOrchestras] = useState(false)

  // Fetch teacher information for all teacher assignments
  useEffect(() => {
    const fetchTeachers = async () => {
      if (student?.teacherAssignments && student.teacherAssignments.length > 0) {
        const teacherIds = [...new Set(student.teacherAssignments.map((a: any) => a.teacherId).filter(Boolean))]
        const teachers: Record<string, any> = {}

        for (const teacherId of teacherIds) {
          try {
            const teacher = await apiService.teachers.getTeacherById(teacherId)
            teachers[teacherId] = teacher
            console.log(`Fetched teacher ${teacherId}:`, getDisplayName(teacher.personalInfo))
          } catch (error) {
            console.error(`Failed to fetch teacher ${teacherId}:`, error)
          }
        }

        setTeacherData(teachers)
      }
    }

    fetchTeachers()
  }, [student?.teacherAssignments])

  // Simplified orchestra fetching - only get what we need for schedule display
  useEffect(() => {
    const fetchEnrolledOrchestras = async () => {
      if (!student) return

      try {
        setIsLoadingOrchestras(true)

        // Get orchestras - they already have conductor and rehearsal data populated
        const allOrchestras = await apiService.orchestras.getOrchestras()

        // Find orchestras where this student is listed as a member
        const studentOrchestras = allOrchestras.filter((orchestra: any) =>
          orchestra.memberIds?.includes(studentId) ||
          student?.enrollments?.orchestraIds?.includes(orchestra._id)
        )

        setEnrolledOrchestras(studentOrchestras)

      } catch (error) {
        console.error('Error fetching orchestras:', error)
        setEnrolledOrchestras([])
      } finally {
        setIsLoadingOrchestras(false)
      }
    }

    fetchEnrolledOrchestras()
  }, [student?.enrollments?.orchestraIds, studentId, student])
  // Convert student data to calendar lessons format
  const lessons = useMemo(() => {
    const calendarLessons: any[] = []

    console.log('Processing student data:', student) // Debug log

    // Process teacher assignments into lesson data
    if (student?.teacherAssignments && student.teacherAssignments.length > 0) {
      student.teacherAssignments.forEach((assignment: any, index: number) => {
        // Skip assignments without schedule data (e.g., from ministry import with no time slot)
        if (!assignment.scheduleSlotId && !assignment.day && !assignment.time && !assignment.startTime && !assignment.scheduleInfo) {
          return
        }

        // Map day names to day of week numbers
        const dayMapping: Record<string, number> = {
          'ראשון': 0,
          'שני': 1,
          'שלישי': 2,
          'רביעי': 3,
          'חמישי': 4,
          'שישי': 5,
          'שבת': 6
        }

        // Get real data from the assignment
        const dayOfWeek = dayMapping[assignment.day] ?? 0
        const startTime = assignment.time || assignment.startTime || '14:30'

        // Calculate end time from start time and duration
        const calculateEndTime = (start: string, duration: number): string => {
          const [hours, minutes] = start.split(':').map(Number)
          const totalMinutes = hours * 60 + minutes + duration
          const endHours = Math.floor(totalMinutes / 60)
          const endMinutes = totalMinutes % 60
          return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
        }

        const endTime = assignment.scheduleInfo?.endTime ||
                       calculateEndTime(startTime, assignment.duration || 45)

        // Get teacher name from fetched data or use data from assignment
        const teacher = teacherData[assignment.teacherId]
        const teacherName = getDisplayName(teacher?.personalInfo) ||
                           assignment.scheduleInfo?.teacherName ||
                           assignment.teacherName ||
                           'מורה' // Generic "Teacher" instead of a specific mock name

        // Get instrument from teacher data or student's academic info
        const instrumentName = teacher?.professionalInfo?.instrument ||
                              assignment.instrument ||
                              student?.academicInfo?.instrumentProgress?.[0]?.instrumentName ||
                              'כלי נגינה'

        calendarLessons.push({
          id: assignment._id || assignment.teacherId || `lesson-${index}`,
          instrumentName: instrumentName,
          teacherName: teacherName,
          teacherId: assignment.teacherId,
          startTime,
          endTime,
          dayOfWeek,
          location: assignment.location || assignment.scheduleInfo?.location,
          roomNumber: assignment.roomNumber || assignment.room,
          lessonType: assignment.lessonType || 'individual'
        })
      })
    }

    // Process any additional lessons from other sources
    if (student?.lessons && student.lessons.length > 0) {
      student.lessons.forEach((lesson: any, index: number) => {
        console.log(`Processing lesson ${index}:`, lesson) // Debug log

        // Try to get teacher data if we have a teacherId
        const teacher = lesson.teacherId ? teacherData[lesson.teacherId] : null
        const teacherName = getDisplayName(teacher?.personalInfo) ||
                           lesson.teacherName ||
                           getDisplayName(lesson.teacher?.personalInfo) ||
                           'מורה'

        calendarLessons.push({
          id: lesson._id || `lesson-direct-${index}`,
          instrumentName: lesson.instrument || lesson.instrumentName || 'כלי נגינה',
          teacherName: teacherName,
          startTime: lesson.startTime || '14:30',
          endTime: lesson.endTime || '15:15',
          dayOfWeek: lesson.dayOfWeek ?? 2,
          location: lesson.location,
          roomNumber: lesson.roomNumber || lesson.room,
          lessonType: lesson.lessonType || 'individual'
        })
      })
    }

    // Add orchestra rehearsals as calendar events
    if (enrolledOrchestras && enrolledOrchestras.length > 0) {
      enrolledOrchestras.forEach((orchestra, index) => {

        // Get conductor name
        const conductorName = (() => {
          const conductor = orchestra.conductor || orchestra.conductorInfo
          if (!conductor) return 'מנצח לא מוגד'

          if (typeof conductor === 'string') return conductor

          // Try different ways to get conductor name
          if (getDisplayName(conductor.personalInfo)) return getDisplayName(conductor.personalInfo)
          if (conductor.personalInfo?.firstName && conductor.personalInfo?.lastName) {
            return `${conductor.personalInfo.firstName} ${conductor.personalInfo.lastName}`
          }
          if (conductor.personalInfo?.name) return conductor.personalInfo.name
          if (conductor.personalInfo?.hebrewName) return conductor.personalInfo.hebrewName
          if (conductor.fullName) return conductor.fullName  // legacy fallback
          if (conductor.name) return conductor.name
          if (conductor.displayName) return conductor.displayName

          return 'מנצח לא מוגד'
        })()

        // Check multiple possible schedule sources
        let scheduleData = null
        let dayOfWeek = null
        let startTime = '17:00'
        let endTime = '18:30'
        let location = 'אולם גן'

        // Check different possible schedule field names
        if (orchestra.rehearsalSchedule && (orchestra.rehearsalSchedule.dayOfWeek !== undefined || orchestra.rehearsalSchedule.dayName)) {
          scheduleData = orchestra.rehearsalSchedule
        } else if (orchestra.schedule && (orchestra.schedule.dayOfWeek !== undefined || orchestra.schedule.dayName)) {
          scheduleData = orchestra.schedule
        } else if (orchestra.rehearsals && orchestra.rehearsals.length > 0) {
          // Take first rehearsal as default schedule
          scheduleData = orchestra.rehearsals[0]
        }

        if (scheduleData) {
          // Convert dayName to dayOfWeek if needed
          dayOfWeek = scheduleData.dayOfWeek
          if (dayOfWeek === undefined && scheduleData.dayName) {
            const dayMapping: Record<string, number> = {
              'ראשון': 0,
              'שני': 1,
              'שלישי': 2,
              'רביעי': 3,
              'חמישי': 4,
              'שישי': 5,
              'שבת': 6
            }
            dayOfWeek = dayMapping[scheduleData.dayName] ?? 1 // Default to Monday
          }

          startTime = scheduleData.startTime || startTime
          endTime = scheduleData.endTime || endTime
          location = scheduleData.location || orchestra.location || location
        } else {
          // If no schedule data, create a default Wednesday rehearsal
          dayOfWeek = 3 // Wednesday
        }

        if (dayOfWeek !== null) {
          calendarLessons.push({
            id: `orchestra-${orchestra._id}`,
            instrumentName: orchestra.name || 'תזמורת',
            teacherName: conductorName,
            startTime: startTime,
            endTime: endTime,
            dayOfWeek: dayOfWeek,
            location: location,
            roomNumber: null,
            lessonType: 'orchestra'
          })
        }
      })
    }


    return calendarLessons
  }, [student?.teacherAssignments, student?.lessons, teacherData, enrolledOrchestras])

  // Use the detailed orchestra data instead of simple orchestraEnrollments
  const orchestraActivities = useMemo(() => {
    return enrolledOrchestras.map((orchestra: any) => ({
      id: orchestra._id,
      name: orchestra.name || 'תזמורת',
      status: 'רשום',
      conductor: orchestra.conductor,
      rehearsalSchedule: orchestra.rehearsalSchedule,
      location: orchestra.location
    }))
  }, [enrolledOrchestras])

  // Filter out orchestra lessons for the "שיעורים השבוע" section - only show personal lessons
  const personalLessons = useMemo(() => {
    return lessons.filter(lesson => lesson.lessonType !== 'orchestra')
  }, [lessons])

  if (isLoading || isLoadingOrchestras) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-6 bg-muted rounded animate-pulse w-48"></div>
          <div className="h-96 bg-muted rounded animate-pulse"></div>
          <div className="h-32 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 w-full max-w-full overflow-hidden student-content-area">
      {/* Weekly Schedule Grid or Empty State */}
      {lessons.length > 0 ? (
        <div className="bg-white rounded-card shadow-1 border border-border p-4 w-full max-w-full overflow-hidden">
          <SimpleWeeklyGrid lessons={lessons} />
        </div>
      ) : (
        <div className="bg-white rounded-card shadow-1 border border-border p-8 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-medium text-foreground mb-2">אין שיעורים מתוכננים</h3>
          <p className="text-muted-foreground mb-4">
            התלמיד עדיין לא שוייך למורים או שלא הוגדרו לו שיעורים קבועים
          </p>
          <div className="text-sm text-muted-foreground">
            ניתן לשייך מורים ולהגדיר שיעורים דרך המערכת
          </div>
        </div>
      )}

      {/* Summary Info - Only show if there are lessons or orchestra activities */}
      {(personalLessons.length > 0 || orchestraActivities.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Lessons Summary - Only show personal lessons, not orchestra */}
          {personalLessons.length > 0 ? (
            <div className="bg-card rounded-card border border-border p-4">
              <h4 className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
                <MusicNotesIcon className="w-4 h-4 text-primary" />
                שיעורים השבוע
              </h4>

              <div className="space-y-2">
                {personalLessons.map((lesson) => (
                  <ActivityTimelineCard
                    key={lesson.id}
                    title={lesson.instrumentName}
                    subtitle={lesson.teacherName}
                    type={lesson.lessonType}
                    startTime={lesson.startTime}
                    endTime={lesson.endTime}
                    location={lesson.location}
                    room={lesson.roomNumber}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-card border border-border p-6">
              <div className="text-center py-4">
                <MusicNotesIcon className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-40" />
                <h4 className="text-base font-medium text-foreground mb-1">אין שיעורים אישיים</h4>
                <p className="text-sm text-muted-foreground">התלמיד טרם שוייך לשיעורים אישיים</p>
              </div>
            </div>
          )}

          {/* Orchestra Activities */}
          {orchestraActivities.length > 0 && (
            <div className="bg-card rounded-card border border-border p-4">
              <h4 className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-secondary" />
                תזמורות ופעילויות
              </h4>

              <div className="space-y-2">
                {orchestraActivities.map((activity) => {
                  const conductorName = (() => {
                    const conductor = activity.conductor
                    if (!conductor) return undefined
                    if (typeof conductor === 'string') return conductor
                    if (getDisplayName(conductor.personalInfo)) return getDisplayName(conductor.personalInfo)
                    if (conductor.personalInfo?.firstName && conductor.personalInfo?.lastName) {
                      return `${conductor.personalInfo.firstName} ${conductor.personalInfo.lastName}`
                    }
                    if (conductor.personalInfo?.name) return conductor.personalInfo.name
                    if (conductor.personalInfo?.hebrewName) return conductor.personalInfo.hebrewName
                    if (conductor.fullName) return conductor.fullName
                    if (conductor.name) return conductor.name
                    if (conductor.displayName) return conductor.displayName
                    return undefined
                  })()

                  const scheduleLocation =
                    activity.rehearsalSchedule?.location || activity.location || undefined
                  const startTime = activity.rehearsalSchedule?.startTime || '—'
                  const endTime = activity.rehearsalSchedule?.endTime || '—'

                  return (
                    <ActivityTimelineCard
                      key={activity.id}
                      title={activity.name}
                      subtitle={conductorName}
                      type="orchestra"
                      startTime={startTime}
                      endTime={endTime}
                      location={scheduleLocation}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state for orchestras */}
          {orchestraActivities.length === 0 && (
            <div className="bg-card rounded-card border border-border p-6">
              <div className="text-center py-8">
                <UsersIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <h4 className="text-lg font-medium text-foreground mb-2">אין תזמורות</h4>
                <p className="text-muted-foreground">לא נרשמת עדיין לתזמורות או פעילויות קבוצתיות</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orchestra Activities section for when no personal lessons exist */}
      {personalLessons.length === 0 && orchestraActivities.length > 0 && (
        <div className="bg-card rounded-card border border-border p-4">
          <h4 className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-secondary" />
            תזמורות ופעילויות
          </h4>

          <div className="space-y-2">
            {orchestraActivities.map((activity) => {
              const conductorName = (() => {
                const conductor = activity.conductor
                if (!conductor) return undefined
                if (typeof conductor === 'string') return conductor
                if (getDisplayName(conductor.personalInfo)) return getDisplayName(conductor.personalInfo)
                if (conductor.personalInfo?.firstName && conductor.personalInfo?.lastName) {
                  return `${conductor.personalInfo.firstName} ${conductor.personalInfo.lastName}`
                }
                if (conductor.personalInfo?.name) return conductor.personalInfo.name
                if (conductor.personalInfo?.hebrewName) return conductor.personalInfo.hebrewName
                if (conductor.fullName) return conductor.fullName
                if (conductor.name) return conductor.name
                if (conductor.displayName) return conductor.displayName
                return undefined
              })()

              const scheduleLocation =
                activity.rehearsalSchedule?.location || activity.location || undefined
              const startTime = activity.rehearsalSchedule?.startTime || '—'
              const endTime = activity.rehearsalSchedule?.endTime || '—'

              return (
                <ActivityTimelineCard
                  key={activity.id}
                  title={activity.name}
                  subtitle={conductorName}
                  type="orchestra"
                  startTime={startTime}
                  endTime={endTime}
                  location={scheduleLocation}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleTab
