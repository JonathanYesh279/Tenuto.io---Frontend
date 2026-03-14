/**
 * Deterministic role → border color mapping for role chips.
 * Each known role gets a distinct vibrant color.
 */

const ROLE_COLOR_MAP: Record<string, string> = {
  'מורה': '#6366f1',       // indigo
  'מנהל': '#0ea5e9',       // sky
  'מנצח': '#8b5cf6',       // violet
  'רכז': '#f59e0b',        // amber
  'תיאוריה': '#ec4899',    // pink
  'מורה תיאוריה': '#ec4899', // pink
  'מלווה': '#14b8a6',      // teal
  'admin': '#0ea5e9',      // sky
  'teacher': '#6366f1',    // indigo
  'conductor': '#8b5cf6',  // violet
  'theory-teacher': '#ec4899', // pink
  'theory_teacher': '#ec4899', // pink
  'coordinator': '#f59e0b', // amber
}

const FALLBACK_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#84cc16', // lime
]

export function getRoleChipColor(role: string): string {
  if (ROLE_COLOR_MAP[role]) return ROLE_COLOR_MAP[role]
  // Deterministic fallback for unknown roles
  let hash = 0
  for (let i = 0; i < role.length; i++) {
    hash = role.charCodeAt(i) + ((hash << 5) - hash)
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}
