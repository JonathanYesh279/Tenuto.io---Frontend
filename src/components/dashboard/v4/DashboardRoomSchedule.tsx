import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowSquareOut as ArrowSquareOutIcon } from '@phosphor-icons/react'
import { roomScheduleService } from '../../../services/apiService'
import { BorderBeam } from '../../ui/BorderBeam'

// ── Constants ──
const GRID_START_HOUR = 8
const GRID_END_HOUR = 20
const SLOT_DURATION = 30 // minutes
const TOTAL_SLOTS = ((GRID_END_HOUR - GRID_START_HOUR) * 60) / SLOT_DURATION // 24

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']

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
}

interface RoomData {
  room: string
  activities: Activity[]
  hasConflicts: boolean
}

interface ScheduleData {
  day: number
  dayName: string
  rooms: RoomData[]
  summary: {
    totalRooms: number
    totalActivities: number
    conflictCount: number
  }
}

// ── Helpers ──
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function generateTimeHeaders(): string[] {
  const headers: string[] = []
  for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
    headers.push(`${String(h).padStart(2, '0')}:00`)
    headers.push(`${String(h).padStart(2, '0')}:30`)
  }
  return headers
}

const TIME_HEADERS = generateTimeHeaders()

function getActivityPosition(startTime: string, endTime: string) {
  const startMin = timeToMinutes(startTime)
  const endMin = timeToMinutes(endTime)
  const gridStartMin = GRID_START_HOUR * 60
  const gridEndMin = GRID_END_HOUR * 60

  const clampedStart = Math.max(startMin, gridStartMin)
  const clampedEnd = Math.min(endMin, gridEndMin)

  const startPct = ((clampedStart - gridStartMin) / (gridEndMin - gridStartMin)) * 100
  const widthPct = ((clampedEnd - clampedStart) / (gridEndMin - gridStartMin)) * 100

  return { startPct, widthPct }
}

const SOURCE_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  timeBlock: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'bg-blue-500' },
  rehearsal: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', accent: 'bg-purple-500' },
  theory: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', accent: 'bg-amber-500' },
}

function getTodayDayIndex(): number {
  return new Date().getDay() // 0=Sun..6=Sat
}

// ── Current time indicator position ──
function getCurrentTimePct(): number | null {
  const now = new Date()
  const min = now.getHours() * 60 + now.getMinutes()
  const gridStart = GRID_START_HOUR * 60
  const gridEnd = GRID_END_HOUR * 60
  if (min < gridStart || min > gridEnd) return null
  return ((min - gridStart) / (gridEnd - gridStart)) * 100
}

