import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiServer } from '../src/server.js';
import { ProjectEventBus } from '../src/events.js';
import { createStructuredLogger } from '../src/middleware.js';

function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const req = http.request({
      hostname: '127.0.0.1',
      port: address.port,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          // not json
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json, text: data });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

test('GET /health/deep reports memory, uptime, database status, and store counts', async () => {
  const server = createApiServer();
  await new Promise((res) => server.listen(0, res));

  try {
    const res = await makeRequest(server, { method: 'GET', path: '/health/deep' });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.database, 'in_memory_ready');
    assert.ok(typeof res.body.uptimeSec === 'number');
    assert.ok(res.body.memory.rssMb >= 0);
    assert.ok(res.body.memory.heapTotalMb >= 0);
    assert.ok(typeof res.body.stores === 'object');
    assert.equal(res.body.stores.projectStore, 0);
  } finally {
    server.close();
  }
});

test('GET /health/deep returns 503 degraded when persistence query fails', async () => {
  const failingPersistence = {
    query: async () => {
      throw new Error('Neon connection timeout');
    }
  };
  const server = createApiServer({ persistence: failingPersistence });
  await new Promise((res) => server.listen(0, res));

  try {
    const res = await makeRequest(server, { method: 'GET', path: '/health/deep' });
    assert.equal(res.status, 503);
    assert.equal(res.body.status, 'degraded');
    assert.match(res.body.database, /unhealthy: Neon connection timeout/);
  } finally {
    server.close();
  }
});

test('structured logger captures request correlation, status, and durationMs', async () => {
  const logs = [];
  const captureStream = {
    write: (line) => {
      logs.push(JSON.parse(line.trim()));
    }
  };
  const structuredLogger = createStructuredLogger(captureStream);

  const testProject = { id: 'p-1', organizationId: 'org-1', name: 'Alpha' };
  const server = createApiServer({
    projectStore: [testProject],
    allowInsecureDevHeaders: true,
    logger: structuredLogger
  });
  await new Promise((res) => server.listen(0, res));

  try {
    const res = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/projects/p-1/cost-codes',
      headers: {
        'x-user-id': 'u-1',
        'x-organization-id': 'org-1',
        'x-project-id': 'p-1',
        'x-user-role': 'PROJECT_MANAGER'
      }
    });

    assert.equal(res.status, 200);
    assert.ok(logs.length > 0);
    const log = logs[logs.length - 1];
    assert.equal(log.event, 'http.request');
    assert.equal(log.method, 'GET');
    assert.equal(log.path, '/api/v1/projects/p-1/cost-codes');
    assert.equal(log.status, 200);
    assert.equal(log.level, 'info');
    assert.equal(log.organizationId, 'org-1');
    assert.equal(log.projectId, 'p-1');
    assert.ok(typeof log.durationMs === 'number');
    assert.ok(log.durationMs >= 0);
    assert.ok(log.timestamp);
  } finally {
    server.close();
  }
});

test('real-time SSE stream handles handshake, scope authorization, and mutation broadcasting', async () => {
  const eventBus = new ProjectEventBus();
  const testProject = { id: 'p-stream', organizationId: 'org-stream', name: 'Stream Test' };
  const costCode = { id: 'cc-stream', projectId: 'p-stream', code: '01-001' };

  const server = createApiServer({
    projectStore: [testProject],
    costCodeStore: [costCode],
    eventBus,
    allowInsecureDevHeaders: true
  });
  await new Promise((res) => server.listen(0, res));

  try {
    // 1. Unauthorized connection should fail with 401
    const unauthRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/projects/p-stream/events'
    });
    assert.equal(unauthRes.status, 401);

    // 2. Cross-project unauthorized scope should return 403
    const crossRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/projects/p-stream/events',
      headers: {
        'x-user-id': 'u-1',
        'x-organization-id': 'org-stream',
        'x-project-id': 'other-project',
        'x-user-role': 'COST_ENGINEER'
      }
    });
    assert.equal(crossRes.status, 403);

    // 3. Connect to SSE stream
    const port = server.address().port;
    const sseEvents = [];
    let sseResponseHeaders = null;

    const { req: sseReq, res: sseRes } = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        method: 'GET',
        path: '/api/v1/projects/p-stream/events',
        headers: {
          'x-user-id': 'u-1',
          'x-organization-id': 'org-stream',
          'x-project-id': 'p-stream',
          'x-user-role': 'PROJECT_MANAGER'
        }
      }, (res) => {
        sseResponseHeaders = res.headers;
        res.on('data', (chunk) => {
          sseEvents.push(chunk.toString());
        });
        resolve({ req, res });
      });
      req.on('error', reject);
      req.end();
    });

    // Wait 50ms for connected handshake
    await new Promise((r) => setTimeout(r, 50));
    assert.match(sseResponseHeaders['content-type'], /text\/event-stream/);
    assert.ok(sseEvents.some((e) => e.includes('event: connected') && e.includes('"status":"connected"')));

    // 4. Trigger mutation: create commitment
    const commitRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/projects/p-stream/commitments',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'commit-sse-1',
        'x-user-id': 'u-1',
        'x-organization-id': 'org-stream',
        'x-project-id': 'p-stream',
        'x-user-role': 'PROJECT_MANAGER'
      }
    }, {
      referenceNo: 'PO-SSE-001',
      costCodeId: 'cc-stream',
      vendor: 'Acme Steel Inc.',
      amount: 150000
    });
    assert.equal(commitRes.status, 201);

    // Wait 50ms for event broadcast delivery
    await new Promise((r) => setTimeout(r, 50));
    assert.ok(
      sseEvents.some((e) => e.includes('event: COMMITMENT_CREATED') && e.includes('150000')),
      'SSE client must receive COMMITMENT_CREATED broadcast'
    );

    // Clean up SSE connection
    sseRes.destroy();
    sseReq.destroy();
  } finally {
    server.closeAllConnections?.();
    server.close();
  }
});
