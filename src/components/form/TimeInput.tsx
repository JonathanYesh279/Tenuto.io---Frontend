import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { validateTime, ValidationResult } from '../../utils/validationUtils'
import ValidationIndicator from '../ui/ValidationIndicator'

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (result: ValidationResult) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  autoFocus?: boolean
  className?: string
  showValidation?: boolean
  validateOnChange?: boolean
  min?: string
  max?: string
  step?: number
  'aria-label'?: string
  'aria-describedby'?: string
}

const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = 'HH:MM',
  label,
  required = false,
  disabled = false,
  autoFocus = false,
  className = '',
  showValidation = true,
  validateOnChange = true,
  min,
  max,
  step,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const [isTouched, setIsTouched] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true })

  // Validate on value change
  useEffect(() => {
    if (validateOnChange && (isTouched || value)) {
      const result = validateTimeValue(value)
      setValidationResult(result)
      onValidationChange?.(result)
    }
  }, [value, validateOnChange, isTouched, onValidationChange, min, max])

  const validateTimeValue = (timeValue: string): ValidationResult => {
    if (required && !timeValue) {
      return { isValid: false, message: 'זמן נדרש' }
    }

    if (!timeValue) {
      return { isValid: true }
    }

    // Basic time format validation
    const timeResult = validateTime(timeValue)
    if (!timeResult.isValid) {
      return timeResult
    }

    // Min/max validation
    if (min && timeValue < min) {
      return { isValid: false, message: `זמן חייב להיות אחרי ${min}` }
    }

    if (max && timeValue > max) {
      return { isValid: false, message: `זמן חייב להיות לפני ${max}` }
    }

    return { isValid: true }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    
    // Auto-format time input
    inputValue = formatTimeInput(inputValue)
    
    onChange(inputValue)
  }

  const formatTimeInput = (input: string): string => {
    // Remove any non-digit characters except colon
    let cleaned = input.replace(/[^\d:]/g, '')
    
    // Handle auto-formatting
    if (cleaned.length === 1 && parseInt(cleaned) > 2) {
      cleaned = '0' + cleaned + ':'
    } else if (cleaned.length === 2 && !cleaned.includes(':')) {
      if (parseInt(cleaned) > 23) {
        cleaned = cleaned[0] + ':' + cleaned[1]
      } else {
        cleaned = cleaned + ':'
      }
    } else if (cleaned.length === 3 && cleaned[2] !== ':') {
      cleaned = cleaned.slice(0, 2) + ':' + cleaned[2]
    } else if (cleaned.length > 5) {
      cleaned = cleaned.slice(0, 5)
    }
    
    return cleaned
  }

  const handleBlur = () => {
    setIsTouched(true)
    
    // Complete partial time entries
    if (value && value.length < 5) {
      let completed = value
      if (value.includes(':')) {
        const [hours, minutes] = value.split(':')
        completed = `${hours.padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`
      } else if (value.length <= 2) {
        completed = `${value.padStart(2, '0')}:00`
      }
      
      if (completed !== value) {
        onChange(completed)
      }
    }

    if (!validateOnChange) {
      const result = validateTimeValue(value)
      setValidationResult(result)
      onValidationChange?.(result)
    }
  }

  const getInputClasses = () => {
    const baseClasses = `
      w-full pl-10 pr-4 py-2 border rounded 
      focus:outline-none focus:ring-2 focus:ring-ring 
      transition-colors duration-200
      text-center font-mono text-lg text-gray-900
      placeholder:text-gray-400 placeholder:font-sans
    `
    
    if (disabled) {
      return `${baseClasses} bg-gray-100 cursor-not-allowed opacity-60 border-input`
    }
    
    if (validationResult.isValid && isTouched && value) {
      return `${baseClasses} border-green-300 focus:border-green-500 bg-green-50`
    }
    
    if (!validationResult.isValid && (isTouched || value)) {
      return `${baseClasses} border-red-300 focus:border-red-500 bg-red-50`
    }
    
    return `${baseClasses} border-input focus:border-ring bg-white`
  }

  const inputId = `time-input-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${inputId}-error`

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Clock icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Clock className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Input field */}
        <input
          id={inputId}
          type="time"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={getInputClasses()}
          min={min}
          max={max}
          step={step}
          aria-label={ariaLabel || label || 'זמן'}
          aria-describedby={
            ariaDescribedBy || (validationResult.message ? errorId : undefined)
          }
          aria-invalid={!validationResult.isValid}
          {...props}
        />
        
        {/* Validation icon */}
        {showValidation && isTouched && value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <ValidationIndicator
              isValid={validationResult.isValid}
              isInvalid={!validationResult.isValid}
              showIcon={true}
            />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {showValidation && validationResult.message && (isTouched || value) && (
        <ValidationIndicator
          isInvalid={true}
          message={validationResult.message}
          showIcon={false}
          className="mt-1"
        />
      )}
      
      {/* Helper text */}
      <div className="text-xs text-gray-500 mt-1">
        הכנס זמן בפורמט 24 שעות (HH:MM)
        {min && max && (
          <span className="block">
            זמינות: {min} - {max}
          </span>
        )}
      </div>
    </div>
  )
}

export default TimeInput