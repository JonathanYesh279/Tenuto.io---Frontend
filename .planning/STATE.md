# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Administrators can efficiently manage their conservatory
**Current focus:** v3.0 Visual Architecture Rewrite — Phase 22: Visual Architecture Rewrite

## Current Milestone: v3.0 Visual Architecture Rewrite

**Goal:** Structural recomposition of the entire application. Not polish, not tokens — a visual architecture rewrite. Every page follows a defined archetype with clear dominant zones, intentional asymmetry, and data-first composition. Generic admin-template patterns eliminated.
**Architectural Foundation:** `.planning/ARCHETYPES.md`
**Phases:** 22+ (planning)

## Current Position

Phase: 22-visual-architecture-rewrite
Plan: 22-10 (9/15 complete)
Status: In progress
Last activity: 2026-02-19 — 22-09 Final bulk component sweep complete (37 files: deletion module, entity cards, modals, schedule, misc)

Progress: [█████░░░░░] 60% (v3.0)

## Performance Metrics

**Velocity (cumulative):**
- v1.1: 5 phases, 7 plans, ~3.5 hours
- v2.0: 10 phases, 22 plans, ~2.3 hours
- v2.1: 6 phases, 13 plans
- v3.0: 1 phase in progress, 9 plans complete (22-01: 2 min, 22-02: 2 min, 22-07: 2 min, 22-09: 3 min)
- Total: 21+ phases, 46 plans

## Accumulated Context

### Decisions

