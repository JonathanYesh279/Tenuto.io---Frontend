import { ACTIVITY_COLORS } from './ActivityCell'

// ==================== Types ====================

interface UnassignedActivity {
  id: string
  source: 'timeBlock' | 'rehearsal' | 'theory'
  startTime: string
  endTime: string
  teacherName: string
  label: string
  activityType: string
}

interface UnassignedRowProps {
  activities: UnassignedActivity[]
}

// ==================== Component ====================

export default function UnassignedRow({ activities }: UnassignedRowProps) {
  if (activities.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      {/* Header with count badge */}
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-amber-800">(ללא חדר)</h3>
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-amber-200 text-amber-800 rounded-full">
          {activities.length}
        </span>
      </div>

      {/* Activity cards */}
      <div className="flex flex-wrap gap-2">
        {activities.map((activity) => {
          const colors = ACTIVITY_COLORS[activity.source] || ACTIVITY_COLORS.timeBlock

          return (
            <div
              key={activity.id}
              className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs opacity-80 ${colors.text}`}
            >
              <div className="font-medium">{activity.teacherName}</div>
              <div className="opacity-80">{activity.label}</div>
              <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                {activity.startTime} - {activity.endTime}
              </div>
              <div className="mt-0.5">
                <span
                  className={`inline-block px-1 py-0.5 rounded text-[10px] ${colors.bg} ${colors.text}`}
                >
                  {colors.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
