# Technology Stack

**Project:** Tenuto.io — Visual Identity Upgrade (v2.1 or equivalent milestone)
**Researched:** 2026-02-18
**Scope:** Stack changes ONLY for new visual capabilities — spring physics, surface elevation, typography scale, micro-interactions. The v2.0 STACK.md covered shadcn/ui + Radix + framer-motion installation. This document covers what's needed ON TOP of that shipped baseline.
**Confidence:** HIGH (all claims verified against live codebase or official docs)

---

## Existing Baseline (Already Shipped in v2.0 — Do Not Re-research)

| Package | Version in package.json | Status |
|---------|------------------------|--------|
| `framer-motion` | `^10.16.4` | Working — used in 5 files for AnimatePresence/motion |
| `tailwindcss` | `^3.4.19` | Working — full config in tailwind.config.js |
| `tailwind-merge` | `^1.14.0` | Working (v2 upgrade deferred — see below) |
| `class-variance-authority` | `^0.7.1` | Working |
| `tailwindcss-animate` | `^1.0.7` | Working — Radix state animations |
| CSS design tokens | `index.css :root {}` | Working — warm coral HSL palette shipped |
| shadcn/ui components | Multiple Radix packages | Working — 9+ primitives installed |

---

## Verdict: What Actually Needs to Change

**The good news:** Framer Motion v10 already has `useSpring`, `useMotionValue`, `useMotionTemplate`, `staggerChildren`, and full spring physics. Zero new animation packages are required.

**The work is configuration and component authoring — not package installation.**

The one meaningful package decision is whether to upgrade `framer-motion` to the `motion` package (v12). See Section 1.

---

## Section 1: Animation — Framer Motion v10 vs Upgrading to motion v12

### Recommendation: Stay on framer-motion v10 for this milestone

**Rationale:**
- The package was rebranded from `framer-motion` to `motion` (starting v11). v12 is the current latest. The upgrade involves uninstalling `framer-motion` and installing `motion`, then updating all 5 import sites from `'framer-motion'` to `'motion/react'`.
- **Breaking changes for React are minimal** (v12 has no breaking changes in the React API), but the import rename across 5 files is churn with no feature benefit for this milestone's goals.
- All spring capabilities needed — `useSpring`, `useMotionValue`, `staggerChildren`, `AnimatePresence`, spring transition objects — are fully available in v10.

**What framer-motion v10 provides that we are NOT yet using (the actual gap):**

| API | What it enables | Currently used? |
|-----|----------------|-----------------|
| `useSpring(motionValue, springConfig)` | Physically-simulated spring that tracks another value — smooth cursor follow, dynamic number counts | No |
| `useMotionValue(initial)` | Subscribable value that drives animation without re-renders — hover parallax, scroll-linked effects | No |
| `useTransform(motionValue, input, output)` | Map one motion value to another — scale on scroll, color on hover progress | No |
| `useMotionTemplate` | Compose motion values into CSS string — e.g. dynamic `box-shadow` tied to cursor position | No |
| `staggerChildren` in `transition` | Delays child animations sequentially — list reveals, card grids entering | Used via variants but no spring type set |
| `type: "spring"` in transition | Spring physics instead of ease curves — bouncier, more alive button presses | Not set explicitly; defaults to tween |
| `layoutId` + `layout` prop | Shared element transitions between pages/states — active tab indicator sliding | No |
| `whileHover`, `whileTap`, `whileFocus` | State-based animation shorthand — replace CSS hover transitions with spring-driven ones | Not used; current hovering is CSS only |

**Spring parameter reference for consistent system:**

```typescript
// Use these named spring presets as a shared constants file
export const springs = {
  // Snappy — button press, checkbox tick, badge appear
  snappy: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },
  // Smooth — panel slides, modal entrance, tab switch
  smooth: { type: "spring", stiffness: 300, damping: 35, mass: 0.8 },
  // Bouncy — list item reveal, card hover lift (subtle)
  bouncy: { type: "spring", stiffness: 400, damping: 22, mass: 0.6 },
  // Slow — page transitions, route changes
  gentle: { type: "spring", stiffness: 150, damping: 20, mass: 1.0 },
} as const;
```

**Confidence:** HIGH — verified framer-motion v10 API against npm package changelog and existing imports in codebase.

---

## Section 2: Surface Elevation System — Pure CSS, No New Packages

### Recommendation: Extend the existing CSS design token system in `index.css`

The current `tailwind.config.js` has 5 `boxShadow` tokens (`soft`, `card`, `card-hover`, `sidebar`, `header`) defined as static Tailwind values. These are single-purpose — they don't form a semantic elevation hierarchy.

