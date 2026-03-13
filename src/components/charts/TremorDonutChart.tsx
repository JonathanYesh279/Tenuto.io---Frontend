import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import { getCategoryColors, ChartColorKey } from './chartColors';

export interface TremorDonutChartProps {
  data: Record<string, any>[];
  category: string;
  value: string;
  colors?: ChartColorKey[];
  variant?: 'donut' | 'pie';
  label?: string;
  showLabel?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
}

const defaultValueFormatter = (v: number): string =>
  v.toLocaleString('he-IL');

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
  valueFormatter = defaultValueFormatter,
  className = 'h-48',
}: TremorDonutChartProps) {
  const isDonut = variant === 'donut';

  // Build a stable colour map keyed by segment name
  const categoryNames = useMemo(
    () => data.map((d) => String(d[category] ?? '')),
    [data, category],
  );

  const colorMap = useMemo(
    () => getCategoryColors(categoryNames, colors),
    [categoryNames, colors],
  );

  const legendItems = useMemo(
    () =>
      categoryNames.map((name) => ({
        label: name,
        color: colorMap[name],
      })),
    [categoryNames, colorMap],
  );

  // Custom tooltip renderer — bridges Recharts payload shape → ChartTooltip props
  const renderTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: any[];
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    const mapped = payload.map((p: any) => ({
      name: String(p.name ?? ''),
      value: Number(p.value ?? 0),
      color: String(p.payload?.fill ?? p.color ?? '#6b7280'),
    }));

    return (
      <ChartTooltip
        active={active}
        payload={mapped}
        valueFormatter={valueFormatter}
      />
    );
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`} dir="rtl">
      {/* Chart area — takes all remaining height */}
      <div className="relative flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={value}
              nameKey={category}
              cx="50%"
              cy="50%"
              innerRadius={isDonut ? '60%' : 0}
              outerRadius="85%"
              startAngle={90}
              endAngle={-270}
              stroke="white"
              strokeWidth={2}
              isAnimationActive={true}
            >
              {data.map((entry, index) => {
                const name = String(entry[category] ?? '');
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorMap[name]}
                  />
                );
              })}
            </Pie>

            {showTooltip && (
              <Tooltip
                content={renderTooltip as any}
                cursor={false}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        {/* Center label — donut only */}
        {isDonut && showLabel && label != null && label !== '' && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-center text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight max-w-[40%] break-words">
              {label}
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && legendItems.length > 0 && (
        <ChartLegend items={legendItems} position="center" />
      )}
    </div>
  );
}

export default TremorDonutChart;
