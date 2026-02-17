# Phase 9: Form System - Research

**Researched:** 2026-02-17
**Domain:** React form styling, validation UX, shadcn/ui form primitives, RTL layout
**Confidence:** HIGH

---

## Summary

Phase 9 redesigns the three main entity creation/edit forms (AddTeacherModal 7-tab, StudentForm collapsible-sections, OrchestraForm single-page) to use consistent shadcn/ui-styled inputs with inline validation, visible labels, and correct RTL button placement.

The forms currently use raw `useState` + manual validation — React Hook Form is installed (`^7.45.4`) but completely unused in any form. All three forms share a common pattern: native `<input>`, `<select>`, `<textarea>` elements styled with `px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500` Tailwind classes, plus inline error `<p>` tags shown only after error state is set. The core infrastructure is already in place: shadcn Input, Label, Select (Radix-based), Checkbox, Switch, Textarea, and Separator are all present in `src/components/ui/`.

The primary technical decision is whether to migrate forms to React Hook Form + Controller, or stay with `useState` and simply replace the UI primitives. Given that (1) RHF is already installed, (2) the forms have complex multi-section state, (3) success criterion #3 explicitly mentions "no data loss from tab navigation," and (4) RHF's `defaultValues` + unregister-false pattern is the canonical solution for tab-switch data preservation — migrating to RHF with Controller is the correct architectural move. However, the three forms have very different shapes and migration must be done surgically to avoid regressions.

**Primary recommendation:** Replace native inputs with shadcn primitives inside a unified `<FormField>` wrapper component (Label + Input/Select/etc. + error message). Migrate AddTeacherModal to RHF + Controller for tab-persistence guarantee. StudentForm and OrchestraForm can use the same shadcn primitives with existing `useState` since they don't have tab navigation data loss risk.

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@radix-ui/react-label` | ^2.1.7 | shadcn Label primitive | Peer `htmlFor` association — accessible linking |
| `@radix-ui/react-select` | ^2.2.6 | shadcn Select primitive | Native `<select>` cannot style `<option>` reliably across browsers/dark-mode |
| `@radix-ui/react-checkbox` | ^1.3.3 | shadcn Checkbox | Consistent checked state, accessible |
| `@radix-ui/react-switch` | ^1.2.6 | shadcn Switch | Boolean toggles with accessible role="switch" |
| `react-hook-form` | ^7.45.4 | Form state + validation | Already installed; Controller solves tab-unmount data loss |
| `zod` | ^3.22.2 | Schema validation | Already installed; zodResolver bridges RHF + Zod |

### Supporting (in codebase, extend as needed)

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `src/components/ui/input.tsx` | shadcn Input | All single-line text, tel, number, email inputs |
| `src/components/ui/textarea.tsx` | shadcn Textarea | Multi-line text fields |
| `src/components/ui/separator.tsx` | shadcn Separator | Section dividers between field groups |
| `src/components/form/AccessibleFormField.tsx` | Existing a11y wrapper | Reference pattern — **do NOT use directly**, build new FormField instead |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| RHF Controller (AddTeacherModal) | Keep useState | useState loses tab data on unmount — fails success criterion #3 |
| shadcn Select | Keep native `<select>` | Native select has `!important` hacks in teacher-modal-fixes.css — Phase 9 must remove them |
| Shared `<FormField>` wrapper | Inline label+error pattern | Inline is 40% more code per field, harder to enforce consistency |

**Installation:** No new packages needed. All dependencies are already in package.json.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   └── ui/
│       ├── form-field.tsx     # NEW: unified Label + input slot + error message
│       ├── input.tsx          # EXISTS: shadcn Input (no changes needed)
│       ├── label.tsx          # EXISTS: shadcn Label (no changes needed)
│       ├── select.tsx         # EXISTS: shadcn Select (no changes needed)
│       ├── checkbox.tsx       # EXISTS: shadcn Checkbox
│       ├── switch.tsx         # EXISTS: shadcn Switch
│       ├── textarea.tsx       # EXISTS: shadcn Textarea
│       └── separator.tsx      # EXISTS: shadcn Separator
├── components/
│   └── modals/
│       └── AddTeacherModal.tsx  # MIGRATE: useState → RHF + Controller
├── components/
│   ├── forms/
│   │   └── StudentForm.tsx      # UPDATE: replace native inputs with shadcn
│   ├── OrchestraForm.tsx        # UPDATE: replace native inputs with shadcn
│   └── TeacherForm.tsx          # UPDATE: replace native inputs with shadcn (secondary form)
└── styles/
    └── teacher-modal-fixes.css  # CLEAN: remove .teacher-student-select option !important after Select migration
```

