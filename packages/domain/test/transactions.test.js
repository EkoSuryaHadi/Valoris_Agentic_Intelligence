import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommitment, postActualCost, createAccrual } from '../src/transactions.js';

test('creates a commitment with project-scoped reference', () => {
  const result = createCommitment({ projectId: 'p1', existing: [], payload: { referenceNo: 'PO-001', vendor: 'Steel Co', amount: 250000, wbsId: 'w1', costCodeId: 'c1' }, wbs: { id: 'w1', projectId: 'p1' }, costCode: { id: 'c1', projectId: 'p1' } });
  assert.deepEqual(result, { projectId: 'p1', referenceNo: 'PO-001', vendor: 'Steel Co', amount: 250000, wbsId: 'w1', costCodeId: 'c1', status: 'OPEN' });
  assert.throws(() => createCommitment({ projectId: 'p1', existing: [{ projectId: 'p1', referenceNo: 'PO-001' }], payload: { referenceNo: 'PO-001', vendor: 'Other', amount: 1 } }), /already exists/i);
});

test('posts actual cost only into open periods with valid project references', () => {
  const result = postActualCost({ projectId: 'p1', period: { id: 'period-1', projectId: 'p1', status: 'OPEN' }, payload: { amount: 5000, sourceRef: 'INV-1', wbsId: 'w1', costCodeId: 'c1' }, wbs: { projectId: 'p1' }, costCode: { projectId: 'p1' } });
  assert.equal(result.amount, 5000);
  assert.throws(() => postActualCost({ projectId: 'p1', period: { id: 'period-1', projectId: 'p1', status: 'LOCKED' }, payload: { amount: 1, sourceRef: 'x' } }), /locked/i);
});

test('creates accruals with source traceability and period protection', () => {
  const result = createAccrual({ projectId: 'p1', period: { id: 'period-1', projectId: 'p1', status: 'OPEN' }, amount: 12000, sourceRef: 'ACCRUAL-MAR' });
  assert.deepEqual(result, { projectId: 'p1', periodId: 'period-1', amount: 12000, sourceRef: 'ACCRUAL-MAR', status: 'DRAFT' });
  assert.throws(() => createAccrual({ projectId: 'p1', period: { id: 'period-1', projectId: 'p1', status: 'CLOSED' }, amount: 1, sourceRef: 'x' }), /closed/i);
});
