# Phase 22: Visual Architecture Rewrite - Research

**Researched:** 2026-02-19
**Domain:** Visual system architecture — token overhaul, icon system migration, shape language, card removal, page archetype implementation
**Confidence:** HIGH (codebase fully mapped, Phosphor verified via Context7)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Color & tone direction:**
- Entity pastel colors (teacher-blue, student-green, orchestra-purple) are **kept but subdued** — thin accent lines, badge tints, subtle indicators. No full card backgrounds or pastel-filled surfaces
- Sidebar goes **dark (near-black)** — deep charcoal, high contrast against white content area. Strong architectural anchor
- Primary button color is **black** — all primary actions across all pages use black buttons. Authoritative, decisive. Linear/Vercel direction
- Overall page temperature is **cool neutral** — pure grays with no warm tint. Content area is true white or cool gray. Clean, precise, modern

**Shape vocabulary:**
- Corner radius is **sharp (2-4px)** — barely rounded, decisive, architectural. No soft or medium rounding
- Border treatment is **selective** — borders on tables and form inputs where functional, spacing-only for page sections. No decorative borders
- Table rows use **hairline dividers + strong hover** — thin horizontal lines between rows for structure, plus a bold background shift on hover
- Avatars remain **circles** — full-round, contrasting with the sharp UI around them

**Icon style:**
- Icon fill style is **filled (solid)** — strong visual presence
- Icon library switches from **Lucide to Phosphor Icons** — `@phosphor-icons/react`
- Sidebar nav icons: **filled only for active item**, outlined Phosphor variant for inactive items
- Icon sizing: **Claude's discretion** (context-dependent)

### Claude's Discretion

- Icon sizing per context (compact in tables, standard in nav/toolbars)
- Exact shadow values for interaction layers (modals, popovers, dropdowns)
- Typography scale choices for three-level hierarchy (display, section, body)
- Dashboard dominant zone composition and panel arrangement
- Detail page identity block layout specifics
- Exact cool gray values and token definitions

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

---

## Summary

Phase 22 is a structural visual overhaul that touches every layer of the UI — token values, component internals, page layouts, and the icon system. The scope is wide but the changes are compositional (removing wrappers, changing tokens, swapping icons) rather than new feature work. The biggest risks are: (1) the Lucide-to-Phosphor migration covering 209 files, (2) the `--radius` CSS variable being consumed by all Radix UI components via shadcn, and (3) the `ListPageHero` component being the thing to eliminate (not just restyle) on three major list pages.

The current codebase has a warm coral/amber token palette (`--primary: 15 85% 45%`), a white sidebar, `--radius: 0.75rem` (12px), entity pastel backgrounds on `ListPageHero` and `DetailPageHeader`, and 118+ Card import sites. Phase 22 replaces all of this: cool gray tokens, deep charcoal sidebar, 2-4px radius, black primary button, flat surfaces without cards, and Phosphor Icons replacing Lucide.

**Primary recommendation:** Execute as six sequential sub-phases. Token reset first (everything else inherits from it). Icon migration second (mechanical, do it while the token change is fresh). Then card removal, button system, list page archetypes, detail page archetypes, dashboard archetype — in that order. Never mix structural layout changes with token changes in the same commit.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@phosphor-icons/react` | latest | Icon system replacement | Locked decision. Provides fill/regular weight variants per-icon, native tree-shaking, TypeScript typed, RTL `mirrored` prop built-in |
| Tailwind CSS | 3.4.x (current) | Utility styling | Already installed. Token changes go through CSS variables + tailwind config |
| `class-variance-authority` (CVA) | current | Button variant system | Already powering `button.tsx` — extend for black primary |
| Radix UI primitives | current | Tabs, dropdowns, dialogs | Already installed. `--radius` change flows through automatically |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `framer-motion` | 10.x (current) | Tab transitions, stagger entrance | Already installed. Keep for functional transitions only (no decorative) |
| `clsx` / `tailwind-merge` | current | Conditional class composition | Already used across components |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@phosphor-icons/react` | `lucide-react` (keep) | Locked decision — Phosphor required |
| `@phosphor-icons/react` | `heroicons` | Heroicons has no fill/outline toggle per-icon at runtime |
| CSS variable radius | Tailwind `rounded-sm` | CSS var approach keeps shadcn/Radix components in sync automatically |

