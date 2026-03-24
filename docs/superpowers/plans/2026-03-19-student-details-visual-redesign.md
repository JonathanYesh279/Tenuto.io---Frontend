# Student Details Page Visual Redesign

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the student details page from generic AI-looking cards into the app's established visual language — liquid glass stat cards, rehearsal-style timeline cards, animated tabs, app brand colors (#43a579 teal, #082753 navy), and creative grid layouts.

**Architecture:** 4 parallel tracks targeting each section of the student details page. All work is in the frontend repo (`/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/src`). Reuse existing components (GlassStatCard, RehearsalTimelineCard patterns, animated-tabs) rather than building new ones. Each task produces a visually distinct, self-contained improvement.

**Tech Stack:** React 18, HeroUI, Framer Motion, existing animated-tabs component, GlassStatCard, design system tokens, Phosphor Icons.

**Reference files (agents MUST read before implementing):**
- `src/components/ui/GlassStatCard.tsx` — liquid glass pattern with mouse-tracking glow
- `src/components/ui/animated-tabs.tsx` — spring-based animated tabs (used in login)
- `src/components/rehearsal/RehearsalTimelineCard.tsx` — timeline card with accent border, hover animations, HeroUI Chips
- `src/components/ui/BorderBeam.tsx` — animated border effect
- `src/pages/Dashboard.tsx` — reference for GlassStatCard usage, layout patterns
- `src/index.css` — CSS variables and design tokens

---

## Task 1: Replace Page Tabs with Animated Tabs

**Files:**
- Modify: `src/features/students/details/components/StudentDetailsPageSimple.tsx`

The current page uses HeroUI `<Tabs variant="underlined">`. Replace with the app's animated-tabs component (same one used on the login page) for consistent tab behavior across the app.

- [ ] **Step 1: Read current file and animated-tabs component**

Read `src/features/students/details/components/StudentDetailsPageSimple.tsx` and `src/components/ui/animated-tabs.tsx` to understand both APIs.

- [ ] **Step 2: Replace HeroUI Tabs with animated-tabs**

Replace imports:
```tsx
// Remove:
import { Tabs, Tab } from '@heroui/react'

// Add:
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from '@/components/ui/animated-tabs'
```

Replace the Tabs JSX. The animated-tabs use a `value`/`onValueChange` API (not `selectedKey`/`onSelectionChange`):

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    {TAB_CONFIG.map(tab => (
      <TabsTrigger key={tab.key} value={tab.key} className="font-bold text-sm">
        <span className="flex items-center gap-2">
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </span>
      </TabsTrigger>
    ))}
  </TabsList>
  <TabsContents>
    <TabsContent value="dashboard">
      <StudentDashboardView ... />
    </TabsContent>
    <TabsContent value="schedule">
      <ScheduleTab ... />
    </TabsContent>
    <TabsContent value="bagrut">
      <BagrutTab ... />
    </TabsContent>
    <TabsContent value="orchestra">
      <OrchestraTab ... />
    </TabsContent>
    <TabsContent value="theory">
      <TheoryTabOptimized ... />
    </TabsContent>
  </TabsContents>
