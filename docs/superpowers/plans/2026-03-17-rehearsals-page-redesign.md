# Rehearsals Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic custom-built Rehearsals page with a polished timeline-card view using the app's existing design system components (GlassStatCard, GlassSelect, SearchInput, ScrollReveal, HeroUI Chip/Progress/Tabs, Phosphor Icons, entity color tokens).

**Architecture:** The current `Rehearsals.tsx` (839 lines) will be refactored into a main page that orchestrates smaller, focused components. The custom calendar remains available as a secondary view behind a Tabs toggle. The primary "cards" view is a new day-grouped timeline with rich rehearsal cards. All data fetching, enrichment, filtering, and CRUD logic stays in the main page — only the rendering changes.

**Tech Stack:** React 18, TypeScript, HeroUI (`@heroui/react`), Framer Motion, Phosphor Icons (`@phosphor-icons/react`), existing design system components (GlassStatCard, GlassSelect, SearchInput, ScrollReveal), Tailwind CSS with project tokens.

**Reference Mockup:** `.superpowers/brainstorm/184934-1773779742/approaches-v2.html`

**Intentionally dropped features (not in new design):**
- Sort dropdown — replaced by chronological day-grouped timeline (always sorted by date then time)
- Bulk delete by date range — remove from this view, can be re-added later if needed
- Advanced filter panel (day-of-week, location, date range) — simplified to 3 GlassSelect dropdowns (type, status, orchestra) + search. Date range and location filters are rarely used and add clutter.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/rehearsal/RehearsalTimeline.tsx` | Day-grouped timeline container — groups rehearsals by date, renders sticky day headers + RehearsalTimelineCard for each |
| Create | `src/components/rehearsal/RehearsalTimelineCard.tsx` | Single rehearsal card — time column, body (title, type chip, details, status, attendance progress), hover actions |
| Create | `src/components/rehearsal/RehearsalStatsRow.tsx` | 4x GlassStatCard row — total, completed, today, avg attendance |
| Create | `src/components/rehearsal/RehearsalFilters.tsx` | Toolbar row — SearchInput + 3 GlassSelect dropdowns (type, status, orchestra) + add button |
| Modify | `src/pages/Rehearsals.tsx` | Refactor to use new sub-components, replace inline rendering with RehearsalTimeline/Calendar toggle via HeroUI Tabs |
| Modify | `src/utils/rehearsalUtils.ts:288-327` | Add `getRehearsalStatusText()` returning Hebrew status label for card chip display |

**Files NOT changed (preserved as-is):**
- `src/components/RehearsalCalendar.tsx` — kept for calendar tab view
- `src/components/RehearsalForm.tsx` — create/edit modal unchanged
- `src/components/rehearsal/RehearsalAttendance.tsx` — attendance manager unchanged
- `src/services/apiService.js` — no API changes needed
- `src/utils/rehearsalUtils.ts` — existing filter/sort/format functions reused

---

## Task 1: RehearsalStatsRow Component

**Files:**
- Create: `src/components/rehearsal/RehearsalStatsRow.tsx`

This is a standalone stats row using 4 GlassStatCard components with the `sm` size variant.

- [ ] **Step 1: Create the component file**

```tsx
// src/components/rehearsal/RehearsalStatsRow.tsx
import React, { useMemo } from 'react'
import { GlassStatCard } from '../ui/GlassStatCard'
import { ScrollReveal } from '../ui/ScrollReveal'

interface RehearsalStatsRowProps {
  rehearsals: Array<{
    date: string
    attendance?: {
      present: string[]
      absent: string[]
      late: string[]
    }
    orchestra?: {
      memberIds?: string[]
      members?: Array<{ _id: string }>
    }
    isActive?: boolean
  }>
}

