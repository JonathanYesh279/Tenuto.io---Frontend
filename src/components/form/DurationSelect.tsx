import React, { useState } from 'react'
import { ChevronDown, Timer } from 'lucide-react'
import { VALID_DURATIONS, ValidationResult } from '../../utils/validationUtils'
import ValidationIndicator from '../ui/ValidationIndicator'

interface DurationSelectProps {
  value: number | string
  onChange: (value: number) => void
  onValidationChange?: (result: ValidationResult) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
  showValidation?: boolean
  options?: number[]
  labels?: string[]
  customOptions?: { value: number; label: string }[]
  'aria-label'?: string
  'aria-describedby'?: string
}

const DurationSelect: React.FC<DurationSelectProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = 'בחר משך זמן',
  label,
  required = false,
  disabled = false,
  className = '',
  showValidation = true,
  options = VALID_DURATIONS,
  labels,
  customOptions,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const [isTouched, setIsTouched] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true })

  // Generate duration options
  const getDurationOptions = () => {
    if (customOptions) {
      return customOptions
    }

    return options.map((duration, index) => ({
      value: duration,
      label: labels?.[index] || formatDuration(duration)
    }))
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} דקות`
    }
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes === 0) {
      return hours === 1 ? 'שעה אחת' : `${hours} שעות`
    }
    
    const hoursText = hours === 1 ? 'שעה' : `${hours} שעות`
    return `${hoursText} ו-${remainingMinutes} דקות`
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = parseInt(e.target.value)
    onChange(newValue)
    
    // Validate selection
    let result: ValidationResult
    if (required && (!newValue || newValue === 0)) {
      result = { isValid: false, message: 'בחירת משך זמן נדרשת' }
    } else if (newValue && !options.includes(newValue)) {
      result = { isValid: false, message: 'משך זמן לא תקין' }
    } else {
      result = { isValid: true }
    }
    
    setValidationResult(result)
    onValidationChange?.(result)
  }

  const handleBlur = () => {
    setIsTouched(true)
  }

  const getSelectClasses = () => {
    const baseClasses = `
      w-full pl-10 pr-4 py-2 border rounded-lg 
      focus:outline-none focus:ring-2 focus:ring-primary-500 
      transition-colors duration-200
      text-right bg-white
      appearance-none cursor-pointer
    `
    
    if (disabled) {
      return `${baseClasses} bg-gray-100 cursor-not-allowed opacity-60 border-gray-300`
    }
    
    if (validationResult.isValid && isTouched && value) {
      return `${baseClasses} border-green-300 focus:border-green-500`
    }
    
    if (!validationResult.isValid && (isTouched || value)) {
      return `${baseClasses} border-red-300 focus:border-red-500 bg-red-50`
    }
    
    return `${baseClasses} border-gray-300 focus:border-primary-500`
  }

  const inputId = `duration-select-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${inputId}-error`

  const durationOptions = getDurationOptions()

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
        {/* Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Timer className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Select field */}
        <select
          id={inputId}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={getSelectClasses()}
          aria-label={ariaLabel || label || 'בחירת משך זמן'}
          aria-describedby={
            ariaDescribedBy || (validationResult.message ? errorId : undefined)
          }
          aria-invalid={!validationResult.isValid}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {durationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Validation icon */}
        {showValidation && isTouched && value && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
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
        בחר את משך השיעור בדקות
        {value && (
          <span className="block text-primary-600 mt-1">
            נבחר: {formatDuration(Number(value))}
          </span>
        )}
      </div>
    </div>
  )
}

export default DurationSelect