### Pattern 1: FormField Wrapper Component (new, shared)

**What:** A single wrapper that renders Label → Input slot → error message with consistent styling, a11y wiring, and RTL-aware layout.

**When to use:** Every form field in Teacher, Student, and Orchestra forms.

```typescript
// src/components/ui/form-field.tsx
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  hint?: string
  className?: string
  children: React.ReactNode
}

export function FormField({ label, htmlFor, error, required, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive me-1" aria-hidden="true">*</span>}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm text-destructive flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
```

**Key:** Pass `id={htmlFor}` and `aria-invalid={!!error}` and `aria-describedby={error ? `${htmlFor}-error` : undefined}` to the child input element.

### Pattern 2: shadcn Input with Error State

**What:** Extend the existing shadcn Input with a data-invalid prop or className override to show red border on error.

**When to use:** All text, email, tel, number inputs.

```typescript
// Usage inside FormField:
<Input
  id="personalInfo.firstName"
  value={formData.personalInfo.firstName}
  onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
  aria-invalid={!!errors['personalInfo.firstName']}
  aria-describedby={errors['personalInfo.firstName'] ? 'personalInfo.firstName-error' : undefined}
  className={cn(errors['personalInfo.firstName'] && "border-destructive focus-visible:ring-destructive")}
  placeholder="הכנס שם פרטי"
/>
```

**Note:** The shadcn Input already uses `border-input` and `focus-visible:ring-ring` tokens. Adding `border-destructive focus-visible:ring-destructive` via className override is the correct pattern — no changes to input.tsx needed.

### Pattern 3: shadcn Select replacing native `<select>` (grouped options)

**What:** The Radix-based Select renders its own portal dropdown with full CSS control, eliminating the `!important` hacks in teacher-modal-fixes.css.

**When to use:** All `<select>` fields, especially grouped ones (instrument by department, location by type).

```typescript
// Source: Context7 /react-hook-form/react-hook-form (Controller pattern)
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from "@/components/ui/select"

<Select value={value} onValueChange={onChange}>
  <SelectTrigger id="instrument" aria-invalid={!!error} className={cn(error && "border-destructive")}>
    <SelectValue placeholder="בחר כלי נגינה" />
  </SelectTrigger>
  <SelectContent>
    {Object.entries(INSTRUMENT_DEPARTMENTS).map(([dept, instruments]) => (
      <SelectGroup key={dept}>
        <SelectLabel>{dept}</SelectLabel>
        {instruments.map(inst => (
          <SelectItem key={inst} value={inst}>{inst}</SelectItem>
        ))}
      </SelectGroup>
    ))}
  </SelectContent>
</Select>
```

**Critical:** Radix Select does NOT support `optgroup`/`option` children. Use `SelectGroup` + `SelectLabel` + `SelectItem` instead.

**RTL:** Radix Select inherits `dir` from the document root (`html dir="rtl"`) — no extra prop needed.

### Pattern 4: RHF Controller for AddTeacherModal tab persistence

**What:** React Hook Form stores all field values in its internal store. Even if a tab's JSX unmounts, the values remain because `shouldUnregister: false` (the default).

**When to use:** AddTeacherModal only (7-tab form with tab switching via `setActiveTab`).

