# Roadmap: Tenuto.io Frontend

## Milestones

- ✅ **v1.1 Cleanup & Polish** — Phases 1-5 (shipped 2026-02-14)
- ✅ **v2.0 UI/UX Redesign** — Phases 6-15 (shipped 2026-02-18)
- ✅ **v2.1 Production-Grade Visual Identity** — Phases 16-21 (shipped 2026-02-18)

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

---

### ✅ v2.1 Production-Grade Visual Identity (Shipped 2026-02-18)

**Milestone Goal:** Drastic visual redesign — transform Tenuto.io from a styled admin template into a production-grade SaaS product that is completely unrecognizable from the current version. Light sidebar, multi-color pastel palette, 3-column dashboard, hero stat zones on list pages, data-dominant tables with avatars and colored badges, and structured forms with visual sections. Style transplant from SchoolHub reference: visual language changes completely while all data entities, labels, and business logic stay untouched.

---

#### Phase 16: Token Foundation

**Goal:** The complete token layer exists as CSS custom properties and a TypeScript motion module — all subsequent phases draw from this single source of truth.
**Depends on:** Phase 15 (v2.0 complete)
**Requirements:** TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05
**Success Criteria** (what must be TRUE):
  1. `src/index.css :root {}` contains a 4-level surface elevation scale (`--surface-base`, `--surface-raised`, `--surface-overlay`, `--surface-floating`), a 9-step warm neutral scale (`--neutral-50` through `--neutral-900`), and a 5-level shadow scale (`--shadow-0` through `--shadow-4`) with warm-tinted values
  2. `tailwind.config.js` exposes `shadow-0` through `shadow-4` Tailwind utilities that map to the CSS shadow vars
  3. `src/lib/motionTokens.ts` exports named spring presets (`snappy`, `smooth`, `bouncy`) and duration/easing tokens usable by any animated component
  4. Every `primary-NNN` hardcoded hex class in TSX files is either migrated to the CSS var system or documented in a recorded inventory — no silent dual-system inconsistency remains
**Plans:** 2 plans

Plans:
- [x] 16-01: CSS custom properties in :root (surface elevation scale, warm neutral scale, shadow scale)
- [x] 16-02: Tailwind shadow mapping, motionTokens.ts, dual color system inventory

---

#### Phase 17: Primitive Component Layer

**Goal:** The six core shadcn/ui primitives (card, button, badge, tabs, dialog, input) express the new token system with depth, spring interactions, and standardized focus rings — every page inherits improvements automatically.
**Depends on:** Phase 16
**Requirements:** SURF-02, SURF-03, MOTN-01, MOTN-03, MOTN-05
**Success Criteria** (what must be TRUE):
  1. Card components display warm-tinted box-shadows (`shadow-1`) that deepen on hover (`shadow-2`) — depth is visible without flat borders carrying all the work
  2. Dialog/modal surfaces sit visually above page content with `shadow-4` — the elevation difference is perceptible at a glance
  3. Primary action buttons have spring-based press feedback (`whileTap` scale reduction) using the `snappy` preset from motionTokens.ts
  4. Modal open and close use spring physics (not linear fade) — the entrance feels physical
  5. All Framer Motion animations on these primitives are gated by `useReducedMotion()` — users with reduced motion preference see instant state changes
**Plans:** 2 plans

Plans:
- [x] 17-01: Card, button, badge — shadow tokens, spring press, badge shadow-1
- [x] 17-02: Dialog, tabs, input — spring entrance, shadow-4 elevation, focus ring verification

---

#### Phase 18: Layout Shell and Color System Reset

**Goal:** The application's structural foundation is completely replaced — light sidebar, new multi-color pastel token system with per-entity color assignments, restructured layout shell with clear zoning, and updated header. Every subsequent phase builds on this new visual foundation.
**Depends on:** Phase 17
**Context:** `.planning/phases/18-typography-scale-and-color-evolution/18-CONTEXT.md`
**Success Criteria** (what must be TRUE):
  1. Sidebar is light/white with grouped navigation sections (category labels like MENU, OTHER), active item has a soft colored background pill — the dark warm sidebar from v2.0 is fully replaced
  2. Multi-color pastel CSS tokens exist in `:root` — each entity type (teachers, students, orchestras) has its own assigned pastel color used consistently across stat cards, badges, and accents
  3. Content area background is white or very light gray — the overall page feel is light and airy, not warm/dark
  4. Layout shell has clear visual zoning — sidebar, header, and content area are distinct regions with intentional separation
  5. The app is visually unrecognizable compared to v2.0 — the color system, sidebar, and overall feel have fundamentally changed
**Plans:** 3 plans

