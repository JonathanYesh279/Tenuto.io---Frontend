# Phase 20: List Pages and Table System - Research

**Researched:** 2026-02-18
**Domain:** React list page architecture, table UX patterns, hero stat zones, filter toolbars
**Confidence:** HIGH — all findings from direct codebase inspection

---

<user_constraints>
## User Constraints (from phase context)

### Locked Decisions

**List Pages (Teachers, Students, Orchestras)**
- Hero stats zone at top — aggregate metrics for that entity (count, trends)
- Compact filter toolbar below hero: search input + dropdown filters in one row
- Data-dense table below filter bar
- Tables get full visual treatment:
  - Avatars alongside names (where entity has photos)
  - Colored status badges (not plain text)
  - Icon-based action buttons (edit, delete) — not text links
- Clear vertical flow: hero → filters → data

**Table Design**
- Avatars alongside entity names
- Colored status badges with distinct colors per status
- Icon-based action buttons (edit, delete, view)
- Clean, well-spaced rows
- Column headers with subtle styling

**Color Palette**
- Multi-color pastel system already implemented in Phase 18
- Each entity type has its own distinct pastel color (teachers, students, orchestras)
- Entity colors consistent across all pages (stat cards, badges, accents)

**Overall Feel**
- Light, airy backgrounds
- Cards with subtle borders
- Data dominant — numbers biggest elements
- Pastel color accents
- Clear zoning on every page
- Professional but friendly

### Claude's Discretion
- Exact pastel hue assignments per entity
- Specific spacing values and density adjustments
- Typography weight and size specifics within the "bold hierarchy" direction

### Deferred Ideas (OUT OF SCOPE)
(None specified in CONTEXT.md — this phase was not pre-discussed)
</user_constraints>

---

## Summary

Phase 20 transforms three existing list pages (Teachers, Students, Orchestras) from their current layout — filters-then-stats-then-table — into a consistent, visually anchored structure: hero stats zone first, then compact filter toolbar, then data table. All three pages are ~500-1200 lines of working React and already have the data-fetching logic, pagination, modal wiring, and state intact. This is a **layout and visual layer change**, not a data or logic change.

The entity color system is fully in place from Phase 18: CSS variables define `--color-teachers-bg/fg`, `--color-students-bg/fg`, `--color-orchestras-bg/fg`, all mapped in `tailwind.config.js` and consumed by `StatsCard` through the `color` prop. The `AvatarInitials` component exists in `src/components/domain/AvatarInitials.tsx` and is ready to wire into table rows. The `StatusBadge` and `InstrumentBadge` domain components are already used in Teachers.tsx and Students.tsx table column definitions.

The main work is: (1) build a reusable `EntityHero` zone component (or inline hero pattern used consistently), (2) restyle the filter toolbar from the current card-wrapped stacked layout to a compact single-row toolbar, (3) upgrade `Table.tsx` to support avatar cells in the name column, and (4) harden the `StatusBadge` visual treatment to use distinct colors per status (already partially done — needs verification that active/inactive/graduated variants display distinctly on all three pages).

**Primary recommendation:** Implement a shared `ListPageHero` component that takes entity color, stats array, and add-action button — reused across all three pages. Upgrade `Table.tsx` with an optional avatar render function for the name column. Keep all data-fetching and modal logic in the page files unchanged.

---

## Standard Stack

### Core (already installed, no new packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | v10 | Stagger animations on hero stat cards | Already used in Dashboard.tsx for Phase 19 stat card stagger |
| lucide-react | installed | Icon-based action buttons | Already imported in all three page files |
| clsx | installed | Conditional class composition | Already imported in Table.tsx and page files |
| tailwindcss | v3 | Entity color tokens, spacing, responsive | Token system live from Phase 18 |

