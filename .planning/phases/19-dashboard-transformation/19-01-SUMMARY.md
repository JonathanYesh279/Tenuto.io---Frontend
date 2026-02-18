---
phase: 19-dashboard-transformation
plan: 01
subsystem: ui
tags: [react, framer-motion, tailwind, dashboard, stats-card, animation, RTL]

# Dependency graph
requires:
  - phase: 18-layout-shell-and-color-system
    provides: entity color tokens (students/teachers/orchestras/rehearsals/theory/bagrut) and StatsCard coloredBg prop

provides:
  - Dashboard overview tab 3-column CSS Grid layout (lg:grid-cols-[1fr_300px])
  - StatsCard coloredBg enhancements: bg-white/50 icon chip, text-4xl number, trend pill badge
  - Framer Motion stagger entrance animation for stat cards row (Y-axis only, RTL-safe)
  - Right widget column with inline upcoming events and recent activity

affects:
  - 19-02 (right column widgets — will replace inline widget markup with extracted components)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Y-axis-only framer-motion variants for RTL safety (no X-axis transforms)"
    - "lg:grid-cols-[1fr_300px] for asymmetric two-column dashboard layout"
    - "cardRowVariants + cardItemVariants stagger pattern for grid entrance animation"
    - "bg-white/50 icon chip on colored card backgrounds for contrast"

key-files:
  created: []
  modified:
    - src/components/ui/StatsCard.tsx
    - src/pages/Dashboard.tsx

key-decisions:
  - "StatsCard trend pill uses colors.iconBg (entity pastel) as pill background — creates subtle deeper-tint on colored card surface without introducing new color values"
  - "lg breakpoint (not xl) for 3-column dashboard grid — content area ~1086px with sidebar open, lg triggers at correct width"
  - "First DOM child (main content) renders on right in RTL, second DOM child (widgets) renders on left — correct Hebrew reading flow without CSS direction hacks"

patterns-established:
  - "StatsCard coloredBg mode: bg-white/50 chip | text-4xl number | trend pill with entity iconBg"
  - "Stagger animation pattern: motion.div with cardRowVariants wrapping motion.div children with cardItemVariants"

# Metrics
duration: 7min
completed: 2026-02-18
---

# Phase 19 Plan 01: Dashboard Layout and Stat Cards Summary

**3-column dashboard grid with framer-motion stagger entrance, entity-colored stat cards using bg-white/50 icon chips and text-4xl numbers, and right widget column with events and activity**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-18T17:04:22Z
- **Completed:** 2026-02-18T17:11:07Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- StatsCard enhanced for coloredBg mode: icon container uses bg-white/50 (contrast fix), value text bumped to text-4xl (data dominance), trend badge uses pill styling with entity iconBg background
- Dashboard overview tab restructured from single-column card grid to lg:grid-cols-[1fr_300px] — main content column (stat cards + DailyTeacherRoomTable + charts) and right 300px widget column
- All 6 stat cards updated from legacy colors (blue/green/teal/orange/amber) to entity color system (students/teachers/orchestras/rehearsals/theory/bagrut) with coloredBg
- Stagger entrance animation using framer-motion variants (Y-axis only, RTL-safe, spring physics) with 0.08s staggerChildren
- Right column includes inline upcoming events and recent activity widgets (Plan 19-02 extracts these to components)
- Other dashboard tabs (students, schedule, bagrut, hours) completely unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance StatsCard for data-dominant coloredBg presentation** - `8452387` (feat)
2. **Task 2: Restructure Dashboard overview to 3-column grid with entity colors and stagger animation** - `d0fc654` (feat)

## Files Created/Modified
- `src/components/ui/StatsCard.tsx` - Icon contrast fix (bg-white/50), text-4xl number, trend pill badge for coloredBg mode
- `src/pages/Dashboard.tsx` - framer-motion import, animation variants, 3-column grid overview tab, entity-colored stat cards, right widget column

## Decisions Made
- Trend pill uses `colors.iconBg` (entity pastel bg class like bg-students-bg) as pill background — creates natural deeper-tint chip effect on the already-colored card surface without introducing new color values
- `lg:grid-cols-[1fr_300px]` not xl — content area is ~1086px with sidebar open, lg triggers at the right width per Research Pitfall 3
- DOM order places main content first, widgets second — in RTL, this means main content renders on the visual right (primary position for Hebrew), widgets on the visual left — no CSS direction manipulation needed

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- 3-column grid structural backbone is in place — Plan 19-02 can attach right-column widget components to the existing `space-y-4` container in the right column
- Right column currently has inline markup for events and activity — Plan 19-02 will extract these into `EventsWidget` and `ActivityFeedWidget` components
- framer-motion variants pattern established and ready to extend to other animated elements in 19-02

---
*Phase: 19-dashboard-transformation*
*Completed: 2026-02-18*

## Self-Check: PASSED

- FOUND: src/components/ui/StatsCard.tsx
- FOUND: src/pages/Dashboard.tsx
- FOUND: .planning/phases/19-dashboard-transformation/19-01-SUMMARY.md
- FOUND: commit 8452387 (Task 1)
- FOUND: commit d0fc654 (Task 2)
