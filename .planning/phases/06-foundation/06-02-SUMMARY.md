---
phase: 06-foundation
plan: 02
subsystem: ui
tags: [css, rtl, logical-properties, shadcn, animations, accessibility]

# Dependency graph
requires:
  - phase: 06-01
    provides: CSS custom property token system (--primary, --background, etc.) used in converted hsl(var(--*)) values
provides:
  - CSS files free of non-legitimate !important overrides (body/html backgrounds removed; option selectors and responsive display toggles retain !important with TODO Phase 7 comments)
  - RTL-correct shadcn Select component using logical properties (ps-, pe-, start-)
  - teacher-modal-fixes.css using logical padding-inline-start/end, no [dir="rtl"] override block, no decorative translateX motion
  - Dead CSS files (globals.css, fonts.css) deleted
  - Accessibility patterns (prefers-reduced-motion, print .no-print) in index.css
  - Animations aligned to 100-200ms ease-out; decorative pulse-soft removed
affects:
  - 07 (modal migration — inherits clean CSS layer)
  - 08 (instruments — no dead file confusion)
  - 13 (toast — inherits 200ms animation standard)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Logical CSS properties (padding-inline-start/end, start-/end- Tailwind utilities) for RTL-correct component styling"
    - "color-scheme: light on native selects eliminates dark-mode browser option visibility without !important on the container"
    - "Responsive display toggle !important retained with TODO(Phase 7) comment when specificity alone cannot override inline styles"
    - "Animation philosophy: 100-200ms ease-out for modals/toasts/tabs; no decorative infinite animations"

key-files:
  created: []
  modified:
    - src/styles/tab-navigation-fix.css
    - src/styles/teacher-modal-fixes.css
    - src/components/ui/select.tsx
    - src/index.css
    - tailwind.config.js
  deleted:
    - src/styles/globals.css
    - src/styles/fonts.css

key-decisions:
  - "Native <option> !important kept with TODO(Phase 7) — browser-controlled option styling requires !important; Phase 7 replaces native select with shadcn Select"
  - "Responsive display toggles !important kept with TODO(Phase 7) — needed to override inline styles; Phase 7 migrates to shadcn Tabs"
  - "RTL approach: [dir='rtl'] override block merged into base selector since app is always RTL (dir=rtl on html element)"
  - "pulse-soft animation removed — decorative 2s infinite animation violates no-decorative-motion user decision"
  - "fade-in: 0.5s ease-in-out -> 0.15s ease-out (page transitions); slide-up/down: 0.3s -> 0.2s (toasts)"

patterns-established:
  - "Logical properties pattern: ps-8/pe-2/start-2 in Tailwind, padding-inline-start/end in CSS — auto-flips in RTL"
  - "Legitimate !important uses: prefers-reduced-motion block, print media .no-print, native <option> browser override (Phase 7 TODO)"

# Metrics
duration: 3min
completed: 2026-02-17
---

# Phase 6 Plan 02: CSS Cleanup and RTL Fixes Summary

**!important overrides eliminated from body/html/container selectors, shadcn Select migrated to logical CSS properties (ps-/pe-/start-), dead CSS files deleted (477 lines removed), and animations aligned to 100-200ms ease-out**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T17:18:12Z
- **Completed:** 2026-02-17T17:21:22Z
- **Tasks:** 2 of 2
- **Files modified:** 5 (tab-navigation-fix.css, teacher-modal-fixes.css, select.tsx, index.css, tailwind.config.js)
- **Files deleted:** 2 (globals.css, fonts.css)

## Accomplishments

- Removed !important overrides from body/html background rules in tab-navigation-fix.css — replaced with hsl(var(--background)) token on container class
- Fixed RTL physical properties in teacher-modal-fixes.css: merged [dir="rtl"] block into base selector, replaced padding-left/right with padding-inline-start/end, removed decorative translateX(-2px) hover, flipped highlighted box-shadow for RTL (inset -3px), replaced hardcoded blue hex with hsl(var(--primary))
- Migrated shadcn Select to logical properties: pl-8/pr-2/left-2 -> ps-8/pe-2/start-2 (auto-RTL via CSS logical properties)
- Deleted 477-line globals.css and fonts.css (both dead — never imported, contained broken @apply references to danger-*/success-* colors not in Tailwind config)
- Migrated prefers-reduced-motion (WAI-ARIA A11Y-04) and print .no-print patterns from globals.css to index.css
- Aligned animation durations to 100-200ms ease-out; removed decorative pulse-soft (2s infinite)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove !important overrides and fix RTL physical properties** - `0b08a8b` (fix)
2. **Task 2: Delete dead CSS files and reconcile animation definitions** - `3029ea4` (chore)

## Files Created/Modified

- `src/styles/tab-navigation-fix.css` - body/html !important removed; .student-details-container uses CSS token; responsive display toggles keep !important with TODO(Phase 7) comment
- `src/styles/teacher-modal-fixes.css` - logical padding-inline-start/end; [dir="rtl"] block merged in; decorative translateX removed; highlighted box-shadow RTL-correct; token colors replacing hardcoded hex; native option !important kept with TODO(Phase 7)
- `src/components/ui/select.tsx` - SelectLabel and SelectItem use ps-8/pe-2; indicator span uses start-2
- `src/index.css` - prefers-reduced-motion and print .no-print blocks added; .animate-slide-down 0.3s→0.2s
- `tailwind.config.js` - fade-in 0.5s→0.15s ease-out; slide-up/down 0.3s→0.2s; pulse-soft removed
- ~~src/styles/globals.css~~ - deleted (dead file)
- ~~src/styles/fonts.css~~ - deleted (dead file)

## Decisions Made

- Native `<option>` !important retained with TODO(Phase 7) — browser controls option rendering regardless of CSS specificity in most browsers; color-scheme: light added as root-cause fix for the container; full solution is Phase 7 shadcn Select replacement
- Responsive display toggle !important retained with TODO(Phase 7) — these override inline styles on elements that cannot be reached by specificity alone
- RTL override block merged into base selector — the app is always RTL (dir=rtl on html), so a separate [dir="rtl"] block is redundant
- pulse-soft removed without TODO — no usage found anywhere in src/; clean removal

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript errors in bagrutMigration.ts, cascadeErrorHandler.ts, errorRecovery.ts, memoryManager.ts, performanceEnhancements.tsx, securityUtils.ts — confirmed pre-existing from before Plan 06-01 changes (all in utility files unrelated to CSS). No new errors introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CSS layer is now clean: design tokens (06-01) + clean overrides (06-02) together form the Foundation phase
- Phase 6 is complete — all foundation infrastructure in place for Phase 7 (modal migration)
- shadcn Select is RTL-correct and ready for use in form components
- Animation system is principled: 100-200ms ease-out for purposeful transitions, no decorative motion

---
*Phase: 06-foundation*
*Completed: 2026-02-17*