**Installation:**
```bash
npm install @phosphor-icons/react
```

---

## Architecture Patterns

### Recommended Sub-Phase Structure

```
Phase 22 execution order:
├── 22-A: Token Reset          — CSS vars, tailwind config, sidebar color
├── 22-B: Icon Migration       — Phosphor install, systematic Lucide replacement
├── 22-C: Shape & Button System — radius, button variants, black primary
├── 22-D: Card Removal         — strip Card wrappers from page sections
├── 22-E: List Page Archetypes  — Teachers, Students, Orchestras flat surfaces
├── 22-F: Detail Page Archetypes — Teacher/Student/Orchestra detail dossier
└── 22-G: Dashboard Archetype  — Command center layout, asymmetric zones
```

### Pattern 1: Token Reset (index.css :root)

**What:** Replace warm amber/coral tokens with cool neutral palette. New sidebar tokens for dark charcoal. Sharp `--radius`.

**Current values to replace:**
```css
/* BEFORE */
--background: 210 17% 98%;       /* warm blue-gray */
--primary: 15 85% 45%;           /* coral */
--radius: 0.75rem;               /* 12px — soft */
--sidebar: 0 0% 100%;            /* white */
--sidebar-active-bg: 252 80% 94%; /* violet pill */

/* AFTER (targets) */
--background: 0 0% 100%;         /* true white */
--foreground: 220 15% 11%;       /* near-black, cool */
--primary: 0 0% 0%;              /* black — locked decision */
--primary-foreground: 0 0% 100%;
--radius: 0.125rem;              /* 2px — locked: sharp 2-4px */
--sidebar: 220 20% 13%;          /* deep charcoal — locked decision */
--sidebar-foreground: 0 0% 94%;  /* near-white text */
--sidebar-border: 220 15% 20%;   /* subtle border in dark sidebar */
--sidebar-active-bg: 220 15% 22%; /* darker pill in dark sidebar */
--sidebar-active-fg: 0 0% 100%;  /* white active text */
--muted: 220 14% 96%;            /* cool light gray */
--border: 220 13% 91%;           /* cool gray border */
```

**Entity color subduing:** Current entity pastels (students-bg, teachers-bg, etc.) are vivid backgrounds. Keep the CSS variable tokens but change the VALUES to more subtle versions for badge/accent use:
```css
/* Subdue entity colors — thin accent, not full surface fills */
--color-students-bg:   252 40% 96%;   /* very light tint, barely visible */
--color-students-fg:   252 55% 40%;   /* keep saturated for text/icons */
--color-teachers-bg:   200 35% 95%;
--color-teachers-fg:   200 65% 35%;
--color-orchestras-bg: 45  40% 95%;
--color-orchestras-fg: 38  75% 35%;
```

### Pattern 2: Phosphor Icon Migration

**Source:** Context7 `/phosphor-icons/react` — HIGH confidence.

**Installation verified:**
```bash
npm install @phosphor-icons/react
```

**Usage pattern:**
```tsx
// Source: Context7 /phosphor-icons/react
import { UsersIcon, GraduationCapIcon, MusicNotesIcon } from '@phosphor-icons/react'

// Inactive nav item — outlined (regular weight)
<UsersIcon size={20} weight="regular" />

// Active nav item — filled
<UsersIcon size={20} weight="fill" />

// Table row icon — compact
<UsersIcon size={16} weight="fill" />

// Nav/toolbar icon — standard
<UsersIcon size={20} weight="fill" />
```

**RTL support:** Phosphor has a `mirrored` prop for RTL-correct directional icons (arrows, chevrons). Use this instead of CSS transforms.

```tsx
// RTL-correct back arrow
import { ArrowRightIcon } from '@phosphor-icons/react'
<ArrowRightIcon mirrored size={20} weight="fill" />
```

**TypeScript typing:**
```tsx
import type { Icon, IconProps, IconWeight } from '@phosphor-icons/react'

// For dynamic icon components (e.g., nav items)
interface NavItem {
  icon: Icon
  activeIcon?: Icon  // or use weight prop
}
```

