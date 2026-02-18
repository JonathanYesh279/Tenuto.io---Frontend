# Phase 21: Detail Pages and Forms - Research

**Researched:** 2026-02-18
**Domain:** React detail page UI redesign — profile header zones, tab navigation styling, form section grouping
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Keep existing tab structure — tabs work well for entity detail
- Restyle tabs and content with stronger visual hierarchy
- Profile/header zone gets bolder treatment
- Forms: restructure with visual sections — clear section grouping with visual dividers or section headers
- Form hierarchy: section title → fields → section title → fields
- Overall: light, airy backgrounds (white/very light gray), cards with subtle borders, data dominant, pastel color accents, clear zoning on every page

### Claude's Discretion
- Exact pastel hue assignments per entity (teachers = sky blue, students = violet, orchestras = amber — already defined in Phase 18 token layer)
- Specific spacing values and density adjustments
- Typography weight and size specifics within the "bold hierarchy" direction
- How to adapt for Hebrew RTL

### Deferred Ideas (OUT OF SCOPE)
- Any new business logic or data schema changes
- New tabs or new fields beyond what's already in the app
- i18n / translation layer
- Mobile-specific layout overhauls
</user_constraints>

---

## Summary

Phase 21 is a pure visual restyling phase. The data model, business logic, tabs, and tab count are all locked. The work is: (1) replace the existing `DetailPageHeader` gradient strip with a bolder, entity-colored profile zone that makes the name and key facts unmistakable at a glance, (2) restyle the `TabsList`/`TabsTrigger` inside each detail page so the active tab is visually dominant rather than a hairline underline, and (3) restructure the three main forms (TeacherForm, StudentForm, OrchestraForm) so they read as intentionally sectioned documents rather than flat field stacks.

The design system is fully in place from Phases 16-20: entity color tokens (`--color-students-*`, `--color-teachers-*`, `--color-orchestras-*`), the `Card` primitive with `shadow-1`/`shadow-2`, `AvatarInitials`, `StatsCard`, `ListPageHero`, and the Framer Motion entrance pattern. Phase 21 must consume these tokens consistently — it does not add new tokens or new npm packages.

The highest-risk area is the `DetailPageHeader` component, which is shared by all three detail pages (Teacher, Student, Orchestra) and currently renders a generic `bg-gradient-to-l from-primary to-accent` strip that ignores entity identity. Replacing it with an entity-aware header is the central task of sub-phase 21-01. The forms in 21-02 are independent files and can be restyled in isolation without risk to each other.

**Primary recommendation:** Extend `DetailPageHeader` to accept an `entityColor` prop (same type as `ListPageHero`), then apply the entity pastel to the header background and a `DetailMetaBar` below it — entity-colored bg, white or entity-fg text for name, secondary metadata in muted row. For tabs, override `TabsList`/`TabsTrigger` locally with stronger active-state classes rather than touching the global `tabs.tsx` primitive.

---

## Standard Stack

