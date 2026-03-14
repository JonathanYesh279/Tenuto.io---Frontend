import { DotsThreeIcon } from '@phosphor-icons/react'
import { VerticalAutoScroll } from '../../animations/VerticalAutoScroll'

interface AgendaEvent {
  time: string
  title: string
  location?: string
  badge?: string
}

interface AgendaWidgetProps {
  events?: AgendaEvent[]
  loading?: boolean
}

// Mock data for development
const MOCK_EVENTS: AgendaEvent[] = [
  {
    time: '09:00',
    title: 'חזרת תזמורת מיתרים',
    location: 'אולם ראשי',
    badge: 'חזרה'
  },
  {
    time: '14:30',
    title: 'שיעור תיאוריה כיתה ז',
    location: 'כיתה 3',
    badge: 'תיאוריה'
  },
  {
    time: '16:00',
    title: 'פגישת הנהלה',
    location: 'משרד',
    badge: 'ניהול'
  }
]

const COLOR_VARIANTS = [
  {
    bg: 'bg-indigo-50/50 dark:bg-indigo-900/10',
    border: 'border-indigo-100/50 dark:border-indigo-800/20',
    time: 'text-indigo-500',
    title: 'text-indigo-900 dark:text-indigo-100',
    detail: 'text-indigo-600/70 dark:text-indigo-400'
  },
  {
    bg: 'bg-amber-50/50 dark:bg-amber-900/10',
    border: 'border-amber-100/50 dark:border-amber-800/20',
    time: 'text-amber-500',
    title: 'text-amber-900 dark:text-amber-100',
    detail: 'text-amber-600/70 dark:text-amber-400'
  },
  {
    bg: 'bg-sky-50/50 dark:bg-sky-900/10',
    border: 'border-sky-100/50 dark:border-sky-800/20',
    time: 'text-sky-500',
    title: 'text-sky-900 dark:text-sky-100',
    detail: 'text-sky-600/70 dark:text-sky-400'
  }
]

export function AgendaWidget({ events, loading }: AgendaWidgetProps) {
  const displayEvents = events || []

  if (loading) {
    return (
      <div className="bg-white dark:bg-sidebar-dark p-6 rounded-md shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-sm">סדר יום</h3>
          <DotsThreeIcon size={20} weight="bold" className="text-slate-400" />
        </div>
        <div className="flex items-center justify-center h-32 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-white dark:bg-sidebar-dark p-6 rounded-md shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-sm">סדר יום</h3>
        <button className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors">
          <DotsThreeIcon size={20} weight="bold" className="text-slate-400" />
        </button>
      </div>

      {displayEvents.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-slate-400">
          אין פעילויות היום
        </div>
      ) : (
      <VerticalAutoScroll speed={20} height={200}>
        <div className="space-y-4">
          {displayEvents.map((event, index) => {
            const variant = COLOR_VARIANTS[index % COLOR_VARIANTS.length]

            return (
              <div
                key={index}
                className={`p-4 rounded-md border ${variant.bg} ${variant.border}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold ${variant.time}`}>
                    {event.time}
                  </span>
                  {event.badge && (
                    <span className="text-[9px] font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm">
                      {event.badge}
                    </span>
                  )}
                </div>
                <h4 className={`text-sm font-bold mb-1 ${variant.title}`}>
                  {event.title}
                </h4>
                {event.location && (
                  <p className={`text-[11px] ${variant.detail}`}>
                    {event.location}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </VerticalAutoScroll>
      )}
    </div>
  )
}
