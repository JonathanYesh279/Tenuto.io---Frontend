---
phase: 22-visual-architecture-rewrite
plan: 02
subsystem: ui
tags: [phosphor-icons, sidebar, dark-theme, icon-migration, lucide-react]

# Dependency graph
requires:
  - phase: 22-visual-architecture-rewrite
    provides: "Plan 22-01 token reset — dark sidebar CSS vars (--sidebar: 220 20% 13%, --sidebar-active-bg, etc.)"
provides:
  - "@phosphor-icons/react installed as project dependency"
  - "Sidebar rewritten with Phosphor Icons (fill/regular weight toggle for active/inactive state)"
  - "All hardcoded gray classes eliminated from Sidebar.tsx — all sidebar-token-based"
  - "Dark charcoal sidebar visually anchored via bg-sidebar token (resolves to deep charcoal from 22-01 token reset)"
affects:
  - "22-03 and later plans that migrate Lucide to Phosphor in other components"
  - "Any components that import from or depend on Sidebar.tsx"

# Tech tracking
tech-stack:
  added: ["@phosphor-icons/react ^2.1.7"]
  patterns:
    - "Phosphor Icon fill/regular weight toggle — active nav item uses weight='fill', inactive uses weight='regular'"
    - "NavLink children-as-function pattern for dynamic icon weight based on isActive state"
    - "All sidebar classes use sidebar token classes (bg-sidebar, text-sidebar-foreground, bg-sidebar-active-bg) — zero hardcoded gray"
    - "Role badges adapted for dark sidebar legibility — bg-red-900/40 text-red-300 pattern"

key-files:
  created: []
  modified:
    - "package.json — added @phosphor-icons/react ^2.1.7"
    - "src/components/Sidebar.tsx — full Phosphor migration, dark theme token classes"

key-decisions:
  - "Phosphor icon for Menu/hamburger: ListIcon (not MenuIcon which doesn't exist in Phosphor)"
  - "Unused Lucide icon imports (ClipboardTextIcon, ChartBarIcon, FunnelIcon, MusicNotesSimpleIcon) excluded — kept only icons actually used in nav"
  - "Role badges updated from light bg (bg-red-100 text-red-700) to dark bg (bg-red-900/40 text-red-300) to remain legible against dark sidebar"
  - "Loading skeleton pulses updated from bg-gray-200 to bg-sidebar-active-bg"

patterns-established:
  - "Pattern: Phosphor Icon fill/regular toggle — <item.Icon size={18} weight={active ? 'fill' : 'regular'} />"
  - "Pattern: NavLink children-as-function — {({ isActive: active }) => (<>...</>)}"
  - "Pattern: Sidebar token classes — all sidebar elements use bg-sidebar-*, text-sidebar-* tokens"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 22 Plan 02: Phosphor Icons Install + Sidebar Dark Theme Rewrite Summary

**@phosphor-icons/react installed with fill/regular weight toggle for active/inactive nav items; all lucide-react removed from Sidebar.tsx and all hardcoded gray classes replaced with sidebar token classes against the deep charcoal background**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T11:23:58Z
- **Completed:** 2026-02-19T11:26:15Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Installed `@phosphor-icons/react ^2.1.7` as project dependency (user runs `npm install` from Windows)
- Replaced all lucide-react imports in Sidebar.tsx with Phosphor equivalents (22 icons, all ending in `Icon`)
- Implemented fill/regular weight toggle on nav items: active = `weight="fill"`, inactive = `weight="regular"`
- Eliminated all hardcoded gray classes (`text-gray-*`, `bg-gray-*`, `hover:bg-gray-*`) — replaced with sidebar token classes
- Updated mobile/desktop toggle buttons to use `bg-sidebar`, `border-sidebar-border`, `hover:bg-sidebar-active-bg`
- Updated search input to work against dark sidebar background
- Updated role badges for legibility against dark charcoal sidebar

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @phosphor-icons/react and rewrite Sidebar with dark theme + Phosphor icons** - `d0334a0` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `package.json` - Added `@phosphor-icons/react ^2.1.7` to dependencies
- `src/components/Sidebar.tsx` - Full Phosphor icon migration, all gray classes replaced with sidebar token classes, NavLink children-as-function for weight toggle

## Decisions Made
- `ListIcon` used for menu/hamburger (Phosphor has no `MenuIcon` — `ListIcon` is the correct Phosphor equivalent)
- Removed unused imported icons (ClipboardTextIcon, ChartBarIcon, FunnelIcon, MusicNotesSimpleIcon) from the import block — only icons actually used in navigation are imported
- Role badge colors inverted for dark sidebar legibility: `bg-red-100 text-red-700` became `bg-red-900/40 text-red-300`
- Dark sidebar functionality depends on Plan 22-01 token reset being committed first (CSS `--sidebar: 220 20% 13%` must be in :root)

## Deviations from Plan

None — plan executed exactly as written. The plan specified exact icon names, exact class replacements, and the fill/regular toggle pattern. All steps were followed precisely.

Minor cleanup: Removed 4 imported-but-unused icon names (ClipboardTextIcon, ChartBarIcon, FunnelIcon, MusicNotesSimpleIcon) from the import block. The plan included these in the import list for completeness but they are not referenced in the JSX.

## Issues Encountered
None.

## User Setup Required
**npm install required.** After pushing, run from Windows PowerShell:
```
cd C:\Users\yona2\Documents\Tenuto.io\Tenuto.io-Frontend
npm install
```
This installs `@phosphor-icons/react ^2.1.7`.

## Next Phase Readiness
- Sidebar is the architectural anchor — dark charcoal background with Phosphor icons and token-based styling
- Ready for Plan 22-03: token reset propagation to other components, or continued Lucide-to-Phosphor migration in other files
- The Phosphor icon migration pattern is established — other components can follow the same fill/regular weight toggle pattern

---
*Phase: 22-visual-architecture-rewrite*
*Completed: 2026-02-19*
