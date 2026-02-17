---
phase: 10-list-pages
plan: 01
subsystem: ui
tags: [table, pagination, search, tailwind, lucide-react, sticky-header, rtl]

# Dependency graph
requires:
  - phase: 06-design-tokens
    provides: CSS tokens (amber color scale, muted-foreground, ring, input, background)
  - phase: 07-shadcn-primitives
    provides: cn utility at @/lib/utils
provides:
  - Sticky-header Table.tsx with warm amber hover rows (all 5 list pages inherit)
  - SearchInput.tsx reusable component with clear button (new)
  - Pagination.tsx with contextual entityLabel prop (backward-compatible)
affects: [10-02, all pages using Table.tsx, AuditTrail.tsx using Pagination.tsx]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-layer table wrapper: overflow-hidden > overflow-x-auto > max-h overflow-y-auto for sticky thead"
    - "RTL icon placement: right-3 = visual start (search), left-2 = visual end (clear X)"
    - "thead sticky uses shadow-[0_1px_0_0_...] separator — border-b disappears on sticky elements"

key-files:
  created:
    - src/components/ui/SearchInput.tsx
  modified:
    - src/components/ui/Table.tsx
    - src/components/ui/Pagination.tsx

key-decisions:
  - "Table wrapper restructured to three layers (overflow-hidden > overflow-x-auto > max-h overflow-y-auto) to enable sticky thead inside a scroll container"
  - "thead shadow separator instead of border-b — CSS borders disappear on sticky elements, box-shadow does not"
  - "Pagination entityLabel is optional with 'פריטים' fallback — all existing callers are backward-compatible"
  - "SearchInput uses physical RTL positions: right-3 for search icon (visual start), left-2 for clear X (visual end)"

patterns-established:
  - "Amber hover: hover:bg-amber-50/60 transition-colors duration-150 — warm Monday.com aesthetic on all table rows"
  - "SearchInput clear X renders conditionally on {value && ...} — no button rendered when input is empty"

# Metrics
duration: 8min
completed: 2026-02-18
---

# Phase 10 Plan 01: Shared UI Components Summary

**Sticky thead + warm amber hover in Table.tsx, new SearchInput with clear-X button, and contextual Hebrew entity label in Pagination — all 5 list pages inherit these improvements automatically.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-17T23:04:13Z
- **Completed:** 2026-02-17T23:12:00Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Table.tsx restructured with three-layer wrapper enabling sticky thead that stays visible while scrolling long lists
- Warm amber hover (hover:bg-amber-50/60) replaces gray-50 hover on all rows — consistent with Monday.com-inspired aesthetic
- SearchInput.tsx created: search icon (right/visual-start in RTL), conditional clear X button (left/visual-end), optional loading spinner
- Pagination.tsx entityLabel prop added: page info now shows "מציג 1–20 מתוך 120 תלמידים" instead of generic "פריטים"

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade Table.tsx with sticky headers and warm hover rows** - `992bce8` (feat)
2. **Task 2: Create SearchInput component and upgrade Pagination with entityLabel** - `43561ee` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/components/ui/Table.tsx` - Three-layer wrapper, sticky thead with shadow, amber hover rows
- `src/components/ui/SearchInput.tsx` - New component: search icon + conditional clear X + isLoading spinner
- `src/components/ui/Pagination.tsx` - Added entityLabel?: string prop; page info uses en-dash and contextual label

## Decisions Made

- Table wrapper restructured to three layers (overflow-hidden > overflow-x-auto > max-h overflow-y-auto) to enable sticky thead inside a scroll container
- Used `shadow-[0_1px_0_0_theme(colors.gray.200)]` on thead instead of `border-b` — CSS borders disappear on sticky elements, box-shadow does not
- Pagination entityLabel is optional with `'פריטים'` fallback — all existing callers unchanged
- SearchInput uses physical RTL positions: `right-3` for search icon (visual start in RTL), `left-2` for clear X (visual end in RTL)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three shared UI components upgraded and ready for per-page wiring in Plan 10-02
- Table.tsx backward-compatible — all existing callers get sticky headers and amber hover automatically
- SearchInput.tsx is a new component, will be imported by list pages in 10-02
- Pagination.tsx backward-compatible — entityLabel optional, AuditTrail.tsx and other callers unchanged until 10-02 wires them

---
*Phase: 10-list-pages*
*Completed: 2026-02-18*

## Self-Check: PASSED

- Table.tsx: FOUND
- SearchInput.tsx: FOUND
- Pagination.tsx: FOUND
- 10-01-SUMMARY.md: FOUND
- Commit 992bce8: FOUND
- Commit 43561ee: FOUND