### Supporting (domain components already built)
| Component | Path | Purpose | When to Use |
|-----------|------|---------|-------------|
| AvatarInitials | src/components/domain/AvatarInitials.tsx | Avatar with initials fallback | Name cells in Teachers and Students tables |
| StatusBadge | src/components/domain/StatusBadge.tsx | Colored status pills | Status column — already used, needs distinct-color verification |
| InstrumentBadge | src/components/domain/InstrumentBadge.tsx | Instrument label badges | Instrument column — already used |
| StatsCard (ui) | src/components/ui/StatsCard.tsx | Entity-colored stat cards | Hero zone — coloredBg prop, entity color names |
| SearchInput | src/components/ui/SearchInput.tsx | Debounced search with loading state | Filter toolbar |
| Card | src/components/ui/Card.tsx | White surface with border | Hero container, filter toolbar wrapper |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline hero pattern per page | Shared `ListPageHero` component | Shared component creates a maintenance contract (one change propagates); inline is faster to write but diverges |
| Upgrading existing Table.tsx | New table system (TanStack Table) | TanStack Table is correct for complex sort/filter/virtual; overkill here — existing Table.tsx handles pagination server-side, all filtering is backend-driven |
| Badge component | Raw span with classes | Badge component from shadcn/ui is already configured with `active`, `inactive`, `graduated`, `pending` variants |

**Installation:**
```bash
# No new packages needed
```

---

## Architecture Patterns

### Current Page Structure (what exists today)

```
Teachers.tsx (~880 lines)
├── Filter Card (search + instrument dropdown + role select + add button)
├── Stats Cards (6 small plain cards in a grid)
├── Results count + view toggle
└── Table or Grid view

Students.tsx (~1217 lines)
├── Student Form (conditionally rendered full-screen overlay)
├── Filter Card (search + orchestra select + instrument select + stage select + add button)
├── Stats Cards (4 plain cards in a grid)
├── Results count + view mode toggle + select mode controls
└── Table or Grid view

Orchestras.tsx (~551 lines)
├── Add button (top right header)
├── Filter Card (conditional, hidden in dashboard mode)
├── Orchestra List/Grid/Dashboard toggle view
└── Delete confirm dialog
```

### Target Page Structure (what Phase 20 delivers)

```
[EntityPage].tsx
├── ListPageHero               ← NEW: entity-colored hero with stats + add button
│   ├── stat cards (3-4 metrics, coloredBg, entity color)
│   └── add action button (inline, entity-colored)
├── FilterToolbar              ← RESTYLE: compact single-row, no wrapping Card wrapper
│   ├── SearchInput
│   ├── dropdown filters (native select or styled)
│   └── results count (inline, muted text)
└── Table (enhanced)           ← UPGRADE: avatar in name col, better row density
    ├── column: avatar + name (new AvatarInitials cell)
    ├── column: instrument/type badge
    ├── column: status (StatusBadge — already works)
    └── column: actions (Eye + Edit + Trash2 icons, already implemented)
```

### Pattern 1: ListPageHero Component

**What:** A full-width zone using entity pastel background, housing 3-4 stat metric cards + an "add entity" button. Mirrors the Phase 19 Dashboard stat card row but at entity scope.

**When to use:** Top of every list page (Teachers, Students, Orchestras).

**Example:**
```typescript
// Reuses StatsCard with coloredBg + entity color prop
// Framer-motion stagger from Dashboard.tsx pattern

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' } }
}

// Hero zone
<div className="bg-teachers-bg rounded-xl p-6 mb-4">
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-bold text-teachers-fg">מורים</h1>
    {isAdmin && (
      <button className="bg-teachers-fg text-white px-4 py-2 rounded-lg ...">
        + הוסף מורה
      </button>
    )}
  </div>
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="grid grid-cols-2 md:grid-cols-4 gap-3"
  >
    {metrics.map(m => (
      <motion.div key={m.title} variants={itemVariants}>
        <StatsCard {...m} color="teachers" coloredBg />
      </motion.div>
    ))}
  </motion.div>
</div>
```

**Note:** The hero background is the entity pastel (`bg-teachers-bg`), stat cards inside use `coloredBg` (which applies the same entity color to the Card wrapper). This creates a two-tone layering effect consistent with Phase 19 Dashboard cards.

### Pattern 2: Compact Filter Toolbar

**What:** Replace the existing full `<Card>` with generous padding containing multi-row filter layouts with a tighter single-row toolbar zone.

**When to use:** Below hero zone on every list page.