```typescript
// Source: Context7 /react-hook-form/react-hook-form
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const { control, handleSubmit, formState: { errors } } = useForm<TeacherFormData>({
  defaultValues: { ... },
  resolver: zodResolver(teacherSchema),
  // shouldUnregister: false is the DEFAULT — values survive tab unmount
})

// For Radix Select (controlled component):
<Controller
  name="professionalInfo.instrument"
  control={control}
  render={({ field, fieldState }) => (
    <FormField label="כלי נגינה" htmlFor="instrument" error={fieldState.error?.message} required>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger id="instrument" className={cn(fieldState.error && "border-destructive")}>
          <SelectValue placeholder="בחר כלי נגינה" />
        </SelectTrigger>
        <SelectContent>...</SelectContent>
      </Select>
    </FormField>
  )}
/>

// For shadcn Checkbox:
<Controller
  name="professionalInfo.hasTeachingCertificate"
  control={control}
  render={({ field }) => (
    <div className="flex items-center gap-2">
      <Checkbox
        id="hasTeachingCertificate"
        checked={field.value}
        onCheckedChange={field.onChange}
      />
      <Label htmlFor="hasTeachingCertificate">תעודת הוראה</Label>
    </div>
  )}
/>
```

### Pattern 5: Section grouping with Separator

**What:** Visual sections within a tab/form using a section heading + Separator.

**When to use:** Every logical group of related fields (e.g., "פרטים אישיים", "פרטי הורה").

```typescript
// Source: codebase — src/components/ui/separator.tsx
<div className="space-y-4">
  <div>
    <h3 className="text-sm font-semibold text-foreground">פרטים אישיים</h3>
    <Separator className="mt-2 mb-4" />
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* fields */}
  </div>
</div>
```

### Pattern 6: RTL button placement (FORM-04)

**What:** In RTL, "right-aligned" means the primary action is at the inline-end (logical right in Hebrew). For CSS, `flex justify-end` places the last-in-DOM button at the visual right in RTL — primary action (Save) should come **last** in DOM order for RTL-correct visual placement, cancel first.

**RTL specifics:**
- In RTL: `flex-row` → last DOM child appears visually leftmost (inline-start), first DOM child appears visually rightmost (inline-end).
- To achieve "Cancel on the outside right, Save prominent on the left in RTL" use: `<div className="flex justify-end gap-3">` with Cancel first in DOM, Save second.
- Wait — the RTL direction reverses flex so the "last" item is at inline-start (visual left). The primary action should be most prominent. In RTL Hebrew UI convention, the primary action (Save/confirm) should be at the visual RIGHT (inline-end). So: `<div className="flex justify-end gap-3">` with Save last in DOM = visual left in RTL. This is WRONG.

**Correct RTL button pattern:**

```typescript
// RTL: flex-row-reverse with justify-start, OR: flex with justify-start
// The safest RTL-explicit pattern is using dir-aware spacing:
<div className="flex items-center gap-3 pt-6 border-t justify-end flex-row-reverse">
  {/* In RTL, flex-row-reverse + justify-end = items flow from visual RIGHT */}
  {/* First in DOM = visual RIGHT (inline-end) = primary action */}
  <Button type="submit" disabled={isLoading}>
    <Save className="w-4 h-4 ms-2" />
    שמור
  </Button>
  <Button type="button" variant="outline" onClick={onCancel}>
    ביטול
  </Button>
</div>
```

**Simpler alternative — inspect existing forms:**
- OrchestraForm: `flex justify-end gap-3` with Cancel (first DOM) then Save (second DOM) → In RTL, `justify-end` pushes both to inline-start (visual left). Cancel is visually to the left of Save. This matches current behavior.
- The success criterion says "primary action buttons appear in a consistent bottom-right position in RTL; cancel appears to their right (outward direction)." This means Save = visual LEFT, Cancel = visual RIGHT in Hebrew RTL. The current `flex justify-end` pattern places both at visual left edge, Cancel to the RIGHT of Save — which actually satisfies the requirement already.
- **Conclusion:** Keep `flex justify-end gap-3` with Cancel first in DOM, Save second. This is correct and already used.

