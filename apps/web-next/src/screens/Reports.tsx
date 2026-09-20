import React, { useState } from 'react';
import type { createApiClient } from '../api/client';

export interface ReportsProps {
  api: ReturnType<typeof createApiClient>;
  projectId: string;
}

const REPORT_TEMPLATES = [
  {
    id: 'exec-summary',
    title: 'Executive Monthly Cost Summary',
    description: 'Comprehensive overview of BAC, EAC, VAC, CPI, SPI, and high-severity cost risk drivers.',
    format: 'CSV / JSON'
  },
  {
    id: 'wbs-commitments',
    title: 'WBS & Purchase Order Commitment Ledger',
    description: 'Control account breakdown with committed amounts, invoices paid, and remaining uncommitted budget.',
    format: 'CSV / JSON'
  },
  {
    id: 'evm-variance',
    title: 'EVM Standard Variance Breakdown (ANSI-748)',
    description: 'Period-by-period PV, EV, AC, CV, SV, and TCPI performance metrics with formula traces.',
    format: 'CSV / JSON'
  },
  {
    id: 'risk-exposure',
    title: 'Quantitative Risk EMV & Contingency Report',
    description: 'Register of probabilistic cost risks, expected values, and active mitigation allocations.',
    format: 'CSV / JSON'
  },
  {
    id: 'audit-trail',
    title: 'Immutable Ledger Audit Trail',
    description: 'Cryptographically verifiable, chronological record of all state modifications and human-in-the-loop approvals.',
    format: 'CSV / JSON'
  }
];

export const Reports: React.FC<ReportsProps> = ({ api, projectId }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadReport = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      let data: any[] = [];
      if (reportId === 'exec-summary' || reportId === 'evm-variance') {
        const res = await api.getEvm(projectId);
        data = res.data || [];
      } else if (reportId === 'wbs-commitments') {
        const res = await api.getCommitments(projectId);
        data = res.data || [];
      } else if (reportId === 'risk-exposure') {
        const res = await api.getRisks(projectId);
        data = res.data || [];
      } else {
        const res = await api.getAuditEvents(projectId);
        data = res.data || [];
      }

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportId}-${projectId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Report download error: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h2 style={{ marginBottom: 'var(--space-1)' }}>Report Catalog & Data Export</h2>
        <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
          Standardized project control deliverables, compliance packages, and audit extracts.
        </p>
      </div>

      {/* Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
        {REPORT_TEMPLATES.map((tpl) => (
          <div key={tpl.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '190px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>{tpl.title}</h3>
                <span className="badge badge-subtle" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>
                  {tpl.format}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
                {tpl.description}
              </p>
            </div>

            <div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownloadReport(tpl.id)}
                disabled={downloadingId === tpl.id}
                style={{ width: '100%' }}
              >
                {downloadingId === tpl.id ? 'Compiling Export...' : 'Download Deliverable Package'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
