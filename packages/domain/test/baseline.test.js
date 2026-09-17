import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBaseline, validateHierarchyNode } from '../src/baseline.js';

test('calculates BAC from approved budget lines', () => {
  const result = calculateBaseline({
    status: 'APPROVED',
    lines: [{ amount: 600000 }, { amount: 400000 }],
  });
  assert.deepEqual(result, { bac: 1000000, lineCount: 2 });
});

test('rejects baseline calculation when no budget lines exist', () => {
  assert.throws(() => calculateBaseline({ status: 'DRAFT', lines: [] }), /budget line/i);
});

test('validates hierarchy node codes and parent ownership', () => {
  assert.equal(validateHierarchyNode({ code: '1.1', name: 'Mechanical', level: 2, parentProjectId: 'p1', projectId: 'p1' }), true);
  assert.throws(() => validateHierarchyNode({ code: '', name: 'Missing code', level: 1, projectId: 'p1' }), /code/i);
  assert.throws(() => validateHierarchyNode({ code: '1', name: 'Wrong parent', level: 2, parentProjectId: 'p2', projectId: 'p1' }), /project/i);
});
