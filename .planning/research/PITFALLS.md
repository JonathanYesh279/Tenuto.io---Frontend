# Domain Pitfalls: UI/UX Redesign + shadcn/ui Migration

**Domain:** Full UI/UX redesign of production React + Tailwind app (Hebrew RTL, shadcn/ui migration)
**Researched:** 2026-02-17
**Confidence:** HIGH (based on direct codebase inspection + established knowledge of Radix/shadcn/Tailwind internals)

---

## Critical Pitfalls

Mistakes that cause rewrites, regressions, or major production incidents.

---

### Pitfall 1: shadcn/ui CSS Variables Collide with Existing Tailwind Color System

**What goes wrong:**
shadcn/ui requires CSS custom properties on `:root` (`--primary`, `--background`, `--foreground`, `--muted`, `--accent`, `--card`, `--border`, `--ring`, `--input`, etc.) in HSL format. This project already has a Tailwind theme with `primary`, `secondary`, `success`, `gray` color scales defined in `tailwind.config.js`. When shadcn components are added, they render using their own CSS variable system, while existing components use Tailwind color utility classes (`bg-primary-500`, `text-gray-900`). The two systems coexist silently but produce inconsistent visual output — shadcn Buttons use `var(--primary)`, custom Buttons use `bg-primary-500`. They will not match unless explicitly bridged.

**Why it happens:**
shadcn/ui's Tailwind config integration maps CSS variables (e.g., `primary: "hsl(var(--primary))"`) to Tailwind color names. This OVERRIDES or CONFLICTS with the existing `primary` scale in `tailwind.config.js` lines 9-24 when both configs exist. The existing `primary.500` (#4F46E5) becomes unreachable under the shadcn mapping because `primary` now resolves to `hsl(var(--primary))`.

**Consequences:**
- Buttons from different systems render different blues
- Focus rings mismatch across old and new components
- Production app has visually incoherent state during migration
- TypeScript/Tailwind IntelliSense breaks for `primary-*` classes

