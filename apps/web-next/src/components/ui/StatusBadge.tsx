import React from 'react';

export interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const getVariant = () => {
    if (variant) return variant;
    const s = (status || '').toLowerCase();
    if (['approved', 'active', 'completed', 'posted', 'incorporated', 'low'].includes(s)) return 'success';
    if (['draft', 'pending', 'under_review', 'medium', 'running'].includes(s)) return 'warning';
    if (['rejected', 'cancelled', 'high', 'critical', 'failed'].includes(s)) return 'danger';
    if (['superseded', 'closed', 'mitigated', 'dismissed'].includes(s)) return 'info';
    return 'default';
  };

  const v = getVariant();
  const getStyles = () => {
    switch (v) {
      case 'success':
        return { background: 'rgba(51, 138, 100, 0.12)', color: '#276749', borderColor: 'rgba(51, 138, 100, 0.3)' };
      case 'warning':
        return { background: 'rgba(212, 135, 28, 0.12)', color: '#975A16', borderColor: 'rgba(212, 135, 28, 0.3)' };
      case 'danger':
        return { background: 'rgba(197, 48, 48, 0.12)', color: '#9B2C2C', borderColor: 'rgba(197, 48, 48, 0.3)' };
      case 'info':
        return { background: 'rgba(49, 130, 206, 0.12)', color: '#2B6CB0', borderColor: 'rgba(49, 130, 206, 0.3)' };
      default:
        return { background: 'rgba(113, 128, 150, 0.12)', color: '#4A5568', borderColor: 'rgba(113, 128, 150, 0.3)' };
    }
  };

  const st = getStyles();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: '0.75rem',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        borderRadius: '3px',
        border: `1px solid ${st.borderColor}`,
        background: st.background,
        color: st.color,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}
    >
      {status}
    </span>
  );
};
