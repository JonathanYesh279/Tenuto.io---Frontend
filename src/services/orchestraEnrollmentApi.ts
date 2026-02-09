/**
 * Orchestra and Ensemble Enrollment API Service
 * 
 * Handles all API operations for managing student orchestra and ensemble enrollments
 * including fetching available options, checking eligibility, and managing enrollment changes
 */

import { studentDetailsApi } from './studentDetailsApi'

// Types for orchestra and ensemble data structures
export interface RehearsalTime {
  day: string  // Hebrew day name
  dayOfWeek: number  // 0=Sunday, 1=Monday, etc.
  startTime: string  // "HH:mm"
  endTime: string    // "HH:mm"
  location?: string
}

export interface Orchestra {
  _id: string
  name: string
  conductor?: string
  description?: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'mixed'
  instruments: string[]  // Array of required instruments
  rehearsalTimes: RehearsalTime[]
  maxMembers?: number
  currentMembers?: number
  isActive: boolean
  yearlyFee?: number
  requirements?: string[]
}

export interface Ensemble {
  _id: string
  name: string
  director?: string
  description?: string
  type: 'chamber' | 'jazz' | 'choir' | 'band' | 'other'
  instruments: string[]
  rehearsalTimes: RehearsalTime[]
  maxMembers?: number
  currentMembers?: number
  isActive: boolean
  yearlyFee?: number
  requirements?: string[]
}

export interface EnrollmentStatus {
  orchestraId?: string
  ensembleId?: string
  status: 'enrolled' | 'available' | 'full' | 'ineligible' | 'conflict'
  enrollmentDate?: Date
  canEnroll: boolean
  conflictReason?: string
  waitlistPosition?: number
}

export interface ScheduleConflict {
  type: 'lesson' | 'orchestra' | 'ensemble'
  conflictWith: string  // Name of conflicting activity
  day: string
  startTime: string
  endTime: string
  severity: 'overlap' | 'adjacent' | 'minor'
}

export interface EnrollmentEligibility {
  canEnroll: boolean
  reasons: string[]
  conflicts: ScheduleConflict[]
  instrumentCompatible: boolean
  hasSpace: boolean
  meetsRequirements: boolean
  estimatedCost?: number
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

class OrchestraEnrollmentApiService {
  
  /**
   * Fetch details for student's current orchestra enrollments
   */
  async getCurrentOrchestraEnrollments(orchestraIds: string[]): Promise<Orchestra[]> {
    if (!orchestraIds || orchestraIds.length === 0) {
      return []
    }

    try {
      const orchestraPromises = orchestraIds.map(async (id) => {
        try {
          return await studentDetailsApi.getOrchestra(id)
        } catch (error) {
          console.warn(`Failed to fetch orchestra ${id}:`, error)
          return null
        }
      })

      const orchestras = await Promise.allSettled(orchestraPromises)
      
      return orchestras
        .filter((result): result is PromiseFulfilledResult<Orchestra> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value)
    } catch (error) {
      console.error('Error fetching orchestra enrollments:', error)
      throw {
        code: 'FETCH_ORCHESTRAS_FAILED',
        message: 'שגיאה בטעינת נתוני התזמורות',
        details: error
      } as ApiError
    }
  }

  /**
   * Fetch details for student's current ensemble enrollments
   */
  async getCurrentEnsembleEnrollments(ensembleIds: string[]): Promise<Ensemble[]> {
    if (!ensembleIds || ensembleIds.length === 0) {
      return []
    }

    try {
      const ensemblePromises = ensembleIds.map(async (id) => {
        try {
          return await studentDetailsApi.request(`/ensemble/${id}`)
        } catch (error) {
          console.warn(`Failed to fetch ensemble ${id}:`, error)
          return null
        }
      })

      const ensembles = await Promise.allSettled(ensemblePromises)
      
      return ensembles
        .filter((result): result is PromiseFulfilledResult<Ensemble> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value)
    } catch (error) {
      console.error('Error fetching ensemble enrollments:', error)
      throw {
        code: 'FETCH_ENSEMBLES_FAILED', 
        message: 'שגיאה בטעינת נתוני ההרכבים',
        details: error
      } as ApiError
    }
  }