**What to build:** A 5-level elevation system as CSS custom properties, then expose them as Tailwind utilities.

**Implementation (pure CSS + tailwind.config.js — zero new packages):**

```css
/* Add to :root in index.css */
/* Elevation system — 5 levels matching surface depth roles */
/* Uses layered shadows for natural depth (ambient + direct) */
--shadow-0: none;
--shadow-1: 0 1px 2px 0 rgb(0 0 0 / 0.05);                                          /* flat card on page */
--shadow-2: 0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10);       /* lifted card, table row hover */
--shadow-3: 0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10);    /* dropdown, popover */
--shadow-4: 0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10);  /* modal, dialog */
--shadow-5: 0 25px 50px -12px rgb(0 0 0 / 0.25);                                     /* full-screen overlay */
```

```javascript
// tailwind.config.js — replace existing boxShadow block with semantic tokens
boxShadow: {
  'elevation-0': 'var(--shadow-0)',
  'elevation-1': 'var(--shadow-1)',
  'elevation-2': 'var(--shadow-2)',
  'elevation-3': 'var(--shadow-3)',
  'elevation-4': 'var(--shadow-4)',
  'elevation-5': 'var(--shadow-5)',
  // Keep old names as aliases during migration:
  'soft': 'var(--shadow-1)',
  'card': 'var(--shadow-1)',
  'card-hover': 'var(--shadow-2)',
},
```

**Semantic usage mapping:**

| Surface Role | Elevation Level | Tailwind Class |
|-------------|-----------------|----------------|
| Page background | 0 | no shadow |
| Sidebar | 1 | `shadow-elevation-1` |
| Cards (resting) | 1 | `shadow-elevation-1` |
| Cards (hover) | 2 | `shadow-elevation-2` |
| Dropdowns, Tooltips | 3 | `shadow-elevation-3` |
| Modals, Dialogs | 4 | `shadow-elevation-4` |
| Overlays (full sheet) | 5 | `shadow-elevation-5` |

**Why CSS variables instead of hardcoded values:** The `--shadow-*` CSS vars can be overridden in a `.dark {}` selector later if dark mode is ever added, without touching Tailwind config. They also allow hover state transitions with Framer Motion by animating to a named level.

**Confidence:** HIGH — pure CSS approach, no ecosystem dependencies.

---

## Section 3: Typography Scale — No New Packages

### Recommendation: Extend Tailwind's fontSize scale + expose as CSS custom properties

**Current state:** Tailwind default type scale is in use. No custom `fontSize` entries in `tailwind.config.js`. The font family is Heebo (self-hosted) loaded via `<link>` in index.html.

**What's missing:**
- No semantic type role names (heading, body-lg, caption, etc.)
- No explicit leading (line-height) / tracking (letter-spacing) per role
- No fluid/responsive type sizing (size is fixed, not viewport-relative)

**Implementation (tailwind.config.js extension — zero new packages):**

```javascript
// tailwind.config.js — add to theme.extend
fontSize: {
  // Semantic type scale — [size, { lineHeight, letterSpacing, fontWeight }]
  'display':  ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }], // 36px — page titles
  'heading':  ['1.5rem',  { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }], // 24px — section headings
  'subhead':  ['1.125rem',{ lineHeight: '1.4', letterSpacing: '-0.005em', fontWeight: '600' }], // 18px — card titles
  'body-lg':  ['1rem',    { lineHeight: '1.6', letterSpacing: '0',        fontWeight: '500' }], // 16px — primary body
  'body':     ['0.875rem',{ lineHeight: '1.6', letterSpacing: '0',        fontWeight: '500' }], // 14px — standard body (current default)
  'body-sm':  ['0.8125rem',{ lineHeight: '1.5', letterSpacing: '0.005em', fontWeight: '400' }], // 13px — secondary text
  'caption':  ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em',  fontWeight: '400' }], // 12px — labels, meta
  'overline': ['0.6875rem',{ lineHeight: '1.3', letterSpacing: '0.08em',  fontWeight: '600' }], // 11px — section labels ALL CAPS
},
```

**Why set lineHeight and letterSpacing per size:** Hebrew typography (Heebo) benefits from tighter tracking at large sizes and looser at small sizes. Setting these per step ensures legibility without per-component overrides.

**Hebrew-specific note:** Heebo is a variable font (`@fontsource-variable/heebo` v5.2.6 exists). The current setup self-hosts from `/public/fonts/` — this already works. Switching to `@fontsource-variable/heebo` would allow fine-grained weight axes (e.g., `font-variation-settings: 'wght' 450`) but this is not necessary for this milestone. Stay with self-hosted Heebo.

