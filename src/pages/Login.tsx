import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/authContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    console.log('🔐 Login attempt started:', { email, password: '***' })
    console.log('🌐 API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
    console.log('🔧 Environment check:', {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      fallback: 'http://localhost:3001/api',
      actual: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    })
    
    try {
      console.log('📤 Sending login request to API service...')
      const result = await login(email, password)
      
      console.log('✅ Login successful:', { user: result.user?.personalInfo?.firstName || result.user?.personalInfo?.fullName || 'Unknown' })
      console.log('🔑 Authentication token stored successfully')
      console.log('🧭 Navigating to dashboard...')
      
      navigate('/dashboard')
    } catch (error) {
      console.error('❌ Login failed:', error)
      console.error('📍 Error details:', {
        message: error.message,
        stack: error.stack
      })
      
      setError(error.message || 'שגיאה בהתחברות. אנא בדוק את הפרטים ונסה שוב.')
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
            <h2
              className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-lg"
              style={{ fontFamily: "'Reisinger Yonatan', 'Arial Hebrew', 'Noto Sans Hebrew', Arial, sans-serif" }}
            >
              כניסה למערכת
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
                <p className="text-red-100 text-sm text-center font-reisinger-yonatan">{error}</p>
              </div>
            )}
            
            <div className="rounded-md shadow-sm space-y-4">
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
                  className="relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 sm:text-sm placeholder:text-right font-reisinger-yonatan disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="כתובת דוא״ל"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only font-reisinger-yonatan">
                  סיסמה
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading}
                  className="relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 sm:text-sm placeholder:text-right font-reisinger-yonatan disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="סיסמה"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg font-reisinger-yonatan disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    מתחבר...
                  </div>
                ) : (
                  'כניסה'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="font-medium text-white/90 hover:text-white drop-shadow transition-colors duration-200 font-reisinger-yonatan underline"
              >
                שכחתי סיסמא
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}