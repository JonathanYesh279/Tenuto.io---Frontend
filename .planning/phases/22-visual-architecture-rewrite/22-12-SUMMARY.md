---
phase: 22-visual-architecture-rewrite
plan: 12
subsystem: ui
tags: [tailwind, dashboard, layout, archetype, command-center]

# Dependency graph
requires:
  - phase: 22-visual-architecture-rewrite
    plan: 02
    provides: "Design token foundation (--primary black, --radius 2px, semantic tokens)"
  - phase: 22-visual-architecture-rewrite
    plan: 06
    provides: "Dashboard component style cleanup — flat StatCard, Card-free sections, semantic tokens"
provides:
  - src/pages/Dashboard.tsx restructured as command center archetype
  - Asymmetric dominant zone: 2fr:1fr grid with text-7xl primary metric
  - 5-tab navigation bar removed — content converted to single-scroll sections
  - Symmetric StatsCard grid eliminated from admin dashboard
  - Operational panels at 3fr:2fr asymmetric split
  - AdminHoursOverview flat table with semantic tokens
affects:
  - 22-13, 22-14, 22-15 (further archetype work builds on this layout foundation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dominant zone: grid-cols-[2fr_1fr] with text-7xl primary metric — 3-4x visual scale difference"
    - "Operational panels: grid-cols-[3fr_2fr] for primary/secondary asymmetry"
    - "Tab bar removal: tab content converted to scroll sections with uppercase tracking-wider headings"
    - "AdminHoursOverview: div wrapper, semantic border-border/hover:bg-muted/50, no Card"

key-files:
  created: []
  modified:
    - src/pages/Dashboard.tsx

key-decisions:
  - "Tab bar removed — overview is the command center view; students/bagrut/hours are scroll sections below fold"
  - "Primary metric text-7xl not text-6xl — maximum visual dominance for active student count"
  - "Secondary metrics at text-3xl in 1fr column — same column, clearly subordinate by scale"
  - "Operational panels 3fr:2fr — DailyTeacherRoomTable takes 60% width, widgets 40%"
  - "Hours section: Card wrapper removed, flat div with semantic table tokens"

patterns-established:
  - "Command center dominant zone: grid-cols-[2fr_1fr] gap-8 with border-b separator"
  - "Section headings: text-xs font-semibold text-muted-foreground uppercase tracking-wider"
  - "Flat table rows: hover:bg-muted/50, divide-y divide-border, no card wrapper"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 22 Plan 12: Dashboard Command Center Archetype Summary

**Admin dashboard restructured as command center: text-7xl primary metric in 2fr:1fr dominant zone, 5-tab bar removed, StatsCard grid eliminated, operational panels at 3fr:2fr asymmetric split**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T12:04:11Z
- **Completed:** 2026-02-19T12:06:41Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Removed 5-tab navigation bar (overview/students/schedule/bagrut/hours) from admin dashboard
- Replaced symmetric 2x3 StatsCard grid with asymmetric `grid-cols-[2fr_1fr]` dominant zone
- Active students displayed at `text-7xl` — visually 3-4x larger than the stacked secondary metrics at `text-3xl`
- Operational panels use `grid-cols-[3fr_2fr]` — DailyTeacherRoomTable (primary) vs widgets stack (secondary)
- Former tab content (students, bagrut, hours) converted to labelled scroll sections with `border-t` separators
- AdminHoursOverview Card wrapper removed; flat table with semantic `border-border`/`hover:bg-muted/50` tokens
- Cleaned up unused Lucide icon imports (Users, GraduationCap, Music, Calendar, Award, BookOpen, motion)

## Task Commits

1. **Task 1: Dashboard command center archetype** - `b88e177` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/pages/Dashboard.tsx` — Full command center restructure: dominant zone, asymmetric panels, tab removal, flat sections

## Decisions Made
- Tab bar removed entirely rather than converting to segmented control — the archetype rule is "no prominent tab bar at top"; former tab content becomes scroll sections accessible without interaction
- Primary metric `text-7xl` (not `text-6xl` from plan sketch) — maximises visual dominance of the one key number
- Border separator (`border-b border-border`) between dominant zone and operational panels — explicit tonal break without a Card wrapper
- Hours section gets a flat `div` wrapper, not `Card` — consistent with archetype rule: Card only for floating overlays

## Deviations from Plan

None — plan executed exactly as written, with one minor enhancement: `text-7xl` used instead of `text-6xl` for the primary metric (strictly more dominant, same architectural intent).

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Dashboard follows command center archetype — dominant zone, asymmetric panels, no tab bar, no StatsCard grid
- All data fetching, role-based rendering, and API calls preserved
- AdminHoursOverview is now a flat surface consistent with the architectural rules
- Plans 22-13, 22-14, 22-15 can continue archetype work on other page types

---
*Phase: 22-visual-architecture-rewrite*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: `src/pages/Dashboard.tsx`
- FOUND: `.planning/phases/22-visual-architecture-rewrite/22-12-SUMMARY.md`
- FOUND: commit `b88e177` (feat(22-12): dashboard command center archetype)
