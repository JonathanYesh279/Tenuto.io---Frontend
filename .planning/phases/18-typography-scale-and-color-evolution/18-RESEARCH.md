# Phase 18: Layout Shell and Color System Reset — Research

**Researched:** 2026-02-18
**Domain:** CSS custom properties, Tailwind v3 color tokens, React layout shell, RTL sidebar restyle
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Sidebar:**
- Switch from dark warm sidebar to light/white sidebar
- Grouped navigation sections with small category labels (e.g., MENU, OTHER)
- Active item gets a soft colored background pill — not a dark highlight
- Lightweight icons + text labels
- Clean brand logo at top

**Color Palette:**
- Move from monochrome coral to multi-color pastel system
- Coral becomes one accent color among several — not the dominant identity
- Each entity type gets its own distinct pastel color:
  - Teachers → one color
  - Students → another color
  - Orchestras → another color
  - (Claude assigns specific pastel hues during planning)
- Entity colors are consistent across all pages (stat cards, badges, accents)
- Overall palette: light, airy, pastel — not dark, not heavy

**Dashboard Layout:**
- 3-column layout: main content (left/center) + persistent right column
- Right column contains: calendar widget, upcoming items, recent activity/messages
- Top row: colorful stat cards (one per entity metric) with large bold numbers, small labels, percentage badges
- Below stats: charts and data sections with clean styling
- Bottom: task tables or activity logs
- Stat cards use distinct pastel background per entity type

**List Pages:**
- Hero stats zone at top — aggregate metrics for that entity (count, trends)
- Compact filter toolbar below hero: search input + dropdown filters in one row
- Data-dense table below filter bar
- Tables: avatars alongside names, colored status badges, icon-based action buttons

**Detail Pages:**
- Keep existing tab structure — tabs work well for entity detail
- Restyle tabs and content with stronger visual hierarchy

**Forms:**
- Restructure with visual sections — clear section grouping with visual dividers or section headers

**Table Design:**
- Avatars alongside entity names
- Colored status badges with distinct colors per status
- Icon-based action buttons (edit, delete, view)
- Clean, well-spaced rows

**Overall Feel:**
- Light, airy backgrounds (white/very light gray)
- Cards with subtle borders — not heavy shadows
- Data is dominant — numbers are the biggest elements
- Pastel color accents — not monochrome
- Clear zoning on every page

**Critical Constraint: Style Transplant Only**
- Take from reference: layout structure, visual treatment, spacing, hierarchy, zoning
- Keep from Tenuto: all entity names, column names, section headings, labels, page structure, data relationships, Hebrew RTL, business logic

### Claude's Discretion
- Exact pastel hue assignments per entity
- Specific spacing values and density adjustments
- Chart styling and data visualization details
- How to handle pages without clear reference parallels
- Typography weight and size specifics within the "bold hierarchy" direction
- How to adapt 3-column layout for Hebrew RTL

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within milestone scope
</user_constraints>

---

## Summary

Phase 18 is a foundation-replacement phase. It does not add features — it surgically replaces the visual identity of the application shell. Three files are the primary targets: `src/index.css` (CSS custom property tokens), `src/components/Sidebar.tsx` (dark sidebar → light sidebar), and `src/components/Layout.tsx` (layout shell zoning). The header and content area background also need treatment.

The current state is well-documented: `--sidebar: 220 25% 18%` gives a dark blue-navy sidebar; `--sidebar-foreground: 30 25% 97%` gives light text on it. The `--primary: 15 85% 45%` is warm coral. The dual color system (CSS var coral + hardcoded indigo `primary-NNN`) is a pre-existing conflict inventoried in COLOR-INVENTORY.md. Phase 18 does NOT attempt to resolve the 1,211 `primary-NNN` instances — that is the full color migration work (deferred). Phase 18 addresses the structural token layer and the sidebar shell only.

