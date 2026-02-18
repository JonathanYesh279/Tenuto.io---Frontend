# Phase 15: Tech Debt Sweep — Research

**Researched:** 2026-02-18
**Domain:** React component cleanup, design token migration, RTL logical properties
**Confidence:** HIGH — all findings verified directly from source files

---

## Summary

Phase 15 targets four specific tech-debt items identified in the v2.0 milestone audit. Research
confirms that two of the four items are **already partially or fully resolved** by prior phases,
while two still need implementation work. The planner must account for these discrepancies between
the audit document and the current code state.

**Item SC1 (AuditTrail ErrorState):** Confirmed unresolved. AuditTrail.tsx has a hand-rolled inline
error UI (red div with AlertTriangle and retry button). The `ErrorState` component exists and is
API-compatible but is not imported. This is a straightforward swap of roughly 15 lines.

**Item SC2 (Dashboard Weekly Summary colors):** Already resolved in commit `b159cc3` (Phase 12-02
fix, 2026-02-18 14:18). The Schedule tab Weekly Summary already uses `bg-primary/10`, `bg-muted/50`,
`text-muted-foreground`, `text-foreground/80`. The audit listed this as tech debt despite the fix
already existing. The planner should mark SC2 as a verification task, not an implementation task.

**Item SC3 (InstrumentBadge):** Confirmed orphaned. `domain/InstrumentBadge.tsx` exports a
`<Badge variant="secondary">` wrapper. No list page imports it. Two options: wire it to the
`specialization` column in Teachers.tsx and the `instrument` column in Students.tsx, or delete the
file and remove the export from `domain/index.ts`.

**Item SC4 (RTL logical padding):** Partially resolved. Phase 07 removed the physical
`padding-left`/`padding-right` CSS rules from `.mobile-tab-nav nav` in `tab-navigation-fix.css`.
However, the `.mobile-tab-nav` class name is still used in JSX on both `TeacherTabNavigation.tsx`
and `StudentTabNavigation.tsx`, and the `<nav>` inside uses `px-4` Tailwind (physical symmetric).
The success criterion calls for `ps-`/`pe-` logical properties, which requires swapping `px-4`
to `ps-4 pe-4` in the `<nav>` elements of both files.

**Primary recommendation:** Four sub-tasks — verify SC2 (1 line grep check), fix SC1 (import swap),
decide SC3 (wire or delete), fix SC4 (2 `px-4` → `ps-4 pe-4` swaps).

---

## Standard Stack

### Core

No new libraries needed. All tools already installed.

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| ErrorState | local `src/components/feedback/ErrorState.tsx` | Network error UI with retry | Already used by Teachers, Students, Orchestras, Rehearsals |
| domain/StatusBadge | local `src/components/domain/StatusBadge.tsx` | Hebrew status labels via shadcn Badge | Already migrated to 4 list pages in Phase 14 |
| domain/InstrumentBadge | local `src/components/domain/InstrumentBadge.tsx` | Instrument name display via shadcn Badge | Orphaned — decision needed |
| Tailwind logical properties | v3 (installed) | `ps-`/`pe-` replace `pl-`/`pr-` | App is always RTL; logical props are direction-aware |

### No New Installations

```bash
# No packages to install — all tech exists in the codebase
```

---

## Architecture Patterns

### Recommended Project Structure

No structural changes. All edits are within existing files.

```
src/
├── pages/AuditTrail.tsx          # SC1: swap inline error for ErrorState
├── pages/Dashboard.tsx           # SC2: verify already clean (no edit expected)
├── components/domain/
│   ├── InstrumentBadge.tsx       # SC3: keep as-is OR delete
│   └── index.ts                  # SC3: remove export if deleting
├── features/students/details/components/StudentTabNavigation.tsx  # SC4: px-4 → ps-4 pe-4
└── features/teachers/details/components/TeacherTabNavigation.tsx  # SC4: px-4 → ps-4 pe-4
```

### Pattern 1: ErrorState Replacement

**What:** Replace AuditTrail's inline error div with the `ErrorState` component.

**Current inline code (AuditTrail.tsx lines 232-246):**
```tsx
{error && (
  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
    <div className="flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-red-600" />
      <p className="text-red-800">{error}</p>
    </div>
    <button
      onClick={handleRetry}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      נסה שוב
    </button>
  </div>
)}
```

**Target replacement (matching Rehearsals.tsx pattern):**
```tsx
import { ErrorState } from '../components/feedback/ErrorState'

{error && (
  <ErrorState
    message={error}
    onRetry={handleRetry}
  />
)}
```

