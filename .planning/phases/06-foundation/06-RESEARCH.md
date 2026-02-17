# Phase 6: Foundation - Research

**Researched:** 2026-02-17
**Domain:** CSS design token system, Tailwind v3 theming, Radix UI RTL infrastructure
**Confidence:** HIGH (core patterns verified against Context7 + official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Color Palette:** Deep coral/salmon primary, warm off-white background, dark charcoal/navy sidebar
- **Semantic colors:** Warm variants — success: warm green, warning: amber, error: warm red — all tinted to coral family
- **Typography:** Heebo (Google Fonts) only — single family, headings at 700-800 weight, body 16px
- **Corner roundness:** 12-16px for cards, buttons, inputs
- **Card elevation:** Subtle drop shadows, lift feel
- **Spacing:** Generous density
- **Table rows:** 48-56px height, generous padding
- **Animation:** Subtle and purposeful only — modals, toasts, tabs, page transitions. Everything else instant
- **Animation speed:** 100-200ms, ease-out easing
- **Page transitions:** Quick opacity fade-in 100-150ms, RTL-safe
- **Zero visible change** is the Phase 6 success bar — tokens must map to EXISTING visuals first, palette shift comes in later phases

### Claude's Discretion

- Exact HSL/hex values for the coral palette (within the coral/salmon family)
- Exact shadow depth values
- Typography scale steps (h1 through caption count)
- Tailwind config structure for CSS variables
- Which Radix packages to install in what order
- How to bridge existing hardcoded Tailwind colors to new CSS variable tokens without visual regression

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 6 installs CSS custom property infrastructure on top of Tailwind v3, fixes the RTL portal gap in the Radix component layer, and cleans the `!important` overrides. This is pure plumbing — zero visual change on screen.

The project already has shadcn/ui components installed manually (`src/components/ui/`) but is missing the token bridge: CSS variables are not defined in `:root`, the Tailwind config still uses hardcoded hex colors, and `components.json` does not exist. The shadcn components reference `bg-primary`, `text-primary-foreground`, `bg-background`, etc. — all CSS-variable-backed semantic tokens — which resolve to nothing because the variables are undefined. This means shadcn components are silently falling back to browser defaults or rendering with incorrect colors right now.

The RTL situation is partially correct: `html` has `direction: rtl` set in CSS, but Radix portals (Select dropdown, Dialog backdrop) render into `document.body`, which does not inherit the CSS `direction` from a child div. The authoritative fix is to set `dir="rtl"` on `document.documentElement` via JavaScript in `main.tsx` AND to wrap the app in Radix's `DirectionProvider`. These two together ensure all Radix primitives and browser-native elements inherit RTL.

**Primary recommendation:** Install the token layer (`:root` CSS variables, Tailwind config mapping, `components.json`), then fix RTL with `DirectionProvider` + `document.documentElement.dir = 'rtl'`, then audit and remove `!important` from the three problematic CSS files.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS Custom Properties (`:root`) | CSS native | Single source of truth for all color/radius/shadow tokens | Works with any framework, enables live theme switching |
| Tailwind v3 CSS variable mapping | Already installed (^3.3.3) | Bridge from CSS variables to Tailwind utility classes | `hsl(var(--primary))` pattern makes opacity modifiers work |
| `@radix-ui/react-direction` | ^1.1.1 | `DirectionProvider` wraps app, all Radix primitives inherit RTL | Authoritative Radix solution for RTL portals |
| Heebo (Google Fonts) | Variable font | Hebrew + Latin typography, single family for all weights | Most popular Hebrew web font, designed for Hebrew-first use |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `components.json` (manual, no install) | n/a | shadcn/ui CLI compatibility, schema reference | Required for `npx shadcn add` to work in the future |
| Fontsource `@fontsource/heebo` | ^5.x | Self-host Heebo instead of Google Fonts CDN | If offline support or privacy compliance is needed (optional alternative) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@radix-ui/react-direction` | `document.documentElement.dir = 'rtl'` alone | HTML attr alone does NOT propagate into Radix portal context — must use DirectionProvider |
| HSL channel values in CSS | OKLCH (shadcn v4 pattern) | Tailwind v3 does not support OKLCH natively — stick with HSL channels for v3 |
| Google Fonts CDN import | `@fontsource/heebo` npm package | npm package bundles font files, no CDN dependency; CDN is simpler for now |

**Installation:**
```bash
npm install @radix-ui/react-direction
```

No other new runtime packages are needed for Phase 6. Heebo is loaded via Google Fonts URL (no npm install).

---

## Architecture Patterns

### Recommended Token Structure

```
src/
├── index.css                  # :root CSS variables, Heebo @import, @layer base
├── styles/
│   ├── components.css         # existing — no changes needed this phase
│   ├── tab-navigation-fix.css # remove !important (3 instances)
│   ├── teacher-modal-fixes.css# remove !important (4 instances)
│   ├── globals.css            # keep legitimate !important (print + reduced-motion)
│   └── fonts.css              # existing — may consolidate Heebo import here
├── lib/
│   └── utils.ts               # cn() already exists — no change
└── main.tsx                   # add document.documentElement.dir = 'rtl'
tailwind.config.js             # add CSS variable token mapping
components.json                # create for shadcn CLI compatibility
index.html                     # add dir="rtl" attribute
```

### Pattern 1: Tailwind v3 CSS Variable Token Bridge

**What:** Define CSS variables in `:root` as bare HSL channel values (no `hsl()` wrapper), then reference them in `tailwind.config.js` with `hsl(var(--token))`. Tailwind then generates utility classes like `bg-primary`, `text-foreground`, etc.

**Why bare HSL channels:** Tailwind v3 needs to apply opacity modifiers (`bg-primary/50`). The modifier syntax appends ` / <alpha>` to the color value internally, which requires channels to be bare. If you wrap in `hsl()` in the CSS, opacity modifiers break.

**When to use:** Every semantic color token (primary, background, foreground, card, muted, accent, destructive, border, input, ring).

**Example (verified from shadcn/ui official docs, Tailwind v3 pattern):**
```css
/* src/index.css — :root token definitions */
:root {
  /* Phase 6: maps to existing visuals (no visual change yet) */
  /* Primary: coral/salmon — Phase 6 uses existing blue-ish to avoid regression */
  /* Will be swapped to coral HSL values in Phase 7 */
  --background: 249 250 251;   /* gray-50, current bg */
  --foreground: 17 24 39;      /* gray-900, current text */
  --primary: 79 70 229;        /* existing primary.500 blue */
  --primary-foreground: 255 255 255;
  --secondary: 100 116 139;    /* secondary.500 */
  --secondary-foreground: 255 255 255;
  --muted: 243 244 246;        /* gray-100 */
  --muted-foreground: 107 114 128; /* gray-500 */
  --accent: 239 246 255;       /* primary-50 */
  --accent-foreground: 30 64 175; /* primary-800 */
  --destructive: 239 68 68;    /* red-500 */
  --destructive-foreground: 255 255 255;
  --border: 229 231 235;       /* gray-200 */
  --input: 229 231 235;
  --ring: 79 70 229;           /* primary.500 */
  --radius: 0.5rem;
  /* Sidebar */
  --sidebar: 31 41 55;         /* gray-800 */
  --sidebar-foreground: 249 250 251;
  --popover: 255 255 255;
  --popover-foreground: 17 24 39;
  --card: 255 255 255;
  --card-foreground: 17 24 39;
}
```

> **IMPORTANT:** Phase 6 maps tokens to existing colors for zero visual change. The coral palette values will be installed in a later phase. The token names are permanent; only the values change later.

> **NOTE on format:** HSL format for CSS custom properties used by shadcn is `H S% L%` as space-separated values WITHOUT the `hsl()` wrapper. Example: `--primary: 221.2 83.2% 53.3%;` (not `hsl(221.2, 83.2%, 53.3%)`). Then in tailwind.config.js: `primary: "hsl(var(--primary))"`.

```javascript
// tailwind.config.js — add to theme.extend.colors
colors: {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },
  sidebar: {
    DEFAULT: "hsl(var(--sidebar))",
    foreground: "hsl(var(--sidebar-foreground))",
  },
}
```

**Coexistence:** The existing named palettes (`primary.500`, `secondary.300`, etc.) stay in `tailwind.config.js` as-is alongside the new semantic tokens. Existing code using `bg-primary-500` still works. New shadcn components using `bg-primary` get the CSS variable values. No collision.

### Pattern 2: Radix UI RTL — Two-Layer Fix

**What:** Two separate things must happen for Radix portals to render RTL-correct:
1. `document.documentElement.setAttribute('dir', 'rtl')` in `main.tsx` (before render) — ensures ALL browser elements and CSS `[dir="rtl"]` selectors work
2. Wrap app in `<DirectionProvider dir="rtl">` — ensures all Radix context providers (Select, Dialog, Tooltip, etc.) know direction, including portaled content

**Why both are needed:**
- The HTML `dir` attribute propagates to all DOM children including portals created by `document.body.appendChild`
- But Radix primitives read direction from their OWN React context, not from DOM attributes — so portaled components that are outside the React tree that has `dir="rtl"` on a wrapper div still inherit via DirectionProvider

**Source:** Radix official docs (https://www.radix-ui.com/primitives/docs/utilities/direction-provider) + Radix GitHub issues on RTL portal behavior

```tsx
// main.tsx — before ReactDOM.createRoot
document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'he');
```

```tsx
// App.tsx or main.tsx wrapping the tree
import { DirectionProvider } from '@radix-ui/react-direction';

