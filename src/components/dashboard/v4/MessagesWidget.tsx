import { UserCircleIcon, MusicNotesIcon } from '@phosphor-icons/react'

interface Activity {
  type: string
  title: string
  description: string
  time: string
  color: string
}

interface MessagesWidgetProps {
  activities?: Activity[]
  loading?: boolean
  // Legacy props for backwards compat
  messages?: any[]
}

export function MessagesWidget({ activities, loading }: MessagesWidgetProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-sm">פעילות אחרונה</h3>
        </div>
        <div className="flex items-center justify-center h-32 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const displayItems = activities && activities.length > 0 ? activities.slice(0, 4) : []

  if (displayItems.length === 0) {
    return (
      <div className="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-sm">פעילות אחרונה</h3>
        </div>
        <p className="text-center text-sm text-slate-400 py-8">אין פעילות אחרונה</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-sm">פעילות אחרונה</h3>
      </div>

      <div className="space-y-6">
        {displayItems.map((item, index) => (
          <div key={index} className="flex gap-3">
            <div className="w-10 h-10 shrink-0 text-slate-300 dark:text-slate-600">
              {item.type === 'student' ? (
                <UserCircleIcon size={40} weight="fill" />
              ) : (
                <MusicNotesIcon size={40} weight="fill" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold truncate">{item.title}</span>
                <span className="text-[9px] text-slate-400 shrink-0">{item.time}</span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