The SchoolHub reference screenshots (verified 2026-02-18) show: white left sidebar with navy logo, MENU/OTHER section labels, active item with a lavender/indigo pill, flat white backgrounds, stat cards in 4 distinct pastel colors (lavender, yellow, peach/pink, and light blue), and a persistent right column with calendar + agenda + messages.

**Primary recommendation:** Change `--sidebar` and `--sidebar-foreground` CSS vars, add entity color CSS vars (`--color-students`, `--color-teachers`, `--color-orchestras`, etc.), update `src/components/Sidebar.tsx` className bindings, and update `src/components/Layout.tsx` background. The Dashboard 3-column restructure is part of this phase's scope (per plan 18-03).

---

## Standard Stack

### Core (what's already installed, no new packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | ^3.4.19 | Utility classes for all styling | Project-wide standard |
| CSS custom properties | native | Token layer for design system | Phase 16 established |
| framer-motion | ^10.16.4 | Sidebar open/close animation | Phase 17 established |
| class-variance-authority | ^0.7.1 | Variant props on UI components | Phase 17 established |
| lucide-react | ^0.279.0 | Navigation icons | Already used in Sidebar |
| tailwindcss-animate | ^1.0.7 | Animation utilities | Already in config |

**No new packages needed.** The constraint "no new npm packages for v2.1" is satisfied by the existing stack.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS vars for entity colors | Tailwind config colors | CSS vars allow runtime theming; Tailwind colors require rebuild. CSS vars win for a token-layer approach. |
| Inline className changes in Sidebar | New CSS classes in components.css | Inline Tailwind is the project standard — no new CSS files needed |
| 3-col CSS grid | Flexbox | CSS grid is cleaner for 3-region dashboard; existing Layout uses flexbox for sidebar/main. Use grid only in Dashboard page, not in Layout shell |

---

## Architecture Patterns

### Recommended File Change Set for Phase 18

```
src/
├── index.css                    # TOKEN LAYER — add entity color vars, update --sidebar vars
├── components/
│   ├── Sidebar.tsx              # SHELL — restyle from dark to light, add category pill logic
│   ├── Layout.tsx               # SHELL — update bg-background reference, verify zoning
│   └── Header.tsx               # SHELL — minor: ensure border-b reads correctly on white bg
├── components/ui/
│   └── StatsCard.tsx            # ENTITY COLORS — use entity color tokens instead of named colors
└── pages/
    └── Dashboard.tsx            # 3-COLUMN — restructure overview tab layout
```

### Pattern 1: Entity Color CSS Vars

Define per-entity color pairs (background + foreground) in `:root` in `src/index.css`. Each entity gets a pastel background for cards/stat zones and a saturated foreground for text/icons.