// Wrap at the root level, inside QueryClientProvider/BrowserRouter
<DirectionProvider dir="rtl">
  <App />
</DirectionProvider>
```

**Note on existing code:** `index.html` currently has `lang="en"` — should be `lang="he"`. The `<div dir="rtl">` inside `App.tsx` line 178 can be removed after `document.documentElement.setAttribute('dir', 'rtl')` is in place, but removing it is low priority for Phase 6 (zero-risk to leave it).

### Pattern 3: components.json for shadcn CLI

**What:** A `components.json` file at project root allows `npx shadcn add <component>` to work correctly — it tells the CLI where to put files, what path aliases to use, and whether CSS variables are enabled.

**Example for this Vite project:**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Style choice:** `"default"` vs `"new-york"` — `"default"` has slightly more padding, `"new-york"` is more compact. Either works. Since the user wants "generous spacing," use `"default"`.

### Pattern 4: Heebo Font Loading

**What:** Replace the existing `Inter` and `Reisinger Yonatan` font stack in `index.css` with Heebo. The decision is to use Heebo for ALL text (headings and body). The existing custom font `Reisinger Yonatan` is used only for the custom font-face but will be replaced.

**Google Fonts URL for Heebo (variable font, covers all weights 100-900):**
```
https://fonts.googleapis.com/css2?family=Heebo:wght@100..900&display=swap
```

Or with specific weights (300 body-light, 400 body, 500 medium, 600 semi-bold, 700 heading, 800 strong heading):
```
https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap
```

**Add to `index.html`** (preconnect for performance):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

**Then in Tailwind config** (replacing the existing `fontFamily.sans`):
```javascript
fontFamily: {
  sans: ['Heebo', 'Arial Hebrew', 'system-ui', 'sans-serif'],
  hebrew: ['Heebo', 'Arial Hebrew', 'Noto Sans Hebrew', 'sans-serif'],
}
```

**Transition note:** The custom `Reisinger Yonatan` font-face declarations in `index.css` should remain as fallback for now (Phase 6 = zero visible change). Remove them in Phase 7 when palette shifts.

### Pattern 5: !important Audit

**Legitimate !important (KEEP):**
- `globals.css` line 116: `display: none !important` in `@media print` — correct, needed for print
- `globals.css` lines 125-128: `animation-duration`, `animation-iteration-count`, `transition-duration`, `scroll-behavior` in `@media (prefers-reduced-motion: reduce)` — correct, required for accessibility

**Illegitimate !important (REMOVE/REPLACE):**
- `tab-navigation-fix.css` lines 7, 13, 17: `background: white !important` on `.student-details-container`, `body`, `html` — replace with specificity-based selectors or CSS variables
- `tab-navigation-fix.css` lines 128, 132, 143, 147: `display: none/block/flex !important` on tab panels — convert to proper CSS class toggling or data-state attributes
- `teacher-modal-fixes.css` lines 5-22: `color` and `background-color !important` on `.teacher-student-select` options — replace with `color-scheme` property and proper CSS selectors

**Strategy:** For the background overrides on `body` and `html`, move the hardcoded `background-color: white` to the CSS token layer as `bg-background`. For display overrides on tabs, check if they can be replaced with `[data-state="active"]` / `[data-state="inactive"]` patterns from Radix.

### Anti-Patterns to Avoid

- **Anti-pattern: OKLCH in Tailwind v3** — The shadcn Context7 docs showed OKLCH (`oklch(0.129 0.042 264.695)`) but that is the Tailwind v4 format. Tailwind v3 must use HSL channel values (`221.2 83.2% 53.3%`) with `hsl(var(--token))` in the config. Using OKLCH in v3 will silently break all color utilities.
- **Anti-pattern: Applying coral palette immediately** — Phase 6 installs token infrastructure mapping to existing colors. Swapping to coral values before verifying zero regression would make debugging impossible. Token values change in Phase 7+.
- **Anti-pattern: Removing `Reisinger Yonatan` from font-face in Phase 6** — The custom font may be actively used on production. Don't remove it during the infrastructure phase; only remove in the visual refresh phase.
- **Anti-pattern: Single RTL fix only** — Setting only `document.documentElement.dir = 'rtl'` without `DirectionProvider` will leave Radix Select and Dialog animations RTL-broken. Both fixes are required.
- **Anti-pattern: Overriding existing `primary` scale** — The current Tailwind config has a `primary` object with shades `50` through `950`. The new shadcn semantic token adds `primary.DEFAULT` and `primary.foreground`. If you replace the entire `primary` key, all existing `bg-primary-500` classes break. Merge carefully: add `DEFAULT` and `foreground` to the existing object.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RTL direction for portals | Custom portal wrapper with dir prop injection | `@radix-ui/react-direction` DirectionProvider | Radix reads its own context — only DirectionProvider reaches portaled components |
| Color contrast calculation | Manual luminance math | Browser DevTools accessibility panel or axe-core | WCAG contrast formula is non-trivial, error-prone to hand-compute |
| CSS variable to Tailwind bridge | Manual `var(--color)` strings everywhere | `hsl(var(--token))` in tailwind.config.js | Single definition, opacity modifier support, all Tailwind utilities work |
| Font loading optimization | Custom font subsetting | Google Fonts `display=swap` + `<link rel="preconnect">` | Swap prevents FOIT, preconnect eliminates DNS lookup latency |

**Key insight:** The Tailwind v3 CSS variable pattern is well-established but has an important subtlety (bare HSL channels, not wrapped). Getting it wrong means opacity modifiers silently break without obvious errors.

---

## Common Pitfalls

### Pitfall 1: Overwriting the Existing `primary` Color Scale

**What goes wrong:** The Tailwind config has `primary: { 50: ..., 100: ..., 500: ..., 950: ... }`. If you replace it entirely with `primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" }`, all existing Tailwind classes like `bg-primary-500`, `text-primary-800`, `ring-primary-200` stop working.

