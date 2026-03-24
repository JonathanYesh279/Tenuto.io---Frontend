/**
 * Schedule Tab Component
 * 
 * Displays teacher's weekly calendar with all activities:
 * - Individual lessons and time blocks
 * - Orchestra conducting sessions
 * - Ensemble activities
 * - Real calendar dates with proper scheduling
 */

import { useState, useEffect, useMemo } from 'react'
import { Teacher } from '../../types'
import TeacherWeeklyCalendar from '../../../../../components/schedule/TeacherWeeklyCalendar'
import { orchestraEnrollmentApi } from '../../../../../services/orchestraEnrollmentApi'
import apiService from '../../../../../services/apiService'
import { getDisplayName } from '../../../../../utils/nameUtils'
import toast from 'react-hot-toast'

interface ScheduleTabProps {
  teacher: Teacher
  teacherId: string
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ teacher, teacherId }) => {
  const [orchestraActivities, setOrchestraActivities] = useState<any[]>([])
  const [ensembleActivities, setEnsembleActivities] = useState<any[]>([])
  const [teacherLessons, setTeacherLessons] = useState<any[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [teacherData, setTeacherData] = useState(teacher)

  // Sync teacherData with teacher prop when it changes
  useEffect(() => {
    setTeacherData(teacher)
  }, [teacher])

  // Helper function to calculate duration in minutes from time strings
  const calculateDurationFromTimes = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    return endMinutes - startMinutes
  }

  // Load orchestra and ensemble activities
  useEffect(() => {
    const loadConductingActivities = async () => {
      if (!teacher.conducting) return
      
      setIsLoadingActivities(true)
      try {
        const orchestraPromises = (teacher.conducting.orchestraIds || []).map(async (id: string) => {
          try {
            const orchestra = await orchestraEnrollmentApi.getCurrentOrchestraEnrollments([id])
            return orchestra[0] ? {
              _id: orchestra[0]._id,
              name: orchestra[0].name,
              type: 'orchestra' as const,
              rehearsalTimes: orchestra[0].rehearsalTimes || [],
              location: 'אולם התזמורת',
              participants: orchestra[0].currentMembers || 0
            } : null
          } catch (error) {
            console.warn(`Failed to load orchestra ${id}:`, error)
            return null
          }
        })
        
        const ensemblePromises = (teacher.conducting.ensemblesIds || []).map(async (id: string) => {
          try {
            const ensemble = await orchestraEnrollmentApi.getCurrentEnsembleEnrollments([id])
            return ensemble[0] ? {
              _id: ensemble[0]._id,
              name: ensemble[0].name,
              type: 'ensemble' as const,
              rehearsalTimes: ensemble[0].rehearsalTimes || [],
              location: 'חדר האנסמבל',
              participants: ensemble[0].currentMembers || 0
            } : null
          } catch (error) {
            console.warn(`Failed to load ensemble ${id}:`, error)
            return null
          }
        })
        
        const [orchestras, ensembles] = await Promise.all([
          Promise.allSettled(orchestraPromises),
          Promise.allSettled(ensemblePromises)
        ])
        
        const loadedOrchestras = orchestras
          .filter((result): result is PromiseFulfilledResult<any> => 
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value)
        
        const loadedEnsembles = ensembles
          .filter((result): result is PromiseFulfilledResult<any> => 
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value)
        
        // Convert to calendar activities format
        const orchestraCalendarActivities = loadedOrchestras.flatMap(orchestra => 
          orchestra.rehearsalTimes.map(time => ({
            _id: `${orchestra._id}-${time.day}-${time.startTime}`,
            name: orchestra.name,
            day: time.day,
            startTime: time.startTime,
            endTime: time.endTime,
            location: time.location || orchestra.location,
            participants: orchestra.participants,
            type: 'orchestra' as const
          }))
        )
        
        const ensembleCalendarActivities = loadedEnsembles.flatMap(ensemble => 
          ensemble.rehearsalTimes.map(time => ({
            _id: `${ensemble._id}-${time.day}-${time.startTime}`,
            name: ensemble.name,
            day: time.day,
            startTime: time.startTime,
            endTime: time.endTime,
            location: time.location || ensemble.location,
            participants: ensemble.participants,
            type: 'ensemble' as const
          }))
        )
        
        setOrchestraActivities(orchestraCalendarActivities)
        setEnsembleActivities(ensembleCalendarActivities)
      } catch (error) {
        console.error('Failed to load conducting activities:', error)
      } finally {
        setIsLoadingActivities(false)
      }
    }
    
    loadConductingActivities()
  }, [teacher.conducting])

  // Load teacher lessons - combines API data with teacher's own schedule data
  useEffect(() => {
    const loadTeacherLessons = async () => {
      if (!teacherId) return

      try {
        console.log('🔄 Loading teacher lessons for ID:', teacherId)
        const lessonsData = await apiService.teachers.getTeacherLessons(teacherId)
        console.log('✅ Teacher lessons loaded from API:', lessonsData)

        // Extract lessons array from API response
        let lessons = lessonsData?.lessons || lessonsData?.data?.lessons || []
        console.log(`📚 API returned ${lessons.length} lessons`)

        // If API returns empty, check timeBlocks for assigned lessons as fallback
        if (lessons.length === 0 && teacherData.teaching?.timeBlocks) {
          console.log('🔄 API returned no lessons, using timeBlocks data as fallback')
          const timeBlockLessons: any[] = []

          teacherData.teaching.timeBlocks.forEach(block => {
            (block.assignedLessons || [])
              .filter(lesson => lesson.isActive !== false)
              .forEach(lesson => {
                timeBlockLessons.push({
                  _id: `${block._id}-${lesson.studentId}`,
                  studentId: lesson.studentId,
                  studentName: lesson.studentName,
                  day: block.day,
                  startTime: lesson.startTime,
                  time: lesson.startTime,
                  endTime: lesson.endTime,
                  duration: lesson.duration,
                  location: block.location,
                  lessonType: 'individual'
                })
              })
          })
          console.log(`📚 Found ${timeBlockLessons.length} lessons in timeBlocks`)
          lessons = timeBlockLessons
        }

        setTeacherLessons(lessons)
        console.log(`📚 Final set ${lessons.length} lessons for teacher`)
      } catch (error) {
        console.error('❌ Failed to load teacher lessons:', error)

        // On error, try to use teacher's local data as fallback
        const fallbackLessons: any[] = []

        // Collect from timeBlocks (new system - preferred)
        if (teacherData.teaching?.timeBlocks) {
          teacherData.teaching.timeBlocks.forEach(block => {
            (block.assignedLessons || [])
              .filter(lesson => lesson.isActive !== false)
              .forEach(lesson => {
                fallbackLessons.push({
                  _id: `${block._id}-${lesson.studentId}`,
                  studentId: lesson.studentId,
                  studentName: lesson.studentName,
                  day: block.day,
                  startTime: lesson.startTime,
                  time: lesson.startTime,
                  endTime: lesson.endTime,
                  duration: lesson.duration,
                  location: block.location,
                  lessonType: 'individual'
                })
              })
          })
        }

        console.log('🔄 Using local teacher data after API error')
        setTeacherLessons(fallbackLessons)
        console.log(`📚 Set ${fallbackLessons.length} fallback lessons`)
      }
    }

    loadTeacherLessons()
  }, [teacherId, teacherData.teaching?.timeBlocks])

  // Days of the week in Hebrew
  const daysOfWeek = [
    'ראשון',
    'שני', 
    'שלישי',
    'רביעי',
    'חמישי',
    'שישי',
    'שבת'
  ]

  // Refresh teacher data from API
  const refreshTeacherData = async () => {
    try {
      const updatedTeacher = await apiService.teachers.getTeacher(teacherId)
      setTeacherData(updatedTeacher)
    } catch (error) {
      console.error('Failed to refresh teacher data:', error)
    }
  }

  // Combine time blocks and schedule data for יום לימוד
  const allTeachingDays = useMemo(() => {
    const days = []

    // Add from timeBlocks (modern structure)
    if (teacherData.teaching?.timeBlocks) {
      const processedTimeBlocks = teacherData.teaching.timeBlocks.map(block => ({
        ...block,
        // Always recalculate duration from times to ensure accuracy
        totalDuration: calculateDurationFromTimes(block.startTime, block.endTime)
      }))
      days.push(...processedTimeBlocks)
    }

    // Sort by day of week (Sunday to Saturday)
    // In RTL grid, this makes Sunday appear on the left side
    const getDayOrder = (day: string) => {
      const index = daysOfWeek.indexOf(day)
      return index === -1 ? 999 : index
    }

    return days.sort((a, b) => {
      // First sort by day of week (ascending order)
      const dayComparison = getDayOrder(a.day) - getDayOrder(b.day)
      if (dayComparison !== 0) return dayComparison

      // If same day, sort by start time
      const aTime = a.startTime || '00:00'
      const bTime = b.startTime || '00:00'
      return aTime.localeCompare(bTime)
    })
  }, [teacherData.teaching?.timeBlocks])


  // Handle lesson updates
  const handleLessonUpdate = async (updatedLesson: any) => {
    try {
      console.log('🔄 Updating lesson via student record:', updatedLesson)
      console.log('🆔 Student ID:', updatedLesson.studentId)
      console.log('👨‍🏫 Teacher ID:', updatedLesson.teacherId || teacherId)
      console.log('📝 Update data:', {
        day: updatedLesson.day,
        startTime: updatedLesson.startTime,
        endTime: updatedLesson.endTime,
        duration: updatedLesson.duration
      })

      // Validate required fields
      if (!updatedLesson.studentId) {
        throw new Error('Student ID is missing')
      }

      // First, get the current student data to find the teacher assignment
      const currentStudent = await apiService.students.getStudentById(updatedLesson.studentId)
      console.log('📋 Current student data loaded:', getDisplayName(currentStudent.personalInfo))

      if (!currentStudent.teacherAssignments || currentStudent.teacherAssignments.length === 0) {
        throw new Error('No teacher assignments found for this student')
      }

      // Find the specific teacher assignment to update
      const currentTeacherId = updatedLesson.teacherId || teacherId
      const assignmentIndex = currentStudent.teacherAssignments.findIndex(
        assignment => assignment.teacherId === currentTeacherId && assignment.isActive
      )

      if (assignmentIndex === -1) {
        throw new Error(`No active assignment found for teacher ${currentTeacherId}`)
      }

      console.log(`🎯 Found teacher assignment at index ${assignmentIndex}`)

      // Create updated teacher assignments array
      const updatedAssignments = [...currentStudent.teacherAssignments]
      const currentAssignment = updatedAssignments[assignmentIndex]

      // Calculate end time
      const calculateEndTime = (startTime: string, duration: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes + duration
        const endHours = Math.floor(totalMinutes / 60)
        const endMins = totalMinutes % 60
        return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
      }

      // Update the assignment with new schedule
      updatedAssignments[assignmentIndex] = {
        ...currentAssignment,
        day: updatedLesson.day,
        time: updatedLesson.startTime,
        duration: updatedLesson.duration,
        scheduleInfo: {
          ...currentAssignment.scheduleInfo,
          day: updatedLesson.day,
          startTime: updatedLesson.startTime,
          endTime: calculateEndTime(updatedLesson.startTime, updatedLesson.duration),
          duration: updatedLesson.duration,
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }

      console.log('📤 Updating student record with new assignment:', updatedAssignments[assignmentIndex])

      // Update the student record with the modified teacher assignments
      const result = await apiService.students.updateStudent(updatedLesson.studentId, {
        teacherAssignments: updatedAssignments
      })

      console.log('✅ Student updated successfully:', getDisplayName(result.personalInfo))

      // Refresh teacher lessons to reflect the changes
      const lessonsData = await apiService.teachers.getTeacherLessons(teacherId)
      const lessons = lessonsData?.lessons || lessonsData?.data?.lessons || []
      setTeacherLessons(lessons)

      console.log('✅ Teacher lessons refreshed - new count:', lessons.length)
      toast.success('השיעור עודכן בהצלחה', { duration: 3000, position: 'top-center' })
    } catch (error) {
      console.error('❌ Failed to update lesson:', error)
      console.error('❌ Error details:', error.message)
      throw error // Re-throw so the modal can show the error
    }
  }

  // Handle lesson deletion
  const handleLessonDelete = async (lessonToDelete: any) => {
    try {
      console.log('🗑️ Deleting lesson:', lessonToDelete)
      console.log('🆔 Student ID:', lessonToDelete.studentId)
      console.log('👨‍🏫 Teacher ID:', lessonToDelete.teacherId || teacherId)

      // Validate required fields
      if (!lessonToDelete.studentId) {
        throw new Error('Student ID is missing')
      }

      // Get the current student data
      const currentStudent = await apiService.students.getStudentById(lessonToDelete.studentId)
      console.log('📋 Current student data loaded:', getDisplayName(currentStudent.personalInfo))

      if (!currentStudent.teacherAssignments || currentStudent.teacherAssignments.length === 0) {
        throw new Error('No teacher assignments found for this student')
      }

      // Find the specific teacher assignment to deactivate
      const currentTeacherId = lessonToDelete.teacherId || teacherId
      const assignmentIndex = currentStudent.teacherAssignments.findIndex(
        assignment => assignment.teacherId === currentTeacherId && assignment.isActive
      )

      if (assignmentIndex === -1) {
        throw new Error(`No active assignment found for teacher ${currentTeacherId}`)
      }

      console.log(`🎯 Found teacher assignment at index ${assignmentIndex}`)

      // Deactivate the assignment (soft delete) instead of removing it completely
      const updatedAssignments = [...currentStudent.teacherAssignments]
      updatedAssignments[assignmentIndex] = {
        ...updatedAssignments[assignmentIndex],
        isActive: false,
        endDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      console.log('📤 Deactivating student teacher assignment')

      // Update the student record
      const result = await apiService.students.updateStudent(lessonToDelete.studentId, {
        teacherAssignments: updatedAssignments
      })

      console.log('✅ Student assignment deactivated successfully:', getDisplayName(result.personalInfo))

      // Deactivate timeBlock lessons for this student on the teacher record
      const teachingUpdates: any = { ...teacherData.teaching }
      let needsTeacherUpdate = false

      if (teachingUpdates.timeBlocks) {
        teachingUpdates.timeBlocks = teachingUpdates.timeBlocks.map((block: any) => ({
          ...block,
          assignedLessons: (block.assignedLessons || []).map((lesson: any) =>
            lesson.studentId === lessonToDelete.studentId
              ? { ...lesson, isActive: false, endDate: new Date().toISOString() }
              : lesson
          )
        }))
        needsTeacherUpdate = true
      }

      if (needsTeacherUpdate) {
        console.log('📤 Cleaning up teacher schedule/timeBlock data')
        await apiService.teachers.updateTeacher(teacherId, {
          teaching: teachingUpdates
        })
      }

      // Refresh teacher lessons to reflect the changes
      const lessonsData = await apiService.teachers.getTeacherLessons(teacherId)
      const lessons = lessonsData?.lessons || lessonsData?.data?.lessons || []
      setTeacherLessons(lessons)

      // Refresh teacher data
      await refreshTeacherData()

      console.log('✅ Lesson deleted - refreshed lessons count:', lessons.length)
      toast.success('השיעור נמחק בהצלחה', { duration: 3000, position: 'top-center' })
    } catch (error) {
      console.error('❌ Failed to delete lesson:', error)
      console.error('❌ Error details:', error.message)
      toast.error('שגיאה במחיקת השיעור. אנא נסה שוב.', {
        duration: 4000,
        position: 'top-center'
      })
      throw error
    }
  }


  return (
    <div className="p-4 space-y-4 w-full max-w-full overflow-hidden">
      {/* Weekly Calendar */}
      <div className="bg-white rounded-card shadow-1 border border-border p-4 w-full max-w-full overflow-hidden">
        <TeacherWeeklyCalendar
          teacher={teacherData}
          timeBlocks={allTeachingDays}
          lessons={teacherLessons}
          orchestraActivities={orchestraActivities}
          className=""
          showNavigation={true}
          onLessonUpdate={handleLessonUpdate}
          onLessonDelete={handleLessonDelete}
        />
      </div>

      {/* Legend */}
      <div className="bg-muted/40 rounded-card border border-border p-3">
        <h3 className="font-semibold text-foreground mb-2 text-sm">מקרא</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: 'hsl(var(--primary))' }} />
            <span className="text-muted-foreground">אישי</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: 'hsl(var(--color-rehearsals-fg, 330 80% 45%))' }} />
            <span className="text-muted-foreground">קבוצתי</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: 'hsl(var(--color-orchestras-fg, 35 80% 50%))' }} />
            <span className="text-muted-foreground">תזמורת</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: 'hsl(var(--color-theory-fg, 160 60% 35%))' }} />
            <span className="text-muted-foreground">תאוריה</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleTab