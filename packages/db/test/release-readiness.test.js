import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('release migration covers Phase 12 through Phase 16 persistence tables', async () => {
  const migration = await readFile(new URL('../../../database/migrations/006_phase4_release_readiness.sql', import.meta.url), 'utf8');
  for (const table of ['evm_snapshots', 'changes', 'risks', 'agent_findings', 'cash_flow_snapshots']) assert.match(migration, new RegExp(`create table if not exists ${table}`, 'i'));
});

test('Phase 24 audit migration is idempotent and indexed for tenant review', async () => {
  const migration = await readFile(new URL('../../../database/migrations/007_phase24_audit_trail.sql', import.meta.url), 'utf8');
  assert.match(migration, /create table if not exists audit_events/i);
  assert.match(migration, /audit_organization_created/i);
});

test('demo seed contains an open period and release workflow records', async () => {
  const seed = await readFile(new URL('../../../database/seed.sql', import.meta.url), 'utf8');
  for (const marker of ['reporting_periods', 'commitments', 'actual_costs', 'accruals', 'forecasts', 'evm_snapshots', 'risks', 'agent_findings']) assert.match(seed, new RegExp(`insert into ${marker}`, 'i'));
});
