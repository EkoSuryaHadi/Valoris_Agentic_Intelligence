import test from 'node:test';
import assert from 'node:assert/strict';
import { TransactionRepository, ForecastRepository, EvmRepository, ChangeRepository, RiskRepository, FindingRepository, CashFlowRepository, AuditRepository } from '../src/domain-repositories.js';

test('transaction repository persists commitment and accrual records', async () => {
  const calls = []; const repo = new TransactionRepository({ query: async (text, values) => { calls.push({ text, values }); return { rows: [{ id: 'x1' }] }; } });
  assert.equal((await repo.createCommitment({ projectId: 'p1', referenceNo: 'PO-1', vendorName: 'Steel', amount: 100 })).id, 'x1');
  assert.equal((await repo.createAccrual({ projectId: 'p1', periodId: 'r1', amount: 25, sourceRef: 'ACC-1' })).id, 'x1');
  assert.match(calls[0].text, /commitments/i); assert.match(calls[1].text, /accruals/i);
});

test('forecast repository persists a period snapshot', async () => {
  const repo = new ForecastRepository({ query: async (text, values) => { assert.match(text, /forecasts/i); assert.deepEqual(values, ['p1', 'r1', 600, 500, 1100, -100, 'DRAFT']); return { rows: [{ id: 'f1' }] }; } });
  assert.equal((await repo.save({ projectId: 'p1', periodId: 'r1', actualCost: 600, etc: 500, eac: 1100, vac: -100 })).id, 'f1');
});

test('forecast repository preserves an API-generated id', async () => {
  const repo = new ForecastRepository({ query: async (text, values) => {
    assert.match(text, /insert into forecasts \(id,/i);
    assert.deepEqual(values, ['f-api', 'p1', 'r1', 600, 500, 1100, -100, 'DRAFT']);
    return { rows: [{ id: 'f-api' }] };
  } });
  assert.equal((await repo.save({ id: 'f-api', projectId: 'p1', periodId: 'r1', actualCost: 600, etc: 500, eac: 1100, vac: -100 })).id, 'f-api');
});

test('EVM repository persists a calculated period snapshot with its id', async () => {
  const repo = new EvmRepository({ query: async (text, values) => {
    assert.match(text, /insert into evm_snapshots \(id,/i);
    assert.deepEqual(values, ['e-api', 'p1', 'r1', 1000, 0.6, 0.5, 600, 500, 600, -100, -100, 0.833333, 0.833333]);
    return { rows: [{ id: 'e-api' }] };
  } });
  assert.equal((await repo.save({ id: 'e-api', projectId: 'p1', periodId: 'r1', bac: 1000, plannedProgress: 0.6, actualProgress: 0.5, pv: 600, ev: 500, ac: 600, cv: -100, sv: -100, cpi: 0.833333, spi: 0.833333 })).id, 'e-api');
});

test('MVP-C repositories preserve IDs and audit human decisions', async () => {
  const calls = [];
  const client = { query: async (text, values) => { calls.push({ text, values }); return { rows: [{ id: values[0] }] }; } };
  assert.equal((await new ChangeRepository(client).create({ id: 'c1', projectId: 'p1', number: 'VO-1', title: 'Change', type: 'DESIGN', estimatedCost: 100, probability: 0.5, exposure: 50, status: 'POTENTIAL' })).id, 'c1');
  await new ChangeRepository(client).incorporate({ id: 'c1', approvedCost: 90, status: 'INCORPORATED' });
  await new RiskRepository(client).create({ id: 'r1', projectId: 'p1', title: 'Delay', category: 'SUPPLY', probability: 0.5, impact: 100, exposure: 50, severity: 'MEDIUM', status: 'NEW' });
  await new FindingRepository(client).create({ id: 'f1', projectId: 'p1', agentType: 'COST_MONITORING', title: 'Trend', statement: 'Review', severity: 'MEDIUM', confidence: 0.8, evidence: [{ source: 'evm:r1' }], status: 'NEW' });
  await new FindingRepository(client).review({ id: 'f1', reviewedBy: 'u1', status: 'ESCALATED', reason: 'Manager review' });
  await new CashFlowRepository(client).save({ id: 'cf1', projectId: 'p1', periodId: 'r1', planned: [100], actual: [120], forecast: [120], variance: [20], cumulativeForecast: [120] });
  await new AuditRepository(client).record({ organizationId: 'o1', projectId: 'p1', actorUserId: 'u1', actorType: 'USER', action: 'FINDING_REVIEWED', entityType: 'AGENT_FINDING', entityId: 'f1', reason: 'Manager review' });
  assert.equal(calls.length, 7); assert.match(calls[0].text, /changes/i); assert.match(calls[6].text, /audit_events/i);
});
