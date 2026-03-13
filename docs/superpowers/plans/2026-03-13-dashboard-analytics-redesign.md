# Dashboard Analytics Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin dashboard's chart components with 6 new Tremor-style wrappers, add sparklines to stat cards, instrument distribution donut, teacher workload bars, and a 30-day tracker.

**Architecture:** Build 6 reusable chart wrapper components in `src/components/charts/` that wrap Recharts with declarative APIs. Update `Dashboard.tsx` to compute new data aggregations (instrument distribution, per-teacher hours, spark trends, 30-day history) and wire them to the new components. Remove CalendarWidget from sidebar.

**Tech Stack:** React 18, Recharts (existing), Tailwind v3 (existing), TypeScript

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/charts/SparkChart.tsx` | Tiny inline area chart for stat cards |
| `src/components/charts/ComboChart.tsx` | Dual-axis bar + line chart |
| `src/components/charts/TremorBarChart.tsx` | Declarative stacked/grouped bar chart |
| `src/components/charts/TremorDonutChart.tsx` | Donut/pie with center label |
| `src/components/charts/CategoryBar.tsx` | Horizontal segmented progress bar |
| `src/components/charts/Tracker.tsx` | Color-coded 30-day block timeline |
| `src/components/charts/ChartTooltip.tsx` | Shared tooltip component for all charts |
| `src/components/charts/ChartLegend.tsx` | Shared legend component |
| `src/components/charts/chartColors.ts` | Shared color palette + utilities |
| `src/components/charts/index.ts` | Barrel export |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/ui/GlassStatCard.tsx` | Add optional `sparkData` prop, render SparkChart instead of SVG |
| `src/components/dashboard/v4/StatCard.tsx` | Pass `sparkData` through to GlassStatCard |
| `src/pages/Dashboard.tsx` | New data aggregations, replace chart imports, new layout grid, remove CalendarWidget |

### Removed (no longer imported)
| File | Reason |
|------|--------|
| `src/components/dashboard/v4/FinancialTrendsChart.tsx` | Replaced by ComboChart |
| `src/components/dashboard/v4/AttendanceBarChart.tsx` | Replaced by TremorBarChart |
| `src/components/dashboard/v4/StudentDemographicsChart.tsx` | Replaced by TremorDonutChart |
| `src/components/dashboard/v4/CalendarWidget.tsx` | Removed from sidebar |

---

## Task 1: Chart Utilities — Colors, Tooltip, Legend

**Files:**
- Create: `src/components/charts/chartColors.ts`
- Create: `src/components/charts/ChartTooltip.tsx`
- Create: `src/components/charts/ChartLegend.tsx`

- [ ] **Step 1: Create chartColors.ts**

```typescript
// Chart color palette aligned with design tokens
export const chartColors = {
  indigo: { bg: '#6366f1', light: '#c7d2fe' },
  emerald: { bg: '#10b981', light: '#a7f3d0' },
  amber: { bg: '#f59e0b', light: '#fde68a' },
  sky: { bg: '#0ea5e9', light: '#bae6fd' },
  rose: { bg: '#f43f5e', light: '#fecdd3' },
  violet: { bg: '#8b5cf6', light: '#ddd6fe' },
  cyan: { bg: '#06b6d4', light: '#a5f3fc' },
  lime: { bg: '#84cc16', light: '#d9f99d' },
  pink: { bg: '#ec4899', light: '#fbcfe8' },
  gray: { bg: '#6b7280', light: '#d1d5db' },
} as const

export type ChartColorKey = keyof typeof chartColors

export const defaultColorOrder: ChartColorKey[] = [
  'indigo', 'emerald', 'amber', 'sky', 'rose', 'violet', 'cyan', 'lime', 'pink', 'gray'
]

export function getChartColor(index: number, variant: 'bg' | 'light' = 'bg'): string {
  const key = defaultColorOrder[index % defaultColorOrder.length]
  return chartColors[key][variant]
}

export function getCategoryColors(categories: string[], colors?: ChartColorKey[]): string[] {
  const palette = colors || defaultColorOrder
  return categories.map((_, i) => chartColors[palette[i % palette.length]].bg)
}
```

- [ ] **Step 2: Create ChartTooltip.tsx**

Shared tooltip used by all chart components. Supports dark mode, RTL.

```typescript
import React from 'react'

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  valueFormatter?: (value: number) => string
}

export function ChartTooltip({ active, payload, label, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const fmt = valueFormatter || ((v: number) => v.toLocaleString('he-IL'))

  return (
    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-right">
      {label && <p className="text-[10px] font-bold text-slate-400 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500 dark:text-slate-400 font-medium">{entry.name}:</span>
          <span className="text-slate-900 dark:text-white font-bold">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create ChartLegend.tsx**

```typescript
import React from 'react'