export const RehearsalStatsRow: React.FC<RehearsalStatsRowProps> = ({ rehearsals }) => {
  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const total = rehearsals.length

    const completed = rehearsals.filter(r => {
      const rDate = new Date(r.date)
      rDate.setHours(0, 0, 0, 0)
      return rDate < today
    }).length

    const todayCount = rehearsals.filter(r => {
      return r.date.startsWith(todayStr)
    }).length

    // Average attendance rate across rehearsals that have attendance data
    let totalRate = 0
    let countWithData = 0
    rehearsals.forEach(r => {
      if (r.attendance && (r.attendance.present.length > 0 || r.attendance.absent.length > 0)) {
        const totalMembers = r.orchestra?.memberIds?.length || r.orchestra?.members?.length ||
          (r.attendance.present.length + r.attendance.absent.length + r.attendance.late.length)
        if (totalMembers > 0) {
          totalRate += (r.attendance.present.length / totalMembers) * 100
          countWithData++
        }
      }
    })
    const avgAttendance = countWithData > 0 ? Math.round(totalRate / countWithData) : 0

    return { total, completed, todayCount, avgAttendance }
  }, [rehearsals])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <ScrollReveal delay={0}>
        <GlassStatCard value={stats.total} label='סה"כ חזרות' size="sm" />
      </ScrollReveal>
      <ScrollReveal delay={0.08}>
        <GlassStatCard value={stats.completed} label="הושלמו" size="sm" />
      </ScrollReveal>
      <ScrollReveal delay={0.16}>
        <GlassStatCard value={stats.todayCount} label="היום" size="sm" />
      </ScrollReveal>
      <ScrollReveal delay={0.24}>
        <GlassStatCard
          value={stats.avgAttendance > 0 ? `${stats.avgAttendance}%` : '—'}
          label="נוכחות ממוצעת"
          size="sm"
        />
      </ScrollReveal>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend && npx tsc --noEmit src/components/rehearsal/RehearsalStatsRow.tsx 2>&1 | head -20`

If TypeScript path resolution fails in isolation, verify with a full build later in Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/components/rehearsal/RehearsalStatsRow.tsx
git commit -m "feat(rehearsals): add RehearsalStatsRow with GlassStatCard stats"
```

---

## Task 2: RehearsalFilters Component

**Files:**
- Create: `src/components/rehearsal/RehearsalFilters.tsx`

Toolbar row with SearchInput, 3 GlassSelect dropdowns (type, status, orchestra), and the add button. Matches the Teachers page filter pattern (`src/pages/Teachers.tsx:500-555`).

- [ ] **Step 1: Create the component file**

```tsx
// src/components/rehearsal/RehearsalFilters.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/rehearsal/RehearsalFilters.tsx
git commit -m "feat(rehearsals): add RehearsalFilters with GlassSelect dropdowns"
```

---

## Task 3: RehearsalTimelineCard Component

**Files:**
- Create: `src/components/rehearsal/RehearsalTimelineCard.tsx`

The rich card matching the mockup: 3px entity accent border on right, time column with muted background, body with title + type chip + detail items (Phosphor icons) + conductor avatar + status chip + HeroUI Progress attendance bar. Hover-reveal action buttons.

**Key references:**
- Entity colors: `--color-rehearsals-fg` (rose) for תזמורת, `--color-orchestras-fg` (amber) for הרכב
- Icon pattern: `MapPinIcon`, `UsersIcon`, `ClockIcon` from `@phosphor-icons/react`
- Conductor avatar: `getAvatarColorHex()` from `src/utils/avatarColorHash.ts`
- Status logic: `getRehearsalStatus()` from `src/utils/rehearsalUtils.ts`
- Attendance calc: `calculateAttendanceStats()` from `src/utils/rehearsalUtils.ts`
- Duration: `calculateDuration()` + `formatDuration()` from `src/utils/rehearsalUtils.ts`
- Action button pattern: `p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100` (from Teachers.tsx)

- [ ] **Step 1: Create the component file**

