# Architecture Patterns: Visual Identity Transformation

**Domain:** React SaaS — visual identity upgrade on existing shadcn/ui + Tailwind + Framer Motion stack
**Researched:** 2026-02-18
**Confidence:** HIGH (direct codebase analysis + verified library knowledge)

---

## Context: What Has Already Been Built (v2.0)

This is a SUBSEQUENT MILESTONE. The v2.0 milestone completed the shadcn/ui migration. The following infrastructure is already in place and must NOT be re-done:

- CSS custom properties (`:root` block) in `src/index.css` — warm coral/amber palette: `--primary: 15 85% 45%`, `--background: 30 25% 97%`, `--sidebar: 220 25% 18%`
- Tailwind config consuming CSS vars (`hsl(var(--primary))` pattern) — all semantic tokens mapped
- shadcn/ui primitives: `button.tsx`, `badge.tsx`, `input.tsx`, `select.tsx`, `label.tsx`, `alert.tsx`, `tabs.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `switch.tsx`, `checkbox.tsx`, `separator.tsx`, `progress.tsx`, `avatar.tsx`
- Domain components: `DetailPageHeader.tsx`, `AvatarInitials.tsx`, `InstrumentBadge.tsx`, `StatusBadge.tsx`, `StatsCard.tsx`
- Framer Motion `AnimatePresence` + `motion.div` for tab content transitions (`opacity: 0→1`, `duration: 0.2`) in all three detail pages
- RTL: `dir="rtl"` on `html` element, logical properties throughout

The v2.1 work **layers on top of** this infrastructure. The question is: which layer do you touch to produce which visual outcome?

---

## The Three Layers of Visual Identity Change

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: TOKEN LAYER                                           │
│  src/index.css :root { }   tailwind.config.js                   │
│                                                                 │
│  Controls: color palette, radius, font-size scale,             │
│            shadow scale, spacing scale, motion durations        │
│  Change: Edit CSS custom property values                        │
│  Regression risk: LOW (values change, class names stay same)    │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: COMPONENT LAYER                                       │
│  src/components/ui/     src/components/domain/                  │
│                                                                 │
│  Controls: element structure, spacing rules, which tokens used, │
│            density, animation props on motion elements          │
│  Change: Edit TSX className strings, motion props              │
│  Regression risk: MEDIUM (API unchanged, rendering changes)     │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: LAYOUT/STRUCTURE LAYER                                │
│  src/components/Layout.tsx   Sidebar.tsx   Header.tsx           │
│  src/features/[module]/details/   src/pages/                    │
│                                                                 │
│  Controls: chrome architecture, page structure, column layout   │
│  Change: Restructure JSX, add/remove elements                   │
│  Regression risk: HIGH (every page depends on Layout)           │
└─────────────────────────────────────────────────────────────────┘
```

**Rule:** Touch Layer 1 first. Validate. Then Layer 2. Validate. Then Layer 3. Never skip levels.

---

## Recommended Architecture

### System Overview: Visual Identity Stack

