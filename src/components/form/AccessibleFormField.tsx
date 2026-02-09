import React from 'react'
import { AlertCircle } from 'lucide-react'

interface AccessibleFormFieldProps {
  children: React.ReactElement
  label: string
  error?: string
  helperText?: string
  required?: boolean
  fieldId?: string
  className?: string
}

/**
 * AccessibleFormField - Wrapper component that enhances form fields with proper accessibility
 * 
 * Features:
 * - Proper ARIA labeling
 * - Error announcements for screen readers
 * - Hebrew RTL support
 * - Keyboard navigation
 * - Focus management
 */
const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  children,
  label,
  error,
  helperText,
  required = false,
  fieldId,
  className = ''
}) => {
  const generatedId = fieldId || `field-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${generatedId}-error`
  const helperTextId = `${generatedId}-helper`
  const labelId = `${generatedId}-label`

  // Clone the child element and add accessibility props
  const enhancedChild = React.cloneElement(children, {
    id: generatedId,
    'aria-labelledby': labelId,
    'aria-describedby': [
      error ? errorId : null,
      helperText ? helperTextId : null
    ].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? 'true' : 'false',
    'aria-required': required ? 'true' : 'false'
  })

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      <label 
        id={labelId}
        htmlFor={generatedId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span 
            className="text-red-500 mr-1" 
            aria-label="שדה חובה"
          >
            *
          </span>
        )}
      </label>

      {/* Enhanced input field */}
      {enhancedChild}

      {/* Error message */}
      {error && (
        <div 
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-center space-x-2 space-x-reverse mt-1 text-sm text-red-600"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <div 
          id={helperTextId}
          className="text-xs text-gray-500 mt-1"
        >
          {helperText}
        </div>
      )}
    </div>
  )
}

export default AccessibleFormField

/**
 * Hook for managing form accessibility
 */
export const useFormAccessibility = () => {
  const [announcements, setAnnouncements] = React.useState<string[]>([])

  const announceToScreenReader = (message: string) => {
    setAnnouncements(prev => [...prev, message])
    
    // Clear the announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1))
    }, 1000)
  }

  const ScreenReaderAnnouncements = () => (
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
      className="sr-only"
    >
      {announcements.map((announcement, index) => (
        <div key={index}>{announcement}</div>
      ))}
    </div>
  )

  return {
    announceToScreenReader,
    ScreenReaderAnnouncements
  }
}

/**
 * Hebrew-specific keyboard navigation helpers
 */
export const useHebrewKeyboardNavigation = () => {
  const handleKeyboardNavigation = (e: React.KeyboardEvent, options: {
    onEnter?: () => void
    onEscape?: () => void
    onArrowUp?: () => void
    onArrowDown?: () => void
    onArrowRight?: () => void
    onArrowLeft?: () => void
  }) => {
    switch (e.key) {
      case 'Enter':
        options.onEnter?.()
        break
      case 'Escape':
        options.onEscape?.()
        break
      case 'ArrowUp':
        e.preventDefault()
        options.onArrowUp?.()
        break
      case 'ArrowDown':
        e.preventDefault()
        options.onArrowDown?.()
        break
      case 'ArrowRight':
        // In RTL, right arrow should go to previous item
        e.preventDefault()
        options.onArrowLeft?.() // Swap for RTL
        break
      case 'ArrowLeft':
        // In RTL, left arrow should go to next item
        e.preventDefault()
        options.onArrowRight?.() // Swap for RTL
        break
    }
  }

  return { handleKeyboardNavigation }
}

/**
 * Focus management utilities for Hebrew forms
 */
export const useFocusManagement = () => {
  const focusFirstError = (formRef: React.RefObject<HTMLFormElement>) => {
    if (!formRef.current) return

    const firstErrorElement = formRef.current.querySelector('[aria-invalid="true"]') as HTMLElement
    if (firstErrorElement) {
      firstErrorElement.focus()
      
      // Announce to screen reader
      const errorMessage = firstErrorElement.getAttribute('aria-describedby')
      if (errorMessage) {
        const errorElement = document.getElementById(errorMessage)
        if (errorElement) {
          // Create a temporary announcement
          const announcement = document.createElement('div')
          announcement.setAttribute('role', 'alert')
          announcement.setAttribute('aria-live', 'assertive')
          announcement.className = 'sr-only'
          announcement.textContent = `שגיאה: ${errorElement.textContent}`
          
          document.body.appendChild(announcement)
          setTimeout(() => document.body.removeChild(announcement), 1000)
        }
      }
    }
  }

  const trapFocus = (containerRef: React.RefObject<HTMLElement>) => {
    const container = containerRef.current
    if (!container) return

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    
    // Focus first element
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }

  return { focusFirstError, trapFocus }
}