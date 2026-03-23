import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Chip } from '@heroui/react'
import { CaretDownIcon, CalendarBlankIcon } from '@phosphor-icons/react'
import { ScrollReveal } from '../ui/ScrollReveal'
import { RehearsalTimelineCard } from './RehearsalTimelineCard'
import { EmptyState } from '../feedback/EmptyState'
import { getRehearsalStatus } from '../../utils/rehearsalUtils'
import { snappy } from '../../lib/motionTokens'

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

type StatusCategory = 'completed' | 'in_progress' | 'upcoming'

interface CategoryConfig {
  key: StatusCategory
  label: string
  chipColor: 'default' | 'success' | 'primary'
  emptyText: string
  sortOrder: 'desc' | 'asc'
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'in_progress',
    label: 'מתקיימת',
    chipColor: 'success',
    emptyText: 'אין חזרות כרגע',
    sortOrder: 'asc',
  },
  {
    key: 'upcoming',
    label: 'עתידית',
    chipColor: 'primary',
    emptyText: 'אין חזרות עתידיות',
    sortOrder: 'asc',
  },
  {
    key: 'completed',
    label: 'התקיימה',
    chipColor: 'default',
    emptyText: 'אין חזרות שהתקיימו',
    sortOrder: 'desc',
  },
]

function groupByDay(rehearsals: any[], sortOrder: 'asc' | 'desc'): DayGroup[] {
  const sorted = [...rehearsals].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date)
    if (dateCmp !== 0) return sortOrder === 'asc' ? dateCmp : -dateCmp
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
}

interface CategoryColumnProps {
  config: CategoryConfig
  rehearsals: any[]
  onView: (id: string) => void
  onEdit: (rehearsal: any) => void
  onAttendance: (id: string) => void
}

const CategoryColumn: React.FC<CategoryColumnProps> = ({
  config,
  rehearsals,
  onView,
  onEdit,
  onAttendance,
}) => {
  const [isOpen, setIsOpen] = useState(config.key !== 'completed')
  const dayGroups = useMemo(
    () => groupByDay(rehearsals, config.sortOrder),
    [rehearsals, config.sortOrder],
  )

  return (
    <div className="flex flex-col">
      {/* Accordion header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-between w-full py-2.5 px-3 rounded-card bg-card border border-border hover:bg-muted transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Chip
            size="sm"
            variant="flat"
            color={config.chipColor}
            classNames={{ base: 'h-[24px]', content: 'text-[12px] font-bold px-1.5' }}
          >
            {config.label}
          </Chip>
          <span className="text-small text-muted-foreground">
            {rehearsals.length} {rehearsals.length === 1 ? 'חזרה' : 'חזרות'}
          </span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={snappy}
          className="text-muted-foreground"
        >
          <CaretDownIcon size={16} weight="bold" />
        </motion.span>
      </button>

      {/* Accordion body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-5">
              {dayGroups.length === 0 ? (
                <p className="text-small text-muted-foreground text-center py-6 italic">
                  {config.emptyText}
                </p>
              ) : (
                dayGroups.map((group, groupIdx) => (
                  <motion.div
                    key={group.dateKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: groupIdx * 0.03 }}
                  >
                    {/* Day header */}
                    <div className="flex items-center justify-between py-1.5 mb-2 border-b border-border">
                      <div className="flex items-center gap-2 text-small font-bold text-foreground">
                        {group.label}
                        {group.isToday && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="primary"
                            classNames={{ base: 'h-[20px]', content: 'text-[10px] font-bold px-1' }}
                          >
                            היום
                          </Chip>
                        )}
                      </div>
                      <span className="text-caption text-muted-foreground">
                        {group.rehearsals.length} {group.rehearsals.length === 1 ? 'חזרה' : 'חזרות'}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2.5">
                      {group.rehearsals.map((rehearsal, cardIdx) => (
                        <ScrollReveal key={rehearsal._id} delay={cardIdx * 0.04}>
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
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const RehearsalTimeline: React.FC<RehearsalTimelineProps> = ({
  rehearsals,
  onView,
  onEdit,
  onAttendance,
}) => {
  const categorized = useMemo(() => {
    const buckets: Record<StatusCategory, any[]> = {
      completed: [],
      in_progress: [],
      upcoming: [],
    }

    rehearsals.forEach((r) => {
      const { status } = getRehearsalStatus(r)
      if (status === 'cancelled') {
        // Place cancelled rehearsals in their date-appropriate bucket
        const now = new Date()
        const rDate = new Date(r.date)
        buckets[rDate < now ? 'completed' : 'upcoming'].push(r)
      } else {
        buckets[status].push(r)
      }
    })

    return buckets
  }, [rehearsals])

  if (rehearsals.length === 0) {
    return (
      <EmptyState
        title="לא נמצאו חזרות"
        description="אין חזרות התואמות את הסינון הנוכחי"
        icon={<CalendarBlankIcon size={48} weight="duotone" />}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {CATEGORIES.map((cat) => (
        <CategoryColumn
          key={cat.key}
          config={cat}
          rehearsals={categorized[cat.key]}
          onView={onView}
          onEdit={onEdit}
          onAttendance={onAttendance}
        />
      ))}
    </div>
  )
}
