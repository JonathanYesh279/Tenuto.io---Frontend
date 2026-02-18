---
phase: 17-primitive-component-layer
plan: 01
subsystem: ui
tags: [framer-motion, tailwind, shadow-tokens, spring-animation, shadcn]

# Dependency graph
requires:
  - phase: 16-token-foundation
    provides: shadow-1, shadow-2 Tailwind utilities and motionTokens.ts snappy preset
provides:
  - Card component with warm-tinted shadow-1 base and hover:shadow-2 depth
  - Button with Framer Motion motion.button spring press (whileTap scale 0.95) gated by useReducedMotion()
  - Badge default variant with shadow-1 elevation
affects: [phase-18, phase-19, phase-20, phase-21, all pages using Card/Button/Badge]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "motion.button branch pattern: non-asChild renders motion.button, asChild renders Slot unchanged"
    - "useReducedMotion() guard: whileTap set to undefined when reduced motion preferred"
    - "Shadow token convention: shadow-1 for base rest state, shadow-2 for hover/elevated state"

key-files:
  created: []
  modified:
    - src/components/ui/Card.tsx
    - src/components/ui/button.tsx
    - src/components/ui/badge.tsx

key-decisions:
  - "Button uses early-return branch (if !asChild) so motion.button and Slot paths are cleanly separate, no conditional type casting in JSX"
  - "transition-shadow moved to Card base class so smooth animation applies even without hover prop"
  - "active:scale-95 CSS class preserved alongside whileTap — provides instant feedback for reduced-motion users without JS overhead"

patterns-established:
  - "Spring press pattern: motion.button + whileTap={{ scale: 0.95 }} + transition={snappy} + useReducedMotion() guard"
  - "Shadow token upgrade: shadow-sm/shadow-md replaced with shadow-1/shadow-2 from Phase 16 token system"

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 17 Plan 01: Primitive Component Layer (Card/Button/Badge) Summary

**shadow-1/shadow-2 token swap on Card and Badge, plus Framer Motion spring press on Button via motion.button branch gated by useReducedMotion()**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-18T16:39:28Z
- **Completed:** 2026-02-18T16:40:58Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Card now renders warm-tinted shadow-1 at rest with smooth shadow-2 on hover (transition on base class, not just hover conditional)
- Button non-asChild case replaced with motion.button, delivering spring-based whileTap press feedback using snappy preset; asChild/Slot path completely unchanged
- Badge default variant gains shadow-1 for subtle depth; all 5 domain status variants and other variants untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Card shadow token swap and Button spring press** - `72213a4` (feat)
2. **Task 2: Badge default variant shadow token** - `efe1eaf` (feat)

**Plan metadata:** committed with SUMMARY.md and STATE.md update

## Files Created/Modified

- `src/components/ui/Card.tsx` - shadow-sm → shadow-1 base; hover:shadow-md → hover:shadow-2; transition-shadow + duration-200 on base
- `src/components/ui/button.tsx` - Added framer-motion + motionTokens imports; if (!asChild) branch renders motion.button with spring press
- `src/components/ui/badge.tsx` - default variant gains shadow-1; no other variants touched

## Decisions Made

- Button uses an early-return `if (!asChild)` branch rather than a ternary in JSX — keeps motion.button and Slot code paths cleanly separate with no conditional type casting ambiguity
- `transition-shadow` moved from the hover conditional to the Card base class so the animation applies to any className-override hover state, not just when the `hover` prop is true
- `active:scale-95` CSS class kept alongside `whileTap` — provides zero-JS instant visual feedback for reduced-motion users who skip the Framer Motion whileTap entirely

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. framer-motion was already in package.json.

## Next Phase Readiness

- All three primitives (Card, Button, Badge) now carry Phase 16 shadow tokens
- 60+ files importing these components inherit visual improvements automatically
- Phase 17 Plan 02 (Dialog/Sheet elevation) can proceed immediately
- No new z-index values introduced; no Radix dropdown children affected

---
*Phase: 17-primitive-component-layer*
*Completed: 2026-02-18*
