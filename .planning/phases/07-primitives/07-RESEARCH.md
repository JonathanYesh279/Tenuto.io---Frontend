# Phase 7: Primitives — Research

**Researched:** 2026-02-17
**Domain:** shadcn/ui primitive components (Dialog, Tabs, DropdownMenu, Tooltip, Avatar, Switch, Checkbox, Separator) on Tailwind v3 + RTL
**Confidence:** HIGH (codebase fully inspected + Context7 verified + official docs checked)

---

## Summary

Phase 7 installs the missing Radix UI packages and adds the corresponding shadcn/ui component files for Dialog, Tabs, DropdownMenu, Tooltip, Avatar, Switch, Checkbox, and Separator. It then migrates all four custom modal variants to shadcn Dialog, migrates the custom tab navigation in Teacher/Student/Orchestra detail pages to shadcn Tabs, and migrates the Header profile dropdown to shadcn DropdownMenu.

The codebase is already well-prepared: `@radix-ui/react-direction` is installed (v1.1.1), `DirectionProvider dir="rtl"` already wraps the app in `main.tsx`, and `dir="rtl"` + `lang="he"` are already set on `document.documentElement`. shadcn/ui's RTL support is provided by its `DirectionProvider` which Radix Dialog/DropdownMenu/Select read from context — no per-component `dir` prop is needed. The CSS token system, `cn()` utility, and `components.json` are all in place from Phase 6.

The single largest blocker is that `tailwindcss-animate` is not installed (and not referenced in tailwind.config.js), but the Select component already in the codebase uses `data-[state=open]:animate-in` classes that silently fail without it. Every new shadcn component (Dialog, DropdownMenu, Tooltip) similarly depends on these animation classes. Phase 7 must install `tailwindcss-animate` and register it as a Tailwind plugin as the first step.

**Primary recommendation:** Run `npm install tailwindcss-animate` + add `require('tailwindcss-animate')` to tailwind.config.js plugins first, then install all Radix packages via `npx shadcn@latest add [components]`. Do NOT run `npx shadcn@latest migrate rtl` — the app is already RTL and that command would rewrite existing component files unnecessarily.

---

## Standard Stack

### Core (already in place)

| Library | Version Installed | Purpose | Status |
|---------|------------------|---------|--------|
| `@radix-ui/react-direction` | 1.1.1 | DirectionProvider for RTL | INSTALLED, ACTIVE in main.tsx |
| `@radix-ui/react-label` | ^2.1.7 | Label primitive | INSTALLED |
| `@radix-ui/react-select` | ^2.2.6 | Select primitive | INSTALLED (select.tsx exists) |
| `@radix-ui/react-slot` | ^1.2.3 | Slot primitive for asChild | INSTALLED |
| `class-variance-authority` | ^0.7.1 | CVA for variant definitions | INSTALLED |
| `clsx` + `tailwind-merge` | 2.0.0 + 1.14.0 | `cn()` utility | INSTALLED (lib/utils.ts) |
| `lucide-react` | ^0.279.0 | Icons | INSTALLED |

### Packages to Install in Phase 7

| Package | shadcn component(s) | Notes |
|---------|---------------------|-------|
| `tailwindcss-animate` | all animated components | CRITICAL — animates Dialog/DropdownMenu/Tooltip/Tabs, currently missing |
| `@radix-ui/react-dialog` | dialog.tsx | Core modal primitive |
| `@radix-ui/react-tabs` | tabs.tsx | Tab list/trigger/content |
| `@radix-ui/react-dropdown-menu` | dropdown-menu.tsx | Profile dropdown, action menus |
| `@radix-ui/react-tooltip` | tooltip.tsx | Button hover tooltips |
| `@radix-ui/react-avatar` | avatar.tsx | User initials/images |
| `@radix-ui/react-switch` | switch.tsx | Toggle inputs |
| `@radix-ui/react-checkbox` | checkbox.tsx | Checkbox inputs |
| `@radix-ui/react-separator` | separator.tsx | Visual dividers |
| `@radix-ui/react-progress` | progress.tsx | Already have custom progress.tsx — CLI may overwrite |

