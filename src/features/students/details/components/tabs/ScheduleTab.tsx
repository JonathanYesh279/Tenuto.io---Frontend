/**
 * Schedule Tab Component - Weekly CalendarIcon Grid
 * 
 * Displays student's schedule in a proper weekly calendar grid from Sunday to Friday
 * Shows lessons as calendar events with proper time slots and Hebrew labels
 */

import { useMemo, useEffect, useState } from 'react'

import WeeklyCalendarGrid from '../../../../../components/schedule/WeeklyCalendarGrid'
import SimpleWeeklyGrid from '../../../../../components/schedule/SimpleWeeklyGrid'
import apiService from '../../../../../services/apiService'
import { getDisplayName } from '../../../../../utils/nameUtils'
import { CalendarIcon, ClockIcon, MapPinIcon, MusicNotesIcon, UsersIcon } from '@phosphor-icons/react'

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
        console.log(`Processing assignment ${index}:`, assignment) // Debug log
        
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
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 bg-white min-h-screen w-full max-w-full overflow-hidden student-content-area">
      {/* Header - More compact */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">לוח זמנים שבועי</h2>
        <p className="text-gray-600 mt-1 text-sm">
          {lessons.length === 0 ? 'אין שיעורים מתוכננים' :
           lessons.length === 1 ? 'שיעור אחד בשבוע' : `${lessons.length} שיעורים בשבוע`}
        </p>
      </div>

      {/* Weekly Schedule Grid or Empty State */}
      {lessons.length > 0 ? (
        <div className="bg-white rounded shadow-sm border border-gray-200 p-4 w-full max-w-full overflow-hidden">
          <SimpleWeeklyGrid lessons={lessons} />
        </div>
      ) : (
        <div className="bg-white rounded shadow-sm border border-gray-200 p-8 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">אין שיעורים מתוכננים</h3>
          <p className="text-gray-600 mb-4">
            התלמיד עדיין לא שוייך למורים או שלא הוגדרו לו שיעורים קבועים
          </p>
          <div className="text-sm text-gray-500">
            ניתן לשייך מורים ולהגדיר שיעורים דרך המערכת
          </div>
        </div>
      )}

      {/* Summary Info - Only show if there are lessons or orchestra activities */}
      {(personalLessons.length > 0 || orchestraActivities.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Lessons Summary - Only show personal lessons, not orchestra */}
          {personalLessons.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                <MusicNotesIcon className="w-4 h-4 text-primary" />
                שיעורים השבוע
              </h4>

              <div className="space-y-3">
                {personalLessons.map((lesson) => {
                  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
                  return (
                    <div key={lesson.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <MusicNotesIcon className="w-4 h-4 text-primary" />
                          <span className="font-medium text-gray-900">{lesson.instrumentName}</span>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          {dayNames[lesson.dayOfWeek]}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          <span>{lesson.startTime} - {lesson.endTime}</span>
                        </div>

                        {(lesson.roomNumber || lesson.location) && (
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" />
                            <span>{lesson.roomNumber ? `חדר ${lesson.roomNumber}` : lesson.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        מורה: {lesson.teacherName}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center py-4">
                <MusicNotesIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <h4 className="text-base font-medium text-gray-900 mb-1">אין שיעורים אישיים</h4>
                <p className="text-sm text-gray-600">התלמיד טרם שוייך לשיעורים אישיים</p>
              </div>
            </div>
          )}

          {/* Orchestra Activities with Full Details */}
          {orchestraActivities.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-purple-600" />
                תזמורות ופעילויות
              </h4>

              <div className="space-y-4">
                {orchestraActivities.map((activity) => (
                  <div key={activity.id} className="p-5 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <UsersIcon className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-gray-900 text-lg">{activity.name}</span>
                      </div>

                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {activity.status}
                      </span>
                    </div>

                    {/* Conductor Information */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">מנצח:</span>
                        <span className="text-sm text-gray-900">
                          {(() => {
                            const conductor = activity.conductor
                            if (!conductor) return 'לא מוגד'

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

                            return 'לא מוגד'
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Rehearsal Schedule */}
                    {activity.rehearsalSchedule ? (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-blue-600" />
                          חזרות שבועיות
                        </h5>
                        <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-blue-900">
                                {activity.rehearsalSchedule.dayName || 'לא מוגדר'}
                              </span>
                              <span className="text-blue-600">•</span>
                              <span className="font-medium text-blue-800">
                                {activity.rehearsalSchedule.startTime && activity.rehearsalSchedule.endTime
                                  ? `${activity.rehearsalSchedule.startTime} - ${activity.rehearsalSchedule.endTime}`
                                  : 'שעות לא מוגדרות'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-700">
                              <MapPinIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {activity.rehearsalSchedule.location || activity.location || 'אולם גן'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        לוח זמנים יפורסם בהמשך
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for orchestras */}
          {orchestraActivities.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center py-8">
                <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">אין תזמורות</h4>
                <p className="text-gray-600">לא נרשמת עדיין לתזמורות או פעילויות קבוצתיות</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orchestra Activities section for when no personal lessons exist */}
      {personalLessons.length === 0 && orchestraActivities.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-purple-600" />
            תזמורות ופעילויות
          </h4>

          <div className="space-y-4">
            {orchestraActivities.map((activity) => (
              <div key={activity.id} className="p-5 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <UsersIcon className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-gray-900 text-lg">{activity.name}</span>
                  </div>

                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {activity.status}
                  </span>
                </div>

                {/* Conductor Information */}
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">מנצח:</span>
                    <span className="text-sm text-gray-900">
                      {(() => {
                        const conductor = activity.conductor
                        if (!conductor) return 'לא מוגד'

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

                        return 'לא מוגד'
                      })()}
                    </span>
                  </div>
                </div>

                {/* Rehearsal Schedule */}
                {activity.rehearsalSchedule ? (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-blue-600" />
                      חזרות שבועיות
                    </h5>
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-blue-900">
                            {activity.rehearsalSchedule.dayName || 'לא מוגדר'}
                          </span>
                          <span className="text-blue-600">•</span>
                          <span className="font-medium text-blue-800">
                            {activity.rehearsalSchedule.startTime && activity.rehearsalSchedule.endTime
                              ? `${activity.rehearsalSchedule.startTime} - ${activity.rehearsalSchedule.endTime}`
                              : 'שעות לא מוגדרות'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-700">
                          <MapPinIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {activity.rehearsalSchedule.location || activity.location || 'אולם גן'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    לוח זמנים יפורסם בהמשך
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleTab