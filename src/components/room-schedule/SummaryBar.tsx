import { Accordion, AccordionItem } from '@heroui/react'
import { GlassStatCard } from '@/components/ui/GlassStatCard'
import { ChartBar } from '@phosphor-icons/react'

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
  return (
    <Accordion
      isCompact
      variant="light"
      defaultExpandedKeys={[]}
      className="px-0 shrink-0"
    >
      <AccordionItem
        key="stats"
        aria-label="סטטיסטיקות"
        classNames={{
          trigger: 'py-1',
          title: 'text-xs',
        }}
        title={
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
            <ChartBar size={13} weight="duotone" />
            <span>{totalRooms} חדרים</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{occupiedSlots} תפוסות</span>
            {conflictCount > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-red-600">{conflictCount} התנגשויות</span>
              </>
            )}
          </div>
        }
      >
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <GlassStatCard key={i} value={0} label="" size="sm" loading />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <GlassStatCard value={totalRooms} label="חדרים" size="sm" />
            <GlassStatCard value={occupiedSlots} label="משבצות תפוסות" size="sm" />
            <GlassStatCard value={freeSlots} label="משבצות פנויות" size="sm" />
            <GlassStatCard
              value={conflictCount}
              label="התנגשויות"
              size="sm"
              valueClassName={conflictCount > 0 ? 'text-red-600' : undefined}
            />
          </div>
        )}
      </AccordionItem>
    </Accordion>
  )
}
