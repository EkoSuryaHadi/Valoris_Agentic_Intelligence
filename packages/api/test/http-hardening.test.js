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

test('API server creates a baseline draft only in the verified project scope', async (t) => {
  const baselineStore = [];
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }],
    baselineStore
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/projects/p1/baselines`, { method: 'POST', headers: { authorization: 'Bearer verified-token', 'idempotency-key': 'baseline-1', 'content-type': 'application/json' }, body: JSON.stringify({}) });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.status, 'DRAFT');
  assert.equal(baselineStore[0].projectId, 'p1');
  assert.equal(baselineStore[0].version, 1);
});

test('API server adds a budget line only to an open scoped baseline', async (t) => {
  const budgetLineStore = [];
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }],
    baselineStore: [{ id: 'b1', projectId: 'p1', version: 1, status: 'DRAFT' }],
    wbsStore: [{ id: 'w1', projectId: 'p1', code: '01', name: 'Site', level: 1 }],
    costCodeStore: [{ id: 'c1', projectId: 'p1', code: 'MAT', name: 'Materials' }],
    budgetLineStore
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/baselines/b1/lines`, { method: 'POST', headers: { authorization: 'Bearer verified-token', 'idempotency-key': 'line-1', 'content-type': 'application/json' }, body: JSON.stringify({ wbsId: 'w1', costCodeId: 'c1', amount: 1250.5 }) });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.amount, 1250.5);
  assert.equal(budgetLineStore[0].baselineId, 'b1');
});

test('API server approves a submitted baseline only with human audit reason', async (t) => {
  const baselineStore = [{ id: 'b1', projectId: 'p1', version: 1, status: 'SUBMITTED' }];
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'manager-1', organizationId: 'o1', projectId: 'p1', role: 'COST_MANAGER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }],
    baselineStore
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/baselines/b1/transition`, { method: 'POST', headers: { authorization: 'Bearer verified-token', 'idempotency-key': 'approval-1', 'content-type': 'application/json' }, body: JSON.stringify({ nextStatus: 'APPROVED', reason: 'Validated against approved budget evidence' }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.status, 'APPROVED');
  assert.equal(baselineStore[0].status, 'APPROVED');
});

test('API server previews import rows without committing invalid data', async (t) => {
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }]
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/projects/p1/imports/preview`, { method: 'POST', headers: { authorization: 'Bearer verified-token', 'content-type': 'application/json' }, body: JSON.stringify({ rows: [{ referenceNo: 'PO-1', amount: '10', projectId: 'p1' }, { referenceNo: 'PO-1', amount: 'bad', projectId: 'p1' }] }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.errors.length, 1);
});

test('API server commits only a fully valid import preview', async (t) => {
  const importStore = [];
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }],
    importStore
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/projects/p1/imports/commit`, { method: 'POST', headers: { authorization: 'Bearer verified-token', 'idempotency-key': 'import-1', 'content-type': 'application/json' }, body: JSON.stringify({ rows: [{ referenceNo: 'PO-1', amount: '10', projectId: 'p1' }] }) });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.importedCount, 1);
  assert.equal(importStore[0].referenceNo, 'PO-1');
});

test('API server creates a scoped commitment and posts actual cost', async (t) => {
  const commitmentStore = [];
  const actualStore = [];
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }],
    commitmentStore,
    actualStore,
    periodStore: [{ id: 'r1', projectId: 'p1', status: 'OPEN' }]
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { authorization: 'Bearer verified-token', 'idempotency-key': 'tx-1', 'content-type': 'application/json' };
  const commitment = await fetch(`${base}/api/v1/projects/p1/commitments`, { method: 'POST', headers, body: JSON.stringify({ referenceNo: 'PO-2', vendor: 'Steel Co', amount: 2500 }) });
  assert.equal(commitment.status, 201);
  assert.equal((await commitment.json()).data.amount, 2500);
  const actual = await fetch(`${base}/api/v1/periods/r1/actual-costs`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'actual-1' }, body: JSON.stringify({ sourceRef: 'INV-2', amount: 1200 }) });
  assert.equal(actual.status, 201);
  assert.equal((await actual.json()).data.amount, 1200);
  assert.equal(commitmentStore.length, 1);
  assert.equal(actualStore.length, 1);
});