### Core (all already installed — no new packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS v3 | 3.x | Utility classes, entity color tokens via CSS vars | Project-wide, token layer complete |
| Framer Motion | v10 | Tab content fade (already `AnimatePresence mode="wait"`) | Phase 17 decision — entrance only, CSS handles exit |
| Radix UI Tabs | via `@radix-ui/react-tabs` | Accessible tab primitive (`data-[state=active]` selector) | Already in `tabs.tsx` |
| `clsx` / `cn` | — | Class merging | Project standard |
| `AvatarInitials` | domain | Initials avatar with entity color | Already in `DetailPageHeader` |
| `getAvatarColorClasses` | `utils/avatarColorHash` | Deterministic color from name | Already used in `DetailPageHeader` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Card` primitive | local | Section containers inside tab content, form sections | Whenever a visual container is needed |
| `StatsCard` | local | Key-metric chips in profile header | If detail page profile shows key stats |
| `Button` primitive | local shadcn | Action buttons | Form submit, edit actions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending `DetailPageHeader` | Creating per-entity header components | One shared component is easier to maintain; entity variant via prop is sufficient given only 3 entities |
| Local tab style overrides | Editing global `tabs.tsx` | Global change risks all usages; local classname overrides keep blast radius to detail pages only |
| CSS section dividers in forms | Background-strip section headers | Both work; divider approach is simpler for RTL, background-strip approach is more visually prominent — see pitfall below |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

No new files needed for 21-01 (extend existing components). 21-02 touches three form files.

```
src/
├── components/
│   └── domain/
│       └── DetailPageHeader.tsx      ← add entityColor prop, entity-aware header zone
├── features/
│   ├── teachers/details/components/
│   │   ├── TeacherDetailsPage.tsx    ← pass entityColor="teachers" to DetailPageHeader
│   │   └── tabs/                    ← tab content sections may get internal visual sections
│   ├── students/details/components/
│   │   ├── StudentDetailsPage.tsx    ← pass entityColor="students"; also uses StudentDetailsHeader.tsx (legacy, may retire)
│   │   └── tabs/
│   └── orchestras/details/components/
│       └── OrchestraDetailsPage.tsx  ← pass entityColor="orchestras"
├── components/
│   ├── TeacherForm.tsx               ← restructure into visual sections (21-02)
│   ├── StudentForm.tsx               ← restructure into visual sections (21-02)
│   └── OrchestraForm.tsx             ← restructure into visual sections (21-02)
```

### Pattern 1: Entity-Aware Detail Page Header

**What:** `DetailPageHeader` currently renders `bg-gradient-to-l from-primary to-accent` (generic coral gradient). Replace with entity-colored pastel zone matching `ListPageHero` — same entity tokens, different layout (portrait vs. landscape).

**When to use:** All three detail pages.

**Current code (to replace):**
```tsx
// src/components/domain/DetailPageHeader.tsx — current
<div className="bg-gradient-to-l from-primary to-accent rounded-xl p-6 text-white">
```

**Target pattern:**
```tsx
// Proposed: entity-colored pastel header (matches ListPageHero ENTITY_STYLES)
const ENTITY_DETAIL_STYLES = {
  teachers:   { headerBg: 'bg-teachers-bg',   nameFg: 'text-teachers-fg',   metaBg: 'bg-teachers-fg/8',  border: 'border-teachers-fg/15' },
  students:   { headerBg: 'bg-students-bg',   nameFg: 'text-students-fg',   metaBg: 'bg-students-fg/8',  border: 'border-students-fg/15' },
  orchestras: { headerBg: 'bg-orchestras-bg', nameFg: 'text-orchestras-fg', metaBg: 'bg-orchestras-fg/8', border: 'border-orchestras-fg/15' },
} as const

// Header zone layout:
// [avatar] [name h1 bold] [badges row]
// [secondary meta row: phone / instrument / last updated]
```

**Key change:** Entity-colored pastel background (not white, not gradient) + entity-fg color for name. Avatar uses entity pastel bg with entity fg text instead of `getAvatarColorClasses`. Secondary metadata row uses muted text on the pastel background.

**Prop change:**
```tsx
interface DetailPageHeaderProps {
  // existing props...
  entityColor?: 'teachers' | 'students' | 'orchestras'  // NEW — optional, falls back to generic gradient
}
```

### Pattern 2: Tab Navigation Restyle (Underline → Pill / Strong Active)

**What:** Current `TabsList` in detail pages is `rounded-none border-b bg-white h-auto px-6`. The `TabsTrigger` uses shadcn default which gives a thin underline-like active state (`data-[state=active]:bg-background data-[state=active]:shadow-1`). This is visually weak.

**Target:** Active tab gets entity-colored pill/background fill (like the sidebar active state uses `bg-sidebar-active-bg`). Inactive tabs are muted gray text. The active tab trigger should be unmistakable.

**Pattern — override classes locally on the detail page tabs (do NOT edit global `tabs.tsx`):**

```tsx
// In TeacherDetailsPage.tsx — override TabsList + TabsTrigger via className
<TabsList className="sticky top-0 z-10 w-full justify-start rounded-none border-b bg-white h-auto px-6 overflow-x-auto">
  <TabsTrigger
    value="personal"
    className="gap-2 inline-flex items-center text-muted-foreground
               data-[state=active]:text-teachers-fg
               data-[state=active]:bg-teachers-bg
               data-[state=active]:shadow-none
               rounded-lg px-4 py-2 text-sm font-medium"
  >
