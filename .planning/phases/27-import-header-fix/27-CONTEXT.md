# Phase 27: Ministry Import Fix — Multi-Row Headers & Column Mapping - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 6 bugs in the Ministry Excel teacher import that prevent instruments, teaching hours, and roles from being correctly read. All issues stem from the Ministry file's multi-row merged header structure — short header fragments don't match TEACHER_COLUMN_MAP keys, and role boolean columns collide with hours columns.

Backend only — `import.service.js` and `config/constants.js`. No frontend changes needed.

</domain>

<decisions>
## Implementation Decisions

### Bug 1: Multi-Row Header Fragments Don't Match Column Map

**Root cause:** Ministry file has merged headers across rows 7-11. Only the bottom row (11) has short fragments like "פסנתר" (should be "ליווי פסנתר"), "ביצוע" (should be "הרכב ביצוע"), "שבועיות" (should be "תאוריה"), "זמן" (should be "ביטול זמן"), "שעות" (should be "סה"כ ש"ש").

**Fix:** Add short header variants to TEACHER_COLUMN_MAP:
- `"פסנתר"` → `accompHours` (BUT see Bug 3 — collision with piano instrument name)
- `"ביצוע"` → `ensembleHours` (first occurrence) / `ensembleCoordHours` (second — duplicate header issue)
- `"שבועיות"` → `theoryHours`
- `"זמן"` → `breakTimeHours`
- `"שעות"` → `totalWeeklyHours`

**Duplicate "ביצוע" headers at C16 and C17:** The same text maps to different fields (ensemble performance hours vs ensemble coordination hours). Need positional disambiguation or parent-row context to tell them apart.

**Evidence:** Headers at indices [15] and [16] are both "ביצוע". Parent rows show: Row 9 C16="ש"ש בפועל" (actual), C17="ש"ש ריכוז" (coordination). Use parent row text to construct composite headers.

### Bug 2: Header Collision — Role Columns vs Hours Columns

**Root cause:** "ליווי פסנתר" (C57) and "תיאוריה" (C59) are role boolean columns (true/false), but they ALSO exist in TEACHER_COLUMN_MAP as hours fields. When mapColumns runs, the role column's "false" value gets mapped as accompHours/theoryHours, overwriting actual hour values.

**Fix:** Disambiguate by position or column context. Role columns (C57-C60) contain booleans; hours columns (C14-C22) contain numbers/formulas. Approach options:
1. Use the `headerColMap` to distinguish: if a header maps to an hours field AND the column index is in the role section (>C56), skip it in mapColumns
2. Or: separate the role detection from the column mapping step entirely — read roles from their dedicated columns, don't let them enter TEACHER_COLUMN_MAP
3. Or: rename the role column headers during backfill to avoid collision (e.g., prefix with "role:")

### Bug 3: "פסנתר" Treated as Instrument Column

**Root cause:** Header "פסנתר" at C15 (actually accomp hours column) matches ABBREVIATION_TO_INSTRUMENT["פסנתר"] = "פסנתר" (piano). So detectInstrumentColumns treats it as an instrument column.

**Fix:** The instrument column detection should only look at the instrument section (columns after the role/personal info section), OR exclude known TEACHER_COLUMN_MAP headers from instrument detection.

### Bug 4: Missing Abbreviation CM

**Root cause:** The file has 32 instrument abbreviations (C25-C56). CM is at C40 (in "מחלקות כלים" department) but is NOT in INSTRUMENT_MAP.

**Fix:** Add `{ name: "צ'מבלו", abbreviation: 'CM', department: 'מקלדת' }` to INSTRUMENT_MAP in `config/constants.js`. User confirmed CM = צ'מבלו (Cembalo/Harpsichord).

### Bug 5: Cell Fill Colors Are Conditional Formatting

**Root cause:** The blue/lavender colors visible in Excel come from **conditional formatting** (applied when cell value = TRUE), NOT from actual cell fills. All cells have the same fill: `{indexed:9}` (white). So `isColoredCell()` correctly returns false for all cells.

