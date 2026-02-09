import Calendar from '../components/ui/Calendar'

export default function CalendarDemo() {
  // Sample events data
  const sampleEvents = {
    '2025-08-18': [
      {
        id: '1',
        title: 'חזרת תזמורת סימפונית',
        time: '19:00 - 21:00',
        color: 'blue' as const,
        type: 'חזרה'
      },
      {
        id: '2',
        title: 'שיעור כינור פרטי',
        time: '16:00 - 17:00',
        color: 'green' as const,
        type: 'שיעור פרטי'
      }
    ],
    '2025-08-20': [
      {
        id: '3',
        title: 'קונצרט תלמידים',
        time: '20:00 - 22:00',
        color: 'purple' as const,
        type: 'הופעה'
      }
    ],
    '2025-08-22': [
      {
        id: '4',
        title: 'בחינת בגרות',
        time: '10:00 - 12:00',
        color: 'orange' as const,
        type: 'בחינה'
      }
    ]
  }

  return (
    <div>
      <Calendar events={sampleEvents} />
    </div>
  )
}