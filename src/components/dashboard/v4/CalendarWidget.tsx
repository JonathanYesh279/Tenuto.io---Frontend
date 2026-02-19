import { useState } from 'react'
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, format, getDay, startOfWeek, addMonths, subMonths } from 'date-fns'
import { he } from 'date-fns/locale'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'

const HEBREW_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Calculate padding days at start of month
  const startDayOfWeek = getDay(monthStart) // 0 = Sunday
  const paddingDays = Array(startDayOfWeek).fill(null)

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div className="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-1 text-slate-400 hover:text-primary transition-colors"
          aria-label="Previous month"
        >
          <CaretRightIcon size={18} />
        </button>
        <h3 className="font-bold text-sm">
          {format(currentDate, 'MMMM yyyy', { locale: he })}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 text-slate-400 hover:text-primary transition-colors"
          aria-label="Next month"
        >
          <CaretLeftIcon size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Day headers */}
        {HEBREW_DAYS.map((day) => (
          <div key={day} className="text-[10px] font-bold text-slate-400 uppercase mb-2">
            {day}
          </div>
        ))}

        {/* Padding days */}
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} className="p-2"></div>
        ))}

        {/* Date cells */}
        {daysInMonth.map((date) => {
          const isToday = isSameDay(date, new Date())
          const isSelected = isSameDay(date, selectedDate)

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              className={`
                p-2 text-xs font-semibold rounded-xl transition-colors
                ${
                  isSelected || isToday
                    ? 'bg-primary text-white shadow-md shadow-primary/20 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
                }
              `}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