### Anti-Patterns to Avoid

- **Removing shouldUnregister guard:** Never set `shouldUnregister: true` in AddTeacherModal — that causes data loss on tab switch.
- **Using `register()` with Radix/shadcn primitives:** Radix components don't expose a real DOM `<input>`. Use `Controller` for all Radix components (Select, Checkbox, Switch). Use `register()` only for native HTML inputs.
- **Adding error class to Label:** Error styling belongs on the input element (border-destructive), not the label. The label should always remain fully readable.
- **Blur-only validation trigger in RHF:** Default `mode: 'onBlur'` fires on first blur but doesn't re-validate on re-focus. Use `mode: 'onTouched'` in RHF for best inline UX (validates after first touch, then live on change).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab data persistence | Custom context/ref to preserve form values | RHF with `shouldUnregister: false` | RHF is already installed; custom solutions have subtle bugs with async re-renders |
| Select with grouped options | Custom dropdown with JS position tracking | Radix Select + SelectGroup | StudentForm already has a hand-rolled dropdown (teacher selection) with fixed positioning bugs — don't replicate |
| Error state on input | Per-field className string construction | FormField wrapper with className override | Consistent, co-located, accessible |
| Label-input association | `aria-labelledby` with generated IDs (AccessibleFormField pattern) | `htmlFor`/`id` pair via FormField | `htmlFor`/`id` is simpler, more reliable, and what shadcn Label uses natively |

**Key insight:** The codebase already has AccessibleFormField.tsx which uses `aria-labelledby` + random IDs. This is overcomplicated — shadcn Label with `htmlFor` is the standard and sufficient for a11y.

---

## Common Pitfalls

### Pitfall 1: Radix Select value type mismatch

**What goes wrong:** Radix Select `onValueChange` always returns a `string`. If the field expects `number | null` (e.g., class stage = 1..8 as number), `parseInt()` must be called in onChange.

**Why it happens:** Native `<select onChange>` returns `event.target.value` (string) too, but existing code uses `parseInt(e.target.value)`. With Radix Select's `onValueChange`, there's no event object — just the value string.

**How to avoid:** Always adapt value type at the onChange boundary:
```typescript
onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
```

**Warning signs:** Seeing `"1"` (string) instead of `1` (number) in form data on submit.

### Pitfall 2: RHF Controller + Radix Checkbox checked/onCheckedChange mismatch

**What goes wrong:** Radix Checkbox uses `checked` (not `value`) and `onCheckedChange` (not `onChange`). Spreading `{...field}` from Controller won't work because `field.value` is boolean but the prop is `checked`, and `field.onChange` receives the raw value (not an event).

**Why it happens:** Radix Checkbox is not a standard HTML checkbox — it doesn't fire `React.ChangeEvent<HTMLInputElement>`.

**How to avoid:** Always destructure explicitly:
```typescript
render={({ field }) => (
  <Checkbox
    checked={field.value}
    onCheckedChange={field.onChange}
    ref={field.ref}
  />
)}
```

**Warning signs:** Checkbox that doesn't toggle, or TypeScript error "Type 'boolean' is not assignable to type 'string'".

### Pitfall 3: Radix Select inside a modal z-index

**What goes wrong:** Radix SelectContent uses a Portal (renders at document body). If the modal has `overflow-hidden`, the SelectContent still works correctly because it escapes the overflow container. However, a z-index lower than the modal backdrop causes the dropdown to render behind the modal.

**Why it happens:** SelectContent portal renders at body level but may get a z-index lower than the modal overlay.

**How to avoid:** The shadcn SelectContent already has `z-50`. The modal overlay in OrchestraForm uses `z-50` too. Ensure modal body is `z-50` and SelectContent is at least equal. shadcn defaults handle this correctly.

