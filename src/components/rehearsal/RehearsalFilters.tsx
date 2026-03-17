import React from 'react'
import { SearchInput } from '../ui/SearchInput'
import { GlassSelect } from '../ui/GlassSelect'
import { Button as HeroButton } from '@heroui/react'
import { PlusIcon } from '@phosphor-icons/react'

interface RehearsalFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onSearchClear: () => void
  isSearchLoading?: boolean

  typeFilter: string
  onTypeChange: (value: string) => void

  statusFilter: string
  onStatusChange: (value: string) => void

  orchestraFilter: string
  onOrchestraChange: (value: string) => void
  orchestraOptions: Array<{ value: string; label: string }>

  onCreateClick: () => void
  canCreate?: boolean
}

const TYPE_OPTIONS = [
  { value: '__all__', label: 'כל הסוגים' },
  { value: 'תזמורת', label: 'תזמורת' },
  { value: 'הרכב', label: 'הרכב' },
]

const STATUS_OPTIONS = [
  { value: '__all__', label: 'כל הסטטוסים' },
  { value: 'upcoming', label: 'עתידה' },
  { value: 'in_progress', label: 'מתקיימת כעת' },
  { value: 'completed', label: 'הושלמה' },
  { value: 'cancelled', label: 'בוטלה' },
]

export const RehearsalFilters: React.FC<RehearsalFiltersProps> = ({
  searchQuery,
  onSearchChange,
  onSearchClear,
  isSearchLoading,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  orchestraFilter,
  onOrchestraChange,
  orchestraOptions,
  onCreateClick,
  canCreate = true,
}) => {
  const allOrchestraOptions = [
    { value: '__all__', label: 'כל התזמורות' },
    ...orchestraOptions,
  ]

  return (
    <div className="flex items-center gap-3 flex-wrap mb-5">
      <div className="w-64 flex-none">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          onClear={onSearchClear}
          placeholder="חיפוש חזרות..."
          isLoading={isSearchLoading}
        />
      </div>

      <GlassSelect
        value={typeFilter || '__all__'}
        onValueChange={(v) => onTypeChange(v === '__all__' ? '' : v)}
        options={TYPE_OPTIONS}
        placeholder="כל הסוגים"
      />

      <GlassSelect
        value={statusFilter || '__all__'}
        onValueChange={(v) => onStatusChange(v === '__all__' ? '' : v)}
        options={STATUS_OPTIONS}
        placeholder="כל הסטטוסים"
      />

      <GlassSelect
        value={orchestraFilter || '__all__'}
        onValueChange={(v) => onOrchestraChange(v === '__all__' ? '' : v)}
        options={allOrchestraOptions}
        placeholder="כל התזמורות"
      />

      {canCreate && (
        <div className="mr-auto">
          <HeroButton
            color="primary"
            variant="solid"
            size="sm"
            onPress={onCreateClick}
            startContent={<PlusIcon size={14} weight="bold" />}
            className="font-bold"
          >
            חזרה חדשה
          </HeroButton>
        </div>
      )}
    </div>
  )
}
