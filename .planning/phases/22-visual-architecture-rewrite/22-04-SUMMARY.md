---
phase: 22-visual-architecture-rewrite
plan: 04
subsystem: ui
tags: [tailwind, design-tokens, phosphor-icons, semantic-tokens, table, stats-card, shared-components]

# Dependency graph
requires:
  - phase: 22-visual-architecture-rewrite
    plan: 01
    provides: Cool neutral CSS token foundation (--primary black, --radius 2px, dark sidebar)
provides:
  - Flat data surface Table.tsx (no shadow, no rounded container, semantic tokens)
  - Subdued entity colors in StatsCard.tsx (no vivid pastel backgrounds)
  - Subdued entity accent in DetailPageHeader.tsx (thin right border, no pastel bg)
  - Semantic token pass across 13 shared UI/domain components
  - ListPageHero.tsx transitional cleanup (subdued entity accent, ready for Plan 06 elimination)
affects:
  - 22-05 (form components inherit cleaned shared UI primitives)
  - 22-06 (dashboard charts already committed alongside this plan)
  - All pages using Table, StatsCard, DetailPageHeader, ListPageHero, Pagination, SearchInput

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phosphor Icons replace Lucide in shared components: EyeIcon, TrashIcon, MagnifyingGlassIcon, XIcon, CaretLeftIcon, WarningCircleIcon, PlusIcon, CaretDoubleLeft/Right"
    - "Semantic token hover: bg-muted replaces hover:bg-gray-50 throughout tables and modals"
    - "Entity accent line: borderRight inline style with hsl(var(--color-*-fg)) replaces full pastel background fills"
    - "Shadow removal: shadow-sm removed from Table container, shadow-2xl removed from ConfirmDeleteModal"

key-files:
  created: []
  modified:
    - src/components/ui/Table.tsx
    - src/components/ui/StatsCard.tsx
    - src/components/ui/SearchInput.tsx
    - src/components/ui/Pagination.tsx
    - src/components/ui/ListPageHero.tsx
    - src/components/ui/InputModal.tsx
    - src/components/ui/ConfirmDeleteModal.tsx
    - src/components/ui/ConfirmationModal.tsx
    - src/components/ui/Calendar.tsx
    - src/components/ui/DesignSystem.tsx
    - src/components/ui/ValidationIndicator.tsx
    - src/components/domain/DetailPageHeader.tsx
    - src/components/dashboard/StatCard.tsx

key-decisions:
  - "Table.tsx: no rounded container, no shadow-sm — pure flat data surface using bg-background and border border-border"
  - "DetailPageHeader.tsx: rounded-xl entity pastel background replaced with bg-muted/40 + thin right accent border (borderRight inline style with entity fg color)"
  - "ListPageHero.tsx: bg-teachers-bg/students-bg/orchestras-bg vivid fills replaced with bg-muted/40 + right accent border — kept functional, removal deferred to Plan 06"
  - "StatsCard.tsx: 'blue' legacy color now maps to bg-muted/text-foreground semantic tokens (not primary-100/600)"
  - "ConfirmDeleteModal.tsx: rounded-2xl shadow-2xl removed — modals use rounded (2px) border, no decorative shadow"

patterns-established:
  - "Entity accent pattern: inline style borderRight with hsl(var(--color-*-fg)) instead of full background fills"
  - "Semantic hover pattern: hover:bg-muted replaces hover:bg-gray-50 everywhere in shared components"
  - "Phosphor icon weight pattern: weight='regular' for destructive/utility actions, weight='fill' for primary/emphasis icons"

# Metrics
duration: 8min
completed: 2026-02-19
---

# Phase 22 Plan 04: Shared UI Component Sweep Summary

**Flat Table, subdued entity accents, semantic token pass across 13 shared UI components — primary-NNN classes eliminated, rounded-xl/2xl removed, decorative shadows stripped**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-19T11:29:54Z
- **Completed:** 2026-02-19T11:37:00Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Table.tsx rewritten as a flat data surface: no shadow-sm, no rounded-xl container, row hover uses bg-muted (strong shift), Lucide icons replaced with Phosphor
- DetailPageHeader.tsx: entity pastel background (rounded-xl bg-teachers-bg etc.) → flat bg-muted/40 + thin right accent border in entity color — subdued, not a fill
- StatsCard.tsx: legacy 'blue' color variant now uses bg-muted/text-foreground semantic tokens; icon container uses rounded (2px) not rounded-lg
- ListPageHero.tsx: vivid entity pastel background replaced with bg-muted/40 + right entity accent line; action button uses bg-primary (black) not entity-colored; Lucide Plus → Phosphor PlusIcon
- Pagination.tsx: primary-600 active page → bg-primary/text-primary-foreground; all rounded-lg → rounded; Lucide chevrons → Phosphor CaretLeft/Right/Double
- InputModal, ConfirmDeleteModal, Calendar, DesignSystem: all primary-NNN classes removed, rounded-xl/2xl cleaned, Lucide → Phosphor for affected icons

