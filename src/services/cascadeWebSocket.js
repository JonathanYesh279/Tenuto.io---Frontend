/**
 * Cascade Deletion WebSocket Service
 * 
 * Handles real-time communication for cascade deletion operations:
 * - Progress updates during deletion
 * - Completion notifications
 * - Integrity issue alerts
 * - Connection management with auto-reconnection
 * 
 * Socket.IO Events from Backend:
 * - cascade.progress: { studentId, step, percentage, details }
 * - cascade.complete: { studentId, summary, duration }
 * - integrity.issue: { severity, collection, count, fixable }
 */

import { io } from 'socket.io-client';

// Configuration
const SOCKETIO_CONFIG = {
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000, // Initial delay in ms
  MAX_RECONNECT_DELAY: 30000, // Max delay in ms
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
};

/**
 * Socket.IO connection states
 */
const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
};

/**
 * Event types for cascade operations
 */
const EVENT_TYPES = {
  CASCADE_PROGRESS: 'cascade.progress',
  CASCADE_COMPLETE: 'cascade.complete',
  CASCADE_ERROR: 'cascade.error',
  INTEGRITY_ISSUE: 'integrity.issue',
  CONNECTION_STATUS: 'connection.status',
  HEARTBEAT: 'heartbeat',
};

/**
 * Hebrew messages for connection states
 */
const STATUS_MESSAGES = {
  CONNECTING: 'מתחבר לשרת...',
  CONNECTED: 'מחובר לשרת',
  DISCONNECTED: 'מנותק מהשרת',
  RECONNECTING: 'מנסה להתחבר מחדש...',
  FAILED: 'החיבור נכשל',
};

/**
 * Custom event emitter for WebSocket events
 */
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.events.delete(event);
        }
      }
    };
  }

  emit(event, data) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

/**
 * Main Cascade WebSocket Service Class (using Socket.IO)
 */
class CascadeWebSocketService extends EventEmitter {
  constructor() {
    super();
    
    this.socket = null;
    this.connectionState = CONNECTION_STATES.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.heartbeatInterval = null;
    this.connectionTimeout = null;
    this.isManuallyDisconnected = false;
    
    // Active operation tracking
    this.activeOperations = new Set();
    this.operationCallbacks = new Map();
    
    // Connection stats
    this.connectionStats = {
      totalConnections: 0,
      totalReconnects: 0,
      lastConnected: null,
      lastDisconnected: null,
      totalMessages: 0,
      totalErrors: 0,
    };

    // Message queue for when disconnected
    this.messageQueue = [];
    this.maxQueueSize = 100;
  }

  /**
   * Connect to the Socket.IO server
   * @param {Object} options - Connection options
   */
  connect(options = {}) {
    if (this.connectionState === CONNECTION_STATES.CONNECTED || 
        this.connectionState === CONNECTION_STATES.CONNECTING) {
      return;
    }

    this.isManuallyDisconnected = false;
    this._setConnectionState(CONNECTION_STATES.CONNECTING);

    try {
      // Get Socket.IO URL from environment or default
      const socketUrl = this._getSocketUrl();
      
      // Add authentication token if available
      const token = this._getAuthToken();

      this.socket = io(socketUrl, {
        auth: {
          token
        },
        timeout: SOCKETIO_CONFIG.CONNECTION_TIMEOUT,
        forceNew: true
      });
      
      this._setupEventHandlers();

    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      this._handleConnectionError(error);
    }
  }

  /**
   * Manually disconnect from the server
   */
  disconnect() {
    this.isManuallyDisconnected = true;
    this._cleanup();
    
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
    
    this._setConnectionState(CONNECTION_STATES.DISCONNECTED);
  }

