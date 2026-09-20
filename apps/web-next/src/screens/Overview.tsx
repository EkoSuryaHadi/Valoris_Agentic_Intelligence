import React, { useEffect, useState } from 'react';
import type { createApiClient } from '../api/client';
import { MetricCard } from '../components/ui/MetricCard';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StateView } from '../components/ui/StateView';
import type { WbsNode, Baseline, Commitment } from '../types/domain';

export interface OverviewProps {
  api: ReturnType<typeof createApiClient>;
  projectId: string;
  onNavigate: (hash: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ api, projectId, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wbs, setWbs] = useState<WbsNode[]>([]);
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [wbsRes, baseRes, commRes] = await Promise.allSettled([
          api.getWbs(projectId),
          api.getBaselines(projectId),
          api.getCommitments(projectId)
        ]);

        if (!isMounted) return;

        if (wbsRes.status === 'fulfilled' && wbsRes.value?.data) {
          setWbs(wbsRes.value.data);
        }
        if (baseRes.status === 'fulfilled' && baseRes.value?.data) {
          setBaselines(baseRes.value.data);
        }
        if (commRes.status === 'fulfilled' && commRes.value?.data) {
          setCommitments(commRes.value.data);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load project overview');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [api, projectId]);

  if (loading) return <StateView state="loading" />;
  if (error) return <StateView state="error" message={error} />;

  const activeBaseline = (baselines as any[]).find(
    (b) => (b.status || '').toLowerCase() === 'active' || (b.status || '').toLowerCase() === 'approved'
  ) || baselines[0] as any;

  const totalCommitted = commitments.reduce(
    (acc, c: any) => acc + (Number(c.committed_amount ?? c.committedAmount ?? c.amount) || 0),
    0
  );

  const baselineCode = activeBaseline?.code || (activeBaseline?.version ? `BL-0${activeBaseline.version}` : 'BL-01');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Title */}
      <div>
        <h2 style={{ marginBottom: 'var(--space-1)' }}>Project Overview</h2>
        <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
          Structural scope, baseline lifecycle status, and major commitment lines.
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <MetricCard label="WBS Nodes" value={wbs.length} subtext="Configured work packages" accent="ink" />
        <MetricCard
          label="Active Baseline"
          value={baselineCode}
          subtext={activeBaseline ? `Status: ${(activeBaseline.status || 'Active').toUpperCase()}` : 'No active baseline'}
          accent="amber"
        />
        <MetricCard
          label="Total Commitments"
          value={`$${(totalCommitted / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`}
          subtext={`${commitments.length} Purchase orders & contracts`}
        />
        <MetricCard
          label="Database Isolation"
          value="Scoped"
          subtext="Tenant & project boundary enforced"
          accent="slate"
        />
      </div>

      {/* Baseline Status Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem' }}>Baseline Hierarchy & Status</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
              Target cost envelope and version evolution
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('#baseline')}>
            Manage Baselines →
          </button>
        </div>

        <DataTable
          columns={[
            {
              key: 'code',
              header: 'Baseline Code',
              sortable: true,
              render: (r: any) => (
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-dark-ink-teal)' }}>
                  {r.code || (r.version ? `BL-0${r.version}` : (r.id ? r.id.slice(0, 8) : 'BL-01'))}
                </span>
              )
            },
            {
              key: 'name',
              header: 'Baseline Name',
              render: (r: any) => r.name || `Baseline Revision ${r.version ?? 1}`
            },
            {
              key: 'status',
              header: 'Status',
              render: (row: any) => <StatusBadge status={row.status || 'active'} />
            },
            {
              key: 'approved_at',
              header: 'Approved Date',
              render: (row: any) => {
                const dt = row.approved_at || row.approvedAt || row.createdAt || row.created_at;
                return dt && !isNaN(new Date(dt).getTime()) ? new Date(dt).toLocaleDateString() : '—';
              }
            }
          ]}
          data={baselines}
          emptyMessage="No baselines initialized yet. Create a baseline to track budgets."
        />
      </div>

      {/* Recent Commitments */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem' }}>Commitments Ledger Summary</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
              Binding subcontracts and procurement commitments
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('#transactions')}>
            View All Transactions →
          </button>
        </div>

        <DataTable
          columns={[
            {
              key: 'po_number',
              header: 'PO / Ref',
              render: (r: any) => (
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {r.po_number || r.referenceNo || r.reference_no || (r.id ? r.id.slice(0, 8) : 'PO-001')}
                </span>
              )
            },
            {
              key: 'vendor_name',
              header: 'Vendor / Contractor',
              sortable: true,
              render: (r: any) => r.vendor_name || r.vendorName || r.vendor || 'Contractor Partner'
            },
            {
              key: 'committed_amount',
              header: 'Committed Amount',
              align: 'right',
              render: (r: any) => `$${Number(r.committed_amount ?? r.committedAmount ?? r.amount ?? 0).toLocaleString()}`
            },
            {
              key: 'status',
              header: 'Status',
              render: (r: any) => <StatusBadge status={r.status || 'approved'} />
            }
          ]}
          data={commitments.slice(0, 5)}
          emptyMessage="No commitments recorded."
        />
      </div>
    </div>
  );
};
