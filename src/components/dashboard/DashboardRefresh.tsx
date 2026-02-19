import React, { useState, useEffect, useRef } from 'react'
import { RefreshCw, Clock, Pause, Play, Settings } from 'lucide-react'

interface DashboardRefreshProps {
  onRefresh: () => Promise<void>
  autoRefreshInterval?: number // in milliseconds
  lastUpdated?: Date | null
  loading?: boolean
  className?: string
}

interface RefreshSettings {
  interval: number
  autoRefresh: boolean
  showNotifications: boolean
}

const DashboardRefresh: React.FC<DashboardRefreshProps> = ({
  onRefresh,
  autoRefreshInterval = 5 * 60 * 1000, // 5 minutes default
  lastUpdated,
  loading = false,
  className = ''
}) => {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [timeLeft, setTimeLeft] = useState(autoRefreshInterval / 1000)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<RefreshSettings>({
    interval: autoRefreshInterval / 1000,
    autoRefresh: true,
    showNotifications: true
  })
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Format time remaining
  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${remainingSeconds}s`
  }

  // Format last updated time
  const formatLastUpdated = (date: Date): string => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'עכשיו'
    if (diffInMinutes < 60) return `לפני ${diffInMinutes} דקות`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `לפני ${diffInHours} שעות`
    
    return date.toLocaleString('he-IL', {
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Start countdown
  const startCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }
    
    setTimeLeft(settings.interval)
    
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return settings.interval
        }
        return prev - 1
      })
    }, 1000)
  }

  // Setup auto-refresh
  useEffect(() => {
    if (settings.autoRefresh && isAutoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      intervalRef.current = setInterval(() => {
        if (!loading) {
          onRefresh()
          if (settings.showNotifications) {
            // Could show a toast notification here
            console.log('Dashboard refreshed automatically')
          }
        }
      }, settings.interval * 1000)
      
      startCountdown()
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [settings, isAutoRefresh, loading, onRefresh])

  // Manual refresh
  const handleManualRefresh = async () => {
    if (loading) return
    
    await onRefresh()
    
    // Reset countdown if auto-refresh is enabled
    if (settings.autoRefresh && isAutoRefresh) {
      startCountdown()
    }
  }

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh)
  }

  // Update settings
  const updateSettings = (newSettings: Partial<RefreshSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    setShowSettings(false)
  }

  return (
    <div className={`flex items-center space-x-3 space-x-reverse ${className}`} dir="rtl">
      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center text-sm text-gray-600 font-reisinger-yonatan">
          <Clock className="w-4 h-4 ml-1" />
          <span>עודכן: {formatLastUpdated(lastUpdated)}</span>
        </div>
      )}

      {/* Auto-refresh countdown */}
      {settings.autoRefresh && isAutoRefresh && !loading && (
        <div className="flex items-center text-sm text-gray-600 font-reisinger-yonatan">
          <div className="w-8 h-8 relative">
            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray="87.96"
                strokeDashoffset={87.96 - (87.96 * (settings.interval - timeLeft) / settings.interval)}
                className="text-primary transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
              {Math.ceil(timeLeft / 60) || 1}
            </span>
          </div>
          <span className="mr-1">רענון בעוד {formatTimeLeft(timeLeft)}</span>
        </div>
      )}

      {/* Manual refresh button */}
      <button
        onClick={handleManualRefresh}
        disabled={loading}
        className={`p-2 rounded transition-colors ${
          loading
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        }`}
        title="רענן ידנית"
      >
        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
      </button>

      {/* Auto-refresh toggle */}
      <button
        onClick={toggleAutoRefresh}
        className={`p-2 rounded transition-colors ${
          isAutoRefresh
            ? 'text-primary bg-muted hover:bg-muted/80'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        }`}
        title={isAutoRefresh ? 'השבת רענון אוטומטי' : 'הפעל רענון אוטומטי'}
      >
        {isAutoRefresh ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </button>

      {/* Settings */}
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          title="הגדרות רענון"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Settings dropdown */}
        {showSettings && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="p-4 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 font-reisinger-yonatan">
                הגדרות רענון
              </h4>

              {/* Refresh interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-reisinger-yonatan">
                  תדירות רענון
                </label>
                <select
                  value={settings.interval}
                  onChange={(e) => updateSettings({ interval: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-reisinger-yonatan"
                >
                  <option value={30}>30 שניות</option>
                  <option value={60}>דקה</option>
                  <option value={120}>2 דקות</option>
                  <option value={300}>5 דקות</option>
                  <option value={600}>10 דקות</option>
                  <option value={1800}>30 דקות</option>
                </select>
              </div>

              {/* Auto-refresh toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
                  רענון אוטומטי
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoRefresh}
                    onChange={(e) => updateSettings({ autoRefresh: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Notifications toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
                  הודעות רענון
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showNotifications}
                    onChange={(e) => updateSettings({ showNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowSettings(false)}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-neutral-800 transition-colors font-reisinger-yonatan"
              >
                שמור הגדרות
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refresh status indicator */}
      <div className={`w-2 h-2 rounded-full transition-colors ${
        loading 
          ? 'bg-orange-400 animate-pulse' 
          : settings.autoRefresh && isAutoRefresh 
            ? 'bg-green-400' 
            : 'bg-gray-300'
      }`} />
    </div>
  )
}

export default DashboardRefresh

// Hook for managing dashboard refresh state
export const useDashboardRefresh = (
  refreshFunction: () => Promise<void>,
  initialInterval = 5 * 60 * 1000
) => {
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)
      await refreshFunction()
      setLastUpdated(new Date())
    } catch (err) {
      setError('שגיאה ברענון הנתונים')
      console.error('Dashboard refresh error:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    lastUpdated,
    error,
    refresh
  }
}