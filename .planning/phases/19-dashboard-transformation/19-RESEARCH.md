# Phase 19: Dashboard Transformation - Research

**Researched:** 2026-02-18
**Domain:** Dashboard layout architecture, stat cards, chart styling, widget composition, RTL 3-column layout, Framer Motion stagger animations
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dashboard Layout:**
- 3-column layout — main content (left/center) + persistent right column
- Right column contains: calendar widget, upcoming items, recent activity/messages
- Top row: colorful stat cards (one per entity metric) with large bold numbers, small labels, percentage badges
- Below stats: charts and data sections with clean styling
- Stat cards use distinct pastel background per entity type (entity color system already in place from Phase 18)

**Color Palette:**
- Multi-color pastel system already built (Phase 18 — CSS vars + Tailwind tokens)
- Each entity type has its own distinct pastel: students (violet), teachers (sky blue), orchestras (amber), rehearsals (rose), bagrut (green), theory (teal)
- Entity color vars: `--color-{entity}-bg` and `--color-{entity}-fg`, consumed as `bg-{entity}-bg` / `text-{entity}-fg`

**Prior decisions affecting this phase:**
- No new npm packages — framer-motion v10, Tailwind v3, CSS vars cover full scope
- Elevation via box-shadow only — never new z-index values
- Framer Motion `layout` prop must NOT be used on containers with Radix dropdown children
- [18-03]: StatsCard `coloredBg` prop applies entity iconBg class to Card wrapper
- [18-03]: StatsCard entity color entries use Tailwind utility names (`bg-students-bg`, `text-students-fg`)

### Claude's Discretion

- Exact pastel hue assignments per entity (already set in Phase 18)
- Specific spacing values and density adjustments
- Chart styling and data visualization details
- How to handle pages without clear reference parallels
- Typography weight and size specifics within the "bold hierarchy" direction
- How to adapt 3-column layout for Hebrew RTL

### Deferred Ideas (OUT OF SCOPE)

- Any changes to entity data, column names, section labels, or business logic
- New npm packages
- Routing changes
- Non-dashboard pages in this phase
</user_constraints>

---

## Summary

Phase 19 transforms the admin dashboard from a tab-based, single-column card grid into a 3-column, data-dominant layout. The architecture involves restructuring `src/pages/Dashboard.tsx` (the admin "overview" tab content specifically) into two zones: a wide main content area and a persistent right sidebar column. The stat cards in the top row need upgrading to use full colored backgrounds (not just icon tinting) — the `coloredBg` prop on `StatsCard` is the mechanism.

The right column contains three new widget components: a mini Hebrew calendar, an upcoming rehearsals/events list, and a recent activity feed. These widgets consume data already loaded by the dashboard's existing `loadDashboardData()` function — no new API calls are needed. The charts (InstrumentDistributionChart, ClassDistributionChart) move to the main column below the stats row, and the DailyTeacherRoomTable moves to prominent placement.

Framer Motion (v10, already installed) handles staggered entrance animations for stat card rows and activity list items. The safe pattern for RTL is `y: 16 → y: 0` + `opacity: 0 → 1` — no unguarded X-axis transforms.

**Primary recommendation:** Work entirely within Dashboard.tsx overview section. The 3-column grid is a CSS Grid restructure of the overview tab's JSX. No new page routing, no new data services needed, no new packages.

---

## Standard Stack

### Core (already installed, no additions needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v3 | Grid layout, entity color tokens, spacing | Already configured with entity color system |
| framer-motion | v10.16.4 | Staggered card entrance, activity list animations | Already installed, v10 API is stable |
| chart.js | v4.4.0 | Chart rendering engine | Already installed |
| react-chartjs-2 | v5.2.0 | React wrapper for Chart.js | Already installed |
| lucide-react | installed | Icons for widget headers | Already used throughout |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | v2.30.0 | Calendar date calculations in mini calendar widget | RTL-safe date utilities |
| clsx | installed | Conditional className merging in widgets | Consistent with existing pattern (used in StatsCard) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| chart.js + react-chartjs-2 | recharts | recharts NOT installed, chart.js is — use what's there |
| CSS Grid for 3-column | flex layout | Grid is semantically correct for fixed-width right sidebar; flex is trickier |
| HebrewCharts custom components | react-chartjs-2 | HebrewCharts uses hand-rolled SVG bars/donuts — adequate for bar lists, but chart.js/react-chartjs-2 gives real chart types (doughnut, bar) with less code |

