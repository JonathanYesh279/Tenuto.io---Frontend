# Phase 8: Domain Components & Loading States - Research

**Researched:** 2026-02-17
**Domain:** React component design, skeleton loaders, toast notifications, page transitions
**Confidence:** HIGH

---

## Summary

Phase 8 builds conservatory-specific reusable components on top of the Phase 7 shadcn/ui primitive layer. The codebase already has significant partial implementations that need to be consolidated and upgraded rather than built from scratch. Key discoveries: (1) `LoadingSkeleton` already exists in `src/components/feedback/LoadingStates.tsx` with table/card/list/form variants but uses `animate-pulse` (not the shimmer pattern); (2) `react-hot-toast` v2.6.0 is already installed and in use at 16+ call sites, currently positioned `top-center` — the RTL-correct position is `top-left` (which appears visually on the right in RTL); (3) `framer-motion` v10 is installed but NOT being used (zero imports found) — the existing Tailwind animation tokens (`fade-in`, `slide-up`) are sufficient for all Phase 8 requirements; (4) `DesignSystem.tsx` already has `StatusBadge` and `InstrumentBadge` (category-colored) components but they are not wired into list pages; (5) 104 files contain spinner patterns — Phase 8 must target only the 3 primary list pages (Teachers, Students, Orchestras) per the success criteria scope.

**Primary recommendation:** Consolidate existing partial implementations into a single `src/components/domain/` folder, upgrade the toast `position` to `top-left` (RTL-aware), add a `slide-from-right` Tailwind keyframe for toast animation, wire skeleton into the 3 list pages, and add EmptyState/ErrorState components. Do NOT replace all 104 spinner files — scope is list pages only.

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hot-toast | 2.6.0 | Toast notification system | Already installed, 16+ call sites, supports custom rendering |
| shadcn/ui Badge | Phase 7 | InstrumentBadge and StatusBadge base | Already installed, CVA variant system |
| Radix Avatar | 1.1.11 | AvatarInitials base primitive | Already installed (avatar.tsx in Phase 7) |
| tailwindcss-animate | 1.0.7 | Skeleton/transition animations | Already installed |
| Tailwind CSS | (via config) | Skeleton shimmer, fade-in, slide animations | Custom keyframes already defined in tailwind.config.js |

### No New Installations Required

The WSL2/NTFS constraint means no `npm install` calls in WSL. All required libraries are already present:
- `framer-motion` v10.16.4 is installed but not needed (Tailwind CSS animations suffice)
- `@radix-ui/react-avatar` is already in package.json for avatar.tsx
- `react-hot-toast` already configured in App.tsx

**Installation:** No new packages needed for Phase 8.

---

## Architecture Patterns

### Recommended Project Structure

```
src/components/domain/
├── index.ts                 # barrel export
├── InstrumentBadge.tsx      # thin wrapper on shadcn Badge (no icons, simple text)
├── StatusBadge.tsx          # consolidates DesignSystem.tsx StatusBadge into domain/
├── AvatarInitials.tsx       # wraps avatar.tsx + getDisplayName() initial extraction
├── StatsCard.tsx            # unifies ui/StatsCard.tsx and dashboard/StatCard.tsx

src/components/feedback/
├── Skeleton.tsx             # NEW: shimmer-based Skeleton primitive (replaces LoadingSkeleton)
├── EmptyState.tsx           # NEW: illustrated empty state with Hebrew CTA
├── ErrorState.tsx           # NEW: error with retry button
├── LoadingStates.tsx        # KEEP: existing component (do not delete, used elsewhere)
```

The `src/components/ui/` directory stays for shadcn primitives only. Domain-specific components go in `src/components/domain/`.

### Pattern 1: Skeleton as Shimmer (not pulse)

**What:** Replace `animate-pulse` with a shimmer gradient sweep animation for better visual fidelity.
**When to use:** Wherever list pages have a `loading` state, replace the spinner with a `<TableSkeleton rows={8} />`.
**Example:**

