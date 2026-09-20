import React from 'react';
import { Rail } from './Rail';
import { Topbar } from './Topbar';
import type { UserContext, UserRole, ProjectSummary } from '../../types/auth';

export interface ShellProps {
  currentHash: string;
  onNavigate: (hash: string) => void;
  userContext: UserContext;
  projects: ProjectSummary[];
  onProjectChange: (projectId: string) => void;
  onRoleChange: (role: UserRole) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  activeFindingCount?: number;
  toastMessage?: string | null;
  onDismissToast?: () => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentHash,
  onNavigate,
  userContext,
  projects,
  onProjectChange,
  onRoleChange,
  onRefresh,
  isRefreshing = false,
  activeFindingCount = 0,
  toastMessage,
  onDismissToast,
  children
}) => {
  return (
    <div className="app-shell">
      <Rail
        currentHash={currentHash}
        onNavigate={onNavigate}
        activeFindingCount={activeFindingCount}
      />
      <div className="main-content">
        <Topbar
          userContext={userContext}
          projects={projects}
          onProjectChange={onProjectChange}
          onRoleChange={onRoleChange}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />

        {toastMessage && (
          <div
            style={{
              margin: 'var(--space-4) var(--space-8) 0',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-dark-ink-teal)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <span>{toastMessage}</span>
            {onDismissToast && (
              <button
                onClick={onDismissToast}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0 4px'
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        <main style={{ padding: 'var(--space-8)', flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
