import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEvmResponse } from '../src/evm.js';

test('returns an EVM snapshot for an authorized open period', () => {
  const result = calculateEvmResponse({ user: { organizationId: 'o1', projectId: 'p1' }, project: { id: 'p1', organizationId: 'o1' }, period: { id: 'r1', projectId: 'p1', status: 'OPEN' }, body: { bac: 1000, plannedProgress: 0.6, actualProgress: 0.5, actualCost: 600 }, idempotencyKey: 'evm-1' });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.cv, -100);
  assert.equal(result.body.data.spi, 0.833333);
});

test('rejects invalid progress values', () => {
  const result = calculateEvmResponse({ user: { organizationId: 'o1', projectId: 'p1' }, project: { id: 'p1', organizationId: 'o1' }, period: { id: 'r1', projectId: 'p1', status: 'OPEN' }, body: { bac: 1000, plannedProgress: 1.2, actualProgress: 0.5, actualCost: 600 }, idempotencyKey: 'evm-1' });
  assert.equal(result.status, 422);
});
