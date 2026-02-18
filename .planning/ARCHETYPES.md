# Page Archetypes — Tenuto.io Structural Design System

**Defined:** 2026-02-18
**Purpose:** Structural composition rules for every page type. This is not a component library — it defines how pages are built, what dominates, and how hierarchy is expressed.

---

## Global Shell

**Sidebar:** Architectural, not navigational. Visually anchors the entire layout — removing it should feel like removing a load-bearing wall. Tonally distinct from content area: darker or more saturated, never the same surface tone. Active state is unmistakable — solid background, strong contrast. Navigation is secondary to presence.

**Header:** Minimal. Page identity + breadcrumb only. Not a toolbar zone. Never competes with page content for attention.

**Content area:** The stage. Flat, neutral surface. Everything inside serves the page archetype's rules, not a shared template.

---

## Surface Strategy

Elevation is earned, not decorative.

- **Flat by default.** Page sections, tables, data zones — all sit on the same surface plane. No cards wrapping content that doesn't float.
- **Elevation only for interaction layers.** Modals, popovers, dropdowns, and toasts. These genuinely float above the page and earn their shadow.
- **Sections separated by spacing and typography, not boxes.** A heading + whitespace gap creates section identity. Not a card border. Not a background shift for every group.
- **Minimal shadow use.** Shadows exist only on true overlays. Page-level content has zero shadow.

---

## Contrast Zones

- **Sidebar vs. content:** Tonal break. Sidebar is a different world from the content area — different background tone, different text treatment. The boundary is felt, not just drawn.
- **Dominant zone tonal shifts:** The primary zone on each page may use a subtle background shift to establish hierarchy. This is the ONE zone per page that gets tonal emphasis.
- **Data surfaces are flat.** Tables sit on the page surface directly. No elevation, no card wrapper, no rounded container. The data IS the surface.

---

## Density Gradient

| Archetype | Density | Principle |
|-----------|---------|-----------|
| Dashboard | Medium | Readable at a glance, not packed. Key metrics breathe, supporting panels tighter |
| List pages | High | Tight rows, minimal vertical spacing, maximum data per viewport |
| Detail pages | Mixed | Large identity zone (low density) + dense data sections (high density) |
| Management/forms | Compact | Operational density. No decorative spacing. Fields close, sections functional |

---

## Archetype 1: Dashboard (Command Center)

**Density:** Medium.

**Dominant zone:** A single, unmissable primary metric area — not 6 equal cards. One thing screams "this is the number that matters." Others are subordinate. May use a tonal background shift to separate it from the rest.

**Structure:**
- Top: Primary data zone — large, bold, asymmetric. Left-heavy or full-width with THE key insight
- Middle: Operational panels — 2-3 unequal columns. Tallest column holds the most important content. No grid symmetry
- Bottom/side: Contextual feed — activity, upcoming, recent. Clearly tertiary — smaller, denser, less contrast

**What it's NOT:** A grid of equal stat cards. No widget feeling. No decorative illustrations. No pastel card backgrounds.

**Contrast mechanism:** Scale difference. The primary zone is physically 3-4x larger than any single subordinate panel.

---

## Archetype 2: List Page (Data Table)

**Density:** High.

**Dominant zone:** The table IS the page. Everything above the table exists to serve the table.

**Structure:**
- Top strip: Page identity + aggregate metrics — ONE line, not a hero zone. Count + key stat, inline, not boxed
- Toolbar: Flush with table. Filters, search, actions in a single dense row. No card wrapper. No vertical gap between toolbar and table
- Table: Edge-to-edge within content area. No card wrapper. No rounded corners. No shadow. Rows are the primary content. Strong row hover — clear, high-contrast background shift, not soft glow
- Below table: Pagination, tight, functional

**What it's NOT:** Hero zone + gap + card-wrapped table. No stat cards above data. The table isn't inside anything — it IS the thing.

**Contrast mechanism:** Density and repetition give the table visual weight. Toolbar is visually quiet — infrastructure, not content.

**Data zone rules:** Flat surface. No rounded corners on table container. Strong, decisive row hover. Zero shadow.

---

## Archetype 3: Detail Page (Dossier)

**Density:** Mixed — large identity (low density), dense data sections (high density).

**Dominant zone:** Identity header — who/what this entity IS. Name, key identifier, status. Not a gradient card — a structured identity block. May use a tonal background shift to anchor it.

**Structure:**
- Identity block: Entity name at display scale. Key metadata inline (not in a card). Status prominently placed. Photo/avatar if applicable. Most visual weight on the page
- Tab bar: Structurally attached to the identity block, not floating. Feels like sections of the same document
- Tab content: Structured sections with clear hierarchy. Not equal-weight cards stacked vertically. Primary sections visually heavier than secondary ones. Data tables within tabs follow List Page rules — flat, dense, no card wrapper

**What it's NOT:** A gradient banner + floating tab bar + stacked cards. The dossier is one continuous document, not a collection of boxes.

**Contrast mechanism:** Typography scale. Identity block uses display-scale type. Section headers subordinate. Content at body scale. Three distinct type levels on one page.

---

## Archetype 4: Management Page (Operations Console)

**Density:** Compact and operational.

**Dominant zone:** The task area. Whatever the user came here to DO is front and center with no decoration.

**Structure:**
- Header: Page title + brief description. No hero, no stats, no illustration
- Task zones: Stacked sections with clear labels. Each section self-contained. Dense forms, compact controls. No card wrappers around individual settings
- Actions: Prominent, positioned at task completion point (not floating at top)

**What it's NOT:** A settings page that looks like a marketing page. No cards wrapping single settings. No decorative spacing.

**Contrast mechanism:** Whitespace as structure. Sections separated by intentional negative space and typography, not by card borders or dividers. The absence of decoration IS the design.

---

## Cross-Archetype Rules

1. **No universal card wrapper.** Cards only when content genuinely floats (modals, popovers). Page sections are not cards.
2. **Asymmetry is default.** Equal-width columns only when data demands it. Layout zones have unequal weight.
3. **Density follows function.** Data pages dense. Input pages compact. Dashboard medium. Never uniform.
4. **One dominant zone per page.** Every page has exactly one thing that hits you first. If everything is equal, nothing is dominant.
5. **Toolbar = infrastructure, not content.** Toolbars are visually quiet — they serve the content below them.
6. **Flat data surfaces.** Tables and data zones: no rounded corners, no shadows, no card wrappers. Strong hover, not soft glow.
7. **Elevation is interaction-only.** Shadows reserved for modals, popovers, dropdowns. Zero decorative elevation on page content.
8. **Sidebar is architectural.** Tonally distinct, visually heavy, structurally anchoring. Not a collapsible menu — a permanent fixture.

---

*Defined: 2026-02-18*
*This document is the structural foundation for Phase 22 and all subsequent visual work.*
