---
phase: 14-requirement-gap-closure
plan: 02
subsystem: ui
tags: [react, shadcn, badge, status, hebrew, tailwind]

# Dependency graph
requires:
  - phase: 14-01
    provides: domain/StatusBadge component with initial STATUS_VARIANT_MAP
provides:
  - completed badge variant in badge.tsx (green-100/green-800)
  - Extended STATUS_VARIANT_MAP with 8 Hebrew status strings
  - All 4 list pages (Teachers, Students, Bagruts, AuditTrail) use domain StatusBadge
  - AuditTrail getStatusBadge hand-rolled span function removed
affects:
  - Phase 15 (PresentationTracker StatusBadge migration — Table.tsx StatusBadge preserved)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Domain StatusBadge is the single canonical status renderer — Hebrew strings map to typed Badge variants
    - List pages import StatusBadge from domain barrel (components/domain), never from Table.tsx
    - Grade/class labels use plain Badge with variant="outline" — not StatusBadge (not a status concept)

key-files:
  created: []
  modified:
    - src/components/ui/badge.tsx
    - src/components/domain/StatusBadge.tsx
    - src/pages/Teachers.tsx
    - src/pages/Students.tsx
    - src/pages/Bagruts.tsx
    - src/pages/AuditTrail.tsx

key-decisions:
  - "grade field in Students.tsx uses plain Badge variant=outline — student class/grade is not a status, prevents semantic confusion"
  - "Table.tsx StatusBadge preserved — PresentationTracker still imports it; migration deferred to Phase 15"
  - "AuditTrail maps English API values ('success'/'failed') to Hebrew inline at call site — keeps StatusBadge variant map Hebrew-only"

patterns-established:
  - "StatusBadge pattern: pass Hebrew status string, component handles variant lookup via STATUS_VARIANT_MAP"
  - "Non-status labels (grade, class): use Badge with variant=outline, not StatusBadge"

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 14 Plan 02: StatusBadge Domain Migration Summary

**Domain StatusBadge extended to 8 Hebrew status strings and all 4 list pages migrated from Table.tsx StatusBadge to the canonical domain/StatusBadge, with Bagrut and AuditTrail statuses now rendering colored Badge variants.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T12:24:45Z
- **Completed:** 2026-02-18T12:28:45Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added `completed` variant to badgeVariants CVA in badge.tsx (green-100/green-800, identical to `active` — appropriate for completed exam context)
- Extended STATUS_VARIANT_MAP from 4 to 8 entries: added הושלם (completed), בתהליך (pending/orange), הצלחה (active/green), כשל (destructive/red)
- Migrated all 4 list pages to import StatusBadge from domain/ barrel — no page now imports from Table.tsx
- Removed hand-rolled getStatusBadge function from AuditTrail.tsx (14 lines of inline span JSX deleted)
- Students.tsx grade field replaced with plain Badge outline (class/grade is not a status concept)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend badge.tsx and domain StatusBadge variant map** - `1cb03f6` (feat)
2. **Task 2: Migrate list page StatusBadge imports to domain barrel** - `04ca3ca` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/components/ui/badge.tsx` - Added `completed` variant to badgeVariants CVA
- `src/components/domain/StatusBadge.tsx` - Extended STATUS_VARIANT_MAP with 4 new Hebrew status entries
- `src/pages/Teachers.tsx` - Import swapped to domain/, status uses Hebrew strings directly
- `src/pages/Students.tsx` - Import swapped to domain/, grade uses plain Badge outline, status uses Hebrew strings
- `src/pages/Bagruts.tsx` - Import swapped to domain/, uses 'הושלם'/'בתהליך' status strings
- `src/pages/AuditTrail.tsx` - Import added from domain/, getStatusBadge deleted, column uses StatusBadge with Hebrew map

## Decisions Made
- **grade in Students.tsx uses plain Badge outline**: Student class/grade is a label, not a status. Using StatusBadge for it was semantically wrong. Plain Badge with variant="outline" is correct.
- **Table.tsx StatusBadge preserved**: PresentationTracker.tsx still imports from Table.tsx — that migration is deferred to Phase 15 per plan guidance.
- **AuditTrail maps English to Hebrew at call site**: The API returns 'success'/'failed' (English). Rather than adding English keys to STATUS_VARIANT_MAP (which would break the Hebrew-only contract), the mapping happens inline: `row.status === 'success' ? 'הצלחה' : 'כשל'`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in Bagruts.tsx, Students.tsx, AuditTrail.tsx (Card padding prop, Column types, cascade deletion service) were present before this plan and are unrelated to StatusBadge changes. Zero TypeScript errors introduced by this plan's changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PRIM-05 gap closed: all list pages use canonical domain/StatusBadge with colored variants
- Bagrut statuses (הושלם/בתהליך) now render green/orange respectively
- AuditTrail statuses (הצלחה/כשל) now render green/red respectively
- Phase 15 can proceed with PresentationTracker StatusBadge migration (Table.tsx StatusBadge still available)

---
*Phase: 14-requirement-gap-closure*
*Completed: 2026-02-18*

## Self-Check: PASSED

- FOUND: src/components/ui/badge.tsx
- FOUND: src/components/domain/StatusBadge.tsx
- FOUND: src/pages/Teachers.tsx
- FOUND: src/pages/Students.tsx
- FOUND: src/pages/Bagruts.tsx
- FOUND: src/pages/AuditTrail.tsx
- FOUND: .planning/phases/14-requirement-gap-closure/14-02-SUMMARY.md
- FOUND: commit 1cb03f6 (Task 1)
- FOUND: commit 04ca3ca (Task 2)
