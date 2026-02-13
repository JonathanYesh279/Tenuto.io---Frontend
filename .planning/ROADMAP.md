# Roadmap: Tenuto.io Frontend — Cleanup & Polish (v1.1)

**Created:** 2026-02-13
**Phases:** 4
**Requirements:** 12 mapped

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Quick Fixes | Delete dead code, fix role mapping | CLN-01, CLN-02, AUTH-01 | 3 |
| 2 | Backend Instrument Sync | Align backend validation with frontend | DATA-01 | 2 |
| 3 | Audit Trail Page | Build admin audit UI with two tabs | AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04 | 5 |
| 4 | Ministry Reports Polish | Graceful degradation and UX improvements | RPT-01, RPT-02, RPT-03, RPT-04 | 4 |

---

## Phase 1: Quick Fixes

**Goal:** Remove dead code and fix role mapping gap

**Requirements:** CLN-01, CLN-02, AUTH-01

**Success Criteria:**
1. 10 demo/legacy files deleted from src/pages/ and src/components/
2. Barrel export cleaned (no StudentCalendarDemo reference)
3. `npm run build` passes clean with no broken imports
4. ensemble-director role recognized in ProtectedRoute roleMap

**Estimated effort:** Small (deletions + 1-line fix)

---

## Phase 2: Backend Instrument Sync

**Goal:** Backend accepts all 27 instruments that frontend offers

**Requirements:** DATA-01

**Success Criteria:**
1. Backend VALID_INSTRUMENTS array contains all 27 instruments from frontend validationUtils.ts
2. Existing 19 instruments unchanged (backward compatible)

**Estimated effort:** Small (one file in backend repo)

---

## Phase 3: Audit Trail Page

**Goal:** Admins can view deletion logs and past activities through a dedicated UI

**Requirements:** AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04

**Success Criteria:**
1. adminAuditService added to apiService.js with 4 endpoint methods
2. AuditTrail.tsx page renders with two tabs (Deletion Log, Past Activities)
3. Deletion Log tab has date range filter, entity type filter, paginated table
4. Past Activities tab has type filter, paginated table
5. Route added at /audit-trail with admin-only ProtectedRoute, sidebar nav item visible

**Estimated effort:** Medium (new page + API service + routing)

---

## Phase 4: Ministry Reports Polish

**Goal:** MinistryReports handles missing export endpoints gracefully with improved UX

**Requirements:** RPT-01, RPT-02, RPT-03, RPT-04

**Success Criteria:**
1. Page shows Hebrew warning banner when export endpoints return errors
2. Download/validate buttons disabled with visual indicator when endpoints unavailable
3. School year dropdown at top of page using schoolYearService.getAll()
4. Last updated timestamp displayed showing when data was last fetched

**Estimated effort:** Small-Medium (modifications to existing page)

---

## Dependency Graph

```
Phase 1 (Quick Fixes)
  └── no dependencies

Phase 2 (Backend Instrument Sync)
  └── no dependencies (different repo)

Phase 3 (Audit Trail Page)
  └── no dependencies

Phase 4 (Ministry Reports Polish)
  └── no dependencies
```

All phases are independent and could theoretically run in parallel, but sequential execution is recommended for clean commits and verification.

---
*Roadmap created: 2026-02-13*
*Last updated: 2026-02-13*
