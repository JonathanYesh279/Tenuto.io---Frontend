# Feature Landscape: UI/UX Redesign

**Domain:** SaaS admin dashboard — conservatory (music school) management
**Researched:** 2026-02-17
**Milestone:** v2.0 Full UI/UX Redesign (visual only, zero functional regressions)

---

## Context

Tenuto.io is a Hebrew RTL conservatory management app. It has a complete feature set
(teachers, students, orchestras, bagruts, rehearsals, theory lessons, ministry reports,
import, settings, audit trail, multi-tenant auth). The app currently looks and feels like
a generic template. This redesign is **purely visual** — the goal is to make it feel
like a premium, purpose-built tool for music educators, not a CRUD scaffold.

Design direction:
- Warmth and personality from Monday.com (rounded corners, intentional color, approachable)
- Whitespace and precision from Linear (generous spacing, consistent rhythm)
- Music school identity woven in without being costume-y
- Component system: shadcn/ui (Radix-based, Tailwind-compatible)

---

## Table Stakes

Features that must exist for the app to feel polished. Missing any of these and it
reads as "unfinished," regardless of how pretty the colors are.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Skeleton loading screens | Every list/detail view loads async. Spinners feel broken; skeletons feel professional | Low | Replace all current spinner patterns with content-shaped skeletons |
| Empty states with calls to action | Tables that say nothing when empty feel broken. Illustrated or icon-based empty states with a primary CTA are the norm | Low | Every table and list needs one — "No students yet. Add your first student." |
| Inline form validation feedback | Red border + message under the field on blur, not just on submit. Already partially implemented via RHF+Zod but visually inconsistent | Low | Visual standardization — not logic changes |
| Toast notifications (styled) | react-hot-toast already present but unstyled / using defaults. Toasts need custom design — RTL position, warm colors, branded feel | Low | Style the existing Toaster, add variant icons |
| Consistent button hierarchy | Every page should have one clear primary action. Secondary actions visually subordinate. Destructive actions red. Currently mixed | Low | Global button variants from shadcn/ui |
| Accessible focus rings | Tab/keyboard navigation must be visible. RTL-aware focus ring direction | Low | Tailwind focus-visible utilities + shadcn default |
| Error states with retry | Network errors must show a human message + retry button. Not a raw error string | Low | Standardize the existing multi-layer error pattern into a single ErrorState component |
| Consistent spacing scale | Currently spacing is ad-hoc per component. Uniform 4px grid (Tailwind default) throughout | Low | Audit and replace arbitrary margins with scale values |
| Mobile-aware layout | The app is primarily desktop but must not break on tablet. Sidebar must collapse cleanly | Medium | Sidebar context already exists; needs responsive breakpoints |
| Page-level loading transitions | Route changes should fade smoothly, not flash white. Lazy-loaded pages already have a fallback spinner — it needs to be styled | Low | Replace PageLoadingFallback with a soft fade-in shimmer |
| Confirmation dialogs with clear consequence messaging | "Delete student?" is not enough. Show what will be deleted (cascade). Already implemented logically — needs visual upgrade | Low | Style ConfirmDeleteModal with shadcn/Dialog, red accent, itemized list |
| Search with clear / reset | Every list page has search. The clear button must be obvious (X in the field) and instantly clear | Low | Small UI detail with large perceived quality impact |
| Active nav item highlighting | Sidebar must always show where you are. Currently inconsistent | Low | Active state via router's `useLocation` — already partially there |
| Consistent heading hierarchy | h1 per page, h2 for section headers, h3 for sub-sections. Currently mixed | Low | Tailwind typography scale applied uniformly |
| Breadcrumbs on detail pages | Teacher → Yoni Cohen. Student → Shira Levi. Where am I? How do I go back? | Low | Detail page header pattern with back link + entity name |
| Badge / status chip component | Instrument, role, status values need visual badges — not plain text. Already `badge.tsx` exists but inconsistently used | Low | Standardize and apply throughout |
| Table row hover states | Rows must subtly highlight on hover. A click affordance. Currently absent or inconsistent | Low | Tailwind hover utility applied to Table component |
| Sticky table headers | On long lists, the column headers must stay visible while scrolling | Low | `sticky top-0` on thead, works with existing Table.tsx |
| Pagination that shows context | "Showing 21–40 of 127" not just "← 2 →" | Low | Enhance existing Pagination.tsx |
| Form field groupings with section labels | 7-tab teacher form has dense fields. Within each tab, group related fields with a subtle separator and label | Low | Visual grouping, no logic change |

---

## Differentiators

