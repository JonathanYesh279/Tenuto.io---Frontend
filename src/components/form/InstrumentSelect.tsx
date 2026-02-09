import React, { useState } from 'react'
import { ChevronDown, Music } from 'lucide-react'
import { VALID_INSTRUMENTS, validateSelection, ValidationResult } from '../../utils/validationUtils'
import ValidationIndicator from '../ui/ValidationIndicator'

interface InstrumentSelectProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (result: ValidationResult) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
  showValidation?: boolean
  categorized?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
}

const InstrumentSelect: React.FC<InstrumentSelectProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = 'בחר כלי נגינה',
  label,
  required = false,
  disabled = false,
  className = '',
  showValidation = true,
  categorized = true,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const [isTouched, setIsTouched] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true })

  // Categorize instruments for better UX
  const instrumentCategories = {
    'כלי נגינה': ['חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט'],
    'כלי נשיפה': ['חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון'],
    'כלי מיתר': ['כינור', 'ויולא', "צ'לו", 'קונטרבס', 'גיטרה', 'גיטרה בס'],
    'כלי הקשה ואחרים': ['תופים', 'פסנתר', 'שירה']
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Validate selection
    let result: ValidationResult
    if (required && !newValue) {
      result = { isValid: false, message: 'בחירת כלי נגינה נדרשת' }
    } else if (newValue && !VALID_INSTRUMENTS.includes(newValue)) {
      result = { isValid: false, message: 'כלי נגינה לא תקין' }
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

  const inputId = `instrument-select-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${inputId}-error`

  const renderOptions = () => {
    if (categorized) {
      return Object.entries(instrumentCategories).map(([category, instruments]) => (
        <optgroup key={category} label={category}>
          {instruments.map((instrument) => (
            <option key={instrument} value={instrument}>
              {instrument}
            </option>
          ))}
        </optgroup>
      ))
    } else {
      return VALID_INSTRUMENTS.map((instrument) => (
        <option key={instrument} value={instrument}>
          {instrument}
        </option>
      ))
    }
  }

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
          <Music className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Select field */}
        <select
          id={inputId}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={getSelectClasses()}
          aria-label={ariaLabel || label || 'בחירת כלי נגינה'}
          aria-describedby={
            ariaDescribedBy || (validationResult.message ? errorId : undefined)
          }
          aria-invalid={!validationResult.isValid}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {renderOptions()}
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
        בחר את כלי הנגינה העיקרי של התלמיד
      </div>
    </div>
  )
}

export default InstrumentSelect