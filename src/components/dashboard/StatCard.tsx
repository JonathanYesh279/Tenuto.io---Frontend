import React from 'react'
import { TrendingUp, TrendingDown, Minus, MoreHorizontal } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  chart?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    period?: string
  }
  loading?: boolean
  error?: string
  onClick?: () => void
  actions?: Array<{
    label: string
    onClick: () => void
  }>
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  chart,
  trend,
  loading = false,
  error,
  onClick,
  actions,
  className = '',
  variant = 'default'
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      return val.toLocaleString('he-IL')
    }
    return val
  }

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'neutral':
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'neutral':
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded border border-gray-200 p-6 ${className}`} dir="rtl">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-background rounded border border-red-200 p-6 ${className}`} dir="rtl">
        <div className="text-center">
          <div className="text-red-500 text-sm font-reisinger-yonatan mb-2">שגיאה בטעינת נתונים</div>
          <div className="text-xs text-gray-500 font-reisinger-yonatan">{error}</div>
        </div>
      </div>
    )
  }

  const cardContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 font-reisinger-yonatan">
          {title}
        </h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          {icon && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}
          {actions && actions.length > 0 && (
            <div className="relative group">
              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-border rounded shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="block w-full px-4 py-2 text-right text-sm text-foreground hover:bg-muted font-reisinger-yonatan"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-gray-900 font-reisinger-yonatan">
          {formatValue(value)}
        </div>
        
        {subtitle && (
          <div className="text-sm text-gray-600 font-reisinger-yonatan mt-1">
            {subtitle}
          </div>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center mb-3">
          {getTrendIcon()}
          <span className={`text-sm font-medium mr-1 font-reisinger-yonatan ${getTrendColor()}`}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          {trend.period && (
            <span className="text-xs text-gray-500 mr-1 font-reisinger-yonatan">
              {trend.period}
            </span>
          )}
        </div>
      )}

      {/* Chart */}
      {chart && (
        <div className="mt-4">
          {chart}
        </div>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`
          bg-white rounded border border-gray-200 p-6 
          hover:border-border
          transition-all duration-200 
          text-right w-full
          ${className}
        `}
        dir="rtl"
      >
        {cardContent}
      </button>
    )
  }

  return (
    <div 
      className={`bg-white rounded border border-gray-200 p-6 ${className}`}
      dir="rtl"
    >
      {cardContent}
    </div>
  )
}

export default StatCard

// Specialized stat card variants
export const CompactStatCard: React.FC<Omit<StatCardProps, 'variant'>> = (props) => (
  <StatCard {...props} variant="compact" className="p-4" />
)

export const DetailedStatCard: React.FC<Omit<StatCardProps, 'variant'>> = (props) => (
  <StatCard {...props} variant="detailed" className="p-8" />
)

// Stat card with progress bar
export const ProgressStatCard: React.FC<StatCardProps & {
  progress: number
  progressMax?: number
  progressLabel?: string
}> = ({
  progress,
  progressMax = 100,
  progressLabel,
  ...props
}) => {
  const percentage = Math.min(Math.max((progress / progressMax) * 100, 0), 100)
  
  return (
    <StatCard
      {...props}
      chart={
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600 font-reisinger-yonatan">
            <span>{progressLabel || 'התקדמות'}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      }
    />
  )
}