**Example:**
```typescript
// Before (current): Full Card with flex-col md:flex-row wrapping
<Card className="mb-6" padding="md">
  <div className="flex flex-col md:flex-row gap-4">...

// After: Single-row toolbar, always horizontal, compact
<div className="flex items-center gap-3 mb-4 flex-wrap">
  <SearchInput ... className="w-64 flex-none" />
  <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg ...">
  <select ...>
  <span className="text-sm text-muted-foreground mr-auto">
    {count} תוצאות
  </span>
</div>
```

### Pattern 3: Table Name Cell with Avatar

**What:** First column cell renders `AvatarInitials` + name text side by side, replacing bare text name.

**When to use:** Teachers table (name col), Students table (name col). Orchestras has no natural avatar — use a musical note icon or colored initial instead.

**Example:**
```typescript
// In column definition:
{
  key: 'name',
  header: 'שם',
  render: (row: any) => (
    <div className="flex items-center gap-3">
      <AvatarInitials
        firstName={row.rawData?.personalInfo?.firstName}
        lastName={row.rawData?.personalInfo?.lastName}
        size="sm"
        colorClassName="bg-teachers-bg text-teachers-fg"
      />
      <span className="font-medium text-gray-900">{row.name}</span>
    </div>
  )
}
```

**Note:** `AvatarInitials` accepts `firstName`, `lastName`, `fullName`, `src`, `size`, `colorClassName`. The `colorClassName` prop controls the fallback background — use entity color (`bg-teachers-bg text-teachers-fg`) to tie avatar to entity identity.

### Pattern 4: Table Row Density

**What:** Table.tsx currently uses `py-4` for TD cells. Switching to `py-3` gains ~25% more rows visible without scrolling (the phase goal). Column header padding matches.

**Example change in Table.tsx:**
```typescript
// Before
'px-6 py-4 whitespace-nowrap text-sm text-gray-900'

// After
'px-4 py-3 whitespace-nowrap text-sm text-gray-900'
```

**Note:** Column header `px-6 py-3` → `px-4 py-3`. Uniform reduction — no per-column logic needed.

### Anti-Patterns to Avoid

- **Moving data-fetching logic:** `loadTeachers`, `loadStudents`, `loadData` in Orchestras — do NOT touch. All pagination state, debounce, school year subscription stays in place.
- **Breaking modal wiring:** AddTeacherModal, StudentForm, OrchestraForm, ConfirmationModal — all their open/close state and handlers remain untouched.
- **Adding TanStack Table / AG Grid:** Overkill. The custom Table.tsx is sufficient for server-side pagination. Adding a table library means replacing all column definitions across 3 pages plus the Table component itself — massive churn for no feature gain.
- **Removing grid view:** Teachers.tsx and Students.tsx have grid/card toggle mode. Keep it. The hero stats zone and filter toolbar apply equally to both view modes. Do not remove the view toggle.
- **Hero inside the table card:** The hero must sit ABOVE the filter toolbar as the first visual landmark — not embedded inside the data card.
- **Uniform badge colors:** StatusBadge variants must be visually distinct. Do not use a single gray/neutral for all non-active states. Check badge.tsx variants: `active` = green-100/green-800, `inactive` = gray-100/gray-700, `graduated` = purple-100/purple-800, `pending` = orange-100/orange-800. These are already correct — verify they render distinctly at the page level.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Avatar with initials fallback | Custom `<div>` with CSS clip | `AvatarInitials` from domain components | Already built in Phase 17, handles src/fallback/size |
| Status color mapping | Inline ternary chains per page | `StatusBadge` + `badge.tsx` variants | Variant map covers all statuses; adding new status = 1 line in badge.tsx |
| Stagger animation | CSS animation-delay per item | framer-motion `staggerChildren` | Already patterned in Dashboard.tsx; copy exact variant objects |
| Filter state URL sync | Build new `useFilterState` hook | Keep existing `useSearchParams` pattern | Each page already does this correctly; not worth abstracting |
| Entity color per-page | Hardcode colors in each file | Tailwind entity color tokens (`bg-teachers-bg`, `text-teachers-fg`) | Token layer is the source of truth; hardcoding diverges immediately |

**Key insight:** The existing domain components + token system cover every visual need. The implementation risk is layout restructuring within large page files — not missing primitives.

---

## Common Pitfalls

### Pitfall 1: Table.tsx maxHeight Clipping the Hero

