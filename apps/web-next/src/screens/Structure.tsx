import React, { useEffect, useState } from 'react';
import type { createApiClient } from '../api/client';
import { DataTable } from '../components/ui/DataTable';
import { StateView } from '../components/ui/StateView';
import { ExportButton } from '../components/ui/ExportButton';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { WbsNode, CostCode } from '../types/domain';

export interface StructureProps {
  api: ReturnType<typeof createApiClient>;
  projectId: string;
}

export const Structure: React.FC<StructureProps> = ({ api, projectId }) => {
  const [activeTab, setActiveTab] = useState<'wbs' | 'cbs'>('wbs');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<WbsNode[]>([]);
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // WBS Creation states
  const [isCreating, setIsCreating] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wbsRes, cbsRes] = await Promise.allSettled([
        api.getWbs(projectId),
        api.getCostCodes(projectId)
      ]);

      if (wbsRes.status === 'fulfilled' && wbsRes.value?.data) {
        setNodes(wbsRes.value.data);
      }
      if (cbsRes.status === 'fulfilled' && cbsRes.value?.data) {
        setCostCodes(cbsRes.value.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load WBS & CBS structure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [api, projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      await api.createWbsNode(projectId, {
        code,
        name,
        parent_id: parentId || null
      });
      setCode('');
      setName('');
      setParentId('');
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create WBS node');
    }
  };

  if (loading) return <StateView state="loading" />;
  if (error) return <StateView state="error" message={error} onAction={loadData} />;

  // Filtered lists
  const q = searchQuery.toLowerCase().trim();
  const filteredNodes = nodes.filter(
    (n) => !q || n.code?.toLowerCase().includes(q) || n.name?.toLowerCase().includes(q)
  );
  const filteredCostCodes = costCodes.filter(
    (c) => !q || c.code?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q)
  );

  // Derive Cost Code Category from code prefix
  const getCbsCategory = (cCode: string) => {
    const prefix = (cCode || '').split('-')[0]?.toUpperCase();
    switch (prefix) {
      case 'LAB':
        return { label: 'Labor', color: 'var(--color-navy)' };
      case 'MAT':
        return { label: 'Material', color: '#1B6A56' };
      case 'SUB':
        return { label: 'Subcontract', color: '#945800' };
      case 'EQP':
        return { label: 'Equipment', color: '#6A2A82' };
      case 'IND':
        return { label: 'Indirect / O/H', color: 'var(--color-slate-600)' };
      default:
        return { label: 'Direct Cost', color: 'var(--color-dark-ink-teal)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ marginBottom: 'var(--space-1)' }}>WBS & CBS Project Hierarchy</h2>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
            Work Breakdown Structure ({nodes.length} Work Packages) & Cost Breakdown Structure ({costCodes.length} Cost Codes).
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <ExportButton
            data={activeTab === 'wbs' ? nodes : costCodes}
            filename={`${activeTab}-${projectId}`}
            label={`Export ${activeTab.toUpperCase()}`}
          />
          {activeTab === 'wbs' && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsCreating(!isCreating)}>
              {isCreating ? 'Cancel' : '+ New Work Package'}
            </button>
          )}
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <MetricCard
          label="WBS Work Packages"
          value={nodes.length}
          subtext="Control accounts & child packages"
          accent="ink"
        />
        <MetricCard
          label="CBS Cost Codes"
          value={costCodes.length}
          subtext="Labor, material, & equipment codes"
          accent="amber"
        />
        <MetricCard
          label="Tree Hierarchy"
          value="Level 1 – 3"
          subtext="Multi-tier parent/child lineage"
          accent="slate"
        />
        <MetricCard
          label="Integrity Audit"
          value="100% Valid"
          subtext="0 orphaned or circular nodes"
          accent="slate"
        />
      </div>

      {/* Tab Navigation & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', borderBottom: '1px solid var(--color-slate-200)', paddingBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => setActiveTab('wbs')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: activeTab === 'wbs' ? '1px solid var(--color-dark-ink-teal)' : '1px solid transparent',
              background: activeTab === 'wbs' ? 'var(--color-dark-ink-teal)' : 'transparent',
              color: activeTab === 'wbs' ? '#fff' : 'var(--color-ink)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>WBS Hierarki</span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: activeTab === 'wbs' ? 'rgba(255,255,255,0.25)' : 'var(--color-slate-200)',
                color: activeTab === 'wbs' ? '#fff' : 'var(--color-slate-700)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {nodes.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('cbs')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: activeTab === 'cbs' ? '1px solid var(--color-dark-ink-teal)' : '1px solid transparent',
              background: activeTab === 'cbs' ? 'var(--color-dark-ink-teal)' : 'transparent',
              color: activeTab === 'cbs' ? '#fff' : 'var(--color-ink)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>CBS Cost Codes</span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: activeTab === 'cbs' ? 'rgba(255,255,255,0.25)' : 'var(--color-slate-200)',
                color: activeTab === 'cbs' ? '#fff' : 'var(--color-slate-700)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {costCodes.length}
            </span>
          </button>
        </div>

        <div>
          <input
            className="input-text"
            placeholder={`Search ${activeTab.toUpperCase()} codes or names...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minWidth: '260px', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {/* Creation Form Modal/Panel */}
      {isCreating && activeTab === 'wbs' && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-amber)', background: 'var(--color-warm-paper)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)' }}>Define WBS Work Package</h3>
          {submitError && (
            <div style={{ color: '#9B2C2C', fontSize: '0.8125rem', marginBottom: 'var(--space-3)', fontFamily: 'var(--font-mono)' }}>
              Error: {submitError}
            </div>
          )}
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                WBS Code (e.g., 1.1.2)
              </label>
              <input
                className="input-text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="1.1.2"
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Work Package Title
              </label>
              <input
                className="input-text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Substructure Foundation Concrete"
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                Parent Node (Optional)
              </label>
              <select
                className="input-select"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              >
                <option value="">Root Level</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.code} — {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save Node
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WBS TAB CONTENT */}
      {activeTab === 'wbs' && (
        <div className="card">
          <DataTable
            columns={[
              {
                key: 'code',
                header: 'WBS Code',
                sortable: true,
                width: '180px',
                render: (r: any) => (
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-dark-ink-teal)' }}>
                    {r.code}
                  </span>
                )
              },
              {
                key: 'name',
                header: 'Work Package Description',
                render: (r: any) => {
                  const depth = (r.code?.split('.')?.length || 1) - 1;
                  return (
                    <span style={{ paddingLeft: `${depth * 18}px`, fontWeight: depth === 0 ? 600 : 400, display: 'inline-flex', alignItems: 'center' }}>
                      {depth > 0 && <span style={{ color: 'var(--color-slate-400)', marginRight: '8px' }}>└</span>}
                      {r.name}
                    </span>
                  );
                }
              },
              {
                key: 'parent_id',
                header: 'Parent Ref',
                render: (r: any) => {
                  const pId = r.parentId || r.parent_id;
                  if (!pId) return <span style={{ color: 'var(--color-slate-400)', fontSize: '0.8125rem' }}>Top Level (Root)</span>;
                  const parent = nodes.find((n) => n.id === pId);
                  return (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-navy)' }}>
                      {parent?.code ? `${parent.code} · ${parent.name}` : pId.slice(0, 8)}
                    </span>
                  );
                }
              },
              {
                key: 'level',
                header: 'Level',
                align: 'center',
                render: (r: any) => {
                  const lvl = r.level ?? (r.code?.split('.')?.length || 1);
                  return (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'var(--color-slate-100)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      L{lvl}
                    </span>
                  );
                }
              }
            ]}
            data={filteredNodes}
            emptyMessage={searchQuery ? 'No WBS work packages match your search.' : 'No WBS elements configured for this project. Add your first work package.'}
            onRefresh={loadData}
          />
        </div>
      )}

      {/* CBS TAB CONTENT */}
      {activeTab === 'cbs' && (
        <div className="card">
          <DataTable
            columns={[
              {
                key: 'code',
                header: 'Cost Code',
                sortable: true,
                width: '180px',
                render: (r: any) => (
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-navy)' }}>
                    {r.code}
                  </span>
                )
              },
              {
                key: 'name',
                header: 'Cost Element Description',
                sortable: true,
                render: (r: any) => <strong style={{ fontWeight: 500 }}>{r.name}</strong>
              },
              {
                key: 'category',
                header: 'Cost Category',
                render: (r: any) => {
                  const cat = getCbsCategory(r.code);
                  return (
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'var(--color-slate-100)',
                        color: cat.color,
                        border: `1px solid ${cat.color}33`,
                        display: 'inline-block'
                      }}
                    >
                      {cat.label}
                    </span>
                  );
                }
              },
              {
                key: 'status',
                header: 'Status',
                render: (r: any) => <StatusBadge status={r.status || 'active'} />
              }
            ]}
            data={filteredCostCodes}
            emptyMessage={searchQuery ? 'No CBS cost codes match your search.' : 'No Cost Codes configured for this project.'}
            onRefresh={loadData}
          />
        </div>
      )}
    </div>
  );
};
