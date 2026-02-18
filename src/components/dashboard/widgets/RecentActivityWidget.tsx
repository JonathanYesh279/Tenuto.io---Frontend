import { Card } from '../../ui/Card'
import { motion } from 'framer-motion'

interface Activity {
  type: string
  title: string
  description: string
  time: string
  color: string
}

interface RecentActivityWidgetProps {
  activities: Activity[]
  loading: boolean
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const listItemVariants = {
  hidden: { y: 8, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.15 } }
}

export function RecentActivityWidget({ activities, loading }: RecentActivityWidgetProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">פעילות אחרונה</h3>
      </div>
      <div className="space-y-3 max-h-[280px] overflow-y-auto">
        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-4">טוען...</div>
        ) : activities.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">אין פעילות אחרונה</div>
        ) : (
          <motion.div
            className="space-y-3"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {activities.map((activity, i) => (
              <motion.div
                key={i}
                variants={listItemVariants}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  activity.color === 'primary' ? 'bg-students-fg' : 'bg-orchestras-fg'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Card>
  )
}