```
┌─────────────────────────────────────────────────────────────────┐
│  src/index.css :root {}                                         │
│                                                                 │
│  --background       --foreground      --primary                 │
│  --card             --muted           --accent                  │
│  --border           --ring            --radius                  │
│                                                                 │
│  NEW for v2.1:                                                  │
│  --shadow-0  --shadow-1  --shadow-2  --shadow-3  --shadow-4    │
│  --duration-instant  --duration-fast  --duration-base           │
│  --ease-standard  --ease-bounce  --ease-decelerate              │
│  --font-size-xs  --font-size-sm  --font-size-base  --font-size-lg │
│  --font-size-xl  --font-size-2xl  --font-size-3xl               │
│  --font-weight-normal  --font-weight-medium  --font-weight-bold │
└───────────────────────────────┬─────────────────────────────────┘
                                │ consumed by
┌───────────────────────────────▼─────────────────────────────────┐
│  tailwind.config.js                                             │
│                                                                 │
│  extend.boxShadow: { 0: var(--shadow-0), 1: var(--shadow-1) }  │
│  extend.fontSize: { xs: var(--font-size-xs), ... }             │
│  extend.transitionDuration: { fast: var(--duration-fast), ... } │
└───────────────────────────────┬─────────────────────────────────┘
                                │ applied by
┌───────────────────────────────▼─────────────────────────────────┐
│  src/components/ui/                                             │
│                                                                 │
│  button.tsx     ← spacing density, weight, shadow on active    │
│  badge.tsx      ← border weight, color intensity               │
│  card.tsx       ← shadow level, background tint, radius        │
│  tabs.tsx       ← indicator weight, active bg contrast         │
│  dialog.tsx     ← shadow level (highest elevation)             │
└───────────────────────────────┬─────────────────────────────────┘
                                │ composed by
┌───────────────────────────────▼─────────────────────────────────┐
│  src/components/domain/                                         │
│                                                                 │
│  DetailPageHeader.tsx   ← gradient intensity, avatar size       │
│  StatsCard.tsx          ← icon color, number weight, shadow     │
│  StatusBadge.tsx        ← color saturation, border              │
└───────────────────────────────┬─────────────────────────────────┘
                                │ framed by
┌───────────────────────────────▼─────────────────────────────────┐
│  src/components/Layout.tsx   Sidebar.tsx   Header.tsx           │
│                                                                 │
│  Background color (--background)                                │
│  Content area padding/density                                   │
│  Sidebar width + shadow                                         │
│  Header height + border                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility in v2.1 | Touches |
|-----------|------------------------|---------|
| `src/index.css :root` | Single source of truth for ALL values | Layer 1 only |
| `tailwind.config.js` | Maps CSS vars to Tailwind class names | Layer 1 bridge |
| `src/components/ui/button.tsx` | Size/density variants, hover animation | Layer 2 |
| `src/components/ui/card.tsx` | Surface color, shadow level, radius | Layer 2 |
| `src/components/ui/tabs.tsx` | Tab indicator style, active state contrast | Layer 2 |
| `src/components/domain/DetailPageHeader.tsx` | Gradient, avatar size, badge placement | Layer 2 |
| `src/components/domain/StatsCard.tsx` | Icon prominence, number typography | Layer 2 |
| `src/components/Layout.tsx` | Content area density, page max-width | Layer 3 |
| `src/components/Sidebar.tsx` | Background, nav item density, active indicator | Layer 3 |
| `src/components/Header.tsx` | Height, logo size, shadow | Layer 3 |
| Framer Motion variants | Tab transition style (slide vs fade), duration | Layer 2 (motion props) |

---

## Five Visual Identity Dimensions and Their Touch Points

### Dimension 1: Color Evolution

**Goal:** Move from flat palette to layered surface hierarchy — background, surface, elevated surface, overlay.

**Where to change:** `src/index.css :root {}` only. No component changes required.

**Current state (from codebase):**
```css
--background: 30 25% 97%;   /* warm off-white page background */
--card: 30 20% 99%;          /* barely different from background — no hierarchy */
--muted: 25 15% 93%;         /* muted sections */
--sidebar: 220 25% 18%;      /* dark sidebar */
```

**Recommended change — add surface tiers:**
```css
:root {
  /* Surface hierarchy — each level lighter/more elevated */
  --surface-base: 30 25% 97%;       /* page background = existing --background */
  --surface-raised: 30 20% 100%;    /* cards, panels (pure white — higher contrast than base) */
  --surface-overlay: 0 0% 100%;     /* modals, dropdowns */

  /* Update existing tokens to match hierarchy */
  --background: 30 25% 97%;         /* unchanged */
  --card: 0 0% 100%;                /* change: pure white for clear elevation over background */
  --popover: 0 0% 100%;             /* unchanged — already pure white */

  /* Border evolution: subtle layering */
  --border: 25 15% 90%;             /* slightly more visible than current 25 12% 88% */
  --border-strong: 25 20% 80%;      /* for emphasis borders, dividers */
}
```

**RTL consideration:** Color changes have no RTL implications.

**Confidence:** HIGH — token-only change, no cascade risk.

---

### Dimension 2: Surface Hierarchy (Elevation System)

**Goal:** Give each surface layer a distinct shadow so depth reads clearly — page, card, panel, modal.

**Where to change:** Token layer (new shadow vars) + Tailwind config (map to class names) + component classNames.

**Token additions to `src/index.css`:**
```css
:root {
  /* Shadow scale — 5 levels, warm-tinted for coral/amber brand */
  --shadow-0: none;
  --shadow-1: 0 1px 2px -1px hsl(20 15% 15% / 0.08);        /* cards at rest */
  --shadow-2: 0 4px 8px -2px hsl(20 15% 15% / 0.10),         /* hovered cards, panels */
              0 2px 4px -2px hsl(20 15% 15% / 0.06);
  --shadow-3: 0 8px 16px -4px hsl(20 15% 15% / 0.12),        /* sidebars, drawers */
              0 4px 8px -4px hsl(20 15% 15% / 0.08);
  --shadow-4: 0 20px 40px -8px hsl(20 15% 15% / 0.16),       /* modals, dialogs */
              0 8px 16px -8px hsl(20 15% 15% / 0.10);
}
```

**Tailwind config mapping:**
```javascript
extend: {
  boxShadow: {
    '0': 'var(--shadow-0)',
    '1': 'var(--shadow-1)',
    '2': 'var(--shadow-2)',
    '3': 'var(--shadow-3)',
    '4': 'var(--shadow-4)',
  }
}
```

**Component application:**
- `card.tsx` — `className="shadow-1 hover:shadow-2 transition-shadow duration-200"` (MEDIUM change — className edit only)
- `dialog.tsx` — `className="shadow-4"` (MEDIUM change)
- Sidebar overlay — `shadow-3` via Sidebar.tsx (MEDIUM change)
- `stat-card` — `shadow-1 hover:shadow-2` (MEDIUM change)

**Existing conflict:** `tailwind.config.js` currently defines `boxShadow.soft`, `boxShadow.card`, `boxShadow.card-hover`, `boxShadow.sidebar`, `boxShadow.header` with raw values. These can co-exist with the new numeric scale, or be removed and replaced. The recommendation is to keep existing names during the transition but point them to the new vars: `'card': 'var(--shadow-1)'`. This avoids any risk from existing code that still uses `shadow-card` class names.

**RTL consideration:** Shadows use no directional properties. No RTL risk.

**Confidence:** HIGH.

---

### Dimension 3: Typography Scale

**Goal:** Create clear size hierarchy with defined weights — stop relying on gray-ness for differentiation, use size + weight contrast.

**Where to change:** Token layer + Tailwind extension (optional for semantic naming). The existing Tailwind `text-*` size utilities already work; this is about ensuring consistent semantic use patterns.

**Current state:** No explicit type scale tokens. Raw Tailwind sizes used ad-hoc (`text-sm`, `text-base`, `text-lg`, `text-2xl`) with no semantic meaning.

**Recommended approach — semantic token aliases in CSS:**
```css
:root {
  /* Typography scale — semantic aliases over Tailwind defaults */
  /* These become CSS vars that can be tuned without finding every usage */
  --text-xs: 0.75rem;     /* 12px — labels, badges, captions */
  --text-sm: 0.875rem;    /* 14px — body, table cells, form labels */
  --text-base: 1rem;      /* 16px — primary body text */
  --text-lg: 1.125rem;    /* 18px — section headers, card titles */
  --text-xl: 1.25rem;     /* 20px — page section headings */
  --text-2xl: 1.5rem;     /* 24px — entity names in detail page headers */
  --text-3xl: 1.875rem;   /* 30px — dashboard hero numbers */

  /* Font weight scale */
  --weight-normal: 400;
  --weight-medium: 500;   /* body default — already set on html/body */
  --weight-semibold: 600;
  --weight-bold: 700;

  /* Line height scale */
  --leading-tight: 1.25;  /* headings */
  --leading-normal: 1.5;  /* body */
  --leading-relaxed: 1.6; /* dense data readability */
}
```

**Key visual identity move:** The current codebase uses `font-weight: 500` universally (on `html` and `body`). The visual identity upgrade requires using weight as a differentiator:
- Data values, entity names: `font-semibold` (600)
- Labels, secondary text: `font-medium` (500) — stays as is
- Captions, metadata: `font-normal` (400)

**Hebrew font consideration (HIGH importance):** Heebo (the primary font) supports weights 100–900. The custom Reisinger Yonatan only has a Regular (400) variant loaded. Do NOT apply `font-bold` or `font-semibold` to text using `font-reisinger-yonatan` — the browser will synthesize a bold variant which looks poor with Hebrew letterforms. Use Heebo only for weight variations.

**RTL consideration:** Hebrew text renders right-to-left but Heebo is specifically designed for Hebrew — font metrics and rendering are correct at all weights. No RTL issues with typography itself. Text truncation (`truncate`) can cause issues in RTL: prefer `overflow-hidden text-ellipsis` on RTL containers and verify on actual Hebrew strings.

**Confidence:** HIGH.

---

### Dimension 4: Animation System

**Goal:** Unify all motion under a token-driven system. Current state is two parallel systems with no coordination: CSS keyframe animations in `tailwind.config.js` + Framer Motion in feature pages.

**Current animation inventory (from codebase inspection):**

| Animation | Location | Duration | Purpose |
|-----------|----------|----------|---------|
| `animate-fade-in` | Tailwind keyframe + `Layout.tsx` `.p-6` wrapper | 150ms | Page content entry |
| `animate-slide-down` / `animate-slide-up` | Tailwind keyframes | 200ms | Toast, panel |
| `animate-scale-in` | Tailwind keyframe | 200ms | Modal |
| `AnimatePresence` + `motion.div opacity 0→1` | `TeacherDetailsPage`, `StudentDetailsPage`, `OrchestraDetailsPage` | 200ms | Tab content fade |
| `.card-interactive:hover` | `components.css` | CSS transition (unspecified) | Card lift |
| `.btn:hover` | Tailwind plugin component | 200ms | Button state |

**Recommended motion token additions:**
```css
:root {
  /* Duration tokens — semantic names */
  --duration-instant: 100ms;   /* micro-interactions: checkbox check, toggle flip */
  --duration-fast: 150ms;      /* page entry, content fade */
  --duration-base: 200ms;      /* standard transitions: hover, modal appear */
  --duration-slow: 300ms;      /* layout shifts, sidebar slide */
  --duration-enter: 200ms;     /* elements entering the DOM */
  --duration-exit: 150ms;      /* elements leaving (exit faster than enter) */

  /* Easing tokens */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);    /* Material standard easing */
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);    /* elements entering screen */
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);    /* elements leaving screen */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* deliberate spring for brand moments */
}
```

**Framer Motion integration — how to wire tokens:**

The Framer Motion `transition` prop accepts raw values. To use CSS vars you must resolve them in JavaScript:

```tsx
// src/lib/motionTokens.ts — single source of motion values
export const motionTokens = {
  duration: {
    instant: 0.1,
    fast: 0.15,
    base: 0.2,
    slow: 0.3,
    enter: 0.2,
    exit: 0.15,
  },
  ease: {
    standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
    decelerate: [0, 0, 0.2, 1] as [number, number, number, number],
    accelerate: [0.4, 0, 1, 1] as [number, number, number, number],
    bounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  },
} as const