**Recommended hue assignments (Claude's discretion):**
- Students → violet/indigo pastel (hue ~250) — reference uses lavender for this slot
- Teachers → sky blue pastel (hue ~200) — distinct from student violet
- Orchestras → yellow/amber pastel (hue ~45) — reference uses yellow for award/staff slot
- Rehearsals/Calendar → peach/rose pastel (hue ~10-20) — reference uses coral-pink
- Bagrut/Awards → green pastel (hue ~145) — success association
- Theory → teal pastel (hue ~170) — distinguishable from sky blue

```css
/* src/index.css — add inside :root block (Phase 18 — COLOR-01) */

/* Entity color system — pastel backgrounds + saturated foregrounds */
--color-students-bg:      hsl(252 80% 94%);   /* violet pastel */
--color-students-fg:      hsl(252 60% 45%);   /* violet saturated */
--color-teachers-bg:      hsl(200 75% 92%);   /* sky blue pastel */
--color-teachers-fg:      hsl(200 70% 38%);   /* sky blue saturated */
--color-orchestras-bg:    hsl(45 90% 90%);    /* amber/yellow pastel */
--color-orchestras-fg:    hsl(38 80% 38%);    /* amber saturated */
--color-rehearsals-bg:    hsl(340 70% 92%);   /* rose pastel */
--color-rehearsals-fg:    hsl(340 60% 42%);   /* rose saturated */
--color-bagrut-bg:        hsl(145 60% 88%);   /* green pastel */
--color-bagrut-fg:        hsl(145 55% 32%);   /* green saturated */
--color-theory-bg:        hsl(170 65% 88%);   /* teal pastel */
--color-theory-fg:        hsl(170 60% 32%);   /* teal saturated */

/* Updated sidebar tokens — light/white */
--sidebar:                0 0% 100%;           /* white */
--sidebar-foreground:     220 15% 20%;         /* near-black for text */
--sidebar-border:         220 13% 91%;         /* subtle gray border */
--sidebar-active-bg:      252 80% 94%;         /* student-violet pill (matches primary entity) */
--sidebar-active-fg:      252 60% 45%;         /* violet text when active */
--sidebar-label:          220 10% 55%;         /* section label color (MENU, OTHER) */
```

**Source:** Verified against Tailwind v3 docs — HSL color channel values work correctly in CSS custom properties when consumed via `hsl(var(--token))` pattern (established in Phase 16).

### Pattern 2: Light Sidebar — className Changes

The sidebar's main container currently uses `bg-sidebar text-sidebar-foreground`. Since `--sidebar` changes from dark navy to white, this single token update propagates to all `bg-sidebar` usages automatically.

What must be manually updated in `Sidebar.tsx`:
1. The active nav item currently uses `bg-sidebar-foreground/15 text-sidebar-foreground` → change to use new `--sidebar-active-bg`/`--sidebar-active-fg` vars or Tailwind equivalents
2. Role badge colors currently use `bg-red-500/20 text-red-300` (dark-surface-appropriate) → change to saturated text on white
3. Search input uses `bg-sidebar-foreground/10` (dark surface) → change to `bg-gray-100` or `bg-muted`
4. Category section labels already use `text-sidebar-foreground/50 uppercase tracking-wider` — good pattern, just needs token update
5. Shadow on sidebar currently `shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.2)]` → soften to `shadow-1` (Phase 16 token)

**RTL adaptation:** The SchoolHub reference has the sidebar on the LEFT side (LTR layout). Tenuto is RTL — sidebar stays on the RIGHT. The visual pattern is identical; only the physical position and shadow direction differ. `shadow-[-4px_0...]` already handles the RTL shadow (casts left from right-side sidebar).

### Pattern 3: Tailwind Config — Entity Color Mapping

Add entity color aliases to `tailwind.config.js` so `bg-students`, `text-teachers-fg` etc. work as Tailwind utilities:

```js
// tailwind.config.js — extend colors block
colors: {
  // ... existing entries ...
  // Entity color system (Phase 18)
  students: {
    bg: "hsl(var(--color-students-bg))",
    fg: "hsl(var(--color-students-fg))",
  },
  teachers: {
    bg: "hsl(var(--color-teachers-bg))",
    fg: "hsl(var(--color-teachers-fg))",
  },
  orchestras: {
    bg: "hsl(var(--color-orchestras-bg))",
    fg: "hsl(var(--color-orchestras-fg))",
  },
  rehearsals: {
    bg: "hsl(var(--color-rehearsals-bg))",
    fg: "hsl(var(--color-rehearsals-fg))",
  },
  bagrut: {
    bg: "hsl(var(--color-bagrut-bg))",
    fg: "hsl(var(--color-bagrut-fg))",
  },
  theory: {
    bg: "hsl(var(--color-theory-bg))",
    fg: "hsl(var(--color-theory-fg))",
  },
}
```

Consumption: `<div className="bg-students-bg text-students-fg">` — clean, readable, single source of truth.

### Pattern 4: Dashboard 3-Column Layout (Plan 18-03)

The current Dashboard overview is a single-column flow. The target is:
- Left/center: main content (stats row + charts + tables)
- Right: persistent column (calendar widget + upcoming + messages)

**CSS Grid approach** (recommended for fixed right column):

```tsx
// src/pages/Dashboard.tsx — overview tab wrapper
<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6" dir="rtl">
  {/* Main content column */}
  <div className="min-w-0">
    {/* Stats row */}
    {/* Charts */}
    {/* Tables */}
  </div>
  {/* Right sidebar column */}
  <div className="lg:sticky lg:top-20 space-y-4 self-start">
    {/* Calendar widget */}
    {/* Upcoming events */}
    {/* Recent activity */}
  </div>
</div>
```

**RTL note:** In RTL dir, `grid-cols-[1fr_320px]` will place the 320px column on the LEFT (visual right becomes left in RTL). For Hebrew RTL, we want the right column to appear on the LEFT side of the screen (which is the visual right-hand position when reading RTL). Verify with browser during execution — may need `dir="ltr"` wrapper with `text-right` and `rtl` inner containers if grid column order is visually wrong.

**Alternative if grid order is wrong:** `grid-cols-[320px_1fr]` with `lg:order-2` / `lg:order-1` to swap visual order without changing DOM order.

### Pattern 5: Stat Cards with Entity Colors

`StatsCard.tsx` currently takes `color` prop with string values (`'blue'`, `'green'`, etc.) mapped to hardcoded Tailwind classes. Update to use entity color tokens:

```tsx
// New color prop values matching entity system
color?: 'students' | 'teachers' | 'orchestras' | 'rehearsals' | 'bagrut' | 'theory'

// New colorClasses mapping
const colorClasses = {
  students:   { iconBg: 'bg-students-bg',   iconColor: 'text-students-fg',   valueColor: 'text-students-fg'   },
  teachers:   { iconBg: 'bg-teachers-bg',   iconColor: 'text-teachers-fg',   valueColor: 'text-teachers-fg'   },
  orchestras: { iconBg: 'bg-orchestras-bg', iconColor: 'text-orchestras-fg', valueColor: 'text-orchestras-fg' },
  rehearsals: { iconBg: 'bg-rehearsals-bg', iconColor: 'text-rehearsals-fg', valueColor: 'text-rehearsals-fg' },
  bagrut:     { iconBg: 'bg-bagrut-bg',     iconColor: 'text-bagrut-fg',     valueColor: 'text-bagrut-fg'     },
  theory:     { iconBg: 'bg-theory-bg',     iconColor: 'text-theory-fg',     valueColor: 'text-theory-fg'     },
}
```

Also add **colored card background** as an option per the SchoolHub reference — the stat cards in the reference have pastel-tinted card backgrounds (not just icon colors). Add a `coloredBg?: boolean` prop that sets `bg-students-bg` on the whole card.

### Anti-Patterns to Avoid

- **Don't migrate the 1,211 `primary-NNN` instances.** Phase 18 scope is the sidebar, token layer, and dashboard shell only. The full color migration is a separate future phase.
- **Don't add new z-index values.** Phase 16 research established z-index must not change (breaks Radix). Sidebar uses `z-[55]`, header uses `z-[45]` — leave these untouched.
- **Don't use Framer Motion `layout` prop on sidebar.** Phase 16 research established this breaks Radix dropdown children.
- **Don't change sidebar position (right) or width (280px).** Those dimensions are also used in `Header.tsx` inline style for width calculation. Changing dimensions requires coordinated update across both files.
- **Don't lose the dark-surface-appropriate opacity tricks.** When lightening the sidebar, opacity-based classes like `/10`, `/15`, `/20` that worked on dark backgrounds will need different values or solid colors on white.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Entity color tokens | Custom CSS class generator | CSS vars in `:root` + Tailwind config mapping | Single source of truth, IDE autocomplete works |
| Sidebar category labels | New component | Inline in existing `groupedNavigation` map | Already grouped by category — just add `<span className="text-xs uppercase tracking-wider">` above group |
| 3-col dashboard grid | Custom CSS grid utility | Tailwind `grid-cols-[1fr_320px]` | One class, no custom CSS needed |
| Right column widgets | New components in isolation | Reuse existing `RecentActivity` component | Already exists at `src/components/dashboard/RecentActivity.tsx` |

---

## Common Pitfalls

### Pitfall 1: Opacity-relative classes break on light sidebar
**What goes wrong:** `bg-sidebar-foreground/10` was `rgba(30,25%,97%,0.1)` on a dark background — barely visible gray tint. On white, it becomes nearly invisible since sidebar-foreground is now near-black — `bg-sidebar-foreground/10` will give very dark tint.
**Why it happens:** Opacity arithmetic is relative to the token value, which flipped.
**How to avoid:** After changing `--sidebar` and `--sidebar-foreground`, grep for `sidebar-foreground/` in Sidebar.tsx and replace with solid colors (`bg-gray-100`, `bg-muted`) or recalibrated opacities.
**Warning signs:** Search input or toggle button backgrounds appear dark/black on the light sidebar.

### Pitfall 2: Dark text colors in role badges (dark-surface-optimized)
**What goes wrong:** `text-red-300`, `text-blue-300` are light colors designed for dark backgrounds. On white sidebar, they fail contrast.
**How to avoid:** Replace `*-300` badge text colors with `*-700` or `*-800` equivalents for legibility on white.
**Warning signs:** Badge labels are washed out or unreadable.

### Pitfall 3: HSL var consumption syntax
**What goes wrong:** Writing `hsl(var(--color-students-bg))` when the var already contains `hsl()` → produces `hsl(hsl(252 80% 94%))` — invalid.
**Correct pattern:** The Phase 16 decision (STATE.md) says surface vars use **full `hsl()` syntax** — consumed via `var()` directly: `var(--surface-base)`. BUT if the Tailwind config maps them with `hsl(var(...))`, then the CSS var must store raw channels only (e.g., `252 80% 94%` without `hsl()`).
**Resolution:** Phase 16 established two patterns. Surface vars (`--surface-base`) store full `hsl(...)` and are consumed raw via `var(--surface-base)`. Semantic vars (`--background`, `--primary`, etc.) store raw channels and are consumed via `hsl(var(--background))`. **Entity color vars must follow the semantic pattern (raw channels)** since they will be referenced in Tailwind config as `hsl(var(--color-students-bg))`.
**Warning signs:** Colors render black, transparent, or fail to apply.

### Pitfall 4: RTL column order in 3-column grid
**What goes wrong:** CSS grid with `grid-cols-[1fr_320px]` in RTL context places the 320px column on the visual RIGHT, which is the reading-START of RTL — not the intended behavior (right column should be on visual LEFT, reading-END of Hebrew text).
**How to avoid:** Test in browser with `dir="rtl"`. If column order is inverted, use `grid-cols-[320px_1fr]` and control visual order with DOM order (in RTL, DOM-first column is visual-right).
**Warning signs:** The calendar widget appears on the wrong side after the grid change.

### Pitfall 5: Sidebar logo area
**What goes wrong:** Current sidebar has no explicit logo/brand section — the logo is only in the Header. The SchoolHub reference puts a brand logo at the top of the sidebar.
**Current state confirmed:** The Sidebar.tsx has NO logo section at the top — it starts with the search input and role badges. The logo is in `src/components/Header.tsx` (`<img src="/logo.png" />`).
**How to avoid:** Phase 18 sidebar plan should include adding a logo/brand zone at the top of the sidebar. Use the existing `/logo.png` asset. Keep the Header logo too (they serve different purposes when sidebar is closed).
**Warning signs:** Light sidebar looks incomplete without brand identity at top.

### Pitfall 6: Header border visibility on white backgrounds
**What goes wrong:** Header uses `border-b border-border` which is a subtle warm gray. On a white/very-light-gray background (`--background: 30 25% 97%`), this border may become nearly invisible.
**How to avoid:** Either keep the current border token (sufficient contrast) or update `--background` to pure white and increase border opacity slightly.
**Warning signs:** Header appears to float without visual separation from content.

---

## Code Examples

### Confirmed current sidebar CSS vars (src/index.css line 42-43)
```css
/* CURRENT — dark navy sidebar */
--sidebar: 220 25% 18%;
--sidebar-foreground: 30 25% 97%;

/* REPLACE WITH — light/white sidebar */
--sidebar: 0 0% 100%;           /* pure white */
--sidebar-foreground: 220 15% 20%;  /* near-black text */
```

### Confirmed Sidebar.tsx container class (line 474)
```tsx
/* CURRENT */
className={`fixed top-0 right-0 w-[280px] h-screen bg-sidebar text-sidebar-foreground border-l border-sidebar-foreground/10 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.2)] rtl z-[55] ...`}

/* UPDATE — shadow softened, border uses new sidebar-border var */
className={`fixed top-0 right-0 w-[280px] h-screen bg-sidebar text-sidebar-foreground border-l border-sidebar-border shadow-1 rtl z-[55] ...`}
```

