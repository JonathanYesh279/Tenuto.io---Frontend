/**
 * Teacher Details API Service
 * 
 * Comprehensive API service layer for teacher details page data fetching
 * Based on the actual backend teacher data structure and service methods
 */

import { format, startOfWeek, endOfWeek } from 'date-fns'

// Configuration
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 30000,
}

// Error types
export interface ApiError {
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'SERVER_ERROR' | 'NETWORK_ERROR' | 'DUPLICATE_TEACHER_DETECTED'
  message: string
  details?: any
  status?: number
  duplicateInfo?: {
    blocked: boolean
    reason: string
    duplicates: any[]
    totalDuplicatesFound: number
  }
}

// API Client with enhanced error handling
class TeacherDetailsApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Get token fresh on each request to ensure we always have the latest
    const token = this.getStoredToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    
    let data: any
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      const error: ApiError = {
        code: this.getErrorCode(response.status),
        message: this.getErrorMessage(response.status, data),
        details: data,
        status: response.status
      }

      // Handle special duplicate teacher errors
      if (data?.code === 'DUPLICATE_TEACHER_DETECTED') {
        error.code = 'DUPLICATE_TEACHER_DETECTED'
        error.duplicateInfo = data.duplicateInfo
      }

      throw error
    }

    return data
  }

  private getErrorCode(status: number): ApiError['code'] {
    switch (status) {
      case 401: return 'UNAUTHORIZED'
      case 403: return 'FORBIDDEN'
      case 404: return 'NOT_FOUND'
      case 422: return 'VALIDATION_ERROR'
      case 500:
      case 502:
      case 503: return 'SERVER_ERROR'
      default: return 'NETWORK_ERROR'
    }
  }

  private getErrorMessage(status: number, data: any): string {
    const hebrewMessages = {
      401: 'נדרשת התחברות מחדש למערכת',
      403: 'אין הרשאה לצפייה בתוכן זה',
      404: 'המורה המבוקש לא נמצא',
      422: 'נתונים לא תקינים',
      500: 'שגיאת שרת פנימית',
      502: 'השרת אינו זמין כרגע',
      503: 'השירות אינו זמין כרגע'
    }

    return data?.message || hebrewMessages[status as keyof typeof hebrewMessages] || 'שגיאה לא צפויה'
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    }

    try {
      const response = await fetch(url, config)
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw {
            code: 'NETWORK_ERROR',
            message: 'הבקשה נכשלה - פג זמן ההמתנה',
            details: { timeout: true }
          } as ApiError
        }
        
        if (error.message.includes('Failed to fetch')) {
          throw {
            code: 'NETWORK_ERROR',
            message: 'לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט',
            details: { networkError: true }
          } as ApiError
        }
      }
      
      throw error
    }
  }

  // Teacher Details API Methods
  async getTeacherDetails(teacherId: string) {
    return this.request(`/teacher/${teacherId}`)
  }

  async getAllTeachers(filterBy?: any) {
    const params = new URLSearchParams()
    if (filterBy) {
      Object.keys(filterBy).forEach(key => {
        if (filterBy[key] !== undefined && filterBy[key] !== null) {
          params.append(key, filterBy[key].toString())
        }
      })
    }
    
    const queryString = params.toString()
    return this.request(`/teacher${queryString ? '?' + queryString : ''}`)
  }

  async getTeacherIds() {
    return this.request('/teacher/ids')
  }

  async getTeachersByRole(role: string) {
    return this.request(`/teacher/role/${role}`)
  }

  // Teacher's students management
  async getTeacherStudents(teacherId: string) {
    const response = await this.request(`/teacher/${teacherId}/students-with-lessons`) as any
    const students = response?.data?.students || response?.students || []
    return Array.isArray(students) ? students : []
  }

  // Schedule management
  async updateTeacherSchedule(teacherId: string, scheduleData: any) {
    return this.request(`/teacher/${teacherId}/schedule`, {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    })
  }

  async addStudentToTeacher(teacherId: string, studentId: string) {
    return this.request(`/teacher/${teacherId}/student/${studentId}`, {
      method: 'POST',
    })
  }

  async removeStudentFromTeacher(teacherId: string, studentId: string) {
    return this.request(`/teacher/${teacherId}/student/${studentId}`, {
      method: 'DELETE',
    })
  }

  // Teacher data updates
  async updateTeacherPersonalInfo(teacherId: string, data: any) {
    return this.request(`/teacher/${teacherId}`, {
      method: 'PUT',
      body: JSON.stringify({ personalInfo: data }),
    })
  }

  async updateTeacherProfessionalInfo(teacherId: string, data: any) {
    return this.request(`/teacher/${teacherId}`, {
      method: 'PUT',
      body: JSON.stringify({ professionalInfo: data }),
    })
  }

  async updateTeacherTimeBlocks(teacherId: string, timeBlocks: any[]) {
    return this.request(`/teacher/${teacherId}`, {
      method: 'PUT',
      body: JSON.stringify({ timeBlocks }),
    })
  }

  // Teacher creation and management
  async createTeacher(teacherData: any, adminId?: string) {
    return this.request('/teacher', {
      method: 'POST',
      body: JSON.stringify({ ...teacherData, adminId }),
    })
  }

  async deactivateTeacher(teacherId: string) {
    return this.request(`/teacher/${teacherId}`, {
      method: 'DELETE',
    })
  }

  // Analytics and reports
  async getTeacherStatistics(teacherId: string, dateRange?: { from: Date; to: Date }) {
    const params = new URLSearchParams()
    if (dateRange) {
      params.append('from', format(dateRange.from, 'yyyy-MM-dd'))
      params.append('to', format(dateRange.to, 'yyyy-MM-dd'))
    }
    
    const queryString = params.toString()
    return this.request(`/analytics/teacher/${teacherId}${queryString ? '?' + queryString : ''}`)
  }

  // Schedule availability checking
  async checkScheduleAvailability(teacherId: string, day: string, startTime: string, duration: number) {
    return this.request(`/teacher/${teacherId}/availability`, {
      method: 'POST',
      body: JSON.stringify({ day, startTime, duration }),
    })
  }

  // Time block management
  async addTimeBlock(teacherId: string, timeBlockData: any) {
    return this.request(`/teacher/${teacherId}/timeblock`, {
      method: 'POST',
      body: JSON.stringify(timeBlockData),
    })
  }

  async updateTimeBlock(teacherId: string, timeBlockId: string, timeBlockData: any) {
    return this.request(`/teacher/${teacherId}/timeblock/${timeBlockId}`, {
      method: 'PUT',
      body: JSON.stringify(timeBlockData),
    })
  }

  async removeTimeBlock(teacherId: string, timeBlockId: string) {
    return this.request(`/teacher/${teacherId}/timeblock/${timeBlockId}`, {
      method: 'DELETE',
    })
  }
}

