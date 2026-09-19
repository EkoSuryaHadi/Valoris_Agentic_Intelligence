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
  async create({ id, projectId, version, status }) { const result = await this.client.query('insert into baselines (id,project_id,version,status) values ($1,$2,$3,$4) returning *', [id, projectId, version, status]); return result.rows[0]; }
  async addLine({ id, baselineId, wbsId, costCodeId, amount }) {
    const result = id
      ? await this.client.query('insert into budget_lines (id,baseline_id,wbs_id,cost_code_id,amount) values ($1,$2,$3,$4,$5) returning *', [id, baselineId, wbsId, costCodeId, amount])
      : await this.client.query('insert into budget_lines (baseline_id,wbs_id,cost_code_id,amount) values ($1,$2,$3,$4) returning *', [baselineId, wbsId, costCodeId, amount]); return result.rows[0];
  }
}
export class TransactionRepository {
  constructor(client) { this.client = client; }
  async postActual({ id, projectId, periodId, amount, sourceRef }) { const result = id ? await this.client.query('insert into actual_costs (id,project_id,period_id,amount,source_ref) values ($1,$2,$3,$4,$5) returning *', [id, projectId, periodId, amount, sourceRef]) : await this.client.query('insert into actual_costs (project_id,period_id,amount,source_ref) values ($1,$2,$3,$4) returning *', [projectId, periodId, amount, sourceRef]); return result.rows[0]; }
  async createCommitment({ id, projectId, referenceNo, vendorName, amount }) { const result = id ? await this.client.query('insert into commitments (id,project_id,reference_no,vendor_name,committed_amount,status) values ($1,$2,$3,$4,$5,$6) returning *', [id, projectId, referenceNo, vendorName, amount, 'OPEN']) : await this.client.query('insert into commitments (project_id,reference_no,vendor_name,committed_amount,status) values ($1,$2,$3,$4,$5) returning *', [projectId, referenceNo, vendorName, amount, 'OPEN']); return result.rows[0]; }
  async createAccrual({ id, projectId, periodId, amount, sourceRef }) { const result = id ? await this.client.query('insert into accruals (id,project_id,period_id,amount,source_ref,status) values ($1,$2,$3,$4,$5,$6) returning *', [id, projectId, periodId, amount, sourceRef, 'DRAFT']) : await this.client.query('insert into accruals (project_id,period_id,amount,source_ref,status) values ($1,$2,$3,$4,$5) returning *', [projectId, periodId, amount, sourceRef, 'DRAFT']); return result.rows[0]; }
}
export class ForecastRepository {
  constructor(client) { this.client = client; }
  async save({ id, projectId, periodId, actualCost, etc, eac, vac }) {
    const result = id
      ? await this.client.query('insert into forecasts (id,project_id,period_id,actual_cost,etc,eac,vac,status) values ($1,$2,$3,$4,$5,$6,$7,$8) returning *', [id, projectId, periodId, actualCost, etc, eac, vac, 'DRAFT'])
      : await this.client.query('insert into forecasts (project_id,period_id,actual_cost,etc,eac,vac,status) values ($1,$2,$3,$4,$5,$6,$7) returning *', [projectId, periodId, actualCost, etc, eac, vac, 'DRAFT']); return result.rows[0];
  }
}
export class EvmRepository {
  constructor(client) { this.client = client; }
  async save({ id, projectId, periodId, bac, plannedProgress, actualProgress, pv, ev, ac, cv, sv, cpi, spi }) {
    const result = await this.client.query('insert into evm_snapshots (id,project_id,period_id,bac,planned_progress,actual_progress,pv,ev,ac,cv,sv,cpi,spi) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning *', [id, projectId, periodId, bac, plannedProgress, actualProgress, pv, ev, ac, cv, sv, cpi, spi]); return result.rows[0];
  }
}
