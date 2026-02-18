# Tenuto.io Frontend

## What This Is

A React-based management application for conservatories (music schools) in Israel. Manages teachers, students, orchestras, lessons, and administrative workflows. Multi-tenant SaaS with Hebrew RTL interface. Features a warm, Monday.com-inspired design system built on shadcn/ui with music school branding. Frontend is feature-complete through v2.0; backend is complete.

## Core Value

Administrators can efficiently manage their conservatory's teachers, students, orchestras, and scheduling — with accurate hours tracking for ministry reporting.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ **F1: Foundation** — nameUtils, TypeScript interfaces, instruments (19->27), enums, API services — v1.0
- ✓ **F2: fullName Migration** — 85 files migrated to getDisplayName(), backward-compat kept — v1.0
- ✓ **F3: Auth Flow** — Multi-tenant login with tenant selection — v1.0
- ✓ **F4: Form Updates** — Teacher 7 tabs (~20 fields), Student 2 fields, Orchestra 3 fields — v1.0
- ✓ **F5: New Pages** — Settings, MinistryReports, ImportData (3 admin-only pages) — v1.0
- ✓ **F6: Polish** — Hours Summary tab, Dashboard hours cards, Admin hours overview, Super Admin toggle — v1.0
- ✓ **v1.1 Cleanup** — Dead code removal, role mapping fix, instrument sync, audit trail UI, MinistryReports polish, .claude ecosystem cleanup — v1.1
- ✓ **v2.0 Design System** — CSS design token system, warm coral palette, Heebo font, Radix DirectionProvider — v2.0
- ✓ **v2.0 Component Library** — 9 shadcn/ui primitives (Dialog, Tabs, DropdownMenu, Badge, etc.) with RTL keyboard nav — v2.0
- ✓ **v2.0 Domain Components** — InstrumentBadge, StatusBadge, AvatarInitials, EmptyState, ErrorState, Skeleton loaders — v2.0
- ✓ **v2.0 Form Migration** — FormField wrapper, all 3 entity forms migrated to shadcn with RHF data persistence — v2.0
- ✓ **v2.0 List Pages** — Sticky-header tables, warm hover, SearchInput, contextual Pagination, 5 pages redesigned — v2.0
- ✓ **v2.0 Detail Pages** — Gradient headers, deterministic avatar colors, breadcrumbs, tab fade transitions — v2.0
- ✓ **v2.0 Layout & Dashboard** — Dark warm sidebar, personalized greeting, warm StatsCards, music identity — v2.0
- ✓ **v2.0 Special Pages** — Auth warm branding, StepProgress, print styles, RTL-correct toast system — v2.0

### Active — v2.1 Production-Grade Visual Identity

<!-- Current scope. Building toward these. -->

- [ ] Surface hierarchy rethink — distinct elevation zones for sidebar, header, and content areas
- [ ] Evolved color system — coral as accent (not dominant), deeper neutrals, broader expressive palette
- [ ] Confident typography scale — bold headings, tight UI text, deliberate spacing rhythm
- [ ] Selective information density — dense data pages (tables/lists), breathing room on forms/details
- [ ] Dynamic micro-interactions — spring-based animations, staggered lists, powerful modern SaaS feel
- [ ] Stronger section contrast — clear visual separation between layout zones

### Out of Scope

<!-- Explicit boundaries. -->

- i18n / English translation — Hebrew-only for now
- Mobile app — web-first
- Real-time notifications — not needed yet
- Backend export endpoints — not yet implemented on backend side
- Dark mode — Hebrew fonts not dark-mode tested, warm identity works against it
- Animated charts/data viz — no active chart usage yet

## Context

- **Backend:** Complete at `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend` — all API endpoints live
- **Tech stack:** React 18 + TypeScript + Vite + Tailwind CSS + React Hook Form + Zod + React Query
- **Design stack:** shadcn/ui + Radix UI primitives + Tailwind CSS + Framer Motion (AnimatePresence)
- **Patterns:** RTL-first, Hebrew hardcoded, feature modules at `src/features/[module]/details/`
- **CI:** GitHub Actions pipeline with 6 progressive stages (Build -> TypeScript -> Lint -> Tests -> Deploy)
- **Codebase map:** `.planning/codebase/` (7 documents)
- **Shipped:** v2.0 (2026-02-18) — full UI/UX redesign with warm music school identity
- **Known tech debt:** Pre-existing TypeScript errors in 6 utility files (bagrutMigration, cascadeErrorHandler, errorRecovery, memoryManager, performanceEnhancements, securityUtils) — unrelated to UI, blocks CI typecheck stage
- **WSL constraint:** npm install on NTFS mount causes EIO errors — build verification from Windows PowerShell or CI only

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
| Single source of truth for progress | STATE.md canonical, MEMORY.md references it | ✓ Good (v1.1) |
| .claude/ARCHITECTURE.md for config map | Documents 13 configuration layers and skills | ✓ Good (v1.1) |
| shadcn/ui + warm coral identity | Monday.com warmth, polished components, RTL-native | ✓ Good (v2.0) |
| shadcn primitives written manually (not CLI) | WSL2+NTFS EIO errors prevent CLI install; manual produces identical output | ✓ Good (v2.0) |
| AnimatePresence + conditional render for tabs | Avoids hidden-panel DOM accumulation from Radix TabsContent | ✓ Good (v2.0) |
| Layout/Dashboard redesigned last (Phase 12) | Highest regression risk — proved correct with proven visual system | ✓ Good (v2.0) |
| Modal migration atomic (Phase 7) | All 4 custom modal variants replaced at once — clean transition | ✓ Good (v2.0) |

---
*Last updated: 2026-02-18 after v2.1 milestone started*
