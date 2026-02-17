# Architecture Patterns: shadcn/ui Migration + Design System

**Domain:** React conservatory management app — UI/UX redesign
**Researched:** 2026-02-17
**Confidence:** HIGH (based on direct codebase analysis + HIGH-confidence library knowledge)

---

## Current State Assessment

### What Already Exists (HIGH confidence — direct codebase inspection)

The app is already **partially migrated** to shadcn/ui patterns. This is the most important finding.

**Already shadcn-style (use `cn`, `cva`, `@radix-ui`):**

| File | Status | Notes |
|------|--------|-------|
| `src/components/ui/button.tsx` | shadcn-complete | Uses CVA, Slot, cn |
| `src/components/ui/card.tsx` | shadcn-complete | Uses cn, forwardRef |
| `src/components/ui/input.tsx` | shadcn-complete | Uses cn, forwardRef |
| `src/components/ui/select.tsx` | shadcn-complete | Uses Radix Select primitive |
| `src/components/ui/badge.tsx` | shadcn-complete | Uses CVA |
| `src/components/ui/label.tsx` | shadcn-complete | Uses Radix Label |
| `src/components/ui/progress.tsx` | shadcn-complete | Uses Radix Progress |
| `src/components/ui/textarea.tsx` | shadcn-complete | Uses cn |
| `src/components/ui/alert.tsx` | shadcn-complete | Uses CVA |
| `src/lib/utils.ts` | complete | `cn()` utility with twMerge + clsx |

**Dependencies already installed:**
- `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-slot` — in `dependencies`
- `class-variance-authority` v0.7.1 — in `dependencies`
- `clsx` v2.0.0 — in `dependencies`
- `tailwind-merge` v1.14.0 — in `dependencies`

**Custom components still needing migration:**
- `src/components/ui/Modal.tsx` — roll-your-own, no Radix Dialog
- `src/components/ui/Table.tsx` — custom HTML table
- `src/components/ui/DesignSystem.tsx` — collection of custom components
- `src/components/ui/Pagination.tsx` — custom
- `src/components/ui/Calendar.tsx` — custom
- `src/components/ui/ConfirmDeleteModal.tsx`, `ConfirmationModal.tsx`, `InputModal.tsx` — custom

**Critical gap — CSS variable token layer missing:**

`src/index.css` has NO `:root` CSS variable block. The shadcn components in `button.tsx`, `select.tsx`, `input.tsx` reference semantic tokens like `bg-primary`, `bg-background`, `text-muted-foreground`, `border-input`, `ring-ring` — but these CSS variables are not defined. This means the existing shadcn components are **partially broken** visually: they render but fall back to undefined values.

**No `components.json`** — shadcn CLI has not been initialized. Components were added manually.

---

## Recommended Architecture

### Layer Model

```
Layer 1: CSS Custom Properties (:root)        ← The "token layer"
          --background, --foreground, --primary, --muted, etc.

Layer 2: tailwind.config.js                   ← Maps tokens to Tailwind classes
          colors.primary = 'hsl(var(--primary))'
          colors.background = 'hsl(var(--background))'

Layer 3: src/components/ui/                   ← Primitive components
          shadcn components (Button, Input, Select, Card, Dialog, etc.)
          RTL-patched where needed

Layer 4: src/components/[domain]/             ← Domain components
          StatusBadge, InstrumentBadge, StatsCard, etc.
          Built ON TOP of Layer 3 primitives

Layer 5: src/features/[module]/               ← Feature modules
          Tab pages, detail pages, forms
          Consume Layer 3 and Layer 4
```

### Component Boundaries

| Component Layer | Location | Responsibility | Communicates With |
|----------------|----------|---------------|-------------------|
| Token Layer | `src/index.css` `:root` block | CSS custom properties for all semantic colors, radius, shadow | Tailwind config reads these |
| Tailwind Config | `tailwind.config.js` | Maps HSL var tokens to class names | All TSX files via class strings |
| UI Primitives | `src/components/ui/` | Stateless, unstyled-but-themed base components | Feature modules, domain components |
| Domain Components | `src/components/[domain]/` | Conservatory-specific composed components (StatusBadge, InstrumentBadge, StatsCard) | Feature modules, pages |
| Feature Modules | `src/features/[module]/details/` | Tab pages, entity details | API service, state, domain components |
| Pages | `src/pages/` | Route-level views | Feature modules, domain components |
| Layout | `src/components/Layout.tsx` | Shell, sidebar, header | All pages |

