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
    <div
      className="relative p-6 rounded-3xl overflow-hidden backdrop-blur-2xl dark:border-white/20"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(186,230,253,0.25) 50%, rgba(255,255,255,0.5) 100%)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'rgba(255,255,255,0.8)',
        boxShadow: `
          0 8px 32px rgba(0,140,210,0.12),
          0 2px 8px rgba(0,140,210,0.06),
          inset 0 1px 1px rgba(255,255,255,0.9),
          inset 0 -1px 2px rgba(0,140,210,0.04)
        `,
      }}
    >
      {/* Top glossy reflection band */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[40%] rounded-t-3xl"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)',
        }}
      />
      {/* Corner light bloom */}
      <div
        className="pointer-events-none absolute -top-[25%] -left-[15%] w-[60%] h-[60%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(186,230,253,0.15) 50%, transparent 70%)',
        }}
      />
      {/* Top edge highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-3xl"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.95) 50%, transparent 90%)' }}
      />

      {/* Month navigation */}
      <div className="relative flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-1 text-slate-500 hover:text-primary transition-colors"
          aria-label="Previous month"
        >
          <CaretRightIcon size={18} />
        </button>
        <h3 className="font-bold text-sm text-slate-800 dark:text-white">
          {format(currentDate, 'MMMM yyyy', { locale: he })}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 text-slate-500 hover:text-primary transition-colors"
          aria-label="Next month"
        >
          <CaretLeftIcon size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="relative grid grid-cols-7 gap-1 text-center">
        {/* Day headers */}
        {HEBREW_DAYS.map((day) => (
          <div key={day} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
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
                    : 'hover:bg-white/50 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100'
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
