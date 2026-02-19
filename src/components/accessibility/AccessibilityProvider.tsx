/**
 * Accessibility Provider
 * Centralized accessibility features for the conservatory application
 */

import React, { createContext, useContext, useState, useEffect } from 'react'

interface AccessibilityContextType {
  screenReaderEnabled: boolean
  highContrast: boolean
  reducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large'
  keyboardNavigation: boolean
  announceMessage: (message: string) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [keyboardNavigation, setKeyboardNavigation] = useState(false)

  // Detect system preferences
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    setHighContrast(contrastQuery.matches)
    
    const handleContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches)
    contrastQuery.addEventListener('change', handleContrastChange)

    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true)
      }
    }

    const handleMouseDown = () => {
      setKeyboardNavigation(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      contrastQuery.removeEventListener('change', handleContrastChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Live region for screen reader announcements
  const announceMessage = (message: string) => {
    const announcement = document.getElementById('accessibility-announcer')
    if (announcement) {
      announcement.textContent = message
      // Clear after announcement
      setTimeout(() => {
        announcement.textContent = ''
      }, 1000)
    }
  }

  // Apply accessibility classes to document
  useEffect(() => {
    const root = document.documentElement
    
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    
    if (reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }
    
    if (keyboardNavigation) {
      root.classList.add('keyboard-navigation')
    } else {
      root.classList.remove('keyboard-navigation')
    }
    
    root.setAttribute('data-font-size', fontSize)
  }, [highContrast, reducedMotion, keyboardNavigation, fontSize])

  return (
    <AccessibilityContext.Provider value={{
      screenReaderEnabled,
      highContrast,
      reducedMotion,
      fontSize,
      keyboardNavigation,
      announceMessage
    }}>
      {children}
      {/* Live region for screen reader announcements */}
      <div
        id="accessibility-announcer"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </AccessibilityContext.Provider>
  )
}

// Skip link component for keyboard navigation
export const SkipLink: React.FC<{ targetId: string; children: React.ReactNode }> = ({ 
  targetId, 
  children 
}) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-lg z-50 transition-all"
      onClick={(e) => {
        e.preventDefault()
        const target = document.getElementById(targetId)
        target?.focus()
        target?.scrollIntoView({ behavior: 'smooth' })
      }}
    >
      {children}
    </a>
  )
}

// Focus trap for modals and dialogs
export const FocusTrap: React.FC<{ 
  children: React.ReactNode
  isActive: boolean
}> = ({ children, isActive }) => {
  const trapRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) return

    const trap = trapRef.current
    if (!trap) return

    const focusableElements = trap.querySelectorAll(
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

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const closeButton = trap.querySelector('[data-close-modal]') as HTMLElement
        closeButton?.click()
      }
    }

    document.addEventListener('keydown', handleTabKey)
    document.addEventListener('keydown', handleEscape)

    // Focus first element when activated
    setTimeout(() => firstElement?.focus(), 100)

    return () => {
      document.removeEventListener('keydown', handleTabKey)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isActive])

  return (
    <div ref={trapRef} className="focus-trap">
      {children}
    </div>
  )
}

// Enhanced form field with accessibility features
export const AccessibleFormField: React.FC<{
  id: string
  label: string
  children: React.ReactNode
  error?: string
  required?: boolean
  description?: string
  dir?: 'rtl' | 'ltr'
}> = ({ 
  id, 
  label, 
  children, 
  error, 
  required, 
  description,
  dir = 'rtl'
}) => {
  const { announceMessage } = useAccessibility()

  useEffect(() => {
    if (error) {
      announceMessage(`שגיאה בשדה ${label}: ${error}`)
    }
  }, [error, label, announceMessage])

  return (
    <div className="space-y-2" dir={dir}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 mr-1" aria-label="שדה חובה">*</span>
        )}
      </label>
      
      {description && (
        <p 
          id={`${id}-description`} 
          className="text-sm text-gray-600"
        >
          {description}
        </p>
      )}
      
      <div className={error ? 'error' : ''}>
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': [
            description ? `${id}-description` : null,
            error ? `${id}-error` : null
          ].filter(Boolean).join(' '),
          'aria-required': required,
          'aria-invalid': !!error
        })}
      </div>
      
      {error && (
        <p 
          id={`${id}-error`} 
          className="text-sm text-red-600 flex items-center gap-1"
          role="alert"
          aria-live="polite"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}

export default AccessibilityProvider