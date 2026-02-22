interface RoleDistributionPanelProps {
  teachers: Array<{ roles: string[] }>
  loading?: boolean
}

const ROLE_COLORS: Record<string, string> = {
  'מורה': '#3b82f6',
  'ניצוח': '#8b5cf6',
  'מדריך הרכב': '#f59e0b',
  'מנהל': '#ef4444',
  'תאוריה': '#10b981',
  'מגמה': '#ec4899',
  'ליווי פסנתר': '#ec4899',
  'הלחנה': '#f59e0b',
  // Backward compatibility
  'מנצח': '#8b5cf6',
  'מורה תאוריה': '#10b981',
}

export function RoleDistributionPanel({ teachers, loading = false }: RoleDistributionPanelProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-sidebar-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 px-4 py-3 animate-pulse">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-16" />
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Count teachers per role
  const roleCounts: Record<string, number> = {}
  teachers.forEach(t => {
    (t.roles || []).forEach(role => {
      roleCounts[role] = (roleCounts[role] || 0) + 1
    })
  })

  const sorted = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])
  const maxCount = sorted.length > 0 ? sorted[0][1] : 1

  return (
    <div className="bg-white dark:bg-sidebar-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 px-4 py-3 flex flex-col h-full overflow-hidden">
      <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">התפלגות תפקידים</h3>

      {sorted.length === 0 ? (
        <p className="text-[10px] text-slate-400 text-center py-2">אין נתוני תפקידים</p>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {sorted.map(([role, count]) => {
            const color = ROLE_COLORS[role] || '#94a3b8'
            const pct = Math.round((count / maxCount) * 100)
            return (
              <div key={role}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{role}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{count}</span>
                </div>
                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
