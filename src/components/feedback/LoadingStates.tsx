import React from 'react'
import { BookOpenIcon, CalendarIcon, CircleNotchIcon, MusicNotesIcon, UsersIcon } from '@phosphor-icons/react'


interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'gray' | 'white'
  className?: string
}

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse' | 'musical'
  size?: 'sm' | 'md' | 'lg'
  message?: string
  context?: 'students' | 'teachers' | 'lessons' | 'general'
  className?: string
}

interface SkeletonProps {
  type?: 'text' | 'card' | 'list' | 'table' | 'form'
  rows?: number
  className?: string
}

// Basic loading spinner
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'text-primary',
    gray: 'text-gray-500',
    white: 'text-white'
  }

  return (
    <CircleNotchIcon 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  )
}

// Context-specific loading messages in Hebrew
const loadingMessages = {
  students: [
    'טוען רשימת תלמידים...',
    'מחפש תלמידים...',
    'מעדכן פרטי תלמיד...',
    'שומר נתוני תלמיד...'
  ],
  teachers: [
    'טוען רשימת מורים...',
    'מחפש מורים...',
    'מעדכן פרטי מורה...',
    'שומר נתוני מורה...'
  ],
  lessons: [
    'טוען רשימת שיעורים...',
    'מתזמן שיעור חדש...',
    'מעדכן פרטי שיעור...',
    'שומר מערכת שעות...'
  ],
  general: [
    'טוען נתונים...',
    'מעבד בקשה...',
    'שומר שינויים...',
    'מחפש במערכת...'
  ]
}

// Main loading state component
export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  size = 'md',
  message,
  context = 'general',
  className = ''
}) => {
  const defaultMessage = message || loadingMessages[context][0]

  const renderMusicalNote = () => (
    <div className="flex items-center justify-center">
      <div className="relative">
        <MusicNotesIcon className="w-8 h-8 text-primary animate-bounce" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/60 rounded-full animate-ping" />
      </div>
    </div>
  )

  const renderContextIcon = () => {
    const icons = {
      students: UsersIcon,
      teachers: UsersIcon,
      lessons: BookOpenIcon,
      general: CalendarIcon
    }
    const Icon = icons[context]
    return <Icon className="w-6 h-6 text-primary animate-pulse" />
  }

  const renderDots = () => (
    <div className="flex space-x-1 space-x-reverse">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )

  const renderPulse = () => (
    <div className="flex items-center space-x-2 space-x-reverse">
      {renderContextIcon()}
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div className="w-full h-full bg-primary rounded-full animate-pulse" />
      </div>
    </div>
  )

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`} dir="rtl">
      <div className="mb-4">
        {variant === 'spinner' && <LoadingSpinner size={size} />}
        {variant === 'musical' && renderMusicalNote()}
        {variant === 'dots' && renderDots()}
        {variant === 'pulse' && renderPulse()}
        {variant === 'skeleton' && <LoadingSkeleton type="card" />}
      </div>
      
      <p className="text-sm text-gray-600 font-reisinger-yonatan text-center">
        {defaultMessage}
      </p>
    </div>
  )
}

// Skeleton loading component
export const LoadingSkeleton: React.FC<SkeletonProps> = ({
  type = 'text',
  rows = 3,
  className = ''
}) => {
  const renderTextSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded animate-pulse ${
            i === rows - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  )

  const renderCardSkeleton = () => (
    <div className="p-4 border border-gray-200 rounded-lg space-y-3">
      <div className="flex items-center space-x-3 space-x-reverse">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse" />
      </div>
    </div>
  )

  const renderListSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 space-x-reverse p-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
          </div>
          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )

  const renderTableSkeleton = () => (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-3 border-b border-gray-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <div 
              key={j} 
              className={`h-3 bg-gray-200 rounded animate-pulse ${
                j === 0 ? 'w-full' : j === 3 ? 'w-1/2' : 'w-3/4'
              }`} 
            />
          ))}
        </div>
      ))}
    </div>
  )

  const renderFormSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
      <div className="flex justify-end space-x-3 space-x-reverse pt-4">
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )

  return (
    <div className={className} dir="rtl">
      {type === 'text' && renderTextSkeleton()}
      {type === 'card' && renderCardSkeleton()}
      {type === 'list' && renderListSkeleton()}
      {type === 'table' && renderTableSkeleton()}
      {type === 'form' && renderFormSkeleton()}
    </div>
  )
}

// Full page loading component
export const PageLoading: React.FC<{
  message?: string
  context?: 'students' | 'teachers' | 'lessons' | 'general'
}> = ({
  message = 'טוען נתונים...',
  context = 'general'
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingState
          variant="musical"
          size="lg"
          message={message}
          context={context}
        />
      </div>
    </div>
  )
}

// Button loading state
export const ButtonLoading: React.FC<{
  children: React.ReactNode
  loading?: boolean
  loadingText?: string
  className?: string
}> = ({
  children,
  loading = false,
  loadingText = 'מעבד...',
  className = ''
}) => {
  return (
    <span className={`flex items-center justify-center ${className}`}>
      {loading && <LoadingSpinner size="sm" className="ml-2" />}
      <span className="font-reisinger-yonatan">
        {loading ? loadingText : children}
      </span>
    </span>
  )
}

// Inline loading component
export const InlineLoading: React.FC<{
  message?: string
  className?: string
}> = ({
  message = 'טוען...',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 space-x-reverse text-sm text-gray-600 ${className}`} dir="rtl">
      <LoadingSpinner size="sm" />
      <span className="font-reisinger-yonatan">{message}</span>
    </div>
  )
}