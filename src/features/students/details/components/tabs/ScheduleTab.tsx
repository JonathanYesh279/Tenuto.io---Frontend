/**
 * Schedule Tab Component - Weekly Calendar Grid
 *
 * Displays student's schedule in a proper weekly calendar grid from Sunday to Friday.
 * Shows lessons as calendar events with proper time slots and Hebrew labels.
 *
 * Data is fetched via a single API call to GET /api/student/:studentId/weekly-schedule,
 * which returns live data from timeBlocks, rehearsals, and theory lessons.
 */

import SimpleWeeklyGrid from '../../../../../components/schedule/SimpleWeeklyGrid'
import { ActivityTimelineCard } from '../../../../../components/schedule/ActivityTimelineCard'
import { CalendarIcon, MusicNotesIcon, UsersIcon } from '@phosphor-icons/react'
import { useStudentScheduleData } from '../../hooks/useStudentScheduleData'

interface ScheduleTabProps {
  studentId: string
  isLoading?: boolean
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ studentId, isLoading }) => {
  const {
    lessons,
    personalLessons,
    orchestraActivities,
    isLoading: scheduleLoading,
  } = useStudentScheduleData(studentId)

  if (isLoading || scheduleLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-6 bg-muted rounded animate-pulse w-48"></div>
          <div className="h-96 bg-muted rounded animate-pulse"></div>
          <div className="h-32 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 w-full max-w-full overflow-hidden student-content-area">
      {/* Weekly Schedule Grid or Empty State */}
      {lessons.length > 0 ? (
        <div className="bg-white rounded-card shadow-1 border border-border p-4 w-full max-w-full overflow-hidden">
          <SimpleWeeklyGrid lessons={lessons} />
        </div>
      ) : (
        <div className="bg-white rounded-card shadow-1 border border-border p-8 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-medium text-foreground mb-2">אין שיעורים מתוכננים</h3>
          <p className="text-muted-foreground mb-4">
            התלמיד עדיין לא שוייך למורים או שלא הוגדרו לו שיעורים קבועים
          </p>
          <div className="text-sm text-muted-foreground">
            ניתן לשייך מורים ולהגדיר שיעורים דרך המערכת
          </div>
        </div>
      )}

      {/* Summary Info - Only show if there are lessons or orchestra activities */}
      {(personalLessons.length > 0 || orchestraActivities.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Lessons Summary - Only show personal lessons, not orchestra */}
          {personalLessons.length > 0 ? (
            <div className="bg-card rounded-card border border-border p-4">
              <h4 className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
                <MusicNotesIcon className="w-4 h-4 text-primary" />
                שיעורים השבוע
              </h4>

              <div className="space-y-2">
                {personalLessons.map((lesson) => (
                  <ActivityTimelineCard
                    key={lesson.id}
                    title={lesson.instrumentName}
                    subtitle={lesson.teacherName}
                    type={lesson.lessonType}
                    startTime={lesson.startTime}
                    endTime={lesson.endTime}
                    location={lesson.location || undefined}
                    room={lesson.roomNumber || undefined}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-card border border-border p-6">
              <div className="text-center py-4">
                <MusicNotesIcon className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-40" />
                <h4 className="text-base font-medium text-foreground mb-1">אין שיעורים אישיים</h4>
                <p className="text-sm text-muted-foreground">התלמיד טרם שוייך לשיעורים אישיים</p>
              </div>
            </div>
          )}

          {/* Orchestra Activities */}
          {orchestraActivities.length > 0 && (
            <div className="bg-card rounded-card border border-border p-4">
              <h4 className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-secondary" />
                תזמורות ופעילויות
              </h4>

              <div className="space-y-2">
                {orchestraActivities.map((activity) => (
                  <ActivityTimelineCard
                    key={activity.id}
                    title={activity.name}
                    subtitle={activity.conductorName}
                    type="orchestra"
                    startTime={activity.startTime}
                    endTime={activity.endTime}
                    location={activity.location}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state for orchestras */}
          {orchestraActivities.length === 0 && (
            <div className="bg-card rounded-card border border-border p-6">
              <div className="text-center py-8">
                <UsersIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <h4 className="text-lg font-medium text-foreground mb-2">אין תזמורות</h4>
                <p className="text-muted-foreground">לא נרשמת עדיין לתזמורות או פעילויות קבוצתיות</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orchestra Activities section for when no personal lessons exist */}
      {personalLessons.length === 0 && orchestraActivities.length > 0 && (
        <div className="bg-card rounded-card border border-border p-4">
          <h4 className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-secondary" />
            תזמורות ופעילויות
          </h4>

          <div className="space-y-2">
            {orchestraActivities.map((activity) => (
              <ActivityTimelineCard
                key={activity.id}
                title={activity.name}
                subtitle={activity.conductorName}
                type="orchestra"
                startTime={activity.startTime}
                endTime={activity.endTime}
                location={activity.location}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleTab
