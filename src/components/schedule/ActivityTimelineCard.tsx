/**
 * ActivityTimelineCard — Compact activity card matching the Rehearsal timeline pattern.
 * Reusable across schedule grids, orchestra tabs, and any activity display.
 */

import { Chip } from '@heroui/react'
import { motion } from 'framer-motion'
import { Clock as ClockIcon, MapPin as MapPinIcon, User as UserIcon } from '@phosphor-icons/react'
import { snappy } from '../../lib/motionTokens'

interface ActivityTimelineCardProps {
  title: string           // instrument name or orchestra name
  subtitle?: string       // teacher name or conductor
  type: 'individual' | 'group' | 'orchestra' | 'theory'
  startTime: string
  endTime: string
  location?: string
  room?: string
  onClick?: () => void
  className?: string
}

// Type-based accent colors using CSS custom properties from index.css
const TYPE_STYLES: Record<string, { accent: string; chipColor: 'primary' | 'success' | 'warning' | 'secondary'; label: string }> = {
  individual: { accent: 'hsl(var(--primary))',               chipColor: 'primary',   label: 'שיעור אישי' },
  group:      { accent: 'hsl(var(--color-rehearsals-fg))',   chipColor: 'success',   label: 'קבוצתי'     },
  orchestra:  { accent: 'hsl(var(--color-orchestras-fg))',   chipColor: 'warning',   label: 'תזמורת'     },
  theory:     { accent: 'hsl(var(--color-theory-fg))',       chipColor: 'secondary', label: 'תאוריה'     },
}

export function ActivityTimelineCard({
  title,
  subtitle,
  type,
  startTime,
  endTime,
  location,
  room,
  onClick,
  className = '',
}: ActivityTimelineCardProps) {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.individual

  return (
    <motion.div
      className={`group relative bg-card border border-border rounded-card shadow-1 flex overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-2 border-r-[3px] ${className}`}
      style={{ borderRightColor: style.accent }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
      transition={snappy}
      onClick={onClick}
    >
      {/* Card body */}
      <div className="flex-1 p-2.5 flex flex-col gap-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-1">
          <span className="text-xs font-bold text-foreground leading-snug truncate">
            {title}
          </span>
          <Chip
            size="sm"
            variant="flat"
            color={style.chipColor}
            classNames={{ base: 'h-[18px] min-w-0 flex-shrink-0', content: 'text-[10px] font-bold px-1' }}
          >
            {style.label}
          </Chip>
        </div>

        {/* Details row */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
          {subtitle && (
            <span className="inline-flex items-center gap-0.5">
              <UserIcon size={11} className="opacity-70 flex-shrink-0" />
              <span className="truncate max-w-[80px]">{subtitle}</span>
            </span>
          )}
          {(room || location) && (
            <>
              {subtitle && (
                <span className="w-[2px] h-[2px] rounded-full bg-border flex-shrink-0" />
              )}
              <span className="inline-flex items-center gap-0.5">
                <MapPinIcon size={11} className="opacity-70 flex-shrink-0" />
                <span className="truncate max-w-[60px]">
                  {room ? `חדר ${room}` : location}
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Time column — compact, RTL: renders on the left visually, right in DOM */}
      <div className="min-w-[52px] p-2 flex flex-col items-center justify-center border-r border-border bg-muted flex-shrink-0">
        <span className="text-xs font-extrabold text-foreground leading-none tabular-nums">
          {startTime}
        </span>
        <ClockIcon size={9} className="opacity-40 mt-0.5" />
        <span className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
          {endTime}
        </span>
      </div>
    </motion.div>
  )
}

export default ActivityTimelineCard