```tsx
// src/components/rehearsal/RehearsalTimelineCard.tsx
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
        personalInfo?: {
          firstName?: string
          lastName?: string
          fullName?: string
        }
      }
    }
  }
  onView: (id: string) => void
  onEdit: (rehearsal: any) => void
  onAttendance: (id: string) => void
}

// Entity accent colors — uses CSS custom properties for token compliance
const TYPE_STYLES = {
  'תזמורת': {
    accentVar: 'var(--color-rehearsals-fg)',  // CSS custom property
    chipColor: 'danger' as const,              // HeroUI closest match for rose
  },
  'הרכב': {
    accentVar: 'var(--color-orchestras-fg)',   // CSS custom property
    chipColor: 'warning' as const,             // HeroUI closest match for amber
  },
}

const STATUS_CHIP_MAP: Record<string, { color: 'primary' | 'success' | 'default'; variant: 'flat' }> = {
  upcoming: { color: 'primary', variant: 'flat' },
  in_progress: { color: 'success', variant: 'flat' },
  completed: { color: 'default', variant: 'flat' },
  cancelled: { color: 'default', variant: 'flat' },
}

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'עתידה',
  in_progress: 'מתקיימת כעת',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
}

export const RehearsalTimelineCard: React.FC<RehearsalTimelineCardProps> = ({
  rehearsal,
  onView,
  onEdit,
  onAttendance,
}) => {
  const typeStyle = TYPE_STYLES[rehearsal.type] || TYPE_STYLES['תזמורת']
  // Convert CSS custom property to computed value for inline style
  const accentColor = `hsl(${typeStyle.accentVar})`
  const status = getRehearsalStatus(rehearsal)
  const attendanceStats = calculateAttendanceStats(rehearsal)
  const durationMin = calculateDuration(rehearsal.startTime, rehearsal.endTime)
  const durationText = formatDuration(durationMin)

  const conductor = rehearsal.orchestra?.conductor
  const conductorName = conductor ? getDisplayName(conductor.personalInfo) : null
  const conductorInitials = conductor ? getInitials(conductor.personalInfo) : null
  const conductorColor = conductorName ? getAvatarColorHex(conductorName) : '#6366f1'

  const totalMembers = rehearsal.orchestra?.memberIds?.length ||
    rehearsal.orchestra?.members?.length ||
    (attendanceStats.totalMembers || 0)

  const chipProps = STATUS_CHIP_MAP[status.status] || STATUS_CHIP_MAP.upcoming

  // Attendance progress color
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
      <div className="absolute top-2.5 left-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors bg-card border border-border shadow-1"
          onClick={(e) => { e.stopPropagation(); onEdit(rehearsal) }}
          title="עריכה"
        >
          <PencilSimpleIcon size={14} weight="regular" />
        </button>
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors bg-card border border-border shadow-1"
          onClick={(e) => { e.stopPropagation(); onAttendance(rehearsal._id) }}
          title="נוכחות"
        >
          <ClipboardTextIcon size={14} weight="regular" />
        </button>
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors bg-card border border-border shadow-1"
          onClick={(e) => { e.stopPropagation(); onView(rehearsal._id) }}
          title="צפה בפרטים"
        >
          <ArrowUpRightIcon size={14} weight="regular" />
        </button>
      </div>

      {/* Card body */}
      <div className="flex-1 p-3.5 flex flex-col gap-2">
        {/* Top row: title + type chip */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold text-foreground leading-snug">
            {rehearsal.orchestra?.name || 'חזרה'}
          </span>
          <Chip size="sm" variant="flat" color={typeStyle.chipColor}
            classNames={{ base: 'h-[22px]', content: 'text-[11px] font-bold px-1' }}
          >
            {rehearsal.type}
          </Chip>
        </div>

        {/* Detail items row */}
        <div className="flex items-center gap-4 text-small text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1">
            <MapPinIcon size={14} className="opacity-70" />
            {rehearsal.location}
          </span>

          {conductorName && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-border" />
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-[22px] h-[22px] rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: conductorColor }}
                >
                  {conductorInitials}
                </span>
                {conductorName}
              </span>
            </>
          )}

          {totalMembers > 0 && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-border" />
              <span className="inline-flex items-center gap-1">
                <UsersIcon size={14} className="opacity-70" />
                {totalMembers} חברים
              </span>
            </>
          )}
        </div>

        {/* Bottom row: status chip + attendance progress */}
        <div className="flex items-center justify-between mt-0.5">
          <Chip
            size="sm"
            variant={chipProps.variant}
            color={chipProps.color}
            classNames={{ base: 'h-[24px]', content: 'text-[11px] font-semibold px-1' }}
          >
            {STATUS_LABELS[status.status] || status.text}
          </Chip>

          {attendanceStats.hasAttendanceData ? (
            <div className="flex items-center gap-2.5 text-caption text-muted-foreground">
              <span className="font-bold text-small text-foreground">
                {Math.round(attendanceStats.attendanceRate)}%
              </span>
              <span>נוכחות ({attendanceStats.presentCount}/{attendanceStats.totalMembers})</span>
              <Progress
                size="sm"
                value={attendanceStats.attendanceRate}
                color={getProgressColor(attendanceStats.attendanceRate)}
                className="w-[100px]"
                aria-label="נוכחות"
              />
            </div>
          ) : (
            <span className="text-caption text-muted-foreground italic">טרם סומנה</span>
          )}
        </div>
      </div>

      {/* Time column */}
      <div className="min-w-[88px] p-3.5 flex flex-col items-center justify-center border-r border-border bg-muted">
        <span className="text-h3 font-extrabold text-foreground leading-none">
          {rehearsal.startTime}
        </span>
        <span className="text-small text-muted-foreground mt-0.5">
          {rehearsal.endTime}
        </span>
        <span className="text-[11px] text-muted-foreground mt-1.5 bg-muted border border-border px-2 py-px rounded-full">
          {durationText}
        </span>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Verify `calculateAttendanceStats` signature**

Read `src/utils/rehearsalUtils.ts:268-281` and confirm the function accepts a rehearsal object and returns `{ presentCount, absentCount, totalMembers, attendanceRate, hasAttendanceData }`. If the signature differs, adjust the call in the card component.

- [ ] **Step 3: Verify `getRehearsalStatus` signature**

Read `src/utils/rehearsalUtils.ts:288-327` and confirm it accepts a rehearsal object and returns `{ status, text, colorClass }`. The `status` field should be one of `'upcoming' | 'in_progress' | 'completed' | 'cancelled'`.

- [ ] **Step 4: Commit**

```bash
git add src/components/rehearsal/RehearsalTimelineCard.tsx
git commit -m "feat(rehearsals): add RehearsalTimelineCard with entity colors, HeroUI Chip/Progress"
```

---

## Task 4: RehearsalTimeline Component

**Files:**
- Create: `src/components/rehearsal/RehearsalTimeline.tsx`

Groups rehearsals by date, renders sticky day headers with a "today" chip, and maps each rehearsal to a `RehearsalTimelineCard`. Uses `ScrollReveal` for staggered entrance animations.

- [ ] **Step 1: Create the component file**

```tsx
// src/components/rehearsal/RehearsalTimeline.tsx
import React, { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Chip } from '@heroui/react'
import { ScrollReveal } from '../ui/ScrollReveal'
import { RehearsalTimelineCard } from './RehearsalTimelineCard'
import { EmptyState } from '../feedback/EmptyState'
import { CalendarBlankIcon } from '@phosphor-icons/react'

