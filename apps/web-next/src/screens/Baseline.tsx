import React, { useEffect, useState } from 'react';
import type { createApiClient } from '../api/client';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StateView } from '../components/ui/StateView';
import type { Baseline, WbsNode } from '../types/domain';

export interface BaselineProps {
  api: ReturnType<typeof createApiClient>;
  projectId: string;
}

export const BaselineScreen: React.FC<BaselineProps> = ({ api, projectId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [wbs, setWbs] = useState<WbsNode[]>([]);
  const [selectedBaseline, setSelectedBaseline] = useState<Baseline | null>(null);

  // Creation & Transition states
  const [isCreatingBaseline, setIsCreatingBaseline] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  const [isAddingLine, setIsAddingLine] = useState(false);
  const [lineWbsId, setLineWbsId] = useState('');
  const [lineCostElement, setLineCostElement] = useState('');
  const [lineAmount, setLineAmount] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [baseRes, wbsRes] = await Promise.all([
        api.getBaselines(projectId),
        api.getWbs(projectId)
      ]);
      const list = baseRes.data || [];
      setBaselines(list);
      setWbs(wbsRes.data || []);
      if (list.length > 0 && !selectedBaseline) {
        setSelectedBaseline(list.find((b) => b.status === 'active') || list[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load baseline ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [api, projectId]);

  const handleCreateBaseline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBaseline(projectId, { code: newCode, name: newName });
      setNewCode('');
      setNewName('');
      setIsCreatingBaseline(false);
      await loadData();
    } catch (err: any) {
      alert(`Error creating baseline: ${err.message}`);
    }
  };

  const handleTransition = async (baselineId: string, nextStatus: string) => {
    try {
      await api.transitionBaseline(baselineId, {
        status: nextStatus,
        actor: 'user',
        reason: `Promoted to ${nextStatus} via control console`
      });
      await loadData();
    } catch (err: any) {
      alert(`Transition error: ${err.message}`);
    }
  };

  const handleAddBudgetLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBaseline) return;
    try {
      await api.createBudgetLine(selectedBaseline.id, {
        wbs_node_id: lineWbsId || (wbs[0]?.id ?? ''),
        cost_element_code: lineCostElement,
        amount: parseFloat(lineAmount) || 0,
        currency: 'USD'
      });
      setIsAddingLine(false);
      setLineCostElement('');
      setLineAmount('');
      alert('Budget line added successfully.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <StateView state="loading" />;
  if (error) return <StateView state="error" message={error} onAction={loadData} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ marginBottom: 'var(--space-1)' }}>Baselines & Budgets</h2>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
            Formal target cost baselines, life-cycle gate transitions, and control account lines.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setIsCreatingBaseline(!isCreatingBaseline)}>
          {isCreatingBaseline ? 'Cancel' : '+ New Baseline'}
        </button>
      </div>

      {isCreatingBaseline && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-amber)', background: 'var(--color-warm-paper)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)' }}>Initialize Project Baseline</h3>
          <form onSubmit={handleCreateBaseline} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Baseline Code
              </label>
              <input
                className="input-text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="BL-01-REV0"
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Baseline Name
              </label>
              <input
                className="input-text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Original Sanctioned Budget"
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Create Baseline
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Baselines Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-4)' }}>Baseline Ledger</h3>
        <DataTable
          columns={[
            {
              key: 'code',
              header: 'Code',
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
              render: (r: any) => r.name || `Sanctioned Budget Revision ${r.version ?? 1}`
            },
            {
              key: 'status',
              header: 'Status',
              render: (r: any) => <StatusBadge status={r.status || 'draft'} />
            },
            {
              key: 'gates',
              header: 'Workflow Gates',
              render: (r: any) => {
                const st = (r.status || '').toLowerCase();
                return (
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {st === 'draft' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleTransition(r.id, 'under_review')}>
                        Submit for Review
                      </button>
                    )}
                    {st === 'under_review' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleTransition(r.id, 'approved')}>
                        Approve
                      </button>
                    )}
                    {st === 'approved' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleTransition(r.id, 'active')}>
                        Activate Baseline
                      </button>
                    )}
                    {st === 'active' && (
                      <span style={{ fontSize: '0.75rem', color: '#2E7D47', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        ✓ Active Scope
                      </span>
                    )}
                  </div>
                );
              }
            },
            {
              key: 'budget_lines',
              header: 'Control Accounts',
              align: 'right',
              render: (r: any) => (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedBaseline(r);
                    setIsAddingLine(true);
                  }}
                >
                  + Budget Line
                </button>
              )
            }
          ]}
          data={baselines}
          emptyMessage="No baseline versions registered."
        />
      </div>

      {/* Add Line Form */}
      {isAddingLine && selectedBaseline && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-dark-ink-teal)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)' }}>
            Append Budget Line to <code>{selectedBaseline.code}</code>
          </h3>
          <form onSubmit={handleAddBudgetLine} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Control Account / WBS
              </label>
              <select
                className="input-select"
                value={lineWbsId}
                onChange={(e) => setLineWbsId(e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              >
                {wbs.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Cost Element (CBS)
              </label>
              <input
                className="input-text"
                value={lineCostElement}
                onChange={(e) => setLineCostElement(e.target.value)}
                placeholder="LAB-ENG-01"
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Allocated Budget (USD)
              </label>
              <input
                className="input-text"
                type="number"
                value={lineAmount}
                onChange={(e) => setLineAmount(e.target.value)}
                placeholder="500000"
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
              <button type="submit" className="btn btn-primary">
                Commit Line
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddingLine(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
