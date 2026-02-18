---
phase: 12-layout-dashboard
plan: 01
subsystem: ui
tags: [react, tailwind, design-tokens, sidebar, header, layout, navlink, rtl]

# Dependency graph
requires:
  - phase: 06-design-foundation
    provides: CSS tokens (--sidebar, --primary, --background, --card) in :root and tailwind.config.js
  - phase: 07-shadcn-modals
    provides: shadcn DropdownMenu used in Header
provides:
  - Dark warm sidebar using bg-sidebar token with NavLink active state highlighting
  - Header with warm primary coral avatar/buttons replacing indigo
  - Layout shell using bg-background token
affects:
  - phase: 12-02 (Dashboard) — consistent shell background for dashboard content
  - All pages — every page uses Layout shell, sidebar, and header

# Tech tracking
tech-stack:
  added: []
  patterns:
    - NavLink with className function prop for active state (replaces Link + manual isActive useCallback)
    - sidebar-foreground opacity variants for dark-background legibility (text-sidebar-foreground/70, bg-sidebar-foreground/10)
    - end prop on /dashboard NavLink to prevent broad prefix matching

key-files:
  created: []
  modified:
    - src/components/Sidebar.tsx
    - src/components/Header.tsx
    - src/components/Layout.tsx

key-decisions:
  - "NavLink end prop on /dashboard nav item — prevents broad startsWith matching marking Home as always-active"
  - "Mobile hamburger button keeps bg-white — sits against page background, not sidebar dark surface"
  - "Modal overlays in Sidebar keep bg-white — they are overlay surfaces, not part of sidebar"
  - "getRoleBadgeColor updated to dark-compatible opacity variants (red-300, blue-300, etc.) for dark sidebar legibility"

patterns-established:
  - "NavLink className function pattern: className={({ isActive }) => `base-classes ${isActive ? 'active-classes' : 'inactive-classes'}`}"
  - "Sidebar surface token pattern: bg-sidebar, text-sidebar-foreground, border-sidebar-foreground/10"
  - "Dark sidebar element pattern: bg-sidebar-foreground/10 for surfaces, text-sidebar-foreground/70 for muted text"

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 12 Plan 01: Layout Shell Summary

**Dark warm sidebar using bg-sidebar token (navy 220 25% 18%) with NavLink active highlighting, warm primary coral header replacing indigo, and bg-background layout token replacing hardcoded bg-gray-50**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T12:09:10Z
- **Completed:** 2026-02-18T12:12:xx Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Sidebar converted from bg-white to dark warm bg-sidebar token with all interior elements updated for dark-background legibility
- NavLink with className function replaces Link + manual isActive useCallback — active state is now React Router native
- Header avatar (bg-primary coral) and dashboard button (bg-primary/10) replace indigo palette
- Layout root, main, and inner div use bg-background CSS token instead of hardcoded bg-gray-50

## Task Commits

Each task was committed atomically:

1. **Task 1: Restyle Sidebar with dark warm background and NavLink active state** - `e6c2e18` (feat)
2. **Task 2: Update Header and Layout to use warm design tokens** - `c072035` (feat)

**Plan metadata:** (created next)

## Files Created/Modified
- `src/components/Sidebar.tsx` - Dark warm sidebar, NavLink active state, dark-compatible badge/text colors
- `src/components/Header.tsx` - Warm card background, primary coral avatar and dashboard button
- `src/components/Layout.tsx` - bg-background token replaces bg-gray-50 (3 occurrences)

## Decisions Made
- NavLink `end` prop on `/dashboard` route — prevents `/dashboard` prefix matching all child routes as active
- Mobile hamburger button kept as `bg-white` — it sits against the page background, not the dark sidebar surface (correct per research Pitfall 4)
- Modal overlay divs inside Sidebar retain `bg-white` — these are overlay surfaces, not part of the sidebar surface
- `getRoleBadgeColor` updated from light-background variants (bg-red-100 text-red-700) to dark-compatible opacity variants (bg-red-500/20 text-red-300)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Layout shell fully restyled with warm design tokens
- Ready for Phase 12 Plan 02 (Dashboard redesign: greeting, StatsCard color props)
- Note: git log shows 12-02 commits already exist from prior session — verify before executing 12-02 plan

---
*Phase: 12-layout-dashboard*
*Completed: 2026-02-18*
