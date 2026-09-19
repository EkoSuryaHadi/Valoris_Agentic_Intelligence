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

test('transaction repository inserts records for the selected project', async () => {
  const repo = new TransactionRepository({ query: async (text, values) => { assert.match(text, /actual_costs/i); assert.deepEqual(values, ['p1', 'r1', 25, 'SRC-1']); return { rows: [{ id: 'a1' }] }; } });
  assert.equal((await repo.postActual({ projectId: 'p1', periodId: 'r1', amount: 25, sourceRef: 'SRC-1' })).id, 'a1');
});
