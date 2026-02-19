
import { 
import { ClockIcon, MapPinIcon, UsersIcon } from '@phosphor-icons/react'
  formatRehearsalDateTime, 
  getRehearsalColor,
  calculateAttendanceStats,
  type Rehearsal 
} from '../utils/rehearsalUtils'

interface RehearsalCardProps {
  rehearsal: Rehearsal
  compact?: boolean
  onRehearsalClick?: (rehearsal: Rehearsal) => void
}

export default function RehearsalCard({ 
  rehearsal, 
  compact = false, 
  onRehearsalClick 
}: RehearsalCardProps) {
  const color = getRehearsalColor(rehearsal)
  const dateTime = formatRehearsalDateTime(rehearsal)
  const attendanceStats = calculateAttendanceStats(rehearsal)

  return (
    <div 
      className={`${color} rounded p-3 text-white cursor-pointer hover:shadow-lg transition-all duration-200 shadow-md ${
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
        </div>

        {/* Time and Location Info */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 opacity-95">
            <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium">{dateTime.time}</span>
          </div>
          
          <div className="flex items-center gap-1.5 opacity-95">
            <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{rehearsal.location || 'לא צוין מיקום'}</span>
          </div>
          
          {!compact && attendanceStats.hasAttendanceData && (
            <div className="flex items-center gap-1.5 opacity-95">
              <UsersIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{attendanceStats.presentCount}/{attendanceStats.totalMembers} נוכחים</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}