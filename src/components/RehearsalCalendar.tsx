import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensors,
  useSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import toast from 'react-hot-toast'

import AdditionalRehearsalsModal from './AdditionalRehearsalsModal'
import {
  CaretLeftIcon,
  CaretRightIcon,
  ClockIcon,
  MapPinIcon,
  PencilSimpleIcon,
  TrashIcon,
  EyeIcon,
  MusicNotesIcon,
} from '@phosphor-icons/react'
import {
  formatRehearsalDateTime,
  getDayName,
  VALID_DAYS_OF_WEEK,
  type Rehearsal,
} from '../utils/rehearsalUtils'
import { rehearsalService } from '../services/apiService'

// ─── Activity-style colors (matching Room Schedule ActivityCell) ──────

const REHEARSAL_COLORS: Record<string, {
  bg: string; border: string; text: string; accent: string; iconBg: string
}> = {
  'תזמורת': {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    accent: 'border-r-rose-500',
    iconBg: 'bg-rose-100',
  },
  'הרכב': {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-800',
    accent: 'border-r-violet-500',
    iconBg: 'bg-violet-100',
  },
  default: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-800',
    accent: 'border-r-sky-500',
    iconBg: 'bg-sky-100',
  },
}

function getColors(rehearsal: Rehearsal) {
  const type = rehearsal.orchestra?.type || rehearsal.type
  return REHEARSAL_COLORS[type as string] || REHEARSAL_COLORS.default
}

// ─── Glass style (matching GlassStatCard) ─────────────────────────────

