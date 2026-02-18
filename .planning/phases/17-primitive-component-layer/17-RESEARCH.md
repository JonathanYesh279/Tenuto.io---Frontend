# Phase 17: Primitive Component Layer — Research

**Researched:** 2026-02-18
**Domain:** Framer Motion v10 + Radix UI Dialog integration; shadcn/ui primitive enhancement
**Confidence:** HIGH (all critical claims verified via Context7 + codebase inspection)

---

## Summary

Phase 17 applies the token system from Phase 16 to six shadcn/ui primitives: Card, Button, Badge, Tabs, Dialog, and Input. The work splits into two plans: 17-01 (Card, Button, Badge — shadow tokens, spring press) and 17-02 (Dialog, Tabs, Input — modal spring entrance, focus ring standardization). Every change is in `src/components/ui/` — the blast radius is the entire app since these primitives are imported from 98+ files.

The highest-complexity item is Dialog spring animation. The current `DialogContent` in `dialog.tsx` uses `tailwindcss-animate` CSS classes driven by Radix `data-[state=open]` / `data-[state=closed]` attributes. Replacing this with Framer Motion spring requires restructuring the component to hoist open state, use `forceMount` on the Portal, and wrap with `AnimatePresence` — a pattern that is well-documented and safe for Radix, but requires care. The existing `Modal.tsx` wrapper and 24 Modal callsites must continue to work without changes at their callsites.

Card, Button, and Badge enhancements are pure additive: swap shadow utilities, add `whileTap` via `motion.button`/`motion.div`. All Framer Motion usage must be gated by `useReducedMotion()` — a hook that returns a boolean and is called directly in the component body (not via context). A `MotionConfig reducedMotion="user"` at the root is an alternative global approach but was **not** part of Phase 16 decisions; the per-component `useReducedMotion()` pattern is the established pattern in this codebase (already used in TeacherDetailsPage and BagrutDetails).

**Primary recommendation:** Implement 17-01 as pure shadcn class edits + motion.button wrapper for Button. Implement 17-02 Dialog with the `forceMount` + `AnimatePresence` + controlled-open pattern. Keep the `Modal.tsx` wrapper's external API unchanged — only its internal `DialogContent` changes.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^10.16.4 (installed) | Spring animations, `useReducedMotion`, `whileTap` | Already in project, no install needed |
| @radix-ui/react-dialog | ^1.1.15 (installed) | Accessible dialog primitive, `forceMount` prop | Already in project |
| tailwindcss-animate | ^1.0.7 (installed) | CSS `data-[state=]` animations (currently used) | Will be selectively replaced on Dialog |
| class-variance-authority | ^0.7.1 (installed) | Variant management in Button/Badge | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-slot` | ^1.2.3 (installed) | `asChild` prop in Button | Already used — keep for Link-as-Button pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `motion.button` for Button | `asChild` with `motion.div` | `asChild` would break when `asChild=true` (renders Slot not button). Use `motion.button` base only for the non-asChild case, or wrap the `Comp` in motion. See Architecture Patterns below. |
| `useReducedMotion()` per component | `MotionConfig reducedMotion="user"` on root | Root config is simpler but was not decided in Phase 16; per-component is established codebase pattern. Stick with per-component. |
| Dialog spring via `data-[state=]` CSS vars | Full Framer Motion replacement | CSS approach cannot do spring physics on scale — spring requires JS. Full replacement is correct for MOTN-03. |

**Installation:** No new packages needed. All libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure

No new directories. All changes are in-place edits to:

```
src/
└── components/
    └── ui/
        ├── Card.tsx          # shadow-1 base, shadow-2 hover, remove shadow-sm
        ├── button.tsx        # motion.button wrapper, whileTap snappy, shadow tokens
        ├── badge.tsx         # shadow-1 on default variant (optional, light touch)
        ├── dialog.tsx        # forceMount + AnimatePresence + spring entrance
        ├── tabs.tsx          # focus ring standardization, shadow token on active tab
        └── input.tsx         # focus ring standardization
└── lib/
    └── motionTokens.ts       # Already exists — imports snappy/smooth/bouncy
```

### Pattern 1: Card Shadow Token Swap

**What:** Replace `shadow-sm` base and `hover:shadow-md` with token-mapped utilities.
**When to use:** Card component and any direct `<Card>` usage.

```tsx
// Source: Codebase inspection + Phase 16 shadow token mapping
// BEFORE (Card.tsx line 16-17):
"rounded-lg border bg-card text-card-foreground shadow-sm",
hover && "hover:shadow-md transition-shadow",

