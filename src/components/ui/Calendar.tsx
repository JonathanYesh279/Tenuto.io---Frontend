import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Card } from './Card'

interface Event {
  id: string
  title: string
  time: string
  color: 'blue' | 'green' | 'orange' | 'purple'
  type: string
}

interface CalendarProps {
  events?: Record<string, Event[]>
}

const MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
]

const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

export default function Calendar({ events = {} }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())

  const endDate = new Date(lastDayOfMonth)
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()))

  const calendarDays = []
  const currentDay = new Date(startDate)

  while (currentDay <= endDate) {
    calendarDays.push(new Date(currentDay))
    currentDay.setDate(currentDay.getDate() + 1)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-primary-100 text-primary-800 border-primary-200',
      green: 'bg-success-100 text-success-800 border-success-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <div className="flex items-center mr-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <button className="flex items-center px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm">
          <Plus className="w-4 h-4 ml-1" />
          הוסף אירוע
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        {DAYS.map(day => (
          <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((date, index) => {
          const dateKey = getDateKey(date)
          const dayEvents = events[dateKey] || []
          
          return (
            <div
              key={index}
              className={`bg-white p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 ${
                !isCurrentMonth(date) ? 'text-gray-400' : ''
              } ${isSelected(date) ? 'ring-2 ring-primary-500' : ''}`}
              onClick={() => setSelectedDate(date)}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday(date) 
                  ? 'w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center' 
                  : ''
              }`}>
                {date.getDate()}
              </div>
              
              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`px-2 py-1 rounded text-xs border ${getColorClasses(event.color)}`}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-75">{event.time}</div>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 2} נוספים
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Date Events */}
      {selectedDate && events[getDateKey(selectedDate)]?.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">
            אירועים ב-{selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}
          </h4>
          <div className="space-y-2">
            {events[getDateKey(selectedDate)].map(event => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${getColorClasses(event.color)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm opacity-75">{event.type}</div>
                  </div>
                  <div className="text-sm">{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}