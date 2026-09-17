import test from 'node:test';
import assert from 'node:assert/strict';
import { createChange, calculateExposure, canIncorporateChange } from '../src/change.js';

test('creates a potential change and calculates weighted exposure', () => {
  const change = createChange({ projectId: 'p1', payload: { number: 'VO-017', title: 'Pipe reroute', type: 'DESIGN_CHANGE', estimatedCost: 100000, probability: 0.6 } });
  assert.equal(change.status, 'POTENTIAL');
  assert.equal(calculateExposure(change), 60000);
});

test('requires valid impact values and approved status for incorporation', () => {
  assert.throws(() => createChange({ projectId: 'p1', payload: { number: 'VO-1', title: 'Bad', type: 'OTHER', estimatedCost: -1, probability: 1 } }), /non-negative/i);
  assert.throws(() => createChange({ projectId: 'p1', payload: { number: 'VO-1', title: 'Bad', type: 'OTHER', estimatedCost: 1, probability: 2 } }), /probability/i);
  assert.equal(canIncorporateChange({ status: 'APPROVED', approvedCost: 500 }), true);
  assert.equal(canIncorporateChange({ status: 'PENDING', approvedCost: 500 }), false);
});