**Installation:** No new packages needed. All dependencies are present.

---

## Architecture Patterns

### Recommended File Structure

```
src/pages/Dashboard.tsx                          ← Main file: restructure overview tab JSX
src/components/dashboard/
├── charts/                                      ← Existing, untouched
│   ├── InstrumentDistributionChart.tsx
│   ├── ClassDistributionChart.tsx
│   ├── DailyTeacherRoomTable.tsx
│   └── ...
├── widgets/                                     ← NEW folder for right-column widgets
│   ├── MiniCalendarWidget.tsx                   ← Uses existing ui/Calendar.tsx as base
│   ├── UpcomingEventsWidget.tsx                 ← Rehearsal list from existing state
│   └── RecentActivityWidget.tsx                 ← Activity feed from existing state
└── index.ts                                     ← Existing, add widget exports
src/components/ui/StatsCard.tsx                  ← Extend: large-number variant, trend badge styling
```

### Pattern 1: 3-Column Dashboard Grid (RTL)

**What:** CSS Grid with `grid-cols-[1fr_320px]` at desktop, single column on mobile. In RTL, the "right column" visually appears on the LEFT side of the screen (since RTL flips horizontal flow). The persistent widget column goes first in DOM order (which renders on the right in RTL with `dir="rtl"`).

**When to use:** Any dashboard layout requiring a persistent contextual sidebar column.

**The RTL grid insight:** In `dir="rtl"` context, CSS Grid columns render right-to-left. So `grid-cols-[1fr_320px]` puts the `1fr` main area on the left and the `320px` column on the right — but in RTL, the FIRST column in DOM order renders on the right. To get main content on the right (visual left in Hebrew) and widget column on left (visual right in Hebrew), put main content FIRST in DOM order.

```tsx
// Source: Tailwind CSS Grid docs — RTL grid column ordering
// In dir="rtl" context, grid columns fill right-to-left
// DOM order: [main content, right widgets] renders as [main RIGHT, widgets LEFT] in RTL
<div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6" dir="rtl">
  {/* Main content column - renders RIGHT (visual left in Hebrew layout) */}
  <div className="space-y-6">
    {/* stats row, charts, table */}
  </div>
  {/* Widget column - renders LEFT (visual right in Hebrew layout) */}
  <div className="space-y-4">
    {/* mini calendar, upcoming, activity */}
  </div>
</div>
```

**RTL Column Ordering Decision:** The SchoolHub reference shows the main content on the left and the widget panel on the right (LTR). In Hebrew RTL, this visual pattern means: main content on the right side of screen, widget panel on left side. DOM first element = RTL first position = right side. So: main content DOM-first, widgets DOM-second — this gives correct visual layout without any CSS tricks.

### Pattern 2: Staggered Stat Card Entrance (Framer Motion v10, RTL-safe)

**What:** Parent container variant with `staggerChildren`, child items use `y: 16 → y: 0` + `opacity: 0 → 1`. No X-axis transforms (RTL-safe, MOTN-04 compliance).

**When to use:** Stat card rows, activity list items, any list of parallel items (MOTN-02).

```tsx
// Source: Context7 framer-motion — containerVariants + itemVariants pattern
// RTL-safe: Y-axis only, no translateX
import { motion } from 'framer-motion'

const cardRowVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,  // 80ms between cards — purposeful but fast
      delayChildren: 0.05
    }
  }
}

const cardItemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  }
}

// Usage for stat cards row:
<motion.div
  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
  variants={cardRowVariants}
  initial="hidden"
  animate="visible"
>
  {statsCards.map((card, i) => (
    <motion.div key={i} variants={cardItemVariants}>
      <StatsCard {...card} coloredBg />
    </motion.div>
  ))}
</motion.div>
```

**Timing rationale:** 80ms stagger for 6 cards = last card appears 480ms after first, total sequence under 700ms including spring settle. Aligns with project's "purposeful-and-limited" animation philosophy.

### Pattern 3: StatsCard Full-Color Variant

