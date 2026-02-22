---
phase: 25-ministry-excel-import-upgrade-teacher-import
plan: 03
subsystem: import-ui
tags: [file-structure-guide, validation, roles, ministry-alignment]

dependency-graph:
  requires: [25-02-PLAN.md]
  provides: [teacher-file-guide, updated-role-validation]
  affects: [ImportData.tsx, validationUtils.ts, teacher-forms]

tech-stack:
  added: [teacher-file-structure-guide-component]
  patterns: [v4.0-design-language, ministry-compatibility-banner, role-backward-compatibility]

key-files:
  created:
    - src/components/teachers/RoleDistributionPanel.tsx
  modified:
    - src/pages/ImportData.tsx
    - src/utils/validationUtils.ts
    - src/components/modals/AddTeacherModal.tsx
    - src/pages/Teachers.tsx
    - src/features/teachers/details/types/index.ts
    - src/utils/styleUtils.ts
    - src/components/TeacherCard.tsx

decisions:
  - "Badge color scheme: red (required), gray (optional), indigo (auto-detected for instrument/role columns)"
  - "Maintain backward compatibility for old role names in color mappings to avoid breaking existing data display"
  - "Add new role colors: pink (ליווי פסנתר), amber (הלחנה)"

metrics:
  duration: 310s
  tasks: 2
  files: 8
  commits: 2
  completed: 2026-02-22T20:01:42Z
---

# Phase 25 Plan 03: Teacher File Structure Guide & Role Validation Summary

**One-liner:** Added Ministry-aligned teacher file structure guide with 3 sections (Personal/Professional/Hours) and updated frontend role validation to 8 TEACHER_ROLES

## What Was Built

### Task 1: TeacherFileStructureGuide Component
- **Created:** `TeacherFileStructureGuide()` function component in ImportData.tsx (before main export)
- **Sections:** 3 categorized sections with 22 total rows
  - **Personal Info (5 rows):** שם מורה (required), ת.ז., שנת לידה, טלפון, דוא"ל
  - **Professional Info (8 rows):** סיווג, תואר, ותק, תעודת הוראה, ארגון עובדים, כלי נגינה (auto), תפקידי הוראה (auto), תיאור תפקיד
  - **Hours (9 rows):** שעות הוראה, ליווי פסנתר, הרכב ביצוע, ריכוז הרכב, תאוריה, ניהול, ריכוז, ביטול זמן, סה"כ ש"ש
- **Ministry Banner:** Blue info banner explaining auto-detection of metadata rows, instrument columns, and teaching role columns
- **Badge Colors:**
  - Red (חובה): Required fields (only שם מורה)
  - Gray (אופציונלי): Optional fields (all others except auto-detected)
  - Indigo (אוטומטי): Auto-detected columns (instrument abbreviations Vi/VL/CH/FL/PI/GI and teaching role booleans)
- **Conditional Rendering:** Guide shows when `activeTab === 'teachers'` in upload state (line 489-491)
- **Design:** Matches v4.0 pattern — rounded-3xl, shadow-sm, bg-white, consistent with student guide

**Commit:** `6462210` — feat(25-03): add teacher file structure guide to ImportData page

### Task 2: VALID_ROLES Update & Frontend Alignment
- **Updated VALID_ROLES in validationUtils.ts:**
  - Old (6 items): `['מורה', 'מנצח', 'מדריך הרכב', 'מנהל', 'מורה תאוריה', 'מגמה']`
  - New (8 items): `['מורה', 'ניצוח', 'מדריך הרכב', 'מנהל', 'תאוריה', 'מגמה', 'ליווי פסנתר', 'הלחנה']`
- **Role Renames (Ministry-aligned):**
  - 'מנצח' → 'ניצוח'
  - 'מורה תאוריה' → 'תאוריה'
- **Updated Constants & Arrays:**
  - `VALID_ROLES` in validationUtils.ts (exported constant)
  - `VALID_ROLES` in AddTeacherModal.tsx (local constant)
  - `TEACHER_ROLES` in features/teachers/details/types/index.ts (type source)
  - Role filter options in Teachers.tsx (dropdown now has 8 options)
