/**
 * EnrollmentsTable - Unified enrollment table combining individual lessons,
 * orchestra enrollments, and theory lessons with HeroUI Table.
 *
 * Features: colored type icons, search, type filter, day-of-week filter, status badges.
 */

import { useState, useMemo } from 'react'
import {
  Table as HeroTable,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@heroui/react'
import { User as UserIcon, MusicNotes as MusicNotesIcon, BookOpen as BookOpenIcon } from '@phosphor-icons/react'
import { SearchInput } from '@/components/ui/SearchInput'
import { GlassSelect } from '@/components/ui/GlassSelect'
import type { EnrollmentEntry } from '../../hooks/useStudentDashboardData'

interface EnrollmentsTableProps {
  enrollments: EnrollmentEntry[]
  isLoading: boolean
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'הכל' },
  { value: 'individual', label: 'שיעור אישי' },
  { value: 'orchestra', label: 'תזמורת' },
  { value: 'theory', label: 'תאוריה' },
]

const DAY_OPTIONS = [
  { value: 'all', label: 'כל הימים' },
  { value: 'ראשון', label: 'ראשון' },
  { value: 'שני', label: 'שני' },
  { value: 'שלישי', label: 'שלישי' },
  { value: 'רביעי', label: 'רביעי' },
  { value: 'חמישי', label: 'חמישי' },
  { value: 'שישי', label: 'שישי' },
]

const TYPE_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  individual: { color: 'bg-primary', icon: UserIcon },
  orchestra: { color: 'bg-success', icon: MusicNotesIcon },
  theory: { color: 'bg-secondary', icon: BookOpenIcon },
}

function TypeIcon({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.individual
  const Icon = config.icon
  return (
    <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
  )
}

export function EnrollmentsTable({ enrollments, isLoading }: EnrollmentsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dayFilter, setDayFilter] = useState('all')

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      // Search filter (name + instrument, case-insensitive)
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesName = e.name.toLowerCase().includes(q)
        const matchesInstrument = e.instrument.toLowerCase().includes(q)
        if (!matchesName && !matchesInstrument) return false
      }

      // Type filter
      if (typeFilter !== 'all' && e.type !== typeFilter) return false

      // Day filter
      if (dayFilter !== 'all' && !e.dayTime.includes(dayFilter)) return false

      return true
    })
  }, [enrollments, searchQuery, typeFilter, dayFilter])

  return (
    <div className="bg-white rounded-card border border-border p-6">
      <h3 className="text-h3 font-semibold mb-4">רישומים</h3>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="חיפוש לפי שם או כלי..."
          className="w-64"
        />
        <GlassSelect
          value={typeFilter}
          onValueChange={setTypeFilter}
          options={TYPE_OPTIONS}
          placeholder="סוג"
        />
        <GlassSelect
          value={dayFilter}
          onValueChange={setDayFilter}
          options={DAY_OPTIONS}
          placeholder="יום"
        />
      </div>

      {/* HeroUI Table */}
      <HeroTable aria-label="רישומים" isStriped>
        <TableHeader>
          <TableColumn>סוג</TableColumn>
          <TableColumn>שם</TableColumn>
          <TableColumn>רישום</TableColumn>
          <TableColumn>יום ושעה</TableColumn>
          <TableColumn>חדר</TableColumn>
          <TableColumn>סטטוס</TableColumn>
        </TableHeader>
        <TableBody emptyContent="אין רישומים" isLoading={isLoading}>
          {filteredEnrollments.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                <TypeIcon type={e.type} />
              </TableCell>
              <TableCell className="font-medium">{e.name}</TableCell>
              <TableCell>{e.instrument || '-'}</TableCell>
              <TableCell>{e.dayTime || '-'}</TableCell>
              <TableCell>{e.room || '-'}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={e.status === 'פעיל' ? 'success' : 'default'}
                  variant="flat"
                >
                  {e.status}
                </Chip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </HeroTable>
    </div>
  )
}
