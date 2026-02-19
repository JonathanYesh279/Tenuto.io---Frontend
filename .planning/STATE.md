# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** Administrators can efficiently manage their conservatory
**Current focus:** v4.0 Visual Redesign — Phase 23: Dashboard Visual Redesign

## Current Milestone: v4.0 Visual Redesign

**Goal:** Complete visual redesign matching reference UI mockups. New indigo primary, rounded surfaces, card-based layouts with shadows, Assistant font, light sidebar, implemented charts. Dashboard first, then other pages as references are provided.
**Reference:** `.planning/phases/22-visual-architecture-rewrite/22-REFERENCE-UI.md`
**Phases:** 23+ (planning)

## Current Position

Phase: 23-dashboard-visual-redesign
Plan: 05/06
Status: Executing
Last activity: 2026-02-19 — Completed 23-05: Teacher performance table and sidebar widgets (calendar, agenda, messages)

Progress: [████████░░] 83.3% (v4.0 — 5/6 plans complete)

## Performance Metrics

**Velocity (cumulative):**
- v1.1: 5 phases, 7 plans, ~3.5 hours
- v2.0: 10 phases, 22 plans, ~2.3 hours
- v2.1: 6 phases, 13 plans
- v3.0: 1 phase, 15 plans (22-01: 2 min, 22-02: 2 min, 22-07: 2 min, 22-09: 3 min, 22-12: 2 min)
- v4.0: 1 phase, 5/6 plans (23-01: 3 min, 23-02: 2 min, 23-03: 3 min, 23-04: 3 min, 23-05: 3 min)
- Total: 22+ phases, 61 plans

## Accumulated Context

### Decisions

Key decisions for v4.0:
- [Style direction]: Indigo primary (#6366f1) — colorful SaaS aesthetic, not black/architectural
- [Shape]: 12-32px rounded corners — reversed from v3.0's 2px sharp
- [Sidebar]: White/light — reversed from v3.0's dark charcoal
- [Cards]: Full card wrappers with shadows back — reversed from v3.0's card elimination
- [Font]: Assistant + Plus Jakarta Sans — replaces Heebo
- [Icons]: Keep Phosphor — no second migration despite reference using Material Symbols
- [Charts]: Implement with real data (financial trends, attendance, demographics)
- [Dashboard layout]: 12-col grid, 9:3 split with right sidebar widgets
- [Other pages]: User will provide separate references — deferred
- [23-01 Token strategy]: HSL for CSS vars, hex for named colors — enables both hsl(var(--token)) and bg-chart-blue patterns
- [23-01 Dark mode prep]: Implemented .dark tokens in advance — enables incremental dark mode feature addition
- [23-01 Font stack]: Assistant primary, Plus Jakarta Sans secondary, Reisinger Yonatan tertiary — graceful degradation
- [23-02 Icon weight pattern]: fill for active nav items, regular for inactive — Phosphor icon weights create clear visual distinction
- [23-02 Search/notifications placeholders]: Header shows search input and bell with TODO comments — functionality deferred to future feature phases
- [23-02 Category labels]: Tiny uppercase tracking-widest labels create strong visual hierarchy in navigation
- [23-02 Avatar shape]: Changed from rounded-full to rounded-xl to match v4.0 12-32px shape language
- [23-03 Dashboard grid]: 12-col grid with 9:3 split establishes main content and sidebar zones
- [23-03 Entity colors]: Stat cards use entity color coding (students=indigo, teachers=amber, orchestras=sky, rehearsals=emerald)
- [23-03 Dark mode toggle]: FAB toggle with localStorage persistence enables immediate dark mode testing
- [23-04 Recharts library]: Recharts over Chart.js for v4.0 dashboard — SVG-based, better RTL support, composable API
- [23-04 Custom tooltips]: Chart tooltips styled to match v4.0 aesthetic (rounded corners, shadows, white background)
- [23-04 Mock data strategy]: Financial trends use mock data with TODO comment for /api/dashboard/financial-trends endpoint
- [23-05 Teacher table data]: Teacher performance table wired to real teacher data from Dashboard.tsx loadDashboardData
- [23-05 Widget data sources]: Agenda wired to upcomingRehearsals data, MessagesWidget uses mock data with TODO

Archived v3.0 decisions: see milestones/ or git history for STATE.md prior versions.

### Pending Todos

(None)

### Blockers/Concerns

- [Pre-existing]: TypeScript errors in 6 utility files — blocks CI typecheck stage. Unrelated to visual work.
- [Pre-existing]: Backend export endpoints not implemented — MinistryReports info banner stays.
- [WSL constraint]: npm install on /mnt/c/ NTFS mount causes EIO errors — build verification from Windows PowerShell or CI only.
- [Charts]: Financial/attendance/demographics data may need backend endpoints — use mock data with TODOs if not available.

## Session Continuity

Last session: 2026-02-19T23:20:47Z
Stopped at: Completed 23-05-PLAN.md — Teacher performance table and sidebar widgets (calendar, agenda, messages)
Resume file: None
