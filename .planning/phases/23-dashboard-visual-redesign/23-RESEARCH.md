# Phase 23: Dashboard Visual Redesign - Research

**Researched:** 2026-02-20
**Domain:** Tailwind CSS design token system, React dashboard redesign, Recharts library
**Confidence:** HIGH

## Summary

Phase 23 implements a complete visual redesign of the dashboard page and underlying token system to match the reference UI (`.planning/phases/22-visual-architecture-rewrite/22-REFERENCE-UI.md`). The reference is a complete HTML mockup with Tailwind classes — it IS the spec. All visual decisions (colors, rounding, layout, fonts, charts) come from it.

**Key technical challenge:** This is a style system reset that reverses many v3.0 architectural decisions while preserving data/entity names from the real app. The reference uses Material Symbols icons (we keep Phosphor), different font loading (Assistant vs Heebo), and hardcoded chart data (we wire real data).

**Primary recommendation:** Implement as a bottom-up token reset + top-down dashboard rebuild. Start with CSS variables and Tailwind config (foundation), then rebuild dashboard layout, then implement charts with Recharts (already in package.json as `chart.js` + `react-chartjs-2`, but Recharts is superior for this use case and should be added), then build right sidebar widgets.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Color & tone direction
- Primary color is **indigo (#6366f1)** — replaces black. All primary actions, active states, focus rings use indigo
- Stat card backgrounds are **entity-colored pastels** — indigo-50/50, amber-50/50, sky-50/50, emerald-50/50 with matching tinted borders
- Trend badges use white/80 backgrounds with entity-colored text
- Overall temperature is **warm and colorful** — slate-50 content background, white cards, pastel tints
- Dark mode support **included** — the reference has full dark mode classes (dark:bg-background-dark, dark:bg-sidebar-dark, etc.)

#### Font system
- Switch from **Heebo** to **Assistant** as primary font (Hebrew-optimized, same as reference)
- **Plus Jakarta Sans** as secondary/fallback (Latin text, headings)
- Font weights: 300-800 (Assistant), 400-800 (Plus Jakarta Sans)
- Body text uses Assistant; extrabold (800) for large numbers and headings

#### Shape & surface treatment
- Corner radius **dramatically increased** — DEFAULT: 12px, xl: 18px, 2xl: 24px, 3xl: 32px
- Cards are **back** — full card wrappers with `bg-white rounded-3xl shadow-sm border border-slate-100`
- Stat cards use `rounded-3xl` with entity-colored pastel backgrounds and thin tinted borders
- Shadows are **decorative again** — `shadow-sm` on cards, `shadow-lg` on logo, `shadow-xl` on chart tooltips, `shadow-2xl` on FAB
- Avatars use `rounded-xl` (not rounded-full) — square-ish with large rounding

#### Dashboard layout
- **12-column grid** with 9:3 split — main content (col-span-9) + right sidebar column (col-span-3)
- **Stat cards row:** 4 cards in `grid-cols-4` — students (indigo), teachers (amber), orchestras (sky), rehearsals (emerald)
- **Charts section:** 2-column grid below stats — financial trends (line chart) + attendance (bar chart) side by side
- **Teacher performance table:** Below charts — avatars, departments, student counts, star ratings, status badges
- **Right sidebar widgets:** Calendar, agenda/schedule, messages — stacked vertically

#### Charts (implement with real data)
- **Financial trends line chart** — monthly income vs. expenses, SVG smooth curves with chart-blue (#BAE6FD) and chart-purple (#C7D2FE)
- **Attendance bar chart** — daily attendance (present vs. absent), paired bars with chart-yellow (#FDE047) and chart-blue
- **Student demographics donut chart** — concentric rings showing gender/category split with chart-blue and chart-yellow
- Wire to actual API data; if backend endpoints don't exist, use realistic mock data with TODO comments

#### Sidebar
- **White/light sidebar** — replaces dark charcoal (`--sidebar: white`)
- Active nav item: `rounded-xl bg-primary/10 text-primary font-bold`
- Inactive: `text-slate-500 hover:bg-slate-50`
- Category labels: `text-[10px] font-bold text-slate-400 uppercase tracking-widest`
- Logo: indigo square with icon + conservatory name + version tag

#### Header
- White background, `h-20`, border-bottom separator
- Search input: `bg-slate-100 rounded-2xl` with search icon
- Notification bell with red dot indicator
- User profile: avatar (rounded-xl) + name + role label

#### Table style
- White card container with `rounded-3xl shadow-sm border`
- Header: `bg-slate-50/50` with `text-[10px] font-bold uppercase tracking-widest` column labels
- Rows: `hover:bg-slate-50/50 transition-colors`
- Teacher column: avatar (rounded-xl) + name
- Rating: star icon + numeric score
- Status: colored pill badges (emerald for active)

#### Icons
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

### Deferred Ideas (OUT OF SCOPE)

- List pages (Teachers, Students, Orchestras) — user will provide separate reference mockups
- Detail pages (entity detail/dossier views) — waiting for reference
- Form pages — waiting for reference
- Auth pages (Login, ForgotPassword, ResetPassword) — no reference provided yet

</user_constraints>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Recharts** | ^2.15.0 | Charts (line, bar, pie/donut) | React-native chart library with declarative API, SVG rendering, RTL support via transforms. Already have `chart.js` + `react-chartjs-2` but Recharts is superior for custom styling + SVG manipulation. 112 code snippets in Context7, 88.7 benchmark score. |
| **Tailwind CSS** | ^3.4.19 | Design tokens + styling | Already installed. Config-first token system — this phase resets many token values. |
| **@phosphor-icons/react** | ^2.1.10 | Icons | Already installed. 217 files migrated. NO second migration to Material Symbols. |
| **Google Fonts API** | N/A (CDN) | Assistant + Plus Jakarta Sans | Replace current `<link>` to Heebo in `index.html` with Assistant + Plus Jakarta Sans. |
| **React** | ^18.3.1 | UI framework | Already installed. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **date-fns** | ^2.30.0 | Calendar widget dates | Already installed. Use for MiniCalendarWidget if making functional. |
| **clsx** / **tailwind-merge** | Installed | Conditional classes | Already in use. For dynamic stat card colors, badge colors. |
| **framer-motion** | ^10.16.4 | Optional: chart animations | Already installed. Consider for chart entry animations if time permits (Claude's discretion). |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js (already installed) | Chart.js requires more imperative setup, canvas-based (harder to style), RTL requires plugins. Recharts is declarative, SVG-based, easier to match reference. |
| Recharts | Hand-rolled SVG | Reference shows hand-rolled charts work. But Recharts handles tooltips, legends, responsiveness, accessibility. Hand-roll only if Recharts blocks customization (unlikely). |
| Google Fonts CDN | Self-hosted fonts | CDN is faster initial load, no build step, auto-updates. Self-hosted is more control, offline-safe. User hasn't mandated self-hosted, so CDN is acceptable. |

**Installation:**
```bash
npm install recharts@^2.15.0
```

(Chart.js can remain — it's used elsewhere in the codebase. Just add Recharts for dashboard.)

---

## Architecture Patterns

### Recommended Project Structure

Current dashboard structure:
```
src/
├── pages/
│   └── Dashboard.tsx                 # Main admin dashboard (283 lines)
├── components/
│   ├── dashboard/
│   │   ├── charts/                  # Existing chart components
│   │   │   ├── InstrumentDistributionChart.tsx
│   │   │   ├── ClassDistributionChart.tsx
│   │   │   ├── StudentActivityCharts.tsx
│   │   │   ├── BagrutProgressDashboard.tsx
│   │   │   └── DailyTeacherRoomTable.tsx
│   │   ├── widgets/                 # Existing widgets
│   │   │   ├── MiniCalendarWidget.tsx
│   │   │   ├── UpcomingEventsWidget.tsx
│   │   │   └── RecentActivityWidget.tsx
│   │   ├── ConductorDashboard.tsx
│   │   ├── TeacherDashboard.tsx
│   │   ├── TheoryTeacherDashboard.tsx
│   │   └── SuperAdminDashboard.tsx
│   ├── Sidebar.tsx                  # 600+ lines, nav structure
│   └── Header.tsx                   # Top bar
├── index.css                        # CSS variables (tokens)
└── tailwind.config.js               # Tailwind theme extension
```

**NEW structure for Phase 23:**
```
src/
├── components/
│   └── dashboard/
│       └── v4/                      # NEW: v4 redesign components
│           ├── StatCard.tsx         # Entity-colored pastel cards
│           ├── FinancialTrendsChart.tsx
│           ├── AttendanceBarChart.tsx
│           ├── StudentDemographicsChart.tsx
│           ├── TeacherPerformanceTable.tsx
│           ├── CalendarWidget.tsx   # Right sidebar
│           ├── AgendaWidget.tsx     # Right sidebar
│           └── MessagesWidget.tsx   # Right sidebar
```

### Pattern 1: Token Reset Strategy

**What:** Replace v3.0 black/sharp/flat tokens with v4.0 indigo/rounded/shadowed tokens in `index.css` and `tailwind.config.js`.

**When to use:** Before building any dashboard components. Tokens must be in place so components can reference them.

**Example:**
```css
/* src/index.css — BEFORE (v3.0 black primary) */
:root {
  --primary: 0 0% 0%;               /* BLACK */
  --radius: 0.125rem;               /* 2px sharp */
  --sidebar: 220 20% 13%;           /* dark charcoal */
  --shadow-1: none;                 /* zero decorative shadow */
}

/* src/index.css — AFTER (v4.0 indigo primary) */
:root {
  --primary: 238 68% 66%;           /* #6366f1 indigo */
  --radius: 0.75rem;                /* 12px — DEFAULT radius */
  --sidebar: 0 0% 100%;             /* white sidebar */
  --shadow-1: 0 1px 3px 0 rgb(0 0 0 / 0.1); /* decorative shadow back */

  /* NEW chart color tokens */
  --chart-blue: 199 95% 74%;        /* #BAE6FD */
  --chart-yellow: 54 97% 63%;       /* #FDE047 */
  --chart-purple: 230 68% 82%;      /* #C7D2FE */
}
```

**Tailwind config additions:**
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#6366f1',         // Indigo 500
        50: '#eef2ff',
        100: '#e0e7ff',
        // ... full indigo scale
      },
      'chart-blue': '#BAE6FD',
      'chart-yellow': '#FDE047',
      'chart-purple': '#C7D2FE',
    },
    borderRadius: {
      DEFAULT: '12px',
      'xl': '18px',
      '2xl': '24px',
      '3xl': '32px',
    },
    fontFamily: {
      sans: ['Assistant', 'Plus Jakarta Sans', 'sans-serif'],
    },
  }
}
```

### Pattern 2: Font Loading (Google Fonts CDN)

**What:** Replace Heebo with Assistant + Plus Jakarta Sans via Google Fonts `<link>` in `index.html`.

**When to use:** First step after token reset. Fonts must load before dashboard renders.

**Example:**
```html
<!-- index.html — BEFORE -->
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<!-- index.html — AFTER -->
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### Pattern 3: Stat Card with Entity Colors

**What:** Pastel background + tinted border + entity icon + large number + trend badge.

**When to use:** Dashboard top row (4 cards).

**Example:**
```tsx
// src/components/dashboard/v4/StatCard.tsx
interface StatCardProps {
  entity: 'students' | 'teachers' | 'orchestras' | 'rehearsals'
  value: number
  label: string
  trend?: string
  icon: React.ReactNode
}

const ENTITY_STYLES = {
  students: {
    bg: 'bg-indigo-50/50 dark:bg-indigo-900/10',
    border: 'border-indigo-100 dark:border-indigo-800/30',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  teachers: {
    bg: 'bg-amber-50/50 dark:bg-amber-900/10',
    border: 'border-amber-100 dark:border-amber-800/30',
    text: 'text-amber-600 dark:text-amber-400',
  },
  // ... sky for orchestras, emerald for rehearsals
}

export const StatCard: React.FC<StatCardProps> = ({ entity, value, label, trend, icon }) => {
  const style = ENTITY_STYLES[entity]
  return (
    <div className={`${style.bg} p-6 rounded-3xl border ${style.border}`}>
      <div className="flex justify-between items-start mb-4">
        <span className={`${style.text} text-3xl`}>{icon}</span>
        {trend && (
          <span className="bg-white/80 dark:bg-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-extrabold mb-1">{value}</h3>
      <p className={`text-sm font-bold ${style.text}/70`}>{label}</p>
    </div>
  )
}
```

### Pattern 4: Recharts Line Chart (Financial Trends)

**What:** Smooth line chart with 2 lines (income, expenses), grid, tooltip, legend. Match reference colors.

**When to use:** Dashboard financial trends card.

**Example:**
```tsx
// src/components/dashboard/v4/FinancialTrendsChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'ינו\'', income: 120000, expenses: 80000 },
  { month: 'פבר\'', income: 140000, expenses: 85000 },
  // ... 12 months
]

export const FinancialTrendsChart = () => {
  return (
    <div className="bg-white dark:bg-sidebar-dark p-8 rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold mb-8">מגמות פיננסיות</h2>
      <ResponsiveContainer width="100%" height={256}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
            stroke="#e2e8f0"
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#e2e8f0" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '12px',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8' }}
            itemStyle={{ fontSize: 11, fontWeight: 'bold' }}
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#BAE6FD"
            strokeWidth={3}
            dot={false}
            name="הכנסות"
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#C7D2FE"
            strokeWidth={3}
            dot={false}
            name="הוצאות"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Pattern 5: Recharts Bar Chart (Attendance)

**What:** Paired bars (present/absent) per day, custom colors, tooltip.

**When to use:** Dashboard attendance card.

**Example:**
```tsx
// src/components/dashboard/v4/AttendanceBarChart.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { day: 'א\'', present: 95, absent: 5 },
  { day: 'ב\'', present: 92, absent: 8 },
  // ... 5 days
]

