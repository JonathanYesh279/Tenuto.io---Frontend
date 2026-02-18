# Phase 16: Token Foundation - Research

**Researched:** 2026-02-18
**Domain:** CSS custom properties, Tailwind v3 theme extension, Framer Motion v10 spring presets
**Confidence:** HIGH

---

## Summary

Phase 16 establishes the single source of truth for the entire v2.1 visual system: CSS custom properties for surface elevation, neutral scale, and shadows; Tailwind utilities that map to those CSS vars; and a TypeScript motion module with named spring presets. The work divides cleanly into two orthogonal tracks — CSS/Tailwind tokens (plan 16-01) and TypeScript motion tokens + color reconciliation (plan 16-02).

The most consequential finding is the **dual color system conflict**: `primary-500` in `tailwind.config.js` is hardcoded as `#4F46E5` (indigo blue), while `--primary` in `:root` is `hsl(15 85% 45%)` (warm coral). Every usage of `bg-primary-500`, `text-primary-600`, etc. (1,256 occurrences across 131 files) resolves to the indigo blue palette, not the CSS var. These two systems have coexisted silently because `primary: { DEFAULT: "hsl(var(--primary))" }` only controls the bare `bg-primary` / `text-primary` class — suffixed variants (`primary-500`, etc.) still use the hardcoded hex values. TOKEN-05 requires reconciling this before any downstream color phase changes the CSS vars.

Framer Motion v10 is already installed (`^10.16.4`). The `Transition` type accepts `{ type: "spring", stiffness, damping, mass, restDelta }`. A `motionTokens.ts` module needs to export typed constants that any component can import directly — no runtime dependency, no extra package.

**Primary recommendation:** Define CSS tokens first (surfaces, neutrals, shadows) in `:root`, wire Tailwind `boxShadow` to reference those vars via `var()`, then create `motionTokens.ts`, then produce a written inventory of all primary-NNN sites — migration of those 131 files is NOT in scope for this phase (too broad a blast radius), only the inventory + strategy document.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v3.4.19 (installed) | `boxShadow` theme extension, utility generation | Already the project's CSS framework |
| CSS Custom Properties | native | Surface/neutral/shadow token storage in `:root` | Zero-runtime, cascade-safe, browser-native |
| Framer Motion | v10.16.4 (installed) | `Transition` type used by motionTokens | Already installed; v10 spring API is stable |
| TypeScript | v5.9.3 (installed) | Type-safe motion token exports | Project uses TS throughout |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss-animate | ^1.0.7 (installed) | CSS animation utilities | Already wired — no changes needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS custom properties in `:root` | Tailwind theme values only | CSS vars cascade to non-Tailwind contexts (inline styles, Framer Motion `style={}`) |
| Named TS exports in motionTokens.ts | Inline transition objects in each component | Centralization — one change propagates everywhere |
| Inventory doc for dual-color | Full migration in this phase | 131 files is a blast radius that belongs in a dedicated phase; this phase only establishes the token layer |

