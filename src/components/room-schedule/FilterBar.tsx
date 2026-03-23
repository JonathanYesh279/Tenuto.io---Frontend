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
    activeBg: 'bg-sky-100',
    activeText: 'text-sky-800',
    activeBorder: 'border-sky-300',
  },
  {
    type: 'rehearsal',
    label: 'חזרה',
    activeBg: 'bg-rose-100',
    activeText: 'text-rose-800',
    activeBorder: 'border-rose-300',
  },
  {
    type: 'theory',
    label: 'תאוריה',
    activeBg: 'bg-amber-100',
    activeText: 'text-amber-800',
    activeBorder: 'border-amber-300',
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
                ? `${btn.activeBg} ${btn.activeText} ${btn.activeBorder} font-medium shadow-sm`
                : 'bg-card text-muted-foreground border-border line-through opacity-50'
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
          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          <XIcon size={12} weight="bold" />
          <span>נקה</span>
        </button>
      )}
    </div>
  )
}
