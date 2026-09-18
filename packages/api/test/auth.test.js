import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticateClaims, requireProjectContext } from '../src/auth.js';

test('normalizes JWT claims into a VALORIS user context', () => {
  assert.deepEqual(authenticateClaims({ sub: 'u1', org_id: 'o1', project_id: 'p1', role: 'COST_ENGINEER' }), { userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' });
});

test('rejects incomplete claims and mismatched project context', () => {
  assert.throws(() => authenticateClaims({ sub: 'u1' }), /claims/i);
  assert.equal(requireProjectContext({ organizationId: 'o1', projectId: 'p1' }, { organizationId: 'o1', id: 'p1' }), true);
  assert.throws(() => requireProjectContext({ organizationId: 'o2', projectId: 'p1' }, { organizationId: 'o1', id: 'p1' }), /scope/i);
});