**Lucide-to-Phosphor name mapping (critical list for this codebase):**
```
Lucide → Phosphor
Home → HouseIcon
Users → UsersIcon
GraduationCap → GraduationCapIcon
BookOpen → BookOpenIcon
Music → MusicNotesIcon
Calendar → CalendarIcon
ClipboardList → ClipboardTextIcon
BarChart3 → ChartBarIcon
UserCheck → UserCircleCheckIcon
Settings → GearIcon
Search → MagnifyingGlassIcon
Menu → ListIcon
X → XIcon
Plus → PlusIcon
Filter → FunnelIcon
Award → MedalIcon
User → UserIcon
Clock → ClockIcon
FileText → FileTextIcon
Shield → ShieldIcon
ChevronDown → CaretDownIcon
Building2 → BuildingsIcon
RefreshCw → ArrowsClockwiseIcon
AlertCircle → WarningCircleIcon
Edit → PencilIcon
Trash2 → TrashIcon
Eye → EyeIcon
ArrowRight → ArrowRightIcon
ChevronLeft → CaretLeftIcon
Save → FloppyDiskIcon
```

**Note:** Phosphor icon names always end in `Icon` (e.g., `UsersIcon`, not `Users`). This is different from Lucide which uses `Users` directly.

### Pattern 3: Button System — Black Primary

**What:** The CVA `button.tsx` already has a `default` variant pointing to `bg-primary`. With `--primary: 0 0% 0%` (black), this flows automatically. No variant logic change needed — only the CSS variable changes.

**Current button.tsx default variant:**
```tsx
default: "bg-primary text-primary-foreground hover:bg-primary/90"
```

With `--primary: 0 0% 0%` this renders as black with white text. The hover becomes `rgba(0,0,0,0.9)` — nearly identical. Consider adding a slightly lighter hover explicitly:

```tsx
// Recommended: explicit hover for black buttons
default: "bg-primary text-primary-foreground hover:bg-neutral-800 active:bg-neutral-900"
```

**All inline `bg-primary-500`, `bg-primary-600` occurrences (105 in pages alone) must be replaced with `bg-black` or `bg-neutral-900` since these are hardcoded hex values that bypass the CSS variable.** This is the critical mechanical work of the button system sub-phase.

### Pattern 4: Shape Language — Radius

**What:** Change `--radius: 0.75rem` to `--radius: 0.125rem` (2px). This flows through all Radix UI components and shadcn primitives automatically. Tailwind utilities `rounded-lg`, `rounded-md`, `rounded-sm` all read from `var(--radius)`.

**Remaining hardcoded classes to audit (237 instances in pages):**
```
rounded-xl → rounded  (or rounded-[2px])
rounded-lg → rounded  (inherits from --radius)
rounded-2xl → rounded
rounded-full → KEEP (avatars — locked decision: avatars remain circles)
```

**Critical exception:** `rounded-full` on avatar elements must be preserved. The only full-circle elements are avatars.

### Pattern 5: Card Removal

**What:** Strip `<Card>` wrappers from page section content. 118+ import sites across the codebase. Card stays ONLY for modals, popovers, dropdowns.

**Which Card usages to keep vs. remove:**
- KEEP: `<Card>` inside `<dialog>`, inside modals, popovers, tooltip content
- REMOVE: `<Card>` wrapping page sections, table containers, stat metric groups, form sections
- KEEP component: The `Card.tsx` component itself (still needed for modals). Just remove inappropriate usages.

**Replacement pattern for removed cards:**
```tsx
// BEFORE: Card wrapper
<Card className="p-6">
  <h3>סיכום שבועי</h3>
  <div>...</div>
</Card>

// AFTER: Section with spacing + typography only
<section className="py-6">
  <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">סיכום שבועי</h3>
  <div>...</div>
</section>
```

### Pattern 6: ListPageHero Elimination

**What:** `ListPageHero` is the hero zone that must be eliminated from list pages per the List Page Archetype. Currently used on Teachers, Students, and Orchestras pages.

**Current ListPageHero does:**
1. Full pastel-background entity-colored hero zone (`bg-teachers-bg`, etc.)
2. Grid of StatsCard components above the table
3. Action button in hero header

