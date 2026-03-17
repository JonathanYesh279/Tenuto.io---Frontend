import React, { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Chip } from '@heroui/react'
import { ScrollReveal } from '../ui/ScrollReveal'
import { RehearsalTimelineCard } from './RehearsalTimelineCard'
import { EmptyState } from '../feedback/EmptyState'
import { CalendarBlankIcon } from '@phosphor-icons/react'

interface RehearsalTimelineProps {
  rehearsals: any[]
  onView: (id: string) => void
  onEdit: (rehearsal: any) => void
  onAttendance: (id: string) => void
}

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr)
  const dayName = HEBREW_DAYS[d.getDay()]
  const day = d.getDate()
  const month = HEBREW_MONTHS[d.getMonth()]
  const year = d.getFullYear()
  return `${dayName}, ${day} ב${month} ${year}`
}

function isToday(dateStr: string): boolean {
  const today = new Date()
  const d = new Date(dateStr)
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

interface DayGroup {
  dateKey: string
  label: string
  isToday: boolean
  rehearsals: any[]
}

export const RehearsalTimeline: React.FC<RehearsalTimelineProps> = ({
  rehearsals,
  onView,
  onEdit,
  onAttendance,
}) => {
  const dayGroups: DayGroup[] = useMemo(() => {
    const sorted = [...rehearsals].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date)
      if (dateCmp !== 0) return dateCmp
      return (a.startTime || '').localeCompare(b.startTime || '')
    })

    const groups: Map<string, DayGroup> = new Map()

    sorted.forEach((r) => {
      const dateKey = r.date.split('T')[0]
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          dateKey,
          label: formatDayHeader(dateKey),
          isToday: isToday(dateKey),
          rehearsals: [],
        })
      }
      groups.get(dateKey)!.rehearsals.push(r)
    })

    return Array.from(groups.values())
  }, [rehearsals])

  if (dayGroups.length === 0) {
    return (
      <EmptyState
        title="לא נמצאו חזרות"
        description="אין חזרות התואמות את הסינון הנוכחי"
        icon={<CalendarBlankIcon size={48} weight="duotone" />}
      />
    )
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {dayGroups.map((group, groupIdx) => (
          <motion.div
            key={group.dateKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: groupIdx * 0.05 }}
          >
            {/* Sticky day header */}
            <div className="flex items-center justify-between py-2 mb-3 border-b border-border sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2 text-body font-bold text-foreground">
                {group.label}
                {group.isToday && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="primary"
                    classNames={{ base: 'h-[22px]', content: 'text-[11px] font-bold px-1' }}
                  >
                    היום
                  </Chip>
                )}
              </div>
              <span className="text-small text-muted-foreground">
                {group.rehearsals.length} {group.rehearsals.length === 1 ? 'חזרה' : 'חזרות'}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {group.rehearsals.map((rehearsal, cardIdx) => (
                <ScrollReveal key={rehearsal._id} delay={cardIdx * 0.06}>
                  <RehearsalTimelineCard
                    rehearsal={rehearsal}
                    onView={onView}
                    onEdit={onEdit}
                    onAttendance={onAttendance}
                  />
                </ScrollReveal>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