// Shared transition presets
export const transitions = {
  tabContent: { duration: motionTokens.duration.base, ease: motionTokens.ease.decelerate },
  modal: { duration: motionTokens.duration.base, ease: motionTokens.ease.decelerate },
  page: { duration: motionTokens.duration.fast, ease: motionTokens.ease.standard },
  hover: { duration: motionTokens.duration.base, ease: motionTokens.ease.standard },
} as const
```

**Existing Framer Motion usage — what to upgrade:**

The current tab transition in `TeacherDetailsPage.tsx` (and equivalents in Student, Orchestra):
```tsx
// CURRENT — raw values, no system
<motion.div
  key={activeTab}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
```

**Upgraded — system-connected, with slide-in for bolder identity:**
```tsx
// NEW — uses token system, adds subtle y-translation for confidence
import { transitions } from '@/lib/motionTokens'

<motion.div
  key={activeTab}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -4 }}
  transition={transitions.tabContent}
>
```

**RTL and animation direction:** The current tab transitions use `opacity` only — no directional animation — which is RTL-safe. If slide animations are added (translateX), they MUST flip direction in RTL. The correct approach:

```tsx
// RTL-aware slide direction — reads document dir at runtime
const isRTL = document.documentElement.dir === 'rtl'
const slideDirection = isRTL ? -1 : 1

