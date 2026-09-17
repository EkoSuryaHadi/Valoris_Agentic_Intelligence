import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBaselineResponse, transitionBaselineResponse } from '../src/baseline.js';

test('returns BAC for a tenant-scoped baseline calculation', () => {
  const result = calculateBaselineResponse({ user: { organizationId: 'o1', projectId: 'p1' }, project: { id: 'p1', organizationId: 'o1' }, baseline: { id: 'b1', projectId: 'p1', status: 'DRAFT' }, lines: [{ amount: 600 }, { amount: 400 }], idempotencyKey: 'b-1' });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.bac, 1000);
});

test('requires a cost manager to approve and lock a baseline', () => {
  const denied = transitionBaselineResponse({ user: { organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }, project: { id: 'p1', organizationId: 'o1' }, baseline: { id: 'b1', projectId: 'p1', status: 'SUBMITTED' }, nextStatus: 'APPROVED', idempotencyKey: 'b-2' });
  assert.equal(denied.status, 403);
  const approved = transitionBaselineResponse({ user: { organizationId: 'o1', projectId: 'p1', role: 'COST_MANAGER' }, project: { id: 'p1', organizationId: 'o1' }, baseline: { id: 'b1', projectId: 'p1', status: 'SUBMITTED' }, nextStatus: 'APPROVED', idempotencyKey: 'b-3' });
  assert.equal(approved.status, 200);
});
