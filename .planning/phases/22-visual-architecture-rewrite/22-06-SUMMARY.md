---
phase: 22-visual-architecture-rewrite
plan: 06
subsystem: ui
tags: [tailwind, design-tokens, dashboard, css-cleanup, card-removal]

# Dependency graph
requires:
  - phase: 22-visual-architecture-rewrite
    plan: 01
    provides: "Cool neutral CSS token foundation (--primary black, --radius 2px, semantic tokens)"
provides:
  - 24 dashboard component files cleaned of hardcoded primary-NNN colors
  - StatCard flat surface (no decorative shadow, no primary-NNN border hover)
  - All dashboard rounded-xl/2xl/lg replaced with sharp 2px rounded corners
  - Card component removed from all dashboard sections (replaced with div/section)
affects:
  - 22-09 (Dashboard archetype restructuring works with clean component base)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Primary-NNN hex classes → semantic bg-primary/text-primary/bg-muted tokens"
    - "rounded-lg/xl/2xl → rounded (2px) across all dashboard components"
    - "Card on page sections → div or section with spacing (not Card for modal/popover)"
    - "Flat stat cards: no shadow, no decorative border hover color"

key-files:
  created: []
  modified:
    - src/components/dashboard/MainDashboard.tsx
    - src/components/dashboard/RealDataDashboard.tsx
    - src/components/dashboard/SuperAdminDashboard.tsx
    - src/components/dashboard/TeacherDashboard.tsx
    - src/components/dashboard/TheoryTeacherDashboard.tsx
    - src/components/dashboard/ConductorDashboard.tsx
    - src/components/dashboard/BagrutDashboard.tsx
    - src/components/dashboard/AttendanceDashboard.tsx
    - src/components/dashboard/StatCard.tsx
    - src/components/dashboard/DashboardRefresh.tsx
    - src/components/dashboard/RecentActivity.tsx
    - src/components/dashboard/StudentStatistics.tsx
    - src/components/dashboard/TeacherStatistics.tsx
    - src/components/dashboard/LessonStatistics.tsx
    - src/components/dashboard/charts/DailyTeacherRoomTable.tsx
    - src/components/dashboard/charts/TeacherRoomSchedule.tsx
    - src/components/dashboard/charts/StudentActivityCharts.tsx
    - src/components/dashboard/charts/InstrumentDistributionChart.tsx
    - src/components/dashboard/charts/ClassDistributionChart.tsx
    - src/components/dashboard/charts/BagrutProgressDashboard.tsx
    - src/components/dashboard/charts/AttendanceTrendsChart.tsx
    - src/components/dashboard/widgets/UpcomingEventsWidget.tsx
    - src/components/dashboard/widgets/RecentActivityWidget.tsx

key-decisions:
  - "Card on dashboard page sections → div/section with spacing; Card kept only for popover/modal content"
  - "StatCard: no hover:shadow-md, no border-primary-NNN — flat data indicator surface"
  - "DashboardRefresh toggle: peer-checked:bg-primary (not primary-600)"
  - "StatCard actions dropdown retains shadow-md (it is an interaction layer)"

patterns-established:
  - "Dashboard stat cards: colored bg via Tailwind color utilities (bg-blue-50 etc) — not primary-NNN"
  - "Progress bars: bg-primary not bg-primary-500"

# Metrics
duration: 6min
completed: 2026-02-19
---

# Phase 22 Plan 06: Dashboard Component Style Cleanup Summary

**Zero hardcoded primary-NNN color classes and zero excessive rounding across all 24 dashboard component files — flat stat cards, semantic token buttons, Card-free page sections**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-19T11:29:00Z
- **Completed:** 2026-02-19T11:36:48Z
- **Tasks:** 2
- **Files modified:** 24

## Accomplishments
- Removed all `bg-primary-NNN`, `text-primary-NNN`, `border-primary-NNN` from 24 dashboard files
- Replaced all `rounded-xl`, `rounded-2xl`, `rounded-lg` with `rounded` (2px) across dashboard
- Removed Card component from all page-level section wrappers in dashboard (7 chart files, 2 widget files, SuperAdminDashboard)
- StatCard is now a flat data surface: no hover:shadow-md, no decorative border color hover
- DashboardRefresh: toggle uses semantic `bg-primary`, `peer-checked:bg-primary`; countdown ring uses `text-primary`

## Task Commits

Each task was committed atomically:

1. **Task 1: Clean dashboard layout and stat components** - `2ee5d0d` (feat)
2. **Task 2: Clean dashboard charts and widget components** - `d0f0aaa` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/dashboard/MainDashboard.tsx` - text-primary-600 → text-primary; tab active state semantic tokens; quick action buttons bg-muted
- `src/components/dashboard/StatCard.tsx` - Removed hover:shadow-md and hover:border-primary-300; progress bar bg-primary; flat surface
- `src/components/dashboard/DashboardRefresh.tsx` - All primary-NNN → semantic; rounded-lg → rounded; toggle using bg-primary
- `src/components/dashboard/RealDataDashboard.tsx` - bg-primary-100 → bg-muted; rounded-lg → rounded; removed hover:shadow-md
- `src/components/dashboard/SuperAdminDashboard.tsx` - Removed Card import; Card sections → section elements; border-primary-600 → border-primary
- `src/components/dashboard/TeacherDashboard.tsx` - StatCard rounded-lg → rounded; QuickActionButton rounded-lg → rounded
- `src/components/dashboard/TheoryTeacherDashboard.tsx` - TheoryStatCard rounded-lg → rounded; QuickActionButton → rounded
- `src/components/dashboard/ConductorDashboard.tsx` - StatCard and QuickActionButton rounded-lg → rounded
- `src/components/dashboard/BagrutDashboard.tsx` - StatCard and QuickActionButton rounded-lg → rounded
- `src/components/dashboard/AttendanceDashboard.tsx` - AttendanceStatCard rounded-lg → rounded; tab nav rounded-lg → rounded
- `src/components/dashboard/RecentActivity.tsx` - text-primary-600/800 → text-primary; bg-primary-100/700 → bg-muted/text-foreground
- `src/components/dashboard/StudentStatistics.tsx` - bg-primary-500 → bg-primary on progress bars
- `src/components/dashboard/TeacherStatistics.tsx` - bg-primary-500 → bg-primary on progress bars
- `src/components/dashboard/LessonStatistics.tsx` - bg-primary-500 → bg-primary on progress bars
- `src/components/dashboard/charts/*.tsx` - All 7 chart files: Card → div, Card imports removed, rounded-xl/2xl → rounded, rounded-lg → rounded
- `src/components/dashboard/widgets/*.tsx` - Both widget files: Card → div, Card imports removed, rounded-lg → rounded

## Decisions Made
- Card on dashboard sections replaced with div/section — Card is now only for modal/popover/dropdown content
- StatCard action dropdown retains shadow-md (it is a genuine interaction layer popover)
- stat cards across all role dashboards (Teacher, Conductor, Theory, Bagrut, Attendance) receive same treatment

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard component base is clean: Plan 09 (Dashboard archetype restructuring) can now focus purely on layout/grid restructuring without fighting hardcoded style conflicts
- Zero bg-primary-NNN, zero rounded-xl/2xl across all 24 dashboard files confirmed
- StatCard is flat, Card-free dashboard sections confirmed

---
*Phase: 22-visual-architecture-rewrite*
*Completed: 2026-02-19*
