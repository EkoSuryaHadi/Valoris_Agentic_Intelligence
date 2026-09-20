import { authenticateRequest } from './auth.js';
import { parseJsonBody } from './http-hardening.js';

export function compose(...middlewares) {
  return function run(context, finalHandler) {
    let index = -1;
    function dispatch(i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'));
      index = i;
      const fn = i === middlewares.length ? finalHandler : middlewares[i];
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(context, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0);
  };
}

export function createRateLimitMiddleware(rateLimiter) {
  return async (context, next) => {
    const remote = context.request.socket?.remoteAddress || 'unknown';
    const rate = rateLimiter.check(remote);
    if (!rate.allowed) {
      context.response.setHeader('retry-after', String(rate.retryAfterSec));
      const error = new Error('too many requests');
      error.code = 'RATE_LIMITED';
      error.status = 429;
      throw error;
    }
    return next();
  };
}

export function createBodyParseMiddleware(bodyLimitBytes) {
  return async (context, next) => {
    try {
      context.body = await parseJsonBody(context.request, bodyLimitBytes);
    } catch (err) {
      if (err.code === 'BODY_TOO_LARGE') err.status = 413;
      else if (err.code === 'INVALID_JSON') err.status = 400;
      throw err;
    }
    return next();
  };
}

export function createAuthMiddleware({ tokenVerifier, allowInsecureDevHeaders }) {
  return async (context, next) => {
    try {
      context.user = await authenticateRequest(context.request, { tokenVerifier, allowInsecureDevHeaders });
    } catch {
      const error = new Error('valid bearer authentication is required');
      error.code = 'UNAUTHENTICATED';
      error.status = 401;
      throw error;
    }
    return next();
  };
}

export function sendJson(context, status, body) {
  context.response.setHeader?.('content-type', 'application/json');
  context.response.writeHead(status);
  context.response.end(JSON.stringify(body));
  if (context.logger) {
    const logEvent = {
      event: 'http.request',
      requestId: context.requestId,
      method: context.request.method,
      path: context.request.url,
      status
    };
    if (context.startTime) {
      logEvent.durationMs = Math.max(0, Date.now() - context.startTime);
    }
    if (context.user?.organizationId) {
      logEvent.organizationId = context.user.organizationId;
    }
    if (context.params?.projectId) {
      logEvent.projectId = context.params.projectId;
    }
    context.logger(logEvent);
  }
}

export function sendError(context, error) {
  const status = error.status || (error.code === 'BODY_TOO_LARGE' ? 413 : error.code === 'INVALID_JSON' ? 400 : 401);
  const code = error.code || 'UNAUTHENTICATED';
  const message = status === 401 ? 'valid bearer authentication is required' : error.message;
  sendJson(context, status, { error: { code, message } });
}

export function createStructuredLogger(outputStream = process.stdout) {
  return (entry) => {
    const payload = {
      timestamp: new Date().toISOString(),
      level: entry.status >= 500 ? 'error' : entry.status >= 400 ? 'warn' : 'info',
      ...entry
    };
    const line = JSON.stringify(payload) + '\n';
    if (typeof outputStream?.write === 'function') {
      outputStream.write(line);
    }
    return payload;
  };
}