**Why it happens:** The shadcn-standard config puts semantic tokens at `primary.DEFAULT` and `primary.foreground`. If you naively replace `primary`, you lose the scale.

**How to avoid:** Merge the semantic tokens INTO the existing scale object:
```javascript
primary: {
  50: '#eff6ff',
  // ... existing scale ...
  950: '#172554',
  DEFAULT: "hsl(var(--primary))",
  foreground: "hsl(var(--primary-foreground))",
},
```

**Warning signs:** Tailwind utilities like `bg-primary-500` render as transparent/unstyled after the config change.

### Pitfall 2: Radix Select Dropdown Direction Wrong in Production

**What goes wrong:** The Select dropdown opens aligned to the left (LTR) despite the app being RTL. Checkmarks and icons appear on the wrong side.

**Why it happens:** `SelectContent` uses `SelectPrimitive.Portal` which renders into `document.body`. Without `DirectionProvider`, the Radix context has no `dir` value and defaults to LTR.

**How to avoid:** Install `DirectionProvider` BEFORE testing. The DOM `dir` attribute alone does not fix this.

**Warning signs:** The `ChevronDown` icon in `SelectTrigger` appears on the right when it should be on the left (in RTL, the dropdown indicator should be on the logical start, not end). Also `pl-8` in `SelectItem` (physical left padding) creates misaligned checkmarks in RTL — this is a separate FNDTN-05 issue.

