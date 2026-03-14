interface StageDistributionPanelProps {
  students: Array<{ stageLevel: number }>
  loading?: boolean
}

const STAGE_COLORS = [
  '#3b82f6', // 1
  '#6366f1', // 2
  '#8b5cf6', // 3
  '#a855f7', // 4
  '#d946ef', // 5
  '#ec4899', // 6
  '#f43f5e', // 7
  '#ef4444', // 8
]

export function StageDistributionPanel({ students, loading = false }: StageDistributionPanelProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-sidebar-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 px-4 py-3 animate-pulse">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-12" />
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Count students per stage (1-8)
  const stageCounts: number[] = Array(8).fill(0)
  students.forEach(s => {
    const stage = s.stageLevel
    if (stage >= 1 && stage <= 8) {
      stageCounts[stage - 1]++
    }
  })

  const maxCount = Math.max(...stageCounts, 1)

  return (
    <div className="bg-white dark:bg-sidebar-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 px-4 py-3 flex flex-col h-full overflow-hidden">
      <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">התפלגות שלבים</h3>

      <div className="space-y-1.5 flex-1 overflow-y-auto">
        {stageCounts.map((count, idx) => {
          const stage = idx + 1
          const color = STAGE_COLORS[idx]
          const pct = Math.round((count / maxCount) * 100)
          return (
            <div key={stage}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">שלב {stage}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{count}</span>
              </div>
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: count > 0 ? `${pct}%` : '0%', backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
