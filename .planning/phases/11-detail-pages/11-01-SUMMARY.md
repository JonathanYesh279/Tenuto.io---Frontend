---
phase: 11-detail-pages
plan: 01
subsystem: ui
tags: [react, framer-motion, tailwind, avatar, breadcrumb, gradient]

# Dependency graph
requires:
  - phase: 06-design-tokens
    provides: CSS vars --primary (warm coral) and --accent (amber) used in gradient strip
  - phase: 07-shadcn-primitives
    provides: Avatar, Tabs shadcn primitives used in DetailPageHeader and AnimatePresence pattern
  - phase: 08-domain-components
    provides: AvatarInitials component that was extended with colorClassName and xl size

provides:
  - Deterministic avatar color hash utility (8-color palette, name charcode sum)
  - DetailPageHeader shared component (gradient strip, breadcrumb, avatar, badges, updatedAt)
  - AvatarInitials extended with colorClassName and xl size variant
  - TeacherDetailsPage upgraded with gradient header and 200ms tab fade
  - StudentDetailsPage upgraded with gradient header and 200ms tab fade

affects: [12-layout-shell, future detail pages for orchestras and bagrutim]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Deterministic name-to-color: charcode sum modulo palette length
    - AnimatePresence mode="wait" with motion.div key={activeTab} for tab fade
    - DetailPageHeader composite: breadcrumb + gradient strip + avatar + badges + children slot
    - from-primary to-accent gradient (CSS vars, not hardcoded palette classes)

key-files:
  created:
    - src/utils/avatarColorHash.ts
    - src/components/domain/DetailPageHeader.tsx
  modified:
    - src/components/domain/AvatarInitials.tsx
    - src/components/domain/index.ts
    - src/features/teachers/details/components/TeacherDetailsPage.tsx
    - src/features/students/details/components/StudentDetailsPage.tsx

key-decisions:
  - "AnimatePresence + conditional rendering replaces Radix TabsContent — avoids hidden-panel DOM accumulation"
  - "getAvatarColorClasses uses charcode sum modulo 8 — simple, deterministic, no external dep"
  - "DetailPageHeader children slot for action buttons — keeps student delete buttons below header without coupling"
  - "AvatarInitials colorClassName prop is additive — fallback to bg-primary/10 text-primary when not provided"

patterns-established:
  - "Tab fade pattern: <AnimatePresence mode='wait'><motion.div key={activeTab} ...> with conditional content"
  - "Gradient header: bg-gradient-to-l from-primary to-accent (warm coral to amber via CSS vars)"

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 11 Plan 01: Detail Page Header Infrastructure Summary

**Shared gradient header component with deterministic avatar color hash wired into Teacher and Student detail pages, with 200ms AnimatePresence tab fade replacing Radix TabsContent**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T09:43:13Z
- **Completed:** 2026-02-18T09:47:09Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created `avatarColorHash.ts` — 8-color warm palette with deterministic charcode-sum algorithm; same name always maps to same color
- Built `DetailPageHeader` component — gradient strip (from-primary to-accent), xl avatar initials with hashed color, breadcrumb with ChevronLeft, badges slot, Hebrew updatedAt
- Extended `AvatarInitials` with `colorClassName` prop and `xl` (h-16 w-16) size variant
- Wired `DetailPageHeader` into both TeacherDetailsPage and StudentDetailsPage, removing old white card headers and `>` separator breadcrumbs
- Added `AnimatePresence + motion.div` 200ms opacity fade to all tab switches in both pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create avatar color hash utility, extend AvatarInitials, build DetailPageHeader** - `1709f7a` (feat)
2. **Task 2: Wire DetailPageHeader and tab fade into Teacher and Student detail pages** - `e236849` (feat)

**Plan metadata:** (created below)

## Files Created/Modified
- `src/utils/avatarColorHash.ts` — Deterministic 8-color palette; getAvatarColorClasses(name) sums charcodes mod 8
- `src/components/domain/DetailPageHeader.tsx` — Gradient header composite: breadcrumb + gradient strip + AvatarInitials + badges + updatedAt + children slot
- `src/components/domain/AvatarInitials.tsx` — Added colorClassName prop and xl size (h-16 w-16 text-lg)
- `src/components/domain/index.ts` — Added DetailPageHeader export
- `src/features/teachers/details/components/TeacherDetailsPage.tsx` — Replaced inline breadcrumb + white card with DetailPageHeader; replaced TabsContent with AnimatePresence fade
- `src/features/students/details/components/StudentDetailsPage.tsx` — Same; action buttons moved to separate div below header

## Decisions Made
- AnimatePresence + conditional rendering replaces Radix TabsContent — avoids hidden-panel DOM accumulation issue where all panels stay mounted
- getAvatarColorClasses uses charcode sum modulo 8 — simple, deterministic, no external dependency
- DetailPageHeader children slot for action buttons — keeps student delete buttons below header without tight coupling
- AvatarInitials colorClassName prop is additive fallback — existing callers unchanged (defaults to bg-primary/10 text-primary)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Shared gradient header infrastructure ready — can be reused for Orchestra and Bagrut detail pages in Phase 11
- Plan 11-02 (Orchestra detail page) and 11-03 (Bagrut detail page) can import DetailPageHeader directly
- Tab fade pattern established and ready to apply to other detail pages

---
*Phase: 11-detail-pages*
*Completed: 2026-02-18*

## Self-Check: PASSED

**Files verified:**
- FOUND: src/utils/avatarColorHash.ts
- FOUND: src/components/domain/AvatarInitials.tsx
- FOUND: src/components/domain/DetailPageHeader.tsx
- FOUND: src/components/domain/index.ts
- FOUND: src/features/teachers/details/components/TeacherDetailsPage.tsx
- FOUND: src/features/students/details/components/StudentDetailsPage.tsx

**Commits verified:**
- FOUND: 1709f7a (feat(11-01): add avatar color hash utility, DetailPageHeader, and extend AvatarInitials)
- FOUND: e236849 (feat(11-01): wire DetailPageHeader and tab fade into Teacher and Student detail pages)
