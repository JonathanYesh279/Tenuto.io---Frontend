import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretDown, ChartBar } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { timeToMinutes, minutesToTime, GRID_START_HOUR, GRID_END_HOUR, SLOT_DURATION, TOTAL_SLOTS } from './utils'

// ==================== Types ====================

interface Activity {
  id: string
  source: 'timeBlock' | 'rehearsal' | 'theory'
  startTime: string
  endTime: string
  teacherName: string
  label: string
  activityType: string
  hasConflict: boolean
  conflictGroupId: string | null
  [key: string]: unknown
}

interface RoomData {
  room: string
  activities: Activity[]
  hasConflicts: boolean
}

interface RoomUtilization {
  room: string
  percentage: number
}

interface FreeWindow {
  start: string
  end: string
}

interface RoomAvailability {
  room: string
  freeWindows: FreeWindow[]
}

interface SummaryBarProps {
  rooms: RoomData[]
  loading?: boolean
}

// ==================== Helpers ====================

const TOP_BUSY = 3
const PREVIEW_AVAILABLE = 3

function computeFreeWindows(activities: Activity[]): FreeWindow[] {
  const gridStart = GRID_START_HOUR * 60
  const gridEnd = GRID_END_HOUR * 60

  const intervals: Array<{ start: number; end: number }> = []
  for (const a of activities) {
    const s = Math.max(timeToMinutes(a.startTime), gridStart)
    const e = Math.min(timeToMinutes(a.endTime), gridEnd)
    if (s < e) intervals.push({ start: s, end: e })
  }
  intervals.sort((a, b) => a.start - b.start)

  const merged: Array<{ start: number; end: number }> = []
  for (const iv of intervals) {
    const last = merged[merged.length - 1]
    if (last && iv.start <= last.end) {
      last.end = Math.max(last.end, iv.end)
    } else {
      merged.push({ ...iv })
    }
  }

  const windows: FreeWindow[] = []
  let cursor = gridStart
  for (const iv of merged) {
    if (cursor < iv.start) {
      windows.push({ start: minutesToTime(cursor), end: minutesToTime(iv.start) })
    }
    cursor = iv.end
  }
  if (cursor < gridEnd) {
    windows.push({ start: minutesToTime(cursor), end: minutesToTime(gridEnd) })
  }
  return windows
}

function computeInsights(rooms: RoomData[]) {
  const gridStartMinutes = GRID_START_HOUR * 60
  let totalOccupiedSlots = 0
  let conflictCount = 0
  const utilizations: RoomUtilization[] = []
  const allAvailable: RoomAvailability[] = []

  for (const room of rooms) {
    const occupied = new Set<number>()
    for (const activity of room.activities) {
      const startMin = timeToMinutes(activity.startTime)
      const endMin = timeToMinutes(activity.endTime)
      for (let t = startMin; t < endMin; t += SLOT_DURATION) {
        const slotIndex = Math.floor((t - gridStartMinutes) / SLOT_DURATION)
        if (slotIndex >= 0 && slotIndex < TOTAL_SLOTS) {
          occupied.add(slotIndex)
        }
      }
      if (activity.hasConflict) conflictCount++
    }
    totalOccupiedSlots += occupied.size

    const percentage = TOTAL_SLOTS > 0 ? Math.round((occupied.size / TOTAL_SLOTS) * 100) : 0
    utilizations.push({ room: room.room, percentage })

    const freeWindows = computeFreeWindows(room.activities)
    if (freeWindows.length > 0) {
      allAvailable.push({ room: room.room, freeWindows })
    }
  }

  utilizations.sort((a, b) => b.percentage - a.percentage)
  // Sort available by room name for consistent listing
  allAvailable.sort((a, b) => a.room.localeCompare(b.room, 'he'))

  const totalSlots = rooms.length * TOTAL_SLOTS
  const avgOccupancy = totalSlots > 0 ? Math.round((totalOccupiedSlots / totalSlots) * 100) : 0

  return {
    totalRooms: rooms.length,
    totalActivities: rooms.reduce((sum, r) => sum + r.activities.length, 0),
    conflictCount,
    avgOccupancy,
    busiest: utilizations.slice(0, TOP_BUSY),
    allAvailable,
    availableCount: allAvailable.length,
  }
}

