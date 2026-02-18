# Phase 13: Special Pages - Research

**Researched:** 2026-02-18
**Domain:** Page-level design polish, step indicators, print styles, auth page branding
**Confidence:** HIGH

## Summary

Phase 13 applies the warm design system (established in Phases 6-12) to the remaining special pages: Login/ForgotPassword/ResetPassword (auth pages), MinistryReports, ImportData, Settings, and AuditTrail. No new library installation is needed — all required infrastructure already exists. The primary work is wiring existing components correctly, migrating hardcoded `blue-*` tokens to `primary`/`ring` CSS vars, and introducing step indicators on the multi-step flows.

The Login page already has background image + glassmorphism overlay and is functionally solid. The main gap is the CTA button color (still `bg-blue-600`) and the lack of music identity branding (school name, music note icon, warm color accents). ForgotPassword and ResetPassword follow the same structure as Login — same fixes apply.

MinistryReports and ImportData both have genuine multi-step state machine flows. ImportData has three discrete states (upload → preview → results). MinistryReports has a conceptual three-step flow (select year → check status → download), but the current implementation renders all on one page with no explicit step indicator. A step indicator component (`StepProgress`) already exists at `src/components/feedback/ProgressIndicators.tsx` and can be wired directly. No new building required.

**Primary recommendation:** This phase is pure wiring and token-swap work. Do not redesign pages, do not introduce new libraries. Use StepProgress, swap blue → primary tokens, add a print stylesheet class, and add music identity to Login. Budget approximately 2-3 sub-plans.

## Standard Stack

### Core (already installed, zero installation required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `src/components/feedback/ProgressIndicators.tsx` | local | `StepProgress` component for multi-step flows | Already built in Phase 8; horizontal + vertical, handles pending/current/completed/error |
| Tailwind CSS `--primary` CSS var | Phase 6 | `bg-primary`, `text-primary`, `ring-primary` | Design token established; replaces all `blue-*` usage |
| `src/components/ui/Card.tsx` | shadcn | Card/CardHeader/CardContent composition | Already migrated in Phase 7 |
| `src/components/ui/input.tsx` | shadcn | Input element with token-based ring | Already migrated in Phase 9 |
| `src/index.css` `.no-print` | existing | Print visibility control | Already exists; needs `@media print` expansion for MinistryReports |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide React (Music icon) | installed | Music identity on Login page | Add a single Music note icon to the Login heading area |
| `tailwindcss-animate` | installed | Animate step transitions | Use `animate-fade-in` (150ms) on step content area changes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing `StepProgress` | New custom stepper | Existing component is complete — no reason to rebuild |
| CSS `@media print` block in `index.css` | Separate `print.css` file | Both work; single file is simpler for a small print block |
| `bg-primary` token | Keep blue | Phase objective is to apply warm tokens — blue must go |

**Installation:** None required. Zero new packages.

## Architecture Patterns

### Recommended Project Structure

No new files or directories needed. All changes are in-place edits to existing page files:

```
src/
├── pages/
│   ├── Login.tsx           # SPEC-01: warm tokens, music identity, school name
│   ├── ForgotPassword.tsx  # SPEC-01: match Login button tokens
│   ├── ResetPassword.tsx   # SPEC-01: match Login button tokens
│   ├── MinistryReports.tsx # SPEC-02: add StepProgress, year → check → download
│   ├── ImportData.tsx      # SPEC-03: add StepProgress, upload → preview → results
│   ├── Settings.tsx        # SPEC-04: swap blue focus tokens, use shadcn Input
│   └── AuditTrail.tsx      # SPEC-05: swap blue tokens, use Table from design system
├── index.css               # SPEC-06: expand @media print for MinistryReports
└── components/
    └── feedback/
        └── ProgressIndicators.tsx  # StepProgress — already built, reuse as-is
```

### Pattern 1: StepProgress wiring for ImportData

**What:** ImportData's `importState` variable (`'upload' | 'preview' | 'results'`) maps directly to StepProgress step statuses.

**When to use:** Any time page has an explicit multi-state flow driven by a state variable.

