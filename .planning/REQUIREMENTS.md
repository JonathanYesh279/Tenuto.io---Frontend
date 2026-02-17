# Requirements: Tenuto.io v2.0 UI/UX Redesign

**Defined:** 2026-02-17
**Core Value:** Transform Tenuto from a generic admin template into a polished, premium music school management platform

## v2.0 Requirements

### Foundation & Infrastructure

- [ ] **FNDTN-01**: Design token system exists with CSS custom properties for colors, spacing, border-radius, and shadows in `:root`
- [ ] **FNDTN-02**: Tailwind config uses CSS variable-based semantic color tokens (primary, secondary, muted, accent, destructive, background, foreground)
- [ ] **FNDTN-03**: All `!important` overrides in custom CSS files are removed or replaced with proper specificity
- [ ] **FNDTN-04**: `dir="rtl"` is set on `document.documentElement` so Radix portals inherit correct direction
- [ ] **FNDTN-05**: All shadcn/ui components use logical properties (`ps-`, `pe-`, `start-`, `end-`) instead of physical (`pl-`, `pr-`, `left-`, `right-`)
- [ ] **FNDTN-06**: Warm music-school color palette applied (amber/coral primary tones, not default blue)
- [ ] **FNDTN-07**: Hebrew-friendly typography scale defined (headings, body, captions) with consistent font stack
- [ ] **FNDTN-08**: `components.json` initialized for shadcn/ui CLI compatibility

### Primitives & Component Library

- [ ] **PRIM-01**: shadcn/ui Dialog replaces all custom modal implementations (ConfirmDeleteModal, generic Modal)
- [ ] **PRIM-02**: shadcn/ui Tabs component replaces custom tab navigation in feature detail pages
- [ ] **PRIM-03**: shadcn/ui DropdownMenu replaces custom dropdown/action menus
- [ ] **PRIM-04**: Consistent button hierarchy established — primary, secondary, outline, ghost, destructive variants used correctly across all pages
- [ ] **PRIM-05**: shadcn/ui Badge component used consistently for status, role, and instrument values
- [ ] **PRIM-06**: All required Radix UI packages installed and functional (Dialog, Tabs, DropdownMenu, Tooltip, Popover, etc.)

### Loading & Feedback States

- [ ] **LOAD-01**: Skeleton loading screens replace spinners on all list pages (Teachers, Students, Orchestras, etc.)
- [ ] **LOAD-02**: Skeleton loading screens replace spinners on all detail pages
- [ ] **LOAD-03**: Every empty table/list shows an illustrated empty state with descriptive text and primary CTA
- [ ] **LOAD-04**: Network errors show a human-readable ErrorState component with retry button
- [ ] **LOAD-05**: Page route transitions use a smooth fade-in instead of flash/white screen
- [ ] **LOAD-06**: Confirmation dialogs show clear consequence messaging with itemized impact

### Toast & Notifications

- [ ] **TOAST-01**: Toast notifications are visually styled with warm design system colors (not default react-hot-toast)
- [ ] **TOAST-02**: Toast position is RTL-aware (appears from correct side)
- [ ] **TOAST-03**: Toast variants exist for success, error, warning, and info with appropriate icons

### Form System

- [ ] **FORM-01**: All form inputs use consistent shadcn/ui-styled components (Input, Select, Textarea, Checkbox, Switch)
- [ ] **FORM-02**: Inline validation feedback shows red border + error message under the field on blur
- [ ] **FORM-03**: Form fields are visually grouped with section labels and subtle separators within tabs
- [ ] **FORM-04**: Form buttons follow consistent placement pattern (primary action right-aligned in RTL, cancel secondary)

### Table & List Pages

- [ ] **TABLE-01**: Table rows have hover highlight states across all list pages
- [ ] **TABLE-02**: Table headers are sticky during scroll on long lists
- [ ] **TABLE-03**: Pagination shows context ("מציג 21-40 מתוך 127") not just page numbers
- [ ] **TABLE-04**: Search inputs have visible clear/reset button (X in field)
- [ ] **TABLE-05**: All 5 main list pages (Teachers, Students, Orchestras, Lessons, Audit) have consistent table design

### Detail Pages