**Note on progress.tsx:** A custom `progress.tsx` already exists at `src/components/ui/progress.tsx`. It is NOT a standard shadcn component (uses custom `bg-primary-600` class instead of CSS var). When running `npx shadcn@latest add progress`, the CLI will ask to overwrite — accept and then verify the CSS var `bg-primary` resolves correctly with the existing token setup.

### shadcn CLI Installation Commands

```bash
# Step 1: Animation plugin (Tailwind v3)
npm install tailwindcss-animate

# Step 2: All components in one CLI command (preferred)
npx shadcn@latest add dialog tabs dropdown-menu tooltip avatar switch checkbox separator progress

# Alternative: install individually
npx shadcn@latest add dialog
npx shadcn@latest add tabs
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tooltip
npx shadcn@latest add avatar
npx shadcn@latest add switch
npx shadcn@latest add checkbox
npx shadcn@latest add separator
npx shadcn@latest add progress
```

### Tailwind Config Update (Required)

```javascript
// tailwind.config.js — add to plugins array
plugins: [
  require('tailwindcss-animate'),   // ADD THIS FIRST
  function({ addUtilities, addComponents, theme }) {
    // existing RTL utilities plugin stays
  }
]
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `tailwindcss-animate` | `tw-animate-css` | tw-animate-css is for Tailwind v4 (uses `@import`, not plugin system). Project is on Tailwind v3 — use `tailwindcss-animate`. |
| shadcn Dialog | Radix Dialog directly | shadcn wraps Radix with our CSS tokens pre-applied. Use shadcn. |
| shadcn Tabs | Radix Tabs directly | Same — shadcn version uses `cn()` and our `ring`/`muted` tokens. |

---

## Architecture Patterns

### Recommended Project Structure (no changes needed)

```
src/
├── components/ui/           # shadcn components live here (already established)
│   ├── button.tsx           # EXISTS
│   ├── badge.tsx            # EXISTS
│   ├── select.tsx           # EXISTS
│   ├── input.tsx            # EXISTS
│   ├── label.tsx            # EXISTS
│   ├── alert.tsx            # EXISTS
│   ├── progress.tsx         # EXISTS (custom — may be overwritten by CLI)
│   ├── dialog.tsx           # ADD in 07-01
│   ├── tabs.tsx             # ADD in 07-01
│   ├── dropdown-menu.tsx    # ADD in 07-01
│   ├── tooltip.tsx          # ADD in 07-02
│   ├── avatar.tsx           # ADD in 07-02
│   ├── switch.tsx           # ADD in 07-02
│   ├── checkbox.tsx         # ADD in 07-02
│   ├── separator.tsx        # ADD in 07-02
│   └── direction.tsx        # ADD for DirectionProvider re-export (if needed)
└── features/[module]/details/
    └── components/          # Domain usage of primitives
