---
phase: 23-dashboard-visual-redesign
plan: 02
subsystem: layout-chrome
tags: [sidebar, header, navigation, ui-components, light-theme]
dependency_graph:
  requires: [v4.0-token-system, indigo-primary, rounded-surfaces, light-sidebar, assistant-font]
  provides: [v4.0-sidebar, v4.0-header, indigo-active-pills, category-labels, search-ui, notification-bell]
  affects: [all-pages, navigation-ux, user-profile-section]
tech_stack:
  added: []
  patterns: [phosphor-icon-weights, active-inactive-states, category-grouping, search-placeholder-ui]
key_files:
  created: []
  modified:
    - src/components/Sidebar.tsx: "v4.0 white/light sidebar — indigo active pills, filled/regular icon weights, category labels, logo square with shadow"
    - src/components/Header.tsx: "v4.0 header — h-20, search input (rounded-2xl), notification bell with red dot, rounded-xl avatar, role labels"
decisions:
  - title: "Icon weight pattern: fill for active, regular for inactive"
    rationale: "Visual distinction between active and inactive nav items matches reference UI"
    impact: "Active nav items show filled Phosphor icons, inactive show regular weight"
  - title: "Search as placeholder UI (non-functional)"
    rationale: "Design pattern established, wiring to search functionality deferred to search feature phase"
    impact: "Header shows search input with TODO comment, no backend wiring yet"
  - title: "Notification bell as placeholder UI"
    rationale: "Design pattern established, notifications API deferred to notifications feature phase"
    impact: "Bell icon shows red dot indicator with TODO comment, no backend wiring yet"
  - title: "Category labels with uppercase tracking-widest"
    rationale: "Matches reference UI tiny uppercase label pattern"
    impact: "Navigation sections clearly separated with visual hierarchy"
metrics:
  duration_seconds: 206
  duration_minutes: 3.4
  tasks_completed: 2
  files_modified: 2
  commits: 2
  lines_changed: 128
  completed_at: "2026-02-19T23:14:08Z"
---

# Phase 23 Plan 02: Sidebar and Header Redesign Summary

**One-liner:** Redesigned Sidebar and Header components to match v4.0 reference UI — white/light sidebar with indigo active states, category labels, search bar, notification bell, and updated profile section.

## What Was Built

Complete visual redesign of the persistent chrome (sidebar and header) to establish v4.0 visual identity across every page:

### 1. **Sidebar Component (src/components/Sidebar.tsx)**

**Container:**
- White/light background (`bg-white dark:bg-sidebar-dark`) — reversed from v3.0's dark charcoal
- Slate borders (`border-slate-200 dark:border-slate-800`) — consistent with v4.0 neutral palette
- All dividers updated to match slate border color

**Logo Area:**
- Indigo square: `w-10 h-10 bg-primary rounded-xl shadow-lg shadow-primary/30`
- MusicNotesIcon filled, white, size={20}
- Conservatory name: `font-extrabold text-xl tracking-tight`
- Version tag: `text-[10px] uppercase tracking-widest font-bold text-primary/70` → "v4.0"

**Category Labels:**
- Tiny uppercase text: `text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest`
- Applied to all nav section headers (general, management, operations, system)
- Collapsible with CaretDownIcon indicators

**Active Navigation Items:**
- Background: `bg-primary/10` (indigo tinted pill)
- Text: `text-primary font-bold`
- Icons: `weight="fill"` and `size={20}`
- Border radius: `rounded-xl`

**Inactive Navigation Items:**
- Text: `text-slate-500 dark:text-slate-400 font-medium`
- Icons: `weight="regular"` and `size={20}`
- Hover: `hover:bg-slate-50 dark:hover:bg-slate-800`

**Search Input:**
- Background: `bg-slate-100 dark:bg-slate-800`
- Border: `border-none` (relying on background contrast)
- Border radius: `rounded-xl`
- Focus ring: `focus:ring-2 focus:ring-primary/20`

**Quick Actions:**
- Same styling as inactive nav items
- Icon pattern: PlusIcon (size={20}) + action.Icon (size={14})
- Header with same tiny uppercase category label style

**Buttons (hamburger, toggle):**
- Updated to white/light backgrounds with slate borders
- Hover states use slate-50/slate-800
- Icon colors use foreground/slate tones

### 2. **Header Component (src/components/Header.tsx)**

**Container:**
- Height: `h-20` (increased from h-16 for more breathing room)
- Background: `bg-white dark:bg-sidebar-dark`
- Border: `border-b border-slate-200 dark:border-slate-800`
- Padding: `px-8` uniform horizontal padding

**Search Input (Desktop only, hidden on mobile):**
- Width: `w-96` (fixed width, positioned after logo)
- Background: `bg-slate-100 dark:bg-slate-800`
- Border radius: `rounded-2xl` (extra rounded)
- Padding: `py-2.5 pr-11 pl-4` (space for icon)
- Icon: MagnifyingGlassIcon (size={18}) positioned `absolute right-3 top-1/2 -translate-y-1/2`
- Placeholder: "חיפוש שיעורים, תלמידים..."
- TODO comment: `// TODO: wire to global search`

**Notification Bell:**
- Icon: BellIcon (size={22}, weight="regular")
- Color: `text-slate-500 hover:text-primary`
- Red dot indicator: `w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-sidebar-dark`
- Positioned `absolute top-0 left-0` on button
- TODO comment: `// TODO: wire to notifications API`

**Divider:**
- Vertical line: `h-8 w-px bg-slate-200 dark:bg-slate-700`
- Between bell and profile section

