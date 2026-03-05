import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockKeyIcon } from '@phosphor-icons/react'
import { useAuth } from '../services/authContext.jsx'
import apiService from '../services/apiService'

export default function ForcePasswordChange() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const { clearRequiresPasswordChange } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (newPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    setIsLoading(true)

    try {
      await apiService.auth.forcePasswordChange(newPassword)
      clearRequiresPasswordChange()
      navigate('/dashboard')
    } catch (error: any) {
      setError(error.message || 'שגיאה בשינוי הסיסמה. נסה שוב.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: 'url("/login-background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      dir="rtl"
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Glassmorphism container */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-xl p-8">
          <div>
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                <LockKeyIcon size={32} weight="regular" className="text-amber-200" />
              </div>
            </div>
            <h2
              className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-lg"
              style={{ fontFamily: "'Reisinger Yonatan', 'Arial Hebrew', 'Noto Sans Hebrew', Arial, sans-serif" }}
            >
              הגדרת סיסמה חדשה
            </h2>
            <p className="mt-2 text-center text-sm text-white/70 font-reisinger-yonatan">
              נדרש לשנות סיסמה לפני כניסה למערכת
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
                <p className="text-red-100 text-sm text-center font-reisinger-yonatan">{error}</p>
              </div>
            )}

            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="newPassword" className="sr-only font-reisinger-yonatan">
                  סיסמה חדשה
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  disabled={isLoading}
                  className="relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent focus:z-10 sm:text-sm placeholder:text-right disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="סיסמה חדשה"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only font-reisinger-yonatan">
                  אימות סיסמה
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  disabled={isLoading}
                  className="relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent focus:z-10 sm:text-sm placeholder:text-right disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="אימות סיסמה"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary/90 hover:bg-primary backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200 shadow-lg font-reisinger-yonatan disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    שומר...
                  </div>
                ) : (
                  'שמירה והמשך'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