```

### Pattern 1: shadcn Dialog for Delete Confirmation (replaces ConfirmDeleteModal)

**What:** Replace `ConfirmDeleteModal` (4 variants) with a single `ConfirmDeleteDialog` built on shadcn Dialog.
**When to use:** All delete actions that currently open ConfirmDeleteModal, ConfirmationModal, InputModal, or Modal.

```typescript
// Source: https://ui.shadcn.com/docs/components/dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// RTL note: DirectionProvider in main.tsx provides rtl context.
// Dialog reads direction from Radix DirectionProvider — no dir prop needed here.
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = 'אישור מחיקה',
  description,
  itemName,
  consequences, // cascade list
  onConfirm,
  isLoading,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Cascade consequences list */}
        {consequences && consequences.length > 0 && (
          <ul className="text-sm text-muted-foreground space-y-1 my-4">
            {consequences.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-destructive">•</span> {c}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter className="gap-2 flex-row-reverse sm:flex-row-reverse">
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : 'מחק'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**RTL note on DialogFooter:** shadcn DialogFooter uses `flex-col-reverse sm:flex-row justify-end`. In RTL, `justify-end` correctly places buttons on the left. But button order (Cancel then Delete in visual RTL order) requires `flex-row-reverse` override or explicit ordering in JSX — test visually.

### Pattern 2: shadcn Tabs for Detail Pages

**What:** Replace custom `TeacherTabNavigation` + `TeacherTabContent` split with shadcn Tabs. The shadcn Tabs component internally handles RTL tab ordering because the `DirectionProvider` context is already set to `rtl`.

```typescript
// Source: https://ui.shadcn.com/docs/components/tabs
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

// In TeacherDetailsPage (or wherever the tab state lives):
<Tabs defaultValue="personal" className="w-full">
  <TabsList className="sticky top-0 z-10 w-full justify-start border-b rounded-none bg-white h-auto px-6">
    <TabsTrigger value="personal">מידע אישי</TabsTrigger>
    <TabsTrigger value="students">ניהול תלמידים</TabsTrigger>
    <TabsTrigger value="schedule">לוח זמנים</TabsTrigger>
    <TabsTrigger value="conducting">ניצוח</TabsTrigger>
    <TabsTrigger value="hours">שעות שבועיות</TabsTrigger>
  </TabsList>

  <TabsContent value="personal">
    <PersonalInfoTab teacher={teacher} teacherId={teacherId} />
  </TabsContent>
  {/* ... other tab contents */}
</Tabs>
```

**Migration scope:** 3 detail pages with identical split-component pattern:
1. `TeacherTabNavigation` + `TeacherTabContent` → shadcn Tabs
2. `StudentTabNavigation` + `StudentTabContent` → shadcn Tabs
3. `OrchestraTabNavigation` + `OrchestraTabContent` → shadcn Tabs

**After migration:** Remove `TODO(Phase 7)` `!important` blocks from `tab-navigation-fix.css` (the mobile/desktop display toggle was overriding inline styles — shadcn Tabs handles responsive layout differently). The `.desktop-tab-nav`, `.mobile-tab-nav`, `.student-tab-navigation` classes become dead code.

### Pattern 3: shadcn DropdownMenu for Header Profile

**What:** Replace the custom profile dropdown in `Header.tsx` (manual `ref`, `useState`, `clickOutside` handler) with shadcn DropdownMenu.

```typescript
// Source: https://ui.shadcn.com/docs/components/dropdown-menu
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
      {getInitials()}
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>
      <div>{getUserFullName()}</div>
      <div className="text-xs font-normal text-muted-foreground">{getUserRole()}</div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleProfileClick}>עמוד אישי</DropdownMenuItem>
    <DropdownMenuItem onClick={handleLogout} className="text-destructive">יציאה</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**RTL note:** `align="end"` places the dropdown on the correct side in RTL context (Radix reads the DirectionProvider, so "end" = right side in RTL = correct for an avatar in the top-left of an RTL header). The manual `clickOutside` handler, `useRef`, and `useEffect` in Header.tsx are eliminated.

### Pattern 4: Badge for Status Values

**What:** The existing `StatusBadge` in `Table.tsx` and `DesignSystem.tsx` is a custom component with limited status set (`active`, `inactive`, `pending`, `completed`, `in-progress`). The shadcn `badge.tsx` exists with `default/secondary/destructive/outline/success` variants. Phase 7 consolidates by either:
- Option A: Keep both (Table.StatusBadge for table rows, shadcn Badge for detail pages)
- Option B: Migrate all to shadcn Badge with added variants (recommended)

Recommended approach: Add `active`, `inactive`, `graduated`, `pending` as named variants in `badge.tsx` using CVA. The existing `StatusBadge` in Table.tsx becomes a thin wrapper or is deprecated.

```typescript
// Extended badge.tsx with status variants
const badgeVariants = cva("...", {
  variants: {
    variant: {
      default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
      secondary: "...",
      destructive: "...",
      outline: "text-foreground",
      success: "border-transparent bg-green-500 text-white hover:bg-green-600",
      // NEW — status variants for domain use:
      active: "border-transparent bg-green-100 text-green-800",
      inactive: "border-transparent bg-gray-100 text-gray-700",
      graduated: "border-transparent bg-purple-100 text-purple-800",
      pending: "border-transparent bg-orange-100 text-orange-800",
    },
  },
})
```

### Pattern 5: RTL with DirectionProvider

**What:** The app already uses `DirectionProvider dir="rtl"` from `@radix-ui/react-direction` in `main.tsx`. Radix UI Dialog, DropdownMenu, Tabs, Tooltip, and other components internally read this context and render RTL-correct animations and positioning.

**Verified:** `dir="rtl"` is set on `document.documentElement` in main.tsx AND `DirectionProvider dir="rtl"` wraps the React tree. Both are required. The shadcn v4 docs show the same pattern for Vite RTL setup.

```typescript
// main.tsx (already correct — no changes needed for RTL)
document.documentElement.setAttribute('dir', 'rtl')  // HTML attribute
document.documentElement.setAttribute('lang', 'he')

<DirectionProvider dir="rtl">   // Radix context
  <App />
</DirectionProvider>
```

**Gotcha:** The Radix `DirectionProvider` uses `dir` prop (not `direction`). The existing code uses the correct prop name — verified in the installed package (v1.1.1).

### Animation Durations (already established in Phase 6)

Per Phase 6 decision (`[06-02]: Animation standard established`):
- Modals: 200ms scale-in (matches `data-[state=open]:animate-in` default duration)
- Toasts/slide-in: 200ms ease-out
- Page transitions: 150ms ease-out
- Button hover: ≤150ms (MICRO-01 requirement)

The `tailwindcss-animate` plugin classes use 150ms by default. The Dialog component adds `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95` — the `duration-200` modifier should be added to match the Phase 6 standard: add `duration-200` class to `DialogContent`.

### Anti-Patterns to Avoid

- **Adding `dir="rtl"` to individual shadcn components:** Radix reads direction from context. Per-component dir attrs are redundant.
- **Using `npx shadcn@latest migrate rtl`:** This modifies component file class names (e.g., `ml-4` → `ms-4`). The components.json `style: "default"` already outputs logical properties in modern shadcn versions. Do not run this migration.
- **Not installing `tailwindcss-animate` before running `npx shadcn@latest add dialog`:** The CLI adds dialog.tsx with `animate-in`/`animate-out` classes. Without the plugin, these generate no CSS. Install the plugin first and add it to tailwind.config.js.
- **Forgetting to add the plugin to tailwind.config.js after npm install:** `npm install` alone is not enough — the plugin must be in the `plugins` array.
- **Overwriting `progress.tsx` and breaking existing functionality:** The current custom progress.tsx uses `bg-primary-600` (hardcoded palette class). The shadcn CLI version uses `bg-primary` (CSS var). Both work after Phase 6, but the transition `transform` implementation differs. Accept CLI overwrite but verify visually.
- **Migrating all modals at once without a wrapper strategy:** The 4 modal variants (`Modal`, `ConfirmDeleteModal`, `ConfirmationModal`, `InputModal`) are used across 29 files. The safest approach is to build a new `ConfirmDeleteDialog` and a new `Dialog`-based `Modal` wrapper that preserves the existing prop API, then swap import by import rather than refactoring call sites.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap in modal | Custom focus management | shadcn Dialog (Radix handles it) | Radix Dialog implements ARIA Dialog pattern with proper focus trap, Escape key, scroll lock |
| Click-outside detection | `useRef` + `addEventListener` | shadcn DropdownMenu | Already done in Header.tsx with manual ref — Radix handles it internally |
| Tab keyboard navigation | Custom keydown handlers | shadcn Tabs (Radix) | Radix Tabs implements ARIA Tabs pattern with arrow key navigation |
| Animation on state change | CSS class toggling | `tailwindcss-animate` + `data-[state]` | Radix elements expose `data-state="open/closed"` — use Tailwind animate plugin |
| Tooltip positioning | Custom absolute positioning | shadcn Tooltip (Radix Floating UI) | Handles viewport collision, arrow positioning, RTL flip |
| Status badge variants | Custom `StatusBadge` component | shadcn Badge + CVA variants | CVA type-safety, consistent with design system |

**Key insight:** Every problem listed above involves edge cases that take significant time to get right (focus traps, ARIA attributes, keyboard navigation, viewport collision). Radix/shadcn handles all of them correctly for free.

---

## Common Pitfalls

### Pitfall 1: Missing `tailwindcss-animate` plugin
**What goes wrong:** Dialog, DropdownMenu, Tooltip open/close without any animation. `data-[state=open]:animate-in` classes generate no CSS rules. The Select component (already in codebase) has this same silent bug.
**Why it happens:** `tailwindcss-animate` must be both npm-installed AND registered as a Tailwind plugin. Neither is currently done.
**How to avoid:** First step of 07-01: `npm install tailwindcss-animate` then update tailwind.config.js.
**Warning signs:** No entrance animation on Select dropdown (currently broken), Dialog appears instantaneously.

### Pitfall 2: DialogFooter button order in RTL
**What goes wrong:** In RTL layout, "Cancel" appears on the right and "Delete" appears on the left — the opposite of what the user expects (destructive action should be on the right in RTL = visually prominent).
**Why it happens:** shadcn's `DialogFooter` uses `flex-col-reverse sm:flex-row justify-end`. In RTL, `justify-end` means right-to-left. The JSX order matters.
**How to avoid:** In RTL, put the primary/destructive button first in JSX, Cancel second. Test with dir=rtl.
**Warning signs:** Button order looks wrong in RTL testing.

### Pitfall 3: Tab migration breaks the sticky header pattern
**What goes wrong:** The existing `TeacherTabNavigation` is `sticky top-0 z-10`. shadcn `TabsList` is not sticky by default.
**Why it happens:** shadcn Tabs renders `TabsList` as a regular flex container — no sticky positioning.
**How to avoid:** Apply `sticky top-0 z-10 bg-white` to the `TabsList` via className. The custom `tab-navigation-fix.css` classes (`desktop-tab-nav`, `mobile-tab-nav`) become dead code and can be removed after verifying.
**Warning signs:** Tab navigation scrolls away on long content pages.

### Pitfall 4: `!important` in tab-navigation-fix.css after migration
**What goes wrong:** The `TODO(Phase 7)` `!important` blocks in `tab-navigation-fix.css` (responsive display toggle) remain active even after shadcn Tabs replaces the custom components. They reference `.desktop-tab-nav` and `.mobile-tab-nav` classes that no longer exist but still bloat CSS.
**Why it happens:** CSS cleanup is a separate step from component replacement.
**How to avoid:** After migrating tabs, delete the `.desktop-tab-nav display: none/flex !important` and `.mobile-tab-nav display: none/block !important` blocks. shadcn Tabs handles responsive layout via its own classes.

### Pitfall 5: Native `<select>` in AddTeacherModal not replaced
**What goes wrong:** `teacher-modal-fixes.css` has `TODO(Phase 7)` `!important` on `.teacher-student-select option` — this is a native `<select>` in the teacher assignment form that shadcn Select should replace.
**Why it happens:** Phase 7's scope includes replacing this native select. The TODO is in `StudentManagementTab.tsx`.
**How to avoid:** Find the `.teacher-student-select` element and replace with shadcn `<Select>` component (already installed from Phase 6). Then delete the `!important` CSS block.
**Warning signs:** Option text invisible in dark-mode browsers (the current bug that !important works around).

### Pitfall 6: Cascade deletion modal is multi-step
**What goes wrong:** `StudentDeletionModal.tsx` is a multi-step workflow (impact → confirmation → progress → complete), not a simple confirm dialog. It cannot be replaced with a basic `ConfirmDeleteDialog`.
**Why it happens:** The modal has internal state machine (4 steps). shadcn Dialog can contain this, but the step components stay as-is — only the outer Modal container is replaced.
**How to avoid:** Replace only the outer `Modal` wrapper (isOpen/onClose) in `StudentDeletionModal` with `Dialog open/onOpenChange`. Keep all inner step components unchanged.

### Pitfall 7: Focus ring visibility (A11Y-01)
**What goes wrong:** The existing `button.tsx` has `focus-visible:ring-2 focus-visible:ring-ring` — this is correct. But many inline `<button>` elements throughout the codebase use custom classes with `focus:outline-none` which defeats keyboard navigation.
**Why it happens:** Legacy buttons were styled with `focus:outline-none` + custom focus states.
**How to avoid:** Phase 7 should audit inline button elements that use `ConfirmationModal` and similar. When replacing modals, use shadcn `<Button variant="outline">` not bare `<button>` — this ensures focus rings are consistent. The existing button.tsx already has correct focus-visible styling.

---

## Code Examples

### Dialog installation and setup

```bash
# Source: https://ui.shadcn.com/docs/components/dialog
npm install tailwindcss-animate
npx shadcn@latest add dialog tabs dropdown-menu tooltip avatar switch checkbox separator progress
```

```javascript
// tailwind.config.js — REQUIRED for animate-in/animate-out to work
plugins: [
  require('tailwindcss-animate'),   // enables data-[state=open]:animate-in etc.
  function({ addUtilities, addComponents, theme }) {
    // existing RTL plugin...
  }
]
```

### Controlled Dialog (replaces isOpen pattern)

```typescript
// Source: https://ui.shadcn.com/docs/components/dialog
// Controlled mode — matches existing isOpen/onClose API pattern
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-md duration-200">
    <DialogHeader>
      <DialogTitle>אישור מחיקה</DialogTitle>
      <DialogDescription>פעולה זו אינה ניתנת לביטול</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="destructive" onClick={handleConfirm}>מחק</Button>
      <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Tabs — controlled mode (matches existing activeTab pattern)

```typescript
// Source: https://ui.shadcn.com/docs/components/tabs
// Controlled — matches existing activeTab/onTabChange API
<Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
  <TabsList className="sticky top-0 z-10 w-full justify-start rounded-none border-b bg-white px-6 h-14">
    <TabsTrigger value="personal" className="gap-2">
      <User className="h-4 w-4" />
      מידע אישי
    </TabsTrigger>
    {/* ... */}
  </TabsList>
  <TabsContent value="personal" className="mt-0">
    <PersonalInfoTab teacher={teacher} teacherId={teacherId} />
  </TabsContent>
</Tabs>
```

### DropdownMenu RTL (Header profile)

```typescript
// Source: https://ui.shadcn.com/docs/components/dropdown-menu
// DirectionProvider rtl context is inherited — no dir prop needed
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
      {getInitials()}
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48">
    <DropdownMenuLabel className="font-normal">
      <div className="font-medium">{getUserFullName()}</div>
      <div className="text-xs text-muted-foreground">{getUserRole()}</div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleProfileClick}>עמוד אישי</DropdownMenuItem>
    <DropdownMenuItem onClick={handleLogout} className="text-destructive">יציאה</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Badge status variants

```typescript
// Source: badge.tsx extension (CVA)
// Add to existing badgeVariants in src/components/ui/badge.tsx
active: "border-transparent bg-green-100 text-green-800",
inactive: "border-transparent bg-gray-100 text-gray-700",
graduated: "border-transparent bg-purple-100 text-purple-800",
pending: "border-transparent bg-orange-100 text-orange-800",
```

---

## Current Modal Inventory (Migration Scope)

This is the complete set of modals Phase 7 targets:

| Component | File | Pattern | Usage count | Migration approach |
|-----------|------|---------|-------------|-------------------|
| `Modal` | `src/components/ui/Modal.tsx` | Generic wrapper | 5 files import it | Replace with shadcn Dialog wrapper |
| `ConfirmDeleteModal` | `src/components/ui/ConfirmDeleteModal.tsx` | Delete confirm | 1 file (Orchestras.tsx) | Replace with new ConfirmDeleteDialog |
| `ConfirmationModal` | `src/components/ui/ConfirmationModal.tsx` | Generic confirm | 6 files | Replace with shadcn Dialog |
| `InputModal` | `src/components/ui/InputModal.tsx` | Single-input dialog | 1 file (PresentationDetailsModal) | Replace with shadcn Dialog |
| `StudentDeletionModal` | `src/components/deletion/StudentDeletionModal.tsx` | Multi-step | wraps Modal | Replace outer Modal with Dialog, keep inner steps |

**Files that import Modal or any variant:** 29 files total (identified by grep).

**Strategy:** Build one new `ConfirmDeleteDialog` (shadcn Dialog based) and one upgraded `Modal` that wraps `DialogContent`. After that, files can continue using their existing API with minimal changes, or be individually migrated.

---

## Current Tab Inventory (Migration Scope)

| Component pair | Feature | Tabs count | Migration approach |
|----------------|---------|------------|-------------------|
| `TeacherTabNavigation` + `TeacherTabContent` | teachers/details | 5 tabs | Replace with shadcn Tabs in TeacherDetailsPage |
| `StudentTabNavigation` + `StudentTabContent` | students/details | 8 tabs | Replace with shadcn Tabs in StudentDetailsPage |
| `OrchestraTabNavigation` + `OrchestraTabContent` | orchestras/details | 3+ tabs | Replace with shadcn Tabs in OrchestraDetailsPage |

After all 3 tab navigations are migrated:
- Remove `TODO(Phase 7)` `!important` blocks from `tab-navigation-fix.css`
- Verify `.desktop-tab-nav`, `.mobile-tab-nav`, `.student-tab-navigation` classes are unused and remove

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|-----------------|-------|
| `tailwindcss-animate` (Tailwind v3 plugin) | `tw-animate-css` (Tailwind v4 package) | Project is on Tailwind v3 — use `tailwindcss-animate`. Migration to tw-animate-css happens if/when Tailwind v4 is adopted. |
| Custom Modal with `isOpen` + `useEffect` scroll lock | shadcn Dialog | Radix handles scroll lock, focus trap, Escape key, ARIA |
| Custom tab buttons with `aria-current="page"` | shadcn Tabs | Radix handles `role="tab"`, `aria-selected`, keyboard navigation |
| Manual `clickOutside` ref | shadcn DropdownMenu | Radix handles dismiss on click-outside, Escape key |

**Deprecated (to remove after Phase 7):**
- `src/components/ui/Modal.tsx`: Keep as thin Dialog wrapper during migration, remove when all callsites migrated
- `src/components/ui/ConfirmDeleteModal.tsx`: Remove after `ConfirmDeleteDialog` is adopted everywhere
- `src/components/ui/ConfirmationModal.tsx`: Remove after all 6 import sites are migrated
- `src/components/ui/InputModal.tsx`: Remove after PresentationDetailsModal is migrated
- `tab-navigation-fix.css` responsive `!important` blocks: Remove after tab migration
- `teacher-modal-fixes.css` native option `!important` blocks: Remove after shadcn Select replaces native select

---

## Open Questions

1. **Dialog accessibility with cascade consequences list**
   - What we know: ConfirmDeleteModal currently shows a `message` + optional `itemName` + generic "cannot be undone" text. The new Phase 7 requirement adds "cascade consequences listed" to the dialog.
   - What's unclear: Where does the cascade consequence data come from per callsite? Some callsites know (e.g., "deleting this teacher will remove N lessons"), others may not.
   - Recommendation: Add an optional `consequences?: string[]` prop to `ConfirmDeleteDialog`. Callers that have the data can pass it; others omit it. The deletion impact system (existing cascade analysis) can populate this where available.

2. **Badge variant vs StatusBadge coexistence**
   - What we know: `StatusBadge` in `Table.tsx` has status values (`active`, `inactive`, `pending`, `completed`, `in-progress`). The shadcn `badge.tsx` has `default`, `secondary`, `destructive`, `outline`, `success`.
   - What's unclear: Should `Table.tsx` be updated to use shadcn Badge, or leave it as-is and only add Badge to new/updated components?
   - Recommendation: Extend badge.tsx with status variants and update Table.tsx to import from badge.tsx. `StatusBadge` can be a thin alias for backward compat.

3. **Mobile tab navigation: scrollable list vs overflow dropdown**
   - What we know: The existing custom tab navigation has a mobile variant (horizontal scroll with `min-width: max-content`). shadcn Tabs renders all tabs in a horizontal list — no built-in mobile overflow handling.
   - What's unclear: Does shadcn Tabs handle overflow scrolling for 8-tab (Student) or 5-tab (Teacher) lists on small screens?
   - Recommendation: Apply `overflow-x-auto` to `TabsList` with `scrollbar-hide` for mobile. On desktop, tabs wrap naturally. Test on 375px viewport.

4. **TeacherTabNavigation has tab icons; shadcn TabsTrigger doesn't include icons by default**
   - What we know: Both Teacher and Student tab navigation include icons (User, GraduationCap, Calendar, etc.) alongside labels. shadcn `TabsTrigger` is plain text by default.
   - What's unclear: Should Phase 7 include icons in the migrated tabs?
   - Recommendation: Yes — add icons inside TabsTrigger using `className="gap-2 flex items-center"`. The icon size (`h-4 w-4`) follows the established pattern.

---

## Sources

### Primary (HIGH confidence)
- `/shadcn-ui/ui` (Context7) — Dialog, Tabs, DropdownMenu, Tooltip, Avatar, Checkbox, Switch, Separator, Badge, RTL/DirectionProvider docs
- `src/main.tsx` — DirectionProvider already wrapping app, dir=rtl set on documentElement (confirmed)
- `src/components/ui/` — existing shadcn components (button, badge, select, input, label, alert, progress) confirmed present
- `package.json` — exact versions of all installed packages confirmed
- `node_modules/@radix-ui/react-direction` — v1.1.1 confirmed installed

### Secondary (MEDIUM confidence)
- https://ui.shadcn.com/docs/installation/manual — `tailwindcss-animate` for Tailwind v3 (current project version)
- https://ui.shadcn.com/docs/tailwind-v4 — `tw-animate-css` for Tailwind v4 (NOT applicable to this project)
- WebSearch: `tailwindcss-animate` is the correct plugin for Tailwind v3 shadcn installs, confirmed by community patterns

### Tertiary (LOW confidence)
- Approach for `DialogFooter` RTL button ordering — inferred from RTL layout behavior, needs visual verification
- Mobile tab overflow behavior with shadcn Tabs — needs browser testing

---

## Metadata

**Confidence breakdown:**
- Standard stack (what packages to install): HIGH — verified against package.json, node_modules, and official docs
- Architecture (component patterns): HIGH — verified from existing code + Context7 shadcn docs
- Migration scope: HIGH — grepped all import sites, read all custom modal/tab files
- RTL behavior: HIGH — DirectionProvider already active, Radix docs confirm context inheritance
- Animation plugin: HIGH — tailwindcss-animate absent confirmed from package.json and node_modules scan
- Pitfalls: MEDIUM-HIGH — most from direct code inspection, button order in RTL is LOW (needs visual testing)

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (shadcn component API is stable; tailwindcss v3 deprecation timeline unknown)
