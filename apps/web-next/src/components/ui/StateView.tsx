import React from 'react';

export type ViewState = 'loading' | 'empty' | 'error' | 'stale' | 'locked';

export interface StateViewProps {
  state: ViewState;
  title?: string;
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const StateView: React.FC<StateViewProps> = ({
  state,
  title,
  message,
  onAction,
  actionLabel
}) => {
  const getDefaultContent = () => {
    switch (state) {
      case 'loading':
        return {
          title: 'Retrieving Records',
          message: 'Synchronizing project ledgers and audit records...'
        };
      case 'empty':
        return {
          title: 'No Data Present',
          message: 'No records matching the active project filters were found.'
        };
      case 'error':
        return {
          title: 'Ledger Query Fault',
          message: 'An error occurred while executing the transaction query.'
        };
      case 'stale':
        return {
          title: 'Stale Period Cache',
          message: 'Records may not reflect recent change order incorporations.'
        };
      case 'locked':
        return {
          title: 'Period Closed / Read-Only',
          message: 'This accounting period has been finalized. Modifications require formal change approval.'
        };
    }
  };

  const defaults = getDefaultContent();
  const displayTitle = title || defaults.title;
  const displayMsg = message || defaults.message;

  return (
    <div className={`state-${state}`} style={{ margin: 'var(--space-4) 0', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
        <h4 style={{ marginBottom: 'var(--space-2)', color: 'inherit' }}>{displayTitle}</h4>
        <p style={{ fontSize: '0.875rem', marginBottom: onAction ? 'var(--space-4)' : 0, color: 'inherit', opacity: 0.85 }}>
          {displayMsg}
        </p>
        {onAction && (
          <button className="btn btn-secondary" onClick={onAction} style={{ marginTop: 'var(--space-2)' }}>
            {actionLabel || 'Retry'}
          </button>
        )}
      </div>
    </div>
  );
};