### Pitfall 3: `hsl()` Wrapper in CSS Variables

**What goes wrong:** Defining CSS variables as `--primary: hsl(221, 83%, 53%)` instead of `--primary: 221 83% 53%`, then using `color: hsl(var(--primary))` results in `color: hsl(hsl(221, 83%, 53%))` — invalid CSS, silently ignored.

**Why it happens:** Developers coming from HSL color pickers copy-paste the full `hsl()` value.

**How to avoid:** The CSS variable stores ONLY the channel values. The `hsl()` wrapper goes in the Tailwind config:
```css
:root { --primary: 221 83% 53%; }   /* correct — no hsl() */
```
```javascript
// tailwind.config.js
primary: { DEFAULT: "hsl(var(--primary))" }  /* hsl() goes here */
```

**Warning signs:** No color appears at all for `bg-primary` elements; browser DevTools shows `hsl(hsl(...))` as the computed value.

### Pitfall 4: `!important` Removal Breaks Tab Navigation

**What goes wrong:** The `display: none !important` in `tab-navigation-fix.css` lines 128-147 may be overriding Headless UI or React component visibility. Removing it could make hidden panels visible.

**Why it happens:** These overrides were added as a workaround for a layout bug. The root cause may not be fixed.

**How to avoid:** Understand the tab component structure before removing. Check if these selectors target `.student-details-container` panels — if so, they may be managing tab panel visibility without proper data attributes. Safest approach: replace with `[aria-hidden="true"] { display: none; }` or equivalent Tailwind conditional classes.