// ==================== Sub-components ====================

function UtilizationBar({ percentage }: { percentage: number }) {
  const color =
    percentage >= 85
      ? 'from-[#43a579] to-[#ef4444]'
      : percentage >= 65
        ? 'from-[#43a579] to-[#f59e0b]'
        : 'from-[#43a579] to-[#43a579]'

  const textColor =
    percentage >= 85 ? 'text-red-500' : percentage >= 65 ? 'text-amber-600' : 'text-[#43a579]'

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-[#082753]/5 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-gradient-to-l', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('text-[9px] font-extrabold min-w-[26px] text-left', textColor)}>
        {percentage}%
      </span>
    </div>
  )
}

function AvailableRoomRow({ room }: { room: RoomAvailability }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold text-[#082753] whitespace-nowrap">{room.room}</span>
      <div className="flex flex-wrap gap-1 justify-end">
        {room.freeWindows.map((w, i) => (
          <span
            key={i}
            className="text-[8px] font-bold text-[#43a579] rounded-full px-1.5 py-px whitespace-nowrap"
            style={{
              background: 'rgba(67,165,121,0.07)',
              border: '1px solid rgba(67,165,121,0.1)',
            }}
          >
            {w.start}–{w.end}
          </span>
        ))}
      </div>
    </div>
  )
}

// ==================== Component ====================

