# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Administrators can efficiently manage their conservatory
**Current focus:** v2.0 Phase 13 — Special Pages (next)

## Current Position

Phase: 12 of 13 ([v2.0] Layout & Dashboard) — COMPLETE (verified)
Plan: 2 of 2 in current phase — COMPLETE
Status: Phase 12 verified (13/13 must-haves passed after gap fix). Ready for Phase 13.
Last activity: 2026-02-18 — Phase 12 execution complete + verified

Progress: [█████████░] 88% (v2.0) — [██████████] 100% (v1.1 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 22 (7 v1.1 + 15 v2.0)
- Average duration: ~15 min
- Total execution time: ~5.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| v1.1 Phases 1-5 | 7 | ~3.5h | ~30 min |
| v2.0 Phase 6 Plan 1 | 1 | 8min | 8 min |
| v2.0 Phase 6 Plan 2 | 1 | 3min | 3 min |
| v2.0 Phase 7 Plan 1 | 1 | 117min | 117 min |
| v2.0 Phase 7 Plan 2 | 1 | 6min | 6 min |
| v2.0 Phase 8 Plan 1 | 1 | 10min | 10 min |
| v2.0 Phase 8 Plan 2 | 1 | 3min | 3 min |
| v2.0 Phase 8 Plan 3 | 1 | 2min | 2 min |
| v2.0 Phase 9 Plan 1 | 1 | 3min | 3 min |
| v2.0 Phase 9 Plan 2 | 1 | 7min | 7 min |
| v2.0 Phase 9 Plan 3 | 1 | 6min | 6 min |
| v2.0 Phase 10 Plan 1 | 1 | 8min | 8 min |
| v2.0 Phase 10 Plan 2 | 1 | 3min | 3 min |
| v2.0 Phase 11 Plan 1 | 1 | 4min | 4 min |
| v2.0 Phase 11 Plan 2 | 1 | 2min | 2 min |
| v2.0 Phase 12 Plan 1 | 1 | 3min | 3 min |
| v2.0 Phase 12 Plan 2 | 1 | 3min | 3 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

- [v2.0]: shadcn/ui selected as component library (Radix-based, Tailwind-compatible)
- [v2.0]: Monday.com-inspired warm aesthetic (amber/coral primary, not default blue)
- [v2.0]: Foundation phase must be zero visible change — infrastructure only
- [v2.0]: Layout shell (Phase 12) redesigned LAST — highest regression risk
- [v2.0]: Modal migration atomic — all 4 custom modal variants replaced in Phase 7
- [06-01]: Warm coral primary --primary: 15 85% 45% (WCAG AA 4.57:1 against white)
- [06-01]: Merge not replace — DEFAULT/foreground added to existing primary/secondary Tailwind scales — bg-primary-500 still resolves to #4F46E5 hex
- [06-01]: Heebo replaces Inter as primary UI font; Reisinger Yonatan kept as @font-face fallback
- [06-01]: CSS token format — HSL channels only in :root (no hsl() wrapper), wrapper only in JS/tailwind config
- [06-02]: Native <option> !important kept with TODO(Phase 7) — browser controls option rendering; Phase 7 replaces native select with shadcn Select
- [06-02]: Responsive display toggle !important kept with TODO(Phase 7) — override inline styles; Phase 7 migrates to shadcn Tabs
- [06-02]: RTL [dir="rtl"] override block pattern deprecated — merge into base selector since app is always RTL (dir=rtl on html)
- [06-02]: Animation standard established — 100-200ms ease-out for modals/toasts/tabs; no decorative infinite animations (pulse-soft removed)
- [07-01]: shadcn primitives written manually (not via CLI) — WSL2+NTFS EIO errors prevent npm install in CLI; manual writing produces identical output
- [07-01]: progress.tsx overwritten with Radix-based version — bg-primary CSS var replaces bg-primary-600 palette class for token consistency
- [07-01]: Modal.tsx backward-compat wrapper — isOpen/onClose API preserved; individual callsite migration deferred to Plan 07-02
- [07-01]: ConfirmDeleteDialog destructive button first in JSX — RTL places it visually on the right (prominent = correct for danger action)
- [07-02]: Student bagrut tab added to StudentDetailsPage — original tabs array omitted it despite working BagrutTab component
- [07-02]: ConfirmationModal warning/info → Button variant="default" — shadcn Button has no yellow/blue semantic variant; defer to Phase 9
- [07-02]: Dead tab navigation files preserved on disk — barrel exports removed but files not deleted (reference value)
- [08-01]: StatsCard is a re-export of dashboard/StatCard — no duplicate implementation
- [08-01]: DesignSystem.tsx StatusBadge/InstrumentBadge left untouched — Phase 10 handles callsite migration
- [08-01]: Skeleton uses bg-muted CSS token (not bg-gray-200) — consistent with CSS variable system
- [08-02]: EmptyState uses shadcn Button — consistent with Phase 7 design system
- [08-02]: ErrorState uses text-destructive CSS var — not text-red-600 hardcoded
- [08-02]: Search-no-results shows muted text; truly-empty shows EmptyState with CTA — prevents misleading CTA when filters active
- [08-03]: Toast position top-left (physical) = visual right edge in RTL — satisfies TOAST-01/02/03
- [08-03]: ToastBar render prop approach for animation — toast.custom() bypasses render prop entirely
- [08-03]: showWarning/showInfo use toast() not toast.custom() so they inherit slideFromRight animation
- [08-03]: No key prop on Layout — avoids sidebar/header state reset on route change (Pitfall 5 from research)
- [08-03]: LOAD-06 confirmed satisfied from Phase 7 — no changes needed to ConfirmDeleteDialog
- [09-01]: FormField wrapper uses htmlFor/id pairing (not aria-labelledby) — simpler, standard, matches shadcn Label
- [09-01]: Radix Select value={undefined} for empty/null state — Radix does not support empty string value
- [09-01]: OrchestraForm keeps useState — no RHF migration needed (single page, no tab-switch data loss risk)
- [09-02]: AddTeacherModal uses RHF useForm (shouldUnregister:false default) — tab switching preserves all 7 tab fields in RHF internal store
- [09-02]: Schedule array managed via watch/setValue (no useFieldArray) — simpler add/remove for a non-dynamic array
- [09-02]: Sidebar.tsx onSuccess -> onTeacherAdded prop fix applied inline — pre-existing bug eliminated
- [09-03]: StudentForm keeps useState — collapsible sections do not unmount data (unlike tabs), no data loss risk without RHF
- [09-03]: Custom teacher searchable dropdown preserved — requires fixed positioning to escape modal overflow, incompatible with standard Radix Select portal
- [09-03]: Days filter checkbox dropdown preserved as custom — multi-select inline behavior incompatible with single-select Radix Select
- [10-01]: Table wrapper restructured to three layers (overflow-hidden > overflow-x-auto > max-h overflow-y-auto) — enables sticky thead inside scroll container
- [10-01]: thead shadow separator instead of border-b — CSS borders disappear on sticky elements, box-shadow does not
- [10-01]: Pagination entityLabel optional with 'פריטים' fallback — all existing callers backward-compatible
- [10-01]: SearchInput RTL positions: right-3 for search icon (visual start), left-2 for clear X (visual end)
- [10-02]: AuditTrail column arrays defined inside component function (not module scope) — helpers are component-scoped methods
- [10-02]: Rehearsals empty state IIFE pattern for hasActiveFilters — avoids variable declaration outside JSX
- [11-01]: AnimatePresence + conditional rendering replaces Radix TabsContent — avoids hidden-panel DOM accumulation
- [11-01]: getAvatarColorClasses uses charcode sum modulo 8 — simple, deterministic, no external dependency
- [11-01]: DetailPageHeader children slot for action buttons — keeps student delete buttons below header without coupling
- [11-01]: AvatarInitials colorClassName prop is additive — fallback to bg-primary/10 text-primary when not provided
- [11-02]: Orchestra passes fullName={orchestra?.name} only — DetailPageHeader getDisplayName handles single-name strings
- [11-02]: Bagrut action buttons preserved in separate row below header, not merged into header (matches StudentDetailsPage pattern)
- [11-02]: BagrutDetails custom Tab component untouched — only tab content area wrapped with AnimatePresence
- [11-02]: Teacher badge in Bagrut header conditionally rendered — prevents flash of undefined when teacher loads async
- [12-01]: NavLink end prop on /dashboard nav item — prevents startsWith matching marking Home as always-active on all subroutes
- [12-01]: Mobile hamburger button keeps bg-white — sits against page background, not sidebar dark surface (Pitfall 4 from research)
- [12-01]: Sidebar modal overlays retain bg-white — they are overlay surfaces independent of sidebar surface
- [12-01]: getRoleBadgeColor updated to dark-compatible opacity variants (red-300, blue-300, green-300, yellow-300) for legibility on dark sidebar
- [12-02]: Dashboard greeting uses user.personalInfo.firstName with getDisplayName fallback — not user.firstName (which is undefined in auth context shape)
- [12-02]: Orchestra StatsCard changed from purple to teal — warm palette only on dashboard (all 6 cards now warm)
- [12-02]: StatsCard colorClasses mapping unchanged — intentional palette-scale variety (bg-primary-100, bg-success-100, etc.) not CSS tokens
- [12-02]: text-muted-foreground/70 used for trend label — opacity modifier approach avoids defining new token

### Pending Todos

None for Phase 12. Phase 13 is next: special pages (MinistryReports, ImportData, Login, Settings).

### Blockers/Concerns

- [Research flag, Phase 13]: Toast migration scope — run `grep -r "toast\." src/ | wc -l` before planning Phase 13 to decide if Sonner migration fits or defers to v3.0.
- [Constraint]: Backend export endpoints (/api/export/status, /validate, /download) still not implemented — MinistryReports info banner stays until next backend milestone.
- [Pre-existing]: TypeScript errors in bagrutMigration.ts, cascadeErrorHandler.ts, errorRecovery.ts, memoryManager.ts, performanceEnhancements.tsx, securityUtils.ts — unrelated to CSS foundation work. Needs resolution before CI typecheck stage is enabled.
- [WSL constraint]: npm install on /mnt/c/ NTFS mount causes EIO errors in tar extraction — packages install with missing files. Workaround: retry loops + npm pack -> /tmp -> manual copy. Build verification must be done from Windows PowerShell or CI (not WSL).

## Session Continuity

Last session: 2026-02-18
Stopped at: Phase 12 complete + verified (13/13 must-haves). ROADMAP.md updated. Ready for Phase 13 planning.
Resume file: None
