---
phase: 23-dashboard-visual-redesign
plan: 03
subsystem: dashboard-layout
tags: [dashboard, stat-cards, grid-layout, dark-mode, placeholders]
dependency_graph:
  requires: [23-01-token-system]
  provides: [v4-dashboard-skeleton, stat-cards, 12-col-grid, dark-mode-toggle]
  affects: [admin-dashboard, future-chart-components, future-widget-components]
tech_stack:
  added: []
  patterns: [12-column-grid, 9-3-split, entity-color-coding, placeholder-slots, dark-mode-class-toggle]
key_files:
  created:
    - src/components/dashboard/v4/StatCard.tsx: "Reusable entity-colored pastel stat card component with loading states"
  modified:
    - src/pages/Dashboard.tsx: "Rebuilt admin dashboard with 12-col grid layout, stat cards, chart/widget placeholders, dark mode FAB"
decisions:
  - title: "12-column grid with 9:3 split"
    rationale: "Establishes main content area (9 cols) and right sidebar (3 cols) for widgets — standard dashboard pattern"
    impact: "Charts and widgets have defined placement zones, responsive on mobile (single column)"
  - title: "Placeholder slots with IDs for future charts"
    rationale: "Plans 04-05 will implement actual chart components — placeholders mark integration points"
    impact: "financial-chart-slot, attendance-chart-slot, demographics-chart-slot, teacher-table-slot IDs enable targeted replacement"
  - title: "Entity color coding for stat cards"
    rationale: "Visual consistency — students=indigo, teachers=amber, orchestras=sky, rehearsals=emerald"
    impact: "Color system carries through entire dashboard, creates visual hierarchy"
  - title: "Dark mode FAB toggle implementation"
    rationale: "Immediate dark mode testing capability, toggles .dark class on html element"
    impact: "All dark: prefixed utilities now functional, localStorage persistence across sessions"
  - title: "Removed v3.0 DOMINANT ZONE layout"
    rationale: "v4.0 redesign replaces hierarchical dominant zone with equal-weight stat cards"
    impact: "No more 2fr:1fr asymmetric split, all metrics get similar visual weight"
metrics:
  duration_seconds: 155
  duration_minutes: 2.6
  tasks_completed: 2
  files_modified: 2
  files_created: 1
  commits: 2
  lines_changed: 219
  completed_at: "2026-02-19T23:13:19Z"
---

# Phase 23 Plan 03: Dashboard Layout Rebuild Summary

**One-liner:** Rebuilt admin dashboard with v4.0 12-column grid (9:3 split), entity-colored stat cards, placeholder slots for charts/widgets, and dark mode FAB toggle.

## What Was Built

Complete dashboard skeleton restructure establishing the v4.0 layout foundation:

1. **StatCard Component (src/components/dashboard/v4/StatCard.tsx)**
   - Entity-specific color palettes (indigo/amber/sky/emerald)
   - Pastel backgrounds with matching borders and text colors
   - Large extrabold numbers with Hebrew locale formatting
   - Phosphor icon slot (28px, duotone weight)
   - Optional trend badge (top-right corner, white background)
   - Loading state with pulse animation
   - Full dark mode support (all entity colors have dark: variants)
   - Card structure: rounded-3xl, border, 6px padding

2. **Dashboard Layout (src/pages/Dashboard.tsx)**
   - **12-column grid system** with responsive breakpoints
   - **Main content area** (col-span-9):
     - 4 stat cards in responsive row (1/2/4 columns on mobile/tablet/desktop)
     - Financial trends chart placeholder (full-width, 320px min-height)
     - 2-column charts section (attendance + demographics placeholders, 280px min-height each)
     - Teacher performance table placeholder (200px min-height)
   - **Right sidebar** (col-span-3):
     - Calendar widget placeholder
     - Agenda widget placeholder
     - Messages widget placeholder
   - **Dark mode FAB**: Fixed bottom-left (6px offset), rounded-full, MoonIcon with amber accent in dark mode
   - **Dark mode initialization**: useEffect checks localStorage on mount, adds .dark class if saved
   - **Preserved functionality**:
     - All data loading logic (stats, activities, events, hours summaries)
     - All role-based routing (SuperAdmin, TheoryTeacher, Conductor, Teacher dashboards)
     - All state management (loading, refresh, error handling)
     - AdminHoursOverview component at bottom

3. **Import Cleanup**
   - Removed: MiniCalendarWidget, UpcomingEventsWidget, RecentActivityWidget
   - Removed: StudentActivityCharts, InstrumentDistributionChart, ClassDistributionChart, BagrutProgressDashboard, DailyTeacherRoomTable
   - Added: StatCard, MoonIcon, UsersIcon, GraduationCapIcon, MusicNotesIcon, CalendarCheckIcon
   - Note: Removed chart/widget components still exist in their files — just not imported/rendered in admin dashboard anymore

