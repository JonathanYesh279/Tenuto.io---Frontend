import { Popover, PopoverTrigger, PopoverContent, Chip } from '@heroui/react'
import { motion } from 'framer-motion'
import {
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  User as UserIcon,
  MusicNotes as MusicNotesIcon,
  BookOpen as BookOpenIcon,
  Users as UsersIcon,
} from '@phosphor-icons/react'
import { VerticalAutoScroll } from '@/components/animations/VerticalAutoScroll'
import type { EnrollmentEntry } from '../../hooks/useStudentDashboardData'

interface StudentAgendaWidgetProps {
  enrollments: EnrollmentEntry[]
  isLoading: boolean
}

const GLASS_CARD_STYLE = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,230,210,0.15) 50%, rgba(255,255,255,0.9) 100%)',
  boxShadow:
    '0 4px 16px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(200,220,240,0.5)',
} as const

const TYPE_VARIANTS = {
  individual: {
    bg: 'bg-indigo-50/50',
    border: 'border-indigo-100/50',
    time: 'text-indigo-500',
    title: 'text-indigo-900',
    detail: 'text-indigo-600/70',
    icon: UserIcon,
    label: 'שיעור אישי',
    chipColor: 'primary' as const,
  },
  orchestra: {
    bg: 'bg-amber-50/50',
    border: 'border-amber-100/50',
    time: 'text-amber-500',
    title: 'text-amber-900',
    detail: 'text-amber-600/70',
    icon: UsersIcon,
    label: 'תזמורת',
    chipColor: 'warning' as const,
  },
  theory: {
    bg: 'bg-sky-50/50',
    border: 'border-sky-100/50',
    time: 'text-sky-500',
    title: 'text-sky-900',
    detail: 'text-sky-600/70',
    icon: BookOpenIcon,
    label: 'תאוריה',
    chipColor: 'secondary' as const,
  },
}

export function StudentAgendaWidget({ enrollments, isLoading }: StudentAgendaWidgetProps) {
  if (isLoading) {
    return (
      <div
        className="rounded-card p-5 border border-border shadow-1"
        style={GLASS_CARD_STYLE}
      >
        <h3 className="font-bold text-sm text-foreground mb-4">סדר יום</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-card p-5 border border-border shadow-1 overflow-hidden"
      style={GLASS_CARD_STYLE}
    >
      <h3 className="font-bold text-sm text-foreground mb-4">סדר יום</h3>

      {enrollments.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          אין פעילויות
        </div>
      ) : (
        <VerticalAutoScroll speed={15} height={220}>
          <div className="space-y-3">
            {enrollments.map((activity, index) => {
              const variant =
                TYPE_VARIANTS[activity.type] ?? TYPE_VARIANTS.individual
              const Icon = variant.icon

              return (
                <Popover key={activity.id} placement="right">
                  <PopoverTrigger>
                    <motion.div
                      className={`p-3 rounded-card border cursor-pointer transition-shadow hover:shadow-md ${variant.bg} ${variant.border}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ y: -1 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold ${variant.time}`}>
                          {activity.dayTime || '—'}
                        </span>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={variant.chipColor}
                          classNames={{
                            base: 'h-[18px]',
                            content: 'text-[9px] font-bold px-1',
                          }}
                        >
                          {variant.label}
                        </Chip>
                      </div>
                      <h4 className={`text-sm font-bold mb-0.5 ${variant.title}`}>
                        {activity.name}
                      </h4>
                      {activity.room && (
                        <p className={`text-[11px] ${variant.detail}`}>
                          {activity.room}
                        </p>
                      )}
                    </motion.div>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="p-3 space-y-2 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" />
                        <h4 className="font-bold text-sm text-foreground">
                          {activity.name}
                        </h4>
                      </div>
                      {activity.instrument && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MusicNotesIcon className="w-3.5 h-3.5" />
                          <span>{activity.instrument}</span>
                        </div>
                      )}
                      {activity.dayTime && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span>{activity.dayTime}</span>
                        </div>
                      )}
                      {activity.room && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPinIcon className="w-3.5 h-3.5" />
                          <span>{activity.room}</span>
                        </div>
                      )}
                      <div className="pt-1">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={activity.status === 'פעיל' ? 'success' : 'default'}
                        >
                          {activity.status}
                        </Chip>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )
            })}
          </div>
        </VerticalAutoScroll>
      )}
    </div>
  )
}
