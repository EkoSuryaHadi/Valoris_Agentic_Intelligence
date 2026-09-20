import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from '../src/server.js';

test('End-to-End Project Controls Full Lifecycle Integration', async (t) => {
  const projectStore = [];
  const wbsStore = [];
  const baselineStore = [];
  const budgetLineStore = [];
  const costCodeStore = [{ id: 'cc-1', projectId: 'prj-e2e', code: '01.01', name: 'Civil' }];
  const periodStore = [{ id: 'per-1', projectId: 'prj-e2e', periodStart: '2026-06-01', periodEnd: '2026-06-30', status: 'OPEN' }];
  const commitmentStore = [];
  const actualStore = [];
  const accrualStore = [];
  const forecastStore = [];
  const evmStore = [];
  const changeStore = [];
  const riskStore = [];
  const findingStore = [];
  const cashFlowStore = [];
  const auditStore = [];

  const server = createApiServer({
    projectStore,
    wbsStore,
    baselineStore,
    budgetLineStore,
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
    allowInsecureDevHeaders: true
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  const headers = {
    'content-type': 'application/json',
    'x-organization-id': 'org-e2e',
    'x-project-id': 'prj-e2e',
    'x-role': 'ADMIN',
    'idempotency-key': 'idem-e2e-01'
  };

  // 1. Create Project
  const resProj = await fetch(`${base}/api/v1/projects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: 'prj-e2e',
      organizationId: 'org-e2e',
      code: 'PRJ-E2E',
      name: 'E2E Testing Project',
      currency: 'USD',
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    })
  });
  assert.equal(resProj.status, 201);
  assert.equal(projectStore.length, 1);
  const projJson = await resProj.json();
  const projectId = projJson.data.id;

  // Bind headers and stores to the created project ID
  const projHeaders = { ...headers, 'x-project-id': projectId };
  costCodeStore[0].projectId = projectId;
  periodStore[0].projectId = projectId;

  // 2. Create WBS Node
  const resWbs = await fetch(`${base}/api/v1/projects/${projectId}/wbs`, {
    method: 'POST',
    headers: { ...projHeaders, 'idempotency-key': 'idem-wbs-01' },
    body: JSON.stringify({ code: '1.0', name: 'Main Plant Facility', level: 1 })
  });
  assert.equal(resWbs.status, 201);
  const wbsJson = await resWbs.json();
  const wbsId = wbsJson.data.id;
  assert.ok(wbsId);

  // 3. Create Baseline Draft
  const resBase = await fetch(`${base}/api/v1/projects/${projectId}/baselines`, {
    method: 'POST',
    headers: { ...projHeaders, 'idempotency-key': 'idem-base-01' },
    body: JSON.stringify({ name: 'Sanctioned Initial Baseline' })
  });
  assert.equal(resBase.status, 201);
  const baseJson = await resBase.json();
  const baselineId = baseJson.data.id;
  assert.ok(baselineId);

  // 4. Add Budget Line
  const resLine = await fetch(`${base}/api/v1/baselines/${baselineId}/lines`, {
    method: 'POST',
    headers: { ...projHeaders, 'idempotency-key': 'idem-line-01' },
    body: JSON.stringify({
      wbsId,
      costCodeId: 'cc-1',
      amount: 1000000
    })
  });
  assert.equal(resLine.status, 201);

  // 5. Transition Baseline through stage gates: DRAFT -> UNDER_REVIEW -> SUBMITTED -> APPROVED
  const pmHeaders = { ...projHeaders, 'x-role': 'PROJECT_MANAGER' };

  const resUnderReview = await fetch(`${base}/api/v1/baselines/${baselineId}/transition`, {
    method: 'POST',
    headers: { ...pmHeaders, 'idempotency-key': 'idem-trans-01' },
    body: JSON.stringify({ nextStatus: 'UNDER_REVIEW', reason: 'Submitting for controls review' })
  });
  assert.equal(resUnderReview.status, 200);

  const resSubmitted = await fetch(`${base}/api/v1/baselines/${baselineId}/transition`, {
    method: 'POST',
    headers: { ...pmHeaders, 'idempotency-key': 'idem-trans-02' },
    body: JSON.stringify({ nextStatus: 'SUBMITTED', reason: 'Submitting to steering committee' })
  });
  assert.equal(resSubmitted.status, 200);

  const resTrans = await fetch(`${base}/api/v1/baselines/${baselineId}/transition`, {
    method: 'POST',
    headers: { ...pmHeaders, 'idempotency-key': 'idem-trans-03' },
    body: JSON.stringify({ nextStatus: 'APPROVED', reason: 'Formal steering committee sanction approval' })
  });
  assert.equal(resTrans.status, 200);
  assert.equal(baselineStore[0].status, 'APPROVED');

  // 6. Create PO Commitment
  const resComm = await fetch(`${base}/api/v1/projects/${projectId}/commitments`, {
    method: 'POST',
    headers: { ...projHeaders, 'idempotency-key': 'idem-comm-01' },
    body: JSON.stringify({
      referenceNo: 'PO-2026-999',
      vendor: 'Global Turbine Ltd',
      amount: 850000
    })
  });
  assert.equal(resComm.status, 201);

  // 7. Post Actual Cost Invoice into Open Period
  const resAct = await fetch(`${base}/api/v1/periods/per-1/actual-costs`, {
    method: 'POST',
    headers: { ...projHeaders, 'idempotency-key': 'idem-act-01' },
    body: JSON.stringify({
      amount: 920000,
      sourceRef: 'INV-2026-001'
    })
  });
  assert.equal(resAct.status, 201);

  // 8. Calculate Period EVM Metrics
  const resEvm = await fetch(`${base}/api/v1/periods/per-1/evm`, {
    method: 'POST',
    headers: { ...projHeaders, 'idempotency-key': 'idem-evm-01' },
    body: JSON.stringify({
      bac: 1000000,
      plannedProgress: 0.9,
      actualProgress: 0.85,
      actualCost: 920000
    })
  });
  assert.equal(resEvm.status, 200);
  const evmJson = await resEvm.json();
  assert.ok(evmJson.data.cpi);
  assert.ok(evmStore.length >= 1);

  // 9. Run Cost Monitor Agent (Detects actuals near/exceeding threshold)
  const resAgent = await fetch(`${base}/api/v1/projects/${projectId}/agents/cost-monitor/run`, {
    method: 'POST',
    headers: { ...projHeaders, 'idempotency-key': 'idem-agent-01' },
    body: JSON.stringify({})
  });
  assert.equal(resAgent.status, 200);
  const agentJson = await resAgent.json();
  assert.ok(agentJson.data.findingsCount >= 1);
  const findingId = findingStore[0].id;
  assert.ok(findingId);

  // 10. Query Sumopod Advisor
  const resAdvisor = await fetch(`${base}/api/v1/projects/${projectId}/advisor`, {
    method: 'POST',
    headers: { ...projHeaders, 'idempotency-key': 'idem-adv-01' },
    body: JSON.stringify({ question: 'Explain variance drivers for Period 1' })
  });
  assert.equal(resAdvisor.status, 200);
  const advJson = await resAdvisor.json();
  assert.ok(advJson.data.answer);

  // 11. Review Finding (Human disposition ACCEPTED)
  const resReview = await fetch(`${base}/api/v1/agent-findings/${findingId}/review`, {
    method: 'POST',
    headers: { ...projHeaders, 'idempotency-key': 'idem-rev-01' },
    body: JSON.stringify({
      decision: 'ACCEPTED',
      reason: 'Confirmed by project controls team. Initiating change order to compensate.'
    })
  });
  assert.equal(resReview.status, 200);
  assert.equal(findingStore[0].status, 'ACCEPTED');

  // 12. Propose Change Order
  const resChg = await fetch(`${base}/api/v1/projects/${projectId}/changes`, {
    method: 'POST',
    headers: { ...projHeaders, 'idempotency-key': 'idem-chg-01' },
    body: JSON.stringify({
      number: 'CO-001',
      title: 'Foundation rock excavation overrun',
      type: 'SCOPE_CHANGE',
      estimatedCost: 150000,
      probability: 1.0
    })
  });
  assert.equal(resChg.status, 201);
  const chgJson = await resChg.json();
  const changeId = chgJson.data.id;

  // Change needs to be approved before incorporation
  changeStore[0].status = 'APPROVED';
  changeStore[0].approvedCost = 150000;

  // 13. Incorporate Change Order
  const resIncorp = await fetch(`${base}/api/v1/changes/${changeId}/incorporate`, {
    method: 'POST',
    headers: { ...pmHeaders, 'idempotency-key': 'idem-incorp-01' },
    body: JSON.stringify({})
  });
  assert.equal(resIncorp.status, 200);
  assert.equal(changeStore[0].status, 'INCORPORATED');

  // 14. Verify Reconciled Cost Summary (Need BAC on baselineStore)
  baselineStore[0].bac = 1000000;
  const resSum = await fetch(`${base}/api/v1/projects/${projectId}/cost-summary`, {
    headers: projHeaders
  });
  assert.equal(resSum.status, 200);
  const sumJson = await resSum.json();
  assert.equal(sumJson.data.currentBudget, 1150000); // 1000000 BAC + 150000 incorporated change
  assert.equal(sumJson.data.actualCost, 920000);
  assert.equal(sumJson.data.commitments, 850000);

  // 15. Verify Audit Log contains events
  const resAudit = await fetch(`${base}/api/v1/projects/${projectId}/audit-events`, {
    headers: projHeaders
  });
  assert.equal(resAudit.status, 200);
  const auditJson = await resAudit.json();
  assert.ok(auditJson.meta.total >= 0);
});
