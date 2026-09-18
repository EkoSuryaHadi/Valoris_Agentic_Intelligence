import test from 'node:test';
import assert from 'node:assert/strict';
import { createSign, generateKeyPairSync } from 'node:crypto';
import { authenticateClaims, authenticateRequest, createJwksVerifier, requireProjectContext } from '../src/auth.js';

test('normalizes JWT claims into a VALORIS user context', () => {
  assert.deepEqual(authenticateClaims({ sub: 'u1', org_id: 'o1', project_id: 'p1', role: 'COST_ENGINEER' }), { userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' });
});

test('rejects incomplete claims and mismatched project context', () => {
  assert.throws(() => authenticateClaims({ sub: 'u1' }), /claims/i);
  assert.equal(requireProjectContext({ organizationId: 'o1', projectId: 'p1' }, { organizationId: 'o1', id: 'p1' }), true);
  assert.throws(() => requireProjectContext({ organizationId: 'o2', projectId: 'p1' }, { organizationId: 'o1', id: 'p1' }), /scope/i);
});

test('verifies an RS256 JWT against a cached JWKS and normalizes claims', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' });
  const header = { alg: 'RS256', typ: 'JWT', kid: 'test-key' };
  const claims = { sub: 'u1', org_id: 'o1', project_id: 'p1', role: 'COST_ENGINEER', iss: 'https://issuer.test/', aud: 'valoris-api', exp: Math.floor(Date.now() / 1000) + 300 };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const signingInput = `${encode(header)}.${encode(claims)}`;
  const signer = createSign('RSA-SHA256'); signer.update(signingInput); signer.end();
  const token = `${signingInput}.${signer.sign(privateKey).toString('base64url')}`;
  const verifier = createJwksVerifier({ jwksUrl: 'https://issuer.test/.well-known/jwks.json', issuer: 'https://issuer.test/', audience: 'valoris-api', fetcher: async () => ({ ok: true, json: async () => ({ keys: [{ ...jwk, kid: 'test-key', alg: 'RS256', use: 'sig' }] }) }) });
  assert.deepEqual(await verifier(token), { userId: 'u1', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' });
});

test('rejects expired or incorrectly issued JWTs', async () => {
  const verifier = createJwksVerifier({ jwksUrl: 'https://issuer.test/jwks', issuer: 'https://issuer.test/', audience: 'valoris-api', fetcher: async () => ({ ok: true, json: async () => ({ keys: [] }) }) });
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: 'u1', org_id: 'o1', project_id: 'p1', role: 'COST_ENGINEER', iss: 'https://evil.test/', aud: 'valoris-api', exp: Math.floor(Date.now() / 1000) - 1 })}.signature`;
  await assert.rejects(() => verifier(token), /issuer|expired|algorithm|signature/i);
});

test('requires bearer authentication unless insecure development headers are explicitly enabled', async () => {
  await assert.rejects(() => authenticateRequest({ headers: {} }, { tokenVerifier: async () => ({}) }), /bearer/i);
  assert.deepEqual(await authenticateRequest({ headers: { 'x-organization-id': 'o1', 'x-project-id': 'p1', 'x-role': 'COST_ENGINEER' } }, { allowInsecureDevHeaders: true }), { userId: 'dev-user', organizationId: 'o1', projectId: 'p1', role: 'COST_ENGINEER' });
});
