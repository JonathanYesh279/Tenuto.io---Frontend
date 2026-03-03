/**
 * Shared utilities for room schedule components.
 */

export const GRID_START_HOUR = 8
export const GRID_END_HOUR = 20
export const SLOT_DURATION = 30
export const TOTAL_SLOTS = 24

/** Hebrew day names indexed 0=Sunday through 5=Friday. */
export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'] as const

/**
 * Convert "HH:MM" time string to total minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert total minutes since midnight to "HH:MM" string.
 * Inverse of timeToMinutes.
 */
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Compute room utilization percentage across all week days.
 * Iterates over each day's schedule, finds the room by name, counts unique
 * occupied slot indices, and returns the percentage of total possible slots.
 */
export function computeRoomUtilization(
  roomName: string,
  weekData: any[],
  totalSlotsPerDay: number
): number {
  if (!weekData || weekData.length === 0) return 0

  const gridStartMinutes = GRID_START_HOUR * 60
  let totalOccupied = 0

  for (const dayData of weekData) {
    if (!dayData?.rooms) continue
    const room = dayData.rooms.find((r: any) => r.room === roomName)
    if (!room) continue

    const occupied = new Set<number>()
    for (const activity of room.activities || []) {
      const startMin = timeToMinutes(activity.startTime)
      const endMin = timeToMinutes(activity.endTime)
      for (let t = startMin; t < endMin; t += SLOT_DURATION) {
        const slotIndex = Math.floor((t - gridStartMinutes) / SLOT_DURATION)
        if (slotIndex >= 0 && slotIndex < totalSlotsPerDay) {
          occupied.add(slotIndex)
        }
      }
    }
    totalOccupied += occupied.size
  }

  const totalPossible = totalSlotsPerDay * weekData.length
  if (totalPossible === 0) return 0
  return Math.round((totalOccupied / totalPossible) * 100)
}

/**
 * Check if two time ranges overlap.
 * Ported from backend utils/timeUtils.js for client-side conflict detection.
 */
export function doTimesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)
  return s1 < e2 && e1 > s2
}

/**
 * Extract the raw blockId from a timeBlock activity ID.
 * The API emits IDs like "objectId" or "objectId_0" (with lesson index suffix).
 * The move API needs the raw blockId without the suffix.
 */
export function extractBlockId(activityId: string): string {
  // ObjectIds are 24 hex chars. If longer with underscore + digits, strip suffix.
  if (activityId.length > 24 && activityId.includes('_')) {
    const lastUnderscore = activityId.lastIndexOf('_')
    const suffix = activityId.slice(lastUnderscore + 1)
    if (/^\d+$/.test(suffix)) {
      return activityId.slice(0, lastUnderscore)
    }
  }
  return activityId
}
