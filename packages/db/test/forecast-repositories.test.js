import test from 'node:test';
import assert from 'node:assert/strict';
import { TransactionRepository, ForecastRepository, EvmRepository } from '../src/domain-repositories.js';

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
