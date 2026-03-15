import { useMemo } from 'react'
import ActivityCell from './ActivityCell'
import type { ActivityData } from './ActivityCell'
import DroppableCell from './DroppableCell'
import { timeToMinutes, GRID_START_HOUR, GRID_END_HOUR, SLOT_DURATION } from './utils'
import { cn } from '@/lib/utils'

// ==================== Types ====================

interface RoomScheduleActivity extends ActivityData {
  room: string
  day: number
  teacherId: string
}

interface RoomScheduleRoom {
  room: string
  activities: RoomScheduleActivity[]
  hasConflicts: boolean
}

interface RoomGridProps {
  rooms: RoomScheduleRoom[]
  loading: boolean
  onEmptyCellClick?: (room: string, timeSlot: string) => void
  isDragEnabled?: boolean  // passed down from DndContext in RoomSchedule
  isFullscreen?: boolean   // when true, grid fills viewport (no max-height cap)
  onActivityClick?: (activity: RoomScheduleActivity & { room: string }) => void
}

// ==================== Constants ====================

const BASE_ROW_HEIGHT = 100 // px per non-conflicting row
const STACKED_ITEM_HEIGHT = 55 // px per stacked conflict activity

// Generate time slots array: ['08:00', '08:30', ..., '19:30'] (24 entries)
const TIME_SLOTS: string[] = []
for (let minutes = GRID_START_HOUR * 60; minutes < GRID_END_HOUR * 60; minutes += SLOT_DURATION) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
}

// ==================== Helpers ====================

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
  const span = endCol - startCol

  // Sub-slot positioning: offset and width as percentages of the grid span
  // e.g. 09:15-10:15 lesson in 09:00-10:30 span (3 cols):
  //   startOffset = 15/90 = 16.7%, widthPercent = 60/90 = 66.7%
  const spanMinutes = span * SLOT_DURATION
  const actualMinutes = clampedEnd - clampedStart
  const spanStartMinutes = (startCol - 2) * SLOT_DURATION + gridStartMinutes
  const offsetMinutes = clampedStart - spanStartMinutes

  const startOffsetPercent = spanMinutes > 0 ? Math.round((offsetMinutes / spanMinutes) * 100) : 0
  const widthPercent = spanMinutes > 0 ? Math.round((actualMinutes / spanMinutes) * 100) : 100

  return { startCol, endCol, span, startOffsetPercent, widthPercent }
}

/**
 * Group activities by conflictGroupId.
 * Non-conflicting activities (no conflictGroupId) get their own solo group.
 * Returns: { conflictGroups: Map<string, Activity[]>, soloActivities: Activity[] }
 */
function groupByConflict(activities: RoomScheduleActivity[]) {
  const conflictGroups = new Map<string, RoomScheduleActivity[]>()
  const soloActivities: RoomScheduleActivity[] = []

  for (const activity of activities) {
    if (activity.conflictGroupId) {
      const group = conflictGroups.get(activity.conflictGroupId) || []
      group.push(activity)
      conflictGroups.set(activity.conflictGroupId, group)
    } else {
      soloActivities.push(activity)
    }
  }

  return { conflictGroups, soloActivities }
}

/**
 * Calculate the max conflict stack depth for a room.
 * Used to determine row height expansion.
 */
function getMaxStackDepth(activities: RoomScheduleActivity[]): number {
  const { conflictGroups } = groupByConflict(activities)
  let maxDepth = 1

  for (const group of conflictGroups.values()) {
    if (group.length > maxDepth) {
      maxDepth = group.length
    }
  }

  return maxDepth
}

/**
 * Calculate the row min-height in px based on max conflict depth.
 */
function getRowMinHeight(activities: RoomScheduleActivity[]): number {
  const maxDepth = getMaxStackDepth(activities)
  if (maxDepth <= 1) return BASE_ROW_HEIGHT
  // Each stacked item needs STACKED_ITEM_HEIGHT px, plus some padding
  return Math.max(BASE_ROW_HEIGHT, maxDepth * STACKED_ITEM_HEIGHT + 12)
}