## Task Commits

Each task was committed atomically:

1. **Task 1: Clean shared UI components — primary-NNN colors and rounding** - `41a9057` (feat)
2. **Task 2: Clean ListPageHero.tsx for subdued entity colors** - `d0f0aaa` (feat, bundled with 22-06)

## Files Created/Modified
- `src/components/ui/Table.tsx` - Flat data surface: no rounded-xl, no shadow-sm, Phosphor icons, semantic tokens
- `src/components/ui/StatsCard.tsx` - Legacy 'blue' color → bg-muted; icon container rounded-lg → rounded
- `src/components/domain/DetailPageHeader.tsx` - Entity pastel bg → bg-muted/40 + right entity accent border; Lucide → Phosphor CaretLeftIcon
- `src/components/ui/SearchInput.tsx` - rounded-lg → rounded; Lucide → Phosphor MagnifyingGlassIcon/XIcon
- `src/components/ui/Pagination.tsx` - primary-600 → bg-primary; all rounded-lg → rounded; Lucide → Phosphor
- `src/components/ui/ListPageHero.tsx` - Vivid entity bg → bg-muted/40 + accent border; bg-primary button; Phosphor PlusIcon
- `src/components/ui/InputModal.tsx` - primary-500/600 → bg-primary/hover:bg-neutral-800; rounded-lg → rounded
- `src/components/ui/ConfirmDeleteModal.tsx` - rounded-2xl → rounded; shadow-2xl removed; Lucide → Phosphor
- `src/components/ui/ConfirmationModal.tsx` - Lucide AlertTriangle → Phosphor WarningCircleIcon
- `src/components/ui/Calendar.tsx` - primary-500 → bg-primary; primary-100 → bg-muted; rounded-lg → rounded; Lucide → Phosphor
- `src/components/ui/DesignSystem.tsx` - primary-100/500/600 → semantic; rounded-xl → rounded; skeleton bg-gray-200 → bg-muted
- `src/components/dashboard/StatCard.tsx` - Dropdown rounded-lg → rounded; bg-white → bg-background
- `src/components/ui/ValidationIndicator.tsx` - Already clean (no primary-NNN or rounded-xl)

## Decisions Made
- Entity accent line (inline borderRight with hsl(var(--color-*-fg))) is the canonical pattern for entity identity in headers and hero components — not full background fills
- ListPageHero kept functional (not hollowed out) as it will be eliminated entirely in Plan 06 — just cleaned of hardcoded classes for consistent intermediate renders
- ConfirmDeleteModal: removed shadow-2xl (decorative) — kept backdrop-blur-sm which is functional (focus for modal overlay)
- Phosphor WarningCircleIcon used for alert/warning icons (replaces Lucide AlertTriangle) — weight=fill for emphasis

## Deviations from Plan

None — plan executed exactly as written. ValidationIndicator.tsx was already clean and required no changes.

## Issues Encountered
- ListPageHero.tsx changes were captured in commit d0f0aaa (22-06 commit) because that commit ran immediately after 41a9057 and included the file that was already staged. Both tasks are properly committed and verified.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Shared UI component layer fully clean: zero primary-NNN, zero rounded-xl/2xl, Table is flat, DetailPageHeader uses entity accent
- Plan 05 (form components) inherits clean shared primitives
- Plan 06 (list page archetypes) can now eliminate ListPageHero — the transitional version is ready
- Plan 07 (detail page archetypes) can build on the clean DetailPageHeader base

---

## Self-Check: PASSED

Files verified in HEAD:
- src/components/ui/Table.tsx: FOUND
- src/components/ui/StatsCard.tsx: FOUND
- src/components/domain/DetailPageHeader.tsx: FOUND
- src/components/ui/ListPageHero.tsx: FOUND
- src/components/ui/Pagination.tsx: FOUND

Commits verified:
- 41a9057: FOUND (feat(22-04): clean shared UI components)
- d0f0aaa: FOUND (feat(22-06): dashboard charts, includes ListPageHero Task 2)

Grep verification (zero results = passing):
- bg-primary-NNN in shared components: ZERO
- rounded-xl/2xl in shared UI + DetailPageHeader: ZERO

---
*Phase: 22-visual-architecture-rewrite*
*Completed: 2026-02-19*
