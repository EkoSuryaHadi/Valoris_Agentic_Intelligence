import { createApiServer } from '../packages/api/src/server.js';
import { createJwksVerifier } from '../packages/api/src/auth.js';

function createTokenVerifierFromEnvironment() {
  const { AUTH_JWKS_URL, AUTH_ISSUER_URL, AUTH_AUDIENCE } = process.env;
  if (!AUTH_JWKS_URL || !AUTH_ISSUER_URL || !AUTH_AUDIENCE) return undefined;
  return createJwksVerifier({ jwksUrl: AUTH_JWKS_URL, issuer: AUTH_ISSUER_URL, audience: AUTH_AUDIENCE });
}

export function createVercelHandler({ tokenVerifier = createTokenVerifierFromEnvironment(), allowInsecureDevHeaders = false } = {}) {
  const server = createApiServer({ tokenVerifier, allowInsecureDevHeaders });
  return (request, response) => server.emit('request', request, response);
}

const handler = createVercelHandler();
export default handler;
