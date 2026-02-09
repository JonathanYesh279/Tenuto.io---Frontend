/**
 * File Handling Service for Student Documents
 * 
 * Comprehensive file handling with upload progress tracking,
 * authentication, validation, and support for multiple file formats
 */

import { useState, useCallback, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { studentDetailsApi } from './studentDetailsApi'
import { errorHandler } from './errorHandler'
import { queryKeys } from '@/features/students/details/hooks/useStudentDetailsHooks'

// File types and validation
export const SUPPORTED_FILE_TYPES = {
  documents: {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
  },
  images: {
    'image/jpeg': '.jpg,.jpeg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  },
  audio: {
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/m4a': '.m4a',
  },
  video: {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogv',
  }
}

export const FILE_SIZE_LIMITS = {
  documents: 10 * 1024 * 1024, // 10MB
  images: 5 * 1024 * 1024,     // 5MB
  audio: 50 * 1024 * 1024,     // 50MB
  video: 100 * 1024 * 1024,    // 100MB
}

export const FILE_CATEGORIES = {
  registration: 'מסמכי רישום',
  medical: 'מסמכים רפואיים',
  performance: 'הופעות וקונצרטים',
  assessment: 'הערכות ובחנים',
  other: 'אחר'
} as const

export type FileCategory = keyof typeof FILE_CATEGORIES

// Upload progress tracking
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
  stage: 'preparing' | 'uploading' | 'processing' | 'complete' | 'error'
  message?: string
}

export interface FileUploadState {
  isUploading: boolean
  progress: UploadProgress
  error: string | null
  uploadedFile: any | null
}

// File validation result
export interface FileValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fileType: keyof typeof SUPPORTED_FILE_TYPES | null
}

class FileHandlingService {
  private activeUploads = new Map<string, AbortController>()

  /**
   * Validate file before upload
   */
  validateFile(file: File): FileValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let fileType: keyof typeof SUPPORTED_FILE_TYPES | null = null

    // Check file size (general limit)
    if (file.size > 100 * 1024 * 1024) { // 100MB absolute max
      errors.push('קובץ גדול מדי. הגודל המקסימלי הוא 100MB')
    }

    // Determine file type category
    for (const [category, mimeTypes] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (Object.keys(mimeTypes).includes(file.type)) {
        fileType = category as keyof typeof SUPPORTED_FILE_TYPES
        break
      }
    }

    if (!fileType) {
      errors.push(`סוג קובץ לא נתמך: ${file.type}`)
    } else {
      // Check category-specific size limits
      const sizeLimit = FILE_SIZE_LIMITS[fileType]
      if (file.size > sizeLimit) {
        errors.push(`קובץ גדול מדי עבור סוג ${fileType}. הגודל המקסימלי הוא ${this.formatFileSize(sizeLimit)}`)
      }
    }

    // Check filename
    if (file.name.length > 255) {
      errors.push('שם הקובץ ארוך מדי (מקסימום 255 תווים)')
    }

    // Check for potentially dangerous file types
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (dangerousExtensions.includes(fileExtension)) {
      errors.push('סוג קובץ מסוכן אינו מותר')
    }