// AFTER:
"rounded-lg border bg-card text-card-foreground shadow-1 transition-shadow",
hover && "hover:shadow-2",
```

The `shadow-1` and `shadow-2` utilities are in `tailwind.config.js` boxShadow, resolving to
`var(--shadow-1)` and `var(--shadow-2)` — the warm-tinted values from Phase 16. The `transition-shadow`
stays on the base class (always smooth, regardless of motion preference — it's CSS, not JS).

### Pattern 2: Button Spring Press (whileTap)

**What:** Add Framer Motion `whileTap` for spring-based press feedback.
**When to use:** Primary action buttons. Gated by `useReducedMotion()`.
**Constraint:** Button has `asChild` support — when `asChild=true`, it renders `Slot` not `button`.
The `motion` wrapper must only apply to the non-Slot case, or use `motion(Slot)`.

```tsx
// Source: Context7 /grx7/framer-motion — whileTap pattern
// Source: Context7 /websites/motion_dev — useReducedMotion pattern
import { motion, useReducedMotion } from "framer-motion"
import { snappy } from "@/lib/motionTokens"

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion()
    const Comp = asChild ? Slot : "button"

    // Motion only applies when NOT asChild (Slot can't take motion props directly)
    if (!asChild) {
      return (
        <motion.button
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
          transition={snappy}
          {...(props as React.ComponentProps<typeof motion.button>)}
        />
      )
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**CRITICAL NOTE:** `motion.button` accepts standard button HTML props. The spread `{...props}` works
because `ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`. TypeScript may need a cast
— see Pitfalls section.

**Alternative simpler approach:** Keep `active:scale-95` CSS class (already present in button.tsx line 8)
for the CSS-based press effect, and add `whileTap` as an *additive* spring on top. Since `active:scale-95`
fires on `:active` (CSS) and `whileTap` fires on pointer down (JS), they stack. With `shouldReduceMotion`,
remove `whileTap` — the CSS `active:scale-95` is already respect-reduced-motion-safe because it's
instantaneous (no duration). This is the safer approach.

### Pattern 3: Dialog Spring Entrance (the hard one)

**What:** Replace `tailwindcss-animate` CSS classes with Framer Motion spring.
**The problem:** Radix Dialog manages its own mount/unmount. `AnimatePresence` needs to control mounting
to detect exit. We must hoist the `open` state and use `forceMount` to prevent Radix from unmounting
during exit animation.

```tsx
// Source: Context7 /websites/motion_dev — Radix Dialog forceMount + AnimatePresence
// Source: WebFetch sinja.io — animating-radix-primitives-with-framer-motion
// Source: Radix docs — animation guide (via WebSearch)

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { smooth } from "@/lib/motionTokens"

// Create a motion-enhanced Radix Content component
const MotionDialogContent = motion(DialogPrimitive.Content)
const MotionDialogOverlay = motion(DialogPrimitive.Overlay)

// DialogContent is restructured to accept an `open` prop for AnimatePresence
const DialogContent = React.forwardRef<...>(({ className, children, open, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion()

  const contentVariants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : -8 },
    visible: { opacity: 1, scale: 1, y: 0 },
  }

  return (
    <DialogPortal forceMount>
      <AnimatePresence>
        {open && (
          <>
            <MotionDialogOverlay
              forceMount
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn("fixed inset-0 z-50 bg-black/80", ...)}
            />
            <MotionDialogContent
              forceMount
              ref={ref}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={contentVariants}
              transition={smooth}
              className={cn("fixed left-[50%] top-[50%] z-50 ... shadow-4", className)}
              {...props}
            >
              {children}
            </MotionDialogContent>
          </>
        )}
      </AnimatePresence>
    </DialogPortal>
  )
})
```

**IMPORTANT: The `open` prop threading problem.** The standard shadcn `DialogContent` does not receive
`open` as a prop — it's internal to the `Dialog.Root`. There are two solutions:

**Option A (Recommended):** Use `motion.create(DialogPrimitive.Content)` (framer-motion v10 API for
wrapping third-party components), pass motion props directly, and keep Radix's internal state management.
Replace the CSS `data-[state=]` animate-in classes with motion props. This avoids needing to thread `open`.
The downside: exit animations still depend on Radix unmounting at the right moment.

**Option B:** Hoist `open` state into all callers (24 Modal callsites + ConfirmDeleteDialog + direct Dialog
usages). This is the most correct but highest-blast-radius approach.

**Option C (Pragmatic):** Keep Radix's `tailwindcss-animate` CSS exit animations, but REPLACE the entrance
animation with Framer Motion spring for the "physical entrance feel" requirement. For exit, keep the CSS
fade/zoom (which still looks good). This satisfies MOTN-03 partially ("spring entrance") without the
`forceMount` complexity.

**Recommendation for planning:** Plan 17-02 should use Option C (pragmatic) by default, noting Option B
as a follow-up if the exit animation feels wrong. The success criterion says "entrance feels physical" —
entrance is achievable without exit animation restructuring.

### Pattern 4: useReducedMotion Guard

**What:** Standard hook call — call at component top level, gate all motion props.
**Source:** Context7 /websites/motion_dev — useReducedMotion hook

```tsx
// Source: Context7 /websites/motion_dev — useReducedMotion
import { useReducedMotion } from "framer-motion"

function MyComponent() {
  const shouldReduceMotion = useReducedMotion()

  // Gate spring animations:
  const whileTap = shouldReduceMotion ? undefined : { scale: 0.95 }
  const transition = shouldReduceMotion ? { duration: 0 } : snappy

  return <motion.button whileTap={whileTap} transition={transition} />
}
```

**Key insight:** `useReducedMotion()` returns `boolean | null` (null on SSR). Treat `null` as `false`
(animate normally). In practice: `const shouldReduceMotion = useReducedMotion() ?? false`.

**Existing codebase pattern:** TeacherDetailsPage.tsx and BagrutDetails.tsx already use `AnimatePresence`
with `{ duration: 0.2 }` transitions — neither uses `useReducedMotion`. Phase 17 should add the guard
consistently on all new motion usage (not retrofit the existing usages — out of scope).

### Pattern 5: Dialog Elevation via shadow-4

**What:** The DialogContent currently has `shadow-lg` (Tailwind). Replace with `shadow-4` from token system.
**Source:** Phase 16 shadow scale: `--shadow-4: 0 16px 40px -4px rgba(120, 60, 20, 0.16), 0 8px 16px -4px rgba(120, 60, 20, 0.10)`

```tsx
// BEFORE (dialog.tsx line 39):
"...shadow-lg..."

// AFTER:
"...shadow-4..."
```

This is the simplest part of 17-02 and can be done without any Framer Motion work.

### Anti-Patterns to Avoid

- **`layout` prop on containers with Radix dropdown children:** Per Phase 16 research decision — NEVER add `layout` to parent divs that contain `dropdown-menu` or `select` Radix components. This breaks Radix positioning calculations.
- **`motion.div` wrapping `DialogPrimitive.Content` without `asChild`:** The Radix Content component renders its own div. Wrapping it in `motion.div` creates a double-div. Use `motion.create(DialogPrimitive.Content)` or `DialogPrimitive.Content asChild` with `motion.div` as child.
- **Removing `active:scale-95` from Button:** The existing CSS class provides reduced-motion-safe press feedback. Adding `whileTap` is additive. Do not remove the CSS class.
- **Using `new z-index` values:** Per Phase 16 decision — elevation is via box-shadow ONLY. Dialog uses `z-50` which is already Radix-managed. Do not add z-index values.
- **Touching Badge domain variants:** Badge has domain-specific variants (active, inactive, graduated, pending, completed) that are color-coded for entity status. Do not modify those variants — only potentially add `shadow-1` to the `default` variant if it serves the visual design.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spring physics | Custom CSS keyframe spring | `framer-motion` `type: "spring"` | Spring math is complex; FM handles interrupt/resume correctly |
| Reduced motion detection | `window.matchMedia` listener in each component | `useReducedMotion()` from framer-motion | Hook is reactive (updates on system change); also readable synchronously |
| Radix animation timing | Manual setTimeout to delay unmount | `forceMount` + `AnimatePresence` | Correct solution for Radix unmount timing; setTimeout is fragile |
| Focus ring tokens | Per-component focus ring CSS | `focus-visible:ring-ring` (already in all primitives) | The `--ring` CSS var is the semantic token; already wired |

**Key insight:** The focus ring standardization for 17-02 is already partially done — Input, TabsTrigger, and Button all use `focus-visible:ring-ring focus-visible:ring-offset-2`. The task is verification + ensuring `--ring` is the correct value (currently `hsl(var(--ring))` = `hsl(15 85% 45%)` = warm coral).

---

## Common Pitfalls

### Pitfall 1: TypeScript Error — motion.button Props Spread

**What goes wrong:** `motion.button` has Framer-specific props (`whileTap`, `initial`, etc.) not in `ButtonHTMLAttributes`. Spreading `...props` on a `motion.button` causes TS errors if `props` is typed as `ButtonHTMLAttributes`.
**Why it happens:** `ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>` — the type doesn't include motion props.
**How to avoid:** Either cast the spread (`...(props as any)`) or extend the type: `ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> & HTMLMotionProps<"button">`. The latter is cleaner.
**Warning signs:** TypeScript error "Property 'whileTap' does not exist on type 'ButtonProps'".

### Pitfall 2: Double-Div from Wrapping Radix Content

**What goes wrong:** `<motion.div><DialogPrimitive.Content>` creates two stacked divs. The inner Radix div handles positioning; the outer motion.div creates layout interference.
**Why it happens:** Radix renders its own DOM element for Content.
**How to avoid:** Use `motion.create(DialogPrimitive.Content)` to create a motion-enhanced version of the Radix component that IS the single DOM element. Or use `DialogPrimitive.Content asChild` with a `motion.div` child.
**Warning signs:** Dialog appears offset or layout is unexpectedly wrapped.

### Pitfall 3: Exit Animation Not Playing on Dialog Close

**What goes wrong:** The Radix Dialog unmounts its Portal children synchronously on close. Framer Motion never sees the `exit` state because the component is gone before AnimatePresence can animate it.
**Why it happens:** Radix controls unmounting independently of React rendering.
**How to avoid:** If full exit animation is required: use `forceMount` on Portal + Content + Overlay, control `open` externally, wrap with `AnimatePresence`. If only entrance animation is required (recommended for 17-02), keep Radix's CSS exit animation via `data-[state=closed]` and only add Framer spring for the entrance.
**Warning signs:** Exit appears as instant disappear with no animation.

### Pitfall 4: `Modal.tsx` Wrapper Callsite Breakage

**What goes wrong:** The `Modal.tsx` wrapper uses `DialogContent` internally. If `DialogContent` API changes (e.g., requires a new `open` prop), all 24+ Modal callsites break without any TypeScript error (the error would be at runtime, since the prop might be optional).
**Why it happens:** The `Modal.tsx` wrapper abstracts the `open` state via its `isOpen` prop but doesn't pass it down to `DialogContent`.
**How to avoid:** Keep `DialogContent` changes backward-compatible. If `open` threading is needed (Option B), add it as an optional prop with a fallback, or refactor `Modal.tsx` first to pass through. Verify Modal still works after Dialog changes.
**Warning signs:** Modals that previously worked now flash open and close instantly.

### Pitfall 5: Framer Motion `useReducedMotion` Returns null on First Render

**What goes wrong:** `useReducedMotion()` returns `null` during SSR or before hydration. Passing `null` to `whileTap` may cause unexpected behavior.
**Why it happens:** Hook needs to read a media query which may not be available synchronously.
**How to avoid:** Treat `null` as "animate normally": `const shouldReduceMotion = useReducedMotion() ?? false`. Then use `whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}`.
**Warning signs:** In tests or SSR contexts, animations are unexpectedly enabled or disabled.

### Pitfall 6: `transition-shadow` vs Framer Motion Shadow Animation

**What goes wrong:** Adding Framer Motion `whileHover={{ boxShadow: "..." }}` on Card conflicts with the CSS `transition-shadow` class, resulting in double-transition fighting or incorrect final values.
**Why it happens:** CSS transitions and Framer Motion both control the same property.
**How to avoid:** For Card shadow hover, use ONLY CSS (`hover:shadow-2 transition-shadow`). Reserve Framer Motion for scale/opacity. This is cleaner and reduces JS overhead for the most common component.
**Warning signs:** Shadow hover effect appears jittery or takes longer than expected.

---

## Code Examples

Verified patterns from official sources and codebase inspection:

### Card Shadow Tokens (pure CSS, no Framer Motion needed)

```tsx
// Source: Phase 16 tailwind.config.js boxShadow + codebase inspection Card.tsx
// shadow-1 = var(--shadow-1) = 0 1px 2px 0 rgba(120, 60, 20, 0.06)
// shadow-2 = var(--shadow-2) = 0 2px 6px + 0 1px 4px rgba(120, 60, 20, ...)

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-1 transition-shadow duration-200",
        hover && "hover:shadow-2",
        className
      )}
      {...props}
    />
  )
)
```

### Button Spring Press (verified pattern)

```tsx
// Source: Context7 /grx7/framer-motion + Context7 /websites/motion_dev
import { motion, useReducedMotion } from "framer-motion"
import { snappy } from "@/lib/motionTokens"

// snappy = { type: "spring", stiffness: 400, damping: 30, mass: 0.8 }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion() ?? false
    const Comp = asChild ? Slot : "button"

    if (!asChild) {
      return (
        <motion.button
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
          transition={snappy}
          {...(props as React.ComponentProps<"button">)}
        />
      )
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### useReducedMotion Guard Pattern

```typescript
// Source: Context7 /websites/motion_dev — useReducedMotion
import { useReducedMotion } from "framer-motion"

const shouldReduceMotion = useReducedMotion() ?? false

// Gate approach 1: Conditional whileTap
whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}

