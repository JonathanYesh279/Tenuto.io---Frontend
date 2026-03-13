import React from 'react';

export interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  valueFormatter?: (value: number) => string;
}

const defaultValueFormatter = (value: number): string =>
  value.toLocaleString('he-IL');

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = defaultValueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 px-4 py-3 text-right min-w-[10rem]">
      {label != null && label !== '' && (
        <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </p>
      )}
      <ul className="flex flex-col gap-1.5">
        {payload.map((item, index) => (
          <li
            key={`${item.name}-${index}`}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {valueFormatter(item.value)}
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              {item.name}
              <span
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChartTooltip;