**Example:**
```typescript
// Import the existing component
import { StepProgress } from '../components/feedback/ProgressIndicators'

// Map importState → StepProgress steps
const IMPORT_STEPS = [
  { id: 'upload', label: 'העלאת קובץ' },
  { id: 'preview', label: 'תצוגה מקדימה' },
  { id: 'results', label: 'תוצאות' },
]

function getStepStatus(stepId: string, currentState: ImportState) {
  const order = ['upload', 'preview', 'results']
  const stepIdx = order.indexOf(stepId)
  const currentIdx = order.indexOf(currentState)
  if (stepIdx < currentIdx) return 'completed'
  if (stepIdx === currentIdx) return 'current'
  return 'pending'
}

// In JSX, before the tab switcher:
<StepProgress
  steps={IMPORT_STEPS.map(s => ({
    ...s,
    description: undefined,
    status: getStepStatus(s.id, importState)
  }))}
  direction="horizontal"
  className="mb-6"
/>
```

### Pattern 2: StepProgress wiring for MinistryReports

**What:** MinistryReports currently renders everything on one page with no explicit step state. The logical steps are:
1. בחר שנת לימודים (select year)
2. בדוק סטטוס (check status / validate)
3. הורד דוח (download)

The page does not need to be restructured into a wizard — the step indicator is informational/visual only, showing progress based on data state (year selected, no errors, download ready).

**When to use:** When the page has data-driven progress even without a literal state machine.

**Example:**
```typescript
const ministrySteps = [
  {
    id: 'year',
    label: 'בחר שנה',
    description: 'שנת לימודים',
    status: selectedYear ? 'completed' : 'current',
  },
  {
    id: 'validate',
    label: 'בדוק סטטוס',
    description: 'נתונים ואימות',
    status: !selectedYear
      ? 'pending'
      : endpointsAvailable && (status?.preExportErrors?.length ?? 0) === 0
        ? 'completed'
        : 'current',
  },
  {
    id: 'download',
    label: 'הורד דוח',
    description: 'ייצוא למשרד',
    status: endpointsAvailable && (status?.missing?.length === 0) && validation?.isValid
      ? 'current'
      : 'pending',
  },
]
```

### Pattern 3: Login warm branding

**What:** Replace `bg-blue-600/90` CTA with `bg-primary/90` (HSL CSS var). Add music identity: Music icon from Lucide + optional school name from tenant context. ForgotPassword and ResetPassword get the same CTA button fix.

**Key observation:** Login does NOT have access to auth context (user is not logged in yet). "School name" is only available after login. Therefore the music identity must use generic Hebrew text (e.g., "מערכת ניהול קונסרבטוריון") and a music icon — not a dynamic school name.

**Example:**
```tsx
// In the Login heading area, above the form:
<div className="flex flex-col items-center gap-2 mb-6">
  <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
    <Music className="w-8 h-8 text-white" />
  </div>
  <p className="text-sm text-white/70 font-reisinger-yonatan">מערכת ניהול קונסרבטוריון</p>
</div>

// CTA button: swap blue → primary
className="... bg-primary/90 hover:bg-primary focus:ring-ring ..."
```

**RTL note:** `focus:ring-ring` uses `--ring: 15 85% 45%` from Phase 6, which is the warm coral primary.

### Pattern 4: Settings page — shadcn Input component migration

**What:** Settings.tsx uses raw `<input>` elements with hardcoded `focus:ring-primary-500` classes. Phase 9 established the shadcn `Input` component at `src/components/ui/input.tsx`. The Settings form inputs should use the shadcn Input for consistency.

**When to use:** Any `<input>` element with manual Tailwind focus rings should be replaced with shadcn `Input`.

**Example:**
```tsx
// Before (Settings.tsx):
<input
  type="text"
  value={formData.name}
  onChange={e => ...}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 ..."
/>

// After (using shadcn Input):
import { Input } from '../components/ui/input'
<Input
  type="text"
  value={formData.name}
  onChange={e => ...}
  className="text-right"
/>
```

**Note:** shadcn Input uses `ring-ring` (CSS var `--ring: 15 85% 45%`) automatically. No manual focus classes needed.

### Pattern 5: Print styles for MinistryReports

**What:** `@media print` block in `src/index.css` already has `.no-print { display: none !important }`. MinistryReports needs the sidebar and header marked `no-print`, and optionally a `.print-content` class that resets margins when sidebar is hidden.

**When to use:** Any page that users might print.

