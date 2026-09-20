import React from 'react';

export interface ExportButtonProps {
  data: Record<string, any>[];
  filename?: string;
  label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename = 'valoris-export',
  label = 'Export CSV'
}) => {
  const exportCsv = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            const val = row[fieldName];
            const escaped = ('' + (val ?? '')).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button className="btn btn-secondary btn-sm" onClick={exportCsv} disabled={!data || data.length === 0}>
      <span style={{ marginRight: '4px' }}>↓</span> {label}
    </button>
  );
};
