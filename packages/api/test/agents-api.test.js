import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from '../src/server.js';

function createServerInstance(t) {
  const projectStore = [{ id: 'p1', organizationId: 'org-1', name: 'Project 1' }];
  const baselineStore = [{ id: 'b1', projectId: 'p1', bac: 300000 }];
  const commitmentStore = [{ id: 'c1', projectId: 'p1', committedAmount: 100000 }];
  const actualStore = [{ id: 'a1', projectId: 'p1', amount: 350000 }];
  const evmStore = [{ id: 'e1', projectId: 'p1', cpi: 0.88, cv: -50000, bac: 300000, eac: 350000 }];
  const findingStore = [];

  const server = createApiServer({
    projectStore,
    baselineStore,
    commitmentStore,
    actualStore,
    evmStore,
    findingStore,
    allowInsecureDevHeaders: true
  });

  return { server, stores: { findingStore } };
}

test('Agent API executes rule agent and records findings', async (t) => {
  const { server, stores } = createServerInstance(t);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  const res = await fetch(`${base}/api/v1/projects/p1/agents/cost-monitor/run`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-organization-id': 'org-1',
      'x-project-id': 'p1',
      'x-role': 'PROJECT_CONTROLS'
    },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.agent, 'cost-monitor');
  assert.equal(json.data.findingsCount >= 1, true);
  assert.equal(stores.findingStore.length >= 1, true);
});

test('Agent API runs all rule agents', async (t) => {
  const { server } = createServerInstance(t);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  const res = await fetch(`${base}/api/v1/projects/p1/agents/all/run`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-organization-id': 'org-1',
      'x-project-id': 'p1',
      'x-role': 'PROJECT_CONTROLS'
    },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.agent, 'all');
  assert.equal(json.data.findingsCount >= 1, true);
});

test('Sumopod Advisor endpoint answers queries with ledger context', async (t) => {
  const { server } = createServerInstance(t);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  const res = await fetch(`${base}/api/v1/projects/p1/advisor`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-organization-id': 'org-1',
      'x-project-id': 'p1',
      'x-role': 'EXECUTIVE'
    },
    body: JSON.stringify({ question: 'Explain the current CPI performance' })
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data.answer);
  assert.ok(json.data.evidence);
});

test('Agent API rejects requests from mismatched project scope (403)', async (t) => {
  const { server } = createServerInstance(t);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  const res = await fetch(`${base}/api/v1/projects/p1/agents/cost-monitor/run`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-organization-id': 'org-1',
      'x-project-id': 'p-mismatch',
      'x-role': 'PROJECT_CONTROLS'
    },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 403);
  const json = await res.json();
  assert.equal(json.error.code, 'PROJECT_SCOPE_DENIED');
});
