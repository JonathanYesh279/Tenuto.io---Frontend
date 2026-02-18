# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Administrators can efficiently manage their conservatory
**Current focus:** v2.1 Production-Grade Visual Identity — Phase 21: Detail Pages and Forms

## Current Milestone: v2.1 Production-Grade Visual Identity

**Goal:** Drastic visual redesign — transform from styled admin template to production-grade SaaS. Light sidebar, multi-color pastels, 3-column dashboard, hero stat zones, data-dominant tables. Style transplant from SchoolHub reference.
**Phases:** 16-21 (6 phases, 13 plans)
**Pivot:** Phases 18-21 rewritten on 2026-02-18 — from incremental polish to full structural redesign

## Current Position

Phase: 21-detail-pages-and-forms (in progress)
Plan: 21-01 complete — detail page headers and entity-colored tab pills done
Status: Phase 21, Plan 01 complete — ready for Plan 02
Last activity: 2026-02-18 — Phase 21-01 executed: DetailPageHeader entityColor prop, entity-colored tab pills on all 3 detail pages

Progress: [████████░░] 92% (v2.1, 12/13 plans)

## Performance Metrics

**Velocity (cumulative):**
- v1.1: 5 phases, 7 plans, ~3.5 hours
- v2.0: 10 phases, 22 plans, ~2.3 hours
- Total: 15 phases, 31 plans

## Accumulated Context

### Decisions

Archived to PROJECT.md Key Decisions table. See milestones/v2.0-ROADMAP.md for full v2.0 phase details.

Key decisions affecting v2.1:
- [21-01]: entityColor prop on DetailPageHeader is optional — gradient fallback preserved for backward compat
- [21-01]: Tab active states overridden via className on each TabsTrigger, not by editing global tabs.tsx primitive
- [21-01]: ENTITY_DETAIL_STYLES static const in DetailPageHeader mirrors ENTITY_STYLES in ListPageHero — Tailwind tree-shake safety
- [21-01]: Badge pills use bg-{entity}-fg/10 on pastel backgrounds (not bg-white/20 which was for dark gradient)
- [20-02]: Add buttons moved from filter toolbars to ListPageHero action prop — hero zone owns primary action across all list pages
- [20-02]: Orchestras view toggle uses bg-orchestras-fg active state (entity color, not primary-500) — aligns with entity-colored visual identity
- [20-02]: Orchestras data area Card wrapper removed — hero zone provides visual anchor, table/grid renders directly
- [20-01]: ListPageHero uses ENTITY_STYLES static const lookup (not string interpolation) — ensures Tailwind does not tree-shake entity color classes
- [20-01]: Table maxHeight calc(100vh-380px) — accounts for hero zone (~180px) + filter bar + pagination; prevents table clip with hero zone present
- [20-01]: Table action buttons icon-only (p-1.5, w-4 h-4) — text labels as title tooltip for accessibility, not rendered inline
- [20-01]: Table hover changed from amber-50/60 to gray-50 — v2.1 uses neutral gray; warm amber was v2.0
- [19-02]: MiniCalendarWidget renders Calendar.tsx directly without outer Card wrapper — Calendar.tsx already renders its own Card; double-wrapping creates nested cards
- [19-02]: Widget components are pure props-down (no hooks, no data fetching) — Dashboard.tsx owns all state via loadDashboardData()
- [19-02]: listVariants staggerChildren: 0.05 (50ms) for widget list items — shorter than stat card stagger (80ms) since list items are smaller UI targets
- [19-01]: StatsCard trend pill uses colors.iconBg (entity pastel) as pill background — deeper-tint chip on colored surface without new color values
- [19-01]: lg:grid-cols-[1fr_300px] not xl — content area ~1086px with sidebar open, lg triggers at correct width
- [19-01]: DOM order places main content first (renders right in RTL), widgets second (renders left) — correct Hebrew reading flow, no CSS direction hacks
- [18-02]: Active nav pill has no border — background fill only (bg-sidebar-active-bg). Soft colored fill provides sufficient visual affordance without border weight.
- [18-02]: Logo zone positioned between desktop toggle and search with flex-shrink-0 to prevent collapse in full-height flex column
- [18-02]: White-surface pattern — opacity-relative classes of near-black foreground (sidebar-foreground/10 etc.) produce unacceptable tints on white; use solid gray-NNN instead
- [18-03]: Header uses bg-white (not bg-card) — bg-card has warm HSL tint that contrasts poorly with new cooler --background; white header creates clean visual zone separation
- [18-03]: StatsCard coloredBg prop applies entity iconBg class to Card wrapper — Card uses cn() so it merges correctly; opt-in for full-card tinting
- [18-03]: StatsCard entity color entries use Tailwind utility names (bg-students-bg, text-students-fg) not direct CSS var() — consistent token consumption pattern
- [18-01]: Entity color vars use raw HSL channel format (no hsl() wrapper) — consumed via hsl(var(--color-*)) in Tailwind, consistent with Phase 16 pattern
- [18-01]: --sidebar-active-bg/fg intentionally mirrors students entity violet (252 80% 94%) as the visual anchor for active nav state
- [18-01]: --background updated from warm 30 25% 97% to cooler 210 17% 98% — harmonizes with cool pastel entity palette
- [Research]: No new npm packages — framer-motion v10, Tailwind v3, CSS vars cover full scope
- [Research]: Phase 21 (shell) is last — Sidebar/Header/Layout have all-pages blast radius
- [Research]: Elevation via box-shadow only — never new z-index values (breaks Radix)
- [Research]: Framer Motion layout prop must NOT be used on containers with Radix dropdown children
- [16-01]: Surface vars use full hsl() syntax (not raw channels) — consumed via var() directly, not hsl(var(...))
- [16-01]: Shadow warm tint rgba(120,60,20,...) approximates coral brand hue at low opacity for cohesive depth
- [16-02]: Color migration deferred — 1,211 primary-NNN instances across 134 files requires dedicated phase; two options documented (palette alignment vs semantic aliases)
- [16-02]: focus:ring-primary-500 (379 hits) flagged as WCAG AA risk for any future palette change — mandatory contrast verification required
- [17-01]: Button uses early-return if (!asChild) branch — motion.button and Slot paths cleanly separate, no conditional type casting in JSX
- [17-01]: transition-shadow on Card base class (not hover conditional) so animation applies to any hover state, not just hover prop
- [17-01]: active:scale-95 preserved alongside whileTap — provides instant feedback for reduced-motion users without JS
- [17-02]: CSS exit hybrid pattern — Framer Motion owns entrance, CSS data-[state=closed] classes own exit, avoids hoisting Radix open state
- [17-02]: motion(DialogPrimitive.Content) works directly in framer-motion v10 — single DOM element, no asChild workaround needed
- [17-02]: input.tsx verified correct with zero changes — focus-visible:ring-ring already present, inputs remain flat

