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
