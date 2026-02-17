# Project Research Summary

**Project:** Tenuto.io v2.0 — Full UI/UX Redesign (shadcn/ui Migration)
**Domain:** Hebrew RTL SaaS admin dashboard — conservatory (music school) management
**Researched:** 2026-02-17
**Confidence:** HIGH

## Executive Summary

Tenuto.io v2.0 is a purely visual redesign of a production-quality conservatory management app with a complete feature set. The app already has a partial shadcn/ui foundation — 10+ components in `src/components/ui/` follow the shadcn pattern, `@radix-ui/react-select`, `@radix-ui/react-label`, and `@radix-ui/react-slot` are installed, and the `cn()` utility exists — but the single most critical piece is missing: the CSS custom property token layer (`:root` block in `index.css`). Without it, every existing shadcn component silently renders with undefined color values. This must be fixed before any other work. The recommended approach is a strict layer-first, token-first migration: establish the design token foundation, migrate primitive components, rebuild domain-specific components on those primitives, then apply the visual overhaul to the layout shell last.

The primary risk in this redesign is RTL correctness. Hebrew RTL is not just `direction: rtl` — it requires logical CSS properties throughout (`ps-*`, `pe-*`, `start-*`, `end-*` instead of `pl-*`, `pr-*`, `left-*`, `right-*`), and Radix UI portals (Dialog, Select, Tooltip, DropdownMenu) render outside the `dir="rtl"` app wrapper into `document.body`, which has no `dir` attribute set. This means checkmarks appear on the wrong side, animations slide in from the wrong direction, and toast notifications anchor at the wrong screen edge unless `dir="rtl"` is set on `document.documentElement` at startup. RTL verification must be a mandatory checklist item for every migrated component.

A secondary risk is the accumulation of CSS specificity landmines: 8 custom CSS files exist in `src/styles/`, several using `!important` overrides that will silently block the new design tokens. These must be audited and cleaned before any component-level redesign. The two animation systems (framer-motion + the new `tailwindcss-animate` plugin required by Radix `data-state` animations) must also be reconciled — running both simultaneously causes double-animation and `prefers-reduced-motion` accessibility violations. The safe path is a single, deliberate foundation phase that resolves all these systemic issues before touching any UI component.

---

## Key Findings

### Recommended Stack

The existing stack (React 18, TypeScript, Vite, Tailwind CSS v3, React Hook Form, Zod, React Query, React Router v6) is solid and unchanged for v2.0. What's needed is a targeted set of additions and upgrades to complete the shadcn/ui infrastructure.

**Packages to add or upgrade:**
- `tailwind-animate@^1.0.7` (new) — required for Radix `data-[state=open]:animate-in` CSS animation patterns; existing components already reference these class names
- `tailwind-merge@^2.5.5` (upgrade from 1.14.0) — v1.x does not resolve arbitrary value conflicts correctly with Tailwind v3.4+
- `lucide-react@^0.460.0` (upgrade from 0.279.0) — music-relevant icons (Piano, Guitar, Music, GraduationCap, FileSpreadsheet) added after 0.279.0; required for music school identity
- 13 `@radix-ui/*` packages (new) — Dialog, Tabs, Tooltip, Popover, DropdownMenu, Switch, Avatar, Separator, Checkbox, Toast, Accordion, Progress, ScrollArea

**Configuration changes (no packages):**
- `src/index.css` — add `:root {}` CSS custom property block (the missing design token layer)
- `tailwind.config.js` — add `tailwind-animate` plugin + map semantic color names to CSS variables
- `vite.config.ts` — add new Radix packages to `optimizeDeps.include`

**Do not add:** `@headlessui/react` v2 (breaking changes), MUI/Mantine (incompatible theming), `tailwindcss-rtl` plugin (Tailwind v3.3+ has built-ins), `next-themes` (Vite app), `vaul`, `react-icons`, or `styled-components`.

See `.planning/research/STACK.md` for complete installation commands and configuration code.

### Expected Features

The redesign scope is visual only — zero functional regressions. All 18 pages need to inherit the new token system and layout shell, but intensity varies significantly.

