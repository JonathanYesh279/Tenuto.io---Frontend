# Roadmap: Tenuto.io Frontend

## Milestones

- ✅ **v1.1 Cleanup & Polish** — Phases 1-5 (shipped 2026-02-14)
- ✅ **v2.0 UI/UX Redesign** — Phases 6-15 (shipped 2026-02-18)
- ✅ **v2.1 Production-Grade Visual Identity** — Phases 16-21 (shipped 2026-02-18)
- ✅ **v3.0 Visual Architecture Rewrite** — Phase 22 (shipped 2026-02-20)
- ✅ **v4.0 Visual Redesign** — Phase 23 (shipped 2026-02-20)
- 🔨 **v5.0 Ministry Import Overhaul** — Phase 24 (active)

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

<details>
<summary>✅ v4.0 Visual Redesign (Phase 23) — SHIPPED 2026-02-20</summary>

- [x] Phase 23: Dashboard Visual Redesign (6 plans) — indigo token reset, light sidebar, 12-col dashboard grid, Recharts charts, right sidebar widgets, dark mode toggle

Full details: `milestones/v4.0-ROADMAP.md`

</details>

---

### v5.0 Ministry Import Overhaul

**Milestone Goal:** Fix Ministry Excel import (currently 1284 errors, 0 matches) by adding smart header detection, expanded column mappings, instrument detection from department columns, and student creation for unmatched rows. Redesign the ImportData page with v4.0 styling: file structure guide, Ministry compatibility banner, create/update preview distinction, and gradient stat cards.

---

#### Phase 24: Ministry Excel Import — Fix & Redesign

**Goal:** Make Ministry "mimshak" Excel files import correctly (auto-detect headers, map Ministry columns, detect instruments from departments, create new students) and redesign the ImportData page with v4.0 visual language (file structure guide, styled preview, create vs update badges).
**Depends on:** Phase 23 (v4.0 complete)
**Files:** Backend `import.service.js`, Frontend `ImportData.tsx`
**Requirements:** IMP-B01 through IMP-B06, IMP-F01 through IMP-F08 (14 total)
**Success Criteria** (what must be TRUE):
  1. Ministry Excel files with metadata rows auto-detected (header row found in rows 0-10)
  2. Ministry column variants recognized (שם ומשפחה, המורה, שלב, זמן שעור, etc.)
  3. Instruments extracted from department columns (כלי קשת, כלי נשיפה, כלי פריטה)
  4. Unmatched students created as new records (not just errors)
  5. File structure guide shows required/optional/auto-detected badges before upload
  6. Preview distinguishes create (blue) vs update (green) vs error (red) rows
  7. Summary stat cards in v4.0 gradient style
  8. Re-upload same file → students now match as "update" (backward compatible)
  9. Simple Excel files (headers on row 0) still work
**Plans:** 4 plans

Plans:
- [ ] 24-01-PLAN.md — Backend: Smart header detection + column mapping + instrument detection
- [ ] 24-02-PLAN.md — Backend: Create functionality for unmatched rows + validation improvements
- [ ] 24-03-PLAN.md — Frontend: File structure guide + Ministry banner + upload zone redesign
- [ ] 24-04-PLAN.md — Frontend: Preview redesign with create/update distinction + stat cards + results

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
| 23. Dashboard Visual Redesign | v4.0 | 6/6 | Complete | 2026-02-20 |
| 24. Ministry Excel Import — Fix & Redesign | v5.0 | 0/4 | Planned | — |

---
*Roadmap created: 2026-02-13*
*Last updated: 2026-02-22 — v5.0 milestone started, Phase 24 planned with 4 plans*
