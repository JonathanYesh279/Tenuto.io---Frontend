import ActivityCell from './ActivityCell'
import type { ActivityData } from './ActivityCell'

interface DragOverlayContentProps {
  activity: ActivityData
}

export default function DragOverlayContent({ activity }: DragOverlayContentProps) {
  return (
    <div className="w-40 opacity-90 shadow-lg pointer-events-none">
      <ActivityCell activity={activity} />
    </div>
  )
}
