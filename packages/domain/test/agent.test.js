import test from 'node:test';
import assert from 'node:assert/strict';
import { createFinding, reviewFinding } from '../src/agent.js';

test('creates an evidence-linked agent finding', () => {
  const finding = createFinding({ projectId: 'p1', agentType: 'COST_MONITORING', payload: { title: 'CPI deterioration', statement: 'CPI fell below threshold', severity: 'HIGH', confidence: 0.91, evidence: [{ sourceRef: 'evm-period-3', metric: 'CPI', value: 0.79 }] } });
  assert.equal(finding.status, 'NEW');
  assert.equal(finding.confidence, 0.91);
  assert.equal(finding.evidence.length, 1);
});

test('requires human review and rejects agent disposition', () => {
  const finding = { id: 'f1', status: 'NEW' };
  assert.deepEqual(reviewFinding({ finding, actorType: 'USER', decision: 'ACCEPTED', reason: 'Verified with controller' }), { status: 'ACCEPTED', reviewedBy: 'USER', reason: 'Verified with controller' });
  assert.throws(() => reviewFinding({ finding, actorType: 'AGENT', decision: 'ACCEPTED', reason: 'auto' }), /human/i);
  assert.throws(() => createFinding({ projectId: 'p1', agentType: 'RISK', payload: { title: 'No evidence', statement: 'Unknown', severity: 'HIGH', confidence: 0.8, evidence: [] } }), /evidence/i);
});