initial={{ opacity: 0, x: 24 * slideDirection }}
exit={{ opacity: 0, x: -16 * slideDirection }}
```

Since the entire app is Hebrew RTL and direction never changes, a simpler constant is acceptable: `const SLIDE_OUT_X = -16` (visual left in RTL = logical end direction). Verify visually in the browser.

**`prefers-reduced-motion` compliance:** Already handled — `src/index.css` has a `@media (prefers-reduced-motion: reduce)` block that sets `animation-duration: 0.01ms`. Framer Motion also reads `prefers-reduced-motion` via its built-in `useReducedMotion()` hook. Apply it to all new Framer Motion variants:

```tsx
import { useReducedMotion } from 'framer-motion'

const prefersReduced = useReducedMotion()
const tabTransition = prefersReduced ? { duration: 0 } : transitions.tabContent
```

**Confidence:** HIGH for token structure (established pattern). MEDIUM for exact animation values (needs visual validation).

---

### Dimension 5: Density Changes

**Goal:** Tighten whitespace on data-dense pages (tables, forms) and increase whitespace on header surfaces (detail page hero, stat cards) for visual hierarchy.

**Where to change:** Component classNames only. No new tokens needed — Tailwind spacing scale is sufficient.

**Current density issues (from codebase):**
- `StatCard` has `p-6` on all variants — same density at all sizes
- Table rows use implicit Tailwind defaults — inconsistent
- Tab navigation in detail pages: `px-6` on the TabsList, but triggers and content use different spacing

**Recommended density map:**

| Surface | Current | Recommended | Rationale |
|---------|---------|-------------|-----------|
| Stat cards | `p-6` | `p-5` | Tighter for dashboard grid |
| Table rows | varies | `px-4 py-3` | Consistent 48px effective row height |
| Form field groups | varies | `gap-4` between fields, `gap-6` between sections | Visual grouping |
| Detail page header | `p-6` | `px-6 py-8` | More breathing room for hero surface |
| Modal body | `p-6` | `p-6` | Keep — dialog content needs room |
| Sidebar nav items | `px-4 py-3` | `px-4 py-2.5` | Slightly tighter, more items visible |
| Page content wrapper | `p-6` | `px-6 py-6` | Maintain current |

**RTL consideration:** All padding changes must use `px-*` (symmetric) or logical `ps-*`/`pe-*` for asymmetric cases. Never use `pl-*`/`pr-*` alone for density changes.

**Confidence:** HIGH.

---

## Data Flow for Animation State

```
User clicks tab trigger
    ↓
