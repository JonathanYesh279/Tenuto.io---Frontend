import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { Card } from './Card'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  color?: 'students' | 'teachers' | 'orchestras' | 'rehearsals' | 'bagrut' | 'theory' | 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray' | 'teal' | 'amber'
  coloredBg?: boolean
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
  coloredBg,
  trend
}: StatsCardProps) {
  const colorClasses = {
    // Entity color system (Phase 18 — subdued per Phase 22)
    students: {
      iconBg: 'bg-students-bg',
      iconColor: 'text-students-fg',
      valueColor: 'text-students-fg',
    },
    teachers: {
      iconBg: 'bg-teachers-bg',
      iconColor: 'text-teachers-fg',
      valueColor: 'text-teachers-fg',
    },
    orchestras: {
      iconBg: 'bg-orchestras-bg',
      iconColor: 'text-orchestras-fg',
      valueColor: 'text-orchestras-fg',
    },
    rehearsals: {
      iconBg: 'bg-rehearsals-bg',
      iconColor: 'text-rehearsals-fg',
      valueColor: 'text-rehearsals-fg',
    },
    bagrut: {
      iconBg: 'bg-bagrut-bg',
      iconColor: 'text-bagrut-fg',
      valueColor: 'text-bagrut-fg',
    },
    theory: {
      iconBg: 'bg-theory-bg',
      iconColor: 'text-theory-fg',
      valueColor: 'text-theory-fg',
    },
    // Legacy color system (backward compatible — using semantic tokens where possible)
    blue: {
      iconBg: 'bg-muted',
      iconColor: 'text-foreground',
      valueColor: 'text-foreground'
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
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      valueColor: 'text-muted-foreground'
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
    <Card hover className={coloredBg && color && colorClasses[color] ? colorClasses[color].iconBg : undefined}>
      <div className="flex items-center">
        <div className={clsx('w-12 h-12 rounded flex items-center justify-center', coloredBg ? 'bg-white/50' : colors.iconBg)}>
          <div className={clsx('w-6 h-6', colors.iconColor)}>
            {icon}
          </div>
        </div>
        <div className="mr-4 flex-1">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
          <div className="flex items-baseline">
            <p className={clsx(coloredBg ? 'text-4xl font-bold' : 'text-3xl font-bold', colors.valueColor)}>
              {value}
            </p>
            {trend && (
              coloredBg ? (
                <span className={clsx('mr-2 rounded-full px-2 py-0.5 text-xs font-bold', colors.iconBg, {
                  'text-success-600': trend.direction === 'up',
                  'text-destructive': trend.direction === 'down'
                })}>
                  {trend.direction === 'up' ? '+' : '-'}{trend.value}%
                </span>
              ) : (
                <span className={clsx('mr-2 text-sm font-medium', {
                  'text-success-600': trend.direction === 'up',
                  'text-destructive': trend.direction === 'down'
                })}>
                  {trend.direction === 'up' ? '+' : '-'}{trend.value}%
                </span>
              )
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className="text-xs text-muted-foreground/70 mt-1">{trend.label}</p>
          )}
        </div>
      </div>
    </Card>
  )
}
