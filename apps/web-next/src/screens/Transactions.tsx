import React, { useEffect, useState } from 'react';
import type { createApiClient } from '../api/client';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StateView } from '../components/ui/StateView';
import { ExportButton } from '../components/ui/ExportButton';
import type { Commitment, ActualCost, Accrual } from '../types/domain';

export interface TransactionsProps {
  api: ReturnType<typeof createApiClient>;
  projectId: string;
}

export const Transactions: React.FC<TransactionsProps> = ({ api, projectId }) => {
  const [activeTab, setActiveTab] = useState<'commitments' | 'actuals' | 'accruals'>('commitments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [actualCosts, setActualCosts] = useState<ActualCost[]>([]);
  const [accruals, setAccruals] = useState<Accrual[]>([]);

  // Creation form modal
  const [isCreating, setIsCreating] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [commRes, actRes, accRes] = await Promise.all([
        api.getCommitments(projectId),
        api.getActualCosts(projectId),
        api.getAccruals(projectId)
      ]);
      setCommitments(commRes.data || []);
      setActualCosts(actRes.data || []);
      setAccruals(accRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load financial transaction ledgers');
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
      const numAmount = parseFloat(amount) || 0;
      if (activeTab === 'commitments') {
        await api.createCommitment(projectId, {
          vendor_name: vendorName,
          po_number: reference,
          committed_amount: numAmount,
          currency: 'USD'
        });
      } else if (activeTab === 'actuals') {
        await api.postActualCost('period-01', {
          invoice_reference: reference,
          actual_amount: numAmount,
          currency: 'USD'
        });
      } else {
        await api.createAccrual('period-01', {
          justification: reference,
          amount: numAmount,
          currency: 'USD'
        });
      }
      setIsCreating(false);
      setVendorName('');
      setAmount('');
      setReference('');
      await loadData();
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    }
  };

  if (loading) return <StateView state="loading" />;
  if (error) return <StateView state="error" message={error} onAction={loadData} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ marginBottom: 'var(--space-1)' }}>Financial Transactions Ledger</h2>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
            Auditable subcontracts, accounts payable actuals, and period-end accruals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <ExportButton
            data={activeTab === 'commitments' ? commitments : activeTab === 'actuals' ? actualCosts : accruals}
            filename={`ledger-${activeTab}-${projectId}`}
          />
          <button className="btn btn-primary btn-sm" onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? 'Cancel' : `+ New ${activeTab === 'commitments' ? 'Commitment' : activeTab === 'actuals' ? 'Actual Cost' : 'Accrual'}`}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-warm-border)', paddingBottom: 'var(--space-2)' }}>
        <button
          className={`btn btn-sm ${activeTab === 'commitments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('commitments')}
        >
          Commitments ({commitments.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'actuals' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('actuals')}
        >
          Actual Costs ({actualCosts.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'accruals' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('accruals')}
        >
          Period Accruals ({accruals.length})
        </button>
      </div>

      {/* Creation Form */}
      {isCreating && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-amber)', background: 'var(--color-warm-paper)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)' }}>
            Record New {activeTab === 'commitments' ? 'Commitment' : activeTab === 'actuals' ? 'Actual Invoice' : 'Accrual Entry'}
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            {activeTab === 'commitments' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Vendor / Contractor
                </label>
                <input
                  className="input-text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Carrier Engineering Ltd."
                  required
                  style={{ width: '100%' }}
                />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Reference ({activeTab === 'commitments' ? 'PO Number' : activeTab === 'actuals' ? 'Invoice Ref' : 'Justification'})
              </label>
              <input
                className="input-text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="REF-2026-001"
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Amount (USD)
              </label>
              <input
                className="input-text"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="125000"
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Post Transaction
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Data Table */}
      <div className="card">
        {activeTab === 'commitments' && (
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
                header: 'Vendor Name',
                sortable: true,
                render: (r: any) => r.vendor_name || r.vendorName || r.vendor || 'Primary Vendor'
              },
              {
                key: 'committed_amount',
                header: 'Committed (USD)',
                align: 'right',
                render: (r: any) => `$${Number(r.committed_amount ?? r.committedAmount ?? r.amount ?? 0).toLocaleString()}`
              },
              {
                key: 'status',
                header: 'Status',
                render: (r: any) => <StatusBadge status={r.status || 'approved'} />
              },
              {
                key: 'created_at',
                header: 'Recorded Date',
                render: (r: any) => {
                  const dt = r.created_at || r.createdAt || r.postedAt || r.posted_at;
                  return dt && !isNaN(new Date(dt).getTime()) ? new Date(dt).toLocaleDateString() : '—';
                }
              }
            ]}
            data={commitments}
            emptyMessage="No commitments registered."
          />
        )}

        {activeTab === 'actuals' && (
          <DataTable
            columns={[
              {
                key: 'invoice_reference',
                header: 'Invoice Number / Ref',
                render: (r: any) => (
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {r.invoice_reference || r.invoiceReference || r.sourceRef || r.source_ref || (r.id ? r.id.slice(0, 8) : 'INV-001')}
                  </span>
                )
              },
              {
                key: 'actual_amount',
                header: 'Amount Paid (USD)',
                align: 'right',
                render: (r: any) => `$${Number(r.actual_amount ?? r.actualAmount ?? r.amount ?? 0).toLocaleString()}`
              },
              {
                key: 'transaction_date',
                header: 'Posting Date',
                render: (r: any) => {
                  const dt = r.transaction_date || r.transactionDate || r.posted_at || r.postedAt || r.created_at || r.createdAt;
                  return dt && !isNaN(new Date(dt).getTime()) ? new Date(dt).toLocaleDateString() : '—';
                }
              }
            ]}
            data={actualCosts}
            emptyMessage="No actual cost invoices posted for this project."
          />
        )}

        {activeTab === 'accruals' && (
          <DataTable
            columns={[
              {
                key: 'justification',
                header: 'Accrual Scope / Justification',
                render: (r: any) => r.justification || r.sourceRef || r.source_ref || 'Period Accrual Adjustment'
              },
              {
                key: 'amount',
                header: 'Accrued Value (USD)',
                align: 'right',
                render: (r: any) => `$${Number(r.amount ?? 0).toLocaleString()}`
              },
              {
                key: 'status',
                header: 'Status',
                render: (r: any) => <StatusBadge status={r.status || 'posted'} />
              }
            ]}
            data={accruals}
            emptyMessage="No period accruals recorded."
          />
        )}
      </div>
    </div>
  );
};
