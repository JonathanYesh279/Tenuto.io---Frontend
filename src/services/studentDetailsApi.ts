/**
 * Student Details API Service
 * 
 * Comprehensive API service layer for student details page data fetching
 * Implements all required endpoints with proper error handling and type safety
 */

import { format, startOfWeek, endOfWeek } from 'date-fns'

// Configuration
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 30000,
}

// Error types
export interface ApiError {
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'SERVER_ERROR' | 'NETWORK_ERROR'
  message: string
  details?: any
  status?: number
}

// API Client with enhanced error handling
class StudentDetailsApiClient {
  private baseURL: string
  private token: string | null

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.token = this.getStoredToken()
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
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
      404: 'המידע המבוקש לא נמצא',
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

  // Student Details API Methods
  async getStudentDetails(studentId: string) {
    return this.request(`/student/${studentId}`)
  }

  async getStudentSchedule(studentId: string) {
    return this.request(`/student/${studentId}/weekly-schedule`)
  }

  async getStudentAttendanceStats(studentId: string, dateRange?: { from: Date; to: Date }) {
    const params = new URLSearchParams()
    if (dateRange) {
      params.append('from', format(dateRange.from, 'yyyy-MM-dd'))
      params.append('to', format(dateRange.to, 'yyyy-MM-dd'))
    }
    
    const queryString = params.toString()
    return this.request(`/analytics/student/${studentId}/attendance${queryString ? '?' + queryString : ''}`)
  }

  async getStudentAttendanceRecords(studentId: string, dateRange?: { from: Date; to: Date }) {
    const params = new URLSearchParams()
    if (dateRange) {
      params.append('from', format(dateRange.from, 'yyyy-MM-dd'))
      params.append('to', format(dateRange.to, 'yyyy-MM-dd'))
    }
    
    const queryString = params.toString()
    return this.request(`/student/${studentId}/attendance${queryString ? '?' + queryString : ''}`)
  }

  async getStudentOrchestras(studentId: string) {
    return this.request(`/orchestra?studentId=${studentId}`)
  }

  async getStudentTheoryClasses(studentId: string) {
    return this.request(`/theory?studentId=${studentId}`)
  }

  async getStudentDocuments(studentId: string) {
    return this.request(`/file/student/${studentId}`)
  }

  // Teacher details
  async getTeacher(teacherId: string) {
    return this.request(`/teacher/${teacherId}`)
  }

  // Orchestra details  
  async getOrchestra(orchestraId: string) {
    return this.request(`/orchestra/${orchestraId}`)
  }

  // File operations
  async uploadStudentDocument(studentId: string, file: File, category: string, description?: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    if (description) {
      formData.append('description', description)
    }

    return this.request(`/file/student/${studentId}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.token}`, // Only auth header for file upload
      },
    })
  }

  async downloadStudentDocument(studentId: string, documentId: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/file/student/${studentId}/${documentId}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw await this.handleResponse(response)
    }

    return response.blob()
  }

  async deleteStudentDocument(studentId: string, documentId: string) {
    return this.request(`/file/student/${studentId}/${documentId}`, {
      method: 'DELETE',
    })
  }

  // Student update operations
  async updateStudentPersonalInfo(studentId: string, data: any) {
    return this.request(`/student/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ personalInfo: data }),
    })
  }

  async updateStudentAcademicInfo(studentId: string, data: any) {
    return this.request(`/student/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ academicInfo: data }),
    })
  }

  // Mark attendance
  async markAttendance(studentId: string, lessonId: string, status: 'present' | 'absent' | 'excused' | 'late', notes?: string) {
    return this.request(`/student/${studentId}/attendance`, {
      method: 'POST',
      body: JSON.stringify({
        lessonId,
        status,
        notes,
        date: new Date().toISOString(),
      }),
    })
  }
}

// Create singleton instance
export const studentDetailsApi = new StudentDetailsApiClient()

// Data transformation utilities
export class DataTransformUtils {
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

  static calculateAttendancePercentage(attended: number, total: number): number {
    if (total === 0) return 0
    return Math.round((attended / total) * 100)
  }

  static calculateAge(birthDate: Date): number {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
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
}

// Request deduplication utility
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }
}

export const requestDeduplicator = new RequestDeduplicator()

// Retry utility with exponential backoff
export class RetryUtils {
  static async withExponentialBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        // Don't retry on certain error types
        if ((error as ApiError).code === 'NOT_FOUND' || 
            (error as ApiError).code === 'UNAUTHORIZED' ||
            (error as ApiError).code === 'FORBIDDEN') {
          throw error
        }

        if (attempt === maxRetries) {
          throw error
        }

        // Wait with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }
}