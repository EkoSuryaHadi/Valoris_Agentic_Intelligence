import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from '../src/router.js';

test('router matches exact paths', () => {
  const router = createRouter();
  const handler = () => ({ status: 200 });
  router.get('/health', handler);

  const matched = router.match('GET', '/health');
  assert.equal(matched.handlers[0], handler);
  assert.deepEqual(matched.params, {});

  const notMatched = router.match('GET', '/unknown');
  assert.equal(notMatched.handlers, null);
});

test('router extracts named path parameters', () => {
  const router = createRouter();
  const handler = () => ({ status: 200 });
  router.get('/api/v1/projects/:projectId/wbs', handler);

  const matched = router.match('GET', '/api/v1/projects/proj-123/wbs');
  assert.equal(matched.handlers[0], handler);
  assert.deepEqual(matched.params, { projectId: 'proj-123' });
});

test('router extracts multiple path parameters', () => {
  const router = createRouter();
  const handler = () => ({ status: 200 });
  router.post('/api/v1/projects/:projectId/periods/:periodId/actuals', handler);

  const matched = router.match('POST', '/api/v1/projects/p-1/periods/period-06/actuals');
  assert.equal(matched.handlers[0], handler);
  assert.deepEqual(matched.params, { projectId: 'p-1', periodId: 'period-06' });
});

test('router supports array of paths', () => {
  const router = createRouter();
  const handler = () => ({ status: 200 });
  router.get(['/health', '/api/health'], handler);

  const health1 = router.match('GET', '/health');
  const health2 = router.match('GET', '/api/health');
  assert.equal(health1.handlers[0], handler);
  assert.equal(health2.handlers[0], handler);
});

test('router detects method mismatch', () => {
  const router = createRouter();
  router.post('/api/v1/projects', () => {});

  const matched = router.match('GET', '/api/v1/projects');
  assert.equal(matched.handlers, null);
  assert.equal(matched.methodMismatch, true);
});
