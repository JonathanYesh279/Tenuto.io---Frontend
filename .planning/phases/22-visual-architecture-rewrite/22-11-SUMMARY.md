---
phase: 22-visual-architecture-rewrite
plan: 11
subsystem: ui
tags: [detail-pages, dossier, tabs, phosphor, react, tailwind, teachers, students, orchestras]

# Dependency graph
requires:
  - phase: 22-02
    provides: Phosphor icon system installed and sidebar migrated
  - phase: 22-04
    provides: DetailPageHeader entity accent pattern (borderRight), flat data surfaces, semantic tokens
  - phase: 22-08
    provides: Feature detail component sweeps — zero primary-NNN, rounded-lg→rounded across features

provides:
  - Dossier archetype implemented on all three entity detail pages
  - DetailPageHeader rewritten as bg-muted/40 identity block with tab attachment zone via children prop
  - Tab bar attached inside identity block — no vertical gap between header and content
  - Native button tab navigation (Phosphor icons, semantic border-b-2 indicator) replacing shadcn TabsList
  - TeacherTabNavigation, StudentTabNavigation, OrchestraTabNavigation restyled to dossier pattern
  - OrchestraTabContent text-gray-500 → text-muted-foreground
  - StudentDetailsHeader rewritten: bg-primary gradient → bg-muted/40 flat tonal surface with Phosphor icons
  - AvatarInitials component accepts style prop for entity accent border

affects:
  - 22-12-PLAN.md (Dashboard archetype — no detail pages affected)
  - Any future plan referencing DetailPageHeader or entity detail page layout

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dossier archetype: bg-muted/40 tonal block + border-b + tab bar inside header as children"
    - "Tab indicator: border-b-2 border-foreground for active, border-transparent for inactive"
    - "Entity accent: borderRight on AvatarInitials (not background fill)"
    - "Tab bar structure: native <nav> + <button> elements (not shadcn Tabs) for dossier pattern"

key-files:
  modified:
    - src/components/domain/DetailPageHeader.tsx
    - src/components/domain/AvatarInitials.tsx
    - src/features/teachers/details/components/TeacherDetailsPage.tsx
    - src/features/teachers/details/components/TeacherTabNavigation.tsx
    - src/features/students/details/components/StudentDetailsPage.tsx
    - src/features/students/details/components/StudentDetailsHeader.tsx
    - src/features/students/details/components/StudentTabNavigation.tsx
    - src/features/orchestras/details/components/OrchestraDetailsPage.tsx
    - src/features/orchestras/details/components/OrchestraTabNavigation.tsx
    - src/features/orchestras/details/components/OrchestraTabContent.tsx

key-decisions:
  - "[22-11 Dossier]: bg-muted/40 border-b border-border replaces entity-colored pastel header + outer border/rounded container"
  - "[22-11 Dossier]: children prop in DetailPageHeader renders tab bar INSIDE the tonal block — no gap between identity and tabs"
  - "[22-11 Dossier]: Native button nav replaces shadcn Tabs/TabsList in all three detail pages — dossier pattern needs direct control over tab bar placement"
  - "[22-11 Dossier]: Award icon absent from Phosphor — CertificateIcon used for Bagrut tab (semantically appropriate for exam certification)"
  - "[22-11 Dossier]: StudentDetailsHeader updated to dossier pattern even though StudentDetailsPage uses DetailPageHeader directly — legacy component kept consistent"
  - "[22-11 Dossier]: AvatarInitials extended with style prop to support entity accent borderRight"

patterns-established:
  - "Identity block: breadcrumb (pt-4) → identity row (pt-4 pb-4) → tab bar zone (px-6) → border-b separates from content"
  - "Tab button: py-3 border-b-2 text-sm whitespace-nowrap transition-colors; active = font-semibold border-foreground text-foreground"
  - "Detail page content: AnimatePresence motion.div directly below DetailPageHeader, no Card/border wrapper"

# Metrics
duration: 8min
completed: 2026-02-19
---

# Phase 22 Plan 11: Detail Page Dossier Archetype Summary

