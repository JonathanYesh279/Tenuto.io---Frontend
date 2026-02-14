# Tenuto.io Frontend

## What This Is

A React-based management application for conservatories (music schools) in Israel. Manages teachers, students, orchestras, lessons, and administrative workflows. Multi-tenant SaaS with Hebrew RTL interface. Backend is complete; frontend catches up iteratively.

## Core Value

Administrators can efficiently manage their conservatory's teachers, students, orchestras, and scheduling — with accurate hours tracking for ministry reporting.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- [x] **F1: Foundation** — nameUtils, TypeScript interfaces, instruments (19->27), enums, API services
- [x] **F2: fullName Migration** — 85 files migrated to getDisplayName(), backward-compat kept
- [x] **F3: Auth Flow** — Multi-tenant login with tenant selection
- [x] **F4: Form Updates** — Teacher 7 tabs (~20 fields), Student 2 fields, Orchestra 3 fields
- [x] **F5: New Pages** — Settings, MinistryReports, ImportData (3 admin-only pages)
- [x] **F6: Polish** — Hours Summary tab, Dashboard hours cards, Admin hours overview, Super Admin toggle

### Out of Scope

<!-- Explicit boundaries. -->

- Multi-tenant admin features beyond current — defer to next milestone
- i18n / English translation — Hebrew-only for now
- Mobile app — web-first
- Real-time notifications — not needed yet

## Context

- **Backend:** Complete at `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend` — all API endpoints live
- **Tech stack:** React 18 + TypeScript + Vite + Tailwind CSS + React Hook Form + Zod + React Query
- **Patterns:** RTL-first, Hebrew hardcoded, feature modules at `src/features/[module]/details/`
- **CI:** GitHub Actions pipeline with 6 progressive stages (Build -> TypeScript -> Lint -> Tests -> Deploy)
- **Codebase map:** `.planning/codebase/` (7 documents)

## Constraints

- **Git workflow**: Never run `git push` — user pushes from Windows
- **Case sensitivity**: Linux CI is case-sensitive, Windows is not — always match exact filenames
- **Export endpoints**: `/api/export/status`, `/validate`, `/download` don't exist yet on backend

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Hook Form + Zod over Formik | Better TypeScript support, smaller bundle | ✓ Good |
| Single apiService.js file (~5200 lines) | Centralized HTTP layer, easy to find endpoints | ⚠️ Revisit (large file) |
| Hebrew hardcoded (no i18n) | Single-market product, reduces complexity | ✓ Good |
| Feature-based module structure | Clean separation of concerns per entity | ✓ Good |
| Backward-compat fullName fallbacks | Smooth transition, no data migration needed | ✓ Good |

---
*Last updated: 2026-02-14*