**Example — add to `src/index.css`:**
```css
@media print {
  .no-print {
    display: none !important;
  }
  /* MinistryReports print: remove navigation chrome */
  .print-full-width {
    margin-right: 0 !important;
    margin-left: 0 !important;
    padding: 0 !important;
  }
  /* Ensure cards break cleanly across pages */
  .card, [class*="rounded-lg"] {
    break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #e5e7eb !important;
  }
}
```

**Layout wiring:** The Layout component's `<main>` element gets `marginRight` inline style for sidebar offset. To override this in print, use `.print-full-width` on `<main>` in Layout, or apply `@media print { main { margin-right: 0 !important; } }` directly.

**Sidebar/Header wiring:** Add `no-print` class to `<Sidebar>` and `<Header>` elements in `Layout.tsx`.

### Anti-Patterns to Avoid

- **Building a new stepper component:** `StepProgress` in `ProgressIndicators.tsx` is ready. Use it.
- **Adding school name to Login from API:** No auth context pre-login. Use static identity copy.
- **Converting Settings inputs to React Hook Form:** Settings uses simple controlled `useState` — this was a deliberate decision (09-03 pattern: forms without tab-switch data loss risk keep useState). Do not add RHF.
- **Restructuring MinistryReports into a wizard:** The step indicator is purely presentational — do not gate content behind steps. All content renders; steps show conceptual progress.
- **Using `print:hidden` Tailwind utilities:** `@media print` CSS already exists and uses `.no-print`; stay consistent with established pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Step progress indicator | Custom stepper | `StepProgress` from `ProgressIndicators.tsx` | Already built with all 4 states, RTL-aware, Tailwind-based |
| Print media styles | JS print detection | `@media print` CSS in `index.css` | Browser native, no JS overhead |
| Warm-token focus rings | Custom CSS overrides | shadcn `Input` / `ring-ring` CSS var | Design system already wired |
| Auth page logo | New ImageCard component | Lucide `Music` icon + inline Tailwind | Sufficient identity, zero complexity |

**Key insight:** Phase 13 is zero new infrastructure. Every pattern needed is already present. The planner should structure tasks as find-and-fix, not build-new.

## Common Pitfalls

### Pitfall 1: Forgetting ForgotPassword and ResetPassword

**What goes wrong:** Login gets fixed but sibling auth pages (ForgotPassword, ResetPassword) keep `bg-blue-600/90` CTA buttons.

**Why it happens:** Three pages share the same visual pattern. Easy to forget the siblings.

**How to avoid:** Grep for `bg-blue-600/90` across all auth pages before marking SPEC-01 complete. All three pages need the same button token fix.

**Warning signs:** After Login fix, run: `grep "bg-blue-600" src/pages/ForgotPassword.tsx src/pages/ResetPassword.tsx`

### Pitfall 2: StepProgress connector direction in RTL

**What goes wrong:** `StepProgress` renders connectors between steps. In RTL layout, "Step 1" appears on the right (visual start) — which is correct. But if the component uses `flex-row` without RTL awareness, the order may flip.

**Why it happens:** The existing `StepProgress` uses `dir="rtl"` on its container — check this when wiring.

**How to avoid:** Look at the existing `StepProgress` in `ProgressIndicators.tsx` line 276: `<div className="flex items-center ${className}" dir="rtl">`. It already handles RTL. Pass steps in logical order (step 1 first, step 3 last) — the RTL direction handles visual flip.

**Warning signs:** Step 3 appearing on the right side visually (should be left/visual end).

### Pitfall 3: `primary` CSS var vs `primary-500` palette class

**What goes wrong:** Replacing `bg-blue-600` with `bg-primary-600` still uses the hardcoded hex palette (`#3b82f6`), not the warm CSS var token.

**Why it happens:** `primary-500`, `primary-600` etc. in tailwind.config.js resolve to hardcoded hex values (still the blue palette from before Phase 6). Only `bg-primary` (no number) uses `hsl(var(--primary))`.

**How to avoid:** Always use `bg-primary`, `text-primary`, `border-primary`, `ring-primary` — never `bg-primary-500` or `bg-primary-600` when the intent is the warm token.

**Correct mapping:**
- `bg-blue-600/90` → `bg-primary/90`
- `focus:ring-blue-500` → `focus:ring-ring` (or use shadcn Input)
- `border-blue-500 text-blue-600` → `border-primary text-primary`
- `text-blue-600` (info banner) → `text-primary` (acceptable) or keep as info color