**What:** The existing `StatsCard` has a `coloredBg` prop that applies the entity's `iconBg` class to the Card wrapper. For Phase 19, the stat cards should use `coloredBg={true}` for full pastel card tinting. The icon inside gets the entity's `iconBg` nested, creating a slightly deeper tint for visual layering.

**When to use:** Top-row stat cards on dashboard overview.

```tsx
// Current StatsCard signature (already built in Phase 18):
<StatsCard
  title="תלמידים פעילים"
  value={stats.activeStudents.toString()}
  subtitle="תלמידים רשומים"
  icon={<Users />}
  color="students"          // uses entity token system
  coloredBg                 // applies bg-students-bg to Card wrapper
  trend={{ value: 5, label: "מהחודש שעבר", direction: "up" }}
/>
```

**StatsCard enhancement needed:** The current trend badge shows `+5%` inline next to the number. The reference design shows a distinct badge pill. A small tweak to the trend rendering to add `rounded-full px-2 py-0.5 text-xs font-bold` styling against a slightly deeper tint of the entity color will match the reference.

### Pattern 4: Mini Calendar Widget (RTL Hebrew)

**What:** A lightweight monthly calendar widget for the right column. The existing `src/components/ui/Calendar.tsx` already handles Hebrew month names, Hebrew day names (`DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']`), and navigation. It renders inside a Card component.

**Key insight:** The existing Calendar.tsx is a full-featured component. For the right column widget, it can be used directly (it already renders in a compact format inside a Card). No new calendar component is needed — just import and use it, passing rehearsal dates as events.

```tsx
// Existing Calendar.tsx already has this interface:
interface Event {
  id: string
  title: string
  time: string
  color: 'blue' | 'green' | 'orange' | 'purple'
  type: string
}
interface CalendarProps {
  events?: Record<string, Event[]>  // keyed by date string
}
```

### Pattern 5: Widget Card Pattern

**What:** Right column widgets follow a consistent structure: Card wrapper + header row (title + optional action link) + scrollable content area.

```tsx
// Widget card pattern — consistent across all 3 right column widgets
function Widget({ title, action, children }: WidgetProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action && (
          <button className="text-xs text-primary hover:text-primary/80 font-medium">
            {action.label}
          </button>
        )}
      </div>
      <div className="space-y-3 max-h-[280px] overflow-y-auto">
        {children}
      </div>
    </Card>
  )
}
```

### Anti-Patterns to Avoid

- **X-axis translate animations:** `x: -20 → x: 0` breaks in RTL (physical direction reversed). Always use `y` and `opacity` only (MOTN-04).
- **Framer Motion `layout` prop on containers with Radix children:** Causes layout thrashing with Radix dropdowns. Dashboard has dropdown menus — do NOT add `layout` to the main grid container.
- **Using recharts:** Not installed. Use chart.js via react-chartjs-2 OR the custom HebrewCharts components.
- **Adding new right-column API calls:** All data (rehearsals, students, activities) is already loaded in `loadDashboardData()`. Pass it down as props to widgets.
- **`opacity-relative` classes on white surfaces:** Decision from Phase 18 — use solid `gray-NNN` instead of `sidebar-foreground/10` etc. Same principle applies to widget content on Card backgrounds.
- **Inline `style={{ marginRight }}` on inner dashboard grid:** The outer Layout already handles sidebar margin via `style={{ marginRight }}`. The dashboard's inner grid should be pure Tailwind CSS Grid.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hebrew calendar widget | Custom month grid from scratch | `src/components/ui/Calendar.tsx` | Already built, Hebrew month/day names, event support |
| Chart bar visualizations | CSS bar charts | `chart.js` + `react-chartjs-2` | Installed, handles responsive sizing, tooltips, RTL axes |
| Stagger timing math | Manual `delay={i * 0.08}` on each item | `variants` + `staggerChildren` | Framer Motion handles timing; declarative variants are maintainable |
| Trend percentage badge | Custom green/red span | Extend StatsCard trend prop styling | Single source of truth for stat card display |
| Date formatting for calendar events | moment.js calls | `date-fns` (already installed) | Lighter, tree-shakeable, already in package.json |

**Key insight:** The right column widgets don't need new data fetching. Dashboard.tsx already loads `recentActivities`, `upcomingEvents`, and rehearsal data in `loadDashboardData()`. Widgets receive these as props — keeping them as pure display components.

---

## Common Pitfalls

