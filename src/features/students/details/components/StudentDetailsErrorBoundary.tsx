/**
 * Student Details Error Boundary Component
 * 
 * Catches and handles JavaScript errors in the student details page
 * and its child components, providing graceful error fallbacks.
 */

import React, { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class StudentDetailsErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to the console and any error reporting service
    console.error('Student Details Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Here you could send the error to an error reporting service
    // like Sentry, LogRocket, etc.
    // errorReportingService.captureException(error, { extra: errorInfo })
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        onRetry={this.handleRetry}
      />
    }

    return this.props.children
  }
}

// Error Fallback Component
interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onRetry: () => void
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onRetry }) => {
  const navigate = useNavigate()

  const isDevelopment = import.meta.env.DEV

  return (
    <div className="min-h-96 flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          אופס! משהו השתבש
        </h1>
        
        <p className="text-gray-600 mb-6">
          אירעה שגיאה בלתי צפויה בעמוד פרטי התלמיד. 
          אנא נסה שוב או חזור לרשימת התלמידים.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            נסה שוב
          </button>
          
          <button
            onClick={() => navigate('/students')}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            חזור לתלמידים
          </button>
        </div>

        {/* Development Error Details */}
        {isDevelopment && error && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 mb-2">
              פרטי שגיאה (מצב פיתוח)
            </summary>
            
            <div className="bg-gray-50 rounded-lg p-4 text-xs space-y-3">
              {/* Error Message */}
              <div>
                <h4 className="font-medium text-gray-900 mb-1">הודעת שגיאה:</h4>
                <pre className="text-red-600 whitespace-pre-wrap break-words">
                  {error.message}
                </pre>
              </div>

              {/* Error Stack */}
              {error.stack && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Stack Trace:</h4>
                  <pre className="text-gray-700 whitespace-pre-wrap break-words overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </div>
              )}

              {/* Component Stack */}
              {errorInfo?.componentStack && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Component Stack:</h4>
                  <pre className="text-gray-700 whitespace-pre-wrap break-words overflow-auto max-h-32">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            אם הבעיה נמשכת, אנא צור קשר עם מנהל המערכת
          </p>
        </div>
      </div>
    </div>
  )
}

export default StudentDetailsErrorBoundary