const glassContainer: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(167,230,210,0.18) 35%, rgba(186,230,253,0.18) 65%, rgba(255,255,255,0.45) 100%)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.8)',
  boxShadow: '0 8px 32px rgba(0,170,160,0.10), 0 2px 8px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
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
  onRehearsalMoved?: (rehearsalId: string, newDate: string, newDayOfWeek: number) => void
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
  onRehearsalMoved,
  className = '',
}: RehearsalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [showAdditionalModal, setShowAdditionalModal] = useState(false)
  const [additionalRehearsals, setAdditionalRehearsals] = useState<Rehearsal[]>([])
  const [modalDate, setModalDate] = useState<Date>(new Date())
  const [activeRehearsal, setActiveRehearsal] = useState<Rehearsal | null>(null)

  useEffect(() => {
    if (selectedDate.getTime() !== currentDate.getTime()) {
      setCurrentDate(selectedDate)
    }
  }, [selectedDate])

  // DnD sensors — 8px threshold to prevent accidental drags (matching Room Schedule)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const navigatePrevious = useCallback(() => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7)
    else newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
    onSelectDate?.(newDate)
  }, [currentDate, viewMode, onSelectDate])

  const navigateNext = useCallback(() => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7)
    else newDate.setMonth(newDate.getMonth() + 1)
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

  // ── DnD handlers ──

  const handleDragStart = (event: DragStartEvent) => {
    const rehearsal = event.active.data.current as Rehearsal
    setActiveRehearsal(rehearsal)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveRehearsal(null)
    const { active, over } = event
    if (!over) return

    const rehearsal = active.data.current as Rehearsal
    const targetDateStr = over.id as string

    const targetDate = new Date(targetDateStr)
    const sourceDate = new Date(rehearsal.date)
    sourceDate.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)

    if (sourceDate.getTime() === targetDate.getTime()) return

    const dayOfWeek = targetDate.getDay()
    const formattedDate = targetDate.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

    // Optimistic update — move rehearsal in parent state immediately
    onRehearsalMoved?.(rehearsal._id, targetDate.toISOString(), dayOfWeek)

    try {
      await rehearsalService.updateRehearsal(rehearsal._id, {
        date: targetDate.toISOString(),
        dayOfWeek,
      })
      toast.success(`החזרה הועברה ל${formattedDate}`)
    } catch (error: any) {
      // Revert optimistic update
      onRehearsalMoved?.(rehearsal._id, rehearsal.date as string, sourceDate.getDay())

      const message = error?.message || ''
      if (message.includes('conflict') || message.includes('Conflict')) {
        toast.error('התנגשות בלוח — השתמש בלוח חדרים לתזמון מדויק', { duration: 4000 })
      } else {
        toast.error('שגיאה בהעברת החזרה')
      }
      console.error('Failed to move rehearsal:', error)
    }
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
      }
      return `${startOfWeek.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
  }, [currentDate, viewMode])

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={`relative overflow-hidden rounded-2xl ${className}`} style={glassContainer}>
        {/* Glass reflection */}
        <div
          className="absolute inset-x-0 top-0 rounded-t-2xl z-[1] pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)',
            height: '45%',
          }}
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
                  onRehearsalClick={onRehearsalClick}
                  onEditRehearsal={onEditRehearsal}
                  onDeleteRehearsal={onDeleteRehearsal}
                  onViewDetails={onViewDetails}
                  onShowAdditional={handleShowAdditional}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Drag overlay — ghost preview while dragging */}
        <DragOverlay>
          {activeRehearsal ? (
            <div className="w-48 opacity-90 pointer-events-none">
              <ActivityCard rehearsal={activeRehearsal} isDragOverlay />
            </div>
          ) : null}
        </DragOverlay>

        {showAdditionalModal && (
          <AdditionalRehearsalsModal
            rehearsals={additionalRehearsals}
            date={modalDate}
            onClose={() => setShowAdditionalModal(false)}
            onRehearsalClick={handleModalRehearsalClick}
          />
        )}
      </div>
    </DndContext>
  )
}

// ─── Droppable Day Cell ───────────────────────────────────────────────

function DroppableDayCell({
  dateISO,
  children,
  className,
}: {
  dateISO: string
  children: React.ReactNode
  className?: string
}) {
  const { isOver, setNodeRef } = useDroppable({ id: dateISO })

  return (
    <div
      ref={setNodeRef}
      className={`
        ${className}
        transition-all duration-150
        ${isOver ? 'ring-2 ring-inset ring-emerald-400 bg-emerald-50/50' : ''}
      `}
    >
      {children}
    </div>
  )
}

// ─── Activity Card (matching Room Schedule ActivityCell pattern) ──────

function ActivityCard({
  rehearsal,
  isDragOverlay = false,
  onRehearsalClick,
  onEditRehearsal,
  onDeleteRehearsal,
  onViewDetails,
}: {
  rehearsal: Rehearsal
  isDragOverlay?: boolean
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: rehearsal._id,
    data: rehearsal,
  })
  const colors = getColors(rehearsal)
  const dateTime = formatRehearsalDateTime(rehearsal)

  const handleClick = () => {
    if (!isDragging) onRehearsalClick?.(rehearsal)
  }

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
      onClick={handleClick}
      className={`
        group relative rounded-lg border border-r-[3px]
        ${colors.bg} ${colors.border} ${colors.accent}
        cursor-pointer select-none
        transition-all duration-200
        ${isDragging ? 'opacity-30 shadow-none' : 'shadow-sm hover:shadow-md'}
        ${isDragOverlay ? 'shadow-lg ring-2 ring-primary/20' : ''}
      `}
    >
      {/* Card content */}
      <div className="p-2.5 space-y-1.5">
        {/* Orchestra name */}
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-md ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
            <MusicNotesIcon weight="fill" className={`w-3 h-3 ${colors.text}`} />
          </div>
          <span className={`text-[12px] font-bold truncate ${colors.text}`}>
            {rehearsal.orchestra?.name || 'ללא שם'}
          </span>
        </div>

        {/* Time + Location */}
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1 text-[11px] ${colors.text} opacity-70`}>
            <ClockIcon weight="bold" className="w-3 h-3" />
            {dateTime.time}
          </span>
          {rehearsal.location && (
            <span className={`flex items-center gap-1 text-[11px] ${colors.text} opacity-70 truncate`}>
              <MapPinIcon weight="bold" className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{rehearsal.location}</span>
            </span>
          )}
        </div>
      </div>

      {/* Hover action buttons — matching Room Schedule pattern */}
      {!isDragOverlay && (
        <div className="absolute top-1 left-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onViewDetails && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(rehearsal) }}
              className={`p-1 rounded-md ${colors.iconBg} hover:shadow-sm transition-all`}
              title="צפה בפרטים"
            >
              <EyeIcon weight="bold" className={`w-3 h-3 ${colors.text}`} />
            </button>
          )}
          {onEditRehearsal && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditRehearsal(rehearsal) }}
              className={`p-1 rounded-md ${colors.iconBg} hover:shadow-sm transition-all`}
              title="ערוך חזרה"
            >
              <PencilSimpleIcon weight="bold" className={`w-3 h-3 ${colors.text}`} />
            </button>
          )}
          {onDeleteRehearsal && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteRehearsal(rehearsal._id) }}
              className="p-1 rounded-md bg-red-50 hover:bg-red-100 hover:shadow-sm transition-all"
              title="מחק חזרה"
            >
              <TrashIcon weight="bold" className="w-3 h-3 text-red-600" />
            </button>
          )}
        </div>
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

