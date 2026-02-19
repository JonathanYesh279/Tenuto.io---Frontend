import React from 'react'
import { CheckIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'


interface ValidationIndicatorProps {
  isValid?: boolean
  isInvalid?: boolean
  message?: string
  showIcon?: boolean
  className?: string
}

const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  isValid = false,
  isInvalid = false,
  message,
  showIcon = true,
  className = ''
}) => {
  if (!isValid && !isInvalid && !message) {
    return null
  }

  const getIconAndColor = () => {
    if (isValid && !isInvalid) {
      return {
        icon: <CheckIcon className="w-4 h-4" />,
        iconColor: 'text-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    }
    
    if (isInvalid || message) {
      return {
        icon: <XIcon className="w-4 h-4" />,
        iconColor: 'text-red-500',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    }

    return {
      icon: <WarningCircleIcon className="w-4 h-4" />,
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    }
  }

  const { icon, iconColor, textColor, bgColor, borderColor } = getIconAndColor()

  return (
    <div className={`flex items-center space-x-2 space-x-reverse mt-1 ${className}`}>
      {showIcon && (
        <div className={`flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
      )}
      {message && (
        <div 
          className={`text-sm ${textColor}`}
          role="alert"
          aria-live="polite"
        >
          {message}
        </div>
      )}
    </div>
  )
}

export default ValidationIndicator