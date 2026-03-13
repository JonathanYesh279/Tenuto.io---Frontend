# Dashboard Analytics Redesign

## Overview
Replace the admin dashboard's 3 chart components with 6 new Tremor-style chart wrappers built on existing Recharts + Tailwind v3. Add SparkCharts to stat cards, instrument distribution donut, teacher workload CategoryBars, and a 30-day rehearsal Tracker.

## Layout
- Main: 9-col grid, Sidebar: 3-col (agenda + messages only, calendar removed)
- Single scrollable page, 4 sections

### Section 1: Stat Cards Row
- 4 cards in single row (not 2x2)
- Each card embeds a SparkAreaChart (last 6 months trend)
- Cards: Active Students, Staff, Orchestras, Weekly Rehearsals

### Section 2: Primary Charts (2-col)
- Left: ComboChart — monthly registrations (bars) + cumulative students (line), dual axis
- Right: Stacked BarChart — activities by day (Sun-Thu), rehearsals vs theory split

### Section 3: Distribution Charts (3-col)
- Col 1: DonutChart — gender split, center label = total
- Col 2: DonutChart — instrument distribution (top 8 + "other")
- Col 3: CategoryBar — teacher workload per teacher (top 6), horizontal bars (individual/orchestra/theory/management)

### Section 4: Health & Table
- Left (wide): TeacherPerformanceTable with inline CategoryBar per row
- Right: Tracker — 30-day rehearsal history (green=held, red=cancelled, gray=none)

## New Components (src/components/charts/)
1. `SparkChart.tsx` — tiny inline area/line/bar chart
2. `ComboChart.tsx` — dual-axis bar + line
3. `TremorBarChart.tsx` — declarative bar chart wrapper (stacked/grouped/percent)
4. `TremorDonutChart.tsx` — donut/pie with center label
5. `CategoryBar.tsx` — horizontal segmented progress bar
6. `Tracker.tsx` — color-coded block timeline

## Data Processing Additions (Dashboard.tsx)
- Instrument distribution: aggregate from students' teacherAssignments or instrument field
- Per-teacher hours: from hoursSummaryService
- 30-day rehearsal history: from rehearsals data
- Per-stat spark data: 6-month rolling aggregation per metric

## Constraints
- Recharts only (already installed), no new chart dependencies
- Tailwind v3 compatible (no v4 features)
- RTL + Hebrew labels throughout
- Design tokens: indigo primary, entity colors, glassmorphism stat cards
- Dark mode support via .dark class

## What's Removed
- `CalendarWidget` from sidebar
- `FinancialTrendsChart` (replaced by ComboChart)
- `AttendanceBarChart` (replaced by TremorBarChart stacked)
- `StudentDemographicsChart` (replaced by TremorDonutChart)
- Static SVG stock icon in GlassStatCard (replaced by SparkChart)

## What's Unchanged
- GlassStatCard structure, AgendaWidget, MessagesWidget
- Role-based dashboard routing
- Dark mode FAB, data fetching pattern