```typescript
// src/components/feedback/Skeleton.tsx
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  )
}

// TableSkeleton — matches Teachers/Students/Orchestras table shape
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-1" role="status" aria-label="טוען נתונים...">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-4 ${j === 0 ? 'w-1/4' : j === cols - 1 ? 'w-1/6' : 'w-1/5'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}
```

Source: shadcn/ui Skeleton pattern (context7-verified: shadcn uses `animate-pulse bg-muted`).

### Pattern 2: EmptyState with Hebrew CTA

**What:** Illustrated empty state component showing descriptive text and a primary CTA button.
**When to use:** When the filtered/loaded list returns 0 results (not loading, not error).
**Example:**

```typescript
// src/components/feedback/EmptyState.tsx
interface EmptyStateProps {
  title: string          // e.g. "אין מורים עדיין"
  description?: string   // secondary text
  icon?: React.ReactNode // illustration or icon
  action?: {
    label: string        // e.g. "הוסף מורה"
    onClick: () => void
  }
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" dir="rtl">
      {icon && <div className="mb-4 text-muted-foreground/40">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
```

### Pattern 3: ErrorState with Retry

**What:** Error display that shows a human-readable message and a "נסה שוב" retry callback.
**When to use:** Replace the current ad-hoc `if (error)` blocks in Teachers, Students, Orchestras.
**Example:**

```typescript
// src/components/feedback/ErrorState.tsx
interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'אירעה שגיאה בטעינת הנתונים', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" dir="rtl">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">שגיאה בטעינת הנתונים</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>נסה שוב</Button>
      )}
    </div>
  )
}
```

### Pattern 4: Toast RTL Positioning

**What:** Change the global Toaster position from `top-center` to `top-left` for RTL-correct behavior.
**Why:** In RTL apps, `top-left` is the visual right edge. React-hot-toast positions are physical (not logical), so `top-left` appears visually on the right in an RTL layout.
**Existing code location:** `src/App.tsx` line 539

```typescript
// CURRENT (wrong for RTL):
<Toaster position="top-center" />

// CORRECT for RTL (toast slides in from visual right):
<Toaster
  position="top-left"
  toastOptions={{
    style: {
      direction: 'rtl',
      // ... warm colors
    }
  }}
/>
```

Source: react-hot-toast docs confirmed `top-left`/`top-right` are physical positions (HIGH confidence via Context7).

### Pattern 5: Toast Slide-In Animation (MICRO-03)

**What:** Add a `slide-from-right` keyframe to tailwind.config.js for RTL-correct toast entrance.
**When to use:** Override ToastBar animation in the Toaster render prop.

```javascript
// tailwind.config.js — add to keyframes:
slideFromRight: {
  '0%': { transform: 'translateX(-100%)', opacity: '0' },
  '100%': { transform: 'translateX(0)', opacity: '1' },
},
slideToRight: {
  '0%': { transform: 'translateX(0)', opacity: '1' },
  '100%': { transform: 'translateX(-100%)', opacity: '0' },
},
// Add to animation:
'slide-from-right': 'slideFromRight 0.2s ease-out',
'slide-to-right': 'slideToRight 0.15s ease-in',
```

Note: In RTL context `top-left` = visual right edge. `translateX(-100%)` moves from physical left (visual right) inward — which is the correct RTL slide-in direction.

### Pattern 6: Page Fade-In (LOAD-05)

**What:** Wrap the `<main>` content in Layout.tsx with a CSS `animate-fade-in` class, or apply it to the route outlet.
**Why it's the right approach:** The `animate-fade-in` keyframe (`fadeIn 0.15s ease-out`) already exists in tailwind.config.js (Phase 6 decision). Adding it to the Layout `<main>` element or wrapping route content eliminates white flash.
**Implementation:**

```typescript
// src/components/Layout.tsx — add class to the main content wrapper:
<main
  className="mt-16 ml-0 p-0 bg-gray-50 min-h-[calc(100vh-64px)] rtl transition-all duration-300 animate-fade-in"
  key={useLocation().pathname}  // forces re-render/re-animation on route change
  ...
>
```