  /**
   * Fetch all available orchestras
   */
  async getAllAvailableOrchestras(): Promise<Orchestra[]> {
    try {
      const orchestras: Orchestra[] = await studentDetailsApi.request('/orchestra')
      
      // Filter to show only active orchestras
      return orchestras.filter(orchestra => orchestra.isActive)
    } catch (error) {
      console.error('Error fetching available orchestras:', error)
      throw {
        code: 'FETCH_ALL_ORCHESTRAS_FAILED',
        message: 'שגיאה בטעינת רשימת התזמורות הזמינות',
        details: error
      } as ApiError
    }
  }

  /**
   * Fetch all available ensembles
   */
  async getAllAvailableEnsembles(): Promise<Ensemble[]> {
    try {
      const ensembles: Ensemble[] = await studentDetailsApi.request('/ensemble')
      
      // Filter to show only active ensembles
      return ensembles.filter(ensemble => ensemble.isActive)
    } catch (error) {
      console.error('Error fetching available ensembles:', error)
      throw {
        code: 'FETCH_ALL_ENSEMBLES_FAILED',
        message: 'שגיאה בטעינת רשימת ההרכבים הזמינים',
        details: error
      } as ApiError
    }
  }

  /**
   * Check if student is eligible to enroll in an orchestra
   */
  async checkOrchestraEligibility(
    studentId: string, 
    orchestraId: string, 
    studentData?: any
  ): Promise<EnrollmentEligibility> {
    try {
      // Fetch orchestra details
      const orchestra: Orchestra = await studentDetailsApi.getOrchestra(orchestraId)
      
      // Fetch student details if not provided
      const student = studentData || await studentDetailsApi.getStudentDetails(studentId)
      
      const eligibility: EnrollmentEligibility = {
        canEnroll: true,
        reasons: [],
        conflicts: [],
        instrumentCompatible: false,
        hasSpace: false,
        meetsRequirements: false
      }

      // Check instrument compatibility
      const studentInstruments = student.instrumentProgress?.map((ip: any) => ip.instrumentName) || []
      eligibility.instrumentCompatible = orchestra.instruments.some(instrument => 
        studentInstruments.includes(instrument)
      )
      
      if (!eligibility.instrumentCompatible) {
        eligibility.canEnroll = false
        eligibility.reasons.push(`הכלי שלך (${studentInstruments.join(', ')}) לא מתאים לתזמורת זו`)
      }

      // Check if orchestra has space
      if (orchestra.maxMembers && orchestra.currentMembers) {
        eligibility.hasSpace = orchestra.currentMembers < orchestra.maxMembers
        if (!eligibility.hasSpace) {
          eligibility.canEnroll = false
          eligibility.reasons.push('התזמורת מלאה - אין מקומות זמינים')
        }
      } else {
        eligibility.hasSpace = true // Assume space if no limits defined
      }

      // Check for schedule conflicts
      const conflicts = await this.detectScheduleConflicts(student, orchestra.rehearsalTimes)
      eligibility.conflicts = conflicts
      
      if (conflicts.length > 0) {
        const hasBlockingConflicts = conflicts.some(c => c.severity === 'overlap')
        if (hasBlockingConflicts) {
          eligibility.canEnroll = false
          eligibility.reasons.push('יש התנגשות עם השיעורים הקיימים שלך')
        }
      }

      // Check requirements (basic implementation)
      eligibility.meetsRequirements = true // Assume met unless specific requirements exist
      
      // Estimate cost
      eligibility.estimatedCost = orchestra.yearlyFee || 0

      return eligibility
    } catch (error) {
      console.error('Error checking orchestra eligibility:', error)
      throw {
        code: 'ELIGIBILITY_CHECK_FAILED',
        message: 'שגיאה בבדיקת זכאות לתזמורת',
        details: error
      } as ApiError
    }
  }