  /**
   * Subscribe to progress updates for a specific student deletion
   * @param {string} studentId - The student ID to track
   * @param {Function} progressCallback - Called on progress updates
   * @param {Function} completeCallback - Called on completion
   * @param {Function} errorCallback - Called on errors
   * @returns {Function} Unsubscribe function
   */
  subscribeToProgress(studentId, progressCallback, completeCallback, errorCallback) {
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    this.activeOperations.add(studentId);
    
    // Store callbacks for this operation
    const callbacks = {
      progress: progressCallback,
      complete: completeCallback,
      error: errorCallback,
    };
    this.operationCallbacks.set(studentId, callbacks);

    // Set up event listeners
    const unsubscribeProgress = this.on(EVENT_TYPES.CASCADE_PROGRESS, (data) => {
      if (data.studentId === studentId && progressCallback) {
        progressCallback(data);
      }
    });

    const unsubscribeComplete = this.on(EVENT_TYPES.CASCADE_COMPLETE, (data) => {
      if (data.studentId === studentId) {
        if (completeCallback) completeCallback(data);
        this._cleanupOperation(studentId);
      }
    });

    const unsubscribeError = this.on(EVENT_TYPES.CASCADE_ERROR, (data) => {
      if (data.studentId === studentId) {
        if (errorCallback) errorCallback(data);
        this._cleanupOperation(studentId);
      }
    });

    // Send subscription message to server
    this._sendMessage({
      type: 'subscribe',
      data: {
        operation: 'cascade.deletion',
        studentId: studentId
      }
    });

    // Return combined unsubscribe function
    return () => {
      unsubscribeProgress();
      unsubscribeComplete();
      unsubscribeError();
      this._cleanupOperation(studentId);
      
      // Send unsubscribe message to server
      this._sendMessage({
        type: 'unsubscribe',
        data: {
          operation: 'cascade.deletion',
          studentId: studentId
        }
      });
    };
  }

  /**
   * Subscribe to integrity issue notifications
   * @param {Function} callback - Called when integrity issues are detected
   * @returns {Function} Unsubscribe function
   */
  subscribeToIntegrityIssues(callback) {
    return this.on(EVENT_TYPES.INTEGRITY_ISSUE, callback);
  }

  /**
   * Subscribe to connection status changes
   * @param {Function} callback - Called when connection status changes
   * @returns {Function} Unsubscribe function
   */
  subscribeToConnectionStatus(callback) {
    return this.on(EVENT_TYPES.CONNECTION_STATUS, callback);
  }

  /**
   * Get current connection status
   * @returns {Object} Connection status and stats
   */
  getConnectionStatus() {
    return {
      state: this.connectionState,
      isConnected: this.connectionState === CONNECTION_STATES.CONNECTED,
      reconnectAttempts: this.reconnectAttempts,
      activeOperations: Array.from(this.activeOperations),
      stats: { ...this.connectionStats },
      messageQueueSize: this.messageQueue.length,
    };
  }

  /**
   * Force reconnection (useful for testing or manual intervention)
   */
  forceReconnect() {
    if (this.connectionState === CONNECTION_STATES.CONNECTED) {
      this.ws?.close();
    }
    
    this.reconnectAttempts = 0;
    this._attemptReconnect();
  }

  /**
   * Set up WebSocket event handlers
   * @private
   */
  _setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
      
      this._setConnectionState(CONNECTION_STATES.CONNECTED);
      this.reconnectAttempts = 0;
      this.connectionStats.totalConnections++;
      this.connectionStats.lastConnected = new Date().toISOString();
      
      // Start heartbeat
      this._startHeartbeat();
      
      // Process queued messages
      this._processMessageQueue();
      