### Confirmed active nav item class (Sidebar.tsx line 568-570)
```tsx
/* CURRENT — dark surface pill */
'bg-sidebar-foreground/15 text-sidebar-foreground font-semibold border border-sidebar-foreground/20'

/* REPLACE WITH — light surface colored pill */
'bg-students-bg text-students-fg font-semibold'
/* OR using a generic --sidebar-active-bg/fg token */
'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-fg))] font-semibold'
```

### Stat card entity color (Dashboard.tsx lines 341-393)
```tsx
/* CURRENT */
<StatsCard title="תלמידים פעילים" ... color="blue" />
<StatsCard title="חברי סגל" ... color="green" />
<StatsCard title="הרכבים פעילים" ... color="teal" />

/* REPLACE WITH entity semantic colors */
<StatsCard title="תלמידים פעילים" ... color="students" />
<StatsCard title="חברי סגל" ... color="teachers" />
<StatsCard title="הרכבים פעילים" ... color="orchestras" />
```

---

## Current State vs. Target State

| Element | Current | Target (Phase 18) |
|---------|---------|-------------------|
| `--sidebar` | `220 25% 18%` (dark navy) | `0 0% 100%` (white) |
| `--sidebar-foreground` | `30 25% 97%` (near white) | `220 15% 20%` (near black) |
| Active nav pill | `bg-sidebar-foreground/15` (dark tint) | Pastel color pill (`--sidebar-active-bg`) |
| Entity colors | None — uses named Tailwind colors per-component | Semantic CSS vars per entity type |
| Sidebar logo | No logo zone | Brand logo at top of sidebar |
| Category labels | Collapsible with chevron, uppercase | Same — retain logic, restyle text |
| Dashboard layout | Single-column flow | 3-col grid: `[1fr_320px]` |
| Stat cards | Colored icon bg, white card | Pastel card bg with entity colors |
| Content background | `--background: 30 25% 97%` (warm off-white) | Same or update to `0 0% 99%` (cooler white) |
| Header | `bg-card border-b border-border` | Same structure, verify visibility on white |

