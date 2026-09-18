import test from 'node:test';
import assert from 'node:assert/strict';
import { selectActiveProject } from './project-context.js';

test('selects the runtime project only from the authorized project list', () => {
  const projects = [{ id: 'p1', name: 'Northstar' }, { id: 'p2', name: 'Harbor' }];
  assert.deepEqual(selectActiveProject(projects, 'p2'), { id: 'p2', name: 'Harbor' });
  assert.deepEqual(selectActiveProject(projects, 'unassigned'), { id: 'p1', name: 'Northstar' });
});

test('returns no active project when the tenant has no authorized projects', () => {
  assert.equal(selectActiveProject([], 'p1'), null);
});
