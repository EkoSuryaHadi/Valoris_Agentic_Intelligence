import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createVercelHandler } from '../../../api/index.js';

test('Vercel adapter serves the hardened API health endpoint', async (t) => {
  const handler = createVercelHandler({ allowInsecureDevHeaders: false });
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());

  const response = await fetch(`http://127.0.0.1:${server.address().port}/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
  assert.deepEqual(await response.json(), { status: 'ok' });
});
