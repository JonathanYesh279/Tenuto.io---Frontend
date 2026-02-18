# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Administrators can efficiently manage their conservatory
**Current focus:** v2.1 Production-Grade Visual Identity — Phase 18: Layout Shell and Color System Reset

## Current Milestone: v2.1 Production-Grade Visual Identity

**Goal:** Drastic visual redesign — transform from styled admin template to production-grade SaaS. Light sidebar, multi-color pastels, 3-column dashboard, hero stat zones, data-dominant tables. Style transplant from SchoolHub reference.
**Phases:** 16-21 (6 phases, 13 plans)
**Pivot:** Phases 18-21 rewritten on 2026-02-18 — from incremental polish to full structural redesign

## Current Position

Phase: 18 in progress (Layout Shell and Color System Reset)
Plan: 18-01 complete — ready for 18-02 (Sidebar restyle)
Status: Plan 18-01 executed — entity color tokens + white sidebar tokens in CSS vars + Tailwind
Last activity: 2026-02-18 — 18-01 complete: 12 entity color vars, sidebar tokens, background update

Progress: [████░░░░░░] 38% (v2.1, 5/13 plans)

## Performance Metrics

**Velocity (cumulative):**
- v1.1: 5 phases, 7 plans, ~3.5 hours
- v2.0: 10 phases, 22 plans, ~2.3 hours
- Total: 15 phases, 29 plans

## Accumulated Context

### Decisions

Archived to PROJECT.md Key Decisions table. See milestones/v2.0-ROADMAP.md for full v2.0 phase details.

Key decisions affecting v2.1:
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

(None — Phase 17 complete)

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

## Session Continuity

Last session: 2026-02-18
Stopped at: Phase 18-01 execution complete — entity color tokens + sidebar tokens defined
Resume file: None