function WeekView({ weekData, onRehearsalClick, onEditRehearsal, onDeleteRehearsal, onViewDetails }: WeekViewProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekData.days.map((day, index) => (
        <div key={index} className="flex flex-col">
          {/* Day header */}
          <div className="text-center mb-2 pb-2 border-b border-white/40">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
              {getDayName(day.dayOfWeek)}
            </div>
            <div className="mt-1">
              {day.isToday ? (
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white text-lg font-bold shadow-md shadow-primary/25">
                  {day.date.getDate()}
                </span>
              ) : (
                <span className="text-lg font-bold text-foreground">
                  {day.date.getDate()}
                </span>
              )}
            </div>
          </div>

          {/* Droppable day cell */}
          <DroppableDayCell
            dateISO={day.date.toISOString()}
            className="min-h-[220px] rounded-xl bg-white/30 p-2 space-y-2 border border-white/40 flex-1"
          >
            {day.rehearsals.map((rehearsal, rIdx) => (
              <motion.div
                key={rehearsal._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rIdx * 0.04, type: 'spring', stiffness: 400, damping: 25 }}
              >
                <ActivityCard
                  rehearsal={rehearsal}
                  onRehearsalClick={onRehearsalClick}
                  onEditRehearsal={onEditRehearsal}
                  onDeleteRehearsal={onDeleteRehearsal}
                  onViewDetails={onViewDetails}
                />
              </motion.div>
            ))}
          </DroppableDayCell>
        </div>
      ))}
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────

interface MonthViewProps {
  monthData: MonthData
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
  onShowAdditional?: (date: Date, rehearsals: Rehearsal[]) => void
}

