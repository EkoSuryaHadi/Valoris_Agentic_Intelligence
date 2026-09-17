import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEvm } from '../src/formulas.js';

test('calculates EVM metrics from BAC, progress, and actual cost', () => {
  const result = calculateEvm({ bac: 1000, plannedProgress: 0.6, actualProgress: 0.5, actualCost: 600 });
  assert.deepEqual(result, { pv: 600, ev: 500, ac: 600, cv: -100, sv: -100, cpi: 0.833333, spi: 0.833333 });
});

test('returns null efficiency ratios when their denominators are zero', () => {
  const result = calculateEvm({ bac: 1000, plannedProgress: 0, actualProgress: 0, actualCost: 0 });
  assert.equal(result.cpi, null);
  assert.equal(result.spi, null);
});
