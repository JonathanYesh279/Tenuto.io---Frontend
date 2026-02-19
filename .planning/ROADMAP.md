# Roadmap: Tenuto.io Frontend

## Milestones

- ✅ **v1.1 Cleanup & Polish** — Phases 1-5 (shipped 2026-02-14)
- ✅ **v2.0 UI/UX Redesign** — Phases 6-15 (shipped 2026-02-18)
- ✅ **v2.1 Production-Grade Visual Identity** — Phases 16-21 (shipped 2026-02-18)
- ✅ **v3.0 Visual Architecture Rewrite** — Phase 22 (shipped 2026-02-20)
- 🔨 **v4.0 Visual Redesign** — Phase 23+ (active)

## Phases

<details>
<summary>✅ v1.1 Cleanup & Polish (Phases 1-5) — SHIPPED 2026-02-14</summary>

- [x] Phase 1: Quick Fixes (1 plan) — delete dead code, fix role mapping
- [x] Phase 2: Backend Instrument Sync (1 plan) — align 27 instruments
- [x] Phase 3: Audit Trail Page (1 plan) — admin audit UI with two tabs
- [x] Phase 4: Ministry Reports Polish (1 plan) — graceful degradation, school year, timestamps
- [x] Phase 5: Audit Claude Skills & GSD Agents (3 plans) — ecosystem cleanup, docs fixes, ARCHITECTURE.md