**Exception:** The blue info banner in MinistryReports (`border-blue-200 bg-blue-50`) is a legitimate informational blue. Do not forcibly convert this to primary/coral — it semantically means "information" not "brand". Keep info colors as-is.

### Pitfall 4: Print styles breaking the sidebar margin

**What goes wrong:** Adding `@media print` to hide the sidebar works, but the `<main>` element's `marginRight: 280px` inline style remains, leaving a blank gutter on the printed page.

**Why it happens:** The Layout component sets `marginRight` as an inline style, which has higher specificity than CSS class selectors.

**How to avoid:** Use `!important` in the print block: `@media print { main { margin-right: 0 !important; } }`. Inline styles can only be overridden by `!important` in CSS. This is a legitimate `!important` use (same pattern as the existing `.no-print` rule).

### Pitfall 5: AuditTrail tab active color mismatch

**What goes wrong:** AuditTrail tab buttons use `border-blue-500 text-blue-600` for the active state. Replacing with `border-primary text-primary` (CSS var) gives the correct warm coral — but the inactive hover should also match.

**Why it happens:** Three color classes need updating: active border, active text, hover text/border.

**How to avoid:** Update all three in the same pass:
```
border-blue-500 text-blue-600 → border-primary text-primary
hover:border-gray-300 → (keep as-is, gray is fine for inactive hover)
```

### Pitfall 6: Settings form `<select>` vs shadcn Select

**What goes wrong:** Settings.tsx has native `<select>` elements. Replacing with shadcn Select introduces portal/RTL complexity.

**Why it happens:** The decision in Phase 9 (09-01) was that native `<select>` on admin pages with simple options can stay native. The shadcn Select was added for teacher/student forms with complex search.

**How to avoid:** Keep native `<select>` in Settings.tsx. Only fix the `focus:ring-primary-500` → `focus:ring-ring` class on the `<select>` elements. Do not replace with shadcn Select.

## Code Examples

Verified patterns from codebase inspection:

### Correct token usage for primary CTA button

```typescript
// Correct: uses CSS var token
className="bg-primary/90 hover:bg-primary text-primary-foreground focus:ring-ring"

// Incorrect: uses hardcoded hex palette class
className="bg-blue-600/90 hover:bg-blue-700/90 focus:ring-blue-500"

// Incorrect: bg-primary-600 is still the hex palette, not the CSS var
className="bg-primary-600 hover:bg-primary-700"
```

### StepProgress import (from existing file)

```typescript
import { StepProgress } from '../components/feedback/ProgressIndicators'
```

### Print style additions to src/index.css

```css
@media print {
  .no-print {
    display: none !important;
  }
  /* Override inline sidebar margin */
  main {
    margin-right: 0 !important;
    margin-left: 0 !important;
  }
  /* Clean card borders for print */
  .rounded-lg, .rounded-xl {
    box-shadow: none !important;
    border: 1px solid #e5e7eb !important;
  }
}
```

Note: The existing `.no-print` rule is already present in `index.css`. The `main` margin override and card cleanup are additions. Do not duplicate the `.no-print` rule.

### Sidebar and Header: add no-print class

In `src/components/Layout.tsx`:
```tsx
{shouldShowSidebar && <Sidebar className="no-print" />}  // If Sidebar accepts className
<Header className="no-print" />                           // If Header accepts className
```

If Sidebar/Header do not accept `className`, wrap with a `<div className="no-print">`:
```tsx
<div className="no-print">{shouldShowSidebar && <Sidebar />}</div>
<div className="no-print"><Header /></div>
```

Check actual Sidebar/Header component signatures before choosing approach.

### AuditTrail blue → primary token swap

```tsx
// Before
className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
  activeTab === 'deletion-log'
    ? 'border-blue-500 text-blue-600'
    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
}`}