**Installation:** No new packages required. All tools are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── index.css              # :root {} token additions (surface, neutral, shadow vars)
├── lib/
│   └── motionTokens.ts    # New file: spring presets + duration/easing exports
tailwind.config.js         # boxShadow extension wiring shadow-0..shadow-4 to CSS vars
```

### Pattern 1: CSS Vars in Tailwind boxShadow

**What:** Define the shadow values as CSS custom properties in `:root`, then reference them in `tailwind.config.js` `theme.extend.boxShadow` using `var()`.

**When to use:** Any token that needs to be accessible from both Tailwind utilities AND from raw CSS / inline `style={}` (Framer Motion, print styles, etc.).

**Example:**
```css
/* src/index.css — add inside @layer base { :root { ... } } */
--shadow-0: none;
--shadow-1: 0 1px 2px 0 rgba(120, 60, 20, 0.06);
--shadow-2: 0 2px 6px -1px rgba(120, 60, 20, 0.10), 0 1px 4px -1px rgba(120, 60, 20, 0.06);
--shadow-3: 0 6px 16px -2px rgba(120, 60, 20, 0.12), 0 3px 8px -2px rgba(120, 60, 20, 0.08);
--shadow-4: 0 16px 40px -4px rgba(120, 60, 20, 0.16), 0 8px 16px -4px rgba(120, 60, 20, 0.10);
```

```javascript
// tailwind.config.js — inside theme.extend.boxShadow
'0': 'var(--shadow-0)',
'1': 'var(--shadow-1)',
'2': 'var(--shadow-2)',
'3': 'var(--shadow-3)',
'4': 'var(--shadow-4)',
```

```tsx
// Usage in TSX — produces shadow-0 through shadow-4 utilities
<div className="shadow-2 hover:shadow-3 transition-shadow" />
```

Source: https://v3.tailwindcss.com/docs/box-shadow — "Any other keys will be used as suffixes, for example the key '2' will create a corresponding `shadow-2` utility."

**IMPORTANT:** The key `'0'` will create `shadow-0`. The key `'DEFAULT'` creates bare `shadow`. Number keys are valid in Tailwind v3.

### Pattern 2: Surface Elevation Scale (4-level)

**What:** 4 semantic surface levels as CSS vars. Elevation is communicated by background lightness and box-shadow — never by z-index.

**Example:**
```css
/* src/index.css — inside @layer base { :root { ... } } */
/* Surface elevation scale — warm off-white base, progressively lighter raises */
--surface-base:     hsl(30 25% 97%);   /* page background (matches --background) */
--surface-raised:   hsl(30 20% 99%);   /* cards, panels */
--surface-overlay:  hsl(0 0% 100%);    /* modals, popovers */
--surface-floating: hsl(0 0% 100%);    /* tooltips, floating menus */
```

**Note:** `--surface-base` intentionally matches `--background` (same value). This makes the `:root` self-consistent.

### Pattern 3: Warm Neutral 9-Step Scale

**What:** Replace ad-hoc gray usage with a warm-tinted neutral scale. Does NOT replace Tailwind's `gray` palette (too many references) — adds `neutral-*` alongside it.

**Example:**
```css
/* Warm neutral scale (9-step) */
--neutral-50:  hsl(30 20% 98%);
--neutral-100: hsl(28 18% 95%);
--neutral-200: hsl(26 14% 90%);
--neutral-300: hsl(24 12% 82%);
--neutral-400: hsl(22 10% 68%);
--neutral-500: hsl(20 8% 52%);
--neutral-600: hsl(18 8% 40%);
--neutral-700: hsl(16 8% 30%);
--neutral-800: hsl(15 8% 20%);
--neutral-900: hsl(14 8% 12%);
```

**Note:** These CSS vars are the token layer. Tailwind mapping (e.g. `neutral` color extension) can happen in a later phase if needed. Phase 16 only establishes the `:root` definitions.

### Pattern 4: motionTokens.ts — Named Spring Presets

**What:** A TypeScript module exporting named `Transition` objects (Framer Motion v10 type) for `snappy`, `smooth`, and `bouncy` spring profiles, plus scalar duration and easing values.

**Example:**
```typescript
// src/lib/motionTokens.ts
import type { Transition } from "framer-motion";

/** Spring preset for UI controls — fast response, minimal overshoot */
export const snappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

/** Spring preset for cards and panels — balanced ease */
export const smooth: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
  mass: 1,
};

/** Spring preset for celebratory / attention elements — pronounced bounce */
export const bouncy: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 15,
  mass: 1,
};

// Duration tokens (seconds) — for non-spring (ease) transitions
export const duration = {
  instant: 0.05,
  fast: 0.15,      // page transitions per prior decision
  normal: 0.20,    // toasts, modals, slide panels per prior decision
  slow: 0.35,
} as const;

