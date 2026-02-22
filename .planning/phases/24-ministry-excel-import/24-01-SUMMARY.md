---
phase: 24-ministry-excel-import
plan: 01
subsystem: api
tags: [excel, xlsx, import, ministry, header-detection, parsing]

# Dependency graph
requires:
  - phase: backend-foundation
    provides: "import.service.js structure, INSTRUMENT_MAP from constants.js"
provides:
  - "Smart header detection for Ministry Excel files (scans rows 0-10)"
  - "Expanded column mappings for Ministry field variants"
  - "Department-to-instrument lookup and auto-assignment"
  - "Smart lessonDuration conversion (weekly hours vs direct minutes)"
affects: [24-02, 24-03, frontend-import-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Header row detection via scoring algorithm (max 10 rows scanned)"
    - "Smart numeric conversion based on value magnitude (>2.0 = minutes, <=2.0 = hours)"
    - "Department hint handling with auto-assignment for single-instrument departments"

key-files:
  created: []
  modified:
    - "/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/api/import/import.service.js"

key-decisions:
  - "Header detection scans max 10 rows (not entire sheet) for performance"
  - "Department columns with single instrument auto-assign, multiple instruments warn"
  - "lessonDuration >2.0 treated as direct minutes, <=2.0 as weekly hours (Ministry uses 0.75)"
  - "Combined 'כלי נשיפה' department maps to all woodwinds + brass (Ministry sometimes merges departments)"

patterns-established:
  - "parseExcelBufferWithHeaderDetection: two-pass parsing (raw scan → detect → re-parse with offset)"
  - "detectInstrumentColumns returns type: 'specific' | 'department' for different handling"
  - "readInstrumentMatrix returns { instruments, departmentHint } for downstream logic"

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 24 Plan 01: Ministry Excel Import Smart Parsing Summary

**Ministry Excel files with 3-6 metadata rows auto-detected, expanded column mappings (6 variants), department-to-instrument lookup with auto-assignment**

## Performance

- **Duration:** 6 minutes 5 seconds
- **Started:** 2026-02-22 (epoch: 1771764705)
- **Completed:** 2026-02-22
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Smart header detection: scans rows 0-10, scores by column name matches, detects header row in Ministry files with metadata
- Expanded STUDENT_COLUMN_MAP: 6 Ministry variants (שם ומשפחה, שעה נוספת ל.., המורה, זמן שעור, שלב, plus existing fields)
- DEPARTMENT_TO_INSTRUMENTS lookup: dynamically built from INSTRUMENT_MAP, includes combined כלי נשיפה (all winds)
- Department column recognition: detectInstrumentColumns identifies both specific instruments AND department names
- Smart lessonDuration conversion: values >2.0 treated as direct minutes (45 stays 45), <=2.0 treated as weekly hours (0.75 becomes 45)
- Auto-assignment logic: department columns with exactly 1 instrument auto-assign that instrument, multiple instruments produce warning
- Backward compatibility: standard Excel files with headers on row 0 continue to work (detectHeaderRow returns index 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add smart header detection + expand column mappings** - `3c5531d` (feat)
   - detectHeaderRow function (scans 10 rows, scores by column matches)
   - parseExcelBufferWithHeaderDetection (two-pass: raw scan → detect → re-parse)
   - Expanded STUDENT_COLUMN_MAP (6 Ministry variants)
   - DEPARTMENT_TO_INSTRUMENTS lookup (9 departments + combined כלי נשיפה)
   - Updated detectInstrumentColumns (handles specific + department types)
   - Updated readInstrumentMatrix (returns { instruments, departmentHint })
   - Smart lessonDuration conversion (>2.0 = minutes, <=2.0 = hours * 60)
   - Ministry field validation (ministryStageLevel א/ב/ג, age 3-99)
   - previewStudentImport department hint consumption (auto-assign or warn)
   - previewTeacherImport header detection (consistency)
   - headerRowIndex + matchedColumns in preview response

## Files Created/Modified
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/api/import/import.service.js` - Added smart header detection (detectHeaderRow, parseExcelBufferWithHeaderDetection), expanded column mappings (6 Ministry variants), department-to-instrument lookup (DEPARTMENT_TO_INSTRUMENTS built from INSTRUMENT_MAP), smart lessonDuration conversion (>2.0 = direct minutes, <=2.0 = weekly hours * 60), department hint auto-assignment logic, Ministry field validation (ministryStageLevel, age), preview response includes headerRowIndex and matchedColumns

## Decisions Made
- **Header detection range:** Scan max 10 rows (not entire sheet) for performance — Ministry files typically have 3-6 metadata rows
- **Department auto-assignment:** Single-instrument departments auto-assign (e.g., מקלדת → פסנתר), multi-instrument departments warn user (e.g., כלי קשת has 4 options)
- **lessonDuration heuristic:** >2.0 = direct minutes, <=2.0 = weekly hours — Ministry uses 0.75 (45 min lesson), some schools use 45 directly
- **Combined כלי נשיפה:** Ministry sometimes merges woodwinds + brass into single department column — mapped to all 11 wind instruments

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Backend import service now handles Ministry Excel files with:
- Auto-detection of header row (rows 0-10 scanned)
- Recognition of Ministry column name variants
- Department-to-instrument mapping with auto-assignment
- Smart conversion of weekly hours to duration minutes

Ready for Phase 24 Plan 02: Frontend import UI updates to display headerRowIndex, departmentHint warnings, and auto-assignment messages.

## Self-Check: PASSED

All claims verified:
- File exists: /mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend/api/import/import.service.js
- Commit exists: 3c5531d

---
*Phase: 24-ministry-excel-import*
*Completed: 2026-02-22*