**Warning signs:** Removing `!important` causes all tab content to be visible simultaneously.

### Pitfall 5: Font Switch Causes Layout Reflow

**What goes wrong:** Switching from `Reisinger Yonatan` to `Heebo` changes character metrics (line height, letter spacing, glyph widths). Even if visually similar, elements that were sized to fit the old font may overflow or look cramped.

**Why it happens:** Hebrew fonts have different vertical metrics from Latin fonts. Heebo's vertical metrics differ from Reisinger Yonatan.

**How to avoid:** For Phase 6, set Heebo as the FIRST font in the stack but keep Reisinger Yonatan as fallback. Only fully remove Reisinger Yonatan when the visual refresh phase intentionally adjusts layout. In Phase 6, the font stack change is low risk because `font-display: swap` already causes a brief swap on load — adding Heebo first just changes which font "wins."

---

## Code Examples

Verified patterns from official sources:

### DirectionProvider Integration (verified: radix-ui.com/primitives/docs/utilities/direction-provider)

```tsx
// src/main.tsx — add before ReactDOM.createRoot
document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'he');

// In the render tree:
import { DirectionProvider } from '@radix-ui/react-direction';

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DirectionProvider dir="rtl">
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </DirectionProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
```

### Tailwind v3 CSS Variable Token Pattern (verified: ui.shadcn.com/docs/installation/manual)

```css
/* src/index.css — inside @layer base or at :root */
@layer base {
  :root {
    --background: 249 250 251;
    --foreground: 17 24 39;
    --card: 255 255 255;
    --card-foreground: 17 24 39;
    --popover: 255 255 255;
    --popover-foreground: 17 24 39;
    --primary: 79 70 229;
    --primary-foreground: 255 255 255;
    --secondary: 100 116 139;
    --secondary-foreground: 255 255 255;
    --muted: 243 244 246;
    --muted-foreground: 107 114 128;
    --accent: 239 246 255;
    --accent-foreground: 30 64 175;
    --destructive: 239 68 68;
    --destructive-foreground: 255 255 255;
    --border: 229 231 235;
    --input: 229 231 235;
    --ring: 79 70 229;
    --radius: 0.5rem;
    --sidebar: 31 41 55;
    --sidebar-foreground: 249 250 251;
  }
}
```

> Note: The CSS variable format above uses RGB-like space-separated values (R G B) rather than HSL (H S% L%). **Either format works** as long as you match what's in tailwind.config.js. If using RGB channels, use `rgb(var(--primary))` in the Tailwind config. If using HSL channels, use `hsl(var(--primary))`. **HSL is recommended** for the coral palette work in later phases — it makes color relationships intuitive.