      console.log('WebSocket connected successfully');
    };

    this.ws.onmessage = (event) => {
      try {
        this.connectionStats.totalMessages++;
        const message = JSON.parse(event.data);
        this._handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.connectionStats.totalErrors++;
      }
    };

    this.ws.onclose = (event) => {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
      
      this._stopHeartbeat();
      this.connectionStats.lastDisconnected = new Date().toISOString();
      
      console.log('WebSocket closed:', event.code, event.reason);
      
      if (!this.isManuallyDisconnected) {
        this._handleDisconnection();
      } else {
        this._setConnectionState(CONNECTION_STATES.DISCONNECTED);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionStats.totalErrors++;
      this._handleConnectionError(error);
    };
  }

  /**
   * Handle incoming WebSocket messages
   * @private
   */
  _handleMessage(message) {
    const { type, data } = message;

    switch (type) {
      case EVENT_TYPES.CASCADE_PROGRESS:
        this.emit(EVENT_TYPES.CASCADE_PROGRESS, {
          studentId: data.studentId,
          step: data.step,
          percentage: data.percentage,
          details: data.details || {},
          timestamp: data.timestamp || new Date().toISOString(),
        });
        break;

      case EVENT_TYPES.CASCADE_COMPLETE:
        this.emit(EVENT_TYPES.CASCADE_COMPLETE, {
          studentId: data.studentId,
          summary: data.summary || {},
          duration: data.duration,
          success: data.success !== false,
          timestamp: data.timestamp || new Date().toISOString(),
        });
        break;

      case EVENT_TYPES.CASCADE_ERROR:
        this.emit(EVENT_TYPES.CASCADE_ERROR, {
          studentId: data.studentId,
          error: data.error || 'Unknown error',
          code: data.code,
          details: data.details || {},
          timestamp: data.timestamp || new Date().toISOString(),
        });
        break;

      case EVENT_TYPES.INTEGRITY_ISSUE:
        this.emit(EVENT_TYPES.INTEGRITY_ISSUE, {
          severity: data.severity || 'medium',
          collection: data.collection,
          count: data.count || 0,
          fixable: data.fixable === true,
          details: data.details || {},
          timestamp: data.timestamp || new Date().toISOString(),
        });
        break;

      case EVENT_TYPES.HEARTBEAT:
        // Respond to server heartbeat
        this._sendMessage({ type: 'heartbeat.response' });
        break;

      default:
        console.warn('Unknown WebSocket message type:', type);
    }
  }

  /**
   * Send a message to the server
   * @private
   */
  _sendMessage(message) {
    if (this.connectionState === CONNECTION_STATES.CONNECTED && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this._queueMessage(message);
      }
    } else {
      this._queueMessage(message);
    }
  }

  /**
   * Queue message for later sending
   * @private
   */
  _queueMessage(message) {
    if (this.messageQueue.length >= this.maxQueueSize) {
      this.messageQueue.shift(); // Remove oldest message
    }
    
    this.messageQueue.push({
      message,
      timestamp: Date.now(),
    });
  }

  /**
   * Process queued messages
   * @private
   */
  _processMessageQueue() {
    const now = Date.now();
    const maxAge = 60000; // 1 minute
    
    // Filter out old messages
    this.messageQueue = this.messageQueue.filter(
      item => now - item.timestamp < maxAge
    );
    
    // Send queued messages
    this.messageQueue.forEach(({ message }) => {
      this._sendMessage(message);
    });
    
    this.messageQueue = [];
  }

  /**
   * Handle connection disconnection
   * @private
   */
  _handleDisconnection() {
    if (this.reconnectAttempts < WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS) {
      this._attemptReconnect();
    } else {
      this._setConnectionState(CONNECTION_STATES.FAILED);
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Attempt to reconnect
   * @private
   */
  _attemptReconnect() {
    if (this.isManuallyDisconnected) return;

    this.reconnectAttempts++;
    this.connectionStats.totalReconnects++;
    this._setConnectionState(CONNECTION_STATES.RECONNECTING);

    const delay = Math.min(
      WEBSOCKET_CONFIG.RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1),
      WEBSOCKET_CONFIG.MAX_RECONNECT_DELAY
    );

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS}) in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Handle connection timeout
   * @private
   */
  _handleConnectionTimeout() {
    console.error('WebSocket connection timeout');
    this.connectionStats.totalErrors++;
    this._handleDisconnection();
  }

  /**
   * Handle connection errors
   * @private
   */
  _handleConnectionError(error) {
    this.connectionStats.totalErrors++;
    
    if (!this.isManuallyDisconnected) {
      this._handleDisconnection();
    }
  }

  /**
   * Set connection state and emit status event
   * @private
   */
  _setConnectionState(newState) {
    const oldState = this.connectionState;
    this.connectionState = newState;

    this.emit(EVENT_TYPES.CONNECTION_STATUS, {
      state: newState,
      previousState: oldState,
      message: STATUS_MESSAGES[newState],
      timestamp: new Date().toISOString(),
      reconnectAttempts: this.reconnectAttempts,
    });
  }

  /**
   * Start heartbeat interval
   * @private
   */
  _startHeartbeat() {
    this._stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      this._sendMessage({ type: 'heartbeat' });
    }, WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat interval
   * @private
   */
  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Clean up operation tracking
   * @private
   */
  _cleanupOperation(studentId) {
    this.activeOperations.delete(studentId);
    this.operationCallbacks.delete(studentId);
  }

  /**
   * Clean up all resources
   * @private
   */
  _cleanup() {
    clearTimeout(this.reconnectTimeout);
    clearTimeout(this.connectionTimeout);
    this.reconnectTimeout = null;
    this.connectionTimeout = null;
    
    this._stopHeartbeat();
    this.activeOperations.clear();
    this.operationCallbacks.clear();
    this.messageQueue = [];
  }

  /**
   * Get WebSocket URL from environment
   * @private
   */
  _getWebSocketUrl() {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return baseUrl.replace('http', 'ws') + '/ws/cascade';
  }

  /**
   * Get authentication token
   * @private
   */
  _getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
}

// Create and export singleton instance
export const cascadeWebSocket = new CascadeWebSocketService();

// Export event types and connection states for external use
export { EVENT_TYPES, CONNECTION_STATES, STATUS_MESSAGES };

// Export the service class for testing
export { CascadeWebSocketService };