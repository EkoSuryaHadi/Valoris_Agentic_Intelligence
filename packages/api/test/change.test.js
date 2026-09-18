import test from 'node:test';
import assert from 'node:assert/strict';
import { createChangeResponse, incorporateChangeResponse } from '../src/change.js';

test('creates a change response with weighted exposure', () => {
  const result = createChangeResponse({ user: { organizationId: 'o1', projectId: 'p1' }, project: { id: 'p1', organizationId: 'o1' }, body: { number: 'VO-1', title: 'Reroute', type: 'DESIGN', estimatedCost: 1000, probability: 0.5 }, idempotencyKey: 'c-1' });
  assert.equal(result.status, 201);
  assert.equal(result.body.data.exposure, 500);
});

test('allows incorporation only after human approval', () => {
  const denied = incorporateChangeResponse({ user: { organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }, project: { id: 'p1', organizationId: 'o1' }, change: { projectId: 'p1', status: 'PENDING', approvedCost: 100 }, idempotencyKey: 'c-2' });
  assert.equal(denied.status, 422);
  const ok = incorporateChangeResponse({ user: { organizationId: 'o1', projectId: 'p1', role: 'COST_MANAGER' }, project: { id: 'p1', organizationId: 'o1' }, change: { projectId: 'p1', status: 'APPROVED', approvedCost: 100 }, idempotencyKey: 'c-3' });
  assert.equal(ok.status, 200);
});
