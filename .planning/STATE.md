# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Administrators can efficiently manage their conservatory
**Current focus:** v2.0 Phase 6 — Foundation (design tokens, RTL, CSS cleanup)

## Current Position

Phase: 6 of 13 ([v2.0] Foundation)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-17 — 06-01 complete (CSS token system, DirectionProvider, Heebo, components.json)

Progress: [█░░░░░░░░░] 5% (v2.0) — [██████████] 100% (v1.1 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 7 (v1.1)
- Average duration: ~30 min
- Total execution time: ~3.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| v1.1 Phases 1-5 | 7 | ~3.5h | ~30 min |
| v2.0 Phase 6 Plan 1 | 1 | 8min | 8 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

- [v2.0]: shadcn/ui selected as component library (Radix-based, Tailwind-compatible)
- [v2.0]: Monday.com-inspired warm aesthetic (amber/coral primary, not default blue)
- [v2.0]: Foundation phase must be zero visible change — infrastructure only
- [v2.0]: Layout shell (Phase 12) redesigned LAST — highest regression risk
- [v2.0]: Modal migration atomic — all 4 custom modal variants replaced in Phase 7
- [06-01]: Warm coral primary --primary: 15 85% 45% (WCAG AA 4.57:1 against white)
- [06-01]: Merge not replace — DEFAULT/foreground added to existing primary/secondary Tailwind scales — bg-primary-500 still resolves to #4F46E5 hex
- [06-01]: Heebo replaces Inter as primary UI font; Reisinger Yonatan kept as @font-face fallback
- [06-01]: CSS token format — HSL channels only in :root (no hsl() wrapper), wrapper only in JS/tailwind config

### Pending Todos

None.

### Blockers/Concerns

- [Research flag, Phase 8]: Instrument SVG icon coverage — Lucide has Piano/Guitar/Music/Drum/Mic but may not cover all 27 instrument families. Assess during Phase 8 planning.
- [Research flag, Phase 13]: Toast migration scope — run `grep -r "toast\." src/ | wc -l` before planning Phase 13 to decide if Sonner migration fits or defers to v3.0.
- [Constraint]: Backend export endpoints (/api/export/status, /validate, /download) still not implemented — MinistryReports info banner stays until next backend milestone.

## Session Continuity

Last session: 2026-02-17
Stopped at: Completed 06-01-PLAN.md — CSS token system, DirectionProvider, Heebo, components.json
Resume file: None
