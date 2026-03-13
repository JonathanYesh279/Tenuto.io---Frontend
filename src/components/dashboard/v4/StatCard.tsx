// Re-export the shared GlassStatCard as StatCard for backward compatibility
import { GlassStatCard } from '@/components/ui/GlassStatCard'
import type { ChartColorKey } from '@/components/charts/chartColors'

interface StatCardProps {
  entity: 'students' | 'teachers' | 'orchestras' | 'rehearsals'
  value: number | string
  label: string
  trend?: string
  loading?: boolean
  sparkData?: Array<Record<string, any>>
  sparkColor?: ChartColorKey
}

const entityColorMap: Record<string, ChartColorKey> = {
  students: 'violet',
  teachers: 'sky',
  orchestras: 'amber',
  rehearsals: 'rose',
}

export function StatCard({ entity, value, label, trend, loading = false, sparkData, sparkColor }: StatCardProps) {
  const color = sparkColor || entityColorMap[entity] || 'indigo'
  return <GlassStatCard value={value} label={label} trend={trend} loading={loading} sparkData={sparkData} sparkColor={color} />
}
