---
phase: 4
plan: 1
status: complete
---

# Summary: Ministry Reports Polish

## What Was Done
- Added `endpointsAvailable` state to track export service availability
- Wrapped export API calls — if both `getStatus()` and `validate()` fail, sets `endpointsAvailable=false`
- Added Hebrew info banner: "שירות ייצוא אינו זמין עדיין" with explanation
- Download button disabled when endpoints unavailable, with explanatory text
- All data-dependent sections (completion bar, stats, missing data, errors, warnings, validation) guarded behind `endpointsAvailable`
- School year selector dropdown at top using `schoolYearService.getSchoolYears()`
- Auto-selects current year, marks it "(נוכחית)"
- Last updated timestamp in header showing time in Hebrew locale format
- Added `Clock` and `Info` icons from lucide-react

## Key Files Modified
- `src/pages/MinistryReports.tsx` — all changes in single file (+141/-43 lines)

## Deviations
None — implemented exactly as specified.

## Self-Check: PASSED
