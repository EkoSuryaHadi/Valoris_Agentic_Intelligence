import { createPublicKey, createVerify } from 'node:crypto';

export function authenticateClaims(claims) {
  if (!claims?.sub || !claims.org_id || !claims.project_id || !claims.role) throw new Error('required JWT claims are missing');
  return { userId: claims.sub, organizationId: claims.org_id, projectId: claims.project_id, role: claims.role };
}

const decodeSegment = (segment) => JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));

export function createJwksVerifier({ jwksUrl, issuer, audience, fetcher = globalThis.fetch, cacheTtlMs = 300_000, clockSkewSec = 5 }) {
  if (!jwksUrl || !issuer || !audience || typeof fetcher !== 'function') throw new Error('JWKS verifier configuration is incomplete');
  let cached = null;
  return async function verifyAccessToken(token) {
    if (typeof token !== 'string' || token.split('.').length !== 3) throw new Error('invalid JWT');
    const [encodedHeader, encodedClaims, encodedSignature] = token.split('.');
    let header; let claims;
    try { header = decodeSegment(encodedHeader); claims = decodeSegment(encodedClaims); } catch { throw new Error('invalid JWT encoding'); }
    if (header.alg !== 'RS256' || !header.kid) throw new Error('unsupported JWT algorithm or key');
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== issuer) throw new Error('invalid JWT issuer');
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.includes(audience)) throw new Error('invalid JWT audience');
    if (!Number.isFinite(claims.exp) || claims.exp <= now - clockSkewSec) throw new Error('expired JWT');
    if (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now + clockSkewSec)) throw new Error('JWT not active');
    if (!cached || cached.expiresAt <= Date.now()) {
      const response = await fetcher(jwksUrl, { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error('JWKS endpoint unavailable');
      const payload = await response.json();
      if (!Array.isArray(payload?.keys)) throw new Error('invalid JWKS payload');
      cached = { keys: payload.keys, expiresAt: Date.now() + cacheTtlMs };
    }
    const key = cached.keys.find((candidate) => candidate.kid === header.kid && candidate.kty === 'RSA' && candidate.use !== 'enc');
    if (!key) throw new Error('signing key not found');
    const verifier = createVerify('RSA-SHA256'); verifier.update(`${encodedHeader}.${encodedClaims}`); verifier.end();
    let valid = false;
    try { valid = verifier.verify(createPublicKey({ key, format: 'jwk' }), Buffer.from(encodedSignature, 'base64url')); } catch { valid = false; }
    if (!valid) throw new Error('invalid JWT signature');
    return authenticateClaims(claims);
  };
}

export async function authenticateRequest(request, { tokenVerifier, allowInsecureDevHeaders = false } = {}) {
  const authorization = request.headers?.authorization;
  if (typeof authorization === 'string' && /^Bearer\s+\S+$/i.test(authorization)) {
    if (typeof tokenVerifier !== 'function') throw new Error('JWT verifier is not configured');
    return tokenVerifier(authorization.replace(/^Bearer\s+/i, ''));
  }
  if (allowInsecureDevHeaders) return authenticateClaims({ sub: 'dev-user', org_id: request.headers?.['x-organization-id'], project_id: request.headers?.['x-project-id'] || 'dev-project', role: request.headers?.['x-role'] });
  throw new Error('Bearer authorization is required');
}

export function requireProjectContext(user, project) {
  if (!user || !project || user.organizationId !== project.organizationId || user.projectId !== project.id) throw new Error('project scope denied');
  return true;
}
