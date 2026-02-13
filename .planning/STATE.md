# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Administrators can efficiently manage their conservatory
**Current focus:** Cleanup & Polish milestone

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-13 — Cleanup & Polish milestone started

## Accumulated Context

### From F1-F6 (completed before GSD)
- nameUtils created with getDisplayName(), getInitials()
- 85 files migrated from fullName to firstName/lastName
- Multi-tenant auth flow with tenant selection
- Teacher form has 7 tabs with ~20 fields
- Student form has studyYears + extraHour fields
- Orchestra form has subType + performanceLevel + coordinationHours
- Settings, MinistryReports, ImportData pages built
- Hours Summary tab, Dashboard hours cards, Super Admin toggle

### Known Issues
- 10 demo/legacy pages still in codebase (dead code)
- ProtectedRoute missing ensemble-director role mapping
- Backend VALID_INSTRUMENTS only accepts 19 (frontend has 27)
- MinistryReports calls non-existent export endpoints
- No audit trail UI despite 8 backend endpoints ready

---
*Last updated: 2026-02-13*
