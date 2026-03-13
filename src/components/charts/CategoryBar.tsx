import React from 'react';
import { getCategoryColors, ChartColorKey, chartColors, defaultColorOrder } from './chartColors';

export interface CategoryBarProps {
  values: number[];
  colors?: ChartColorKey[];
  labels?: string[];
  showLabels?: boolean;
  marker?: { value: number; tooltip?: string };
  className?: string;
}

export function CategoryBar({
  values,
  colors,
  labels,
  showLabels = true,
  marker,
  className,
}: CategoryBarProps): React.ReactElement | null {
  const total = values.reduce((sum, v) => sum + v, 0);

  if (total === 0) return null;

  const palette = colors ?? defaultColorOrder;
  const resolvedColors = values.map((_, index) => {
    const key = palette[index % palette.length];
    return chartColors[key].bg;
  });

  const markerPercent =
    marker !== undefined ? Math.min(100, Math.max(0, (marker.value / total) * 100)) : null;

  return (
    <div className={className}>
      {/* Segmented bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="flex h-full w-full">
          {values.map((value, index) => {
            const widthPercent = (value / total) * 100;
            return (
              <div
                key={index}
                className="h-full transition-all duration-300"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: resolvedColors[index],
                }}
              />
            );
          })}
        </div>

        {/* Marker line */}
        {markerPercent !== null && (
          <div
            className="absolute inset-y-0 flex flex-col items-center"
            style={{ left: `${markerPercent}%` }}
            title={marker?.tooltip}
          >
            {/* Dot at the top */}
            <div className="h-2 w-2 -translate-x-px -translate-y-px rounded-full bg-slate-900 ring-2 ring-white dark:bg-slate-100 dark:ring-slate-800" />
            {/* Vertical line */}
            <div className="w-px flex-1 bg-slate-900 dark:bg-slate-100" />
          </div>
        )}
      </div>

      {/* Labels */}
      {showLabels && labels && labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {labels.map((label, index) => (
            <div key={index} className="flex items-center gap-1.5">
              {/* Color dot */}
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: resolvedColors[index] }}
              />
              {/* Label text */}
              <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
              {/* Bold value */}
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {values[index]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryBar;
