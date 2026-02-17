# Roadmap: Tenuto.io Frontend

## Milestones

- ✅ **v1.1 Cleanup & Polish** — Phases 1-5 (shipped 2026-02-14)
- 🚧 **v2.0 UI/UX Redesign** — Phases 6-13 (in progress)

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

### 🚧 v2.0 UI/UX Redesign (In Progress)

**Milestone Goal:** Transform Tenuto from a generic admin template into a polished, premium music school management platform with warm Monday.com-inspired aesthetics, shadcn/ui components, and Hebrew RTL correctness throughout.

- [x] **Phase 6: Foundation** — Design token system, RTL fixes, CSS cleanup, package upgrades
- [ ] **Phase 7: Primitives** — Missing shadcn/ui components, modal migration, button/badge system
- [ ] **Phase 8: Domain Components & Loading States** — Conservatory-specific components, skeletons, empty/error states, toast system
- [ ] **Phase 9: Form System** — shadcn Form wrapper, field grouping, inline validation, form accessibility
- [ ] **Phase 10: List Pages** — All 5 list pages redesigned with new table, search, pagination, and states
- [ ] **Phase 11: Detail Pages** — All detail pages with gradient headers, avatars, breadcrumbs, tab transitions
- [ ] **Phase 12: Layout & Dashboard** — Sidebar, header, and dashboard redesigned last when visual system is proven
- [ ] **Phase 13: Special Pages** — Admin pages, auth pages, print styles, toast system finalization

## Phase Details

### Phase 6: Foundation
**Goal:** A coherent design token system and RTL infrastructure exists so every subsequent phase builds on a correct, stable base — with zero visible change to end users.
**Depends on:** Nothing (first phase of milestone)
**Requirements:** FNDTN-01, FNDTN-02, FNDTN-03, FNDTN-04, FNDTN-05, FNDTN-06, FNDTN-07, FNDTN-08, A11Y-02, A11Y-04, MICRO-04
**Success Criteria** (what must be TRUE):
  1. Opening the app in a browser shows no visible change from v1.1 — foundation phase is zero regression
  2. All existing shadcn/ui components (Button, Input, Select, Badge) render with correct warm amber/coral colors instead of undefined/fallback values
  3. A shadcn Dialog opened in a form shows Hebrew text aligned correctly and animations entering from the right edge (RTL-correct portal behavior)
  4. Running a color contrast checker on the primary action button shows WCAG AA pass (4.5:1 ratio or better)
  5. Tab key navigation follows logical RTL order in any existing form — no focus jumps to a logically incorrect position
**Plans:** 2 plans

Plans:
- [x] 06-01-PLAN.md — CSS token layer, Tailwind config merge, DirectionProvider, Heebo font, components.json
- [x] 06-02-PLAN.md — !important removal, RTL logical properties, dead CSS cleanup, animation reconciliation

### Phase 7: Primitives
**Goal:** A complete shadcn/ui primitive component set exists — Dialog, Tabs, DropdownMenu, Tooltip, and supporting components — all RTL-verified and ready to compose domain components and pages on top of.
**Depends on:** Phase 6
**Requirements:** PRIM-01, PRIM-02, PRIM-03, PRIM-04, PRIM-05, PRIM-06, A11Y-01, MICRO-01, MICRO-02
**Success Criteria** (what must be TRUE):
  1. A delete action triggers a shadcn Dialog (not a custom modal) with Hebrew confirmation text, cascade consequences listed, and a red destructive button — replacing all 4 previous modal variants
  2. Clicking through tabs on a Teacher detail page uses shadcn Tabs with correct RTL tab ordering and a smooth entrance animation
  3. Hovering any button shows a visible color-shift transition within 150ms; pressing shows an active/pressed state
  4. Every interactive element (button, link, tab, menu item) shows a visible focus ring when reached by Tab key
  5. A status value (active/inactive/graduated) and an instrument value each display as a consistently styled Badge component across all pages where they appear
**Plans:** TBD

Plans:
- [ ] 07-01: Radix packages install, Dialog/Tabs/DropdownMenu
- [ ] 07-02: Tooltip, Avatar, Switch, Checkbox, Separator, Progress, remaining primitives