---

## Scope Boundary for Phase 18 (What's NOT Here)

- **1,211 `primary-NNN` instances**: NOT touched in Phase 18. Deferred per Phase 16 decision.
- **List pages (Teachers, Students, Orchestras)**: Hero stat zones, filter toolbars, avatar tables are Phase 19 scope.
- **Detail pages**: Tab restyle, profile headers are Phase 20 scope.
- **Form restructuring**: Section grouping is Phase 20 scope.
- **Badge restyle**: Colored status badges are Phase 19 scope.
- **Typography scale**: The TYPO-01 through TYPO-04 requirements (Heebo 700-800 headings, compact body text) — these are listed in the phase requirements but should be implemented minimally in Phase 18 (just the CSS token definitions) and expanded in later phases. Don't do a full typography sweep in Phase 18.

---

## Open Questions

1. **Dashboard right column — use existing `RecentActivity.tsx` or build new?**
   - What we know: `src/components/dashboard/RecentActivity.tsx` exists but is styled for full-width placement
   - What's unclear: Does it need heavy restyle for 320px column width?
   - Recommendation: Reuse but pass a `compact` prop or className override; don't rewrite

2. **Sidebar active color — use `students-bg` or a generic `--sidebar-active-bg` token?**
   - What we know: Active item should be a "soft colored background pill" per decisions
   - What's unclear: Should it always be the same color (e.g., always violet) or change per nav section?
   - Recommendation: Use a single fixed `--sidebar-active-bg` token (violet/indigo per SchoolHub reference) — consistent, not dynamic

