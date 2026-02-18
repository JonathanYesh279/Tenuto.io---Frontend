# Project Research Summary

**Project:** Tenuto.io — v2.1 Production-Grade Visual Identity Upgrade
**Domain:** Visual identity transformation of an existing production React SaaS (Hebrew RTL, shadcn/ui + Tailwind + Framer Motion)
**Researched:** 2026-02-18
**Confidence:** HIGH

## Executive Summary

Tenuto.io v2.0 shipped a complete design system: warm coral/amber CSS token palette, shadcn/ui primitives, Heebo Hebrew font, Framer Motion tab transitions, and an RTL-first layout. The system is "clean and consistent" but reads as a polished template rather than a confident product. Research across Linear, Atlassian, Vercel, Cloudscape, and Fluent 2 identifies six specific gaps that separate production SaaS from template scaffolds: surface elevation hierarchy, a wide neutral color scale, a confident typography scale, information density modes, spring micro-interactions on primary actions, and color scarcity (coral currently used too frequently across too many surfaces). None of these gaps require new npm packages — all capabilities are already present in framer-motion v10, Tailwind v3, and the existing CSS token system. The v2.1 work is entirely configuration and component authoring layered on top of the existing v2.0 foundation.

The recommended approach is a strictly layered, token-first execution strategy. Layer 1 (CSS custom properties + tailwind.config.js) must be established and validated before touching Layer 2 (shadcn/ui primitive components), which must be stable before touching Layer 3 (Layout, Sidebar, Header). This ordering is non-negotiable: the shell (Sidebar, Layout, Header) is depended on by all 18+ pages — visual regressions there are maximally expensive. A 6-phase build order maps directly to this layered dependency chain and is the same order recommended by both the ARCHITECTURE.md and PITFALLS.md research independently.

The primary risk is the codebase's dual color system: 888 component usages of `primary-NNN` Tailwind hex classes exist alongside the CSS variable `--primary` consumed by shadcn components. These produce different brand colors from the same word "primary." Any color evolution work that touches only one system will produce visually inconsistent results with no error or warning. This must be resolved in Phase 1 before any other visual changes cascade. Secondary risks include Framer Motion stacking-context breakage on Radix dropdowns (do not use `layout` or `whileHover={{ y: N }}` on containers that hold Select/Popover/Tooltip), RTL directional animation semantics (Y-axis + opacity only; never bare positive X values), and Hebrew font-weight metric shifts causing nav label wrapping when applying Heebo 700-800.

## Key Findings

### Recommended Stack

No new packages are required for this milestone. All capabilities for spring physics, surface elevation, typography scale, and micro-interactions are available through libraries already installed. The framer-motion v10 APIs not yet used (`useSpring`, `whileHover`, `whileTap`, `staggerChildren` with `type:"spring"`) cover the full animation scope. One new file is required: `src/lib/motionTokens.ts` as a central motion constants module replacing raw inline Framer Motion values.

**Core technologies and their v2.1 roles:**
- `framer-motion` v10: Spring physics for primary action feedback and staggered list entrance — `whileHover`, `whileTap`, `useReducedMotion()`, and typed spring transition presets via `motionTokens.ts`
- `tailwindcss` v3: Semantic shadow scale (`shadow-elevation-*` or `shadow-1` through `shadow-4`) and typography scale added via `tailwind.config.js` extension; no config-file format changes
- CSS custom properties (`src/index.css :root {}`): Expanded with `--shadow-0` through `--shadow-4` (warm-tinted), `--duration-*` / `--ease-*` motion tokens, `--surface-*` hierarchy tokens, and a 9-step warm neutral scale
- `src/lib/motionTokens.ts` (new file): Named spring presets (`snappy`, `smooth`, `bouncy`, `gentle`) and transition preset objects imported by animated components

**Deferred upgrades (out of scope):**
- `motion` v12 package (formerly framer-motion): No API benefit this milestone; import rename across 5 files is pure churn
- Tailwind v4: CSS-first config migration with shadcn breaking changes is a separate milestone-sized project
- `lucide-react` upgrade (0.279.0 → 0.460+): MEDIUM urgency; useful for icon-only sidebar items but not blocking v2.1

**What not to add:** `react-spring`, `gsap`, `@radix-ui/react-hover-card`, any color palette library, `tw-animate-css`, `sonner`.

### Expected Features