**Replace with:**
```tsx
// Compact identity strip — ONE line, not a hero zone
<div className="flex items-center justify-between py-3 mb-0">
  <div className="flex items-center gap-3">
    <h1 className="text-lg font-semibold text-foreground">מורים</h1>
    <span className="text-sm text-muted-foreground">43 פעילים</span>
    {/* ONE key metric inline, not a card grid */}
  </div>
  <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded text-sm font-medium">
    <PlusIcon size={16} weight="fill" />
    הוסף מורה
  </button>
</div>
```

**StatsCard grid above table is eliminated.** Count data moves inline to the identity strip.

### Pattern 7: Toolbar Flush with Table

**Current:** There is a visual gap between toolbar/search area and the table below.

**Target:**
```tsx
// Toolbar row
<div className="flex items-center gap-2 px-0 py-2 border-b border-border">
  <SearchInput ... />
  <FilterDropdown ... />
</div>
{/* NO gap class here — flush to table */}
<Table className="rounded-none border-0 shadow-none" ... />
```

**Table classes to strip:** `rounded-lg`, `shadow-1`, any card wrapper around `<Table />`.

### Pattern 8: Detail Page Identity Block

**What:** Replace entity-colored pastel header zone (`bg-teachers-bg rounded-xl p-6 border`) with a structured identity block using tonal shift only.

**Current `DetailPageHeader`:** Renders a `rounded-xl` pastel entity-colored box containing avatar + name + badges. Tab bar floats below it.

**Target structure:**
```tsx
// Identity block — flat, tonal, not card
<div className="bg-muted/40 border-b border-border px-6 pt-6 pb-0">
  {/* Avatar + name + meta inline */}
  <div className="flex items-center gap-4 pb-4">
    <Avatar ... />  {/* keeps rounded-full */}
    <div>
      <h1 className="text-3xl font-bold text-foreground">{name}</h1>
      <div className="flex items-center gap-2 mt-1">
        {badges}
        {/* Entity accent: thin left border or subtle text color, not full background */}
      </div>
    </div>
  </div>
  {/* Tab bar ATTACHED — no gap — feels like one document */}
  <TabNavigation ... />
</div>
```

**Key change:** Tab bar is INSIDE the identity block container (no vertical gap between identity and tabs). The tab bar border-bottom creates the visual line separating header from content.

### Pattern 9: Sidebar Dark Theme

**What:** Change sidebar from white (`--sidebar: 0 0% 100%`) to deep charcoal.

**Token changes already covered in Pattern 1.** Sidebar JSX in `Sidebar.tsx` already uses `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border` tokens — no JSX changes needed for the color shift.

**Active state change:** Current active uses `bg-sidebar-active-bg` (violet pill) + Lucide icon. After migration:
- Active: `bg-sidebar-active-bg` (dark pill, lighter than sidebar) + Phosphor **filled** icon + white text
- Inactive: no background + Phosphor **regular/outlined** icon + muted text

**Toggle button inside sidebar** currently uses `bg-gray-100 border-gray-200` hardcoded — needs updating to dark sidebar-aware classes.

### Pattern 10: Dashboard Archetype

**What:** Current admin dashboard is a tab system with a symmetric 2x3 stat card grid. Target is asymmetric command center.

**Current layout:**
```
[Tab bar]
[Stat cards 2x3 grid (equal width)]
[DailyTeacherRoomTable]
[2-column charts grid]  |  [Right widgets column]
```

**Target layout:**
```
[NO tab bar — tabs become sections with scroll or secondary nav]
DOMINANT ZONE: [Key metric — large, left-heavy]  [secondary metrics — smaller]
OPERATIONAL PANELS: [left 2/3: DailyTeacherRoomTable]  [right 1/3: Upcoming + Activity]
CONTEXTUAL: [Charts at bottom — lower visual weight]
```

**Grid change:** Replace `grid-cols-2 md:grid-cols-3` (symmetric) with asymmetric layout:
```tsx
// Dominant zone: 2:1 split
<div className="grid grid-cols-[2fr_1fr] gap-6">
  {/* Primary metric — large */}
  <div className="...">
    <span className="text-6xl font-bold">{activeStudents}</span>
  </div>
  {/* Secondary metrics — stacked smaller */}
  <div className="flex flex-col gap-3">...</div>
</div>

// Operational panels: 3:2 split
<div className="grid grid-cols-[3fr_2fr] gap-6 mt-6">
  <DailyTeacherRoomTable />
  <div className="space-y-4">
    <UpcomingEventsWidget />
    <RecentActivityWidget />
  </div>
</div>
```