**Confidence:** HIGH for approach. MEDIUM for exact size values — these will need visual tuning during implementation.

---

## Section 4: Micro-Interactions — No New Packages

### Recommendation: CSS transitions for hover states, Framer Motion whileHover/whileTap for interactive elements

**The pattern split:**

| Interaction Type | Approach | Why |
|-----------------|----------|-----|
| Button hover background/border color | CSS `transition` (Tailwind `transition-colors duration-150`) | Color transitions are GPU-friendly, instant feedback, no JS overhead |
| Button press (scale down) | Framer Motion `whileTap={{ scale: 0.97 }}` | Spring physics makes the press feel physical |
| Card hover (lift + shadow) | Framer Motion `whileHover={{ y: -2, boxShadow: "var(--shadow-3)" }}` | Spring gives natural settle vs CSS cubic-bezier |
| Icon hover (rotate/scale) | Framer Motion `whileHover={{ rotate: 15, scale: 1.1 }}` | Expressive micro-movement |
| List item entrance | Framer Motion `variants` + `staggerChildren` | Coordinated reveal |
| Focus ring | CSS `focus-visible:ring-2` (Tailwind) | Accessibility pattern — must be pure CSS |
| Skeleton loading | CSS `animate-pulse` (Tailwind) | No JS needed |
| Page/route transitions | Framer Motion `AnimatePresence` (already used) | Smooth unmount/mount |

**GPU performance rule:** Only animate `transform` and `opacity` with Framer Motion. Never animate `width`, `height`, `margin`, `padding`, or `background-color` through Framer Motion (Framer Motion handles these but they trigger layout — use CSS transitions instead).

**`will-change` usage:** Add `will-change: transform` only to elements with persistent animation (sidebar, modal). Do NOT add it globally — memory cost exceeds benefit when applied broadly.

**Confidence:** HIGH — standard production animation performance patterns.

---

## Section 5: Color System Evolution — No New Packages

### Recommendation: Enrich existing HSL CSS token system in `index.css`

**Current state (shipped):** The `:root {}` in `index.css` defines 15 HSL tokens matching the warm coral palette. This is correct and working.

**What to add:** Surface-specific color tokens that support the elevation hierarchy and expressive palette use.

```css
/* Add to :root in index.css — surface and interactive color tokens */

/* Surface hierarchy (lightness steps of the warm background) */
--surface-base: 30 25% 97%;      /* page background — same as --background */
--surface-raised: 30 20% 99%;    /* card on page */
--surface-overlay: 0 0% 100%;    /* modal, popover (pure white for contrast) */
--surface-sunken: 25 20% 94%;    /* inset area (table alt row, code block) */

/* Interactive color states */
--primary-hover: 15 85% 40%;     /* primary button hover (darker 5%) */
--primary-active: 15 85% 35%;    /* primary button press (darker 10%) */
--primary-subtle: 15 85% 95%;    /* primary ghost hover background */

/* Accent (warm amber) — for highlights, badges, active indicators */
--accent-strong: 35 90% 48%;     /* accent button / badge background */
--accent-muted: 35 60% 92%;      /* accent subtle background */

/* Semantic surface roles */
--surface-success: 142 70% 95%;
--surface-warning: 38 95% 94%;
--surface-error: 0 85% 96%;
--surface-info: 210 80% 95%;
```

**Why NOT OKLCH:** Tailwind v4 uses OKLCH natively, but this project is on Tailwind v3. Adding OKLCH in raw CSS would work in modern browsers (Safari 15.4+, Chrome 111+) but creates an inconsistency where CSS custom properties use OKLCH while Tailwind utilities use RGB/HSL. The HSL system already ships and works — enrich it, don't replace it mid-project.

**Tailwind v4 upgrade:** Do NOT upgrade to Tailwind v4 during this milestone. The migration requires:
- Converting `tailwind.config.js` to CSS-first `@theme` block
- Updating all `tailwindcss-animate` imports (shadcn moved to `tw-animate-css`)
- Verifying shadcn/ui v4 compatibility for all installed Radix components
This is a full project-wide migration with risk, not a visual identity task.

**Confidence:** HIGH for staying on v3. HIGH for token additions.

---

## Summary: Complete Package Change List

### Install (new packages): NONE required