</Tabs>
```

- [ ] **Step 3: Verify tabs animate with spring slide transition**

The animated-tabs component uses `framer-motion` to slide between tab panels horizontally. Verify all 5 tabs render correctly and transitions are smooth.

- [ ] **Step 4: Commit**

```bash
git add src/features/students/details/components/StudentDetailsPageSimple.tsx
git commit -m "feat(80): replace HeroUI Tabs with animated-tabs on student details"
```

---

## Task 2: Redesign Dashboard Overview (סקירה כללית) with Liquid Glass

**Files:**
- Modify: `src/features/students/details/components/dashboard/StudentDashboardView.tsx`
- Modify: `src/features/students/details/components/dashboard/ProfileCard.tsx`
- Modify: `src/features/students/details/components/dashboard/ActivityChart.tsx`
- Modify: `src/features/students/details/components/dashboard/AttendanceChart.tsx`
- Modify: `src/features/students/details/components/dashboard/SummaryCards.tsx`
- Modify: `src/features/students/details/components/dashboard/EnrollmentsTable.tsx`

Transform the boring stacked 3-column grid into a creative layout using GlassStatCard patterns, app brand colors, and dynamic grid composition.

- [ ] **Step 1: Read all dashboard components + GlassStatCard + Dashboard.tsx for reference**

- [ ] **Step 2: Redesign StudentDashboardView grid layout**

Replace the current `grid-cols-12` with a more creative, asymmetric layout:

```tsx
<div className="space-y-5">
  {/* Row 1: Profile card (wider) + GlassStatCards (summary) */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
    {/* Profile — takes 1 col */}
    <ProfileCard ... />

    {/* Glass stat cards — takes 2 cols, in a 2x2 inner grid */}
    <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <GlassStatCard value={dashboardData.totalWeeklyHours} label="שעות שבועיות" sparkData={...} />
      <GlassStatCard value={dashboardData.orchestraCount} label="תזמורות" />
      <GlassStatCard value={dashboardData.theoryCount} label="שיעורי תאוריה" />
      <GlassStatCard value={attendanceRate} label="נוכחות" trend={...} />
    </div>
  </div>

  {/* Row 2: Activity chart + Attendance chart side by side */}
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
    <div className="lg:col-span-3"><ActivityChart ... /></div>
    <div className="lg:col-span-2"><AttendanceChart ... /></div>
  </div>

  {/* Row 3: Full-width enrollment table */}
  <EnrollmentsTable ... />
</div>
```

Import GlassStatCard: `import { GlassStatCard } from '@/components/ui/GlassStatCard'`

Remove the SummaryCards component entirely — GlassStatCards replaces it.

- [ ] **Step 3: Redesign ProfileCard — app brand accent**

Keep the card white/light but add a branded top accent bar using the app colors:

```tsx
<div className="relative bg-card rounded-card border border-border overflow-hidden shadow-1">
  {/* Branded gradient accent bar at top */}
  <div
    className="h-20 w-full"
    style={{
      background: 'linear-gradient(135deg, #082753 0%, #43a579 100%)',
    }}
  />

  {/* Avatar overlapping the accent bar */}
  <div className="flex flex-col items-center -mt-10 px-6 pb-6">
    <User avatarProps={{ ... classNames: { base: 'w-20 h-20 text-2xl text-white ring-4 ring-card' } }} />
    {/* Rest of profile content... */}
  </div>
</div>
```

This gives the profile card visual identity with the brand colors without going full dark-theme.

- [ ] **Step 4: Style ActivityChart and AttendanceChart cards with subtle glass effect**

Add the glass surface pattern (from TeacherPerformanceTable) to chart card wrappers:

```tsx
const GLASS_CARD = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(167,230,210,0.15) 50%, rgba(255,255,255,0.9) 100%)',
  boxShadow: '0 4px 16px rgba(0,140,210,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
  border: '1px solid rgba(200,220,240,0.5)',
} as const
```

Apply to both chart wrappers replacing the plain `bg-white rounded-card border border-border`.

- [ ] **Step 5: Commit**

```bash
git add src/features/students/details/components/dashboard/
git commit -m "feat(80): redesign dashboard overview with liquid glass cards and brand accent"
```

---

## Task 3: Restyle Schedule Tab with Rehearsal Timeline Card Pattern

**Files:**
- Create: `src/components/schedule/ActivityTimelineCard.tsx` — reusable, matching RehearsalTimelineCard
- Modify: `src/features/students/details/components/tabs/ScheduleTab.tsx`
- Modify: `src/components/schedule/SimpleWeeklyGrid.tsx`

Replace the generic colored-block calendar with the rehearsal timeline card style — accent border, motion hover, HeroUI Chips, time column. This becomes a reusable component.

- [ ] **Step 1: Read RehearsalTimelineCard.tsx fully for the exact pattern**

Read `src/components/rehearsal/RehearsalTimelineCard.tsx` to understand the exact card structure, motion props, chip usage, time column layout.

- [ ] **Step 2: Create ActivityTimelineCard — reusable lesson/rehearsal card**

New file `src/components/schedule/ActivityTimelineCard.tsx`:

```tsx
interface ActivityTimelineCardProps {
  title: string           // instrument name or orchestra name
  subtitle: string        // teacher name or conductor
  type: 'individual' | 'group' | 'orchestra' | 'theory'
  startTime: string
  endTime: string
  location?: string
  room?: string
  onClick?: () => void
}
```

Structure mirrors RehearsalTimelineCard:
- `motion.div` with `whileHover={{ y: -2 }}` and `whileTap={{ scale: 0.995 }}`
- `border-r-[3px]` with accent color based on type:
  - individual: `hsl(var(--primary))` (indigo)
  - orchestra: `hsl(var(--color-orchestras-fg))` (amber)
  - theory: `hsl(var(--color-theory-fg))` (teal)
  - group: `hsl(var(--color-rehearsals-fg))` (rose)
- HeroUI `Chip` for type label
- Time column on left with `bg-muted` background
- `rounded-card shadow-1 hover:shadow-2`
- Uses design tokens throughout (text-foreground, text-muted-foreground, etc.)

- [ ] **Step 3: Rewrite SimpleWeeklyGrid to use ActivityTimelineCard**

Replace the colored gradient blocks with ActivityTimelineCard. Keep the 6-column day grid structure but style day headers with the muted token pattern:

```tsx
{/* Day header */}
<div className="bg-muted/50 rounded-t-card px-3 py-2 border-b border-border">
  <h4 className="font-semibold text-foreground text-center text-sm">{dayName}</h4>
  <p className="text-caption text-muted-foreground text-center">{count || 'ריק'}</p>
