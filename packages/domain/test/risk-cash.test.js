import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCashVariance, calculateCumulative, createRisk } from '../src/risk-cash.js';

test('calculates monthly cash variance and cumulative profile', () => {
  assert.equal(calculateCashVariance({ planned: 100, actual: 125 }), 25);
  assert.deepEqual(calculateCumulative([100, 50, 25]), [100, 150, 175]);
});

test('creates a risk with weighted exposure and severity', () => {
  const risk = createRisk({ projectId: 'p1', payload: { title: 'Productivity loss', probability: 0.8, impact: 250000, category: 'PRODUCTIVITY' } });
  assert.equal(risk.exposure, 200000);
  assert.equal(risk.severity, 'HIGH');
  assert.throws(() => createRisk({ projectId: 'p1', payload: { title: 'Bad', probability: 1.2, impact: 1, category: 'COST' } }), /probability/i);
});
