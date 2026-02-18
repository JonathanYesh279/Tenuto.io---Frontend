import { Card } from '../../ui/Card'
import { Music } from 'lucide-react'
import { motion } from 'framer-motion'

interface UpcomingEvent {
  title: string
  date: string
  description: string
  isPrimary: boolean
}

interface UpcomingEventsWidgetProps {
  events: UpcomingEvent[]
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

export function UpcomingEventsWidget({ events, loading }: UpcomingEventsWidgetProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">אירועים קרובים</h3>
      </div>
      <div className="space-y-3 max-h-[240px] overflow-y-auto">
        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-4">טוען...</div>
        ) : events.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">אין אירועים קרובים</div>
        ) : (
          <motion.div
            className="space-y-3"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {events.map((event, i) => (
              <motion.div
                key={i}
                variants={listItemVariants}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/40"
              >
                <div className="w-7 h-7 rounded-md bg-orchestras-bg flex items-center justify-center flex-shrink-0">
                  <Music className="w-3.5 h-3.5 text-orchestras-fg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.date} · {event.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Card>
  )
}
