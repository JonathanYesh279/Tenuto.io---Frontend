---
phase: 20-list-pages-and-table-system
plan: 01
subsystem: ui
tags: [react, framer-motion, tailwind, typescript, table, hero]

# Dependency graph
requires:
  - phase: 19-dashboard-transformation
    provides: StatsCard coloredBg pattern, framer-motion stagger animation, entity color tokens

provides:
  - ListPageHero reusable hero stats zone component (src/components/ui/ListPageHero.tsx)
  - Denser Table.tsx with px-4 py-3 cells, hero-aware maxHeight, icon-only actions

affects:
  - 20-02 (Teachers/Students/Orchestras list pages — consume ListPageHero and Table)
  - 20-03 and beyond (any future list pages)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ENTITY_STYLES static const lookup avoids dynamic Tailwind class generation (tree-shake safety)
    - Y-axis-only framer-motion stagger (no X-axis transforms — RTL safe)
    - Icon-only action buttons with p-1.5 compact sizing and tooltip via title attribute

key-files:
  created:
    - src/components/ui/ListPageHero.tsx
  modified:
    - src/components/ui/Table.tsx

key-decisions:
  - "ListPageHero uses ENTITY_STYLES static const lookup (not string interpolation) — ensures Tailwind does not tree-shake entity color classes"
  - "Table maxHeight changed from calc(100vh-280px) to calc(100vh-380px) — accounts for hero zone ~180px + filter bar + pagination"
  - "Table action buttons icon-only (p-1.5, w-4 h-4) — text labels available as title tooltip, not rendered inline"
  - "Table hover changed from amber-50/60 to gray-50 — v2.1 uses neutral gray, warm amber was v2.0"

patterns-established:
  - "Entity hero zones: ListPageHero with entityColor prop + ENTITY_STYLES lookup — reuse on every list page"
  - "Stat card grids in hero: motion.div containerVariants wrapping, motion.div itemVariants per card, staggerChildren 0.06"

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 20 Plan 01: List Page Hero and Table Density Summary

**Reusable ListPageHero component with entity-colored stat zones and Framer Motion stagger, plus Table.tsx upgraded to px-4 py-3 dense rows with icon-only actions and hero-aware maxHeight**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-18T20:25:11Z
- **Completed:** 2026-02-18T20:28:29Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- Created ListPageHero.tsx — complete reusable hero stats zone with entity-colored background, animated metric grid, title, and optional add-action button; ready to wire into Teachers, Students, Orchestras list pages
- Upgraded Table.tsx — reduced cell padding to px-4 py-3 (approximately 25% more rows above fold), updated maxHeight to account for hero zone, replaced amber hover with neutral gray, replaced text-label action buttons with icon-only compact style

## Task Commits

1. **Task 1: Create ListPageHero shared component** - `eef84e4` (feat)
2. **Task 2: Upgrade Table.tsx for data density and hero-aware layout** - `8434b33` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/components/ui/ListPageHero.tsx` - New reusable hero stats zone: entity-colored background, framer-motion stagger grid, optional add button
- `src/components/ui/Table.tsx` - Denser rows (px-4 py-3), hero-aware maxHeight (380px offset), neutral gray hover, icon-only action buttons

## Decisions Made

- **ENTITY_STYLES static lookup:** Used `const ENTITY_STYLES = { teachers: {...}, students: {...}, orchestras: {...} } as const` instead of string interpolation to guarantee Tailwind does not tree-shake entity color utility classes.
- **Y-axis stagger only:** itemVariants use `{ opacity: 0, y: 12 }` — no X-axis transform — preserving RTL safety established in Phase 19.
- **maxHeight 380px offset:** Accounts for hero zone (~180px) + filter toolbar (~52px) + header (~64px) + buffer (~24px) + pagination (~60px) = ~380px. Prevents table clip with hero zone present.
- **Icon-only action buttons:** Text labels removed from rendered JSX, preserved as `title` tooltip attributes for accessibility. Icon size increased from w-3 h-3 to w-4 h-4 for better touch targets.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npm run build` cannot run in WSL on /mnt/c/ NTFS mount (pre-existing esbuild binary mismatch constraint, documented in STATE.md). TypeScript check (`npx tsc --noEmit`) confirms zero errors in ListPageHero.tsx and Table.tsx. All TypeScript errors in tsc output are pre-existing across other files (BagrutForm, AttendanceManager, etc.), unrelated to this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ListPageHero and Table changes are ready — Plan 20-02 can immediately wire ListPageHero into Teachers, Students, and Orchestras list pages
- No blockers — both components compile cleanly with no new TypeScript errors

---
*Phase: 20-list-pages-and-table-system*
*Completed: 2026-02-18*
