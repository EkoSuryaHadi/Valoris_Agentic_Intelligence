import test from 'node:test';
import assert from 'node:assert/strict';
import { HierarchyRepository, BaselineRepository, TransactionRepository } from '../src/domain-repositories.js';

test('hierarchy repository creates a project-scoped node', async () => {
  const calls = []; const repo = new HierarchyRepository({ query: async (text, values) => { calls.push({ text, values }); return { rows: [{ id: 'w1' }] }; } });
  const result = await repo.create('wbs_nodes', { projectId: 'p1', parentId: null, code: '1', name: 'Engineering', level: 1 });
  assert.equal(result.id, 'w1'); assert.deepEqual(calls[0].values, ['p1', null, '1', 'Engineering', 1]);
});

test('hierarchy repository preserves an API-generated node id', async () => {
  let captured;
  const repo = new HierarchyRepository({ query: async (text, values) => { captured = { text, values }; return { rows: [{ id: 'w1' }] }; } });
  await repo.create('wbs_nodes', { id: 'w1', projectId: 'p1', parentId: null, code: '1', name: 'Engineering', level: 1 });
  assert.match(captured.text, /insert into wbs_nodes \(id,project_id/);
  assert.deepEqual(captured.values, ['w1', 'p1', null, '1', 'Engineering', 1]);
});

test('baseline repository stores budget lines with parameterized values', async () => {
  const repo = new BaselineRepository({ query: async (text, values) => { assert.match(text, /budget_lines/i); assert.deepEqual(values, ['b1', 'w1', 'c1', 100]); return { rows: [{ id: 'l1' }] }; } });
  assert.equal((await repo.addLine({ baselineId: 'b1', wbsId: 'w1', costCodeId: 'c1', amount: 100 })).id, 'l1');
});

test('baseline repository creates a draft with an API-generated id', async () => {
  const repo = new BaselineRepository({ query: async (text, values) => { assert.match(text, /insert into baselines/i); assert.deepEqual(values, ['b1', 'p1', 1, 'DRAFT']); return { rows: [{ id: 'b1' }] }; } });
  assert.equal((await repo.create({ id: 'b1', projectId: 'p1', version: 1, status: 'DRAFT' })).id, 'b1');
});

test('baseline repository preserves an API-generated budget line id', async () => {
  const repo = new BaselineRepository({ query: async (text, values) => { assert.match(text, /insert into budget_lines \(id/i); assert.deepEqual(values, ['l1', 'b1', 'w1', 'c1', 100]); return { rows: [{ id: 'l1' }] }; } });
  assert.equal((await repo.addLine({ id: 'l1', baselineId: 'b1', wbsId: 'w1', costCodeId: 'c1', amount: 100 })).id, 'l1');
});

test('transaction repository inserts records for the selected project', async () => {
  const repo = new TransactionRepository({ query: async (text, values) => { assert.match(text, /actual_costs/i); assert.deepEqual(values, ['p1', 'r1', 25, 'SRC-1']); return { rows: [{ id: 'a1' }] }; } });
  assert.equal((await repo.postActual({ projectId: 'p1', periodId: 'r1', amount: 25, sourceRef: 'SRC-1' })).id, 'a1');
});

test('transaction repository preserves API-generated ids', async () => {
  const repo = new TransactionRepository({ query: async (text, values) => { assert.match(text, /insert into (commitments|actual_costs|accruals) \(id/i); return { rows: [{ id: values[0] }] }; } });
  assert.equal((await repo.createCommitment({ id: 'c1', projectId: 'p1', referenceNo: 'C-1', vendorName: 'Vendor', amount: 10 })).id, 'c1');
  assert.equal((await repo.postActual({ id: 'a1', projectId: 'p1', periodId: 'r1', amount: 10, sourceRef: 'A-1' })).id, 'a1');
  assert.equal((await repo.createAccrual({ id: 'r1', projectId: 'p1', periodId: 'r1', amount: 10, sourceRef: 'G-1' })).id, 'r1');
});

test('domain repositories list records for a project with parameterization', async () => {
  const queryLogs = [];
  const fakeClient = {
    query: async (text, values) => {
      queryLogs.push({ text, values });
      return { rows: [{ id: 'record-1', project_id: values[0] }] };
    }
  };

  const hierarchy = new HierarchyRepository(fakeClient);
  const baseline = new BaselineRepository(fakeClient);
  const transaction = new TransactionRepository(fakeClient);

  const nodes = await hierarchy.list('wbs_nodes', 'p-1');
  assert.equal(nodes.length, 1);
  assert.match(queryLogs[0].text, /select \* from wbs_nodes where project_id = \$1/);

  const baselines = await baseline.list('p-1');
  assert.equal(baselines.length, 1);
  assert.match(queryLogs[1].text, /select \* from baselines where project_id = \$1/);

  const commitments = await transaction.listCommitments('p-1', { limit: 10, offset: 0 });
  assert.equal(commitments.length, 1);
  assert.match(queryLogs[2].text, /select \* from commitments where project_id = \$1/);
});

