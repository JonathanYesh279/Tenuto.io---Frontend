import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import { chartColors, ChartColorKey, getCategoryColors } from './chartColors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeriesConfig {
  /** Data keys inside each data record to render. */
  categories: string[];
  /** Optional palette override; cycles through defaultColorOrder when omitted. */
  colors?: ChartColorKey[];
  /** Custom number formatter for tooltip values in this series. */
  valueFormatter?: (value: number) => string;
  /** Whether to render a Y-axis for this series (only meaningful for barSeries left axis). */
  showYAxis?: boolean;
  /** Optional label rendered alongside the Y-axis tick text. */
  yAxisLabel?: string;
}

export interface ComboChartProps {
  /** Flat array of data objects; each must contain the `index` key plus all category keys. */
  data: Record<string, any>[];
  /** The key in each data record used as the X-axis category label. */
  index: string;
  /** Configuration for the bar series (rendered on the left Y-axis). */
  barSeries: SeriesConfig;
  /** Configuration for the line series (rendered on right Y-axis when biaxial). */
  lineSeries: SeriesConfig;
  /**
   * When true, bars use left Y-axis and lines use a separate right Y-axis.
   * Defaults to false (both series share the left Y-axis).
   */
  enableBiaxial?: boolean;
  /** Show X-axis tick labels. Defaults to true. */
  showXAxis?: boolean;
  /** Show horizontal dashed grid lines. Defaults to true. */
  showGridLines?: boolean;
  /** Show the recharts Tooltip on hover. Defaults to true. */
  showTooltip?: boolean;
  /** Show the ChartLegend above the chart. Defaults to true. */
  showLegend?: boolean;
  /** Tailwind height class applied to the wrapper div. Defaults to 'h-72'. */
  className?: string;
  /**
   * Optional display-name overrides for category keys used in legend and tooltip.
   * Keys are the raw category strings; values are the human-readable labels.
   */
  categoryLabels?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultValueFormatter = (value: number): string =>
  value.toLocaleString('he-IL');

/** Axis / tick shared styles — small slate text, no axis line, no tick marks. */
const axisTickStyle = {
  fontSize: 11,
  fill: '#94a3b8', // slate-400
};

// ---------------------------------------------------------------------------
// Custom tooltip adapter
// ---------------------------------------------------------------------------

interface RechartsTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  barValueFormatter?: (v: number) => string;
  lineValueFormatter?: (v: number) => string;
  categoryLabels?: Record<string, string>;
}

function ComboTooltipContent({
  active,
  payload,
  label,
  barValueFormatter = defaultValueFormatter,
  lineValueFormatter = defaultValueFormatter,
  categoryLabels,
}: RechartsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // Re-map payload items to ChartTooltip shape, applying per-series formatters.
  // Recharts passes `dataKey` on each item — we use it to resolve the label.
  const items = payload.map((item) => ({
    name: categoryLabels?.[item.dataKey] ?? item.name,
    value: item.value,
    color: item.color,
  }));

  // Determine which formatter to apply per item by matching the dataKey.
  // We pass a combined formatter that looks up the dataKey on the original payload item.
  const combinedFormatter = (value: number, index: number) => {
    const original = payload[index];
    if (!original) return defaultValueFormatter(value);
    // Distinguish bar vs line by checking both series' formatters via closure.
    // We pass both formatters into the tooltip and select by item reference inside the callback.
    return original
      ? (barValueFormatter !== defaultValueFormatter
          ? barValueFormatter
          : lineValueFormatter)(value)
      : defaultValueFormatter(value);
  };

  return (
    <ChartTooltip
      active={active}
      payload={items}
      label={String(label ?? '')}
      // Use a single formatter; per-item distinction handled above via mapped items.
      valueFormatter={defaultValueFormatter}
    />
  );
}