// Easing tokens — named cubic-bezier strings
export const easing = {
  easeOut: "ease-out",
  easeIn: "ease-in",
  easeInOut: "ease-in-out",
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
} as const;
```

Source: framer-motion v10 `Transition` type (`type: "spring"` + `stiffness` + `damping` + `mass` verified via Context7 /grx7/framer-motion).

**Usage by downstream phases:**
```tsx
import { snappy, smooth } from "@/lib/motionTokens";

<motion.div transition={snappy} animate={{ opacity: 1 }} />
```

### Pattern 5: Dual Color System — Inventory-Only Strategy

**What:** The reconciliation deliverable for TOKEN-05 is NOT a mass migration — it is a written inventory of all 1,256 hardcoded `primary-NNN` occurrences categorized by semantic intent.

**Why inventory-not-migration:** 131 files, 1,256 occurrences touching `bg`, `text`, `border`, `ring`, `from/to/via`, `fill`, `stroke` classes across the entire application. Migrating all in one phase would have an unbounded blast radius. The v2.1 goal is "reconciled" — meaning the strategy is documented, the inconsistency is understood, and the token layer is in place for downstream phases to migrate systematically.

**Inventory categories:**
1. **Interactive brand** (`bg-primary-500`, `bg-primary-600`, `hover:bg-primary-700`) — buttons, CTAs
2. **Focus rings** (`ring-primary-500`, `focus:ring-primary-500`) — form inputs (382 occurrences)
3. **Text accent** (`text-primary-600`, `text-primary-700`) — links, headings
4. **Surface tint** (`bg-primary-50`, `bg-primary-100`) — hover states, badges
5. **Border accent** (`border-primary-200`, `border-primary-500`) — dividers, outlined elements
6. **Gradient** (`from-primary-500`, `to-primary-600`) — decorative gradients

**Reconciliation strategy (document in inventory):** The `primary` hardcoded hex palette (`#4F46E5` blue) currently controls all UI chrome. The CSS `--primary` var (warm coral) controls only `bg-primary` / `text-primary` bare class. The path forward (for a later phase) is to either: (a) align the hardcoded `primary-*` hex palette to warm coral tones, or (b) introduce a new semantic alias (`--color-brand`) that both systems share. Decision about which approach belongs in a CONTEXT.md for a color migration phase, NOT here.

### Anti-Patterns to Avoid

- **Using `z-index` for elevation:** Prior decision: elevation = box-shadow only. Adding new z-index values breaks Radix UI portal stacking. NEVER add z-index for visual depth effects.
- **Shadowing existing Tailwind names:** Don't name a custom token `shadow` (without suffix) — this would override the `DEFAULT` shadow utility. Use `shadow-0` through `shadow-4`.
- **CSS vars outside `:root`:** All new tokens go inside `@layer base { :root {} }` in `index.css`, not in component `.css` files.
- **`layout` prop on Radix containers:** Prior decision — `motion.div` with `layout` prop must never wrap Radix dropdown/portal children.
- **Importing framer-motion `Spring` type:** The correct import is `Transition` from `"framer-motion"`, not `Spring`. The spring config is inline in the `Transition` object.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shadow scale values | Custom shadow generator | Hand-craft 5 warm-tinted values in `:root` | Only 5 values; a generator adds complexity with no benefit |
| Spring physics calculation | Custom spring math | `framer-motion` spring type | Framer handles frame-by-frame physics; custom math will drift |
| Color reconciliation | Automated sed/replace | Inventory doc + per-phase migration | Automated replace without semantic understanding causes visual regressions |

**Key insight:** Token foundation is mostly additive — add CSS vars, add Tailwind keys, add a TS file. The complexity is in the inventory and strategy documentation, not in the implementation.

---

## Common Pitfalls

### Pitfall 1: Tailwind Does Not Resolve CSS Vars at Build Time

**What goes wrong:** You write `boxShadow: { '1': 'var(--shadow-1)' }` in `tailwind.config.js`, but expect Tailwind to inline the var value. It does not — it emits `box-shadow: var(--shadow-1)` verbatim in the utility class, which is the correct and desired behavior.

