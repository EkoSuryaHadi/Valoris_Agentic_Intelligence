import React, { useEffect, useState } from 'react';
import type { createApiClient } from '../api/client';
import { MetricCard } from '../components/ui/MetricCard';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StateView } from '../components/ui/StateView';
import type { Risk } from '../types/domain';

export interface RisksProps {
  api: ReturnType<typeof createApiClient>;
  projectId: string;
}

export const RisksScreen: React.FC<RisksProps> = ({ api, projectId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);

  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Procurement');
  const [probability, setProbability] = useState('0.3');
  const [impactAmount, setImpactAmount] = useState('150000');
  const [mitigation, setMitigation] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRisks(projectId);
      setRisks(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load risk register');
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
      const prob = parseFloat(probability) || 0;
      const impact = parseFloat(impactAmount) || 0;
      await api.createRisk(projectId, {
        title,
        category,
        probability: prob,
        impact_amount: impact,
        expected_value: prob * impact,
        mitigation_strategy: mitigation,
        status: 'open'
      });
      setIsCreating(false);
      setTitle('');
      setMitigation('');
      await loadData();
    } catch (err: any) {
      alert(`Error creating risk entry: ${err.message}`);
    }
  };

  if (loading) return <StateView state="loading" />;
  if (error) return <StateView state="error" message={error} onAction={loadData} />;

  const totalExposure = risks.reduce((acc, r) => acc + (Number(r.exposure || r.expected_value || r.expectedValue || 0)), 0);
  const activeRisks = risks.filter((r) => !r.status || (r.status || '').toUpperCase() === 'OPEN' || (r.status || '').toLowerCase() === 'open');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ marginBottom: 'var(--space-1)' }}>Cost Risk Register</h2>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
            Quantitative Expected Monetary Value (EMV) risk register and contingency provisioning.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : '+ Add Risk Item'}
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <MetricCard
          label="Total Risk EMV Exposure"
          value={`$${(totalExposure / 1000).toFixed(0)}k`}
          subtext="Probability-weighted risk burden"
          accent="amber"
        />
        <MetricCard
          label="Open Risks"
          value={activeRisks.length}
          subtext={`Out of ${risks.length} registered risks`}
          accent="ink"
        />
        <MetricCard
          label="Contingency Adequacy"
          value="82%"
          subtext="Unallocated contingency ratio"
          accent="slate"
        />
      </div>

      {/* Creation Form */}
      {isCreating && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-amber)', background: 'var(--color-warm-paper)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)' }}>Register Cost Risk Event</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Risk Description
              </label>
              <input
                className="input-text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Steel tariff escalation or supply delay"
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Category
              </label>
              <select
                className="input-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Procurement">Procurement</option>
                <option value="Technical">Technical</option>
                <option value="Regulatory">Regulatory</option>
                <option value="Market">Market / Inflation</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Probability (0.01 - 1.0)
              </label>
              <input
                className="input-text"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Impact Severity (USD)
              </label>
              <input
                className="input-text"
                type="number"
                value={impactAmount}
                onChange={(e) => setImpactAmount(e.target.value)}
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Mitigation Response Strategy
              </label>
              <input
                className="input-text"
                value={mitigation}
                onChange={(e) => setMitigation(e.target.value)}
                placeholder="Pre-order raw material under firm fixed-price framework"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Log Risk Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Risks Table */}
      <div className="card">
        <DataTable
          columns={[
            {
              key: 'title',
              header: 'Risk Event & Mitigation',
              render: (r: any) => {
                const mitigation = r.mitigation_strategy || r.mitigationStrategy || r.mitigation || (r.severity ? `Severity: ${r.severity}` : 'Contingency allocated');
                return (
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.title || 'Unidentified Risk Event'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                      Mitigation: {mitigation}
                    </div>
                  </div>
                );
              }
            },
            { key: 'category', header: 'Category', render: (r: any) => r.category || 'TECHNICAL' },
            {
              key: 'probability',
              header: 'Prob.',
              align: 'center',
              render: (r: any) => {
                const p = Number(r.probability ?? 0.25);
                const pPct = p <= 1 ? p * 100 : p;
                return <span style={{ fontFamily: 'var(--font-mono)' }}>{pPct.toFixed(0)}%</span>;
              }
            },
            {
              key: 'impact_amount',
              header: 'Impact (USD)',
              align: 'right',
              render: (r: any) => {
                const imp = Number(r.impact_amount ?? r.impact ?? r.impactAmount ?? 0);
                return `$${imp.toLocaleString()}`;
              }
            },
            {
              key: 'expected_value',
              header: 'EMV Exposure',
              align: 'right',
              render: (r: any) => {
                const imp = Number(r.impact_amount ?? r.impact ?? r.impactAmount ?? 0);
                const p = Number(r.probability ?? 0.25);
                const pFrac = p <= 1 ? p : p / 100;
                const exp = Number(r.expected_value ?? r.expectedValue ?? r.exposure ?? (imp * pFrac));
                return (
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-amber)' }}>
                    ${exp.toLocaleString()}
                  </span>
                );
              }
            },
            {
              key: 'status',
              header: 'Status',
              render: (r: any) => <StatusBadge status={r.status || 'open'} />
            }
          ]}
          data={risks}
          emptyMessage="No cost risks registered."
        />
      </div>
    </div>
  );
};
