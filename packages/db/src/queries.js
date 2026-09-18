const TABLES = new Set(['wbs_nodes', 'cbs_nodes', 'commitments', 'actual_costs', 'accruals', 'invoices']);
export function projectListQuery(organizationId) {
  if (!organizationId?.trim()) throw new Error('organization is required');
  return { text: 'select * from projects where organization_id = $1 order by code', values: [organizationId] };
}
export function scopedTransactionQuery(table, organizationId, projectId) {
  if (!TABLES.has(table)) throw new Error('unsafe or unsupported table name');
  if (!organizationId?.trim() || !projectId?.trim()) throw new Error('organization and project are required');
  return { text: `select ${table}.* from ${table} join projects on projects.id = ${table}.project_id where projects.organization_id = $1 and ${table}.project_id = $2 order by ${table}.id desc`, values: [organizationId, projectId] };
}