**Why it happens:** Misunderstanding of Tailwind v3's build pipeline. Tailwind generates the `.shadow-1 { box-shadow: var(--shadow-1) }` utility; the browser resolves the var at runtime.

**How to avoid:** This is correct behavior — rely on it intentionally. The CSS var must be defined in `:root` for the browser to resolve it.

**Warning signs:** If a shadow utility produces no visible shadow, check that the CSS var is actually defined in `:root` and not misspelled.

### Pitfall 2: Number Keys in tailwind.config.js Shadow

**What goes wrong:** Using number keys (`'0': ...`, `'1': ...`) instead of named keys. Some developers worry this creates conflicts with Tailwind's built-in scale.

**Why it happens:** Uncertainty about Tailwind's key namespace for `boxShadow`.

**How to avoid:** Tailwind's default shadow keys are `sm`, `md`, `lg`, `xl`, `2xl`, `inner`, `none`, and `DEFAULT` — not numbers. Keys `'0'` through `'4'` are safe and produce `shadow-0` through `shadow-4`. Verified from: https://v3.tailwindcss.com/docs/box-shadow.

**Warning signs:** If `shadow-0` and `shadow` (bare) are both generating the same CSS, you accidentally set a `DEFAULT` key.

### Pitfall 3: motionTokens.ts — Wrong Import Path

**What goes wrong:** Components import from `"../../../lib/motionTokens"` with relative paths, causing fragile imports as files move.

**Why it happens:** `src/lib/` directory is new; path alias may not be configured.

**How to avoid:** Check `tsconfig.json` for `paths` alias — if `@/` is configured to `src/`, use `import { snappy } from "@/lib/motionTokens"`. If not configured, this is out of scope; use relative imports consistently.

**Warning signs:** TypeScript errors on import path.

### Pitfall 4: The `ring-primary-500` Flood (382 occurrences)

**What goes wrong:** The most common `primary-NNN` usage is `ring-primary-500` and `focus:ring-primary-500` on form inputs. If this color is ever changed (via palette reconciliation), it will affect every form field's focus state simultaneously.

**Why it happens:** All form inputs were wired to `primary-500` for focus ring color in one pass.

**How to avoid:** Document this in the inventory. The inventory should call out that `ring-primary-500` (382 hits) is the highest-risk class to migrate because it affects accessibility (focus visibility). Any palette change MUST be browser-tested for focus contrast ratio (WCAG 2.1 AA requires 3:1).

**Warning signs:** After any color token change, test focus ring visibility on all form fields.

### Pitfall 5: The `--primary` vs `primary-500` Semantic Mismatch

**What goes wrong:** `--primary` CSS var is `hsl(15 85% 45%)` — warm coral. `primary-500` hardcoded is `#4F46E5` — indigo blue. These are visually opposite colors. Any CSS that uses both (e.g., a component using `bg-primary` from shadcn AND `border-primary-500` for its border) will show mismatched colors.

**Why it happens:** The CSS var system was added in v2.0 Phase 6 (Foundation) for shadcn/ui components, but the hardcoded hex palette predates it and was never reconciled.

**How to avoid:** The inventory must identify any components currently mixing both systems. The fix strategy belongs to a future color phase.

---

## Code Examples

Verified patterns from official sources:

### Adding CSS Custom Properties to :root in Tailwind project

