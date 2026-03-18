/**
 * StudentDashboardView - 3-column RTL grid layout for the Student Details dashboard.
 *
 * Layout: ProfileCard (RIGHT in RTL = first in DOM) | Activity placeholder (CENTER) | Attendance placeholder (LEFT)
 * Full-width enrollments table placeholder below.
 *
 * Plan 02 replaces chart placeholders. Plan 03 replaces table placeholder.
 */

import { ProfileCard } from './ProfileCard'
import type { StudentDashboardData } from '../../hooks/useStudentDashboardData'

interface StudentDashboardViewProps {
  student: any
  studentId: string
  dashboardData: StudentDashboardData
  onStudentUpdate: (updated: any) => void
}

export function StudentDashboardView({
  student,
  studentId,
  dashboardData,
  onStudentUpdate,
}: StudentDashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* 3-column grid: profile RIGHT | activity CENTER | attendance LEFT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile card -- RIGHT in RTL (first in DOM) */}
        <div className="lg:col-span-3">
          <ProfileCard
            student={student}
            studentId={studentId}
            teacherMap={dashboardData.teacherMap}
            onStudentUpdate={onStudentUpdate}
          />
        </div>

        {/* Activity -- CENTER */}
        <div className="lg:col-span-5 space-y-4">
          {/* ActivityChart placeholder -- will be built in Plan 02 */}
          <div className="bg-white rounded-card border border-border p-6 h-64 flex items-center justify-center text-muted-foreground">
            פעילות שבועית (בקרוב)
          </div>
          {/* SummaryCards placeholder */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-card border border-border p-4 h-20" />
            <div className="bg-white rounded-card border border-border p-4 h-20" />
            <div className="bg-white rounded-card border border-border p-4 h-20" />
          </div>
        </div>

        {/* Attendance -- LEFT in RTL (last in DOM) */}
        <div className="lg:col-span-4">
          {/* AttendanceChart placeholder -- will be built in Plan 02 */}
          <div className="bg-white rounded-card border border-border p-6 h-80 flex items-center justify-center text-muted-foreground">
            נוכחות (בקרוב)
          </div>
        </div>
      </div>

      {/* Full-width enrollments table -- spans all columns */}
      <div>
        {/* EnrollmentsTable placeholder -- will be built in Plan 03 */}
        <div className="bg-white rounded-card border border-border p-6 h-48 flex items-center justify-center text-muted-foreground">
          טבלת רישומים (בקרוב)
        </div>
      </div>
    </div>
  )
}
