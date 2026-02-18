import Calendar from '../../ui/Calendar'

interface MiniCalendarWidgetProps {
  events?: Record<string, any[]>
}

export function MiniCalendarWidget({ events = {} }: MiniCalendarWidgetProps) {
  // Calendar.tsx renders its own Card wrapper with month navigation.
  // We render it directly to avoid double-Card nesting.
  return <Calendar events={events} />
}