// ==================== Component ====================

export default function RoomGrid({ rooms, loading, onEmptyCellClick, isDragEnabled, isFullscreen, onActivityClick }: RoomGridProps) {
  // Grid column template: wider content columns in fullscreen, narrower room label
  const gridColumns = isFullscreen
    ? '120px repeat(24, minmax(140px, 1fr))'
    : '140px repeat(24, minmax(120px, 1fr))'

  // Precompute row heights for conflict stacking
  const rowHeights = useMemo(
    () => rooms.map((room) => getRowMinHeight(room.activities)),
    [rooms]
  )

  // Loading skeleton
  if (loading) {
    return (
      <div className={`overflow-x-auto rounded-xl border border-white/60 dark:border-white/20 backdrop-blur-xl ${
        isFullscreen ? 'h-full overflow-y-auto' : ''
      }`}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: gridColumns,
          }}
        >
          {/* Skeleton header */}
          <div className="bg-slate-50 dark:bg-slate-800 border-b border-l h-10" />
          {TIME_SLOTS.map((_, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800 border-b border-l h-10 animate-pulse" />
          ))}

          {/* Skeleton rows */}
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <div key={rowIdx} className="contents">
              <div className="bg-slate-50 dark:bg-slate-800 border-b border-l h-20 px-3 py-2">
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
              </div>
              {TIME_SLOTS.map((_, colIdx) => (
                <div key={colIdx} className="border-b border-l h-20">
                  {colIdx % 4 === 1 && rowIdx % 2 === 0 && (
                    <div className="h-12 mx-1 mt-1 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
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
      <div className="flex items-center justify-center h-64 rounded-xl border border-white/60 dark:border-white/20 backdrop-blur-xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(240,245,255,0.5) 50%, rgba(255,255,255,0.6) 100%)' }}>
        <p className="text-slate-500 dark:text-slate-400 text-sm">אין פעילויות להצגה ביום זה</p>
      </div>
    )
  }

  // Build grid-template-rows with per-room heights
  const rowTemplate = rowHeights
    .map((h) => `minmax(${h}px, auto)`)
    .join(' ')

  return (
    <div
      className={cn(
        'overflow-x-auto overflow-y-auto rounded-xl border backdrop-blur-xl',
        'border-white/60 dark:border-white/20',
        isFullscreen ? 'h-full' : 'max-h-[calc(100vh-200px)]'
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(240,245,255,0.5) 50%, rgba(255,255,255,0.6) 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.9)',
      }}
    >
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: gridColumns,
          gridTemplateRows: `auto ${rowTemplate}`,
        }}
      >
        {/* ====== Header Row ====== */}
        {/* Corner cell: sticky both top and right (RTL) */}
        <div
          className="border-b border-l border-slate-200/50 dark:border-slate-700/50 sticky top-0 right-0 z-30 bg-white dark:bg-slate-900"
          style={{ gridColumn: '1', gridRow: '1' }}
        />

        {/* Time slot headers */}
        {TIME_SLOTS.map((slot, i) => (
          <div
            key={slot}
            className="border-b border-l border-slate-200/50 dark:border-slate-700/50 text-xs text-center font-semibold text-slate-500 dark:text-slate-400 py-2.5 px-1 sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-900/80"
            style={{ gridColumn: `${i + 2}`, gridRow: '1' }}
          >
            {slot}
          </div>
        ))}

        {/* ====== Room Rows ====== */}
        {rooms.map((room, roomIdx) => {
          const rowNumber = roomIdx + 2 // +2 because header is row 1, grid is 1-based
          const { conflictGroups, soloActivities } = groupByConflict(room.activities)

          // Compute occupied slot indices for empty cell detection
          const occupiedSlots = new Set<number>()
          const gridStartMin = GRID_START_HOUR * 60
          for (const activity of room.activities) {
            const startMin = timeToMinutes(activity.startTime)
            const endMin = timeToMinutes(activity.endTime)
            for (let t = startMin; t < endMin; t += SLOT_DURATION) {
              const idx = Math.floor((t - gridStartMin) / SLOT_DURATION)
              if (idx >= 0 && idx < TIME_SLOTS.length) occupiedSlots.add(idx)
            }
          }

          return (
            <div key={room.room} className="contents">
              {/* Room name cell -- sticky on right (RTL), opaque bg, high z-index */}
              <div
                className="font-semibold text-sm text-slate-700 dark:text-slate-300 px-3 py-2 border-b border-l border-slate-200/50 dark:border-slate-700/50 flex items-center sticky right-0 z-20 bg-white dark:bg-slate-900 shadow-[−2px_0_4px_rgba(0,0,0,0.05)]"
                style={{ gridColumn: '1', gridRow: `${rowNumber}` }}
              >
                <span className="truncate">{room.room}</span>
              </div>

              {/* Background cells wrapped in DroppableCell for drag-and-drop targeting */}
              {TIME_SLOTS.map((slot, slotIdx) => {
                const isEmpty = !occupiedSlots.has(slotIdx)
                return (
                  <div
                    key={slotIdx}
                    className="border-b border-l border-slate-200/30 dark:border-slate-700/30"
                    style={{
                      gridColumn: `${slotIdx + 2}`,
                      gridRow: `${rowNumber}`,
                      minHeight: `${rowHeights[roomIdx]}px`,
                    }}
                  >
                    <DroppableCell
                      room={room.room}
                      timeSlot={slot}
                      isEmpty={isEmpty}
                      roomActivities={room.activities}
                      onClick={
                        isEmpty && onEmptyCellClick
                          ? () => onEmptyCellClick(room.room, slot)
                          : undefined
                      }
                    />
                  </div>
                )
              })}

              {/* Solo (non-conflicting) activity cells */}
              {soloActivities.map((activity) => {
                const { startCol, endCol, span, startOffsetPercent, widthPercent } = getActivityGridPlacement(
                  activity.startTime,
                  activity.endTime
                )

                if (span <= 0) return null

                const needsSubSlot = startOffsetPercent > 0 || widthPercent < 100

                return (
                  <div
                    key={activity.id}
                    className="my-1 pointer-events-auto"
                    style={{
                      gridColumn: `${startCol} / ${endCol}`,
                      gridRow: `${rowNumber}`,
                      alignSelf: 'center',
                      ...(needsSubSlot ? {
                        marginInlineEnd: `${startOffsetPercent}%`,
                        width: `${widthPercent}%`,
                      } : {
                        marginInlineStart: '2px',
                        marginInlineEnd: '2px',
                      }),
                    }}
                  >
                    <ActivityCell
                      activity={activity}
                      isDragEnabled={isDragEnabled}
                      dragData={{ room: room.room, teacherId: activity.teacherId }}
                      onClick={() => onActivityClick?.({ ...activity, room: room.room })}
                    />
                  </div>
                )
              })}

              {/* Conflict group stacks */}
              {Array.from(conflictGroups.entries()).map(([groupId, groupActivities]) => {
                // Find the widest span that covers all activities in the group
                const placements = groupActivities.map((a) =>
                  getActivityGridPlacement(a.startTime, a.endTime)
                )
                const minStartCol = Math.min(...placements.map((p) => p.startCol))
                const maxEndCol = Math.max(...placements.map((p) => p.endCol))

                return (
                  <div
                    key={groupId}
                    className="mx-0.5 my-1 flex flex-col gap-0.5 pointer-events-auto"
                    style={{
                      gridColumn: `${minStartCol} / ${maxEndCol}`,
                      gridRow: `${rowNumber}`,
                      alignSelf: 'stretch',
                    }}
                  >
                    {groupActivities.map((activity) => (
                      <div
                        key={activity.id}
                        style={{ minHeight: `${STACKED_ITEM_HEIGHT}px` }}
                      >
                        <ActivityCell
                          activity={activity}
                          isDragEnabled={isDragEnabled}
                          dragData={{ room: room.room, teacherId: activity.teacherId }}
                          onClick={() => onActivityClick?.({ ...activity, room: room.room })}
                        />
                      </div>
                    ))}
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
