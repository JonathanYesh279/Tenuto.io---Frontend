---
phase: 20-list-pages-and-table-system
plan: 02
subsystem: pages
tags: [react, tailwind, typescript, list-pages, hero-zone, avatar]

# Dependency graph
requires:
  - phase: 20-01
    provides: ListPageHero component, AvatarInitials, entity color tokens

provides:
  - Teachers.tsx with ListPageHero hero zone, compact filter toolbar, avatar in name column
  - Students.tsx with ListPageHero hero zone, compact filter toolbar, avatar in name column
  - Orchestras.tsx with ListPageHero hero zone, compact filter toolbar, music icon in name column

affects:
  - All three list pages now share consistent hero -> toolbar -> data vertical flow
  - 20-03 (any additional list pages) can follow the same pattern

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ListPageHero wired into all three list pages with entityColor prop
    - AvatarInitials in table name columns with entity colorClassName (bg-teachers-bg/bg-students-bg)
    - Compact filter toolbar: no Card wrapper, py-1.5 text-sm selects, results count inline as mr-auto
    - Add buttons moved from filter toolbar into ListPageHero action prop

key-files:
  created: []
  modified:
    - src/pages/Teachers.tsx
    - src/pages/Students.tsx
    - src/pages/Orchestras.tsx

key-decisions:
  - "Add buttons moved from filter toolbar to ListPageHero action prop — hero zone owns the primary action"
  - "Orchestras view mode toggle uses bg-orchestras-fg for active state (entity color, not primary-500)"
  - "Orchestras data area flattened — outer Card wrapper removed, table/grid render directly below toolbar"
  - "hasMembers filter removed from compact toolbar (not in plan scope) to keep toolbar clean"

patterns-established:
  - "List page structure: ListPageHero (entity stats) -> compact toolbar (no Card) -> data table/grid"
  - "Entity avatar colors: bg-teachers-bg/text-teachers-fg, bg-students-bg/text-students-fg"
  - "Music icon circle for Orchestras table name: w-8 h-8 rounded-full bg-orchestras-bg text-orchestras-fg"

# Metrics
duration: 6min
completed: 2026-02-18
---

# Phase 20 Plan 02: List Pages Restructured with Hero Zone and Avatars Summary

**Teachers, Students, and Orchestras list pages restructured with ListPageHero entity-colored stat zones, compact filter toolbars (no Card wrapper), and avatar/icon in table name columns**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-02-18T20:30:59Z
- **Completed:** 2026-02-18T20:37:19Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Restructured Teachers.tsx — ListPageHero (teachers entity color, 4 stats), compact toolbar (instrument dropdown + role select), AvatarInitials (bg-teachers-bg) in name column
- Restructured Students.tsx — ListPageHero (students entity color, 4 stats), compact toolbar (orchestra + instrument + stage selects), AvatarInitials (bg-students-bg) in name column
- Restructured Orchestras.tsx — ListPageHero (orchestras entity color, 4 stats), view mode toggle above toolbar with entity-colored active state, compact filter toolbar, music icon circle (bg-orchestras-bg) in name column

## Task Commits

1. **Task 1: Restructure Teachers.tsx** - `6f42a92` (feat)
2. **Task 2: Restructure Students.tsx** - `b1fbdd2` (feat)
3. **Task 3: Restructure Orchestras.tsx** - `7ecfccb` (feat)

**Plan metadata:** (docs commit below)

## Files Modified

- `src/pages/Teachers.tsx` - Hero zone + compact toolbar + AvatarInitials in name column; removed 6-card stats grid and Card-wrapped filter
- `src/pages/Students.tsx` - Hero zone + compact toolbar + AvatarInitials in name column; removed 4-card stats grid and Card-wrapped filter
- `src/pages/Orchestras.tsx` - Hero zone + compact toolbar + music icon circle in name column; flattened data area, entity-colored view toggle

## Decisions Made

- **Add button to hero zone:** The primary action (add entity) belongs in the hero zone via `action` prop, not cluttered in the filter toolbar. Consistent across all three pages.
- **Orchestras view toggle entity color:** Active button uses `bg-orchestras-fg` (entity amber) rather than `bg-primary-500` — aligns with entity-colored visual identity established in Phase 18.
- **Orchestras Card wrapper removed:** The outer Card that previously wrapped the table/grid data area was removed since the hero zone now provides the visual anchor. Table and grid render directly without card frame.
- **hasMembers checkbox excluded from compact toolbar:** The "עם חברים" filter was present in old Orchestras Card layout but not in the plan's compact toolbar spec. Removed to keep toolbar clean (one-row layout intent).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npm run build` cannot run in WSL on /mnt/c/ NTFS mount (pre-existing esbuild binary mismatch). TypeScript check (`npx tsc --noEmit`) confirms zero NEW errors in the three modified files. All TypeScript errors visible in tsc output for these files are pre-existing (Table column type mismatches, cascade deletion service types, etc.) — confirmed by checking original file at `git show HEAD~3:src/pages/Orchestras.tsx`.

## User Setup Required

None.

## Next Phase Readiness

- Plan 20-02 complete — all three list pages now follow consistent hero -> toolbar -> data vertical flow
- Phase 20 (3 plans total): Plans 01 and 02 complete. Plan 03 (if it exists) can build on the established pattern.
- Entity color classes (bg-teachers-bg, bg-students-bg, bg-orchestras-bg) used in avatar components — confirmed present in Tailwind config from Phase 18.

## Self-Check: PASSED

- src/pages/Teachers.tsx: FOUND
- src/pages/Students.tsx: FOUND
- src/pages/Orchestras.tsx: FOUND
- .planning/phases/20-list-pages-and-table-system/20-02-SUMMARY.md: FOUND
- Commit 6f42a92 (Teachers): FOUND
- Commit b1fbdd2 (Students): FOUND
- Commit 7ecfccb (Orchestras): FOUND

---
*Phase: 20-list-pages-and-table-system*
*Completed: 2026-02-18*
