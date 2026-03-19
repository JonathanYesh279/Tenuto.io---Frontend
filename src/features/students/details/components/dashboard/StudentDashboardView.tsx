/**
 * StudentDashboardView - Asymmetric grid layout for the Student Details dashboard.
 *
 * Layout:
 *   Row 1: ProfileCard (1 col) | 2x2 GlassStatCards (2 cols) | AttendanceChart (1 col)
 *   Row 2: Full-width StudentAgendaWidget (scrolling activity cards)
 *   Row 3: Full-width EnrollmentsTable
 */

import { ProfileCard } from './ProfileCard'
import { StudentAgendaWidget } from './StudentAgendaWidget'
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
      {/* Row 1: ProfileCard | 2x2 GlassStatCards | AttendanceChart — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <ProfileCard
          student={student}
          studentId={studentId}
          teacherMap={dashboardData.teacherMap}
          onStudentUpdate={onStudentUpdate}
        />

        {/* 2x2 compact stat cards */}
        <div className="grid grid-cols-2 gap-0.5">
          <GlassStatCard size="sm" value={dashboardData.totalWeeklyHours} label="שעות שבועיות" className="!h-[100px] !p-3" />
          <GlassStatCard size="sm" value={dashboardData.orchestraCount} label="תזמורות" className="!h-[100px] !p-3" />
          <GlassStatCard size="sm" value={dashboardData.theoryCount} label="שיעורי תאוריה" className="!h-[100px] !p-3" />
          <GlassStatCard
            size="sm"
            className="!h-[100px] !p-3"
            value={dashboardData.attendanceSummary ? `${Math.round(dashboardData.attendanceSummary.attendanceRate)}%` : '—'}
            label="נוכחות"
            trend={dashboardData.attendanceSummary ? `${dashboardData.attendanceSummary.totalSessions} מפגשים` : undefined}
          />
        </div>

        {/* Attendance chart */}
        <AttendanceChart
          attendanceSummary={dashboardData.attendanceSummary}
          monthlyAttendance={dashboardData.monthlyAttendance}
          isLoading={dashboardData.attendanceLoading}
        />
      </div>

      {/* Row 2: Student agenda — full width */}
      <StudentAgendaWidget
        enrollments={dashboardData.enrollments}
        isLoading={dashboardData.isLoading}
      />

      {/* Row 3: Full-width enrollment table */}
      <EnrollmentsTable
        enrollments={dashboardData.enrollments}
        isLoading={dashboardData.isLoading}
      />
    </div>
  )
}