</div>

{/* Day content */}
<div className="rounded-b-card border border-t-0 border-border min-h-24 p-2 space-y-2">
  {dayLessons.map(lesson => (
    <ActivityTimelineCard
      key={lesson.id}
      title={lesson.instrumentName}
      subtitle={lesson.teacherName}
      type={lesson.lessonType}
      startTime={lesson.startTime}
      endTime={lesson.endTime}
      location={lesson.location}
      room={lesson.roomNumber}
    />
  ))}
</div>
```

Also update the legend to use the actual accent colors (CSS var dots, not gradient blocks).

- [ ] **Step 4: Update ScheduleTab to remove duplicate headers and use tokens**

The ScheduleTab currently duplicates the "לוח זמנים שבועי" header outside SimpleWeeklyGrid. Remove the outer header since SimpleWeeklyGrid has its own. Also update the lessons summary and orchestra sections to use ActivityTimelineCard for consistency.

- [ ] **Step 5: Commit**

```bash
git add src/components/schedule/ActivityTimelineCard.tsx src/components/schedule/SimpleWeeklyGrid.tsx src/features/students/details/components/tabs/ScheduleTab.tsx
git commit -m "feat(80): restyle schedule tab with rehearsal timeline card pattern"
```

---

## Task 4: Redesign Bagrut Tab with Micro-Tabs and Grid Layouts

**Files:**
- Modify: `src/features/students/details/components/tabs/BagrutTab.tsx`

Replace the vertical stack layout with micro-tabs (animated-tabs) to separate bagrut sections, and use grid layouts within each section.

- [ ] **Step 1: Read BagrutTab.tsx fully to understand all sections**

The bagrut tab has these logical sections:
1. **GradeSummary** — score cards (ציון מגן, הערכת מנהל, ציון סופי)
2. **Validation warnings** — pink alerts for missing requirements
3. **Recital program** — ProgramBuilder component
4. **Presentations** (השמעות) — numbered presentation slots with status/date
5. **Director evaluation** — grading form
6. **Overall progress** — completion status

- [ ] **Step 2: Add micro-tabs to group bagrut sections**

Import animated-tabs:
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from '@/components/ui/animated-tabs'
```

Group into 3 micro-tabs:
1. **"סיכום" (Summary)** — GradeSummary (as GlassStatCards) + overall progress + validation warnings
2. **"תכנית" (Program)** — Recital program (ProgramBuilder) + presentations
3. **"הערכות" (Evaluations)** — Director evaluation + MagenBagrutForm

```tsx
<Tabs value={bagrutSection} onValueChange={setBagrutSection}>
  <TabsList>
    <TabsTrigger value="summary" className="font-bold text-sm">
      <ChartBarIcon className="w-4 h-4 ml-1" /> סיכום
    </TabsTrigger>
    <TabsTrigger value="program" className="font-bold text-sm">
      <MusicNotesIcon className="w-4 h-4 ml-1" /> תכנית
    </TabsTrigger>
    <TabsTrigger value="evaluations" className="font-bold text-sm">
      <StarIcon className="w-4 h-4 ml-1" /> הערכות
    </TabsTrigger>
  </TabsList>
  <TabsContents>
    <TabsContent value="summary">...</TabsContent>
    <TabsContent value="program">...</TabsContent>
    <TabsContent value="evaluations">...</TabsContent>
  </TabsContents>
</Tabs>
```

