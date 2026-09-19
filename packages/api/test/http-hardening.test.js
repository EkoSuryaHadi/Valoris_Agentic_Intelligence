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
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(health.headers.get('referrer-policy'), 'no-referrer');
});

test('API server persists a created project through the injected repository', async (t) => {
  let persisted;
  const server = createApiServer({
    allowInsecureDevHeaders: true,
    persistence: { project: { create: async (project) => { persisted = project; } } }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/projects`, {
    method: 'POST',
    headers: { 'x-organization-id': 'o1', 'x-project-id': 'p1', 'x-role': 'ADMIN', 'idempotency-key': 'project-1', 'content-type': 'application/json' },
    body: JSON.stringify({ organizationId: 'o1', code: 'P-001', name: 'Plant', currency: 'USD' })
  });
  assert.equal(response.status, 201);
  assert.equal(persisted.code, 'P-001');
  assert.equal(persisted.organizationId, 'o1');
});

test('API server persists a created WBS node through the injected repository', async (t) => {
  let persisted;
  const server = createApiServer({
    allowInsecureDevHeaders: true,
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1' }],
    persistence: { hierarchy: { create: async (node) => { persisted = node; } } }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/projects/p1/wbs`, {
    method: 'POST',
    headers: { 'x-organization-id': 'o1', 'x-project-id': 'p1', 'x-role': 'COST_ENGINEER', 'idempotency-key': 'wbs-1', 'content-type': 'application/json' },
    body: JSON.stringify({ code: '1', name: 'Engineering', level: 1 })
  });
  assert.equal(response.status, 201);
  assert.equal(persisted.projectId, 'p1');
  assert.equal(persisted.code, '1');
});

test('API server persists a baseline draft and budget line through repositories', async (t) => {
  const persisted = { baseline: null, line: null };
  const server = createApiServer({
    allowInsecureDevHeaders: true,
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1' }],
    wbsStore: [{ id: 'w1', projectId: 'p1', code: '1', name: 'Engineering', level: 1 }],
    costCodeStore: [{ id: 'c1', projectId: 'p1', code: 'LABOR', name: 'Labor' }],
    persistence: {
      baseline: {
        create: async (baseline) => { persisted.baseline = baseline; },
        addLine: async (line) => { persisted.line = line; }
      }
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { 'x-organization-id': 'o1', 'x-project-id': 'p1', 'x-role': 'COST_ENGINEER', 'content-type': 'application/json' };
  const baseline = await fetch(`${base}/api/v1/projects/p1/baselines`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'baseline-1' }, body: '{}' });
  assert.equal(baseline.status, 201);
  const baselineBody = await baseline.json();
  const line = await fetch(`${base}/api/v1/baselines/${baselineBody.data.id}/lines`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'line-1' }, body: JSON.stringify({ wbsId: 'w1', costCodeId: 'c1', amount: 100 }) });
  assert.equal(line.status, 201);
  assert.equal(persisted.baseline.projectId, 'p1');
  assert.equal(persisted.line.baselineId, baselineBody.data.id);
});

test('API server persists commitment, actual cost, and accrual through repositories', async (t) => {
  const persisted = {};
  const server = createApiServer({
    allowInsecureDevHeaders: true,
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1' }],
    periodStore: [{ id: 'r1', projectId: 'p1', status: 'OPEN' }],
    persistence: { transaction: {
      commitment: async (value) => { persisted.commitment = value; },
      actual: async (value) => { persisted.actual = value; },
      accrual: async (value) => { persisted.accrual = value; }
    } }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { 'x-organization-id': 'o1', 'x-project-id': 'p1', 'x-role': 'COST_ENGINEER', 'content-type': 'application/json' };
  const commitment = await fetch(`${base}/api/v1/projects/p1/commitments`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'commitment-1' }, body: JSON.stringify({ referenceNo: 'COM-1', vendor: 'Vendor', amount: 100 }) });
  assert.equal(commitment.status, 201);
  const actual = await fetch(`${base}/api/v1/periods/r1/actual-costs`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'actual-1' }, body: JSON.stringify({ amount: 40, sourceRef: 'INV-1' }) });
  assert.equal(actual.status, 201);
  const accrual = await fetch(`${base}/api/v1/periods/r1/accruals`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'accrual-1' }, body: JSON.stringify({ amount: 20, sourceRef: 'GRN-1' }) });
  assert.equal(accrual.status, 201);
  assert.equal(persisted.commitment.referenceNo, 'COM-1');
  assert.equal(persisted.actual.periodId, 'r1');
  assert.equal(persisted.accrual.periodId, 'r1');
});

test('API server persists forecast and EVM snapshots through repositories', async (t) => {
  const persisted = {};
  const server = createApiServer({
    allowInsecureDevHeaders: true,
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1' }],
    periodStore: [{ id: 'r1', projectId: 'p1', status: 'OPEN' }],
    persistence: { forecast: { save: async (value) => { persisted.forecast = value; } }, evm: { save: async (value) => { persisted.evm = value; } } }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { 'x-organization-id': 'o1', 'x-project-id': 'p1', 'x-role': 'COST_ENGINEER', 'content-type': 'application/json' };
  const forecast = await fetch(`${base}/api/v1/periods/r1/forecast`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'forecast-1' }, body: JSON.stringify({ bac: 1000, actualCost: 600, etc: 500 }) });
  assert.equal(forecast.status, 200);
  const evm = await fetch(`${base}/api/v1/periods/r1/evm`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'evm-1' }, body: JSON.stringify({ bac: 1000, plannedProgress: 0.6, actualProgress: 0.5, actualCost: 600 }) });
  assert.equal(evm.status, 200);
  assert.equal(persisted.forecast.periodId, 'r1');
  assert.equal(persisted.evm.periodId, 'r1');
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

