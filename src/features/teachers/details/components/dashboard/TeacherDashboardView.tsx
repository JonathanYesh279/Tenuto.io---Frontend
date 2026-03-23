/**
 * TeacherDashboardView - Asymmetric grid layout for the Teacher Details dashboard.
 *
 * Layout:
 *   Col 1: ProfileCard
 *   Col 2: 2x2 GlassStatCards + Time Blocks overview (ימי לימוד)
 *   Col 3: StudentsWidget
 */

import { Chip } from '@heroui/react'
import { TeacherProfileCard } from './TeacherProfileCard'
import { TeacherStudentsWidget } from './TeacherStudentsWidget'
import { GlassStatCard } from '@/components/ui/GlassStatCard'
import {
  CalendarBlank as CalendarIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
} from '@phosphor-icons/react'
import type { TeacherDashboardData } from '../../hooks/useTeacherDashboardData'

const GLASS_CARD_STYLE = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,210,230,0.15) 50%, rgba(255,255,255,0.9) 100%)',
  boxShadow:
    '0 4px 16px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(200,220,240,0.5)',
} as const

const HEBREW_DAYS_ORDER = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const DAY_COLORS = [
  'bg-blue-50/60 border-blue-100/60',
  'bg-indigo-50/60 border-indigo-100/60',
  'bg-violet-50/60 border-violet-100/60',
  'bg-purple-50/60 border-purple-100/60',
  'bg-fuchsia-50/60 border-fuchsia-100/60',
  'bg-pink-50/60 border-pink-100/60',
  'bg-rose-50/60 border-rose-100/60',
]

interface TeacherDashboardViewProps {
  teacher: any
  teacherId: string
  dashboardData: TeacherDashboardData
  onTeacherUpdate: (updated: any) => void
}

export function TeacherDashboardView({
  teacher,
  teacherId,
  dashboardData,
  onTeacherUpdate,
}: TeacherDashboardViewProps) {
  const timeBlocks = teacher?.teaching?.timeBlocks || []

  // Sort time blocks by Hebrew day order
  const sortedBlocks = [...timeBlocks].sort((a: any, b: any) => {
    return HEBREW_DAYS_ORDER.indexOf(a.day) - HEBREW_DAYS_ORDER.indexOf(b.day)
  })

  return (
    <div className="space-y-5">
      {/* Row 1: ProfileCard | Stats + TimeBlocks | Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[calc(100vh-200px)]">
        {/* Profile card */}
        <TeacherProfileCard
          teacher={teacher}
          teacherId={teacherId}
          onTeacherUpdate={onTeacherUpdate}
        />

        {/* Center column: 2x2 stat cards + time blocks overview */}
        <div className="flex flex-col gap-3 min-h-0 h-full overflow-hidden">
          {/* 2x2 compact stat cards */}
          <div className="grid grid-cols-2 gap-0.5">
            <GlassStatCard size="sm" value={dashboardData.totalWeeklyHours} label='סה"כ ש"ש' className="!h-[90px] !p-2.5" />
            <GlassStatCard size="sm" value={dashboardData.studentCount} label="תלמידים" className="!h-[90px] !p-2.5" />
            <GlassStatCard size="sm" value={dashboardData.timeBlockCount} label="ימי לימוד" className="!h-[90px] !p-2.5" />
            <GlassStatCard size="sm" value={dashboardData.conductingCount} label="ניצוח הרכבים" className="!h-[90px] !p-2.5" />
          </div>

          {/* Time blocks overview card */}
          <div className="rounded-card p-4 flex-1 min-h-0 overflow-auto" style={GLASS_CARD_STYLE}>
            <h3 className="text-sm font-semibold text-foreground mb-2.5">ימי לימוד</h3>
            {sortedBlocks.length > 0 ? (
              <div className="space-y-2">
                {sortedBlocks.map((block: any, idx: number) => {
                  const dayIdx = HEBREW_DAYS_ORDER.indexOf(block.day)
                  const colorClass = DAY_COLORS[dayIdx >= 0 ? dayIdx : 0]
                  const hours = Math.round((block.totalDuration || 0) / 60)
                  const lessonsCount = block.assignedLessons?.length || 0
                  return (
                    <div
                      key={block._id || idx}
                      className={`rounded-xl border p-2.5 ${colorClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-foreground/50" />
                          <span className="text-xs font-bold text-foreground">{block.day}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {lessonsCount > 0 && (
                            <Chip size="sm" variant="flat" color="primary" className="text-[10px] h-5">{lessonsCount} שיעורים</Chip>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <ClockIcon className="w-3 h-3" />
                          {block.startTime}–{block.endTime}
                        </span>
                        {hours > 0 && <span>{hours} שע׳</span>}
                        {block.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPinIcon className="w-3 h-3" />
                            {block.location}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-muted-foreground">
                <div className="text-center">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <span className="text-xs">אין ימי לימוד מוגדרים</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Students widget */}
        <TeacherStudentsWidget
          students={dashboardData.students}
          isLoading={dashboardData.studentsLoading}
        />
      </div>
    </div>
  )
}
