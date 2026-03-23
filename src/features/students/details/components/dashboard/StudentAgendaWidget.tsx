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
      className="rounded-card p-4 border border-border shadow-1 overflow-hidden h-full flex flex-col"
      style={GLASS_CARD_STYLE}
    >
      <h3 className="font-bold text-sm text-foreground mb-2">סדר יום</h3>

      {enrollments.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          אין פעילויות
        </div>
      ) : (
        <VerticalAutoScroll speed={15} itemCount={enrollments.length} className="flex-1">
          <div className="space-y-2">
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
                    <div className="flex items-center justify-between mb-1">
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
                      {(activity.room || activity.location) && (
                        <span className={`text-[10px] ${variant.detail} flex items-center gap-0.5`}>
                          <MapPinIcon size={10} />
                          {activity.room || activity.location}
                        </span>
                      )}
                    </div>
                    <h4 className={`text-xs font-bold ${variant.title}`}>
                      {activity.name}
                    </h4>
                    {activity.dayTime && (
                      <span className={`text-[10px] font-bold ${variant.time} flex items-center gap-0.5 mt-0.5`}>
                        <ClockIcon size={10} />
                        {activity.dayTime}
                      </span>
                    )}
                  </motion.div>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="p-4 space-y-3 min-w-[250px]">
                    {/* Header with icon and name */}
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${variant.bg} ${variant.border} border`}>
                        <Icon className="w-4.5 h-4.5" style={{ color: 'currentColor' }} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{activity.name}</h4>
                        <Chip size="sm" variant="flat" color={variant.chipColor}
                          classNames={{ base: 'h-[16px] mt-0.5', content: 'text-[9px] font-bold px-1' }}>
                          {variant.label}
                        </Chip>
                      </div>
                    </div>

                    <div className="border-t border-border" />

                    {/* Details grid */}
                    <div className="space-y-2">
                      {activity.teacher && (
                        <div className="flex items-center gap-2.5">
                          <UserIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">
                              {activity.type === 'orchestra' ? 'מנצח' : activity.type === 'theory' ? 'מורה תאוריה' : 'מורה'}
                            </p>
                            <p className="text-xs font-medium text-foreground">{activity.teacher}</p>
                          </div>
                        </div>
                      )}
                      {activity.instrument && (
                        <div className="flex items-center gap-2.5">
                          <MusicNotesIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">כלי</p>
                            <p className="text-xs font-medium text-foreground">{activity.instrument}</p>
                          </div>
                        </div>
                      )}
                      {(activity.dayTime || activity.time) && (
                        <div className="flex items-center gap-2.5">
                          <ClockIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">יום ושעה</p>
                            <p className="text-xs font-medium text-foreground">
                              {activity.dayTime}{activity.time && activity.dayTime ? ` • ${activity.time}` : activity.time}
                            </p>
                          </div>
                        </div>
                      )}
                      {(activity.room || activity.location) && (
                        <div className="flex items-center gap-2.5">
                          <MapPinIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">מיקום</p>
                            <p className="text-xs font-medium text-foreground">
                              {activity.room && activity.location
                                ? `${activity.room} • ${activity.location}`
                                : activity.room || activity.location}
                            </p>
                          </div>
                        </div>
                      )}
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
