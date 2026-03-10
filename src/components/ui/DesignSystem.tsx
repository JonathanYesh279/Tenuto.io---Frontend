/**
 * Design System Components
 * Centralized UI components following conservatory app design standards
 */

import React from 'react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'


// Color-coded status indicators for music education
export const StatusBadge: React.FC<{
  status: 'active' | 'inactive' | 'graduated' | 'suspended' | 'present' | 'absent' | 'late'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}> = ({ status, size = 'md', children }) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const statusClasses = {
    active: 'bg-success-100 text-success-800 border-success-200',
    inactive: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    // 'graduated' was using primary-NNN — now uses neutral muted tokens
    graduated: 'bg-muted text-foreground border-border',
    suspended: 'bg-red-100 text-red-800 border-red-200',
    present: 'bg-success-100 text-success-800 border-success-200',
    absent: 'bg-red-100 text-red-800 border-red-200',
    late: 'bg-orange-100 text-orange-800 border-orange-200'
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${sizeClasses[size]} ${statusClasses[status]}`}
      role="status"
      aria-label={`סטטוס: ${children}`}
    >
      {children}
    </span>
  )
}

// Consistent card component with Hebrew-optimized layout
export const ConservatoryCard: React.FC<{
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined'
  rtl?: boolean
}> = ({ children, className = '', variant = 'default', rtl = true }) => {
  const variants = {
    default: 'bg-background border border-border',
    elevated: 'bg-background border border-border shadow-md',
    outlined: 'bg-background border-2 border-border'
  }

  return (
    <div
      className={`rounded p-6 transition-all duration-200 ${variants[variant]} ${className}`}
      dir={rtl ? 'rtl' : 'ltr'}
    >
      {children}
    </div>
  )
}

// Instrument category badges with specific colors
export const InstrumentBadge: React.FC<{
  category: 'strings' | 'woodwinds' | 'brass' | 'percussion' | 'keyboard' | 'voice'
  children: React.ReactNode
}> = ({ category, children }) => {
  const categoryColors = {
    strings: 'bg-blue-100 text-blue-800 border-blue-200',
    woodwinds: 'bg-green-100 text-green-800 border-green-200',
    brass: 'bg-orange-100 text-orange-800 border-orange-200',
    percussion: 'bg-red-100 text-red-800 border-red-200',
    keyboard: 'bg-purple-100 text-purple-800 border-purple-200',
    voice: 'bg-pink-100 text-pink-800 border-pink-200'
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${categoryColors[category]}`}
      title={`קטגורית כלי נגינה: ${children}`}
    >
      {children}
    </span>
  )
}

// Progress indicator for student advancement
export const ProgressIndicator: React.FC<{
  current: number
  total: number
  label: string
  showPercentage?: boolean
}> = ({ current, total, label, showPercentage = true }) => {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className="space-y-2" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        {showPercentage && (
          <span className="text-muted-foreground">{percentage}%</span>
        )}
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{current} הושלם</span>
        <span>מתוך {total}</span>
      </div>
    </div>
  )
}

// Action button with consistent styling — delegates to CVA Button
export const ActionButton: React.FC<{
  variant: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  icon?: PhosphorIcon
  children: React.ReactNode
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
}> = ({
  variant,
  size = 'md',
  icon: Icon,
  children,
  disabled = false,
  loading = false,
  onClick,
  className = ''
}) => {
  // Map ActionButton variants to CVA Button variants
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
    primary: 'default',
    secondary: 'secondary',
    danger: 'destructive',
    success: 'default'
  }

  // Map ActionButton sizes to CVA Button sizes
  const sizeMap: Record<string, 'sm' | 'default' | 'lg'> = {
    sm: 'sm',
    md: 'default',
    lg: 'lg'
  }

  return (
    <Button
      variant={variantMap[variant]}
      size={sizeMap[size]}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'gap-2',
        variant === 'success' && 'bg-success-500 text-white hover:bg-success-600',
        className
      )}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {Icon && !loading && <Icon className="w-4 h-4" />}
      {children}
    </Button>
  )
}

// Empty state component
export const EmptyState: React.FC<{
  icon: PhosphorIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <Icon className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-h3 text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <ActionButton variant="primary" onClick={action.onClick}>
          {action.label}
        </ActionButton>
      )}
    </div>
  )
}

// Loading skeleton for consistent loading states
export const LoadingSkeleton: React.FC<{
  type: 'card' | 'table' | 'calendar' | 'list'
  count?: number
}> = ({ type, count = 1 }) => {
  const CardSkeleton = () => (
    <div className="bg-background rounded border border-border p-6 animate-pulse">
      <div className="h-6 bg-muted rounded mb-4 w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  )

  const TableSkeleton = () => (
    <div className="bg-background border border-border overflow-hidden animate-pulse">
      <div className="h-12 bg-muted border-b border-border"></div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 border-b border-border p-4">
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
      ))}
    </div>
  )

  const CalendarSkeleton = () => (
    <div className="bg-background border border-border p-6 animate-pulse">
      <div className="grid grid-cols-7 gap-4 mb-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded"></div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded border border-border"></div>
        ))}
      </div>
    </div>
  )

  const ListSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-background rounded border border-border p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const skeletonComponents = {
    card: CardSkeleton,
    table: TableSkeleton,
    calendar: CalendarSkeleton,
    list: ListSkeleton
  }

  const SkeletonComponent = skeletonComponents[type]

  return count === 1 ? <SkeletonComponent /> : (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  )
}

export const DesignSystem = {
  StatusBadge,
  ConservatoryCard,
  InstrumentBadge,
  ProgressIndicator,
  ActionButton,
  EmptyState,
  LoadingSkeleton
}

export default DesignSystem
