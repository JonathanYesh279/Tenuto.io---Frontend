# Phase 6: Foundation - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Design token infrastructure and RTL correctness — zero visible change to end users. Installs CSS custom property layer, fixes RTL portal issues, cleans CSS overrides, upgrades packages. Everything subsequent builds on this base.

</domain>

<decisions>
## Implementation Decisions

### Color Palette
- Primary color family: deep coral/salmon — warm, approachable, distinctive
- Background: warm off-white (cream/ivory tint) — cozy, never sterile
- Sidebar: dark charcoal/navy — grounds the layout, Monday.com style contrast
- Semantic colors: warm variants — success: warm green, warning: amber, error: warm red, all tinted to match coral palette
- All semantic colors should feel part of the same warm family, not stock CSS colors

### Typography
- Font: Heebo (Google Fonts) — clean geometric sans-serif, most popular Hebrew web font
- Single font family for headings and body — hierarchy through weight and size only
- Heading weight: bold and confident (700-800) — strong visual hierarchy
- Body text: 16px comfortable — generous, easy to read, modern SaaS standard
- No display/accent font — Heebo throughout

### Spacing & Shape Language
- Corner roundness: well-rounded (12-16px) for cards, buttons, inputs — Monday.com style, soft and approachable
- Card elevation: subtle drop shadows — soft shadows lift cards off warm background, creates depth
- Spacing density: generous — lots of breathing room, premium feel, nothing cramped
- Table rows: comfortable height (48-56px) with generous padding — easier to scan

### Animation Philosophy
- Intensity: subtle and purposeful — ONLY modals, toasts, tabs, and page transitions. Everything else is instant
- Speed: fast (100-200ms) — animations felt, not watched
- Page transitions: quick opacity fade-in (100-150ms) — clean, RTL-safe
- Easing: ease-out — fast start, gentle stop, feels responsive and natural
- NO decorative motion on cards, list items, or hover effects beyond color shifts

### Claude's Discretion
- Exact HSL/hex values for the coral palette (within the coral/salmon family described above)
- Exact shadow depth values
- Typography scale steps (how many heading sizes between h1 and caption)
- Tailwind config structure for CSS variables
- Which Radix packages to install in what order
- How to bridge existing hardcoded Tailwind colors to new CSS variable tokens without visual regression

</decisions>

<specifics>
## Specific Ideas

- Monday.com's dark sidebar with warm content area — that specific contrast pattern
- Coral is the anchor — not bright red, not pale pink, but the warm salmon/coral zone
- "Zero visible change" is the Phase 6 success bar — tokens must map to existing visuals first, then later phases shift to new palette
- Heebo at 700-800 for headings should feel confident, like the app knows what it's doing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-foundation*
*Context gathered: 2026-02-17*
