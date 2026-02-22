# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Administrators can efficiently manage their conservatory
**Current focus:** v5.0 Ministry Import Overhaul — Phase 24: Ministry Excel Import Fix & Redesign

## Current Milestone: v5.1 Teacher Import Upgrade

**Goal:** Upgrade teacher import to match Ministry Excel format with new roles, teaching hours, and instrument handling.
**Files:** Backend `constants.js`, `teacher.validation.js`, `import.service.js`
**Phases:** 25

## Current Position

Phase: 25-ministry-excel-import-upgrade-teacher-import
Plan: 01 (completed)
Status: In Progress
Last activity: 2026-02-22 — Plan 25-01 completed (backend constants and schema foundation)

Progress: [███░░░░░░░] 33% (v5.1 — 1/3 plans)

## Performance Metrics

**Velocity (cumulative):**
- v1.1: 5 phases, 7 plans, ~3.5 hours
- v2.0: 10 phases, 22 plans, ~2.3 hours
- v2.1: 6 phases, 13 plans
- v3.0: 1 phase, 15 plans
- v4.0: 1 phase, 6 plans
- v5.0: 1 phase, 4 plans (~14 min)
- v5.1: 1 phase, 1/3 plans (~3 min)
- Total: 24 phases, 68 plans

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
- [25-01] Force-add migration file with git add -f to override migrations/ gitignore (critical for version control)

### Roadmap Evolution

- Phase 25 added: Ministry Excel-Import Upgrade: Teacher Import

### Pending Todos

(None)

### Blockers/Concerns

- [Pre-existing]: TypeScript errors in 6 utility files — blocks CI typecheck stage. Unrelated to import work.
- [Pre-existing]: Backend export endpoints not implemented — MinistryReports info banner stays.
- [WSL constraint]: npm install on /mnt/c/ NTFS mount causes EIO errors — build verification from Windows PowerShell or CI only.

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed Phase 25 Plan 01 (1/3 plans) — Backend constants and schema foundation for teacher import upgrade
Resume file: None

**Phase 24 Complete:** Backend import.service.js fixed (header detection, create functionality), frontend ImportData.tsx redesigned (v4.0 styling, create/update distinction, results breakdown)

**Phase 25 In Progress:** Plan 01 complete (TEACHER_ROLES renamed to Ministry naming, INSTRUMENT_MAP expanded with 4 instruments, managementInfo schema extended with 6 teaching hour fields, migration script created)