- [ ] **Step 3: Redesign summary section with GlassStatCards in grid**

Replace the stacked score cards with GlassStatCards in a 3-column grid:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <GlassStatCard
    value={`${magenGrade}/100`}
    label="ציון מגן בגרות"
    trend={`${(magenGrade * 0.9).toFixed(1)} נק'`}
  />
  <GlassStatCard
    value={`${directorGrade}/10`}
    label="הערכת המנהל/ת"
  />
  <GlassStatCard
    value={`${finalGrade}/100`}
    label="ציון סופי"
  />
</div>
```

Place overall progress below as a card with the glass surface pattern. Validation warnings go below that.

- [ ] **Step 4: Redesign program section with grid layout**

Place ProgramBuilder and the program requirements side by side:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
  <div className="lg:col-span-2">
    <ProgramBuilder ... />
  </div>
  <div>
    {/* Requirements card + piece count stats */}
  </div>
</div>
```

- [ ] **Step 5: Redesign presentations as horizontal cards**

Instead of stacking presentations vertically, use a grid:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {presentations.map((p, i) => (
    <div key={i} className="bg-card rounded-card border border-border p-4 shadow-1">
      {/* Presentation card content */}
    </div>
  ))}
</div>
```

- [ ] **Step 6: Commit**

```bash
git add src/features/students/details/components/tabs/BagrutTab.tsx
git commit -m "feat(80): redesign bagrut tab with micro-tabs and grid layouts"
```

---

## Task 5: Polish Orchestra & Theory Tabs

**Files:**
- Modify: `src/features/students/details/components/tabs/OrchestraTab.tsx`
- Modify: `src/features/students/details/components/tabs/TheoryTabOptimized.tsx`

These tabs already got token migration. Now add visual polish: use ActivityTimelineCard for rehearsal schedules in OrchestraTab, ensure HeroUI Tabs are properly styled, and add motion to cards.

- [ ] **Step 1: Add motion hover to orchestra enrollment cards**

Wrap each orchestra card in `motion.div` with `whileHover={{ y: -2 }}`:

```tsx
import { motion } from 'framer-motion'

<motion.div
  className="bg-card rounded-card border border-border p-4 shadow-1"
  whileHover={{ y: -2 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  {/* Orchestra card content */}
</motion.div>
```

- [ ] **Step 2: Use ActivityTimelineCard for orchestra rehearsal schedules**

In the OrchestraTab where rehearsal schedules are displayed, replace the raw divs with:
```tsx
import ActivityTimelineCard from '@/components/schedule/ActivityTimelineCard'

<ActivityTimelineCard
  title={orchestraName}
  subtitle={conductorName}
  type="orchestra"
  startTime={schedule.startTime}
  endTime={schedule.endTime}
  location={schedule.location}
/>
```

- [ ] **Step 3: Add motion to theory lesson cards**

Same hover animation pattern as orchestra cards. Also ensure the LessonCard component uses the glass card surface for enrolled lessons.

- [ ] **Step 4: Verify both tabs use consistent animated-tabs if they have inner tabs**

Both tabs already have HeroUI Tabs from the previous refactor. Keep those for inner tab toggles (they're fine for simple toggles within a tab). The main page tabs use animated-tabs.

- [ ] **Step 5: Commit**

```bash
git add src/features/students/details/components/tabs/OrchestraTab.tsx src/features/students/details/components/tabs/TheoryTabOptimized.tsx
git commit -m "feat(80): polish orchestra and theory tabs with motion and timeline cards"
```

---

## Execution Order

Tasks 1-4 can run in parallel (independent files). Task 5 depends on Task 3 (ActivityTimelineCard must exist).

| Wave | Tasks | What it builds |
|------|-------|----------------|
| 1 | 1, 2, 3, 4 | Animated tabs, glass dashboard, timeline schedule, bagrut micro-tabs |
| 2 | 5 | Orchestra + Theory polish using ActivityTimelineCard |
