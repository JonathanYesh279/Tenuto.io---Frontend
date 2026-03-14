/**
 * Shared workload color coding utility for teacher weekly hours.
 * Returns Tailwind class names for background, text, and a Hebrew label.
 */
export function getWorkloadColor(hours: number): { bg: string; text: string; label: string } {
  if (hours >= 20) {
    return { bg: 'bg-red-50', text: 'text-red-700', label: 'עומס גבוה' }
  }
  if (hours >= 15) {
    return { bg: 'bg-amber-50', text: 'text-amber-700', label: 'עומס בינוני' }
  }
  return { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'תקין' }
}