Radix Tabs fires onValueChange(newTab)
    ↓
React state: setActiveTab(newTab)
    ↓
Re-render: AnimatePresence detects key change (key={activeTab})
    ↓
Exit animation plays on outgoing motion.div (opacity 0, y -4)
    ↓
Enter animation plays on incoming motion.div (opacity 1, y 0)
    ↓
transition: transitions.tabContent (from motionTokens.ts)
    ↓
If prefersReducedMotion: duration collapses to 0
```

This data flow is already implemented. The v2.1 change is: (1) move raw transition values to `motionTokens.ts`, (2) add `y` translation for bolder feel, (3) add `useReducedMotion()` guard.

---

## Build Order (Dependency Chain)

**Rule:** Each phase must complete before the next. Visual changes compound — bad token values in Phase 1 will look wrong everywhere.

```
Phase 1: Token Evolution (zero component changes)
  ├── Update color tokens: surface hierarchy, border refinement
  ├── Add shadow tokens (--shadow-0 through --shadow-4)
  ├── Add motion tokens (--duration-*, --ease-*)
  ├── Add/verify typography tokens
  └── Create src/lib/motionTokens.ts

  Files changed: src/index.css, tailwind.config.js, src/lib/motionTokens.ts (new)
  Regression risk: LOW — additive only
  Validation: Existing pages should look slightly different (card surfaces pop, muted areas warmer)

