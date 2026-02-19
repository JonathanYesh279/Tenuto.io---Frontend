import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { PlusIcon } from '@phosphor-icons/react'
import StatsCard from './StatsCard'

export interface HeroMetric {
  title: string
  value: string | number
  icon: ReactNode
}

export interface ListPageHeroProps {
  title: string
  entityColor: 'teachers' | 'students' | 'orchestras'
  metrics: HeroMetric[]
  action?: {
    label: string
    onClick: () => void
  }
}

// Static lookup avoids dynamic Tailwind class generation (tree-shake safety)
// Phase 22: Subdued entity colors — thin accent bar, not vivid pastel backgrounds
const ENTITY_STYLES = {
  teachers: { accentColor: 'hsl(var(--color-teachers-fg))', fg: 'text-teachers-fg' },
  students: { accentColor: 'hsl(var(--color-students-fg))', fg: 'text-students-fg' },
  orchestras: { accentColor: 'hsl(var(--color-orchestras-fg))', fg: 'text-orchestras-fg' },
} as const

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' } },
}

// Cap grid columns at 6
function getGridCols(count: number): string {
  if (count <= 2) return 'grid-cols-2'
  if (count === 3) return 'grid-cols-2 md:grid-cols-3'
  if (count === 4) return 'grid-cols-2 md:grid-cols-4'
  if (count === 5) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
  return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
}

// Note: ListPageHero is transitional — will be eliminated in Plan 06 (list page archetypes)
export function ListPageHero({ title, entityColor, metrics, action }: ListPageHeroProps) {
  const styles = ENTITY_STYLES[entityColor]
  const cappedMetrics = metrics.slice(0, 6)

  return (
    <div
      className="bg-muted/40 border border-border rounded p-6 mb-4"
      style={{ borderRight: `3px solid ${styles.accentColor}` }}
    >
      {/* Header row — RTL: title on right (start), action on left (end) */}
      <div className="flex items-center justify-between mb-4">
        <h1 className={clsx('text-2xl font-bold text-foreground', styles.fg)}>{title}</h1>
        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" weight="fill" />
            {action.label}
          </button>
        )}
      </div>

      {/* Stats grid with stagger entrance animation (Y-axis only — RTL safe) */}
      <motion.div
        className={clsx('grid gap-3', getGridCols(cappedMetrics.length))}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {cappedMetrics.map((metric, index) => (
          <motion.div key={index} variants={itemVariants}>
            <StatsCard
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              color={entityColor}
              coloredBg
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
