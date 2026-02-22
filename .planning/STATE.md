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
Plan: 02 complete (all plans complete)
Status: Phase complete — ready for testing
Last activity: 2026-02-22 — Plan 27-02 completed (position-based filtering)

Progress: [██████████] 100% (v5.3 — 2/2 plans)

## Performance Metrics

**Velocity (cumulative):**
- v1.1: 5 phases, 7 plans, ~3.5 hours
- v2.0: 10 phases, 22 plans, ~2.3 hours
- v2.1: 6 phases, 13 plans
- v3.0: 1 phase, 15 plans
- v4.0: 1 phase, 6 plans
- v5.0: 1 phase, 4 plans (~14 min)
- v5.1: 2 phases, 4 plans (~12 min)
- v5.3: 1 phase, 2 plans complete (~4 min)
- Total: 26 phases, 73 plans

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
- [27-01] CM abbreviation added to INSTRUMENT_MAP for Cembalo/Harpsichord (Ministry uses CM)
- [27-01] Multi-row header disambiguation: use parent row keywords (בפועל vs ריכוז) to resolve duplicate "ביצוע" headers
- [27-01] Composite header construction: "פסנתר" with "ליווי" parent → "ליווי פסנתר" (accomp hours)
- [27-01] Short header variants added for Ministry fragments: שבועיות→theoryHours, זמן→breakTimeHours, שעות→totalWeeklyHours
- [27-01] Two-pass header processing: backfill first, then disambiguation/composition second
- [27-02] Position-based filtering uses column index > 24 threshold to distinguish role from hours columns
- [27-02] Instrument detection filtered to columns >= 24 only (prevents "פסנתר" at C15 from triggering piano detection)
- [27-02] HOURS_FIELDS_WITH_ROLE_COLLISION set prevents role boolean values from overwriting teaching hours
- [27-02] headerColMap parameter made optional for backward compatibility (student import unchanged)

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

Last session: 2026-02-22
Stopped at: Phase 27 complete — all Ministry import bugs fixed (multi-row headers, header collisions, position-based filtering)
Resume file: None

**Phase 24 Complete:** Backend import.service.js fixed (header detection, create functionality), frontend ImportData.tsx redesigned (v4.0 styling, create/update distinction, results breakdown)

**Phase 25 Complete:** Backend TEACHER_ROLES renamed to Ministry naming (ניצוח, תאוריה), INSTRUMENT_MAP expanded (+4 instruments), managementInfo schema extended (+6 teaching hour fields), frontend teacher file structure guide added, VALID_ROLES updated to 8 items with backward compatibility

**Phase 26 Complete:** Backend Excel parsing switched from xlsx to exceljs with cell fill color detection — Ministry instrument/role columns marked by colored cells now correctly detected, text-based TRUTHY_VALUES still works as fallback

**Phase 27 Complete:** Backend import.service.js fixed for Ministry multi-row headers and column collisions — all 9 teaching hour columns now parse correctly, CM instrument added, duplicate/short headers resolved, position-based filtering prevents role booleans from overwriting hours values