Phase 2: Primitive Component Density + Shadow
  ├── card.tsx — shadow-1, hover:shadow-2, updated radius, surface color
  ├── button.tsx — density variants, active:scale-95 already there, shadow on hover
  ├── badge.tsx — color intensity, border weight
  ├── tabs.tsx — active indicator weight, bg contrast
  ├── dialog.tsx — shadow-4, scrim opacity
  └── input.tsx — focus ring tightness

  Files changed: src/components/ui/* (6 files)
  Regression risk: MEDIUM — every form and dialog affected
  Validation: Visual regression check on Student form (7 tabs), teacher detail tabs, a dialog

Phase 3: Domain Component Visual Upgrade
  ├── DetailPageHeader.tsx — gradient intensity, avatar sizing
  ├── StatsCard.tsx — icon weight, number typography, shadow
  ├── StatusBadge.tsx — color saturation, border decision
  └── InstrumentBadge.tsx — if color intensity needs updating

  Files changed: src/components/domain/* (4 files)
  Regression risk: LOW-MEDIUM — domain components are composed, not foundational
  Validation: Teacher detail page header, dashboard stat cards

Phase 4: Motion System Upgrade
  ├── Wire motionTokens.ts into TeacherDetailsPage.tsx
  ├── Wire motionTokens.ts into StudentDetailsPage.tsx
  ├── Wire motionTokens.ts into OrchestraDetailsPage.tsx
  ├── Add useReducedMotion() guards
  └── Upgrade tab transitions (add y-translation)

  Files changed: 3 feature detail pages
  Regression risk: LOW (visual only, no logic)
  Validation: Navigate tabs rapidly, check no visual glitching, check reduced-motion

Phase 5: Layout Shell
  ├── Sidebar.tsx — shadow-3, active item indicator style
  ├── Header.tsx — border vs shadow decision, height
  └── Layout.tsx — page max-width decision, content area density

  Files changed: Layout.tsx, Sidebar.tsx, Header.tsx
  Regression risk: HIGH — every page depends on shell
  Validation: Full page tour all 18 pages, mobile hamburger menu, sidebar open/close

Phase 6: Page-Level Density Pass (if needed after Phase 5)
  ├── Dashboard page — stat card grid, greeting
  ├── List pages — table density, header
  └── Special pages — Ministry Reports, Settings, Import

  Files changed: src/pages/* (specific pages only)
  Regression risk: LOW (page-specific, isolated)
```

---

## New vs Modified Files

### New Files (create fresh)

| File | Purpose |
|------|---------|
| `src/lib/motionTokens.ts` | Motion token constants + transition presets |

### Modified Files: Token Layer

| File | Change Type | What Changes |
|------|------------|--------------|
| `src/index.css` | Edit `:root {}` values | Add `--shadow-*`, `--duration-*`, `--ease-*` vars; refine color token values |
| `tailwind.config.js` | Extend config | Add `boxShadow.0` through `boxShadow.4` mapped to vars; add animation duration extensions |

### Modified Files: Component Layer

| File | Change Type | What Changes |
|------|------------|--------------|
| `src/components/ui/card.tsx` | className edit | Shadow class, background token, radius |
| `src/components/ui/button.tsx` | className edit | Size density, hover shadow, active state |
| `src/components/ui/badge.tsx` | className edit | Color intensity of existing variants |
| `src/components/ui/tabs.tsx` | className edit | Active indicator, bg contrast |
| `src/components/ui/dialog.tsx` | className edit | Shadow level, scrim color |
| `src/components/ui/input.tsx` | className edit | Focus ring |
| `src/components/domain/DetailPageHeader.tsx` | className + props | Gradient, avatar size |
| `src/components/domain/StatsCard.tsx` | className | Typography weight, icon styling |
| `src/components/domain/StatusBadge.tsx` | className | Color saturation |

### Modified Files: Layout/Structure Layer

| File | Change Type | What Changes |
|------|------------|--------------|
| `src/components/Layout.tsx` | Structural | Content wrapper density, max-width |
| `src/components/Sidebar.tsx` | className | Shadow, nav item density, active indicator |
| `src/components/Header.tsx` | className | Border/shadow decision |

### Modified Files: Feature Layer (animation only)

| File | Change Type | What Changes |
|------|------------|--------------|
| `src/features/teachers/details/components/TeacherDetailsPage.tsx` | motion props | Wire motionTokens, add y-translation |
| `src/features/students/details/components/StudentDetailsPage.tsx` | motion props | Same |
| `src/features/orchestras/details/components/OrchestraDetailsPage.tsx` | motion props | Same |

---

## Architectural Patterns

### Pattern 1: Token-First Change

**What:** Change the CSS custom property value in `:root {}`. Every component consuming that token updates globally with zero component edits.

**When to use:** Color evolution, shadow scale changes, radius changes. Any "change the look everywhere" intent.

**Example:**
```css
/* Want cards to feel more elevated — change the token, not every component */
:root {
  --card: 0 0% 100%;  /* was: 30 20% 99% — pure white creates more contrast */
}
/* All components using bg-card now automatically show pure white */
```

**Trade-off:** Low risk but low precision — changes ALL consumers of that token simultaneously. Test after each token change.

---

### Pattern 2: Variant Extension on Existing CVA Components

**What:** Add a new variant to an existing `cva()` component without touching the default.

**When to use:** When you need a new visual treatment (e.g., `ghost` button with new shadow behavior) but cannot change the `default` variant without regression.

**Example:**
```tsx
// In button.tsx — adding 'elevated' variant that uses the new shadow system
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Existing variants unchanged
        elevated: "bg-card text-foreground shadow-1 hover:shadow-2 border border-border",
        // NEW variant — safe to add, doesn't touch existing
      },
    },
  }
)
```

**Trade-off:** Safe (no regression). Requires adoption — existing callsites continue using old variants.

---

### Pattern 3: Framer Motion Token Centralization

**What:** Extract all Framer Motion values to a central `motionTokens.ts` and import presets rather than inline values.

**When to use:** Any time a `motion.div` has a `transition` prop with raw numbers.

**Example:**
```tsx
// BEFORE (scattered raw values, no system)
<motion.div transition={{ duration: 0.2 }}>

