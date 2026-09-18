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

test('API server exposes tenant-scoped project, WBS, and baseline reads', async (t) => {
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }, { id: 'p2', organizationId: 'o2', code: 'P-2', name: 'Other' }],
    wbsStore: [{ id: 'w1', projectId: 'p1', code: '01', name: 'Site', level: 1 }],
    baselineStore: [{ id: 'b1', projectId: 'p1', version: 2, status: 'APPROVED' }]
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { authorization: 'Bearer verified-token' };
  const projects = await fetch(`${base}/api/v1/projects`, { headers });
  assert.deepEqual((await projects.json()).data, [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }]);
  const wbs = await fetch(`${base}/api/v1/projects/p1/wbs`, { headers });
  assert.deepEqual((await wbs.json()).data, [{ id: 'w1', projectId: 'p1', code: '01', name: 'Site', level: 1 }]);
  const baselines = await fetch(`${base}/api/v1/projects/p1/baselines`, { headers });
  assert.deepEqual((await baselines.json()).data, [{ id: 'b1', projectId: 'p1', version: 2, status: 'APPROVED' }]);
});

test('API server creates a WBS node only in the verified project scope', async (t) => {
  const wbsStore = [];
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }],
    wbsStore
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/v1/projects/p1/wbs`, { method: 'POST', headers: { authorization: 'Bearer verified-token', 'idempotency-key': 'wbs-1', 'content-type': 'application/json' }, body: JSON.stringify({ code: '01', name: 'Site preparation', level: 1 }) });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.code, '01');
  assert.equal(wbsStore[0].projectId, 'p1');
});
