# Technology Stack

**Project:** Tenuto.io v2.0 — UI/UX Redesign (shadcn/ui Migration)
**Researched:** 2026-02-17
**Scope:** Stack ADDITIONS only — existing React 18 + TypeScript + Vite + Tailwind CSS + React Hook Form + Zod + React Query stack is validated and unchanged.

---

## Current State (What Already Exists)

The project already has a partial shadcn/ui foundation that is NOT yet complete:

| Already Installed | Version | Status |
|-------------------|---------|--------|
| `@radix-ui/react-slot` | 1.2.3 | Current |
| `@radix-ui/react-select` | 2.2.6 | Current |
| `@radix-ui/react-label` | 2.1.7 | Current |
| `@radix-ui/react-dialog` | 1.0.0 | **OUTDATED** — installed as dep of old @headlessui |
| `class-variance-authority` | 0.7.1 | Current |
| `clsx` | 2.1.1 | Current |
| `tailwind-merge` | 1.14.0 | Slightly old (1.x vs 2.x) |
| `lucide-react` | 0.279.0 | **VERY OUTDATED** — missing hundreds of icons |
| `framer-motion` | 10.18.0 | Working but old (v11 is current) |
| `src/lib/utils.ts` | — | `cn()` helper exists |
| `src/components/ui/button.tsx` | — | shadcn pattern, references undefined CSS vars |
| `src/components/ui/select.tsx` | — | shadcn pattern, built |
| `src/components/ui/badge.tsx` | — | shadcn pattern, built |
| `src/components/ui/input.tsx` | — | exists |
| `src/components/ui/label.tsx` | — | exists |
| `src/components/ui/alert.tsx` | — | exists |

**Critical gap:** shadcn/ui CSS custom properties (`--background`, `--foreground`, `--primary`, `--ring`, `--muted`, etc.) are referenced in components but NOT defined in `index.css`. The design tokens layer is missing.

---

## Recommended Stack Additions

### 1. shadcn/ui Component Infrastructure

shadcn/ui is not a package — it is a code generator that copies component source into your project. The infrastructure packages must be installed manually.

| Package | Version to Install | Purpose | Why |
|---------|-------------------|---------|-----|
| `tailwind-animate` | `^1.0.7` | Tailwind plugin for data-[state] keyframe animations | Required by shadcn/ui components (slide-in, fade-in, zoom-in on popovers/dialogs); the existing custom keyframes in tailwind.config.js do not cover the `animate-in`/`animate-out` utility classes used by Radix data attributes |
| `tailwind-merge` | `^2.5.5` | Class deduplication | Upgrade from 1.x — v2 handles arbitrary values and group conflict resolution correctly; the existing 1.14.0 has known issues with Tailwind v3.4 arbitrary values |

**Confidence:** HIGH — verified against existing component code that references `data-[state=open]:animate-in` and `data-[state=closed]:animate-out` class patterns in select.tsx.

### 2. Radix UI Primitives (Missing Packages)

Install only what the design system needs. Radix packages are independent; install per component.

| Package | Latest Version | Component Built From It | Why Needed |
|---------|---------------|------------------------|------------|
| `@radix-ui/react-dialog` | `^1.1.6` | Dialog, Sheet, AlertDialog | **Upgrade from broken 1.0.0** — current install is a transitive dep from old @headlessui, not the standalone package. All modals need this. |
| `@radix-ui/react-tabs` | `^1.1.3` | Tabs | The app's core navigation pattern — teacher details, student details all use tabs. Need accessible tab implementation. |
| `@radix-ui/react-tooltip` | `^1.1.8` | Tooltip | Monday.com aesthetic relies heavily on tooltips for icon-only sidebar items and data labels |
| `@radix-ui/react-popover` | `^1.1.6` | Popover, DatePicker | Needed for any floating panel — calendar date pickers, filter panels |
| `@radix-ui/react-dropdown-menu` | `^2.1.6` | DropdownMenu | Table row actions, user menu in header, bulk action menus |
| `@radix-ui/react-switch` | `^1.1.3` | Switch (toggle) | Teacher form boolean fields (hasTeachingCertificate, isUnionMember, extraHour), Settings page toggles |
| `@radix-ui/react-avatar` | `^1.1.3` | Avatar | Teacher/student initials avatars in headers and cards |
| `@radix-ui/react-separator` | `^1.1.1` | Separator | Sidebar section dividers, form section dividers |
| `@radix-ui/react-checkbox` | `^1.1.4` | Checkbox | Multi-instrument teacher selection (27 instruments grouped by department) |
| `@radix-ui/react-toast` | `^1.2.6` | Toast | Replace react-hot-toast with shadcn/ui Toaster for design consistency |
| `@radix-ui/react-accordion` | `^1.2.3` | Accordion | Collapsible FAQ/help sections, instrument department groups |
| `@radix-ui/react-progress` | `^1.1.2` | Progress | Ministry report completion percentage bars |
| `@radix-ui/react-scroll-area` | `^1.2.3` | ScrollArea | Sidebar nav list, modal content areas with custom scrollbar |

