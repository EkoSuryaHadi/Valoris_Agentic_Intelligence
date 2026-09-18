import { createServer } from 'node:http';
import { createProjectResponse } from './projects.js';
import { authenticateRequest } from './auth.js';
import { createRateLimiter, parseJsonBody } from './http-hardening.js';
import { getRequestId } from './http-hardening.js';

export function createApiServer({ projectStore = [], wbsStore = [], baselineStore = [], tokenVerifier, allowInsecureDevHeaders = false, bodyLimitBytes = 1_048_576, rateLimiter = createRateLimiter(), logger = () => {} } = {}) {
  return createServer(async (request, response) => {
    const requestId = getRequestId(request);
    response.setHeader('x-request-id', requestId);
    response.setHeader('content-type', 'application/json');
    if (request.method === 'GET' && request.url === '/health') { response.writeHead(200); response.end(JSON.stringify({ status: 'ok' })); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status: 200 }); return; }
    if (request.method === 'GET') {
      try {
        const user = await authenticateRequest(request, { tokenVerifier, allowInsecureDevHeaders });
        const url = new URL(request.url, 'http://localhost');
        if (url.pathname === '/api/v1/projects') {
          const data = projectStore.filter((project) => project.organizationId === user.organizationId);
          response.writeHead(200); response.end(JSON.stringify({ data })); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status: 200 }); return;
        }
        const match = url.pathname.match(/^\/api\/v1\/projects\/([^/]+)\/(wbs|baselines)$/);
        if (match) {
          if (user.projectId !== match[1]) { response.writeHead(403); response.end(JSON.stringify({ error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } })); return; }
          const data = match[2] === 'wbs' ? wbsStore.filter((node) => node.projectId === match[1]) : baselineStore.filter((baseline) => baseline.projectId === match[1]);
          response.writeHead(200); response.end(JSON.stringify({ data })); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status: 200 }); return;
        }
      } catch {
        response.writeHead(401); response.end(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'valid bearer authentication is required' } })); return;
      }
    }
    if (request.method === 'POST' && request.url === '/api/v1/projects') {
      try {
        const rate = rateLimiter.check(request.socket.remoteAddress || 'unknown');
        if (!rate.allowed) { response.setHeader('retry-after', String(rate.retryAfterSec)); response.writeHead(429); response.end(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'too many requests' } })); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status: 429 }); return; }
        const parsed = await parseJsonBody(request, bodyLimitBytes);
        const user = await authenticateRequest(request, { tokenVerifier, allowInsecureDevHeaders });
        const result = createProjectResponse({ user, existingProjects: projectStore, body: parsed, idempotencyKey: request.headers['idempotency-key'] });
        response.writeHead(result.status); response.end(JSON.stringify(result.body)); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status: result.status });
      } catch (error) {
        const status = error.code === 'BODY_TOO_LARGE' ? 413 : error.code === 'INVALID_JSON' ? 400 : 401;
        const code = error.code || 'UNAUTHENTICATED';
        const message = status === 401 ? 'valid bearer authentication is required' : error.message;
        response.writeHead(status); response.end(JSON.stringify({ error: { code, message } })); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status });
      }
      return;
    }
    response.writeHead(404); response.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'route not found' } })); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status: 404 });
  });
}
