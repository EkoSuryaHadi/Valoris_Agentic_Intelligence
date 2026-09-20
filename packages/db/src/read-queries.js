const ALLOWED_READ_TABLES = new Set([
  'wbs_nodes',
  'cbs_nodes',
  'cost_codes',
  'baselines',
  'budget_lines',
  'reporting_periods',
  'commitments',
  'actual_costs',
  'accruals',
  'forecasts',
  'evm_snapshots',
  'changes',
  'risks',
  'agent_findings',
  'cash_flow_snapshots',
  'audit_events'
]);

const DEFAULT_ORDER = {
  cost_codes: 'code asc',
  reporting_periods: 'period_start desc',
  commitments: 'id desc',
  actual_costs: 'posted_at desc',
  accruals: 'id desc',
  forecasts: 'created_at desc',
  evm_snapshots: 'created_at desc',
  changes: 'created_at desc',
  risks: 'created_at desc',
  agent_findings: 'created_at desc',
  cash_flow_snapshots: 'created_at desc',
  audit_events: 'created_at desc'
};

export function projectScopedReadQuery(table, organizationId, projectId, { page = 1, limit = 50 } = {}) {
  if (!ALLOWED_READ_TABLES.has(table)) {
    throw new Error(`unsupported or unsafe read table: ${table}`);
  }
  if (!organizationId?.trim() || !projectId?.trim()) {
    throw new Error('organizationId and projectId are required');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;
  const orderClause = DEFAULT_ORDER[table] || 'id desc';

  return {
    dataQuery: {
      text: `select ${table}.* from ${table} join projects on projects.id = ${table}.project_id where projects.organization_id = $1 and ${table}.project_id = $2 order by ${table}.${orderClause} limit $3 offset $4`,
      values: [organizationId, projectId, limitNum, offset]
    },
    countQuery: {
      text: `select count(*)::int as total from ${table} join projects on projects.id = ${table}.project_id where projects.organization_id = $1 and ${table}.project_id = $2`,
      values: [organizationId, projectId]
    },
    pagination: { page: pageNum, limit: limitNum, offset }
  };
}
