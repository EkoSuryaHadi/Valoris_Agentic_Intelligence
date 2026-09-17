import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProject } from '../src/project.js';

test('accepts a valid project setup payload', () => {
  assert.deepEqual(validateProject({ code: 'ACME-001', name: 'Process Plant', currency: 'USD', startDate: '2026-01-01', endDate: '2027-01-01' }), { code: 'ACME-001', name: 'Process Plant', currency: 'USD' });
});

test('rejects invalid project identity and date range', () => {
  assert.throws(() => validateProject({ code: '', name: 'Plant', currency: 'USD' }), /code/i);
  assert.throws(() => validateProject({ code: 'P1', name: 'Plant', currency: 'US' }), /currency/i);
  assert.throws(() => validateProject({ code: 'P1', name: 'Plant', currency: 'USD', startDate: '2027-01-01', endDate: '2026-01-01' }), /date/i);
});
