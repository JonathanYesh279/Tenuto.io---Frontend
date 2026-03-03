/**
 * Shared utilities for room schedule components.
 */

export const GRID_START_HOUR = 8
export const GRID_END_HOUR = 20
export const SLOT_DURATION = 30
export const TOTAL_SLOTS = 24

/**
 * Convert "HH:MM" time string to total minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
