import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from '@/components/ui/animated-tabs'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { smooth } from '@/lib/motionTokens'
import { cn } from '@/lib/utils'

/* ─── Types ─── */

export interface DashboardChartSectionProps {
  comboChartTitle: string
  comboChartContent: React.ReactNode
  activityChartTitle: string
  activityChartContent: React.ReactNode
  instrumentChartTitle: string
  instrumentChartContent: React.ReactNode
}

/* ─── FocusableChartCard — desktop only ─── */

function FocusableChartCard({
  title,
  children,
  className,
  focused,
  onToggleFocus,
}: {
  title: string
  children: React.ReactNode
  className?: string
  focused?: boolean
  onToggleFocus?: () => void
}) {
  return (
    <div
      className={cn(
        'relative bg-white dark:bg-sidebar-dark p-6 rounded-md shadow-sm border overflow-hidden',
        focused
          ? 'border-primary/30 shadow-md'
          : 'border-slate-100 dark:border-slate-800',
        className
      )}
    >
      <h3
        className={cn(
          'text-base font-bold text-slate-900 dark:text-white mb-4',
          onToggleFocus && 'cursor-pointer hover:text-primary transition-colors'
        )}
        onClick={onToggleFocus}
      >
        {title}
        {onToggleFocus && (
          <span className="text-xs font-normal text-slate-400 mr-2">
            {focused ? '(לחץ לכווץ)' : '(לחץ להרחבה)'}
          </span>
        )}
      </h3>
      {children}
    </div>
  )
}

/* ─── SimpleChartCard — mobile only (no focus mode) ─── */

function SimpleChartCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative bg-white dark:bg-sidebar-dark p-6 rounded-md shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden',
        className
      )}
    >
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
        {title}
      </h3>
      {children}
    </div>
  )
}

/* ─── Glassmorphic wrapper for instrument chart ─── */

function GlassmorphicCard({
  title,
  children,
  focused,
  onToggleFocus,
}: {
  title: string
  children: React.ReactNode
  focused?: boolean
  onToggleFocus?: () => void
}) {
  return (
    <div
      className={cn(
        'relative rounded-md overflow-hidden border p-6',
        focused
          ? 'border-primary/30 shadow-md'
          : 'border-white/60 dark:border-white/20'
      )}
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(167,230,210,0.3) 35%, rgba(186,230,253,0.3) 65%, rgba(255,255,255,0.45) 100%)',
        boxShadow:
          '0 8px 32px rgba(0,170,160,0.12), 0 2px 8px rgba(0,140,210,0.08), inset 0 1px 1px rgba(255,255,255,0.9)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[40%] rounded-t-md"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
        }}
      />
      <h3
        className={cn(
          'relative text-base font-bold text-slate-900 dark:text-white mb-4',
          onToggleFocus && 'cursor-pointer hover:text-primary transition-colors'
        )}
        onClick={onToggleFocus}
      >
        {title}
        {onToggleFocus && (
          <span className="text-xs font-normal text-slate-400 mr-2">
            {focused ? '(לחץ לכווץ)' : '(לחץ להרחבה)'}
          </span>
        )}
      </h3>
      {children}
    </div>
  )
}

/* ─── Main Component ─── */

export function DashboardChartSection({
  comboChartTitle,
  comboChartContent,
  activityChartTitle,
  activityChartContent,
  instrumentChartTitle,
  instrumentChartContent,
}: DashboardChartSectionProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [focusedChart, setFocusedChart] = useState<string | null>(null)

  const toggleFocus = (id: string) => {
    setFocusedChart((prev) => (prev === id ? null : id))
  }

  // Escape key closes focus mode
  useEffect(() => {
    if (focusedChart === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFocusedChart(null)
        e.stopPropagation()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [focusedChart])

  /* ── Mobile: tabbed interface ── */
  if (!isDesktop) {
    return (
      <Tabs defaultValue="combo">
        <TabsList className="w-full">
          <TabsTrigger value="combo">רישומים ופעילות</TabsTrigger>
          <TabsTrigger value="activity">פעילויות לפי יום</TabsTrigger>
          <TabsTrigger value="instruments">התפלגות כלים</TabsTrigger>
        </TabsList>
        <TabsContents transition={smooth}>
          <TabsContent value="combo">
            <SimpleChartCard title={comboChartTitle}>
              {comboChartContent}
            </SimpleChartCard>
          </TabsContent>
          <TabsContent value="activity">
            <SimpleChartCard title={activityChartTitle}>
              {activityChartContent}
            </SimpleChartCard>
          </TabsContent>
          <TabsContent value="instruments">
            <GlassmorphicCard title={instrumentChartTitle}>
              {instrumentChartContent}
            </GlassmorphicCard>
          </TabsContent>
        </TabsContents>
      </Tabs>
    )
  }

  /* ── Desktop: grid with focus mode ── */
  const charts = [
    { id: 'combo', title: comboChartTitle, content: comboChartContent, type: 'standard' as const },
    { id: 'activity', title: activityChartTitle, content: activityChartContent, type: 'standard' as const },
    { id: 'instruments', title: instrumentChartTitle, content: instrumentChartContent, type: 'glassmorphic' as const },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {charts.map((chart) => {
        const isFocused = focusedChart === chart.id
        return (
          <motion.div
            key={chart.id}
            layout
            transition={smooth}
            className={cn(isFocused && 'lg:col-span-3')}
          >
            {chart.type === 'glassmorphic' ? (
              <GlassmorphicCard
                title={chart.title}
                focused={isFocused}
                onToggleFocus={() => toggleFocus(chart.id)}
              >
                {chart.content}
              </GlassmorphicCard>
            ) : (
              <FocusableChartCard
                title={chart.title}
                focused={isFocused}
                onToggleFocus={() => toggleFocus(chart.id)}
              >
                <div className={cn(isFocused && 'h-80')}>
                  {chart.content}
                </div>
              </FocusableChartCard>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