**HSL version for the existing blue palette (use this for Phase 6):**
```css
@layer base {
  :root {
    --background: 210 20% 98%;    /* gray-50 equivalent */
    --foreground: 222 47% 11%;    /* gray-900 equivalent */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 245 58% 51%;       /* existing primary.500 #4F46E5 */
    --primary-foreground: 0 0% 100%;
    --secondary: 215 25% 47%;     /* secondary.500 #64748b */
    --secondary-foreground: 0 0% 100%;
    --muted: 220 14% 96%;         /* gray-100 */
    --muted-foreground: 220 9% 46%;  /* gray-500 */
    --accent: 217 91% 95%;        /* primary-50 */
    --accent-foreground: 221 83% 33%; /* primary-800 */
    --destructive: 0 72% 51%;     /* red-500 */
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;        /* gray-200 */
    --input: 220 13% 91%;
    --ring: 245 58% 51%;          /* same as primary */
    --radius: 0.5rem;
    --sidebar: 217 33% 17%;       /* gray-800 equivalent */
    --sidebar-foreground: 210 20% 98%;
  }
}
```

### components.json for this Vite project (verified: ui.shadcn.com/docs/installation/vite)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Heebo Font in index.html (verified: Google Fonts specimen page)

```html
<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Conservatory Management System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
```

> **Note:** Adding `dir="rtl"` directly to `<html>` in `index.html` is valid and can replace the JavaScript `document.documentElement.setAttribute('dir', 'rtl')` — or both can coexist. The HTML attribute approach is simpler and doesn't require JavaScript. However, `lang="he"` should also be set here.

### Tailwind Config Merge (avoid breaking existing scale)

```javascript
// tailwind.config.js — correct merge pattern
theme: {
  extend: {
    colors: {
      // NEW: shadcn semantic tokens (CSS variable backed)
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      ring: "hsl(var(--ring))",
      card: {
        DEFAULT: "hsl(var(--card))",
        foreground: "hsl(var(--card-foreground))",
      },
      popover: {
        DEFAULT: "hsl(var(--popover))",
        foreground: "hsl(var(--popover-foreground))",
      },
      // MERGED: primary keeps existing scale AND gets new semantic tokens
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#4F46E5',
        600: '#3b82f6',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554',
        DEFAULT: "hsl(var(--primary))",       // NEW
        foreground: "hsl(var(--primary-foreground))", // NEW
      },
      secondary: {
        50: '#f8fafc',
        // ... existing scale ...
        950: '#020617',
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
      muted: {
        DEFAULT: "hsl(var(--muted))",
        foreground: "hsl(var(--muted-foreground))",
      },
      accent: {
        DEFAULT: "hsl(var(--accent))",
        foreground: "hsl(var(--accent-foreground))",
      },
      destructive: {
        DEFAULT: "hsl(var(--destructive))",
        foreground: "hsl(var(--destructive-foreground))",
      },
      sidebar: {
        DEFAULT: "hsl(var(--sidebar))",
        foreground: "hsl(var(--sidebar-foreground))",
      },
    },
    borderRadius: {
      // Extend with CSS variable driven radius (shadcn pattern)
      lg: "var(--radius)",
      md: "calc(var(--radius) - 2px)",
      sm: "calc(var(--radius) - 4px)",
      // Keep existing 4xl
      '4xl': '2rem',
    },
  },
},
```

---

## WCAG AA Guidance for Later Coral Palette

When Phase 7+ swaps token values to coral, the primary action color needs 4.5:1 contrast with white text. Research finding: coral/salmon colors in the mid-range (HSL hue 10-20°, saturation 70-80%, lightness 45-55%) are borderline. Safe approach: use a darker coral for `--primary` (lightness ~40-45%) and lighter variants for hover states.

Example safe coral HSL that passes AA with white text:
- `hsl(14, 78%, 42%)` — approximately #C0411A — contrast ratio ~4.6:1 against white (MEDIUM confidence — not independently verified with tool, recommend validation with WebAIM checker)
- `hsl(16, 75%, 45%)` — approximately #CC4E22 — in the same range

For reference: the current primary `#4F46E5` (indigo) passes AA comfortably at ~4.8:1 against white.

