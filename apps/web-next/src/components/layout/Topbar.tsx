import React from 'react';
import type { UserContext, UserRole, ProjectSummary } from '../../types/auth';

export interface TopbarProps {
  userContext: UserContext;
  projects: ProjectSummary[];
  onProjectChange: (projectId: string) => void;
  onRoleChange: (role: UserRole) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  userContext,
  projects,
  onProjectChange,
  onRoleChange,
  onRefresh,
  isRefreshing = false
}) => {
  const roles: UserRole[] = ['executive', 'project_controls', 'cost_engineer', 'auditor', 'viewer'];

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {/* Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-500)', textTransform: 'uppercase' }}>
            Project:
          </span>
          <select
            className="input-select"
            value={userContext.projectId}
            onChange={(e) => onProjectChange(e.target.value)}
            style={{ minWidth: '220px', padding: '4px 8px', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}
          >
            {projects.length > 0 ? (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))
            ) : (
              <option value={userContext.projectId}>{userContext.projectId}</option>
            )}
          </select>
        </div>

        {/* Tenant Scope indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-slate-400)', fontFamily: 'var(--font-mono)' }}>
          <span>ORG:</span>
          <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{userContext.organizationId}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-500)', textTransform: 'uppercase' }}>
            Role:
          </span>
          <select
            className="input-select"
            value={userContext.role}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            style={{ minWidth: '130px', padding: '6px 28px 6px 10px', fontSize: '0.8125rem' }}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Active Dataset"
        >
          {isRefreshing ? 'Syncing...' : '↻ Refresh'}
        </button>

        {/* Status indicator */}
        <div className="pulse-badge">
          <span className="pulse-dot" />
          <span>NEON LIVE</span>
        </div>
      </div>
    </header>
  );
};
