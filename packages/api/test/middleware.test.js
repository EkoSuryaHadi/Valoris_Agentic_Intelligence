import test from 'node:test';
import assert from 'node:assert/strict';
import { compose, createRateLimitMiddleware, sendJson, sendError } from '../src/middleware.js';

test('compose executes middlewares in sequential order and calls final handler', async () => {
  const steps = [];
  const m1 = async (ctx, next) => {
    steps.push('m1_start');
    await next();
    steps.push('m1_end');
  };
  const m2 = async (ctx, next) => {
    steps.push('m2_start');
    await next();
    steps.push('m2_end');
  };
  const handler = async (ctx) => {
    steps.push('handler');
    ctx.done = true;
  };

  const runner = compose(m1, m2);
  const context = {};
  await runner(context, handler);

  assert.deepEqual(steps, ['m1_start', 'm2_start', 'handler', 'm2_end', 'm1_end']);
  assert.equal(context.done, true);
});

test('rate limit middleware blocks requests exceeding limit', async () => {
  let allowed = true;
  const fakeLimiter = {
    check: () => ({ allowed, retryAfterSec: 60 })
  };
  const middleware = createRateLimitMiddleware(fakeLimiter);
  const headers = {};
  const context = {
    request: { socket: { remoteAddress: '127.0.0.1' } },
    response: { setHeader: (k, v) => { headers[k] = v; } }
  };

  await middleware(context, () => Promise.resolve());

  allowed = false;
  await assert.rejects(
    () => middleware(context, () => Promise.resolve()),
    (err) => err.status === 429 && err.code === 'RATE_LIMITED'
  );
  assert.equal(headers['retry-after'], '60');
});

test('sendJson and sendError format responses and notify logger', () => {
  const written = {};
  let logged = null;
  const context = {
    requestId: 'req-1',
    request: { method: 'POST', url: '/test' },
    response: {
      writeHead: (status) => { written.status = status; },
      end: (data) => { written.data = data; }
    },
    logger: (event) => { logged = event; }
  };

  sendJson(context, 201, { data: { id: 1 } });
  assert.equal(written.status, 201);
  assert.deepEqual(JSON.parse(written.data), { data: { id: 1 } });
  assert.deepEqual(logged, { event: 'http.request', requestId: 'req-1', method: 'POST', path: '/test', status: 201 });

  sendError(context, { status: 403, code: 'FORBIDDEN', message: 'denied' });
  assert.equal(written.status, 403);
  assert.deepEqual(JSON.parse(written.data), { error: { code: 'FORBIDDEN', message: 'denied' } });
});