Key decisions for v3.0:
- [Archetype]: Four page archetypes defined — Dashboard (command center), List (data table), Detail (dossier), Management (operations console)
- [Archetype]: One dominant zone per page — every page has exactly one thing that hits you first
- [Archetype]: No universal card wrappers — sections defined by spacing and typography, not boxes
- [Archetype]: Elevation is interaction-only — shadows for modals/popovers/dropdowns only, zero decorative elevation
- [Archetype]: Flat data surfaces — tables have no rounded corners, no shadows, no card wrappers, strong row hover
- [Archetype]: Asymmetry is default — equal-width columns only when data demands it
- [Archetype]: Sidebar is architectural — tonally distinct, visually heavy, structurally anchoring
- [Archetype]: Density follows function — high for lists, medium for dashboard, mixed for detail, compact for management
- [Direction]: This is NOT polish or token refinement — it's structural recomposition
- [Direction]: Shape language, button system, icon system must all be redefined as a unit
- [Direction]: Template grid symmetry must be eliminated
- [22-01 Token]: --primary: 0 0% 0% — black is locked, not a variable choice
- [22-01 Token]: --radius: 0.125rem (2px) — sharp corners locked for architectural identity
- [22-01 Token]: --sidebar: 220 20% 13% — deep charcoal, tonally distinct, structurally anchoring
- [22-01 Token]: --shadow-1: none — decorative elevation eliminated, shadows reserved for interaction layers
- [22-01 Token]: primary-NNN hex classes (1,211 across 134 files) deferred to 22-03
- [22-02 Icons]: @phosphor-icons/react installed; Sidebar.tsx is the first Phosphor-migrated component — fill/regular weight toggle for active/inactive nav items
- [22-02 Icons]: ListIcon is the Phosphor equivalent of Lucide Menu icon — no MenuIcon exists in Phosphor
- [22-02 Icons]: Role badges in dark sidebar need inverted colors (bg-red-900/40 text-red-300, not bg-red-100 text-red-700)
- [22-04 UI]: Table.tsx is now a flat data surface — no rounded container, no shadow, semantic tokens throughout, Phosphor icons
- [22-04 UI]: Entity accent pattern: inline borderRight with hsl(var(--color-*-fg)) replaces full pastel background fills in DetailPageHeader and ListPageHero
- [22-04 UI]: StatsCard legacy 'blue' → bg-muted/text-foreground; ConfirmDeleteModal rounded-2xl shadow-2xl → rounded (flat modal)
- [22-07 Bagrut]: rounded-lg removed throughout bagrut module — all container rounding reduced to rounded (2px sharp identity)
- [22-07 Bagrut]: Modal Card wrappers preserved (ConflictResolutionModal, MigrationWarningModal) — floating content keeps Card
- [22-07 Bagrut]: bg-primary-50/100 backgrounds replaced with bg-muted — tonal neutral, not warm tint
- [22-05 Forms]: rounded-lg → rounded in all form contexts — 2px sharp corners match locked architectural identity
- [22-05 Forms]: focus:ring-primary-500 → focus:ring-ring — semantic ring token, not hardcoded hue
- [22-05 Forms]: border-gray-300 → border-input in form primitives — consistent functional border token
- [22-05 Forms]: SimplifiedBagrutForm gradient progress bar eliminated — no decorative gradients per architectural rules
- [22-09 Components]: rounded-lg → rounded across all 37 deletion/modal/entity-card/schedule/misc files
- [22-09 Components]: Modal Card wrappers preserved — DeletionImpactModal, BatchDeletionModal, SafeDeleteModal, PresentationDetailsModal, PerformanceDetailsModal, AdditionalRehearsalsModal, OrchestraDetailsModal all keep Card for floating overlay context
- [22-09 Components]: hover:bg-primary → hover:bg-neutral-800 for primary action buttons — visible lighter shift on black buttons
- [22-09 Components]: The full deletion module (12 files) is now semantically clean — primary-NNN purged
- [22-08 Detail]: HoursSummaryTab total hours banner: flat bg-primary (black) replaces gradient primary-500→600 — elevation-as-interaction-only principle applied
- [22-08 Detail]: StudentDetailsHeader: gradient primary header replaced with flat bg-primary — dossier archetype restructuring (Plan 10) will recompose this properly
- [22-08 Detail]: Tab trigger rounding: rounded-lg → rounded (2px sharp) in TeacherDetailsPage, OrchestraDetailsPage, StudentDetailsPage
- [22-08 Detail]: Teacher/orchestra overview section cards: gradient colored backgrounds → bg-muted/30 (neutral, subdued)
- [22-08 Detail]: Student files verified clean — prior plans (22-04/05/06/09) had already swept them
- [22-08 Detail]: Zero bg-primary-NNN, zero text-primary-NNN, zero rounded-xl/2xl confirmed across entire src/features/ directory
- [22-06 Dashboard]: Card on dashboard page sections → div/section with spacing; Card kept only for popover/modal/dropdown content
- [22-06 Dashboard]: StatCard is a flat data surface — no hover:shadow-md, no decorative border-primary-NNN hover
- [22-06 Dashboard]: StatCard actions dropdown retains shadow-md (genuine interaction layer / popover)
- [22-06 Dashboard]: DashboardRefresh toggle uses semantic bg-primary/peer-checked:bg-primary; countdown ring uses text-primary
- [22-06 Dashboard]: Zero bg-primary-NNN, zero rounded-xl/2xl confirmed across all 24 dashboard component files

Archived v2.1 decisions: see milestones/ or git history for STATE.md prior versions.

### Pending Todos

(None)

### Blockers/Concerns

- [Pre-existing]: TypeScript errors in 6 utility files — blocks CI typecheck stage. Unrelated to visual work.
- [Pre-existing]: Backend export endpoints not implemented — MinistryReports info banner stays.
- [WSL constraint]: npm install on /mnt/c/ NTFS mount causes EIO errors — build verification from Windows PowerShell or CI only.
- [v2.1 carryover]: 1,211 primary-NNN hex classes across 134 files — migration deferred, may be addressed in v3.0.
- [v2.1 audit]: TeacherForm.tsx and StudentForm.tsx accent bars orphaned — form routing doesn't reach them. Will be addressed or superseded by Phase 22 restructuring.
- [22-09 Remaining]: ~152 bg-primary-NNN, ~140 text-primary-NNN, ~94 rounded-xl remain in OTHER src/ files (feedback, analytics, schedule, accessibility, OrchestraEnrollmentManager root-level) — outside plan 22-09 scope. May need follow-up plan. NOTE: dashboard/charts resolved by 22-06.

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 22-06-PLAN.md — Dashboard component style cleanup (24 files: stat cards, charts, widgets, role dashboards)
Resume file: None
