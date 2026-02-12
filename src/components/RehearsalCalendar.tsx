import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users, Eye, Edit, Trash2 } from 'lucide-react'
import AdditionalRehearsalsModal from './AdditionalRehearsalsModal'
import {
  formatRehearsalDateTime,
  getRehearsalStatus,
  calculateAttendanceStats,
  getRehearsalColor,
  getDayName,
  VALID_DAYS_OF_WEEK,
  type Rehearsal
} from '../utils/rehearsalUtils'

interface RehearsalCalendarProps {
  rehearsals: Rehearsal[]
  viewMode: 'week' | 'month'
  selectedDate?: Date
  onSelectDate?: (date: Date) => void
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
  onNavigateToRehearsal?: (rehearsalId: string) => void
  className?: string
}

export default function RehearsalCalendar({
  rehearsals,
  viewMode,
  selectedDate = new Date(),
  onSelectDate,
  onRehearsalClick,
  onEditRehearsal,
  onDeleteRehearsal,
  onViewDetails,
  onNavigateToRehearsal,
  className = ''
}: RehearsalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [showAdditionalModal, setShowAdditionalModal] = useState(false)
  const [additionalRehearsals, setAdditionalRehearsals] = useState<Rehearsal[]>([])

  // Sync with parent's selectedDate changes (e.g., auto-navigation)
  useEffect(() => {
    if (selectedDate.getTime() !== currentDate.getTime()) {
      setCurrentDate(selectedDate)
    }
  }, [selectedDate])
  const [modalDate, setModalDate] = useState<Date>(new Date())
  
  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
    onSelectDate?.(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    onSelectDate?.(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onSelectDate?.(today)
  }

  // Handle showing additional rehearsals modal
  const handleShowAdditional = (date: Date, rehearsals: Rehearsal[]) => {
    setModalDate(date)
    setAdditionalRehearsals(rehearsals)
    setShowAdditionalModal(true)
  }

  // Handle rehearsal click from modal
  const handleModalRehearsalClick = (rehearsal: Rehearsal) => {
    setShowAdditionalModal(false)
    onNavigateToRehearsal?.(rehearsal._id)
  }

  // Get calendar data based on view mode
  const calendarData = useMemo(() => {
    if (viewMode === 'week') {
      return getWeekData(currentDate, rehearsals)
    } else {
      return getMonthData(currentDate, rehearsals)
    }
  }, [currentDate, rehearsals, viewMode])

  // Header text
  const headerText = useMemo(() => {
    if (viewMode === 'week') {
      const startOfWeek = getStartOfWeek(currentDate)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}`
      } else {
        return `${startOfWeek.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}`
      }
    } else {
      return currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    }
  }, [currentDate, viewMode])

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">{headerText}</h3>
        </div>
        
        <button
          onClick={goToToday}
          className="px-3 py-1 text-sm text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
        >
          היום
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {viewMode === 'week' ? (
          <WeekView 
            weekData={calendarData as WeekData}
            onRehearsalClick={onRehearsalClick}
            onEditRehearsal={onEditRehearsal}
            onDeleteRehearsal={onDeleteRehearsal}
            onViewDetails={onViewDetails}
          />
        ) : (
          <MonthView 
            monthData={calendarData as MonthData}
            currentDate={currentDate}
            onRehearsalClick={onRehearsalClick}
            onEditRehearsal={onEditRehearsal}
            onDeleteRehearsal={onDeleteRehearsal}
            onViewDetails={onViewDetails}
            onNavigateToRehearsal={onNavigateToRehearsal}
            onShowAdditional={handleShowAdditional}
          />
        )}
      </div>

      {/* Additional Rehearsals Modal */}
      {showAdditionalModal && (
        <AdditionalRehearsalsModal
          rehearsals={additionalRehearsals}
          date={modalDate}
          onClose={() => setShowAdditionalModal(false)}
          onRehearsalClick={handleModalRehearsalClick}
        />
      )}
    </div>
  )
}

// Week view component
interface WeekViewProps {
  weekData: WeekData
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
}

function WeekView({ weekData, onRehearsalClick, onEditRehearsal, onDeleteRehearsal, onViewDetails }: WeekViewProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {weekData.days.map((day, index) => (
        <div key={index} className="p-2 text-center">
          <div className="text-sm font-medium text-gray-900">{getDayName(day.dayOfWeek)}</div>
          <div className={`text-lg font-semibold mt-1 ${
            day.isToday ? 'text-primary-600' : 'text-gray-700'
          }`}>
            {day.date.getDate()}
          </div>
        </div>
      ))}
      
      {/* Day cells */}
      {weekData.days.map((day, index) => (
        <div key={index} className="min-h-[250px] border border-gray-200 rounded-lg p-3">
          <div className="space-y-2">
            {day.rehearsals.map(rehearsal => (
              <RehearsalCard
                key={rehearsal._id}
                rehearsal={rehearsal}
                compact={true}
                onRehearsalClick={onRehearsalClick}
                onEditRehearsal={onEditRehearsal}
                onDeleteRehearsal={onDeleteRehearsal}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Month view component
interface MonthViewProps {
  monthData: MonthData
  currentDate: Date
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
  onNavigateToRehearsal?: (rehearsalId: string) => void
  onShowAdditional?: (date: Date, rehearsals: Rehearsal[]) => void
}

function MonthView({ monthData, currentDate, onRehearsalClick, onEditRehearsal, onDeleteRehearsal, onViewDetails, onNavigateToRehearsal, onShowAdditional }: MonthViewProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {Object.entries(VALID_DAYS_OF_WEEK).map(([dayNum, dayName]) => (
        <div key={dayNum} className="p-2 text-center font-medium text-gray-900 text-sm">
          {dayName}
        </div>
      ))}
      
      {/* Calendar cells */}
      {monthData.weeks.map((week, weekIndex) =>
        week.map((day, dayIndex) => (
          <div 
            key={`${weekIndex}-${dayIndex}`} 
            className={`min-h-[120px] border border-gray-200 rounded-lg p-2 ${
              !day.isCurrentMonth ? 'bg-gray-50' : ''
            } ${day.isToday ? 'bg-primary-50 border-primary-200' : ''}`}
          >
            <div className={`text-sm font-semibold mb-2 ${
              !day.isCurrentMonth ? 'text-gray-400' :
              day.isToday ? 'text-primary-600' : 'text-gray-900'
            }`}>
              {day.date.getDate()}
            </div>
            
            <div className="space-y-1">
              {day.rehearsals.slice(0, 3).map(rehearsal => (
                <RehearsalCard
                  key={rehearsal._id}
                  rehearsal={rehearsal}
                  compact={true}
                  minimal={true}
                  onRehearsalClick={onRehearsalClick}
                  onEditRehearsal={onEditRehearsal}
                  onDeleteRehearsal={onDeleteRehearsal}
                  onViewDetails={onViewDetails}
                />
              ))}
              {day.rehearsals.length > 3 && (
                <div 
                  className="text-xs text-gray-500 text-center py-1 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowAdditional?.(day.date, day.rehearsals)
                  }}
                >
                  +{day.rehearsals.length - 3} נוספות
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// Rehearsal card component
interface RehearsalCardProps {
  rehearsal: Rehearsal
  compact?: boolean
  minimal?: boolean
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
}

function RehearsalCard({ 
  rehearsal, 
  compact = false, 
  minimal = false, 
  onRehearsalClick, 
  onEditRehearsal, 
  onDeleteRehearsal, 
  onViewDetails 
}: RehearsalCardProps) {
  const status = getRehearsalStatus(rehearsal)
  const attendanceStats = calculateAttendanceStats(rehearsal)
  const color = getRehearsalColor(rehearsal)
  const dateTime = formatRehearsalDateTime(rehearsal)

  if (minimal) {
    return (
      <div 
        className={`${color} rounded-md p-1.5 text-white cursor-pointer hover:shadow-md transition-all duration-200 text-xs shadow-sm`}
        onClick={() => onRehearsalClick?.(rehearsal)}
        title={`${rehearsal.orchestra?.name || 'ללא שם'} • ${dateTime.time} • ${rehearsal.location}`}
      >
        <div className="font-medium truncate text-xs leading-tight">
          {rehearsal.orchestra?.name || 'ללא שם'}
        </div>
        <div className="flex items-center justify-between mt-1 opacity-90">
          <span className="text-[10px] truncate">{dateTime.time}</span>
          <span className="text-[10px] ml-1 truncate flex-shrink-0">{rehearsal.location}</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`${color} rounded-lg p-3 text-white cursor-pointer hover:shadow-lg transition-all duration-200 shadow-md ${
        compact ? 'text-sm' : ''
      }`}
      onClick={() => onRehearsalClick?.(rehearsal)}
    >
      <div className="space-y-2">
        {/* Header with orchestra/ensemble name */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate text-base leading-tight">
              {rehearsal.orchestra?.name || 'ללא שם'}
            </div>
          </div>
          
          {!compact && (
            <div className="flex items-center gap-0.5 mr-1 flex-shrink-0">
              {onViewDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetails(rehearsal)
                  }}
                  className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  title="צפה בפרטים"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
              {onEditRehearsal && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditRehearsal(rehearsal)
                  }}
                  className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  title="ערוך חזרה"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}
              {onDeleteRehearsal && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteRehearsal(rehearsal._id)
                  }}
                  className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  title="מחק חזרה"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Time and Location Info */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 opacity-95">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium">{dateTime.time}</span>
          </div>
          
          <div className="flex items-center gap-1.5 opacity-95">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{rehearsal.location || 'לא צוין מיקום'}</span>
          </div>
          
          {!compact && attendanceStats.hasAttendanceData && (
            <div className="flex items-center gap-1.5 opacity-95">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{attendanceStats.presentCount}/{attendanceStats.totalMembers} נוכחים</span>
            </div>
          )}
        </div>

        {/* Status indicator for compact view */}
        {compact && (
          <div className="flex justify-end">
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium bg-white bg-opacity-20`}>
              {status.text}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper types and functions
interface DayData {
  date: Date
  dayOfWeek: number
  isToday: boolean
  isCurrentMonth: boolean
  rehearsals: Rehearsal[]
}

interface WeekData {
  days: DayData[]
}

interface MonthData {
  weeks: DayData[][]
}

// Get start of week (Sunday)
function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  return start
}

// Get week data
function getWeekData(currentDate: Date, rehearsals: Rehearsal[]): WeekData {
  const startOfWeek = getStartOfWeek(currentDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const days: DayData[] = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    
    const dayRehearsals = rehearsals
      .filter(rehearsal => {
        const rehearsalDate = new Date(rehearsal.date)
        rehearsalDate.setHours(0, 0, 0, 0)
        return rehearsalDate.getTime() === date.getTime()
      })
      .sort((a, b) => {
        // Sort by start time (earliest first)
        const timeA = a.startTime || '00:00'
        const timeB = b.startTime || '00:00'

        // Debug logging
        if (date.getDate() === 5) {
          console.log(`Comparing rehearsals on day ${date.getDate()}:`, {
            aName: a.orchestra?.name,
            aTime: timeA,
            bName: b.orchestra?.name,
            bTime: timeB,
            comparison: timeA.localeCompare(timeB)
          })
        }

        return timeA.localeCompare(timeB)
      })

    days.push({
      date,
      dayOfWeek: date.getDay(),
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth: true,
      rehearsals: dayRehearsals
    })
  }
  
  return { days }
}

// Get month data
function getMonthData(currentDate: Date, rehearsals: Rehearsal[]): MonthData {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Get first Sunday of the calendar
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())
  
  // Get last Saturday of the calendar
  const endDate = new Date(lastDay)
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
  
  const weeks: DayData[][] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const week: DayData[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(current)
      
      const dayRehearsals = rehearsals
        .filter(rehearsal => {
          const rehearsalDate = new Date(rehearsal.date)
          rehearsalDate.setHours(0, 0, 0, 0)
          return rehearsalDate.getTime() === date.getTime()
        })
        .sort((a, b) => {
          // Sort by start time (earliest first)
          const timeA = a.startTime || '00:00'
          const timeB = b.startTime || '00:00'
          return timeA.localeCompare(timeB)
        })

      week.push({
        date,
        dayOfWeek: date.getDay(),
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: date.getMonth() === month,
        rehearsals: dayRehearsals
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    weeks.push(week)
  }
  
  return { weeks }
}