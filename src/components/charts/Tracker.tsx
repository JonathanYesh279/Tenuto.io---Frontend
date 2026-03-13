import React from 'react';

export interface TrackerBlock {
  color?: string;
  tooltip?: string;
}

export interface TrackerProps {
  data: TrackerBlock[];
  defaultColor?: string;
  className?: string;
}

export function Tracker({
  data,
  defaultColor = 'bg-slate-200 dark:bg-slate-700',
  className,
}: TrackerProps): React.ReactElement {
  return (
    <div className={`flex gap-0.5 ${className ?? ''}`}>
      {data.map((block, index) => (
        <div
          key={index}
          className={`h-8 flex-1 rounded-sm transition-opacity hover:opacity-80 ${block.color ?? defaultColor}`}
          title={block.tooltip}
        />
      ))}
    </div>
  );
}

export default Tracker;
