import React, { useCallback } from 'react'
import { SparkChart } from '../charts/SparkChart'
import type { ChartColorKey } from '../charts/chartColors'

interface GlassStatCardProps {
  value: number | string
  label: string
  trend?: string
  loading?: boolean
  className?: string
  /** 'default' for dashboard, 'sm' for list pages */
  size?: 'default' | 'sm'
  /** Optional spark trend data — replaces the static SVG icon */
  sparkData?: Array<Record<string, any>>
  /** Color for the spark chart */
  sparkColor?: ChartColorKey
}

export const GlassStatCard: React.FC<GlassStatCardProps> = ({ value, label, trend, loading = false, className = '', size = 'default', sparkData, sparkColor = 'indigo' }) => {
  const isSmall = size === 'sm'

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    e.currentTarget.style.setProperty('--glow-x', `${x}%`)
    e.currentTarget.style.setProperty('--glow-y', `${y}%`)
    e.currentTarget.style.setProperty('--glow-opacity', '0.8')
  }, [])

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--glow-opacity', '0')
  }, [])

  if (loading) {
    return (
      <div className={`p-5 rounded-md animate-pulse backdrop-blur-xl bg-white/30 dark:bg-white/10 border border-white/60 dark:border-white/20 ${className}`}>
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
    <div
      className={`border-glow relative ${isSmall ? 'p-3' : 'p-5'} rounded-md overflow-hidden backdrop-blur-2xl border dark:border-white/20 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(167,230,210,0.3) 35%, rgba(186,230,253,0.3) 65%, rgba(255,255,255,0.45) 100%)',
        borderColor: 'rgba(255,255,255,0.8)',
        boxShadow: `
          0 8px 32px rgba(0,170,160,0.12),
          0 2px 8px rgba(0,140,210,0.08),
          inset 0 1px 1px rgba(255,255,255,0.9),
          inset 0 -1px 2px rgba(0,170,160,0.06)
        `,
      }}
    >
      {/* Primary glossy reflection — top band */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[45%] rounded-t-md"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 60%, transparent 100%)',
        }}
      />
      {/* Corner light bloom */}
      <div
        className="pointer-events-none absolute -top-[30%] -left-[20%] w-[70%] h-[70%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(167,230,210,0.25) 50%, transparent 70%)',
        }}
      />
      {/* Bottom-right subtle warm reflection */}
      <div
        className="pointer-events-none absolute -bottom-[20%] -right-[15%] w-[50%] h-[50%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(167,230,210,0.2) 0%, transparent 65%)',
        }}
      />
      {/* Edge highlight — thin top line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-md"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.95) 50%, transparent 90%)' }}
      />

      <div className={`relative flex justify-between items-start ${isSmall ? 'mb-1' : 'mb-3'}`}>
        {trend && (
          <span
            className="text-teal-800 dark:text-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 backdrop-blur-sm"
            style={{
              background: 'rgba(255,255,255,0.65)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(0,170,160,0.1)',
            }}
          >
            <span>↑</span> {trend}
          </span>
        )}
        {!trend && <span />}
        {sparkData && sparkData.length > 0 ? (
          <SparkChart
            data={sparkData}
            index="month"
            categories={['value']}
            color={sparkColor}
            className={isSmall ? 'h-8 w-20' : 'h-10 w-24'}
          />
        ) : (
          <svg width={isSmall ? 28 : 40} height={isSmall ? 14 : 22} viewBox="0 0 40 22" fill="none" className="text-white/50">
            <path
              d="M2 18L8 14L13 16L18 8L23 10L28 4L34 6L38 2"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <h3 className={`relative font-extrabold text-slate-900 dark:text-white mb-0.5 ${isSmall ? 'text-2xl' : 'text-2xl'}`}>
        {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
      </h3>
      <p className={`relative font-bold text-teal-800/80 dark:text-teal-200/60 ${isSmall ? 'text-xs' : 'text-xs'}`}>{label}</p>
    </div>
  )
}