Full details: `milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v2.0 UI/UX Redesign (Phases 6-15) — SHIPPED 2026-02-18</summary>

- [x] Phase 6: Foundation (2 plans) — CSS tokens, warm palette, Heebo font, DirectionProvider
- [x] Phase 7: Primitives (2 plans) — 9 shadcn/ui components, modal migration, Badge system
- [x] Phase 8: Domain Components & Loading (3 plans) — InstrumentBadge, StatusBadge, EmptyState, ErrorState, toast
- [x] Phase 9: Form System (3 plans) — FormField wrapper, all 3 entity forms migrated to shadcn
- [x] Phase 10: List Pages (2 plans) — sticky headers, warm hover, SearchInput, contextual Pagination
- [x] Phase 11: Detail Pages (2 plans) — gradient headers, avatar color hash, breadcrumbs, tab fade
- [x] Phase 12: Layout & Dashboard (2 plans) — dark warm sidebar, personalized greeting, warm StatsCards
- [x] Phase 13: Special Pages (2 plans) — auth branding, StepProgress, print styles
- [x] Phase 14: Requirement Gap Closure (3 plans) — Student detail routing, StatusBadge wiring, Rehearsals ErrorState
- [x] Phase 15: Tech Debt Sweep (1 plan) — AuditTrail ErrorState, InstrumentBadge wiring, RTL padding

Full details: `milestones/v2.0-ROADMAP.md`

</details>

<details>
<summary>✅ v2.1 Production-Grade Visual Identity (Phases 16-21) — SHIPPED 2026-02-18</summary>

- [x] Phase 16: Token Foundation (2 plans) — CSS custom properties, surface/neutral/shadow scales, motionTokens.ts
- [x] Phase 17: Primitive Component Layer (2 plans) — Card shadow depth, button spring press, dialog spring entrance
- [x] Phase 18: Layout Shell and Color System Reset (3 plans) — light sidebar, multi-color pastels, layout shell restructure
- [x] Phase 19: Dashboard Transformation (2 plans) — 3-column layout, entity-colored stat cards, calendar/activity widgets
- [x] Phase 20: List Pages and Table System (2 plans) — hero stats zones, compact filter toolbar, avatar table columns
- [x] Phase 21: Detail Pages and Forms (2 plans) — entity-colored headers, tab pills, form section grouping

Full details: `milestones/v2.1-ROADMAP.md`

</details>

<details>
<summary>✅ v3.0 Visual Architecture Rewrite (Phase 22) — SHIPPED 2026-02-20</summary>

- [x] Phase 22: Visual Architecture Rewrite (15 plans) — token reset (black primary, 2px radius, dark sidebar), Phosphor Icons migration (217 files), mechanical style sweep, list/detail/dashboard archetypes

Full details: `milestones/v3.0-ROADMAP.md`

</details>

---

### v4.0 Visual Redesign

**Milestone Goal:** Complete visual redesign matching reference UI mockups. New indigo primary color, rounded surfaces (12-32px), card-based layouts with shadows, Assistant font, light sidebar, implemented charts with real data. Dashboard redesigned first, then other pages as references are provided.

**Reference:** `.planning/phases/22-visual-architecture-rewrite/22-REFERENCE-UI.md`

---

#### Phase 23: Dashboard Visual Redesign

**Goal:** Complete visual redesign of the dashboard page and underlying token system to match the reference UI. New indigo primary, rounded cards with shadows, Assistant font, light sidebar, 12-col grid with 9:3 split, entity-colored stat cards, implemented charts (financial, attendance, demographics), and right sidebar widgets (calendar, agenda, messages).
**Depends on:** Phase 22 (v3.0 complete)
**Context:** `.planning/phases/23-dashboard-visual-redesign/23-CONTEXT.md`
**Success Criteria** (what must be TRUE):
  1. Token system reset: indigo primary (#6366f1), 12-32px radius scale, decorative shadows, Assistant + Plus Jakarta Sans fonts
  2. Dashboard layout: 12-col grid with 9:3 split — main content area + right sidebar column
  3. Stat cards: 4 entity-colored pastel cards (indigo/amber/sky/emerald) with rounded-3xl, trend badges
  4. Financial trends chart: SVG line chart with real monthly income/expenses data
  5. Attendance chart: bar chart with real daily present/absent data
  6. Student demographics chart: donut chart with real category data
  7. Teacher performance table: avatars, departments, student counts, star ratings, status badges
  8. Right sidebar: functional calendar widget, agenda with upcoming events, messages panel
  9. Sidebar: white/light with indigo active state pill, category labels, Phosphor icons
  10. Header: search input, notification bell, user profile section
  11. Dark mode support with toggle button
**Plans:** 6 plans

Plans:
- [ ] 23-01-PLAN.md — Token system reset (indigo primary, 12-32px radius, Assistant font, chart colors, dark mode)
- [ ] 23-02-PLAN.md — Sidebar + Header visual redesign (white sidebar, indigo active, search bar, bell)
- [ ] 23-03-PLAN.md — Dashboard layout + StatCard component (12-col grid, 9:3 split, 4 entity cards, FAB)
- [ ] 23-04-PLAN.md — Charts (Recharts install, financial line, attendance bar, demographics donut)
- [ ] 23-05-PLAN.md — Teacher table + right sidebar widgets (calendar, agenda, messages)
- [ ] 23-06-PLAN.md — Visual verification checkpoint

---

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Quick Fixes | v1.1 | 1/1 | Complete | 2026-02-13 |
| 2. Backend Instrument Sync | v1.1 | 1/1 | Complete | 2026-02-13 |
| 3. Audit Trail Page | v1.1 | 1/1 | Complete | 2026-02-13 |
| 4. Ministry Reports Polish | v1.1 | 1/1 | Complete | 2026-02-13 |
| 5. Audit Claude Skills & GSD Agents | v1.1 | 3/3 | Complete | 2026-02-14 |
| 6. Foundation | v2.0 | 2/2 | Complete | 2026-02-17 |
| 7. Primitives | v2.0 | 2/2 | Complete | 2026-02-17 |
| 8. Domain Components & Loading | v2.0 | 3/3 | Complete | 2026-02-17 |
| 9. Form System | v2.0 | 3/3 | Complete | 2026-02-18 |
| 10. List Pages | v2.0 | 2/2 | Complete | 2026-02-18 |
| 11. Detail Pages | v2.0 | 2/2 | Complete | 2026-02-18 |
| 12. Layout & Dashboard | v2.0 | 2/2 | Complete | 2026-02-18 |
| 13. Special Pages | v2.0 | 2/2 | Complete | 2026-02-18 |
| 14. Requirement Gap Closure | v2.0 | 3/3 | Complete | 2026-02-18 |
| 15. Tech Debt Sweep | v2.0 | 1/1 | Complete | 2026-02-18 |
| 16. Token Foundation | v2.1 | 2/2 | Complete | 2026-02-18 |
| 17. Primitive Component Layer | v2.1 | 2/2 | Complete | 2026-02-18 |
| 18. Layout Shell and Color System Reset | v2.1 | 3/3 | Complete | 2026-02-18 |
| 19. Dashboard Transformation | v2.1 | 2/2 | Complete | 2026-02-18 |
| 20. List Pages and Table System | v2.1 | 2/2 | Complete | 2026-02-18 |
| 21. Detail Pages and Forms | v2.1 | 2/2 | Complete | 2026-02-18 |
| 22. Visual Architecture Rewrite | v3.0 | 15/15 | Complete | 2026-02-20 |
| 23. Dashboard Visual Redesign | v4.0 | 0/6 | Planned | — |

---
*Roadmap created: 2026-02-13*
*Last updated: 2026-02-20 — Phase 23 planned with 6 plans in 4 waves*
