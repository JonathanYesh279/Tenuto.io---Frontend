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
      <div className={`overflow-x-auto rounded-lg border border-border bg-card shadow-1 ${
        isFullscreen ? 'h-full overflow-y-auto' : ''
      }`}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: gridColumns,
          }}
        >
          {/* Skeleton header */}
          <div className="bg-muted border-b border-l border-border h-10" />
          {TIME_SLOTS.map((_, i) => (
            <div key={i} className="bg-muted border-b border-l border-border h-10 animate-pulse" />
          ))}

          {/* Skeleton rows */}
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <div key={rowIdx} className="contents">
              <div className="bg-muted border-b border-l border-border h-20 px-3 py-2">
                <div className="h-4 w-16 bg-border rounded animate-pulse" />
              </div>
              {TIME_SLOTS.map((_, colIdx) => (
                <div key={colIdx} className="border-b border-l border-border h-20">
                  {colIdx % 4 === 1 && rowIdx % 2 === 0 && (
                    <div className="h-12 mx-1 mt-1 bg-border rounded animate-pulse" />
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
      <div className="flex items-center justify-center h-64 rounded-lg border border-border bg-card shadow-1">
        <p className="text-muted-foreground text-sm">אין פעילויות להצגה ביום זה</p>
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
        'overflow-x-auto overflow-y-auto rounded-lg border border-border bg-card shadow-1',
        isFullscreen ? 'h-full' : 'max-h-[calc(100vh-200px)]'
      )}
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
          className="border-b border-l border-border sticky top-0 right-0 z-30 bg-card"
          style={{ gridColumn: '1', gridRow: '1' }}
        />

        {/* Time slot headers */}
        {TIME_SLOTS.map((slot, i) => (
          <div
            key={slot}
            className="border-b border-l border-border text-xs text-center font-semibold text-muted-foreground py-2.5 px-1 sticky top-0 z-20 bg-card"
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
                className="font-semibold text-sm text-foreground px-3 py-2 border-b border-l border-border flex items-center sticky right-0 z-20 bg-card"
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
                    className="border-b border-l border-border/50"
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

              {/* Conflict group: each activity at its OWN correct time position */}
              {Array.from(conflictGroups.entries()).map(([groupId, groupActivities]) => {
                return groupActivities.map((activity, stackIdx) => {
                  const { startCol, endCol, span, startOffsetPercent, widthPercent } = getActivityGridPlacement(
                    activity.startTime,
                    activity.endTime
                  )

                  if (span <= 0) return null

                  const needsSubSlot = startOffsetPercent > 0 || widthPercent < 100
                  // Stack offset: shift each conflicting activity down so they don't fully overlap
                  const topOffset = stackIdx * (STACKED_ITEM_HEIGHT + 2)

                  return (
                    <div
                      key={activity.id}
                      className="pointer-events-auto"
                      style={{
                        gridColumn: `${startCol} / ${endCol}`,
                        gridRow: `${rowNumber}`,
                        alignSelf: 'start',
                        marginTop: `${topOffset + 4}px`,
                        marginBottom: '4px',
                        position: 'relative',
                        zIndex: stackIdx + 1,
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
                })
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
