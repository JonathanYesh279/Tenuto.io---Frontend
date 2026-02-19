import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MusicNoteIcon } from '@phosphor-icons/react'
import { authService } from '../services/apiService.js'

export default function ResetPassword() {
  const { token: tokenFromUrl } = useParams<{ token: string }>()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Clear any existing auth tokens to prevent auto-login
    localStorage.removeItem('authToken')
    sessionStorage.removeItem('authToken')

    if (!tokenFromUrl) {
      setError('קישור לא תקין. אנא בקש קישור חדש לאיפוס סיסמה.')
    }
  }, [tokenFromUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    if (!tokenFromUrl) {
      setError('קישור לא תקין')
      return
    }

    setIsLoading(true)

    try {
      await authService.resetPassword(tokenFromUrl, password)

      // Show success message
      setIsSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error: any) {
      const errorMessage = error.message || error.error || 'שגיאה באיפוס הסיסמה'

      // Handle specific error codes
      if (errorMessage.includes('expired') || errorMessage.includes('RESET_TOKEN_EXPIRED')) {
        setError('תוקף הקישור פג. אנא בקש קישור חדש לאיפוס סיסמה.')
      } else if (errorMessage.includes('invalid') || errorMessage.includes('INVALID_RESET_TOKEN')) {
        setError('קישור לא תקין. אנא בקש קישור חדש לאיפוס סיסמה.')
      } else if (errorMessage.includes('password') || errorMessage.includes('WEAK_PASSWORD')) {
        setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      } else {
        setError(errorMessage)
      }
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
      {/* Background overlay for better contrast */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Glassmorphism container */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-xl p-8">
          <div>
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <MusicNoteIcon size={32} weight="regular" className="text-white" />
              </div>
              <p className="text-sm text-white/70 font-reisinger-yonatan">מערכת ניהול קונסרבטוריון</p>
            </div>
            <h2
              className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-lg"
              style={{ fontFamily: "'Reisinger Yonatan', 'Arial Hebrew', 'Noto Sans Hebrew', Arial, sans-serif" }}
            >
              איפוס סיסמה
            </h2>
            <p className="mt-2 text-center text-sm text-white/80 font-reisinger-yonatan">
              הזן סיסמה חדשה לחשבון שלך
            </p>
          </div>

          {isSuccess ? (
            <div className="mt-8 space-y-6">
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur-sm">
                <p className="text-green-100 text-center font-reisinger-yonatan">
                  הסיסמה אופסה בהצלחה! עכשיו תוכל להתחבר עם הסיסמה החדשה.
                </p>
                <p className="text-green-100 text-sm text-center font-reisinger-yonatan mt-2">
                  מעביר אותך לדף הכניסה...
                </p>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="font-medium text-white/90 hover:text-white drop-shadow transition-colors duration-200 font-reisinger-yonatan underline"
                >
                  חזור לדף הכניסה עכשיו
                </Link>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
                <p className="text-red-100 text-sm text-center font-reisinger-yonatan">{error}</p>
              </div>
            )}

            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="password" className="sr-only font-reisinger-yonatan">
                  סיסמה חדשה
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading || !tokenFromUrl}
                  className="relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent focus:z-10 sm:text-sm placeholder:text-right font-reisinger-yonatan disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="סיסמה חדשה (לפחות 6 תווים)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  disabled={isLoading || !tokenFromUrl}
                  className="relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent focus:z-10 sm:text-sm placeholder:text-right font-reisinger-yonatan disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isLoading || !tokenFromUrl}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary/90 hover:bg-primary backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200 shadow-lg font-reisinger-yonatan disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    מאפס סיסמה...
                  </div>
                ) : (
                  'איפוס סיסמה'
                )}
              </button>
            </div>

            <div className="text-center space-y-2">
              <Link
                to="/forgot-password"
                className="block font-medium text-white/90 hover:text-white drop-shadow transition-colors duration-200 font-reisinger-yonatan underline"
              >
                בקש קישור חדש
              </Link>
              <Link
                to="/login"
                className="block font-medium text-white/90 hover:text-white drop-shadow transition-colors duration-200 font-reisinger-yonatan underline"
              >
                חזור לדף הכניסה
              </Link>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  )
}