### Anti-Patterns to Avoid

- **Don't make `--radius: 0` (zero):** Absolute zero looks broken at borders/overflows. Use 2px (0.125rem).
- **Don't convert every rounded-full to rounded:** Avatars are the exception — must stay `rounded-full`.
- **Don't remove Card from modal/dialog content:** Card wrapper inside dialog is correct — it IS floating content.
- **Don't batch token + layout + icon changes in one commit:** Three separate change classes. Commit each independently.
- **Don't use `weight="fill"` on every Phosphor icon by default:** Only sidebar active nav and prominent toolbar icons use fill. Dense table icons use `weight="regular"` or small `weight="bold"` for legibility at small sizes.
- **Don't leave `bg-primary-500` hardcoded values:** These bypass the CSS variable. 105 instances in pages must be mechanically replaced.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon fill/outline toggle by state | Custom SVG inline variants | `@phosphor-icons/react` weight prop | Built-in: `weight="fill"` vs `weight="regular"` |
| RTL arrow mirroring | CSS `transform: scaleX(-1)` | Phosphor `mirrored` prop | Semantically correct, no layout reflow |
| Button variant system | New button component | Extend existing CVA `button.tsx` | Already wired to radix slot, motion, focus ring |
| Token-driven radius | Per-component border-radius overrides | Single `--radius` CSS var change | Flows through all Radix/shadcn automatically |
| Sidebar dark mode | Media query or separate theme | CSS variable update in `:root` | Sidebar tokens already factored out |

**Key insight:** The token system is already factored correctly — CSS variables in `:root`, consumed by Tailwind. A small number of token changes creates broad visual change. The danger is hardcoded Tailwind color classes (`bg-primary-500`, `rounded-xl`) that bypass the variable system and must be found manually.

---

## Common Pitfalls

### Pitfall 1: Hardcoded Color Classes Bypassing Tokens

**What goes wrong:** Developer changes `--primary` CSS variable to black but the UI still shows coral/orange in many places. Dashboard stat cards still have `bg-primary-500 text-white` hardcoded.

**Why it happens:** Tailwind allows two syntaxes: `bg-primary` (uses CSS var) and `bg-primary-500` (hardcoded hex from config). Only `bg-primary` responds to the CSS variable.

**How to avoid:** Before starting token work, run:
```bash
grep -rn "bg-primary-[0-9]\|text-primary-[0-9]\|border-primary-[0-9]" src/
```
There are 105+ instances in pages alone. These must ALL be audited and replaced with semantic token classes (`bg-primary`, `bg-black`, `bg-neutral-900`) or removed.

**Warning signs:** After token change, some elements change color, others don't.

### Pitfall 2: `rounded-full` Collateral Damage

**What goes wrong:** A global find/replace of `rounded-xl` and `rounded-lg` also hits avatar elements that must stay `rounded-full`. Avatars lose their circular shape.

**Why it happens:** AvatarInitials, StatusBadge, and role badge pills all use `rounded-full`. If the replace targets `rounded` broadly, these break.

**How to avoid:** Replace only `rounded-xl`, `rounded-lg`, `rounded-2xl`, `rounded-md` — never touch `rounded-full`. Verify avatar components after each batch.

**Warning signs:** Avatar elements appear as rectangles.

### Pitfall 3: Sidebar Text Becomes Unreadable After Dark Background

**What goes wrong:** Sidebar background changes to dark charcoal but inline hardcoded `text-gray-600`, `text-gray-400`, `hover:bg-gray-100` classes remain. These are invisible or near-invisible against dark sidebar.

**Why it happens:** The nav link rendering in `Sidebar.tsx` mixes token-based classes (`text-sidebar-foreground`) with hardcoded gray classes. When sidebar was white, `text-gray-600` was fine. On dark sidebar, it reads as near-invisible dark gray on dark background.

**How to avoid:** After updating sidebar tokens, audit every class inside the sidebar component for hardcoded gray text/background classes:
```tsx
// BEFORE (invisible on dark sidebar)
className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"

// AFTER (token-based)
className="text-sidebar-foreground/70 hover:bg-sidebar-active-bg hover:text-sidebar-foreground"
```

