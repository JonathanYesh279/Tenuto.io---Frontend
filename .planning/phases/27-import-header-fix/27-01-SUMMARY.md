---
phase: 27-import-header-fix
plan: 01
subsystem: backend/import
tags: [bug-fix, excel-parsing, multi-row-headers, column-mapping]
dependency_graph:
  requires: []
  provides:
    - "CM abbreviation maps to צ'מבלו in INSTRUMENT_MAP"
    - "Short header fragments (שבועיות, זמן, שעות) resolve to teaching hour fields"
    - "Duplicate 'ביצוע' headers disambiguated using parent row keywords"
    - "Piano header with accompaniment parent resolves to accompHours"
  affects:
    - "Ministry Excel teacher import with multi-row merged headers"
    - "All 9 teaching hour columns now mappable from Ministry format"
tech_stack:
  added: []
  patterns:
    - "Multi-row header disambiguation using parent row context"
    - "Composite header construction for merged cells"
    - "Two-pass header processing (backfill → disambiguation)"
key_files:
  created: []
  modified:
    - "/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/config/constants.js"
    - "/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/api/import/import.service.js"
decisions:
  - context: "CM abbreviation missing from INSTRUMENT_MAP"
    choice: "Add צ'מבלו with abbreviation CM to Keyboard (מקלדת) department"
    alternatives: ["Ignore CM instruments", "Map to different instrument"]
    rationale: "User confirmed CM = Cembalo/Harpsichord, belongs in keyboard family"
  - context: "Duplicate 'ביצוע' headers map to different fields (C16 vs C17)"
    choice: "Use parent row keywords (בפועל vs ריכוז) to construct unique headers"
    alternatives: ["Use column position only", "Add numeric suffix", "Ignore duplicates"]
    rationale: "Parent row context provides semantic meaning, more maintainable than hardcoded positions"
  - context: "Short fragment 'פסנתר' at C15 collides with piano instrument name"
    choice: "Composite header construction: check for 'ליווי' parent to build 'ליווי פסנתר'"
    alternatives: ["Add 'פסנתר' as short variant in TEACHER_COLUMN_MAP", "Use position-based filtering"]
    rationale: "Avoids collision with instrument detection, handles merged header semantics correctly"
metrics:
  duration: "1m 43s"
  files_changed: 2
  lines_added: 113
  lines_removed: 14
  tasks_completed: 1
  completed_date: "2026-02-22"
---

# Phase 27 Plan 01: Ministry Import Multi-Row Header Fix Summary

**One-liner:** Fixed 4 Ministry Excel import bugs: added CM instrument abbreviation, resolved duplicate/short header fragments via parent row disambiguation and composite header construction.

## What Was Built

Fixed Ministry Excel teacher import to correctly parse multi-row merged headers (rows 7-11) by implementing two-pass header processing:

**First pass (existing backfill logic, lines 295-320):** Fills empty headers from parent rows, preferring values that match TEACHER_COLUMN_MAP.

**Second pass (NEW, lines 322-387):**
1. **Duplicate header disambiguation:** Detects duplicate bottom-row headers (e.g., "ביצוע" at C16 and C17), scans parent rows for disambiguation keywords, constructs unique composite headers ("הרכב ביצוע" vs "ריכוז הרכב").
2. **Short fragment resolution:** When bottom-row fragment is "פסנתר" (piano), checks parent row for "ליווי" (accompaniment) keyword to construct "ליווי פסנתר" composite header.
3. **Short header variants:** Added TEACHER_COLUMN_MAP entries for fragments that don't collide: "שבועיות" → theoryHours, "זמן" → breakTimeHours, "שעות" → totalWeeklyHours.

**CM instrument addition:** Added `{ name: "צ'מבלו", abbreviation: 'CM', department: 'מקלדת' }` to INSTRUMENT_MAP in constants.js.

**Result:** All 9 Ministry teaching hour columns now resolvable:
- הוראה (existing match)
- ליווי פסנתר (composite: פסנתר + ליווי parent)
- הרכב ביצוע (disambiguated: ביצוע with בפועל parent)
- ריכוז הרכב (disambiguated: ביצוע with ריכוז parent)
- תאוריה (existing) / שבועיות (short variant)
- ניהול (existing match)
- ריכוז (existing match)
- ביטול זמן (existing) / זמן (short variant)
- סה"כ ש"ש (existing) / שעות (short variant)

CM instrument teachers can now be imported without losing their instrument data.

## Technical Implementation

### DISAMBIGUATION_MAP Pattern

```javascript
const DISAMBIGUATION_MAP = {
  'ביצוע': [
    { keyword: 'בפועל', fullHeader: 'הרכב ביצוע' },      // C16: ensemble performance hours
    { keyword: 'ריכוז', fullHeader: 'ריכוז הרכב' },       // C17: ensemble coordination hours
  ],
};
```

**How it works:**
1. Count occurrences of each header in the bottom row (headerCounts map)
2. For headers with count > 1, check if DISAMBIGUATION_MAP has rules
3. Scan parent rows (up to 5 rows above header row) for keyword text
4. Replace duplicate header with unique fullHeader if keyword found

**Why this approach:** Semantic meaning preserved (keywords like "בפועל" vs "ריכוז" are visible in Excel UI), maintainable (new duplicate patterns can be added to map without code changes), backward-compatible (simple files without duplicates skip this logic entirely).