```

**Entity color mapping for active tabs:**
- Teachers → `data-[state=active]:text-teachers-fg data-[state=active]:bg-teachers-bg`
- Students → `data-[state=active]:text-students-fg data-[state=active]:bg-students-bg`
- Orchestras → `data-[state=active]:text-orchestras-fg data-[state=active]:bg-orchestras-bg`

**This mirrors the sidebar active pill pattern from Phase 18-02** (background fill only, no border, no shadow on active trigger — reference: `--sidebar-active-bg` decision from STATE.md).

### Pattern 3: Tab Content Section Headers (Detail Page Tabs)

**What:** Inside tab content panes (e.g., `PersonalInfoTab`), data is currently displayed in labeled value pairs with minimal visual structure. To give stronger visual hierarchy, wrap logical data groups in a styled section header.

**Pattern:**
```tsx
// Section header inside tab content — NOT a Card wrapper, just a visual divider
<div className="mb-6">
  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 pb-2 border-b border-border">
    פרטים אישיים
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* fields */}
  </div>
</div>
```

**Note:** This is scoped to tab content panes, NOT to the form files (forms get their own treatment in 21-02).

### Pattern 4: Form Visual Section Grouping (21-02)

**What:** The three forms (`TeacherForm`, `StudentForm`, `OrchestraForm`) currently use `<section>` tags with a gray `text-lg font-semibold` heading and a plain `<div className="grid ...">` below. This creates little visual distinction between sections. The target is bolder section titles + a visual separator so sections feel like blocks.

**Two options for section separation:**

Option A — Left border accent strip (simpler for RTL):
```tsx
<div className="mb-8">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-1 h-6 bg-teachers-fg rounded-full" />    {/* entity accent bar */}
    <h3 className="text-base font-semibold text-foreground">מידע אישי</h3>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* fields */}
  </div>
</div>
```

Option B — Section background strip:
```tsx
<div className="mb-8">
  <div className="bg-muted/50 rounded-lg px-4 py-2 mb-4">
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">מידע אישי</h3>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* fields */}
  </div>
