---
phase: 11-detail-pages
plan: 02
subsystem: ui
tags: [react, framer-motion, tailwind, avatar, breadcrumb, gradient]

# Dependency graph
requires:
  - phase: 11-01
    provides: DetailPageHeader, avatarColorHash, AvatarInitials xl size — used directly in both pages

provides:
  - OrchestraDetailsPage upgraded with gradient header and 200ms tab fade
  - BagrutDetails upgraded with gradient header and 200ms tab fade
  - All 4 entity detail pages now use consistent DetailPageHeader branding

affects: [all users navigating to /orchestras/:id and /bagruts/:id]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Tab fade pattern applied: AnimatePresence mode="wait" + motion.div key={activeTab}
    - DetailPageHeader reuse: fullName={entity.name} for single-name entities (orchestra)
    - BagrutDetails: student firstName/lastName passed for proper initials generation

key-files:
  created: []
  modified:
    - src/features/orchestras/details/components/OrchestraDetailsPage.tsx
    - src/pages/BagrutDetails.tsx

key-decisions:
  - "Orchestra passes fullName={orchestra?.name} only — DetailPageHeader getDisplayName handles single-name strings"
  - "Bagrut preserves action buttons (complete/export/delete) in separate row below header — not in header itself"
  - "BagrutDetails custom Tab component untouched — only tab content wrapped with AnimatePresence"
  - "Teacher badge in Bagrut header uses conditional rendering — only shown when teacher data loaded"

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 11 Plan 02: Orchestra and Bagrut Detail Page Headers Summary

**DetailPageHeader and 200ms AnimatePresence tab fade wired into Orchestra and Bagrut detail pages, completing consistent gradient header branding across all 4 entity detail views**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T09:49:59Z
- **Completed:** 2026-02-18T09:52:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced OrchestraDetailsPage inline breadcrumb nav and emoji white-card header with `DetailPageHeader` — gradient strip, orchestra name initials, type + member count badges
- Replaced TabsContent wrappers in OrchestraDetailsPage with `AnimatePresence mode="wait" + motion.div key={activeTab}` for 200ms opacity fade
- Replaced BagrutDetails large white-card header (breadcrumb back button + h1 + status badge + metadata) with `DetailPageHeader` — student initials avatar, status badge (הושלם/בתהליך), teacher badge
- Preserved BagrutDetails action buttons (complete, export PDF, delete) in separate row below header
- Wrapped BagrutDetails tab content (7 tabs) with `AnimatePresence + motion.div` 200ms fade
- Custom `Tab` component definition in BagrutDetails preserved untouched
- All 4 entity detail pages (Teacher, Student, Orchestra, Bagrut) now use `DetailPageHeader` for consistent warm gradient branding

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire DetailPageHeader and tab fade into Orchestra detail page** - `12a0562` (feat)
2. **Task 2: Wire DetailPageHeader and tab fade into Bagrut detail page** - `95cb38e` (feat)

## Files Created/Modified
- `src/features/orchestras/details/components/OrchestraDetailsPage.tsx` — Replaced inline breadcrumb + emoji card with DetailPageHeader; replaced TabsContent with AnimatePresence fade
- `src/pages/BagrutDetails.tsx` — Added DetailPageHeader + AnimatePresence imports; replaced large header block; wrapped 7-tab content area with motion fade; action buttons preserved below header

## Decisions Made
- Orchestra passes `fullName={orchestra?.name}` only — `getDisplayName` in DetailPageHeader handles single-name strings, `getInitials` in nameUtils takes first letter of single token
- Bagrut action buttons preserved in separate `div` below header, not merged into header — cleaner visual hierarchy, matches pattern from StudentDetailsPage
- BagrutDetails custom Tab component (lines 42-61) intentionally untouched — it's the tab trigger UI, not the content. Only the content area got AnimatePresence
- Teacher badge rendered conditionally (`{teacher && ...}`) — teacher data is loaded asynchronously after bagrut, prevents flash of "מורה: undefined"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 11 complete — all planned detail page header upgrades done
- Phase 12 (Layout Shell) is the next phase in the v2.0 roadmap
- All 4 detail pages consistent: Teacher, Student, Orchestra, Bagrut all use DetailPageHeader

---
*Phase: 11-detail-pages*
*Completed: 2026-02-18*

## Self-Check: PASSED

**Files verified:**
- FOUND: src/features/orchestras/details/components/OrchestraDetailsPage.tsx
- FOUND: src/pages/BagrutDetails.tsx

**Commits verified:**
- FOUND: 12a0562 (feat(11-02): wire DetailPageHeader and tab fade into Orchestra detail page)
- FOUND: 95cb38e (feat(11-02): wire DetailPageHeader and tab fade into Bagrut detail page)
