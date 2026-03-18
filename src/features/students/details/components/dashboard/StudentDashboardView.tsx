/**
 * StudentDashboardView - Asymmetric grid layout for the Student Details dashboard.
 *
 * Layout:
 *   Row 1: ProfileCard (1 col) | 2x2 GlassStatCards (2 cols)
 *   Row 2: ActivityChart (3/5) | AttendanceChart (2/5)
 *   Row 3: Full-width EnrollmentsTable
 */

import { ProfileCard } from './ProfileCard'
import { ActivityChart } from './ActivityChart'
import { AttendanceChart } from './AttendanceChart'
import { EnrollmentsTable } from './EnrollmentsTable'
import { GlassStatCard } from '@/components/ui/GlassStatCard'
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
    <div className="space-y-5">
      {/* Row 1: Profile card + GlassStatCards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile — 1 col */}
        <ProfileCard
          student={student}
          studentId={studentId}
          teacherMap={dashboardData.teacherMap}
          onStudentUpdate={onStudentUpdate}
        />

        {/* Glass stat cards — 2 cols, inner 2x2 grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <GlassStatCard
            value={dashboardData.totalWeeklyHours}
            label="שעות שבועיות"
          />
          <GlassStatCard
            value={dashboardData.orchestraCount}
            label="תזמורות"
          />
          <GlassStatCard
            value={dashboardData.theoryCount}
            label="שיעורי תאוריה"
          />
          <GlassStatCard
            value={
              dashboardData.attendanceSummary
                ? `${Math.round(dashboardData.attendanceSummary.attendanceRate)}%`
                : '—'
            }
            label="נוכחות"
            trend={
              dashboardData.attendanceSummary
                ? `${dashboardData.attendanceSummary.totalSessions} מפגשים`
                : undefined
            }
          />
        </div>
      </div>

      {/* Row 2: Activity chart + Attendance side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <ActivityChart
            weeklyHours={dashboardData.weeklyHours}
            totalWeeklyHours={dashboardData.totalWeeklyHours}
            isLoading={dashboardData.attendanceLoading}
          />
        </div>
        <div className="lg:col-span-2">
          <AttendanceChart
            attendanceSummary={dashboardData.attendanceSummary}
            monthlyAttendance={dashboardData.monthlyAttendance}
            isLoading={dashboardData.attendanceLoading}
          />
        </div>
      </div>

      {/* Row 3: Full-width enrollment table */}
      <EnrollmentsTable
        enrollments={dashboardData.enrollments}
        isLoading={dashboardData.isLoading}
      />
    </div>
  )
}
