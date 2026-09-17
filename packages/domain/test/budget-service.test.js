import test from 'node:test';
import assert from 'node:assert/strict';
import { createCostCode, allocateBudgetLine } from '../src/budget-service.js';

test('creates a normalized cost code within a project', () => {
  assert.deepEqual(createCostCode({ projectId: 'p1', existingCodes: [], payload: { code: ' labor ', name: 'Direct Labor' } }), { projectId: 'p1', code: 'LABOR', name: 'Direct Labor' });
  assert.throws(() => createCostCode({ projectId: 'p1', existingCodes: [{ projectId: 'p1', code: 'LABOR' }], payload: { code: 'LABOR', name: 'Duplicate' } }), /already exists/i);
});

test('allocates a budget line only to approved-project references', () => {
  const line = allocateBudgetLine({ baseline: { id: 'b1', projectId: 'p1', status: 'DRAFT' }, wbs: { id: 'w1', projectId: 'p1' }, costCode: { id: 'c1', projectId: 'p1' }, amount: 1250.5 });
  assert.deepEqual(line, { baselineId: 'b1', wbsId: 'w1', costCodeId: 'c1', amount: 1250.5 });
  assert.throws(() => allocateBudgetLine({ baseline: { id: 'b1', projectId: 'p1', status: 'LOCKED' }, wbs: { id: 'w1', projectId: 'p1' }, costCode: { id: 'c1', projectId: 'p1' }, amount: 1 }), /locked/i);
  assert.throws(() => allocateBudgetLine({ baseline: { id: 'b1', projectId: 'p1', status: 'DRAFT' }, wbs: { id: 'w1', projectId: 'p2' }, costCode: { id: 'c1', projectId: 'p1' }, amount: 1 }), /project/i);
});