### Pitfall 1: RTL Grid Column Visual Order Confusion

**What goes wrong:** Developer puts widget column first in DOM thinking it should appear "on the right" — but in RTL, DOM-first = visual-right, so widget ends up on right AND ALSO the main content is visually on the left, which is actually the correct Hebrew UX. Confusion arises because LTR mental model says "right column" = DOM-last.

**Why it happens:** The SchoolHub reference is LTR. Translating to RTL requires thinking in Hebrew reading order (right-to-left), not English.

**How to avoid:** In RTL with `dir="rtl"`, the **first** DOM child occupies the **rightmost** visual position. So for a `grid-cols-[1fr_320px]` layout: put main content FIRST (→ renders on right, dominant/primary), widgets SECOND (→ renders on left, secondary). This matches Hebrew reading flow where the most important content is on the right.

**Warning signs:** If the stat cards are appearing on the left side of screen, the DOM order is wrong.

### Pitfall 2: StatsCard `coloredBg` Class Collision

**What goes wrong:** `StatsCard` with `coloredBg` applies the entity's `iconBg` class to the Card wrapper AND also uses the same `iconBg` class for the icon container inside. At some entity colors, this creates insufficient contrast between the icon "chip" and the card background.

**Why it happens:** Both the wrapper Card and the icon container use the same `iconBg` token.

**How to avoid:** When `coloredBg` is true, the icon container should use a slightly deeper color — either `opacity-50` overlay or a white background with the entity fg color for the icon. Current StatsCard code (line 106-109) applies `colors.iconBg` to both; the icon container should switch to `bg-white/50` when `coloredBg` is active.

### Pitfall 3: Right Column Width on Mobile

**What goes wrong:** `xl:grid-cols-[1fr_320px]` breakpoint chosen too high — users on standard laptops (1280px viewport minus 280px sidebar = 1000px available) never see the 3-column layout.

**Why it happens:** The outer Layout adds `marginRight: 280px` (sidebar width) when sidebar is open. This means the content area is `viewport - 280px`. On a 1366px laptop: 1366 - 280 = 1086px content area, which is below `xl` (1280px).

**How to avoid:** Use `lg:grid-cols-[1fr_300px]` instead of `xl`. The breakpoint applies to the content area, not the viewport. 1086px > 1024px (lg breakpoint), so `lg` fires correctly when sidebar is open on a standard laptop.

**Verified calculation:**
- Laptop viewport: 1366px
- Sidebar width: 280px
- Available content: 1086px
- `lg` threshold: 1024px → fires ✓
- `xl` threshold: 1280px → does NOT fire ✗

### Pitfall 4: Dashboard Tab Structure — Only "Overview" Tab Changes

**What goes wrong:** Developer restructures entire `Dashboard.tsx` file with 3-column grid, breaking the Students/Schedule/Bagrut/Hours tabs which should remain single-column.

**Why it happens:** The 3-column layout only applies to the "overview" tab content. The other tabs (students, schedule, bagrut, hours) render their own chart components that don't belong in a 3-column grid.

**How to avoid:** The 3-column grid wraps ONLY the `{activeTab === 'overview' && (...)}` block content. The tab navigation structure and other tab render blocks are untouched.

### Pitfall 5: Chart.js RTL Axis Direction

**What goes wrong:** Chart.js renders bar/doughnut charts in LTR — text labels and X-axis flow left to right, which looks wrong for Hebrew dashboards.

**Why it happens:** Chart.js does not auto-detect `dir="rtl"` from the container.

**How to avoid:** The existing `HebrewCharts.tsx` already wraps divs with `dir="rtl"`. For react-chartjs-2 charts, add `options={{ rtl: true }}` to Bar/Doughnut components. But note: the existing charts (`InstrumentDistributionChart`, `ClassDistributionChart`) use the custom `HebrewCharts` (hand-rolled CSS bars/donuts), not react-chartjs-2. These render fine as-is.

---

## Code Examples

Verified patterns from codebase + official sources:

### 3-Column Dashboard Overview Layout