**Must have (table stakes — makes the app feel finished):**
- Skeleton loading screens — replace all current spinner patterns
- Empty states with music-themed minimal SVG illustrations and CTAs
- Inline form validation feedback — visual standardization of existing RHF+Zod logic
- Toast notifications with RTL positioning and warm branded variants
- Consistent button hierarchy (one primary per page, destructive = red)
- Error states with human-readable message + retry button
- Consistent spacing scale (4px grid throughout, replace ad-hoc spacing)
- Active nav item highlighting in sidebar (complete what's already partially there)
- Breadcrumbs on entity detail pages (teacher → name, student → name)
- Badge/status chip standardization with instrument department color coding
- Table row hover states + sticky headers + contextual pagination copy
- Confirmation dialogs showing cascade consequences (already logical, needs visual upgrade)

**Should have (differentiators — make it feel music-school-specific):**
- Instrument department color coding (6 color families from existing `validationUtils.ts` groupings)
- Gradient header strips on entity detail pages tied to instrument family
- Avatar initials with deterministic color hashing (eliminates the gray blob problem)
- Warm dashboard greeting ("בוקר טוב, יונה") with school-year progress bar
- Smooth tab transitions via existing framer-motion install
- Print-optimized styles for MinistryReports (`@media print`)
- "Last updated" metadata on detail pages (date-fns already in stack)
- Progress step indicators on multi-step Import and Ministry Reports flows

**Defer to next milestone:**
- Visual schedule conflict detection (requires client-side logic change, not visual)
- Collapsible sidebar to icon-only mode (medium complexity, medium value)
- Keyboard shortcut discoverability modal
- Inline stat callouts on list pages (requires aggregate queries)
- Dark mode (Hebrew fonts untested for dark, school identity is warm)
- Animated data visualizations (scope creep)

The 5 highest-effort pages are: Dashboard, Students list, Teachers list, Teacher detail (7 tabs), and Student detail.

See `.planning/research/FEATURES.md` for complete page-by-page surface area and feature dependency graph.

### Architecture Approach

The migration follows a strict 5-layer model: CSS custom properties (token layer) → Tailwind config (maps tokens to class names) → `src/components/ui/` (shadcn primitives) → `src/components/[domain]/` (conservatory-specific composed components) → `src/features/[module]/` and `src/pages/` (consumers). Each layer depends on the one below it, which dictates an unambiguous build order: never touch a higher layer until the layers it depends on are stable.

**Major architectural components after migration:**
1. **Token layer** (`src/index.css` `:root` block + `tailwind.config.js`) — single source of truth for all colors, radius, and shadow; theme changes happen here only
2. **UI primitives** (`src/components/ui/`) — shadcn components owned by the project (Dialog replacing 4 custom modal variants, Tabs replacing custom tab navigation in 3 feature modules, DropdownMenu, Table, Tooltip, etc.)
3. **Domain components** (`src/components/[domain]/`) — conservatory-specific: `InstrumentBadge`, `StatusBadge`, `StatsCard`, `DataTable`, `ConfirmDialog`, `AvatarInitials`
4. **Layout shell** (`src/components/Layout.tsx`, `Sidebar.tsx`, `Header.tsx`) — redesigned last, after primitives are stable, because every page depends on it
5. **Feature modules** (`src/features/[module]/details/`) — tab pages that consume primitives and domain components; structure unchanged, only visual content within

**Migration pattern:** parallel existence (build new alongside old, test in isolation on one non-critical page, replace callsites page by page, delete old). No big-bang migration. CI catches regressions at each step.

See `.planning/research/ARCHITECTURE.md` for full layer model, RTL audit checklist, and 5-phase build order.

### Critical Pitfalls

1. **CSS variable collision with existing Tailwind color system** — shadcn's `primary` mapping (`hsl(var(--primary))`) overrides the existing `primary-500` Tailwind scale. Set `--primary` in `index.css` to match the existing brand color (#4F46E5 ≈ HSL 243 75% 59%) so both systems resolve identically. Bridge before migrating any component. (PITFALL 1)

2. **Radix portals escape the RTL scope** — Radix Dialog, Select, Tooltip, DropdownMenu, Popover all render into `document.body` via portals. The app sets `dir="rtl"` on the app root `<div>`, not on `document.documentElement`. Portal content has no `dir` attribute and defaults to LTR — select checkmarks appear on the wrong side, dialogs animate from the wrong edge. Fix: `document.documentElement.setAttribute('dir', 'rtl')` in `main.tsx`. (PITFALL 2)

3. **`!important` overrides in 8 custom CSS files block new design tokens** — `tab-navigation-fix.css` forces `background: white !important` on `body`, `html`, and `.student-details-container`. The new warm background color will have zero effect on those elements. Audit and remove all `!important` declarations before any component migration begins. (PITFALL 6)

4. **shadcn CLI overwrites customized component files** — the CLI does not diff; it replaces. All 10 existing `src/components/ui/` files would lose their RTL fixes and custom variants if the CLI is run. Never use `npx shadcn-ui add` on files that already exist. Copy new components manually from the registry. Add `# CUSTOMIZED` comment guards to modified files. (PITFALL 4)

5. **React Hook Form unmounts field values when tab rendering strategy changes** — existing forms use CSS show/hide (`display: none`) for tabs, keeping all fields mounted and registered. If the Tab redesign switches to conditional rendering (`{activeTab === 'personal' && ...}`), RHF fields unmount and lose values. Keep CSS show/hide strategy OR set `shouldUnregister: false` in `useForm()` before touching any form tab. (PITFALL 12)

Additional moderate pitfalls: animation system conflict (`tailwindcss-animate` class name collisions with existing `animate-fade-in` and `animate-scale-in` custom keyframes), Hebrew font FOUT causing CLS (fix with `<link rel="preload">`), react-hot-toast vs. shadcn Sonner duplicate toast systems, and Headless UI bundle bloat during migration.

See `.planning/research/PITFALLS.md` for all 15 pitfalls with detection steps and phase assignments.

---

## Implications for Roadmap

The research is unambiguous about phase ordering. The dependency graph from FEATURES.md maps directly to an architectural phasing strategy. Each phase must be completed before the next — there are no parallel tracks until Phase 4.

### Phase 1: Foundation (Zero Visual Change)

**Rationale:** Every other phase depends on this. The existing shadcn components are currently broken (undefined CSS variables). CSS `!important` overrides will block any new design tokens. The Radix portal RTL gap will cause regressions in every migrated component. This phase has no UI output but makes every subsequent phase possible.

**Delivers:** A working, coherent design token system. Existing shadcn components (button, input, select, badge, alert) suddenly render correctly. No visible change to end users.

**Addresses:**
- Add `:root` CSS custom property block to `src/index.css` (bridges token layer)
- Update `tailwind.config.js` to consume CSS variables (bridges Tailwind to tokens)
- Set `document.documentElement` `dir="rtl"` in `main.tsx` (fixes Radix portal RTL)
- Audit and remove `!important` from all 8 custom CSS files
- Fix RTL in `select.tsx` (`left-2` → `start-2`, `pl-8 pr-2` → `ps-8 pe-2`)
- Upgrade `tailwind-merge` to v2, add `tailwind-animate` plugin
- Audit animation class name conflicts before installing `tailwindcss-animate`
- Add Hebrew font preload link to `index.html`
- Add `# CUSTOMIZED` guards to all modified shadcn component files
- Upgrade `lucide-react` to current version

**Avoids:** Pitfalls 1, 2, 4, 5, 6, 7, 15

**Research flag:** Standard patterns — no phase research needed. All tasks are precisely defined.

---

### Phase 2: Missing shadcn Primitives

**Rationale:** The most-used components that don't yet exist in shadcn form are Dialog, Tabs, and DropdownMenu. These are used across 15+ pages and 3+ feature modules. Until these primitives exist, domain components and page redesigns cannot be built. Also: replace 4 custom modal variants in one atomic phase to avoid conflicting focus trap systems.

**Delivers:** Complete primitive component set. Modal, Tabs, DropdownMenu, Tooltip, Sheet — all built on Radix, all RTL-verified.

**Addresses:**
- Install the 13 missing `@radix-ui/*` packages
- Add `dialog.tsx` (replaces `Modal.tsx`, `ConfirmDeleteModal.tsx`, `ConfirmationModal.tsx`, `InputModal.tsx` — all 4 in one phase)
- Add `tabs.tsx` (replaces custom tab navigation in teachers, students, orchestras feature modules)
- Add `dropdown-menu.tsx` (replaces inline dropdown patterns in table actions, header menu)
- Add `tooltip.tsx`, `separator.tsx`, `scroll-area.tsx`, `avatar.tsx`, `switch.tsx`, `checkbox.tsx`, `accordion.tsx`, `progress.tsx`, `toast.tsx`
- Remove `@headlessui/react` imports as each Headless UI usage is replaced

**Avoids:** Pitfalls 2, 8, 11, 13

**Research flag:** Standard patterns — shadcn component installation is documented and deterministic.

---

### Phase 3: Domain Components and Loading States

**Rationale:** Once primitives are stable, build the conservatory-specific composed components that will be reused across every page: instrument badges, status badges, stats cards, avatar initials, skeleton loaders, empty states, error states. These are the building blocks that give every page its visual coherence and music-school identity.

**Delivers:** A complete domain component library. Every page can now display instrument colors, avatar initials, skeleton loading states, and music-themed empty states.

**Addresses:**
- `InstrumentBadge` on shadcn Badge — 6 department color families from `validationUtils.ts`
- `StatusBadge` on shadcn Badge — active/inactive/graduated/suspended status colors
- `StatsCard` on shadcn Card — warm greeting dashboard cards
- `AvatarInitials` on shadcn Avatar — deterministic color hashing by name
- `Skeleton` components — content-shaped, replace all spinners
- `EmptyState` component with music-themed SVG illustrations
- `ErrorState` component with retry button
- Rebuild `Table.tsx` internals on shadcn table primitives (preserve existing props API exactly)
- Rebuild `Pagination.tsx` with contextual copy ("מציג 21–40 מתוך 127")
- `ConfirmDialog` on shadcn Dialog with itemized cascade consequence list

**Avoids:** Pitfalls 3, 4

**Research flag:** May need phase research for instrument SVG icon sourcing — Lucide has basic music icons but supplemental SVGs for all 6 instrument families may need sourcing or creation.

---

### Phase 4: Form System Redesign

**Rationale:** The 7-tab teacher form is the most complex surface in the app and requires careful handling. React Hook Form's tab rendering strategy must be locked in before any form JSX is restructured. Separate phase from page redesign to contain regression risk.

**Delivers:** Redesigned form system — shadcn Form wrapper on React Hook Form, consistent field groupings with section labels, inline validation feedback, DatePicker, Switch for boolean fields.

**Addresses:**
- shadcn Form component (wraps existing React Hook Form — additive, not a replacement)
- Keep CSS show/hide tab strategy OR audit and set `shouldUnregister: false` first
- Consistent field grouping with subtle separators and section labels within each tab
- DatePicker on shadcn Popover + Calendar (replaces any native date inputs)
- Switch component for boolean fields (hasTeachingCertificate, isUnionMember, extraHour)
- Checkbox group for multi-instrument selection (27 instruments, grouped by department)
- Contextual help tooltips on admin-only settings fields

**Avoids:** Pitfall 12 (critical — RHF field unmounting)

**Research flag:** Standard patterns — RHF + shadcn Form integration is well-documented. No phase research needed.

---

### Phase 5: List Pages Redesign

**Rationale:** With domain components and form system complete, list pages can be fully redesigned without blocking anything. Students, Teachers, Orchestras, Rehearsals, and TheoryLessons all follow the same DataTable + search + filter + pagination pattern — work can be applied systematically.

**Delivers:** All list pages with new Table design, hover states, sticky headers, search with clear button, improved pagination, instrument/status badge standardization, skeleton loading and music-themed empty states.

**Addresses (per FEATURES.md page intensity — High priority first):**
- Students list (highest usage, largest table)
- Teachers list
- Orchestras list
- Rehearsals
- TheoryLessons
- AuditTrail (dense tabular data, Medium redesign intensity)

**Avoids:** Pitfall 10 (RTL utility class purge — verify after each page is built)

**Research flag:** Standard patterns.

---

### Phase 6: Detail Pages Redesign

**Rationale:** Detail pages (Teacher detail 7-tab, Student detail, Orchestra detail, Bagrut) have the most visual surface area but depend on all primitive and domain components being complete. The entity detail page header pattern (gradient strip, avatar initials, instrument badge, breadcrumb) is defined once and applied consistently.

**Delivers:** All detail pages with gradient header strips tied to instrument family color, avatar initials, breadcrumbs, "last updated" metadata, smooth tab transitions via framer-motion, and redesigned tab content within each tab.

**Addresses:**
- Teacher detail (7 tabs) — highest complexity, most fields
- Student detail (schedule, bagrut integration)
- Orchestra detail
- BagrutDetails
- Tab transition animation (framer-motion, already installed)
- "Last updated" metadata (date-fns, already installed)

**Avoids:** Pitfall 12 (RHF tab strategy — validated in Phase 4)

**Research flag:** Standard patterns — gradient header and avatar pattern designed once in Phase 3 domain components; application here is systematic.

---

### Phase 7: Layout Shell and Dashboard

**Rationale:** The layout shell (sidebar, header, Layout.tsx) is deliberately last because every page depends on it. Redesigning it first creates a jarring mismatch where navigation looks new but all content looks old. Redesigning it last means the visual system is complete when the shell changes — the result is immediately coherent.

**Delivers:** Redesigned sidebar (active highlighting, RTL-correct, icon spacing), header, and Dashboard with warm greeting, school-year progress bar, and styled stat cards with musical iconography.

**Addresses:**
- Sidebar redesign with proper active state via `useLocation`
- Dashboard warm greeting using auth context user name
- Styled stat cards on domain `StatsCard` components
- Dashboard school-year progress bar

**Avoids:** Pitfall 1 (ensure semantic tokens are correct before shell redesign — layout uses the most color classes)

**Research flag:** Standard patterns — sidebar and dashboard are the highest-traffic visual surfaces but build on everything established in Phases 1–6.

---

### Phase 8: Special Pages and Polish

**Rationale:** Admin-only pages (MinistryReports, ImportData, Settings) and auth pages have lower traffic but are not exempt from the design system. Polish items deferred from earlier phases land here.

**Delivers:** MinistryReports with progress step indicators and print-optimized `@media print` styles; ImportData with step progress indicator; Settings page with Switch toggles; Login with branded multi-tenant selector; toast notification system decision (stay with react-hot-toast styled to match tokens, or migrate to shadcn Sonner in a single atomic pass).

**Addresses:**
- MinistryReports (Medium redesign intensity)
- ImportData (Medium)
- Settings (Low)
- Login / ForgotPassword / ResetPassword (Low–Medium)
- Profile (Low)
- Toast system decision and implementation
- Print styles for MinistryReports

**Avoids:** Pitfall 14 (toast system — decide once, migrate atomically)

**Research flag:** MinistryReports and ImportData multi-step progress patterns are standard. Toast migration scope depends on `grep -r "toast\." src/ | wc -l` — check before committing to Sonner migration.

---

### Phase Ordering Rationale

- **Foundation must be Phase 1** — 10+ existing shadcn components are broken without it; all other phases are blocked
- **Primitives before domain components** — domain components compose on primitives; cannot build InstrumentBadge before Badge is working correctly
- **Domain components before pages** — pages need the building blocks
- **Form system isolated** — RHF regression risk is contained; form concerns don't bleed into list or detail page phases
- **List pages before detail pages** — list pages are simpler; the patterns validated there (table, skeleton, empty state) apply to detail pages
- **Layout shell last** — highest dependency count; wait until visual system is proven in pages before touching the chrome
- **Dashboard with layout shell** — dashboard is the first impression but depends on StatsCard domain components and layout context

This order directly follows the feature dependency graph from FEATURES.md and the build order documented in ARCHITECTURE.md.

### Research Flags

Phases needing deeper research during planning:
- **Phase 3:** Instrument icon SVG sourcing — Lucide has Piano, Guitar, Music, Drum, Mic but not all 27 instrument families. Research what icons exist vs. what needs custom SVG creation.
- **Phase 8:** Toast migration scope — run `grep -r "toast\." src/ | wc -l` to count call sites before deciding whether Sonner migration is feasible in one phase.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Token layer configuration is precisely specified in STACK.md and ARCHITECTURE.md. No unknowns.
- **Phase 2:** shadcn component installation is deterministic. Radix API is stable and well-documented.
- **Phase 4:** RHF + shadcn Form integration is documented. The `shouldUnregister` decision is a one-line config choice.
- **Phases 5–8:** All follow patterns established in earlier phases.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on direct codebase inspection of `package.json`, `tailwind.config.js`, `src/components/ui/*`. Package versions are MEDIUM (verify before install). |
| Features | HIGH | Codebase-derived — all 18 pages inventoried, feature dependencies confirmed against existing code. Music identity colors need a design decision (specific hue values). |
| Architecture | HIGH | Directly derived from reading the existing component source files. Layer model matches how existing shadcn components are already structured. RTL behavior based on Tailwind v3.3 and Radix documented behavior. |
| Pitfalls | HIGH | All 15 pitfalls sourced from direct codebase inspection with specific file/line citations. Not speculative — these are observed conditions in the current code. |

**Overall confidence: HIGH**

### Gaps to Address

- **Exact CSS custom property values for the warm Monday.com-inspired palette** — STACK.md and ARCHITECTURE.md provide placeholder HSL values. The specific palette (primary amber vs. indigo, exact muted gray tint) needs a design decision before Phase 1 can be finalized. Acceptable approach: start with ARCHITECTURE.md's placeholder values, iterate in Phase 1 with visual feedback.
- **Instrument SVG icon coverage** — Lucide covers major instrument families with basic icons. The extent of custom SVG work needed for 27-instrument coverage is unknown until the icon-to-instrument mapping is done in Phase 3. May be zero additional work if text + color department coding is sufficient.
- **Toast system call-site count** — unknown without running the grep. If it's over 40 call sites, Sonner migration may not fit in Phase 8 and should be deferred to v3.0.
- **Package version verification** — Radix UI version numbers in STACK.md are from training data (cutoff January 2025). Verify with `npm show @radix-ui/react-tabs version` before installing. Using `^` semver ranges means the latest compatible version installs regardless.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `src/components/ui/` (all 19 files) — component status, RTL issues, shadcn pattern adherence
- `tailwind.config.js` — existing color scale, animation keyframes, RTL plugin
- `src/index.css` — missing `:root` token block confirmed
- `src/styles/` (all 8 CSS files) — `!important` overrides catalogued
- `package.json` — installed versions confirmed
- `src/App.tsx` — `dir="rtl"` placement confirmed (app root, not `document.documentElement`)
- `vite.config.ts` — `optimizeDeps` configuration
- `.planning/codebase/CONCERNS.md` — existing known issues

### Secondary (MEDIUM confidence — established library knowledge + training data)
- shadcn/ui component patterns — verified by reading installed component files
- Tailwind CSS v3.3 logical properties (`ps-`, `pe-`, `start-`, `end-`) — confirmed available in Tailwind v3.3.3 (project version)
- Radix UI RTL behavior (`dir` attribute propagation, Floating UI positioning) — documented behavior
- Monday.com design aesthetic reference — training knowledge, visual direction only

### Tertiary (LOW confidence — verify during implementation)
- Radix UI package version numbers — training data, knowledge cutoff January 2025. Use `npm show` to verify before installing.
- Lucide icon names for music instruments — verify exact export names against installed version after upgrade.

---

*Research completed: 2026-02-17*
*Ready for roadmap: yes*
