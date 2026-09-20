import React, { useState } from 'react';
import type { createApiClient } from '../api/client';
import { StateView } from '../components/ui/StateView';

export interface ImportsProps {
  api: ReturnType<typeof createApiClient>;
  projectId: string;
}

export const Imports: React.FC<ImportsProps> = ({ api, projectId }) => {
  const [importType, setImportType] = useState('commitments');
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(
      [
        { vendor_name: 'Apex Structural Steel Inc.', committed_amount: 450000, currency: 'USD', po_number: 'PO-2026-089' },
        { vendor_name: 'Pinnacle Concrete Works', committed_amount: 280000, currency: 'USD', po_number: 'PO-2026-090' }
      ],
      null,
      2
    )
  );
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commitStatus, setCommitStatus] = useState<string | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    setCommitStatus(null);
    try {
      const records = JSON.parse(payloadText);
      const res = await api.previewImport(projectId, { importType, records });
      setPreviewResult((res as any).data || res);
    } catch (err: any) {
      setError(`Import validation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!previewResult) return;
    setLoading(true);
    setError(null);
    try {
      const importId = previewResult.importId || `import-${Date.now()}`;
      await api.commitImport(projectId, { importId });
      setCommitStatus('Batch import committed successfully to Neon PG ledger.');
      setPreviewResult(null);
    } catch (err: any) {
      setError(`Commit fault: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h2 style={{ marginBottom: 'var(--space-1)' }}>Data Ingestion & ERP Staging</h2>
        <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
          Batch import commitments, actual costs, and baselines with pre-commit validation.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Input Configuration */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-4)' }}>Staging Configuration</h3>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
              Target Resource Type
            </label>
            <select
              className="input-select"
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="commitments">Commitments (Purchase Orders / Subcontracts)</option>
              <option value="actual_costs">Actual Costs (Invoices / General Ledger)</option>
              <option value="accruals">Accruals (Period End Work-in-Progress)</option>
              <option value="wbs">WBS Nodes (Scope Breakdown)</option>
            </select>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
              Batch Payload (JSON Array)
            </label>
            <textarea
              className="input-text"
              rows={12}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary" onClick={handlePreview} disabled={loading}>
              {loading ? 'Validating Schema...' : 'Validate & Preview'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setPayloadText('');
                setPreviewResult(null);
                setCommitStatus(null);
              }}
              disabled={loading || !payloadText}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Validation Result */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-4)' }}>Validation Inspector</h3>

          {error && <StateView state="error" message={error} />}
          {commitStatus && (
            <div style={{ padding: 'var(--space-4)', background: 'rgba(51, 138, 100, 0.12)', border: '1px solid #276749', color: '#276749', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', fontWeight: 600 }}>
              {commitStatus}
            </div>
          )}

          {!previewResult && !error && !commitStatus && (
            <StateView
              state="empty"
              title="Awaiting Staging"
              message="Select an import type and click 'Validate & Preview' to inspect records prior to permanent commitment."
            />
          )}

          {previewResult && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--color-warm-paper)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--space-4)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem'
                }}
              >
                <span>Valid Records: <strong style={{ color: '#276749' }}>{previewResult.validCount ?? 'OK'}</strong></span>
                <span>Anomalies / Errors: <strong style={{ color: '#9B2C2C' }}>{previewResult.errorCount ?? 0}</strong></span>
              </div>

              <pre
                style={{
                  padding: 'var(--space-4)',
                  background: 'var(--color-dark-ink-teal)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  maxHeight: '260px'
                }}
              >
                {JSON.stringify(previewResult, null, 2)}
              </pre>

              <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <button className="btn btn-secondary" onClick={() => setPreviewResult(null)}>
                  Discard
                </button>
                <button className="btn btn-primary" onClick={handleCommit} disabled={loading}>
                  {loading ? 'Committing...' : 'Commit to Project Ledger'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