// After
className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
  activeTab === 'deletion-log'
    ? 'border-primary text-primary'
    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
}`}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `bg-blue-600` CTA buttons | `bg-primary/90` CSS var | Phase 6 | Auth pages still on old approach — fix in Phase 13 |
| No step indicators on multi-step flows | `StepProgress` component | Phase 8 | Built but not wired to MinistryReports/ImportData |
| No print styles beyond `.no-print` | Full `@media print` block | Phase 13 | MinistryReports is the first print target |
| Custom `<input>` with manual focus | shadcn `Input` with `ring-ring` | Phase 9 | Settings still uses custom inputs |

**Deprecated/outdated:**
- `focus:ring-blue-500 focus:border-blue-500`: replaced by `focus:ring-ring` (design system token). Any remaining usage is a design debt item.
- `bg-blue-600/90 hover:bg-blue-700/90`: replaced by `bg-primary/90 hover:bg-primary`. Still present on all auth pages — Phase 13 clears this.

## Phase Scope Assessment

This is a SMALL phase with well-defined, bounded changes:

| Page | Work | Complexity |
|------|------|-----------|
| Login | Music icon + school tagline + swap blue→primary button | Low |
| ForgotPassword | Swap blue→primary button only | Trivial |
| ResetPassword | Swap blue→primary button only | Trivial |
| MinistryReports | Add StepProgress + swap 2 blue info tokens | Low |
| ImportData | Add StepProgress (wires to existing `importState`) | Low |
| Settings | Swap `<input>` → shadcn `Input`, fix `<select>` focus ring | Low |
| AuditTrail | Swap blue tab tokens + blue focus rings on filters | Low |
| index.css | Add print block for MinistryReports | Trivial |

**Recommended plan split:**
- Plan 13-01: Login/ForgotPassword/ResetPassword (auth pages) + Settings + AuditTrail (token swaps)
- Plan 13-02: MinistryReports step indicator + ImportData step indicator + print styles

This is achievable in 2 plans. The token work and step indicator work are independent and can be split naturally.

## Open Questions

1. **Does Sidebar accept a `className` prop?**
   - What we know: Layout wraps Sidebar and Header to compose the shell
   - What's unclear: Whether `no-print` can be passed as className or requires a wrapper div
   - Recommendation: Read `src/components/Sidebar.tsx` and `src/components/Header.tsx` component signatures before writing Layout.tsx changes. Use wrapper div if className prop is absent.

2. **Should MinistryReports step 2 status reflect `endpointsAvailable`?**
   - What we know: When endpoints are not available, the page shows an info banner and no data
   - What's unclear: Whether step 2 should show "pending" (endpoints unavailable) or "current" (always checking)
   - Recommendation: When `endpointsAvailable` is false, treat step 2 as 'current' (checking) so it doesn't look broken. When endpoints available and no errors, mark step 2 as 'completed'.

3. **Should ForgotPassword/ResetPassword get the music identity treatment (icon + tagline)?**
   - What we know: SPEC-01 says "Login page is redesigned as a brand moment"
   - What's unclear: Whether sibling auth pages also need the full identity or just the token fix
   - Recommendation: Apply the full music identity (icon + tagline) to ForgotPassword and ResetPassword as well — they share the same background/glass container and creating inconsistency between them and Login would look odd.

## Sources

### Primary (HIGH confidence)
- Direct file inspection of `src/pages/Login.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `MinistryReports.tsx`, `ImportData.tsx`, `Settings.tsx`, `AuditTrail.tsx` — current state of all target pages
- `src/components/feedback/ProgressIndicators.tsx` — `StepProgress` component API and implementation
- `src/index.css` — existing design token definitions and `.no-print` print media rule
- `tailwind.config.js` — confirmed that `bg-primary` (no number) = CSS var, `bg-primary-600` = hardcoded hex
- `.planning/STATE.md` — confirmed Phase 12 complete, accumulated decisions (09-01, 09-03, 12-01, 12-02)
- `src/components/ui/Card.tsx` — Card/CardHeader/CardContent shadcn component API
- `src/components/ui/input.tsx` — shadcn Input component API

### Secondary (MEDIUM confidence)
- Pattern inference from Phase 10-12 decisions in STATE.md — tab active color patterns, token usage conventions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components confirmed present in codebase
- Architecture: HIGH — no new patterns, wiring existing components
- Pitfalls: HIGH — identified from direct code inspection (actual `bg-blue-600` found in files, actual RTL dir= attribute found in StepProgress)
- Print styles: MEDIUM — CSS `@media print` behavior is well-known but inline style specificity conflict is a common gotcha (identified, warned about)

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable tech; valid for 30 days)
