import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export interface Filters {
  teacherName: string
  roomName: string
  activityTypes: string[] // subset of ['timeBlock', 'rehearsal', 'theory']
}

interface FilterBarProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  rooms: string[] // available room names for dropdown
}

// ==================== Constants ====================

const DEFAULT_FILTERS: Filters = {
  teacherName: '',
  roomName: '',
  activityTypes: ['timeBlock', 'rehearsal', 'theory'],
}

const ACTIVITY_TYPE_BUTTONS = [
  {
    type: 'timeBlock',
    label: 'שיעור פרטי',
    activeBg: 'bg-blue-100',
    activeText: 'text-blue-800',
  },
  {
    type: 'rehearsal',
    label: 'חזרה',
    activeBg: 'bg-purple-100',
    activeText: 'text-purple-800',
  },
  {
    type: 'theory',
    label: 'תאוריה',
    activeBg: 'bg-orange-100',
    activeText: 'text-orange-800',
  },
] as const

// ==================== Component ====================

export default function FilterBar({ filters, onFiltersChange, rooms }: FilterBarProps) {
  const isFiltered =
    filters.teacherName !== '' ||
    filters.roomName !== '' ||
    filters.activityTypes.length < 3

  function handleTeacherNameChange(value: string) {
    onFiltersChange({ ...filters, teacherName: value })
  }

  function handleRoomChange(value: string) {
    onFiltersChange({ ...filters, roomName: value })
  }

  function toggleActivityType(type: string) {
    const current = filters.activityTypes
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    onFiltersChange({ ...filters, activityTypes: updated })
  }

  function clearFilters() {
    onFiltersChange({ ...DEFAULT_FILTERS })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Teacher name search */}
      <div className="relative">
        <input
          type="text"
          value={filters.teacherName}
          onChange={(e) => handleTeacherNameChange(e.target.value)}
          placeholder="חיפוש מורה..."
          className="w-48 text-sm border border-gray-300 rounded-md pr-9 pl-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <MagnifyingGlassIcon
          size={16}
          weight="regular"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>

      {/* Room select */}
      <select
        value={filters.roomName}
        onChange={(e) => handleRoomChange(e.target.value)}
        className="py-2 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">כל החדרים</option>
        {rooms.map((room) => (
          <option key={room} value={room}>
            {room}
          </option>
        ))}
      </select>

      {/* Activity type toggle buttons */}
      {ACTIVITY_TYPE_BUTTONS.map((btn) => {
        const isActive = filters.activityTypes.includes(btn.type)
        return (
          <button
            key={btn.type}
            type="button"
            onClick={() => toggleActivityType(btn.type)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md border transition-colors',
              isActive
                ? `${btn.activeBg} ${btn.activeText} border-transparent font-medium shadow-sm`
                : 'bg-white text-gray-400 border-gray-300 line-through'
            )}
          >
            {btn.label}
          </button>
        )
      })}

      {/* Clear filters button */}
      {isFiltered && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <XIcon size={14} weight="bold" />
          <span>נקה סינון</span>
        </button>
      )}
    </div>
  )
}
