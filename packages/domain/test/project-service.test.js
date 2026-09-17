import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject } from '../src/project-service.js';

test('creates a tenant-scoped project with normalized identity', () => {
  const project = createProject({ organizationId: 'org-1', existingProjects: [], payload: { code: ' acme-001 ', name: ' Plant ', currency: 'USD' } });
  assert.equal(project.organizationId, 'org-1');
  assert.equal(project.code, 'ACME-001');
  assert.equal(project.name, 'Plant');
  assert.equal(project.status, 'DRAFT');
});

test('rejects duplicate project codes within the same organization', () => {
  assert.throws(() => createProject({ organizationId: 'org-1', existingProjects: [{ organizationId: 'org-1', code: 'ACME-001' }], payload: { code: 'ACME-001', name: 'Other', currency: 'USD' } }), /already exists/i);
});