```tsx
// Dashboard.tsx — overview tab section only
// Uses lg breakpoint (see Pitfall 3 for why not xl)
{activeTab === 'overview' && (
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
    {/* Main column */}
    <div className="space-y-6">
      {/* Stat cards — staggered entrance */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
        variants={cardRowVariants}
        initial="hidden"
        animate="visible"
      >
        {STAT_CARDS.map((card) => (
          <motion.div key={card.key} variants={cardItemVariants}>
            <StatsCard {...card} coloredBg />
          </motion.div>
        ))}
      </motion.div>

      {/* Teacher room schedule (priority table) */}
      <DailyTeacherRoomTable />

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InstrumentDistributionChart schoolYearId={currentSchoolYear?._id} />
        <ClassDistributionChart schoolYearId={currentSchoolYear?._id} />
      </div>
    </div>

    {/* Right widget column */}
    <div className="space-y-4">
      <MiniCalendarWidget events={calendarEvents} />
      <UpcomingEventsWidget events={upcomingEvents} loading={loading} />
      <RecentActivityWidget activities={recentActivities} loading={loading} />
    </div>
  </div>
)}
```

### Framer Motion Variants (RTL-safe, MOTN-02 + MOTN-04)

```tsx
// Source: Context7 framer-motion — staggerChildren pattern
// RTL-safe: Y-axis only (MOTN-04 compliance)
import { motion } from 'framer-motion'

const cardRowVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
}

const cardItemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  }
}

// Activity list items — same variants, shorter stagger
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const listItemVariants = {
  hidden: { y: 8, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.15 } }
}
```

### Mini Calendar Widget (using existing Calendar.tsx)

```tsx
// src/components/dashboard/widgets/MiniCalendarWidget.tsx
import Calendar from '../../ui/Calendar'
import { Card } from '../../ui/Card'

interface MiniCalendarWidgetProps {
  events?: Record<string, any[]>
}

export function MiniCalendarWidget({ events = {} }: MiniCalendarWidgetProps) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">לוח שנה</h3>
      <Calendar events={events} />
    </Card>
  )
}
```

### Upcoming Events Widget

```tsx
// src/components/dashboard/widgets/UpcomingEventsWidget.tsx
import { Card } from '../../ui/Card'
import { Calendar, Music } from 'lucide-react'

interface Event {
  title: string
  date: string
  description: string
  isPrimary: boolean
}

export function UpcomingEventsWidget({ events, loading }: { events: Event[], loading: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">אירועים קרובים</h3>
      </div>
      <div className="space-y-3 max-h-[240px] overflow-y-auto">
        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-4">טוען...</div>
        ) : events.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">אין אירועים קרובים</div>
        ) : events.map((event, i) => (
          <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/40">
            <div className="w-7 h-7 rounded-md bg-orchestras-bg flex items-center justify-center flex-shrink-0">
              <Music className="w-3.5 h-3.5 text-orchestras-fg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.date} · {event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
```

### Entity Color Map for Stat Cards

