import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRouter } from '../src/router.js';
import { registerRoutes } from '../src/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('OpenAPI contract specification matches registered API routes', () => {
  const openapiPath = join(__dirname, '../../../docs/api/openapi.yaml');
  const yamlContent = readFileSync(openapiPath, 'utf8');

  // Extract path lines from openapi.yaml
  const pathLines = yamlContent
    .split('\n')
    .filter((line) => line.startsWith('  /') && line.includes(':'));

  assert.ok(pathLines.length >= 20, 'OpenAPI should document at least 20 endpoints');

  // Build router
  const router = createRouter();
  const stores = {
    projectStore: [], wbsStore: [], baselineStore: [], costCodeStore: [],
    budgetLineStore: [], importStore: [], commitmentStore: [], actualStore: [],
    accrualStore: [], forecastStore: [], evmStore: [], changeStore: [],
    riskStore: [], findingStore: [], cashFlowStore: [], auditStore: [], periodStore: []
  };

  registerRoutes(router, {
    stores,
    persistence: {},
    auth: () => {},
    rateLimit: () => {},
    parseBody: () => {}
  });

  const registeredRoutes = router.routes().map((r) => r.path);

  for (const line of pathLines) {
    const rawPath = line.trim().split(':')[0]; // e.g. /projects/{projectId}/wbs
    // Convert /projects/{projectId}/... to /api/v1/projects/:projectId/...
    const normalizedParamPath = rawPath.replace(/\{([^}]+)\}/g, ':$1');
    const apiV1Path = `/api/v1${normalizedParamPath}`;

    // Check if router has this path or apiV1Path
    const isRegistered = registeredRoutes.some(
      (r) => r === rawPath || r === normalizedParamPath || r === apiV1Path || r === `/api${normalizedParamPath}`
    );

    assert.ok(
      isRegistered,
      `OpenAPI path "${rawPath}" (normalized: ${normalizedParamPath} or ${apiV1Path}) must be registered in API router`
    );
  }
});
