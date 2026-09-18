import test from 'node:test';
import assert from 'node:assert/strict';
import { cashSummaryResponse, createRiskResponse } from '../src/risk-cash.js';

test('returns a cash summary for the authorized project', () => {
  const result = cashSummaryResponse({ user: { organizationId: 'o1', projectId: 'p1' }, project: { id: 'p1', organizationId: 'o1' }, body: { planned: [100, 50], actual: [120, 40], forecast: [120, 40, 80] } });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.data.variance, [20, -10]);
  assert.deepEqual(result.body.data.cumulativeForecast, [120, 160, 240]);
});

test('creates a risk through a scoped API adapter', () => {
  const result = createRiskResponse({ user: { organizationId: 'o1', projectId: 'p1' }, project: { id: 'p1', organizationId: 'o1' }, body: { title: 'Vendor delay', category: 'VENDOR', probability: 0.5, impact: 300000 }, idempotencyKey: 'r-1' });
  assert.equal(result.status, 201);
  assert.equal(result.body.data.severity, 'HIGH');
});
