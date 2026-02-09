/**
 * WebSocket Service for Real-time Updates
 * 
 * Manages Socket.IO connections for real-time student data updates
 * with automatic reconnection and proper error handling
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/features/students/details/hooks/useStudentDetailsHooks'
import { io, Socket } from 'socket.io-client'

// Socket.IO configuration
const WS_CONFIG = {
  // Remove /api from the URL if present - Socket.IO connects to the base URL
  url: (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, ''),
  reconnectDelay: 1000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
}

// Message types
interface WebSocketMessage {
  type: 'student_update' | 'attendance_update' | 'schedule_update' | 'document_update' | 'heartbeat'
  data: any
  studentId?: string
  timestamp: string
}

interface StudentUpdateMessage extends WebSocketMessage {
  type: 'student_update'
  data: {
    studentId: string
    field: string
    newValue: any
    updatedBy: string
  }
}

interface AttendanceUpdateMessage extends WebSocketMessage {
  type: 'attendance_update'
  data: {
    studentId: string
    lessonId: string
    status: 'present' | 'absent' | 'excused' | 'late'
    timestamp: string
    updatedBy: string
  }
}

interface ScheduleUpdateMessage extends WebSocketMessage {
  type: 'schedule_update'
  data: {
    studentId: string
    scheduleChange: any
    changeType: 'add' | 'update' | 'delete'
    updatedBy: string
  }
}

interface DocumentUpdateMessage extends WebSocketMessage {
  type: 'document_update'
  data: {
    studentId: string
    documentId: string
    action: 'upload' | 'delete' | 'update'
    document?: any
    updatedBy: string
  }
}

// Socket.IO Manager Class
class WebSocketManager {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private messageHandlers = new Map<string, Set<(message: WebSocketMessage) => void>>()
  private isConnected = false
  private shouldReconnect = true
  private isConnecting = false

  constructor() {
    // Don't auto-connect in constructor to avoid crashes
    // Connection will be initiated when needed
  }

  // Public method to initiate connection
  public connect() {
    if (this.isConnecting || this.isConnected) {
      return
    }
    this.connectInternal()
  }

  private connectInternal() {
    if (this.isConnecting) {
      return
    }

    this.isConnecting = true

    try {
      // Don't attempt connection if we've exceeded max attempts
      if (this.reconnectAttempts >= WS_CONFIG.maxReconnectAttempts) {
        console.warn('Socket.IO max reconnection attempts reached. Stopping reconnection.')
        this.shouldReconnect = false
        this.isConnecting = false
        return
      }

      // Get authentication token
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      
      console.log('Attempting Socket.IO connection to:', WS_CONFIG.url)
      
      this.socket = io(WS_CONFIG.url, {
        auth: token ? { token } : undefined,
        transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
        reconnection: false, // We handle reconnection manually
        autoConnect: true,
        withCredentials: true
      })
      
      this.setupSocketHandlers()
    } catch (error) {
      console.warn('Socket.IO connection failed:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  private setupSocketHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Socket.IO connected event fired')
      this.handleOpen()
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason)
      this.handleClose({ code: 1006, reason })
    })

    this.socket.on('connect_error', (error: any) => {
      console.error('Socket.IO connect_error:', error.message, error.type)
      this.handleError(error)
    })

    // Handle all custom message types
    this.socket.on('student_update', (data) => {
      this.handleMessage({ data: { type: 'student_update', data, timestamp: new Date().toISOString() } })
    })

    this.socket.on('attendance_update', (data) => {
      this.handleMessage({ data: { type: 'attendance_update', data, timestamp: new Date().toISOString() } })
    })

    this.socket.on('schedule_update', (data) => {
      this.handleMessage({ data: { type: 'schedule_update', data, timestamp: new Date().toISOString() } })
    })

    this.socket.on('document_update', (data) => {
      this.handleMessage({ data: { type: 'document_update', data, timestamp: new Date().toISOString() } })
    })

    this.socket.on('heartbeat', () => {
      this.handleMessage({ data: { type: 'heartbeat', timestamp: new Date().toISOString() } })
    })

    // Cascade deletion events
    this.socket.on('cascade.progress', (data) => {
      this.handleMessage({ data: { type: 'deletion_progress', ...data, timestamp: new Date().toISOString() } })
    })

    this.socket.on('cascade.complete', (data) => {
      this.handleMessage({ data: { type: 'deletion_complete', ...data, timestamp: new Date().toISOString() } })
    })

    this.socket.on('deletion.warning', (data) => {
      this.handleMessage({ data: { type: 'deletion_error', ...data, timestamp: new Date().toISOString() } })
    })

    this.socket.on('notification', (data) => {
      this.handleMessage({ data: { type: 'notification', ...data, timestamp: new Date().toISOString() } })
    })

    this.socket.on('system.alert', (data) => {
      this.handleMessage({ data: { type: 'system_alert', ...data, timestamp: new Date().toISOString() } })
    })
  }

  private handleOpen() {
    console.log('Socket.IO connected successfully')
    this.isConnected = true
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.startHeartbeat()
    
    // Authentication is handled automatically via auth object in connection
  }

  private handleMessage(event: { data: WebSocketMessage }) {
    try {
      const message: WebSocketMessage = event.data
      
      // Handle heartbeat responses
      if (message.type === 'heartbeat') {
        return
      }
      
      // Distribute message to all handlers for this type
      const handlers = this.messageHandlers.get(message.type)
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message)
          } catch (error) {
            console.error('Message handler error:', error)
          }
        })
      }
      
      // Also notify wildcard handlers
      const wildcardHandlers = this.messageHandlers.get('*')
      if (wildcardHandlers) {
        wildcardHandlers.forEach(handler => {
          try {
            handler(message)
          } catch (error) {
            console.error('Wildcard handler error:', error)
          }
        })
      }
    } catch (error) {
      console.error('Error processing Socket.IO message:', error)
    }
  }

  private handleClose(event: { code: number; reason: string }) {
    console.log('Socket.IO disconnected:', event.code, event.reason)
    this.isConnected = false
    this.isConnecting = false
    this.stopHeartbeat()
    
    // Only attempt reconnection for certain close codes
    const shouldAttemptReconnect = event.code !== 1000 && // Normal closure
                                  event.code !== 1001 && // Going away
                                  event.code !== 1005    // No status received
    
    if (this.shouldReconnect && shouldAttemptReconnect && this.reconnectAttempts < WS_CONFIG.maxReconnectAttempts) {
      this.scheduleReconnect()
    } else if (this.reconnectAttempts >= WS_CONFIG.maxReconnectAttempts) {
      console.warn('Socket.IO max reconnection attempts reached')
      this.shouldReconnect = false
    }
  }

  private handleError(event: Error) {
    console.warn('Socket.IO connection error:', event)
    this.isConnecting = false
    // Don't throw errors that could crash the application
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || this.reconnectAttempts >= WS_CONFIG.maxReconnectAttempts) {
      return
    }
    
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    
    this.reconnectAttempts++
    
    // Exponential backoff with jitter
    const baseDelay = WS_CONFIG.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    const delay = Math.min(baseDelay + jitter, 30000) // Cap at 30 seconds
    
    console.log(`Socket.IO scheduling reconnect attempt ${this.reconnectAttempts}/${WS_CONFIG.maxReconnectAttempts} in ${Math.round(delay)}ms`)
    
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect && !this.isConnected && !this.isConnecting) {
        this.connectInternal()
      }
    }, delay)
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.socket?.connected) {
        this.send({ type: 'heartbeat', timestamp: new Date().toISOString() })
      }
    }, WS_CONFIG.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // Public methods
  send(message: any) {
    if (this.socket?.connected) {
      try {
        // Send based on message type
        if (message.type) {
          this.socket.emit(message.type, message)
        } else {
          this.socket.emit('message', message)
        }
      } catch (error) {
        console.warn('Failed to send Socket.IO message:', error)
      }
    } else {
      console.warn('Socket.IO not connected, cannot send message. Connection state:', this.socket?.connected)
      // Attempt to reconnect if not already trying
      if (!this.isConnecting && this.shouldReconnect) {
        this.connectInternal()
      }
    }
  }

  subscribe(messageType: string, handler: (message: WebSocketMessage) => void) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set())
    }
    this.messageHandlers.get(messageType)!.add(handler)
    
    return () => {
      const handlers = this.messageHandlers.get(messageType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.messageHandlers.delete(messageType)
        }
      }
    }
  }

  subscribeToStudent(studentId: string) {
    // Only try to subscribe if connected, otherwise queue for later
    if (this.isConnected && this.socket) {
      this.socket.emit('subscribe', {
        channel: `student/${studentId}/updates`
      })
    } else {
      console.log(`Socket.IO not connected, queuing subscription for student ${studentId}`)
    }
  }

  unsubscribeFromStudent(studentId: string) {
    if (this.isConnected && this.socket) {
      this.socket.emit('unsubscribe', {
        channel: `student/${studentId}/updates`
      })
    }
  }

  // Cascade deletion subscriptions
  subscribeToCascadeDeletion(studentId: string) {
    if (this.isConnected && this.socket) {
      this.socket.emit('subscribe.cascade', {
        studentId
      })
    } else {
      console.log(`Socket.IO not connected, queuing cascade subscription for student ${studentId}`)
    }
  }

  unsubscribeFromCascadeDeletion(studentId: string) {
    if (this.isConnected && this.socket) {
      this.socket.emit('unsubscribe.cascade', {
        studentId
      })
    }
  }

  subscribeToIntegrityUpdates() {
    if (this.isConnected && this.socket) {
      this.socket.emit('subscribe.integrity')
    }
  }

  subscribeToJobUpdates() {
    if (this.isConnected && this.socket) {
      this.socket.emit('subscribe.jobs')
    }
  }

  disconnect() {
    console.log('Socket.IO disconnecting manually')
    this.shouldReconnect = false
    this.stopHeartbeat()
    
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.isConnected = false
    this.isConnecting = false
    this.reconnectAttempts = 0
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      connected: this.socket?.connected
    }
  }
}

// Singleton instance
const wsManager = new WebSocketManager()

// React Hook for WebSocket integration
export function useWebSocketUpdates(studentId: string | null) {
  const queryClient = useQueryClient()
  const subscribedStudentId = useRef<string | null>(null)

  // Subscribe to student updates
  useEffect(() => {
    if (!studentId) return

    try {
      // Ensure Socket.IO is connected before subscribing
      if (!wsManager.getConnectionStatus().isConnected) {
        wsManager.connect()
      }
      
      // Subscribe to student channel
      wsManager.subscribeToStudent(studentId)
      subscribedStudentId.current = studentId
    } catch (error) {
      console.warn('Failed to setup Socket.IO subscription:', error)
    }

    return () => {
      try {
        if (subscribedStudentId.current) {
          wsManager.unsubscribeFromStudent(subscribedStudentId.current)
          subscribedStudentId.current = null
        }
      } catch (error) {
        console.warn('Failed to cleanup Socket.IO subscription:', error)
      }
    }
  }, [studentId])

  // Handle different types of updates
  useEffect(() => {
    const handleStudentUpdate = (message: StudentUpdateMessage) => {
      if (!studentId || message.data.studentId !== studentId) return

      console.log('Received student update:', message.data)
      
      // Update the cached student data
      queryClient.setQueryData(
        queryKeys.students.details(studentId),
        (oldData: any) => {
          if (!oldData) return oldData
          
          const updatedData = { ...oldData }
          const fieldPath = message.data.field.split('.')
          
          // Navigate to the nested field and update it
          let current = updatedData
          for (let i = 0; i < fieldPath.length - 1; i++) {
            if (!current[fieldPath[i]]) current[fieldPath[i]] = {}
            current = current[fieldPath[i]]
          }
          current[fieldPath[fieldPath.length - 1]] = message.data.newValue
          
          return {
            ...updatedData,
            updatedAt: new Date(message.timestamp)
          }
        }
      )
    }

    const handleAttendanceUpdate = (message: AttendanceUpdateMessage) => {
      if (!studentId || message.data.studentId !== studentId) return

      console.log('Received attendance update:', message.data)
      
      // Invalidate attendance queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.attendance(studentId)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.attendanceStats(studentId)
      })
    }

    const handleScheduleUpdate = (message: ScheduleUpdateMessage) => {
      if (!studentId || message.data.studentId !== studentId) return

      console.log('Received schedule update:', message.data)
      
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.schedule(studentId)
      })
    }

    const handleDocumentUpdate = (message: DocumentUpdateMessage) => {
      if (!studentId || message.data.studentId !== studentId) return

      console.log('Received document update:', message.data)
      
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.documents(studentId)
      })
    }

    // Subscribe to different message types with proper type handling
    const unsubscribeStudent = wsManager.subscribe('student_update', (message) => {
      if (message.type === 'student_update') {
        handleStudentUpdate(message as StudentUpdateMessage)
      }
    })
    const unsubscribeAttendance = wsManager.subscribe('attendance_update', (message) => {
      if (message.type === 'attendance_update') {
        handleAttendanceUpdate(message as AttendanceUpdateMessage)
      }
    })
    const unsubscribeSchedule = wsManager.subscribe('schedule_update', (message) => {
      if (message.type === 'schedule_update') {
        handleScheduleUpdate(message as ScheduleUpdateMessage)
      }
    })
    const unsubscribeDocument = wsManager.subscribe('document_update', (message) => {
      if (message.type === 'document_update') {
        handleDocumentUpdate(message as DocumentUpdateMessage)
      }
    })

    return () => {
      unsubscribeStudent()
      unsubscribeAttendance()
      unsubscribeSchedule()
      unsubscribeDocument()
    }
  }, [studentId, queryClient])

  return {
    connectionStatus: wsManager.getConnectionStatus(),
    subscribeToStudent: wsManager.subscribeToStudent.bind(wsManager),
    unsubscribeFromStudent: wsManager.unsubscribeFromStudent.bind(wsManager),
  }
}

// Hook for WebSocket connection status
export function useWebSocketStatus() {
  const [status, setStatus] = useState(() => {
    try {
      return wsManager.getConnectionStatus()
    } catch (error) {
      console.warn('Failed to get Socket.IO status:', error)
      return {
        isConnected: false,
        reconnectAttempts: 0,
        readyState: undefined
      }
    }
  })

  useEffect(() => {
    const updateStatus = () => {
      try {
        setStatus(wsManager.getConnectionStatus())
      } catch (error) {
        console.warn('Failed to update Socket.IO status:', error)
        setStatus({
          isConnected: false,
          reconnectAttempts: 0,
          readyState: undefined
        })
      }
    }

    // Update status every 5 seconds (reduced frequency)
    const interval = setInterval(updateStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  return status
}

// Hook for broadcasting updates (when this client makes changes)
export function useBroadcastUpdate() {
  const broadcastStudentUpdate = useCallback((studentId: string, field: string, newValue: any) => {
    wsManager.send({
      type: 'student_update',
      data: {
        studentId,
        field,
        newValue,
        updatedBy: 'current_user' // This should come from auth context
      },
      timestamp: new Date().toISOString()
    })
  }, [])

  const broadcastAttendanceUpdate = useCallback((studentId: string, lessonId: string, status: string) => {
    wsManager.send({
      type: 'attendance_update',
      data: {
        studentId,
        lessonId,
        status,
        updatedBy: 'current_user',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    })
  }, [])

  return {
    broadcastStudentUpdate,
    broadcastAttendanceUpdate
  }
}

// Export the manager for direct access if needed
export { wsManager }

// Cleanup function for app shutdown
export function cleanupWebSocket() {
  wsManager.disconnect()
}