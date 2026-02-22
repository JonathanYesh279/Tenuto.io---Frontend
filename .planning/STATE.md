# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Administrators can efficiently manage their conservatory
**Current focus:** v5.3 Ministry Import Fix — Phase 27: Multi-Row Headers & Column Mapping

## Current Milestone: v5.3 Ministry Import Fix

**Goal:** Fix 6 bugs in Ministry Excel teacher import: multi-row header fragments, header collision, instrument detection, CM abbreviation, conditional formatting, formula results.
**Files:** Backend `import.service.js`, `config/constants.js`
**Phases:** 27

## Current Position

Phase: 27-import-header-fix
Plan: None yet
Status: Context gathered, ready for planning
Last activity: 2026-02-23 — Phase 27 created after diagnostic investigation

Progress: [░░░░░░░░░░] 0% (v5.3 — 0/? plans)

## Performance Metrics

**Velocity (cumulative):**
- v1.1: 5 phases, 7 plans, ~3.5 hours
- v2.0: 10 phases, 22 plans, ~2.3 hours
- v2.1: 6 phases, 13 plans
- v3.0: 1 phase, 15 plans
- v4.0: 1 phase, 6 plans
- v5.0: 1 phase, 4 plans (~14 min)
- v5.1: 2 phases, 4 plans (~12 min)
- Total: 26 phases, 71 plans

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
- [Phase 25]: Badge color scheme for file structure guide: red (required), gray (optional), indigo (auto-detected)
- [Phase 25]: Maintain backward compatibility for old role names ('מנצח', 'מורה תאוריה') in color mappings
- [26-01] Switch Excel parsing from xlsx to exceljs for cell style reading (Ministry uses colored cells)
- [26-01] Color detection first, text fallback second — any non-white fill = selected
- [26-01] Black fills (FF000000) count as selected (not excluded from NO_COLOR list)

### Roadmap Evolution

- Phase 25 added: Ministry Excel-Import Upgrade: Teacher Import
- Phase 26 added: Cell Fill Color Detection for Import
- Phase 27 added: Ministry Import Fix — Multi-Row Headers & Column Mapping

### Pending Todos

(None)

### Blockers/Concerns

- [Pre-existing]: TypeScript errors in 6 utility files — blocks CI typecheck stage. Unrelated to import work.
- [Pre-existing]: Backend export endpoints not implemented — MinistryReports info banner stays.
- [WSL constraint]: npm install on /mnt/c/ NTFS mount causes EIO errors — build verification from Windows PowerShell or CI only.

## Session Continuity

Last session: 2026-02-23
Stopped at: Phase 27 context gathered — ready for planning
Resume file: None

**Phase 24 Complete:** Backend import.service.js fixed (header detection, create functionality), frontend ImportData.tsx redesigned (v4.0 styling, create/update distinction, results breakdown)

**Phase 25 Complete:** Backend TEACHER_ROLES renamed to Ministry naming (ניצוח, תאוריה), INSTRUMENT_MAP expanded (+4 instruments), managementInfo schema extended (+6 teaching hour fields), frontend teacher file structure guide added, VALID_ROLES updated to 8 items with backward compatibility

**Phase 26 Complete:** Backend Excel parsing switched from xlsx to exceljs with cell fill color detection — Ministry instrument/role columns marked by colored cells now correctly detected, text-based TRUTHY_VALUES still works as fallback
