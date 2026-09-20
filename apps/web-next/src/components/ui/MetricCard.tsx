import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  change?: {
    value: number | string;
    direction: 'up' | 'down' | 'neutral';
    isGood?: boolean;
  };
  accent?: 'amber' | 'ink' | 'slate' | 'default';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  change,
  accent = 'default',
  onClick
}) => {
  const getAccentColor = () => {
    switch (accent) {
      case 'amber':
        return 'var(--color-amber)';
      case 'ink':
        return 'var(--color-dark-ink-teal)';
      case 'slate':
        return 'var(--color-slate-500)';
      default:
        return 'var(--color-ink)';
    }
  };

  return (
    <div
      className="card card-hover"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `4px solid ${getAccentColor()}`
      }}
    >
      <div
        style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-slate-500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--color-ink)',
          lineHeight: 1.1
        }}
      >
        {value}
      </div>
      {(subtext || change) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: '0.8125rem',
            color: 'var(--color-slate-400)'
          }}
        >
          {change && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: change.isGood
                  ? '#276749'
                  : change.direction === 'neutral'
                  ? 'var(--color-slate-500)'
                  : '#9B2C2C'
              }}
            >
              {change.direction === 'up' ? '▲' : change.direction === 'down' ? '▼' : '—'} {change.value}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
};
