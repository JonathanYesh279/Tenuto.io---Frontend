import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import AdditionalRehearsalsModal from './AdditionalRehearsalsModal'
import { CaretLeftIcon, CaretRightIcon, ClockIcon, MapPinIcon } from '@phosphor-icons/react'
import {
  formatRehearsalDateTime,
  getRehearsalColor,
  getDayName,
  VALID_DAYS_OF_WEEK,
  type Rehearsal
} from '../utils/rehearsalUtils'

// --- Glass style constants (matching GlassStatCard / GlassSelect) ---
const glassContainer: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(167,230,210,0.18) 35%, rgba(186,230,253,0.18) 65%, rgba(255,255,255,0.45) 100%)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.8)',
  boxShadow: '0 8px 32px rgba(0,170,160,0.10), 0 2px 8px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
}

const glassReflection: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)',
  height: '45%',
  pointerEvents: 'none',
}

// Event color palette — softer, design-system-aligned
const EVENT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  'תזמורת': { bg: 'bg-indigo-50', border: 'border-r-indigo-500', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  'הרכב':   { bg: 'bg-pink-50',   border: 'border-r-pink-500',   text: 'text-pink-700',   dot: 'bg-pink-500'   },
  default:   { bg: 'bg-slate-50',  border: 'border-r-slate-400',  text: 'text-slate-600',  dot: 'bg-slate-400'  },
}

function getEventStyle(rehearsal: Rehearsal) {
  const type = rehearsal.orchestra?.type || rehearsal.type
  return EVENT_COLORS[type as string] || EVENT_COLORS.default
}

// ─── Main Component ───────────────────────────────────────────────────

interface RehearsalCalendarProps {
  rehearsals: Rehearsal[]
  viewMode: 'week' | 'month'
  selectedDate?: Date
  onSelectDate?: (date: Date) => void
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
  onNavigateToRehearsal?: (rehearsalId: string) => void
  className?: string
}

