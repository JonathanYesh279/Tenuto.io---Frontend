---
phase: 09-form-system
plan: "02"
subsystem: forms
tags: [react-hook-form, shadcn, teacher-modal, migration, css-cleanup]
dependency_graph:
  requires: ["09-01"]
  provides: ["09-03"]
  affects: [src/components/modals/AddTeacherModal.tsx, src/styles/teacher-modal-fixes.css]
tech_stack:
  added: [react-hook-form (useForm, Controller)]
  patterns: [RHF Controller for tab-persistent form data, shadcn primitives, FormField wrapper, design tokens]
key_files:
  modified:
    - src/components/modals/AddTeacherModal.tsx
    - src/styles/teacher-modal-fixes.css
    - src/components/Sidebar.tsx
decisions:
  - "AddTeacherModal uses RHF useForm (shouldUnregister:false default) — tab switching preserves all 7 tab fields in RHF internal store"
  - "Schedule array managed via watch/setValue (no useFieldArray) — simpler add/remove for a non-dynamic array"
  - "Roles and instruments remain custom checkbox groups with Controller — no Select needed for multi-select checkbox patterns"
  - "Sidebar.tsx onSuccess -> onTeacherAdded prop fix applied inline — pre-existing bug eliminated"
metrics:
  duration: 7min
  completed: "2026-02-17"
  tasks_completed: 3
  files_modified: 3
---

# Phase 9 Plan 02: AddTeacherModal RHF + shadcn Migration Summary

AddTeacherModal (1227 lines, 7 tabs) fully migrated to React Hook Form with shadcn primitives — tab data persistence via RHF default shouldUnregister:false, zero native selects remain, CSS hacks removed.

## What Was Built

**Task 1a+1b: AddTeacherModal state + UI migration**

The modal was rewritten as a cohesive migration combining state management and UI swaps:

- `useForm<TeacherFormData>` replaces `useState` form state with `mode: 'onTouched'`
- All 30+ fields across 7 tabs wrapped in `Controller` with `FormField` wrappers
- Schedule array (teaching.schedule) managed with `watch()` + `setValue()` — no useFieldArray needed
- Edit mode uses `reset()` to populate all fields from teacher object
- All 5 native `<select>` elements replaced with shadcn `Select/SelectTrigger/SelectContent/SelectItem`
- All 8+ `<input type="checkbox">` replaced with shadcn `Checkbox + Label` pairs
- Native `<button>` → shadcn `Button` (outline for Cancel, default for Save, ghost for remove)
- Hardcoded `border-gray-300`, `text-red-600`, `bg-white`, `hover:bg-gray-50` → design tokens
- `aria-invalid`/`aria-describedby` on all error-capable inputs

**Task 2: CSS cleanup**

`teacher-modal-fixes.css` stripped of all native select hacks:
- Removed `.teacher-student-select` base rule (appearance:none, SVG chevron, padding)
- Removed `.teacher-student-select option/hover/checked` with `!important` overrides
- Removed `TODO(Phase 9)` comment
- Retained: button focus states, backdrop, label, search dropdown scrollbar, animations, mobile rules

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Sidebar.tsx onSuccess → onTeacherAdded prop mismatch**
- **Found during:** Task 1a TypeScript verification
- **Issue:** `src/components/Sidebar.tsx:649` passed `onSuccess` prop to AddTeacherModal, but the modal interface defines `onTeacherAdded`. This was a pre-existing error also present before our changes.
- **Fix:** Renamed `onSuccess` to `onTeacherAdded` in Sidebar.tsx line 649
- **Files modified:** `src/components/Sidebar.tsx`
- **Commit:** b92b62b

## Verification Results

| Check | Result |
|-------|--------|
| Zero native `<select>` in modal | 0 ✓ |
| RHF `useForm` present | ✓ |
| Controller count >= 8 | 30 ✓ |
| `shouldUnregister` NOT present | ✓ (default is correct) |
| `useFieldArray` NOT present | ✓ |
| `setValue.*teaching.schedule` count >= 2 | 2 ✓ |
| `FormField` count >= 10 | 41 ✓ |
| Zero `teacher-student-select` in modal | 0 ✓ |
| Zero hardcoded color classes | 0 ✓ |
| `aria-invalid` count > 0 | 14 ✓ |
| Zero `!important` in CSS | 0 ✓ |
| Zero `teacher-student-select` in CSS | 0 ✓ |
| TypeScript clean for AddTeacherModal | 0 errors ✓ |

## Commits

| Hash | Message |
|------|---------|
| b92b62b | feat(09-02): migrate AddTeacherModal to RHF + shadcn primitives |
| 99d4f27 | chore(09-02): remove native select hacks from teacher-modal-fixes.css |

## Self-Check: PASSED
