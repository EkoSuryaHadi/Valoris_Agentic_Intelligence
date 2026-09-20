import React, { useState } from 'react';

export interface SCurveDataPoint {
  period: string;
  pv: number;
  ev?: number;
  ac?: number;
  forecast?: number;
}

export interface SCurveProps {
  data: SCurveDataPoint[];
  height?: number;
  currency?: string;
}

export const SCurve: React.FC<SCurveProps> = ({
  data,
  height = 320,
  currency = 'USD'
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-slate-400)', fontFamily: 'var(--font-mono)' }}>
        Insufficient cumulative curve data
      </div>
    );
  }

  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const width = 720;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max value across all series
  const allValues = data.flatMap((d) => [d.pv, d.ev || 0, d.ac || 0, d.forecast || 0]);
  const maxValue = Math.max(...allValues, 1000);

  const getX = (index: number) => padding.left + (index / (data.length - 1 || 1)) * chartWidth;
  const getY = (val: number) => padding.top + chartHeight - (val / maxValue) * chartHeight;

  // Path generators
  const generatePath = (valKey: 'pv' | 'ev' | 'ac' | 'forecast') => {
    const points = data
      .map((d, i) => {
        const val = d[valKey];
        if (val === undefined || val === null) return null;
        return `${getX(i)},${getY(val)}`;
      })
      .filter(Boolean);

    if (points.length < 2) return '';
    return `M ${points.join(' L ')}`;
  };

  const pvPath = generatePath('pv');
  const evPath = generatePath('ev');
  const acPath = generatePath('ac');
  const forecastPath = generatePath('forecast');

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return val.toFixed(0);
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-2)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: 'var(--color-dark-ink-teal)' }} />
          <span>Planned Value (PV)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: 'var(--color-amber)' }} />
          <span>Earned Value (EV)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: '#9B2C2C' }} />
          <span>Actual Cost (AC)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '2px', borderTop: '2px dashed var(--color-slate-400)' }} />
          <span>EAC Forecast</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: `${height}px` }}>
        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + chartHeight * (1 - pct);
          const val = maxValue * pct;
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--color-warm-border)" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-slate-400)" fontFamily="var(--font-mono)">
                {formatCurrency(val)}
              </text>
            </g>
          );
        })}

        {/* X Axis labels */}
        {data.map((d, i) => {
          const x = getX(i);
          return (
            <text key={i} x={x} y={height - 10} textAnchor="middle" fontSize="10" fill="var(--color-slate-500)" fontFamily="var(--font-mono)">
              {d.period}
            </text>
          );
        })}

        {/* Series Paths */}
        {pvPath && <path d={pvPath} fill="none" stroke="var(--color-dark-ink-teal)" strokeWidth="2.5" />}
        {evPath && <path d={evPath} fill="none" stroke="var(--color-amber)" strokeWidth="2.5" />}
        {acPath && <path d={acPath} fill="none" stroke="#9B2C2C" strokeWidth="2.5" />}
        {forecastPath && <path d={forecastPath} fill="none" stroke="var(--color-slate-400)" strokeWidth="2" strokeDasharray="4 4" />}

        {/* Data points and hover detection */}
        {data.map((d, i) => {
          const x = getX(i);
          return (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              {/* Invisible touch/hover target */}
              <rect x={x - 15} y={padding.top} width="30" height={chartHeight} fill="transparent" style={{ cursor: 'pointer' }} />
              {d.pv !== undefined && <circle cx={x} cy={getY(d.pv)} r="3" fill="var(--color-dark-ink-teal)" />}
              {d.ev !== undefined && <circle cx={x} cy={getY(d.ev)} r="3" fill="var(--color-amber)" />}
              {d.ac !== undefined && <circle cx={x} cy={getY(d.ac)} r="3" fill="#9B2C2C prime" />}
            </g>
          );
        })}

        {/* Active hover vertical cursor */}
        {hoveredIdx !== null && (
          <g>
            <line
              x1={getX(hoveredIdx)}
              y1={padding.top}
              x2={getX(hoveredIdx)}
              y2={padding.top + chartHeight}
              stroke="var(--color-ink)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          </g>
        )}
      </svg>

      {/* Tooltip display */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          style={{
            marginTop: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--color-ink)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            display: 'inline-flex',
            gap: 'var(--space-4)'
          }}
        >
          <span><strong>{data[hoveredIdx].period}</strong></span>
          <span>PV: {currency} {data[hoveredIdx].pv.toLocaleString()}</span>
          {data[hoveredIdx].ev !== undefined && <span>EV: {currency} {data[hoveredIdx].ev?.toLocaleString()}</span>}
          {data[hoveredIdx].ac !== undefined && <span>AC: {currency} {data[hoveredIdx].ac?.toLocaleString()}</span>}
        </div>
      )}
    </div>
  );
};