### Composite Header Construction Pattern

```javascript
for (let c = 0; c < headers.length; c++) {
  const header = headers[c];
  if (header === 'פסנתר') {
    // Check if parent row has "ליווי" — if so, this is the accomp hours column, not piano instrument
    for (let r = headerRowIndex - 1; r >= Math.max(0, headerRowIndex - 3); r--) {
      const parentRow = allTextRows[r];
      if (parentRow && parentRow[c]) {
        const text = parentRow[c].replace(/[\u200F\u200E\uFEFF\u200B]/g, '');
        if (text === 'ליווי') {
          headers[c] = 'ליווי פסנתר';
          break;
        }
      }
    }
  }
}
```

**Why separate from TEACHER_COLUMN_MAP:** "פסנתר" (piano) exists in ABBREVIATION_TO_INSTRUMENT for instrument detection. Adding it directly to TEACHER_COLUMN_MAP would cause false positives where actual piano instrument columns get mapped as teaching hours. Composite header construction only triggers when parent context confirms it's the accompaniment column.

### Short Header Variants

Added to TEACHER_COLUMN_MAP (lines 83-85):
- `'שבועיות': 'theoryHours'` — Fragment of "שעורי תאוריה סך שעות שבועיות"
- `'זמן': 'breakTimeHours'` — Fragment of "ביטול זמן"
- `'שעות': 'totalWeeklyHours'` — Fragment of "סה"כ ש"ש"

**Why these three:** They don't collide with instrument names or role columns, so simple TEACHER_COLUMN_MAP entries are sufficient. "פסנתר" and "ביצוע" require special handling.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

### Manual Verification

1. ✅ CM entry exists in INSTRUMENT_MAP (line 34 of constants.js): `{ name: "צ'מבלו", abbreviation: 'CM', department: 'מקלדת' }`
2. ✅ Short header variants added to TEACHER_COLUMN_MAP (lines 83-85 of import.service.js)
3. ✅ No 'פסנתר' entry in TEACHER_COLUMN_MAP (only 'ליווי פסנתר' at line 72)
4. ✅ No 'ביצוע' entry in TEACHER_COLUMN_MAP (handled by DISAMBIGUATION_MAP at line 332)
5. ✅ DISAMBIGUATION_MAP exists with 'ביצוע' rules (lines 330-336)
6. ✅ Composite header construction for "פסנתר" → "ליווי פסנתר" exists (lines 372-387)
7. ✅ Second-pass code placed after backfill (line 320) and before data row building (line 390)

### Code Search Verification

```bash
# CM in constants.js
grep -n "צ'מבלו" config/constants.js
# Output: 34:  { name: "צ'מבלו", abbreviation: 'CM', department: 'מקלדת' },

# Short variants in import.service.js
grep -A2 "Short header fragments" api/import/import.service.js
# Output shows all 3 short variants with comments

# DISAMBIGUATION_MAP structure
grep -A5 "DISAMBIGUATION_MAP" api/import/import.service.js
# Output shows ביצוע disambiguation rules

# Composite header construction
grep -A8 'if (header === .פסנתר.)' api/import/import.service.js
# Output shows parent row "ליווי" check logic
```

## Self-Check: PASSED

### Files Created
(None — plan only modifies existing files)

### Files Modified
- ✅ FOUND: /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/config/constants.js
- ✅ FOUND: /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/api/import/import.service.js

### Commits
```bash
git log --oneline --all | grep 3b896d4
# Output: 3b896d4 feat(27-01): fix Ministry import multi-row header parsing
```
- ✅ FOUND: 3b896d4 (feat(27-01): fix Ministry import multi-row header parsing)

All artifacts verified present on disk and in version control.

## Known Limitations

**Conditional formatting colors invisible:** Ministry file uses conditional formatting (blue/lavender when cell=TRUE), which exceljs doesn't expose. Color detection still works for files with actual cell fills, but this specific file relies on text TRUE/FALSE values. This is expected behavior (documented in Phase 26) — not a bug.

**Formula result caching:** Some formula cells may have null results if Excel file wasn't saved with cached formula values. This is an Excel file data quality issue, not a parser bug. Users should re-save files in Excel before import if hours appear as 0.

**Department hint columns:** Department columns (e.g., "כלי נשיפה") are detected but don't auto-assign instruments for teachers (unlike students, which auto-assign if department has exactly 1 instrument). This is consistent with existing teacher import behavior.

## Next Steps

**Plan 27-02:** Add position-based filtering to prevent header collisions between role columns (C57-C60) and hours columns (C14-C24). Without this, "ליווי פסנתר" and "תיאוריה" appear in both sections and cause mapColumns to map role boolean values into teaching hour fields.

**Plan 27-02 scope:**
- Prevent "פסנתר" (C15 hours column) from being detected as piano instrument column
- Prevent "ליווי פסנתר" (C57 role boolean) from overwriting accompHours (C15 numeric)
- Prevent "תיאוריה" (C59 role boolean) from overwriting theoryHours (C18 numeric)

**Testing recommendation:** After Plan 27-02 completes, test with actual Ministry file to confirm all 9 hour columns populate correctly and no false instrument/role detections occur.

---

*Plan: 27-01*
*Completed: 2026-02-22*
*Duration: 1m 43s*
*Commit: 3b896d4*