**Alternative:** Use React Router v6's `<AnimatePresence>` with framer-motion, but this adds complexity with no benefit since the Tailwind keyframe is already available.

### Pattern 7: InstrumentBadge (Simple — no icons, v1 scope)

**What:** Per the phase notes, MUSIC-01 (InstrumentBadge with department color coding + icons) is deferred to v2.1. Phase 8 InstrumentBadge is a thin wrapper on the existing shadcn Badge component displaying instrument text only.

```typescript
// src/components/domain/InstrumentBadge.tsx
import { Badge } from '@/components/ui/badge'

interface InstrumentBadgeProps {
  instrument: string
  className?: string
}

export function InstrumentBadge({ instrument, className }: InstrumentBadgeProps) {
  return (
    <Badge variant="secondary" className={className}>
      {instrument}
    </Badge>
  )
}
```

**Reconciling roadmap vs requirements:** The roadmap says "InstrumentBadge" in Phase 8, MUSIC-01 says defer. Resolution: Phase 8 delivers InstrumentBadge as a simple text badge (no department colors, no icons). Department color coding is Phase 10+ work.

### Pattern 8: StatusBadge Consolidation

**What:** The app has TWO StatusBadge implementations: `DesignSystem.tsx` (standalone component) and `badge.tsx` (CVA variants: active/inactive/graduated/pending). They should be unified.
**Resolution:** The shadcn Badge variants in `badge.tsx` already have `active`, `inactive`, `graduated`, `pending` variants. Create a `StatusBadge` wrapper in `src/components/domain/` that maps domain status strings to badge variants.

```typescript
// src/components/domain/StatusBadge.tsx
import { Badge } from '@/components/ui/badge'

const STATUS_MAP = {
  'פעיל': 'active',
  'לא פעיל': 'inactive',
  'בוגר': 'graduated',
  'ממתין': 'pending',
} as const

export function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_MAP[status as keyof typeof STATUS_MAP] ?? 'outline'
  return <Badge variant={variant as any}>{status}</Badge>
}
```

### Pattern 9: AvatarInitials

**What:** Use the existing `avatar.tsx` (Radix Avatar) with a fallback that computes Hebrew initials from `firstName + lastName`.

```typescript
// src/components/domain/AvatarInitials.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/utils/nameUtils'  // or inline

interface AvatarInitialsProps {
  firstName?: string
  lastName?: string
  fullName?: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarInitials({ firstName, lastName, fullName, src, size = 'md' }: AvatarInitialsProps) {
  const initials = getInitials(firstName, lastName, fullName)
  const sizeClass = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }[size]

  return (
    <Avatar className={sizeClass}>
      {src && <AvatarImage src={src} />}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
```

### Pattern 10: StatsCard Unification

**What:** Two StatsCard implementations exist: `src/components/ui/StatsCard.tsx` (simple, no loading state) and `src/components/dashboard/StatCard.tsx` (full-featured with loading/error/trend). The dashboard version is the richer one and should become canonical.
**Resolution:** Domain `StatsCard` wraps the dashboard `StatCard` with the warm design token colors baked in. The dashboard StatCard already has a skeleton loading state (`animate-pulse`). Upgrade it to use the new `<Skeleton>` component.

### Anti-Patterns to Avoid