**Warning signs:** Nav links not visible, search input completely dark.

### Pitfall 4: ListPageHero Removal Breaks Count/Stats

**What goes wrong:** The stat cards inside `ListPageHero` displayed active count, student count, etc. When `ListPageHero` is removed, this data disappears from the UI.

**Why it happens:** The metrics array passed to `ListPageHero` was the only place these numbers appeared in the list page header zone.

**How to avoid:** Before removing `ListPageHero`, identify which metrics it displayed and move the KEY metric (count) to the inline identity strip. Secondary stats may move below the toolbar or be removed if not essential.

**Warning signs:** No count shown for entities after migration.

### Pitfall 5: Card Removal Inside Tab Content Breaks Visual Structure

**What goes wrong:** Removing cards from tab content areas leaves a visually undifferentiated blob of content with no clear section hierarchy.

**Why it happens:** Cards provided the visual grouping. Without them, sections need explicit heading + spacing + optional `border-b` dividers to maintain readability.

**How to avoid:** When removing a card from a tab section, add:
1. A section heading (if not already present) with `text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3`
2. A consistent bottom margin/padding between sections (`pb-6` or `mb-6`)
3. Optional thin `border-b border-border` between major sections

**Warning signs:** Tab content feels like a single undifferentiated block.

### Pitfall 6: Phosphor Icon Names Are Different from Lucide

**What goes wrong:** Developer imports `Users` from Phosphor but the icon is named `UsersIcon`. TypeScript throws an error, or worse, a different icon is shown.

**Why it happens:** Phosphor always appends `Icon` to the name. Lucide uses bare names. Direct find/replace of the import path without renaming the identifiers breaks builds.

**How to avoid:** When migrating, ALWAYS update both the import path AND the identifier name:
```tsx
// BEFORE
import { Users, Calendar } from 'lucide-react'

// AFTER
import { UsersIcon, CalendarIcon } from '@phosphor-icons/react'
```

**Warning signs:** TypeScript errors on icon component names, or icons showing as empty space.

---

## Code Examples

### Complete Token Reset (:root)
```css
/* Source: Phase 22 locked decisions + CSS variable system */
:root {
  /* Cool neutral palette — locked: no warm tint */
  --background: 0 0% 100%;           /* true white */
  --foreground: 220 15% 11%;         /* near-black, cool */
  --card: 0 0% 100%;                 /* white */
  --card-foreground: 220 15% 11%;
  --primary: 0 0% 0%;               /* black — locked */
  --primary-foreground: 0 0% 100%;
  --secondary: 220 14% 96%;
  --secondary-foreground: 220 15% 11%;
  --muted: 220 14% 96%;             /* cool light gray */
  --muted-foreground: 220 10% 46%;
  --border: 220 13% 91%;            /* cool gray */
  --input: 220 13% 91%;
  --radius: 0.125rem;               /* 2px — sharp */

  /* Dark sidebar — locked */
  --sidebar: 220 20% 13%;           /* deep charcoal */
  --sidebar-foreground: 0 0% 94%;
  --sidebar-border: 220 15% 20%;
  --sidebar-active-bg: 220 15% 22%;
  --sidebar-active-fg: 0 0% 100%;
  --sidebar-label: 220 10% 55%;

  /* Entity colors — subdued (locked: thin accent use only) */
  --color-students-bg:   252 40% 96%;
  --color-students-fg:   252 55% 40%;
  --color-teachers-bg:   200 35% 95%;
  --color-teachers-fg:   200 65% 35%;
  --color-orchestras-bg: 45  40% 95%;
  --color-orchestras-fg: 38  75% 35%;

  /* Shadows — interaction layers only */
  --shadow-0: none;
  --shadow-1: none;                  /* no decorative elevation */
  --shadow-2: 0 2px 8px -2px rgba(0,0,0,0.12), 0 1px 4px -1px rgba(0,0,0,0.08);
  --shadow-3: 0 8px 24px -4px rgba(0,0,0,0.16), 0 4px 12px -2px rgba(0,0,0,0.10);
  --shadow-4: 0 16px 40px -4px rgba(0,0,0,0.20), 0 8px 16px -4px rgba(0,0,0,0.12);
}
```

