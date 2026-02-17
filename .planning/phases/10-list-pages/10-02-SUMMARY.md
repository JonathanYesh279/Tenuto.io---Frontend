---
phase: 10-list-pages
plan: 02
subsystem: ui
tags: [search, table, pagination, skeleton, empty-state, rtl, audit-trail]

# Dependency graph
requires:
  - phase: 10-list-pages/10-01
    provides: SearchInput component, upgraded Pagination with entityLabel, TableSkeleton, EmptyState
provides:
  - All 5 list pages use shared SearchInput with X clear button
  - AuditTrail migrated from inline <table> to shared Table.tsx for both tabs
  - AuditTrail Pagination with entityLabel="רשומות" for both tabs
  - Rehearsals shows TableSkeleton on load and EmptyState when empty
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SearchInput wiring: onChange receives string value directly (not event), onClear sets to empty string"
    - "AuditTrail column arrays defined as const inside component — close to render, uses formatDate/getEntityTypeLabel/getStatusBadge helpers"
    - "EmptyState hasActiveFilters pattern: Object.values(filters).some(f => f && f !== 'all') determines CTA visibility"

key-files:
  created: []
  modified:
    - src/pages/Teachers.tsx
    - src/pages/Students.tsx
    - src/pages/Orchestras.tsx
    - src/pages/Rehearsals.tsx
    - src/pages/AuditTrail.tsx

key-decisions:
  - "Rehearsals empty state uses IIFE pattern ((() => {...})()) to compute hasActiveFilters inline — avoids extracting to variable outside JSX"
  - "AuditTrail column definitions placed before return statement (not at module level) — formatDate/getEntityTypeLabel/getStatusBadge are component methods, not module-scope helpers"
  - "Rehearsals loading changed from manual spinner to early-return TableSkeleton — consistent with Teachers/Students pattern"

patterns-established:
  - "SearchInput replaces <div class='relative'><Search .../><input .../></div> — component encapsulates icon, input, and X button"
  - "AuditTrail Table columns use render: (row: any) => ... pattern for all computed values"

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 10 Plan 02: Per-Page Wiring Summary

**SearchInput wired to all 4 search-enabled list pages, AuditTrail migrated from raw HTML tables to shared Table.tsx + Pagination.tsx with "רשומות" label, and Rehearsals gets TableSkeleton loading + EmptyState empty view.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-17T23:08:35Z
- **Completed:** 2026-02-17T23:11:35Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- SearchInput with X clear button wired to Teachers, Students, Orchestras, and Rehearsals — all 4 search-enabled list pages
- AuditTrail inline `<table>` markup eliminated from both tabs; replaced with shared Table.tsx using render-prop column definitions
- AuditTrail inline pagination buttons (ChevronLeft/ChevronRight DIY) replaced with Pagination component showing "מציג X-Y מתוך Z רשומות"
- Rehearsals loading state changed from manual spinner div to TableSkeleton — matches shimmer pattern used by Teachers/Students
- Rehearsals empty list changed from inline div to EmptyState component with contextual CTA ("צור חזרה חדשה") that hides when filters active

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire SearchInput to Teachers, Students, Orchestras** - `55600af` (feat)
2. **Task 2: Wire Rehearsals (SearchInput + TableSkeleton + EmptyState) and AuditTrail (Table.tsx + Pagination migration)** - `925197d` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/pages/Teachers.tsx` - Replaced inline search div with SearchInput; removed Search from lucide-react imports
- `src/pages/Students.tsx` - Replaced inline search div with SearchInput; removed Search from lucide-react imports
- `src/pages/Orchestras.tsx` - Replaced inline search div with SearchInput; removed Search from lucide-react imports
- `src/pages/Rehearsals.tsx` - SearchInput + TableSkeleton early-return + EmptyState with hasActiveFilters logic
- `src/pages/AuditTrail.tsx` - Full migration: Table.tsx for both tabs, Pagination for both tabs, TableSkeleton for loading, removed ChevronLeft/ChevronRight

## Decisions Made

- Rehearsals empty state uses an IIFE inside JSX to compute `hasActiveFilters` inline without polluting surrounding scope — compact and avoids a separate variable declaration
- AuditTrail column arrays (`deletionLogColumns`, `pastActivitiesColumns`) defined inside the component function (before `return`) rather than at module level — formatDate/getEntityTypeLabel/getStatusBadge are component-scoped helpers, so column definitions must also be inside the component
- `showItemsPerPage={false}` on both AuditTrail Pagination instances — audit log has fixed 20 items/page, no need to expose the selector

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 5 list pages now share identical table chrome (Table.tsx), search-with-clear (SearchInput), and contextual pagination (Pagination with entityLabel)
- Phase 10 Plan 3 (if any) can proceed — shared component layer is complete
- AuditTrail is the last page to be migrated — no remaining inline tables in scope

---
*Phase: 10-list-pages*
*Completed: 2026-02-18*

## Self-Check: PASSED

- Teachers.tsx: FOUND
- Students.tsx: FOUND
- Orchestras.tsx: FOUND
- Rehearsals.tsx: FOUND
- AuditTrail.tsx: FOUND
- 10-02-SUMMARY.md: FOUND
- Commit 55600af: FOUND
- Commit 925197d: FOUND
