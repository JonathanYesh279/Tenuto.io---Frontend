import { BuildingOffice, CheckCircle, MinusCircle, WarningCircle } from '@phosphor-icons/react'
import StatsCard from '@/components/ui/StatsCard'

// ==================== Types ====================

interface SummaryBarProps {
  totalRooms: number
  occupiedSlots: number
  freeSlots: number
  conflictCount: number
  loading?: boolean
}

// ==================== Component ====================

export default function SummaryBar({
  totalRooms,
  occupiedSlots,
  freeSlots,
  conflictCount,
  loading = false,
}: SummaryBarProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatsCard
        title="חדרים"
        value={totalRooms}
        icon={<BuildingOffice size={24} weight="duotone" />}
        color="blue"
      />
      <StatsCard
        title="משבצות תפוסות"
        value={occupiedSlots}
        icon={<CheckCircle size={24} weight="duotone" />}
        color="green"
      />
      <StatsCard
        title="משבצות פנויות"
        value={freeSlots}
        icon={<MinusCircle size={24} weight="duotone" />}
        color="gray"
      />
      <StatsCard
        title="התנגשויות"
        value={conflictCount}
        icon={<WarningCircle size={24} weight="duotone" />}
        color={conflictCount === 0 ? 'green' : 'red'}
      />
    </div>
  )
}
