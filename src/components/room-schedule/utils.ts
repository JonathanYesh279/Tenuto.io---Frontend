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
