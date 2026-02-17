---
phase: 09-form-system
plan: 01
subsystem: ui
tags: [react, shadcn, radix-ui, forms, rtl, accessibility]

# Dependency graph
requires:
  - phase: 06-design-tokens
    provides: Design token CSS variables (--destructive, --border, --foreground, --muted-foreground)
  - phase: 07-modal-system
    provides: shadcn primitives (Input, Label, Select, Checkbox, Button) in src/components/ui/
provides:
  - Shared FormField wrapper component (Label + input slot + error message with htmlFor/id wiring)
  - OrchestraForm fully migrated to shadcn primitives with inline validation and design tokens
affects: [09-02-student-form, 09-03-teacher-modal, 10-badge-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - FormField wrapper pattern (Label + slot + error) for consistent form field rendering
    - Radix Select replacing native <select> including grouped SelectGroup/SelectLabel for optgroups
    - Conductor/nullable select uses value={undefined} for empty state (Radix rejects empty string)
    - Design token override pattern for error state: cn(error && "border-destructive focus-visible:ring-destructive")

key-files:
  created:
    - src/components/ui/form-field.tsx
  modified:
    - src/components/OrchestraForm.tsx

key-decisions:
  - "FormField wrapper uses htmlFor/id pairing (not aria-labelledby) — simpler, standard, matches shadcn Label"
  - "Radix Select value={undefined} for empty/null state — Radix does not support empty string value"
  - "OrchestraForm keeps useState — no RHF migration needed (single page, no tab-switch data loss risk)"
  - "Conductor inline icon uses z-10 to appear above SelectTrigger overlay"

patterns-established:
  - "Pattern: FormField(label, htmlFor, error?, required?, hint?) wraps any input slot"
  - "Pattern: Select value={field ?? undefined} for nullable fields"
  - "Pattern: cn(errors.field && 'border-destructive focus-visible:ring-destructive') for error input styling"

# Metrics
duration: 3min
completed: 2026-02-17
---

# Phase 9 Plan 01: FormField Wrapper + OrchestraForm Migration Summary

**Shared FormField wrapper with Label/error wiring, plus OrchestraForm fully converted from native HTML inputs to shadcn Select/Input/Checkbox/Button with design tokens and inline validation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T22:10:08Z
- **Completed:** 2026-02-17T22:13:14Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Created `src/components/ui/form-field.tsx` — the keystone Phase 9 component providing Label + any-input slot + error message with htmlFor/id accessibility wiring, required asterisk, hint text, and role=alert error paragraph
- Replaced all 5 native `<select>` elements in OrchestraForm with Radix Select (including full grouped location dropdown using SelectGroup/SelectLabel, matching original optgroup structure)
- Replaced native `<input type="text/number">` with shadcn Input, native `<input type="checkbox">` with shadcn Checkbox, raw `<button>` elements with shadcn Button (outline/default variants)
- Replaced all hardcoded color classes (text-gray-700, border-gray-300, bg-white, border-red-300, text-red-500/600/800, bg-red-50, bg-gray-50) with design tokens (text-foreground, border-border, bg-background, border-destructive, text-destructive, bg-muted, hover:bg-muted)

## Task Commits

1. **Task 1: Create FormField wrapper and migrate OrchestraForm to shadcn** - `6715b94` (feat)

## Files Created/Modified
- `src/components/ui/form-field.tsx` — Shared wrapper: Label + input slot + error message with htmlFor/id, required marker, hint text, role=alert
- `src/components/OrchestraForm.tsx` — Fully migrated to shadcn primitives; zero native selects, design tokens throughout, aria-invalid/aria-describedby on validated inputs

## Decisions Made
- FormField uses `htmlFor`/`id` pairing (not `aria-labelledby` + cloneElement like the legacy AccessibleFormField.tsx) — simpler, standard, what shadcn Label natively uses
- Nullable select fields (subType, performanceLevel, conductorId) use `value={field ?? undefined}` because Radix Select rejects empty string as a value
- OrchestraForm keeps existing `useState` validation — RHF migration only needed for AddTeacherModal (tab-switch data loss risk). OrchestraForm has no tabs.
- Conductor select icon (User) wrapped with `z-10` to appear above the SelectTrigger click area while remaining non-interactive (`pointer-events-none`)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None — all primitives were already present in src/components/ui/; no new package installations required.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- FormField is ready for immediate use in Plan 09-02 (StudentForm) and Plan 09-03 (AddTeacherModal)
- Pattern established: wrap every form field in FormField, use Radix Select for dropdowns, design token error classes
- OrchestraForm validates the pattern end-to-end before applying to the larger forms
