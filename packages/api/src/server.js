import { createServer } from 'node:http';
import { createProjectResponse } from './projects.js';

export function createApiServer({ projectStore = [] } = {}) {
  return createServer(async (request, response) => {
    response.setHeader('content-type', 'application/json');
    if (request.method === 'GET' && request.url === '/health') { response.writeHead(200); response.end(JSON.stringify({ status: 'ok' })); return; }
    if (request.method === 'POST' && request.url === '/api/v1/projects') {
      let body = ''; for await (const chunk of request) body += chunk;
      try {
        const parsed = JSON.parse(body || '{}');
        const user = { organizationId: request.headers['x-organization-id'], role: request.headers['x-role'] };
        const result = createProjectResponse({ user, existingProjects: projectStore, body: parsed, idempotencyKey: request.headers['idempotency-key'] });
        response.writeHead(result.status); response.end(JSON.stringify(result.body));
      } catch { response.writeHead(400); response.end(JSON.stringify({ error: { code: 'INVALID_JSON', message: 'request body must be valid JSON' } })); }
      return;
    }
    response.writeHead(404); response.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'route not found' } }));
  });
}
