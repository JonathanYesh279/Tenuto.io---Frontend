---
phase: 17-primitive-component-layer
plan: 02
subsystem: ui
tags: [framer-motion, radix-ui, dialog, tabs, input, spring-animation, shadow-tokens, accessibility]

# Dependency graph
requires:
  - phase: 16-token-foundation
    provides: shadow-4 Tailwind utility, smooth spring preset in motionTokens.ts, CSS var shadow system
provides:
  - DialogContent with shadow-4 elevation and Framer Motion spring entrance
  - DialogOverlay with Framer Motion fade entrance
  - useReducedMotion() gating on all motion entrances
  - CSS exit animation preserved (data-[state=closed] classes intact)
  - TabsTrigger active state using shadow-1 (warm-tinted token)
  - Verified focus-visible:ring-ring on TabsTrigger, TabsContent, and Input
affects: [phase-18-typography, phase-19-card-surface, phase-21-shell]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "motion(RadixPrimitive) wrapper pattern for spring entrance on Radix components"
    - "CSS exit animation + Framer Motion entrance hybrid: FM handles open, CSS handles closed"
    - "useReducedMotion() guard: pass undefined to initial/animate/transition to opt out of FM animation"

key-files:
  created: []
  modified:
    - src/components/ui/dialog.tsx
    - src/components/ui/tabs.tsx

key-decisions:
  - "CSS exit animation hybrid: Framer Motion owns the entrance, CSS data-[state=closed] classes own the exit — avoids hoisting Radix open state"
  - "motion(DialogPrimitive.Overlay) and motion(DialogPrimitive.Content) wrap directly — framer-motion v10 motion() API works without asChild workaround"
  - "input.tsx needs zero changes — focus-visible:ring-ring already present, inputs remain flat (no shadow token)"

patterns-established:
  - "Hybrid FM + CSS animation pattern: import motion from framer-motion, create MotionX = motion(RadixPrimitive.X), use initial/animate/transition for entrance, keep data-[state=closed] CSS classes for exit"
  - "Accessibility gate: const shouldReduceMotion = useReducedMotion() ?? false; pass undefined instead of animation values when true"

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 17 Plan 02: Primitive Component Layer — Dialog/Tabs/Input Summary

**Framer Motion spring entrance on Dialog via motion(RadixPrimitive) hybrid, shadow-4 elevation on DialogContent, shadow-1 on active TabsTrigger, focus rings verified across Tabs and Input**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-18T16:39:48Z
- **Completed:** 2026-02-18T16:41:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- DialogContent gains shadow-4 (warm-tinted token elevation) replacing shadow-lg
- DialogContent and DialogOverlay entrance animated via Framer Motion spring (smooth preset) — opacity + scale + y transform
- Both entrances gated by useReducedMotion() for accessibility — reduced-motion users see instant appearance
- CSS exit animation fully preserved: all data-[state=closed] classes kept intact
- motion(DialogPrimitive.Overlay) and motion(DialogPrimitive.Content) work directly in framer-motion v10 — no asChild workaround needed
- Modal.tsx and ConfirmDeleteDialog (24+ callsites) backward-compatible with zero changes
- TabsTrigger active state uses shadow-1 (warm-tinted token) instead of shadow-sm
- focus-visible:ring-ring verified as consistent on TabsTrigger, TabsContent, and Input

## Task Commits

Each task was committed atomically:

1. **Task 1: Dialog spring entrance and shadow-4 elevation** - `61e3ee0` (feat)
2. **Task 2: Tabs active shadow token and Input/Tabs focus ring verification** - `d54cf38` (feat)

## Files Created/Modified

- `src/components/ui/dialog.tsx` - MotionOverlay + MotionContent spring entrance, shadow-4, useReducedMotion gating, CSS exit preserved
- `src/components/ui/tabs.tsx` - shadow-sm replaced with shadow-1 on active TabsTrigger

## Decisions Made

- **CSS exit hybrid pattern:** Framer Motion owns the entrance animation; CSS data-[state=closed] classes own the exit. This avoids hoisting Radix's internal `open` state into React state just to run exit animations via FM.
- **motion() wrapper:** `motion(DialogPrimitive.Content)` works directly in framer-motion v10 — single DOM element, no double-div, no asChild needed. The plan's fallback was not required.
- **Input unchanged:** input.tsx already has `focus-visible:ring-ring` and no shadow — verified-correct with zero modifications needed.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- dialog.tsx, tabs.tsx, and input.tsx primitive layer complete
- Phase 17 Plan 01 (Button and Badge shadow tokens) + Plan 02 (Dialog/Tabs/Input) together complete Phase 17
- Ready for Phase 18: Typography (Heebo 700-800 font weight enhancement)
- Existing concern: Heebo 700-800 may cause Hebrew nav label wrapping — browser test required before expanding typography scope

---
*Phase: 17-primitive-component-layer*
*Completed: 2026-02-18*

## Self-Check: PASSED

- FOUND: src/components/ui/dialog.tsx
- FOUND: src/components/ui/tabs.tsx
- FOUND: .planning/phases/17-primitive-component-layer/17-02-SUMMARY.md
- FOUND: commit 61e3ee0 (Task 1)
- FOUND: commit d54cf38 (Task 2)
- shadow-4 present in dialog.tsx
- useReducedMotion present in dialog.tsx (3 occurrences)
- shadow-1 present in tabs.tsx
