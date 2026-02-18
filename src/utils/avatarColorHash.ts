/**
 * Deterministic avatar color hash utility.
 * Maps a name string to a consistent color from the warm palette.
 * Same name always produces the same color across all pages.
 */

const AVATAR_PALETTE = [
  { bg: 'bg-amber-500', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-teal-500', text: 'text-white' },
  { bg: 'bg-rose-500', text: 'text-white' },
  { bg: 'bg-emerald-500', text: 'text-white' },
  { bg: 'bg-violet-500', text: 'text-white' },
  { bg: 'bg-sky-500', text: 'text-white' },
  { bg: 'bg-pink-500', text: 'text-white' },
] as const

export function getAvatarColorClasses(name: string): { bg: string; text: string } {
  if (!name) return AVATAR_PALETTE[0]
  const sum = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length]
}
