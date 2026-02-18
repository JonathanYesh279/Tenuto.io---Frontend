# Dual Color System Inventory

**Created:** Phase 16 (Token Foundation)
**Status:** Documented — migration deferred to future phase

---

## The Conflict

Tenuto.io operates two parallel color systems that are **not synchronized**:

| System | Token | Value | Usage |
|--------|-------|-------|-------|
| CSS var (shadcn) | `--primary` | `hsl(15 85% 45%)` — warm coral | Bare classes: `bg-primary`, `text-primary`, `ring`, `border-primary` |
| Tailwind palette | `primary-500` | `#4F46E5` — indigo blue | Numbered classes: `bg-primary-500`, `text-primary-600`, `ring-primary-500` |

These two systems produce **visually conflicting colors** on the same page. Any component using both simultaneously shows both warm coral AND indigo blue as "brand" colors.

---

## Occurrence Summary

Grep-verified counts (`grep -roh "[a-z:-]*primary-[0-9]{3}" src/ | wc -l` = 1,211):

| Category | Pattern | Count | Risk Level |
|----------|---------|-------|------------|
| Focus rings | `ring-primary-*`, `focus:ring-primary-*` | 391 | HIGH (accessibility) |
| Text accent | `text-primary-*`, `hover:text-primary-*` | 337 | MEDIUM |
| Interactive brand | `bg-primary-*`, `hover:bg-primary-*` | 329 | MEDIUM |
| Border accent | `border-primary-*`, `focus:border-primary-*` | 124 | LOW |
| Gradient | `from-primary-*`, `to-primary-*`, `via-primary-*` | 27 | LOW |
| Fill/stroke | `fill-primary-*`, `stroke-primary-*` | 1 | LOW |

**Total: 1,211 class instances across 134 files**

### Top 10 Most Frequent Classes

| Class | Occurrences |
|-------|-------------|
| `focus:ring-primary-500` | 379 |
| `text-primary-600` | 214 |
| `bg-primary-500` | 81 |
| `bg-primary-600` | 61 |
| `hover:bg-primary-600` | 58 |
| `hover:bg-primary-700` | 55 |
| `bg-primary-100` | 55 |
| `text-primary-700` | 45 |
| `focus:border-primary-500` | 34 |
| `border-primary-200` | 31 |

---

## Mixed-System Components

Files using both bare `primary` (CSS var = coral) AND numbered `primary-NNN` (hardcoded = indigo):

| File | Risk | Notes |
|------|------|-------|
| `src/components/forms/StudentForm.tsx` | HIGH | Form with both `bg-primary-*` buttons and `text-primary` labels |
| `src/components/Sidebar.tsx` | HIGH | Navigation — `hover:bg-primary/10` (CSS var) + `text-primary-*` (hex) |
| `src/index.css` | HIGH | Base styles — both systems defined at root level |
| `src/pages/Dashboard.tsx` | MEDIUM | Mixed across stat cards and headings |
| `src/pages/ImportData.tsx` | MEDIUM | Action buttons use both systems |
| `src/pages/MinistryReports.tsx` | MEDIUM | Info banners + action elements |
| `src/pages/Settings.tsx` | MEDIUM | Form sections with mixed primary usage |

These 7 files are the **highest-risk targets** — both coral and indigo appear simultaneously as "brand" colors.

---

## Migration Strategy

Two approaches (decision deferred to a dedicated color phase):

### Option A: Align the hardcoded palette to warm tones

Replace `primary-500` (`#4F46E5` indigo) and the full numbered palette with warm coral tones that complement `--primary: hsl(15 85% 45%)`.

**Pro:** Single coherent warm identity; all `primary-*` usage resolves to same hue family.
**Con:** 134 files touched; must browser-test all form fields and interactive states for contrast.
**Effort:** High — requires full palette redesign and visual QA pass.

### Option B: Introduce semantic color aliases

Create CSS custom properties (`--color-brand`, `--color-interactive`, `--color-focus`) that both the CSS var system and the numbered classes can reference through Tailwind color tokens.

```css
/* Option B approach */
--color-interactive: hsl(15 85% 45%);   /* align to brand coral */
--color-focus: hsl(15 75% 40%);         /* darker coral for focus rings */
```

**Pro:** Incremental migration — change aliases, not class names; no file churn.
**Con:** Adds indirection layer; downstream devs must learn alias vocabulary.
**Effort:** Medium — core alias definition is small, but updating 1,211 class instances to use aliases is still large.

---

## Risk Assessment

### Accessibility Risk (HIGH PRIORITY)

`ring-primary-500` (`#4F46E5` indigo on white backgrounds):
- **379 occurrences** across focus rings on form inputs, buttons, and interactive elements
- WCAG 2.1 AA requires 3:1 contrast ratio for focus indicators
- `#4F46E5` on white = **~4.5:1** — currently passes, but any palette change must be re-verified
- If coral (`hsl(15 85% 45%)` ≈ `#d4480a`) replaces indigo: on white = **~4.1:1** — still passes AA, but verify

### Migration Safety Rules

1. **Never big-bang this change** — migrate per-page or per-component, not as a single commit
2. **Browser-test focus states** on all form fields after any palette change
3. **Verify Hebrew text contrast** — Heebo at 400/700 weight with coral-based text colors
4. **Test dark mode** if ever introduced — warm coral on dark surfaces needs separate validation
5. **Check Radix UI components** — popover, dropdown, dialog all use `ring` for focus; these are generated, not handwritten

### Files to Touch First (Mixed-System Priority)

Start with the 7 mixed-system files listed above — they already have both systems and will show the most visible inconsistency after any partial migration.

---

## Decision Status

**Not yet decided.** This inventory exists to make the dual system explicit.

A dedicated color phase (suggested: Phase 17.5 or later) should:
1. Pick Option A or Option B
2. Define the target palette
3. Migrate in per-component batches with visual QA after each batch