**What goes wrong:** Table.tsx uses `max-h-[calc(100vh-280px)]` on the scroll container. After adding a hero zone (~200px), the table will clip too early — less content visible, not more.

**Why it happens:** The 280px offset was calibrated for the old layout (header + filters only). Adding a hero zone adds ~200px to page height before the table.

**How to avoid:** Increase the calc offset to account for the hero height. Estimate: hero zone (~180px) + filter toolbar (~52px) + header (~64px) + buffer (~24px) = ~320px minimum. Use `max-h-[calc(100vh-340px)]` or make it configurable via a `maxHeight` prop on Table.

**Warning signs:** If the table shows only 4-5 rows before scrolling on a 1080p screen, the offset is too aggressive.

### Pitfall 2: Orchestras Page Has No Natural Avatar Target

**What goes wrong:** Orchestras don't have a `personalInfo` field with firstName/lastName. Attempting to pass `undefined` to `AvatarInitials` renders empty fallback initials ("").

**Why it happens:** `getInitials` in nameUtils handles undefined gracefully but returns empty string — the avatar renders as a blank circle.

**How to avoid:** For Orchestras name column, use a music note icon (`Music` from lucide-react) in a styled circle instead of `AvatarInitials`. Or use orchestra `type` (תזמורת/הרכב) as a letter initial.

**Warning signs:** Blank avatar circles in the orchestra table.

### Pitfall 3: Stagger Animation Direction in RTL

**What goes wrong:** If framer-motion variants use `x` offset (slide from right/left), RTL layout means the visual direction is reversed — items appear to animate FROM off-screen in the wrong direction.

**Why it happens:** CSS `direction: rtl` flips the visual axis but framer-motion's `x` values are CSS `translateX` (physical pixels, not logical). `x: -20` = moves left visually even in RTL.

**How to avoid:** Use ONLY `y` offset (vertical slide) for stagger animations on list pages. The Phase 19 Dashboard pattern (`y: 12`) is correct and RTL-safe. Copy it directly — do not add `x` offset.

**Warning signs:** Stat cards appear to slide in from wrong side.

### Pitfall 4: Filter Toolbar Wrapping on Mobile

**What goes wrong:** Compact single-row toolbar with 3-4 filters wraps to multiple lines on mobile, defeating the "compact" goal.

**Why it happens:** Filters in a single `flex` row exceed mobile viewport width.

**How to avoid:** Use `flex-wrap` on the toolbar container but ensure search input stays full-width on mobile (`w-full md:w-auto`). The existing card-based layout already does `flex-col md:flex-row` — the new toolbar just needs the same responsive treatment but without the Card padding overhead.

**Warning signs:** Filter controls stack vertically on desktop viewports.

### Pitfall 5: Hero Stats Based on Loaded Page, Not Total

**What goes wrong:** Hero stats show numbers from the currently loaded page (20 records) instead of the total count. E.g. "3 פעילים" when there are actually 45 active teachers.

**Why it happens:** The existing code already partially handles this: `totalTeachersCount` from pagination tracks the total, but `activeTeachers = teachers.filter(t => t.isActive).length` counts only the loaded subset.

**How to avoid:** Hero metrics that require totals (active count, inactive count) should use `totalTeachersCount` (from the API pagination response) for the primary count, and note that sub-category counts (active/inactive breakdown) are estimates from the loaded page unless the API provides them. The API currently returns total count but not active-count breakdowns. Solution: show "סה״כ מורים" from API total, and "פעילים מתוך הטעינה" for loaded-subset stats — or request that the hero shows only metrics the API explicitly returns.

**Warning signs:** Hero shows "5 active" while filter bar shows "47 total teachers."

---

## Code Examples

Verified patterns from direct codebase inspection:

### Hero Zone: Framer Motion Stagger (copy from Dashboard.tsx)

```typescript
// Source: src/pages/Dashboard.tsx (Phase 19 pattern)
// This exact pattern is RTL-safe (y-only), 15ms ease-out, 60ms stagger
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' } }
}

// Usage:
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  className="grid grid-cols-2 md:grid-cols-4 gap-3"
>
  {metrics.map((m) => (
    <motion.div key={m.title} variants={itemVariants}>
      <StatsCard {...m} color="teachers" coloredBg />
    </motion.div>
  ))}
</motion.div>
```

