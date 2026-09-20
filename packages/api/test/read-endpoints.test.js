import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from '../src/server.js';

test('complete read endpoints return paginated project data and enforce scope', async (t) => {
  const projectStore = [
    { id: 'p1', organizationId: 'org-1', code: 'P1', name: 'Plant 1', currency: 'USD' },
    { id: 'p2', organizationId: 'org-1', code: 'P2', name: 'Plant 2', currency: 'USD' }
  ];
  const costCodeStore = [
    { id: 'c1', projectId: 'p1', code: '01.01', name: 'Civil' },
    { id: 'c2', projectId: 'p1', code: '01.02', name: 'Structure' }
  ];
  const periodStore = [
    { id: 'per1', projectId: 'p1', periodStart: '2026-06-01', periodEnd: '2026-06-30', status: 'OPEN' }
  ];
  const commitmentStore = [
    { id: 'comm1', projectId: 'p1', referenceNo: 'PO-01', vendor: 'Steel Co', committedAmount: 5000 }
  ];
  const actualStore = [
    { id: 'act1', projectId: 'p1', periodId: 'per1', amount: 3000, sourceRef: 'INV-01' }
  ];
  const accrualStore = [
    { id: 'acc1', projectId: 'p1', periodId: 'per1', amount: 500, sourceRef: 'GRN-01' }
  ];
  const forecastStore = [
    { id: 'fc1', projectId: 'p1', periodId: 'per1', actualCost: 3000, etc: 2000, eac: 5000, vac: 0 }
  ];
  const evmStore = [
    { id: 'evm1', projectId: 'p1', periodId: 'per1', bac: 5000, pv: 3000, ev: 3000, ac: 3000, cpi: 1.0, spi: 1.0 }
  ];
  const changeStore = [
    { id: 'chg1', projectId: 'p1', number: 'VO-01', title: 'Scope Add', estimatedCost: 1000, status: 'APPROVED', approvedCost: 1000 }
  ];
  const riskStore = [
    { id: 'rsk1', projectId: 'p1', title: 'Weather delay', exposure: 200, status: 'OPEN' }
  ];
  const findingStore = [
    { id: 'fnd1', projectId: 'p1', agentType: 'COST_MONITOR', title: 'Overrun risk', severity: 'MEDIUM', status: 'NEW' }
  ];
  const cashFlowStore = [
    { id: 'cf1', projectId: 'p1', periodId: 'per1', variance: [100], cumulativeForecast: [500] }
  ];
  const auditStore = [
    { id: 'aud1', projectId: 'p1', organizationId: 'org-1', action: 'BASELINE_APPROVED', entityType: 'BASELINE' }
  ];
  const baselineStore = [
    { id: 'b1', projectId: 'p1', version: 1, status: 'APPROVED', bac: 5000 }
  ];

  const server = createApiServer({
    projectStore,
    costCodeStore,
    periodStore,
    commitmentStore,
    actualStore,
    accrualStore,
    forecastStore,
    evmStore,
    changeStore,
    riskStore,
    findingStore,
    cashFlowStore,
    auditStore,
    baselineStore,
    allowInsecureDevHeaders: true
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  const authHeaders = {
    'x-organization-id': 'org-1',
    'x-project-id': 'p1',
    'x-role': 'COST_ENGINEER'
  };

  // 1. Cost codes
  const resCodes = await fetch(`${base}/api/v1/projects/p1/cost-codes`, { headers: authHeaders });
  assert.equal(resCodes.status, 200);
  const jsonCodes = await resCodes.json();
  assert.equal(jsonCodes.data.length, 2);
  assert.equal(jsonCodes.meta.total, 2);

  // Pagination on cost codes
  const resCodesPaged = await fetch(`${base}/api/v1/projects/p1/cost-codes?page=2&limit=1`, { headers: authHeaders });
  const jsonCodesPaged = await resCodesPaged.json();
  assert.equal(jsonCodesPaged.data.length, 1);
  assert.equal(jsonCodesPaged.data[0].id, 'c2');
  assert.equal(jsonCodesPaged.meta.page, 2);
  assert.equal(jsonCodesPaged.meta.limit, 1);

  // 2. Periods
  const resPeriods = await fetch(`${base}/api/v1/projects/p1/periods`, { headers: authHeaders });
  assert.equal(resPeriods.status, 200);
  assert.equal((await resPeriods.json()).data.length, 1);

  // 3. Commitments
  const resComm = await fetch(`${base}/api/v1/projects/p1/commitments`, { headers: authHeaders });
  assert.equal(resComm.status, 200);
  assert.equal((await resComm.json()).data.length, 1);

  // 4. Actual costs
  const resAct = await fetch(`${base}/api/v1/projects/p1/actual-costs`, { headers: authHeaders });
  assert.equal(resAct.status, 200);
  assert.equal((await resAct.json()).data.length, 1);

  // 5. Accruals
  const resAcc = await fetch(`${base}/api/v1/projects/p1/accruals`, { headers: authHeaders });
  assert.equal(resAcc.status, 200);
  assert.equal((await resAcc.json()).data.length, 1);

  // 6. Forecasts
  const resFc = await fetch(`${base}/api/v1/projects/p1/forecasts`, { headers: authHeaders });
  assert.equal(resFc.status, 200);
  assert.equal((await resFc.json()).data.length, 1);

  // 7. EVM snapshots
  const resEvm = await fetch(`${base}/api/v1/projects/p1/evm-snapshots`, { headers: authHeaders });
  assert.equal(resEvm.status, 200);
  assert.equal((await resEvm.json()).data.length, 1);

  // 8. Changes
  const resChg = await fetch(`${base}/api/v1/projects/p1/changes`, { headers: authHeaders });
  assert.equal(resChg.status, 200);
  assert.equal((await resChg.json()).data.length, 1);

  // 9. Risks
  const resRsk = await fetch(`${base}/api/v1/projects/p1/risks`, { headers: authHeaders });
  assert.equal(resRsk.status, 200);
  assert.equal((await resRsk.json()).data.length, 1);

  // 10. Agent findings
  const resFnd = await fetch(`${base}/api/v1/projects/p1/agent-findings`, { headers: authHeaders });
  assert.equal(resFnd.status, 200);
  assert.equal((await resFnd.json()).data.length, 1);

  // 11. Cash flow
  const resCf = await fetch(`${base}/api/v1/projects/p1/cash-flow`, { headers: authHeaders });
  assert.equal(resCf.status, 200);
  assert.equal((await resCf.json()).data.length, 1);

  // 12. Audit events
  const resAud = await fetch(`${base}/api/v1/projects/p1/audit-events`, { headers: authHeaders });
  assert.equal(resAud.status, 200);
  assert.equal((await resAud.json()).data.length, 1);

  // 13. Cost summary
  const resSum = await fetch(`${base}/api/v1/projects/p1/cost-summary`, { headers: authHeaders });
  assert.equal(resSum.status, 200);
  const jsonSum = await resSum.json();
  assert.equal(jsonSum.data.bac, 5000);
  assert.equal(jsonSum.data.currentBudget, 6000); // 5000 BAC + 1000 approved change
  assert.equal(jsonSum.data.actualCost, 3000);
  assert.equal(jsonSum.data.etc, 2000);
  assert.equal(jsonSum.data.eac, 5000);
  assert.equal(jsonSum.data.health, 'ON_TRACK');

  // Scope check: accessing project p2 with credentials for p1 -> 403 PROJECT_SCOPE_DENIED
  const resForbidden = await fetch(`${base}/api/v1/projects/p2/cost-codes`, { headers: authHeaders });
  assert.equal(resForbidden.status, 403);
  const jsonForbidden = await resForbidden.json();
  assert.equal(jsonForbidden.error.code, 'PROJECT_SCOPE_DENIED');

  // Unauthenticated -> 401 UNAUTHENTICATED
  const resUnauth = await fetch(`${base}/api/v1/projects/p1/cost-codes`);
  assert.equal(resUnauth.status, 401);
});