### Phase 8: Domain Components & Loading States
**Goal:** Conservatory-specific reusable components exist — InstrumentBadge, StatusBadge, StatsCard, AvatarInitials, Skeleton loaders, EmptyState, ErrorState, and the toast notification system — so every page can display loading feedback, errors, and music-school identity without reimplementing them.
**Depends on:** Phase 7
**Requirements:** LOAD-01, LOAD-02, LOAD-03, LOAD-04, LOAD-05, LOAD-06, TOAST-01, TOAST-02, TOAST-03, MICRO-03
**Success Criteria** (what must be TRUE):
  1. Loading any list page (Teachers, Students, Orchestras) shows a skeleton in the shape of table rows — no spinner visible anywhere in the app
  2. An empty Teachers table shows an illustrated empty state with the text "אין מורים עדיין" and a primary CTA button "הוסף מורה"
  3. A network error on any list page shows a human-readable error message and a "נסה שוב" retry button — not an empty table or console error
  4. A successful save action triggers a toast notification that slides in from the right edge (RTL-correct), uses warm amber/green success color, and includes a checkmark icon
  5. Navigating between routes shows a smooth fade-in on the incoming page — no white flash between pages
**Plans:** TBD

Plans:
- [ ] 08-01: InstrumentBadge, StatusBadge, AvatarInitials, StatsCard domain components
- [ ] 08-02: Skeleton, EmptyState, ErrorState, Pagination, ConfirmDialog
- [ ] 08-03: Toast system, page transition, LOAD-05

### Phase 9: Form System
**Goal:** All forms use consistently styled shadcn/ui-wrapped inputs with section grouping, inline validation feedback, and labeled fields — without any React Hook Form regressions.
**Depends on:** Phase 7
**Requirements:** FORM-01, FORM-02, FORM-03, FORM-04, A11Y-03
**Success Criteria** (what must be TRUE):
  1. Submitting a Teacher form with a missing required field shows a red border on that specific field and an error message directly beneath it — no generic alert banner
  2. Every form input on the Teacher, Student, and Orchestra forms has a visible label that stays visible regardless of whether the field has a value
  3. The 7-tab Teacher form retains all field values when switching between tabs — no data loss from tab navigation
  4. Form primary action buttons (save) appear in a consistent bottom-right position in RTL; cancel appears to their right (outward direction)
**Plans:** TBD

Plans:
- [ ] 09-01: Form system redesign — all three entity forms

### Phase 10: List Pages
**Goal:** All 5 main list pages display consistent, polished table design with hover states, sticky headers, contextual pagination, search-with-clear, skeleton loading, and music-themed empty states.
**Depends on:** Phase 8
**Requirements:** TABLE-01, TABLE-02, TABLE-03, TABLE-04, TABLE-05
**Success Criteria** (what must be TRUE):
  1. Hovering any table row across all 5 list pages shows a visible highlight state that lifts the row from the background
  2. Scrolling a long student list keeps the table headers (Name, Instrument, Status, etc.) visible and pinned at the top
  3. The pagination control reads "מציג 21-40 מתוך 127 תלמידים" (contextual copy) instead of bare page numbers
  4. The search input on any list page shows an X button when text is present; clicking it clears the field and resets the list immediately
  5. All 5 list pages (Teachers, Students, Orchestras, Rehearsals, Audit Trail) share identical table chrome — same header style, row height, action column position
**Plans:** TBD

Plans:
- [ ] 10-01: Teachers and Students list pages
- [ ] 10-02: Orchestras, Rehearsals, Audit Trail list pages

