---
phase: 22-visual-architecture-rewrite
plan: 01
subsystem: ui
tags: [css-variables, tailwind, design-tokens, color-palette, button]

# Dependency graph
requires: []
provides:
  - Cool neutral CSS token foundation (--primary black, --radius 2px, dark sidebar)
  - Subdued entity color palette replacing vivid pastels
  - Zero decorative shadow system (shadow-1 = none)
  - Black primary button with explicit hover state
affects:
  - 22-02 (sidebar will inherit --sidebar charcoal tokens)
  - 22-03 (primary-NNN migration noted and deferred)
  - All subsequent Phase 22 plans (inherit this token base)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS custom properties as raw HSL channels consumed via hsl(var(--)) in Tailwind"
    - "Zero decorative elevation — shadows only on interaction layers (modals, dropdowns, popovers)"
    - "Entity colors as subdued tints — not vivid pastels — for thin accent use only"

key-files:
  created: []
  modified:
    - src/index.css
    - tailwind.config.js
    - src/components/ui/button.tsx

key-decisions:
  - "--primary: 0 0% 0% — black is locked, not a variable choice"
  - "--radius: 0.125rem (2px) — sharp corners locked for architectural identity"
  - "--sidebar: 220 20% 13% — deep charcoal for tonally distinct, structurally anchoring sidebar"
  - "--shadow-1: none — decorative elevation eliminated, shadows reserved for interaction layers only"
  - "hover:bg-neutral-800 replaces hover:bg-primary/90 — visible lighter shift on black button"
  - "primary-NNN hex classes (1,211 across 134 files) documented but not migrated — deferred to 22-03"

patterns-established:
  - "Token foundation: all subsequent plans inherit from :root in src/index.css"
  - "Sidebar tokens: --sidebar-* vars control the tonally distinct dark sidebar"
  - "Entity colors: subdued 40% saturation backgrounds, not vivid pastels"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 22 Plan 01: Token Foundation Summary

**Cool neutral design token system — black primary, 2px radius, charcoal sidebar, zero decorative shadow — replacing the warm coral/amber v2.1 palette across the entire app**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T11:21:39Z
- **Completed:** 2026-02-19T11:23:19Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Replaced all :root CSS custom properties with cool neutral palette (--primary: black, --radius: 2px)
- Established dark charcoal sidebar token system (--sidebar: 220 20% 13%)
- Eliminated all decorative shadow (--shadow-1: none, --shadow-0: none)
- Subdued entity color palette (40% saturation backgrounds replacing 70-90% vivid pastels)
- Updated button.tsx default variant with visible black hover (hover:bg-neutral-800)
- Documented hardcoded primary-NNN hex classes in tailwind.config.js for deferred 22-03 migration

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace CSS custom properties with cool neutral token system** - `6b24975` (feat)
2. **Task 2: Update button.tsx and document tailwind.config.js token wiring** - `9bd1eea` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/index.css` - Complete :root replacement with cool neutral palette, dark sidebar tokens, subdued entity colors, cool neutral scale, zero decorative shadow
- `tailwind.config.js` - Added documentation comment on hardcoded primary-NNN hex values; confirmed entity color and radius CSS var wiring
- `src/components/ui/button.tsx` - Default variant updated: hover:bg-neutral-800 active:bg-neutral-900

## Decisions Made
- Black primary (0 0% 0%) is a locked architectural decision, not a default
- 2px corner radius establishes sharp, non-rounded shape language across all Radix/shadcn components
- Dark sidebar (charcoal 220 20% 13%) makes the sidebar tonally distinct and structurally anchoring
- Shadow-1 set to none — no decorative elevation anywhere in the app
- primary-NNN hardcoded hex classes left untouched (1,211 across 134 files) — migration scoped to 22-03

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Token foundation complete — all subsequent Phase 22 plans inherit cool neutral palette
- Sidebar (22-02) can use --sidebar-* vars directly
- primary-NNN migration (22-03) documented and ready to proceed
- Button, radius, shadows all consistent with new architectural identity

---
*Phase: 22-visual-architecture-rewrite*
*Completed: 2026-02-19*
