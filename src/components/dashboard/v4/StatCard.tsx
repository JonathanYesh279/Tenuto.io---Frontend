import React from 'react'

interface StatCardProps {
  entity: 'students' | 'teachers' | 'orchestras' | 'rehearsals'
  value: number | string
  label: string
  trend?: string
  loading?: boolean
}

function WaveIcon() {
  return (
    <svg width="36" height="18" viewBox="0 0 36 18" fill="none" className="text-white/40">
      <path
        d="M2 9C5 3 8 15 12 9C16 3 19 15 23 9C27 3 30 15 34 9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function StatCard({ entity, value, label, trend, loading = false }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-200 to-cyan-200 dark:from-sky-800 dark:to-cyan-800 p-5 rounded-2xl animate-pulse">
        <div className="flex justify-between items-start mb-3">
          <div className="w-12 h-5 bg-white/30 rounded-full"></div>
          <div className="w-8 h-8 bg-white/20 rounded"></div>
        </div>
        <div className="h-8 bg-white/30 rounded w-20 mb-1.5"></div>
        <div className="h-4 bg-white/20 rounded w-24"></div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-sky-200 to-cyan-200 dark:from-sky-800 dark:to-cyan-800 p-5 rounded-2xl relative overflow-hidden">
      <div className="flex justify-between items-start mb-3">
        {trend && (
          <span className="bg-white/60 dark:bg-white/20 text-sky-800 dark:text-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <span>↑</span> {trend}
          </span>
        )}
        {!trend && <span />}
        <WaveIcon />
      </div>
      <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-0.5">
        {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
      </h3>
      <p className="text-xs font-bold text-sky-800/60 dark:text-sky-200/60">{label}</p>
    </div>
  )
}
