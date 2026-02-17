# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Administrators can efficiently manage their conservatory
**Current focus:** v2.0 Phase 8 — Domain Components & Loading States

## Current Position

Phase: 7 of 13 ([v2.0] Primitives) — COMPLETE
Plan: 2 of 2 in current phase — COMPLETE
Status: Phase complete, verified, ready for Phase 8
Last activity: 2026-02-17 — Phase 7 complete (9 primitives, tab migration, modal migration, CSS cleanup)

Progress: [███░░░░░░░] 25% (v2.0) — [██████████] 100% (v1.1 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 9 (7 v1.1 + 2 v2.0)
- Average duration: ~27 min
- Total execution time: ~3.7 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| v1.1 Phases 1-5 | 7 | ~3.5h | ~30 min |
| v2.0 Phase 6 Plan 1 | 1 | 8min | 8 min |
| v2.0 Phase 6 Plan 2 | 1 | 3min | 3 min |
| v2.0 Phase 7 Plan 1 | 1 | 117min | 117 min |
| v2.0 Phase 7 Plan 2 | 1 | 6min | 6 min |

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
- [06-02]: Native <option> !important kept with TODO(Phase 7) — browser controls option rendering; Phase 7 replaces native select with shadcn Select
- [06-02]: Responsive display toggle !important kept with TODO(Phase 7) — override inline styles; Phase 7 migrates to shadcn Tabs
- [06-02]: RTL [dir="rtl"] override block pattern deprecated — merge into base selector since app is always RTL (dir=rtl on html)
- [06-02]: Animation standard established — 100-200ms ease-out for modals/toasts/tabs; no decorative infinite animations (pulse-soft removed)
- [07-01]: shadcn primitives written manually (not via CLI) — WSL2+NTFS EIO errors prevent npm install in CLI; manual writing produces identical output
- [07-01]: progress.tsx overwritten with Radix-based version — bg-primary CSS var replaces bg-primary-600 palette class for token consistency
- [07-01]: Modal.tsx backward-compat wrapper — isOpen/onClose API preserved; individual callsite migration deferred to Plan 07-02
- [07-01]: ConfirmDeleteDialog destructive button first in JSX — RTL places it visually on the right (prominent = correct for danger action)
- [07-02]: Student bagrut tab added to StudentDetailsPage — original tabs array omitted it despite working BagrutTab component
- [07-02]: ConfirmationModal warning/info → Button variant="default" — shadcn Button has no yellow/blue semantic variant; defer to Phase 9
- [07-02]: Dead tab navigation files preserved on disk — barrel exports removed but files not deleted (reference value)

### Pending Todos

- [06-02 TODO Phase 9]: Replace native <select> with shadcn Select in teacher modal — eliminates option !important in teacher-modal-fixes.css (was Phase 7, now deferred to Phase 9 form redesign)

### Blockers/Concerns

- [Research flag, Phase 8]: Instrument SVG icon coverage — Lucide has Piano/Guitar/Music/Drum/Mic but may not cover all 27 instrument families. Assess during Phase 8 planning.
- [Research flag, Phase 13]: Toast migration scope — run `grep -r "toast\." src/ | wc -l` before planning Phase 13 to decide if Sonner migration fits or defers to v3.0.
- [Constraint]: Backend export endpoints (/api/export/status, /validate, /download) still not implemented — MinistryReports info banner stays until next backend milestone.
- [Pre-existing]: TypeScript errors in bagrutMigration.ts, cascadeErrorHandler.ts, errorRecovery.ts, memoryManager.ts, performanceEnhancements.tsx, securityUtils.ts — unrelated to CSS foundation work. Needs resolution before CI typecheck stage is enabled.
- [WSL constraint]: npm install on /mnt/c/ NTFS mount causes EIO errors in tar extraction — packages install with missing files. Workaround: retry loops + npm pack -> /tmp -> manual copy. Build verification must be done from Windows PowerShell or CI (not WSL).

## Session Continuity

Last session: 2026-02-17
Stopped at: Phase 7 Primitives complete and verified. Button active:scale-95 fix applied post-verification.
Resume file: None
