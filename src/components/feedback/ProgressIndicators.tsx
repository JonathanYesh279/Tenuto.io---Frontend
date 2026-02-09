import React from 'react'
import { CheckCircle, Clock, AlertCircle, Music } from 'lucide-react'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'green' | 'blue' | 'orange' | 'red'
  striped?: boolean
  animated?: boolean
  className?: string
}

interface StepProgressProps {
  steps: Array<{
    id: string
    label: string
    description?: string
    status: 'pending' | 'current' | 'completed' | 'error'
  }>
  direction?: 'horizontal' | 'vertical'
  className?: string
}

interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: 'primary' | 'green' | 'blue' | 'orange' | 'red'
  showValue?: boolean
  label?: string
  className?: string
}

// Linear progress bar
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  color = 'primary',
  striped = false,
  animated = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }
  
  const colorClasses = {
    primary: 'bg-primary-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  }
  
  return (
    <div className={`w-full ${className}`} dir="rtl">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]} overflow-hidden`}>
        <div
          className={`
            ${sizeClasses[size]} 
            ${colorClasses[color]} 
            rounded-full 
            transition-all 
            duration-300 
            ease-out
            ${striped ? 'bg-stripe-pattern' : ''}
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        />
      </div>
    </div>
  )
}

// Circular progress indicator
export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color = 'primary',
  showValue = true,
  label,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  const colorClasses = {
    primary: 'stroke-primary-500',
    green: 'stroke-green-500',
    blue: 'stroke-blue-500',
    orange: 'stroke-orange-500',
    red: 'stroke-red-500'
  }
  
  return (
    <div className={`flex flex-col items-center ${className}`} dir="rtl">
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colorClasses[color]} transition-all duration-300 ease-out`}
          />
        </svg>
        
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-700 font-reisinger-yonatan">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      
      {label && (
        <span className="mt-2 text-sm font-medium text-gray-700 font-reisinger-yonatan text-center">
          {label}
        </span>
      )}
    </div>
  )
}

// Step-by-step progress indicator
export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  direction = 'horizontal',
  className = ''
}) => {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'current':
        return <Clock className="w-5 h-5 text-primary-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />
        )
    }
  }
  
  const getStepStyles = (status: string) => {
    const styles = {
      completed: 'text-green-600 bg-green-50 border-green-200',
      current: 'text-primary-600 bg-primary-50 border-primary-200',
      error: 'text-red-600 bg-red-50 border-red-200',
      pending: 'text-gray-600 bg-gray-50 border-gray-200'
    }
    return styles[status as keyof typeof styles] || styles.pending
  }
  
  const getConnectorStyles = (currentIndex: number, steps: any[]) => {
    if (currentIndex === steps.length - 1) return 'hidden'
    
    const currentStatus = steps[currentIndex].status
    const nextStatus = steps[currentIndex + 1].status
    
    if (currentStatus === 'completed') {
      return 'bg-green-500'
    } else if (currentStatus === 'current' && nextStatus === 'pending') {
      return 'bg-gradient-to-r from-primary-500 to-gray-300'
    } else {
      return 'bg-gray-300'
    }
  }
  
  if (direction === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`} dir="rtl">
        {steps.map((step, index) => (
          <div key={step.id} className="flex">
            <div className="flex flex-col items-center ml-4">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2
                ${getStepStyles(step.status)}
              `}>
                {getStepIcon(step.status)}
              </div>
              
              {index < steps.length - 1 && (
                <div className={`
                  w-0.5 h-8 mt-2
                  ${getConnectorStyles(index, steps)}
                `} />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={`
                text-sm font-semibold font-reisinger-yonatan
                ${step.status === 'completed' ? 'text-green-600' :
                  step.status === 'current' ? 'text-primary-600' :
                  step.status === 'error' ? 'text-red-600' :
                  'text-gray-600'}
              `}>
                {step.label}
              </h3>
              
              {step.description && (
                <p className="text-xs text-gray-500 mt-1 font-reisinger-yonatan">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  // Horizontal layout
  return (
    <div className={`flex items-center ${className}`} dir="rtl">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2
              ${getStepStyles(step.status)}
            `}>
              {getStepIcon(step.status)}
            </div>
            
            <div className="mt-2 text-center">
              <h3 className={`
                text-xs font-semibold font-reisinger-yonatan
                ${step.status === 'completed' ? 'text-green-600' :
                  step.status === 'current' ? 'text-primary-600' :
                  step.status === 'error' ? 'text-red-600' :
                  'text-gray-600'}
              `}>
                {step.label}
              </h3>
              
              {step.description && (
                <p className="text-xs text-gray-500 mt-1 font-reisinger-yonatan max-w-20">
                  {step.description}
                </p>
              )}
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <div className={`
              flex-1 h-0.5 mx-4
              ${getConnectorStyles(index, steps)}
            `} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Musical progress indicator for conservatory context
export const MusicalProgress: React.FC<{
  value: number
  max?: number
  stages?: string[]
  currentStage?: number
  label?: string
  className?: string
}> = ({
  value,
  max = 8,
  stages = ['שלב 1', 'שלב 2', 'שלב 3', 'שלב 4', 'שלב 5', 'שלב 6', 'שלב 7', 'שלב 8'],
  currentStage,
  label,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  return (
    <div className={`w-full ${className}`} dir="rtl">
      {label && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
            {label}
          </span>
          <div className="flex items-center">
            <Music className="w-4 h-4 text-primary-500 ml-1" />
            <span className="text-sm font-medium text-primary-600 font-reisinger-yonatan">
              {currentStage ? stages[currentStage - 1] : `${value}/${max}`}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-1 space-x-reverse">
        {stages.slice(0, max).map((stage, index) => {
          const isCompleted = index < value
          const isCurrent = index === value - 1
          
          return (
            <div
              key={index}
              className={`
                flex-1 h-3 rounded-full border transition-all duration-300
                ${isCompleted 
                  ? 'bg-primary-500 border-primary-500' 
                  : isCurrent 
                    ? 'bg-primary-200 border-primary-400 animate-pulse'
                    : 'bg-gray-200 border-gray-300'
                }
              `}
              title={stage}
            />
          )
        })}
      </div>
      
      <div className="flex justify-between mt-1 text-xs text-gray-500 font-reisinger-yonatan">
        <span>שלב 1</span>
        <span>שלב {max}</span>
      </div>
    </div>
  )
}

// Progress with Hebrew status messages
export const StatusProgress: React.FC<{
  status: 'loading' | 'success' | 'error' | 'warning'
  message: string
  progress?: number
  className?: string
}> = ({
  status,
  message,
  progress,
  className = ''
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'green'
      case 'error': return 'red'
      case 'warning': return 'orange'
      default: return 'primary'
    }
  }
  
  return (
    <div className={`space-y-2 ${className}`} dir="rtl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
          {message}
        </span>
        
        {progress !== undefined && (
          <span className="text-sm font-medium text-gray-700 font-reisinger-yonatan">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      
      {progress !== undefined ? (
        <ProgressBar 
          value={progress} 
          color={getStatusColor()}
          animated={status === 'loading'}
        />
      ) : (
        <div className={`h-3 bg-gray-200 rounded-full ${
          status === 'loading' ? 'animate-pulse' : ''
        }`} />
      )}
    </div>
  )
}