interface LegendItem {
  label: string
  color: string
}

interface ChartLegendProps {
  items: LegendItem[]
  position?: 'right' | 'center' | 'left'
}

export function ChartLegend({ items, position = 'right' }: ChartLegendProps) {
  const justify = position === 'right' ? 'justify-end' : position === 'center' ? 'justify-center' : 'justify-start'
  return (
    <div className={`flex flex-wrap gap-4 text-xs ${justify}`}>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-slate-500 dark:text-slate-400 font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/charts/chartColors.ts src/components/charts/ChartTooltip.tsx src/components/charts/ChartLegend.tsx
git commit -m "feat(charts): add shared chart utilities — colors, tooltip, legend"
```

---

## Task 2: SparkChart Component

**Files:**
- Create: `src/components/charts/SparkChart.tsx`

- [ ] **Step 1: Create SparkChart.tsx**

Tiny inline chart for embedding in stat cards. Supports area and bar variants.

```typescript
import React from 'react'
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, YAxis } from 'recharts'
import { getChartColor, type ChartColorKey } from './chartColors'

interface SparkChartProps {
  data: Record<string, any>[]
  index: string
  categories: string[]
  type?: 'area' | 'bar'
  color?: ChartColorKey
  className?: string
}

export function SparkChart({
  data,
  index,
  categories,
  type = 'area',
  color = 'indigo',
  className = 'h-10 w-24',
}: SparkChartProps) {
  if (!data?.length) return null

  const fillColor = getChartColor(0, 'bg')
  const lightColor = getChartColor(0, 'light')
  const category = categories[0]

  // Use the color prop to get the right color
  const { chartColors: colors } = require('./chartColors')
  const mainColor = colors[color]?.bg || fillColor
  const fadeColor = colors[color]?.light || lightColor

  if (type === 'bar') {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <Bar dataKey={category} fill={mainColor} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={mainColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={mainColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
          <Area
            type="monotone"
            dataKey={category}
            stroke={mainColor}
            strokeWidth={1.5}
            fill={`url(#spark-${color})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Update GlassStatCard to accept sparkData**

In `src/components/ui/GlassStatCard.tsx`:
- Add `sparkData?: Array<Record<string, any>>` and `sparkColor?: string` to props
- Replace the `<StockIcon>` with `<SparkChart>` when sparkData is provided
- Import SparkChart from `../charts/SparkChart`

- [ ] **Step 3: Update StatCard to pass sparkData**

In `src/components/dashboard/v4/StatCard.tsx`:
- Add `sparkData` prop to StatCardProps
- Pass through to GlassStatCard

- [ ] **Step 4: Commit**

```bash
git add src/components/charts/SparkChart.tsx src/components/ui/GlassStatCard.tsx src/components/dashboard/v4/StatCard.tsx
git commit -m "feat(charts): add SparkChart component, integrate into stat cards"
```

---

## Task 3: TremorDonutChart Component

**Files:**
- Create: `src/components/charts/TremorDonutChart.tsx`

- [ ] **Step 1: Create TremorDonutChart.tsx**

Declarative donut chart with center label support.

```typescript
import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { ChartLegend } from './ChartLegend'
import { getCategoryColors, type ChartColorKey } from './chartColors'

interface TremorDonutChartProps {
  data: Record<string, any>[]
  category: string         // key for segment names
  value: string            // key for numeric values
  colors?: ChartColorKey[]
  variant?: 'donut' | 'pie'
  label?: string           // center text (donut only)
  showLabel?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  valueFormatter?: (value: number) => string
  className?: string
}

export function TremorDonutChart({
  data,
  category,
  value,
  colors,
  variant = 'donut',
  label,
  showLabel = false,
  showLegend = true,
  showTooltip = true,
  valueFormatter,
  className = 'h-48',
}: TremorDonutChartProps) {
  if (!data?.length) return null

  const categoryNames = data.map(d => d[category])
  const fillColors = getCategoryColors(categoryNames, colors)
  const isDonut = variant === 'donut'

  const legendItems = data.map((d, i) => ({
    label: d[category],
    color: fillColors[i],
  }))

  const CustomTooltipWrapper = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <ChartTooltip
        active={active}
        payload={payload.map((p: any) => ({
          name: p.name,
          value: p.value,
          color: p.payload?.fill || fillColors[0],
        }))}
        valueFormatter={valueFormatter}
      />
    )
  }

  return (
    <div className={className}>
      <div className="relative w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={isDonut ? '60%' : 0}
              outerRadius="85%"
              dataKey={value}
              nameKey={category}
              startAngle={90}
              endAngle={-270}
              strokeWidth={2}
              stroke="white"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={fillColors[i]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltipWrapper />} />}
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        {isDonut && showLabel && label && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-slate-900 dark:text-white">{label}</span>
          </div>
        )}
      </div>

      {showLegend && (
        <div className="mt-3">
          <ChartLegend items={legendItems} position="center" />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/TremorDonutChart.tsx
git commit -m "feat(charts): add TremorDonutChart with center label support"
```

---

## Task 4: TremorBarChart Component

**Files:**
- Create: `src/components/charts/TremorBarChart.tsx`

- [ ] **Step 1: Create TremorBarChart.tsx**

Declarative bar chart with stacked/grouped/percent modes.

```typescript
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { ChartLegend } from './ChartLegend'
import { getCategoryColors, type ChartColorKey } from './chartColors'

interface TremorBarChartProps {
  data: Record<string, any>[]
  index: string
  categories: string[]
  colors?: ChartColorKey[]
  type?: 'default' | 'stacked' | 'percent'
  layout?: 'horizontal' | 'vertical'
  showXAxis?: boolean
  showYAxis?: boolean
  showGridLines?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  valueFormatter?: (value: number) => string
  xAxisLabel?: string
  yAxisLabel?: string
  barRadius?: number
  barSize?: number
  className?: string
  categoryLabels?: Record<string, string> // maps dataKey → display label
}

export function TremorBarChart({
  data,
  index,
  categories,
  colors,
  type = 'default',
  layout = 'horizontal',
  showXAxis = true,
  showYAxis = true,
  showGridLines = true,
  showTooltip = true,
  showLegend = true,
  valueFormatter,
  barRadius = 4,
  barSize,
  className = 'h-72',
  categoryLabels,
}: TremorBarChartProps) {
  if (!data?.length) return null

  const fillColors = getCategoryColors(categories, colors)
  const isStacked = type === 'stacked' || type === 'percent'

  const getLabel = (key: string) => categoryLabels?.[key] || key

  const legendItems = categories.map((cat, i) => ({
    label: getLabel(cat),
    color: fillColors[i],
  }))

  const CustomTooltipWrapper = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <ChartTooltip
        active={active}
        label={label}
        payload={payload.map((p: any) => ({
          name: getLabel(p.dataKey),
          value: p.value,
          color: p.fill || p.color,
        }))}
        valueFormatter={valueFormatter}
      />
    )
  }

  return (
    <div>
      {showLegend && (
        <div className="mb-3">
          <ChartLegend items={legendItems} position="right" />
        </div>
      )}
      <div className={className}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={layout === 'vertical' ? 'vertical' : 'horizontal'} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            {showGridLines && <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} className="dark:opacity-20" />}
            {layout === 'vertical' ? (
              <>
                <XAxis type="number" hide={!showYAxis} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis type="category" dataKey={index} hide={!showXAxis} tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
              </>
            ) : (
              <>
                <XAxis dataKey={index} hide={!showXAxis} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis hide={!showYAxis} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              </>
            )}
            {showTooltip && <Tooltip content={<CustomTooltipWrapper />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />}
            {categories.map((cat, i) => (
              <Bar
                key={cat}
                dataKey={cat}
                fill={fillColors[i]}
                stackId={isStacked ? 'stack' : undefined}
                radius={[barRadius, barRadius, isStacked && i < categories.length - 1 ? 0 : barRadius, isStacked && i < categories.length - 1 ? 0 : barRadius]}
                barSize={barSize}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/TremorBarChart.tsx
git commit -m "feat(charts): add TremorBarChart with stacked/grouped modes"
```

---

## Task 5: ComboChart Component

**Files:**
- Create: `src/components/charts/ComboChart.tsx`

- [ ] **Step 1: Create ComboChart.tsx**

Dual-axis bar + line combination chart.

```typescript
import React from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { ChartLegend } from './ChartLegend'
import { chartColors, type ChartColorKey } from './chartColors'

interface SeriesConfig {
  categories: string[]
  colors?: ChartColorKey[]
  valueFormatter?: (value: number) => string
  showYAxis?: boolean
  yAxisLabel?: string
}

interface ComboChartProps {
  data: Record<string, any>[]
  index: string
  barSeries: SeriesConfig
  lineSeries: SeriesConfig
  enableBiaxial?: boolean
  showXAxis?: boolean
  showGridLines?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  className?: string
  categoryLabels?: Record<string, string>
}

export function ComboChart({
  data,
  index,
  barSeries,
  lineSeries,
  enableBiaxial = false,
  showXAxis = true,
  showGridLines = true,
  showTooltip = true,
  showLegend = true,
  className = 'h-72',
  categoryLabels,
}: ComboChartProps) {
  if (!data?.length) return null

  const barColors = (barSeries.colors || ['amber']).map(c => chartColors[c]?.bg || c)
  const lineColors = (lineSeries.colors || ['indigo']).map(c => chartColors[c]?.bg || c)
  const getLabel = (key: string) => categoryLabels?.[key] || key

  const legendItems = [
    ...barSeries.categories.map((cat, i) => ({ label: getLabel(cat), color: barColors[i % barColors.length] })),
    ...lineSeries.categories.map((cat, i) => ({ label: getLabel(cat), color: lineColors[i % lineColors.length] })),
  ]

  const CustomTooltipWrapper = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <ChartTooltip
        active={active}
        label={label}
        payload={payload.map((p: any) => ({
          name: getLabel(p.dataKey),
          value: p.value,
          color: p.stroke || p.fill || p.color,
        }))}
      />
    )
  }

  return (
    <div>
      {showLegend && (
        <div className="mb-3">
          <ChartLegend items={legendItems} position="right" />
        </div>
      )}
      <div className={className}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: enableBiaxial ? 50 : 10, left: 0, bottom: 5 }}>
            {showGridLines && <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} className="dark:opacity-20" />}
            <XAxis
              dataKey={index}
              hide={!showXAxis}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              hide={!barSeries.showYAxis}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            {enableBiaxial && (
              <YAxis
                yAxisId="right"
                orientation="right"
                hide={!lineSeries.showYAxis}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
            )}
            {showTooltip && <Tooltip content={<CustomTooltipWrapper />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />}
            {barSeries.categories.map((cat, i) => (
              <Bar
                key={cat}
                yAxisId="left"
                dataKey={cat}
                fill={barColors[i % barColors.length]}
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            ))}
            {lineSeries.categories.map((cat, i) => (
              <Line
                key={cat}
                yAxisId={enableBiaxial ? 'right' : 'left'}
                type="monotone"
                dataKey={cat}
                stroke={lineColors[i % lineColors.length]}
                strokeWidth={2.5}
                dot={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/ComboChart.tsx
git commit -m "feat(charts): add ComboChart with dual-axis bar+line support"
```

---

## Task 6: CategoryBar Component

**Files:**
- Create: `src/components/charts/CategoryBar.tsx`

- [ ] **Step 1: Create CategoryBar.tsx**

Horizontal segmented progress bar for workload/capacity visualization.

```typescript
import React from 'react'
import { getCategoryColors, type ChartColorKey } from './chartColors'

interface CategoryBarProps {
  values: number[]
  colors?: ChartColorKey[]
  labels?: string[]
  showLabels?: boolean
  marker?: { value: number; tooltip?: string }
  className?: string
}

export function CategoryBar({
  values,
  colors,
  labels,
  showLabels = true,
  marker,
  className = '',
}: CategoryBarProps) {
  const total = values.reduce((sum, v) => sum + v, 0)
  if (total === 0) return null

  const percentages = values.map(v => (v / total) * 100)
  const fillColors = getCategoryColors(
    values.map((_, i) => `cat-${i}`),
    colors
  )

  const markerPosition = marker ? (marker.value / total) * 100 : null

  return (
    <div className={className}>
      {/* Bar */}
      <div className="relative flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {percentages.map((pct, i) => (
          <div
            key={i}
            className="h-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundColor: fillColors[i],
            }}
          />
        ))}
        {/* Marker */}
        {markerPosition !== null && (
          <div
            className="absolute top-0 h-full w-0.5 bg-slate-900 dark:bg-white"
            style={{ left: `${Math.min(markerPosition, 100)}%` }}
            title={marker?.tooltip}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />
          </div>
        )}
      </div>

      {/* Labels */}
      {showLabels && labels && (
        <div className="flex justify-between mt-1.5">
          {labels.map((label, i) => (
            <div key={i} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fillColors[i] }} />
              <span>{label}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{values[i]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/CategoryBar.tsx
git commit -m "feat(charts): add CategoryBar segmented progress component"
```

---

## Task 7: Tracker Component

**Files:**
- Create: `src/components/charts/Tracker.tsx`

- [ ] **Step 1: Create Tracker.tsx**

30-day color-coded block timeline for rehearsal history.

```typescript
import React from 'react'

interface TrackerBlock {
  color?: string     // Tailwind bg class e.g. 'bg-emerald-500'
  tooltip?: string
}

interface TrackerProps {
  data: TrackerBlock[]
  defaultColor?: string
  className?: string
}

export function Tracker({
  data,
  defaultColor = 'bg-slate-200 dark:bg-slate-700',
  className = '',
}: TrackerProps) {
  return (
    <div className={`flex gap-0.5 ${className}`}>
      {data.map((block, i) => (
        <div
          key={i}
          className={`h-8 flex-1 rounded-sm transition-opacity hover:opacity-80 ${block.color || defaultColor}`}
          title={block.tooltip}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/Tracker.tsx
git commit -m "feat(charts): add Tracker block timeline component"
```

---

## Task 8: Barrel Export

**Files:**
- Create: `src/components/charts/index.ts`

- [ ] **Step 1: Create index.ts**

```typescript
export { SparkChart } from './SparkChart'
export { ComboChart } from './ComboChart'
export { TremorBarChart } from './TremorBarChart'
export { TremorDonutChart } from './TremorDonutChart'
export { CategoryBar } from './CategoryBar'
export { Tracker } from './Tracker'
export { ChartTooltip } from './ChartTooltip'
export { ChartLegend } from './ChartLegend'
export { chartColors, getChartColor, getCategoryColors } from './chartColors'
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/index.ts
git commit -m "feat(charts): add barrel export for chart components"
```

---

## Task 9: Dashboard.tsx — Data Aggregations

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Add new state variables** (after existing state declarations ~line 57)

```typescript
const [instrumentDistribution, setInstrumentDistribution] = useState<Array<{ name: string; count: number }>>([])
const [teacherWorkloads, setTeacherWorkloads] = useState<Array<{ name: string; individual: number; orchestra: number; theory: number; management: number }>>([])
const [rehearsalHistory, setRehearsalHistory] = useState<Array<{ color?: string; tooltip?: string }>>([])
const [sparkStudents, setSparkStudents] = useState<Array<{ month: string; value: number }>>([])
const [sparkTeachers, setSparkTeachers] = useState<Array<{ month: string; value: number }>>([])
const [sparkOrchestras, setSparkOrchestras] = useState<Array<{ month: string; value: number }>>([])
const [sparkRehearsals, setSparkRehearsals] = useState<Array<{ month: string; value: number }>>([])
const [cumulativeStudents, setCumulativeStudents] = useState<Array<Record<string, any>>>([])
```

- [ ] **Step 2: Add data processing in loadDashboardData** (before `setLastRefresh`)

Compute:
1. Instrument distribution from student `teacherAssignments` or `personalInfo.instrument`
2. Per-stat spark data (6-month rolling)
3. Cumulative student data for ComboChart
4. 30-day rehearsal history for Tracker

- [ ] **Step 3: Load teacher workloads from hoursSummaryService**

Add a parallel call to `hoursSummaryService.getAllSummaries()` in the Promise.allSettled block, then transform the result into the `teacherWorkloads` format.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(dashboard): add data aggregations for new chart components"
```

---

## Task 10: Dashboard.tsx — Replace Layout & Charts

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Update imports**

Remove:
```typescript
import { FinancialTrendsChart } from '../components/dashboard/v4/FinancialTrendsChart'
import { AttendanceBarChart } from '../components/dashboard/v4/AttendanceBarChart'
import { StudentDemographicsChart } from '../components/dashboard/v4/StudentDemographicsChart'
import { CalendarWidget } from '../components/dashboard/v4/CalendarWidget'
```

Add:
```typescript
import { ComboChart, TremorBarChart, TremorDonutChart, CategoryBar, Tracker } from '../components/charts'
```

- [ ] **Step 2: Replace the JSX layout** (lines 392-474)

New layout:
- Section 1: 4 stat cards in single row (grid-cols-4) with sparkData
- Section 2: ComboChart + TremorBarChart (2-col)
- Section 3: 2 DonutCharts + CategoryBar workloads (3-col)
- Section 4: TeacherPerformanceTable (wide) + Tracker (narrow)
- Sidebar: AgendaWidget + MessagesWidget only (no CalendarWidget)

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(dashboard): replace charts with Tremor-style components, new layout"
```

---

## Task 11: Cleanup

- [ ] **Step 1: Verify no other files import the removed components**

Search for imports of `FinancialTrendsChart`, `AttendanceBarChart`, `StudentDemographicsChart`, `CalendarWidget`.

- [ ] **Step 2: Commit final cleanup if needed**

```bash
git commit -m "chore(dashboard): remove unused chart component imports"
```
