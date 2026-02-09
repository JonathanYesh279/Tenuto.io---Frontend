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
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, Users, AlertCircle } from 'lucide-react'
import { Teacher } from '../../types'
import TeacherWeeklyCalendar from '../../../../../components/schedule/TeacherWeeklyCalendar'
import { orchestraEnrollmentApi } from '../../../../../services/orchestraEnrollmentApi'
import apiService from '../../../../../services/apiService'
import { getDisplayName } from '../../../../../utils/nameUtils'
import TimeBlockForm from '../../../../../components/teacher/TimeBlockForm'
import toast from 'react-hot-toast'
import { VALID_LOCATIONS } from '../../../../../constants/locations'

interface ScheduleTabProps {
  teacher: Teacher
  teacherId: string
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ teacher, teacherId }) => {
  const [selectedTimeBlock, setSelectedTimeBlock] = useState(null)
  const [isAddingTimeBlock, setIsAddingTimeBlock] = useState(false)
  const [orchestraActivities, setOrchestraActivities] = useState<any[]>([])
  const [ensembleActivities, setEnsembleActivities] = useState<any[]>([])
  const [teacherLessons, setTeacherLessons] = useState<any[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [showLegacyView, setShowLegacyView] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [teacherData, setTeacherData] = useState(teacher)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{timeBlock: any} | null>(null)

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

  // Group teaching days by day
  const timeBlocksByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = allTeachingDays.filter(block => block.day === day) || []
    return acc
  }, {})

  const getTotalWeeklyHours = () => {
    return allTeachingDays.reduce((total, block) => total + (block.totalDuration || 0), 0) / 60 || 0
  }

  const getTotalStudentsInSchedule = () => {
    const studentIds = new Set()
    // Count from timeBlocks (new system)
    teacherData.teaching?.timeBlocks?.forEach(block => {
      (block.assignedLessons || []).forEach(lesson => {
        if (lesson.studentId && lesson.isActive !== false) studentIds.add(lesson.studentId)
      })
    })
    return studentIds.size
  }

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

  const totalActivities = orchestraActivities.length + ensembleActivities.length
  const totalWeeklyHours = getTotalWeeklyHours()
  const totalTimeBlocks = allTeachingDays.length || 0
  const totalStudents = getTotalStudentsInSchedule()

  return (
    <div className="p-6 space-y-6">
      {/* Header with Statistics */}
      <div className="flex justify-end items-start">
        {isLoadingActivities && (
          <div className="flex items-center gap-2 text-sm text-blue-600 mr-4">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            טוען פעילויות הניצוח...
          </div>
        )}
        
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {Math.round(totalWeeklyHours)}
            </div>
            <div className="text-gray-600">שעות שבועיות</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalTimeBlocks}
            </div>
            <div className="text-gray-600">ימי לימוד</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalStudents}
            </div>
            <div className="text-gray-600">תלמידים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {totalActivities}
            </div>
            <div className="text-gray-600">הרכבים</div>
          </div>
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLegacyView(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !showLegacyView
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            לוח זמנים שבועי
          </button>
          <button
            onClick={() => setShowLegacyView(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showLegacyView
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            ניהול ימי לימוד
          </button>
        </div>
        
        {totalActivities > 0 && (
          <div className="text-sm text-gray-600">
            מנצח על {totalActivities} הרכבים
          </div>
        )}
      </div>

      {/* Main Calendar View */}
      {!showLegacyView ? (
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
      ) : (
        /* Teaching Days Management View */
        <div className="space-y-6">
          {/* Teaching Days Cards */}
          {allTeachingDays.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTeachingDays.map((timeBlock, index) => (
                <div
                  key={timeBlock._id || index}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <h3 className="text-lg font-bold text-gray-900">{timeBlock.day}</h3>
                    </div>
                    {timeBlock.isActive && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        פעיל
                      </span>
                    )}
                  </div>

                  {/* Time Information */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">
                        {timeBlock.startTime} - {timeBlock.endTime}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-sm">משך:</span>
                      <span className="font-medium text-blue-600">
                        {Math.floor(timeBlock.totalDuration / 60)} שעות
                        {timeBlock.totalDuration % 60 !== 0 && ` ו-${timeBlock.totalDuration % 60} דקות`}
                      </span>
                    </div>

                    {timeBlock.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{timeBlock.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {timeBlock.assignedLessons?.length || 0} שיעורים מתוכננים
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {timeBlock.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{timeBlock.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedTimeBlock(timeBlock)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      <Edit className="w-4 h-4 inline-block ml-1" />
                      ערוך
                    </button>
                    <button
                      onClick={() => setDeleteConfirmation({timeBlock})}
                      disabled={isUpdating}
                      className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 inline-block ml-1" />
                      {isUpdating ? 'מוחק...' : 'מחק'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">אין ימי לימוד מוגדרים</h3>
              <p className="text-gray-600 mb-6">
                טרם הוגדרו ימי לימוד עבור מורה זה. הגדר ימי לימוד כדי לאפשר תזמון שיעורים.
              </p>
              <button
                onClick={() => setIsAddingTimeBlock(true)}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                הוסף יום לימוד ראשון
              </button>
            </div>
          )}

          {/* Add New Teaching Day Button */}
          {allTeachingDays.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={() => setIsAddingTimeBlock(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                הוסף יום לימוד חדש
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Teaching Day Modal */}
      {selectedTimeBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                ערוך יום לימוד - {selectedTimeBlock.day}
              </h3>
              <button
                onClick={() => setSelectedTimeBlock(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    זמן התחלה
                  </label>
                  <input
                    type="time"
                    defaultValue={selectedTimeBlock.startTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    זמן סיום
                  </label>
                  <input
                    type="time"
                    defaultValue={selectedTimeBlock.endTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מיקום
                </label>
                <select
                  defaultValue={selectedTimeBlock.location || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  <option value="">בחר מיקום...</option>
                  {VALID_LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  הערות
                </label>
                <textarea
                  defaultValue={selectedTimeBlock.notes}
                  placeholder="הערות נוספות על יום הלימוד..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  defaultChecked={selectedTimeBlock.isActive}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  יום לימוד פעיל (זמין לקביעת שיעורים)
                </label>
              </div>
              
              <div className="flex gap-3 pt-6 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50"
                  disabled={isUpdating}
                  onClick={async (e) => {
                    e.preventDefault()
                    
                    const form = e.target.closest('form')
                    const formData = new FormData(form)
                    const timeInputs = form.querySelectorAll('input[type="time"]')
                    const startTime = (timeInputs[0] as HTMLInputElement).value
                    const endTime = (timeInputs[1] as HTMLInputElement).value
                    const location = (form.querySelector('select') as HTMLSelectElement).value
                    const notes = (form.querySelector('textarea') as HTMLTextAreaElement).value
                    const isActive = (form.querySelector('input[type="checkbox"]') as HTMLInputElement).checked
                    
                    // Calculate duration in minutes
                    const calculateDuration = (start: string, end: string): number => {
                      const [startHour, startMin] = start.split(':').map(Number)
                      const [endHour, endMin] = end.split(':').map(Number)
                      const startMinutes = startHour * 60 + startMin
                      const endMinutes = endHour * 60 + endMin
                      return endMinutes - startMinutes
                    }
                    
                    const duration = calculateDuration(startTime, endTime)
                    
                    try {
                      setIsUpdating(true)

                      await apiService.teacherSchedule.updateTimeBlock(teacherId, selectedTimeBlock._id, {
                        startTime,
                        endTime,
                        totalDuration: duration,
                        location,
                        notes,
                        isActive
                      })
                      
                      await refreshTeacherData()
                      setSelectedTimeBlock(null)
                      console.log('✅ Successfully updated teaching day')
                    } catch (error) {
                      console.error('❌ Failed to update teaching day:', error)
                      console.error('Error details:', error.response?.data || error.message)
                      toast.error('שגיאה בעדכון יום הלימוד. אנא נסה שוב.', {
                        duration: 4000,
                        position: 'top-center',
                        style: {
                          background: '#FEE2E2',
                          color: '#991B1B',
                          border: '1px solid #FCA5A5',
                          padding: '16px',
                          fontSize: '14px',
                          fontFamily: 'Reisinger-Yonatan, sans-serif'
                        }
                      })
                    } finally {
                      setIsUpdating(false)
                    }
                  }}
                >
                  {isUpdating ? 'שומר...' : 'שמור שינויים'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTimeBlock(null)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Calendar Legend */}
      {!showLegacyView && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">מקרא</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
              <span className="text-gray-700">שיעורים פרטיים</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded" />
              <span className="text-gray-700">תזמורות</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
              <span className="text-gray-700">אנסמבלים</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded" />
              <span className="text-gray-700">זמן פנוי</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              מחיקת יום לימוד
            </h3>
            <p className="text-gray-600 text-center mb-6">
              האם אתה בטוח שברצונך למחוק את יום הלימוד ביום {deleteConfirmation.timeBlock.day}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                ביטול
              </button>
              <button
                onClick={async () => {
                  const timeBlock = deleteConfirmation.timeBlock
                  setDeleteConfirmation(null)

                  try {
                    setIsUpdating(true)
                    await apiService.teacherSchedule.deleteTimeBlock(teacherId, timeBlock._id)
                    await refreshTeacherData()
                    console.log('✅ Successfully deleted teaching day:', timeBlock.day)
                  } catch (error) {
                    console.error('❌ Failed to delete teaching day:', error)
                    console.error('Error details:', error.response?.data || error.message)
                    toast.error('שגיאה במחיקת יום הלימוד. אנא נסה שוב.', {
                      duration: 4000,
                      position: 'top-center',
                      style: {
                        background: '#FEE2E2',
                        color: '#991B1B',
                        border: '1px solid #FCA5A5',
                        padding: '16px',
                        fontSize: '14px',
                        fontFamily: 'Reisinger-Yonatan, sans-serif'
                      }
                    })
                  } finally {
                    setIsUpdating(false)
                  }
                }}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {isUpdating ? 'מוחק...' : 'מחק'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Time Block Modal */}
      {isAddingTimeBlock && (
        <TimeBlockForm
          teacherId={teacherId}
          timeBlock={null}
          onSave={async () => {
            await refreshTeacherData()
            setIsAddingTimeBlock(false)
          }}
          onCancel={() => setIsAddingTimeBlock(false)}
        />
      )}
    </div>
  )
}

export default ScheduleTab