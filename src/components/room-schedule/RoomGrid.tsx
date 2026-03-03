import { useMemo } from 'react'
import ActivityCell from './ActivityCell'
import type { ActivityData } from './ActivityCell'
import DroppableCell from './DroppableCell'
import { timeToMinutes, GRID_START_HOUR, GRID_END_HOUR, SLOT_DURATION } from './utils'

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
}

// ==================== Constants ====================

const BASE_ROW_HEIGHT = 80 // px per non-conflicting row
const STACKED_ITEM_HEIGHT = 40 // px per stacked conflict activity

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

  return { startCol, endCol, span: endCol - startCol }
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

export default function RoomGrid({ rooms, loading, onEmptyCellClick, isDragEnabled }: RoomGridProps) {
  // Precompute row heights for conflict stacking
  const rowHeights = useMemo(
    () => rooms.map((room) => getRowMinHeight(room.activities)),
    [rooms]
  )

  // Loading skeleton
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div
          className="grid"
          style={{
            gridTemplateColumns: '140px repeat(24, minmax(120px, 1fr))',
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
              <div className="bg-gray-50 border-b border-l h-20 px-3 py-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              {TIME_SLOTS.map((_, colIdx) => (
                <div key={colIdx} className="border-b border-l h-20">
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

  // Build grid-template-rows with per-room heights
  const rowTemplate = rowHeights
    .map((h) => `minmax(${h}px, auto)`)
    .join(' ')

  return (
    <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto rounded-lg border border-gray-200">
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: '140px repeat(24, minmax(120px, 1fr))',
          gridTemplateRows: `auto ${rowTemplate}`,
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
              {/* Room name cell -- sticky on right (RTL) */}
              <div
                className="bg-gray-50 font-medium text-sm px-3 py-2 border-b border-l flex items-center sticky right-0 z-10"
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
                    className="border-b border-l"
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
                const { startCol, endCol, span } = getActivityGridPlacement(
                  activity.startTime,
                  activity.endTime
                )

                if (span <= 0) return null

                return (
                  <div
                    key={activity.id}
                    className="mx-0.5 my-1 pointer-events-auto"
                    style={{
                      gridColumn: `${startCol} / ${endCol}`,
                      gridRow: `${rowNumber}`,
                      alignSelf: 'center',
                    }}
                  >
                    <ActivityCell
                      activity={activity}
                      isDragEnabled={isDragEnabled}
                      dragData={{ room: room.room, teacherId: activity.teacherId }}
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
