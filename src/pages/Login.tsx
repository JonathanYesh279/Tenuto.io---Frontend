import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BuildingIcon, ArrowRightIcon, ShieldIcon, MusicNoteIcon } from '@phosphor-icons/react'
import { useAuth } from '../services/authContext.jsx'

interface Tenant {
  tenantId: string
  tenantName: string
  roles: string[]
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  // Multi-tenant state
  const [showTenantSelector, setShowTenantSelector] = useState(false)
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([])

  const navigate = useNavigate()
  const { login, loginAsSuperAdmin } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isSuperAdmin) {
        await loginAsSuperAdmin(email, password)
        navigate('/dashboard')
        return
      }

      const result = await login(email, password)

      // Multi-tenant: show tenant selector if needed
      if (result?.requiresTenantSelection) {
        setAvailableTenants(result.tenants || [])
        setShowTenantSelector(true)
        setIsLoading(false)
        return
      }

      navigate('/dashboard')
    } catch (error: any) {
      setError(error.message || 'שגיאה בהתחברות. אנא בדוק את הפרטים ונסה שוב.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTenantSelect = async (tenantId: string) => {
    setError('')
    setIsLoading(true)

    try {
      const result = await login(email, password, tenantId)

      if (result?.requiresTenantSelection) {
        setError('שגיאה בבחירת מוסד. נסה שוב.')
        setIsLoading(false)
        return
      }

      navigate('/dashboard')
    } catch (error: any) {
      setError(error.message || 'שגיאה בהתחברות למוסד.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setShowTenantSelector(false)
    setAvailableTenants([])
    setError('')
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

          {/* Tenant Selector View */}
          {showTenantSelector ? (
            <>
              <div>
                <h2
                  className="mt-2 text-center text-2xl font-extrabold text-white drop-shadow-lg"
                  style={{ fontFamily: "'Reisinger Yonatan', 'Arial Hebrew', 'Noto Sans Hebrew', Arial, sans-serif" }}
                >
                  בחר מוסד
                </h2>
                <p className="mt-2 text-center text-sm text-white/70 font-reisinger-yonatan">
                  נמצאו מספר מוסדות המשויכים לחשבון שלך
                </p>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
                  <p className="text-red-100 text-sm text-center font-reisinger-yonatan">{error}</p>
                </div>
              )}

              <div className="mt-6 space-y-3">
                {availableTenants.map((tenant) => (
                  <button
                    key={tenant.tenantId}
                    onClick={() => handleTenantSelect(tenant.tenantId)}
                    disabled={isLoading}
                    className="w-full p-4 bg-white/15 border border-white/25 rounded-xl text-right
                      hover:bg-white/25 hover:border-white/40 focus:outline-none focus:ring-2
                      focus:ring-ring transition-all duration-200 backdrop-blur-sm
                      disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BuildingIcon size={20} weight="regular" className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-base font-reisinger-yonatan truncate">
                          {tenant.tenantName}
                        </div>
                        <div className="text-sm text-white/60 font-reisinger-yonatan">
                          {tenant.roles.join(' · ')}
                        </div>
                      </div>
                      <ArrowRightIcon size={16} weight="regular" className="text-white/40 group-hover:text-white/70 transition-colors" mirrored />
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleBackToLogin}
                disabled={isLoading}
                className="w-full mt-6 py-2.5 px-4 text-sm font-medium text-white/80 hover:text-white
                  bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg
                  transition-all duration-200 font-reisinger-yonatan
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                חזרה לכניסה
              </button>
            </>
          ) : (
            /* Login Form View */
            <>
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
                  {isSuperAdmin ? 'כניסת מנהל-על' : 'כניסה למערכת'}
                </h2>
                {isSuperAdmin && (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <ShieldIcon size={16} weight="fill" className="text-amber-300" />
                    <p className="text-sm text-amber-200 font-reisinger-yonatan">ממשק ניהול מערכת</p>
                  </div>
                )}
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
                      className="relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent focus:z-10 sm:text-sm placeholder:text-right font-reisinger-yonatan disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder='כתובת דוא״ל'
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
                      className="relative block w-full px-3 py-3 border border-white/30 placeholder-gray-400 text-gray-900 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent focus:z-10 sm:text-sm placeholder:text-right font-reisinger-yonatan disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary/90 hover:bg-primary backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200 shadow-lg font-reisinger-yonatan disabled:opacity-50 disabled:cursor-not-allowed"
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

                <div className="text-center space-y-2">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-white/90 hover:text-white drop-shadow transition-colors duration-200 font-reisinger-yonatan underline"
                  >
                    שכחתי סיסמא
                  </Link>
                  <div>
                    <button
                      type="button"
                      onClick={() => { setIsSuperAdmin(!isSuperAdmin); setError('') }}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors duration-200 font-reisinger-yonatan"
                    >
                      {isSuperAdmin ? 'חזרה לכניסה רגילה' : 'כניסת מנהל-על'}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Loading overlay for tenant selection */}
      {isLoading && showTenantSelector && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  )
}