```css
/* src/index.css — inside @layer base block */
@layer base {
  :root {
    /* EXISTING vars (already present) ... */
    --background: 30 25% 97%;
    /* ... */

    /* NEW: Surface elevation scale (Phase 16) */
    --surface-base:     hsl(30 25% 97%);
    --surface-raised:   hsl(30 20% 99%);
    --surface-overlay:  hsl(0 0% 100%);
    --surface-floating: hsl(0 0% 100%);

    /* NEW: Warm neutral scale (Phase 16) */
    --neutral-50:  hsl(30 20% 98%);
    --neutral-100: hsl(28 18% 95%);
    /* ... through --neutral-900 */

    /* NEW: Shadow scale (Phase 16) */
    --shadow-0: none;
    --shadow-1: 0 1px 2px 0 rgba(120, 60, 20, 0.06);
    --shadow-2: 0 2px 6px -1px rgba(120, 60, 20, 0.10), 0 1px 4px -1px rgba(120, 60, 20, 0.06);
    --shadow-3: 0 6px 16px -2px rgba(120, 60, 20, 0.12), 0 3px 8px -2px rgba(120, 60, 20, 0.08);
    --shadow-4: 0 16px 40px -4px rgba(120, 60, 20, 0.16), 0 8px 16px -4px rgba(120, 60, 20, 0.10);
  }
}
```

### Wiring shadow vars to Tailwind utilities

```javascript
// tailwind.config.js — inside theme.extend.boxShadow (merge with existing entries)
boxShadow: {
  // EXISTING entries:
  'soft': '...',
  'card': '...',
  'card-hover': '...',
  'sidebar': '...',
  'header': '...',
  // NEW Phase 16 entries:
  '0': 'var(--shadow-0)',
  '1': 'var(--shadow-1)',
  '2': 'var(--shadow-2)',
  '3': 'var(--shadow-3)',
  '4': 'var(--shadow-4)',
},
```

Source: https://v3.tailwindcss.com/docs/box-shadow — number keys produce `shadow-N` utilities.

### motionTokens.ts full module

```typescript
// src/lib/motionTokens.ts
import type { Transition } from "framer-motion";

/**
 * Spring presets for Framer Motion transitions.
 * Usage: <motion.div transition={snappy} />
 *
 * Respects prefers-reduced-motion: components are responsible for
 * checking useReducedMotion() when applying these presets.
 */

/** Fast, decisive — buttons, toggles, small UI elements */
export const snappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

/** Natural, balanced — cards, panels, page sections */
export const smooth: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
  mass: 1,
};

/** Playful, attention-drawing — success states, badges */
export const bouncy: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 15,
  mass: 1,
};

/** Duration values in seconds for non-spring (ease) transitions */
export const duration = {
  instant: 0.05,
  fast: 0.15,    // page transitions (per v2.0 user decision)
  normal: 0.20,  // toasts, modals, slide panels (per v2.0 user decision)
  slow: 0.35,
} as const;

/** Named easing strings for CSS/Framer ease transitions */
export const easing = {
  easeOut: "ease-out",
  easeIn: "ease-in",
  easeInOut: "ease-in-out",
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
} as const;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded hex in Tailwind palette only | CSS vars in `:root` + Tailwind mapped to vars | This project: v2.0 Phase 6 (partial) | Non-suffixed `primary/secondary/muted` etc. now use CSS vars; suffixed `primary-500` etc. still hardcoded |
| Inline transition objects per component | Centralized spring presets in motionTokens.ts | Phase 16 | Single change point for all animation feel |
| `box-shadow` named ad-hoc (`soft`, `card`) | Semantic scale `shadow-0` through `shadow-4` | Phase 16 | Downstream phases can reference by semantic level |

**Deprecated/outdated:**
- Ad-hoc shadow names (`soft`, `card`, `card-hover`): These remain in `tailwind.config.js` for backward compatibility — don't remove them. The new `shadow-0`..`shadow-4` scale is additive.

---

## Open Questions

1. **Warm tint intensity for shadows**
   - What we know: Prior decisions specify "warm-tinted box-shadow values" but give no specific RGB values.
   - What's unclear: Exact rgba() values for the warm tint. The examples above use `rgba(120, 60, 20, ...)` as a warm brown approximation of the coral brand color.
   - Recommendation: Derive from `--primary` (hsl 15 85% 45%) converted to RGB ≈ `rgb(213, 75, 35)`. Use at 6-16% opacity for shadow levels. Claude's discretion — no user input required.

2. **neutral-* Tailwind mapping**
   - What we know: TOKEN-02 only requires CSS vars (`--neutral-50` through `--neutral-900`) as custom properties.
   - What's unclear: Whether to also add `neutral` to `tailwind.config.js` colors as CSS-var-backed Tailwind utilities.
   - Recommendation: Phase 16 only adds the CSS vars. Tailwind neutral color extension belongs in a later color-migration phase when components actually start using `neutral-*` classes. Keeps this phase focused.

3. **`src/lib/` path alias**
   - What we know: `tsconfig.json` may or may not configure `@/` → `src/`. The existing `src/lib/utils.ts` exists, suggesting the directory is in use.
   - What's unclear: Whether `@/` alias is configured (not checked).
   - Recommendation: Check `tsconfig.json` at plan time; if alias exists, use it in import docs. If not, use relative paths.

---

## Codebase-Specific Findings

### Current State of index.css :root {}

The existing `:root` block contains 15 HSL-format semantic vars from the shadcn/ui system (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`, `--sidebar`, `--sidebar-foreground`). Phase 16 adds tokens to this block — does not remove or change existing vars.

