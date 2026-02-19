---
phase: 22-visual-architecture-rewrite
plan: 10
subsystem: ui
tags: [react, tailwind, list-pages, archetype, phosphor-icons]

# Dependency graph
requires:
  - phase: 22-02
    provides: Phosphor icons installed; Sidebar migrated to fill/regular pattern
  - phase: 22-03
    provides: All page files token-clean (zero primary-NNN, zero rounded-xl/2xl/3xl)
  - phase: 22-04
    provides: Table.tsx flat data surface, semantic tokens
provides:
  - Compact identity strip pattern (title + count + action) for Teachers, Students, Orchestras
  - Hero zone eliminated from all three main entity list pages
  - Flush toolbar pattern (border-b dividers, no mb-4 gap)
  - ListPageHero component deprecated with @deprecated JSDoc comment
affects: [22-12, plan-remaining-list-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Identity strip: flex items-center justify-between py-3 border-b border-border — one-line page header"
    - "Flush toolbar: pt-2 pb-2 border-b border-border — sits directly above table header, no gap"
    - "Add button: px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm — compact, not wide CTA"
    - "PlusIcon from @phosphor-icons/react with size={14} weight='fill' for add buttons"
    - "Table row hover: hover:bg-muted (semantic) replaces hover:bg-gray-50 (hardcoded)"

key-files:
  created: []
  modified:
    - src/pages/Teachers.tsx
    - src/pages/Students.tsx
    - src/pages/Orchestras.tsx
    - src/components/ui/ListPageHero.tsx

key-decisions:
  - "[22-10 List]: Identity strip replaces ListPageHero hero zone — title + active count + add button in one line"
  - "[22-10 List]: Toolbar flush with table — border-b dividers, no mb-4 gap between toolbar and table"
  - "[22-10 List]: hover:bg-muted replaces hover:bg-gray-50 — semantic token, visible strong hover"
  - "[22-10 List]: ListPageHero deprecated (not deleted) — TheoryLessons, Rehearsals, Bagruts may still reference it (Plan 12)"
  - "[22-10 List]: PlusIcon from Phosphor (size=14, weight=fill) — consistent with icon system from 22-02"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 22 Plan 10: List Page Archetype — Teachers, Students, Orchestras Summary

**Hero zone eliminated from all three main entity list pages; compact identity strip + flush toolbar + flat table pattern applied to Teachers, Students, and Orchestras**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T09:23:51Z
- **Completed:** 2026-02-19T09:25:51Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Removed ListPageHero hero zone (4-stat card grid) from Teachers, Students, and Orchestras pages
- Replaced with compact identity strip: title + active count inline + action button in one flex row
- Toolbar is now flush with table: border-b dividers, no mb-4 gap
- Table row hover updated to hover:bg-muted (semantic, stronger than gray-50)
- PlusIcon from @phosphor-icons/react used consistently for all add buttons (size=14, weight=fill)
- ListPageHero.tsx marked @deprecated — retained for secondary list pages not yet migrated

## Task Commits

Each task was committed atomically:

1. **Task 1: Restructure Teachers and Students list pages to archetype** - `58e0f87` (feat)
2. **Task 2: Restructure Orchestras list page and deprecate ListPageHero** - `ad02b1c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/pages/Teachers.tsx` — Removed ListPageHero, heroMetrics, unused lucide icons; added PlusIcon import, identity strip, flush toolbar, hover:bg-muted
- `src/pages/Students.tsx` — Same as Teachers; removed Plus (lucide), ListPageHero, heroMetrics; added PlusIcon, identity strip, flush toolbar
- `src/pages/Orchestras.tsx` — Same pattern; removed ListPageHero, heroMetrics, Plus (lucide); added PlusIcon, identity strip
- `src/components/ui/ListPageHero.tsx` — Added @deprecated JSDoc comment at top of file

## Decisions Made
- ListPageHero deprecated (not deleted) because secondary list pages (TheoryLessons, Rehearsals, Bagruts) may still import it — those are out of scope for plan 10 and will be addressed in plan 12
- Identity strip shows "active count" (not total) in the subtitle — more actionable at a glance
- Orchestras identity strip shows activeOrchestras (not total) for same reason

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Three main entity list pages are archetype-compliant: identity strip, flush toolbar, flat table
- ListPageHero is deprecated — secondary list pages (TheoryLessons, Rehearsals, Bagruts) still use it; addressed in Plan 12
- Ready to continue with remaining plans in Phase 22

---
*Phase: 22-visual-architecture-rewrite*
*Completed: 2026-02-19*

## Self-Check: PASSED

All files verified present. Both task commits verified in git log.