</div>
```

**Recommendation:** Option A (left border accent strip). In RTL, the visual accent bar reads as a leading marker even in Hebrew direction — it sits on the right side of the heading in RTL layouts via `dir="rtl"`. Option B is visually heavier and risks competing with form field focus states.

**Important RTL note:** The `w-1` accent strip must be placed in the DOM before the heading so it renders on the right in RTL (`flex-row-reverse` is NOT needed — RTL flex already reverses). In RTL flex, the first DOM child appears on the right. So `[accent bar DOM first] [heading DOM second]` → renders as `heading | accent bar` left-to-right = `accent bar | heading` right-to-left. This is correct.

Wait — RTL flex: `flex-row` in RTL means items start from the right. First DOM child → rightmost in visual. So accent strip (first) renders rightmost. Hebrew heading (second) renders to its left. That is correct for RTL reading — the accent is at the visual start of the line in Hebrew.

### Pattern 5: DetailPageHeader Profile Stats Bar (optional, 21-01)

The `StudentDetailsHeader.tsx` (student-specific, not the shared `DetailPageHeader`) already has a stats bar below the profile zone with 4 metrics (instruments, teachers, orchestras, attendance). This pattern is good and should be preserved or enhanced, not removed. For teacher: key stats could be student count, orchestra count, hours. For orchestra: member count.

This stats bar should use the same `StatsCard` or mini-metric approach from `ListPageHero`, but inline/horizontal rather than a grid.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab accessibility | Custom tab aria logic | Radix `TabsPrimitive` (already in place) | Keyboard nav, aria-selected, focus management all handled |
| Avatar color assignment | Random color generation | `getAvatarColorClasses(displayName)` (already in DetailPageHeader) | Deterministic, consistent |
| Entity color lookup | String interpolation `bg-${entity}-bg` | `ENTITY_DETAIL_STYLES` static const (same as `ENTITY_STYLES` in ListPageHero) | Tailwind tree-shake safety — dynamic class names get purged |
| Animation | Custom CSS transitions | Framer Motion `AnimatePresence mode="wait"` (already wired) | Phase 17 pattern, already in all detail pages |
| Form field components | Custom inputs | `FormField`, `Input`, `Select`, `Label` from `src/components/ui/` | Already used in OrchestraForm, consistent design |

**Key insight:** The ENTITY_STYLES static const pattern from ListPageHero (Phase 20-01 decision) is MANDATORY here too. Never write `bg-${entityColor}-bg` as a string interpolation — Tailwind will tree-shake it. Always use a static object lookup.

---

## Common Pitfalls

### Pitfall 1: Dynamic Tailwind Class Generation (Tree-Shake)
**What goes wrong:** Writing `bg-${entityColor}-bg` or `` `text-${entity}-fg` `` produces class names Tailwind does not see at build time → classes get purged → entity colors don't appear in production.
**Why it happens:** Tailwind scans files for complete class strings. String interpolation generates class names only at runtime.
**How to avoid:** Always use a static object: `const STYLES = { teachers: { bg: 'bg-teachers-bg' }, ... }` then `STYLES[entityColor].bg`.
**Warning signs:** Colors appear in dev (Tailwind JIT) but disappear in production build.

### Pitfall 2: Global `tabs.tsx` Edits Break All Tab Usages
**What goes wrong:** If `TabsTrigger` base classes in `tabs.tsx` are changed to add active state styling, every Tabs usage in the app (bagrut, theory lessons, other UI) gets the new styling whether intended or not.
**Why it happens:** `tabs.tsx` is a global primitive consumed everywhere.
**How to avoid:** Add entity-specific active state classes via `className` prop override at the call site (TeacherDetailsPage, StudentDetailsPage, OrchestraDetailsPage). The shadcn `cn()` merger handles this correctly.
**Warning signs:** Tabs in modal dialogs or other pages start showing unexpected colored backgrounds.

### Pitfall 3: StudentDetailsHeader.tsx vs. DetailPageHeader.tsx Confusion
**What goes wrong:** `StudentDetailsPage.tsx` uses the shared `DetailPageHeader` (from `@/components/domain`), but an older `StudentDetailsHeader.tsx` also exists in the same folder with a more detailed gradient header. If both are active simultaneously, the student page has double headers.
**Why it happens:** `StudentDetailsHeader.tsx` is a legacy component — the current `StudentDetailsPage.tsx` imports and uses `DetailPageHeader` (verified in the file), not `StudentDetailsHeader`.
**How to avoid:** Only restyle `DetailPageHeader`. The `StudentDetailsHeader.tsx` is unused by the current page but still exists in the file system — do not modify it; do not import it.
**Warning signs:** Student detail page shows two avatar zones or two name headings.

### Pitfall 4: RTL Direction for Entity Accent Bar
**What goes wrong:** Adding a left-border accent strip to form section headers looks wrong in RTL because "left" in RTL is the END of the line, not the start.
**Why it happens:** RTL layout flips horizontal directions. A `border-l-2` accent appears at the trailing edge of the heading in Hebrew, which is visually awkward.
**How to avoid:** Use `border-s-2` (CSS logical property for border-inline-start) instead of `border-l-2`. `border-s` maps to `right` in RTL and `left` in LTR. Tailwind v3 supports `border-s-*` and `border-e-*` logical property utilities.
**Warning signs:** Section accent bars appear on the wrong side of section headings.

### Pitfall 5: OrchestraForm Uses Dialog Modal — MaxHeight Constraint
**What goes wrong:** `OrchestraForm` renders inside a `fixed inset-0` modal overlay with `max-h-[90vh] overflow-y-auto`. Adding more visual padding to section headers within the form could make the form taller than 90vh, causing important fields to be cut off or requiring excessive scrolling.
**Why it happens:** Modal forms have viewport height constraints.
**How to avoid:** Keep section header padding compact (py-2 not py-6). Section headers are visual markers, not full-height banners. Verify that the form still fits comfortably at 90vh after adding section headers.
**Warning signs:** Save button scrolls below fold on typical laptop screens.

### Pitfall 6: TeacherForm Uses Custom State Management (Not React Hook Form)
**What goes wrong:** `TeacherForm.tsx` uses raw `useState` + `setFormData` rather than React Hook Form. Changes to the visual structure must not accidentally break the `handleInputChange` path-based setter (e.g., `handleInputChange('personalInfo.firstName', value)`).
**Why it happens:** TeacherForm was built before the project adopted RHF in other forms.
**How to avoid:** In 21-02, restructure the JSX layout only. Do not change state management, handler functions, or validation logic. Touch only the `return` JSX section.
**Warning signs:** Field changes in the form stop updating state (no visual feedback in inputs).

---

## Code Examples

Verified patterns from existing codebase:

### Entity Color Static Lookup (from ListPageHero — confirmed HIGH confidence)
```tsx
// src/components/ui/ListPageHero.tsx
const ENTITY_STYLES = {
  teachers: { bg: 'bg-teachers-bg', fg: 'text-teachers-fg', btnBg: 'bg-teachers-fg' },
  students: { bg: 'bg-students-bg', fg: 'text-students-fg', btnBg: 'bg-students-fg' },
  orchestras: { bg: 'bg-orchestras-bg', fg: 'text-orchestras-fg', btnBg: 'bg-orchestras-fg' },
} as const
```

Mirror this pattern in `DetailPageHeader` for the entity-aware header.

### Tab Override Pattern (confirmed from existing TeacherDetailsPage)
```tsx
// Current in TeacherDetailsPage — TabsList already has custom classes via className:
<TabsList className="sticky top-0 z-10 w-full justify-start rounded-none border-b bg-white h-auto px-6 overflow-x-auto">
  <TabsTrigger value="personal" className="gap-2 inline-flex items-center">