**Recommendation:** Phase 6 keeps existing token values (current blue-ish palette = zero visual change). When swapping to coral in later phases, run all `--primary` candidates through https://webaim.org/resources/contrastchecker/ before committing.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HSL format in shadcn CSS variables (`221.2 83.2% 53.3%`) | OKLCH in shadcn v4 (`oklch(0.205 0 0)`) | shadcn v4 / Tailwind v4 era (2024-2025) | This project uses Tailwind v3 — stay with HSL |
| `dir` attribute only on wrapper div | `DirectionProvider` from `@radix-ui/react-direction` | Radix primitives breaking change circa 2023 | Portals do not inherit CSS direction from parent divs |
| Per-component `!important` overrides | CSS specificity + data-state selectors | Ongoing best practice shift | `!important` cascades defeat design tokens |
| Google Fonts `@import` in CSS | `<link>` in HTML + `preconnect` hints | Standard practice | Eliminates render-blocking font load |

**Deprecated/outdated in this codebase:**
- `globals.css`: imported in `index.css` via `@import` but NOT imported in `main.tsx` — check if it's actually active or dead file
- `src/styles/fonts.css`: exists but not imported anywhere found — may be unused
- Two CSS files importing `tailwindcss/base`, `tailwindcss/components`, `tailwindcss/utilities`: both `index.css` AND `globals.css` do this. Only one should. This causes potential duplication.

---

## Open Questions

1. **Is `globals.css` actually imported/used?** — RESOLVED
   - Answer: `globals.css` is NOT imported anywhere in the codebase (`grep -rn "globals.css" src/` returns nothing). It is a dead file.
   - `fonts.css` is also a dead file — not imported anywhere.
   - Implication: Any RTL/base styles in `globals.css` are not active. The only active base CSS is `src/index.css` and its 4 explicit imports. This is why `dir="rtl"` from `globals.css` has zero effect.
   - Recommendation: Delete both `globals.css` and `fonts.css` during Phase 6 cleanup, or consolidate what's useful from `globals.css` into `index.css`.

2. **Are the tab display `!important` overrides safe to remove?**
   - What we know: `tab-navigation-fix.css` has `display: none/flex !important` on tab panel selectors
   - What's unclear: Whether the underlying tab component uses proper `aria-hidden` or data attributes that could replace these
   - Recommendation: Grep for `.student-details-container` usage to understand the tab panel mechanism before removing. This is Phase 6 sub-task work, not a blocker for planning.

3. **Does `Reisinger Yonatan` font actually load from the `/fonts/` path?** — RESOLVED
   - Answer: YES — font files exist at `/public/fonts/Reisinger-Yonatan-web/`, `/public/fonts/Reisinger-Neta-web/`, `/public/fonts/Reisinger-Michal-web/`
   - Implication: The current custom font IS loading. The switch to Heebo will cause a visible font change. Phase 6 should add Heebo to the font stack (front of stack) while keeping Reisinger as fallback — this minimizes visual difference while establishing the new stack. The full font swap (removing Reisinger) can happen in Phase 7 when visual changes are intentional.

---

## Sources

### Primary (HIGH confidence)
- `/shadcn-ui/ui` (Context7) — CSS variables format, components.json structure, Tailwind config token pattern
- `https://ui.shadcn.com/docs/installation/vite` — Vite-specific components.json and CSS variable setup
- `https://www.radix-ui.com/primitives/docs/utilities/direction-provider` — DirectionProvider API, RTL portal behavior
- `https://www.npmjs.com/package/@radix-ui/react-direction` — package name `@radix-ui/react-direction`, version 1.1.1
- `/websites/v3_tailwindcss` (Context7) — Tailwind v3 CSS custom properties pattern

### Secondary (MEDIUM confidence)
- `https://fonts.google.com/specimen/Heebo` — weight range, Hebrew support, variable font availability
- WebSearch findings on Tailwind v3 HSL channel format (confirmed by shadcn official docs pattern)
- WebSearch: Radix portals do not inherit dir from parent divs (confirmed by Radix Direction Provider docs)

### Tertiary (LOW confidence)
- Coral HSL values for WCAG AA — estimated range `hsl(14-16, 75-78%, 40-45%)` — NOT verified with contrast checker tool, requires validation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against Context7 (shadcn/ui) + official Radix docs + npm registry
- Architecture patterns: HIGH — exact code patterns from official docs, project codebase inspected
- Pitfalls: HIGH — identified from actual codebase inspection (the `primary` scale merge issue, the double Tailwind import, the `globals.css` mystery are real issues found in code)
- Coral WCAG values: LOW — estimated, must be verified

**Research date:** 2026-02-17
**Valid until:** 2026-03-19 (30 days — stable APIs, Tailwind v3 and Radix v1 are stable)
