import test from 'node:test';
import assert from 'node:assert/strict';
import { createFindingResponse, reviewFindingResponse, validateImportResponse } from '../src/agent-import.js';

test('creates and reviews an evidence-linked finding', () => {
  const input = { user: { organizationId: 'o1', projectId: 'p1', role: 'COST_MANAGER' }, project: { id: 'p1', organizationId: 'o1' }, body: { title: 'Overrun risk', statement: 'CPI declined', severity: 'HIGH', confidence: 0.9, evidence: [{ sourceRef: 'evm-1' }] }, idempotencyKey: 'a-1' };
  const created = createFindingResponse(input);
  assert.equal(created.status, 201);
  const reviewed = reviewFindingResponse({ ...input, finding: { ...created.body.data, status: 'NEW' }, body: { decision: 'ACCEPTED', reason: 'Verified' }, idempotencyKey: 'a-2' });
  assert.equal(reviewed.status, 200);
});

test('returns import preview errors without committing invalid rows', () => {
  const result = validateImportResponse({ user: { organizationId: 'o1', projectId: 'p1' }, project: { id: 'p1', organizationId: 'o1' }, body: { rows: [{ referenceNo: 'PO-1', amount: '10', projectId: 'p1' }, { referenceNo: 'PO-1', amount: 'bad', projectId: 'p1' }] } });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.valid.length, 1);
  assert.equal(result.body.data.errors.length, 1);
});
