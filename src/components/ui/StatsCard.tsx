import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { Card } from './Card'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray' | 'teal' | 'amber'
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down'
  }
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'blue',
  trend 
}: StatsCardProps) {
  const colorClasses = {
    blue: {
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      valueColor: 'text-primary-600'
    },
    green: {
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      valueColor: 'text-success-600'
    },
    orange: {
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      valueColor: 'text-orange-600'
    },
    purple: {
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-600'
    },
    red: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      valueColor: 'text-red-600'
    },
    gray: {
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      valueColor: 'text-gray-600'
    },
    teal: {
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      valueColor: 'text-teal-600'
    },
    amber: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-600'
    }
  }

  const colors = colorClasses[color] || colorClasses.blue

  return (
    <Card hover>
      <div className="flex items-center">
        <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', colors.iconBg)}>
          <div className={clsx('w-6 h-6', colors.iconColor)}>
            {icon}
          </div>
        </div>
        <div className="mr-4 flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <div className="flex items-baseline">
            <p className={clsx('text-3xl font-bold', colors.valueColor)}>
              {value}
            </p>
            {trend && (
              <span className={clsx('mr-2 text-sm font-medium', {
                'text-success-600': trend.direction === 'up',
                'text-red-600': trend.direction === 'down'
              })}>
                {trend.direction === 'up' ? '+' : '-'}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p className="text-xs text-gray-400 mt-1">{trend.label}</p>
          )}
        </div>
      </div>
    </Card>
  )
}