- **Do not replace all 104 spinner files in Phase 8:** Success criteria targets 3 list pages only (Teachers, Students, Orchestras). Other spinner replacements belong in per-feature phases.
- **Do not use framer-motion for page transitions:** `animate-fade-in` Tailwind class + `key={pathname}` on the main element is sufficient and avoids adding a dependency.
- **Do not create a toast abstraction layer:** react-hot-toast's `toast.success()` / `toast.error()` API is already the abstraction. Adding a `useToast` wrapper increases complexity for no gain.
- **Do not install shadcn Skeleton via CLI:** WSL constraint. Write the component manually following the shadcn pattern (`animate-pulse bg-muted rounded-md`).
- **Do not position toast at `top-right`:** Physical `top-right` = visual LEFT edge in RTL. Use `top-left` for visual right.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast system | Custom toast component | react-hot-toast (already installed) | 16 call sites already use it; rebuilding breaks them |
| Avatar image loading | Custom fallback | `@radix-ui/react-avatar` (avatar.tsx) | Handles image load errors, fallback timing |
| Skeleton animation | Custom CSS shimmer | `animate-pulse bg-muted` (Tailwind built-in) | Consistent with shadcn Skeleton pattern |
| Page transition | Custom AnimatePresence | `key={pathname}` + `animate-fade-in` | Simpler, no extra dependency, existing keyframe |
| Instrument icons | Custom SVG set | Deferred to v2.1 | Lucide doesn't cover all 27 instruments; scoped out |

**Key insight:** This project already has 80% of Phase 8 implemented across scattered files. The work is consolidation + wiring, not greenfield building.

---

## Common Pitfalls

### Pitfall 1: RTL Toast Position Confusion
**What goes wrong:** Setting `position="top-right"` believing it's the "right side" — in RTL, physical right is visual left.
**Why it happens:** React-hot-toast uses physical (LTR) coordinates, not CSS logical properties.
**How to avoid:** Use `position="top-left"` for RTL apps. This places toasts at the physical left = visual right in RTL.
**Warning signs:** Toasts appearing on the left side of the screen in the running app.

### Pitfall 2: Duplicate Component Confusion
**What goes wrong:** Creating a new `StatusBadge` in `domain/` without deleting or re-exporting the old `DesignSystem.tsx` version — two StatusBadge implementations drift apart.
**Why it happens:** The codebase has multiple half-implemented versions of the same component.
**How to avoid:** When creating domain/ version, update imports in callers OR have DesignSystem.tsx re-export from domain/. Document the canonical location in a barrel export.
**Warning signs:** `import { StatusBadge } from 'src/components/ui/DesignSystem'` and `import { StatusBadge } from 'src/components/domain'` both existing after Phase 8.

### Pitfall 3: Scope Creep on Skeleton Replacement
**What goes wrong:** Phase 8 success criteria say 3 list pages show skeleton instead of spinner. Attempting to replace all 104 spinner files makes the phase 10x larger.
**Why it happens:** It's tempting to fix everything at once.
**How to avoid:** Strictly scope skeleton wiring to: `src/pages/Teachers.tsx`, `src/pages/Students.tsx`, `src/pages/Orchestras.tsx`. Other files can be addressed in later phases when their features are migrated.
**Warning signs:** Touching 20+ files in a single plan.

### Pitfall 4: Toast Warning/Info Variants (Deferred Decision)
**What goes wrong:** The requirements say TOAST-03 needs warning and info variants, but react-hot-toast has no built-in `toast.warning()`. Using `toast.custom()` for every warning/info is verbose.
**Why it happens:** react-hot-toast is opinionated — it has `success`, `error`, `loading`, and `custom` only.
**How to avoid:** Create a thin `toast.warning()` helper that calls `toast.custom()` with the amber warning style. This is 10 lines, not a full abstraction layer.

```typescript
// src/utils/toastUtils.ts
import toast from 'react-hot-toast'
import { AlertTriangle, Info } from 'lucide-react'

export const showWarning = (message: string) => toast.custom(
  (t) => (
    <div className={`... ${t.visible ? 'animate-slide-from-right' : 'animate-slide-to-right'}`}>
      <AlertTriangle className="w-4 h-4 text-amber-600" />
      <span dir="rtl">{message}</span>
    </div>
  ),
  { duration: 4000 }
)
```

### Pitfall 5: `key={pathname}` Causing Layout Re-mounts
**What goes wrong:** Adding `key={useLocation().pathname}` to the `<main>` element in Layout.tsx causes all sidebar/header state to reset on navigation.
**Why it happens:** `key` prop causes React to unmount and remount the entire subtree.
**How to avoid:** Add `key` only to the inner page content `<div>`, not to the outer `<main>` that wraps everything. Or apply `animate-fade-in` as a CSS class without a key, using CSS animation-fill-mode instead.

