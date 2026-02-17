---
phase: 08-domain-components-loading-states
plan: 01
subsystem: ui
tags: [shadcn, radix, badge, avatar, skeleton, domain-components]

# Dependency graph
requires:
  - phase: 07-primitives
    provides: shadcn Badge, Avatar, Button primitives + cn() utility
  - phase: 06-css-foundation
    provides: CSS tokens (--primary, --muted, bg-primary/10)

provides:
  - InstrumentBadge: shadcn Badge wrapper with secondary variant
  - StatusBadge: Hebrew status string → Badge CVA variant mapper
  - AvatarInitials: Radix Avatar with getInitials() fallback
  - StatsCard: canonical stat card re-export (CompactStatCard, DetailedStatCard, ProgressStatCard)
  - Skeleton: animate-pulse bg-muted primitive
  - TableSkeleton: table-shaped skeleton with a11y attributes
  - CardSkeleton: responsive grid of card skeletons

affects:
  - 08-02 (loading states plan)
  - 08-03 (toast system plan)
  - Phase 09 (form redesign — StatusBadge)
  - Phase 10 (DesignSystem migration — StatusBadge/InstrumentBadge)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Domain component pattern: wrap shadcn primitives with music-school domain logic in src/components/domain/"
    - "Skeleton pattern: animate-pulse bg-muted (CSS token) not hardcoded bg-gray-200"
    - "Hebrew status map: פעיל/לא פעיל/בוגר/ממתין → active/inactive/graduated/pending Badge variants"

key-files:
  created:
    - src/components/domain/InstrumentBadge.tsx
    - src/components/domain/StatusBadge.tsx
    - src/components/domain/AvatarInitials.tsx
    - src/components/domain/StatsCard.tsx
    - src/components/domain/index.ts
    - src/components/feedback/Skeleton.tsx
  modified: []

key-decisions:
  - "StatsCard is a re-export of dashboard/StatCard — no duplicate implementation"
  - "DesignSystem.tsx StatusBadge/InstrumentBadge left untouched — migration deferred to Phase 10"
  - "AvatarInitials size prop (sm/md/lg) replaces ad-hoc h-8/h-10/h-12 classes across codebase"
  - "Skeleton uses bg-muted token not bg-gray-200 — consistent with CSS variable system"

patterns-established:
  - "Domain barrel: import { StatusBadge, InstrumentBadge, AvatarInitials } from '@/components/domain'"
  - "Skeleton composites: TableSkeleton(rows,cols) and CardSkeleton(count) for common page shapes"

# Metrics
duration: 10min
completed: 2026-02-17
---

# Phase 8 Plan 01: Domain Components & Skeleton Summary

**Conservatory domain component library: InstrumentBadge, StatusBadge with Hebrew status mapping, AvatarInitials with nameUtils integration, and Skeleton/TableSkeleton/CardSkeleton loading primitives**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-02-17T21:18:14Z
- **Completed:** 2026-02-17T21:28:00Z
- **Tasks:** 2
- **Files modified:** 6 (all created)

## Accomplishments

- Created `src/components/domain/` directory with 4 domain components + barrel export
- StatusBadge maps 4 Hebrew status strings (פעיל/לא פעיל/בוגר/ממתין) to shadcn Badge CVA variants (active/inactive/graduated/pending)
- AvatarInitials integrates with nameUtils.getInitials() for backward-compatible firstName/lastName/fullName support, with sm/md/lg size variants
- Skeleton primitive uses `bg-muted` CSS token; TableSkeleton has `role="status"` + `aria-label` for accessibility; CardSkeleton covers grid views

## Task Commits

Each task was committed atomically:

1. **Task 1: Create domain components (InstrumentBadge, StatusBadge, AvatarInitials, StatsCard)** - `2944663` (feat)
2. **Task 2: Create Skeleton primitive and TableSkeleton composite** - `2b52bd5` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/domain/InstrumentBadge.tsx` - Badge with secondary variant, instrument prop
- `src/components/domain/StatusBadge.tsx` - Hebrew status → Badge variant mapper with outline fallback
- `src/components/domain/AvatarInitials.tsx` - Radix Avatar + getInitials(), sm/md/lg sizes, bg-primary/10 fallback
- `src/components/domain/StatsCard.tsx` - Re-export of StatCard with CompactStatCard, DetailedStatCard, ProgressStatCard variants
- `src/components/domain/index.ts` - Barrel export for all domain components
- `src/components/feedback/Skeleton.tsx` - Skeleton primitive + TableSkeleton(rows,cols) + CardSkeleton(count)

## Decisions Made

- StatsCard re-exports dashboard/StatCard instead of duplicating — single source of truth
- DesignSystem.tsx StatusBadge and InstrumentBadge left untouched; Phase 10 handles callsite migration
- AvatarInitials uses `bg-primary/10 text-primary` fallback to match warm coral primary token

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 8 Plan 02 (loading states) dependencies are now available: `TableSkeleton`, `CardSkeleton`, `Skeleton`
- All Phase 8 Plan 03 (toast system) dependencies are available: `StatsCard`, `StatusBadge`
- Domain component barrel (`src/components/domain`) ready for Phase 9-10 callsite migrations

## Self-Check

Files exist:
- [x] src/components/domain/InstrumentBadge.tsx
- [x] src/components/domain/StatusBadge.tsx
- [x] src/components/domain/AvatarInitials.tsx
- [x] src/components/domain/StatsCard.tsx
- [x] src/components/domain/index.ts
- [x] src/components/feedback/Skeleton.tsx

Commits exist:
- [x] 2944663 — feat(08-01): create domain component library
- [x] 2b52bd5 — feat(08-01): create Skeleton primitive and composites

## Self-Check: PASSED

---
*Phase: 08-domain-components-loading-states*
*Completed: 2026-02-17*
