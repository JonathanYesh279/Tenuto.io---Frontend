---
phase: 09-form-system
plan: 03
subsystem: ui
tags: [shadcn, radix, tailwind, forms, react]

# Dependency graph
requires:
  - phase: 09-01
    provides: FormField wrapper, shadcn Input/Select/Checkbox/Button/Separator primitives

provides:
  - StudentForm fully migrated to shadcn primitives with FormField wrapper
  - All native <select> elements replaced with Radix Select
  - All native <input> elements replaced with shadcn Input
  - Native checkboxes replaced with shadcn Checkbox
  - Native buttons replaced with shadcn Button
  - Design tokens (foreground, muted, destructive) replacing hardcoded gray/red colors

affects:
  - Phase 10 (badge migration, callsite cleanup)
  - Any StudentForm consumer (visual upgrade, accessible labels)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FormField wrapper for every field: consistent visible label + inline error message"
    - "Radix Select value={undefined} for empty/unselected state (not empty string)"
    - "Numeric selects (stage): value as string (parseInt at onChange boundary)"
    - "Custom fixed-position dropdown preserved when standard Select cannot escape modal overflow"
    - "Checkbox in shadcn wraps Radix CheckboxPrimitive — onCheckedChange not onChange"

key-files:
  created: []
  modified:
    - src/components/forms/StudentForm.tsx

key-decisions:
  - "StudentForm keeps useState — no RHF migration needed (collapsible sections not tabs, no unmount data loss risk)"
  - "Custom teacher searchable dropdown preserved as-is — requires fixed positioning to escape modal container overflow, incompatible with Radix Select portal pattern"
  - "Days filter checkbox dropdown left as custom component — preserves multi-select inline behavior"
  - "Slot cards (time slot picker) left as native button — they are interactive visual cards, not selects"
  - "Pre-existing TS2698 error in handleInputChange retained — spread of dynamic keyof union is a known TypeScript limitation, same as before migration"

patterns-established:
  - "FormField(label, htmlFor, error): wraps any input/select, provides label + error ID for aria-describedby"
  - "aria-invalid + aria-describedby wired on every error-capable Input/SelectTrigger"
  - "Design tokens: bg-card, border-border, bg-muted/50, text-foreground, text-muted-foreground, text-destructive"

# Metrics
duration: 6min
completed: 2026-02-17
---

# Phase 9 Plan 3: StudentForm shadcn Migration Summary

**StudentForm (1813 lines) fully migrated to shadcn/ui primitives — all 8 native selects replaced with Radix Select, all inputs with shadcn Input, checkboxes with shadcn Checkbox, buttons with shadcn Button, all fields wrapped in FormField for consistent labels and inline validation**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-17T22:15:45Z
- **Completed:** 2026-02-17T22:21:59Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Zero native `<select>` elements remain in StudentForm (was 8)
- All 33 form field groups wrapped in FormField for consistent visible labels
- 8 aria-invalid + aria-describedby attributes wired on error-capable inputs
- 20 Button component usages replacing native button elements
- All hardcoded gray/red color classes replaced with design token equivalents
- Collapsible section architecture (expandedSections useState) preserved unchanged
- Custom teacher searchable dropdown (fixed-position) preserved unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate StudentForm to shadcn primitives with FormField wrapper** - `bc72812` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/forms/StudentForm.tsx` — Full shadcn migration: Radix Select for all 8 dropdowns, shadcn Input for all text/number/email/tel/time fields, shadcn Checkbox for isPrimary and day filter, shadcn Button for all actions, FormField wrapper on all fields, design token colors throughout

## Decisions Made

- StudentForm keeps useState — no RHF migration needed. Collapsible sections do not unmount form data (unlike tabs), so no data loss risk.
- Custom teacher searchable dropdown preserved as-is — uses fixed positioning to escape modal container overflow. Replacing with Radix Select would require custom portal configuration and lose the search-as-you-type UX.
- Days filter checkbox dropdown left as custom component — multi-select inline behavior incompatible with standard single-select Radix Select.
- Slot time-picker cards remain as native `<button>` elements — they are interactive visual cards (with color coding by duration), not dropdowns.

## Deviations from Plan

None - plan executed exactly as written. The custom teacher dropdown and days filter were correctly identified in the plan as architectural patterns to preserve unchanged.

## Issues Encountered

- Pre-existing TypeScript error TS2698 in `handleInputChange` (`...prev[section as keyof StudentFormData]`) was present before migration and is unchanged. This is a known TypeScript limitation with dynamic property access on union types. Not introduced by this plan.

## Next Phase Readiness

- Phase 9 is complete — all 3 plans executed: FormField wrapper + OrchestraForm (09-01), AddTeacherModal RHF migration (09-02), StudentForm shadcn migration (09-03)
- Phase 10 can begin: badge/status component migration and callsite cleanup

---
*Phase: 09-form-system*
*Completed: 2026-02-17*
