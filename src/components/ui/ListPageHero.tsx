import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
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
const ENTITY_STYLES = {
  teachers: { bg: 'bg-teachers-bg', fg: 'text-teachers-fg', btnBg: 'bg-teachers-fg' },
  students: { bg: 'bg-students-bg', fg: 'text-students-fg', btnBg: 'bg-students-fg' },
  orchestras: { bg: 'bg-orchestras-bg', fg: 'text-orchestras-fg', btnBg: 'bg-orchestras-fg' },
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

export function ListPageHero({ title, entityColor, metrics, action }: ListPageHeroProps) {
  const styles = ENTITY_STYLES[entityColor]
  const cappedMetrics = metrics.slice(0, 6)

  return (
    <div className={clsx('rounded-xl p-6 mb-4', styles.bg)}>
      {/* Header row — RTL: title on right (start), action on left (end) */}
      <div className="flex items-center justify-between mb-4">
        <h1 className={clsx('text-2xl font-bold', styles.fg)}>{title}</h1>
        {action && (
          <button
            onClick={action.onClick}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity',
              styles.btnBg
            )}
          >
            <Plus className="w-4 h-4" />
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
