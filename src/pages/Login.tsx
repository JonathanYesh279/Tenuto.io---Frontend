import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BuildingIcon, ArrowRightIcon, ShieldIcon, EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'
import { useAuth } from '../services/authContext.jsx'
import { authService } from '../services/apiService.js'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from '../components/ui/animated-tabs'
import { BorderBeam } from '../components/ui/BorderBeam'

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
  const [activeTab, setActiveTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)

  // Multi-tenant state
  const [showTenantSelector, setShowTenantSelector] = useState(false)
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([])

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

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

      if (result?.requiresTenantSelection) {
        setAvailableTenants(result.tenants || [])
        setShowTenantSelector(true)
        setIsLoading(false)
        return
      }

      if (result?.user?.requiresPasswordChange) {
        navigate('/force-password-change')
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

      if (result?.user?.requiresPasswordChange) {
        navigate('/force-password-change')
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)

    try {
      await authService.forgotPassword(forgotEmail)
      setForgotSuccess(true)
    } catch (error: any) {
      setForgotError(error.message || 'שגיאה בשליחת בקשת איפוס סיסמה')
    } finally {
      setForgotLoading(false)
    }
  }

  const switchToForgot = () => {
    setForgotEmail(email)
    setForgotSuccess(false)
    setForgotError('')
    setError('')
    setActiveTab('forgot')
  }

  const switchToLogin = () => {
    setError('')
    setForgotError('')
    setActiveTab('login')
  }

  return (
    <div className="grid h-screen lg:grid-cols-[minmax(400px,1fr)_1fr]" dir="rtl">
      {/* Right side — Form */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="relative w-full max-w-[480px] rounded-2xl border border-slate-200 bg-white p-10 overflow-hidden">
          <BorderBeam duration={10} size={120} colorFrom="#a855f7" colorTo="#6366f1" />

          {showTenantSelector ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">בחר מוסד</h1>
              <p className="mt-1 text-muted-foreground">
                נמצאו מספר מוסדות המשויכים לחשבון שלך
              </p>

              {error && (
                <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm text-center text-destructive">{error}</p>
                </div>
              )}

              <div className="mt-8 space-y-3">
                {availableTenants.map((tenant) => (
                  <button
                    key={tenant.tenantId}
                    onClick={() => handleTenantSelect(tenant.tenantId)}
                    disabled={isLoading}
                    className="w-full rounded-lg border bg-background p-4 text-right
                      hover:bg-accent hover:border-primary/40 focus:outline-none focus:ring-2
                      focus:ring-ring transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                        <BuildingIcon size={20} weight="regular" className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          {tenant.tenantName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tenant.roles.join(' · ')}
                        </div>
                      </div>
                      <ArrowRightIcon size={16} weight="regular" className="text-muted-foreground group-hover:text-foreground transition-colors" mirrored />
                    </div>
                  </button>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-6" onClick={handleBackToLogin} disabled={isLoading}>
                חזרה לכניסה
              </Button>
            </>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList>
                <TabsTrigger value="login" className="font-bold text-sm">כניסה</TabsTrigger>
                <TabsTrigger value="forgot" className="font-bold text-sm">שכחתי סיסמה</TabsTrigger>
              </TabsList>
              <TabsContents>
                <TabsContent value="login">
                <div className="mt-4">
                  <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                    {isSuperAdmin ? 'כניסת מנהל-על' : 'ברוכים הבאים'}
                  </h1>
                  <p className="mt-1 text-muted-foreground">
                    {isSuperAdmin ? 'ממשק ניהול מערכת' : 'התחברו לחשבון שלכם כדי להמשיך.'}
                  </p>

                  <form className="mt-6" onSubmit={handleSubmit}>
                    <fieldset disabled={isLoading} className="grid gap-5">
                      {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                          <p className="text-sm text-center text-destructive">{error}</p>
                        </div>
                      )}

                      <div className="grid gap-2">
                        <Label htmlFor="email">כתובת דוא״ל</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          dir="ltr"
                          style={{ textAlign: 'left' }}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="password">סיסמה</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            dir="ltr"
                            style={{ textAlign: 'left', paddingRight: '2.5rem' }}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeSlashIcon size={15} weight="regular" />
                            ) : (
                              <EyeIcon size={15} weight="regular" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button className="w-full" type="submit">
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            מתחבר...
                          </span>
                        ) : (
                          'כניסה'
                        )}
                      </Button>
                    </fieldset>
                  </form>

                  {isSuperAdmin && (
                    <div className="mt-4 flex items-center justify-center gap-1.5">
                      <ShieldIcon size={16} weight="fill" className="text-amber-500" />
                      <span className="text-sm text-amber-600">ממשק ניהול מערכת</span>
                    </div>
                  )}

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => { setIsSuperAdmin(!isSuperAdmin); setError('') }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {isSuperAdmin ? 'חזרה לכניסה רגילה' : 'כניסת מנהל-על'}
                    </button>
                  </div>
                </div>
              </TabsContent>

                <TabsContent value="forgot">
                <div className="mt-4">
                  <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                    איפוס סיסמה
                  </h1>
                  <p className="mt-1 text-muted-foreground">
                    הזינו את כתובת הדוא״ל ונשלח לכם קישור לאיפוס.
                  </p>

                  {forgotSuccess ? (
                    <div className="mt-6 space-y-5">
                      <div className="rounded-md border border-green-200 bg-green-50 p-4">
                        <p className="text-sm text-center text-green-700">
                          אם קיים חשבון עם כתובת דוא״ל זו, נשלח אליכם קישור לאיפוס סיסמה.
                          אנא בדקו את תיבת הדואר שלכם.
                        </p>
                      </div>

                      <Button variant="outline" className="w-full" onClick={switchToLogin}>
                        חזרה לכניסה
                      </Button>
                    </div>
                  ) : (
                    <form className="mt-6" onSubmit={handleForgotSubmit}>
                      <fieldset disabled={forgotLoading} className="grid gap-5">
                        {forgotError && (
                          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                            <p className="text-sm text-center text-destructive">{forgotError}</p>
                          </div>
                        )}

                        <div className="grid gap-2">
                          <Label htmlFor="forgot-email">כתובת דוא״ל</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            dir="ltr"
                            style={{ textAlign: 'left' }}
                          />
                        </div>

                        <Button className="w-full" type="submit">
                          {forgotLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              שולח...
                            </span>
                          ) : (
                            'שלח קישור לאיפוס'
                          )}
                        </Button>
                      </fieldset>
                    </form>
                  )}
                </div>
              </TabsContent>
              </TabsContents>
            </Tabs>
          )}
        </div>
      </div>

      {/* Left side — Background image */}
      <div
        className="hidden lg:block"
        style={{
          backgroundColor: '#1a2e4a',
          backgroundImage: 'url("/login-background.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Loading overlay for tenant selection */}
      {isLoading && showTenantSelector && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  )
}