### Data Flow

```
User Action
    → Page/Feature Component (state, API calls)
    → Domain Component (props-only, no side effects)
    → UI Primitive (className + HTML semantics)
    → CSS Custom Properties (themed via :root)
    → Rendered pixel
```

---

## Theme / Token Architecture

### The Right Approach: HSL CSS Variables + Tailwind Mapping

shadcn/ui uses a specific token pattern. The app must adopt it to make existing shadcn components work correctly.

**Step 1: Add CSS variable block to `src/index.css`**

```css
:root {
  /* Background & surface */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;

  /* Card surfaces */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  /* Popover/dropdown surfaces */
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  /* Primary brand (indigo-600 equivalent) */
  --primary: 243 75% 59%;        /* maps to existing primary-500 #4F46E5 */
  --primary-foreground: 0 0% 100%;

  /* Secondary/muted */
  --secondary: 215 16% 47%;
  --secondary-foreground: 0 0% 100%;

  /* Muted / disabled surfaces */
  --muted: 220 14% 96%;
  --muted-foreground: 215 16% 47%;

  /* Accent (hover states) */
  --accent: 220 14% 96%;
  --accent-foreground: 222 47% 11%;

  /* Destructive / danger */
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  /* Form borders */
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 243 75% 59%;           /* focus ring = primary color */

  /* Border radius (Monday.com uses moderate rounding) */
  --radius: 0.5rem;
}
```

**Step 2: Update `tailwind.config.js` to consume variables**

```javascript
theme: {
  extend: {
    colors: {
      // Semantic tokens (shadcn layer) - override existing
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
        // Keep existing scale for direct use:
        50: '#eff6ff',
        // ... existing scale preserved
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
  }
}
```

**Why this approach:** The existing shadcn components (`button.tsx`, `input.tsx`, `select.tsx`) already reference these semantic class names (`bg-primary`, `border-input`, `ring-ring`, `text-muted-foreground`). Adding the CSS variable layer makes them work correctly without touching any component code. MEDIUM-HIGH confidence — this is how shadcn/ui is designed to work; verified by reading the existing component source.

### Music Theme Tokens

Add conservatory-specific semantic tokens alongside the shadcn layer:

```css
:root {
  /* Instrument department colors */
  --dept-strings: 212 100% 45%;   /* blue */
  --dept-woodwinds: 142 71% 35%;  /* green */
  --dept-brass: 25 95% 53%;       /* orange */
  --dept-percussion: 0 84% 60%;   /* red */
  --dept-keyboard: 270 91% 65%;   /* purple */
  --dept-voice: 330 81% 60%;      /* pink */

  /* Status colors */
  --status-active: 142 71% 35%;
  --status-inactive: 215 16% 47%;
  --status-graduated: 243 75% 59%;
  --status-suspended: 0 84% 60%;
}
```

---

## RTL Architecture

### Root RTL Approach (Current — Keep This)

The app sets `dir="rtl"` at two points:
1. `<html>` in `index.css`: `direction: rtl`
2. `<div dir="rtl">` wrapping all routes in `AppRoutes`

This is correct. CSS logical properties (`padding-inline-start`, `margin-inline-end`, `border-inline-start`) auto-flip in RTL contexts.

### RTL Problem: shadcn SelectItem Hardcodes `left-2` and `pl-8`

The existing `src/components/ui/select.tsx` has:
```tsx
// BROKEN IN RTL:
<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
<SelectPrimitive.Item className="... pl-8 pr-2 ...">
```

These LTR-specific classes break visual alignment in RTL. The fix is to replace with logical property equivalents:

```tsx
// RTL-SAFE (logical properties):
<span className="absolute start-2 flex h-3.5 w-3.5 items-center justify-center">
<SelectPrimitive.Item className="... ps-8 pe-2 ...">
```