export default function SummaryBar({ rooms, loading = false }: SummaryBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAllRooms, setShowAllRooms] = useState(false)

  const insights = useMemo(() => computeInsights(rooms), [rooms])

  const previewRooms = insights.allAvailable.slice(0, PREVIEW_AVAILABLE)
  const remainingRooms = insights.allAvailable.slice(PREVIEW_AVAILABLE)
  const hasMore = remainingRooms.length > 0

  return (
    <div>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-xs font-bold text-[#082753]/60 py-1 w-full transition-colors hover:text-[#082753]"
      >
        <CaretDown
          size={12}
          weight="bold"
          className={cn('transition-transform duration-300 ease-in-out', isOpen && 'rotate-180')}
        />
        <ChartBar size={13} weight="duotone" className="text-[#43a579]" />
        <span>{insights.totalRooms} חדרים</span>
        <span className="text-slate-300">•</span>
        <span>{insights.totalActivities} שיעורים</span>
        <span className="text-slate-300">•</span>
        <span className="text-[#43a579]">{insights.availableCount} פנויים</span>
        {insights.conflictCount > 0 && (
          <>
            <span className="text-slate-300">•</span>
            <span className="text-red-500">{insights.conflictCount} התנגשויות</span>
          </>
        )}
      </button>

      {/* Expandable panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="insights-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {loading ? (
              <div className="pt-2 pb-1">
                <div className="animate-pulse rounded-xl h-[140px] bg-white/40 backdrop-blur-xl border border-white/60" />
              </div>
            ) : (
              <div className="pt-2 pb-1">
                {/* Liquid glass container */}
                <div
                  className="relative overflow-hidden rounded-xl border border-white/70 p-3.5 max-w-[580px]"
                  style={{
                    backdropFilter: 'blur(60px)',
                    WebkitBackdropFilter: 'blur(60px)',
                    background:
                      'linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(67,165,121,0.08) 30%, rgba(8,39,83,0.05) 60%, rgba(255,255,255,0.5) 100%)',
                    boxShadow:
                      '0 6px 28px rgba(8,39,83,0.07), 0 2px 6px rgba(67,165,121,0.05), inset 0 1px 2px rgba(255,255,255,0.95), inset 0 -1px 2px rgba(67,165,121,0.04)',
                  }}
                >
                  {/* Glass reflections */}
                  <div
                    className="absolute inset-x-0 top-0 h-[40%] rounded-t-xl pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)',
                    }}
                  />
                  <div
                    className="absolute -top-[25%] -right-[8%] w-[50%] h-[50%] rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(67,165,121,0.1) 0%, transparent 60%)',
                    }}
                  />
                  <div
                    className="absolute -bottom-[15%] -left-[8%] w-[35%] h-[35%] rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(8,39,83,0.05) 0%, transparent 55%)',
                    }}
                  />

                  {/* Content */}
                  <div className="relative z-[1]">
                    {/* Stats row */}
                    <div className="flex gap-3.5 mb-3 items-baseline flex-wrap">
                      <StatValue value={insights.totalRooms} label="חדרים" />
                      <GlassDivider />
                      <StatValue value={insights.totalActivities} label="שיעורים" />
                      <GlassDivider />
                      <StatValue
                        value={insights.conflictCount}
                        label="התנגשויות"
                        danger={insights.conflictCount > 0}
                      />
                      <GlassDivider />
                      <StatValue value={`${insights.avgOccupancy}%`} label="תפוסה" accent />
                    </div>

                    {/* Two mini sections */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Busiest rooms */}
                      <GlassSection variant="navy">
                        <div className="text-[9px] font-extrabold text-[#082753]/60 tracking-wide mb-2">
                          חדרים עמוסים
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {insights.busiest.length === 0 && (
                            <span className="text-[10px] text-[#082753]/40">אין נתונים</span>
                          )}
                          {insights.busiest.map((r) => (
                            <div key={r.room} className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-[#082753] min-w-[48px] whitespace-nowrap truncate">
                                {r.room}
                              </span>
                              <UtilizationBar percentage={r.percentage} />
                            </div>
                          ))}
                        </div>
                      </GlassSection>

                      {/* Available rooms — preview + expandable full list */}
                      <GlassSection variant="green">
                        <div className="text-[9px] font-extrabold text-[#43a579]/70 tracking-wide mb-2">
                          חדרים פנויים ({insights.availableCount})
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {insights.allAvailable.length === 0 && (
                            <span className="text-[10px] text-[#43a579]/40">אין חדרים פנויים</span>
                          )}

                          {/* Always-visible preview */}
                          {previewRooms.map((r) => (
                            <AvailableRoomRow key={r.room} room={r} />
                          ))}

                          {/* Expandable remaining rooms */}
                          {hasMore && (
                            <>
                              <button
                                type="button"
                                onClick={() => setShowAllRooms((prev) => !prev)}
                                className="flex items-center gap-1 text-[9px] font-bold text-[#43a579]/80 hover:text-[#43a579] transition-colors mt-0.5"
                              >
                                <CaretDown
                                  size={10}
                                  weight="bold"
                                  className={cn(
                                    'transition-transform duration-200',
                                    showAllRooms && 'rotate-180',
                                  )}
                                />
                                <span>
                                  {showAllRooms
                                    ? 'הסתר'
                                    : `עוד ${remainingRooms.length} חדרים`}
                                </span>
                              </button>

                              <AnimatePresence initial={false}>
                                {showAllRooms && (
                                  <motion.div
                                    key="remaining-rooms"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <div className="flex flex-col gap-1.5 pt-1 border-t border-[#43a579]/10">
                                      {remainingRooms.map((r) => (
                                        <AvailableRoomRow key={r.room} room={r} />
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </>
                          )}
                        </div>
                      </GlassSection>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==================== Inline helpers ====================

function StatValue({
  value,
  label,
  danger,
  accent,
}: {
  value: number | string
  label: string
  danger?: boolean
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline gap-1">
      <span
        className={cn(
          'text-xl font-extrabold',
          danger ? 'text-red-500' : accent ? 'text-[#43a579]' : 'text-[#082753]',
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          'text-[10px] font-bold',
          danger ? 'text-red-500/70' : 'text-[#43a579]',
        )}
      >
        {label}
      </span>
    </div>
  )
}

function GlassDivider() {
  return (
    <div
      className="self-center w-px h-[18px]"
      style={{
        background:
          'linear-gradient(180deg, transparent, rgba(67,165,121,0.2), transparent)',
      }}
    />
  )
}

function GlassSection({
  variant,
  children,
}: {
  variant: 'navy' | 'green'
  children: React.ReactNode
}) {
  const isNavy = variant === 'navy'
  return (
    <div
      className="rounded-[10px] p-2.5 px-3"
      style={{
        background: isNavy ? 'rgba(8,39,83,0.03)' : 'rgba(67,165,121,0.03)',
        border: isNavy ? '1px solid rgba(8,39,83,0.07)' : '1px solid rgba(67,165,121,0.08)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5)',
      }}
    >
      {children}
    </div>
  )
}