**Warning signs:** Dropdown renders but is invisible (hidden behind modal backdrop).

### Pitfall 4: Native `<select>` inside AddTeacherModal still using teacher-modal-fixes.css

**What goes wrong:** After migrating selects to Radix Select, the `.teacher-student-select option { !important }` rules in `teacher-modal-fixes.css` become dead code. But more importantly, if any `<select>` is missed and left as native, it still has dark-mode visibility problems.

**Why it happens:** Large forms (7 tabs) make it easy to miss one `<select>`.

**How to avoid:** After migration, grep for `<select` in AddTeacherModal and ensure zero native selects remain. Then remove the `.teacher-student-select` block from teacher-modal-fixes.css.

**Warning signs:** `option { !important }` CSS rules with no native `<select>` to target = dead CSS.

### Pitfall 5: RHF defaultValues must match schema shape exactly

**What goes wrong:** If defaultValues has `professionalInfo.instrument: ''` but Zod schema expects `string | null`, RHF validation fires on mount.

**Why it happens:** Zod `.optional()` and `.nullable()` behave differently. `''` (empty string) is not `null`.

**How to avoid:** Use `z.string().min(0).optional()` for optional strings where empty string is valid, or `z.string().nullable()` with `null` as defaultValue. Match defaultValues type to Zod schema output type exactly.

### Pitfall 6: StudentForm's collapsible sections vs. tab navigation

**What goes wrong:** StudentForm uses accordion-style collapsible sections (not tabs). Sections unmount when collapsed if implemented naively. BUT the existing StudentForm uses `useState` and the sections never truly unmount — they use `{expandedSections.personal && <div>}`. Replacing with RHF may cause issues if `shouldUnregister: true`.

**Why it happens:** RHF's shouldUnregister default is false, so this shouldn't be a problem, but it's worth noting the architectural difference from AddTeacherModal.

**How to avoid:** For StudentForm, since collapsing is conditional rendering, stick with `useState` + shadcn primitives (no RHF migration needed). Only AddTeacherModal benefits from full RHF migration.

---

## Code Examples

Verified patterns from official sources:

### Full FormField wrapper (to create)

```typescript
// src/components/ui/form-field.tsx
// Source: codebase pattern + shadcn/ui conventions
import * as React from "react"
import { AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  hint?: string
  className?: string
  children: React.ReactNode
}

export function FormField({ label, htmlFor, error, required, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ms-1" aria-hidden="true">*</span>}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
```

### RHF setup for AddTeacherModal

```typescript
// Source: Context7 /react-hook-form/react-hook-form
import { useForm, Controller } from 'react-hook-form'

const { control, handleSubmit, formState: { errors } } = useForm<TeacherFormData>({
  defaultValues: { /* existing default shape */ },
  mode: 'onTouched', // validate after first touch, then live
  // No resolver needed if keeping existing manual validation;
  // Add zodResolver(teacherSchema) when ready to migrate validation to Zod
})

// Note: shouldUnregister defaults to false — tab switching safe
```

### Section heading pattern