**Safer alternative for page fade:**
```css
/* In index.css — page content wrapper gets fade-in automatically */
.page-content {
  animation: fadeIn 0.15s ease-out;
}
```

---

## Code Examples

Verified patterns from official sources:

### React-hot-toast: Custom Toast with Animation
```javascript
// Source: https://react-hot-toast.com/docs/toaster (Context7-verified)
<Toaster position="top-left">
  {(t) => (
    <ToastBar
      toast={t}
      style={{
        ...t.style,
        animation: t.visible
          ? 'slideFromRight 0.2s ease-out'
          : 'slideToRight 0.15s ease-in forwards',
        direction: 'rtl',
      }}
    />
  )}
</Toaster>
```

### React-hot-toast: Warning Variant via toast.custom()
```javascript
// Source: https://react-hot-toast.com/docs/version-2 (Context7-verified)
toast.custom((t) => (
  <div className={`bg-amber-50 border border-amber-200 ... ${t.visible ? 'animate-slide-from-right' : ''}`}>
    <AlertTriangle className="text-amber-600" />
    <span dir="rtl">{message}</span>
  </div>
))
```

### Skeleton (shadcn pattern)
```typescript
// shadcn canonical pattern — manually write since CLI unavailable
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
    />
  )
}
```

### Page Fade-in (CSS-only, no framer-motion)
```typescript
// src/pages/Teachers.tsx — wrap return with fade-in div
return (
  <div className="animate-fade-in">
    {/* page content */}
  </div>
)
// 'animate-fade-in' is already defined in tailwind.config.js keyframes
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `animate-spin` spinner for list loading | Skeleton (table-shaped placeholder rows) | Reduces perceived load time, eliminates layout shift |
| `top-center` toast position | `top-left` (RTL-correct) | Toasts appear from visual right, matching Hebrew reading direction |
| Inline error text with emoji `❌` | `<ErrorState>` component with retry | Consistent error UI, no magic emoji strings |
| `DesignSystem.tsx` StatusBadge (standalone) | Domain `StatusBadge` wrapping shadcn Badge | Single source of truth, CVA variants |
| Page route changes cause white flash | `animate-fade-in` on page wrapper | Smooth 150ms fade eliminates flash |

---

## What Already Exists (Do Not Rebuild)

This is critical context for planning tasks:

| Component | Location | Status | Phase 8 Action |
|-----------|----------|--------|----------------|
| `LoadingSkeleton` | `src/components/feedback/LoadingStates.tsx` | Works, uses `animate-pulse` | Create new `Skeleton.tsx` primitive; `LoadingSkeleton` can co-exist |
| `StatusBadge` | `src/components/ui/DesignSystem.tsx` | Works | Extract to `domain/`, re-export from DesignSystem |
| `InstrumentBadge` | `src/components/ui/DesignSystem.tsx` | Works (category-based) | Create simpler `domain/InstrumentBadge` for instrument name only |
| `StatsCard` | `src/components/ui/StatsCard.tsx` | Simple version | Keep; create `domain/StatsCard` as alias for dashboard version |
| `StatCard` | `src/components/dashboard/StatCard.tsx` | Full version with loading state | This is the canonical version; domain StatsCard wraps it |
| `Pagination` | `src/components/ui/Pagination.tsx` | Fully functional | No changes needed — already correct |
| `Avatar/AvatarFallback` | `src/components/ui/avatar.tsx` | Phase 7 primitive | Wrap with `domain/AvatarInitials` |
| `react-hot-toast Toaster` | `src/App.tsx` line 539 | Configured but wrong position | Update position + add slide animation |
| `animate-fade-in` keyframe | `tailwind.config.js` | Already defined | Use directly — no new keyframe needed |

---

## Open Questions

1. **`getInitials()` function availability**
   - What we know: `nameUtils.ts` exists per MEMORY.md (`src/utils/nameUtils.ts`)
   - What's unclear: Whether it exports a `getInitials()` function or only `getDisplayName()`
   - Recommendation: Read nameUtils.ts before implementing AvatarInitials; inline initials logic if function doesn't exist

2. **Empty state illustration strategy**
   - What we know: Success criteria says "illustrated empty state" — could mean SVG illustration or just a Lucide icon
   - What's unclear: Whether the design calls for complex illustration or an icon is sufficient
   - Recommendation: Use a large Lucide icon (e.g., `Users` for teachers, `GraduationCap` for students) as the illustration. Defer complex SVG illustration to design phase.

3. **Toast `warning` and `info` display count**
   - What we know: Current codebase only uses `toast.success()` and `toast.error()` (verified from grep)
   - What's unclear: Which pages will actually trigger warning/info toasts in Phase 8
   - Recommendation: Build `toastUtils.ts` with `showWarning/showInfo` helpers but don't force-replace existing `toast.success/error` calls — only new callsites use the helpers.

4. **ConfirmDeleteDialog scope**
   - What we know: LOAD-06 requires clear consequence messaging in confirm dialogs; ConfirmDeleteDialog already exists from Phase 7
   - What's unclear: Whether Phase 8 needs to upgrade ConfirmDeleteDialog or just documents that it satisfies LOAD-06
   - Recommendation: Review ConfirmDeleteDialog content — if it already shows "N תלמידים יימחקו" impact messaging, LOAD-06 is already satisfied. If not, Phase 08-02 should enhance it.

---

## Sources

### Primary (HIGH confidence)
- `/websites/react-hot-toast` (Context7) — position values, custom animation pattern, `toast.custom()`, per-type styling
- `src/App.tsx` (codebase) — current Toaster config, 16 toast call sites verified
- `src/components/feedback/LoadingStates.tsx` (codebase) — existing skeleton/loading implementations
- `src/components/ui/DesignSystem.tsx` (codebase) — existing StatusBadge/InstrumentBadge
- `src/components/ui/badge.tsx` (codebase) — CVA variants: active/inactive/graduated/pending already defined
- `tailwind.config.js` (codebase) — `animate-fade-in`, `animate-slide-up` already defined
- Bash grep results — 104 files with spinner patterns, 16 toast call sites, 0 framer-motion imports

### Secondary (MEDIUM confidence)
- Phase 6/7 STATE.md decisions — animation timing standards (100-200ms ease-out), no decorative infinite animations

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against package.json and codebase imports
- Architecture: HIGH — directly derived from existing codebase patterns
- Pitfalls: HIGH — identified from concrete code evidence (104 spinner files, position bug)
- Toast RTL position: HIGH — verified via Context7 react-hot-toast docs

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable library versions, no fast-moving dependencies)

---

## Phase Plan Implications

Given research findings, the roadmap's 3-plan split should work with these adjustments:

**08-01: Domain Components** (InstrumentBadge, StatusBadge, AvatarInitials, StatsCard)
- Extract from DesignSystem.tsx into `src/components/domain/`
- Wire into at least one consumer page to verify (e.g., Teachers list)
- ~1-2 hours

**08-02: Skeleton, EmptyState, ErrorState**
- Write `Skeleton.tsx` primitive (shadcn pattern)
- Write `EmptyState.tsx` with Lucide icon illustration
- Write `ErrorState.tsx` with retry button
- Wire ALL THREE into Teachers, Students, Orchestras pages (replaces spinners)
- ~1.5 hours

**08-03: Toast system + Page transition**
- Fix Toaster position to `top-left`
- Add `slideFromRight/slideToRight` keyframes to tailwind.config.js
- Customize ToastBar with render prop for RTL animation
- Create `src/utils/toastUtils.ts` with `showWarning` and `showInfo` helpers
- Add `animate-fade-in` to page content wrappers in App.tsx or Layout.tsx
- Verify LOAD-06 (ConfirmDeleteDialog) already has consequence messaging
- ~45 minutes
