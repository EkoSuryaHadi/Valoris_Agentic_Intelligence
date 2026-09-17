import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommitmentResponse, postActualResponse, createAccrualResponse } from '../src/transactions.js';

test('creates a commitment through the tenant-scoped API adapter', () => {
  const result = createCommitmentResponse({ user: { organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }, project: { id: 'p1', organizationId: 'o1' }, existing: [], body: { referenceNo: 'PO-1', vendor: 'Steel Co', amount: 1000 }, idempotencyKey: 't-1' });
  assert.equal(result.status, 201);
  assert.equal(result.body.data.status, 'OPEN');
});

test('posts actuals and accruals only to open periods', () => {
  const args = { user: { organizationId: 'o1', projectId: 'p1', role: 'FINANCE' }, project: { id: 'p1', organizationId: 'o1' }, period: { id: 'r1', projectId: 'p1', status: 'OPEN' }, body: { amount: 200, sourceRef: 'INV-1' }, idempotencyKey: 't-2' };
  assert.equal(postActualResponse(args).status, 201);
  assert.equal(createAccrualResponse(args).status, 201);
  assert.equal(postActualResponse({ ...args, period: { ...args.period, status: 'LOCKED' } }).status, 422);
});
