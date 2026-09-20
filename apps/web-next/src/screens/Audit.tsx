import React, { useEffect, useState } from 'react';
import type { createApiClient } from '../api/client';
import { DataTable } from '../components/ui/DataTable';
import { StateView } from '../components/ui/StateView';
import { ExportButton } from '../components/ui/ExportButton';
import type { AuditEvent } from '../types/domain';

export interface AuditProps {
  api: ReturnType<typeof createApiClient>;
  projectId: string;
}

export const Audit: React.FC<AuditProps> = ({ api, projectId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAuditEvents(projectId);
      setEvents(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [api, projectId]);

  if (loading) return <StateView state="loading" />;
  if (error) return <StateView state="error" message={error} onAction={loadData} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ marginBottom: 'var(--space-1)' }}>Immutable Audit Trail</h2>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
            Append-only system audit log recording all user transactions, model runs, and state transitions.
          </p>
        </div>
        <ExportButton data={events} filename={`audit-${projectId}`} label="Export Audit Log" />
      </div>

      {/* Main Audit Table */}
      <div className="card">
        <DataTable
          columns={[
            {
              key: 'created_at',
              header: 'Timestamp',
              sortable: true,
              render: (r: any) => {
                const dt = r.created_at || r.createdAt;
                return (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                    {dt && !isNaN(new Date(dt).getTime()) ? new Date(dt).toLocaleString() : 'Recent'}
                  </span>
                );
              }
            },
            {
              key: 'event_type',
              header: 'Event Type',
              render: (r: any) => {
                const evt = r.event_type || r.action || r.eventType || r.entity_type || 'SYSTEM_AUDIT';
                return (
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-dark-ink-teal)' }}>
                    {evt}
                  </span>
                );
              }
            },
            {
              key: 'actor_id',
              header: 'Actor',
              render: (r: any) => {
                const actor = r.actor_id || r.actorUserId || r.actorType || r.actor || 'usr-admin-01';
                return <span style={{ fontFamily: 'var(--font-mono)' }}>{actor}</span>;
              }
            },
            {
              key: 'actions',
              header: 'Payload Details',
              render: (r: any) => (
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedEvent(r)}>
                  Inspect Payload
                </button>
              )
            }
          ]}
          data={events}
          emptyMessage="No audit records logged yet."
        />
      </div>

      {/* Selected Payload Modal/Drawer */}
      {selectedEvent && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-dark-ink-teal)', background: 'var(--color-warm-paper)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: '1rem' }}>
              Audit Event Payload: <code>{selectedEvent.event_type}</code>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedEvent(null)}>
              Close
            </button>
          </div>
          <pre
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-dark-ink-teal)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              overflowX: 'auto',
              maxHeight: '300px'
            }}
          >
            {JSON.stringify(selectedEvent, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
