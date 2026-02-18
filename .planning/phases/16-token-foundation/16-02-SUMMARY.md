---
phase: 16-token-foundation
plan: 02
subsystem: ui
tags: [tailwind, framer-motion, css-variables, design-tokens, color-system]

# Dependency graph
requires:
  - phase: 16-01
    provides: "18 CSS :root vars including --shadow-0 through --shadow-4 and --primary warm coral"
provides:
  - "shadow-0 through shadow-4 Tailwind boxShadow utilities wired to CSS vars"
  - "motionTokens.ts with snappy/smooth/bouncy spring presets and duration/easing constants"
  - "COLOR-INVENTORY.md: grep-verified inventory of 1,211 primary-NNN class instances across 134 files"
  - "Documented dual color system conflict with forward migration strategy"
affects: [17-elevation, 18-typography, 19-components, 20-motion, color-migration-phase]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Spring presets as typed constants: import { snappy } from @/lib/motionTokens"
    - "Shadow utilities: shadow-0 through shadow-4 resolve via CSS vars (not hardcoded values)"
    - "import type for Framer Motion types — no runtime dependency in token module"

key-files:
  created:
    - src/lib/motionTokens.ts
    - .planning/phases/16-token-foundation/COLOR-INVENTORY.md
  modified:
    - tailwind.config.js

key-decisions:
  - "Color migration deferred: 1,211 primary-NNN instances across 134 files requires dedicated phase, not inline fix"
  - "Two migration options documented (palette alignment vs semantic aliases) — decision deferred"
  - "focus:ring-primary-500 (379 hits) flagged as WCAG accessibility risk for any future palette change"

patterns-established:
  - "Motion tokens: components import named spring presets (snappy/smooth/bouncy) rather than defining inline spring params"
  - "Shadow scale: use shadow-0/1/2/3/4 utility classes; never add raw box-shadow values inline"

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 16 Plan 02: Token Foundation (Tailwind + Motion) Summary

**shadow-0 through shadow-4 Tailwind utilities wired to CSS vars, motionTokens.ts with 3 named spring presets, and grep-verified inventory of 1,211 dual-color-system occurrences across 134 files**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T16:11:05Z
- **Completed:** 2026-02-18T16:15:10Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `shadow-0` through `shadow-4` boxShadow entries to `tailwind.config.js`, completing the bridge between CSS vars (Phase 16-01) and Tailwind utility classes
- Created `src/lib/motionTokens.ts` exporting `snappy`, `smooth`, `bouncy` spring presets plus `duration` and `easing` scalar token objects — importable via `@/lib/motionTokens`
- Produced `COLOR-INVENTORY.md` with grep-verified counts (1,211 instances / 134 files) and identified 7 mixed-system components at highest visual inconsistency risk

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire shadow CSS vars and create motionTokens.ts** - `3535464` (feat)
2. **Task 2: Produce dual color system inventory document** - `c2777f2` (docs)

**Plan metadata:** (in final commit)

## Files Created/Modified
- `tailwind.config.js` — Added 5 new boxShadow entries (`shadow-0` through `shadow-4`) mapping to CSS vars; existing named entries unchanged
- `src/lib/motionTokens.ts` — New file: 3 spring presets + duration/easing scalar tokens, `import type` for framer-motion Transition
- `.planning/phases/16-token-foundation/COLOR-INVENTORY.md` — New file: grep-verified dual color system inventory with migration strategy

## Decisions Made
- Color migration is not inline work — 1,211 instances across 134 files requires a dedicated planning phase. Documenting now (deferred decision) is the right call.
- Two migration options presented (Option A: palette alignment, Option B: semantic aliases) without picking — architectural decision requires user input.
- `focus:ring-primary-500` (379 occurrences) explicitly flagged as WCAG 2.1 AA risk so any future palette change includes mandatory contrast verification step.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Initial grep with `*.{ts,tsx,js,jsx}` glob didn't work in bash (shell expansion issue); resolved by removing file type filter and using bare `grep -r src/` which covers all files. Counts are accurate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Token foundation is complete: CSS vars (16-01) + Tailwind utilities (16-02) are wired
- `shadow-0` through `shadow-4` ready for Phase 17 elevation work
- `motionTokens.ts` ready for Phase 20 motion work
- COLOR-INVENTORY.md serves as input document when a color migration phase is planned
- Phase 17 (Elevation) can proceed immediately

---
*Phase: 16-token-foundation*
*Completed: 2026-02-18*
