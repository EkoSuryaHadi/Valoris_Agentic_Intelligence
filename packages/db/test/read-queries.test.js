import test from 'node:test';
import assert from 'node:assert/strict';
import { projectScopedReadQuery } from '../src/read-queries.js';

test('projectScopedReadQuery constructs parameterized query with pagination', () => {
  const result = projectScopedReadQuery('commitments', 'org-1', 'proj-100', { page: 2, limit: 20 });
  assert.match(result.dataQuery.text, /join projects on projects\.id = commitments\.project_id/);
  assert.match(result.dataQuery.text, /projects\.organization_id = \$1 and commitments\.project_id = \$2/);
  assert.match(result.dataQuery.text, /limit \$3 offset \$4/);
  assert.deepEqual(result.dataQuery.values, ['org-1', 'proj-100', 20, 20]);
  assert.deepEqual(result.countQuery.values, ['org-1', 'proj-100']);
  assert.equal(result.pagination.page, 2);
  assert.equal(result.pagination.limit, 20);
});

test('projectScopedReadQuery validates table names and required identifiers', () => {
  assert.throws(() => projectScopedReadQuery('malicious_table', 'org-1', 'proj-1'), /unsupported or unsafe/);
  assert.throws(() => projectScopedReadQuery('changes', '', 'proj-1'), /required/);
  assert.throws(() => projectScopedReadQuery('changes', 'org-1', ''), /required/);
});