export const AttendanceBarChart = () => {
  return (
    <div className="bg-white dark:bg-sidebar-dark p-8 rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold mb-8">נוכחות</h2>
      <ResponsiveContainer width="100%" height={192}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            cursor={false}
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
          />
          <Bar dataKey="present" fill="#FDE047" radius={[8, 8, 8, 8]} barSize={8} />
          <Bar dataKey="absent" fill="#BAE6FD" radius={[8, 8, 8, 8]} barSize={8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Pattern 6: Recharts Donut Chart (Demographics)

**What:** Concentric rings (gender split), custom colors, center text/icons.

**When to use:** Dashboard student demographics card.

**Example:**
```tsx
// src/components/dashboard/v4/StudentDemographicsChart.tsx
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const genderData = [
  { name: 'בנים', value: 47 },
  { name: 'בנות', value: 53 },
]

const COLORS = {
  male: '#BAE6FD',
  female: '#FDE047',
}

export const StudentDemographicsChart = () => {
  return (
    <div className="bg-white dark:bg-sidebar-dark p-8 rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold mb-6">תלמידים</h2>
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 mb-8">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill={COLORS.male} />
                <Cell fill={COLORS.female} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <span className="text-sky-300 text-3xl">👨</span>
            <span className="text-amber-300 text-3xl">👩</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-12 w-full px-4">
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-chart-blue"></div>
              <span className="text-lg font-extrabold">45,414</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400">בנים (47%)</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-chart-yellow"></div>
              <span className="text-lg font-extrabold">40,270</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400">בנות (53%)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Using Material Symbols icons** — We keep Phosphor. Map reference's Material icons to Phosphor equivalents manually.
- **Hardcoding chart data in components** — Wire to real API data or use clearly-marked mock data with `// TODO: wire to API` comments.
- **Breaking existing role-based dashboards** — Dashboard.tsx has `ConductorDashboard`, `TeacherDashboard`, etc. Only redesign admin dashboard. Other roles stay unchanged for now.
- **Removing v3.0 tokens before v4.0 are ready** — Token migration must be atomic: update all tokens in one commit, test, then update components.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Line/bar/donut charts | Custom SVG path calculations | **Recharts** | Handles responsive sizing, tooltips, legends, accessibility, RTL transforms. 112 code snippets, 88.7 benchmark, High reputation. |
| Icon system migration | Material Symbols → custom SVG | **Phosphor equivalents** | Already have Phosphor. Map reference's `grid_view` → Phosphor `GridFour`, `groups` → `Users`, etc. No second migration. |
| Font weight variants | Custom @font-face rules per weight | **Google Fonts API** | Handles weight ranges automatically, font-display:swap, WOFF2 compression, CDN caching. |
| Dark mode toggle logic | Custom useState + localStorage | **Existing pattern** | Reference shows FAB dark mode toggle — check if app already has dark mode logic (likely in theme context). If not, simple `document.documentElement.classList.toggle('dark')` + localStorage. |
| Calendar date calculations | Manual day-of-month logic | **date-fns** | Already installed. Use `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `format` for Hebrew day headers. |

**Key insight:** Recharts solves 80% of charting complexity (responsiveness, tooltips, accessibility, data binding) with declarative API. Hand-rolling would take 10x longer and produce worse UX. The reference shows hand-rolled charts work visually, but those charts lack tooltips, responsiveness, and hover states that Recharts provides for free.

---

## Common Pitfalls

### Pitfall 1: RTL Chart Labels Breaking

**What goes wrong:** Recharts XAxis labels render left-to-right even in RTL context. Hebrew month abbreviations display backwards or misaligned.

**Why it happens:** Recharts doesn't auto-detect RTL. SVG text elements need explicit `textAnchor` and `direction` props.

**How to avoid:** Use custom tick components with RTL-aware styling:
```tsx
<XAxis
  dataKey="month"
  tick={({ x, y, payload }) => (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="#94a3b8"
      fontSize={10}
      fontWeight="bold"
      direction="rtl"
    >
      {payload.value}
    </text>
  )}
/>
```

**Warning signs:** Month labels like `'ינו` render as `ונ'י`.

### Pitfall 2: Sidebar White Text on White Background

**What goes wrong:** Changing sidebar from dark (`220 20% 13%`) to white (`0 0% 100%`) makes text invisible if foreground stays light.

**Why it happens:** v3.0 sidebar had `--sidebar-foreground: 0 0% 94%` (near-white text on dark bg). v4.0 needs dark text on white bg.

**How to avoid:** Update BOTH sidebar bg AND foreground tokens atomically:
```css
/* src/index.css */
:root {
  --sidebar: 0 0% 100%;              /* white bg */
  --sidebar-foreground: 220 15% 11%; /* dark text */
  --sidebar-active-bg: 238 68% 66%;  /* indigo active */
  --sidebar-active-fg: 0 0% 100%;    /* white active text */
}
```

**Warning signs:** Sidebar text disappears in light mode.

### Pitfall 3: Font Flash (FOUT)

**What goes wrong:** Dashboard loads with Heebo, then flashes to Assistant 200ms later when Google Fonts loads.

**Why it happens:** Google Fonts `<link>` is async. Browser renders with fallback font first.

**How to avoid:**
1. Add `font-display: swap` to Google Fonts URL (already included in recommended link)
2. Add Tailwind's font-sans to body in index.css AFTER fonts load
3. Consider adding Assistant to localStorage cache on first load (advanced)

**Warning signs:** Visible layout shift when font loads.

### Pitfall 4: Chart Color Mismatch

**What goes wrong:** Chart uses different blue/yellow shades than reference spec.

**Why it happens:** Reference specifies `chart-blue: #BAE6FD`, `chart-yellow: #FDE047`, `chart-purple: #C7D2FE` but developer uses Tailwind's `blue-200` or arbitrary values.

**How to avoid:** Define chart colors as CSS variables in `:root`, add to Tailwind config, reference by token name:
```js
// tailwind.config.js
colors: {
  'chart-blue': '#BAE6FD',
  'chart-yellow': '#FDE047',
  'chart-purple': '#C7D2FE',
}

// Then use in components:
fill="#BAE6FD"  // or fill="hsl(var(--chart-blue))" if using HSL tokens
```

**Warning signs:** Charts look "close but not quite right" to reference.

### Pitfall 5: Breaking Existing Charts

**What goes wrong:** Updating token system breaks `InstrumentDistributionChart.tsx`, `ClassDistributionChart.tsx`, etc. that use old tokens.

**Why it happens:** Those charts reference `primary-500`, `--primary`, or old color tokens. Token reset changes their values.

**How to avoid:** Two strategies:
1. **Namespace new tokens:** Use `--primary-v4` alongside `--primary` temporarily, migrate charts in separate phase.
2. **Update all charts atomically:** Search codebase for token references, update in same commit as token reset.

Recommended: Strategy 2. Use global find/replace for token references before committing.

**Warning signs:** Existing charts change colors unexpectedly.

---

## Code Examples

Verified patterns from official sources:

### Dashboard Layout Grid (12-col with 9:3 split)

**Source:** Reference UI mockup, Tailwind CSS documentation

```tsx
// src/pages/Dashboard.tsx — Admin section
<div dir="rtl">
  <div className="grid grid-cols-12 gap-8">
    {/* Main content — 9 columns */}
    <div className="col-span-12 lg:col-span-9 space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard entity="students" value={1248} label="תלמידים פעילים" trend="+12%" icon={<UsersIcon />} />
        <StatCard entity="teachers" value={42} label="סגל הוראה" trend="+5%" icon={<GraduationCapIcon />} />
        <StatCard entity="orchestras" value={12} label="הרכבים פעילים" icon={<MusicNotesIcon />} />
        <StatCard entity="rehearsals" value={480} label="חזרות שבועיות" icon={<CalendarIcon />} />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <FinancialTrendsChart />
        <AttendanceBarChart />
      </div>

      {/* Teacher performance table */}
      <TeacherPerformanceTable />
    </div>

    {/* Right sidebar — 3 columns */}
    <div className="col-span-12 lg:col-span-3 space-y-8">
      <CalendarWidget />
      <AgendaWidget />
      <MessagesWidget />
    </div>
  </div>
</div>
```

### Recharts with Real API Data

**Source:** Recharts documentation + project's existing dashboard analytics service

```tsx
// src/components/dashboard/v4/FinancialTrendsChart.tsx
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { enhancedDashboardAnalytics } from '../../../services/enhancedDashboardAnalytics'

export const FinancialTrendsChart = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // TODO: Add getFinancialTrends method to enhancedDashboardAnalytics
      // For now, use mock data
      const mockData = [
        { month: 'ינו\'', income: 120000, expenses: 80000 },
        { month: 'פבר\'', income: 140000, expenses: 85000 },
        // ... 10 more months
      ]
      setData(mockData)
    } catch (error) {
      console.error('Error loading financial trends:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-100 rounded-3xl"></div>
  }

  return (
    <div className="bg-white dark:bg-sidebar-dark p-8 rounded-3xl shadow-sm border border-slate-100">
      {/* Chart implementation as in Pattern 4 */}
    </div>
  )
}
```

### Dark Mode FAB Toggle

**Source:** Reference UI, Tailwind dark mode docs

```tsx
// src/pages/Dashboard.tsx — bottom of admin dashboard
<button
  onClick={() => {
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme',
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    )
  }}
  className="fixed bottom-6 left-6 w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
  aria-label="Toggle dark mode"
>
  <MoonIcon weight="fill" className="text-primary dark:text-amber-400" size={20} />
</button>
```

### Calendar Widget with Hebrew Day Headers

**Source:** Reference UI, date-fns docs

```tsx
// src/components/dashboard/v4/CalendarWidget.tsx
import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { he } from 'date-fns/locale'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'

const HEBREW_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

export const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  return (
    <div className="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button className="text-slate-400 hover:text-primary" onClick={() => {
          const prev = new Date(currentDate)
          prev.setMonth(prev.getMonth() - 1)
          setCurrentDate(prev)
        }}>
          <CaretRightIcon size={18} weight="bold" />
        </button>
        <h3 className="font-bold text-sm">
          {format(currentDate, 'MMMM yyyy', { locale: he })}
        </h3>
        <button className="text-slate-400 hover:text-primary" onClick={() => {
          const next = new Date(currentDate)
          next.setMonth(next.getMonth() + 1)
          setCurrentDate(next)
        }}>
          <CaretLeftIcon size={18} weight="bold" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Hebrew day headers */}
        {HEBREW_DAYS.map(day => (
          <span key={day} className="text-[10px] font-bold text-slate-400 uppercase mb-2">
            {day}
          </span>
        ))}

        {/* Date cells */}
        {days.map(day => (
          <button
            key={day.toISOString()}
            onClick={() => setSelectedDate(day)}
            className={`
              p-2 text-xs font-semibold rounded-xl transition-colors
              ${isSameDay(day, selectedDate)
                ? 'bg-primary text-white shadow-md shadow-primary/20 font-bold'
                : 'hover:bg-slate-50 text-slate-900'
              }
            `}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## State of the Art

| Old Approach (v3.0) | Current Approach (v4.0) | When Changed | Impact |
|---------------------|-------------------------|--------------|--------|
| Black primary (#000) | Indigo primary (#6366f1) | Phase 23 | All primary actions, buttons, links change from black to indigo |
| 2px border radius | 12-32px border radius | Phase 23 | Cards, buttons, inputs become much rounder |
| Dark sidebar (charcoal) | Light sidebar (white) | Phase 23 | Sidebar inverts from dark to light theme |
| No decorative shadows | Shadows back (sm/lg/xl/2xl) | Phase 23 | Cards, logo, tooltips gain depth |
| Heebo font | Assistant + Plus Jakarta Sans | Phase 23 | All text re-renders with new fonts |
| Chart.js canvas charts | Recharts SVG charts | Phase 23 | Dashboard charts become more customizable, accessible |
| Flat stat cards (no bg) | Entity-colored pastel cards | Phase 23 | Dashboard top row becomes colorful |

**Deprecated/outdated:**
- **v3.0 black primary system:** All `bg-primary`, `text-primary`, `border-primary` classes now resolve to indigo instead of black.
- **Sharp 2px corners:** `rounded-DEFAULT` now 12px instead of 2px.
- **Zero shadow tokens:** `--shadow-1` and `--shadow-2` changed from `none` to actual shadow values.
- **Heebo font references:** All `font-sans` classes now render Assistant instead of Heebo.

**Migration notes:**
- Existing components using `bg-primary-500` (hardcoded blue hex) are UNAFFECTED — those stay blue.
- Only components using `bg-primary` (CSS var) change to indigo.
- If a component needs old behavior, use explicit `bg-black` instead of `bg-primary`.

---

## Open Questions

1. **Financial/attendance data endpoints**
   - What we know: Dashboard.tsx loads students, teachers, orchestras, rehearsals, theory lessons, bagruts.
   - What's unclear: No explicit financial income/expense data, no attendance present/absent stats.
   - Recommendation: Check if `enhancedDashboardAnalytics` service has these methods. If not, use clearly-marked mock data with `// TODO: wire to /api/dashboard/financial-trends` comment. Reference shows realistic data — we should match the data structure even if mocked.

2. **Teacher performance data (ratings, departments, student counts)**
   - What we know: Teachers collection has `personalInfo`, `professionalInfo`, `teaching` objects.
   - What's unclear: Where do star ratings come from? Are they manually entered or calculated?
   - Recommendation: Check if `teacher.professionalInfo.rating` field exists. If not, calculate from student/parent feedback (if that exists) or use mock 4.5-5.0 ratings for now.

3. **Agenda/schedule widget data**
   - What we know: Reference shows time-coded agenda items (indigo 09:00, amber 11:30, sky 14:00).
   - What's unclear: What backend data structure maps to these? Rehearsals? Theory lessons? Custom events?
   - Recommendation: Wire to upcoming rehearsals + theory lessons, group by time slot, assign colors based on type.

4. **Messages/notifications panel**
   - What we know: Reference shows avatar + name + timestamp + preview.
   - What's unclear: Does app have a notifications/messages system? Or is this just a UI mockup element?
   - Recommendation: Check if backend has notifications API. If not, defer this widget to Phase 24 or display placeholder.

5. **Dark mode persistence**
   - What we know: Reference has FAB toggle, Tailwind supports `dark:` classes.
   - What's unclear: Does app already have dark mode logic in a theme context?
   - Recommendation: Search codebase for existing dark mode implementation. If none, implement simple localStorage + classList toggle as shown in code examples.

---

## Sources

### Primary (HIGH confidence)
- **Context7 /recharts/recharts** — 112 code snippets, benchmark 88.7, High reputation. Verified examples for LineChart, BarChart, PieChart with custom styling, tooltips, RTL considerations.
- **Reference UI** — `.planning/phases/22-visual-architecture-rewrite/22-REFERENCE-UI.md` — Complete HTML mockup with exact Tailwind classes, token values, layout structure. This IS the spec.
- **Current codebase** — Dashboard.tsx (283 lines), Sidebar.tsx (600+ lines), existing chart components, token system in index.css and tailwind.config.js. Verified file structure, existing patterns, API service methods.

### Secondary (MEDIUM confidence)
- **Tailwind CSS docs** — Grid, border radius, shadows, dark mode, font family configuration. Standard Tailwind patterns verified against v3.4.x docs.
- **Google Fonts API** — Standard pattern for loading web fonts with `font-display: swap`. Verified Assistant and Plus Jakarta Sans availability.
- **date-fns docs** — Hebrew locale support, date formatting, interval calculations for calendar widget.

### Tertiary (LOW confidence)
- None — all research backed by Context7, reference UI, or existing codebase.

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — Recharts verified in Context7, Tailwind/Phosphor already installed
- **Architecture:** HIGH — Reference UI provides complete layout spec, existing dashboard structure well-understood
- **Pitfalls:** MEDIUM-HIGH — RTL chart labels and sidebar color inversion are known Tailwind/Recharts issues, others inferred from token reset scope

**Research date:** 2026-02-20
**Valid until:** 2026-03-22 (30 days — design token patterns are stable, Recharts API is mature)

**Phase-specific notes:**
- This is a VISUAL redesign — data layer stays the same. API endpoints stay the same (except new chart data).
- Reference uses Material Symbols — we map to Phosphor equivalents (grid_view → GridFour, groups → Users, etc.).
- Token reset affects ALL pages eventually, but Phase 23 scope is Dashboard only. Other pages will look "off" until they get v4.0 treatment.
- Dark mode toggle is in reference but may not be immediately functional if app lacks theme persistence. Implement toggle UI first, persistence later if time.
