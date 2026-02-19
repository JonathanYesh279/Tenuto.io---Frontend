import React from 'react'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'
import { FIELD_LABELS } from '../../utils/validationUtils'

interface ValidationSummaryProps {
  errors: Record<string, string>
  touched: Record<string, boolean>
  showOnlyTouched?: boolean
  onClose?: () => void
  className?: string
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  touched,
  showOnlyTouched = true,
  onClose,
  className = ''
}) => {
  // Filter errors based on touched fields if needed
  const displayErrors = showOnlyTouched 
    ? Object.entries(errors).filter(([field]) => touched[field])
    : Object.entries(errors)

  if (displayErrors.length === 0) {
    return null
  }

  const getFieldLabel = (fieldName: string): string => {
    return FIELD_LABELS[fieldName as keyof typeof FIELD_LABELS] || fieldName
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div className="mr-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            יש לתקן את השגיאות הבאות:
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc space-y-1 pr-5">
              {displayErrors.map(([field, message]) => (
                <li key={field}>
                  <strong>{getFieldLabel(field)}:</strong> {message}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {onClose && (
          <div className="mr-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-400 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
              >
                <span className="sr-only">סגור</span>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ValidationSuccessProps {
  message?: string
  onClose?: () => void
  className?: string
}

export const ValidationSuccess: React.FC<ValidationSuccessProps> = ({
  message = 'כל השדות תקינים',
  onClose,
  className = ''
}) => {
  return (
    <div className={`bg-green-50 border border-green-200 rounded p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-green-400" />
        </div>
        <div className="mr-3 flex-1">
          <h3 className="text-sm font-medium text-green-800">
            {message}
          </h3>
        </div>
        {onClose && (
          <div className="mr-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex bg-green-50 rounded-md p-1.5 text-green-400 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
              >
                <span className="sr-only">סגור</span>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ValidationSummary