---
phase: 06-foundation
plan: 01
subsystem: ui
tags: [tailwind, css-variables, shadcn, radix-ui, heebo, rtl, design-tokens]

# Dependency graph
requires: []
provides:
  - CSS custom property token system in :root with warm coral/amber palette
  - Tailwind semantic token mapping (bg-primary, bg-card, etc.) via hsl(var(--token))
  - DirectionProvider wrapping entire app tree for Radix RTL portal support
  - Heebo font loading via index.html link tags with preconnect hints
  - components.json for shadcn CLI compatibility
affects:
  - 06-02 (shadcn component installation — uses these tokens directly)
  - 07 (modal migration — uses DirectionProvider and tokens)
  - 08 (instruments — uses typography and accent tokens)
  - 12 (layout shell — uses sidebar/background tokens)

# Tech tracking
tech-stack:
  added:
    - "@radix-ui/react-direction@1.1.1"
    - "Google Fonts Heebo (300-800 weights)"
  patterns:
    - "CSS custom properties in HSL channel format (H S% L%) without hsl() wrapper — wrapper goes in Tailwind config"
    - "Tailwind semantic tokens MERGED into existing numbered scales — bg-primary-500 still resolves to hardcoded hex, bg-primary resolves to coral CSS variable"
    - "Font loading via <link> in index.html not @import in CSS — avoids render-blocking"

key-files:
  created:
    - components.json
  modified:
    - index.html
    - src/main.tsx
    - src/index.css
    - tailwind.config.js
    - package.json

key-decisions:
  - "Warm coral/amber palette: --primary at 15 85% 45% (WCAG AA 4.57:1 against white)"
  - "Merge not replace: DEFAULT/foreground added to existing primary/secondary scales — zero regression on bg-primary-500"
  - "Heebo replaces Inter as primary UI font, Reisinger Yonatan kept as fallback"
  - "body background-color and color use hsl(var(--background/foreground)) instead of hardcoded rgb values"

patterns-established:
  - "Token format: HSL channels only in CSS (--primary: 15 85% 45%), hsl() wrapper only in JS (hsl(var(--primary)))"
  - "borderRadius lg/md/sm driven by --radius CSS variable (0.75rem = 12px per user decision)"

# Metrics
duration: 8min
completed: 2026-02-17
---

# Phase 6 Plan 01: CSS Design Token Foundation Summary

**CSS custom property token system with warm coral palette, Tailwind semantic token merge, Heebo font, and Radix DirectionProvider — enabling all subsequent shadcn/ui components to render with correct warm aesthetic**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-17T17:06:33Z
- **Completed:** 2026-02-17T17:15:12Z
- **Tasks:** 2 of 2
- **Files modified:** 5 (index.html, src/main.tsx, src/index.css, tailwind.config.js, components.json)

## Accomplishments

- Installed @radix-ui/react-direction and wrapped app tree with DirectionProvider — fixes Radix portal RTL behavior (dropdowns, tooltips, dialogs open in correct direction)
- Defined 16 CSS custom property tokens in :root (warm coral primary, warm off-white background, dark charcoal sidebar, amber accent) via @layer base — zero existing class regression
- Merged semantic tokens (DEFAULT, foreground) into existing primary/secondary numbered scales in tailwind.config.js — bg-primary resolves to coral, bg-primary-500 still resolves to existing #4F46E5 hex
- Heebo font loads via preconnect+link in index.html, is first in tailwind fontFamily.sans and html element font-family — Inter removed
- components.json created for shadcn CLI with correct Vite/TSX settings

## Task Commits

Each task was committed atomically:

1. **Task 1: Install DirectionProvider, update index.html and main.tsx, create components.json** - `300a049` (feat)
2. **Task 2: Add CSS token layer to index.css and merge semantic tokens into tailwind.config.js** - `ec08e36` (feat)

## Files Created/Modified

- `index.html` - lang=he, dir=rtl, Heebo font preconnect + stylesheet link
- `src/main.tsx` - document.documentElement dir/lang attributes, DirectionProvider wrapper around BrowserRouter
- `src/index.css` - @layer base :root token block, Heebo in html font-family, hsl(var(--background/foreground)) in body, removed Inter @import
- `tailwind.config.js` - semantic token keys added, DEFAULT/foreground merged into primary/secondary, borderRadius lg/md/sm with var(--radius), fontFamily.sans with Heebo first + hebrew alias
- `components.json` - shadcn CLI config with correct Vite project settings

## Decisions Made

- Warm coral primary (hue 15, 85% saturation, 45% lightness) — passes WCAG AA 4.57:1 against white text
- Merge strategy for Tailwind colors: add DEFAULT and foreground to existing primary/secondary instead of replacing the objects — preserves all bg-primary-N class resolution
- `--radius: 0.75rem` (12px) — well-rounded per user decision for cards/buttons/inputs
- Body background-color updated to hsl(var(--background)) so warm off-white token actually controls page background
- Heebo loaded via `<link>` not CSS `@import` — avoids render-blocking, matches performance best practice

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- WSL2 I/O errors during `npm run build` — confirmed pre-existing (fails identically before any changes via git stash test). These are Windows/WSL2 filesystem interop errors on random node_modules chunks, unrelated to code changes. TypeScript compilation (`tsc --noEmit`) confirms zero new errors in modified files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Token system installed — Phase 06-02 (shadcn component install) can proceed immediately
- components.json provides shadcn CLI the correct config to install components into src/components/ui/
- DirectionProvider means all Radix portals (dialogs, dropdowns, tooltips) will open RTL in Phase 07+
- Build environment has pre-existing WSL2 I/O issue — user should push and verify CI build passes on Linux (where EIO errors don't occur)

---
*Phase: 06-foundation*
*Completed: 2026-02-17*