Plans:
- [x] 18-01: Multi-color pastel token system — entity color CSS vars in :root, sidebar token updates, Tailwind config mapping
- [x] 18-02: Light sidebar — restyle Sidebar.tsx from dark to white, logo zone, active pill, white-surface-appropriate colors
- [x] 18-03: Layout shell, header, and StatsCard — content bg update, header restyle, entity color system for stat cards

---

#### Phase 19: Dashboard Transformation

**Goal:** The dashboard is a 3-column data-dominant layout with colorful pastel stat cards, a persistent right sidebar column (calendar, activity), and clean chart sections — it reads as a serious SaaS command center, not a card grid.
**Depends on:** Phase 18
**Context:** `.planning/phases/18-typography-scale-and-color-evolution/18-CONTEXT.md`
**Success Criteria** (what must be TRUE):
  1. Dashboard uses a 3-column layout — main content area (left/center) and a persistent right sidebar column with calendar/upcoming/activity widgets
  2. Top row shows pastel-colored stat cards (one per key metric) with large bold numbers, small labels, and trend badges — each card has a distinct entity color, not uniform styling
  3. Charts and data visualizations are clean and prominent — data is the dominant visual element, not card surfaces or decorative elements
  4. The right sidebar column contains contextual widgets relevant to Tenuto (upcoming lessons, recent activity, quick stats) — not empty space
  5. The dashboard feels like a SchoolHub-level command center — structured, zoned, data-first, with clear visual landmarks
**Plans:** 2 plans

Plans:
- [x] 19-01: 3-column dashboard layout — StatsCard coloredBg enhancements, overview tab grid restructure, entity-colored stat cards with stagger animation
- [x] 19-02: Dashboard widgets and charts — MiniCalendarWidget, UpcomingEventsWidget, RecentActivityWidget components, wire into right column

---

#### Phase 20: List Pages and Table System

**Goal:** Every list page (Teachers, Students, Orchestras) has a hero stats zone at top, a compact filter toolbar, and a data-dense table with avatars, colored status badges, and icon actions — the lists feel tool-ready and data-dominant.
**Depends on:** Phase 18
**Context:** `.planning/phases/18-typography-scale-and-color-evolution/18-CONTEXT.md`
**Success Criteria** (what must be TRUE):
  1. Each list page has a hero stats zone at the top showing aggregate metrics for that entity (count, key stats) using the entity's pastel color — this is the first visual landmark
  2. A compact filter toolbar sits below the hero zone — search input + dropdown filters in one row, cohesive and unified
  3. Table rows show avatars alongside entity names (where applicable), colored status badges (distinct colors per status, not uniform), and icon-based action buttons (edit, delete) — not plain text links
  4. Tables are data-dense with clean spacing — more data visible without scrolling compared to v2.0
  5. The vertical flow on every list page is predictable: hero stats → filter toolbar → data table — clear zoning with no ambiguity
**Plans:** 2 plans

Plans:
- [x] 20-01: ListPageHero component and Table density — shared hero stats zone component with framer-motion stagger, Table.tsx padding reduction and maxHeight adjustment
- [x] 20-02: Page restructuring — Teachers, Students, Orchestras pages restructured with hero zone, compact filter toolbar, avatar-enhanced table columns

---

#### Phase 21: Detail Pages and Forms

**Goal:** Detail pages have a bold profile header zone with stronger tab hierarchy; forms are restructured with clear visual sections instead of stacked fields — every entity page feels intentionally designed, not template-generated.
**Depends on:** Phase 18
**Context:** `.planning/phases/18-typography-scale-and-color-evolution/18-CONTEXT.md`
**Success Criteria** (what must be TRUE):
  1. Detail page profile/header zone uses bolder visual treatment — stronger typography, clearer data hierarchy between primary info (name, role) and secondary metadata
  2. Tab navigation is restyled with stronger visual weight — the active tab is unmistakable, tab content sections have clear visual separation
  3. Forms are restructured with visual section grouping — section titles with dividers or background strips, not just stacked fields in a column
  4. Form layout has intentional visual rhythm — section title → field group → section title → field group, with clear hierarchy between sections
  5. Detail pages and forms feel consistent with the new dashboard and list page design language — same zoning principles, same color system, same confidence level
**Plans:** 2 plans

Plans:
- [x] 21-01: Detail page headers and tabs — entity-colored pastel header zone (replacing coral gradient), entity-colored active tab pills on all 3 detail pages
- [x] 21-02: Form restructuring — entity-colored accent bar section grouping for TeacherForm (6 sections), StudentForm (4 sections), OrchestraForm (3 compact sections)

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

---
*Roadmap created: 2026-02-13*
*Last updated: 2026-02-18 — Phase 21 complete, v2.1 milestone shipped*