**Note:** Tailwind CSS v3.3+ includes logical property utilities (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`). The app uses Tailwind v3.3.3 — these utilities are available.

### RTL Audit Checklist for Each Migrated Component

When migrating or adding any UI component, check for:
- `left-*` / `right-*` → replace with `start-*` / `end-*`
- `pl-*` / `pr-*` → replace with `ps-*` / `pe-*`
- `ml-*` / `mr-*` → replace with `ms-*` / `me-*`
- `text-left` / `text-right` → replace with `text-start` / `text-end`
- `float-left` / `float-right` → replace with `float-start` / `float-end`
- Icon placement in buttons (chevrons, check marks) → verify direction
- Dropdown/popover positioning anchors (Radix Popper handles this automatically)

### Radix UI Primitives and RTL

Radix UI respects the DOM `dir` attribute automatically for:
- Focus trap direction
- Arrow key navigation (left/right → start/end in RTL)
- Popover/dropdown positioning (via `@floating-ui/react` which the app already has installed)

Radix does NOT automatically flip CSS classes — that is the developer's responsibility (see SelectItem above).

### Monday.com RTL Reference

Monday.com's Hebrew-first design uses these RTL patterns:
- Sidebar on the right side (app currently uses `marginRight` for content offset — correct for RTL)
- Table columns flow right-to-left
- Form labels right-aligned, inputs stretch full width
- Icons in button: icon appears on LEFT of text in LTR, which becomes RIGHT in RTL — use `gap-*` between icon and text rather than specific margin direction

---

## Migration Strategy

### Strategy: Incremental, Component-by-Component, Token-First

Do NOT do a big-bang migration. The app has ~90+ components. Touching all at once introduces regression risk across 18 pages. Instead: **fix the foundation first, then migrate by component priority.**

### Phase 0 — Foundation (Must Be Done First, Zero UI Change)

This phase has no visual change but unblocks all other work.

1. **Add CSS variable token block to `src/index.css`** — fixes the existing broken shadcn components (button, input, select, badge are currently using undefined CSS variables)
2. **Update `tailwind.config.js`** — add semantic color mappings that consume the CSS variables
3. **Initialize `components.json`** (optional but recommended) — enables `npx shadcn-ui@latest add [component]` CLI for future additions
4. **Fix RTL in existing shadcn components** — patch `select.tsx` (`left-2` → `start-2`, `pl-8` → `ps-8`)

**Risk: LOW.** Token layer is additive. Existing Tailwind classes that use raw color values (`bg-primary-500`, `text-gray-700`) continue to work. Only components using semantic class names (`bg-primary`, `text-muted-foreground`) are affected — and they're currently broken, so fixing them is a net improvement.

### Phase 1 — High-Impact Primitives (Migrate First)

Migrate in this order based on usage frequency across the codebase:

| Priority | Component | Current State | Shadcn Component | Usage Count |
|----------|-----------|--------------|-----------------|-------------|
| 1 | Modal/Dialog | Custom `Modal.tsx` | `@radix-ui/react-dialog` | ~15+ places |
| 2 | Table | Custom `Table.tsx` | shadcn Table (thin wrapper) | ~12+ places |
| 3 | Tabs | Custom tab navigation in every feature module | `@radix-ui/react-tabs` | 3 feature modules |
| 4 | Dropdown/Command | `cmdk` already installed | shadcn Command | Search, filters |
| 5 | Form fields | Mix of custom + shadcn | shadcn Form (RHF integration) | 7 forms |

### Phase 2 — Layout Shell

Migrate the Layout chrome (sidebar, header) last — these are the highest-risk components because every page depends on them. Build new design tokens and visual style in primitives first, then apply to Layout.

### Phase 3 — Domain Components

After primitives are stable, rebuild domain-specific components (`StatusBadge`, `InstrumentBadge`, `StatsCard`) on top of shadcn primitives.

### Migration Pattern: Parallel Existence

For each component, use the following pattern:

```
Step 1: Add new shadcn component alongside old one
         OldModal.tsx  ← existing (keep working)
         Modal.tsx     ← new shadcn-based (build new)

Step 2: Test new component in isolation (one non-critical page first)

Step 3: Replace imports page-by-page (students first, then teachers, etc.)

Step 4: Delete old component once all imports converted
```

This means no breaking change at any point. CI catches regressions at each step.

---

## Patterns to Follow

### Pattern 1: Token-Based Theming

Never hardcode color values in components. Use semantic token classes.

```tsx
// BAD - hardcoded, breaks dark mode / theming
<div className="bg-blue-600 text-white">

// GOOD - semantic token, theme-aware
<div className="bg-primary text-primary-foreground">

// GOOD - raw scale acceptable for domain-specific use (instrument badges)
<div className="bg-blue-100 text-blue-800">  {/* strings department */}
```

### Pattern 2: Compose shadcn Primitives for Domain Components

```tsx
// Domain component built on shadcn primitive
import { Badge } from '@/components/ui/badge'

export const InstrumentBadge = ({ category, children }) => {
  const variantMap = {
    strings: 'blue',
    woodwinds: 'green',
    // ...
  }
  return (
    <Badge
      className={cn('border', categoryColors[category])}
    >
      {children}
    </Badge>
  )
}
```

### Pattern 3: RTL-Safe Icon Placement

```tsx
// BAD - icon margin breaks in RTL
<button>
  <Icon className="mr-2" />
  שמור
</button>

// GOOD - gap handles both directions
<button className="inline-flex items-center gap-2">
  <Icon className="w-4 h-4" />
  שמור
</button>
```

### Pattern 4: Dialog Over Modal

Replace the custom `Modal.tsx` with Radix Dialog. Radix Dialog handles:
- Focus trap (correct direction in RTL)
- Escape key close
- Scroll lock
- Portal rendering (avoids z-index stacking)
- ARIA attributes

```tsx
// After migration: consistent dialog API everywhere
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-md" dir="rtl">
    <DialogHeader>
      <DialogTitle>כותרת</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Migrating Layout Before Primitives

**What goes wrong:** You redesign the sidebar and header first. But form fields, tables, and modals still look old. The result is a jarring UI where navigation looks new but content looks unchanged — worse than before.

**Instead:** Establish token layer and migrate primitives first. Layout redesign is the final step, not the first.

### Anti-Pattern 2: Adding `components.json` Without Fixing Token Layer First

**What goes wrong:** `npx shadcn-ui add` generates components with CSS variable references. Without the `:root` block, every newly generated component renders with broken styles.

**Instead:** Add the full `:root` token block to `index.css` before running any shadcn CLI commands.

### Anti-Pattern 3: Using `px-*` / `py-*` for Directional Spacing

**What goes wrong:** `px-4` is fine (symmetric). But `pl-8` and `pr-2` are LTR-specific. In RTL they produce wrong visual output (indicator on wrong side, text shifted wrong way).

**Instead:** Use `ps-*` (padding-start) and `pe-*` (padding-end) for any asymmetric horizontal padding.

### Anti-Pattern 4: Replacing Table.tsx Without a Drop-In API

**What goes wrong:** `Table.tsx` has a specific props API used in ~12+ places. Replacing the component and changing the API simultaneously causes cascading changes and regression.

**Instead:** Keep the existing `Table` props API. Rewrite the internals to use shadcn table primitives, but preserve `columns`, `data`, `onRowClick`, `actions`, `onView`, `onDelete` props. Zero callsite changes needed.

### Anti-Pattern 5: Global `dir` on DialogContent Instead of Inheriting

**What goes wrong:** Some developers add `dir="rtl"` on every dialog. This duplicates what the root `<div dir="rtl">` already provides. When LTR content needs to appear inside a portal, this causes problems.

**Instead:** The Radix Portal renders in `document.body`. Add a single `dir="rtl"` to the Portal root wrapper, or add it only to `DialogContent` where the text actually lives.

---

## Scalability Considerations

| Concern | Current (v1.x) | After Migration | Future Scale |
|---------|---------------|-----------------|--------------|
| Component count | ~90 components, mixed style | ~90 components, unified style | Add new shadcn components via CLI |
| Theme changes | Edit tailwind.config.js | Edit `:root` CSS vars only | Single-variable theme switch |
| Dark mode | Not supported | Ready (add `.dark` `:root` block) | Toggle class on `<html>` |
| New UI components | Write from scratch | `npx shadcn-ui add [name]` | ~2 min per component |
| RTL regression | Manual audit | Logical property lint rules | ESLint plugin for RTL |

---

## Build Order (Roadmap Implications)

Based on dependency analysis and risk assessment:

```
Phase A: Foundation (zero visual change)
  1. Add :root CSS variable token block to index.css
  2. Update tailwind.config.js semantic color mappings
  3. Fix RTL in select.tsx (left-2 → start-2, pl-8 → ps-8)
  4. Initialize components.json

Phase B: Missing shadcn primitives (high leverage)
  5. Add Dialog component (replaces Modal.tsx)
  6. Add Tabs component (replaces custom tab navigation in 3 feature modules)
  7. Add DropdownMenu (replaces inline dropdown patterns)
  8. Add Sheet (side panels, if needed)

Phase C: Redesigned domain components
  9. Rebuild StatusBadge on shadcn Badge
  10. Rebuild InstrumentBadge on shadcn Badge
  11. Rebuild StatsCard/StatCard on shadcn Card
  12. Rebuild Table.tsx internals (preserve props API)
  13. Rebuild Pagination.tsx

Phase D: Form system
  14. Add shadcn Form (wraps react-hook-form — already installed)
  15. Add DatePicker (calendar integration)
  16. Rebuild form components in src/components/form/

Phase E: Layout shell (highest risk, last)
  17. Redesign Sidebar with new tokens
  18. Redesign Header with new tokens
  19. Update Layout.tsx with new visual structure
```

---

## Component Structure After Migration

```
src/
  lib/
    utils.ts              ← cn() — already exists, keep as-is

  components/
    ui/                   ← shadcn primitives (source of truth for base components)
      button.tsx          ← already shadcn, fix token consumption
      card.tsx            ← already shadcn
      input.tsx           ← already shadcn
      select.tsx          ← already shadcn, fix RTL (pl-8 → ps-8)
      badge.tsx           ← already shadcn
      label.tsx           ← already shadcn
      progress.tsx        ← already shadcn
      textarea.tsx        ← already shadcn
      alert.tsx           ← already shadcn
      dialog.tsx          ← ADD (replaces Modal.tsx)
      tabs.tsx            ← ADD (replaces custom tab navigation)
      dropdown-menu.tsx   ← ADD
      table.tsx           ← ADD (shadcn table primitives)
      separator.tsx       ← ADD
      tooltip.tsx         ← ADD
      [deprecated]
        Modal.tsx         ← DELETE after dialog.tsx replaces all usages
        DesignSystem.tsx  ← SPLIT: each named export becomes own file

    [domain]/             ← composed conservatory-specific components
      StatusBadge.tsx     ← built on ui/badge.tsx
      InstrumentBadge.tsx ← built on ui/badge.tsx
      StatsCard.tsx       ← built on ui/card.tsx
      DataTable.tsx       ← built on ui/table.tsx (replaces ui/Table.tsx)
      ConfirmDialog.tsx   ← built on ui/dialog.tsx (replaces ConfirmDeleteModal)

  features/              ← unchanged structure, consume ui/ and domain/ components
    students/
    teachers/
    orchestras/
```

---

## Sources

- Direct codebase analysis: `src/components/ui/`, `tailwind.config.js`, `src/index.css`, `package.json` (HIGH confidence)
- shadcn/ui component patterns: verified by reading installed component files that follow shadcn conventions (HIGH confidence)
- Tailwind CSS v3.3 logical properties (`ps-`, `pe-`, `start-`, `end-`): HIGH confidence — Tailwind v3.3 release notes confirmed logical property support
- Radix UI RTL behavior: MEDIUM confidence — Radix primitives document `dir` prop support; behavior verified via installed `@radix-ui/react-select` usage pattern
- Monday.com design aesthetics: MEDIUM confidence — training knowledge, no live verification available
- `tailwindcss-rtl` plugin: NOT used and NOT needed — app uses logical properties + Tailwind v3.3 built-in logical utilities