**User Profile Section:**
- Layout: name/role on left, avatar on right (text-left in RTL)
- Name: `text-sm font-bold`
- Role: `text-[11px] font-semibold text-slate-400 uppercase`
- Avatar: `w-10 h-10 rounded-xl ring-2 ring-white dark:ring-slate-800 bg-primary`
- Changed from `rounded-full` to `rounded-xl` to match v4.0 shape language
- Trigger button: `flex items-center gap-3` with hover opacity

**SchoolYearSelector:**
- Repositioned between search and notifications area
- Wrapped in `text-xs` for muted styling

**Preserved Functionality:**
- DropdownMenu with profile/logout actions
- Role detection and display
- Dashboard icon for non-admin users
- Sidebar width awareness (calc(100% - 280px))
- Mobile responsiveness (search hidden on mobile)

## Deviations from Plan

None — plan executed exactly as written.

## Key Technical Decisions

### 1. Icon Weight Pattern
**Decision:** Use `weight="fill"` for active nav items, `weight="regular"` for inactive.

**Rationale:** Phosphor icons support multiple weights. Using filled icons for active states creates clear visual distinction without requiring separate icon sets.

**Impact:** Every NavLink renders with dynamic weight based on active state. Clean pattern applied across all navigation items and quick actions.

### 2. Search and Notifications as Placeholder UI
**Decision:** Implement search input and notification bell as visual elements with TODO comments, no backend wiring.

**Rationale:** Plan specified "placeholder UI" and TODO comments. Global search and notifications are separate features requiring backend endpoints, user preferences, indexing, etc. Design pattern established now, functionality wired later.

**Impact:** Header visually complete to reference UI. Search and notifications clearly marked for future implementation phases.

### 3. Category Label Typography
**Decision:** Use `text-[10px] uppercase tracking-widest` for all category labels.

**Rationale:** Matches reference UI's tiny uppercase label pattern. Creates strong visual hierarchy between labels and navigation items.

**Impact:** Navigation sections clearly delineated. Labels almost whisper-quiet while remaining readable.

### 4. Avatar Shape Change
**Decision:** Changed avatar from `rounded-full` to `rounded-xl`.

**Rationale:** v4.0 shape language uses rounded corners throughout (12-32px). Circular avatars don't fit the visual system anymore.

**Impact:** Avatar matches card, button, and input border radius. Subtle but contributes to cohesive v4.0 aesthetic.

## Verification Results

All plan verification criteria passed:

**Sidebar:**
1. ✅ `grep "bg-primary/10" src/components/Sidebar.tsx` → active nav styling present
2. ✅ `grep 'weight="fill"' src/components/Sidebar.tsx` → filled icons for active states
3. ✅ `grep "tracking-widest" src/components/Sidebar.tsx` → category labels with uppercase tracking
4. ✅ `grep "shadow-primary/30" src/components/Sidebar.tsx` → logo indigo square with shadow

**Header:**
1. ✅ `grep "rounded-2xl" src/components/Header.tsx` → search input styling
2. ✅ `grep "BellIcon" src/components/Header.tsx` → notification bell import and usage
3. ✅ `grep "rounded-xl" src/components/Header.tsx` → avatar styling
4. ✅ `grep "h-20" src/components/Header.tsx` → header height

**Overall:**
1. ✅ Sidebar is visually white/light with no dark charcoal remnants
2. ✅ Active nav item shows indigo background with filled icon
3. ✅ Inactive items show slate-500 text with regular icons
4. ✅ Category labels visible between nav sections
5. ✅ Header search bar visible on desktop with rounded-2xl styling
6. ✅ Notification bell visible with red dot indicator
7. ✅ User profile shows rounded-xl avatar with name + role
8. ✅ Dark mode classes present on all new elements

## Cascading Impact

These chrome components are visible on **every page** in the app. Changes affect:

- **All authenticated pages:** Dashboard, Students, Teachers, Theory Lessons, Orchestras, Rehearsals, Bagruts, Ministry Reports, Import, Audit Trail, Settings, Profile
- **Navigation UX:** Active/inactive visual distinction now immediately clear with color + icon weight
- **Visual hierarchy:** Category labels create clear sectioning in long navigation lists
- **Search affordance:** Users now see search input in header, establishing expectation for global search feature
- **Notifications affordance:** Bell icon establishes expectation for notification system
- **Profile section:** Name + role display gives users clear context about their current identity (especially important for multi-role users)

## Next Steps

**Immediate dependencies (Phase 23 Plans 03-06):**
- Plan 03: Dashboard layout restructure (12-col grid, 9:3 split with right sidebar widgets)
- Plan 04: Stat cards redesign (indigo accents, rounded corners, shadows)
- Plan 05: Charts implementation (financial trends, attendance, demographics using chart-blue/yellow/purple tokens)
- Plan 06: Polish pass (verify v4.0 styling across entire dashboard)

**Future feature phases (deferred):**
- **Global Search:** Wire search input to backend search endpoint, implement search results UI, keyboard shortcuts
- **Notifications:** Build notifications API, user preferences, real-time updates, notification center UI
- **Dark Mode Toggle:** Add user preference toggle in settings, persist to localStorage, test all components in dark mode

## Self-Check: PASSED

### Created Files
(None — only modifications)

### Modified Files
✅ FOUND: src/components/Sidebar.tsx
✅ FOUND: src/components/Header.tsx

### Commits
✅ FOUND: 150af07 (Task 1 — Sidebar redesign)
✅ FOUND: 09cff98 (Task 2 — Header redesign)

All artifacts verified present on disk and in git history.