- **Updated Color Mappings (with backward compatibility):**
  - `ROLE_COLORS` in styleUtils.ts — added new roles, kept old names as aliases
  - `ROLE_COLORS` in RoleDistributionPanel.tsx — hex colors for charts
  - `getRoleColor()`, `getAvatarColor()` in TeacherCard.tsx — badge and avatar styling
  - New role colors: pink (ליווי פסנתר), amber (הלחנה)
- **Added Instruments:** VM, NA, SI to VALID_INSTRUMENTS (ethnic instruments from backend)

**Commit:** `5d685f6` — feat(25-03): update VALID_ROLES to match backend TEACHER_ROLES

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

✅ **TeacherFileStructureGuide exists** — Component defined at line 62, renders at line 490
✅ **3 sections with 22 rows** — Personal (5), Professional (8), Hours (9)
✅ **Ministry banner present** — Blue banner with auto-detection messaging
✅ **Conditional rendering** — Shows when `activeTab === 'teachers'`
✅ **VALID_ROLES updated** — 8 items matching backend TEACHER_ROLES exactly
✅ **No old role names in validation** — 'מנצח' and 'מורה תאוריה' replaced with new names
✅ **Backward compatibility maintained** — Color mappings include old names as aliases

## Files Modified

1. **ImportData.tsx** — Added TeacherFileStructureGuide component (181 lines), conditional render
2. **validationUtils.ts** — Updated VALID_ROLES to 8 items, added VM/NA/SI instruments
3. **AddTeacherModal.tsx** — Updated local VALID_ROLES constant
4. **Teachers.tsx** — Updated role filter dropdown to 8 options
5. **features/teachers/details/types/index.ts** — Updated TEACHER_ROLES type source
6. **styleUtils.ts** — Added new role colors, backward compatibility aliases
7. **TeacherCard.tsx** — Updated role color functions for new roles
8. **RoleDistributionPanel.tsx** — Updated role color mapping (new file created)

## Commits

- `6462210`: feat(25-03): add teacher file structure guide to ImportData page
- `5d685f6`: feat(25-03): update VALID_ROLES to match backend TEACHER_ROLES

## Technical Notes

- **Backward Compatibility Strategy:** Old role names ('מנצח', 'מורה תאוריה') kept in color mapping objects to prevent breaking existing teacher records that may still use old role values. Backend handles migration, frontend displays both gracefully.
- **Ministry Alignment:** New roles 'ניצוח' and 'תאוריה' match backend TEACHER_ROLES which align with Ministry of Education terminology.
- **Auto-detected Badge:** New indigo badge color (bg-indigo-100 text-indigo-700) introduced to distinguish auto-detected columns (instrument abbreviations, role booleans) from user-required or optional fields.
- **Instrument Expansion:** VM, NA, SI added to ethnic instruments section — these are Ministry instrument codes that appear in import files.

## User-Facing Changes

1. **Teacher Import Tab:** Now shows file structure guide before upload (previously only students had guide)
2. **Role Dropdowns:** Teacher role filters and forms now show 8 options instead of 6
3. **Role Badges:** New roles (ליווי פסנתר, הלחנה) appear with pink/amber badges
4. **Ministry Banner:** Teachers tab guide explicitly mentions instrument and role column auto-detection

## Next Steps

Phase 25 Plan 03 complete. Ready for Plan 04 (if exists) or phase completion.

## Self-Check: PASSED

**Files exist:**
- ✅ src/pages/ImportData.tsx (modified, TeacherFileStructureGuide component present)
- ✅ src/utils/validationUtils.ts (modified, VALID_ROLES updated)
- ✅ src/components/teachers/RoleDistributionPanel.tsx (created)

**Commits exist:**
- ✅ 6462210 — feat(25-03): add teacher file structure guide to ImportData page
- ✅ 5d685f6 — feat(25-03): update VALID_ROLES to match backend TEACHER_ROLES

**Verification:**
- ✅ grep "TeacherFileStructureGuide" src/pages/ImportData.tsx returns 2 matches (definition + usage)
- ✅ grep "export const VALID_ROLES" src/utils/validationUtils.ts returns 8-item array
- ✅ activeTab === 'teachers' conditional wraps TeacherFileStructureGuide at line 489-491
