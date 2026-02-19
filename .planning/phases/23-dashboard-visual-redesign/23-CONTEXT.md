# Phase 23: Dashboard Visual Redesign - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete visual redesign of the dashboard page and underlying token system to match the reference UI (`22-REFERENCE-UI.md`). The reference is the spec — all visual decisions (colors, rounding, layout, fonts, charts, cards, surfaces) come from it. Entity names and data stay from the real app. This phase also resets the style system tokens so future pages can inherit the new design language.

Scope: Dashboard page + token system reset. Other pages (list, detail, forms) will be handled in separate phases when the user provides additional reference mockups.

</domain>

<decisions>
## Implementation Decisions

### Color & tone direction
- Primary color is **indigo (#6366f1)** — replaces black. All primary actions, active states, focus rings use indigo
- Stat card backgrounds are **entity-colored pastels** — indigo-50/50, amber-50/50, sky-50/50, emerald-50/50 with matching tinted borders
- Trend badges use white/80 backgrounds with entity-colored text
- Overall temperature is **warm and colorful** — slate-50 content background, white cards, pastel tints
- Dark mode support **included** — the reference has full dark mode classes (dark:bg-background-dark, dark:bg-sidebar-dark, etc.)

### Font system
- Switch from **Heebo** to **Assistant** as primary font (Hebrew-optimized, same as reference)
- **Plus Jakarta Sans** as secondary/fallback (Latin text, headings)
- Font weights: 300-800 (Assistant), 400-800 (Plus Jakarta Sans)
- Body text uses Assistant; extrabold (800) for large numbers and headings

### Shape & surface treatment
- Corner radius **dramatically increased** — DEFAULT: 12px, xl: 18px, 2xl: 24px, 3xl: 32px
- Cards are **back** — full card wrappers with `bg-white rounded-3xl shadow-sm border border-slate-100`
- Stat cards use `rounded-3xl` with entity-colored pastel backgrounds and thin tinted borders
- Shadows are **decorative again** — `shadow-sm` on cards, `shadow-lg` on logo, `shadow-xl` on chart tooltips, `shadow-2xl` on FAB
- Avatars use `rounded-xl` (not rounded-full) — square-ish with large rounding

### Dashboard layout
- **12-column grid** with 9:3 split — main content (col-span-9) + right sidebar column (col-span-3)
- **Stat cards row:** 4 cards in `grid-cols-4` — students (indigo), teachers (amber), orchestras (sky), rehearsals (emerald)
- **Charts section:** 2-column grid below stats — financial trends (line chart) + attendance (bar chart) side by side
- **Teacher performance table:** Below charts — avatars, departments, student counts, star ratings, status badges
- **Right sidebar widgets:** Calendar, agenda/schedule, messages — stacked vertically

### Charts (implement with real data)
- **Financial trends line chart** — monthly income vs. expenses, SVG smooth curves with chart-blue (#BAE6FD) and chart-purple (#C7D2FE)
- **Attendance bar chart** — daily attendance (present vs. absent), paired bars with chart-yellow (#FDE047) and chart-blue
- **Student demographics donut chart** — concentric rings showing gender/category split with chart-blue and chart-yellow
- Wire to actual API data; if backend endpoints don't exist, use realistic mock data with TODO comments

### Sidebar
- **White/light sidebar** — replaces dark charcoal (`--sidebar: white`)
- Active nav item: `rounded-xl bg-primary/10 text-primary font-bold`
- Inactive: `text-slate-500 hover:bg-slate-50`
- Category labels: `text-[10px] font-bold text-slate-400 uppercase tracking-widest`
- Logo: indigo square with icon + conservatory name + version tag

### Header
- White background, `h-20`, border-bottom separator
- Search input: `bg-slate-100 rounded-2xl` with search icon
- Notification bell with red dot indicator
- User profile: avatar (rounded-xl) + name + role label

### Table style
- White card container with `rounded-3xl shadow-sm border`
- Header: `bg-slate-50/50` with `text-[10px] font-bold uppercase tracking-widest` column labels
- Rows: `hover:bg-slate-50/50 transition-colors`
- Teacher column: avatar (rounded-xl) + name
- Rating: star icon + numeric score
- Status: colored pill badges (emerald for active)

### Icons
- **Keep Phosphor** (NOT Material Symbols) — 217 files already migrated; Phosphor provides same fill/outline weight system
- Match the reference's visual density using Phosphor equivalents
- Active sidebar nav: `weight="fill"`, inactive: `weight="regular"` (same pattern as v3.0)

### Claude's Discretion
- Chart library choice (hand-rolled SVG vs. Recharts vs. other)
- Exact token values for the full slate scale (slate-50 through slate-900)
- How to structure the font loading (Google Fonts CDN vs. self-hosted)
- How to handle chart tooltip positioning and interaction
- Calendar widget implementation (static vs. functional)
- Exact shadow token values beyond what the reference shows
- Which existing dashboard components to preserve/adapt vs. rewrite
- How to structure the token reset for maximum reuse by future page phases

</decisions>

<specifics>
## Specific Ideas

- Reference file: `.planning/phases/22-visual-architecture-rewrite/22-REFERENCE-UI.md` — this IS the visual spec. Match it pixel-for-pixel on the dashboard
- The reference includes dark mode toggle (FAB button bottom-left) — implement the toggle and full dark mode support
- Calendar widget shows day-of-week Hebrew headers (א ב ג ד ה ו ש) — real calendar, not just visual
- Agenda items are color-coded by time slot (indigo, amber, sky) — these should map to real upcoming events/rehearsals
- Messages/notifications panel shows avatar + name + timestamp + preview — wire to real data if available, mock if not
- The reference uses `hide-scrollbar` CSS utility — custom scrollbar hiding for overflow areas
- Teacher performance table: "הצג הכל" link at top — links to full Teachers list page

</specifics>

<deferred>
## Deferred Ideas

- List pages (Teachers, Students, Orchestras) — user will provide separate reference mockups
- Detail pages (entity detail/dossier views) — waiting for reference
- Form pages — waiting for reference
- Auth pages (Login, ForgotPassword, ResetPassword) — no reference provided yet

</deferred>

---

*Phase: 23-dashboard-visual-redesign*
*Context gathered: 2026-02-19*