### Dual Color System: Exact Numbers

| Class | Count | Renders As |
|-------|-------|-----------|
| `ring-primary-500` / `focus:ring-primary-500` | 382 | Indigo `#4F46E5` focus ring |
| `text-primary-600` | 216 | Indigo text |
| `bg-primary-600` | 120 | Indigo background |
| `bg-primary-500` | 80 | Indigo `#4F46E5` background |
| `text-primary-700` | 62 | Dark indigo text |
| `bg-primary-50` | 61 | Pale indigo tint |
| `bg-primary-100` | 58 | Light indigo tint |
| `bg-primary-700` | 55 | Dark indigo |
| `border-primary-500` | 47 | Indigo border |
| All others | 175 | Various indigo shades |
| **Total** | **1,256** | **Across 131 files** |

### Existing Framer Motion Usage

5 files currently import `framer-motion` (`TeacherDetailsPage`, `StudentDetailsPage`, `StudentDetailsPageSimple`, `OrchestraDetailsPage`, `BagrutDetails`). All use basic `motion.div` with opacity transitions and no spring config. The `motionTokens.ts` module will provide presets that these components can optionally adopt in later phases.

### Existing Shadow Utilities (do not conflict)

Current `tailwind.config.js` `boxShadow` has: `soft`, `card`, `card-hover`, `sidebar`, `header`. These are named strings. New additions `0`, `1`, `2`, `3`, `4` (numeric keys) produce `shadow-0`..`shadow-4` — no namespace collision.

### No `src/lib/motionTokens.ts` Yet

`src/lib/` contains only `utils.ts` (the shadcn/ui cn() utility). `motionTokens.ts` is a new file to create.

---

## Sources

### Primary (HIGH confidence)

- `/websites/v3_tailwindcss` (Context7) — boxShadow extension with number keys, theme.extend patterns
- `/grx7/framer-motion` (Context7) — `Transition` type, spring `stiffness`/`damping`/`mass` params
- https://v3.tailwindcss.com/docs/box-shadow — number keys create `shadow-N` utilities (verified)
- Direct codebase inspection — `src/index.css`, `tailwind.config.js`, grep results for primary-NNN

### Secondary (MEDIUM confidence)

- `/websites/motion_dev` (Context7) — Spring physics parameters aligned with framer-motion v10 API (same library, different docs site)

### Tertiary (LOW confidence)

- RGB approximation of `rgb(213, 75, 35)` for warm shadow tint — derived from HSL math, not verified against brand spec

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, APIs verified via Context7 and direct package.json
- Architecture: HIGH — CSS var + Tailwind extension pattern verified, motionTokens pattern is standard TS module
- Pitfalls: HIGH — dual color system conflict verified by direct grep of codebase (1,256 occurrences, 131 files)
- Shadow warm tint values: MEDIUM — warm tint direction is clear, exact values are Claude's discretion

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable libraries — Tailwind v3, Framer Motion v10 are not fast-moving in this period)