// AFTER (token-connected, consistent, easy to tune globally)
import { transitions } from '@/lib/motionTokens'
<motion.div transition={transitions.tabContent}>
```

**Trade-off:** Requires creating the module first (Phase 1). Small cost, large maintainability gain.

---

### Pattern 4: Shadow-as-Elevation (Not Border-as-Elevation)

**What:** Use shadow tokens to distinguish surface levels rather than borders. Borders denote separation (sections, form fields); shadows denote elevation (cards float above page, dialogs float above cards).

**When to use:** Any component that "sits above" the page — cards, panels, modals, sidebar.

**Current state:** The app uses `border border-gray-200` on most cards and panels — this creates separation but not elevation. Combined with the nearly identical `--background` and `--card` colors, surfaces appear flat.

**Recommended application:**
```tsx
// card.tsx — elevation over border-only
className={cn(
  "rounded-lg bg-card shadow-1 hover:shadow-2 transition-shadow",
  "duration-[var(--duration-base)]",
  // Keep border for semantic containment, but let shadow carry elevation
  "border border-border/50",  // reduce border emphasis
)}
```

**Trade-off:** Subtle shadows require careful color calibration — warm-tinted shadows look better on warm backgrounds. The shadow tokens recommended above use warm-tinted umbra to match the coral palette.

---

## Anti-Patterns

### Anti-Pattern 1: Component-First Changes

**What people do:** Edit individual component classNames without updating the underlying token. Result: 15 different card shadow values across the codebase.

**Why it's wrong:** When the design needs to change again, every place must be found and changed independently. Tokens are the only scalable approach.

**Do this instead:** Change the token in `:root {}`. If multiple components need different shadow intensities, create semantic tokens (`--shadow-card`, `--shadow-modal`) that reference the scale tokens.

---

### Anti-Pattern 2: Replacing Opacity with Y-Translation Without RTL Check

**What people do:** Add `initial={{ x: 24 }}` to create a slide-in animation, forgetting the app is RTL.

**Why it's wrong:** `x: 24` means "slide from the left" in screen coordinates. In RTL, content flows right-to-left, so sliding from the left creates a backwards animation — element appears to emerge from "behind" existing content rather than "arriving from the side."

**Do this instead:** Use `y` translation only (vertical slides are direction-agnostic), or multiply `x` by the RTL direction constant: `x: 24 * (isRTL ? -1 : 1)`. Since this app is always RTL, a constant `-24` is safe for LTR-would-be-positive values.

---

### Anti-Pattern 3: Adding Motion to Every Interaction

**What people do:** After discovering Framer Motion, animate list row entries, filter toggles, badge appearances, and button presses.

**Why it's wrong:** The existing philosophy in `tailwind.config.js` explicitly removes decorative infinite animations. Every animation adds JavaScript execution cost and distracts from content. The conservatory audience uses this tool for dense data management — excessive animation is a usability regression.

**Do this instead:** Animate only transitions between states (tab switch, modal open/close, page entry) and leave micro-interactions to CSS transitions on `:hover` and `:focus`. Framer Motion for state transitions only.

---

### Anti-Pattern 4: Changing `font-reisinger-yonatan` Font Weight

**What people do:** Apply `font-bold` or `font-semibold` to Hebrew text styled with `font-reisinger-yonatan`.

**Why it's wrong:** Only the Regular (400) weight of Reisinger Yonatan is loaded (confirmed in `index.css` `@font-face` — only one `font-weight: 400` declaration). The browser will synthesize a bold variant which looks visually poor for Hebrew letterforms.

**Do this instead:** Use Heebo (the primary sans font) for any text that needs weight variation. `font-reisinger-yonatan` is specifically for display/brand contexts where the Regular weight is intentional.

---

### Anti-Pattern 5: Touching Layout.tsx First

**What people do:** Start the visual identity upgrade with the sidebar and header because they "set the tone." The sidebar is where the brand lives!

**Why it's wrong:** Every one of the 18 pages depends on Layout.tsx, Sidebar.tsx, and Header.tsx. A regression here is a regression everywhere. The visual system built in Phases 1–4 must be validated in a low-risk context first.

**Do this instead:** Build the token layer, fix primitives, upgrade domain components, fix animations — then apply the proven visual system to the shell. When the shell changes, it immediately looks right because the system underneath is proven.

---

## RTL Considerations Summary

| Change Type | RTL Risk | Mitigation |
|-------------|---------|------------|
| Color token changes | None | N/A |
| Shadow token changes | None | N/A |
| Radius changes | None | N/A |
| Typography weight changes | Low (Heebo handles it) | Avoid on Reisinger Yonatan |
| Padding density changes | Medium | Use `px-*` (symmetric) or `ps-*`/`pe-*` (logical) — never `pl-*`/`pr-*` alone |
| Framer Motion opacity | None | Opacity is direction-agnostic |
| Framer Motion y-translation | None | Vertical is direction-agnostic |
| Framer Motion x-translation | HIGH | Must multiply by RTL direction: `(isRTL ? -1 : 1)` |
| CSS slide animations | HIGH | Use `translateX` with logical calc, or use `translateY` instead |
| Sidebar transform | VERIFIED WORKING | Current code uses `translate-x-full` correctly for RTL |

---

## Integration Points

### Existing Token System (Must Preserve)

The current `:root {}` has 15 working CSS custom properties that all existing components consume. The v2.1 changes are ADDITIVE (new shadow/motion/typography vars) plus REFINEMENTS to existing color values (not renames). Never rename an existing CSS custom property — every component using it breaks silently.

### Tailwind Config Integration

The `tailwind.config.js` already maps all semantic tokens. New additions follow the same pattern:
- New `boxShadow.*` entries map to `--shadow-*` vars
- The existing custom RTL plugin and animation keyframes must be preserved

### Framer Motion Integration

The `AnimatePresence` + `motion.div` pattern already exists in exactly 3 files. The `src/lib/motionTokens.ts` module is the integration point — import presets from it and replace inline values. No new Framer Motion imports needed beyond what already exists.

### shadcn/ui CVA Components

All shadcn primitive components use `cva()`. The integration point is the `variants` object. New visual variants can be added safely. Changing defaults carries regression risk — add new variants where possible and migrate callsites deliberately.

---

## Sources

- Direct codebase inspection: `src/index.css`, `tailwind.config.js`, `src/components/ui/*`, `src/features/teachers/details/components/TeacherDetailsPage.tsx`, `src/components/domain/*`, `src/components/Layout.tsx`, `src/components/Sidebar.tsx` (HIGH confidence — 2026-02-18)
- Elevation token design patterns: designsystems.surf/articles/depth-with-purpose (MEDIUM confidence — general design system guidance, not shadcn-specific)
- Motion design token naming conventions: ruixen.com/blog/motion-design-tokens (MEDIUM confidence — confirms semantic token naming approach)
- Framer Motion RTL direction-aware animations: sinja.io/blog/direction-aware-animations-in-framer-motion (MEDIUM confidence — general pattern, adapted for RTL context)
- Josh W Comeau shadow design guidance: joshwcomeau.com/css/designing-shadows/ (MEDIUM confidence — warm-tinted shadow rationale)
- Fluid typography with CSS clamp: moderncss.dev, web.dev (MEDIUM confidence — fluid scale referenced but static scale recommended for this app given fixed viewport context)
- Heebo font capabilities: training knowledge + index.css inspection (HIGH confidence for loaded weights, MEDIUM for full weight range)

---

*Architecture research for: v2.1 Visual Identity Transformation — Tenuto.io Frontend*
*Researched: 2026-02-18*
