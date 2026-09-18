import { createServer } from 'node:http';
import { createProjectResponse } from './projects.js';
import { authenticateRequest } from './auth.js';

export function createApiServer({ projectStore = [], tokenVerifier, allowInsecureDevHeaders = false } = {}) {
  return createServer(async (request, response) => {
    response.setHeader('content-type', 'application/json');
    if (request.method === 'GET' && request.url === '/health') { response.writeHead(200); response.end(JSON.stringify({ status: 'ok' })); return; }
    if (request.method === 'POST' && request.url === '/api/v1/projects') {
      let body = ''; for await (const chunk of request) body += chunk;
      try {
        const parsed = JSON.parse(body || '{}');
        const user = await authenticateRequest(request, { tokenVerifier, allowInsecureDevHeaders });
        const result = createProjectResponse({ user, existingProjects: projectStore, body: parsed, idempotencyKey: request.headers['idempotency-key'] });
        response.writeHead(result.status); response.end(JSON.stringify(result.body));
      } catch (error) {
        const isJsonError = error instanceof SyntaxError;
        response.writeHead(isJsonError ? 400 : 401);
        response.end(JSON.stringify({ error: { code: isJsonError ? 'INVALID_JSON' : 'UNAUTHENTICATED', message: isJsonError ? 'request body must be valid JSON' : 'valid bearer authentication is required' } }));
      }
      return;
    }
    response.writeHead(404); response.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'route not found' } }));
  });
}
