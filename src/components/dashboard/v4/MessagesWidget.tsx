import { UserIcon } from '@phosphor-icons/react'

interface Message {
  name: string
  avatar?: string | null
  time: string
  preview: string
}

interface MessagesWidgetProps {
  messages?: Message[]
  loading?: boolean
}

// TODO: Wire to notifications/messages API when available
const MOCK_MESSAGES: Message[] = [
  {
    name: 'שרה כהן',
    time: 'לפני 2 דק\'',
    preview: 'התווים להרכב הצ\'לו עודכנו בספרייה.'
  },
  {
    name: 'דוד לוי',
    time: 'לפני שעה',
    preview: 'נוכל לדחות את ישיבת הסגל?'
  },
  {
    name: 'מיכל אברהם',
    time: 'לפני 3 שעות',
    preview: 'קיבלתי את הרשימה המעודכנת של תלמידי התזמורת. תודה רבה!'
  }
]

export function MessagesWidget({ messages, loading }: MessagesWidgetProps) {
  // Use mock data since there's no messages API yet
  const displayMessages = messages && messages.length > 0 ? messages : MOCK_MESSAGES

  if (loading) {
    return (
      <div className="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-sm">הודעות</h3>
          <span className="text-primary text-[11px] font-bold uppercase">הצג הכל</span>
        </div>
        <div className="flex items-center justify-center h-32 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-sm">הודעות</h3>
        <button className="text-primary text-[11px] font-bold uppercase hover:underline">
          הצג הכל
        </button>
      </div>

      <div className="space-y-6">
        {displayMessages.map((message, index) => (
          <div key={index} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
              <UserIcon size={20} weight="regular" className="text-slate-400 dark:text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold truncate">{message.name}</span>
                <span className="text-[9px] text-slate-400 shrink-0">{message.time}</span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {message.preview}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
