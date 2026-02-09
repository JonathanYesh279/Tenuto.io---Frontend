/**
 * Calendar Data Processing Service
 * 
 * Processes student data (teacherAssignments and orchestra enrollment) 
 * into calendar events for display in the ScheduleTab component
 */

import { studentDetailsApi } from './studentDetailsApi'

// Types for actual backend data structure
interface TeacherAssignment {
  teacherId: string
  day: string  // Hebrew day name like "שלישי"
  startTime: string  // "14:30"
  duration: number  // minutes
  instrumentName?: string
}

interface StudentDetails {
  _id: string
  teacherAssignments: TeacherAssignment[]
  orchestraEnrollments?: string[]  // array of orchestra IDs
  instrumentProgress?: Array<{
    instrumentName: string
    level?: string
  }>
}

interface Teacher {
  _id: string
  name: string
  timeBlocks: Array<{
    day: string
    startTime: string
    endTime: string
    location: string
  }>
}

interface Orchestra {
  _id: string
  name: string
  rehearsalTimes?: Array<{
    day: string
    startTime: string
    duration: number
    location?: string
  }>
}

// Output format for calendar display
interface CalendarEvent {
  _id: string
  title: string
  day: string  // Hebrew day name
  dayOfWeek: number  // 0=Sunday, 1=Monday, etc.
  startTime: string
  endTime: string
  location: string
  lessonType: 'individual' | 'group' | 'orchestra' | 'theory'
  teacherName: string
  instrumentName: string
  roomNumber?: string
}

class CalendarDataProcessor {
  
  /**
   * Hebrew day names mapping to numbers
   */
  private readonly DAY_NAME_TO_NUMBER: Record<string, number> = {
    'ראשון': 0,
    'שני': 1, 
    'שלישי': 2,
    'רביעי': 3,
    'חמישי': 4,
    'שישי': 5,
    'שבת': 6
  }

  /**
   * Calculates end time by adding duration (in minutes) to start time
   */
  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    
    const endHours = Math.floor(totalMinutes / 60)
    const endMins = totalMinutes % 60
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  /**
   * Finds teacher's location for a specific day
   */
  private getTeacherLocationForDay(teacher: Teacher, day: string): string {
    const timeBlock = teacher.teaching?.timeBlocks?.find(block => block.day === day)
    return timeBlock?.location || ''
  }

  /**
   * Gets instrument name from student's instrumentProgress
   */
  private getInstrumentName(student: StudentDetails): string {
    if (student.instrumentProgress && student.instrumentProgress.length > 0) {
      return student.instrumentProgress[0].instrumentName
    }
    return 'כלי נגינה' // Default fallback
  }

  /**
   * Processes teacher assignments into calendar events
   */
  private async processTeacherAssignments(
    student: StudentDetails,
    teacherAssignment: TeacherAssignment
  ): Promise<CalendarEvent | null> {
    try {
      // Fetch teacher details
      const teacher: Teacher = await studentDetailsApi.getTeacher(teacherAssignment.teacherId)
      
      // Get location from teacher's timeBlocks
      const location = this.getTeacherLocationForDay(teacher, teacherAssignment.day)
      
      // Calculate end time
      const endTime = this.calculateEndTime(teacherAssignment.startTime, teacherAssignment.duration)
      
      // Get instrument name
      const instrumentName = teacherAssignment.instrumentName || this.getInstrumentName(student)
      
      return {
        _id: `lesson-${teacherAssignment.teacherId}-${teacherAssignment.day}`,
        title: `${instrumentName} - ${teacher.name}`,
        day: teacherAssignment.day,
        dayOfWeek: this.DAY_NAME_TO_NUMBER[teacherAssignment.day] || 0,
        startTime: teacherAssignment.startTime,
        endTime: endTime,
        location: location,
        lessonType: 'individual',
        teacherName: teacher.name,
        instrumentName: instrumentName,
        roomNumber: location
      }
    } catch (error) {
      console.error('Error processing teacher assignment:', error)
      return null
    }
  }

  /**
   * Processes orchestra enrollments into calendar events
   */
  private async processOrchestraEnrollments(
    student: StudentDetails
  ): Promise<CalendarEvent[]> {
    if (!student.orchestraEnrollments || student.orchestraEnrollments.length === 0) {
      return []
    }

    const orchestraEvents: CalendarEvent[] = []

    for (const orchestraId of student.orchestraEnrollments) {
      try {
        // Fetch orchestra details
        const orchestra: Orchestra = await studentDetailsApi.getOrchestra(orchestraId)
        
        // Process rehearsal times if they exist
        if (orchestra.rehearsalTimes) {
          for (const rehearsal of orchestra.rehearsalTimes) {
            const endTime = this.calculateEndTime(rehearsal.startTime, rehearsal.duration)
            
            orchestraEvents.push({
              _id: `orchestra-${orchestraId}-${rehearsal.day}`,
              title: `תזמורת - ${orchestra.name}`,
              day: rehearsal.day,
              dayOfWeek: this.DAY_NAME_TO_NUMBER[rehearsal.day] || 0,
              startTime: rehearsal.startTime,
              endTime: endTime,
              location: rehearsal.location || '',
              lessonType: 'orchestra',
              teacherName: 'תזמורת',
              instrumentName: 'תזמורת',
              roomNumber: rehearsal.location
            })
          }
        }
      } catch (error) {
        console.error(`Error processing orchestra ${orchestraId}:`, error)
      }
    }

    return orchestraEvents
  }

  /**
   * Main processing function - transforms student data into calendar events
   */
  async processStudentSchedule(student: StudentDetails): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = []

    // Process teacher assignments
    if (student.teacherAssignments && student.teacherAssignments.length > 0) {
      for (const assignment of student.teacherAssignments) {
        const event = await this.processTeacherAssignments(student, assignment)
        if (event) {
          events.push(event)
        }
      }
    }

    // Process orchestra enrollments
    const orchestraEvents = await this.processOrchestraEnrollments(student)
    events.push(...orchestraEvents)

    return events
  }

  /**
   * Handle the single lesson case - returns events even if most days are empty
   * This is normal for students with limited schedules
   */
  async getWeeklySchedule(studentId: string): Promise<CalendarEvent[]> {
    try {
      // Fetch student details
      const student: StudentDetails = await studentDetailsApi.getStudentDetails(studentId)
      
      // Process all data into calendar events
      const events = await this.processStudentSchedule(student)
      
      // Return events (can be empty or sparse - that's normal)
      return events
    } catch (error) {
      console.error('Error getting weekly schedule:', error)
      throw error
    }
  }

  /**
   * Utility function to validate if a student has any schedule data
   */
  hasScheduleData(student: StudentDetails): boolean {
    const hasTeacherAssignments = student.teacherAssignments && student.teacherAssignments.length > 0
    const hasOrchestraEnrollments = student.orchestraEnrollments && student.orchestraEnrollments.length > 0
    
    return hasTeacherAssignments || hasOrchestraEnrollments
  }

  /**
   * Get events for a specific day
   */
  getEventsForDay(events: CalendarEvent[], dayOfWeek: number): CalendarEvent[] {
    return events.filter(event => event.dayOfWeek === dayOfWeek)
  }

  /**
   * Check if a day has any events
   */
  hasDayEvents(events: CalendarEvent[], dayOfWeek: number): boolean {
    return this.getEventsForDay(events, dayOfWeek).length > 0
  }
}

export const calendarDataProcessor = new CalendarDataProcessor()
export type { CalendarEvent, StudentDetails, TeacherAssignment, Teacher, Orchestra }