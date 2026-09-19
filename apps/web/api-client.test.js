import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from './api-client.js';

test('API client sends bearer, request correlation, and idempotency headers', async () => {
  const calls = [];
  const client = createApiClient({ baseUrl: 'https://api.test/api/v1', tokenProvider: () => 'token-1', requestId: () => 'req-1', fetcher: async (url, options) => { calls.push({ url, options }); return { ok: true, status: 201, json: async () => ({ data: { id: 'w1' } }) }; } });
  const result = await client.createWbsNode('p1', { code: '01', name: 'Site', level: 1 }, 'idem-1');
  assert.deepEqual(result, { id: 'w1' });
  assert.equal(calls[0].url, 'https://api.test/api/v1/projects/p1/wbs');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token-1');
  assert.equal(calls[0].options.headers['X-Request-Id'], 'req-1');
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'idem-1');
});

test('API client returns the backend error contract', async () => {
  const client = createApiClient({ baseUrl: '/api/v1', tokenProvider: () => 'token', fetcher: async () => ({ ok: false, status: 403, json: async () => ({ error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } }) }) });
  await assert.rejects(() => client.getBaselines('p1'), (error) => error.status === 403 && error.code === 'PROJECT_SCOPE_DENIED');
});

test('API client exposes commitment and actual cost writes', async () => {
  const calls = [];
  const client = createApiClient({ baseUrl: '/api/v1', fetcher: async (url, options) => { calls.push({ url, options }); return { ok: true, status: 201, json: async () => ({ data: { id: 'tx-1' } }) }; } });
  await client.createCommitment('p1', { referenceNo: 'PO-2', vendor: 'Steel Co', amount: 2500 }, 'commitment-1');
  await client.postActualCost('r1', { sourceRef: 'INV-2', amount: 1200 }, 'actual-1');
  await client.createAccrual('r1', { sourceRef: 'GRN-2', amount: 800 }, 'accrual-1');
  await client.calculateForecast('r1', { bac: 1000, actualCost: 600, etc: 500 }, 'forecast-1');
  await client.calculateEvm('r1', { bac: 1000, plannedProgress: 0.6, actualProgress: 0.5, actualCost: 600 }, 'evm-1');
  await client.createChange('p1', { number: 'VO-2', title: 'Reroute', type: 'DESIGN', estimatedCost: 1000, probability: 0.5 }, 'change-1');
  await client.getCashFlow('p1', { planned: [100], actual: [120], forecast: [120, 50] });
  assert.equal(calls[0].url, '/api/v1/projects/p1/commitments');
  assert.equal(calls[1].url, '/api/v1/periods/r1/actual-costs');
  assert.equal(calls[1].options.headers['Idempotency-Key'], 'actual-1');
  assert.equal(calls[2].url, '/api/v1/periods/r1/accruals');
  assert.equal(calls[3].url, '/api/v1/periods/r1/forecast');
  assert.equal(calls[4].url, '/api/v1/periods/r1/evm');
  assert.equal(calls[5].url, '/api/v1/projects/p1/changes');
  assert.equal(calls[6].url, '/api/v1/projects/p1/cash-flow');
});