**Impact:** Color detection cannot work for this file. Detection relies entirely on text TRUE/FALSE values, which DO work (TRUTHY_VALUES includes "true"). No fix needed for instrument/role detection itself — but the isColoredCell function should be aware that conditional formatting is invisible to exceljs.

**Decision:** Keep current color detection as-is (works for files with actual fills). Add "true"/"TRUE"/"True"/"false"/"FALSE" documentation to clarify the dual detection approach. No code change needed for this specific bug.

### Bug 6: Formula Cells with Null Results

**Root cause:** Hours columns (C14 "הוראה") contain shared formulas like `{sharedFormula: "N12", result: 19.25}`. The parser correctly extracts the `result` property. However, some cells may have `null` results (formulas not cached when file was last saved).

**Impact:** For Maya, teachingHours=19.25 IS correctly parsed. But other cells with stale/null formula results produce empty strings. This is an Excel file issue, not a parser bug.

**Decision:** No code change needed. If formula results are null, the parser correctly skips them (empty string → excluded from parseTeachingHours).

### Claude's Discretion
- Exact implementation approach for disambiguating duplicate "ביצוע" headers (composite header construction vs positional detection)
- Whether to exclude instrument detection from TEACHER_COLUMN_MAP headers by position or by name
- Error handling for edge cases (malformed headers, missing parent rows)

</decisions>

<specifics>
## Specific Details

### Ministry File Structure (from diagnostic)
- **File:** `מורים - משרד החינוך.xlsx`
- **Sheet:** `מצבת כח-אדם בהוראה`
- **Header area:** Rows 7-11 (5 merged rows), data starts row 12
- **Header detection selects:** Index 8 (Row 11) with 13 matches against TEACHER_COLUMN_MAP
- **Total data rows:** 127 teachers

### Column Layout (Row 11 headers)
```
C2: קוד | C3: משפחה | C4: פרטי | C5: ת.ז. | C6: לידה | C7: סיווג | C8: תואר
C9: כן-לא | C10: מס' שנים | C11: חבר/ה | C12: טלפון | C13: דוא"ל
C14: הוראה | C15: פסנתר | C16: ביצוע | C17: ביצוע | C18: שבועיות
C19: תיאור תפקיד | C20: ריכוז | C21: זמן | C22: שעות
C23: שם ומשפחה | C24: מס"ד
C25-C55: Instrument abbreviations (Vi VL CH CB FL OB CL BS SX HR TR TB BR TU PI CM RE VO PC PP GI GP BG HP UD VM NA SI KA AK MN)
C56: אחר
C57: ליווי פסנתר | C58: ניצוח | C59: תיאוריה | C60: הלחנה
```

### Multi-Row Header Reconstruction (from parent rows)
- C15: Row 11 "פסנתר" ← Row 10 "ליווי" ← Row 9 "ש"ש" ← Row 7 "שעות הוראה" → **full: "שעות הוראה ש"ש ליווי פסנתר"** (accomp hours)
- C16: Row 11 "ביצוע" ← Row 10 "להרכב" ← Row 9 "ש"ש בפועל" ← Row 7 "הנחייה וניצוח הרכבי ביצוע" → **full: ensemble performance hours**
- C17: Row 11 "ביצוע" ← Row 10 "להרכב" ← Row 9 "ש"ש ריכוז" ← Row 7 "הנחייה וניצוח הרכבי ביצוע" → **full: ensemble coordination hours**
- C18: Row 11 "שבועיות" ← Row 10 "שעות" ← Row 9 "סך" ← Row 8 "תאוריה" ← Row 7 "שעורי" → **full: theory weekly hours**

### Diagnostic Script References
- `/tmp/diagnose-excel.js` — Raw cell dump
- `/tmp/diagnose3.js` — Full import simulation (confirms instruments detect correctly)
- `/tmp/diagnose4.js` — Header duplicate analysis

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 27-import-header-fix*
*Context gathered: 2026-02-23*
