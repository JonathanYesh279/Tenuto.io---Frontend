import React from 'react'
import { motion } from 'framer-motion'
import { Chip, Progress } from '@heroui/react'
import {
  MapPinIcon,
  UsersIcon,
  PencilSimpleIcon,
  ClipboardTextIcon,
  ArrowUpRightIcon,
} from '@phosphor-icons/react'
import { getAvatarColorHex } from '../../utils/avatarColorHash'
import { getDisplayName, getInitials } from '../../utils/nameUtils'
import {
  getRehearsalStatus,
  calculateAttendanceStats,
  calculateDuration,
  formatDuration,
} from '../../utils/rehearsalUtils'
import { snappy } from '../../lib/motionTokens'

interface RehearsalTimelineCardProps {
  rehearsal: {
    _id: string
    date: string
    startTime: string
    endTime: string
    location: string
    type: 'תזמורת' | 'הרכב'
    isActive: boolean
    notes?: string
    groupId?: string
    dayOfWeek?: number
    schoolYearId?: string
    attendance?: {
      present: string[]
      absent: string[]
      late: string[]
    }
    orchestra?: {
      _id: string
      name: string
      type: string
      memberIds?: string[]
      members?: Array<{ _id: string }>
      conductor?: {
        _id?: string
        personalInfo?: {
          firstName?: string
          lastName?: string
          fullName?: string
        }
      }
    }
  }
  onView: (id: string) => void
  onEdit: (rehearsal: RehearsalTimelineCardProps['rehearsal']) => void
  onAttendance: (id: string) => void
}

const TYPE_STYLES = {
  'תזמורת': {
    accentVar: 'hsl(var(--color-rehearsals-fg))',
    chipColor: 'danger' as const,
  },
  'הרכב': {
    accentVar: 'hsl(var(--color-orchestras-fg))',
    chipColor: 'warning' as const,
  },
}

const STATUS_CHIP_MAP: Record<
  string,
  { color: 'primary' | 'success' | 'default'; variant: 'flat' }
> = {
  upcoming:    { color: 'primary', variant: 'flat' },
  in_progress: { color: 'success', variant: 'flat' },
  completed:   { color: 'default', variant: 'flat' },
  cancelled:   { color: 'default', variant: 'flat' },
}

const STATUS_LABEL_MAP: Record<string, string> = {
  upcoming:    'עתידה',
  in_progress: 'מתקיימת כעת',
  completed:   'הושלמה',
  cancelled:   'בוטלה',
}