// Gate approach 2: Conditional transition speed
transition={shouldReduceMotion ? { duration: 0 } : snappy}

// Gate approach 3: Conditional initial/animate (from motion.dev accessibility docs)
const animate = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
```

### Dialog Elevation (trivial shadow token swap)

```tsx
// Source: Phase 16 shadow token + dialog.tsx codebase inspection
// BEFORE: "...shadow-lg..."
// AFTER:  "...shadow-4..."
// shadow-4 = var(--shadow-4) = warm-tinted 40px blur — perceptibly above page surfaces
```

### AnimatePresence for Dialog Entrance (Option C — entrance only)

```tsx
// Source: Context7 /websites/motion_dev — AnimatePresence + Radix integration
// This approach adds spring entrance without restructuring for exit animation
import { motion } from "framer-motion"
import { smooth } from "@/lib/motionTokens"

// Remove data-[state=open]:animate-in classes from DialogContent className
// Replace with motion props on motion.create(DialogPrimitive.Content)

const MotionContent = motion.create(DialogPrimitive.Content)

// In DialogContent render:
<MotionContent
  ref={ref}
  initial={{ opacity: 0, scale: 0.95, y: -8 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={smooth}
  className={cn(
    "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
    "gap-4 border bg-background p-6 shadow-4 sm:rounded-lg",
    // Keep data-[state=closed] exit classes — they handle exit via CSS
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
    className
  )}
  {...props}
>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS `shadow-sm` on Card | Warm-tinted `shadow-1` / `shadow-2` from token | Phase 17 | Depth via warmth, not neutral gray |
| `active:scale-95` CSS on Button | CSS + `whileTap` Framer spring (additive) | Phase 17 | Spring physics for press — feels physical not snappy-instant |
| `data-[state=open]:animate-in` on Dialog | Framer Motion spring entrance | Phase 17 | Spring physics entrance; CSS exit (hybrid) |
| No motion preference check | `useReducedMotion()` on all new motion | Phase 17 | MOTN-05 compliance |
| `motion.create()` | `motion()` | Framer Motion v11 renamed to motion() | In v10 (this project), the function is available as `motion.create()` OR just wrapping via `motion.div` etc. The Context7 docs mention `motion.create` — verify this exists in v10.16.4 |

**Deprecated/outdated:**
- `motion()` factory (renamed from v10's API): In framer-motion v10, the way to create a motion-enhanced third-party component is `motion(Component)` not `motion.create(Component)`. The sinja.io guide shows `motion.create()` which may be a v11 API. **Verify before use** — in v10, use `motion(DialogPrimitive.Content)`.

---

## Open Questions

1. **Is `motion.create()` available in framer-motion v10.16.4?**
   - What we know: The WebFetch result mentioned `motion.create(RadixDialog.Content)`. Context7 docs for /grx7/framer-motion (labeled as framer-motion) did not show this API.
   - What's unclear: Whether `motion.create()` is v10 or v11 API.
   - Recommendation: In the plan, specify `motion(DialogPrimitive.Content)` (v10 compatible). If TypeScript shows an error on this, fall back to `asChild` + `motion.div`.

2. **Does removing `data-[state=open]:animate-in` from DialogContent break the Overlay animation?**
   - What we know: DialogOverlay also uses `data-[state=]` classes. If we switch DialogContent to Framer Motion but leave Overlay on CSS, there may be timing mismatch.
   - What's unclear: Whether the visual mismatch is noticeable.
   - Recommendation: If switching DialogContent entrance to Framer Motion, also switch Overlay entrance. Keep both exits on CSS.

3. **Does the existing `active:scale-95` on Button conflict with `whileTap`?**
   - What we know: Both target the scale property on press. CSS `active:scale-95` is instantaneous (no transition declared for it). Framer Motion `whileTap` has spring transition.
   - What's unclear: Whether they stack cleanly or fight.
   - Recommendation: Test in browser. Most likely they are compatible (FM overwrites with JS animation). If there is conflict, remove `active:scale-95` from the CVA base class and rely solely on `whileTap`.

4. **TypeScript types for `motion.button` + `ButtonProps`?**
   - What we know: `ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>`. `motion.button` has Framer Motion-specific props.
   - What's unclear: Whether TypeScript accepts the spread without a cast.
   - Recommendation: Use `React.ComponentProps<"button">` for the spread cast, not `any`.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/grx7/framer-motion` — `useReducedMotion`, `whileTap`, `AnimatePresence`, spring config
- Context7 `/websites/motion_dev` — `useReducedMotion` hook, Radix integration pattern, `reducedMotion="user"` MotionConfig
- Codebase inspection: `src/components/ui/dialog.tsx`, `button.tsx`, `Card.tsx`, `badge.tsx`, `tabs.tsx`, `input.tsx`
- Codebase inspection: `tailwind.config.js` (shadow-0 through shadow-4 Tailwind utilities)
- Codebase inspection: `src/index.css` (--shadow-1 through --shadow-4 CSS vars)
- Codebase inspection: `src/lib/motionTokens.ts` (snappy/smooth/bouncy spring presets)

### Secondary (MEDIUM confidence)
- WebFetch sinja.io/blog/animating-radix-primitives-with-framer-motion — `forceMount` + `AnimatePresence` Dialog pattern (verified against Context7 Radix docs)
- WebSearch results confirming `forceMount` requirement — cross-verified with Context7 motion docs

### Tertiary (LOW confidence)
- `motion.create()` API mentioned in sinja.io guide — NOT verified against v10.16.4 changelog. Flag as needing validation before use in plan. Use `motion(Component)` pattern (v10 confirmed) instead.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, versions confirmed from package.json
- Architecture: HIGH — Card/Button patterns verified; Dialog has one open question on `motion.create` vs `motion()`
- Pitfalls: HIGH — TypeScript issues, double-div, exit animation timing are all well-documented failure modes in Radix + Framer ecosystem

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (framer-motion v10 is stable; Radix Dialog API is stable)

---

## Phase Split Guidance for Planner

### Plan 17-01: Card, Button, Badge
**Risk:** LOW — pure CSS class swaps + additive motion props
**Tasks:**
1. Card.tsx: replace `shadow-sm` → `shadow-1`, `hover:shadow-md` → `hover:shadow-2`; move `transition-shadow` to base class
2. Button.tsx: add `useReducedMotion()` import; add `motion.button` branch for non-asChild case; add `whileTap={{ scale: 0.95 }}` gated by reduced motion; transition = snappy
3. Badge.tsx: optionally add `shadow-1` to the `default` variant (assess visually — badges may look cluttered with shadows)
**Files:** `src/components/ui/Card.tsx`, `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`
**Success check:** StatsCard on Dashboard shows warm depth shadow; Buttons have spring press

### Plan 17-02: Dialog, Tabs, Input
**Risk:** MEDIUM — Dialog restructuring has edge cases (Modal.tsx backward compat)
**Tasks:**
1. Dialog.tsx: replace `shadow-lg` → `shadow-4` on DialogContent; switch entrance animation from `data-[state=open]:animate-in` to Framer spring via `motion(DialogPrimitive.Content)`; add `useReducedMotion()` guard; keep CSS exit animation via `data-[state=closed]` classes
2. Dialog.tsx: Overlay — align entrance with Framer motion.div (opacity 0→1); keep CSS exit
3. Tabs.tsx: verify `focus-visible:ring-ring` is consistent; optionally strengthen TabsTrigger active state shadow from `shadow-sm` → `shadow-1`
4. Input.tsx: verify `focus-visible:ring-ring` consistent; no shadow changes needed (inputs are flat by convention)
5. Smoke test Modal.tsx — ensure all 24+ callsites still render and animate correctly
**Files:** `src/components/ui/dialog.tsx`, `src/components/ui/tabs.tsx`, `src/components/ui/input.tsx`
**Success check:** Open ConfirmDeleteDialog — entrance has spring scale-up; Dialog box has clearly perceptible shadow depth above page
