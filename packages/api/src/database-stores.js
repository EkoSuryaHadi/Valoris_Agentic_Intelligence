const tableStores = {
  projects: 'projectStore',
  wbs_nodes: 'wbsStore',
  baselines: 'baselineStore',
  cost_codes: 'costCodeStore',
  budget_lines: 'budgetLineStore',
  reporting_periods: 'periodStore',
  commitments: 'commitmentStore',
  actual_costs: 'actualStore',
  accruals: 'accrualStore',
  forecasts: 'forecastStore',
  evm_snapshots: 'evmStore',
  changes: 'changeStore',
  risks: 'riskStore',
  agent_findings: 'findingStore'
};

function toCamelCase(value) {
  return value.replace(/_([a-z])/g, (_, character) => character.toUpperCase());
}

function normalizeRow(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [toCamelCase(key), value]));
}

export async function loadDatabaseStores(pool) {
  const stores = Object.fromEntries(Object.values(tableStores).map((store) => [store, []]));
  for (const [table, store] of Object.entries(tableStores)) {
    const result = await pool.query(`select * from ${table}`);
    stores[store] = result.rows.map(normalizeRow);
  }
  stores.importStore = [];
  return stores;
}