// Target — add active state override on trigger:
<TabsTrigger
  value="personal"
  className="gap-2 inline-flex items-center
             data-[state=active]:bg-teachers-bg
             data-[state=active]:text-teachers-fg
             data-[state=active]:shadow-none
             rounded-lg px-3 py-1.5"
>
```

### CSS Logical Properties for RTL (border-s instead of border-l)
```tsx
// Form section header accent — RTL safe
<div className="border-s-2 border-teachers-fg ps-3">
  <h3 className="text-sm font-semibold text-foreground">מידע אישי</h3>
</div>
```
`border-s-2` = `border-inline-start-width: 2px` → renders on the right side in RTL.
`ps-3` = `padding-inline-start: 0.75rem` → padding on the start side (right in RTL).

### AvatarInitials with Entity Color (already in DetailPageHeader — confirmed)
```tsx
// src/components/domain/DetailPageHeader.tsx
const avatarColor = getAvatarColorClasses(displayName)
<AvatarInitials
  firstName={firstName}
  lastName={lastName}
  size="xl"
  colorClassName={`${avatarColor.bg} ${avatarColor.text}`}
/>
```

For entity-aware variant, the avatar can instead use entity tokens:
```tsx
// Entity-colored avatar (when entityColor is provided)
const entityAvatarClass = entityColor === 'teachers'   ? 'bg-teachers-bg text-teachers-fg' :
                          entityColor === 'students'   ? 'bg-students-bg text-students-fg' :
                          entityColor === 'orchestras' ? 'bg-orchestras-bg text-orchestras-fg' :
                          `${avatarColor.bg} ${avatarColor.text}`  // fallback