    // Warnings for large files
    if (file.size > 20 * 1024 * 1024) {
      warnings.push('קובץ גדול - העלאה עלולה להימשך זמן רב')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileType
    }
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(
    studentId: string,
    file: File,
    category: FileCategory,
    description?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any> {
    const uploadId = `${studentId}-${Date.now()}`
    const abortController = new AbortController()
    this.activeUploads.set(uploadId, abortController)

    try {
      // Validate file first
      const validation = this.validateFile(file)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // Show warnings
      validation.warnings.forEach(warning => {
        toast(warning, { icon: '⚠️' })
      })

      // Start upload process
      onProgress?.({
        loaded: 0,
        total: file.size,
        percentage: 0,
        stage: 'preparing',
        message: 'מכין קובץ להעלאה...'
      })

      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      if (description) {
        formData.append('description', description)
      }

      // Upload with progress tracking
      const result = await this.uploadWithProgress(
        studentId,
        formData,
        abortController.signal,
        onProgress
      )

      onProgress?.({
        loaded: file.size,
        total: file.size,
        percentage: 100,
        stage: 'complete',
        message: 'העלאה הושלמה בהצלחה'
      })

      return result

    } catch (error) {
      onProgress?.({
        loaded: 0,
        total: file.size,
        percentage: 0,
        stage: 'error',
        message: 'שגיאה בהעלאת הקובץ'
      })
      throw error
    } finally {
      this.activeUploads.delete(uploadId)
    }
  }

  /**
   * Upload with XMLHttpRequest for progress tracking
   */
  private async uploadWithProgress(
    studentId: string,
    formData: FormData,
    signal: AbortSignal,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // Handle abort signal
      signal.addEventListener('abort', () => {
        xhr.abort()
        reject(new Error('העלאה בוטלה'))
      })

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100)
          onProgress?.({
            loaded: event.loaded,
            total: event.total,
            percentage,
            stage: 'uploading',
            message: `מעלה... ${percentage}%`
          })
        }
      })

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            reject(new Error('שגיאה בפענוח תגובת השרת'))
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            reject(new Error(errorResponse.message || `שגיאת שרת: ${xhr.status}`))
          } catch {
            reject(new Error(`שגיאת שרת: ${xhr.status}`))
          }
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('שגיאת רשת בהעלאת הקובץ'))
      })

      // Handle timeout
      xhr.addEventListener('timeout', () => {
        reject(new Error('פג זמן ההמתנה בהעלאת הקובץ'))
      })

      // Get auth token
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      
      // Configure request
      xhr.open('POST', `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/file/student/${studentId}`)
      xhr.timeout = 5 * 60 * 1000 // 5 minutes timeout
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      // Start upload
      xhr.send(formData)
    })
  }

  /**
   * Cancel active upload
   */
  cancelUpload(uploadId: string): boolean {
    const controller = this.activeUploads.get(uploadId)
    if (controller) {
      controller.abort()
      this.activeUploads.delete(uploadId)
      return true
    }
    return false
  }

  /**
   * Cancel all active uploads
   */
  cancelAllUploads(): void {
    this.activeUploads.forEach(controller => controller.abort())
    this.activeUploads.clear()
  }

  /**
   * Download file with proper authentication
   */
  async downloadFile(studentId: string, documentId: string, filename: string): Promise<void> {
    try {
      const blob = await studentDetailsApi.downloadStudentDocument(studentId, documentId)
      
      // Create download URL
      const url = window.URL.createObjectURL(blob)
      
      // Create temporary link element
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      
      // Add to DOM, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up URL
      window.URL.revokeObjectURL(url)
      
      toast.success(`הקובץ ${filename} הורד בהצלחה`)
    } catch (error) {
      errorHandler.handleError(error, 'file-download')
      throw error
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get file type icon
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📎'
    return '📁'
  }

  /**
   * Get supported file extensions for file input
   */
  getSupportedExtensions(): string {
    const allExtensions = Object.values(SUPPORTED_FILE_TYPES)
      .flatMap(types => Object.values(types))
      .join(',')
    return allExtensions
  }
}

// Create singleton instance
export const fileHandlingService = new FileHandlingService()

