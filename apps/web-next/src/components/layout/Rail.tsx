import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  hash: string;
  icon: string;
  badge?: number | string;
  group: 'executive' | 'control' | 'analytics' | 'governance';
}

export const NAV_ITEMS: NavItem[] = [
  // Executive
  { id: 'executive', label: 'Executive Cockpit', hash: '#executive', icon: '◈', group: 'executive' },
  { id: 'overview', label: 'Project Overview', hash: '#overview', icon: '◉', group: 'executive' },

  // Control
  { id: 'structure', label: 'Structure (WBS)', hash: '#structure', icon: '◫', group: 'control' },
  { id: 'baseline', label: 'Baselines & Budgets', hash: '#baseline', icon: '☰', group: 'control' },
  { id: 'imports', label: 'Data Ingestion', hash: '#imports', icon: '⤓', group: 'control' },
  { id: 'transactions', label: 'Commitments & Actuals', hash: '#transactions', icon: '⇄', group: 'control' },
  { id: 'changes', label: 'Change Management', hash: '#changes', icon: '◬', group: 'control' },

  // Analytics
  { id: 'forecast', label: 'EAC Forecasting', hash: '#forecast', icon: '∿', group: 'analytics' },
  { id: 'evm', label: 'Earned Value (EVM)', hash: '#evm', icon: '⋈', group: 'analytics' },
  { id: 'cashflow', label: 'Cash Flow Curves', hash: '#cashflow', icon: '〰', group: 'analytics' },
  { id: 'risks', label: 'Cost Risk Register', hash: '#risks', icon: '⚠', group: 'analytics' },

  // Governance & AI
  { id: 'agents', label: 'Agent Intelligence', hash: '#agents', icon: '✦', badge: '5 Rules + AI', group: 'governance' },
  { id: 'reports', label: 'Audit & Reports', hash: '#reports', icon: '📄', group: 'governance' },
  { id: 'audit', label: 'Immutable Audit Log', hash: '#audit', icon: '🔒', group: 'governance' }
];

export interface RailProps {
  currentHash: string;
  onNavigate: (hash: string) => void;
  activeFindingCount?: number;
}

export const Rail: React.FC<RailProps> = ({
  currentHash,
  onNavigate,
  activeFindingCount
}) => {
  const groups = [
    { key: 'executive', title: 'Executive' },
    { key: 'control', title: 'Project Controls' },
    { key: 'analytics', title: 'Performance Analytics' },
    { key: 'governance', title: 'Advisory & Assurance' }
  ];

  return (
    <aside className="nav-rail">
      <div
        style={{
          padding: 'var(--space-4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)'
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            background: 'var(--color-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-dark-ink-teal)',
            fontWeight: 800,
            fontSize: '0.875rem'
          }}
        >
          V
        </div>
        <div>
          <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.02em' }}>
            VALORIS
          </div>
          <div style={{ color: 'var(--color-slate-400)', fontSize: '0.6875rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Agentic Controls
          </div>
        </div>
      </div>

      <div style={{ padding: 'var(--space-3) 0', flex: 1, overflowY: 'auto' }}>
        {groups.map((grp) => {
          const items = NAV_ITEMS.filter((i) => i.group === grp.key);
          return (
            <div key={grp.key} style={{ marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  padding: '0 var(--space-4) var(--space-1)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--sidebar-muted)'
                }}
              >
                {grp.title}
              </div>
              {items.map((item) => {
                const isActive = currentHash === item.hash || (!currentHash && item.hash === '#executive');
                const badgeText = item.id === 'agents' && activeFindingCount ? `${activeFindingCount}` : item.badge;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.hash)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '7px var(--space-4)',
                      background: isActive ? 'rgba(212, 135, 28, 0.16)' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? '3px solid var(--color-amber)' : '3px solid transparent',
                      color: isActive ? '#FFFFFF' : '#AEBCBD',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 600 : 500,
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.background = 'var(--sidebar-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#AEBCBD';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ marginRight: 'var(--space-3)', width: '16px', textAlign: 'center', opacity: isActive ? 1 : 0.85 }}>
                      {item.icon}
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {badgeText && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          background: item.id === 'agents' && activeFindingCount ? 'var(--color-amber)' : 'rgba(255, 255, 255, 0.12)',
                          color: item.id === 'agents' && activeFindingCount ? 'var(--color-dark-ink-teal)' : 'var(--color-slate-300)',
                          fontWeight: 700
                        }}
                      >
                        {badgeText}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.6875rem',
          color: 'var(--color-slate-400)',
          fontFamily: 'var(--font-mono)'
        }}
      >
        <div>SYSTEM: NEON PG + SUMOPOD</div>
        <div style={{ color: 'var(--color-slate-500)', marginTop: '2px' }}>BUILD v2.0.0-PROD</div>
      </div>
    </aside>
  );
};
