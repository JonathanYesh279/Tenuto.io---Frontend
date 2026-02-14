# Tenuto.io Frontend — Claude Code Instructions

## First Thing Every Session

Read the implementation guide (local copy):
`.claude/FRONTEND_IMPLEMENTATION_GUIDE.md`

This guide contains the complete specification of what needs to change in this frontend, including:
- All API changes (new endpoints, changed responses)
- All schema changes (fullName → firstName/lastName, new fields, new enums)
- New pages to build (Ministry Reports, Import, Settings)
- TypeScript interface updates
- Form updates (teacher: 4 new tabs, student: 2 new fields, orchestra: 3 new fields)
- 27-instrument list (currently 19) with department grouping
- Implementation phases (F1-F6) in priority order

## Related Repositories

- **Backend:** `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend` (Node.js + Express + MongoDB)
- **Backend is COMPLETE** — all API endpoints are live and tested. Frontend needs to catch up.
- When unsure about an API response shape or endpoint, check the backend route/controller/service files directly.

## Commit Workflow (MANDATORY)

After completing each phase, sub-phase, or significant batch of changes:

1. **Stop and commit.** Do NOT let uncommitted work accumulate across multiple phases.
2. Stage the relevant files with `git add` (specific files, not `-A`).
3. Write a concise commit message describing what was done.
4. **Tell the user: "Ready to push — run `git push origin main` from Windows."**
5. Wait for confirmation before continuing to the next task.

The user works on Windows and must push manually. Never run `git push` yourself.

## CI Pipeline Maintenance (MANDATORY)

After each phase or significant change, review `.github/workflows/ci.yml` and enable or update stages:
- **Check if a previously disabled stage can now be enabled** (e.g., typecheck after fixing TS errors, tests after writing test suite)
- **Fix case-sensitivity issues** — Linux CI is case-sensitive, Windows is not. Always match exact filenames in imports.
- **Update the `needs` dependencies** in deploy stages as new quality gates become active.
- The pipeline has 6 progressive stages: Build → TypeScript → Lint → Tests → Deploy Staging → Deploy Production. Each has a GATE comment explaining when to enable it.

## Memory System

Maintain persistent notes in your auto memory directory. Record:
- What phases/files you've completed
- Patterns that worked well in this codebase
- Gotchas and mistakes to avoid
- Current progress through the implementation phases

## Key Frontend Patterns

- **API layer:** `src/services/apiService.js` (~5200 lines) — ALL HTTP communication in one file
- **Auth:** `src/services/authContext.jsx` — React Context with localStorage tokens
- **Forms:** React Hook Form + Zod + custom components (NOT Formik)
- **State:** React Context (auth, school year, bagrut) + Zustand (cascade deletion) + React Query
- **Styling:** Tailwind CSS, RTL-first, hardcoded Hebrew (no i18n library)
- **Routing:** React Router v6 in `src/App.tsx`
- **Feature modules:** `src/features/[module]/details/` with tabs pattern
- **Validation constants:** `src/utils/validationUtils.ts`
- **Table component:** `src/components/ui/Table.tsx`

## Implementation Status

- [x] **F1: Foundation** — nameUtils, TypeScript interfaces, instruments (19→27), enums, API services
- [x] **F2: fullName Migration** — 85 files migrated to getDisplayName(), backward-compat fullName kept
- [x] **F3: Auth Flow** — Multi-tenant login with tenant selection implemented
- [x] **F4: Form Updates** — Teacher form has 7 tabs (~20 fields), Student form has 2 new fields, Orchestra form has 3 new fields
- [x] **F5: New Pages** — Ministry Reports, Import, and Settings pages built (admin-only)
- [x] **F6: Polish** — Hours Summary tab, Dashboard hours cards, Super Admin toggle

**For current progress and ongoing work, see `.planning/STATE.md`**