**Dossier identity block with attached tab bar implemented on all three entity detail pages — bg-muted/40 tonal surface, Phosphor icons, native button tab nav, zero card wrappers in content**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-19T12:04:02Z
- **Completed:** 2026-02-19T12:11:59Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- DetailPageHeader rewritten: `bg-muted/40 border-b border-border` container with breadcrumb inside, `children` prop renders tab bar in the tonal block
- All three entity detail pages (Teacher, Student, Orchestra) now render tab navigation as children of DetailPageHeader — visually attached, no gap
- shadcn Tabs/TabsList eliminated from detail pages; replaced with native `<nav>/<button>` elements with `border-b-2 border-foreground` active indicator
- TeacherTabNavigation, StudentTabNavigation, OrchestraTabNavigation restyled: Phosphor icons, semantic tokens, dossier pattern
- StudentDetailsHeader transformed from `bg-primary` gradient banner to `bg-muted/40` flat tonal surface

## Task Commits

1. **Task 1: Rewrite DetailPageHeader as identity block with tab attachment zone** - `ecc4500` (feat)
2. **Task 2: Wire tab bars into identity blocks on all three detail pages** - `9b1bfe3` (feat)

## Files Created/Modified

- `src/components/domain/DetailPageHeader.tsx` — Dossier identity block: bg-muted/40, breadcrumb inside block, children = tab attachment zone
- `src/components/domain/AvatarInitials.tsx` — Added style prop for entity accent borderRight
- `src/features/teachers/details/components/TeacherDetailsPage.tsx` — Tab nav moved inside DetailPageHeader, lucide → Phosphor
- `src/features/teachers/details/components/TeacherTabNavigation.tsx` — Phosphor icons, semantic token tab buttons
- `src/features/students/details/components/StudentDetailsPage.tsx` — Tab nav moved inside DetailPageHeader, lucide → Phosphor
- `src/features/students/details/components/StudentDetailsHeader.tsx` — bg-primary gradient → bg-muted/40 dossier block, lucide → Phosphor
- `src/features/students/details/components/StudentTabNavigation.tsx` — Phosphor icons, semantic token tab buttons
- `src/features/orchestras/details/components/OrchestraDetailsPage.tsx` — Tab nav moved inside DetailPageHeader, lucide → Phosphor
- `src/features/orchestras/details/components/OrchestraTabNavigation.tsx` — Semantic tokens, border-primary-500/text-gray-500 eliminated
- `src/features/orchestras/details/components/OrchestraTabContent.tsx` — text-gray-500 → text-muted-foreground

## Decisions Made

- Used native `<nav>/<button>` instead of shadcn Tabs because dossier pattern requires tab bar to be a child of the identity block — shadcn Tabs context must wrap both trigger and content which would force content outside the header
- `Award` icon absent from Phosphor library — `CertificateIcon` chosen for Bagrut tab (semantically correct for exam certification)
- AvatarInitials extended with `style` prop (Rule 1 auto-fix) to support entity accent `borderRight` without requiring a wrapper div

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AvatarInitials did not accept style prop**
- **Found during:** Task 1 (DetailPageHeader rewrite)
- **Issue:** Plan specified `style={{ borderRight: ... }}` on AvatarInitials, but the component interface had no style prop — TypeScript would reject it
- **Fix:** Added `style?: React.CSSProperties` to AvatarInitialsProps interface and passed it to the underlying Avatar component
- **Files modified:** src/components/domain/AvatarInitials.tsx
- **Verification:** DetailPageHeader compiles cleanly with style prop on AvatarInitials
- **Committed in:** ecc4500 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing prop — Rule 1 bug fix)
**Impact on plan:** Minimal — required to implement the accent border as specified. No scope creep.

## Issues Encountered

- `Award` icon not in Phosphor library — discovered during icon verification. Used `CertificateIcon` as semantic replacement. All other icons (ArrowRight, ArrowClockwise, User, Users, Calendar, MusicNotes, Clock, Info, GraduationCap, CheckCircle, BookOpen, FileText, Spinner, Database, Shield, WarningCircle, Phone, Printer, DownloadSimple, Pencil, WifiHigh, WifiSlash, Certificate) verified against Phosphor dist declarations before use.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dossier archetype complete — all three entity detail pages follow the pattern
- DetailPageHeader is the canonical identity block for entity detail views going forward
- Next: Dashboard command center archetype (22-12)

---
*Phase: 22-visual-architecture-rewrite*
*Completed: 2026-02-19*

## Self-Check: PASSED

- DetailPageHeader.tsx: FOUND
- AvatarInitials.tsx: FOUND
- TeacherDetailsPage.tsx: FOUND
- StudentDetailsPage.tsx: FOUND
- OrchestraDetailsPage.tsx: FOUND
- 22-11-SUMMARY.md: FOUND
- Commit ecc4500 (Task 1): FOUND
- Commit 9b1bfe3 (Task 2): FOUND
