export const chartColors = {
  indigo: { bg: '#6366f1', light: '#c7d2fe' },
  emerald: { bg: '#10b981', light: '#a7f3d0' },
  amber:   { bg: '#f59e0b', light: '#fde68a' },
  sky:     { bg: '#0ea5e9', light: '#bae6fd' },
  rose:    { bg: '#f43f5e', light: '#fecdd3' },
  violet:  { bg: '#8b5cf6', light: '#ddd6fe' },
  cyan:    { bg: '#06b6d4', light: '#a5f3fc' },
  lime:    { bg: '#84cc16', light: '#d9f99d' },
  pink:    { bg: '#ec4899', light: '#fbcfe8' },
  gray:    { bg: '#6b7280', light: '#d1d5db' },
} as const;

export type ChartColorKey = keyof typeof chartColors;

export type ChartColorVariant = 'bg' | 'light';

export const defaultColorOrder: ChartColorKey[] = [
  'indigo',
  'emerald',
  'amber',
  'sky',
  'rose',
  'violet',
  'cyan',
  'lime',
  'pink',
  'gray',
];

/**
 * Returns a chart color hex string for a given index and variant.
 * Cycles through defaultColorOrder if index exceeds palette length.
 */
export function getChartColor(
  index: number,
  variant: ChartColorVariant = 'bg',
): string {
  const key = defaultColorOrder[index % defaultColorOrder.length];
  return chartColors[key][variant];
}

/**
 * Maps an array of category strings to their corresponding color hex strings.
 * An optional colors array can override the default palette order.
 */
export function getCategoryColors(
  categories: string[],
  colors?: ChartColorKey[],
): Record<string, string> {
  const palette = colors ?? defaultColorOrder;
  return Object.fromEntries(
    categories.map((category, index) => {
      const key = palette[index % palette.length];
      return [category, chartColors[key].bg];
    }),
  );
}