  /**
   * Check if student is eligible to enroll in an ensemble
   */
  async checkEnsembleEligibility(
    studentId: string, 
    ensembleId: string, 
    studentData?: any
  ): Promise<EnrollmentEligibility> {
    try {
      // Fetch ensemble details
      const ensemble: Ensemble = await studentDetailsApi.request(`/ensemble/${ensembleId}`)
      
      // Fetch student details if not provided
      const student = studentData || await studentDetailsApi.getStudentDetails(studentId)
      
      const eligibility: EnrollmentEligibility = {
        canEnroll: true,
        reasons: [],
        conflicts: [],
        instrumentCompatible: false,
        hasSpace: false,
        meetsRequirements: false
      }

      // Check instrument compatibility
      const studentInstruments = student.instrumentProgress?.map((ip: any) => ip.instrumentName) || []
      eligibility.instrumentCompatible = ensemble.instruments.some(instrument => 
        studentInstruments.includes(instrument)
      )
      
      if (!eligibility.instrumentCompatible) {
        eligibility.canEnroll = false
        eligibility.reasons.push(`הכלי שלך (${studentInstruments.join(', ')}) לא מתאים להרכב זה`)
      }

      // Check if ensemble has space
      if (ensemble.maxMembers && ensemble.currentMembers) {
        eligibility.hasSpace = ensemble.currentMembers < ensemble.maxMembers
        if (!eligibility.hasSpace) {
          eligibility.canEnroll = false
          eligibility.reasons.push('ההרכב מלא - אין מקומות זמינים')
        }
      } else {
        eligibility.hasSpace = true
      }

      // Check for schedule conflicts
      const conflicts = await this.detectScheduleConflicts(student, ensemble.rehearsalTimes)
      eligibility.conflicts = conflicts
      
      if (conflicts.length > 0) {
        const hasBlockingConflicts = conflicts.some(c => c.severity === 'overlap')
        if (hasBlockingConflicts) {
          eligibility.canEnroll = false
          eligibility.reasons.push('יש התנגשות עם השיעורים הקיימים שלך')
        }
      }

      eligibility.meetsRequirements = true
      eligibility.estimatedCost = ensemble.yearlyFee || 0

      return eligibility
    } catch (error) {
      console.error('Error checking ensemble eligibility:', error)
      throw {
        code: 'ELIGIBILITY_CHECK_FAILED',
        message: 'שגיאה בבדיקת זכאות להרכב',
        details: error
      } as ApiError
    }
  }

