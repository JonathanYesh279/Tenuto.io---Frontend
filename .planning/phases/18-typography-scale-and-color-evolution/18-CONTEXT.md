# Phase 18+ : Full Visual Redesign - Context

**Gathered:** 2026-02-18
**Status:** Ready for phase rewrite — informs new phases 18-21

<domain>
## Phase Boundary

Transform Tenuto.io from a styled admin template into a production-grade SaaS product with a completely different visual identity. This is a **style transplant** — the visual design language, layout architecture, spacing, and color treatment change dramatically, while all data entities, column names, section labels, and business logic remain untouched.

**Reference:** SchoolHub school management dashboard (8 screenshots captured 2026-02-18)
**Reference location:** `/mnt/c/Users/yona2/Pictures/Screenshots/צילום מסך 2026-02-18 1912*.png`

**Foundation:** Phases 16-17 (token layer + primitive components) are shipped and kept as foundation.

</domain>

<decisions>
## Implementation Decisions

### Sidebar
- Switch from dark warm sidebar to **light/white sidebar**
- Grouped navigation sections with small category labels (e.g., MENU, OTHER)
- Active item gets a soft colored background pill — not a dark highlight
- Lightweight icons + text labels
- Clean brand logo at top

### Color Palette
- Move from monochrome coral to **multi-color pastel system**
- Coral becomes one accent color among several — not the dominant identity
- Each entity type gets its own distinct pastel color:
  - Teachers → one color
  - Students → another color
  - Orchestras → another color
  - (Claude assigns specific pastel hues during planning)
- Entity colors are consistent across all pages (stat cards, badges, accents)
- Overall palette: light, airy, pastel — not dark, not heavy

### Dashboard Layout
- **3-column layout**: main content (left/center) + persistent right column
- Right column contains: calendar widget, upcoming items, recent activity/messages
- Top row: colorful stat cards (one per entity metric) with large bold numbers, small labels, percentage badges
- Below stats: charts and data sections with clean styling
- Bottom: task tables or activity logs
- Stat cards use **distinct pastel background per entity type**

### List Pages (Teachers, Students, Orchestras)
- **Hero stats zone** at top — aggregate metrics for that entity (count, trends)
- Compact filter toolbar below hero: search input + dropdown filters in one row
- Data-dense table below filter bar
- Tables get **full visual treatment**:
  - Avatars alongside names (where entity has photos)
  - Colored status badges (not plain text)
  - Icon-based action buttons (edit, delete) — not text links
- Clear vertical flow: hero → filters → data

### Detail Pages
- **Keep existing tab structure** — tabs work well for entity detail
- Restyle tabs and content with **stronger visual hierarchy**
- Profile/header zone gets bolder treatment
- Tab content sections get clearer visual separation

### Forms
- **Restructure with visual sections** — not just stacked fields
- Clear section grouping with visual dividers or section headers
- Form hierarchy: section title → fields → section title → fields
- Not a modal dump of fields — intentional visual rhythm

### Table Design
- Avatars alongside entity names
- Colored status badges with distinct colors per status
- Icon-based action buttons (edit, delete, view)
- Clean, well-spaced rows
- Column headers with subtle styling

### Overall Feel
- **Completely different** from current version — should feel like a different product
- Light, airy backgrounds (white/very light gray)
- Cards with subtle borders — not heavy shadows
- Data is dominant — numbers are the biggest elements
- Pastel color accents — not monochrome
- Clear zoning on every page — no ambiguity about where you are
- Professional but friendly — confident, not heavy

### Critical Constraint: Style Transplant Only
- **Take from reference:** layout structure, visual treatment, spacing, hierarchy, zoning, card design, badge styling, overall confidence level
- **Keep from Tenuto:** all entity names, column names, section headings, labels, page structure, data relationships, Hebrew RTL, business logic
- This is NOT a content redesign — it is a visual language transformation

### Claude's Discretion
- Exact pastel hue assignments per entity
- Specific spacing values and density adjustments
- Chart styling and data visualization details
- How to handle pages without clear reference parallels
- Typography weight and size specifics within the "bold hierarchy" direction
- How to adapt 3-column layout for Hebrew RTL

</decisions>

<specifics>
## Specific Ideas

- "I want it to feel like SchoolHub — structural confidence, clear zoning, data dominance"
- "Similar to monday.com in layout confidence and non-template feel — not similar visually"
- Each entity type gets a consistent color identity across all pages
- Stat cards should be the first visual landmark on dashboard and list pages
- Light sidebar replaces current dark warm sidebar
- Tables need avatars, colored badges, and icon actions — full treatment
- "If someone sees one screen, it should feel like a serious SaaS product"
- "This should feel like a product maturing to a new level"
- Dashboard gets a right column with calendar/activity widgets
- The transformation must be visible in screenshots

## Reference Design Patterns (from SchoolHub screenshots)

1. **Stat cards row** — pastel-colored cards at top, large bold number + small label + trend badge
2. **3-zone dashboard** — main content + right sidebar column
3. **Light sidebar** — white background, grouped nav sections, active pill highlight
4. **Clean table design** — avatar + name, colored badges, icon actions, compact rows
5. **Hero zones on list pages** — chart or aggregate stats above the table
6. **Filter toolbars** — search + dropdown filters in one compact row
7. **Multi-color palette** — distinct pastels per category/entity
8. **Cards with subtle borders** — not heavy shadows, not flat
9. **Data dominance** — numbers are the biggest visual element
10. **Clear vertical flow** — each page has distinct zones stacked predictably

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within milestone scope

</deferred>

---

*Phase: 18-typography-scale-and-color-evolution (scope being redefined)*
*Context gathered: 2026-02-18*
*Note: This context captures the full v2.1 redesign vision — phases 18-21 will be rewritten to deliver this transformation*
