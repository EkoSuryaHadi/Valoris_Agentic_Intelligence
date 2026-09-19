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
  async transition({ id, status }) { const result = await this.client.query('update baselines set status = $2 where id = $1 returning *', [id, status]); return result.rows[0]; }
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
export class ChangeRepository {
  constructor(client) { this.client = client; }
  async create({ id, projectId, number, title, type, estimatedCost, probability, exposure, approvedCost = null, status }) {
    const result = await this.client.query('insert into changes (id,project_id,number,title,type,estimated_cost,probability,exposure,approved_cost,status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *', [id, projectId, number, title, type, estimatedCost, probability, exposure, approvedCost, status]); return result.rows[0];
  }
  async incorporate({ id, approvedCost, status }) { const result = await this.client.query('update changes set approved_cost = $2, status = $3 where id = $1 returning *', [id, approvedCost, status]); return result.rows[0]; }
}
export class RiskRepository {
  constructor(client) { this.client = client; }
  async create({ id, projectId, title, category, probability, impact, exposure, severity, status }) {
    const result = await this.client.query('insert into risks (id,project_id,title,category,probability,impact,exposure,severity,status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *', [id, projectId, title, category, probability, impact, exposure, severity, status]); return result.rows[0];
  }
}
export class FindingRepository {
  constructor(client) { this.client = client; }
  async create({ id, projectId, agentType, title, statement, severity, confidence, evidence, status }) {
    const result = await this.client.query('insert into agent_findings (id,project_id,agent_type,title,statement,severity,confidence,evidence,status) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) returning *', [id, projectId, agentType, title, statement, severity, confidence, JSON.stringify(evidence), status]); return result.rows[0];
  }
  async review({ id, reviewedBy, status, reason }) { const result = await this.client.query('update agent_findings set reviewed_by = $2, status = $3, review_reason = $4, reviewed_at = now() where id = $1 returning *', [id, reviewedBy, status, reason]); return result.rows[0]; }
}
export class CashFlowRepository {
  constructor(client) { this.client = client; }
  async save({ id, projectId, periodId = null, planned, actual, forecast, variance, cumulativeForecast }) {
    const result = await this.client.query('insert into cash_flow_snapshots (id,project_id,period_id,planned,actual,forecast,variance,cumulative_forecast) values ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb) returning *', [id, projectId, periodId, JSON.stringify(planned), JSON.stringify(actual), JSON.stringify(forecast), JSON.stringify(variance), JSON.stringify(cumulativeForecast)]); return result.rows[0];
  }
}
export class AuditRepository {
  constructor(client) { this.client = client; }
  async record({ organizationId, projectId = null, actorUserId = null, actorType, action, entityType, entityId = null, oldValue = null, newValue = null, reason = null, sourceRef = null }) {
    const result = await this.client.query('insert into audit_events (organization_id,project_id,actor_user_id,actor_type,action,entity_type,entity_id,old_value,new_value,reason,source_ref) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11) returning *', [organizationId, projectId, actorUserId, actorType, action, entityType, entityId, oldValue === null ? null : JSON.stringify(oldValue), newValue === null ? null : JSON.stringify(newValue), reason, sourceRef]); return result.rows[0];
  }
}
