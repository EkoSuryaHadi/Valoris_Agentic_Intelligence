import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjectResponse } from '../src/projects.js';

test('returns a created project response for an authorized tenant request', () => {
  const result = createProjectResponse({ user: { organizationId: 'o1', role: 'ADMIN' }, existingProjects: [], body: { organizationId: 'o1', code: 'P-001', name: 'Plant', currency: 'USD' }, idempotencyKey: 'key-1' });
  assert.equal(result.status, 201);
  assert.equal(result.body.data.code, 'P-001');
  assert.equal(result.body.meta.idempotencyKey, 'key-1');
});

test('returns structured errors for missing idempotency and tenant mismatch', () => {
  const missing = createProjectResponse({ user: { organizationId: 'o1', role: 'ADMIN' }, existingProjects: [], body: { organizationId: 'o1', code: 'P-001', name: 'Plant', currency: 'USD' } });
  assert.equal(missing.status, 400);
  const mismatch = createProjectResponse({ user: { organizationId: 'o1', role: 'ADMIN' }, existingProjects: [], body: { organizationId: 'o2', code: 'P-001', name: 'Plant', currency: 'USD' }, idempotencyKey: 'key-1' });
  assert.equal(mismatch.status, 403);
});
