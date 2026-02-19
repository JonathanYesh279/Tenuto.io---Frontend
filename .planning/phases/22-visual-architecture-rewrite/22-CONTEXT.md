# Phase 22: Visual Architecture Rewrite - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Structural recomposition of the entire application — shape language, button system, icon system, card wrapper removal, and page archetype implementation with asymmetry and dominance rules. The app stops looking like a styled template and starts looking like a product with authored identity. Architectural rules defined in `.planning/ARCHETYPES.md`.

</domain>

<decisions>
## Implementation Decisions

### Color & tone direction
- Entity pastel colors (teacher-blue, student-green, orchestra-purple) are **kept but subdued** — thin accent lines, badge tints, subtle indicators. No full card backgrounds or pastel-filled surfaces
- Sidebar goes **dark (near-black)** — deep charcoal, high contrast against white content area. Strong architectural anchor
- Primary button color is **black** — all primary actions across all pages use black buttons. Authoritative, decisive. Linear/Vercel direction
- Overall page temperature is **cool neutral** — pure grays with no warm tint. Content area is true white or cool gray. Clean, precise, modern

### Shape vocabulary
- Corner radius is **sharp (2-4px)** — barely rounded, decisive, architectural. No soft or medium rounding
- Border treatment is **selective** — borders on tables and form inputs where functional, spacing-only for page sections. No decorative borders
- Table rows use **hairline dividers + strong hover** — thin horizontal lines between rows for structure, plus a bold background shift on hover for interactivity
- Avatars remain **circles** — full-round, contrasting with the sharp UI elements around them. The one organic shape in an architectural system

### Icon style
- Icon fill style is **filled (solid)** — strong visual presence, icons are landmarks, not whispers
- Icon library switches from **Lucide to Phosphor Icons** — consistent filled variants for every icon, clean swap
- Sidebar nav icons use **filled only for active item** — active nav gets filled Phosphor icon, inactive items get outlined Phosphor variant. State communicated through icon fill
- Icon sizing is **Claude's discretion** — context-dependent sizing (smaller in dense tables, larger in navigation)

### Claude's Discretion
- Icon sizing per context (compact in tables, standard in nav/toolbars)
- Exact shadow values for interaction layers (modals, popovers, dropdowns)
- Typography scale choices for the three-level hierarchy (display, section, body)
- Dashboard dominant zone composition and panel arrangement
- Detail page identity block layout specifics
- Exact cool gray values and token definitions

</decisions>

<specifics>
## Specific Ideas

- Black buttons + dark sidebar + cool neutrals = Linear/Vercel aesthetic direction
- Circles for avatars as the ONE organic shape — everything else is sharp and architectural
- Sidebar active state communicated through TWO channels: background pill AND filled icon (inactive = outlined icon)
- Entity colors don't disappear — they become subtle accents, not dominant surfaces

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-visual-architecture-rewrite*
*Context gathered: 2026-02-19*