3. **Typography requirement TYPO-01 to TYPO-04 — Phase 18 or defer?**
   - The phase requirements list these as in scope for Phase 18
   - What's unclear: These are defined as 6 semantic typography tokens — adding CSS vars is low risk, but consuming them across pages is Phase 19+ work
   - Recommendation: Define the tokens in Phase 18 (18-02 plan); do NOT sweep all pages to consume them until Phase 19

4. **Background color update — warm off-white → cooler white?**
   - Current `--background: 30 25% 97%` has a warm tint that harmonized with coral
   - With new light sidebar and pastel system, a cooler `--background: 210 20% 98%` or pure `0 0% 99%` would harmonize better with the violet/blue pastels
   - Recommendation: Update to `210 17% 98%` (very light blue-gray, consistent with SchoolHub's light background)

---

## Sources

### Primary (HIGH confidence)
- `src/index.css` — confirmed current CSS var values (lines 20-69)
- `src/components/Sidebar.tsx` — confirmed all className bindings, structure
- `src/components/Layout.tsx` — confirmed layout shell structure
- `src/components/Header.tsx` — confirmed header structure and logo placement
- `src/components/ui/StatsCard.tsx` — confirmed color prop system
- `src/pages/Dashboard.tsx` — confirmed stat card color assignments
- `tailwind.config.js` — confirmed extend.colors and plugin structure
- `.planning/phases/16-token-foundation/COLOR-INVENTORY.md` — confirmed dual-system inventory
- `.planning/STATE.md` — confirmed scope decisions and prior phase decisions

### Secondary (MEDIUM confidence)
- SchoolHub reference screenshots (`/mnt/c/Users/yona2/Pictures/Screenshots/צילום מסך 2026-02-18 191152.png`, `191159.png`, `191205.png`) — visually verified sidebar structure, color palette, stat card design, 3-column layout
- Current app screenshot (`צילום מסך 2026-02-18 185111.png`) — confirmed current dark sidebar, coral primary, category-grouped nav already exists

### Tertiary (LOW confidence — training knowledge, no external lookup performed)
- CSS grid RTL column order behavior — standard browser behavior but should be verified in browser during execution
- WCAG contrast ratios for pastel text colors — standard AA calculation but not tool-verified for the specific hue choices

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified in package.json, no new packages needed
- Architecture patterns: HIGH — all file paths and className targets verified in source code
- Entity color hue assignments: MEDIUM — specific hues chosen by inference from reference screenshots; exact hex/HSL values are reasonable starting points, adjust based on browser rendering
- RTL 3-column grid: MEDIUM — CSS grid RTL behavior is well-documented, but exact column order must be verified in browser
- Pitfalls: HIGH — all based on verified source code examination

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (stable Tailwind v3 + CSS vars — low churn domain)
