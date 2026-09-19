import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDatabaseStores } from '../src/database-stores.js';

test('loads Neon rows into the API store shape with camel-case fields', async () => {
  const calls = [];
  const pool = { query: async (text) => { calls.push(text); return { rows: text.includes('projects') ? [{ id: 'p1', organization_id: 'o1', project_id: 'p1', code: 'P-1' }] : [] }; } };
  const stores = await loadDatabaseStores(pool);
  assert.equal(stores.projectStore[0].organizationId, 'o1');
  assert.equal(stores.projectStore[0].projectId, 'p1');
  assert.ok(calls.some((query) => query.includes('projects')));
});
