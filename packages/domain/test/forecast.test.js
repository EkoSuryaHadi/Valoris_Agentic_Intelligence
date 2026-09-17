import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateForecast } from '../src/forecast.js';

test('calculates EAC and VAC from actual and ETC', () => {
  assert.deepEqual(calculateForecast({ bac: 1000000, actualCost: 420000, etc: 650000 }), { actualCost: 420000, etc: 650000, eac: 1070000, vac: -70000 });
});

test('rejects forecast values that are negative or exceed locked period rules', () => {
  assert.throws(() => calculateForecast({ bac: 100, actualCost: -1, etc: 10 }), /non-negative/i);
  assert.throws(() => calculateForecast({ bac: 100, actualCost: 10, etc: 10, periodStatus: 'LOCKED' }), /locked/i);
});