export default function RehearsalCalendar({
  rehearsals,
  viewMode,
  selectedDate = new Date(),
  onSelectDate,
  onRehearsalClick,
  onEditRehearsal,
  onDeleteRehearsal,
  onViewDetails,
  onNavigateToRehearsal,
  className = ''
}: RehearsalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [showAdditionalModal, setShowAdditionalModal] = useState(false)
  const [additionalRehearsals, setAdditionalRehearsals] = useState<Rehearsal[]>([])
  const [modalDate, setModalDate] = useState<Date>(new Date())

  useEffect(() => {
    if (selectedDate.getTime() !== currentDate.getTime()) {
      setCurrentDate(selectedDate)
    }
  }, [selectedDate])

  const navigatePrevious = useCallback(() => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
    onSelectDate?.(newDate)
  }, [currentDate, viewMode, onSelectDate])

  const navigateNext = useCallback(() => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    onSelectDate?.(newDate)
  }, [currentDate, viewMode, onSelectDate])

  const goToToday = useCallback(() => {
    const today = new Date()
    setCurrentDate(today)
    onSelectDate?.(today)
  }, [onSelectDate])

  const handleShowAdditional = (date: Date, r: Rehearsal[]) => {
    setModalDate(date)
    setAdditionalRehearsals(r)
    setShowAdditionalModal(true)
  }

  const handleModalRehearsalClick = (rehearsal: Rehearsal) => {
    setShowAdditionalModal(false)
    onNavigateToRehearsal?.(rehearsal._id)
  }

  const calendarData = useMemo(() => {
    return viewMode === 'week'
      ? getWeekData(currentDate, rehearsals)
      : getMonthData(currentDate, rehearsals)
  }, [currentDate, rehearsals, viewMode])

  const headerText = useMemo(() => {
    if (viewMode === 'week') {
      const startOfWeek = getStartOfWeek(currentDate)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}`
      } else {
        return `${startOfWeek.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}`
      }
    }
    return currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
  }, [currentDate, viewMode])

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={glassContainer}>
      {/* Glass reflection overlay */}
      <div className="absolute inset-x-0 top-0 rounded-t-2xl z-[1]" style={glassReflection} />
      {/* Corner bloom */}
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full z-[1] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,230,210,0.25) 0%, transparent 70%)' }}
      />

      {/* ── Header ── */}
      <div className="relative z-[2] flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={navigatePrevious}
            className="p-2.5 rounded-xl hover:bg-white/40 transition-colors"
          >
            <CaretRightIcon weight="bold" className="w-5 h-5 text-foreground/70" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={navigateNext}
            className="p-2.5 rounded-xl hover:bg-white/40 transition-colors"
          >
            <CaretLeftIcon weight="bold" className="w-5 h-5 text-foreground/70" />
          </motion.button>
        </div>

        <motion.h3
          key={headerText}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="text-xl font-bold text-foreground tracking-tight"
        >
          {headerText}
        </motion.h3>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToToday}
          className="px-4 py-1.5 text-sm font-semibold rounded-xl border-2 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all"
        >
          היום
        </motion.button>
      </div>

      {/* ── Grid ── */}
      <div className="relative z-[2] px-4 pb-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${viewMode}-${headerText}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {viewMode === 'week' ? (
              <WeekView
                weekData={calendarData as WeekData}
                onRehearsalClick={onRehearsalClick}
                onEditRehearsal={onEditRehearsal}
                onDeleteRehearsal={onDeleteRehearsal}
                onViewDetails={onViewDetails}
              />
            ) : (
              <MonthView
                monthData={calendarData as MonthData}
                currentDate={currentDate}
                onRehearsalClick={onRehearsalClick}
                onEditRehearsal={onEditRehearsal}
                onDeleteRehearsal={onDeleteRehearsal}
                onViewDetails={onViewDetails}
                onNavigateToRehearsal={onNavigateToRehearsal}
                onShowAdditional={handleShowAdditional}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {showAdditionalModal && (
        <AdditionalRehearsalsModal
          rehearsals={additionalRehearsals}
          date={modalDate}
          onClose={() => setShowAdditionalModal(false)}
          onRehearsalClick={handleModalRehearsalClick}
        />
      )}
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────

interface WeekViewProps {
  weekData: WeekData
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
}

function WeekView({ weekData, onRehearsalClick }: WeekViewProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekData.days.map((day, index) => (
        <div key={index} className="flex flex-col">
          {/* Day header */}
          <div className="text-center mb-2 pb-2 border-b border-white/40">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
              {getDayName(day.dayOfWeek)}
            </div>
            <div className={`mt-1 text-lg font-bold leading-none ${
              day.isToday ? 'text-primary' : 'text-foreground'
            }`}>
              {day.isToday ? (
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white shadow-md shadow-primary/25">
                  {day.date.getDate()}
                </span>
              ) : (
                day.date.getDate()
              )}
            </div>
          </div>

          {/* Day content */}
          <div className="min-h-[220px] rounded-xl bg-white/30 p-2.5 space-y-2 border border-white/40">
            {day.rehearsals.map((rehearsal, rIdx) => (
              <EventPill
                key={rehearsal._id}
                rehearsal={rehearsal}
                index={rIdx}
                onClick={() => onRehearsalClick?.(rehearsal)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────

interface MonthViewProps {
  monthData: MonthData
  currentDate: Date
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
  onNavigateToRehearsal?: (rehearsalId: string) => void
  onShowAdditional?: (date: Date, rehearsals: Rehearsal[]) => void
}

function MonthView({ monthData, onRehearsalClick, onShowAdditional }: MonthViewProps) {
  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {Object.entries(VALID_DAYS_OF_WEEK).map(([dayNum, dayName]) => (
          <div key={dayNum} className="py-2 text-center text-[11px] font-bold uppercase tracking-widest text-foreground/40">
            {dayName}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden bg-white/20 border border-white/30">
        {monthData.weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const hasRehearsals = day.rehearsals.length > 0
            return (
              <motion.div
                key={`${weekIndex}-${dayIndex}`}
                whileHover={hasRehearsals ? { scale: 1.02, zIndex: 10 } : {}}
                className={`
                  relative min-h-[110px] p-2 transition-colors
                  ${!day.isCurrentMonth
                    ? 'bg-white/10'
                    : day.isToday
                      ? 'bg-primary/[0.06]'
                      : 'bg-white/35 hover:bg-white/50'
                  }
                `}
              >
                {/* Day number */}
                <div className={`text-sm font-bold mb-1.5 ${
                  !day.isCurrentMonth
                    ? 'text-foreground/20'
                    : day.isToday
                      ? 'text-primary'
                      : 'text-foreground/70'
                }`}>
                  {day.isToday ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-xs font-bold shadow-sm shadow-primary/20">
                      {day.date.getDate()}
                    </span>
                  ) : (
                    day.date.getDate()
                  )}
                </div>

                {/* Today accent line */}
                {day.isToday && (
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-l from-primary/60 via-primary to-primary/60" />
                )}

                {/* Events */}
                <div className="space-y-1">
                  {day.rehearsals.slice(0, 2).map((rehearsal, rIdx) => (
                    <EventPillMinimal
                      key={rehearsal._id}
                      rehearsal={rehearsal}
                      index={rIdx}
                      onClick={() => onRehearsalClick?.(rehearsal)}
                    />
                  ))}
                  {day.rehearsals.length > 2 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full text-[10px] font-semibold text-primary/70 text-center py-0.5 rounded-md bg-primary/[0.06] hover:bg-primary/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        onShowAdditional?.(day.date, day.rehearsals)
                      }}
                    >
                      +{day.rehearsals.length - 2} נוספות
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Event Pill (Week view — full detail) ─────────────────────────────

function EventPill({
  rehearsal,
  index,
  onClick,
}: {
  rehearsal: Rehearsal
  index: number
  onClick: () => void
}) {
  const style = getEventStyle(rehearsal)
  const dateTime = formatRehearsalDateTime(rehearsal)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 400, damping: 25 }}
      whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
      onClick={onClick}
      className={`
        ${style.bg} border-r-[3px] ${style.border}
        rounded-lg p-2.5 cursor-pointer transition-colors
        border border-transparent hover:border-white/60
        shadow-sm
      `}
    >
      <div className={`font-semibold text-sm truncate ${style.text}`}>
        {rehearsal.orchestra?.name || 'ללא שם'}
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className={`flex items-center gap-1 text-xs ${style.text} opacity-70`}>
          <ClockIcon className="w-3 h-3" />
          {dateTime.time}
        </span>
        {rehearsal.location && (
          <span className={`flex items-center gap-1 text-xs ${style.text} opacity-70 truncate`}>
            <MapPinIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{rehearsal.location}</span>
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Event Pill Minimal (Month view — compact) ────────────────────────

function EventPillMinimal({
  rehearsal,
  index,
  onClick,
}: {
  rehearsal: Rehearsal
  index: number
  onClick: () => void
}) {
  const style = getEventStyle(rehearsal)
  const dateTime = formatRehearsalDateTime(rehearsal)

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
      whileHover={{ x: -2 }}
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer
        ${style.bg} border-r-2 ${style.border}
        hover:shadow-sm transition-all
      `}
      title={`${rehearsal.orchestra?.name || 'ללא שם'} • ${dateTime.time} • ${rehearsal.location}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />
      <span className={`text-[11px] font-semibold truncate ${style.text}`}>
        {rehearsal.orchestra?.name || 'ללא שם'}
      </span>
      <span className={`text-[10px] ${style.text} opacity-60 flex-shrink-0 mr-auto`}>
        {dateTime.time}
      </span>
    </motion.div>
  )
}

// ─── Types & Helpers ──────────────────────────────────────────────────

interface DayData {
  date: Date
  dayOfWeek: number
  isToday: boolean
  isCurrentMonth: boolean
  rehearsals: Rehearsal[]
}

interface WeekData {
  days: DayData[]
}

interface MonthData {
  weeks: DayData[][]
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  start.setDate(start.getDate() - day)
  start.setHours(0, 0, 0, 0)
  return start
}

function getWeekData(currentDate: Date, rehearsals: Rehearsal[]): WeekData {
  const startOfWeek = getStartOfWeek(currentDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: DayData[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)

    const dayRehearsals = rehearsals
      .filter(r => {
        const rd = new Date(r.date)
        rd.setHours(0, 0, 0, 0)
        return rd.getTime() === date.getTime()
      })
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'))

    days.push({
      date,
      dayOfWeek: date.getDay(),
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth: true,
      rehearsals: dayRehearsals,
    })
  }
  return { days }
}

function getMonthData(currentDate: Date, rehearsals: Rehearsal[]): MonthData {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())

  const endDate = new Date(lastDay)
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))

  const weeks: DayData[][] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const week: DayData[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(current)
      const dayRehearsals = rehearsals
        .filter(r => {
          const rd = new Date(r.date)
          rd.setHours(0, 0, 0, 0)
          return rd.getTime() === date.getTime()
        })
        .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'))

      week.push({
        date,
        dayOfWeek: date.getDay(),
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: date.getMonth() === month,
        rehearsals: dayRehearsals,
      })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }
  return { weeks }
}
