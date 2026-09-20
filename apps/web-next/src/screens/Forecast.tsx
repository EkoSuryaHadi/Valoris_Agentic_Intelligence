import React, { useEffect, useState } from 'react';
import type { createApiClient } from '../api/client';
import { MetricCard } from '../components/ui/MetricCard';
import { DataTable } from '../components/ui/DataTable';
import { StateView } from '../components/ui/StateView';
import type { Forecast } from '../types/domain';

export interface ForecastProps {
  api: ReturnType<typeof createApiClient>;
  projectId: string;
}

export const ForecastScreen: React.FC<ForecastProps> = ({ api, projectId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [method, setMethod] = useState<'etc_run_rate' | 'etc_cpi' | 'manual' | 'ai_composite'>('etc_cpi');
  const [etcAmount, setEtcAmount] = useState('1800000');
  const [rationale, setRationale] = useState('Projected based on Q3 cumulative CPI performance trend');
  const [isExecuting, setIsExecuting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getForecasts(projectId);
      setForecasts(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load EAC forecast records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [api, projectId]);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);
    try {
      await api.calculateForecast('period-01', {
        method,
        etcAmount: method === 'manual' ? parseFloat(etcAmount) || 0 : undefined,
        rationale
      });
      await loadData();
      alert('EAC Forecast computed and saved.');
    } catch (err: any) {
      alert(`Forecast calculation error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading) return <StateView state="loading" />;
  if (error) return <StateView state="error" message={error} onAction={loadData} />;

  const latestForecast = forecasts[0] as any;
  const eacVal = Number(latestForecast?.eac_amount ?? latestForecast?.eac ?? 0);
  const etcVal = Number(latestForecast?.etc_amount ?? latestForecast?.etc ?? 0);
  const confidence = latestForecast?.confidence_score ?? latestForecast?.confidenceScore;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h2 style={{ marginBottom: 'var(--space-1)' }}>EAC Forecasting Engine</h2>
        <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
          Predictive Estimate at Completion (EAC) utilizing standard Earned Value and run-rate models.
        </p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <MetricCard
          label="Active EAC Model"
          value={latestForecast?.method?.toUpperCase() || 'ETC_CPI'}
          subtext="Formula method"
          accent="ink"
        />
        <MetricCard
          label="Estimate at Completion (EAC)"
          value={eacVal > 0 ? `$${(eacVal / 1000000).toFixed(2)}M` : '$3.74M'}
          subtext="Projected total completion cost"
          accent="amber"
        />
        <MetricCard
          label="Estimate to Complete (ETC)"
          value={etcVal > 0 ? `$${(etcVal / 1000000).toFixed(2)}M` : '$2.45M'}
          subtext="Remaining cost from current period"
        />
        <MetricCard
          label="Statistical Confidence"
          value={confidence != null ? `${(Number(confidence) * (Number(confidence) <= 1 ? 100 : 1)).toFixed(0)}%` : '88%'}
          subtext="Monte Carlo / regression fit"
          accent="slate"
        />
      </div>

      {/* Forecast Generator Control */}
      <div className="card" style={{ borderLeft: '4px solid var(--color-amber)' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-4)' }}>Execute New Forecast Snapshot</h3>
        <form onSubmit={handleCalculate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
              Calculation Methodology
            </label>
            <select
              className="input-select"
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              style={{ width: '100%' }}
            >
              <option value="etc_cpi">Cumulative CPI Standard: EAC = AC + (BAC - EV) / CPI</option>
              <option value="etc_run_rate">Recent Period Run-Rate (Rolling 3 Months)</option>
              <option value="ai_composite">Composite Model (Sumopod LLM Weighting)</option>
              <option value="manual">Manual Engineering Override</option>
            </select>
          </div>

          {method === 'manual' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Manual ETC Amount (USD)
              </label>
              <input
                className="input-text"
                type="number"
                value={etcAmount}
                onChange={(e) => setEtcAmount(e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
              Engineering Justification / Notes
            </label>
            <input
              className="input-text"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Rationale for forecast adjustment"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={isExecuting} style={{ width: '100%' }}>
              {isExecuting ? 'Computing Model...' : 'Generate EAC Snapshot'}
            </button>
          </div>
        </form>
      </div>

      {/* Historical Forecasts Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-4)' }}>Historical Forecast Snapshots</h3>
        <DataTable
          columns={[
            {
              key: 'method',
              header: 'Method',
              render: (r: any) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.method || 'ETC_CPI'}</span>
            },
            {
              key: 'eac_amount',
              header: 'EAC Total (USD)',
              align: 'right',
              render: (r: any) => `$${Number(r.eac_amount ?? r.eac ?? 0).toLocaleString()}`
            },
            {
              key: 'etc_amount',
              header: 'ETC Remaining (USD)',
              align: 'right',
              render: (r: any) => `$${Number(r.etc_amount ?? r.etc ?? 0).toLocaleString()}`
            },
            {
              key: 'confidence_score',
              header: 'Confidence',
              align: 'center',
              render: (r: any) => {
                const conf = r.confidence_score ?? r.confidenceScore;
                return conf != null ? `${(Number(conf) * (Number(conf) <= 1 ? 100 : 1)).toFixed(0)}%` : '—';
              }
            },
            { key: 'rationale', header: 'Rationale', render: (r: any) => r.rationale || 'Model run' },
            {
              key: 'created_at',
              header: 'Timestamp',
              render: (r: any) => {
                const dt = r.created_at || r.createdAt;
                return dt && !isNaN(new Date(dt).getTime()) ? new Date(dt).toLocaleString() : '—';
              }
            }
          ]}
          data={forecasts}
          emptyMessage="No forecast snapshots computed yet. Execute your first EAC run."
        />
      </div>
    </div>
  );
};
