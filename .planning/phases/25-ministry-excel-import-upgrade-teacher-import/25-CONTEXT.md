# Phase 25: Ministry Excel-Import Upgrade: Teacher Import - Context

**Gathered:** 2026-02-22 (updated 2026-02-22)
**Status:** Updated — cell fill color detection bug identified

<domain>
## Phase Boundary

Extend the Ministry Excel import system to fully support teachers. Currently teacher import is update-only with no create functionality, no file structure guide, and no instrument detection. Phase 25 adds teacher creation from import, instrument abbreviation mapping, role system alignment with Ministry naming, teaching hours import, and a teacher-specific file structure guide. The frontend ImportData page already has a teacher tab — this phase upgrades the backend logic and frontend guide.

Reference file: `/מידע/מורים - משרד החינוך.xlsx` — multi-row headers (rows 6-10), instrument abbreviation columns, teaching subject columns. **CRITICAL:** Instruments and teaching subjects are marked by **cell fill color** (not text values).

</domain>

<decisions>
## Implementation Decisions

### Teacher Creation from Import
- Unmatched teachers ARE created as new records (like students in Phase 24)
- Minimum required for creation: firstName AND lastName (stricter than students which need OR)
- Missing ID number does NOT block creation — import with available data
- Fail only when ALL critical identifiers missing (no name + no ID + no email)
- Default role when no teaching subjects checked: מורה (teacher)
- Initial password for created teachers: `123456` (or `12345678` if minimum length requires 8)
- Created teachers: isActive=true, assigned to current school year
- Email from Ministry file used for credentials when available
- Ministry data overwrites existing values on update (Ministry wins on conflicts)
- ALL data from Ministry file must be imported — no partial imports. If schema doesn't support a field, adjust the schema

### Role System Overhaul
- **Rename existing roles to match Ministry naming:**
  - `מנצח` → `ניצוח`
  - `מורה תאוריה` → `תאוריה`
- **Add new roles from Ministry:**
  - `ליווי פסנתר` (piano accompaniment)
  - `הלחנה` (composition)
- **Final TEACHER_ROLES:** `['מורה', 'ניצוח', 'מדריך הרכב', 'מנהל', 'תאוריה', 'מגמה', 'ליווי פסנתר', 'הלחנה']` — confirmed correct
- Ministry column `מקצועות הוראה (מעשי/עיוני)` maps to TEACHER_ROLES (not TEACHING_SUBJECTS)
- These are **color-filled columns** in the Ministry file — non-white fill = selected (same rule as instruments)
- A teacher can have multiple roles
- **Database migration required:** Update all existing teachers with old role names to new names
- Backend constants, frontend constants, and validation all need updating

### Management Roles
- Ministry `תיאור תפקיד` column maps to existing `managementInfo.role`
- Match text to existing MANAGEMENT_ROLES enum: ריכוז פדגוגי, ריכוז מחלקה, סגן מנהל, ריכוז אחר
- Management role is a sub-property connected to the teacher's broader role (רכזות)

### Instrument Handling
- Map Ministry instrument abbreviation columns to teacher instruments
- Teacher instrument field changes from single string to **array** (support multiple instruments)
- Schema migration needed: `professionalInfo.instrument` (string) → `professionalInfo.instruments` (array)
- **CRITICAL BUG FIX: Cell fill color detection**
  - Ministry file marks instruments with **cell background fill color** (lavender/blue cells), NOT text values
  - Current backend uses `xlsx` library which only reads text → **all instruments are missed**
  - Must switch to `exceljs` (already in dependencies, used for export) which reads cell styles/fills
  - **Detection rule:** Any non-white cell fill = instrument is selected (regardless of text content like "FALSE")
  - Same rule applies to teaching subjects (מקצועות הוראה מעשי/עיוני) — non-white fill = selected
  - Text-based TRUTHY_VALUES should still work as fallback for non-Ministry files
- **Instrument abbreviation mapping:**
  - Strings: Vi=כינור, VL=ויולה, CH=צ'לו, CB=קונטרבס
  - Winds: FL=חליל, OB=אבוב, CL=קלרינט, BS=בסון, SX=סקסופון, HR=קרן, TR=חצוצרה, TB=טרומבון, BR=בריטון, TU=טובה
  - Keys: PI=פסנתר
  - Voice: VO=פיתוח קולי
  - Percussion: PC=פרקאשן, PP=כלי הקשה
  - Plucked: GI=גיטרה, GP=גיטרה חשמלית, BG=בגלמה, HP=נבל
  - Ethnic: UD=עוד, VM=VM, NA=NA, SI=SI, KA=KA (keep abbreviations as-is)
  - Folk: AK=AK, MN=MN (keep abbreviations as-is)
- If Ministry has instruments not in the existing 27, add them to the system
- Folk/ethnic instruments with unknown full names: import abbreviation as-is

### Teaching Hours Import
- Import ALL hour breakdown columns from Ministry file:
  - שעות הוראה (teaching hours)
  - ליווי פסנתר (accompaniment hours)
  - הרכב ביצוע (ensemble hours)
  - ריכוז הרכב (ensemble coordination hours)
  - תאוריה (theory hours)
  - ניהול (management hours)
  - ריכוז (coordination hours)
  - ביטול זמן (break time)
  - סה"כ ש"ש (total weekly hours)
- Schema must support saving this data — adjust backend if needed

### File Structure Guide
- Add file structure guide for teacher tab (currently only students have one)
- Use simplified column names (not raw Ministry names)
- Group columns by category: Personal / Professional / Hours
- Show ALL importable columns including instrument abbreviations and teaching subjects
- All fields are important — the guide communicates what the system can import

### Matching & Validation
- Keep existing 3-tier matching: email → ID number → name (priority order unchanged)
- When name matches multiple teachers, narrow down using ID or email from same row
- Strict Israeli ID validation when ID is present (9 digits, check digit)
- Missing ID is acceptable — don't block import
- Reuse Phase 24 header detection approach (scan rows 0-10, score by column matches) with teacher column names
- Same smart header detection pattern, just different column map

### Claude's Discretion
- Whether to switch import from `xlsx` to `exceljs` or add a parallel cell-style reader (Claude recommends exceljs)
- Exact schema structure for teaching hours storage
- How to handle the multi-row Ministry header (rows 6-10) within the existing detection framework
- Temporary password length (123456 vs 12345678) based on backend password requirements
- Loading/error states in the UI

</decisions>

<specifics>
## Specific Ideas

- Ministry teacher file reference: `/מידע/מורים - משרד החינוך.xlsx` — use this as the test case
- The file has rows 0-5 as metadata, rows 6-10 as multi-row headers, data starts at row 11
- Sheet name: `מצבת כח-אדם בהוראה`
- First data row example: teacher "סווטלנה אברהם", classification ממשיך, degree תואר שני, 15 years experience, Vi cell has blue fill (violin teacher)
- Screenshot reference: `/mnt/c/Users/yona2/Pictures/Screenshots/צילום מסך 2026-02-22 225656.png` — shows colored cell fills marking instruments
- "I want this data to be in the app after import — no partial data just because the app didn't know how to save it"
- Management role (רכזות) should be clearly connected as a sub-property of the teacher's role

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 25-ministry-excel-import-upgrade-teacher-import*
*Context gathered: 2026-02-22*
