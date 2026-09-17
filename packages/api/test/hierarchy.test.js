import test from 'node:test';
import assert from 'node:assert/strict';
import { createHierarchyResponse } from '../src/hierarchy.js';

test('creates a WBS/CBS node for the authorized project', () => {
  const result = createHierarchyResponse({ user: { organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }, project: { id: 'p1', organizationId: 'o1' }, existingNodes: [], body: { code: '1', name: 'Engineering', level: 1 }, idempotencyKey: 'h-1' });
  assert.equal(result.status, 201);
  assert.equal(result.body.data.code, '1');
});

test('rejects unauthorized hierarchy mutation with structured error', () => {
  const result = createHierarchyResponse({ user: { organizationId: 'o2', projectId: 'p1', role: 'COST_ENGINEER' }, project: { id: 'p1', organizationId: 'o1' }, existingNodes: [], body: { code: '1', name: 'Engineering', level: 1 }, idempotencyKey: 'h-1' });
  assert.equal(result.status, 403);
  assert.equal(result.body.error.code, 'PROJECT_SCOPE_DENIED');
});