**Confidence:** HIGH for which packages are needed (derived from app features). Version numbers are MEDIUM confidence — based on training data. Verify with `npm show @radix-ui/react-tabs version` before installing.

**Do NOT install:**
- `@radix-ui/react-navigation-menu` — overkill for a fixed sidebar; use plain nav items
- `@radix-ui/react-menubar` — no menubar pattern in this app
- `@radix-ui/react-context-menu` — no right-click UI needed
- `@radix-ui/react-toggle` / `@radix-ui/react-toggle-group` — covered by Switch + Checkbox

### 3. Icons

| Package | From | To | Rationale |
|---------|------|----|-----------|
| `lucide-react` | 0.279.0 | `^0.460.0` | **Upgrade required.** Music-relevant icons (Piano, Guitar, Music, Music2, Music3, Music4, Drum, Mic, Mic2, Radio, Volume, FileSpreadsheet, GraduationCap) were added after 0.279.0. Current version is missing icons needed for the music-school identity. |

**Confidence:** MEDIUM — icon names verified against training knowledge; exact version numbers need npm registry check. Run `npm show lucide-react version` to confirm current latest.

**Do NOT add** a separate icon library (e.g., `react-icons`, `heroicons`). Lucide-react is already the standard and mixing icon libraries creates visual inconsistency.

### 4. RTL Support

**Current approach:** `direction: rtl` set on `html` in `index.css`. The tailwind.config.js has a custom RTL plugin that adds `.rtl`, `.ltr`, logical property utilities (`.border-start`, `.pl-start`, etc.).

**Assessment:** The current approach is sufficient and correct for a fully-Hebrew app where RTL is the only direction. Do NOT add:
- `tailwindcss-rtl` plugin — adds `ps-*`, `pe-*`, `ms-*`, `me-*` logical property utilities, but Tailwind v3.3+ already has `ps-*`/`pe-*` built in. Adding the plugin creates conflicts.
- `@radix-ui/react-direction` — Radix components respect CSS `dir` attribute automatically. No extra package needed.

**What IS needed:** When installing Radix UI components, ensure `dir="rtl"` is set on the root container (already done via `html { direction: rtl }`). Radix Popper-based components (Popover, DropdownMenu, Tooltip, Select) compute anchor positioning based on the writing direction — this works correctly when `dir` is on the HTML element.

**One RTL fix required for shadcn/ui selects:** The `SelectItem` in `select.tsx` uses `pl-8 pr-2` for the check indicator — these are LTR-specific. Must change to `ps-8 pe-2` (logical properties) during the redesign.

**Confidence:** HIGH — verified by reading existing tailwind.config.js, index.css, and Radix documentation behavior.

### 5. Animation

| Package | Keep/Add | Version | Rationale |
|---------|----------|---------|-----------|
| `framer-motion` | Keep | 10.18.0 → consider upgrade to `^11.0.0` | Already used for card hover effects, slide animations. v11 reduces bundle size with motion components opt-in. Not a blocking upgrade — stay on v10 during redesign to avoid API changes, upgrade separately after. |
| `tailwind-animate` | **ADD** | `^1.0.7` | Provides the CSS keyframe animations required by shadcn/ui data-attribute patterns (`animate-in`, `animate-out`, `fade-in-0`, `zoom-in-95`, `slide-in-from-top-2`, etc.) |

**Confidence:** HIGH for tailwind-animate need (verified by reading select.tsx which uses these classes). MEDIUM for framer-motion upgrade recommendation.

