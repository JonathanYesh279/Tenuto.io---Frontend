---
phase: 25-ministry-excel-import-upgrade-teacher-import
plan: 01
subsystem: backend-schema
tags: [teacher, constants, validation, migration, ministry]

dependency_graph:
  requires: []
  provides:
    - Updated TEACHER_ROLES enum (8 roles, Ministry-aligned)
    - Extended managementInfo schema (10 teaching hour fields)
    - INSTRUMENT_MAP expansion (BR, VM, NA, SI)
    - TEACHER_HOURS_COLUMNS mapping
    - ROLE_RENAME_MAP for backward compatibility
    - Migration script 025-rename-teacher-roles.js
  affects:
    - teacher.validation.js (imports TEACHER_ROLES from constants)
    - Teacher import logic (will use TEACHER_HOURS_COLUMNS in next plan)
    - Database teacher documents (migration script ready to run)

tech_stack:
  added: []
  patterns:
    - Joi validation schemas with .default() for consistent initialization
    - MongoDB migration scripts with arrayFilters for precise role updates
    - Backward compatibility maps for data migration

key_files:
  created:
    - /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/migrations/025-rename-teacher-roles.js
  modified:
    - /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/config/constants.js
    - /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/api/teacher/teacher.validation.js

decisions:
  - title: "Force-add migration file despite gitignore"
    context: "migrations/ directory is gitignored but plan expects file to be committed"
    options:
      - "Skip commit (file exists but not tracked)"
      - "Force-add with git add -f (override gitignore)"
      - "Update .gitignore to allow numbered migrations"
    choice: "Force-add with git add -f"
    rationale: "Migration file is critical for database schema upgrade and plan explicitly lists it in files_modified. Physical migration files exist in directory but aren't tracked. Force-adding ensures the migration is version-controlled for team collaboration."

metrics:
  duration: 190s
  tasks_completed: 2
  files_modified: 3
  completed_date: 2026-02-22
---

# Phase 25 Plan 01: Backend Constants & Schema Foundation Summary

**One-liner:** Renamed teacher roles to Ministry naming (ניצוח/תאוריה), expanded INSTRUMENT_MAP with 4 instruments, added 6 teaching hour fields to managementInfo schema, and created role/instrument migration script.

## What Was Done

### Task 1: Update TEACHER_ROLES and expand INSTRUMENT_MAP
- **Renamed roles** in TEACHER_ROLES:
  - `מנצח` → `ניצוח` (Conducting)
  - `מורה תאוריה` → `תאוריה` (Theory)
- **Added 2 new roles**:
  - `ליווי פסנתר` (Piano Accompaniment)
  - `הלחנה` (Composition)
- **Created ROLE_RENAME_MAP** export for migration/backward-compat support
- **Created TEACHER_HOURS_COLUMNS** export mapping Ministry hour column names to internal field names (10 entries)
- **Expanded INSTRUMENT_MAP** with 4 new instruments:
  - `בריטון` (BR) - Brass department
  - `VM` - Ethnic department (abbreviation as-is per user decision)
  - `NA` - Ethnic department (abbreviation as-is per user decision)
  - `SI` - Ethnic department (abbreviation as-is per user decision)
- **Commit:** c1859f2

### Task 2: Extend teacher validation schema and create migration script
- **Extended managementInfoSchema** (create) with 6 new hour fields:
  - `teachingHours` (שעות הוראה)
  - `ensembleHours` (הרכב ביצוע)
  - `theoryHours` (תאוריה)
  - `coordinationHours` (ריכוז)
  - `breakTimeHours` (ביטול זמן)
  - `totalWeeklyHours` (סה"כ ש"ש) - max 100 instead of 50
- **Extended managementInfoUpdateSchema** with same 6 fields
- **Updated default values** object to include all 10 hour fields with null defaults
- **Created migration script** `025-rename-teacher-roles.js`:
  - Part 1: Renames both roles using `updateMany` with `arrayFilters`
  - Part 2: Migrates single `instrument` string to `instruments` array
  - Proper error handling, logging, and verification
  - Force-added to git (migrations/ is gitignored)
