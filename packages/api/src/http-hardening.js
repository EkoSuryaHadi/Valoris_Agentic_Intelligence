import { randomUUID } from 'node:crypto';

export function createRateLimiter({ limit = 60, windowMs = 60_000, now = Date.now, store = new Map() } = {}) {
  const buckets = store;
  return {
    check(key) {
      const current = now();
      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= current) {
        buckets.set(key, { count: 1, resetAt: current + windowMs });
        return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSec: 0 };
      }
      bucket.count += 1;
      const allowed = bucket.count <= limit;
      return { allowed, remaining: Math.max(0, limit - bucket.count), retryAfterSec: Math.ceil((bucket.resetAt - current) / 1000) };
    }
  };
}

export function getRequestId(request) {
  const candidate = request.headers?.['x-request-id'];
  return typeof candidate === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(candidate) ? candidate : randomUUID();
}

export async function parseJsonBody(request, maxBytes = 1_048_576) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += Buffer.byteLength(chunk);
    if (size > maxBytes) { const error = new Error('request body too large'); error.code = 'BODY_TOO_LARGE'; throw error; }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))).toString('utf8') || '{}'); } catch {
    const error = new Error('request body must be valid JSON'); error.code = 'INVALID_JSON'; throw error;
  }
}
