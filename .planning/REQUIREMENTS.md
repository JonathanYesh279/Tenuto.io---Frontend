# Requirements: Tenuto.io v2.1

**Defined:** 2026-02-18
**Core Value:** Administrators can efficiently manage their conservatory — with a visual identity that feels production-grade, confident, and authored.

## v2.1 Requirements

Requirements for visual identity transformation. Each maps to roadmap phases.

### Token Foundation

- [ ] **TOKEN-01**: Surface elevation scale defined with 4 semantic levels (base, raised, overlay, floating) as CSS custom properties
- [ ] **TOKEN-02**: Warm neutral 9-step color scale defined as CSS custom properties replacing ad-hoc neutral values
- [ ] **TOKEN-03**: Semantic shadow scale with 5 levels (0-4) using warm-tinted box-shadow values mapped to Tailwind utilities
- [ ] **TOKEN-04**: Motion preset tokens centralized in TypeScript module with spring configs for snappy, smooth, and bouncy profiles
- [ ] **TOKEN-05**: Dual color system reconciled — all hardcoded `primary-NNN` hex references migrated to CSS custom property system

### Typography System

- [ ] **TYPO-01**: 6 semantic typography tokens defined (display, heading, subhead, body-lg, body, caption) with size, weight, line-height, and letter-spacing
- [ ] **TYPO-02**: Page headings use Heebo 700-800 weight with confident sizing that creates clear hierarchy
- [ ] **TYPO-03**: UI body text uses tighter sizing and compact spacing compared to v2.0
- [ ] **TYPO-04**: Deliberate vertical spacing rhythm between text blocks is consistent across all pages

### Color Evolution

- [ ] **COLOR-01**: Coral accent restricted to primary CTAs, active navigation, and focus rings only
- [ ] **COLOR-02**: Supporting surfaces (cards, backgrounds, hover states) use neutral scale instead of coral tints
- [ ] **COLOR-03**: Badge components use a broader, expressive color palette — not uniformly coral
- [ ] **COLOR-04**: Detail page gradient headers use deeper, more confident color combinations

### Surface Hierarchy

- [ ] **SURF-01**: Sidebar, header, and content area have visually distinct elevation levels
- [ ] **SURF-02**: Cards and raised surfaces use warm-tinted box-shadows for depth (not flat borders)
- [ ] **SURF-03**: Modal and overlay surfaces are visually elevated above page-level surfaces
- [ ] **SURF-04**: Transitions between surface zones feel layered and dimensional

### Information Density

- [ ] **DENS-01**: Table rows use compact density (40-44px height) on all list pages
- [ ] **DENS-02**: List page spacing is tighter with more data visible without scrolling
- [ ] **DENS-03**: Form and detail pages maintain breathing room (selective density preserved)
- [ ] **DENS-04**: List pages have a defined toolbar zone grouping search, filters, and bulk actions

### Motion System

- [ ] **MOTN-01**: Buttons and interactive cards have spring-based hover and press feedback
- [ ] **MOTN-02**: List pages use staggered entrance animations for rows/cards
- [ ] **MOTN-03**: Modal open/close uses spring physics instead of linear fade
- [ ] **MOTN-04**: All directional animations are RTL-safe (Y-axis + opacity, no unguarded X-axis)
- [ ] **MOTN-05**: All animations respect `prefers-reduced-motion` via useReducedMotion() guards

### Visual Personality

- [ ] **PERS-01**: Section headers have distinctive styling with accent marks, borders, or background treatments
- [ ] **PERS-02**: Status and instrument badges have custom branded design, not generic colored pills
- [ ] **PERS-03**: Empty states have branded personality and distinctive visual treatment
- [ ] **PERS-04**: Section dividers create intentional visual rhythm between content blocks
- [ ] **PERS-05**: Pages have recognizable visual landmarks that feel authored as "Tenuto identity"

### Layout Composition

- [ ] **COMP-01**: Consistent page scaffolding pattern defined and applied (header → toolbar → content zones)
- [ ] **COMP-02**: Vertical spacing between page sections follows defined, repeatable rules
- [ ] **COMP-03**: Card layouts follow grid standards with consistent gap and padding values
- [ ] **COMP-04**: All entity pages (list, detail, form) follow the same structural template adapted to content type

### Navigation

- [ ] **NAV-01**: Sidebar navigation has stronger visual grouping and active state emphasis
- [ ] **NAV-02**: Active page state is unmistakable through color, weight, and background treatment

### Data Presentation

- [ ] **DATA-01**: Primary data values (names, titles, key numbers) use stronger typographic emphasis than secondary metadata
- [ ] **DATA-02**: Metadata uses muted styling and smaller scale consistently

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Motion

- **MOTN-F01**: Page route transitions with shared element animations
- **MOTN-F02**: Scroll-triggered reveal animations on dashboard cards
- **MOTN-F03**: Skeleton-to-content morph transitions

### Advanced Branding

- **BRAND-F01**: Custom illustration system for empty states and onboarding
- **BRAND-F02**: Animated logo/icon set for loading states
- **BRAND-F03**: Sound design for key interactions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Dark mode | Hebrew fonts not dark-mode tested, warm identity works against it |
| Functional changes | Purely visual — no new features, API calls, or data model changes |
| New page creation | All pages exist; this milestone transforms their visual expression |
| Tailwind v4 migration | Breaking changes with shadcn/ui, CSS-first config rewrite — no benefit for this scope |
| `motion` v12 package rename | Import churn across 5+ files with no feature gain |
| Custom font additions | Heebo covers all weight needs; adding fonts increases load time |
| i18n preparation | Hebrew-only product, no translation infrastructure needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOKEN-01 | — | Pending |
| TOKEN-02 | — | Pending |
| TOKEN-03 | — | Pending |
| TOKEN-04 | — | Pending |
| TOKEN-05 | — | Pending |
| TYPO-01 | — | Pending |
| TYPO-02 | — | Pending |
| TYPO-03 | — | Pending |
| TYPO-04 | — | Pending |
| COLOR-01 | — | Pending |
| COLOR-02 | — | Pending |
| COLOR-03 | — | Pending |
| COLOR-04 | — | Pending |
| SURF-01 | — | Pending |
| SURF-02 | — | Pending |
| SURF-03 | — | Pending |
| SURF-04 | — | Pending |
| DENS-01 | — | Pending |
| DENS-02 | — | Pending |
| DENS-03 | — | Pending |
| DENS-04 | — | Pending |
| MOTN-01 | — | Pending |
| MOTN-02 | — | Pending |
| MOTN-03 | — | Pending |
| MOTN-04 | — | Pending |
| MOTN-05 | — | Pending |
| PERS-01 | — | Pending |
| PERS-02 | — | Pending |
| PERS-03 | — | Pending |
| PERS-04 | — | Pending |
| PERS-05 | — | Pending |
| COMP-01 | — | Pending |
| COMP-02 | — | Pending |
| COMP-03 | — | Pending |
| COMP-04 | — | Pending |
| NAV-01 | — | Pending |
| NAV-02 | — | Pending |
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |

**Coverage:**
- v2.1 requirements: 39 total
- Mapped to phases: 0
- Unmapped: 39 ⚠️

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after initial definition*
