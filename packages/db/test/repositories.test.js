import test from 'node:test';
import assert from 'node:assert/strict';
import { ProjectRepository } from '../src/repositories.js';

test('project repository creates tenant-scoped projects with parameterized SQL', async () => {
  const calls = [];
  const repo = new ProjectRepository({ query: async (text, values) => { calls.push({ text, values }); return { rows: [{ id: 'p1', code: 'P-1' }] }; } });
  const result = await repo.create({ organizationId: 'o1', code: 'P-1', name: 'Plant', currency: 'USD' });
  assert.equal(result.id, 'p1');
  assert.match(calls[0].text, /insert into projects/i);
  assert.deepEqual(calls[0].values, ['o1', 'P-1', 'Plant', 'USD']);
});

test('project repository preserves an API-generated project id', async () => {
  let captured;
  const repo = new ProjectRepository({ query: async (text, values) => { captured = { text, values }; return { rows: [{ id: 'p1' }] }; } });
  await repo.create({ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Plant', currency: 'USD' });
  assert.match(captured.text, /insert into projects \(id, organization_id/);
  assert.deepEqual(captured.values, ['p1', 'o1', 'P-1', 'Plant', 'USD']);
});

test('project repository lists only one organization', async () => {
  const repo = new ProjectRepository({ query: async (text, values) => { assert.match(text, /organization_id = \$1/); assert.deepEqual(values, ['o1']); return { rows: [] }; } });
  assert.deepEqual(await repo.listByOrganization('o1'), []);
});