### 6. Typography & Fonts

**Current state:**
- `Reisinger Yonatan` — custom Hebrew font, self-hosted via WOFF2/WOFF/TTF, loaded in `index.css`
- `Inter` — loaded from Google Fonts

**Recommendation:** No new font packages needed. The existing setup is correct. For the Monday.com-inspired aesthetic:
- Use `Reisinger Yonatan` weight 500 (currently the default) for body text
- Add weight 700 for headings if the font files support it — check `/public/fonts/Reisinger-Yonatan-web/` for bold variants
- Do NOT load additional Hebrew web fonts — adding Noto Sans Hebrew or Rubik would compete with the existing custom font

**Music identity typography:** The `tailwind.config.js` already defines a `music` font family (`Bravura`, `Dorico`) for music notation. These are specialty rendering fonts that should remain confined to musical notation contexts only — do not use them for general UI text.

**Confidence:** HIGH — based on direct inspection of font files and CSS configuration.

### 7. Design Token Layer (CRITICAL MISSING PIECE)

The shadcn/ui components in `src/components/ui/` reference CSS custom properties that do not exist:
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`

**These must be defined** in `index.css` inside `:root {}`. This is purely a CSS configuration task, no packages involved. The values should map to the warm Monday.com-inspired palette that will be defined during the redesign.

The `tailwind.config.js` must also reference these CSS variables using `hsl(var(--primary))` syntax so Tailwind color utilities generate from the tokens.

**Confidence:** HIGH — confirmed by reading button.tsx which uses `bg-primary text-primary-foreground` where `primary` must resolve to a CSS var.

### 8. What NOT to Add

| Package | Why Not |
|---------|---------|
| `@headlessui/react` upgrade | Already installed at 1.7.19. Do not upgrade to v2 during redesign — it has breaking API changes for Dialog and Transition. Remove it gradually as components migrate to shadcn/ui Radix equivalents. |
| `react-spring` | Framer Motion already covers animation. Two animation libraries = bundle bloat + inconsistency. |
| `styled-components` / `emotion` | This project is Tailwind-first. CSS-in-JS would fight the utility class model. |
| `@mui/material` | Radix + shadcn/ui IS the component system. MUI brings its own theming system incompatible with Tailwind. |
| `@mantine/core` | Same issue as MUI. |
| `react-icons` | Lucide-react covers all needs. Two icon libraries create visual inconsistency. |
| `tailwindcss-rtl` (plugin) | Tailwind v3.3+ has built-in logical properties (`ps-*`, `pe-*`, `ms-*`, `me-*`). Plugin is redundant and conflicts. |
| `next-themes` | This is a Vite app, not Next.js. Dark mode is not in scope for v2.0. |
| `vaul` (drawer) | Not needed — Radix Dialog handles all modal/sheet use cases in this app. |

---

## Complete Installation Command

```bash
# 1. Upgrade existing packages with known issues
npm install tailwind-merge@^2.5.5 lucide-react@^0.460.0

# 2. Add tailwind-animate plugin
npm install tailwind-animate@^1.0.7

# 3. Install missing Radix UI primitives
npm install \
  @radix-ui/react-dialog@^1.1.6 \
  @radix-ui/react-tabs@^1.1.3 \
  @radix-ui/react-tooltip@^1.1.8 \
  @radix-ui/react-popover@^1.1.6 \
  @radix-ui/react-dropdown-menu@^2.1.6 \
  @radix-ui/react-switch@^1.1.3 \
  @radix-ui/react-avatar@^1.1.3 \
  @radix-ui/react-separator@^1.1.1 \
  @radix-ui/react-checkbox@^1.1.4 \
  @radix-ui/react-toast@^1.2.6 \
  @radix-ui/react-accordion@^1.2.3 \
  @radix-ui/react-progress@^1.1.2 \
  @radix-ui/react-scroll-area@^1.2.3
```

**Note on version numbers:** The Radix version numbers above are based on training data (knowledge cutoff January 2025). Verify current versions with `npm show @radix-ui/react-tabs version` before running. The install will pick the latest compatible version regardless when using `^` semver ranges.

---

## Configuration Changes Required (No New Packages)

### tailwind.config.js

Add `tailwind-animate` plugin and update color tokens to use CSS variables:

```javascript
import tailwindAnimate from 'tailwind-animate'