function MonthView({ monthData, onRehearsalClick, onEditRehearsal, onDeleteRehearsal, onShowAdditional }: MonthViewProps) {
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

      {/* Weeks grid */}
      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden bg-white/20 border border-white/30">
        {monthData.weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <DroppableDayCell
              key={`${weekIndex}-${dayIndex}`}
              dateISO={day.date.toISOString()}
              className={`
                relative min-h-[120px] p-1.5 transition-colors
                ${!day.isCurrentMonth
                  ? 'bg-white/10'
                  : day.isToday
                    ? 'bg-primary/[0.06]'
                    : 'bg-white/35 hover:bg-white/50'
                }
              `}
            >
              {/* Day number */}
              <div className={`text-[12px] font-bold mb-1 px-0.5 ${
                !day.isCurrentMonth ? 'text-foreground/20'
                  : day.isToday ? 'text-primary'
                    : 'text-foreground/60'
              }`}>
                {day.isToday ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold shadow-sm shadow-primary/20">
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

              {/* Event cards */}
              <div className="space-y-1 flex flex-col">
                {day.rehearsals.slice(0, 2).map((rehearsal) => (
                  <MonthEventCard
                    key={rehearsal._id}
                    rehearsal={rehearsal}
                    onRehearsalClick={onRehearsalClick}
                    onEditRehearsal={onEditRehearsal}
                    onDeleteRehearsal={onDeleteRehearsal}
                  />
                ))}
                {day.rehearsals.length > 2 && (
                  <button
                    className="text-[10px] font-semibold text-primary/70 text-center py-0.5 rounded bg-primary/[0.06] hover:bg-primary/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      onShowAdditional?.(day.date, day.rehearsals)
                    }}
                  >
                    +{day.rehearsals.length - 2} נוספות
                  </button>
                )}
              </div>
            </DroppableDayCell>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Month Event Card (properly sized card inside cell) ───────────────

function MonthEventCard({
  rehearsal,
  onRehearsalClick,
  onEditRehearsal,
  onDeleteRehearsal,
}: {
  rehearsal: Rehearsal
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: rehearsal._id,
    data: rehearsal,
  })
  const colors = getColors(rehearsal)
  const dateTime = formatRehearsalDateTime(rehearsal)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => { if (!isDragging) onRehearsalClick?.(rehearsal) }}
      title={`${rehearsal.orchestra?.name || 'ללא שם'} • ${dateTime.time} • ${rehearsal.location}`}
      className={`
        group/card relative rounded-lg border border-r-[3px]
        ${colors.bg} ${colors.border} ${colors.accent}
        p-2 cursor-pointer select-none
        transition-all duration-200
        ${isDragging ? 'opacity-30 shadow-none' : 'shadow-sm hover:shadow-md'}
      `}
    >
      {/* Orchestra name */}
      <div className="flex items-center gap-1.5">
        <div className={`w-4.5 h-4.5 rounded-md ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
          <MusicNotesIcon weight="fill" className={`w-2.5 h-2.5 ${colors.text}`} />
        </div>
        <span className={`text-[12px] font-bold truncate ${colors.text}`}>
          {rehearsal.orchestra?.name || 'ללא שם'}
        </span>
      </div>

      {/* Time + Location */}
      <div className="flex items-center gap-2.5 mt-1">
        <span className={`flex items-center gap-1 text-[11px] ${colors.text} opacity-65`}>
          <ClockIcon weight="bold" className="w-3 h-3" />
          {dateTime.time}
        </span>
        {rehearsal.location && (
          <span className={`flex items-center gap-1 text-[10px] ${colors.text} opacity-55 truncate`}>
            <MapPinIcon weight="bold" className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{rehearsal.location}</span>
          </span>
        )}
      </div>

      {/* Hover action buttons */}
      <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
        {onEditRehearsal && (
          <button
            onClick={(e) => { e.stopPropagation(); onEditRehearsal(rehearsal) }}
            className={`p-1 rounded-md ${colors.iconBg} hover:shadow-sm transition-all`}
            title="ערוך"
          >
            <PencilSimpleIcon weight="bold" className={`w-3 h-3 ${colors.text}`} />
          </button>
        )}
        {onDeleteRehearsal && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteRehearsal(rehearsal._id) }}
            className="p-1 rounded-md bg-red-50 hover:bg-red-100 hover:shadow-sm transition-all"
            title="מחק"
          >
            <TrashIcon weight="bold" className="w-3 h-3 text-red-600" />
          </button>
        )}
      </div>
    </div>
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
interface WeekData { days: DayData[] }
interface MonthData { weeks: DayData[][] }

function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
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
        const rd = new Date(r.date); rd.setHours(0, 0, 0, 0)
        return rd.getTime() === date.getTime()
      })
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'))
    days.push({ date, dayOfWeek: date.getDay(), isToday: date.getTime() === today.getTime(), isCurrentMonth: true, rehearsals: dayRehearsals })
  }
  return { days }
}

function getMonthData(currentDate: Date, rehearsals: Rehearsal[]): MonthData {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay); startDate.setDate(firstDay.getDate() - firstDay.getDay())
  const endDate = new Date(lastDay); endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))

  const weeks: DayData[][] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    const week: DayData[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(current)
      const dayRehearsals = rehearsals
        .filter(r => {
          const rd = new Date(r.date); rd.setHours(0, 0, 0, 0)
          return rd.getTime() === date.getTime()
        })
        .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'))
      week.push({ date, dayOfWeek: date.getDay(), isToday: date.getTime() === today.getTime(), isCurrentMonth: date.getMonth() === month, rehearsals: dayRehearsals })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }
  return { weeks }
}