**Must have (table stakes — product reads as template without these):**
- Surface elevation system — 4 distinct levels (page, card, overlay, modal) via shadow tokens; `--card: 0 0% 100%` (pure white) against `--background: 30 25% 97%` (warm off-white) creates readable depth
- Neutral scale — 9-step warm neutral scale (`--neutral-50` through `--neutral-900`) at hue 20° to support hierarchy without reaching for gray
- Confident typography scale — 7 semantic steps (display → caption) with explicit weight pairings; Heebo 700-800 for headings; current codebase uses weight 500 universally
- Compact information density on list pages — 40-44px table rows (down from ~48px); compact toolbar zone (48px) above tables with unified search + filters + CTA
- Bold page-level headings — `text-3xl`/`text-4xl` Heebo 800 for page titles; currently `text-2xl font-semibold`
- Semantic shadow scale — warm-tinted shadows using `hsl(20 15% 15% / 0.08-0.16)` ambient layers; no shadow tokens currently defined

**Should have (competitive differentiators):**
- Coral-as-accent audit — reduce coral from "everywhere" to three contexts: primary CTA buttons, active nav indicator, focus rings; deep neutrals carry all supporting surfaces
- Staggered list entrance animations — Framer Motion `staggerChildren: 0.05`, Y+opacity only (RTL-safe), capped at 8 items, initial mount only
- Spring micro-interactions on primary actions — `whileTap={{ scale: 0.97 }}` on buttons, spring modal entrance; primary actions only, not every element
- Sidebar trailing edge separation — shadow-3 on sidebar's leading edge (RTL: visual right edge of sidebar)
- Deepened gradient headers on detail pages — stronger saturation and drop shadow on header bottom edge
- Toolbar zone on list pages — search + filters + CTA in unified 48px control surface

**Defer to v2.2+:**
- Density user preference toggle (requires persistent state; validate modes work first)
- Custom RTL-aware spring variants library (validate v2.1 animation patterns first)
- Tailwind v4 migration
- Border radius tightening on data-dense components (`--radius-sm: 0.25rem` for badges/chips) — low visual impact, do after core system is validated

### Architecture Approach

The architecture is a strict 3-layer system. Layer 1 (token layer: `index.css` + `tailwind.config.js`) is the single source of truth — changing a CSS var here cascades globally with zero component edits and minimal regression risk. Layer 2 (primitive and domain components: `src/components/ui/*`, `src/components/domain/*`) applies tokens to element structure with medium regression risk. Layer 3 (layout shell: `Layout.tsx`, `Sidebar.tsx`, `Header.tsx`) has high regression risk because every page depends on it — it must only be touched after Layers 1 and 2 are validated. A single new module `src/lib/motionTokens.ts` serves as the integration point for all Framer Motion values.

**Major components and v2.1 responsibilities:**
1. `src/index.css :root {}` — Single source of truth for all visual values; receives shadow scale, motion tokens, surface hierarchy tokens, neutral scale
2. `tailwind.config.js` — Maps CSS vars to Tailwind class names; receives `shadow-1` through `shadow-4` entries and semantic `fontSize` scale
3. `src/lib/motionTokens.ts` (new) — Named spring presets and transition constants imported by all animated components
4. `src/components/ui/*` (6 files: button, card, badge, tabs, dialog, input) — Apply shadow levels, density variants, standardized focus rings
5. `src/components/domain/*` (4 files: DetailPageHeader, StatsCard, StatusBadge, InstrumentBadge) — Deeper gradient headers, bolder number typography, color saturation
6. `src/features/*/details/` (3 files: Teacher, Student, Orchestra detail pages) — Wire motionTokens.ts, add Y-translation to tab transitions, add `useReducedMotion()` guards
7. `src/components/Layout.tsx`, `Sidebar.tsx`, `Header.tsx` — Shell changes last; shadow-3 on sidebar, active indicator, content density finalized

### Critical Pitfalls

1. **Dual color system (888 hex `primary-NNN` usages + CSS `--primary` var)** — These produce different brand colors from the same word "primary." All color changes must touch BOTH systems in the same commit. Before any color change, grep to map which components use which system. Failure produces silent visual inconsistency.

