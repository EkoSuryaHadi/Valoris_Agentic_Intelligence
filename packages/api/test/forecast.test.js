import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateForecastResponse } from '../src/forecast.js';

test('calculates forecast through a scoped API adapter', () => {
  const result = calculateForecastResponse({ user: { organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }, project: { id: 'p1', organizationId: 'o1' }, period: { id: 'r1', projectId: 'p1', status: 'OPEN' }, body: { bac: 1000, actualCost: 600, etc: 500 }, idempotencyKey: 'f-1' });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.eac, 1100);
  assert.equal(result.body.data.vac, -100);
});

test('rejects forecast mutation in a locked period', () => {
  const result = calculateForecastResponse({ user: { organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }, project: { id: 'p1', organizationId: 'o1' }, period: { id: 'r1', projectId: 'p1', status: 'LOCKED' }, body: { bac: 1000, actualCost: 600, etc: 500 }, idempotencyKey: 'f-1' });
  assert.equal(result.status, 422);
});