  /**
   * Detect schedule conflicts between student's current schedule and new rehearsal times
   */
  private async detectScheduleConflicts(
    student: any, 
    newRehearsalTimes: RehearsalTime[]
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = []
    
    try {
      // Get student's current lessons from teacherAssignments
      const currentLessons = student.teacherAssignments || []
      
      // Hebrew day names to numbers mapping
      const dayNameToNumber: Record<string, number> = {
        'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 
        'חמישי': 4, 'שישי': 5, 'שבת': 6
      }

      for (const rehearsal of newRehearsalTimes) {
        const rehearsalDay = dayNameToNumber[rehearsal.day]
        
        for (const lesson of currentLessons) {
          const lessonDay = dayNameToNumber[lesson.day]
          
          if (rehearsalDay === lessonDay) {
            // Check for time conflicts
            const rehearsalStart = this.timeToMinutes(rehearsal.startTime)
            const rehearsalEnd = this.timeToMinutes(rehearsal.endTime)
            const lessonStart = this.timeToMinutes(lesson.startTime)
            const lessonEnd = lessonStart + (lesson.duration || 45) // Default 45 minutes
            
            // Check for overlap
            if (rehearsalStart < lessonEnd && lessonStart < rehearsalEnd) {
              conflicts.push({
                type: 'lesson',
                conflictWith: `שיעור ${lesson.instrumentName || 'כלי נגינה'} עם ${lesson.teacherName || 'המורה'}`,
                day: lesson.day,
                startTime: lesson.startTime,
                endTime: this.minutesToTime(lessonEnd),
                severity: 'overlap'
              })
            }
            // Check for adjacent times (less than 30 minutes gap)
            else if (Math.abs(rehearsalStart - lessonEnd) < 30 || Math.abs(lessonStart - rehearsalEnd) < 30) {
              conflicts.push({
                type: 'lesson',
                conflictWith: `שיעור ${lesson.instrumentName || 'כלי נגינה'} עם ${lesson.teacherName || 'המורה'}`,
                day: lesson.day,
                startTime: lesson.startTime,
                endTime: this.minutesToTime(lessonEnd),
                severity: 'adjacent'
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error detecting conflicts:', error)
    }
    
    return conflicts
  }

  /**
   * Add student to orchestra enrollment
   */
  async addOrchestraEnrollment(studentId: string, orchestraId: string): Promise<void> {
    try {
      // First check eligibility
      const eligibility = await this.checkOrchestraEligibility(studentId, orchestraId)
      
      if (!eligibility.canEnroll) {
        throw {
          code: 'ENROLLMENT_NOT_ELIGIBLE',
          message: `לא ניתן להרשם: ${eligibility.reasons.join(', ')}`,
          details: { eligibility }
        } as ApiError
      }

      // Get current student data
      const student = await studentDetailsApi.getStudentDetails(studentId)
      
      // Check if already enrolled
      if (student.orchestraIds?.includes(orchestraId)) {
        throw {
          code: 'ALREADY_ENROLLED',
          message: 'התלמיד כבר רשום לתזמורת זו',
          details: { orchestraId }
        } as ApiError
      }

      // Add orchestra ID to student's enrollment list
      const updatedOrchestraIds = [...(student.orchestraIds || []), orchestraId]
      
      await studentDetailsApi.request(`/student/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          orchestraIds: updatedOrchestraIds
        })
      })

    } catch (error) {
      if ((error as ApiError).code) {
        throw error // Re-throw our custom errors
      }
      
      console.error('Error adding orchestra enrollment:', error)
      throw {
        code: 'ENROLLMENT_FAILED',
        message: 'שגיאה ברישום לתזמורת',
        details: error
      } as ApiError
    }
  }

  /**
   * Remove student from orchestra enrollment
   */
  async removeOrchestraEnrollment(studentId: string, orchestraId: string): Promise<void> {
    try {
      // Get current student data
      const student = await studentDetailsApi.getStudentDetails(studentId)
      
      // Check if actually enrolled
      if (!student.orchestraIds?.includes(orchestraId)) {
        throw {
          code: 'NOT_ENROLLED',
          message: 'התלמיד אינו רשום לתזמורת זו',
          details: { orchestraId }
        } as ApiError
      }

      // Remove orchestra ID from student's enrollment list
      const updatedOrchestraIds = student.orchestraIds.filter((id: string) => id !== orchestraId)
      
      await studentDetailsApi.request(`/student/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          orchestraIds: updatedOrchestraIds
        })
      })

    } catch (error) {
      if ((error as ApiError).code) {
        throw error
      }
      
      console.error('Error removing orchestra enrollment:', error)
      throw {
        code: 'UNENROLLMENT_FAILED',
        message: 'שגיאה בביטול רישום מהתזמורת',
        details: error
      } as ApiError
    }
  }

  /**
   * Add student to ensemble enrollment
   */
  async addEnsembleEnrollment(studentId: string, ensembleId: string): Promise<void> {
    try {
      const eligibility = await this.checkEnsembleEligibility(studentId, ensembleId)
      
      if (!eligibility.canEnroll) {
        throw {
          code: 'ENROLLMENT_NOT_ELIGIBLE',
          message: `לא ניתן להרשם: ${eligibility.reasons.join(', ')}`,
          details: { eligibility }
        } as ApiError
      }

      const student = await studentDetailsApi.getStudentDetails(studentId)
      
      if (student.ensembleIds?.includes(ensembleId)) {
        throw {
          code: 'ALREADY_ENROLLED',
          message: 'התלמיד כבר רשום להרכב זה',
          details: { ensembleId }
        } as ApiError
      }

      const updatedEnsembleIds = [...(student.ensembleIds || []), ensembleId]
      
      await studentDetailsApi.request(`/student/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ensembleIds: updatedEnsembleIds
        })
      })

    } catch (error) {
      if ((error as ApiError).code) {
        throw error
      }
      
      console.error('Error adding ensemble enrollment:', error)
      throw {
        code: 'ENROLLMENT_FAILED',
        message: 'שגיאה ברישום להרכב',
        details: error
      } as ApiError
    }
  }

  /**
   * Remove student from ensemble enrollment
   */
  async removeEnsembleEnrollment(studentId: string, ensembleId: string): Promise<void> {
    try {
      const student = await studentDetailsApi.getStudentDetails(studentId)
      
      if (!student.ensembleIds?.includes(ensembleId)) {
        throw {
          code: 'NOT_ENROLLED',
          message: 'התלמיד אינו רשום להרכב זה',
          details: { ensembleId }
        } as ApiError
      }

      const updatedEnsembleIds = student.ensembleIds.filter((id: string) => id !== ensembleId)
      
      await studentDetailsApi.request(`/student/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ensembleIds: updatedEnsembleIds
        })
      })

    } catch (error) {
      if ((error as ApiError).code) {
        throw error
      }
      
      console.error('Error removing ensemble enrollment:', error)
      throw {
        code: 'UNENROLLMENT_FAILED',
        message: 'שגיאה בביטול רישום מההרכב',
        details: error
      } as ApiError
    }
  }

  // Utility methods
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }
}

export const orchestraEnrollmentApi = new OrchestraEnrollmentApiService()