const TABLES = new Set(['wbs_nodes', 'cbs_nodes']);
export class HierarchyRepository {
  constructor(client) { this.client = client; }
  async create(table, { projectId, parentId, code, name, level }) {
    if (!TABLES.has(table)) throw new Error('unsupported hierarchy table');
    const result = await this.client.query(`insert into ${table} (project_id,parent_id,code,name,level) values ($1,$2,$3,$4,$5) returning *`, [projectId, parentId, code, name, level]); return result.rows[0];
  }
}
export class BaselineRepository {
  constructor(client) { this.client = client; }
  async addLine({ baselineId, wbsId, costCodeId, amount }) { const result = await this.client.query('insert into budget_lines (baseline_id,wbs_id,cost_code_id,amount) values ($1,$2,$3,$4) returning *', [baselineId, wbsId, costCodeId, amount]); return result.rows[0]; }
}
export class TransactionRepository {
  constructor(client) { this.client = client; }
  async postActual({ projectId, periodId, amount, sourceRef }) { const result = await this.client.query('insert into actual_costs (project_id,period_id,amount,source_ref) values ($1,$2,$3,$4) returning *', [projectId, periodId, amount, sourceRef]); return result.rows[0]; }
}
