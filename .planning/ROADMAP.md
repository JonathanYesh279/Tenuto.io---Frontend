# Roadmap: Tenuto.io Frontend

## Milestones

- ✅ **v1.1 Cleanup & Polish** — Phases 1-5 (shipped 2026-02-14)
- ✅ **v2.0 UI/UX Redesign** — Phases 6-15 (shipped 2026-02-18)
- 🚧 **v2.1 Production-Grade Visual Identity** — Phases 16-21 (in progress)

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

### 🚧 v2.1 Production-Grade Visual Identity (In Progress)

**Milestone Goal:** Transform Tenuto.io from a consistent design-system scaffold into a confident, authored product — with surface elevation hierarchy, bold typography, coral restraint, spring micro-interactions, and a strong visual identity that reads as production SaaS.

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
**Plans:** TBD

Plans:
- [ ] 17-01: Card, button, badge — shadow tokens, spring press, density variants
- [ ] 17-02: Dialog, tabs, input — modal spring entrance, focus ring standardization

---

#### Phase 18: Typography Scale and Color Evolution

**Goal:** Page headings are bold and hierarchically confident; coral is restricted to three functional contexts; supporting surfaces use the warm neutral scale instead of coral tints.
**Depends on:** Phase 16
**Requirements:** TYPO-01, TYPO-02, TYPO-03, TYPO-04, COLOR-01, COLOR-02, COLOR-03, COLOR-04
**Success Criteria** (what must be TRUE):
  1. Page-level headings render at Heebo 700-800 weight with `text-3xl` or larger — the typographic hierarchy is immediately readable without scanning
  2. UI body text and metadata use tighter sizing than v2.0 (reduced from the v2.0 defaults), creating a denser and more confident reading rhythm
  3. Coral (`--primary` and `primary-NNN`) appears only on: primary CTA buttons, the active navigation indicator, and focus rings — it is absent from card backgrounds, hover states, and secondary surfaces
  4. Badge components (StatusBadge, InstrumentBadge) use a multi-color palette with distinct hues per category — not uniformly coral-tinted
  5. Vertical spacing between text blocks follows a consistent rhythm across all pages — no arbitrary gaps between headings, subheads, and body sections
**Plans:** TBD

Plans:
- [ ] 18-01: Typography scale — token application to headings and body text across all pages
- [ ] 18-02: Color audit — coral restriction, neutral surfaces, badge palette expansion, gradient headers deepened

---

#### Phase 19: Motion System

**Goal:** List pages have staggered entrance animations that communicate dynamism; all directional animations are RTL-safe throughout the application.
**Depends on:** Phase 17
**Requirements:** MOTN-02, MOTN-04
**Success Criteria** (what must be TRUE):
  1. Teacher, Student, and Orchestra list pages animate rows in with staggered Y-axis + opacity — the first load of a list page feels noticeably more dynamic than a plain paint
  2. No animation in the application uses a bare positive X-axis value — all directional motion is Y-axis + opacity, or uses a `-1` RTL multiplier
  3. The stagger animation fires only on initial mount (not on re-filter or re-sort) and caps at 8 items — performance is not degraded on large lists
**Plans:** TBD

Plans:
- [ ] 19-01: Staggered list entrance — TeacherList, StudentList, OrchestraList with Y+opacity stagger
- [ ] 19-02: RTL animation audit — verify no bare X-axis values remain; add guards where needed

---

#### Phase 20: Visual Personality and Layout Composition

**Goal:** Every page has recognizable visual landmarks — authored section headers, branded badges, distinctive empty states, and a consistent structural scaffolding — that together read as Tenuto identity rather than a generic admin template.
**Depends on:** Phase 18
**Requirements:** PERS-01, PERS-02, PERS-03, PERS-04, PERS-05, COMP-01, COMP-02, COMP-03, COMP-04, DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Section headers across all entity pages share a distinctive treatment (accent mark, border, or background strip) — they are visually distinct from body text without relying on font size alone
  2. Empty states have a branded visual treatment (illustration, icon, or decorative element) that feels authored — not a plain centered text block
  3. All entity pages (list, detail, form) follow the same structural template: page header → toolbar zone → content — the scaffolding is predictable and consistent
  4. Primary data values (names, titles, key numbers) use visibly stronger typographic weight than secondary metadata, which uses muted styling and smaller scale
  5. Section dividers and card grid spacing follow defined rules that repeat consistently — the page has intentional visual rhythm
**Plans:** TBD

Plans:
- [ ] 20-01: Section headers, dividers, and page scaffolding — COMP-01 through COMP-04, PERS-01, PERS-04, PERS-05
- [ ] 20-02: Badge personality and empty states — PERS-02, PERS-03
- [ ] 20-03: Data hierarchy styling — DATA-01, DATA-02 applied across list and detail pages

---

#### Phase 21: Navigation and Surface Shell

**Goal:** The layout shell (sidebar, header, content area) has distinct, perceptible elevation zones; the navigation makes the active page unmistakable; list pages are dense and tool-ready.
**Depends on:** Phase 18, Phase 20
**Requirements:** SURF-01, SURF-04, NAV-01, NAV-02, DENS-01, DENS-02, DENS-03, DENS-04
**Success Criteria** (what must be TRUE):
  1. The sidebar, header, and content area are visually distinguishable at a glance through shadow and surface treatment — the layout zones feel layered, not flat
  2. The active navigation item is unmistakable: it has a distinct background, coral accent, and bold weight that leaves no ambiguity about which page the user is on
  3. Table rows on all list pages are 40-44px tall — noticeably more data is visible without scrolling compared to v2.0
  4. Each list page has a unified toolbar zone (search + filters + primary CTA in one 48px band) — the controls are cohesive, not scattered
  5. Form and detail pages retain generous padding and spacing — density is selective, not applied globally
**Plans:** TBD

Plans:
- [ ] 21-01: Shell elevation — Sidebar.tsx, Header.tsx, Layout.tsx surface separation and shadow
- [ ] 21-02: Navigation active states and list page density + toolbar zone

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
| 17. Primitive Component Layer | v2.1 | 0/2 | Not started | — |
| 18. Typography Scale and Color Evolution | v2.1 | 0/2 | Not started | — |
| 19. Motion System | v2.1 | 0/2 | Not started | — |
| 20. Visual Personality and Layout Composition | v2.1 | 0/3 | Not started | — |
| 21. Navigation and Surface Shell | v2.1 | 0/2 | Not started | — |

---
*Roadmap created: 2026-02-13*
*Last updated: 2026-02-18 after Phase 16 execution complete*
