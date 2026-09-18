import { createServer } from 'node:http';
import { createProjectResponse } from './projects.js';
import { authenticateRequest } from './auth.js';
import { createRateLimiter, parseJsonBody } from './http-hardening.js';

export function createApiServer({ projectStore = [], tokenVerifier, allowInsecureDevHeaders = false, bodyLimitBytes = 1_048_576, rateLimiter = createRateLimiter() } = {}) {
  return createServer(async (request, response) => {
    response.setHeader('content-type', 'application/json');
    if (request.method === 'GET' && request.url === '/health') { response.writeHead(200); response.end(JSON.stringify({ status: 'ok' })); return; }
    if (request.method === 'POST' && request.url === '/api/v1/projects') {
      try {
        const rate = rateLimiter.check(request.socket.remoteAddress || 'unknown');
        if (!rate.allowed) { response.setHeader('retry-after', String(rate.retryAfterSec)); response.writeHead(429); response.end(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'too many requests' } })); return; }
        const parsed = await parseJsonBody(request, bodyLimitBytes);
        const user = await authenticateRequest(request, { tokenVerifier, allowInsecureDevHeaders });
        const result = createProjectResponse({ user, existingProjects: projectStore, body: parsed, idempotencyKey: request.headers['idempotency-key'] });
        response.writeHead(result.status); response.end(JSON.stringify(result.body));
      } catch (error) {
        const status = error.code === 'BODY_TOO_LARGE' ? 413 : error.code === 'INVALID_JSON' ? 400 : 401;
        const code = error.code || 'UNAUTHENTICATED';
        const message = status === 401 ? 'valid bearer authentication is required' : error.message;
        response.writeHead(status); response.end(JSON.stringify({ error: { code, message } }));
      }
      return;
    }
    response.writeHead(404); response.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'route not found' } }));
  });
}