**Unused imports to clean up after swap:** `AlertTriangle`, `RefreshCw` (both from lucide-react).
Verify these icons are not used elsewhere in AuditTrail.tsx before removing.

`ErrorState` interface:
```typescript
// src/components/feedback/ErrorState.tsx
interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}
```

### Pattern 2: Design Token Verification (SC2)

**What:** Verify the Dashboard Schedule tab Weekly Summary already uses tokens.

**Current state (Dashboard.tsx lines 507-527):**
```tsx
<div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">  // row 1 ✓
<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">    // row 2 ✓
<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">    // row 3 ✓
```

All three rows use design tokens. The audit note was stale — fixed in commit `b159cc3` on 2026-02-18
at 14:18, before the audit was written at 15:26. **No code change needed for SC2.**

Residual `text-gray-700` exists in the Hours tab table headers (lines 652-657) but this is OUTSIDE
the success criterion scope (which specifies "Weekly Summary" only).

### Pattern 3: InstrumentBadge — Wire or Remove

**What:** Decide whether to wire `InstrumentBadge` to list pages or remove it.

**Option A — Wire to Teachers.tsx and Students.tsx:**
```tsx
// Teachers.tsx — in the columns definition
import { InstrumentBadge } from '../components/domain'

{ key: 'specialization', header: 'התמחות',
  render: (row: any) => <InstrumentBadge instrument={row.specialization} /> }

// Students.tsx — in the columns definition
{ key: 'instrument', header: 'כלי נגינה',
  render: (student: any) => student.instrument
    ? <InstrumentBadge instrument={student.instrument} />
    : <span className="text-muted-foreground">—</span> }
```

**Option B — Remove as dead code:**
```bash
# Delete: src/components/domain/InstrumentBadge.tsx
# Edit: src/components/domain/index.ts — remove InstrumentBadge export line
# DesignSystem.tsx references it but DesignSystem.tsx is a showcase/demo file, not production code
```

**Recommendation:** Wire it. The component is 15 lines and already correct. Wiring makes instrument
names visually distinct (styled badge) vs plain text, which improves scannability. Two callsites
(Teachers, Students) are the natural home. The DesignSystem.tsx reference remains valid either way
since it's already importing from `domain/index.ts`.

Note from prior decision [08-01]: "DesignSystem.tsx StatusBadge/InstrumentBadge left untouched —
Phase 10 handles callsite migration." This confirms the design system file is intentionally separate
and should not be modified.

### Pattern 4: Logical Padding Properties

**What:** Replace `px-4` with `ps-4 pe-4` in the mobile `<nav>` of both tab navigation components.

**Why `ps-`/`pe-` over `px-`:**
- `px-N` = physical: always applies `padding-left` + `padding-right` regardless of direction
- `ps-N` = logical: applies `padding-inline-start` (right side in RTL)
- `pe-N` = logical: applies `padding-inline-end` (left side in RTL)
- Since the app is always RTL (`dir="rtl"` on `<html>`), `ps-4` = padding-right and `pe-4` = padding-left
- Using logical props is the standard the codebase adopted in Phase 06 (per GOTCHA in the plan)

**Files affected (identical pattern in both):**
```
StudentTabNavigation.tsx line 79:
  <nav className="flex gap-3 px-4 py-3 min-w-max" ...>
  →
  <nav className="flex gap-3 ps-4 pe-4 py-3 min-w-max" ...>

TeacherTabNavigation.tsx line 76:
  <nav className="flex gap-3 px-4 py-3 min-w-max" ...>
  →
  <nav className="flex gap-3 ps-4 pe-4 py-3 min-w-max" ...>
```

Also on the button elements inside (line 90 in Student, line 87 in Teacher), `px-4` is symmetric
and applies to individual button padding — this is acceptable to leave as `px-4` since button
content is centered and symmetric. The nav container padding is the directional concern.

### Anti-Patterns to Avoid

- **Don't swap the wrong StatusBadge:** `PresentationTracker.tsx` still imports `StatusBadge` from
  `../ui/Table` — this was explicitly deferred in Phase 14-02. Do not touch it in Phase 15.
- **Don't remove AlertTriangle import prematurely:** Verify AuditTrail.tsx line-by-line; the icon
  might be used in other places within the file before removing the import.
- **Don't change Dashboard.tsx lines 652-657 (Hours tab `text-gray-700`):** These are outside SC2
  scope. They are in a table header, not the Weekly Summary, and fixing them is beyond Phase 15.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AuditTrail error display | Custom red div with AlertTriangle | `ErrorState` from `feedback/` | Already used on 4 pages; consistent design |
