import React, { useState } from 'react';
import { StateView } from './StateView';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T | ((row: T) => string);
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRefresh?: () => void;
  // Pagination
  page?: number;
  totalPages?: number;
  totalRecords?: number;
  onPageChange?: (newPage: number) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
  isLoading = false,
  error = null,
  emptyMessage = 'No records found.',
  onRefresh,
  page,
  totalPages,
  totalRecords,
  onPageChange
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [data, sortKey, sortDir]);

  if (isLoading) {
    return <StateView state="loading" />;
  }

  if (error) {
    return <StateView state="error" message={error} onAction={onRefresh} />;
  }

  if (!data || data.length === 0) {
    return <StateView state="empty" message={emptyMessage} onAction={onRefresh} actionLabel="Refresh" />;
  }

  const getKey = (row: T, idx: number): string => {
    if (typeof keyField === 'function') return keyField(row);
    return row[keyField] ? String(row[keyField]) : String(idx);
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left',
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <span style={{ fontSize: '0.75rem' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={getKey(row, idx)}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      textAlign: col.align || 'left'
                    }}
                  >
                    {col.render ? col.render(row) : (row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages !== undefined && totalPages > 1 && onPageChange && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'var(--space-4)',
            padding: 'var(--space-2) var(--space-4)',
            fontSize: '0.8125rem',
            color: 'var(--color-slate-500)',
            background: 'var(--color-warm-paper)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-warm-border)'
          }}
        >
          <div>
            Page <strong style={{ fontFamily: 'var(--font-mono)' }}>{page || 1}</strong> of{' '}
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{totalPages}</strong>
            {totalRecords !== undefined && ` (${totalRecords} total entries)`}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={(page || 1) <= 1}
              onClick={() => onPageChange((page || 1) - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={(page || 1) >= totalPages}
              onClick={() => onPageChange((page || 1) + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