### Pending Todos

(None)

### Blockers/Concerns

- [Pre-existing]: TypeScript errors in 6 utility files (bagrutMigration, cascadeErrorHandler, errorRecovery, memoryManager, performanceEnhancements, securityUtils) — blocks CI typecheck stage. Unrelated to v2.1 visual work.
- [Pre-existing]: Backend export endpoints (/api/export/status, /validate, /download) not implemented — MinistryReports info banner stays.
- [WSL constraint]: npm install on /mnt/c/ NTFS mount causes EIO errors — build verification from Windows PowerShell or CI only.
- [v2.1 documented]: 1,211 primary-NNN hex classes across 134 files alongside CSS --primary var — inventoried in COLOR-INVENTORY.md, migration deferred to dedicated phase.
- [v2.1 risk]: Heebo 700-800 may cause Hebrew nav label wrapping in tight containers — browser test required in Phase 18 before expanding typography scope.

## Performance Metrics (v2.1)

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 16    | 01   | <1 min   | 1     | 1     |
| 16    | 02   | 4 min    | 2     | 3     |
| 17    | 01   | 2 min    | 2     | 3     |
| 17    | 02   | 2 min    | 2     | 2     |
| 18    | 01   | 3 min    | 2     | 2     |
| 18    | 02   | 2 min    | 2     | 1     |
| 18    | 03   | 1 min    | 2     | 2     |
| 19    | 01   | 7 min    | 2     | 2     |
| 19    | 02   | 5 min    | 2     | 5     |
| 20    | 01   | 4 min    | 2     | 2     |
| 20    | 02   | 6 min    | 3     | 3     |
| 21    | 01   | 2 min    | 2     | 4     |

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 21-01-PLAN.md — detail page headers and entity-colored tab pills
Resume file: None
