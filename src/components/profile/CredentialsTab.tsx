import { useState } from 'react'
import { LockKeyIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { Button } from '@heroui/react'
import { useAuth } from '../../services/authContext.jsx'
import apiService from '../../services/apiService'

type StrengthLevel = 'weak' | 'medium' | 'strong' | null

function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return null
  if (password.length < 6) return 'weak'

  const hasNumber = /\d/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  if (password.length >= 10 && hasNumber && hasUppercase && hasSpecial) return 'strong'
  if (password.length >= 8 && hasNumber) return 'medium'
  return 'weak'
}

const strengthConfig = {
  weak: { label: 'חלשה', color: 'bg-red-500', segments: 1 },
  medium: { label: 'בינונית', color: 'bg-amber-500', segments: 2 },
  strong: { label: 'חזקה', color: 'bg-emerald-500', segments: 3 },
}

export default function CredentialsTab() {
  const { checkAuthStatus } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const strength = getPasswordStrength(newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Client-side validation
    if (newPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    if (newPassword === currentPassword) {
      setError('הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית')
      return
    }

    setIsLoading(true)

    try {
      await apiService.auth.changePassword(currentPassword, newPassword)

      // Refresh auth state with new token
      await checkAuthStatus(true)

      setSuccess('הסיסמה שונתה בהצלחה')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const message = err?.message || err?.data?.message || ''
      if (message.includes('Current password is incorrect')) {
        setError('הסיסמה הנוכחית שגויה')
      } else {
        setError('שגיאה בשינוי הסיסמה. נסה שוב.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const renderPasswordField = (
    id: string,
    label: string,
    value: string,
    onChange: (val: string) => void,
    show: boolean,
    toggleShow: () => void,
    placeholder: string
  ) => (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-foreground mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          disabled={isLoading}
          dir="ltr"
          style={{ textAlign: 'left' }}
          className="block w-full px-2.5 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? (
            <EyeSlashIcon className="w-4.5 h-4.5" />
          ) : (
            <EyeIcon className="w-4.5 h-4.5" />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-md">
      <div className="bg-card rounded-card border border-border p-4 shadow-1">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <LockKeyIcon className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">שינוי סיסמה</h2>
        </div>

        {/* Success banner */}
        {success && (
          <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-700 text-xs">{success}</p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <WarningCircleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-xs">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {renderPasswordField(
            'currentPassword',
            'סיסמה נוכחית',
            currentPassword,
            setCurrentPassword,
            showCurrent,
            () => setShowCurrent(!showCurrent),
            'הזן סיסמה נוכחית'
          )}

          {renderPasswordField(
            'newPassword',
            'סיסמה חדשה',
            newPassword,
            setNewPassword,
            showNew,
            () => setShowNew(!showNew),
            'הזן סיסמה חדשה'
          )}

          {/* Password strength indicator */}
          {strength && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3].map((segment) => (
                  <div
                    key={segment}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      segment <= strengthConfig[strength].segments
                        ? strengthConfig[strength].color
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs ${
                strength === 'weak' ? 'text-red-600' :
                strength === 'medium' ? 'text-amber-600' :
                'text-emerald-600'
              }`}>
                חוזק סיסמה: {strengthConfig[strength].label}
              </p>
            </div>
          )}

          {renderPasswordField(
            'confirmPassword',
            'אימות סיסמה חדשה',
            confirmPassword,
            setConfirmPassword,
            showConfirm,
            () => setShowConfirm(!showConfirm),
            'הזן שוב את הסיסמה החדשה'
          )}

          <div className="pt-2">
            <Button
              type="submit"
              color="primary"
              variant="solid"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'שומר...' : 'שנה סיסמה'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
