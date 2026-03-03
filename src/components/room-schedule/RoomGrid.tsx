import { cn } from '@/lib/utils'

// ==================== Types ====================

interface RoomScheduleActivity {
  id: string
  source: 'timeBlock' | 'rehearsal' | 'theory'
  room: string
  day: number
  startTime: string
  endTime: string
  teacherName: string
  teacherId: string
  label: string
  activityType: string
  hasConflict: boolean
  conflictGroupId: string | null
}

interface RoomScheduleRoom {
  room: string
  activities: RoomScheduleActivity[]
  hasConflicts: boolean
}

interface RoomGridProps {
  rooms: RoomScheduleRoom[]
  loading: boolean
}

// ==================== Constants ====================

const GRID_START_HOUR = 8
const GRID_END_HOUR = 20
const SLOT_DURATION = 30

// Generate time slots array: ['08:00', '08:30', ..., '19:30'] (24 entries)
const TIME_SLOTS: string[] = []
for (let minutes = GRID_START_HOUR * 60; minutes < GRID_END_HOUR * 60; minutes += SLOT_DURATION) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
}

// Color map for activity source types
const ACTIVITY_COLORS = {
  timeBlock: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-900',
  },
  rehearsal: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-900',
  },
  theory: {
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    text: 'text-orange-900',
  },
} as const

const CONFLICT_STYLE = 'border-2 border-red-500 ring-2 ring-red-200'

// ==================== Helpers ====================

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function getActivityGridPlacement(startTime: string, endTime: string) {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const gridStartMinutes = GRID_START_HOUR * 60
  const gridEndMinutes = GRID_END_HOUR * 60

  // Clamp to grid boundaries
  const clampedStart = Math.max(startMinutes, gridStartMinutes)
  const clampedEnd = Math.min(endMinutes, gridEndMinutes)

  // Column index: +2 because column 1 is room header (1-based grid)
  const startCol = Math.floor((clampedStart - gridStartMinutes) / SLOT_DURATION) + 2
  const endCol = Math.ceil((clampedEnd - gridStartMinutes) / SLOT_DURATION) + 2

  return { startCol, endCol, span: endCol - startCol }
}

// ==================== Component ====================

export default function RoomGrid({ rooms, loading }: RoomGridProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div
          className="grid"
          style={{
            gridTemplateColumns: '120px repeat(24, minmax(80px, 1fr))',
          }}
        >
          {/* Skeleton header */}
          <div className="bg-gray-50 border-b border-l h-10" />
          {TIME_SLOTS.map((_, i) => (
            <div key={i} className="bg-gray-50 border-b border-l h-10 animate-pulse" />
          ))}

          {/* Skeleton rows */}
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <div key={rowIdx} className="contents">
              <div className="bg-gray-50 border-b border-l h-16 px-3 py-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              {TIME_SLOTS.map((_, colIdx) => (
                <div key={colIdx} className="border-b border-l h-16">
                  {colIdx % 4 === 1 && rowIdx % 2 === 0 && (
                    <div className="h-12 mx-1 mt-1 bg-gray-200 rounded animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm">אין פעילויות להצגה ביום זה</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto rounded-lg border border-gray-200">
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: '120px repeat(24, minmax(80px, 1fr))',
          gridTemplateRows: `auto repeat(${rooms.length}, minmax(60px, auto))`,
        }}
      >
        {/* ====== Header Row ====== */}
        {/* Empty cell for room header column */}
        <div
          className="bg-white border-b border-l sticky top-0 z-20"
          style={{ gridColumn: '1', gridRow: '1' }}
        />

        {/* Time slot headers */}
        {TIME_SLOTS.map((slot, i) => (
          <div
            key={slot}
            className="bg-white border-b border-l text-xs text-center font-medium text-muted-foreground py-2 px-1 sticky top-0 z-20"
            style={{ gridColumn: `${i + 2}`, gridRow: '1' }}
          >
            {slot}
          </div>
        ))}

        {/* ====== Room Rows ====== */}
        {rooms.map((room, roomIdx) => {
          const rowNumber = roomIdx + 2 // +2 because header is row 1, grid is 1-based

          return (
            <div key={room.room} className="contents">
              {/* Room name cell -- sticky on right (RTL) */}
              <div
                className="bg-gray-50 font-medium text-sm px-3 py-2 border-b border-l flex items-center sticky right-0 z-10"
                style={{ gridColumn: '1', gridRow: `${rowNumber}` }}
              >
                <span className="truncate">{room.room}</span>
              </div>

              {/* Background cells for grid lines */}
              {TIME_SLOTS.map((_, slotIdx) => (
                <div
                  key={slotIdx}
                  className="border-b border-l min-h-[60px]"
                  style={{
                    gridColumn: `${slotIdx + 2}`,
                    gridRow: `${rowNumber}`,
                  }}
                />
              ))}

              {/* Activity cells */}
              {room.activities.map((activity) => {
                const { startCol, endCol, span } = getActivityGridPlacement(
                  activity.startTime,
                  activity.endTime
                )

                if (span <= 0) return null

                const colors = ACTIVITY_COLORS[activity.source] || ACTIVITY_COLORS.timeBlock

                return (
                  <div
                    key={activity.id}
                    className={cn(
                      'rounded px-1.5 py-1 text-xs overflow-hidden mx-0.5 my-1 border',
                      colors.bg,
                      colors.border,
                      colors.text,
                      activity.hasConflict && CONFLICT_STYLE
                    )}
                    style={{
                      gridColumn: `${startCol} / ${endCol}`,
                      gridRow: `${rowNumber}`,
                      alignSelf: 'center',
                    }}
                    title={`${activity.teacherName} - ${activity.label} (${activity.startTime}-${activity.endTime})`}
                  >
                    <div className="font-medium truncate leading-tight">
                      {activity.teacherName}
                    </div>
                    <div className="truncate leading-tight opacity-75">
                      {activity.label}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