Features that elevate the product beyond "just polished" into "clearly made for music
schools by someone who cares." These are not expected by default, but they create
memorable moments and reinforce the product's identity.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Instrument department color coding | Each of 27 instruments belongs to a family (strings, winds, brass, percussion, piano/keyboard, voice). Assign a warm accent color per family. Use on badges, detail page headers, student cards | Low | 6 color assignments from existing `validationUtils.ts` department groupings. No data change |
| Instrument icon set | Use musical instrument icons (Lucide has basic ones; supplement with SVG set) to visually represent instruments alongside text. Teacher card shows a violin icon next to "כינור" | Medium | Requires sourcing/creating ~8-12 icons for major families. Lucide already in stack |
| Dashboard with character | Dashboard is the first thing users see every day. Give it a warm greeting ("בוקר טוב, יונה"), a school-year progress bar, and summary cards with subtle musical motifs in the iconography | Medium | Greeting is a personalization moment. Uses existing auth context for user name |
| Soft gradient header strips on entity detail pages | Teacher detail page header: name, role badge, instrument badge, avatar initial — on a warm gradient (amber for strings teacher, blue for winds, etc.) tied to instrument family | Low | Pure CSS — no data change. High visual impact |
| Avatar initials with consistent color hashing | Every teacher and student gets a generated avatar: initials on a deterministically-colored background (based on name hash). Never two adjacent cards with the same color | Low | ~15 lines of utility logic. Eliminates the "no photo" gray blob problem |
| Smooth tab transitions | Tab content switches with a subtle fade/slide (100ms). Currently instant. Framer Motion is already in the stack | Low | One animated div wrapper on tab content. Framer Motion already installed |
| Inline stat callouts on list pages | At the top of the Students list: "127 תלמידים · 23 כינורנים · 4 ממתינים לאישור". Small, scannable, saves a trip to the dashboard | Medium | Requires aggregate query or client-side count from loaded data |
| Progress indicators on multi-step forms | Import Data and Ministry Reports are multi-step. A step indicator (1/3 → 2/3 → done) with animated progress reduces anxiety | Low | Import page already has stages; visual step indicator is pure UI |
| Contextual help tooltips | Admin-only fields (Ministry Reports thresholds, settings) should have an info (ℹ) icon with a brief Hebrew tooltip explaining the field. Users are music educators, not software people | Low | shadcn/ui Tooltip component. No logic |
| Visual schedule conflict indicator | In teacher/student schedule tabs, conflicting time slots should glow red immediately, not just after save. Currently relies on server validation | High | Requires client-side conflict detection — skip for pure visual phase; flag for next milestone |
| Print-optimized styles for ministry reports | The MinistryReports page generates PDFs, but users also print the web view. A `@media print` stylesheet that hides nav, formats cleanly | Low | CSS-only |
| "Last updated" metadata on detail pages | "עודכן לפני 3 ימים" beneath the entity name. Builds trust and answers "is this current?" | Low | `date-fns` already in stack. Format `updatedAt` field |
| Collapsible sidebar | A toggle to collapse the sidebar to icon-only mode for more horizontal space. SidebarContext already exists for open/close | Medium | Adds icon-only mode to existing Sidebar.tsx |
| Keyboard shortcut discoverability | A `?` modal showing available keyboard shortcuts (N = New record, / = Search, Esc = close modal). The shortcuts themselves may already exist informally | Medium | Modal is Low effort; implementing shortcuts is Medium |
| Subtle musical texture in empty states | Empty state illustrations use simple music-themed SVGs (a music note, a treble clef, a simple staff) — not clip art, but minimal and tasteful | Medium | Custom SVG illustrations. One set, reused across all empty states with different copy |

---

## Anti-Features

Explicitly excluded from this redesign. Including any of these introduces risk without
proportional value for a v2.0 visual milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Page-level slide/zoom transitions | Route-change animations that move entire pages feel heavy and nauseating in RTL. Monday.com uses them sparingly on a LTR canvas | Fade-in only (opacity transition). Fast, neutral, RTL-safe |
| Infinite scroll on list pages | Replaces predictable pagination. Teachers need to find row 47 in a sorted list; infinite scroll destroys that | Keep existing pagination. Improve its visual design |
| Dashboard widget drag-and-drop | Customizable dashboards are a major complexity spike. The current dashboard has a fixed, sensible layout | Design the fixed layout well. Don't make it customizable yet |
| Dark mode | Hebrew fonts at this stage are not dark-mode tested. RTL layouts have subtle rendering differences. The school's identity is warm — dark mode works against that | Ship a light-mode-first design. Dark mode can be v3.0 |
| Animated charts and data visualizations | Chart.js is in the stack but not in active use. Adding animated charts introduces scope creep and distracts from the redesign's core goal | Use static summary numbers with text and badges. Reserve charts for a dedicated analytics milestone |
| Rich text / WYSIWYG in forms | No field in the current schema is a rich-text field. Adding one would require schema and backend changes | Plain textarea with Hebrew character counting if needed |
| Micro-interaction on every element | Hover transforms, button bounces, card lifts on every element create visual noise. Animation should be rare and purposeful | Use animation for three things only: tab transitions, toast entrance, modal entrance |
| Notification bell / in-app inbox | Real-time notifications require a backend notification system. Nothing currently emits notification events | The audit trail serves as the activity log. Don't build a notification system in this milestone |
| Onboarding tour overlays | Tooltip-based product tours (Shepherd.js, Intro.js) are complex, break on DOM changes, and feel patronizing to returning admins | Invest in good empty states and contextual help tooltips instead |
| Custom date picker | react-big-calendar and date-fns are already in the stack. The native or shadcn Popover+Calendar is sufficient and RTL-compatible | Use shadcn/ui Calendar (Radix-based, already partially present as Calendar.tsx) |