### Avatar in Table Column Definition

```typescript
// Source: src/components/domain/AvatarInitials.tsx interface + src/pages/Teachers.tsx columns pattern
import { AvatarInitials } from '../components/domain'

const columns = [
  {
    key: 'name',
    header: 'שם המורה',
    render: (row: any) => (
      <div className="flex items-center gap-3">
        <AvatarInitials
          firstName={row.rawData?.personalInfo?.firstName}
          lastName={row.rawData?.personalInfo?.lastName}
          size="sm"
          colorClassName="bg-teachers-bg text-teachers-fg"
        />
        <span className="font-medium text-gray-900">{row.name}</span>
      </div>
    )
  },
  // ... other columns unchanged
]
```

### Entity Color Token Usage

```typescript
// Source: tailwind.config.js + src/index.css entity color vars
// Correct pattern — uses Tailwind token classes, not CSS var() directly

// Hero background:
<div className="bg-teachers-bg ...">

// Button on hero:
<button className="bg-teachers-fg text-white ...">

// Avatar fallback:
<AvatarInitials colorClassName="bg-teachers-bg text-teachers-fg" />

// StatsCard:
<StatsCard color="teachers" coloredBg />

// Entity tokens available:
// teachers:   bg-teachers-bg / text-teachers-fg   → sky blue pastel
// students:   bg-students-bg / text-students-fg   → violet pastel
// orchestras: bg-orchestras-bg / text-orchestras-fg → amber pastel
```

### StatusBadge Variants (verify these are distinct)

```typescript
// Source: src/components/ui/badge.tsx
// variant → visual result:
// 'active'      → green-100 bg, green-800 text    (פעיל)
// 'inactive'    → gray-100 bg,  gray-700 text     (לא פעיל)
// 'graduated'   → purple-100 bg, purple-800 text  (בוגר)
// 'pending'     → orange-100 bg, orange-800 text  (ממתין)
// mapped by:
// src/components/domain/StatusBadge.tsx → STATUS_VARIANT_MAP
```

### Table.tsx Reduced Row Density

```typescript
// Source: src/components/ui/Table.tsx (current)
// Change TD padding for denser rows:

// Current (line 126):
'px-6 py-4 whitespace-nowrap text-sm text-gray-900'

// Target:
'px-4 py-3 whitespace-nowrap text-sm text-gray-900'

// Current TH (line 74):
'px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider'

// Target (match reduced horizontal padding):
'px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider'
```

---

## What's Already Done (No Work Needed)

These items are complete from previous phases and must NOT be changed:

| Item | Status | Location |
|------|--------|----------|
| Entity color CSS vars (students/teachers/orchestras/orchestras) | DONE Phase 18 | src/index.css |
| Entity color Tailwind tokens | DONE Phase 18 | tailwind.config.js |
| StatsCard `color` prop with entity names + `coloredBg` | DONE Phase 18-19 | src/components/ui/StatsCard.tsx |
| AvatarInitials component | DONE Phase 17 | src/components/domain/AvatarInitials.tsx |
| StatusBadge with domain status variants | DONE | src/components/domain/StatusBadge.tsx |
| InstrumentBadge | DONE | src/components/domain/InstrumentBadge.tsx |
| Table.tsx with column render functions | DONE | src/components/ui/Table.tsx |
| Icon action buttons (Eye, Edit, Trash2) in table columns | DONE | Teachers.tsx, Students.tsx columns |
| framer-motion stagger pattern | DONE Phase 19 | Dashboard.tsx — copy this |
| Pagination + debounce search logic | DONE | All three page files |
| URL search param persistence | DONE | Teachers.tsx, Students.tsx |

---

## File Impact Map

This phase modifies exactly these files (no new component files required):

| File | Change Type | Scope |
|------|-------------|-------|
| `src/pages/Teachers.tsx` | Restructure layout | Hero zone (top), compact filter toolbar, avatar in name column, remove old stats section |
| `src/pages/Students.tsx` | Restructure layout | Hero zone (top), compact filter toolbar, avatar in name column, remove old stats section |
| `src/pages/Orchestras.tsx` | Restructure layout | Hero zone (top), compact filter toolbar (for non-dashboard modes), orchestras icon avatar in name col |
| `src/components/ui/Table.tsx` | Minor upgrade | Reduce TD/TH px-6→px-4, py-4→py-3; update maxHeight calc offset; optionally expose maxHeight prop |
| `src/components/ui/StatsCard.tsx` | No change expected | Already has coloredBg and entity color support from Phase 19 |
| `src/components/domain/StatusBadge.tsx` | No change expected | Badge variants already cover all statuses |

