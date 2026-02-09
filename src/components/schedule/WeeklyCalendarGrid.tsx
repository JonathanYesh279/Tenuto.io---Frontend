import React, { useMemo, useState } from 'react'
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './WeeklyCalendarGrid.css'

// Configure moment for Hebrew locale
moment.locale('he', {
  weekdays: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
  weekdaysShort: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
  months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
  monthsShort: ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳']
})

const localizer = momentLocalizer(moment)

interface CalendarLesson {
  id: string
  instrumentName: string
  teacherName: string
  startTime: string
  endTime: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  location?: string
  roomNumber?: string
  lessonType: 'individual' | 'group' | 'orchestra' | 'theory'
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    type: 'individual' | 'group' | 'orchestra' | 'theory'
    teacher: string
    location?: string
    instrument: string
  }
}

interface WeeklyCalendarGridProps {
  lessons: CalendarLesson[]
  className?: string
}

const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({ lessons, className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Convert lessons to calendar events
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = []
    
    lessons.forEach(lesson => {
      // Get the current week's date for the lesson day
      const startOfWeek = moment(currentDate).startOf('week') // Sunday
      const lessonDate = moment(startOfWeek).add(lesson.dayOfWeek, 'days')
      
      // Parse start and end times
      const [startHour, startMinute] = lesson.startTime.split(':').map(Number)
      const [endHour, endMinute] = lesson.endTime.split(':').map(Number)
      
      const startDateTime = moment(lessonDate)
        .hour(startHour)
        .minute(startMinute)
        .second(0)
        .toDate()
        
      const endDateTime = moment(lessonDate)
        .hour(endHour)
        .minute(endMinute)
        .second(0)
        .toDate()

      calendarEvents.push({
        id: lesson.id,
        title: `${lesson.instrumentName}`,
        start: startDateTime,
        end: endDateTime,
        resource: {
          type: lesson.lessonType,
          teacher: lesson.teacherName,
          location: lesson.roomNumber ? `חדר ${lesson.roomNumber}` : lesson.location,
          instrument: lesson.instrumentName
        }
      })
    })
    
    return calendarEvents
  }, [lessons, currentDate])

  // Custom event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    const type = event.resource.type
    let backgroundColor = '#3174ad'
    let borderColor = '#265985'
    
    switch (type) {
      case 'individual':
        backgroundColor = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' // Gradient blue for individual lessons
        borderColor = '#4f46e5'
        break
      case 'group':
        backgroundColor = 'linear-gradient(135deg, #10b981 0%, #059669 100%)' // Gradient green for group lessons
        borderColor = '#059669'
        break
      case 'orchestra':
        backgroundColor = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' // Gradient purple for orchestra
        borderColor = '#7c3aed'
        break
      case 'theory':
        backgroundColor = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' // Gradient orange for theory
        borderColor = '#d97706'
        break
    }

    return {
      style: {
        background: backgroundColor,
        borderColor,
        color: 'white',
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 'bold',
        padding: '8px 10px',
        boxShadow: `0 3px 8px ${borderColor}30`
      }
    }
  }

  // Custom event component with detailed information
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    // Format time display
    const startTime = moment(event.start).format('HH:mm')
    const endTime = moment(event.end).format('HH:mm')
    
    // Calculate duration
    const durationMinutes = moment(event.end).diff(moment(event.start), 'minutes')
    
    // Get lesson type in Hebrew
    const getLessonTypeHebrew = (type: string) => {
      switch (type) {
        case 'individual': return 'שיעור אישי'
        case 'group': return 'שיעור קבוצתי'
        case 'orchestra': return 'תזמורת'
        case 'theory': return 'תיאוריה'
        default: return 'שיעור'
      }
    }
    
    return (
      <div className="calendar-event-content">
        {/* Main Header - Compact */}
        <div className="event-header">
          <div className="event-title">{event.title}</div>
          <div className="event-type">{getLessonTypeHebrew(event.resource.type)}</div>
        </div>
        
        {/* Time Information - Inline */}
        <div className="event-time-section">
          <div className="event-time-badge">
            <span className="time-icon">🕐</span>
            <span className="time-text">{startTime}-{endTime}</span>
            <span className="event-duration">({durationMinutes}ד')</span>
          </div>
        </div>
        
        {/* Teacher & Location - Combined Row */}
        <div className="event-details-row">
          <div className="event-teacher-section">
            <span className="teacher-icon">👨‍🏫</span>
            <span className="event-teacher">{event.resource.teacher}</span>
          </div>
          
          {event.resource.location && (
            <div className="event-location-section">
              <span className="location-icon">📍</span>
              <span className="event-location">{event.resource.location}</span>
            </div>
          )}
        </div>
        
        {/* Status - Footer */}
        <div className="event-footer">
          <div className="event-status">קבוע</div>
        </div>
      </div>
    )
  }

  // Custom toolbar to hide navigation (we'll handle it externally if needed)
  const CustomToolbar = () => null

  // Week format to show only Sunday-Friday
  const weekFormat = (date: Date, culture?: string, localizer?: any) => {
    const start = moment(date).startOf('week') // Sunday
    const end = moment(date).startOf('week').add(4, 'days') // Friday
    
    return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`
  }

  return (
    <div className={`weekly-calendar-grid ${className}`}>
      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 800, direction: 'rtl' }}
          view={Views.WEEK}
          views={[Views.WEEK]}
          defaultView={Views.WEEK}
          toolbar={false}
          date={currentDate}
          onNavigate={setCurrentDate}
          min={moment().hour(8).minute(0).toDate()}
          max={moment().hour(20).minute(0).toDate()}
          step={30}
          timeslots={1}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
            toolbar: CustomToolbar
          }}
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
              localizer.format(start, 'HH:mm', culture) + ' - ' + localizer.format(end, 'HH:mm', culture),
            dayFormat: (date, culture, localizer) => {
              const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
              return dayNames[moment(date).day()]
            }
          }}
          messages={{
            today: 'היום',
            previous: 'קודם',
            next: 'הבא',
            month: 'חודש',
            week: 'שבוע',
            day: 'יום',
            agenda: 'סדר יום',
            date: 'תאריך',
            time: 'זמן',
            event: 'אירוע',
            noEventsInRange: 'אין אירועים בטווח זה',
            showMore: (total: number) => `+${total} נוספים`
          }}
          dayLayoutAlgorithm="no-overlap"
          showAllEvents={true}
          popup={false}
          selectable={false}
          resizable={false}
          rtl={true}
        />
      </div>
      
      {/* Current time indicator */}
      <div className="current-time-indicator" />
      
      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color individual"></div>
          <span>שיעורים אישיים</span>
        </div>
        <div className="legend-item">
          <div className="legend-color group"></div>
          <span>שיעורים קבוצתיים</span>
        </div>
        <div className="legend-item">
          <div className="legend-color orchestra"></div>
          <span>תזמורות</span>
        </div>
        <div className="legend-item">
          <div className="legend-color theory"></div>
          <span>תיאוריה</span>
        </div>
      </div>
    </div>
  )
}

export default WeeklyCalendarGrid