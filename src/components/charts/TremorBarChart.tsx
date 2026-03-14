import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';
import { getCategoryColors, ChartColorKey } from './chartColors';

export interface BarClickPayload {
  index: string;
  category: string;
  value: number;
  row: Record<string, any>;
  rect: { x: number; y: number; width: number; height: number };
}

export interface TremorBarChartProps {
  data: Record<string, any>[];
  index: string;
  categories: string[];
  colors?: ChartColorKey[];
  type?: 'default' | 'stacked' | 'percent';
  layout?: 'horizontal' | 'vertical';
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGridLines?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
  barRadius?: number;
  barSize?: number;
  className?: string;
  categoryLabels?: Record<string, string>;
  showLabels?: boolean;
  onBarClick?: (payload: BarClickPayload) => void;
}

const defaultValueFormatter = (value: number): string =>
  value.toLocaleString('he-IL');

function getBarRadius(
  categoryIndex: number,
  totalCategories: number,
  radius: number,
  type: 'default' | 'stacked' | 'percent',
): [number, number, number, number] {
  if (type === 'default') {
    return [radius, radius, 0, 0];
  }
  const isTop = categoryIndex === totalCategories - 1;
  const isBottom = categoryIndex === 0;
  return [
    isTop ? radius : 0,
    isTop ? radius : 0,
    isBottom ? radius : 0,
    isBottom ? radius : 0,
  ];
}

function toPercentData(
  data: Record<string, any>[],
  index: string,
  categories: string[],
): Record<string, any>[] {
  return data.map((row) => {
    const total = categories.reduce(
      (sum, cat) => sum + (Number(row[cat]) || 0),
      0,
    );
    const newRow: Record<string, any> = { [index]: row[index] };
    categories.forEach((cat) => {
      newRow[cat] = total === 0 ? 0 : ((Number(row[cat]) || 0) / total) * 100;
    });
    return newRow;
  });
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
  valueFormatter = defaultValueFormatter,
  barRadius = 4,
  barSize,
  className = 'h-72',
  categoryLabels,
  showLabels = false,
  onBarClick,
}: TremorBarChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const colorMap = useMemo(
    () => getCategoryColors(categories, colors),
    [categories, colors],
  );

  const chartData = useMemo(
    () => (type === 'percent' ? toPercentData(data, index, categories) : data),
    [data, index, categories, type],
  );

  const percentFormatter = (value: number) => `${value.toFixed(1)}%`;
  const activeFormatter = type === 'percent' ? percentFormatter : valueFormatter;

  const legendItems = useMemo(
    () =>
      categories.map((cat) => ({
        label: categoryLabels?.[cat] ?? cat,
        color: colorMap[cat],
      })),
    [categories, colorMap, categoryLabels],
  );

  const isVertical = layout === 'vertical';
  const isStacked = type === 'stacked' || type === 'percent';

  const axisTickStyle = {
    fontSize: 12,
    fill: '#94a3b8',
  };

  const axisProps = {
    tick: axisTickStyle,
    axisLine: false,
    tickLine: false,
  } as any;

  // When showLabels is on, hide Y-axis to avoid label/axis number overlap
  const effectiveShowYAxis = showLabels ? false : showYAxis;

  return (
    <div className={`flex flex-col gap-3 ${className}`} dir="rtl">
      {showLegend && <ChartLegend items={legendItems} position="right" />}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ top: showLabels ? 24 : 4, right: 8, bottom: 4, left: 8 }}
        >
          {showGridLines && (
            <CartesianGrid
              horizontal={!isVertical}
              vertical={isVertical}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
              className="dark:opacity-20"
            />
          )}

          {!isVertical && (
            <>
              <XAxis
                dataKey={index}
                hide={!showXAxis}
                {...axisProps}
                tickFormatter={(value) =>
                  categoryLabels?.[value] ?? String(value)
                }
              />
              <YAxis
                hide={!effectiveShowYAxis}
                {...axisProps}
                tickFormatter={activeFormatter}
                width={48}
              />
            </>
          )}

          {isVertical && (
            <>
              <YAxis
                dataKey={index}
                type="category"
                hide={!showYAxis}
                {...axisProps}
                tickFormatter={(value) =>
                  categoryLabels?.[value] ?? String(value)
                }
                width={80}
              />
              <XAxis
                type="number"
                hide={!showXAxis}
                {...axisProps}
                tickFormatter={activeFormatter}
              />
            </>
          )}

          {showTooltip && (
            <Tooltip
              cursor={{ fill: 'rgba(99,102,241,0.08)' }}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload?.map((p) => ({
                    name: categoryLabels?.[p.dataKey as string] ?? (p.name as string),
                    value: Number(p.value),
                    color: p.fill as string,
                  }))}
                  label={String(label)}
                  valueFormatter={activeFormatter}
                />
              )}
            />
          )}

          {categories.map((cat, idx) => {
            const [tl, tr, br, bl] = getBarRadius(
              idx,
              categories.length,
              barRadius,
              type,
            );

            return (
              <Bar
                key={cat}
                dataKey={cat}
                name={categoryLabels?.[cat] ?? cat}
                fill={colorMap[cat]}
                radius={[tl, tr, br, bl]}
                stackId={isStacked ? 'stack' : undefined}
                barSize={barSize}
                cursor={onBarClick ? 'pointer' : undefined}
                onClick={onBarClick ? (barData: any) => {
                  if (!barData) return;
                  onBarClick({
                    index: barData[index],
                    category: cat,
                    value: Number(barData[cat]) || 0,
                    row: barData,
                    rect: { x: 0, y: 0, width: 0, height: 0 },
                  });
                } : undefined}
              >
                {onBarClick && data.map((_, i) => (
                  <Cell
                    key={i}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
                {showLabels && (
                  <LabelList
                    dataKey={cat}
                    position="top"
                    style={{ fontSize: 12, fontWeight: 700, fill: colorMap[cat] }}
                    formatter={(v: number) => (v > 0 ? v : '')}
                  />
                )}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TremorBarChart;
