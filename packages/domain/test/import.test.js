import test from 'node:test';
import assert from 'node:assert/strict';
import { validateImportRows } from '../src/import.js';

test('validates import rows and returns preview counts', () => {
  const result = validateImportRows({ projectId: 'p1', rows: [{ referenceNo: 'PO-1', amount: '1000', projectId: 'p1' }, { referenceNo: 'PO-2', amount: 'bad', projectId: 'p1' }] });
  assert.equal(result.valid.length, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /amount/i);
});

test('detects duplicate references and cross-project rows', () => {
  const result = validateImportRows({ projectId: 'p1', rows: [{ referenceNo: 'PO-1', amount: '1', projectId: 'p1' }, { referenceNo: 'PO-1', amount: '2', projectId: 'p1' }, { referenceNo: 'PO-3', amount: '3', projectId: 'p2' }] });
  assert.equal(result.valid.length, 1);
  assert.equal(result.errors.length, 2);
});