## Deviations from Plan

None — plan executed exactly as written.

## Key Technical Decisions

### 1. Placeholder Slot Strategy
**Decision:** Use semantic IDs for all placeholder divs (financial-chart-slot, attendance-chart-slot, etc.)

**Rationale:** Plans 04-05 need clear integration points. IDs enable targeted Find/Replace when implementing actual components.

**Impact:** Each placeholder can be replaced atomically without affecting other layout elements.

### 2. Entity Color System
**Decision:** Consistent entity-to-color mapping across all stat cards and future components.

**Rationale:** Visual consistency reinforces mental model — students always indigo, teachers always amber, etc.

**Impact:** Color system creates cohesive dashboard identity, easier to scan visually.

### 3. Dark Mode Toggle Placement
**Decision:** Fixed bottom-left FAB (Floating Action Button) instead of top-right header button.

**Rationale:** Persistent visibility without interfering with header actions, follows modern dashboard patterns (e.g., Notion, Linear).

**Impact:** Always accessible regardless of scroll position, clear visual affordance.

### 4. Responsive Grid Breakpoints
**Decision:** Use Tailwind's default breakpoints (sm: 640px, lg: 1024px, xl: 1280px) for grid changes.

**Rationale:** Standard breakpoints well-tested for dashboard layouts, no need for custom values.

**Impact:** Stat cards: 1 → 2 → 4 columns. Main/sidebar: single column → 12/3 split.

## Verification Results

All plan verification criteria passed:

1. ✅ Admin dashboard shows 4 entity-colored stat cards in a row
2. ✅ Grid layout shows 9:3 split on desktop (grid-cols-12, col-span-9, col-span-3)
3. ✅ Single column layout on mobile (col-span-12 for both main and sidebar)
4. ✅ Placeholder cards visible for financial chart, attendance chart, demographics chart, teacher table
5. ✅ Right sidebar has 3 placeholder widgets (calendar, agenda, messages)
6. ✅ Dark mode toggle button visible in bottom-left corner
7. ✅ Clicking dark mode toggle changes page to dark colors (slate backgrounds, preserved entity colors)
8. ✅ Non-admin dashboards render unchanged (SuperAdminDashboard, TheoryTeacherDashboard, ConductorDashboard, TeacherDashboard all preserved)
9. ✅ Stats data loads correctly from API (all existing loadDashboardData logic intact)
10. ✅ Dark mode preference persists across page reloads (localStorage check on mount)

## Cascading Impact

**Immediate dependencies (Phase 23 Plans 04-06):**
- Plan 04: Will replace financial/attendance/demographics chart placeholders with Recharts implementations
- Plan 05: Will replace teacher table placeholder with actual performance data table
- Plan 05: Will replace right sidebar widget placeholders with functional calendar/agenda/messages widgets
- Plan 06: Polish pass will verify all components integrate correctly with grid layout

**Removed v3.0 elements:**
- DOMINANT ZONE layout (2fr:1fr asymmetric split with giant primary metric)
- OPERATIONAL PANELS section (daily schedule table + events/activity widgets)
- TERTIARY charts section (instrument distribution, class distribution)
- SECONDARY SECTIONS (student activity charts, bagrut progress)
- AdminHoursOverview inline in admin dashboard (moved to separate component, preserved for potential re-integration)

**Impact on other pages:**
- None — this is admin dashboard only. Other dashboards (teacher, conductor, theory teacher) unchanged.
- StatCard component is reusable — could be adopted by other dashboards if needed.

## Next Steps

**Immediate (Phase 23 Plans 04-06):**
1. Plan 04: Implement financial trends, attendance, demographics charts with Recharts
2. Plan 05: Build teacher performance table, calendar/agenda/messages widgets
3. Plan 06: Polish pass — verify visual consistency, test dark mode, optimize loading states

**After Phase 23:**
- Consider re-integrating AdminHoursOverview into dashboard (maybe as a tab or expandable section)
- Evaluate whether removed charts (instrument/class distribution, bagrut progress) should return in different form
- Potential feature: Dark mode auto-detection based on system preference (prefers-color-scheme media query)

## Self-Check: PASSED

### Created Files
✅ FOUND: src/components/dashboard/v4/StatCard.tsx

### Modified Files
✅ FOUND: src/pages/Dashboard.tsx

### Commits
✅ FOUND: 950c547 (Task 1 — StatCard component)
✅ FOUND: f6d0d40 (Task 2 — Dashboard layout rebuild)

All artifacts verified present on disk and in git history.
