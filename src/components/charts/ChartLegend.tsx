import React from 'react';

export interface LegendItem {
  label: string;
  color: string;
}

export type LegendPosition = 'right' | 'center' | 'left';

export interface ChartLegendProps {
  items: LegendItem[];
  position?: LegendPosition;
}

const positionClass: Record<LegendPosition, string> = {
  right:  'justify-end',
  center: 'justify-center',
  left:   'justify-start',
};

export function ChartLegend({ items, position = 'center' }: ChartLegendProps) {
  return (
    <ul
      className={`flex flex-wrap gap-4 ${positionClass[position]}`}
      role="list"
    >
      {items.map((item, index) => (
        <li
          key={`${item.label}-${index}`}
          className="flex items-center gap-1.5"
        >
          <span
            className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default ChartLegend;
