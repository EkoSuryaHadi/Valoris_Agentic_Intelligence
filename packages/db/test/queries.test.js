import test from 'node:test';
import assert from 'node:assert/strict';
import { projectListQuery, scopedTransactionQuery } from '../src/queries.js';

test('project query always scopes by organization', () => {
  const query = projectListQuery('org-1');
  assert.match(query.text, /organization_id = \$1/);
  assert.deepEqual(query.values, ['org-1']);
});

test('transaction query scopes by organization and project', () => {
  const query = scopedTransactionQuery('actual_costs', 'org-1', 'project-1');
  assert.match(query.text, /organization_id = \$1/);
  assert.match(query.text, /project_id = \$2/);
  assert.deepEqual(query.values, ['org-1', 'project-1']);
});

test('rejects unsafe table names', () => {
  assert.throws(() => scopedTransactionQuery('users; drop table projects', 'o1', 'p1'), /table/i);
});
