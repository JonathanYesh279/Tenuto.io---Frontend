---
phase: 16-token-foundation
plan: 01
subsystem: ui
tags: [css, design-tokens, tailwind, elevation, shadows]

# Dependency graph
requires: []
provides:
  - 4 surface elevation CSS vars (--surface-base, --surface-raised, --surface-overlay, --surface-floating)
  - 9-step warm neutral color scale (--neutral-50 through --neutral-900)
  - 5-level semantic shadow scale (--shadow-0 through --shadow-4) with warm-tinted rgba values
affects:
  - 16-02 (Tailwind config will map shadow vars via var() references)
  - 17 (Typography phase will reference neutral scale)
  - All v2.1 phases consuming elevation/shadow tokens

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Surface vars use full hsl() syntax (not raw channels) — consumed via var(--surface-base), NOT hsl(var(...))"
    - "Shadow warm tint uses rgba(120, 60, 20, ...) approximating coral brand hue at low opacity"
    - "Phase 16 token vars are additive-only — zero blast radius on existing styles"

key-files:
  created: []
  modified:
    - src/index.css

key-decisions:
  - "Surface vars store full hsl() values to enable direct var() consumption (not shadcn raw-channel pattern)"
  - "Shadow warm tint at rgba(120,60,20) approximates coral brand at low opacity per research recommendation"

patterns-established:
  - "Token groups use section comments with phase reference: /* Surface elevation scale (Phase 16 — TOKEN-01) */"
  - "New Phase 16 vars inserted inside existing :root block, after existing 15 vars — maintains single :root declaration"

# Metrics
duration: <1min
completed: 2026-02-18
---

# Phase 16 Plan 01: Token Foundation Summary

**18 new CSS custom property tokens added to :root — surface elevation scale (4 vars), warm neutral palette (9 vars), and semantic shadow scale (5 vars) — establishing the single source of truth for all v2.1 elevation and depth work**

## Performance

- **Duration:** <1 min
- **Started:** 2026-02-18T16:08:19Z
- **Completed:** 2026-02-18T16:08:54Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added 4 surface elevation CSS vars: `--surface-base`, `--surface-raised`, `--surface-overlay`, `--surface-floating` using full hsl() syntax
- Added 9-step warm neutral scale `--neutral-50` through `--neutral-900` with progressively warmer hue channel (30 down to 14)
- Added 5-level semantic shadow scale `--shadow-0` through `--shadow-4` with warm-tinted `rgba(120, 60, 20, ...)` values matching coral brand hue
- All 15 original `:root` vars preserved exactly unchanged — zero blast radius

## Task Commits

Each task was committed atomically:

1. **Task 1: Add surface, neutral, and shadow CSS custom properties to :root** - `39b2ca2` (feat)

**Plan metadata:** (created in this commit)

## Files Created/Modified
- `src/index.css` - Added 18 new CSS custom properties inside the existing `@layer base { :root { } }` block, after the original 15 shadcn-pattern vars

## Decisions Made
- Surface vars use full `hsl()` syntax rather than the shadcn raw-channel pattern (`--background: 30 25% 97%`) because they are consumed directly via `var(--surface-base)` in CSS, not via Tailwind's `hsl(var(...))` pattern
- Shadow warm tint `rgba(120, 60, 20, ...)` approximates the coral brand hue at low opacity — aligns with the warm-palette identity without importing a color conversion utility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Token foundation complete — `--shadow-0` through `--shadow-4` are ready for Tailwind `boxShadow` config mapping in Plan 16-02
- `--neutral-*` and `--surface-*` vars available for Typography (Phase 17), Card elevation (Phase 18), and all subsequent v2.1 phases
- No blockers

---
*Phase: 16-token-foundation*
*Completed: 2026-02-18*
