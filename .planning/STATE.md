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

Phase: 22-visual-architecture-rewrite (pending — not yet planned)
Plan: None yet — run `/gsd:plan-phase 22`
Status: Phase inserted, archetype framework defined, awaiting planning
Last activity: 2026-02-18 — Phase 22 inserted, ARCHETYPES.md written

Progress: [░░░░░░░░░░] 0% (v3.0)

## Performance Metrics

**Velocity (cumulative):**
- v1.1: 5 phases, 7 plans, ~3.5 hours
- v2.0: 10 phases, 22 plans, ~2.3 hours
- v2.1: 6 phases, 13 plans
- Total: 21 phases, 42 plans

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

Last session: 2026-02-18
Stopped at: Phase 22 inserted, ARCHETYPES.md written — ready for `/gsd:plan-phase 22`
Resume file: None