```

### OrchestraForm Already Uses New UI Components (confirmed)
`OrchestraForm.tsx` already imports `FormField`, `Input`, `Select`, `Button` from `@/components/ui/`. Section restructuring in 21-02 should keep these components and just add visual section wrapper divs around them.

`TeacherForm.tsx` and `StudentForm.tsx` use raw HTML inputs (`<input className="w-full px-3 py-2 border ...">`) — section restructuring in 21-02 only adds wrapper divs and section headers, does NOT need to upgrade these to shadcn inputs (that would be scope creep beyond what's asked).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic coral gradient header | Entity-colored pastel header | Phase 21 | Each detail page feels owned by its entity, consistent with list pages |
| Tab underline active state | Pill fill active state | Phase 21 | Active tab unmistakable at a glance |
| Flat field stacks in forms | Sectioned forms with accent markers | Phase 21 | Visual hierarchy guides the user through multi-section forms |

**Deprecated/outdated:**
- `StudentDetailsHeader.tsx`: Legacy custom gradient header for the student page. Not used by current `StudentDetailsPage.tsx` (which uses the shared `DetailPageHeader`). Leave it in place but do not reference it in Phase 21.
- Generic `bg-gradient-to-l from-primary to-accent` in DetailPageHeader: Replace with entity-colored pastel in Phase 21-01.

---

## Open Questions

1. **Should the `DetailPageHeader` include a mini stats bar below the entity header?**
   - What we know: `StudentDetailsHeader.tsx` (legacy, unused) had a stats bar with 4 metrics. The current shared `DetailPageHeader` has a `children` slot below the gradient strip but nothing populates it on teacher or orchestra pages.
   - What's unclear: Whether the success criteria requires a stats bar on all entity pages, or just bolder name + badges treatment.
   - Recommendation: Start without a stats bar — the success criteria says "stronger visual hierarchy" not "more data in header." If the result still feels thin, add 2-3 mini stat chips to the `children` slot in the detail page (not in `DetailPageHeader` itself).

2. **Does `StudentDetailsPage.tsx` need to be consolidated with the legacy `StudentDetailsHeader.tsx`?**
   - What we know: Current `StudentDetailsPage.tsx` imports `DetailPageHeader` (shared), not `StudentDetailsHeader`. `StudentDetailsHeader.tsx` is unused but still in the file system.
   - Recommendation: Don't touch it. Ignore the legacy file — it's dead code, safe to leave.

3. **TeacherForm tab structure: The form is rendered inside a Dialog/Modal (via `AddTeacherModal.tsx`) or inline?**
   - What we know: `TeacherForm.tsx` accepts `onCancel` and renders `<Card padding="lg">` — it's consumed inside a modal overlay (`AddTeacherModal.tsx`). The form itself doesn't manage its own modal wrapping.
   - What's unclear: Whether the form needs a height constraint (like OrchestraForm's `max-h-[90vh]`) or if the parent modal handles that.
   - Recommendation: Check `AddTeacherModal.tsx` in the plan phase and ensure section headers don't push content below the visible modal area.

---

## Scope Inventory: Files to Touch

### 21-01: Detail Page Headers and Tabs (3-5 files)
| File | Change | Risk |
|------|--------|------|
| `src/components/domain/DetailPageHeader.tsx` | Add `entityColor` prop + ENTITY_DETAIL_STYLES lookup, replace generic gradient with entity-colored bg | LOW — only this component, 3 consumers |
| `src/features/teachers/details/components/TeacherDetailsPage.tsx` | Pass `entityColor="teachers"`, add entity active-state classes to TabsTrigger | LOW — isolated file |
| `src/features/students/details/components/StudentDetailsPage.tsx` | Pass `entityColor="students"`, add entity active-state classes to TabsTrigger | LOW — isolated file |
| `src/features/orchestras/details/components/OrchestraDetailsPage.tsx` | Pass `entityColor="orchestras"`, add entity active-state classes to TabsTrigger | LOW — isolated file |

### 21-02: Form Restructuring (3 files)
| File | Change | Risk |
|------|--------|------|
| `src/components/TeacherForm.tsx` | Add section headers with border-s accent + visual grouping to JSX return; no logic changes | LOW — pure JSX restructure |
| `src/components/StudentForm.tsx` | Same — add section headers to JSX return | LOW — pure JSX restructure |
| `src/components/OrchestraForm.tsx` | Same — already uses shadcn inputs; add section headers | LOW — OrchestraForm already has best structure of the three |

**Total scope: 7 files. No new components. No new API calls. No new packages.**

---

## Sources

### Primary (HIGH confidence)
- Codebase direct read: `src/components/domain/DetailPageHeader.tsx` — confirmed current gradient, avatar, breadcrumb structure
- Codebase direct read: `src/components/ui/ListPageHero.tsx` — confirmed ENTITY_STYLES static const pattern
- Codebase direct read: `src/components/ui/tabs.tsx` — confirmed `data-[state=active]:bg-background data-[state=active]:shadow-1` base, overridable via className
- Codebase direct read: `src/index.css` — confirmed entity color CSS var definitions
- Codebase direct read: `tailwind.config.js` — confirmed `students.bg`, `teachers.bg`, `orchestras.bg` token names
- Codebase direct read: `src/features/teachers/details/components/TeacherDetailsPage.tsx` — confirmed existing Tab override pattern
- Codebase direct read: `src/features/students/details/components/StudentDetailsPage.tsx` — confirmed `DetailPageHeader` import (not legacy `StudentDetailsHeader`)
- Codebase direct read: `src/features/orchestras/details/components/OrchestraDetailsPage.tsx` — confirmed Tab structure
- Codebase direct read: `src/components/TeacherForm.tsx`, `StudentForm.tsx`, `OrchestraForm.tsx` — confirmed form section structure and state management patterns
- STATE.md decisions: `[18-02]` active nav pill no border; `[20-01]` ENTITY_STYLES static const; `[17-02]` Framer Motion exit pattern
- CONTEXT.md: Locked decisions for Phase 21

### Secondary (MEDIUM confidence)
- Tailwind v3 docs (CSS logical properties): `border-s-*`, `ps-*` are Tailwind v3 utilities for RTL-safe inline-start styling. Verified as Tailwind v3 feature.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use, no new packages
- Architecture: HIGH — patterns verified directly from existing codebase files
- Pitfalls: HIGH (Tailwind tree-shake, RTL border-s) — verified from Phase 20 decisions and Tailwind v3 docs; MEDIUM (TeacherForm state management break risk) — pattern verified from code read

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (stable — no external dependencies changing)
