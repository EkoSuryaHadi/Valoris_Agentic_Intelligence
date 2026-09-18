import test from 'node:test';
import assert from 'node:assert/strict';
import { executiveSummaryResponse } from '../src/reporting.js';

test('returns a read-only executive summary for the project scope', () => {
  const result = executiveSummaryResponse({ user: { organizationId: 'o1', projectId: 'p1' }, project: { id: 'p1', organizationId: 'o1' }, body: { bac: 1000, approvedChanges: 50, commitments: 700, actualCost: 600, etc: 450, riskExposure: 120, cpi: 0.86, spi: 0.94 } });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.health, 'AT_RISK');
  assert.equal(result.body.data.eac, 1050);
});

test('blocks summary requests outside the tenant/project scope', () => {
  const result = executiveSummaryResponse({ user: { organizationId: 'o2', projectId: 'p1' }, project: { id: 'p1', organizationId: 'o1' }, body: {} });
  assert.equal(result.status, 403);
});
