import React, { useState } from 'react'

import { VALID_CLASSES, validateSelection, ValidationResult } from '../../utils/validationUtils'
import ValidationIndicator from '../ui/ValidationIndicator'
import { CaretDownIcon, GraduationCapIcon } from '@phosphor-icons/react'

interface ClassSelectProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (result: ValidationResult) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
  showValidation?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
}

const ClassSelect: React.FC<ClassSelectProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = 'בחר כיתה',
  label,
  required = false,
  disabled = false,
  className = '',
  showValidation = true,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const [isTouched, setIsTouched] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true })

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Validate selection
    let result: ValidationResult
    if (required && !newValue) {
      result = { isValid: false, message: 'בחירת כיתה נדרשת' }
    } else if (newValue && !VALID_CLASSES.includes(newValue)) {
      result = { isValid: false, message: 'כיתה לא תקינה' }
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
      w-full pl-10 pr-4 py-2 border rounded 
      focus:outline-none focus:ring-2 focus:ring-ring 
      transition-colors duration-200
      text-right bg-white
      appearance-none cursor-pointer
    `
    
    if (disabled) {
      return `${baseClasses} bg-gray-100 cursor-not-allowed opacity-60 border-input`
    }
    
    if (validationResult.isValid && isTouched && value) {
      return `${baseClasses} border-green-300 focus:border-green-500`
    }
    
    if (!validationResult.isValid && (isTouched || value)) {
      return `${baseClasses} border-red-300 focus:border-red-500 bg-red-50`
    }
    
    return `${baseClasses} border-input focus:border-ring`
  }

  const inputId = `class-select-${Math.random().toString(36).substr(2, 9)}`
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
        {/* Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <GraduationCapIcon className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Select field */}
        <select
          id={inputId}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={getSelectClasses()}
          aria-label={ariaLabel || label || 'בחירת כיתה'}
          aria-describedby={
            ariaDescribedBy || (validationResult.message ? errorId : undefined)
          }
          aria-invalid={!validationResult.isValid}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {VALID_CLASSES.map((classOption) => (
            <option key={classOption} value={classOption}>
              כיתה {classOption}
            </option>
          ))}
        </select>
        
        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <CaretDownIcon className="w-4 h-4 text-gray-400" />
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
        בחר את כיתת התלמיד הנוכחית
      </div>
    </div>
  )
}

export default ClassSelect