export const RehearsalTimelineCard: React.FC<RehearsalTimelineCardProps> = ({
  rehearsal,
  onView,
  onEdit,
  onAttendance,
}) => {
  const typeStyle = TYPE_STYLES[rehearsal.type] ?? TYPE_STYLES['תזמורת']
  const accentColor = typeStyle.accentVar

  // Cast to satisfy the Rehearsal type expected by the utils — the shape is compatible
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rehearsalAsTyped = rehearsal as any

  const status = getRehearsalStatus(rehearsalAsTyped)
  const attendanceStats = calculateAttendanceStats(rehearsalAsTyped)
  const durationMin = calculateDuration(rehearsal.startTime, rehearsal.endTime)
  const durationText = formatDuration(durationMin)

  const conductor = rehearsal.orchestra?.conductor
  const conductorName = conductor?.personalInfo
    ? getDisplayName(conductor.personalInfo)
    : null
  const conductorInitials = conductor?.personalInfo
    ? getInitials(conductor.personalInfo)
    : null
  const conductorColor = conductorName ? getAvatarColorHex(conductorName) : '#6366f1'

  const chipProps = STATUS_CHIP_MAP[status.status] ?? STATUS_CHIP_MAP.upcoming

  const getProgressColor = (rate: number): 'success' | 'warning' | 'danger' => {
    if (rate >= 70) return 'success'
    if (rate >= 50) return 'warning'
    return 'danger'
  }

  return (
    <motion.div
      className="group relative bg-card border border-border rounded-card shadow-1 flex overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-2 border-r-[3px]"
      style={{ borderRightColor: accentColor }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      transition={snappy}
      onClick={() => onView(rehearsal._id)}
    >
      {/* Hover-reveal action buttons */}
      <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors bg-card border border-border shadow-1"
          onClick={(e) => { e.stopPropagation(); onEdit(rehearsal) }}
          title="עריכה"
          aria-label="עריכת חזרה"
        >
          <PencilSimpleIcon size={14} weight="regular" />
        </button>
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors bg-card border border-border shadow-1"
          onClick={(e) => { e.stopPropagation(); onAttendance(rehearsal._id) }}
          title="נוכחות"
          aria-label="סימון נוכחות"
        >
          <ClipboardTextIcon size={14} weight="regular" />
        </button>
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors bg-card border border-border shadow-1"
          onClick={(e) => { e.stopPropagation(); onView(rehearsal._id) }}
          title="צפה בפרטים"
          aria-label="צפה בפרטי חזרה"
        >
          <ArrowUpRightIcon size={14} weight="regular" />
        </button>
      </div>

      {/* Card body */}
      <div className="flex-1 p-3.5 flex flex-col gap-2 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold text-foreground leading-snug truncate">
            {rehearsal.orchestra?.name ?? 'חזרה'}
          </span>
          <Chip
            size="sm"
            variant="flat"
            color={typeStyle.chipColor}
            classNames={{ base: 'h-[22px] flex-shrink-0', content: 'text-[11px] font-bold px-1' }}
          >
            {rehearsal.type}
          </Chip>
        </div>

        {/* Detail items row */}
        <div className="flex items-center gap-3 text-small text-muted-foreground flex-wrap">
          {/* Location */}
          <span className="inline-flex items-center gap-1">
            <MapPinIcon size={14} className="opacity-70 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{rehearsal.location}</span>
          </span>

          {/* Conductor avatar */}
          {conductorName && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-border flex-shrink-0" />
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <span
                  className="w-[22px] h-[22px] rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: conductorColor }}
                  aria-hidden="true"
                >
                  {conductorInitials}
                </span>
                <span className="truncate max-w-[100px]">{conductorName}</span>
              </span>
            </>
          )}

          {/* Member count */}
          {attendanceStats.totalMembers > 0 && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-border flex-shrink-0" />
              <span className="inline-flex items-center gap-1">
                <UsersIcon size={14} className="opacity-70 flex-shrink-0" />
                {attendanceStats.totalMembers} חברים
              </span>
            </>
          )}
        </div>

        {/* Status + attendance row */}
        <div className="flex items-center justify-between gap-2 mt-0.5 flex-wrap">
          <Chip
            size="sm"
            variant={chipProps.variant}
            color={chipProps.color}
            classNames={{ base: 'h-[24px]', content: 'text-[11px] font-semibold px-1' }}
          >
            {STATUS_LABEL_MAP[status.status] ?? status.text}
          </Chip>

          {attendanceStats.hasAttendanceData ? (
            <div className="flex items-center gap-2 text-caption text-muted-foreground flex-shrink-0">
              <span className="font-bold text-small text-foreground">
                {Math.round(attendanceStats.attendanceRate)}%
              </span>
              <span className="hidden sm:inline">
                נוכחות ({attendanceStats.presentCount}/{attendanceStats.totalMembers})
              </span>
              <Progress
                size="sm"
                value={attendanceStats.attendanceRate}
                color={getProgressColor(attendanceStats.attendanceRate)}
                className="w-[80px] sm:w-[100px]"
                aria-label={`נוכחות ${Math.round(attendanceStats.attendanceRate)}%`}
              />
            </div>
          ) : (
            <span className="text-caption text-muted-foreground italic flex-shrink-0">
              טרם סומנה
            </span>
          )}
        </div>
      </div>

      {/* Time column — RTL: renders on the left visually, right in DOM */}
      <div className="min-w-[88px] p-3.5 flex flex-col items-center justify-center border-r border-border bg-muted flex-shrink-0">
        <span className="text-h3 font-extrabold text-foreground leading-none tabular-nums">
          {rehearsal.startTime}
        </span>
        <span className="text-small text-muted-foreground mt-0.5 tabular-nums">
          {rehearsal.endTime}
        </span>
        <span className="text-[11px] text-muted-foreground mt-1.5 bg-muted border border-border px-2 py-px rounded-full whitespace-nowrap">
          {durationText}
        </span>
      </div>
    </motion.div>
  )
}
