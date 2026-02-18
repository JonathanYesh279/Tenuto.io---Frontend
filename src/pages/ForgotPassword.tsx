import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Music } from 'lucide-react'
import { authService } from '../services/apiService.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await authService.forgotPassword(email)
      setIsSuccess(true)
    } catch (error: any) {
      setError(error.message || 'שגיאה בשליחת בקשת איפוס סיסמה')
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
                <Music className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-white/70 font-reisinger-yonatan">מערכת ניהול קונסרבטוריון</p>
            </div>
            <h2
              className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-lg"
              style={{ fontFamily: "'Reisinger Yonatan', 'Arial Hebrew', 'Noto Sans Hebrew', Arial, sans-serif" }}
            >
              שכחתי סיסמא
            </h2>
            <p className="mt-2 text-center text-sm text-white/80 font-reisinger-yonatan">
              הזן את כתובת הדוא"ל שלך ונשלח לך קישור לאיפוס סיסמה
            </p>
          </div>

          {isSuccess ? (
            <div className="mt-8 space-y-6">
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur-sm">
                <p className="text-green-100 text-sm text-center font-reisinger-yonatan">
                  אם קיים חשבון עם כתובת דוא"ל זו, נשלח אליך קישור לאיפוס סיסמה.
                  אנא בדוק את תיבת הדואר שלך.
                </p>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="font-medium text-white/90 hover:text-white drop-shadow transition-colors duration-200 font-reisinger-yonatan underline"
                >
                  חזור לדף הכניסה
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

              <div className="rounded-md shadow-sm">
                <div>
                  <label htmlFor="email" className="sr-only font-reisinger-yonatan">
                    כתובת דוא"ל
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={isLoading}
                    className="relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent focus:z-10 sm:text-sm placeholder:text-right font-reisinger-yonatan disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="כתובת דוא״ל"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                      שולח...
                    </div>
                  ) : (
                    'שלח קישור לאיפוס סיסמה'
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="font-medium text-white/90 hover:text-white drop-shadow transition-colors duration-200 font-reisinger-yonatan underline"
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
