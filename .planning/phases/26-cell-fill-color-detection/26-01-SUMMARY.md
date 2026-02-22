---
phase: 26-cell-fill-color-detection
plan: 01
subsystem: backend-import
tags: [excel-parsing, cell-styles, ministry-format, exceljs]
completed: 2026-02-22

dependency-graph:
  requires: [phase-25]
  provides: [cell-fill-color-detection, exceljs-parsing]
  affects: [teacher-import, student-import, instrument-detection, role-detection]

tech-stack:
  added: [exceljs]
  removed: [xlsx]
  patterns: [async-excel-parsing, cell-style-detection, color-first-text-fallback]

key-files:
  created: []
  modified:
    - /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/api/import/import.service.js

decisions:
  - Switch from xlsx to exceljs for cell style reading
  - Color detection first, text fallback second (Ministry files use colored cells)
  - Any non-white/non-transparent fill counts as "selected"
  - Removed unused parseExcelBuffer function and xlsx import
  - Parallel cellRows array preserves cell objects for style access

metrics:
  duration: 220s
  tasks: 2
  commits: 2
  files_modified: 1
---

# Phase 26 Plan 01: Cell Fill Color Detection for Import Summary

**Switched Excel parsing from `xlsx` (text-only) to `exceljs` (reads cell styles) enabling Ministry instrument and role columns marked by cell background fill color to be correctly detected.**

## Tasks Completed

### Task 1: Rewrite parseExcelBufferWithHeaderDetection to use exceljs and add isColoredCell helper
- Replaced `import XLSX from 'xlsx'` with `import ExcelJS from 'exceljs'`
- Added `isColoredCell(fill)` helper function checking for non-white/non-transparent fills
- Rewrote `parseExcelBufferWithHeaderDetection` to async using `workbook.xlsx.load(buffer)`
- Returns `{ rows, cellRows, headerColMap, headerRowIndex, matchedColumns, sheetNames }`
- `cellRows` is parallel array of exceljs Cell objects for style access
- `headerColMap` maps header names to column indices
- Removed unused `parseExcelBuffer` function and `xlsx` import
- **Commit:** 142879d

### Task 2: Update matrix readers for cell fill detection and propagate async to all callers
- Updated `readInstrumentMatrix` to accept 4 params: `(row, instrumentColumns, cellRow, headerColMap)`
- Updated `readRoleMatrix` to accept 4 params: `(row, roleColumns, cellRow, headerColMap)`
- Both matrix readers check `isColoredCell(cell.fill)` FIRST, then `TRUTHY_VALUES.includes(textValue)` as fallback
- `previewTeacherImport` awaits the async parse and passes `cellRows[i]` + `headerColMap`
- `previewStudentImport` awaits the async parse and passes `cellRows[i]` + `headerColMap`
- **Commit:** e0a79c3

## Verification Results

**Structural checks:**
- ✅ `import ExcelJS from 'exceljs'` present (line 13)
- ✅ `isColoredCell` function defined (line 134)
- ✅ `parseExcelBufferWithHeaderDetection` is async and uses `workbook.xlsx.load(buffer)`
- ✅ No `import XLSX` found (removed)

**Color detection path:**
- ✅ `readInstrumentMatrix` calls `isColoredCell(cell.fill)` before `TRUTHY_VALUES`
- ✅ `readRoleMatrix` calls `isColoredCell(cell.fill)` before `TRUTHY_VALUES`

**Async propagation:**
- ✅ `previewTeacherImport` awaits `parseExcelBufferWithHeaderDetection`
- ✅ `previewStudentImport` awaits `parseExcelBufferWithHeaderDetection`

**Backward compatibility:**
- ✅ `TRUTHY_VALUES` still defined and used as fallback in both matrix readers
- ✅ `mapColumns()` still works (receives same `row` object shape)
- ✅ `detectInstrumentColumns()` and `detectRoleColumns()` unchanged

**Module loads:**
- ✅ `node -e "import('./api/import/import.service.js').then(() => console.log('OK'))"` succeeds
- ✅ Exports verified: `['previewTeacherImport', 'previewStudentImport', 'executeImport']`

## Deviations from Plan

None — plan executed exactly as written.

## Impact

**Ministry Excel files:**
- Instrument abbreviation columns (Vi, VL, CH, FL, etc.) with colored cell fills now detect as "selected"
- Teaching subject/role columns (מקצועות הוראה מעשי/עיוני) with colored fills now detect as "selected"
- Cells with text "FALSE" but colored fill correctly detected as selected (color wins over text)

**Non-Ministry files:**
- Text-based TRUTHY_VALUES still works as fallback for files using V, x, 1, כן markers
- No regressions in existing import functionality

**Both teacher AND student import benefit from cell fill detection** (student department columns also use fills in Ministry format).

## Technical Notes

**Cell fill detection logic:**
- Ministry files use lavender/blue backgrounds to mark selected items
- `isColoredCell` checks `fill.type === 'pattern'` and `fgColor.argb` not in `['FFFFFFFF', '00FFFFFF', 'FFFFFF', '00000000']`
- Gradient fills also count as colored
- Black fills (FF000000) correctly count as selected (not excluded from NO_COLOR list)

**Data flow integrity:**
- `rows[i]` and `cellRows[i]` are parallel arrays (same index) built together in parse function
- `headerColMap` maps header string to column index matching `cellRows` column positions
- Rich text values (exceljs `{ richText: [...] }`) flattened to plain strings

## Self-Check

**Files created:** None (backend-only change)

**Files modified:**
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/api/import/import.service.js` — ✅ EXISTS

**Commits:**
- 142879d — ✅ EXISTS (Task 1: exceljs parsing + isColoredCell helper)
- e0a79c3 — ✅ EXISTS (Task 2: matrix readers + async propagation)

**Self-Check: PASSED**

---

*Completed: 2026-02-22*
*Duration: 3m 40s*
*Commits: 142879d, e0a79c3*