2. **Framer Motion on Radix dropdown containers** — Using `layout`, `layoutId`, or `whileHover={{ y: N }}` on elements that hold Select, Popover, or Tooltip causes z-index isolation and dropdown clipping (documented in Framer Motion GitHub issue #1313). Use CSS `hover:-translate-y-1` (Tailwind) for card hover lift; reserve Framer Motion for leaf-level decorative elements and page/modal transitions.

3. **RTL directional animations** — Any Framer Motion X-axis animation produces semantically backwards results in RTL. The app is always `dir="rtl"`. All directional slides must use Y-axis + opacity (direction-neutral), or multiply X values by `-1`. Never use bare positive `x` values in animation props.

4. **Hebrew typography layout breakage** — Heebo 700 renders ~8-12% wider characters than 500, causing Hebrew nav labels and tab titles to wrap in tight containers. Test typography changes on actual Hebrew strings ("תלמידים", "מורה ראשי") in the browser before expanding scope. Reisinger Yonatan only has Regular (400) loaded — never apply `font-bold` to that font.

5. **Z-index corruption from surface layering** — Build elevation exclusively with `box-shadow` tokens, not z-index levels. Intermediate z-index values corrupt Radix modal/dropdown behavior. Shadow communicates elevation without creating stacking contexts.

## Implications for Roadmap

The build order is determined by three constraints that all point to the same 6-phase sequence: (1) token dependencies (surface tokens must exist before components can reference them), (2) regression risk (shell changes must be last because blast radius is all pages), and (3) pitfall prevention (dual color system resolved before any visual cascade). The 6-phase structure mirrors the architecture layer model exactly.

### Phase 1: Token Foundation and Dual-System Reconciliation

**Rationale:** Every subsequent phase depends on correct token values. The dual color system (Pitfall 1) is the single highest-risk issue — resolving it first prevents all downstream inconsistency. Zero component changes in this phase means regression risk is near zero. The `motionTokens.ts` module belongs here so it is available to all subsequent phases.

**Delivers:** Complete CSS token system (shadow scale 0-4, motion duration/easing tokens, surface hierarchy tokens, 9-step neutral scale, typography semantic tokens), `src/lib/motionTokens.ts`, and a documented inventory of which components use `primary-NNN` hex vs `--primary` CSS var.

**Addresses:** Surface elevation tokens, neutral scale, semantic shadow scale, motion token foundation (all are prerequisites for later features)

**Avoids:** Pitfall 1 (dual color system — reconciliation map created before any changes), Pitfall 5 (z-index — shadow-only elevation approach established here)

**Files:** `src/index.css`, `tailwind.config.js`, `src/lib/motionTokens.ts` (new)

**Research flag:** Standard. Well-documented CSS custom property and Tailwind config patterns. No research phase needed.

### Phase 2: Primitive Component Density and Shadow

**Rationale:** The 6 shadcn primitive components (button, card, badge, tabs, dialog, input) are consumed across all pages. Updating them now means every page in Phases 5-6 benefits automatically. Changes are className edits only — no API or prop surface changes — so regression is recoverable.

**Delivers:** Cards with shadow-1/hover:shadow-2 transition, standardized focus rings (WCAG-compliant against warm backgrounds), compact density on badge/chip, dialog at shadow-4, button active state wired to spring presets from motionTokens.ts.

**Addresses:** Semantic shadow scale (application), compact density (primitives layer), visible interactive layer (focus ring standardization)

**Avoids:** Pitfall 2 (no Framer Motion on dropdown-containing components — CSS-only hover for these primitives), Pitfall 3 (no `layout` prop or `whileHover` on interactive containers), Pitfall 8 (WCAG contrast check gates each new color combination)

**Files:** `src/components/ui/card.tsx`, `button.tsx`, `badge.tsx`, `tabs.tsx`, `dialog.tsx`, `input.tsx`

**Research flag:** Standard. className edits against established shadcn/CVA patterns. No research phase needed.

### Phase 3: Typography Scale and Coral-as-Accent Audit

**Rationale:** Typography must follow Phase 1 (font scale tokens are already defined there). The coral-as-accent audit requires the neutral scale from Phase 1 to replace coral with warm neutrals rather than plain gray. This phase has the broadest visual impact per file changed — headings get bolder, the brand identity becomes more confident, and supporting surfaces shift to deep neutrals.

**Delivers:** Bold headings (Heebo 700-800), confident page titles at text-3xl/4xl, semantic type scale applied to headings and section labels; coral reduced to 3 contexts (CTA, active nav, focus rings) with neutrals carrying everything else.

**Addresses:** Confident typography scale, bold page-level headings, coral-as-accent (highest brand-identity impact feature)

**Avoids:** Pitfall 4 (Hebrew font weight causing layout wrapping — incremental scope; test in browser on Hebrew strings before expanding to nav labels and tab bars), Pitfall 8 (WCAG contrast — hard gate before any new color combination ships)

**Files:** Domain component classNames for headings; selective page-level heading classNames; typography token values already defined in Phase 1

**Research flag:** Low-certainty area: Hebrew character widths at Heebo 700-800 in specific tight containers (tab bar labels, sidebar nav). This is a browser validation step, not a research gap. Test "תלמידים" and "מורה ראשי" at target weight before expanding scope.

### Phase 4: Motion System Upgrade

**Rationale:** Framer Motion changes are isolated to 3 feature detail pages plus list page entrance animations. These changes have zero layout or functional impact — visual only. Motion is placed here (after visual system is established) so spring feel can be tuned against proven surface and typography changes.

**Delivers:** Tab transitions in Teacher/Student/Orchestra detail pages upgraded with Y-translation for bolder feel; `useReducedMotion()` guards added throughout; staggered list entrance on TeacherList/StudentList/OrchestraList (Y+opacity, 8-item cap, mount-only); spring micro-interactions on primary action buttons.

**Addresses:** Spring micro-interactions, staggered list entrance, RTL-safe animation system, `prefers-reduced-motion` compliance

**Avoids:** Pitfall 2 (CSS vs Framer Motion boundary — Framer Motion for state transitions only, CSS `transition-*` for hover color/shadow), Pitfall 3 (no `layout` or `whileHover` on dropdown-containing cards — leaf elements only), Pitfall 6 (RTL direction — Y+opacity only for list entrance; tab slide uses Y axis; no bare X values), Pitfall 7 (no `will-change` without measured jank — benchmark first)

**Files:** `src/features/teachers/details/components/TeacherDetailsPage.tsx`, `StudentDetailsPage.tsx`, `OrchestraDetailsPage.tsx`; list page container components for stagger entrance

**Research flag:** Standard. `AnimatePresence` + spring on rapid tab switching can queue animations causing lag — use `duration: 0.2` linear for tab-level transitions; spring only for element-level interactions (buttons, cards). This is a well-documented constraint, not a research gap.

### Phase 5: Layout Shell

**Rationale:** Shell changes last, always. Sidebar, Header, and Layout.tsx are depended on by all 18+ pages. By Phase 5, the complete visual system is proven in primitive components and domain components. Shell changes are straightforward application of the established patterns — no new decisions required.

**Delivers:** Sidebar with shadow-3, trailing edge separation (RTL: visual right edge), tighter nav item density (py-2.5 vs py-3), active nav indicator using coral-as-accent pattern; Header with border/shadow finalized; Layout.tsx content wrapper density confirmed.

**Addresses:** Sidebar vs content area separation, compact density on nav items

**Avoids:** Pitfall 5 (z-index — shadow-only elevation; no new z-index values), Anti-pattern of starting with the shell (all regression risk deferred until system is proven)

**Files:** `src/components/Sidebar.tsx`, `src/components/Header.tsx`, `src/components/Layout.tsx`

**Research flag:** Standard. Requires a full page tour across all 18+ pages as a completion gate. No research phase needed.

### Phase 6: Page-Level Density Pass

**Rationale:** After the shell is validated, page-level density adjustments are isolated changes with one-page blast radius each. This phase also covers domain components that affect multiple pages (DetailPageHeader, StatsCard).

**Delivers:** Dashboard stat card grid tightened (p-5 vs p-6), list pages with compact table density (px-4 py-3 rows, ~40px effective row height), toolbar zone on list pages (search + filters + CTA unified in 48px control surface), deepened gradient headers on detail pages (stronger saturation + shadow on bottom edge).

**Addresses:** Compact density on list pages (table rows), toolbar zone, deepened gradient headers, sidebar separation (secondary polish item)

**Avoids:** No new pitfall risks at this phase — all systems are validated and patterns are proven

**Files:** `src/pages/Dashboard.tsx`, list page components, `src/components/domain/DetailPageHeader.tsx`, `src/components/domain/StatsCard.tsx`, `src/components/domain/StatusBadge.tsx`

**Research flag:** Standard. Low-risk page-specific work. No research phase needed.

### Phase Ordering Rationale

- Phases 1-2 establish token foundation before any visual cascade — CSS var changes are simultaneously zero-regression and high-leverage; this is the only correct starting order
- Phase 3 (typography + coral audit) requires the neutral scale from Phase 1; without warm neutrals as replacements, coral reduction has no valid substitute
- Phase 4 (motion) is placed after the visual system is proven in a static context so spring feel can be evaluated accurately; motion is functionally isolated and can be paused without affecting other phases
- Phase 5 (shell) is last because all-pages blast radius; by this point the visual system has been validated on primitives and domain components in lower-risk contexts
- Phase 6 is page-level cleanup with one-page blast radius — iterative, low-risk, can be done page by page

### Research Flags

Phases that can proceed without additional research:
- **Phase 1:** CSS custom property + Tailwind config patterns are thoroughly documented; motion token naming follows established design system conventions (ruixen.com, material design)
- **Phase 2:** shadcn/CVA variant patterns are direct documentation; className edits are low-risk
- **Phase 4:** Framer Motion spring API and `useReducedMotion()` are well-documented; existing AnimatePresence pattern is already proven in the codebase; CSS vs Framer Motion boundary rule is clear
- **Phase 5:** Shell changes follow exact same patterns established in Phases 1-4
- **Phase 6:** Page-level density is isolated, low-risk, no integration complexity

Phases that require browser validation (not additional research):
- **Phase 3:** Hebrew character widths at Heebo 700-800 in specific tight containers. Not a research gap — Heebo supports these weights and the pitfall is documented. Required action: browser test on real Hebrew strings before expanding scope to nav labels and tab bars.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase inspection confirms all packages and versions; no new packages required; framer-motion v10 API surface verified against npm changelog and codebase grep |
| Features | HIGH | Six-pillar framework verified against Atlassian, Cloudscape, Linear, Vercel design systems with specific documented examples. Exact tuning values (shadow opacity, coral frequency threshold) are implementation calibration, not research gaps |
| Architecture | HIGH | Direct codebase inspection of all affected files; 3-layer model is established pattern; dual color system finding is concrete and grep-verified (888 occurrences of primary-NNN in TSX files) |
| Pitfalls | HIGH | 8 critical pitfalls identified through direct codebase inspection; Framer Motion stacking context issue documented in official GitHub issue #1313; dual system count verified by grep; Hebrew font metric behavior confirmed by multiple sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact shadow opacity values**: The warm-tinted shadow recommendations (`hsl(20 15% 15% / 0.08)`) are directionally correct but need visual browser calibration. Start with recommended values and tune. Not a blocking gap.
- **Coral frequency count**: The extent of current coral overuse requires a grep audit in Phase 3 before changes are made. Recommended: `grep -rh "primary" src --include="*.tsx" | grep -oP "(bg|text|border|ring)-primary[-/]" | sort | uniq -c` before the audit begins.
- **Typography wrapping in tight containers**: Whether Heebo 700-800 causes Hebrew nav label wrapping depends on actual container widths. The pitfall is documented; mitigation is incremental scope + browser verification. Not a blocking gap.

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/package.json` — exact installed versions confirmed
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/tailwind.config.js` — dual color system identified, existing shadow/animation token inventory
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/src/index.css` — existing CSS token system, prefers-reduced-motion media query, Reisinger Yonatan font-weight declaration (400 only)
- Grep results: 888 `primary-NNN` occurrences in TSX files; 786 physical margin/padding occurrences across 165 files; Framer Motion usage confirmed in 5 files (opacity-only patterns, safe baseline)
- Framer Motion GitHub issue #1313 — `layout` prop stacking context behavior documented

### Secondary (MEDIUM-HIGH confidence — verified design system documentation)
- Atlassian Design elevation tokens: atlassian.design/foundations/elevation
- Cloudscape content density (40-44px compact row height): cloudscape.design/foundation/visual-foundation/content-density
- Framer Motion spring transition API: framer.com/motion/transition
- Linear design system redesign analysis: linear.app/now/how-we-redesigned-the-linear-ui
- RTL animation direction guidance: design.fusionfabric.cloud/foundations/rtl
- Sara Soueidan focus indicators (WCAG 2.2 appearance criteria): sarasoueidan.com/blog/focus-indicators
- Josh W. Comeau shadow design (warm-tinted shadow rationale): joshwcomeau.com/css/designing-shadows
- Motion design token naming conventions: ruixen.com/blog/motion-design-tokens

### Tertiary (MEDIUM confidence — inferred or pattern-based)
- Coral frequency threshold (<5% surface area): inferred from Linear/Vercel analysis; not a documented industry standard; use as directional guidance only
- Hebrew character width increase at Heebo 700 (~8-12% wider): WebSearch-verified pattern; exact percentage requires browser measurement in this specific app context
- Framer Motion LazyMotion bundle reduction (30KB → 6KB): STACK.md reference; verify before applying if bundle size becomes a concern

---
*Research completed: 2026-02-18*
*Ready for roadmap: yes*