- **Commit:** efe1fe0

## Verification Results

All success criteria met:

1. ✅ **constants.js:** TEACHER_ROLES has exactly 8 entries with ניצוח and הלחנה present
2. ✅ **constants.js:** ROLE_RENAME_MAP maps old → new correctly
3. ✅ **constants.js:** INSTRUMENT_MAP includes VM, NA, SI, BR entries
4. ✅ **constants.js:** TEACHER_HOURS_COLUMNS has 10 entries (9 unique fields + 1 variant)
5. ✅ **teacher.validation.js:** managementInfoSchema validates all 10 hour fields (4 existing + 6 new)
6. ✅ **teacher.validation.js:** managementInfoUpdateSchema has same 6 new fields
7. ✅ **Migration script:** Syntactically correct, uses arrayFilters for atomic role updates
8. ✅ **No import errors:** constants.js exports resolve correctly in teacher.validation.js

**Runtime verification:**
```
TEACHER_ROLES count: 8
Has ניצוח: true
Has הלחנה: true
TEACHER_HOURS_COLUMNS keys: 10
Validation with new fields: successful
Migration script syntax: OK
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] Force-add migration file to override gitignore**
- **Found during:** Task 2 commit
- **Issue:** migrations/ directory is completely gitignored (.gitignore line 202), preventing git from tracking the new migration file despite plan listing it in files_modified
- **Fix:** Used `git add -f migrations/025-rename-teacher-roles.js` to force-add file and override gitignore
- **Files modified:** migrations/025-rename-teacher-roles.js
- **Commit:** efe1fe0 (same commit as Task 2)
- **Rationale:** Migration file is critical for database schema upgrade. Other migration files exist in directory but aren't tracked. Force-adding ensures version control for team collaboration and aligns with plan expectations.

## Dependencies & Next Steps

**Provides for downstream plans:**
- TEACHER_ROLES enum ready for import validation
- TEACHER_HOURS_COLUMNS mapping ready for teacher import parsing
- INSTRUMENT_MAP expansion supports Ministry data with ethnic instruments
- managementInfo schema accepts all Ministry hour columns
- Migration script ready to run before deploying import changes

**Next plan (25-02) can now:**
- Use TEACHER_HOURS_COLUMNS to parse Ministry hour columns in teacher import
- Validate teacher roles against updated TEACHER_ROLES
- Map ethnic instrument abbreviations VM/NA/SI
- Store teaching hours in extended managementInfo schema

**Migration deployment:**
- Run `node migrations/025-rename-teacher-roles.js` before deploying plan 25-02 changes
- Verifies role rename success by logging distinct roles after update

## Technical Notes

- **Joi validation pattern:** Both create and update schemas extended in parallel to maintain consistency
- **Default values:** All new hour fields default to null (not 0) to distinguish "not set" from "zero hours"
- **Migration safety:** Uses `arrayFilters` to rename roles atomically without affecting other array elements
- **Backward compatibility:** ROLE_RENAME_MAP preserved for potential future data migration needs

---

## Self-Check: PASSED

**Files created:**
- FOUND: /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/migrations/025-rename-teacher-roles.js

**Files modified:**
- FOUND: /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/config/constants.js (verified TEACHER_ROLES count: 8)
- FOUND: /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/api/teacher/teacher.validation.js (verified managementInfo fields: 11)

**Commits:**
- FOUND: c1859f2 (Task 1: TEACHER_ROLES and INSTRUMENT_MAP updates)
- FOUND: efe1fe0 (Task 2: validation schema extension and migration script)

**Runtime validation:**
- ✅ TEACHER_ROLES imports successfully
- ✅ New roles present (ניצוח, הלחנה)
- ✅ teacherSchema validates with new hour fields
- ✅ Migration script passes syntax check

All artifacts verified and operational.
