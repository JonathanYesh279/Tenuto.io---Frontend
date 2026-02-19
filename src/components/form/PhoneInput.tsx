import React, { useState, useEffect } from 'react'

import { validatePhoneNumber, ValidationResult } from '../../utils/validationUtils'
import ValidationIndicator from '../ui/ValidationIndicator'
import { PhoneIcon } from '@phosphor-icons/react'

interface PhoneInputProps {
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
  'aria-label'?: string
  'aria-describedby'?: string
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = '0501234567',
  label,
  required = false,
  disabled = false,
  autoFocus = false,
  className = '',
  showValidation = true,
  validateOnChange = true,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const [isTouched, setIsTouched] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true })

  // Validate on value change
  useEffect(() => {
    if (validateOnChange && (isTouched || value)) {
      const result = validatePhoneNumber(value)
      setValidationResult(result)
      onValidationChange?.(result)
    }
  }, [value, validateOnChange, isTouched, onValidationChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    
    // Remove any non-digit characters except for formatting
    inputValue = inputValue.replace(/[^\d]/g, '')
    
    // Limit to 10 digits
    if (inputValue.length > 10) {
      inputValue = inputValue.slice(0, 10)
    }
    
    // Auto-format with 05 prefix if user starts typing digits
    if (inputValue.length > 0 && !inputValue.startsWith('05')) {
      if (inputValue.length === 1 && inputValue !== '0') {
        inputValue = '05' + inputValue
      } else if (inputValue.length === 2 && inputValue[0] === '0' && inputValue[1] !== '5') {
        inputValue = '05' + inputValue.slice(1)
      }
    }
    
    onChange(inputValue)
  }

  const handleBlur = () => {
    setIsTouched(true)
    if (!validateOnChange) {
      const result = validatePhoneNumber(value)
      setValidationResult(result)
      onValidationChange?.(result)
    }
  }

  const formatDisplayValue = (phoneValue: string): string => {
    if (!phoneValue) return ''
    
    // Format as 05X-XXX-XXXX for better readability
    if (phoneValue.length === 10 && phoneValue.startsWith('05')) {
      return `${phoneValue.slice(0, 3)}-${phoneValue.slice(3, 6)}-${phoneValue.slice(6)}`
    }
    
    return phoneValue
  }

  const getInputClasses = () => {
    const baseClasses = `
      w-full pl-10 pr-4 py-2 border rounded 
      focus:outline-none focus:ring-2 focus:ring-ring 
      transition-colors duration-200
      text-right font-mono text-gray-900
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

  const inputId = `phone-input-${Math.random().toString(36).substr(2, 9)}`
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
        {/* PhoneIcon icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <PhoneIcon className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Input field */}
        <input
          id={inputId}
          type="tel"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={getInputClasses()}
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          maxLength={12} // Account for formatting
          pattern="[0-9]{10}"
          aria-label={ariaLabel || label || 'מספר טלפון'}
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
        מספר טלפון חייב להתחיל ב-05 ולהכיל 10 ספרות
      </div>
    </div>
  )
}

export default PhoneInput