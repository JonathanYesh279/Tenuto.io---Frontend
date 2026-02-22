# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Administrators can efficiently manage their conservatory
**Current focus:** v5.0 Ministry Import Overhaul — Phase 24: Ministry Excel Import Fix & Redesign

## Current Milestone: v5.0 Ministry Import Overhaul

**Goal:** Fix Ministry Excel import (1284 errors → working) and redesign ImportData page with v4.0 styling.
**Files:** Backend `import.service.js`, Frontend `ImportData.tsx`
**Phases:** 24

## Current Position

Phase: 24-ministry-excel-import
Plan: 04 (completed)
Status: Complete
Last activity: 2026-02-22 — Plan 24-04 completed (preview and results redesign with create/update distinction)

Progress: [██████████] 100% (v5.0 — 4/4 plans)

## Performance Metrics

**Velocity (cumulative):**
- v1.1: 5 phases, 7 plans, ~3.5 hours
- v2.0: 10 phases, 22 plans, ~2.3 hours
- v2.1: 6 phases, 13 plans
- v3.0: 1 phase, 15 plans
- v4.0: 1 phase, 6 plans
- v5.0: 1 phase, 4 plans (~14 min)
- Total: 23 phases, 67 plans

## Accumulated Context

### Decisions

Key decisions for v5.0:
- [Scope]: Single phase (24) with 4 sequential plans — backend first, then frontend
- [Backend approach]: Modify existing import.service.js, no new files
- [Frontend approach]: Rewrite ImportData.tsx in-place, no new component files
- [Header detection]: Scan rows 0-10, score by column name matches, fallback to row 0
- [Create functionality]: Unmatched rows become new students with minimal fields
- [Styling]: v4.0 design language (indigo, rounded-3xl, shadow-sm, Assistant font)
- [24-01] Header detection scans max 10 rows (not entire sheet) for performance
- [24-01] Department columns with single instrument auto-assign, multiple instruments warn
- [24-01] lessonDuration >2.0 treated as direct minutes, <=2.0 as weekly hours (Ministry uses 0.75)
- [24-01] Combined 'כלי נשיפה' department maps to all woodwinds + brass (Ministry sometimes merges departments)
- [24-02] Students require firstName OR lastName to be created from import (validation gate)
- [24-02] createdCount field added to both teacher and student execute results for consistent API shape
- [24-02] Status uses totalSuccess = successCount + createdCount for accurate completion state
- [24-02] New students get defaults: studyYears=1, extraHour=false, isActive=true
- [24-03] File structure guide only shows for students tab (teachers have simpler columns)
- [24-03] All v4.0 color references use explicit -500/-600 suffix to avoid CSS var resolution issues
- [24-04] Badge colors: green (update/matched), blue (create/not_found), red (error)
- [24-04] Preview stat cards use v4.0 gradient style matching Dashboard design language
- [24-04] Execute button enables when matched OR notFound has entries (not just matched)
- [24-04] Toast shows breakdown: "X עודכנו, Y נוצרו" for create+update operations

### Pending Todos

(None)

### Blockers/Concerns

- [Pre-existing]: TypeScript errors in 6 utility files — blocks CI typecheck stage. Unrelated to import work.
- [Pre-existing]: Backend export endpoints not implemented — MinistryReports info banner stays.
- [WSL constraint]: npm install on /mnt/c/ NTFS mount causes EIO errors — build verification from Windows PowerShell or CI only.

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed Phase 24 (4/4 plans) — Ministry Excel Import Fix & Redesign complete
Resume file: None

**Phase 24 Complete:** Backend import.service.js fixed (header detection, create functionality), frontend ImportData.tsx redesigned (v4.0 styling, create/update distinction, results breakdown)
