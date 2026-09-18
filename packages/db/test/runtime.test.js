import test from 'node:test';
import assert from 'node:assert/strict';
import { requireDatabaseUrl, withTransaction } from '../src/runtime.js';

test('requires a PostgreSQL database URL', () => {
  assert.equal(requireDatabaseUrl('postgresql://localhost/valoris'), 'postgresql://localhost/valoris');
  assert.throws(() => requireDatabaseUrl(''), /DATABASE_URL/i);
});

test('commits successful database work and rolls back failures', async () => {
  const calls = [];
  const client = { query: async (sql) => { calls.push(sql); if (sql === 'fail') throw new Error('boom'); } };
  await withTransaction(client, async (tx) => tx.query('ok'));
  await assert.rejects(() => withTransaction(client, async (tx) => tx.query('fail')), /boom/);
  assert.deepEqual(calls, ['BEGIN', 'ok', 'COMMIT', 'BEGIN', 'fail', 'ROLLBACK']);
});
