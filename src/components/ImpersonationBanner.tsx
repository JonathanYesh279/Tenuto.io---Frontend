import { useAuth } from '../services/authContext.jsx'
import { useState, useEffect } from 'react'

interface ImpersonationContextData {
  tenantName: string
  impersonatedAdminName: string
  impersonatedAdminEmail: string
  sessionId: string
  startedAt: string
}

export default function ImpersonationBanner() {
  const { stopImpersonation } = useAuth()
  const [context, setContext] = useState<ImpersonationContextData | null>(null)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const loginType = localStorage.getItem('loginType')
    if (loginType === 'impersonation') {
      try {
        const stored = localStorage.getItem('impersonationContext')
        if (stored) {
          setContext(JSON.parse(stored))
        }
      } catch {
        setContext(null)
      }
    } else {
      setContext(null)
    }
  }, [])

  // Also listen for storage changes (in case impersonation starts/stops)
  useEffect(() => {
    const handleStorage = () => {
      const loginType = localStorage.getItem('loginType')
      if (loginType === 'impersonation') {
        try {
          const stored = localStorage.getItem('impersonationContext')
          if (stored) setContext(JSON.parse(stored))
        } catch {
          setContext(null)
        }
      } else {
        setContext(null)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  if (!context) return null

  const handleExit = async () => {
    setIsExiting(true)
    try {
      await stopImpersonation()
      // Navigation will happen via auth state change
      window.location.href = '/dashboard'
    } catch {
      setIsExiting(false)
    }
  }

  return (
    <div
      className="bg-amber-500 text-white py-2 px-4 flex items-center justify-between fixed top-0 left-0 right-0 z-[100]"
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
        <span className="font-medium text-sm">
          {'\u05DE\u05E6\u05D1 \u05D4\u05EA\u05D7\u05D6\u05D5\u05EA'}: {'\u05E6\u05E4\u05D9\u05D9\u05D4 \u05DB'}-{context.impersonatedAdminName} ({context.tenantName})
        </span>
      </div>
      <button
        onClick={handleExit}
        disabled={isExiting}
        className="bg-white text-amber-600 px-3 py-1 rounded text-sm font-medium hover:bg-amber-50 disabled:opacity-50 transition-colors"
      >
        {isExiting ? '\u05D9\u05D5\u05E6\u05D0...' : '\u05D9\u05E6\u05D9\u05D0\u05D4 \u05DE\u05D4\u05EA\u05D7\u05D6\u05D5\u05EA'}
      </button>
    </div>
  )
}