### Sidebar Nav Link with Phosphor Fill/Regular Toggle
```tsx
// Source: Context7 /phosphor-icons/react + Sidebar.tsx pattern
import type { Icon } from '@phosphor-icons/react'

interface NavItem {
  name: string
  href: string
  Icon: Icon
}

// In the nav link render:
<NavLink
  to={item.href}
  className={({ isActive }) =>
    `flex items-center justify-between px-4 py-2.5 mx-2 rounded text-sm ${
      isActive
        ? 'bg-sidebar-active-bg text-sidebar-active-fg font-semibold'
        : 'text-sidebar-foreground/70 hover:bg-sidebar-active-bg/50 hover:text-sidebar-foreground'
    }`
  }
>
  {({ isActive }) => (
    <>
      <span>{item.name}</span>
      <item.Icon
        size={18}
        weight={isActive ? 'fill' : 'regular'}
      />
    </>
  )}
</NavLink>
```

### List Page Identity Strip (replaces ListPageHero)
```tsx
// No hero zone — one line, inline count
<div className="flex items-center justify-between py-3 border-b border-border mb-0">
  <div className="flex items-center gap-3">
    <h1 className="text-lg font-semibold text-foreground">מורים</h1>
    <span className="text-sm text-muted-foreground">{totalCount} פעילים</span>
  </div>
  <button className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded text-sm font-medium hover:bg-neutral-800 transition-colors">
    <PlusIcon size={14} weight="fill" />
    הוסף מורה
  </button>
</div>

{/* Toolbar — flush, NO gap */}
<div className="flex items-center gap-2 py-2 border-b border-border">
  <SearchInput ... />
</div>

{/* Table — no card wrapper, no rounded corners */}
<Table className="rounded-none border-0 shadow-none" ... />
```

### Detail Page Identity Block + Attached Tabs
```tsx
// Identity block — tonal not card, tab bar attached inside
<div className="bg-muted/40 border-b border-border">
  <div className="px-6 pt-6 pb-4 flex items-center gap-4">
    <AvatarInitials
      {...nameProps}
      className="rounded-full"   // KEEP rounded-full for avatars
      style={{ borderLeft: `3px solid hsl(var(--color-teachers-fg))` }}  // entity accent
    />
    <div>
      <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
      <div className="flex items-center gap-2 mt-1.5">
        {badges}
      </div>
    </div>
  </div>
  {/* Tab bar INSIDE the block — no gap */}
  <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
</div>

{/* Tab content — continuous document feel */}
<div className="px-6 py-6">
  {/* No Card wrapper — section heading + spacing only */}
</div>
```

---

## Scope Inventory

### Files with significant layout changes (high effort)
| File | Change | Effort |
|------|--------|--------|
| `src/index.css` | Token reset (all CSS vars) | Medium |
| `tailwind.config.js` | Hardcoded color palette audit | Low |
| `src/components/Sidebar.tsx` | Dark theme + Phosphor icons + hardcoded gray removal | High |
| `src/components/ui/ListPageHero.tsx` | Delete or hollow out | Low |
| `src/pages/Teachers.tsx` | Remove ListPageHero, flatten toolbar+table | High |
| `src/pages/Students.tsx` | Remove ListPageHero, flatten toolbar+table | High |
| `src/pages/Orchestras.tsx` | Remove ListPageHero, flatten toolbar+table | High |
| `src/pages/Dashboard.tsx` | Asymmetric command center layout | High |
| `src/components/domain/DetailPageHeader.tsx` | Identity block rewrite, attach tabs | High |
| `src/features/teachers/details/components/TeacherTabNavigation.tsx` | Move inside identity block | Medium |
| `src/components/ui/button.tsx` | Black primary variant, adjust hover | Low |
| `src/components/ui/Card.tsx` | Keep component, remove decorative usages | N/A |

