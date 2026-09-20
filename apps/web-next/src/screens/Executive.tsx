import React, { useEffect, useState } from 'react';
import type { createApiClient } from '../api/client';
import { MetricCard } from '../components/ui/MetricCard';
import { SCurve, SCurveDataPoint } from '../components/charts/SCurve';
import { TrendLine } from '../components/charts/TrendLine';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StateView } from '../components/ui/StateView';
import type { AgentFinding, EvmMetrics, ChangeOrder } from '../types/domain';

export interface ExecutiveProps {
  api: ReturnType<typeof createApiClient>;
  projectId: string;
  onNavigate: (hash: string) => void;
}

export const Executive: React.FC<ExecutiveProps> = ({ api, projectId, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evm, setEvm] = useState<EvmMetrics | null>(null);
  const [pendingChanges, setPendingChanges] = useState<ChangeOrder[]>([]);
  const [findings, setFindings] = useState<AgentFinding[]>([]);
  const [sCurveData, setSCurveData] = useState<SCurveDataPoint[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [evmRes, changesRes, findingsRes, summaryRes] = await Promise.allSettled([
          api.getEvm(projectId),
          api.getChanges(projectId),
          api.getAgentFindings(projectId),
          api.getCostSummary(projectId)
        ]);

        if (!isMounted) return;

        let costSummary: any = null;
        if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
          costSummary = summaryRes.value.data;
        }

        if (evmRes.status === 'fulfilled' && evmRes.value?.data?.length) {
          const latest = evmRes.value.data[evmRes.value.data.length - 1];
          setEvm({
            ...latest,
            bac: latest.bac || costSummary?.bac || 3500000,
            eac: latest.eac || costSummary?.eac || 3740000,
            cpi: latest.cpi || costSummary?.cpi || 0.94,
            spi: latest.spi || costSummary?.spi || 0.96
          });
        } else {
          setEvm({
            id: 'demo',
            project_id: projectId,
            pv: costSummary?.commitments || 1250000,
            ev: costSummary?.actualCost || 1180000,
            ac: costSummary?.actualCost || 1290000,
            cpi: costSummary?.cpi || 0.94,
            spi: costSummary?.spi || 0.96,
            cv: -110000,
            sv: -70000,
            bac: costSummary?.bac || 3500000,
            etc: costSummary?.etc || 2450000,
            eac: costSummary?.eac || 3740000,
            tcpi: 1.05
          });
        }

        if (changesRes.status === 'fulfilled' && changesRes.value?.data) {
          setPendingChanges(changesRes.value.data.filter((c: any) => {
            const st = (c.status || '').toUpperCase();
            return st === 'PENDING' || st === 'PENDING_APPROVAL' || st === 'DRAFT' || st === 'SUBMITTED';
          }));
        }

        if (findingsRes.status === 'fulfilled' && findingsRes.value?.data) {
          const activeStatuses = ['new', 'active', 'open'];
          setFindings(findingsRes.value.data.filter((f: any) => !f.status || activeStatuses.includes((f.status || '').toLowerCase())));
        }

        // Mock historical trend curve points anchored by realistic progression
        setSCurveData([
          { period: 'M01', pv: 150000, ev: 145000, ac: 140000 },
          { period: 'M02', pv: 380000, ev: 370000, ac: 395000 },
          { period: 'M03', pv: 720000, ev: 680000, ac: 740000 },
          { period: 'M04', pv: 1250000, ev: 1180000, ac: 1290000 },
          { period: 'M05', pv: 1850000, forecast: 1980000 },
          { period: 'M06', pv: 2500000, forecast: 2680000 },
          { period: 'M07', pv: 3100000, forecast: 3320000 },
          { period: 'M08', pv: 3500000, forecast: 3740000 }
        ]);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load executive metrics');
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

  const cpi = Number(evm?.cpi || 0.94);
  const spi = Number(evm?.spi || 0.96);
  const bac = Number(evm?.bac || 3500000);
  const eac = Number(evm?.eac || 3740000);
  const varianceAtCompletion = bac - eac;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ marginBottom: 'var(--space-1)' }}>Executive Cockpit</h2>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
            High-level performance indexes, variance exposure, and decision approvals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('#agents')}>
            ✦ View Agent Findings ({findings.length})
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('#forecast')}>
            Execute Run-Rate Forecast
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)'
        }}
      >
        <MetricCard
          label="Budget at Completion (BAC)"
          value={`$${(bac / 1000000).toFixed(2)}M`}
          subtext="Approved baseline scope"
          accent="ink"
        />
        <MetricCard
          label="Estimate at Completion (EAC)"
          value={`$${(eac / 1000000).toFixed(2)}M`}
          change={{
            value: `$${Math.abs(varianceAtCompletion / 1000).toFixed(0)}k`,
            direction: varianceAtCompletion >= 0 ? 'up' : 'down',
            isGood: varianceAtCompletion >= 0
          }}
          subtext={varianceAtCompletion >= 0 ? 'Favorable VAC' : 'Unfavorable Overrun'}
          accent="amber"
        />
        <MetricCard
          label="Cost Performance (CPI)"
          value={cpi.toFixed(2)}
          change={{
            value: (cpi - 1.0).toFixed(2),
            direction: cpi >= 1.0 ? 'up' : 'down',
            isGood: cpi >= 1.0
          }}
          subtext={cpi >= 1.0 ? 'Under budget trajectory' : 'Cost burn exceeds earned'}
          accent={cpi < 0.95 ? 'amber' : 'ink'}
        />
        <MetricCard
          label="Schedule Performance (SPI)"
          value={spi.toFixed(2)}
          change={{
            value: (spi - 1.0).toFixed(2),
            direction: spi >= 1.0 ? 'up' : 'down',
            isGood: spi >= 1.0
          }}
          subtext={spi >= 1.0 ? 'Ahead of schedule' : 'Behind planned progress'}
        />
      </div>

      {/* S-Curve & Performance Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem' }}>Cumulative S-Curve (PV vs EV vs AC & Forecast)</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
              Values in USD across project lifecycle periods
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontFamily: 'var(--font-mono)' }}>CPI Trend:</span>
            <TrendLine values={[0.98, 0.96, 0.93, 0.91]} color="var(--color-amber)" width={80} height={24} />
          </div>
        </div>

        <SCurve data={sCurveData} height={280} currency="$" />
      </div>

      {/* Split Section: Pending Decision Queue & Urgent Agent Findings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Decision Queue */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: '1rem' }}>Pending Change Approvals</h3>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-slate-500)' }}>
              {pendingChanges.length} Awaiting Review
            </span>
          </div>

          {pendingChanges.length === 0 ? (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
              No outstanding change orders requiring executive sign-off.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {pendingChanges.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: 'var(--space-3)',
                    border: '1px solid var(--color-warm-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-warm-paper)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                      Impact: +${Number(c.estimatedCost || c.amountDelta || c.amount_delta || 0).toLocaleString()} | Exposure: ${Number(c.exposure || 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <StatusBadge status={c.status} />
                    <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('#changes')}>
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI & Rule Agent Findings */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: '1rem' }}>Agent Governance Inbox</h3>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-slate-500)' }}>
              {findings.length} Open Findings
            </span>
          </div>

          {findings.length === 0 ? (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
              All cost variance and commitment gap rules currently within tolerance.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {findings.slice(0, 4).map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: 'var(--space-3)',
                    border: '1px solid var(--color-warm-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-warm-paper)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <StatusBadge status={f.severity || 'medium'} />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{f.title}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '4px' }}>
                      Agent: <code>{f.agentType || f.agent_name || 'Rule Agent'}</code>
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('#agents')}>
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
