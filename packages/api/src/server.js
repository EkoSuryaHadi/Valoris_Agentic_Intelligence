import { createServer } from 'node:http';
import { createRouter } from './router.js';
import { compose, createRateLimitMiddleware, createBodyParseMiddleware, createAuthMiddleware, sendError } from './middleware.js';
import { registerRoutes } from './routes.js';
import { createRateLimiter, getRequestId } from './http-hardening.js';
import { defaultProjectEventBus } from './events.js';

export function createApiServer({
  projectStore = [], wbsStore = [], baselineStore = [], costCodeStore = [],
  budgetLineStore = [], importStore = [], commitmentStore = [], actualStore = [],
  accrualStore = [], forecastStore = [], evmStore = [], changeStore = [],
  riskStore = [], findingStore = [], cashFlowStore = [], auditStore = [],
  periodStore = [], persistence = {}, tokenVerifier, allowInsecureDevHeaders = false,
  bodyLimitBytes = 1_048_576, rateLimiter = createRateLimiter(), logger = () => {},
  eventBus = defaultProjectEventBus
} = {}) {
  const router = createRouter();
  const stores = {
    projectStore, wbsStore, baselineStore, costCodeStore, budgetLineStore,
    importStore, commitmentStore, actualStore, accrualStore, forecastStore,
    evmStore, changeStore, riskStore, findingStore, cashFlowStore, auditStore, periodStore
  };

  registerRoutes(router, {
    stores,
    persistence,
    eventBus,
    auth: createAuthMiddleware({ tokenVerifier, allowInsecureDevHeaders }),
    rateLimit: createRateLimitMiddleware(rateLimiter),
    parseBody: createBodyParseMiddleware(bodyLimitBytes)
  });

  return createServer(async (request, response) => {
    const startTime = Date.now();
    const requestId = getRequestId(request);
    response.setHeader('x-request-id', requestId);
    response.setHeader('content-type', 'application/json');
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('referrer-policy', 'no-referrer');
    response.setHeader('cache-control', 'no-store');

    const url = new URL(request.url, 'http://localhost');
    const matched = router.match(request.method, url.pathname);
    const context = {
      request, response, requestId, logger, startTime, eventBus,
      params: matched.params,
      idempotencyKey: request.headers['idempotency-key']
    };

    if (!matched.handlers) {
      return sendError(context, { status: 404, code: 'NOT_FOUND', message: 'route not found' });
    }

    try {
      const runChain = compose(...matched.handlers.slice(0, -1));
      await runChain(context, matched.handlers[matched.handlers.length - 1]);
    } catch (error) {
      sendError(context, error);
    }
  });
}
