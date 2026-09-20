import React from 'react';

export interface TrendLineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}

export const TrendLine: React.FC<TrendLineProps> = ({
  values,
  color = 'var(--color-amber)',
  width = 120,
  height = 36
}) => {
  if (!values || values.length < 2) {
    return <span style={{ color: 'var(--color-slate-400)', fontSize: '0.75rem' }}>—</span>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', verticalAlign: 'middle' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
      />
    </svg>
  );
};
