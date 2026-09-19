const TABLES = new Set(['wbs_nodes', 'cbs_nodes']);
export class HierarchyRepository {
  constructor(client) { this.client = client; }
  async create(table, { id, projectId, parentId, code, name, level }) {
    if (!TABLES.has(table)) throw new Error('unsupported hierarchy table');
    const result = id
      ? await this.client.query(`insert into ${table} (id,project_id,parent_id,code,name,level) values ($1,$2,$3,$4,$5,$6) returning *`, [id, projectId, parentId, code, name, level])
      : await this.client.query(`insert into ${table} (project_id,parent_id,code,name,level) values ($1,$2,$3,$4,$5) returning *`, [projectId, parentId, code, name, level]); return result.rows[0];
  }
}
export class BaselineRepository {
  constructor(client) { this.client = client; }
  async addLine({ baselineId, wbsId, costCodeId, amount }) { const result = await this.client.query('insert into budget_lines (baseline_id,wbs_id,cost_code_id,amount) values ($1,$2,$3,$4) returning *', [baselineId, wbsId, costCodeId, amount]); return result.rows[0]; }
}
export class TransactionRepository {
  constructor(client) { this.client = client; }
  async postActual({ projectId, periodId, amount, sourceRef }) { const result = await this.client.query('insert into actual_costs (project_id,period_id,amount,source_ref) values ($1,$2,$3,$4) returning *', [projectId, periodId, amount, sourceRef]); return result.rows[0]; }
  async createCommitment({ projectId, referenceNo, vendorName, amount }) { const result = await this.client.query('insert into commitments (project_id,reference_no,vendor_name,committed_amount,status) values ($1,$2,$3,$4,$5) returning *', [projectId, referenceNo, vendorName, amount, 'OPEN']); return result.rows[0]; }
  async createAccrual({ projectId, periodId, amount, sourceRef }) { const result = await this.client.query('insert into accruals (project_id,period_id,amount,source_ref,status) values ($1,$2,$3,$4,$5) returning *', [projectId, periodId, amount, sourceRef, 'DRAFT']); return result.rows[0]; }
}
export class ForecastRepository {
  constructor(client) { this.client = client; }
  async save({ projectId, periodId, actualCost, etc, eac, vac }) { const result = await this.client.query('insert into forecasts (project_id,period_id,actual_cost,etc,eac,vac,status) values ($1,$2,$3,$4,$5,$6,$7) returning *', [projectId, periodId, actualCost, etc, eac, vac, 'DRAFT']); return result.rows[0]; }
}