```tsx
// Map dashboard stats to entity color tokens
// Place near top of Dashboard.tsx for stat card declarative config
const STAT_CARD_CONFIG = [
  { key: 'activeStudents', title: 'תלמידים פעילים', subtitle: 'תלמידים רשומים', icon: <Users />, color: 'students' as const },
  { key: 'staffMembers',   title: 'חברי סגל',       subtitle: 'מורים ומדריכים', icon: <GraduationCap />, color: 'teachers' as const },
  { key: 'activeOrchestras', title: 'הרכבים פעילים', subtitle: 'תזמורות וקבוצות', icon: <Music />, color: 'orchestras' as const },
  { key: 'weeklyRehearsals', title: 'חזרות השבוע', subtitle: 'מפגשים מתוכננים', icon: <Calendar />, color: 'rehearsals' as const },
  { key: 'activeBagruts',  title: 'בגרויות פעילות', subtitle: 'תלמידים בתהליך', icon: <Award />, color: 'bagrut' as const },
  { key: 'theoryLessonsThisWeek', title: 'שיעורי תאוריה', subtitle: 'השבוע', icon: <BookOpen />, color: 'theory' as const },
]
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-column tab grid (6 uniform cards) | 3-column layout with entity-colored cards | Phase 19 | Dashboard reads as SaaS command center |
| Inline activity feed below charts | Right sidebar column with dedicated widgets | Phase 19 | Persistent contextual info always visible |
| `color="blue"/"green"` legacy strings | `color="students"/"teachers"/...` entity tokens | Phase 18 | Consistent pastel system across all uses |
| HebrewCharts hand-rolled components | Kept as-is (chart.js available if needed) | — | HebrewCharts adequate for bar lists; react-chartjs-2 for new chart types |

**Not deprecated:**
- Tab navigation structure (`activeTab` state, tab buttons) — stays in place, 3-column grid wraps only the overview tab content
- `loadDashboardData()` data fetching — all data needed for widgets already loaded here
- `AdminHoursOverview` component — hours tab unchanged

---

## Open Questions

1. **Tab navigation removal decision**
   - What we know: Current dashboard has 5 tabs (overview, students, schedule, bagrut, hours)
   - What's unclear: Phase 19 spec says "3-column layout" but doesn't say whether the tabs stay. The success criteria say "dashboard feels like a command center" — tabs are more of a secondary nav than a command center UX pattern.
   - Recommendation: Keep tab navigation. The 3-column layout only applies to the overview tab. The other tabs (students, schedule, bagrut, hours) are specialized deep-dives that don't need 3-column treatment. If phase scope grows later, tabs can be removed then.

2. **Calendar event data format for MiniCalendarWidget**
   - What we know: `Calendar.tsx` accepts `events?: Record<string, Event[]>` keyed by date string (format unclear from code, likely `YYYY-MM-DD` or `DD/MM/YYYY`)
   - What's unclear: The date format key isn't visible in the component head — need to check lines 60+ of Calendar.tsx for `isToday` date comparison logic
   - Recommendation: Use `date.toDateString()` as the key (matching Calendar.tsx's `isToday` comparison), or check Calendar.tsx rendering logic before building event mapping. Low risk — calendar widget works without events (just shows current month structure).

3. **StatsCard number size — current `text-3xl` vs reference `text-4xl`**
   - What we know: Current StatsCard uses `text-3xl font-bold` for the value (line 116 of StatsCard.tsx). SchoolHub reference shows larger, more dominant numbers.
   - What's unclear: Whether `text-3xl` is sufficient or if `text-4xl` is needed for "data dominance"
   - Recommendation: Upgrade to `text-4xl` when `coloredBg` is true (full-colored card variant = bigger number emphasis). Keep `text-3xl` for default (non-colored) cards used elsewhere.

---

## Sources

### Primary (HIGH confidence)

- Codebase: `src/pages/Dashboard.tsx` — existing tab structure, data loading, stat card JSX, component imports
- Codebase: `src/components/ui/StatsCard.tsx` — entity color system, `coloredBg` prop, trend rendering
- Codebase: `src/components/ui/Calendar.tsx` — Hebrew calendar widget, event interface
- Codebase: `src/components/Layout.tsx` — sidebar margin mechanism (`marginRight: 280px`), grid content width calculation
- Codebase: `src/index.css` — CSS variable values for entity colors, `--background`, `--card` tokens
- Codebase: `tailwind.config.js` — entity color token definitions (`students.bg`, `teachers.bg`, etc.), shadow scale, breakpoints
- Codebase: `src/contexts/SidebarContext.tsx` — sidebar open state (280px when `isDesktopOpen && !isMobile`)
- Context7 `/grx7/framer-motion` — `staggerChildren` + `itemVariants` pattern (verified against published docs)
- `package.json` — confirms framer-motion v10.16.4, chart.js v4.4.0, react-chartjs-2 v5.2.0, NO recharts

### Secondary (MEDIUM confidence)

- `src/components/dashboard/charts/` — existing chart components confirm HebrewCharts (custom) not react-chartjs-2 for current dashboard charts; react-chartjs-2 used in `EnhancedCharts.tsx` only
- Tailwind CSS Grid docs (known behavior) — `lg` breakpoint fires at 1024px content width, validated against sidebar + laptop viewport math

### Tertiary (LOW confidence)

- SchoolHub reference layout (not directly accessible, described in CONTEXT.md) — visual description of 3-column pattern and stat card style interpreted from written spec, not direct screenshot analysis

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed via node_modules check and package.json
- Architecture: HIGH — based on direct codebase read of Layout.tsx, Dashboard.tsx, SidebarContext.tsx
- Pitfalls: HIGH for layout/RTL (verified via Layout.tsx margin math), MEDIUM for Chart.js RTL (known behavior, not re-verified with current chart.js v4 docs)

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (stable libraries, 30-day window)
