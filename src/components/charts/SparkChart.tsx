import { useId } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { chartColors, ChartColorKey } from './chartColors';

interface SparkChartProps {
  data: Record<string, any>[];
  index: string;
  categories: string[];
  type?: 'area' | 'bar';
  color?: ChartColorKey;
  className?: string;
}

export function SparkChart({
  data,
  index,
  categories,
  type = 'area',
  color = 'indigo',
  className = 'h-10 w-24',
}: SparkChartProps) {
  const uid = useId();
  const gradientId = `spark-gradient-${uid.replace(/:/g, '')}`;

  if (!data || data.length === 0) {
    return null;
  }

  const palette = chartColors[color];

  if (type === 'bar') {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis dataKey={index} hide />
            <YAxis hide domain={['auto', 'auto']} />
            {categories.map((category) => (
              <Bar
                key={category}
                dataKey={category}
                fill={palette.bg}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.bg} stopOpacity={0.3} />
              <stop offset="100%" stopColor={palette.bg} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey={index} hide />
          <YAxis hide domain={['auto', 'auto']} />
          {categories.map((category) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stroke={palette.bg}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