- [ ] **DETAIL-01**: Detail page headers show entity name, role/status badges, and avatar initials on a warm gradient strip
- [ ] **DETAIL-02**: Avatar initials use deterministic color hashing based on name (consistent, no two adjacent same color)
- [ ] **DETAIL-03**: Breadcrumb navigation exists on all detail pages (e.g., "מורים → יוני כהן")
- [ ] **DETAIL-04**: Tab content transitions use a subtle fade animation (not instant swap)
- [ ] **DETAIL-05**: "Last updated" metadata displayed beneath entity name on detail pages

### Dashboard

- [ ] **DASH-01**: Dashboard shows personalized greeting with user name ("בוקר טוב, יונה")
- [ ] **DASH-02**: Stat cards use warm design system colors with purposeful iconography
- [ ] **DASH-03**: Dashboard layout feels warm and inviting, not boxy/grid-template
- [ ] **DASH-04**: Dashboard is the first visual confirmation that this is a music school platform, not a generic admin tool

### Layout & Navigation

- [ ] **LAYOUT-01**: Sidebar is redesigned with warm colors, rounded shapes, and music branding feel
- [ ] **LAYOUT-02**: Active navigation item is always clearly highlighted based on current route
- [ ] **LAYOUT-03**: Header is redesigned to complement sidebar with consistent design language
- [ ] **LAYOUT-04**: Layout is responsive — sidebar collapses cleanly on tablet-width screens

### Accessibility

- [ ] **A11Y-01**: All interactive elements have visible focus rings for keyboard navigation
- [ ] **A11Y-02**: Color contrast meets WCAG AA standards across all text and interactive elements
- [ ] **A11Y-03**: All form inputs have associated labels (no unlabeled inputs)
- [ ] **A11Y-04**: Tab key traversal follows logical order in RTL context

### Micro-interactions

- [ ] **MICRO-01**: Buttons have subtle hover/active state transitions
- [ ] **MICRO-02**: Modal entrance/exit uses smooth animation
- [ ] **MICRO-03**: Toast entrance uses slide-in animation
- [ ] **MICRO-04**: Animation is purposeful and limited — no decorative motion on every element

### Special Pages

- [ ] **SPEC-01**: Login page is redesigned as a brand moment — warm, inviting, music identity
- [ ] **SPEC-02**: MinistryReports uses step progress indicator for multi-step flow
- [ ] **SPEC-03**: ImportData uses step progress indicator for multi-step flow
- [ ] **SPEC-04**: Settings page follows consistent form/card patterns from design system
- [ ] **SPEC-05**: AuditTrail uses consistent table patterns with improved dense-data readability
- [ ] **SPEC-06**: Print-optimized styles exist for MinistryReports (hides nav, clean formatting)

## v2.1 Requirements (Deferred)

### Music Identity Components
- **MUSIC-01**: InstrumentBadge with department-based color coding (strings, winds, brass, percussion, piano, voice)
- **MUSIC-02**: Instrument icon set (SVG icons for major instrument families)
- **MUSIC-03**: Musical texture SVG illustrations in empty states
- **MUSIC-04**: Inline stat callouts on list pages ("127 תלמידים · 23 כינורנים")

### Advanced Interactions
- **ADV-01**: Collapsible sidebar (icon-only mode toggle)
- **ADV-02**: Keyboard shortcut modal (`?` to show shortcuts)
- **ADV-03**: Visual schedule conflict detection (client-side)
- **ADV-04**: Contextual help tooltips on admin-only fields

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dark mode | Hebrew fonts not dark-mode tested, warm identity works against it, RTL rendering differences |
| Animated charts/data viz | Scope creep, no active chart usage, defer to analytics milestone |
| Page-level slide/zoom transitions | Heavy, nauseating in RTL context, Monday.com uses sparingly on LTR |
| Infinite scroll | Destroys predictable list navigation, keep pagination |
| Dashboard drag-and-drop | Major complexity spike, fixed layout is better designed |
| Rich text / WYSIWYG | No rich-text schema fields, requires backend changes |
| Notification bell / inbox | Requires backend notification system, audit trail serves as activity log |
| Onboarding tour overlays | Complex, break on DOM changes, patronizing for returning admins |
| New business features | This milestone is visual-only — zero functional changes |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| (Populated during roadmap creation) | | |

**Coverage:**
- v2.0 requirements: 48 total
- Mapped to phases: 0
- Unmapped: 48 (pending roadmap)

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 after initial definition*