**Optional (if standalone component is cleaner):**

| File | Change Type | Scope |
|------|-------------|-------|
| `src/components/ui/ListPageHero.tsx` | NEW (optional) | Shared hero zone component: takes `entityColor`, `title`, `metrics`, `action` |

Whether to extract `ListPageHero` as a shared component or implement inline in each page is **Claude's discretion**. Extracting it keeps the three pages symmetric; inlining is faster to build and modify per-entity.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stats below filters | Hero zone above everything | Phase 20 (this phase) | Visual anchor changes; users see aggregate data before drilling into rows |
| Plain text name in table | Avatar + name | Phase 20 (this phase) | Tables feel more human, entity-rich |
| Uniform gray badges | Distinct-color status badges | Badge variants live since Phase 17, now fully used | Active/inactive/graduated immediately distinguishable |
| Large full-Card filter section | Compact single-row toolbar | Phase 20 (this phase) | More table rows visible above fold |

---

## Open Questions

1. **Hero stats for Orchestras — what metrics?**
   - What we know: Orchestras.tsx has `stats.totalOrchestras`, `stats.activeOrchestras`, `stats.totalMembers`, `stats.orchestrasWithConductor`
   - What's unclear: These are computed client-side from the full `orchestras` array (no server pagination). Orchestras page loads all orchestras at once (no `hasMore`), so all stats are accurate totals.
   - Recommendation: Use all 4 metrics in the hero. No estimation issue.

2. **Orchestras in dashboard mode — does hero apply?**
   - What we know: Orchestras.tsx has a 3-mode toggle (dashboard/grid/table). In `dashboard` mode, it renders `OrchestraManagementDashboard` component which has its own layout.
   - What's unclear: Should the hero zone appear in dashboard mode too?
   - Recommendation: Apply hero zone only in grid/table modes. Dashboard mode already has its own top-level structure. Or: always show hero zone above the mode toggle, hide filter toolbar in dashboard mode (already the case).

3. **Hero height impact on Table.tsx maxHeight**
   - What we know: Table.tsx has `max-h-[calc(100vh-280px)]` — this clips table height relative to viewport.
   - What's unclear: Exact pixel height of hero zone depends on final design. Estimated 180-220px.
   - Recommendation: Change Table.tsx to accept an optional `containerOffset` prop, or increase the hardcoded offset to `calc(100vh-380px)`. The planner should budget this as a task.

---

## Sources

### Primary (HIGH confidence)
- Direct file inspection — `src/pages/Teachers.tsx`, `src/pages/Students.tsx`, `src/pages/Orchestras.tsx`
- Direct file inspection — `src/components/ui/Table.tsx`, `src/components/ui/StatsCard.tsx`, `src/components/ui/badge.tsx`
- Direct file inspection — `src/components/domain/AvatarInitials.tsx`, `src/components/domain/StatusBadge.tsx`
- Direct file inspection — `tailwind.config.js`, `src/index.css` (entity color token definitions)
- Direct file inspection — `src/pages/Dashboard.tsx`, `.planning/phases/19-dashboard-transformation/19-01-PLAN.md` (framer-motion stagger pattern)
- Direct file inspection — `.planning/STATE.md` (confirmed Phase 19 complete, entity colors live)

### Secondary (MEDIUM confidence)
- Phase context document (provided) — decisions on hero stats zone, compact filter toolbar, avatar + icon actions in tables

---

## Metadata

**Confidence breakdown:**
- File impact map: HIGH — direct codebase inspection, all files read
- Token/component availability: HIGH — all confirmed present from Phase 18-19
- Layout restructuring approach: HIGH — clear existing code structure to reorganize
- Pitfalls: HIGH — identified from direct code analysis (maxHeight calc, RTL animation, hero stats sourcing)
- Open questions: MEDIUM — 3 clarifications needed that planner can resolve with default recommendations

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable codebase, 30 days)
