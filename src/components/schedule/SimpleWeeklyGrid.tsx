/**
 * Simple Weekly Grid Component
 *
 * A simple day-based grid that shows student activities without complex time slots.
 * Focus on displaying lesson cards in a clean, scrollable format.
 * Uses ActivityTimelineCard for consistent styling with the Rehearsal timeline pattern.
 */

import React from 'react'
import { MusicNotesIcon } from '@phosphor-icons/react'
import { ActivityTimelineCard } from './ActivityTimelineCard'

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

interface SimpleWeeklyGridProps {
  lessons: CalendarLesson[]
  className?: string
}

// Legend items matching CSS custom property accent colors
const LEGEND_ITEMS = [
  { label: 'אישי',    color: 'hsl(var(--primary))',             type: 'individual' },
  { label: 'קבוצתי',  color: 'hsl(var(--color-rehearsals-fg))', type: 'group'      },
  { label: 'תזמורת',  color: 'hsl(var(--color-orchestras-fg))', type: 'orchestra'  },
  { label: 'תאוריה',  color: 'hsl(var(--color-theory-fg))',     type: 'theory'     },
] as const

const SimpleWeeklyGrid: React.FC<SimpleWeeklyGridProps> = ({ lessons, className = '' }) => {
  // Hebrew day names (Sunday–Friday)
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']

  // Group lessons by day of week
  const lessonsByDay = lessons.reduce((acc, lesson) => {
    if (lesson.dayOfWeek >= 0 && lesson.dayOfWeek <= 5) {
      if (!acc[lesson.dayOfWeek]) {
        acc[lesson.dayOfWeek] = []
      }
      acc[lesson.dayOfWeek].push(lesson)
    }
    return acc
  }, {} as Record<number, CalendarLesson[]>)

  // Sort lessons within each day by start time
  Object.keys(lessonsByDay).forEach((day) => {
    lessonsByDay[parseInt(day)].sort((a, b) => {
      const [aH, aM] = a.startTime.split(':').map(Number)
      const [bH, bM] = b.startTime.split(':').map(Number)
      return aH * 60 + aM - (bH * 60 + bM)
    })
  })

  return (
    <div className={`simple-weekly-grid ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground mb-1">לוח זמנים שבועי</h3>
        <p className="text-xs text-muted-foreground">
          {lessons.length === 0
            ? 'אין שיעורים השבוע'
            : lessons.length === 1
            ? 'שיעור אחד השבוע'
            : `${lessons.length} שיעורים השבוע`}
        </p>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {dayNames.map((dayName, dayIndex) => {
          const dayLessons = lessonsByDay[dayIndex] || []

          return (
            <div key={dayIndex} className="day-column">
              {/* Day Header */}
              <div className="bg-muted/50 rounded-t-card px-3 py-2 border-b border-border">
                <h4 className="font-medium text-foreground text-center text-sm">{dayName}</h4>
                <p className="text-xs text-muted-foreground text-center">
                  {dayLessons.length === 0 ? 'ריק' : String(dayLessons.length)}
                </p>
              </div>

              {/* Day Content */}
              <div className="rounded-b-card border border-t-0 border-border min-h-24 bg-card">
                {dayLessons.length === 0 ? (
                  <div className="p-3 text-center">
                    <div className="text-muted-foreground mb-1">
                      <MusicNotesIcon className="w-5 h-5 mx-auto opacity-30" />
                    </div>
                    <p className="text-muted-foreground text-xs opacity-60">אין</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {dayLessons.map((lesson) => (
                      <ActivityTimelineCard
                        key={lesson.id}
                        title={lesson.instrumentName}
                        subtitle={lesson.teacherName}
                        type={lesson.lessonType}
                        startTime={lesson.startTime}
                        endTime={lesson.endTime}
                        location={lesson.location}
                        room={lesson.roomNumber}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="bg-muted/40 rounded-card border border-border p-3">
        <h4 className="font-medium text-foreground mb-2 text-sm">מקרא</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.type} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SimpleWeeklyGrid
