import { XIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { SearchInput } from '@/components/ui/SearchInput'
import { GlassSelect } from '@/components/ui/GlassSelect'

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
    <div className="flex items-center gap-2 flex-nowrap min-w-0">
      {/* Teacher name search */}
      <div className="w-40 flex-none">
        <SearchInput
          value={filters.teacherName}
          onChange={handleTeacherNameChange}
          onClear={() => handleTeacherNameChange('')}
          placeholder="חיפוש מורה..."
        />
      </div>

      {/* Room select */}
      <GlassSelect
        value={filters.roomName || '__all__'}
        onValueChange={(v) => handleRoomChange(v === '__all__' ? '' : v)}
        placeholder="כל החדרים"
        options={[
          { value: '__all__', label: 'כל החדרים' },
          ...rooms.map((room) => ({ value: room, label: room })),
        ]}
      />

      {/* Activity type toggle buttons */}
      {ACTIVITY_TYPE_BUTTONS.map((btn) => {
        const isActive = filters.activityTypes.includes(btn.type)
        return (
          <button
            key={btn.type}
            type="button"
            onClick={() => toggleActivityType(btn.type)}
            className={cn(
              'px-2 py-1 text-xs rounded-md border transition-colors whitespace-nowrap',
              isActive
                ? `${btn.activeBg} ${btn.activeText} border-transparent font-medium shadow-sm`
                : 'bg-white text-slate-400 border-slate-200 line-through dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
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
          className="flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
        >
          <XIcon size={12} weight="bold" />
          <span>נקה</span>
        </button>
      )}
    </div>
  )
}