test('API server creates an accrual only in an open period', async (t) => {
  const accrualStore = [];
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }],
    periodStore: [{ id: 'r1', projectId: 'p1', status: 'OPEN' }],
    accrualStore
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/periods/r1/accruals`, { method: 'POST', headers: { authorization: 'Bearer verified-token', 'idempotency-key': 'accrual-1', 'content-type': 'application/json' }, body: JSON.stringify({ sourceRef: 'GRN-2', amount: 800 }) });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.status, 'DRAFT');
  assert.equal(accrualStore[0].periodId, 'r1');
});

test('API server calculates a forecast for an open period', async (t) => {
  const forecastStore = [];
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }],
    periodStore: [{ id: 'r1', projectId: 'p1', status: 'OPEN' }],
    forecastStore
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/periods/r1/forecast`, { method: 'POST', headers: { authorization: 'Bearer verified-token', 'idempotency-key': 'forecast-1', 'content-type': 'application/json' }, body: JSON.stringify({ bac: 1000, actualCost: 600, etc: 500 }) });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, { id: forecastStore[0].id, projectId: 'p1', periodId: 'r1', actualCost: 600, etc: 500, eac: 1100, vac: -100 });
});

test('API server calculates a scoped EVM snapshot', async (t) => {
  const evmStore = [];
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }],
    periodStore: [{ id: 'r1', projectId: 'p1', status: 'OPEN' }],
    evmStore
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/periods/r1/evm`, { method: 'POST', headers: { authorization: 'Bearer verified-token', 'idempotency-key': 'evm-1', 'content-type': 'application/json' }, body: JSON.stringify({ bac: 1000, plannedProgress: 0.6, actualProgress: 0.5, actualCost: 600 }) });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, { id: evmStore[0].id, projectId: 'p1', periodId: 'r1', pv: 600, ev: 500, ac: 600, cv: -100, sv: -100, cpi: 0.833333, spi: 0.833333 });
});

test('API server creates and incorporates a human-approved change', async (t) => {
  const changeStore = [];
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'manager-1', organizationId: 'o1', projectId: 'p1', role: 'PROJECT_MANAGER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }],
    changeStore
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { authorization: 'Bearer verified-token', 'idempotency-key': 'change-1', 'content-type': 'application/json' };
  const created = await fetch(`${base}/api/v1/projects/p1/changes`, { method: 'POST', headers, body: JSON.stringify({ number: 'VO-2', title: 'Reroute', type: 'DESIGN', estimatedCost: 1000, probability: 0.5 }) });
  assert.equal(created.status, 201);
  const changeId = (await created.json()).data.id;
  changeStore[0].status = 'APPROVED';
  changeStore[0].approvedCost = 900;
  const incorporated = await fetch(`${base}/api/v1/changes/${changeId}/incorporate`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'change-2' }, body: '{}' });
  assert.equal(incorporated.status, 200);
  assert.equal((await incorporated.json()).data.status, 'INCORPORATED');
});

test('API server returns a scoped cash flow variance summary', async (t) => {
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }]
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/projects/p1/cash-flow`, { method: 'POST', headers: { authorization: 'Bearer verified-token', 'content-type': 'application/json' }, body: JSON.stringify({ planned: [100, 50], actual: [120, 40], forecast: [120, 40, 80] }) });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data.variance, [20, -10]);
});

test('API server creates a risk and routes an agent finding to human review', async (t) => {
  const riskStore = [];
  const findingStore = [];
  const server = createApiServer({
    tokenVerifier: async () => ({ userId: 'manager-1', organizationId: 'o1', projectId: 'p1', role: 'COST_MANAGER' }),
    projectStore: [{ id: 'p1', organizationId: 'o1', code: 'P-1', name: 'Northstar' }],
    riskStore,
    findingStore
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { authorization: 'Bearer verified-token', 'idempotency-key': 'risk-1', 'content-type': 'application/json' };
  const risk = await fetch(`${base}/api/v1/projects/p1/risks`, { method: 'POST', headers, body: JSON.stringify({ title: 'Steel delay', category: 'SUPPLY', probability: 0.5, impact: 1000 }) });
  assert.equal(risk.status, 201);
  const finding = await fetch(`${base}/api/v1/projects/p1/agent-findings`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'finding-1' }, body: JSON.stringify({ title: 'Cost trend', statement: 'Civil package is trending above baseline', confidence: 0.88, evidence: [{ source: 'evm:r1', value: 'CPI 0.83' }] }) });
  assert.equal(finding.status, 201);
  const findingId = (await finding.json()).data.id;
  const reviewed = await fetch(`${base}/api/v1/agent-findings/${findingId}/review`, { method: 'POST', headers: { ...headers, 'idempotency-key': 'finding-review-1' }, body: JSON.stringify({ decision: 'ESCALATED', reason: 'Route to cost manager for action' }) });
  assert.equal(reviewed.status, 200);
  assert.equal((await reviewed.json()).data.status, 'ESCALATED');
});
