import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExecutiveSummary } from '../src/reporting.js';

test('builds a reconciled executive summary and health status', () => {
  const summary = buildExecutiveSummary({ bac: 1000000, approvedChanges: 50000, commitments: 700000, actualCost: 600000, etc: 450000, riskExposure: 120000, cpi: 0.86, spi: 0.94 });
  assert.deepEqual(summary, { bac: 1000000, currentBudget: 1050000, commitments: 700000, actualCost: 600000, etc: 450000, eac: 1050000, vac: -50000, riskExposure: 120000, health: 'AT_RISK' });
});

test('rejects invalid report inputs', () => {
  assert.throws(() => buildExecutiveSummary({ bac: -1, approvedChanges: 0, commitments: 0, actualCost: 0, etc: 0, riskExposure: 0, cpi: 1, spi: 1 }), /non-negative/i);
});