All capabilities needed for spring physics, surface elevation, typography scale, and micro-interactions are available through:
1. Existing `framer-motion` v10 APIs not yet used (`useSpring`, `whileHover`, `whileTap`, `staggerChildren` with `type:"spring"`)
2. Tailwind config extensions (fontSize scale, elevation shadow tokens)
3. CSS custom property additions to `index.css`

### Upgrade Candidates (optional, lower priority):

| Package | Current | Latest | Upgrade Benefit | Urgency |
|---------|---------|--------|----------------|---------|
| `framer-motion` | 10.16.4 | 12.x (`motion`) | Smaller bundle, new scroll-linked APIs | LOW — no API the milestone needs is missing from v10 |
| `tailwind-merge` | 1.14.0 | 2.x | Better handling of arbitrary value conflicts | LOW — upgrade when convenient, not blocking |
| `lucide-react` | 0.279.0 | 0.460+ | Additional music/UI icons | MEDIUM — needed for icon-only sidebar items |

### Configuration Changes (no new packages):

1. **`src/index.css`** — Add `--shadow-0` through `--shadow-5` and expanded surface/interactive color tokens to `:root {}`
2. **`tailwind.config.js`** — Add semantic `fontSize` scale and `shadow-elevation-*` utilities
3. **`src/lib/springs.ts`** (new file) — Named spring presets for consistent animation feel
4. **`src/components/ui/*.tsx`** — Apply `whileHover`, `whileTap`, `motion.div` wrappers to interactive components

### What NOT to Add:

| Package | Why Not |
|---------|---------|
| `react-spring` / `@react-spring/web` | Framer Motion v10 covers all spring physics needed; two animation systems = visual inconsistency + bundle bloat |
| `gsap` / `@gsap/react` | Overkill for UI micro-interactions; adds 50kb+ for no incremental benefit over Framer Motion |
| `motion` (v12 package) | No feature benefit this milestone; import rename churn across 5 files deferred |
| `@fontsource-variable/heebo` | Self-hosted Heebo already works; adding the npm package creates a duplicate source |
| Tailwind CSS v4 | Migration risk (CSS-first config rewrite, shadcn breaking changes) out of scope |
| `tw-animate-css` | shadcn/ui deprecation of `tailwindcss-animate` only affects NEW shadcn projects; existing v3 config works |
| `sonner` | `react-hot-toast` works and toast styling is cosmetic; not blocking visual identity work |
| `@radix-ui/react-hover-card` | No hover card pattern in this app's design |
| Any color palette library | The existing CSS token system is sufficient; palette-specific libs add complexity without value |

---

## Integration Points With Existing Stack

| New Capability | Integrates With | How |
|---------------|----------------|-----|
| Spring animations (`whileHover`, `whileTap`) | Existing `motion.div` + `AnimatePresence` | Same import from `'framer-motion'` — add props to existing wrappers |
| Staggered list reveals | Existing feature list pages (`TeacherList`, `StudentList`, etc.) | Wrap list container in `motion.ul` with `staggerChildren` variant |
| Surface elevation CSS vars | Existing Tailwind `boxShadow` config | Add new entries; existing `shadow-card`, `shadow-soft` classes continue to work |
| Typography scale | Existing `font-sans` (Heebo) | Same font, new semantic size classes — backward compatible |
| Color surface tokens | Existing `--background`, `--card`, `--primary` tokens in `:root {}` | Additive — no existing values change |
| `will-change: transform` | Framer Motion animated elements | Add to `initial` prop or `style` prop on elements that animate persistently |

---

## Sources

- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/package.json` — exact installed versions (HIGH confidence)
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/tailwind.config.js` — existing token and animation config (HIGH confidence)
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/src/index.css` — existing CSS token system and reduced-motion media query (HIGH confidence)
- Framer Motion v10 API inventory: existing usage grep across 5 files (`grep -r "framer-motion"`) (HIGH confidence)
- `framer-motion` npm latest: 12.x, rebranded as `motion` — WebSearch result (MEDIUM confidence — verify before any upgrade)
- `@fontsource-variable/heebo` v5.2.6: npm registry — WebSearch result (MEDIUM confidence)
- Tailwind v4 CSS-first migration risk: tailwindcss.com blog + shadcn/ui compatibility docs — WebSearch (MEDIUM confidence)
- Motion v12 breaking changes (React only: none): WebSearch + GitHub changelog reference (MEDIUM confidence)
- Spring animation performance (GPU, transform-only): Josh W. Comeau animation guides, Framer Motion docs — WebSearch (HIGH confidence — well-established pattern)

---
*Stack research for: Tenuto.io visual identity upgrade — spring animations, surface elevation, typography scale*
*Researched: 2026-02-18*
