import React, { useEffect, useState } from 'react';
import type { createApiClient } from '../api/client';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StateView } from '../components/ui/StateView';
import type { ChangeOrder } from '../types/domain';

export interface ChangesProps {
  api: ReturnType<typeof createApiClient>;
  projectId: string;
}

export const Changes: React.FC<ChangesProps> = ({ api, projectId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<ChangeOrder[]>([]);

  // Creation form
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountDelta, setAmountDelta] = useState('');
  const [scheduleDeltaDays, setScheduleDeltaDays] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getChanges(projectId);
      setChanges(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load change orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [api, projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createChange(projectId, {
        title,
        description,
        amount_delta: parseFloat(amountDelta) || 0,
        schedule_delta_days: parseInt(scheduleDeltaDays, 10) || 0
      });
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setAmountDelta('');
      setScheduleDeltaDays('');
      await loadData();
    } catch (err: any) {
      alert(`Error proposing change order: ${err.message}`);
    }
  };

  const handleIncorporate = async (changeId: string) => {
    try {
      await api.incorporateChange(changeId);
      await loadData();
      alert('Change order successfully incorporated into baseline envelope.');
    } catch (err: any) {
      alert(`Incorporation error: ${err.message}`);
    }
  };

  if (loading) return <StateView state="loading" />;
  if (error) return <StateView state="error" message={error} onAction={loadData} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ marginBottom: 'var(--space-1)' }}>Scope & Cost Change Management</h2>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
            Formal change requests, cost/schedule impact assessments, and baseline incorporation.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : '+ Propose Change Order'}
        </button>
      </div>

      {/* Propose Change Form */}
      {isCreating && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-amber)', background: 'var(--color-warm-paper)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)' }}>Propose Engineering Change Order (CO)</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Change Order Title
              </label>
              <input
                className="input-text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Deep foundation piling redesign"
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Budget Impact Delta (USD)
              </label>
              <input
                className="input-text"
                type="number"
                value={amountDelta}
                onChange={(e) => setAmountDelta(e.target.value)}
                placeholder="65000"
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Schedule Impact (Days)
              </label>
              <input
                className="input-text"
                type="number"
                value={scheduleDeltaDays}
                onChange={(e) => setScheduleDeltaDays(e.target.value)}
                placeholder="14"
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Engineering Justification & Scope Narrative
              </label>
              <textarea
                className="input-text"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Unforeseen geological obstruction encountered during initial core drilling."
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Submit for Governance Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Orders Table */}
      <div className="card">
        <DataTable
          columns={[
            {
              key: 'title',
              header: 'Change Order Title',
              render: (r: any) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{r.title || r.number || `CO-${r.id?.slice(0, 6)}`}</div>
                  {r.description && <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '2px' }}>{r.description}</div>}
                </div>
              )
            },
            {
              key: 'amount_delta',
              header: 'Cost Delta (USD)',
              align: 'right',
              render: (r: any) => {
                const costDelta = Number(r.amount_delta ?? r.amountDelta ?? r.approvedCost ?? r.estimatedCost ?? 0);
                return (
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: costDelta > 0 ? '#C0392B' : '#2E7D47' }}>
                    {costDelta > 0 ? `+` : ''}${costDelta.toLocaleString()}
                  </span>
                );
              }
            },
            {
              key: 'schedule_delta_days',
              header: 'Schedule (Days)',
              align: 'center',
              render: (r: any) => {
                const days = Number(r.schedule_delta_days ?? r.scheduleDeltaDays ?? r.scheduleImpactDays ?? 0);
                return <span style={{ fontFamily: 'var(--font-mono)' }}>{days > 0 ? `+${days}d` : `${days}d`}</span>;
              }
            },
            {
              key: 'status',
              header: 'Status',
              render: (r: any) => <StatusBadge status={r.status || 'draft'} />
            },
            {
              key: 'actions',
              header: 'Governance Gate',
              render: (r: any) => {
                const st = (r.status || '').toLowerCase();
                return (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    {st === 'approved' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleIncorporate(r.id)}>
                        Incorporate to Baseline
                      </button>
                    )}
                    {st === 'incorporated' && (
                      <span style={{ fontSize: '0.75rem', color: '#2E7D47', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        ✓ Incorporated
                      </span>
                    )}
                    {(st === 'draft' || st === 'pending_approval' || st === 'submitted' || !st) && (
                      <span className="badge badge-amber">
                        Under CCB Review
                      </span>
                    )}
                    {st === 'rejected' && (
                      <span className="badge badge-red">
                        Rejected
                      </span>
                    )}
                  </div>
                );
              }
            }
          ]}
          data={changes}
          emptyMessage="No change orders proposed for this project."
        />
      </div>
    </div>
  );
};
