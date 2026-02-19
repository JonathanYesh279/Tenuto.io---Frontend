---
phase: 22-visual-architecture-rewrite
plan: 07
subsystem: ui
tags: [css-variables, tailwind, design-tokens, bagrut, color-migration]

# Dependency graph
requires:
  - phase: 22-visual-architecture-rewrite
    plan: 01
    provides: "Cool neutral token foundation (--primary black, --radius 2px)"
provides:
  - Bagrut module (24 files) fully migrated to semantic design tokens
  - Zero hardcoded primary-NNN in all bagrut-related components
  - Sharp 2px rounding applied across all bagrut UI (rounded-lg/xl/2xl/3xl -> rounded)
affects:
  - All subsequent Phase 22 plans that touch bagrut components
  - Visual consistency: bagrut module now matches token foundation from 22-01

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Semantic token migration: bg-primary-NNN -> bg-primary/bg-muted, text-primary-NNN -> text-primary/text-foreground"
    - "Button pattern: bg-primary text-white rounded hover:bg-neutral-800"
    - "Focus ring: focus:ring-primary (not focus:ring-primary-500)"
    - "Background highlight: bg-muted (not bg-primary-50/100)"

key-files:
  created: []
  modified:
    - src/components/bagrut/ProgramTable.tsx
    - src/components/bagrut/ProgramBuilder.tsx
    - src/components/bagrut/PresentationTracker.tsx
    - src/components/bagrut/PresentationForm.tsx
    - src/components/bagrut/MigrationWarningModal.tsx
    - src/components/bagrut/MagenBagrutForm.tsx
    - src/components/bagrut/LazyBagrutTab.tsx
    - src/components/bagrut/GradeSummary.tsx
    - src/components/bagrut/DocumentManager.tsx
    - src/components/bagrut/DirectorEvaluation.tsx
    - src/components/bagrut/ConflictResolutionModal.tsx
    - src/components/bagrut/BagrutExporter.tsx
    - src/components/bagrut/AccompanistManager.tsx
    - src/components/bagrut/BagrutStudentManager.tsx
    - src/components/bagrut/chunks/PresentationChunk.tsx
    - src/components/bagrut/BagrutHeader.tsx
    - src/components/bagrut/BagrutIntegration.tsx
    - src/components/BagrutCard.tsx
    - src/components/MagenBagrutTab.tsx
    - src/components/DetailedMagenBagrutEditor.tsx
    - src/components/DocumentUpload.tsx
    - src/components/AddPieceModal.tsx

key-decisions:
  - "rounded-lg -> rounded in bagrut: all container rounding stripped to 2px sharp identity"
  - "Modal Card wrappers preserved (ConflictResolutionModal, MigrationWarningModal): floating content keeps Card"
  - "hover:bg-primary-600/700 on buttons -> hover:bg-neutral-800 (visible lighter shift on black)"
  - "bg-primary-50/100 highlight backgrounds -> bg-muted (tonal not tinted)"

patterns-established:
  - "Token migration pattern: grep for bg-primary-[0-9] to find remaining work across other modules"
  - "Bagrut module: largest component group (24 files) fully migrated as of 22-07"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 22 Plan 07: Bagrut Module Token Migration Summary

**24 bagrut component files fully migrated from hardcoded primary-NNN hex classes to cool neutral semantic tokens — black buttons, muted backgrounds, sharp 2px rounding**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T11:30:03Z
- **Completed:** 2026-02-19T11:31:53Z
- **Tasks:** 2
- **Files modified:** 22

## Accomplishments
- Eliminated all `bg-primary-NNN`, `text-primary-NNN`, `border-primary-NNN` from 22 bagrut files (2 files had no changes)
- Replaced `rounded-xl/2xl/3xl/lg` with `rounded` (2px) in all bagrut containers
- Button pattern standardized: `bg-primary text-white rounded hover:bg-neutral-800`
- Modal Card wrappers preserved in ConflictResolutionModal and MigrationWarningModal
- Focus ring pattern cleaned: `focus:ring-primary-500` -> `focus:ring-primary`

## Task Commits

Each task was committed atomically:

1. **Task 1: Clean bagrut/ directory components (19 files)** - `6436ce8` (feat)
2. **Task 2: Clean root-level bagrut-related components (5 files)** - `c82fed1` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/bagrut/AccompanistManager.tsx` - text-primary icons, bg-primary button, rounded
- `src/components/bagrut/BagrutExporter.tsx` - text-primary icon, border-primary/bg-muted export selection
- `src/components/bagrut/DocumentManager.tsx` - bg-primary button, border-primary drag zone, text-primary icons
- `src/components/bagrut/LazyBagrutTab.tsx` - text-primary loading icon, rounded skeleton placeholders
- `src/components/bagrut/PresentationTracker.tsx` - text-primary icons/values, bg-muted grade display
- `src/components/bagrut/ProgramBuilder.tsx` - text-primary icon, bg-primary button, border-border card border
- `src/components/bagrut/PresentationForm.tsx` - rounded inputs
- `src/components/bagrut/MigrationWarningModal.tsx` - rounded list items (Card wrapper kept)
- `src/components/bagrut/MagenBagrutForm.tsx` - rounded inputs
- `src/components/bagrut/GradeSummary.tsx` - rounded grade boxes
- `src/components/bagrut/DirectorEvaluation.tsx` - rounded info boxes
- `src/components/bagrut/ConflictResolutionModal.tsx` - rounded selection items (Card wrapper kept)
- `src/components/bagrut/BagrutStudentManager.tsx` - bg-primary button, rounded inputs/containers
- `src/components/bagrut/BagrutHeader.tsx` - rounded info block
- `src/components/bagrut/BagrutIntegration.tsx` - rounded containers/inputs
- `src/components/bagrut/chunks/PresentationChunk.tsx` - rounded overlay
- `src/components/BagrutCard.tsx` - bg-muted avatar bg, text-primary icon, bg-primary button
- `src/components/MagenBagrutTab.tsx` - text-primary grade value, focus:ring-primary inputs, bg-primary button
- `src/components/DetailedMagenBagrutEditor.tsx` - text-primary grade values, bg-primary button
- `src/components/DocumentUpload.tsx` - border-primary/bg-muted drag zone, text-primary icon, bg-primary button
- `src/components/AddPieceModal.tsx` - bg-primary button
- No changes needed: `OptimizedMagenBagrutForm.tsx`, `chunks/ProgramBuilderChunk.tsx`

## Decisions Made
- `rounded-lg` removed throughout bagrut — all container rounding reduced to `rounded` (2px) for sharp architectural identity
- Modal components (ConflictResolutionModal, MigrationWarningModal): Card wrappers preserved as floating content
- `bg-primary-50/100` backgrounds replaced with `bg-muted` — tonal neutral, not warm tint
- `hover:bg-primary-600/700` on buttons replaced with `hover:bg-neutral-800` — matches 22-01 button system

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Bagrut module fully migrated to cool neutral tokens
- Remaining primary-NNN migration work in other modules (check other plans in Phase 22)
- All bagrut components now consistent with token foundation from 22-01

---
*Phase: 22-visual-architecture-rewrite*
*Completed: 2026-02-19*