```typescript
// Source: codebase pattern
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-foreground">{children}</h3>
      <Separator className="mt-1.5" />
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Native `<select>` with `!important` overrides | Radix Select (portal-based, fully styled) | Phase 9 (now) | Eliminates teacher-modal-fixes.css hacks |
| `useState` + manual validate-on-submit | RHF `useForm` + `mode: 'onTouched'` for tab form | Phase 9 (AddTeacherModal) | Tab data persists; inline validation UX |
| `aria-labelledby` + random IDs | `htmlFor`/`id` pair via FormField wrapper | Phase 9 (now) | Simpler, reliable, standard |
| `input.className` conditional string | `cn()` override in className prop | Phase 7 already done | Consistent with shadcn pattern |

**Deprecated/outdated:**
- `.teacher-student-select option { !important }` in teacher-modal-fixes.css: Remove after migrating all selects to Radix Select.
- `AccessibleFormField.tsx` (aria-labelledby + cloneElement): Superseded by `FormField` + shadcn Label.
- `InstrumentSelect.tsx` (custom native select wrapper): Can be replaced with shadcn Select + FormField.

---

## Open Questions

1. **Zod schema scope for AddTeacherModal**
   - What we know: Zod is installed. The existing manual `validateForm()` covers firstName, lastName, phone, email, address, roles, instrument, and schedule time ranges.
   - What's unclear: Should Phase 9 migrate validation to Zod schema fully, or keep manual validation and only migrate the UI/form state to RHF?
   - Recommendation: Start with RHF + existing manual validation (just replace `validateForm()` call with `handleSubmit()`). Zod schema migration is a separate concern and adds risk. Keep it for Phase 11 (Polish).

2. **TeacherForm.tsx vs AddTeacherModal.tsx — which is the canonical teacher form?**
   - What we know: Both files exist. `AddTeacherModal.tsx` is the 7-tab version actually used for add/edit. `TeacherForm.tsx` is an older simpler form in `src/components/`.
   - What's unclear: Is TeacherForm.tsx used anywhere in the app?
   - Recommendation: Grep for `TeacherForm` imports before Phase 9 planning. If unused, exclude from scope. If used, add to Phase 9 task list.

3. **StudentForm collapsible sections — keep accordion or migrate to tabs?**
   - What we know: StudentForm uses collapsible `<div>` sections. Phase 9 success criteria focus on Teacher form tabs but mention "Student and Orchestra forms" for labels and button placement.
   - What's unclear: Does the planner want to restructure StudentForm to use shadcn Tabs like the Teacher form?
   - Recommendation: Keep collapsible accordion (it's a different UX pattern that works for student creation). Apply shadcn primitives + FormField wrapper without structural changes.

4. **Select grouped options (instrument departments, locations) — full Radix migration scope**
   - What we know: Three files use `<optgroup>`: TeacherForm.tsx, OrchestraForm.tsx, InstrumentSelect.tsx. These all need Radix Select migration.
   - What's unclear: `InstrumentSelect.tsx` — is it used in the teacher student assignment panel in StudentForm? If yes, it needs to become a Radix Select component.
   - Recommendation: Pre-scan for `InstrumentSelect` and `teacher-student-select` class usages before writing tasks.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/react-hook-form/react-hook-form` — Controller, shouldUnregister, mode options, Checkbox/Switch integration patterns
- Codebase — `src/components/ui/*.tsx` (all shadcn primitives confirmed present)
- Codebase — `src/components/modals/AddTeacherModal.tsx` (7-tab structure, current form state)
- Codebase — `src/components/forms/StudentForm.tsx` (collapsible sections, current form state)
- Codebase — `src/components/OrchestraForm.tsx` (single-page form, current state)
- Codebase — `src/styles/teacher-modal-fixes.css` (TODO comment confirmed for Phase 9)
- Codebase — `package.json` (confirmed: react-hook-form ^7.45.4, zod ^3.22.2, all Radix packages)

### Secondary (MEDIUM confidence)
- Codebase — `src/components/form/AccessibleFormField.tsx` (reference for a11y pattern to supersede)
- Codebase — `src/components/form/InstrumentSelect.tsx` (existing instrument select to replace)
- Codebase — `.planning/STATE.md` (prior decisions, including [06-02 TODO Phase 9] for native select replacement)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries confirmed present in package.json and UI components verified in src/
- Architecture: HIGH — Form implementations read in full; patterns derived from actual code
- RHF Controller pattern: HIGH — Verified via Context7 official docs
- RTL button ordering: MEDIUM — Derived from RTL CSS logic and inspecting existing form buttons; no official shadcn RTL doc consulted
- Pitfalls: HIGH — Derived from actual code patterns seen in codebase (e.g., Radix Checkbox checked vs value, native select !important)

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable libraries, 30-day window)
