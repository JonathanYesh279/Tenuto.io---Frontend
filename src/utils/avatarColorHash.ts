/**
 * Deterministic avatar color hash utility.
 * Maps a name string to a consistent color from a vibrant palette.
 * Same name always produces the same color across all pages.
 */

const AVATAR_PALETTE = [
  { bg: 'bg-indigo-500', text: 'text-white', hex: '#6366f1' },
  { bg: 'bg-emerald-500', text: 'text-white', hex: '#10b981' },
  { bg: 'bg-amber-500', text: 'text-white', hex: '#f59e0b' },
  { bg: 'bg-pink-500', text: 'text-white', hex: '#ec4899' },
  { bg: 'bg-violet-500', text: 'text-white', hex: '#8b5cf6' },
  { bg: 'bg-cyan-500', text: 'text-white', hex: '#06b6d4' },
  { bg: 'bg-rose-500', text: 'text-white', hex: '#f43f5e' },
  { bg: 'bg-teal-500', text: 'text-white', hex: '#14b8a6' },
] as const

function hashName(name: string): number {
  if (!name) return 0
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export function getAvatarColorClasses(name: string): { bg: string; text: string } {
  return AVATAR_PALETTE[hashName(name) % AVATAR_PALETTE.length]
}

export function getAvatarColorHex(name: string): string {
  return AVATAR_PALETTE[hashName(name) % AVATAR_PALETTE.length].hex
}
