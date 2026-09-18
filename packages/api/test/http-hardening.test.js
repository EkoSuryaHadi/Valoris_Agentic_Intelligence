import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, getRequestId, parseJsonBody } from '../src/http-hardening.js';
import { createApiServer } from '../src/server.js';

test('rate limiter rejects requests after the configured window budget', () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => 1000 });
  assert.equal(limiter.check('ip-1').allowed, true);
  assert.equal(limiter.check('ip-1').allowed, true);
  assert.equal(limiter.check('ip-1').allowed, false);
  assert.equal(limiter.check('ip-2').allowed, true);
});

test('rate limiter accepts an injected store for multi-instance adapters', () => {
  const store = new Map();
  const limiter = createRateLimiter({ limit: 1, windowMs: 1000, store, now: () => 1000 });
  assert.equal(limiter.check('shared-key').allowed, true);
  assert.equal(limiter.check('shared-key').allowed, false);
  assert.equal(store.has('shared-key'), true);
});

test('request IDs preserve valid client IDs and replace unsafe values', () => {
  assert.equal(getRequestId({ headers: { 'x-request-id': 'req_123-ABC' } }), 'req_123-ABC');
  assert.match(getRequestId({ headers: { 'x-request-id': 'bad value with spaces' } }), /^[0-9a-f-]{36}$/);
});

test('JSON body parser enforces a byte limit and rejects malformed JSON', async () => {
  const request = (value) => ({ async *[Symbol.asyncIterator]() { yield Buffer.from(value); } });
  assert.deepEqual(await parseJsonBody(request('{"ok":true}'), 100), { ok: true });
  await assert.rejects(() => parseJsonBody(request('{"ok":true}'), 5), /too large/i);
  await assert.rejects(() => parseJsonBody(request('{bad'), 100), /valid JSON/i);
});

test('API server returns stable hardening responses for protected writes', async (t) => {
  const events = [];
  const server = createApiServer({ bodyLimitBytes: 8, rateLimiter: createRateLimiter({ limit: 1, windowMs: 60_000 }), logger: (event) => events.push(event) });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.match(health.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
  const unauthenticated = await fetch(`${base}/api/v1/projects`, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } });
  assert.equal(unauthenticated.status, 401);
  const limited = await fetch(`${base}/api/v1/projects`, { method: 'POST', body: '{"long":true}', headers: { 'content-type': 'application/json' } });
  assert.equal(limited.status, 429);
  assert.equal(events.every((event) => !('authorization' in event) && !('body' in event)), true);
});