| Instrument badge display | `<span className="...">` inline style | `InstrumentBadge` from `domain/` | Leverages shadcn Badge with `variant="secondary"` |

**Key insight:** All needed components already exist. This phase is pure wiring, not building.

---

## Common Pitfalls

### Pitfall 1: Stale Audit Findings

**What goes wrong:** The v2.0-MILESTONE-AUDIT.md lists SC2 (Dashboard colors) as tech debt, but
the fix already landed in `b159cc3` before the audit was committed.
**Why it happens:** The audit was likely written before the fix was merged, or was based on a
snapshot that didn't include the 12-02 commit.
**How to avoid:** Always read the actual source file rather than trusting the audit document for
current state.
**Warning signs:** Running `grep` for `bg-purple-50` in Dashboard.tsx returns 0 results — the fix
is already in place.

### Pitfall 2: Wrong AuditTrail Retry Function Name

**What goes wrong:** The `ErrorState` component passes `onRetry` callback, but AuditTrail already
has a `handleRetry` function defined at line 144. These should be wired: `onRetry={handleRetry}`.
**Why it happens:** Different naming conventions between the inline error code (onClick={handleRetry})
and the component prop (onRetry).
**How to avoid:** Check the `handleRetry` function — it correctly dispatches to `loadAuditLog()` or
`loadPastActivities()` based on `activeTab`. Pass it directly: `onRetry={handleRetry}`.

### Pitfall 3: InstrumentBadge import path

**What goes wrong:** Importing from the wrong location.
**The correct barrel:** `import { InstrumentBadge } from '../components/domain'` (from pages)
or `import { InstrumentBadge } from '@/components/domain'` (if path alias configured).
**Why it matters:** The component uses `@/components/ui/badge` internally via the path alias.
Check `tsconfig.json` for the `@` alias target before assuming import paths.

### Pitfall 4: `px-4` vs `ps-4 pe-4` visual identity

**What goes wrong:** Since the app is always RTL, `px-4` and `ps-4 pe-4` produce the same visual
output — tests won't catch the difference.
**Why it matters:** The change is semantic/correctness, not visual. The standard established in
Phase 06 requires logical properties for all directional padding.
**How to verify:** After change, confirm `px-4` is replaced with `ps-4 pe-4` on the `<nav>` elements
(not the buttons inside). Grep for the change.

---

## Code Examples

### AuditTrail ErrorState Import and Usage

```tsx
// Source: src/components/feedback/ErrorState.tsx (verified)
// Import at top of AuditTrail.tsx
import { ErrorState } from '../components/feedback/ErrorState'

// Replace lines 232-246 with:
{error && (
  <ErrorState
    message={error}
    onRetry={handleRetry}
  />
)}

// handleRetry already exists at line 144:
const handleRetry = () => {
  if (activeTab === 'deletion-log') {
    loadAuditLog()
  } else {
    loadPastActivities()
  }
}
```

### InstrumentBadge Wire Pattern (Teachers.tsx)

```tsx
// Source: src/components/domain/InstrumentBadge.tsx (verified)
// Add to imports at top of Teachers.tsx
import { InstrumentBadge } from '../components/domain'

// Update columns definition (currently line 414):
{
  key: 'specialization',
  header: 'התמחות',
  render: (row: any) => row.specialization && row.specialization !== 'לא צוין'
    ? <InstrumentBadge instrument={row.specialization} />
    : <span className="text-muted-foreground">לא צוין</span>
}
```

### Logical Padding Fix