### Phase 11: Detail Pages
**Goal:** All entity detail pages display gradient header strips with avatar initials, breadcrumb navigation, "last updated" metadata, and smooth tab transitions — giving every detail view consistent structure and music-school identity.
**Depends on:** Phase 8, Phase 9
**Requirements:** DETAIL-01, DETAIL-02, DETAIL-03, DETAIL-04, DETAIL-05
**Success Criteria** (what must be TRUE):
  1. Navigating to a Teacher detail page shows a warm gradient strip at the top with the teacher's initials in a colored avatar circle and their role badge — no gray placeholder
  2. The avatar color for a given teacher is always the same color across all pages where they appear (deterministic hashing, not random)
  3. The Teacher detail page shows a breadcrumb "מורים → יוני כהן" that links back to the Teachers list
  4. Switching tabs on any detail page shows a 200ms fade transition between tab content — not an instant content swap
  5. The detail page header shows "עודכן לאחרונה: 14 בפברואר 2026" beneath the entity name
**Plans:** TBD

Plans:
- [ ] 11-01: Teacher detail and Student detail pages
- [ ] 11-02: Orchestra detail, Bagrut detail pages

### Phase 12: Layout & Dashboard
**Goal:** The sidebar, header, and dashboard are redesigned with warm colors and music identity — completing the visual system when all other pages already look polished, so the result is immediately coherent.
**Depends on:** Phase 8, Phase 10, Phase 11
**Requirements:** LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. The sidebar background uses warm, non-default colors; the currently active nav item is visibly highlighted with a distinct color or background — visible at a glance without reading labels
  2. Resizing the browser to tablet width (768px) causes the sidebar to collapse cleanly — no overlap, broken layout, or horizontal scroll
  3. The dashboard header reads "בוקר טוב, יונה" (personalized greeting using the logged-in user's name from auth context)
  4. Dashboard stat cards use warm design system colors with purposeful icons (GraduationCap for students, Music for orchestras, etc.) — not gray generic icons
  5. A first-time visitor to the dashboard immediately perceives this as a music school platform — not a generic business admin tool
**Plans:** TBD

Plans:
- [ ] 12-01: Sidebar and header redesign
- [ ] 12-02: Dashboard redesign

### Phase 13: Special Pages
**Goal:** Admin-only pages (MinistryReports, ImportData, Settings), auth pages (Login, ForgotPassword), and AuditTrail receive consistent design system application including step indicators, print styles, and any remaining polish.
**Depends on:** Phase 12
**Requirements:** SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06
**Success Criteria** (what must be TRUE):
  1. The Login page shows warm branding — school name, warm color background, and music identity — rather than a generic white login form
  2. Navigating through the MinistryReports multi-step flow shows a step progress indicator (Step 1 of 3: בחר שנה, Step 2 of 3: הפק דוח...) that updates as steps complete
  3. Navigating through ImportData shows the same step progress indicator pattern as MinistryReports — visually consistent between the two flows
  4. Printing a MinistryReports page hides the sidebar and header, shows clean report formatting with no navigation chrome
  5. The Settings page uses consistent card/form patterns matching the design system — no one-off layout
**Plans:** TBD

Plans:
- [ ] 13-01: MinistryReports, ImportData step indicators and print styles
- [ ] 13-02: Login, Settings, AuditTrail, final polish

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Quick Fixes | v1.1 | 1/1 | Complete | 2026-02-13 |
| 2. Backend Instrument Sync | v1.1 | 1/1 | Complete | 2026-02-13 |
| 3. Audit Trail Page | v1.1 | 1/1 | Complete | 2026-02-13 |
| 4. Ministry Reports Polish | v1.1 | 1/1 | Complete | 2026-02-13 |
| 5. Audit Claude Skills & GSD Agents | v1.1 | 3/3 | Complete | 2026-02-14 |
| 6. Foundation | v2.0 | 2/2 | Complete | 2026-02-17 |
| 7. Primitives | v2.0 | 0/2 | Not started | - |
| 8. Domain Components & Loading | v2.0 | 0/3 | Not started | - |
| 9. Form System | v2.0 | 0/1 | Not started | - |
| 10. List Pages | v2.0 | 0/2 | Not started | - |
| 11. Detail Pages | v2.0 | 0/2 | Not started | - |
| 12. Layout & Dashboard | v2.0 | 0/2 | Not started | - |
| 13. Special Pages | v2.0 | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-13*
*Last updated: 2026-02-17 (Phase 6 Foundation complete)*
