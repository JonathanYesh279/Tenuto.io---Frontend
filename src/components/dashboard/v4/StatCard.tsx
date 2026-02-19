import React from 'react'

interface StatCardProps {
  entity: 'students' | 'teachers' | 'orchestras' | 'rehearsals'
  value: number | string
  label: string
  trend?: string          // e.g., "+12%", "8 פעילים", "גבוה"
  icon: React.ReactNode   // Phosphor icon element
  loading?: boolean
}

const ENTITY_STYLES = {
  students: {
    bg: 'bg-indigo-50/50 dark:bg-indigo-900/10',
    border: 'border-indigo-100 dark:border-indigo-800/30',
    text: 'text-indigo-600/70 dark:text-indigo-400/70',
    icon: 'text-indigo-500',
    trend: 'text-indigo-600 dark:text-indigo-400'
  },
  teachers: {
    bg: 'bg-amber-50/50 dark:bg-amber-900/10',
    border: 'border-amber-100 dark:border-amber-800/30',
    text: 'text-amber-600/70 dark:text-amber-400/70',
    icon: 'text-amber-500',
    trend: 'text-amber-600 dark:text-amber-400'
  },
  orchestras: {
    bg: 'bg-sky-50/50 dark:bg-sky-900/10',
    border: 'border-sky-100 dark:border-sky-800/30',
    text: 'text-sky-600/70 dark:text-sky-400/70',
    icon: 'text-sky-500',
    trend: 'text-sky-600 dark:text-sky-400'
  },
  rehearsals: {
    bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
    border: 'border-emerald-100 dark:border-emerald-800/30',
    text: 'text-emerald-600/70 dark:text-emerald-400/70',
    icon: 'text-emerald-500',
    trend: 'text-emerald-600 dark:text-emerald-400'
  }
}

export function StatCard({ entity, value, label, trend, icon, loading = false }: StatCardProps) {
  const styles = ENTITY_STYLES[entity]

  if (loading) {
    return (
      <div className={`${styles.bg} p-6 rounded-3xl border ${styles.border} animate-pulse`}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          {trend && <div className="w-12 h-5 bg-slate-200 dark:bg-slate-700 rounded"></div>}
        </div>
        <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
      </div>
    )
  }

  return (
    <div className={`${styles.bg} p-6 rounded-3xl border ${styles.border}`}>
      <div className="flex justify-between items-start mb-4">
        <span className={`${styles.icon} text-3xl`}>{icon}</span>
        {trend && (
          <span className={`bg-white/80 dark:bg-slate-800 ${styles.trend} text-[10px] font-bold px-2 py-1 rounded-lg`} dir="ltr">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-extrabold mb-1">
        {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
      </h3>
      <p className={`text-sm font-bold ${styles.text}`}>{label}</p>
    </div>
  )
}