export default {
  // ... existing content config
  theme: {
    extend: {
      colors: {
        // Replace hardcoded hex values with CSS var references
        // so shadcn/ui components work correctly:
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          // Keep numeric scale for backward compat with existing code:
          50: '#eff6ff',
          // ... rest of existing scale
        },
        // ... other shadcn/ui token additions
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
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
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    tailwindAnimate,
    // ... existing RTL utilities plugin
  ],
}
```

### index.css

Add CSS custom properties for the warm music-school design tokens:

```css
:root {
  /* Warm Monday.com-inspired palette — adjust during design phase */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;

  /* Primary: warm amber/golden — music warmth */
  --primary: 38 92% 50%;
  --primary-foreground: 0 0% 100%;

  /* Secondary: soft slate */
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;

  /* Muted: light warm gray */
  --muted: 30 10% 96%;
  --muted-foreground: 240 3.8% 46.1%;

  /* Accent: Monday.com purple accent */
  --accent: 258 90% 66%;
  --accent-foreground: 0 0% 100%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;

  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 38 92% 50%;
  --radius: 0.75rem;
}
```

**Note:** These are placeholder values. The exact palette should be defined with a designer pass during Phase 1 of the redesign. The token names must match exactly — the components reference these names.

### vite.config.ts

Add Radix UI packages to `optimizeDeps.include` as they are installed:

```typescript
optimizeDeps: {
  include: [
    // ... existing includes
    '@radix-ui/react-dialog',
    '@radix-ui/react-tabs',
    '@radix-ui/react-tooltip',
    '@radix-ui/react-popover',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-switch',
    '@radix-ui/react-avatar',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-toast',
    '@radix-ui/react-accordion',
    '@radix-ui/react-scroll-area',
  ],
}
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Component system | shadcn/ui (Radix) | Mantine, MUI, Ant Design | shadcn/ui is copy-paste code that we own and style; other libraries ship their own CSS that fights Tailwind |
| Animation | tailwind-animate + framer-motion | CSS-only, react-spring | tailwind-animate covers Radix state animations; framer-motion covers complex page/card transitions already in use |
| Icons | lucide-react (upgraded) | react-icons, phosphor-react | Lucide is already installed and the shadcn/ui standard; swapping creates churn |
| RTL approach | HTML `dir=rtl` (current) | tailwindcss-rtl plugin | Built-in Tailwind logical properties cover all cases; plugin is deprecated behavior |
| Toast notifications | @radix-ui/react-toast (shadcn/ui Toaster) | Keep react-hot-toast | react-hot-toast is a parallel system that won't inherit design tokens; shadcn/ui Toaster uses same CSS vars |

---

## Summary: What Actually Changes

**Install (npm packages):**
- `tailwind-animate` (new)
- `tailwind-merge` upgrade to v2
- `lucide-react` upgrade to current
- 13 `@radix-ui/*` packages (new installs)

**Configure (no new packages):**
- `tailwind.config.js` — add tailwind-animate plugin + CSS var-based color tokens
- `src/index.css` — add `:root {}` CSS custom properties block
- `vite.config.ts` — add new Radix packages to optimizeDeps

**Remove (gradual migration):**
- `@headlessui/react` — migrate usage to Radix equivalents component by component; remove when all consumers are migrated

**Not changing:**
- React 18, TypeScript, Vite, Tailwind CSS v3, React Hook Form, Zod, React Query, React Router v6 — all stay at current versions

---

## Sources

- Existing project: `package.json`, `tailwind.config.js`, `src/index.css`, `vite.config.ts`, `src/components/ui/*.tsx` (direct inspection, HIGH confidence)
- Installed packages: `npm list --depth=0` output (HIGH confidence)
- Radix UI `@radix-ui/react-dialog` installed version: node_modules direct inspection, v1.0.0 transitive (HIGH confidence)
- Component CSS var references: `src/components/ui/button.tsx`, `src/components/ui/select.tsx` (HIGH confidence)
- Package version numbers: training data, knowledge cutoff January 2025 (MEDIUM confidence — verify before install)
- shadcn/ui architecture: training data verified against existing shadcn-pattern components in codebase (HIGH confidence)