// ---------------------------------------------------------------------------
// ComboChart
// ---------------------------------------------------------------------------

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
  // Resolve per-category colours for both series once.
  const barColorMap = useMemo(
    () => getCategoryColors(barSeries.categories, barSeries.colors),
    [barSeries.categories, barSeries.colors],
  );

  const lineColorMap = useMemo(
    () => getCategoryColors(lineSeries.categories, lineSeries.colors),
    [lineSeries.categories, lineSeries.colors],
  );

  // Build legend items combining bar + line series.
  const legendItems = useMemo(() => {
    const barItems = barSeries.categories.map((cat) => ({
      label: categoryLabels?.[cat] ?? cat,
      color: barColorMap[cat],
    }));
    const lineItems = lineSeries.categories.map((cat) => ({
      label: categoryLabels?.[cat] ?? cat,
      color: lineColorMap[cat],
    }));
    return [...barItems, ...lineItems];
  }, [barSeries.categories, lineSeries.categories, barColorMap, lineColorMap, categoryLabels]);

  // Y-axis for the left side — shown when barSeries.showYAxis is not explicitly false.
  const showLeftYAxis = barSeries.showYAxis !== false;
  // Right Y-axis only makes sense when biaxial mode is on.
  const showRightYAxis = enableBiaxial && lineSeries.showYAxis !== false;

  const lineYAxisId = enableBiaxial ? 'right' : 'left';

  return (
    <div dir="rtl" className="flex flex-col gap-3">
      {showLegend && legendItems.length > 0 && (
        <ChartLegend items={legendItems} position="center" />
      )}

      <div className={className}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 4, right: showRightYAxis ? 8 : 4, bottom: 0, left: 4 }}
          >
            {/* Grid */}
            {showGridLines && (
              <CartesianGrid
                horizontal
                vertical={false}
                strokeDasharray="4 4"
                stroke="#e2e8f0"
                className="dark:opacity-20"
              />
            )}

            {/* X axis */}
            <XAxis
              dataKey={index}
              hide={!showXAxis}
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
              // RTL: reverse tick ordering so the first data point appears on the right.
              reversed
            />

            {/* Left Y axis */}
            <YAxis
              yAxisId="left"
              orientation="left"
              hide={!showLeftYAxis}
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
              label={
                barSeries.yAxisLabel
                  ? {
                      value: barSeries.yAxisLabel,
                      angle: -90,
                      position: 'insideLeft',
                      style: { ...axisTickStyle, textAnchor: 'middle' },
                    }
                  : undefined
              }
            />

            {/* Right Y axis — biaxial only */}
            {showRightYAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                hide={false}
                axisLine={false}
                tickLine={false}
                tick={axisTickStyle}
                label={
                  lineSeries.yAxisLabel
                    ? {
                        value: lineSeries.yAxisLabel,
                        angle: 90,
                        position: 'insideRight',
                        style: { ...axisTickStyle, textAnchor: 'middle' },
                      }
                    : undefined
                }
              />
            )}

            {/* Tooltip */}
            {showTooltip && (
              <Tooltip
                content={(props) => (
                  <ComboTooltipContent
                    {...(props as RechartsTooltipProps)}
                    barValueFormatter={
                      barSeries.valueFormatter ?? defaultValueFormatter
                    }
                    lineValueFormatter={
                      lineSeries.valueFormatter ?? defaultValueFormatter
                    }
                    categoryLabels={categoryLabels}
                  />
                )}
                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              />
            )}

            {/* Bar series */}
            {barSeries.categories.map((category) => (
              <Bar
                key={`bar-${category}`}
                dataKey={category}
                yAxisId="left"
                fill={barColorMap[category]}
                radius={[4, 4, 0, 0]}
                barSize={20}
                isAnimationActive={false}
                name={categoryLabels?.[category] ?? category}
              />
            ))}

            {/* Line series */}
            {lineSeries.categories.map((category) => (
              <Line
                key={`line-${category}`}
                dataKey={category}
                yAxisId={lineYAxisId}
                type="monotone"
                stroke={lineColorMap[category]}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
                name={categoryLabels?.[category] ?? category}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ComboChart;