---

## Feature Dependencies

The following dependency order matters for execution. Build lower items first.

```
Design tokens (colors, spacing, typography, radius)
  → shadcn/ui component primitives (Button, Input, Select, Badge, Dialog, etc.)
    → Layout shell (Sidebar, Header, Layout, breadcrumbs)
      → Table component redesign (hover, sticky headers, pagination)
      → Form field system (labels, validation feedback, groupings)
      → Loading states (Skeleton, ErrorState, EmptyState)
        → List pages (Students, Teachers, Orchestras, etc.)
          → Detail pages (tabbed header with gradient, avatar, breadcrumb)
            → Dashboard (greeting, stat cards, musical iconography)
              → Special pages (MinistryReports, Import, Settings, AuditTrail)

Instrument color-coding requires design tokens to be finalized first
Avatar initials require the color system to exist
Tab transitions require the tab shell component to be redesigned first
```

---

## MVP Recommendation

For a v2.0 milestone that ships with genuine impact and zero regressions, prioritize in
this order:

**Must ship (core redesign):**
1. Design token system (warm palette, spacing scale, radius scale, shadow scale)
2. shadcn/ui component primitives replacing current headless UI components
3. Sidebar + Layout shell redesign
4. Table.tsx redesign (hover, sticky header, pagination copy improvement)
5. Skeleton loading states (replace all spinners)
6. Empty states with music-themed minimal SVG illustrations
7. Standardized error states with retry
8. Toast notification styling (RTL position, warm variants)
9. Badge and status chip standardization with instrument department colors
10. Detail page header pattern (gradient strip, avatar initials, breadcrumb)
11. Dashboard warm greeting + styled stat cards

**Ship if time allows (high-value, low-risk differentiators):**
- Smooth tab transitions (Framer Motion, already installed)
- "Last updated" metadata
- Avatar color hashing utility
- Print styles for MinistryReports

**Defer explicitly:**
- Visual schedule conflict detection (requires logic change — next milestone)
- Keyboard shortcuts (medium complexity, medium value)
- Collapsible sidebar (medium complexity, medium value)
- Inline stat callouts on list pages (requires aggregate data)

---

## Page-by-Page Surface Area

All 18 pages need redesign touches. No page is exempt from the token system and layout
shell changes, but some pages need more attention than others:

| Page | Redesign Intensity | Notes |
|------|-------------------|-------|
| Dashboard | High | First impression. Greeting, stat cards, iconography |
| Students list | High | Largest data table. Heaviest use |
| Teachers list | High | Second most-used list |
| Teacher detail (7 tabs) | High | Most complex form surface in the app |
| Student detail | High | Multiple tabs, schedule, bagrut integration |
| Login | Medium | Multi-tenant selector. Brand moment |
| Orchestras list | Medium | |
| Orchestra detail | Medium | |
| MinistryReports | Medium | Multi-step with progress indicator |
| ImportData | Medium | Multi-step with progress indicator |
| AuditTrail | Medium | Dense tabular data |
| Rehearsals | Low–Medium | |
| TheoryLessons | Low–Medium | |
| Settings | Low | Admin-only, low traffic |
| BagrutDetails | Low–Medium | |
| Profile | Low | |
| ForgotPassword / ResetPassword | Low | Auth-adjacent, rare use |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table stakes list | HIGH | These are the standard of every polished SaaS tool since 2020. Not speculative |
| Differentiators | HIGH | Based on direct codebase analysis (existing stack, schema knowledge) — all are feasible without new dependencies |
| Anti-features | HIGH | Based on existing constraints (RTL, Hebrew fonts, no backend notification system, no rich-text fields) |
| Page-by-page intensity | MEDIUM | Based on code structure knowledge; exact effort per page needs phase-level research |
| Music identity specifics (colors, icons) | MEDIUM | Instrument department groupings exist in validationUtils.ts; specific colors need design decision |

---

*Sources: Direct codebase analysis — STACK.md, ARCHITECTURE.md, CONCERNS.md, STATE.md,
component and page inventory. Domain knowledge of SaaS admin dashboard conventions
(Linear, Monday.com, Notion, Vercel dashboard, Stripe dashboard). No external search
required — all claims verifiable against existing codebase files.*
