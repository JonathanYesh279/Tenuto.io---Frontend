---
phase: 22-visual-architecture-rewrite
plan: 03
subsystem: ui
tags: [tailwind, css-vars, design-tokens, visual-architecture]

# Dependency graph
requires:
  - phase: 22-01
    provides: CSS variable token system with --primary = black and --radius = 0.125rem
provides:
  - All 15 src/pages/ files use semantic token classes (bg-primary, bg-muted, text-primary, border-border, focus:ring-ring)
  - All 15 src/pages/ files use sharp 2px radius (rounded) instead of rounded-lg/xl/2xl/3xl
  - Token reset from plan 22-01 now propagates visually to every page
affects:
  - 22-04, 22-05, 22-06, 22-07, 22-08, 22-09 (all downstream pages and components)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Semantic token pattern: bg-primary (not bg-primary-500) for action buttons"
    - "bg-muted for light background tints (replaces bg-primary-50/100)"
    - "border-border for structural borders (replaces border-primary-200/300)"
    - "focus:ring-ring for focus states (replaces focus:ring-primary-500)"
    - "rounded (2px) for all UI elements except rounded-full (avatars/pills) and modal containers"

key-files:
  created: []
  modified:
    - src/pages/Teachers.tsx
    - src/pages/Students.tsx
    - src/pages/Orchestras.tsx
    - src/pages/Dashboard.tsx
    - src/pages/Bagruts.tsx
    - src/pages/Rehearsals.tsx
    - src/pages/TheoryLessons.tsx
    - src/pages/TheoryLessonDetails.tsx
    - src/pages/BagrutDetails.tsx
    - src/pages/RehearsalDetails.tsx
    - src/pages/Settings.tsx
    - src/pages/ImportData.tsx
    - src/pages/MinistryReports.tsx
    - src/pages/AuditTrail.tsx
    - src/pages/Profile.tsx

key-decisions:
  - "Modal containers (bg-white rounded-lg max-w-*) preserved rounded-lg for floating panel feel"
  - "Floating dropdowns (absolute + shadow-lg) preserved rounded-lg for pop-up feel"
  - "Auth pages (Login, ForgotPassword, ResetPassword) excluded — not in 15-page scope"
  - "Decorative shadows (shadow-sm, hover:shadow-md) removed from static cards alongside rounding"
  - "Text-primary-foreground is semantic token — not a numbered color, not replaced"

patterns-established:
  - "Page buttons: bg-primary text-primary-foreground hover:bg-neutral-800"
  - "Form inputs: border-border focus:ring-ring focus:border-transparent"
  - "Light tints (info boxes, badges): bg-muted text-foreground border-border"
  - "Icon containers: w-10 h-10 rounded bg-muted"
  - "Tab active states: border-primary text-primary bg-muted"

# Metrics
duration: 45min
completed: 2026-02-19
---

# Phase 22 Plan 03: Page Color and Radius Mechanical Sweep Summary

**Replaced 114 hardcoded primary-NNN color classes and 177 excessive rounding classes across all 15 src/pages/ files, making the token reset from plan 22-01 visually propagate to every page**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-02-19T00:00:00Z
- **Completed:** 2026-02-19T00:45:00Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- Zero hardcoded `bg-primary-NNN`, `text-primary-NNN`, `border-primary-NNN`, `ring-primary-NNN` classes in any of the 15 target page files
- Zero `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-lg`, `rounded-md` on non-floating elements across all 15 pages
- All 38 `rounded-full` instances preserved (avatars, spinners, pills)
- All 7 modal container `rounded-lg` instances preserved (floating panel feel)
- Decorative shadows removed from static cards alongside rounding cleanup

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace hardcoded primary-NNN color classes in all page files** - `90b9deb` (feat)
2. **Task 2: Replace excessive rounding classes in all page files** - `a85fe93` (feat)

## Files Created/Modified

- `src/pages/Teachers.tsx` - Primary-NNN → semantic tokens; rounded-lg/md → rounded; lesson card inner rounding fixed
- `src/pages/Students.tsx` - Primary-NNN → semantic tokens; rounded-lg → rounded; modal container preserved
- `src/pages/Dashboard.tsx` - Primary-NNN → semantic tokens; rounded-lg/md → rounded
- `src/pages/Bagruts.tsx` - Primary-NNN → semantic tokens; rounded-lg/md → rounded; modal container preserved
- `src/pages/BagrutDetails.tsx` - Primary-NNN → semantic tokens; rounded-lg → rounded
- `src/pages/Rehearsals.tsx` - Primary-NNN → semantic tokens; rounded-lg/md → rounded
- `src/pages/RehearsalDetails.tsx` - Primary-NNN → semantic tokens; rounded-lg/md → rounded; two modal containers preserved
- `src/pages/TheoryLessons.tsx` - Primary-NNN → semantic tokens; rounded-xl/lg → rounded
- `src/pages/TheoryLessonDetails.tsx` - Primary-NNN → semantic tokens; rounded-lg → rounded; modal container preserved
- `src/pages/Orchestras.tsx` - Primary-NNN (checkbox) → semantic token; rounded-lg → rounded
- `src/pages/Profile.tsx` - No primary-NNN to fix; rounded-lg → rounded; decorative shadows removed from stat cards
- `src/pages/Settings.tsx` - Icon container rounded-lg → rounded; selects and save button rounded-lg → rounded
- `src/pages/ImportData.tsx` - Icon container/tab buttons/action buttons rounded-lg → rounded
- `src/pages/MinistryReports.tsx` - Icon containers/buttons/select rounded-lg → rounded; shadow-sm removed from download button
- `src/pages/AuditTrail.tsx` - All filter inputs and select rounded-lg → rounded

## Decisions Made

- Modal containers (`bg-white rounded-lg max-w-*`) kept `rounded-lg` — they are floating panels that benefit from visible rounding for perceived depth
- Floating autocomplete dropdown (`absolute shadow-lg rounded-lg`) kept `rounded-lg` — same floating-element rationale
- Auth pages (Login.tsx, ForgotPassword.tsx, ResetPassword.tsx) excluded from sweep — they use glassmorphism overlay design with intentional `rounded-2xl` for card feel
- `text-primary-foreground` semantic token (--primary-foreground = white) left intact — not a numbered hardcoded color

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed decorative shadows alongside rounding cleanup**
- **Found during:** Task 2 (Profile.tsx and other files)
- **Issue:** Some elements had `shadow-sm hover:shadow-md transition-all duration-200` on static cards — decorative elevation that contradicts the flat visual architecture
- **Fix:** Removed shadow-sm/shadow-md from static page cards when removing rounded-lg (Profile stat cards, MinistryReports download button)
- **Files modified:** src/pages/Profile.tsx, src/pages/MinistryReports.tsx
- **Verification:** grep confirms no shadow-sm on affected elements
- **Committed in:** a85fe93 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug/inconsistency)
**Impact on plan:** Minor cleanup alongside primary task. Zero scope creep.

## Issues Encountered

- `replace_all: false` errors occurred when multiple identical class strings existed in a file — resolved by switching to `replace_all: true` for those specific patterns
- MinistryReports.tsx had a dynamic Tailwind class `bg-${section.color}-100` that could produce `primary-100` — was already fixed to an explicit ternary in Task 1

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 15 pages now read from CSS variable token system
- Token changes in src/index.css propagate to all pages immediately
- Ready for feature and component-level visual work in remaining Phase 22 plans
- Auth pages (Login, ForgotPassword, ResetPassword) retain their glassmorphism design — not part of this cleanup

---
*Phase: 22-visual-architecture-rewrite*
*Completed: 2026-02-19*