// Create singleton instance
export const teacherDetailsApi = new TeacherDetailsApiClient()

// Data transformation utilities for teacher data
export class TeacherDataTransformUtils {
  static transformHebrewDates(data: any): any {
    if (!data) return data

    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}/.test(data)) {
      return new Date(data)
    }

    if (Array.isArray(data)) {
      return data.map(item => this.transformHebrewDates(item))
    }

    if (typeof data === 'object') {
      const transformed = { ...data }
      for (const key in transformed) {
        if (key.includes('Date') || key.includes('date') || key === 'createdAt' || key === 'updatedAt') {
          transformed[key] = this.transformHebrewDates(transformed[key])
        } else if (typeof transformed[key] === 'object') {
          transformed[key] = this.transformHebrewDates(transformed[key])
        }
      }
      return transformed
    }

    return data
  }

  static formatPhoneNumber(phone: string): string {
    if (!phone) return ''
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    
    // Format Israeli phone numbers
    if (digits.length === 10 && digits.startsWith('05')) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    
    if (digits.length === 9 && digits.startsWith('5')) {
      return `05${digits.slice(1, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    }
    
    return phone
  }

  static calculateTeachingHours(schedule: any[]): number {
    if (!schedule || schedule.length === 0) return 0
    
    return schedule.reduce((total, slot) => {
      return total + (slot.duration || 0)
    }, 0) / 60 // Convert minutes to hours
  }

  static getActiveStudentCount(studentIds: string[]): number {
    return studentIds ? studentIds.length : 0
  }

  static formatTimeBlock(timeBlock: any): string {
    if (!timeBlock) return ''
    
    return `${timeBlock.day} ${timeBlock.startTime}-${timeBlock.endTime} (${timeBlock.location || 'ללא מיקום'})`
  }

  static checkTimeBlockConflict(existingBlocks: any[], newBlock: any): boolean {
    if (!existingBlocks || existingBlocks.length === 0) return false
    
    return existingBlocks.some(block => {
      if (block.day !== newBlock.day) return false
      
      const blockStart = this.timeToMinutes(block.startTime)
      const blockEnd = this.timeToMinutes(block.endTime)
      const newStart = this.timeToMinutes(newBlock.startTime)
      const newEnd = this.timeToMinutes(newBlock.endTime)
      
      return (newStart < blockEnd) && (blockStart < newEnd)
    })
  }

  static timeToMinutes(time: string): number {
    if (!time) return 0
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  static getWeekRange(date: Date = new Date()) {
    return {
      start: startOfWeek(date, { weekStartsOn: 0 }), // Sunday
      end: endOfWeek(date, { weekStartsOn: 0 })
    }
  }

  static safeParseJson<T>(jsonString: string, fallback: T): T {
    try {
      return JSON.parse(jsonString)
    } catch {
      return fallback
    }
  }

  static handleNullUndefined<T>(value: T | null | undefined, fallback: T): T {
    return value ?? fallback
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validatePhoneNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length === 10 && cleanPhone.startsWith('05')
  }

  static generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
    const slots: string[] = []
    const start = this.timeToMinutes(startTime)
    const end = this.timeToMinutes(endTime)
    
    for (let time = start; time < end; time += duration) {
      slots.push(this.minutesToTime(time))
    }
    
    return slots
  }

  static isWorkingDay(day: string): boolean {
    const workingDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי']
    return workingDays.includes(day)
  }

  static sortTimeBlocks(timeBlocks: any[]): any[] {
    const dayOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    
    return timeBlocks.sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
      if (dayDiff !== 0) return dayDiff
      
      return this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
    })
  }
}