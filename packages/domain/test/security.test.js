import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeProjectAction } from '../src/security.js';

test('authorizes only tenant members with required capabilities', () => {
  assert.equal(authorizeProjectAction({ user: { organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }, project: { organizationId: 'o1', id: 'p1' }, action: 'EDIT_FORECAST' }), true);
  assert.equal(authorizeProjectAction({ user: { organizationId: 'o1', projectId: 'p1', role: 'VIEWER' }, project: { organizationId: 'o1', id: 'p1' }, action: 'EDIT_FORECAST' }), false);
  assert.equal(authorizeProjectAction({ user: { organizationId: 'o2', projectId: 'p1', role: 'COST_MANAGER' }, project: { organizationId: 'o1', id: 'p1' }, action: 'APPROVE_BASELINE' }), false);
});

test('prevents agent and engineer from approval or locking actions', () => {
  assert.equal(authorizeProjectAction({ user: { organizationId: 'o1', projectId: 'p1', role: 'AGENT' }, project: { organizationId: 'o1', id: 'p1' }, action: 'APPROVE_BASELINE' }), false);
  assert.equal(authorizeProjectAction({ user: { organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' }, project: { organizationId: 'o1', id: 'p1' }, action: 'LOCK_PERIOD' }), false);
});