// React Hook for file upload
export function useFileUpload() {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    isUploading: false,
    progress: {
      loaded: 0,
      total: 0,
      percentage: 0,
      stage: 'preparing'
    },
    error: null,
    uploadedFile: null
  })

  const queryClient = useQueryClient()
  
  const uploadFile = useCallback(async (
    studentId: string,
    file: File,
    category: FileCategory,
    description?: string
  ) => {
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
      uploadedFile: null
    }))

    try {
      const result = await fileHandlingService.uploadFile(
        studentId,
        file,
        category,
        description,
        (progress) => {
          setUploadState(prev => ({
            ...prev,
            progress
          }))
        }
      )

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadedFile: result
      }))

      // Invalidate documents query
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.documents(studentId)
      })

      toast.success('הקובץ הועלה בהצלחה')
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בהעלאת הקובץ'
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }))

      errorHandler.handleError(error, 'file-upload')
      throw error
    }
  }, [queryClient])

  const reset = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: {
        loaded: 0,
        total: 0,
        percentage: 0,
        stage: 'preparing'
      },
      error: null,
      uploadedFile: null
    })
  }, [])

  return {
    uploadState,
    uploadFile,
    reset,
    validateFile: fileHandlingService.validateFile.bind(fileHandlingService),
    formatFileSize: fileHandlingService.formatFileSize.bind(fileHandlingService),
    getSupportedExtensions: fileHandlingService.getSupportedExtensions.bind(fileHandlingService)
  }
}

// React Hook for file download
export function useFileDownload() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const downloadFile = useCallback(async (
    studentId: string,
    documentId: string,
    filename: string
  ) => {
    setIsDownloading(true)
    setDownloadError(null)

    try {
      await fileHandlingService.downloadFile(studentId, documentId, filename)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בהורדת הקובץ'
      setDownloadError(errorMessage)
      throw error
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return {
    downloadFile,
    isDownloading,
    downloadError,
    clearError: () => setDownloadError(null)
  }
}

// React Hook for multiple file uploads
export function useMultipleFileUpload() {
  const [uploads, setUploads] = useState<Map<string, FileUploadState>>(new Map())
  const queryClient = useQueryClient()

  const uploadFiles = useCallback(async (
    studentId: string,
    files: File[],
    category: FileCategory,
    description?: string
  ) => {
    const uploadPromises = files.map(async (file, index) => {
      const uploadId = `${file.name}-${index}`
      
      // Initialize upload state
      setUploads(prev => new Map(prev.set(uploadId, {
        isUploading: true,
        progress: {
          loaded: 0,
          total: file.size,
          percentage: 0,
          stage: 'preparing'
        },
        error: null,
        uploadedFile: null
      })))

      try {
        const result = await fileHandlingService.uploadFile(
          studentId,
          file,
          category,
          description,
          (progress) => {
            setUploads(prev => {
              const newMap = new Map(prev)
              const current = newMap.get(uploadId)
              if (current) {
                newMap.set(uploadId, {
                  ...current,
                  progress
                })
              }
              return newMap
            })
          }
        )

        // Update success state
        setUploads(prev => {
          const newMap = new Map(prev)
          newMap.set(uploadId, {
            isUploading: false,
            progress: {
              loaded: file.size,
              total: file.size,
              percentage: 100,
              stage: 'complete'
            },
            error: null,
            uploadedFile: result
          })
          return newMap
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'שגיאה בהעלאת הקובץ'
        
        setUploads(prev => {
          const newMap = new Map(prev)
          newMap.set(uploadId, {
            isUploading: false,
            progress: {
              loaded: 0,
              total: file.size,
              percentage: 0,
              stage: 'error'
            },
            error: errorMessage,
            uploadedFile: null
          })
          return newMap
        })

        throw error
      }
    })

    try {
      const results = await Promise.allSettled(uploadPromises)
      
      // Invalidate documents query
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.documents(studentId)
      })

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast.success(`${successful} קבצים הועלו בהצלחה`)
      }
      if (failed > 0) {
        toast.error(`${failed} קבצים נכשלו בהעלאה`)
      }

      return results
    } catch (error) {
      errorHandler.handleError(error, 'multiple-file-upload')
      throw error
    }
  }, [queryClient])

  const clearUploads = useCallback(() => {
    setUploads(new Map())
  }, [])

  return {
    uploads,
    uploadFiles,
    clearUploads
  }
}

export default fileHandlingService