### Mechanical bulk changes (medium effort, many files)
| Task | File Count | Strategy |
|------|-----------|----------|
| Lucide → Phosphor imports | 209 files | Sub-phase B, file-by-file with icon name mapping |
| `bg-primary-[N]` → semantic | 105+ in pages | grep + manual review (some need `bg-black`, some `bg-primary`) |
| `rounded-xl/lg/2xl` → `rounded` | 237+ in pages | grep + replace, preserve `rounded-full` |
| Card wrapper removal | 118+ import sites | Context-dependent — keep in modals, remove in page sections |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact for Phase 22 |
|--------------|------------------|--------------|---------------------|
| Gradient card headers | Entity pastel headers (Phase 21) | Phase 21 | Must now strip pastel backgrounds from headers too |
| Lucide React (scatter weight) | Lucide React (still) | — | Phase 22 migrates to Phosphor |
| `--radius: 0.5rem` | `--radius: 0.75rem` (Phase 16) | Phase 16 | Phase 22 drops to 0.125rem |
| White sidebar | White sidebar (still) | — | Phase 22 goes dark charcoal |
| Warm coral tokens | Warm coral tokens (still) | — | Phase 22 replaces with cool neutral |

---

## Open Questions

1. **Phosphor icon for every Lucide icon used?**
   - What we know: Phosphor has 1,200+ icons. The 30+ Lucide icons in use are all common icons.
   - What's unclear: A few Lucide icons may not have exact Phosphor equivalents (e.g., `ClipboardList` → `ClipboardTextIcon` is close but may differ visually)
   - Recommendation: Do a visual audit of the mapping list during the migration sub-phase. Accept nearest equivalent.

2. **How many Card usages in modals vs. page sections?**
   - What we know: 118+ Card import sites exist. Modal-wrapped cards are correct to keep.
   - What's unclear: Without auditing each site, the exact split is unknown.
   - Recommendation: During Card removal sub-phase, audit each import file before touching it. Check if the Card is inside a `<dialog>`, `Modal`, or floating element before deciding to remove.

3. **Dashboard tab system — eliminate or keep?**
   - What we know: Current dashboard has tabs (Overview, Students, Schedule, Bagrut, Hours). The archetype spec says "no tab bar" for dashboard.
   - What's unclear: Secondary tabs may still be useful for the Hours and Bagrut sub-views.
   - Recommendation: Remove the top-level Overview/Students/Schedule/Bagrut tabs. Convert Hours and Bagrut to secondary sections below the main command center. If needed, a subtle secondary nav (not a prominent tab bar) can link to these.

4. **RTL implications of asymmetric grid layouts?**
   - What we know: The codebase is RTL-first. CSS `grid-cols-[2fr_1fr]` in RTL means the 2fr column is visually on the LEFT (which is the END in RTL = less prominent end).
   - What's unclear: Whether the dominant zone should be at the physical start (right in RTL) or always visually on left.
   - Recommendation: In RTL, `dir="rtl"` makes the first grid column appear on the RIGHT. So `grid-cols-[2fr_1fr]` renders dominant zone on RIGHT — which is the START in Hebrew, the natural dominant position. This is correct behavior. No adjustment needed.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/phosphor-icons/react` — Installation, usage patterns, TypeScript types, `mirrored` prop, weight variants
- Codebase direct inspection — `src/index.css` (all current token values), `tailwind.config.js` (all current color tokens), `Sidebar.tsx` (full JSX), `Dashboard.tsx` (full JSX), `ListPageHero.tsx`, `DetailPageHeader.tsx`, `button.tsx`, `Card.tsx`, `TeacherTabNavigation.tsx`, `TeacherDetailsPage.tsx`
- `.planning/ARCHETYPES.md` — Four archetype structural definitions (direct file read)
- `.planning/phases/22-visual-architecture-rewrite/22-CONTEXT.md` — Locked decisions

### Secondary (MEDIUM confidence)
- Grep counts (rounded: 237, Card imports: 118, lucide files: 209, primary-[N]: 105) — accurate at research time, may drift

### Tertiary (LOW confidence)
- Lucide → Phosphor icon name mapping — based on knowledge of both libraries. Individual icon names should be verified against Phosphor docs during implementation.

---

## Metadata

**Confidence breakdown:**
- Token system (current values + targets): HIGH — direct file read
- Phosphor Icons API: HIGH — Context7 verified
- Scope counts (file counts, class counts): HIGH — grep at research time
- Icon name mapping: MEDIUM — training knowledge, verify during implementation
- Dashboard asymmetric layout specifics: MEDIUM — compositional, needs iteration

**Research date:** 2026-02-19
**Valid until:** 2026-03-20 (30 days — stable libraries, internal codebase)