```tsx
// Source: verified in both TabNavigation files
// StudentTabNavigation.tsx line 79 (and TeacherTabNavigation.tsx line 76)
// Before:
<nav className="flex gap-3 px-4 py-3 min-w-max" aria-label="Tabs" style={{width: 'max-content'}}>
// After:
<nav className="flex gap-3 ps-4 pe-4 py-3 min-w-max" aria-label="Tabs" style={{width: 'max-content'}}>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Physical `padding-left`/`padding-right` in `.mobile-tab-nav nav` CSS | Logical `ps-`/`pe-` Tailwind on `<nav>` element | CSS removed Phase 07; JSX needs update in Phase 15 | Semantic correctness for RTL |
| Inline error HTML in AuditTrail | `ErrorState` component | Phase 08 pattern; AuditTrail missed | Consistent error UX |
| `bg-purple-50`, `text-purple-600` in Dashboard Weekly Summary | `bg-primary/10`, `bg-muted/50`, design tokens | Fixed in commit `b159cc3` Phase 12-02 | Already resolved |

---

## Open Questions

1. **InstrumentBadge: wire or remove?**
   - What we know: Component is 15 lines, uses `Badge variant="secondary"`, wires cleanly to instrument columns
   - What's unclear: The phase success criterion says "wired OR removed" — no user preference recorded
   - Recommendation: Wire to Teachers.tsx `specialization` column and Students.tsx `instrument` column. This resolves the orphan while adding value (visual distinction).

2. **AuditTrail unused imports after swap**
   - What we know: AuditTrail imports `AlertTriangle` and `RefreshCw` for the inline error UI
   - What's unclear: Whether these icons are used elsewhere in AuditTrail.tsx
   - Recommendation: Grep the file for `AlertTriangle` and `RefreshCw` usage before removing imports. If no other uses, remove to keep imports clean. TypeScript `--noEmit` will catch unused imports anyway.

3. **Dashboard SC2 verification**
   - What we know: The fix is in the source file (verified by reading lines 507-527)
   - What's unclear: Whether the planner treats this as "done" or "verify and document"
   - Recommendation: The plan task for SC2 should be: "Run `grep -n 'bg-purple-50\|text-purple-600\|bg-green-50' src/pages/Dashboard.tsx`" to confirm 0 results, then mark complete. No code change.

---

## Affected Files Summary

| File | SC | Change Type | Lines |
|------|----|-------------|-------|
| `src/pages/AuditTrail.tsx` | SC1 | Replace inline error with `ErrorState`; remove unused imports | 232-246, imports |
| `src/pages/Dashboard.tsx` | SC2 | No change — already clean | — |
| `src/components/domain/InstrumentBadge.tsx` | SC3 | No change (keep file) | — |
| `src/components/domain/index.ts` | SC3 | No change (keep export) | — |
| `src/pages/Teachers.tsx` | SC3 | Add InstrumentBadge render to specialization column | ~414 |
| `src/pages/Students.tsx` | SC3 | Add InstrumentBadge render to instrument column | ~696 |
| `src/features/students/details/components/StudentTabNavigation.tsx` | SC4 | `px-4` → `ps-4 pe-4` on `<nav>` element | 79 |
| `src/features/teachers/details/components/TeacherTabNavigation.tsx` | SC4 | `px-4` → `ps-4 pe-4` on `<nav>` element | 76 |

---

## Sources

### Primary (HIGH confidence)
- Direct file read: `src/pages/AuditTrail.tsx` — confirmed inline error at lines 232-246, no ErrorState import
- Direct file read: `src/components/feedback/ErrorState.tsx` — confirmed interface: `message?`, `onRetry?`
- Direct file read: `src/pages/Dashboard.tsx` — confirmed Weekly Summary lines 507-527 use design tokens
- Direct file read: `src/components/domain/InstrumentBadge.tsx` — confirmed orphaned (no callsites outside domain/)
- Direct file read: `src/features/students/details/components/StudentTabNavigation.tsx` — confirmed `px-4` on mobile `<nav>`
- Direct file read: `src/features/teachers/details/components/TeacherTabNavigation.tsx` — confirmed `px-4` on mobile `<nav>`
- `git log --oneline` — confirmed Dashboard colors fixed in `b159cc3` at 14:18 before audit at 15:26
- Direct file read: `.planning/v2.0-MILESTONE-AUDIT.md` — reviewed all 8 tech debt items
- Grep: `grep -rn "InstrumentBadge" src/` — confirmed only DesignSystem.tsx and domain/ use it

### Secondary (MEDIUM confidence)
- Tailwind CSS logical properties (`ps-`/`pe-`): Verified Tailwind v3 supports these classes (project uses v3 per tailwind.config.js)
- Phase 07 removal of CSS classes: Verified via `.planning/phases/07-primitives/07-02-SUMMARY.md` + confirmed `tab-navigation-fix.css` no longer contains `mobile-tab-nav`

---

## Metadata

**Confidence breakdown:**
- SC1 (AuditTrail ErrorState): HIGH — file read confirms the problem and solution
- SC2 (Dashboard colors): HIGH — file read confirms already fixed; git log confirms timing
- SC3 (InstrumentBadge): HIGH — grep confirms no callsites; component structure verified
- SC4 (RTL padding): HIGH — file read confirms `px-4` in mobile nav; Tailwind `ps-`/`pe-` support verified

**Research date:** 2026-02-18
**Valid until:** Stable (no external dependencies change; pure codebase finding)
