import { createServer } from 'node:http';
import { createProjectResponse } from './projects.js';
import { createHierarchyResponse } from './hierarchy.js';
import { createBaselineResponse, createBudgetLineResponse } from './baseline.js';
import { authenticateRequest } from './auth.js';
import { createRateLimiter, parseJsonBody } from './http-hardening.js';
import { getRequestId } from './http-hardening.js';

export function createApiServer({ projectStore = [], wbsStore = [], baselineStore = [], costCodeStore = [], budgetLineStore = [], tokenVerifier, allowInsecureDevHeaders = false, bodyLimitBytes = 1_048_576, rateLimiter = createRateLimiter(), logger = () => {} } = {}) {
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
    const writeUrl = new URL(request.url, 'http://localhost');
    const wbsMatch = writeUrl.pathname.match(/^\/api\/v1\/projects\/([^/]+)\/wbs$/);
    const baselineMatch = writeUrl.pathname.match(/^\/api\/v1\/projects\/([^/]+)\/baselines$/);
    const lineMatch = writeUrl.pathname.match(/^\/api\/v1\/baselines\/([^/]+)\/lines$/);
    if (request.method === 'POST' && wbsMatch) {
      try {
        const rate = rateLimiter.check(request.socket.remoteAddress || 'unknown');
        if (!rate.allowed) { response.setHeader('retry-after', String(rate.retryAfterSec)); response.writeHead(429); response.end(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'too many requests' } })); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status: 429 }); return; }
        const parsed = await parseJsonBody(request, bodyLimitBytes);
        const user = await authenticateRequest(request, { tokenVerifier, allowInsecureDevHeaders });
        const project = projectStore.find((candidate) => candidate.id === wbsMatch[1]);
        const result = createHierarchyResponse({ user, project, existingNodes: wbsStore.filter((node) => node.projectId === wbsMatch[1]), body: parsed, idempotencyKey: request.headers['idempotency-key'] });
        if (result.status === 201) {
          result.body.data = { id: crypto.randomUUID(), ...result.body.data };
          wbsStore.push(result.body.data);
        }
        response.writeHead(result.status); response.end(JSON.stringify(result.body)); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status: result.status });
      } catch (error) {
        const status = error.code === 'BODY_TOO_LARGE' ? 413 : error.code === 'INVALID_JSON' ? 400 : 401;
        const code = error.code || 'UNAUTHENTICATED';
        const message = status === 401 ? 'valid bearer authentication is required' : error.message;
        response.writeHead(status); response.end(JSON.stringify({ error: { code, message } })); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status });
      }
      return;
    }
    if (request.method === 'POST' && lineMatch) {
      try {
        const rate = rateLimiter.check(request.socket.remoteAddress || 'unknown');
        if (!rate.allowed) { response.setHeader('retry-after', String(rate.retryAfterSec)); response.writeHead(429); response.end(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'too many requests' } })); return; }
        const parsed = await parseJsonBody(request, bodyLimitBytes);
        const user = await authenticateRequest(request, { tokenVerifier, allowInsecureDevHeaders });
        const baseline = baselineStore.find((candidate) => candidate.id === lineMatch[1]);
        const project = projectStore.find((candidate) => candidate.id === baseline?.projectId);
        const result = createBudgetLineResponse({ user, project, baseline, wbs: wbsStore.find((node) => node.id === parsed.wbsId), costCode: costCodeStore.find((code) => code.id === parsed.costCodeId), amount: parsed.amount, idempotencyKey: request.headers['idempotency-key'] });
        if (result.status === 201) { result.body.data = { id: crypto.randomUUID(), ...result.body.data }; budgetLineStore.push(result.body.data); }
        response.writeHead(result.status); response.end(JSON.stringify(result.body)); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status: result.status });
      } catch (error) {
        const status = error.code === 'BODY_TOO_LARGE' ? 413 : error.code === 'INVALID_JSON' ? 400 : 401;
        response.writeHead(status); response.end(JSON.stringify({ error: { code: error.code || 'UNAUTHENTICATED', message: status === 401 ? 'valid bearer authentication is required' : error.message } }));
      }
      return;
    }
    if (request.method === 'POST' && baselineMatch) {
      try {
        const rate = rateLimiter.check(request.socket.remoteAddress || 'unknown');
        if (!rate.allowed) { response.setHeader('retry-after', String(rate.retryAfterSec)); response.writeHead(429); response.end(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'too many requests' } })); return; }
        await parseJsonBody(request, bodyLimitBytes);
        const user = await authenticateRequest(request, { tokenVerifier, allowInsecureDevHeaders });
        const project = projectStore.find((candidate) => candidate.id === baselineMatch[1]);
        const result = createBaselineResponse({ user, project, existingBaselines: baselineStore.filter((baseline) => baseline.projectId === baselineMatch[1]), idempotencyKey: request.headers['idempotency-key'] });
        if (result.status === 201) { result.body.data = { id: crypto.randomUUID(), ...result.body.data }; baselineStore.push(result.body.data); }
        response.writeHead(result.status); response.end(JSON.stringify(result.body)); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status: result.status });
      } catch (error) {
        const status = error.code === 'BODY_TOO_LARGE' ? 413 : error.code === 'INVALID_JSON' ? 400 : 401;
        response.writeHead(status); response.end(JSON.stringify({ error: { code: error.code || 'UNAUTHENTICATED', message: status === 401 ? 'valid bearer authentication is required' : error.message } })); logger({ event: 'http.request', requestId, method: request.method, path: request.url, status });
      }
      return;
    }
    if (request.method === 'POST' && writeUrl.pathname === '/api/v1/projects') {
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