// ── Component ──
export function DashboardRoomSchedule() {
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [currentTimePct, setCurrentTimePct] = useState<number | null>(getCurrentTimePct())

  const todayIndex = getTodayDayIndex()
  const todayName = HEBREW_DAYS[todayIndex] || ''

  useEffect(() => {
    loadSchedule()
  }, [])

  // Update current time line every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimePct(getCurrentTimePct())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadSchedule = async () => {
    try {
      if (todayIndex === 6) { // Saturday
        setSchedule(null)
        setLoading(false)
        return
      }
      const data = await roomScheduleService.getRoomSchedule(todayIndex)
      setSchedule(data)
      setError(false)
    } catch (err) {
      console.error('Error loading room schedule:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const rooms = useMemo(() => {
    if (!schedule?.rooms) return []
    return schedule.rooms.filter(r => r.room).sort((a, b) => a.room.localeCompare(b.room, 'he'))
  }, [schedule])

  if (loading) {
    return (
      <div className="bg-white dark:bg-sidebar-dark rounded-md shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold">לוח חדרים — יום {todayName}</h2>
        </div>
        <div className="p-8 flex items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (error || todayIndex === 6) {
    return (
      <div className="bg-white dark:bg-sidebar-dark rounded-md shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold">לוח חדרים — יום {todayName || 'שבת'}</h2>
        </div>
        <div className="p-8 text-center text-slate-400 text-sm">
          {todayIndex === 6 ? 'אין פעילות בשבת' : 'שגיאה בטעינת לוח חדרים'}
        </div>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-white dark:bg-sidebar-dark rounded-md shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold">לוח חדרים — יום {todayName}</h2>
        </div>
        <div className="p-8 text-center text-slate-400 text-sm">אין חדרים מוגדרים</div>
      </div>
    )
  }

  return (
    <div className="relative bg-white dark:bg-sidebar-dark rounded-md shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <BorderBeam duration={14} size={200} colorFrom="#10b981" colorTo="#0ea5e9" />
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">לוח חדרים — יום {todayName}</h2>
          <p className="text-xs text-slate-400 mt-1">
            {schedule?.summary?.totalActivities || 0} פעילויות • {rooms.length} חדרים
            {(schedule?.summary?.conflictCount || 0) > 0 && (
              <span className="text-red-500 mr-2">• {schedule?.summary?.conflictCount} התנגשויות</span>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/room-schedule')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          <ArrowSquareOutIcon size={14} weight="bold" />
          פתח לוח מלא
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto" dir="rtl">
        <div className="min-w-[900px]">
          {/* Time header row */}
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <div className="w-24 flex-shrink-0 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/30 sticky right-0 z-10">
              חדר
            </div>
            <div className="flex-1 relative">
              <div className="flex">
                {TIME_HEADERS.filter((_, i) => i % 2 === 0).map((time) => (
                  <div
                    key={time}
                    className="flex-1 px-1 py-2 text-[9px] font-medium text-slate-400 text-center border-r border-slate-50 dark:border-slate-800/50"
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Room rows */}
          {rooms.map((room) => (
            <div
              key={room.room}
              className="flex border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors"
            >
              {/* Room name */}
              <div className="w-24 flex-shrink-0 px-3 py-3 flex items-center sticky right-0 z-10 bg-white dark:bg-sidebar-dark">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{room.room}</span>
              </div>

              {/* Activities timeline */}
              <div className="flex-1 relative" style={{ minHeight: 52 }}>
                {/* Hour grid lines */}
                {TIME_HEADERS.filter((_, i) => i % 2 === 0).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-r border-slate-50 dark:border-slate-800/30"
                    style={{ right: `${(i / 12) * 100}%` }}
                  />
                ))}

                {/* Current time indicator */}
                {currentTimePct !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-20"
                    style={{ right: `${currentTimePct}%` }}
                  />
                )}

                {/* Activities */}
                {room.activities.map((activity) => {
                  const { startPct, widthPct } = getActivityPosition(activity.startTime, activity.endTime)
                  if (widthPct <= 0) return null
                  const colors = SOURCE_COLORS[activity.source] || SOURCE_COLORS.timeBlock

                  const sourceLabel = activity.source === 'timeBlock' ? 'שיעור' : activity.source === 'rehearsal' ? 'חזרה' : 'תיאוריה'
                  const tooltipText = `${activity.teacherName} | ${activity.label} | ${activity.startTime}–${activity.endTime} | ${sourceLabel}`

                  return (
                      <div
                        key={activity.id}
                        title={tooltipText}
                        className={`absolute top-1 bottom-1 rounded-md border ${colors.bg} ${colors.border} ${activity.hasConflict ? 'ring-1 ring-red-400' : ''} cursor-default overflow-hidden flex items-center`}
                        style={{
                          right: `${startPct}%`,
                          width: `${widthPct}%`,
                          minWidth: 24,
                        }}
                      >
                        {/* Left accent bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.accent} rounded-l-md`} />
                        <div className="px-2 py-0.5 overflow-hidden w-full">
                          <p className={`text-[10px] font-bold ${colors.text} truncate`}>{activity.teacherName}</p>
                          <p className={`text-[9px] ${colors.text} opacity-70 truncate`}>{activity.label}</p>
                        </div>
                      </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-5 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-blue-200 border border-blue-300" />
          שיעור
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-purple-200 border border-purple-300" />
          חזרה
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-200 border border-amber-300" />
          תיאוריה
        </span>
        <span className="flex items-center gap-1.5 mr-auto">
          <span className="w-3 h-0.5 bg-red-400 rounded" />
          שעה נוכחית
        </span>
      </div>
    </div>
  )
}
