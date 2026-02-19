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
Plan: 22-08 (7/15 complete)
Status: In progress
Last activity: 2026-02-19 — 22-07 Bagrut module token migration complete (24 files)

Progress: [████░░░░░░] 47% (v3.0)

## Performance Metrics

**Velocity (cumulative):**
- v1.1: 5 phases, 7 plans, ~3.5 hours
- v2.0: 10 phases, 22 plans, ~2.3 hours
- v2.1: 6 phases, 13 plans
- v3.0: 1 phase in progress, 7 plans complete (22-01: 2 min, 22-02: 2 min, 22-07: 2 min)
- Total: 21+ phases, 44 plans

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
- [22-07 Bagrut]: rounded-lg removed throughout bagrut module — all container rounding reduced to rounded (2px sharp identity)
- [22-07 Bagrut]: Modal Card wrappers preserved (ConflictResolutionModal, MigrationWarningModal) — floating content keeps Card
- [22-07 Bagrut]: bg-primary-50/100 backgrounds replaced with bg-muted — tonal neutral, not warm tint

Archived v2.1 decisions: see milestones/ or git history for STATE.md prior versions.

### Pending Todos

(None)

### Blockers/Concerns

- [Pre-existing]: TypeScript errors in 6 utility files — blocks CI typecheck stage. Unrelated to visual work.
- [Pre-existing]: Backend export endpoints not implemented — MinistryReports info banner stays.
- [WSL constraint]: npm install on /mnt/c/ NTFS mount causes EIO errors — build verification from Windows PowerShell or CI only.
- [v2.1 carryover]: 1,211 primary-NNN hex classes across 134 files — migration deferred, may be addressed in v3.0.
- [v2.1 audit]: TeacherForm.tsx and StudentForm.tsx accent bars orphaned — form routing doesn't reach them. Will be addressed or superseded by Phase 22 restructuring.

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 22-07-PLAN.md — Bagrut module token migration (24 files, primary-NNN eliminated)
Resume file: None