interface RehearsalTimelineProps {
  rehearsals: any[]
  onView: (id: string) => void
  onEdit: (rehearsal: any) => void
  onAttendance: (id: string) => void
}

// Hebrew day names for timeline headers
const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr)
  const dayName = HEBREW_DAYS[d.getDay()]
  const day = d.getDate()
  const month = HEBREW_MONTHS[d.getMonth()]
  const year = d.getFullYear()
  return `${dayName}, ${day} ב${month} ${year}`
}

function isToday(dateStr: string): boolean {
  const today = new Date()
  const d = new Date(dateStr)
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

interface DayGroup {
  dateKey: string
  label: string
  isToday: boolean
  rehearsals: any[]
}

export const RehearsalTimeline: React.FC<RehearsalTimelineProps> = ({
  rehearsals,
  onView,
  onEdit,
  onAttendance,
}) => {
  const dayGroups: DayGroup[] = useMemo(() => {
    // Sort by date ascending, then by startTime ascending
    const sorted = [...rehearsals].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date)
      if (dateCmp !== 0) return dateCmp
      return (a.startTime || '').localeCompare(b.startTime || '')
    })

    const groups: Map<string, DayGroup> = new Map()

    sorted.forEach((r) => {
      const dateKey = r.date.split('T')[0]
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          dateKey,
          label: formatDayHeader(dateKey),
          isToday: isToday(dateKey),
          rehearsals: [],
        })
      }
      groups.get(dateKey)!.rehearsals.push(r)
    })

    return Array.from(groups.values())
  }, [rehearsals])

  if (dayGroups.length === 0) {
    return (
      <EmptyState
        title="לא נמצאו חזרות"
        description="אין חזרות התואמות את הסינון הנוכחי"
        icon={<CalendarBlankIcon size={48} weight="duotone" />}
      />
    )
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {dayGroups.map((group, groupIdx) => (
          <motion.div
            key={group.dateKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: groupIdx * 0.05 }}
          >
            {/* Sticky day header */}
            <div className="flex items-center justify-between py-2 mb-3 border-b border-border sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2 text-body font-bold text-foreground">
                {group.label}
                {group.isToday && (
                  <Chip size="sm" variant="flat" color="primary"
                    classNames={{ base: 'h-[22px]', content: 'text-[11px] font-bold px-1' }}
                  >
                    היום
                  </Chip>
                )}
              </div>
              <span className="text-small text-muted-foreground">
                {group.rehearsals.length} {group.rehearsals.length === 1 ? 'חזרה' : 'חזרות'}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {group.rehearsals.map((rehearsal, cardIdx) => (
                <ScrollReveal key={rehearsal._id} delay={cardIdx * 0.06}>
                  <RehearsalTimelineCard
                    rehearsal={rehearsal}
                    onView={onView}
                    onEdit={onEdit}
                    onAttendance={onAttendance}
                  />
                </ScrollReveal>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/rehearsal/RehearsalTimeline.tsx
git commit -m "feat(rehearsals): add RehearsalTimeline day-grouped container with ScrollReveal"
```

---

## Task 5: Refactor Rehearsals.tsx Main Page

**Files:**
- Modify: `src/pages/Rehearsals.tsx`

This is the integration task. Replace the inline header, filter UI, and list/calendar rendering with the new components. The page structure becomes:

```
Page Header (title + subtitle + export button)
  ↓
RehearsalStatsRow (4x GlassStatCard)
  ↓
HeroUI Tabs (כרטיסים | לוח שנה)
  ↓
RehearsalFilters (search + 3 GlassSelect + add button)
  ↓
Tab Content:
  ├─ "cards" tab → RehearsalTimeline
  └─ "calendar" tab → RehearsalCalendar (existing, unchanged)
  ↓
RehearsalForm modal (existing, unchanged)
ConfirmDeleteDialog (existing, unchanged)
```

**Important:** All existing CRUD handlers (`handleCreateRehearsal`, `handleEditRehearsal`, `handleDeleteRehearsal`, `handleExportRehearsals`, etc.) and data loading logic (`loadData`, enrichment useMemo) stay exactly as they are. We're only changing the JSX render.

- [ ] **Step 1: Read the current Rehearsals.tsx fully**

Read: `src/pages/Rehearsals.tsx` (all 839 lines)

Identify:
- Lines with the header JSX (title, buttons)
- Lines with the filter card JSX
- Lines with the view toggle (calendar vs list)
- Lines with the calendar rendering
- Lines with the table/list rendering
- All state variables and handlers that must be preserved

- [ ] **Step 2: Add new imports at the top**

Add these imports to the existing import block in `Rehearsals.tsx`:

```tsx
import { Tabs, Tab, Button as HeroButton } from '@heroui/react'
import { DownloadSimpleIcon } from '@phosphor-icons/react'
import { RehearsalStatsRow } from '../components/rehearsal/RehearsalStatsRow'
import { RehearsalFilters } from '../components/rehearsal/RehearsalFilters'
import { RehearsalTimeline } from '../components/rehearsal/RehearsalTimeline'
```

Remove any imports that become unused after refactoring (e.g., inline filter components, old table components). Keep `Spinner` import if it exists (needed for loading state).

- [ ] **Step 3: Add filter state for new GlassSelect dropdowns**

The current page has `filters.orchestraId` and `filters.status`. Add `filters.type` if it doesn't already exist:

```tsx
// In the filters state object, ensure these exist:
const [filters, setFilters] = useState({
  searchQuery: '',
  orchestraId: '',
  dayOfWeek: '',
  location: '',
  status: '',    // NOTE: old code uses 'all' as default — change to '' for GlassSelect compat
  startDate: '',
  endDate: '',
  type: '',  // ADD if not present — for תזמורת/הרכב filter
})
```

Update the `filterRehearsals()` call or the enriched rehearsals `useMemo` to also filter by `type` if not already handled:

```tsx
// In the filtering useMemo, after existing filters:
let filtered = filteredRehearsals
if (filters.type) {
  filtered = filtered.filter(r => r.type === filters.type)
}
```

**Also update `clearFilters()` to include `type: ''`** and ensure status resets to `''` (not `'all'`):

```tsx
const clearFilters = () => {
  setFilters({
    searchQuery: '',
    orchestraId: '',
    dayOfWeek: '',
    location: '',
    status: '',   // was 'all' — changed to '' for GlassSelect compatibility
    startDate: '',
    endDate: '',
    type: '',
  })
}
```

**Also check `filterRehearsals()` in rehearsalUtils.ts** — if it checks `filters.status !== 'all'`, the empty string `''` will also correctly skip the filter (falsy check). Verify this works.

- [ ] **Step 4: Add orchestra options for GlassSelect**

```tsx
const orchestraOptions = useMemo(() => {
  return orchestras.map((o: any) => ({
    value: o._id,
    label: o.name,
  }))
}, [orchestras])
```

- [ ] **Step 5: Replace the entire JSX return**

Replace the current render block with the new layout. Preserve ALL existing modals (RehearsalForm, ConfirmDeleteDialog, AttendanceManager) at the bottom of the return.

```tsx
return (
  <div className="space-y-0">
    {/* Page Header — uses semantic tokens (text-foreground, text-muted-foreground) */}
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">חזרות</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          ניהול חזרות תזמורות ומעקב נוכחות • {processedRehearsals.length} חזרות
        </p>
      </div>
      <HeroButton
        color="default"
        variant="bordered"
        size="sm"
        onPress={handleExportRehearsals}
        startContent={<DownloadSimpleIcon size={14} weight="regular" />}
        className="font-bold"
      >
        ייצוא
      </HeroButton>
    </div>

    {/* Loading state */}
    {loading && (
      <div className="flex justify-center py-12">
        <Spinner color="primary" label="טוען חזרות..." />
      </div>
    )}

    {/* Error state */}
    {error && !loading && (
      <ErrorState message={error} onRetry={loadData} />
    )}

    {/* Main content — only render when not loading and no error */}
    {!loading && !error && (
      <>
        {/* Stats Row */}
        <RehearsalStatsRow rehearsals={processedRehearsals} />

        {/* Tabs: Cards vs Calendar */}
        <Tabs
          variant="solid"
          size="sm"
          selectedKey={viewMode}
          onSelectionChange={(key) => setViewMode(key as 'cards' | 'calendar')}
          classNames={{
            tabList: 'mb-4',
          }}
        >
          <Tab key="cards" title="כרטיסים" />
          <Tab key="calendar" title="לוח שנה" />
        </Tabs>

        {/* Filters Row */}
        <RehearsalFilters
          searchQuery={filters.searchQuery}
          onSearchChange={(v) => setFilters(prev => ({ ...prev, searchQuery: v }))}
          onSearchClear={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
          typeFilter={filters.type}
          onTypeChange={(v) => setFilters(prev => ({ ...prev, type: v }))}
          statusFilter={filters.status}
          onStatusChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
          orchestraFilter={filters.orchestraId}
          onOrchestraChange={(v) => setFilters(prev => ({ ...prev, orchestraId: v }))}
          orchestraOptions={orchestraOptions}
          onCreateClick={() => setShowCreateForm(true)}
        />

        {/* Content */}
        {viewMode === 'cards' ? (
          <RehearsalTimeline
            rehearsals={processedRehearsals}
            onView={(id) => navigate(`/rehearsals/${id}`)}
            onEdit={(rehearsal) => {
              setEditingRehearsal(rehearsal)
              setShowEditForm(true)
            }}
            onAttendance={(id) => navigate(`/rehearsals/${id}`)}
          />
        ) : (
          /* IMPORTANT: Copy the EXACT RehearsalCalendar JSX from the current file.
             The prop names below are placeholders — read lines ~607-626 of current
             Rehearsals.tsx and use the exact props. Key props to preserve:
             - rehearsals data
             - view mode (week/month)
             - navigation handlers
             - click/edit/delete handlers */
          <RehearsalCalendar
            rehearsals={processedRehearsals}
            {/* ... copy exact existing props from current file ... */}
          />
        )}
      </>
    )}

    {/* Existing modals — COPY ALL MODAL JSX FROM CURRENT FILE AS-IS */}
    {/* This includes: RehearsalForm (create), RehearsalForm (edit),
        ConfirmDeleteDialog, AttendanceManager, BulkDeleteModal, etc.
        Do NOT change any modal logic or props. */}
  </div>
)
```

**CRITICAL implementation notes:**
1. The variable `processedRehearsals` is the existing enriched+filtered data — verify the actual variable name by reading the current file (may be `processedRehearsals`, `filteredRehearsals`, or similar)
2. Copy the EXACT `RehearsalCalendar` JSX from the current file — do not guess prop names
3. Copy ALL existing modal JSX blocks from the current file — they contain important state/handler wiring
4. `loading`, `error`, `loadData` — verify these exist in the current state. If the page uses different patterns (e.g., React Query `isLoading`), adapt accordingly
5. `Spinner` and `ErrorState` — verify imports exist in the current file or add them

- [ ] **Step 6: Update the `viewMode` state**

The current page uses `viewMode: 'calendar' | 'list'`. Change the default and type:

```tsx
// Change from:
const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

// To:
const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards')
```

- [ ] **Step 7: Build and verify**

Run: `cd /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend && npm run build 2>&1 | tail -30`

Fix any TypeScript errors. Common issues:
- Import path mismatches (check `@/` vs `../` patterns used in this project)
- Missing props on existing components
- Variable name mismatches from Step 5

- [ ] **Step 8: Visual verification**

Run: `cd /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend && npm run dev`

Open http://localhost:5173/rehearsals in browser and verify:
- GlassStatCards render with border-glow hover effect
- Tabs toggle between cards and calendar views
- GlassSelect filters open/close with glass animation
- Timeline cards show with correct entity accent colors
- Hover-reveal action buttons appear on card hover
- HeroUI Chip shows type (תזמורת/הרכב) and status
- HeroUI Progress shows attendance bar
- Conductor avatars show with correct colors
- ScrollReveal animations fire on page load
- Calendar view still works unchanged

- [ ] **Step 9: Commit**

```bash
git add src/pages/Rehearsals.tsx
git commit -m "feat(rehearsals): redesign page with timeline cards, GlassStatCards, GlassSelect filters"
```

---

## Task 6: Polish & Edge Cases

**Files:**
- Modify: `src/components/rehearsal/RehearsalTimelineCard.tsx` (if needed)
- Modify: `src/components/rehearsal/RehearsalTimeline.tsx` (if needed)

- [ ] **Step 1: Handle missing orchestra data gracefully**

Some rehearsals may not have enriched orchestra data. Verify the card handles:
- `rehearsal.orchestra` being `undefined`
- `rehearsal.orchestra.conductor` being `undefined`
- `rehearsal.orchestra.memberIds` being `undefined` or empty

The card code already has optional chaining (`?.`) for these — verify it renders cleanly with missing data (no "undefined" text, no broken layout).

- [ ] **Step 2: Handle empty states**

Verify the EmptyState component renders when:
- No rehearsals exist at all
- All rehearsals are filtered out by the GlassSelect filters

- [ ] **Step 3: Verify responsive layout**

Check on narrow viewport (mobile):
- Stats grid should collapse to 2 columns (`grid-cols-2 lg:grid-cols-4`)
- Filter row should wrap gracefully (`flex-wrap`)
- Timeline cards should remain readable — time column should not get too narrow

- [ ] **Step 4: Verify dark mode**

If the app supports dark mode, check that:
- GlassStatCards have proper dark variants (they already handle `dark:` classes)
- Timeline cards use `bg-card`, `text-foreground`, `border-border` tokens (which auto-adapt)
- Entity accent borders are visible on dark backgrounds

- [ ] **Step 5: Clean up unused code from Rehearsals.tsx**

After confirming everything works, remove:
- Old inline filter JSX that was replaced
- Old table/list view rendering code
- Unused imports (old icons, old filter components)
- Any commented-out old code

- [ ] **Step 6: Final commit**

```bash
git add -A src/components/rehearsal/ src/pages/Rehearsals.tsx
git commit -m "fix(rehearsals): polish edge cases, clean up old rendering code"
```

Tell user: **"Ready to push — run `git push origin main` from Windows."**

---

## Summary

| Task | Component | Est. Steps |
|------|-----------|-----------|
| 1 | RehearsalStatsRow | 3 |
| 2 | RehearsalFilters | 2 |
| 3 | RehearsalTimelineCard | 4 |
| 4 | RehearsalTimeline | 2 |
| 5 | Rehearsals.tsx refactor | 9 |
| 6 | Polish & edge cases | 6 |
| **Total** | | **26 steps** |

**Key design system alignment:**
- GlassStatCard with `border-glow` mouse-tracking hover
- GlassSelect for all filter dropdowns (matching Teachers page pattern)
- SearchInput with loading state
- HeroUI Tabs `variant="solid"` for view toggle
- HeroUI Chip `variant="flat"` for type + status badges
- HeroUI Progress for attendance bars
- Phosphor Icons with `weight="regular"` (MapPin, Users, PencilSimple, ClipboardText, ArrowUpRight)
- Conductor avatars via `getAvatarColorHex()`
- ScrollReveal with staggered delays for card entrance
- Motion tokens (`snappy`) for card hover/tap
- Entity accent: 3px right border using `--color-rehearsals-fg` / `--color-orchestras-fg`
- Shadow scale: `shadow-1` default, `shadow-2` on hover
- Font sizes: `text-body`, `text-small`, `text-caption` semantic tokens