**Prevention:**
1. Define shadcn CSS variables to match the existing brand colors. In `index.css`, set `--primary: 243 75% 59%` (approximating #4F46E5) so both systems resolve to the same value.
2. Do NOT add shadcn's default `tailwind.config.js` color mappings until all existing components have been migrated. Add them one phase at a time.
3. Create a `design-tokens.css` file that defines ALL CSS variables first, then source shadcn's `globals.css` from those tokens rather than hardcoded HSL values.

**Detection:**
- Render a shadcn `<Button>` and the existing `<ActionButton variant="primary">` side by side — they should be identical blue. If they differ, the color systems are not bridged.
- Search for `hsl(var(--` in compiled CSS to verify tokens are being set.

**Phase to address:** Phase 1 (Design Token Foundation) — before any component migration begins.

---

### Pitfall 2: Radix UI Primitives Have LTR-Hardcoded Positioning Logic

**What goes wrong:**
Several Radix UI primitives used by shadcn/ui have animation slide-in directions and positioning logic that assumes LTR. Specifically:
- `Select.Content` uses `data-[side=left]:slide-in-from-right-2` — in RTL, "left" is the natural start side, so this produces a reversed animation direction that feels wrong.
- `Dialog` and `Sheet` components animate from the wrong edge by default.
- The `SelectItem` check indicator is positioned at `left-2` (hardcoded, not `inline-start`) — in an RTL context, the checkmark appears on the wrong side of the text.
- `Tooltip` and `Popover` anchor positions computed by Floating UI respect `dir` attribute, but Radix's built-in viewport positioning for `Select.Content` does not.

**Observed in codebase:**
`src/components/ui/select.tsx` line 119 uses `"absolute left-2 flex h-3.5 w-3.5 items-center justify-center"` for the check indicator — this is physically `left`, not logically `inline-start`. In RTL Hebrew, the check will appear on the wrong side (physically left = visually right edge in RTL context = correct position, but future Tailwind v4 with logical properties will break this). Also `SelectLabel` at line 103 uses `"pl-8 pr-2"` — physical padding values that are backwards for RTL (the indent should be on the right side to make room for the checkmark at the end, not the start).

**Why it happens:**
shadcn/ui ships with LTR defaults. RTL support requires manual overrides. The project sets `dir="rtl"` on the root `<div>` in `App.tsx` line 178, which propagates, but Radix portals render OUTSIDE the `dir="rtl"` container into `document.body` which has no `dir` set unless explicitly added.

**Consequences:**
- Dropdown checkmarks on wrong side
- Select dropdown slides in from wrong direction
- Dialog overlays animate incorrectly
- Toast notifications (react-hot-toast) may appear at wrong screen edge

**Prevention:**
1. Add `dir="rtl"` to `document.documentElement` in `main.tsx` or `index.html`, not just the app root. Radix portals will then inherit it: `document.documentElement.setAttribute('dir', 'rtl')`.
2. Override all shadcn animation classes for RTL. In `globals.css`, reverse `slide-in-from-left`/`slide-in-from-right` using `[dir="rtl"]` selectors.
3. Replace physical padding (`pl-8 pr-2`) in `SelectLabel` and `SelectItem` with logical properties (`ps-8 pe-2`) or override `left-2` with `start-2` using Tailwind's logical utilities.
4. Test every Radix component in isolation against the RTL layout before considering it "migrated."

**Detection:**
- Open any `<Select>` in the app and check: does the checkmark appear on the right side of selected item text? In Hebrew RTL it should appear on the left (inline-end).
- Open browser DevTools, inspect portal elements, confirm they have `dir="rtl"` inherited or set.

**Phase to address:** Phase 1 (Design Token Foundation) — set `dir` on document root. Each component migration phase must include RTL verification step.

---

### Pitfall 3: Tailwind CSS Class Merging Conflicts Accumulate Silently

**What goes wrong:**
The project uses both `clsx` (in custom components) and `cn = twMerge(clsx(...))` (in shadcn components). When custom components receive `className` props that are then passed through `clsx` without `twMerge`, conflicting Tailwind classes from the prop and the base styles both appear in the DOM. Tailwind's cascade does not guarantee the override wins — it depends on CSS specificity and class order in the generated stylesheet, which is determined by Tailwind's JIT order, not the order in `className` string.

**Observed in codebase:**
`src/components/ui/Table.tsx` uses `clsx` directly (line 1 import). If a consumer passes `className="bg-blue-50"` while Table has `bg-white` in its base, both classes appear in the DOM. `twMerge` would resolve this correctly; `clsx` alone does not.

**Why it happens:**
During migration, some components get migrated to `cn()` and others stay on `clsx()`. Components that accept `className` props must use `twMerge` to be safely overridable. This is invisible — no TypeScript error, no runtime warning, just visual bugs that only appear with specific prop combinations.

**Consequences:**
- Component overrides silently fail during redesign
- Visual bugs appear only in specific page contexts
- Debugging class conflicts is extremely time-consuming
- Downstream Storybook-style testing produces different results than app usage

**Prevention:**
1. Adopt `cn()` from `src/lib/utils.ts` universally. Replace all `clsx(...)` in components that accept `className` props.
2. Add an ESLint rule or grep check to flag `import.*clsx` in component files that export a component with a `className` prop.
3. In the redesign phase, audit every component that accepts `className` and ensure it passes through `cn(baseClasses, className)` not `clsx(baseClasses, className)`.

**Detection:**
- In DevTools, inspect any component rendered with a custom `className` override. If you see two conflicting background classes (e.g., `bg-white bg-blue-50`), `twMerge` is not being used.
- Add test: render `<Table className="bg-red-50" />` and assert only `bg-red-50` appears in the class list.

**Phase to address:** Phase 1 (Foundation) — standardize on `cn()` before any component migration.

---

### Pitfall 4: Component Name Collision Between Custom and shadcn Components

**What goes wrong:**
This project already has custom UI components in `src/components/ui/` — `button.tsx`, `input.tsx`, `select.tsx`, `badge.tsx`, `alert.tsx`, `label.tsx`, `progress.tsx`, `textarea.tsx`. These filenames match the default shadcn/ui output paths exactly. When adding shadcn components via the CLI (`npx shadcn-ui@latest add button`), it OVERWRITES the existing files without warning if the paths match. The existing custom `button.tsx` is already shadcn-compatible (it uses `cva`, `Slot`, `cn`), but `select.tsx` has RTL-related issues that need fixing — if shadcn's stock `select.tsx` overwrites the current one, all existing RTL fixes and customizations are lost.

**Observed in codebase:**
All shadcn components already exist at their default paths. This is partially good (shadcn is already bootstrapped) but means the CLI cannot be used blindly to "add" or "update" components — it will overwrite custom modifications.

**Why it happens:**
The shadcn CLI copies files from its registry into the configured `ui` directory. It does not diff — it replaces. Development teams often run `npx shadcn-ui add [component]` to get a new component and accidentally overwrite a neighbor file they had customized.

**Consequences:**
- Loss of RTL fixes in `select.tsx` (the LTR `pl-8 pr-2` issue returns)
- Loss of custom variants in `button.tsx`
- Silent regressions — the file compiles fine, TypeScript is happy, but behavior changes

**Prevention:**
1. Never run the shadcn CLI on components that have been customized. Instead, copy new components manually from the shadcn source or registry URL.
2. Keep a `# CUSTOMIZED` comment at the top of each modified component file as a guard.
3. Add a git pre-commit hook that warns when files in `src/components/ui/` are modified by any automated process (check `git diff --name-only` against a known list).
4. Pin the shadcn component versions by copying them at a specific commit hash, not using the live CLI.

**Detection:**
- After running the shadcn CLI, always run `git diff src/components/ui/` to review changes before committing.
- Add test coverage for RTL behavior of Select to catch regressions automatically.

**Phase to address:** Throughout all phases — add the `# CUSTOMIZED` guard in Phase 1.

---

### Pitfall 5: framer-motion Animations Don't Respect `prefers-reduced-motion` and Cause Jank

**What goes wrong:**
The project uses `framer-motion` 10.16.4 for animations. The existing `tailwind.config.js` defines custom animation keyframes (fade-in, slide-up, slide-down, scale-in). During a redesign that adds shadcn's built-in CSS animations (which use `tailwindcss-animate` plugin and `data-[state=open]` selectors) alongside existing framer-motion animations, two animation systems compete. The result: elements animate twice (once via CSS, once via JS), or animation state gets out of sync with Radix's `data-state` attribute. Also, framer-motion's default animations do not check `prefers-reduced-motion` unless explicitly configured with `useReducedMotion()`.

**Observed in codebase:**
The existing Tab navigation uses `animate-scale-in` (CSS) on the active indicator. shadcn components use `data-[state=open]:animate-in` (CSS from `tailwindcss-animate`). framer-motion is imported for modal animations. Three animation systems in one app is a performance and maintenance liability.

**Why it happens:**
shadcn's default setup installs `tailwindcss-animate` as a Tailwind plugin. The existing `tailwind.config.js` already has custom keyframes defined under `theme.extend.animation`. If `tailwindcss-animate` is added, it adds its own `animate-in`, `animate-out`, etc. — class name conflicts with existing custom animation classes that also start with `animate-`.

**Consequences:**
- Existing `animate-fade-in` class may be overridden by `tailwindcss-animate`'s version with different timing
- Users with vestibular disorders see excessive motion (accessibility violation)
- Radix's CSS transitions and framer-motion's JS transitions fight each other on modals
- Performance: framer-motion adds ~30KB to bundle; if shadcn's CSS animations do the same job, framer-motion can be removed

**Prevention:**
1. Before adding `tailwindcss-animate`, audit all existing custom animation class names for conflicts. Rename any conflicts (e.g., `animate-fade-in` → `animate-custom-fade-in`).
2. Wrap all framer-motion usage with `useReducedMotion()` or migrate to pure CSS animations where possible.
3. Establish a single animation system: either framer-motion for all transitions, or `tailwindcss-animate` + Radix `data-state` for all. Not both.
4. The recommended choice is `tailwindcss-animate` (zero JS overhead, works natively with Radix `data-state`). Remove framer-motion unless a specific feature requires it.

**Detection:**
- Install `tailwindcss-animate` in a branch and search for any `animate-` class name collisions: `grep -r "animate-fade-in\|animate-scale-in\|animate-slide" src/`.
- Use Chrome's "Rendering" panel to enable "Show composited layer borders" — if you see excessive layer creation during transitions, framer-motion and CSS animations are fighting.

**Phase to address:** Phase 1 (Foundation) — resolve animation system conflict before component migration.

---

### Pitfall 6: Custom CSS Files Create Specificity Landmines for the Redesign

**What goes wrong:**
The project has 8 custom CSS files: `components.css`, `fonts.css`, `globals.css`, `orchestra-enrollment.css`, `simple-weekly-grid.css`, `tab-navigation-fix.css`, `teacher-management.css`, `teacher-modal-fixes.css`. Several of these use `!important` overrides (e.g., `tab-navigation-fix.css` lines 7, 10, 13: `background: white !important`). These overrides were added to fix layout issues with the current design. During a full redesign, the new component styles from shadcn/ui will be blocked by these `!important` rules — the redesigned components will appear with the old forced-white backgrounds regardless of the new design.

**Observed in codebase:**
`tab-navigation-fix.css` forces `body`, `html`, and `.student-details-container` to `background: white !important`. The new design may use a warm off-white or slight tint for the body background (Monday.com uses `#f6f7fb`). That change will be completely invisible — the `!important` will override it.

**Why it happens:**
`!important` overrides are added as quick fixes for layout bugs. They work immediately but create debt that blocks future changes. Because they're in separate CSS files loaded globally, they affect every component indiscriminately.

**Consequences:**
- New design tokens have no effect on affected elements
- Debugging becomes deeply confusing ("my className is right but it's not showing")
- Iterating on design is slow — must fight specificity wars for every change

**Prevention:**
1. Before the redesign begins, create a dedicated audit pass through all 8 custom CSS files and remove or scope every `!important` declaration.
2. Fix the underlying layout bugs that caused the `!important` overrides in the first place (most are tab navigation overflow issues that can be fixed with proper Flexbox constraints or the new design's layout).
3. Consolidate the 8 custom CSS files into a single `src/styles/app.css` to make specificity debugging tractable.
4. Add a Stylelint rule that fails CI when `!important` appears outside of explicitly allowed utility contexts.

**Detection:**
- `grep -r "!important" src/styles/` — count and triage each instance before starting the redesign.
- During design implementation, if a Tailwind class appears in the DOM but has no visible effect, check for `!important` overrides in DevTools "Styles" panel.

**Phase to address:** Phase 1 (Foundation) — CSS audit and cleanup must precede all component work.

---

## Moderate Pitfalls

Mistakes that cause significant rework but don't require full rewrites.

---

### Pitfall 7: Hebrew Font Loading Race Creates FOUT During Page Transitions

**What goes wrong:**
The custom Hebrew font "Reisinger Yonatan" is loaded via `@font-face` in `index.css` using `font-display: swap`. During initial page load (and during Suspense lazy loading of route chunks), a Flash of Unstyled Text (FOUT) shows system sans-serif for ~500-1500ms. In Hebrew, system fonts (Arial Hebrew, Noto Sans Hebrew) have significantly different character spacing and line heights compared to "Reisinger Yonatan" — causing layout shift (CLS) when the font swaps in. The redesign will add more pages with text-heavy components (teacher details tabs, student forms) where CLS will be more visible.

**Why it happens:**
`font-display: swap` correctly prioritizes readability over polish but allows visible text reflow. The font file is loaded from `/fonts/` at runtime, which means it's not preloaded in `<head>`.

**Prevention:**
1. Add `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/Reisinger-Yonatan-web/Reisinger-Yonatan-Regular.woff2">` to `index.html`.
2. Consider `font-display: optional` for secondary fonts and `font-display: block` for the primary Hebrew font (short block period, no swap flash).
3. During the redesign, define component height constraints that don't change when the font loads (avoid `height: auto` on containers sized by text content at page load).

**Detection:**
Open Chrome DevTools > Performance > record a page load. Look for "Font is blocked" or layout shifts in the Web Vitals section. CLS score above 0.1 indicates the font swap is causing problems.

**Phase to address:** Phase 1 (Foundation) — add preload link before any other design work.

---

### Pitfall 8: shadcn Dialog/Sheet Trap Focus in RTL Incorrectly

**What goes wrong:**
The project's custom `Modal.tsx` component handles focus trapping manually via the backdrop click handler. shadcn's `Dialog` component uses Radix `Dialog.Content` which includes built-in focus trapping (via `@radix-ui/react-focus-scope`). When both modal systems coexist during migration, pages with the old `Modal` and the new `Dialog` will have conflicting focus behavior. More critically: in Hebrew RTL, the Tab key focus order traverses elements from right to left visually but left to right in DOM order. If form fields in dialogs are arranged visually RTL but in DOM order LTR, Tab navigation goes "backwards" through the form from the user's perspective.

**Observed in codebase:**
`Modal.tsx`, `ConfirmDeleteModal.tsx`, `ConfirmationModal.tsx`, `InputModal.tsx` — four separate custom modal implementations. Each must be replaced by shadcn `Dialog` during redesign to avoid two focus trap systems running simultaneously.

**Prevention:**
1. Replace all 4 custom modal components with shadcn `Dialog` in a single dedicated phase. Do not have a partial migration state where some modals are new and some are old.
2. Verify DOM order matches visual RTL order for all form fields inside dialogs. The `tabIndex` attribute should not be used to override natural order — fix the DOM order instead.
3. Add keyboard navigation tests: Tab through every modal in the redesigned app to verify focus moves in the expected direction.

**Detection:**
Open any modal and Tab through it. Does focus move through fields in logical Hebrew RTL order (right-to-left for the user)? If Tab moves to what appears as the "end" of the form first, DOM order is wrong.

**Phase to address:** Dedicated "Modals" phase — migrate all 4 at once.

---

### Pitfall 9: React Big Calendar RTL/Hebrew Month Names Not Handled by Design System

**What goes wrong:**
`react-big-calendar` 1.19.4 is used for scheduling views. It has partial RTL support — it does NOT automatically flip its layout when `dir="rtl"` is set. The calendar grid renders days left-to-right even in RTL context. Hebrew month/day names must be provided via a localizer. The project's custom `Calendar.tsx` component (in `src/components/ui/`) uses a manually-coded Hebrew month array and hardcoded DAYS array — this works currently but will break if shadcn's design system changes the container direction or if `react-big-calendar` is used for the teacher schedule views.

**Why it happens:**
`react-big-calendar` relies on a `localizer` (usually `date-fns` or `moment`) for internationalization, but RTL layout must be handled separately via CSS and `dir` attribute on the calendar container element. The library's CSS was written assuming LTR.

**Prevention:**
1. Always render `react-big-calendar` inside a `<div dir="rtl">` container AND add the RTL override CSS that flips its flex direction.
2. Use the `date-fns` localizer (already installed) with Hebrew locale (`he-IL`) rather than hardcoded string arrays.
3. During the redesign, budget time specifically for calendar RTL testing — it requires visual verification across month boundaries and week views.

**Detection:**
Render `react-big-calendar` on the Teacher Schedule tab and check: does Sunday appear on the right side (standard for Hebrew calendars that start the week on Sunday)? Does the month name appear in Hebrew? Do navigation arrows point in the correct directions?

**Phase to address:** Teacher Schedule / Student Schedule redesign phase.

---

### Pitfall 10: Tailwind Purge Removes RTL Variant Classes Used Only in CSS Files

**What goes wrong:**
The project defines RTL utilities in `tailwind.config.js` via a plugin (`.rtl`, `.ltr`, `.text-start`, `.text-end`, etc.). These are generated via `addUtilities`. If `tailwindcss-animate` or any new Tailwind plugin is added that changes the PostCSS processing order, or if the content purge configuration misses files that use these utilities, the RTL utilities may be purged from the production build. The `teacher-modal-fixes.css` uses `[dir="rtl"]` attribute selectors — these are in plain CSS files that Tailwind's JIT does not scan, so they will not be purged, but if they depend on CSS variable values set by Tailwind, those will be purged.

**Prevention:**
1. After installing any new Tailwind plugin, run `npm run build` and inspect the CSS output for `.rtl`, `.ltr`, `.text-start`, `.text-end` classes.
2. Add RTL utility class names to the Tailwind `safelist` if they are ever generated programmatically (e.g., via a `cn()` call with string interpolation that Tailwind's scanner cannot see).
3. Test production build in RTL: load the built app and verify layout direction is correct.

**Detection:**
`npm run build && grep -o "\.rtl\|\.ltr\|\.text-start\|\.text-end" dist/assets/*.css` — if these are absent from the production CSS, they're being purged.

**Phase to address:** Phase 1 and then after every major dependency addition.

---

### Pitfall 11: Headless UI and Radix UI Are Installed Simultaneously — Redundant Primitives

**What goes wrong:**
`@headlessui/react` 1.7.17 and several `@radix-ui/*` packages are both installed. Headless UI is used for some components, Radix for others (specifically `Select`, `Label`, `Slot`). shadcn/ui is Radix-based. After migrating to shadcn, all Headless UI usage becomes redundant — but it remains in the bundle. More critically, if both libraries provide a component for the same pattern (e.g., `Disclosure` in Headless UI, `Collapsible` in Radix via shadcn), the team may use both simultaneously, doubling the accessible semantics implementation and accessibility testing surface.

**Prevention:**
1. After migrating a Headless UI component to its shadcn/Radix equivalent, remove the Headless UI import immediately in the same PR.
2. Once all Headless UI components are migrated, remove `@headlessui/react` from `package.json` entirely.
3. Track Headless UI usage: `grep -r "@headlessui/react" src/` and add to the migration checklist.

**Detection:**
`grep -r "@headlessui/react" src/` — any result after migration is a straggler import.

**Phase to address:** Each component migration phase (remove as you go, then do a final cleanup sweep).

---

### Pitfall 12: Visual Regression in Forms — React Hook Form + Zod Schema Still Expects Old Field Shapes

**What goes wrong:**
Redesigning form components (7-tab teacher form, student forms, orchestra forms) requires touching JSX structure. If the outer form container or tab panels change their mounting/unmounting behavior (e.g., switching from `display: none` toggling to actual unmounting), React Hook Form's registered fields may be unregistered and re-registered, losing validation state. Zod schema shapes are tightly coupled to `register()` field names — any renaming of an `id` attribute or field key for design reasons breaks validation silently (field validates as if empty, passes, sends wrong data to API).

**Observed in codebase:**
The existing tab navigation mounts all tabs and uses CSS to show/hide them (`display: none`). If the redesign switches to conditional rendering (`{activeTab === 'personal' && <PersonalInfoTab />}`), all React Hook Form `register()` calls inside hidden tabs will unmount, clearing their values.

**Prevention:**
1. Keep the existing tab rendering strategy (CSS show/hide via conditional className, not conditional rendering) UNTIL the React Hook Form strategy is audited and confirmed compatible with unmounting.
2. If tabs must unmount, use `shouldUnregister: false` in `useForm()` configuration so values persist when fields unmount.
3. Never rename a `register()` field name for cosmetic reasons without updating the Zod schema and the API payload key simultaneously.
4. Write form submission tests before redesigning any form tab to catch regressions.

**Detection:**
Fill in a form partially, switch tabs (which unmounts the tab with shadcn Tabs component), switch back — do the filled values persist? If not, `shouldUnregister` is defaulting to `true`.

**Phase to address:** Every form redesign phase.

---

## Minor Pitfalls

---

### Pitfall 13: Lucide React Icon Versions Drift Between shadcn Installs

**What goes wrong:**
The project uses `lucide-react` 0.279.0. shadcn/ui components are generated with specific Lucide icon imports that exist in newer Lucide versions. If shadcn components are copied from the registry at the latest version, they may import icons that don't exist in 0.279.0 — TypeScript will error, and the icon will fail to render.

**Prevention:**
After adding any shadcn component, check its imports against `lucide-react` 0.279.0 changelog. If an icon is missing, either upgrade Lucide or substitute with an available icon.

**Detection:**
TypeScript error: `Module '"lucide-react"' has no exported member 'X'` after adding a shadcn component.

**Phase to address:** Each component migration phase.

---

### Pitfall 14: react-hot-toast Styling Conflicts with shadcn Toaster

**What goes wrong:**
react-hot-toast is already configured in `App.tsx` with custom Hebrew RTL styling. shadcn/ui provides a `Sonner` toast component (via the `sonner` library) that conflicts with react-hot-toast. Using both simultaneously produces duplicate toast systems. The Monday.com-inspired design aesthetic may require switching to Sonner for better animation and stacking behavior, but migrating toast calls across the entire codebase (many `toast.success()`, `toast.error()` calls in the API service and feature components) is a cross-cutting concern.

**Prevention:**
1. Do not add the shadcn Sonner component until a deliberate decision is made to migrate off react-hot-toast.
2. If staying with react-hot-toast, customize its appearance to match the new design system rather than adding Sonner.
3. If migrating to Sonner: do it in a single dedicated phase, not incrementally — having two toast systems is worse than either alone.

**Detection:**
`grep -r "toast\." src/ | wc -l` — count total toast call sites before deciding whether migration effort is worth it.

**Phase to address:** Late polish phase — after core component redesign is complete.

---

### Pitfall 15: `tailwind-merge` Version 1.14.0 Does Not Know About Custom Tailwind Theme Colors

**What goes wrong:**
`tailwind-merge` resolves conflicts between Tailwind utility classes. Version 1.14.0 knows about core Tailwind classes but not the project's custom color scale (`primary-*`, `success-*`). If two classes like `bg-primary-500 bg-primary-600` are passed to `cn()`, `twMerge` will NOT correctly identify them as conflicting background colors and will keep both. This is because `twMerge` requires explicit configuration for custom class groups.

**Prevention:**
Configure `tailwind-merge` with the custom theme extensions via `extendTailwindMerge()`:
```ts
import { extendTailwindMerge } from 'tailwind-merge'

export const cn = extendTailwindMerge({
  classGroups: {
    'bg-color': [{ bg: ['primary', 'success', 'secondary', 'purple', 'orange'] }],
    'text-color': [{ text: ['primary', 'success', 'secondary', 'purple', 'orange'] }],
  }
})
```
Also consider upgrading `tailwind-merge` to 2.x which has better handling of custom extensions.

**Detection:**
Call `cn('bg-primary-500', 'bg-primary-600')` and check the result. If both classes appear in the output (not just `bg-primary-600`), `twMerge` isn't resolving the conflict.

**Phase to address:** Phase 1 (Foundation) — fix `cn()` utility before redesign begins.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Design token setup | CSS variable collision with existing Tailwind colors | Bridge shadcn variables to match existing brand colors first (Pitfall 1) |
| Document root `dir` | Radix portals escape RTL scope | Set `dir="rtl"` on `document.documentElement`, not just app root (Pitfall 2) |
| CSS cleanup | `!important` overrides block new design tokens | Audit all 8 CSS files, remove `!important` before first component migration (Pitfall 6) |
| shadcn CLI usage | Overwrites customized component files | Never use CLI on already-customized files; copy manually from registry (Pitfall 4) |
| Animation system | `tailwindcss-animate` conflicts with existing animation class names | Audit for class name conflicts before installing plugin (Pitfall 5) |
| Form redesign | React Hook Form unmounting clears field values | Keep CSS show/hide for tab content OR set `shouldUnregister: false` (Pitfall 12) |
| Select/Dropdown redesign | Check indicator and padding wrong in RTL | Use logical properties (`start-2`, `ps-8`, `pe-2`) not physical (`left-2`, `pl-8`) (Pitfall 2) |
| Modal migration | Multiple custom modal implementations + shadcn Dialog conflict | Replace all 4 custom modals in one phase, not incrementally (Pitfall 8) |
| Calendar redesign | `react-big-calendar` LTR grid in RTL context | Use `date-fns` `he-IL` locale + explicit RTL CSS overrides on container (Pitfall 9) |
| Production build | RTL utility classes purged | Build and grep for `.text-start`, `.text-end` in production CSS after each plugin addition (Pitfall 10) |
| Font loading | FOUT causes CLS during Suspense route transitions | Add `<link rel="preload">` for Hebrew font woff2 in `index.html` (Pitfall 7) |
| Icon imports | Lucide icon missing from v0.279.0 | Check icon exists in installed version after each shadcn component copy (Pitfall 13) |
| Toast system | react-hot-toast + shadcn Sonner running simultaneously | Decide on one system; do not add Sonner until ready to fully migrate (Pitfall 14) |
| Headless UI cleanup | `@headlessui/react` remains in bundle after Radix migration | Remove on a per-component basis as you migrate, not in a single cleanup at the end (Pitfall 11) |

---

## Sources

Based on direct inspection of:
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/tailwind.config.js`
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/src/components/ui/` (all 19 files)
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/src/styles/` (all 8 CSS files)
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/src/index.css`
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/package.json`
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/src/App.tsx`
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/.planning/codebase/CONCERNS.md`
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/.planning/codebase/STACK.md`
- Established knowledge of Radix UI, shadcn/ui, Tailwind CSS, and RTL behavior (HIGH confidence for all major claims — these are documented behaviors of the named libraries)

---

*Pitfalls audit: 2026-02-17*
